import { apiClient } from "../../services/api.js";
import type { ApiResponse } from "../../types/api.js";

export interface UsersAnalytics {
  total: number;
  students: number;
  clubLeaders: number;
  admins: number;
  active: number;
  suspended: number;
  pending: number;
}

export interface EventsAnalytics {
  total: number;
  published: number;
  draft: number;
  completed: number;
  cancelled: number;
  totalRegistrations: number;
  attendedRegistrations: number;
  attendanceRatePercent: number;
}

export interface ClubsAnalytics {
  total: number;
  active: number;
  totalMemberships: number;
}

export interface ProjectsAnalytics {
  total: number;
  planning: number;
  inProgress: number;
  completed: number;
  archived: number;
  totalTasks: number;
}

export interface CommunityAnalytics {
  totalPosts: number;
  announcements: number;
  lostAndFound: number;
  activePolls: number;
  totalPollVotes: number;
}

export interface RecentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  department?: string | null;
  createdAt: string;
}

export interface RecentEvent {
  id: string;
  title: string;
  status: string;
  category: string;
  startTime: string;
  createdAt: string;
}

export interface AdminAnalyticsSummary {
  users: UsersAnalytics;
  events: EventsAnalytics;
  clubs: ClubsAnalytics;
  projects: ProjectsAnalytics;
  community: CommunityAnalytics;
  recentUsers: RecentUser[];
  recentEvents: RecentEvent[];
}

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "CLUB_LEADER" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED" | "PENDING";
  department?: string | null;
  yearOfStudy?: number | null;
  bio?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    ledClubs: number;
    clubMemberships: number;
    eventRegistrations: number;
    ownedProjects: number;
  };
}

export interface ListAdminUsersParams {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export const adminApi = {
  async getAnalytics(): Promise<AdminAnalyticsSummary> {
    const res = await apiClient.get<ApiResponse<AdminAnalyticsSummary>>("/admin/analytics");
    return res.data.data;
  },

  async listUsers(params?: ListAdminUsersParams): Promise<{
    users: AdminUserItem[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const res = await apiClient.get<ApiResponse<AdminUserItem[]>>("/admin/users", { params });
    return {
      users: res.data.data,
      total: res.data.meta?.total ?? res.data.data.length,
      page: res.data.meta?.page ?? 1,
      totalPages: res.data.meta?.totalPages ?? 1,
    };
  },

  async updateUserRole(
    userId: string,
    role: "STUDENT" | "CLUB_LEADER" | "ADMIN"
  ): Promise<AdminUserItem> {
    const res = await apiClient.patch<ApiResponse<AdminUserItem>>(
      `/admin/users/${userId}/role`,
      { role }
    );
    return res.data.data;
  },

  async updateUserStatus(
    userId: string,
    status: "ACTIVE" | "SUSPENDED" | "PENDING"
  ): Promise<AdminUserItem> {
    const res = await apiClient.patch<ApiResponse<AdminUserItem>>(
      `/admin/users/${userId}/status`,
      { status }
    );
    return res.data.data;
  },

  async moderatePost(postId: string, isModerated: boolean): Promise<void> {
    await apiClient.patch<ApiResponse<unknown>>(`/admin/posts/${postId}/moderate`, {
      isModerated,
    });
  },

  async pinPost(postId: string, isPinned: boolean): Promise<void> {
    await apiClient.patch<ApiResponse<unknown>>(`/admin/posts/${postId}/pin`, {
      isPinned,
    });
  },
};
