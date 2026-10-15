import { apiClient } from "../../services/api.js";
import type { ApiResponse } from "../../types/api.js";

export const clubCategories = [
  "Technology & Coding",
  "Arts & Culture",
  "Sports & Fitness",
  "Academics & Science",
  "Community & Social Service",
  "Entrepreneurship & Business",
  "Media & Publications",
  "Other",
] as const;

export type ClubCategory = (typeof clubCategories)[number];

export interface ClubLeader {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  department?: string | null;
}

export interface ClubUserMembership {
  id?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "LEFT";
  role: "MEMBER" | "OFFICER" | "LEADER";
  joinedAt?: string | null;
  createdAt?: string;
}

export interface Club {
  id: string;
  name: string;
  description: string;
  category: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  leader: ClubLeader;
  memberCount: number;
  eventCount: number;
  userMembership?: ClubUserMembership | null;
}

export interface ClubDetail extends Club {
  upcomingEvents: Array<{
    id: string;
    title: string;
    category: string;
    startTime: string;
    endTime: string;
    venue: string;
    capacity: number;
    bannerUrl?: string | null;
  }>;
}

export interface ClubMember {
  id: string;
  clubId: string;
  userId: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "LEFT";
  role: "MEMBER" | "OFFICER" | "LEADER";
  joinedAt?: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    department?: string | null;
    yearOfStudy?: number | null;
    role: string;
  };
}

export interface UserClubItem {
  membershipId: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "LEFT";
  role: "MEMBER" | "OFFICER" | "LEADER";
  joinedAt?: string | null;
  createdAt: string;
  club: Club;
}

export interface ListClubsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  isActive?: boolean;
  sortBy?: "name" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface ListClubMembersParams {
  page?: number;
  limit?: number;
  status?: "PENDING" | "APPROVED" | "REJECTED" | "LEFT";
  role?: "MEMBER" | "OFFICER" | "LEADER";
  search?: string;
}

export interface CreateClubPayload {
  name: string;
  description: string;
  category: string;
  logoUrl?: string;
  bannerUrl?: string;
}

export interface UpdateClubPayload {
  name?: string;
  description?: string;
  category?: string;
  logoUrl?: string;
  bannerUrl?: string;
  isActive?: boolean;
}

export interface UpdateMemberPayload {
  status?: "APPROVED" | "REJECTED";
  role?: "MEMBER" | "OFFICER";
}

export const clubsApi = {
  // 1. List clubs
  async listClubs(params: ListClubsParams = {}) {
    const res = await apiClient.get<ApiResponse<Club[]>>("/clubs", { params });
    return res.data;
  },

  // 2. Get single club
  async getClubById(id: string) {
    const res = await apiClient.get<ApiResponse<ClubDetail>>(`/clubs/${id}`);
    return res.data.data;
  },

  // 3. Create club
  async createClub(payload: CreateClubPayload) {
    const res = await apiClient.post<ApiResponse<Club>>("/clubs", payload);
    return res.data.data;
  },

  // 4. Update club
  async updateClub(id: string, payload: UpdateClubPayload) {
    const res = await apiClient.patch<ApiResponse<Club>>(`/clubs/${id}`, payload);
    return res.data.data;
  },

  // 5. Deactivate club
  async deleteClub(id: string) {
    const res = await apiClient.delete<ApiResponse<{ message: string }>>(`/clubs/${id}`);
    return res.data;
  },

  // 6. Join club
  async joinClub(id: string) {
    const res = await apiClient.post<ApiResponse<ClubUserMembership>>(`/clubs/${id}/join`);
    return res.data;
  },

  // 7. Leave club
  async leaveClub(id: string) {
    const res = await apiClient.delete<ApiResponse<{ message: string }>>(`/clubs/${id}/leave`);
    return res.data;
  },

  // 8. List club members
  async listClubMembers(id: string, params: ListClubMembersParams = {}) {
    const res = await apiClient.get<ApiResponse<ClubMember[]>>(`/clubs/${id}/members`, { params });
    return res.data;
  },

  // 9. Update club member status or role
  async updateMember(id: string, userId: string, payload: UpdateMemberPayload) {
    const res = await apiClient.patch<ApiResponse<ClubMember>>(`/clubs/${id}/members/${userId}`, payload);
    return res.data.data;
  },

  // 10. Get current user's clubs
  async getMyClubs() {
    const res = await apiClient.get<ApiResponse<UserClubItem[]>>("/clubs/my-memberships");
    return res.data.data;
  },
};
