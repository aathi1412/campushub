import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";

describe("Module 5: Clubs & Memberships Tests", () => {
  let app: FastifyInstance;

  let leaderToken: string;
  let leaderId: string;

  let adminToken: string;
  let adminId: string;

  let student1Token: string;
  let student1Id: string;

  let student2Token: string;
  let student2Id: string;

  let createdClubId: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // 1. Leader User
    const leader = await app.prisma.user.upsert({
      where: { email: "club_leader_test@university.edu" },
      update: {},
      create: {
        email: "club_leader_test@university.edu",
        name: "Diana Club Leader",
        password: "argon2id_dummy_hash",
        role: "CLUB_LEADER",
        department: "Computer Science",
      },
    });
    leaderId = leader.id;
    leaderToken = app.jwt.sign({ sub: leader.id, email: leader.email, role: "CLUB_LEADER" });

    // 2. Admin User
    const admin = await app.prisma.user.upsert({
      where: { email: "club_admin_test@university.edu" },
      update: {},
      create: {
        email: "club_admin_test@university.edu",
        name: "Arthur Campus Admin",
        password: "argon2id_dummy_hash",
        role: "ADMIN",
        department: "Administration",
      },
    });
    adminId = admin.id;
    adminToken = app.jwt.sign({ sub: admin.id, email: admin.email, role: "ADMIN" });

    // 3. Student 1
    const student1 = await app.prisma.user.upsert({
      where: { email: "club_student1_test@university.edu" },
      update: {},
      create: {
        email: "club_student1_test@university.edu",
        name: "Sam Student One",
        password: "argon2id_dummy_hash",
        role: "STUDENT",
        department: "Information Technology",
      },
    });
    student1Id = student1.id;
    student1Token = app.jwt.sign({ sub: student1.id, email: student1.email, role: "STUDENT" });

    // 4. Student 2
    const student2 = await app.prisma.user.upsert({
      where: { email: "club_student2_test@university.edu" },
      update: {},
      create: {
        email: "club_student2_test@university.edu",
        name: "Tara Student Two",
        password: "argon2id_dummy_hash",
        role: "STUDENT",
        department: "Design & Arts",
      },
    });
    student2Id = student2.id;
    student2Token = app.jwt.sign({ sub: student2.id, email: student2.email, role: "STUDENT" });

    // Clean up test clubs if existing
    const existingClub = await app.prisma.club.findUnique({
      where: { name: "Robotics & AI Innovation Hub" },
    });
    if (existingClub) {
      await app.prisma.clubMembership.deleteMany({ where: { clubId: existingClub.id } });
      await app.prisma.club.delete({ where: { id: existingClub.id } });
    }
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe("1. Club Creation & Initial Leadership", () => {
    it("should allow a CLUB_LEADER to create a club and assign them as LEADER with APPROVED membership", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/clubs",
        headers: { authorization: `Bearer ${leaderToken}` },
        payload: {
          name: "Robotics & AI Innovation Hub",
          description: "Building autonomous systems and exploring cutting-edge AI technologies.",
          category: "Technology & Coding",
        },
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe("Robotics & AI Innovation Hub");
      expect(body.data.leaderId).toBe(leaderId);
      expect(body.data.memberCount).toBe(1);
      expect(body.data.userMembership.role).toBe("LEADER");
      expect(body.data.userMembership.status).toBe("APPROVED");

      createdClubId = body.data.id;

      // Verify in DB that ClubMembership was created atomically
      const membership = await app.prisma.clubMembership.findUnique({
        where: {
          clubId_userId: {
            clubId: createdClubId,
            userId: leaderId,
          },
        },
      });
      expect(membership).not.toBeNull();
      expect(membership?.role).toBe("LEADER");
      expect(membership?.status).toBe("APPROVED");
    });

    it("should reject club creation from a student without elevated permissions with 403 Forbidden", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/clubs",
        headers: { authorization: `Bearer ${student1Token}` },
        payload: {
          name: "Unauthorized Student Club",
          description: "This should fail because caller has STUDENT role.",
          category: "Other",
        },
      });

      expect(res.statusCode).toBe(403);
    });

    it("should reject duplicate club name with 409 Conflict", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/clubs",
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          name: "Robotics & AI Innovation Hub",
          description: "Duplicate name attempt.",
          category: "Technology & Coding",
        },
      });

      expect(res.statusCode).toBe(409);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain("already exists");
    });
  });

  describe("2. Club Directory & Details", () => {
    it("should list clubs with pagination, category filter, and member count", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/clubs?category=Technology%20%26%20Coding",
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThanOrEqual(1);

      const found = body.data.find((c: any) => c.id === createdClubId);
      expect(found).toBeDefined();
      expect(found.name).toBe("Robotics & AI Innovation Hub");
      expect(found.memberCount).toBe(1);
      expect(body.meta.total).toBeGreaterThanOrEqual(1);
    });

    it("should return detailed club info with leader info and caller membership status", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/clubs/${createdClubId}`,
        headers: { authorization: `Bearer ${leaderToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(createdClubId);
      expect(body.data.leader.id).toBe(leaderId);
      expect(body.data.userMembership).toBeDefined();
      expect(body.data.userMembership.role).toBe("LEADER");
      expect(body.data.userMembership.status).toBe("APPROVED");
    });
  });

  describe("3. Club Updates & Permission Guard", () => {
    it("should allow club leader to update description and category", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/v1/clubs/${createdClubId}`,
        headers: { authorization: `Bearer ${leaderToken}` },
        payload: {
          description: "Official Robotics and AI Hub for engineering and computing projects.",
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.description).toBe(
        "Official Robotics and AI Hub for engineering and computing projects."
      );
    });

    it("should reject update from an unaffiliated student with 403 Forbidden", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/v1/clubs/${createdClubId}`,
        headers: { authorization: `Bearer ${student1Token}` },
        payload: {
          name: "Hacked Club Name",
        },
      });

      expect(res.statusCode).toBe(403);
    });
  });

  describe("4. Join Request & Approval Workflow", () => {
    it("should allow a student to submit a join request (PENDING status) and notify leader", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/clubs/${createdClubId}/join`,
        headers: { authorization: `Bearer ${student1Token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.status).toBe("PENDING");
      expect(body.data.role).toBe("MEMBER");

      // Verify notification created for club leader
      const notification = await app.prisma.notification.findFirst({
        where: {
          userId: leaderId,
          type: "CLUB_MEMBERSHIP_UPDATE",
        },
        orderBy: { createdAt: "desc" },
      });
      expect(notification).not.toBeNull();
      expect(notification?.message).toContain("requested to join");
    });

    it("should reject duplicate pending join request with 409 Conflict", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/clubs/${createdClubId}/join`,
        headers: { authorization: `Bearer ${student1Token}` },
      });

      expect(res.statusCode).toBe(409);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain("already pending");
    });

    it("should allow club leader to view pending members", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/clubs/${createdClubId}/members?status=PENDING`,
        headers: { authorization: `Bearer ${leaderToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.length).toBe(1);
      expect(body.data[0].userId).toBe(student1Id);
      expect(body.data[0].status).toBe("PENDING");
    });

    it("should allow club leader to approve pending member and notify applicant", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/v1/clubs/${createdClubId}/members/${student1Id}`,
        headers: { authorization: `Bearer ${leaderToken}` },
        payload: {
          status: "APPROVED",
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.status).toBe("APPROVED");
      expect(body.data.joinedAt).toBeDefined();

      // Check notification sent to student
      const studentNotification = await app.prisma.notification.findFirst({
        where: {
          userId: student1Id,
          type: "CLUB_MEMBERSHIP_UPDATE",
        },
        orderBy: { createdAt: "desc" },
      });
      expect(studentNotification).not.toBeNull();
      expect(studentNotification?.message).toContain("approved");
    });

    it("should prevent already approved student from joining again with 409 Conflict", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/clubs/${createdClubId}/join`,
        headers: { authorization: `Bearer ${student1Token}` },
      });

      expect(res.statusCode).toBe(409);
      const body = JSON.parse(res.payload);
      expect(body.error.message).toContain("already an active member");
    });
  });

  describe("5. Role Promotion & Officer Management", () => {
    it("should allow leader to promote approved member to OFFICER", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/v1/clubs/${createdClubId}/members/${student1Id}`,
        headers: { authorization: `Bearer ${leaderToken}` },
        payload: {
          role: "OFFICER",
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.role).toBe("OFFICER");
    });

    it("should allow newly appointed officer to review pending membership requests", async () => {
      // Student 2 applies to join
      await app.inject({
        method: "POST",
        url: `/api/v1/clubs/${createdClubId}/join`,
        headers: { authorization: `Bearer ${student2Token}` },
      });

      // Officer (Student 1) lists pending members
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/clubs/${createdClubId}/members?status=PENDING`,
        headers: { authorization: `Bearer ${student1Token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      const pendingStudent2 = body.data.find((m: any) => m.userId === student2Id);
      expect(pendingStudent2).toBeDefined();
    });

    it("should prevent an officer from promoting another member to OFFICER", async () => {
      // First approve student2
      await app.inject({
        method: "PATCH",
        url: `/api/v1/clubs/${createdClubId}/members/${student2Id}`,
        headers: { authorization: `Bearer ${student1Token}` },
        payload: { status: "APPROVED" },
      });

      // Now officer attempts to promote student2 to OFFICER -> 403 Forbidden
      const res = await app.inject({
        method: "PATCH",
        url: `/api/v1/clubs/${createdClubId}/members/${student2Id}`,
        headers: { authorization: `Bearer ${student1Token}` },
        payload: { role: "OFFICER" },
      });

      expect(res.statusCode).toBe(403);
    });
  });

  describe("6. Leave Club & Leader Protection", () => {
    it("should prevent club leader from leaving their own club with 400 Bad Request", async () => {
      const res = await app.inject({
        method: "DELETE",
        url: `/api/v1/clubs/${createdClubId}/leave`,
        headers: { authorization: `Bearer ${leaderToken}` },
      });

      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.payload);
      expect(body.error.message).toContain("Club leader cannot leave");
    });

    it("should allow an active member to leave the club", async () => {
      const res = await app.inject({
        method: "DELETE",
        url: `/api/v1/clubs/${createdClubId}/leave`,
        headers: { authorization: `Bearer ${student2Token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);

      // Verify membership status in DB
      const m = await app.prisma.clubMembership.findUnique({
        where: { clubId_userId: { clubId: createdClubId, userId: student2Id } },
      });
      expect(m?.status).toBe("LEFT");
    });
  });

  describe("7. User Memberships Roster", () => {
    it("should return all clubs the student belongs to via /api/v1/clubs/my-memberships", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/clubs/my-memberships",
        headers: { authorization: `Bearer ${student1Token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);

      const myClub = body.data.find((item: any) => item.club.id === createdClubId);
      expect(myClub).toBeDefined();
      expect(myClub.role).toBe("OFFICER");
      expect(myClub.status).toBe("APPROVED");
    });
  });
});
