import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";

describe("Module 3: Events Management Tests", () => {
  let app: FastifyInstance;

  let studentToken: string;
  let clubLeaderToken: string;
  let otherLeaderToken: string;
  let adminToken: string;

  let clubLeaderId: string;
  let otherLeaderId: string;
  let createdEventId: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // Create test users directly in DB
    const leaderUser = await app.prisma.user.upsert({
      where: { email: "ch_event_lead@university.edu" },
      update: {},
      create: {
        email: "ch_event_lead@university.edu",
        name: "Club Leader User",
        password: "argon2id_dummy_hash",
        role: "CLUB_LEADER",
      },
    });
    clubLeaderId = leaderUser.id;

    const otherLeaderUser = await app.prisma.user.upsert({
      where: { email: "ch_other_lead@university.edu" },
      update: {},
      create: {
        email: "ch_other_lead@university.edu",
        name: "Other Leader User",
        password: "argon2id_dummy_hash",
        role: "CLUB_LEADER",
      },
    });
    otherLeaderId = otherLeaderUser.id;

    const studentUser = await app.prisma.user.upsert({
      where: { email: "ch_event_student@university.edu" },
      update: {},
      create: {
        email: "ch_event_student@university.edu",
        name: "Regular Student User",
        password: "argon2id_dummy_hash",
        role: "STUDENT",
      },
    });

    const adminUser = await app.prisma.user.upsert({
      where: { email: "ch_event_admin@university.edu" },
      update: {},
      create: {
        email: "ch_event_admin@university.edu",
        name: "Campus Admin",
        password: "argon2id_dummy_hash",
        role: "ADMIN",
      },
    });

    // Sign JWT tokens
    clubLeaderToken = app.jwt.sign({ sub: leaderUser.id, email: leaderUser.email, role: "CLUB_LEADER" });
    otherLeaderToken = app.jwt.sign({ sub: otherLeaderUser.id, email: otherLeaderUser.email, role: "CLUB_LEADER" });
    studentToken = app.jwt.sign({ sub: studentUser.id, email: studentUser.email, role: "STUDENT" });
    adminToken = app.jwt.sign({ sub: adminUser.id, email: adminUser.email, role: "ADMIN" });
  }, 20000);

  afterAll(async () => {
    if (app?.prisma) {
      await app.prisma.event.deleteMany({
        where: { organizerId: { in: [clubLeaderId, otherLeaderId] } },
      });
      await app.prisma.user.deleteMany({
        where: {
          email: {
            in: [
              "ch_event_lead@university.edu",
              "ch_other_lead@university.edu",
              "ch_event_student@university.edu",
              "ch_event_admin@university.edu",
            ],
          },
        },
      });
      await app.close();
    }
  });

  describe("1. Event Creation & Validation", () => {
    it("should reject event creation by a STUDENT with 403 Forbidden", async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 86400000).toISOString();
      const endTime = new Date(now.getTime() + 90000000).toISOString();
      const deadline = new Date(now.getTime() + 43200000).toISOString();

      const res = await app.inject({
        method: "POST",
        url: "/api/v1/events",
        headers: { authorization: `Bearer ${studentToken}` },
        payload: {
          title: "Student Attempt Event",
          description: "This should fail because students cannot create events directly.",
          category: "TECHNICAL",
          venue: "Lab 4",
          startTime,
          endTime,
          registrationDeadline: deadline,
          capacity: 50,
        },
      });

      expect(res.statusCode).toBe(403);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("FORBIDDEN");
    });

    it("should reject event creation when start time is after end time", async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 90000000).toISOString();
      const endTime = new Date(now.getTime() + 86400000).toISOString(); // before start
      const deadline = new Date(now.getTime() + 43200000).toISOString();

      const res = await app.inject({
        method: "POST",
        url: "/api/v1/events",
        headers: { authorization: `Bearer ${clubLeaderToken}` },
        payload: {
          title: "Invalid Timing Event",
          description: "This event has an invalid start and end timeframe.",
          category: "WORKSHOP",
          venue: "Auditorium A",
          startTime,
          endTime,
          registrationDeadline: deadline,
          capacity: 100,
        },
      });

      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain("start time must be before end time");
    });

    it("should reject event creation when registration deadline is after start time", async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 86400000).toISOString();
      const endTime = new Date(now.getTime() + 90000000).toISOString();
      const deadline = new Date(now.getTime() + 88000000).toISOString(); // after start

      const res = await app.inject({
        method: "POST",
        url: "/api/v1/events",
        headers: { authorization: `Bearer ${clubLeaderToken}` },
        payload: {
          title: "Invalid Deadline Event",
          description: "Deadline cannot be after the start time of the event.",
          category: "ACADEMIC",
          venue: "Hall 2",
          startTime,
          endTime,
          registrationDeadline: deadline,
          capacity: 60,
        },
      });

      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain("Registration deadline cannot be after");
    });

    it("should successfully create a published event by CLUB_LEADER", async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 86400000 * 3).toISOString(); // 3 days ahead
      const endTime = new Date(now.getTime() + 86400000 * 3 + 7200000).toISOString();
      const deadline = new Date(now.getTime() + 86400000 * 2).toISOString();

      const res = await app.inject({
        method: "POST",
        url: "/api/v1/events",
        headers: { authorization: `Bearer ${clubLeaderToken}` },
        payload: {
          title: "Annual Campus AI Hackathon 2026",
          description: "48-hour artificial intelligence and software engineering marathon.",
          category: "TECHNICAL",
          venue: "Engineering Building, 4th Floor Innovation Lab",
          startTime,
          endTime,
          registrationDeadline: deadline,
          capacity: 150,
          bannerUrl: "https://images.unsplash.com/photo-1531403009284-440f080d1e12",
          status: "PUBLISHED",
        },
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.id).toBeDefined();
      expect(body.data.title).toBe("Annual Campus AI Hackathon 2026");
      expect(body.data.category).toBe("TECHNICAL");
      expect(body.data.capacity).toBe(150);
      expect(body.data.organizer.id).toBe(clubLeaderId);

      createdEventId = body.data.id;
    });
  });

  describe("2. Event Listing, Search & Filtering", () => {
    it("should return paginated list of events with metadata", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/events?page=1&limit=5",
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.meta).toBeDefined();
      expect(body.meta.page).toBe(1);
      expect(body.meta.limit).toBe(5);
      expect(body.meta.total).toBeGreaterThanOrEqual(1);
    });

    it("should filter events by category", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/events?category=TECHNICAL",
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      for (const ev of body.data) {
        expect(ev.category).toBe("TECHNICAL");
      }
    });

    it("should search events by keyword in title or description", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/events?search=Hackathon",
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.length).toBeGreaterThanOrEqual(1);
      expect(body.data[0].title).toContain("Hackathon");
    });

    it("should filter upcoming events correctly", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/events?timeframe=upcoming",
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      const now = new Date();
      for (const ev of body.data) {
        expect(new Date(ev.startTime).getTime()).toBeGreaterThanOrEqual(now.getTime() - 1000);
      }
    });
  });

  describe("3. Event Detail & Draft Visibility", () => {
    it("should return detailed event info by ID", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/events/${createdEventId}`,
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(createdEventId);
      expect(body.data.organizer.name).toBe("Club Leader User");
      expect(body.data._count).toHaveProperty("registrations");
    });

    it("should return 404 for non-existent event ID", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/events/00000000-0000-0000-0000-000000000000",
      });

      expect(res.statusCode).toBe(404);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("NOT_FOUND");
    });
  });

  describe("4. Event Updating & Ownership Guard", () => {
    it("should prevent a different club leader from updating someone else's event", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/v1/events/${createdEventId}`,
        headers: { authorization: `Bearer ${otherLeaderToken}` },
        payload: {
          title: "Hacked Event Title By Other Leader",
        },
      });

      expect(res.statusCode).toBe(403);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("FORBIDDEN");
      expect(body.error.message).toContain("not authorized to update");
    });

    it("should allow the organizer to update event fields", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/v1/events/${createdEventId}`,
        headers: { authorization: `Bearer ${clubLeaderToken}` },
        payload: {
          title: "Campus AI Hackathon 2026 (Updated)",
          capacity: 200,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.title).toBe("Campus AI Hackathon 2026 (Updated)");
      expect(body.data.capacity).toBe(200);
    });

    it("should allow an ADMIN to update any event", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/v1/events/${createdEventId}`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          venue: "Grand Auditorium & Exhibition Hall",
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.venue).toBe("Grand Auditorium & Exhibition Hall");
    });
  });

  describe("5. Event Deletion", () => {
    it("should prevent an unauthorized leader from deleting the event", async () => {
      const res = await app.inject({
        method: "DELETE",
        url: `/api/v1/events/${createdEventId}`,
        headers: { authorization: `Bearer ${otherLeaderToken}` },
      });

      expect(res.statusCode).toBe(403);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("FORBIDDEN");
    });

    it("should allow the organizer to safely delete the event when no registrations exist", async () => {
      const res = await app.inject({
        method: "DELETE",
        url: `/api/v1/events/${createdEventId}`,
        headers: { authorization: `Bearer ${clubLeaderToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.status).toBe("DELETED");

      // Verify it's gone
      const verifyRes = await app.inject({
        method: "GET",
        url: `/api/v1/events/${createdEventId}`,
      });
      expect(verifyRes.statusCode).toBe(404);
    });
  });
});
