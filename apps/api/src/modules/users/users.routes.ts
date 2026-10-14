import type { FastifyPluginAsync } from "fastify";
import { AuthService } from "../auth/auth.service.js";
import { updateProfileSchema, changePasswordSchema } from "../auth/auth.schema.js";
import type { UpdateProfileBody, ChangePasswordBody } from "../auth/auth.schema.js";
import { sendSuccess } from "../../common/utils/response.js";

const REFRESH_COOKIE_NAME = "campushub_refresh_token";

export const usersRoutes: FastifyPluginAsync = async (fastify) => {
  const authService = new AuthService(fastify.prisma);

  // 1. Get current user profile
  fastify.get(
    "/profile",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const user = await authService.getProfile(request.user.sub);
      return sendSuccess(reply, user, "Profile fetched successfully");
    }
  );

  // 2. Update current user profile
  fastify.patch<{ Body: UpdateProfileBody }>(
    "/profile",
    {
      preHandler: [fastify.authenticate],
      schema: updateProfileSchema,
    },
    async (request, reply) => {
      const updatedUser = await authService.updateProfile(request.user.sub, request.body);
      return sendSuccess(reply, updatedUser, "Profile updated successfully");
    }
  );

  // 3. Change password
  fastify.post<{ Body: ChangePasswordBody }>(
    "/change-password",
    {
      preHandler: [fastify.authenticate],
      schema: changePasswordSchema,
    },
    async (request, reply) => {
      await authService.changePassword(request.user.sub, request.body);

      // Clear refresh cookie so client re-authenticates with new password
      reply.clearCookie(REFRESH_COOKIE_NAME, {
        path: "/api/v1/auth",
      });

      return sendSuccess(reply, null, "Password changed successfully. Please log in again.");
    }
  );

  // 4. Admin-only check (RBAC verification)
  fastify.get(
    "/admin-check",
    {
      preHandler: [fastify.authorize(["ADMIN"])],
    },
    async (_request, reply) => {
      return sendSuccess(reply, { role: "ADMIN", access: "granted" }, "Admin access granted");
    }
  );
};
