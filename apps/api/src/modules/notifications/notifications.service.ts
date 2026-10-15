import type { PrismaClient, Prisma } from "../../generated/prisma/client.js";
import type { NotificationType, Role } from "../../generated/prisma/enums.js";
import { NotFoundError } from "../../common/errors/index.js";

export interface ListNotificationsQuery {
  unreadOnly?: boolean;
  type?: NotificationType;
  page?: number;
  limit?: number;
}

export interface BroadcastNotificationBody {
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
  targetRole?: Role;
  targetDepartment?: string;
}

export class NotificationsService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * List notifications for a specific user with filtering and pagination
   */
  async listUserNotifications(userId: string, query: ListNotificationsQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      userId,
    };

    if (query.unreadOnly) {
      where.isRead = false;
    }

    if (query.type) {
      where.type = query.type;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      }),
    ]);

    return {
      notifications,
      total,
      unreadCount,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Get unread notification count for a user (fast polling endpoint)
   */
  async getUnreadCount(userId: string) {
    const unreadCount = await this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return { unreadCount };
  }

  /**
   * Mark a single notification as read (with user ownership check)
   */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundError("Notification not found");
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  /**
   * Mark all unread notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return {
      updatedCount: result.count,
    };
  }

  /**
   * Delete a notification (with user ownership check)
   */
  async deleteNotification(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundError("Notification not found");
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });

    return { success: true };
  }

  /**
   * Broadcast notification to all active users or targeted role/department (ADMIN only)
   */
  async broadcastNotification(payload: BroadcastNotificationBody) {
    const userWhere: Prisma.UserWhereInput = {
      status: "ACTIVE",
    };

    if (payload.targetRole) {
      userWhere.role = payload.targetRole;
    }

    if (payload.targetDepartment) {
      userWhere.department = { contains: payload.targetDepartment };
    }

    const recipients = await this.prisma.user.findMany({
      where: userWhere,
      select: { id: true },
    });

    if (recipients.length === 0) {
      return {
        recipientCount: 0,
        message: "No matching active users found for broadcast.",
      };
    }

    const notificationData = recipients.map((user) => ({
      userId: user.id,
      title: payload.title,
      message: payload.message,
      type: payload.type ?? ("GENERAL" as NotificationType),
      link: payload.link ?? null,
      isRead: false,
    }));

    await this.prisma.notification.createMany({
      data: notificationData,
    });

    return {
      recipientCount: recipients.length,
      message: `Broadcast delivered successfully to ${recipients.length} users.`,
    };
  }
}
