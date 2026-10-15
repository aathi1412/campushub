import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";

describe("Module 6: Project Collaboration & Task Management Tests", () => {
  let app: FastifyInstance;

  let ownerToken: string;
  let ownerId: string;

  let collaboratorToken: string;
  let collaboratorId: string;

  let unaffiliatedToken: string;
  let unaffiliatedId: string;

  let adminToken: string;

  let publicProjectId: string;
  let privateProjectId: string;
  let invitationId: string;
  let createdTaskId: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // 1. Owner User
    const owner = await app.prisma.user.upsert({
      where: { email: "proj_owner_test@university.edu" },
      update: {},
      create: {
        email: "proj_owner_test@university.edu",
        name: "Devin Project Owner",
        password: "argon2id_dummy_hash",
        role: "STUDENT",
        department: "Computer Science",
      },
    });
    ownerId = owner.id;
    ownerToken = app.jwt.sign({ sub: owner.id, email: owner.email, role: "STUDENT" });

    // 2. Collaborator User
    const collaborator = await app.prisma.user.upsert({
      where: { email: "proj_collab_test@university.edu" },
      update: {},
      create: {
        email: "proj_collab_test@university.edu",
        name: "Chloe Collaborator",
        password: "argon2id_dummy_hash",
        role: "STUDENT",
        department: "Software Engineering",
      },
    });
    collaboratorId = collaborator.id;
    collaboratorToken = app.jwt.sign({ sub: collaborator.id, email: collaborator.email, role: "STUDENT" });

    // 3. Unaffiliated Student
    const unaffiliated = await app.prisma.user.upsert({
      where: { email: "proj_unaffil_test@university.edu" },
      update: {},
      create: {
        email: "proj_unaffil_test@university.edu",
        name: "Ulysses Unaffiliated",
        password: "argon2id_dummy_hash",
        role: "STUDENT",
      },
    });
    unaffiliatedId = unaffiliated.id;
    unaffiliatedToken = app.jwt.sign({ sub: unaffiliated.id, email: unaffiliated.email, role: "STUDENT" });

    // 4. Admin User
    const admin = await app.prisma.user.upsert({
      where: { email: "proj_admin_test@university.edu" },
      update: {},
      create: {
        email: "proj_admin_test@university.edu",
        name: "Adam Administrator",
        password: "argon2id_dummy_hash",
        role: "ADMIN",
      },
    });
    adminToken = app.jwt.sign({ sub: admin.id, email: admin.email, role: "ADMIN" });

    // Clean up test projects if existing
    const oldProjects = await app.prisma.project.findMany({
      where: { ownerId },
      select: { id: true },
    });
    if (oldProjects.length > 0) {
      await app.prisma.project.deleteMany({
        where: { id: { in: oldProjects.map((p) => p.id) } },
      });
    }
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe("1. Project Creation & Initial Team Setup", () => {
    it("should allow a student to create a project and set them as OWNER in team members", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/projects",
        headers: { authorization: `Bearer ${ownerToken}` },
        payload: {
          title: "Autonomous Drone Navigation",
          description: "ROS2 and computer vision navigation system for indoor drones.",
          technologies: "Python, C++, ROS2, OpenCV, PyTorch",
          visibility: "PUBLIC",
          status: "IN_PROGRESS",
          repoUrl: "https://github.com/campushub/drone-nav",
        },
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.title).toBe("Autonomous Drone Navigation");
      expect(body.data.ownerId).toBe(ownerId);
      expect(body.data.memberCount).toBe(1);
      expect(body.data.userRole).toBe("OWNER");

      publicProjectId = body.data.id;

      // Verify membership record in DB
      const member = await app.prisma.projectMember.findUnique({
        where: {
          projectId_userId: { projectId: publicProjectId, userId: ownerId },
        },
      });
      expect(member).not.toBeNull();
      expect(member?.role).toBe("OWNER");
    });

    it("should create a PRIVATE project for confidential research", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/projects",
        headers: { authorization: `Bearer ${ownerToken}` },
        payload: {
          title: "Stealth Quantum Cryptography",
          description: "Post-quantum key exchange algorithms research.",
          technologies: "Rust, WebAssembly, Cryptography",
          visibility: "PRIVATE",
          status: "PLANNING",
        },
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.payload);
      expect(body.data.visibility).toBe("PRIVATE");
      privateProjectId = body.data.id;
    });
  });

  describe("2. Visibility & Access Guards", () => {
    it("should allow unauthenticated access to PUBLIC projects", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/projects/${publicProjectId}`,
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.title).toBe("Autonomous Drone Navigation");
    });

    it("should forbid unaffiliated student from viewing a PRIVATE project with 403 Forbidden", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/projects/${privateProjectId}`,
        headers: { authorization: `Bearer ${unaffiliatedToken}` },
      });

      expect(res.statusCode).toBe(403);
      const body = JSON.parse(res.payload);
      expect(body.error.message).toContain("private");
    });

    it("should allow project owner to access their PRIVATE project", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/projects/${privateProjectId}`,
        headers: { authorization: `Bearer ${ownerToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data.userRole).toBe("OWNER");
    });

    it("should allow an ADMIN to access any project regardless of visibility", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/projects/${privateProjectId}`,
        headers: { authorization: `Bearer ${adminToken}` },
      });

      expect(res.statusCode).toBe(200);
    });
  });

  describe("3. Project Updates & Authorization", () => {
    it("should allow project owner to update project details", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/v1/projects/${publicProjectId}`,
        headers: { authorization: `Bearer ${ownerToken}` },
        payload: {
          technologies: "Python, C++, ROS2, OpenCV, PyTorch, TensorRT",
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data.technologies).toContain("TensorRT");
    });

    it("should prevent unaffiliated student from modifying project with 403 Forbidden", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/v1/projects/${publicProjectId}`,
        headers: { authorization: `Bearer ${unaffiliatedToken}` },
        payload: {
          title: "Malicious Takeover",
        },
      });

      expect(res.statusCode).toBe(403);
    });
  });

  describe("4. Collaborator Invitations & Team Onboarding", () => {
    it("should allow project owner to invite a student by email", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/projects/${publicProjectId}/invitations`,
        headers: { authorization: `Bearer ${ownerToken}` },
        payload: {
          email: "proj_collab_test@university.edu",
        },
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.status).toBe("PENDING");
      expect(body.data.inviteeId).toBe(collaboratorId);

      invitationId = body.data.id;

      // Verify notification sent to collaborator
      const notif = await app.prisma.notification.findFirst({
        where: {
          userId: collaboratorId,
          type: "PROJECT_INVITATION",
        },
        orderBy: { createdAt: "desc" },
      });
      expect(notif).not.toBeNull();
      expect(notif?.message).toContain("invited you to join");
    });

    it("should reject duplicate pending invitation with 409 Conflict", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/projects/${publicProjectId}/invitations`,
        headers: { authorization: `Bearer ${ownerToken}` },
        payload: {
          email: "proj_collab_test@university.edu",
        },
      });

      expect(res.statusCode).toBe(409);
      const body = JSON.parse(res.payload);
      expect(body.error.message).toContain("already pending");
    });

    it("should allow invitee to see their pending invitations via /my-invitations", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/projects/my-invitations",
        headers: { authorization: `Bearer ${collaboratorToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.length).toBeGreaterThanOrEqual(1);
      const invite = body.data.find((i: any) => i.id === invitationId);
      expect(invite).toBeDefined();
      expect(invite.project.title).toBe("Autonomous Drone Navigation");
    });

    it("should allow invitee to accept invitation and join project team", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/projects/invitations/${invitationId}/respond`,
        headers: { authorization: `Bearer ${collaboratorToken}` },
        payload: { action: "ACCEPT" },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.member.role).toBe("CONTRIBUTOR");

      // Verify member record created in DB
      const mem = await app.prisma.projectMember.findUnique({
        where: {
          projectId_userId: { projectId: publicProjectId, userId: collaboratorId },
        },
      });
      expect(mem).not.toBeNull();
      expect(mem?.role).toBe("CONTRIBUTOR");
    });
  });

  describe("5. Role Promotion & Team Management", () => {
    it("should allow owner to promote member to MAINTAINER", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/v1/projects/${publicProjectId}/members/${collaboratorId}`,
        headers: { authorization: `Bearer ${ownerToken}` },
        payload: { role: "MAINTAINER" },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data.role).toBe("MAINTAINER");
    });

    it("should prevent regular contributor from modifying team roles", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/v1/projects/${publicProjectId}/members/${ownerId}`,
        headers: { authorization: `Bearer ${unaffiliatedToken}` },
        payload: { role: "CONTRIBUTOR" },
      });

      expect(res.statusCode).toBe(403);
    });
  });

  describe("6. Kanban Task Board Workflow", () => {
    it("should allow a team member to create a new task", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/projects/${publicProjectId}/tasks`,
        headers: { authorization: `Bearer ${ownerToken}` },
        payload: {
          title: "Implement Optical Flow Odometry",
          description: "Integrate Lucas-Kanade optical flow for downward camera velocity estimation.",
          priority: "HIGH",
          status: "TODO",
          assigneeId: collaboratorId,
        },
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.title).toBe("Implement Optical Flow Odometry");
      expect(body.data.status).toBe("TODO");
      expect(body.data.priority).toBe("HIGH");
      expect(body.data.assignee.id).toBe(collaboratorId);

      createdTaskId = body.data.id;

      // Verify notification sent to assignee
      const taskNotif = await app.prisma.notification.findFirst({
        where: {
          userId: collaboratorId,
          type: "TASK_ASSIGNED",
        },
        orderBy: { createdAt: "desc" },
      });
      expect(taskNotif).not.toBeNull();
      expect(taskNotif?.message).toContain("assigned you");
    });

    it("should reject task creation from non-member with 403 Forbidden", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/projects/${publicProjectId}/tasks`,
        headers: { authorization: `Bearer ${unaffiliatedToken}` },
        payload: {
          title: "Unauthorized Task Injection",
        },
      });

      expect(res.statusCode).toBe(403);
    });

    it("should allow team member to update task status (move to IN_PROGRESS and then DONE)", async () => {
      // 1. Move to IN_PROGRESS
      const res1 = await app.inject({
        method: "PATCH",
        url: `/api/v1/projects/${publicProjectId}/tasks/${createdTaskId}`,
        headers: { authorization: `Bearer ${collaboratorToken}` },
        payload: { status: "IN_PROGRESS" },
      });

      expect(res1.statusCode).toBe(200);
      const body1 = JSON.parse(res1.payload);
      expect(body1.data.status).toBe("IN_PROGRESS");

      // 2. Move to DONE (sets completedAt automatically)
      const res2 = await app.inject({
        method: "PATCH",
        url: `/api/v1/projects/${publicProjectId}/tasks/${createdTaskId}`,
        headers: { authorization: `Bearer ${collaboratorToken}` },
        payload: { status: "DONE" },
      });

      expect(res2.statusCode).toBe(200);
      const body2 = JSON.parse(res2.payload);
      expect(body2.data.status).toBe("DONE");
      expect(body2.data.completedAt).toBeDefined();
    });

    it("should list tasks for project board with filters", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/projects/${publicProjectId}/tasks?status=DONE`,
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.length).toBeGreaterThanOrEqual(1);
      expect(body.data[0].id).toBe(createdTaskId);
    });
  });

  describe("7. Member Leaving & Owner Protection", () => {
    it("should prevent project owner from leaving without transferring ownership with 400 Bad Request", async () => {
      const res = await app.inject({
        method: "DELETE",
        url: `/api/v1/projects/${publicProjectId}/members/${ownerId}`,
        headers: { authorization: `Bearer ${ownerToken}` },
      });

      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.payload);
      expect(body.error.message).toContain("owner cannot leave");
    });

    it("should allow a collaborator to leave the project team", async () => {
      const res = await app.inject({
        method: "DELETE",
        url: `/api/v1/projects/${publicProjectId}/members/${collaboratorId}`,
        headers: { authorization: `Bearer ${collaboratorToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);

      const mem = await app.prisma.projectMember.findUnique({
        where: {
          projectId_userId: { projectId: publicProjectId, userId: collaboratorId },
        },
      });
      expect(mem).toBeNull();
    });

    it("should return projects where user is owner or member via /my-projects", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/projects/my-projects",
        headers: { authorization: `Bearer ${ownerToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.length).toBeGreaterThanOrEqual(1);
      const found = body.data.find((p: any) => p.project.id === publicProjectId);
      expect(found).toBeDefined();
      expect(found.role).toBe("OWNER");
    });
  });
});
