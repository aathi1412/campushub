import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";

describe("Module 7: Campus Community & Polls Tests", () => {
  let app: FastifyInstance;

  let studentToken: string;
  let studentId: string;

  let student2Token: string;
  let student2Id: string;

  let leaderToken: string;
  let leaderId: string;

  let adminToken: string;

  let generalPostId: string;
  let lostFoundPostId: string;
  let announcementPostId: string;
  let activePollId: string;
  let activePollOption1Id: string;
  let activePollOption2Id: string;
  let createdCommentId: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // Clean up previous runs
    await app.prisma.communityComment.deleteMany({
      where: {
        author: { email: { in: ["comm_student1_test@university.edu", "comm_student2_test@university.edu", "comm_leader_test@university.edu", "comm_admin_test@university.edu"] } },
      },
    });
    await app.prisma.communityPost.deleteMany({
      where: {
        author: { email: { in: ["comm_student1_test@university.edu", "comm_student2_test@university.edu", "comm_leader_test@university.edu", "comm_admin_test@university.edu"] } },
      },
    });
    await app.prisma.pollVote.deleteMany({
      where: {
        user: { email: { in: ["comm_student1_test@university.edu", "comm_student2_test@university.edu", "comm_leader_test@university.edu", "comm_admin_test@university.edu"] } },
      },
    });
    await app.prisma.poll.deleteMany({
      where: {
        creator: { email: { in: ["comm_student1_test@university.edu", "comm_student2_test@university.edu", "comm_leader_test@university.edu", "comm_admin_test@university.edu"] } },
      },
    });

    // 1. Regular Student
    const student = await app.prisma.user.upsert({
      where: { email: "comm_student1_test@university.edu" },
      update: {},
      create: {
        email: "comm_student1_test@university.edu",
        name: "Chloe Community Student",
        password: "argon2id_dummy_hash",
        role: "STUDENT",
        department: "Civil Engineering",
      },
    });
    studentId = student.id;
    studentToken = app.jwt.sign({ sub: student.id, email: student.email, role: "STUDENT" });

    // 2. Student 2
    const student2 = await app.prisma.user.upsert({
      where: { email: "comm_student2_test@university.edu" },
      update: {},
      create: {
        email: "comm_student2_test@university.edu",
        name: "Shane Second Student",
        password: "argon2id_dummy_hash",
        role: "STUDENT",
        department: "Physics",
      },
    });
    student2Id = student2.id;
    student2Token = app.jwt.sign({ sub: student2.id, email: student2.email, role: "STUDENT" });

    // 3. Club Leader
    const leader = await app.prisma.user.upsert({
      where: { email: "comm_leader_test@university.edu" },
      update: {},
      create: {
        email: "comm_leader_test@university.edu",
        name: "Liam Leader",
        password: "argon2id_dummy_hash",
        role: "CLUB_LEADER",
        department: "Robotics",
      },
    });
    leaderId = leader.id;
    leaderToken = app.jwt.sign({ sub: leader.id, email: leader.email, role: "CLUB_LEADER" });

    // 4. Admin
    const admin = await app.prisma.user.upsert({
      where: { email: "comm_admin_test@university.edu" },
      update: {},
      create: {
        email: "comm_admin_test@university.edu",
        name: "Abby Admin",
        password: "argon2id_dummy_hash",
        role: "ADMIN",
      },
    });
    adminToken = app.jwt.sign({ sub: admin.id, email: admin.email, role: "ADMIN" });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe("1. Community Posts Creation & RBAC", () => {
    it("should allow a student to publish a GENERAL discussion post", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/community/posts",
        headers: { authorization: `Bearer ${studentToken}` },
        payload: {
          title: "Best study spots near campus library with quiet outlets?",
          content: "Looking for third-floor spots with good natural lighting and desk outlets for laptops.",
          type: "GENERAL",
        },
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.title).toContain("Best study spots");
      expect(body.data.type).toBe("GENERAL");
      expect(body.data.author.id).toBe(studentId);

      generalPostId = body.data.id;
    });

    it("should allow a student to publish a LOST_AND_FOUND post", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/community/posts",
        headers: { authorization: `Bearer ${studentToken}` },
        payload: {
          title: "Lost Blue Hydro Flask water bottle at Student Center",
          content: "Left near cafeteria table 4 with React and GitHub stickers on it.",
          type: "LOST_AND_FOUND",
        },
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.payload);
      expect(body.data.type).toBe("LOST_AND_FOUND");
      lostFoundPostId = body.data.id;
    });

    it("should forbid regular STUDENT from publishing an official ANNOUNCEMENT with 403 Forbidden", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/community/posts",
        headers: { authorization: `Bearer ${studentToken}` },
        payload: {
          title: "Campus-wide Electricity Maintenance Tonight",
          content: "Power will be cut at 10 PM.",
          type: "ANNOUNCEMENT",
        },
      });

      expect(res.statusCode).toBe(403);
      const body = JSON.parse(res.payload);
      expect(body.error.message).toContain("announcements");
    });

    it("should allow a CLUB_LEADER to publish an ANNOUNCEMENT", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/community/posts",
        headers: { authorization: `Bearer ${leaderToken}` },
        payload: {
          title: "Robotics Club Annual General Meeting & Board Elections",
          content: "Join us this Friday at 5 PM in Hall C for leadership elections and project showcases.",
          type: "ANNOUNCEMENT",
        },
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.payload);
      expect(body.data.type).toBe("ANNOUNCEMENT");
      announcementPostId = body.data.id;
    });

    it("should allow an ADMIN to pin a post", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/v1/community/posts/${announcementPostId}`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          isPinned: true,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data.isPinned).toBe(true);
    });
  });

  describe("2. Post Listing, Pinned Order & Search", () => {
    it("should list posts with pinned posts appearing first", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/community/posts",
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThanOrEqual(2);
      expect(body.data[0].id).toBe(announcementPostId);
      expect(body.data[0].isPinned).toBe(true);
    });

    it("should filter posts by type (e.g. LOST_AND_FOUND)", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/community/posts?type=LOST_AND_FOUND",
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data.length).toBeGreaterThanOrEqual(1);
      expect(body.data[0].type).toBe("LOST_AND_FOUND");
    });

    it("should search posts by keyword", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/community/posts?search=Hydro%20Flask",
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data.length).toBeGreaterThanOrEqual(1);
      expect(body.data.some((p: any) => p.id === lostFoundPostId)).toBe(true);
      expect(body.data[0].title).toContain("Hydro Flask");
    });
  });

  describe("3. Threaded Comments & Author Notification", () => {
    it("should allow a student to comment on a post and notify the author", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/community/posts/${generalPostId}/comments`,
        headers: { authorization: `Bearer ${student2Token}` },
        payload: {
          content: "The north wing of the 3rd floor has cubicles with dedicated surge outlets!",
        },
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.author.id).toBe(student2Id);
      expect(body.data.content).toContain("north wing");

      createdCommentId = body.data.id;

      // Verify notification sent to post author (student1)
      const notif = await app.prisma.notification.findFirst({
        where: {
          userId: studentId,
          type: "GENERAL",
        },
        orderBy: { createdAt: "desc" },
      });
      expect(notif).not.toBeNull();
      expect(notif?.message).toContain("commented on your post");
    });

    it("should include comments chronologically when getting post details by ID", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/community/posts/${generalPostId}`,
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data.commentCount).toBeGreaterThanOrEqual(1);
      expect(body.data.comments.length).toBeGreaterThanOrEqual(1);
      expect(body.data.comments[0].id).toBe(createdCommentId);
    });

    it("should allow comment author to delete their comment", async () => {
      const res = await app.inject({
        method: "DELETE",
        url: `/api/v1/community/posts/${generalPostId}/comments/${createdCommentId}`,
        headers: { authorization: `Bearer ${student2Token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);

      // Verify deletion in DB
      const comment = await app.prisma.communityComment.findUnique({
        where: { id: createdCommentId },
      });
      expect(comment).toBeNull();
    });
  });

  describe("4. Campus Polls & Expiration Validation", () => {
    it("should reject poll creation with past expiration date with 400 Bad Request", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/community/polls",
        headers: { authorization: `Bearer ${studentToken}` },
        payload: {
          question: "Should campus cafeteria extend operating hours to midnight?",
          options: ["Yes, absolutely", "No, keep current hours"],
          expiresAt: new Date(Date.now() - 100000).toISOString(), // in the past
        },
      });

      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.payload);
      expect(body.error.message).toContain("future");
    });

    it("should reject poll creation with fewer than 2 options with 400 Bad Request", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/community/polls",
        headers: { authorization: `Bearer ${studentToken}` },
        payload: {
          question: "Invalid single-choice poll",
          options: ["Only option"],
          expiresAt: new Date(Date.now() + 86400000 * 5).toISOString(),
        },
      });

      expect(res.statusCode).toBe(400);
    });

    it("should successfully create an active campus poll", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/community/polls",
        headers: { authorization: `Bearer ${studentToken}` },
        payload: {
          question: "Which programming language should be prioritized for next semester's hackathon?",
          options: ["TypeScript & Next.js", "Python & PyTorch", "Rust & WebAssembly", "Go & Distributed Systems"],
          expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
        },
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.question).toContain("hackathon");
      expect(body.data.options.length).toBe(4);
      expect(body.data.totalVotes).toBe(0);

      activePollId = body.data.id;
      activePollOption1Id = body.data.options[0].id;
      activePollOption2Id = body.data.options[1].id;
    });
  });

  describe("5. Voting & Atomic Single-Vote Protection", () => {
    it("should allow student 1 to cast a vote and update poll percentages", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/community/polls/${activePollId}/vote`,
        headers: { authorization: `Bearer ${studentToken}` },
        payload: {
          optionId: activePollOption1Id,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.totalVotes).toBe(1);
      expect(body.data.userVotedOptionId).toBe(activePollOption1Id);

      const votedOpt = body.data.options.find((o: any) => o.id === activePollOption1Id);
      expect(votedOpt.voteCount).toBe(1);
      expect(votedOpt.percentage).toBe(100);
    });

    it("should prevent duplicate voting from the same user with 409 Conflict", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/community/polls/${activePollId}/vote`,
        headers: { authorization: `Bearer ${studentToken}` },
        payload: {
          optionId: activePollOption2Id,
        },
      });

      expect(res.statusCode).toBe(409);
      const body = JSON.parse(res.payload);
      expect(body.error.message).toContain("already voted");
    });

    it("should allow student 2 to vote for Option 2 and recalculate 50-50 percentage split", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/community/polls/${activePollId}/vote`,
        headers: { authorization: `Bearer ${student2Token}` },
        payload: {
          optionId: activePollOption2Id,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data.totalVotes).toBe(2);

      const opt1 = body.data.options.find((o: any) => o.id === activePollOption1Id);
      const opt2 = body.data.options.find((o: any) => o.id === activePollOption2Id);
      expect(opt1.voteCount).toBe(1);
      expect(opt1.percentage).toBe(50);
      expect(opt2.voteCount).toBe(1);
      expect(opt2.percentage).toBe(50);
    });

    it("should return poll with user's voted option in GET /polls/:id", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/community/polls/${activePollId}`,
        headers: { authorization: `Bearer ${studentToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data.hasVoted).toBe(true);
      expect(body.data.userVotedOptionId).toBe(activePollOption1Id);
    });
  });
});
