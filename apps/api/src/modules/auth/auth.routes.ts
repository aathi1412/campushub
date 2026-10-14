import type { FastifyPluginAsync } from "fastify";
import { AuthService } from "./auth.service.js";
import { registerSchema, loginSchema } from "./auth.schema.js";
import type { RegisterBody, LoginBody } from "./auth.schema.js";
import { sendSuccess, sendCreated } from "../../common/utils/response.js";
import { env } from "../../config/env.js";
import { UnauthorizedError } from "../../common/errors/index.js";

const REFRESH_COOKIE_NAME = "campushub_refresh_token";

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  const authService = new AuthService(fastify.prisma);

  // Helper to set HttpOnly refresh token cookie
  const setRefreshCookie = (reply: any, token: string, expires: Date) => {
    reply.setCookie(REFRESH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/v1/auth",
      expires,
    });
  };

  // Helper to clear refresh token cookie
  const clearRefreshCookie = (reply: any) => {
    reply.clearCookie(REFRESH_COOKIE_NAME, {
      path: "/api/v1/auth",
    });
  };

  // 1. User Registration
  fastify.post<{ Body: RegisterBody }>(
    "/register",
    { schema: registerSchema },
    async (request, reply) => {
      const user = await authService.register(request.body);
      return sendCreated(reply, user, "User registered successfully");
    }
  );

  // 2. User Login
  fastify.post<{ Body: LoginBody }>(
    "/login",
    { schema: loginSchema },
    async (request, reply) => {
      const { user, refreshToken, refreshTokenExpiresAt } = await authService.login(request.body);

      // Sign short-lived access token
      const accessToken = fastify.jwt.sign(
        {
          sub: user.id,
          email: user.email,
          role: user.role,
        },
        { expiresIn: env.JWT_EXPIRES_IN }
      );

      // Transmit refresh token via secure HttpOnly cookie
      setRefreshCookie(reply, refreshToken, refreshTokenExpiresAt);

      return sendSuccess(reply, { user, accessToken }, "Login successful");
    }
  );

  // 3. Refresh Access Token (Token rotation)
  fastify.post("/refresh", async (request, reply) => {
    const rawToken = request.cookies[REFRESH_COOKIE_NAME];
    if (!rawToken) {
      throw new UnauthorizedError("No refresh token provided");
    }

    const { user, newRefreshToken, refreshTokenExpiresAt } = await authService.refresh(rawToken);

    // Sign new access token
    const accessToken = fastify.jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    // Rotate refresh cookie
    setRefreshCookie(reply, newRefreshToken, refreshTokenExpiresAt);

    return sendSuccess(reply, { user, accessToken }, "Token refreshed successfully");
  });

  // 4. User Logout
  fastify.post("/logout", async (request, reply) => {
    const rawToken = request.cookies[REFRESH_COOKIE_NAME];
    if (rawToken) {
      await authService.logout(rawToken);
    }
    clearRefreshCookie(reply);
    return sendSuccess(reply, null, "Logout successful");
  });

  // 5. Get Authenticated Profile (/me)
  fastify.get(
    "/me",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const user = await authService.getProfile(request.user.sub);
      return sendSuccess(reply, user, "Profile retrieved successfully");
    }
  );
};
