import type { FastifyPluginAsync } from "fastify";
import { NotificationsService, type ListNotificationsQuery, type BroadcastNotificationBody } from "./notifications.service.js";
import {
  listNotificationsQuerySchema,
  notificationIdParamsSchema,
  broadcastNotificationSchema,
} from "./notifications.schema.js";
import { sendSuccess } from "../../common/utils/response.js";

export const notificationsRoutes: FastifyPluginAsync = async (fastify) => {
  const service = new NotificationsService(fastify.prisma);

  /**
   * GET /api/v1/notifications
   * List current user's notifications (paginated, unread filter, type filter)
   */
  fastify.get<{ Querystring: ListNotificationsQuery }>(
    "/",
    {
      preHandler: [fastify.authenticate],
      schema: {
        querystring: listNotificationsQuerySchema,
      },
    },
    async (request, reply) => {
      const result = await service.listUserNotifications(request.user.sub, request.query);
      return sendSuccess(
        reply,
        result.notifications,
        "Notifications retrieved successfully",
        200,
        {
          total: result.total,
          page: result.page,
          limit: Math.max(1, Math.min(100, Number(request.query.limit) || 20)),
          totalPages: result.totalPages,
          unreadCount: result.unreadCount,
        }
      );
    }
  );

  /**
   * GET /api/v1/notifications/unread-count
   * Fast polling endpoint for notification bell badge
   */
  fastify.get(
    "/unread-count",
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const result = await service.getUnreadCount(request.user.sub);
      return sendSuccess(reply, result, "Unread count retrieved");
    }
  );

  /**
   * PATCH /api/v1/notifications/:id/read
   * Mark a single notification as read
   */
  fastify.patch<{ Params: { id: string } }>(
    "/:id/read",
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: notificationIdParamsSchema,
      },
    },
    async (request, reply) => {
      const notification = await service.markAsRead(request.params.id, request.user.sub);
      return sendSuccess(reply, notification, "Notification marked as read");
    }
  );

  /**
   * PATCH /api/v1/notifications/read-all
   * Mark all unread notifications as read for current user
   */
  fastify.patch(
    "/read-all",
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const result = await service.markAllAsRead(request.user.sub);
      return sendSuccess(reply, result, "All notifications marked as read");
    }
  );

  /**
   * DELETE /api/v1/notifications/:id
   * Delete a notification
   */
  fastify.delete<{ Params: { id: string } }>(
    "/:id",
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: notificationIdParamsSchema,
      },
    },
    async (request, reply) => {
      const result = await service.deleteNotification(request.params.id, request.user.sub);
      return sendSuccess(reply, result, "Notification deleted successfully");
    }
  );

  /**
   * POST /api/v1/notifications/broadcast
   * Broadcast an urgent alert / campus notification to all students (ADMIN only)
   */
  fastify.post<{ Body: BroadcastNotificationBody }>(
    "/broadcast",
    {
      preHandler: [fastify.authenticate, fastify.authorize(["ADMIN"])],
      schema: {
        body: broadcastNotificationSchema,
      },
    },
    async (request, reply) => {
      const result = await service.broadcastNotification(request.body);
      return sendSuccess(reply, result, result.message);
    }
  );
};
