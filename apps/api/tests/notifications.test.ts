import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";

describe("Module 8: Notifications & Alerts Tests", () => {
  let app: FastifyInstance;

  let student1Token: string;
  let student1Id: string;

  let student2Token: string;
  let student2Id: string;

  let adminToken: string;
  let adminId: string;

  let student1Notif1Id: string;
  let student1Notif2Id: string;
  let student2NotifId: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // Clean up notifications from previous runs
    await app.prisma.notification.deleteMany({
      where: {
        user: {
          email: {
            in: [
              "notif_student1_test@university.edu",
              "notif_student2_test@university.edu",
              "notif_admin_test@university.edu",
            ],
          },
        },
      },
    });

    // 1. Student 1
    const s1 = await app.prisma.user.upsert({
      where: { email: "notif_student1_test@university.edu" },
      update: {},
      create: {
        email: "notif_student1_test@university.edu",
        name: "Noah Notification Student 1",
        password: "argon2id_dummy_hash",
        role: "STUDENT",
        department: "Computer Science",
      },
    });
    student1Id = s1.id;
    student1Token = app.jwt.sign({ sub: s1.id, email: s1.email, role: "STUDENT" });

    // 2. Student 2
    const s2 = await app.prisma.user.upsert({
      where: { email: "notif_student2_test@university.edu" },
      update: {},
      create: {
        email: "notif_student2_test@university.edu",
        name: "Nora Notification Student 2",
        password: "argon2id_dummy_hash",
        role: "STUDENT",
        department: "Mechanical Engineering",
      },
    });
    student2Id = s2.id;
    student2Token = app.jwt.sign({ sub: s2.id, email: s2.email, role: "STUDENT" });

    // 3. Admin
    const adm = await app.prisma.user.upsert({
      where: { email: "notif_admin_test@university.edu" },
      update: {},
      create: {
        email: "notif_admin_test@university.edu",
        name: "Ned Notification Admin",
        password: "argon2id_dummy_hash",
        role: "ADMIN",
        department: "Campus Administration",
      },
    });
    adminId = adm.id;
    adminToken = app.jwt.sign({ sub: adm.id, email: adm.email, role: "ADMIN" });

    // Seed test notifications
    const n1 = await app.prisma.notification.create({
      data: {
        userId: student1Id,
        type: "EVENT_REGISTRATION",
        title: "Hackathon Schedule Update",
        message: "Room has been moved to Hall B.",
        link: "/events/hackathon-2026",
        isRead: false,
      },
    });
    student1Notif1Id = n1.id;

    const n2 = await app.prisma.notification.create({
      data: {
        userId: student1Id,
        type: "TASK_ASSIGNED",
        title: "New Project Task Assigned",
        message: "You have been assigned: Implement user auth",
        link: "/projects/123",
        isRead: false,
      },
    });
    student1Notif2Id = n2.id;

    const n3 = await app.prisma.notification.create({
      data: {
        userId: student2Id,
        type: "CLUB_MEMBERSHIP_UPDATE",
        title: "Robotics Club Approved",
        message: "Your membership application has been accepted!",
        link: "/clubs/robotics",
        isRead: false,
      },
    });
    student2NotifId = n3.id;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe("1. Notification Listing & Unread Counts", () => {
    it("should list notifications for student 1 with accurate unread count", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/notifications",
        headers: { authorization: `Bearer ${student1Token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.length).toBe(2);
      expect(body.meta.unreadCount).toBe(2);
      expect(body.data[0].id).toBe(student1Notif2Id); // Latest first
    });

    it("should return fast unread count via /unread-count endpoint", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/notifications/unread-count",
        headers: { authorization: `Bearer ${student1Token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.unreadCount).toBe(2);
    });

    it("should reject unauthenticated request with 401 Unauthorized", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/notifications",
      });

      expect(res.statusCode).toBe(401);
    });
  });

  describe("2. Mark as Read & Security Isolation", () => {
    it("should mark a single notification as read", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/v1/notifications/${student1Notif1Id}/read`,
        headers: { authorization: `Bearer ${student1Token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.isRead).toBe(true);

      // Verify unread count is now 1
      const countRes = await app.inject({
        method: "GET",
        url: "/api/v1/notifications/unread-count",
        headers: { authorization: `Bearer ${student1Token}` },
      });
      const countBody = JSON.parse(countRes.payload);
      expect(countBody.data.unreadCount).toBe(1);
    });

    it("should forbid or 404 when student 1 attempts to mark student 2's notification as read", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/v1/notifications/${student2NotifId}/read`,
        headers: { authorization: `Bearer ${student1Token}` },
      });

      expect(res.statusCode).toBe(404);
    });

    it("should filter notifications by unreadOnly=true", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/notifications?unreadOnly=true",
        headers: { authorization: `Bearer ${student1Token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data.length).toBe(1);
      expect(body.data[0].id).toBe(student1Notif2Id);
    });

    it("should mark all remaining unread notifications as read", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: "/api/v1/notifications/read-all",
        headers: { authorization: `Bearer ${student1Token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.updatedCount).toBe(1);

      // Verify unread count is now 0
      const countRes = await app.inject({
        method: "GET",
        url: "/api/v1/notifications/unread-count",
        headers: { authorization: `Bearer ${student1Token}` },
      });
      const countBody = JSON.parse(countRes.payload);
      expect(countBody.data.unreadCount).toBe(0);
    });
  });

  describe("3. Deletion & Isolation", () => {
    it("should prevent student 1 from deleting student 2's notification with 404", async () => {
      const res = await app.inject({
        method: "DELETE",
        url: `/api/v1/notifications/${student2NotifId}`,
        headers: { authorization: `Bearer ${student1Token}` },
      });

      expect(res.statusCode).toBe(404);
    });

    it("should allow student 1 to delete their own notification", async () => {
      const res = await app.inject({
        method: "DELETE",
        url: `/api/v1/notifications/${student1Notif1Id}`,
        headers: { authorization: `Bearer ${student1Token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);

      // Verify it's gone
      const verifyRes = await app.inject({
        method: "PATCH",
        url: `/api/v1/notifications/${student1Notif1Id}/read`,
        headers: { authorization: `Bearer ${student1Token}` },
      });
      expect(verifyRes.statusCode).toBe(404);
    });
  });

  describe("4. Admin Campus Broadcast Alerts", () => {
    it("should reject student broadcast attempt with 403 Forbidden", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/notifications/broadcast",
        headers: { authorization: `Bearer ${student1Token}` },
        payload: {
          title: "Campus Fire Drill Today",
          message: "Please evacuate the building at 2 PM.",
          type: "GENERAL",
        },
      });

      expect(res.statusCode).toBe(403);
    });

    it("should allow ADMIN to broadcast an urgent campus alert to active users", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/notifications/broadcast",
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          title: "Urgent Campus Advisory: Severe Weather Notice",
          message: "All evening laboratory classes are shifted online due to storm warning.",
          type: "GENERAL",
          link: "/community",
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.recipientCount).toBeGreaterThanOrEqual(2);

      // Verify student 1 received the broadcast
      const s1Res = await app.inject({
        method: "GET",
        url: "/api/v1/notifications",
        headers: { authorization: `Bearer ${student1Token}` },
      });
      const s1Body = JSON.parse(s1Res.payload);
      expect(s1Body.data.some((n: any) => n.title.includes("Severe Weather Notice"))).toBe(true);
    });
  });
});
