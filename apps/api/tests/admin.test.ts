import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";

describe("Module 9: Admin Dashboard & Analytics Tests", () => {
  let app: FastifyInstance;

  let adminToken: string;
  let adminId: string;

  let studentToken: string;
  let studentId: string;

  let leaderToken: string;
  let leaderId: string;

  let testPostId: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // 1. Admin user
    const admin = await app.prisma.user.upsert({
      where: { email: "admin_dash_test@university.edu" },
      update: { role: "ADMIN", status: "ACTIVE" },
      create: {
        email: "admin_dash_test@university.edu",
        name: "Arthur Admin",
        password: "argon2id_dummy_hash",
        role: "ADMIN",
        status: "ACTIVE",
        department: "Administration",
      },
    });
    adminId = admin.id;
    adminToken = app.jwt.sign({ sub: admin.id, email: admin.email, role: "ADMIN" });

    // 2. Student user
    const student = await app.prisma.user.upsert({
      where: { email: "student_dash_test@university.edu" },
      update: { role: "STUDENT", status: "ACTIVE" },
      create: {
        email: "student_dash_test@university.edu",
        name: "Sammy Student",
        password: "argon2id_dummy_hash",
        role: "STUDENT",
        status: "ACTIVE",
        department: "Computer Science",
      },
    });
    studentId = student.id;
    studentToken = app.jwt.sign({ sub: student.id, email: student.email, role: "STUDENT" });

    // 3. Club Leader
    const leader = await app.prisma.user.upsert({
      where: { email: "leader_dash_test@university.edu" },
      update: { role: "CLUB_LEADER", status: "ACTIVE" },
      create: {
        email: "leader_dash_test@university.edu",
        name: "Laura Leader",
        password: "argon2id_dummy_hash",
        role: "CLUB_LEADER",
        status: "ACTIVE",
        department: "Electrical Engineering",
      },
    });
    leaderId = leader.id;
    leaderToken = app.jwt.sign({ sub: leader.id, email: leader.email, role: "CLUB_LEADER" });

    // 4. Create a community post for moderation testing
    const post = await app.prisma.communityPost.create({
      data: {
        authorId: studentId,
        title: "Test Post for Admin Moderation",
        content: "Content that might require moderation flag.",
        type: "GENERAL",
      },
    });
    testPostId = post.id;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe("1. RBAC & Admin Protection", () => {
    it("should reject unauthenticated request with 401 Unauthorized", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/admin/analytics",
      });

      expect(res.statusCode).toBe(401);
    });

    it("should reject student request with 403 Forbidden", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/admin/analytics",
        headers: { authorization: `Bearer ${studentToken}` },
      });

      expect(res.statusCode).toBe(403);
    });

    it("should reject club leader request with 403 Forbidden", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/admin/analytics",
        headers: { authorization: `Bearer ${leaderToken}` },
      });

      expect(res.statusCode).toBe(403);
    });
  });

  describe("2. System Analytics & Telemetry", () => {
    it("should return complete analytics breakdown for ADMIN", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/admin/analytics",
        headers: { authorization: `Bearer ${adminToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);

      // Verify sections
      expect(body.data.users).toBeDefined();
      expect(body.data.users.total).toBeGreaterThanOrEqual(3);
      expect(body.data.users.admins).toBeGreaterThanOrEqual(1);
      expect(body.data.users.students).toBeGreaterThanOrEqual(1);

      expect(body.data.events).toBeDefined();
      expect(typeof body.data.events.total).toBe("number");
      expect(typeof body.data.events.attendanceRatePercent).toBe("number");

      expect(body.data.clubs).toBeDefined();
      expect(typeof body.data.clubs.total).toBe("number");

      expect(body.data.projects).toBeDefined();
      expect(typeof body.data.projects.total).toBe("number");

      expect(body.data.community).toBeDefined();
      expect(typeof body.data.community.totalPosts).toBe("number");

      expect(Array.isArray(body.data.recentUsers)).toBe(true);
    });
  });

  describe("3. User Listing & Search", () => {
    it("should list users with pagination metadata", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/admin/users?limit=10",
        headers: { authorization: `Bearer ${adminToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.meta.total).toBeGreaterThanOrEqual(3);

      // Ensure password hash is not leaked
      expect(body.data[0].password).toBeUndefined();
      expect(body.data[0]._count).toBeDefined();
    });

    it("should filter users by role=CLUB_LEADER", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/admin/users?role=CLUB_LEADER",
        headers: { authorization: `Bearer ${adminToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data.every((u: any) => u.role === "CLUB_LEADER")).toBe(true);
      expect(body.data.some((u: any) => u.id === leaderId)).toBe(true);
    });

    it("should search users by keyword", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/admin/users?search=Sammy",
        headers: { authorization: `Bearer ${adminToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data.length).toBeGreaterThanOrEqual(1);
      expect(body.data[0].name).toContain("Sammy");
    });
  });

  describe("4. Role Management & Self-Protection", () => {
    it("should promote student to CLUB_LEADER", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/v1/admin/users/${studentId}/role`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: { role: "CLUB_LEADER" },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data.role).toBe("CLUB_LEADER");
    });

    it("should prevent admin from altering their own role with 400 Bad Request", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/v1/admin/users/${adminId}/role`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: { role: "STUDENT" },
      });

      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.payload);
      expect(body.error?.message || body.message).toContain("cannot alter their own role");
    });
  });

  describe("5. Account Status & Token Revocation", () => {
    it("should suspend student account and revoke active tokens", async () => {
      // Create a dummy refresh token for student to verify revocation
      await app.prisma.refreshToken.create({
        data: {
          token: "dummy_refresh_token_to_revoke",
          userId: studentId,
          expiresAt: new Date(Date.now() + 3600000),
        },
      });

      const res = await app.inject({
        method: "PATCH",
        url: `/api/v1/admin/users/${studentId}/status`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: { status: "SUSPENDED" },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data.status).toBe("SUSPENDED");

      // Verify token was revoked
      const remainingTokens = await app.prisma.refreshToken.count({
        where: { userId: studentId },
      });
      expect(remainingTokens).toBe(0);
    });

    it("should prevent admin from suspending their own account with 400 Bad Request", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/v1/admin/users/${adminId}/status`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: { status: "SUSPENDED" },
      });

      expect(res.statusCode).toBe(400);
    });

    it("should reactivate suspended student account to ACTIVE", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/v1/admin/users/${studentId}/status`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: { status: "ACTIVE" },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data.status).toBe("ACTIVE");
    });
  });

  describe("6. Community Moderation & Pin Controls", () => {
    it("should flag a community post as moderated", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/v1/admin/posts/${testPostId}/moderate`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: { isModerated: true },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data.isModerated).toBe(true);
    });

    it("should pin a community post to top", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/v1/admin/posts/${testPostId}/pin`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: { isPinned: true },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data.isPinned).toBe(true);
    });
  });
});
