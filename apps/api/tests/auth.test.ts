import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";

describe("Module 2: Authentication, Authorization & Users Tests", () => {
  let app: FastifyInstance;
  const testEmail = "ch_student_test@university.edu";
  const testPassword = "CampusPassword123!";
  let accessToken: string;
  let refreshCookie: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // Clean up test users from previous test runs
    await app.prisma.user.deleteMany({
      where: {
        email: {
          in: [
            testEmail,
            "ch_student_test_2@university.edu",
            "ch_admin_test@university.edu",
          ],
        },
      },
    });
  }, 20000);

  afterAll(async () => {
    if (app?.prisma) {
      await app.prisma.user.deleteMany({
        where: {
          email: {
            in: [
              testEmail,
              "ch_student_test_2@university.edu",
              "ch_admin_test@university.edu",
            ],
          },
        },
      });
      await app.close();
    }
  });

  describe("1. User Registration", () => {
    it("should successfully register a student with default role and no password leak", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/register",
        payload: {
          email: testEmail.toUpperCase(), // tests email normalization
          name: "Student Test User",
          password: testPassword,
          department: "Computer Science",
          yearOfStudy: 2,
        },
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.email).toBe(testEmail);
      expect(body.data.role).toBe("STUDENT");
      expect(body.data.status).toBe("ACTIVE");
      expect(body.data.department).toBe("Computer Science");
      expect(body.data.password).toBeUndefined(); // never expose password

      // Verify Argon2id hash is stored in database
      const dbUser = await app.prisma.user.findUnique({
        where: { email: testEmail },
      });
      expect(dbUser).toBeDefined();
      expect(dbUser!.password).toMatch(/^\$argon2id\$/);
    });

    it("should reject duplicate email registration with 409 Conflict", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/register",
        payload: {
          email: testEmail,
          name: "Duplicate User",
          password: testPassword,
        },
      });

      expect(res.statusCode).toBe(409);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("CONFLICT");
      expect(body.error.message).toContain("already exists");
    });

    it("should reject registration with schema validation errors (e.g. password < 8 chars)", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/register",
        payload: {
          email: "invalid_password@university.edu",
          name: "Invalid User",
          password: "123", // too short
        },
      });

      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject registration when additional unexpected fields like role are supplied", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/register",
        payload: {
          email: "escalation@university.edu",
          name: "Hacker User",
          password: "StrongPassword123!",
          role: "ADMIN", // Forbidden public role elevation attempt
        },
      });

      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("2. User Login & Token Issuance", () => {
    it("should reject invalid password with generic 401 Unauthorized", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: {
          email: testEmail,
          password: "WrongPassword456!",
        },
      });

      expect(res.statusCode).toBe(401);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("UNAUTHORIZED");
      expect(body.error.message).toBe("Invalid email or password");
    });

    it("should reject unknown email with identical generic 401 Unauthorized", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: {
          email: "nonexistent@university.edu",
          password: "SomePassword123!",
        },
      });

      expect(res.statusCode).toBe(401);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("UNAUTHORIZED");
      expect(body.error.message).toBe("Invalid email or password");
    });

    it("should login successfully, return access token and set HttpOnly refresh cookie", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: {
          email: testEmail,
          password: testPassword,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.accessToken).toBeDefined();
      expect(body.data.user.email).toBe(testEmail);
      expect(body.data.user.role).toBe("STUDENT");

      accessToken = body.data.accessToken;

      // Verify Set-Cookie header for refresh token
      const setCookie = res.headers["set-cookie"];
      expect(setCookie).toBeDefined();
      expect(String(setCookie)).toContain("campushub_refresh_token=");
      expect(String(setCookie)).toContain("HttpOnly");
      expect(String(setCookie)).toContain("SameSite=Lax");

      // Extract raw cookie string for subsequent tests
      const cookieHeader = Array.isArray(setCookie) ? setCookie[0] : (setCookie as string);
      refreshCookie = cookieHeader.split(";")[0];
    });
  });

  describe("3. Authenticated Endpoints & Token Validation", () => {
    it("should reject /api/v1/auth/me without authorization header", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/auth/me",
      });

      expect(res.statusCode).toBe(401);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("UNAUTHORIZED");
    });

    it("should reject /api/v1/auth/me with invalid/malformed token", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/auth/me",
        headers: {
          authorization: "Bearer invalid.token.value",
        },
      });

      expect(res.statusCode).toBe(401);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(false);
    });

    it("should return user profile on /api/v1/auth/me with valid access token", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/auth/me",
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.email).toBe(testEmail);
      expect(body.data.role).toBe("STUDENT");
      expect(body.data.password).toBeUndefined();
    });
  });

  describe("4. Refresh Token Rotation & Session Management", () => {
    it("should refresh access token and rotate refresh cookie", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/refresh",
        headers: {
          cookie: refreshCookie,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.accessToken).toBeDefined();

      const newSetCookie = res.headers["set-cookie"];
      expect(newSetCookie).toBeDefined();

      const newCookieHeader = Array.isArray(newSetCookie) ? newSetCookie[0] : (newSetCookie as string);
      const newRefreshCookie = newCookieHeader.split(";")[0];
      expect(newRefreshCookie).not.toBe(refreshCookie); // Token was rotated

      refreshCookie = newRefreshCookie;
      accessToken = body.data.accessToken;
    });

    it("should reject refresh when no cookie is sent", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/refresh",
      });

      expect(res.statusCode).toBe(401);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(false);
    });
  });

  describe("5. Profile Updates and Password Change", () => {
    it("should update user profile details via PATCH /api/v1/users/profile", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: "/api/v1/users/profile",
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          name: "Updated Alice Student",
          bio: "Passionate about open-source campus software.",
          yearOfStudy: 3,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe("Updated Alice Student");
      expect(body.data.bio).toBe("Passionate about open-source campus software.");
      expect(body.data.yearOfStudy).toBe(3);
    });

    it("should reject password change with incorrect current password", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/users/change-password",
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          currentPassword: "IncorrectCurrentPassword!",
          newPassword: "BrandNewPassword123!",
        },
      });

      expect(res.statusCode).toBe(401);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain("Current password is incorrect");
    });

    it("should change password successfully, clear refresh cookie, and allow login with new password", async () => {
      const newPassword = "BrandNewPassword123!";

      const changeRes = await app.inject({
        method: "POST",
        url: "/api/v1/users/change-password",
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          currentPassword: testPassword,
          newPassword,
        },
      });

      expect(changeRes.statusCode).toBe(200);

      // Verify old password fails
      const failedLogin = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: {
          email: testEmail,
          password: testPassword,
        },
      });
      expect(failedLogin.statusCode).toBe(401);

      // Verify new password succeeds
      const successfulLogin = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: {
          email: testEmail,
          password: newPassword,
        },
      });
      expect(successfulLogin.statusCode).toBe(200);
      const loginBody = JSON.parse(successfulLogin.payload);
      expect(loginBody.success).toBe(true);
      expect(loginBody.data.accessToken).toBeDefined();

      // Update test variables for remaining tests
      accessToken = loginBody.data.accessToken;
      const setCookie = successfulLogin.headers["set-cookie"];
      const cookieHeader = Array.isArray(setCookie) ? setCookie[0] : (setCookie as string);
      refreshCookie = cookieHeader.split(";")[0];
    });
  });

  describe("6. Role-Based Access Control (RBAC Guard)", () => {
    it("should enforce role restrictions using fastify.authorize decorator", async () => {
      // Attempt to access with STUDENT token -> should be 403 Forbidden
      const studentRes = await app.inject({
        method: "GET",
        url: "/api/v1/users/admin-check",
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(studentRes.statusCode).toBe(403);
      const body = JSON.parse(studentRes.payload);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("FORBIDDEN");
      expect(body.error.message).toContain("Access denied");

      // Now create an ADMIN token and verify access
      const adminToken = app.jwt.sign({
        sub: "test-admin-uuid",
        email: "ch_admin_test@university.edu",
        role: "ADMIN",
      });

      const adminRes = await app.inject({
        method: "GET",
        url: "/api/v1/users/admin-check",
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(adminRes.statusCode).toBe(200);
      const adminBody = JSON.parse(adminRes.payload);
      expect(adminBody.success).toBe(true);
      expect(adminBody.data.role).toBe("ADMIN");
      expect(adminBody.data.access).toBe("granted");
    });
  });

  describe("7. Logout", () => {
    it("should logout successfully and clear the refresh cookie", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/logout",
        headers: {
          cookie: refreshCookie,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);

      const setCookie = res.headers["set-cookie"];
      expect(String(setCookie)).toContain("campushub_refresh_token=;");
    });
  });
});
