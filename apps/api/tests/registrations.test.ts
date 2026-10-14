import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";

describe("Module 4: Event Registration & Attendance Tests", () => {
  let app: FastifyInstance;

  let organizerToken: string;
  let student1Token: string;
  let student2Token: string;
  let unauthorizedStudentToken: string;

  let organizerId: string;
  let student1Id: string;
  let student2Id: string;

  let normalEventId: string;
  let limitedCapacityEventId: string;
  let expiredDeadlineEventId: string;
  let cancelledEventId: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // Create users directly
    const organizer = await app.prisma.user.upsert({
      where: { email: "reg_organizer@university.edu" },
      update: {},
      create: {
        email: "reg_organizer@university.edu",
        name: "Registration Event Organizer",
        password: "argon2id_dummy_hash",
        role: "CLUB_LEADER",
      },
    });
    organizerId = organizer.id;

    const student1 = await app.prisma.user.upsert({
      where: { email: "reg_student1@university.edu" },
      update: {},
      create: {
        email: "reg_student1@university.edu",
        name: "Alice Registrant",
        password: "argon2id_dummy_hash",
        role: "STUDENT",
        department: "Computer Science",
      },
    });
    student1Id = student1.id;

    const student2 = await app.prisma.user.upsert({
      where: { email: "reg_student2@university.edu" },
      update: {},
      create: {
        email: "reg_student2@university.edu",
        name: "Bob Registrant",
        password: "argon2id_dummy_hash",
        role: "STUDENT",
        department: "Electrical Engineering",
      },
    });
    student2Id = student2.id;

    const unauthorizedStudent = await app.prisma.user.upsert({
      where: { email: "reg_unauthorized@university.edu" },
      update: {},
      create: {
        email: "reg_unauthorized@university.edu",
        name: "Charlie Unauthorized",
        password: "argon2id_dummy_hash",
        role: "STUDENT",
      },
    });

    organizerToken = app.jwt.sign({ sub: organizer.id, email: organizer.email, role: "CLUB_LEADER" });
    student1Token = app.jwt.sign({ sub: student1.id, email: student1.email, role: "STUDENT" });
    student2Token = app.jwt.sign({ sub: student2.id, email: student2.email, role: "STUDENT" });
    unauthorizedStudentToken = app.jwt.sign({ sub: unauthorizedStudent.id, email: unauthorizedStudent.email, role: "STUDENT" });

    const now = new Date();

    // 1. Normal event with ample capacity
    const normalEvent = await app.prisma.event.create({
      data: {
        title: "Campus Web Dev Workshop",
        description: "Hands-on Fastify and React workshop.",
        category: "WORKSHOP",
        venue: "Lab B",
        startTime: new Date(now.getTime() + 86400000 * 5),
        endTime: new Date(now.getTime() + 86400000 * 5 + 7200000),
        registrationDeadline: new Date(now.getTime() + 86400000 * 4),
        capacity: 10,
        status: "PUBLISHED",
        organizerId: organizer.id,
      },
    });
    normalEventId = normalEvent.id;

    // 2. Strict capacity = 1 event for testing overbooking
    const limitedEvent = await app.prisma.event.create({
      data: {
        title: "Exclusive Mentorship Session",
        description: "One-on-one session with campus alumni.",
        category: "ACADEMIC",
        venue: "Meeting Room 1",
        startTime: new Date(now.getTime() + 86400000 * 5),
        endTime: new Date(now.getTime() + 86400000 * 5 + 3600000),
        registrationDeadline: new Date(now.getTime() + 86400000 * 4),
        capacity: 1, // Only 1 spot!
        status: "PUBLISHED",
        organizerId: organizer.id,
      },
    });
    limitedCapacityEventId = limitedEvent.id;

    // 3. Past deadline event
    const expiredEvent = await app.prisma.event.create({
      data: {
        title: "Closed Registration Seminar",
        description: "Registration deadline has passed.",
        category: "ACADEMIC",
        venue: "Room 101",
        startTime: new Date(now.getTime() + 86400000),
        endTime: new Date(now.getTime() + 86400000 + 3600000),
        registrationDeadline: new Date(now.getTime() - 3600000), // 1 hour ago
        capacity: 50,
        status: "PUBLISHED",
        organizerId: organizer.id,
      },
    });
    expiredDeadlineEventId = expiredEvent.id;

    // 4. Cancelled event
    const cancelledEvent = await app.prisma.event.create({
      data: {
        title: "Cancelled Sports Tournament",
        description: "Cancelled due to bad weather.",
        category: "SPORTS",
        venue: "Main Stadium",
        startTime: new Date(now.getTime() + 86400000 * 2),
        endTime: new Date(now.getTime() + 86400000 * 2 + 7200000),
        registrationDeadline: new Date(now.getTime() + 86400000),
        capacity: 100,
        status: "CANCELLED",
        organizerId: organizer.id,
      },
    });
    cancelledEventId = cancelledEvent.id;
  }, 20000);

  afterAll(async () => {
    if (app?.prisma) {
      await app.prisma.notification.deleteMany({
        where: { userId: { in: [student1Id, student2Id] } },
      });
      await app.prisma.eventRegistration.deleteMany({
        where: { eventId: { in: [normalEventId, limitedCapacityEventId, expiredDeadlineEventId, cancelledEventId] } },
      });
      await app.prisma.event.deleteMany({
        where: { organizerId },
      });
      await app.prisma.user.deleteMany({
        where: {
          email: {
            in: [
              "reg_organizer@university.edu",
              "reg_student1@university.edu",
              "reg_student2@university.edu",
              "reg_unauthorized@university.edu",
            ],
          },
        },
      });
      await app.close();
    }
  });

  describe("1. Registration Creation & Transactional Capacity", () => {
    it("should successfully register a student for a published event within capacity", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/events/${normalEventId}/register`,
        headers: { authorization: `Bearer ${student1Token}` },
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.status).toBe("REGISTERED");
      expect(body.data.eventId).toBe(normalEventId);
      expect(body.data.userId).toBe(student1Id);

      // Verify notification created for student
      const notification = await app.prisma.notification.findFirst({
        where: { userId: student1Id, type: "EVENT_REGISTRATION" },
      });
      expect(notification).toBeDefined();
      expect(notification!.title).toBe("Event Registration Confirmed");
    });

    it("should reject duplicate registration with 409 Conflict", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/events/${normalEventId}/register`,
        headers: { authorization: `Bearer ${student1Token}` },
      });

      expect(res.statusCode).toBe(409);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("CONFLICT");
      expect(body.error.message).toContain("already registered");
    });

    it("should enforce event capacity limit and reject overbooking with 409 Conflict", async () => {
      // First registration fills the capacity of 1
      const firstRes = await app.inject({
        method: "POST",
        url: `/api/v1/events/${limitedCapacityEventId}/register`,
        headers: { authorization: `Bearer ${student1Token}` },
      });
      expect(firstRes.statusCode).toBe(201);

      // Second registration should be rejected
      const secondRes = await app.inject({
        method: "POST",
        url: `/api/v1/events/${limitedCapacityEventId}/register`,
        headers: { authorization: `Bearer ${student2Token}` },
      });

      expect(secondRes.statusCode).toBe(409);
      const body = JSON.parse(secondRes.payload);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("CONFLICT");
      expect(body.error.message).toContain("maximum capacity");
    });
  });

  describe("2. Deadline and Event Status Guards", () => {
    it("should reject registration when registration deadline has passed", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/events/${expiredDeadlineEventId}/register`,
        headers: { authorization: `Bearer ${student1Token}` },
      });

      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain("deadline for this event has passed");
    });

    it("should reject registration for a CANCELLED event", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/events/${cancelledEventId}/register`,
        headers: { authorization: `Bearer ${student1Token}` },
      });

      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain("Cannot register for an event with status: CANCELLED");
    });
  });

  describe("3. Cancellation and Capacity Release", () => {
    it("should allow a student to cancel their active registration", async () => {
      const res = await app.inject({
        method: "DELETE",
        url: `/api/v1/events/${limitedCapacityEventId}/register`,
        headers: { authorization: `Bearer ${student1Token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.status).toBe("CANCELLED");

      // Verify cancellation notification
      const cancelNotif = await app.prisma.notification.findFirst({
        where: { userId: student1Id, type: "EVENT_CANCELLED" },
      });
      expect(cancelNotif).toBeDefined();
    });

    it("should allow another student to register now that a spot is freed", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/events/${limitedCapacityEventId}/register`,
        headers: { authorization: `Bearer ${student2Token}` },
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.status).toBe("REGISTERED");
      expect(body.data.userId).toBe(student2Id);
    });
  });

  describe("4. Participant Roster & Attendance Tracking", () => {
    it("should forbid unauthorized students from viewing the event participant roster", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/events/${normalEventId}/participants`,
        headers: { authorization: `Bearer ${unauthorizedStudentToken}` },
      });

      expect(res.statusCode).toBe(403);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("FORBIDDEN");
    });

    it("should allow event organizer to view participants list with user details", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/events/${normalEventId}/participants`,
        headers: { authorization: `Bearer ${organizerToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThanOrEqual(1);
      expect(body.data[0].user.name).toBe("Alice Registrant");
      expect(body.meta).toBeDefined();
    });

    it("should allow organizer to mark participant as ATTENDED", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/v1/events/${normalEventId}/attendance/${student1Id}`,
        headers: { authorization: `Bearer ${organizerToken}` },
        payload: {
          status: "ATTENDED",
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.status).toBe("ATTENDED");
      expect(body.data.attendedAt).toBeDefined();
    });
  });

  describe("5. Student Registrations Roster", () => {
    it("should return student's personal registrations list via /users/me/registrations", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/users/me/registrations",
        headers: { authorization: `Bearer ${student1Token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThanOrEqual(1);
      const workshopReg = body.data.find((r: any) => r.eventId === normalEventId);
      expect(workshopReg).toBeDefined();
      expect(workshopReg.event.title).toBe("Campus Web Dev Workshop");
      expect(workshopReg.status).toBe("ATTENDED");
    });
  });
});
