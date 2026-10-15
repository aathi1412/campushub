import { apiClient } from "../../services/api.js";
import type { ApiResponse } from "../../types/api.js";

export const notificationTypes = [
  "EVENT_REGISTRATION",
  "EVENT_CANCELLED",
  "CLUB_MEMBERSHIP_UPDATE",
  "PROJECT_INVITATION",
  "TASK_ASSIGNED",
  "COMMUNITY_ANNOUNCEMENT",
  "GENERAL",
] as const;

export type NotificationType = (typeof notificationTypes)[number];

export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface ListNotificationsParams {
  unreadOnly?: boolean;
  type?: NotificationType;
  page?: number;
  limit?: number;
}

export interface BroadcastPayload {
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
  targetRole?: "STUDENT" | "CLUB_LEADER" | "ADMIN";
  targetDepartment?: string;
}

export const notificationsApi = {
  async listNotifications(params?: ListNotificationsParams): Promise<{
    notifications: NotificationItem[];
    total: number;
    unreadCount: number;
    page: number;
    totalPages: number;
  }> {
    const res = await apiClient.get<ApiResponse<NotificationItem[]>>("/notifications", {
      params,
    });
    return {
      notifications: res.data.data,
      total: res.data.meta?.total ?? res.data.data.length,
      unreadCount: (res.data.meta as { unreadCount?: number })?.unreadCount ?? 0,
      page: res.data.meta?.page ?? 1,
      totalPages: res.data.meta?.totalPages ?? 1,
    };
  },

  async getUnreadCount(): Promise<number> {
    const res = await apiClient.get<ApiResponse<{ unreadCount: number }>>(
      "/notifications/unread-count"
    );
    return res.data.data.unreadCount;
  },

  async markAsRead(id: string): Promise<NotificationItem> {
    const res = await apiClient.patch<ApiResponse<NotificationItem>>(
      `/notifications/${id}/read`
    );
    return res.data.data;
  },

  async markAllAsRead(): Promise<number> {
    const res = await apiClient.patch<ApiResponse<{ updatedCount: number }>>(
      "/notifications/read-all"
    );
    return res.data.data.updatedCount;
  },

  async deleteNotification(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/notifications/${id}`);
  },

  async broadcast(payload: BroadcastPayload): Promise<{ recipientCount: number; message: string }> {
    const res = await apiClient.post<ApiResponse<{ recipientCount: number; message: string }>>(
      "/notifications/broadcast",
      payload
    );
    return res.data.data;
  },
};
