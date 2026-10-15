import type { FastifyPluginAsync } from "fastify";
import { AdminService, type AdminUsersQuery } from "./admin.service.js";
import {
  adminUsersQuerySchema,
  adminUserIdParamsSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  moderatePostSchema,
  pinPostSchema,
} from "./admin.schema.js";
import type { Role, AccountStatus } from "../../generated/prisma/enums.js";
import { sendSuccess } from "../../common/utils/response.js";

export const adminRoutes: FastifyPluginAsync = async (fastify) => {
  const service = new AdminService(fastify.prisma);

  // Enforce ADMIN role across all admin routes
  fastify.addHook("preHandler", fastify.authenticate);
  fastify.addHook("preHandler", fastify.authorize(["ADMIN"]));

  /**
   * GET /api/v1/admin/analytics
   * Comprehensive system-wide telemetry & aggregation statistics
   */
  fastify.get("/analytics", async (_request, reply) => {
    const analytics = await service.getAnalytics();
    return sendSuccess(reply, analytics, "Platform analytics retrieved successfully");
  });

  /**
   * GET /api/v1/admin/users
   * List users with search, filtering, and role/membership statistics
   */
  fastify.get<{ Querystring: AdminUsersQuery }>(
    "/users",
    {
      schema: {
        querystring: adminUsersQuerySchema,
      },
    },
    async (request, reply) => {
      const result = await service.listUsers(request.query);
      return sendSuccess(reply, result.users, "Users retrieved successfully", 200, {
        total: result.total,
        page: result.page,
        limit: Math.max(1, Math.min(100, Number(request.query.limit) || 20)),
        totalPages: result.totalPages,
      });
    }
  );

  /**
   * PATCH /api/v1/admin/users/:id/role
   * Promote or demote user role
   */
  fastify.patch<{ Params: { id: string }; Body: { role: Role } }>(
    "/users/:id/role",
    {
      schema: {
        params: adminUserIdParamsSchema,
        body: updateUserRoleSchema,
      },
    },
    async (request, reply) => {
      const updated = await service.updateUserRole(
        request.user.sub,
        request.params.id,
        request.body.role
      );
      return sendSuccess(reply, updated, "User role updated successfully");
    }
  );

  /**
   * PATCH /api/v1/admin/users/:id/status
   * Activate or suspend user account
   */
  fastify.patch<{ Params: { id: string }; Body: { status: AccountStatus } }>(
    "/users/:id/status",
    {
      schema: {
        params: adminUserIdParamsSchema,
        body: updateUserStatusSchema,
      },
    },
    async (request, reply) => {
      const updated = await service.updateUserStatus(
        request.user.sub,
        request.params.id,
        request.body.status
      );
      return sendSuccess(reply, updated, "User account status updated successfully");
    }
  );

  /**
   * PATCH /api/v1/admin/posts/:id/moderate
   * Moderate or un-moderate a community post
   */
  fastify.patch<{ Params: { id: string }; Body: { isModerated: boolean } }>(
    "/posts/:id/moderate",
    {
      schema: {
        params: adminUserIdParamsSchema,
        body: moderatePostSchema,
      },
    },
    async (request, reply) => {
      const updated = await service.moderatePost(
        request.params.id,
        request.body.isModerated
      );
      return sendSuccess(reply, updated, "Post moderation status updated");
    }
  );

  /**
   * PATCH /api/v1/admin/posts/:id/pin
   * Pin or unpin a post
   */
  fastify.patch<{ Params: { id: string }; Body: { isPinned: boolean } }>(
    "/posts/:id/pin",
    {
      schema: {
        params: adminUserIdParamsSchema,
        body: pinPostSchema,
      },
    },
    async (request, reply) => {
      const updated = await service.pinPost(request.params.id, request.body.isPinned);
      return sendSuccess(reply, updated, "Post pin status updated");
    }
  );
};
