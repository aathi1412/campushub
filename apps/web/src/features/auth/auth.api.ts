import { apiClient, setAccessToken } from "../../services/api.js";
import type { ApiResponse } from "../../types/api.js";

export type UserRole = "STUDENT" | "CLUB_LEADER" | "ADMIN";
export type AccountStatus = "ACTIVE" | "SUSPENDED" | "PENDING";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: AccountStatus;
  avatarUrl?: string | null;
  department?: string | null;
  yearOfStudy?: number | null;
  bio?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface RegisterPayload {
  email: string;
  name: string;
  password: string;
  department?: string;
  yearOfStudy?: number;
  bio?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponseData {
  user: UserProfile;
  accessToken: string;
}

export interface UpdateProfilePayload {
  name?: string;
  department?: string;
  yearOfStudy?: number;
  bio?: string;
  avatarUrl?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export async function registerApi(payload: RegisterPayload): Promise<ApiResponse<UserProfile>> {
  const response = await apiClient.post<ApiResponse<UserProfile>>("/auth/register", payload);
  return response.data;
}

export async function loginApi(payload: LoginPayload): Promise<ApiResponse<AuthResponseData>> {
  const response = await apiClient.post<ApiResponse<AuthResponseData>>("/auth/login", payload);
  setAccessToken(response.data.data.accessToken);
  return response.data;
}

export async function refreshApi(): Promise<ApiResponse<AuthResponseData>> {
  const response = await apiClient.post<ApiResponse<AuthResponseData>>("/auth/refresh");
  setAccessToken(response.data.data.accessToken);
  return response.data;
}

export async function logoutApi(): Promise<ApiResponse<null>> {
  try {
    const response = await apiClient.post<ApiResponse<null>>("/auth/logout");
    return response.data;
  } finally {
    setAccessToken(null);
  }
}

export async function getMeApi(): Promise<ApiResponse<UserProfile>> {
  const response = await apiClient.get<ApiResponse<UserProfile>>("/auth/me");
  return response.data;
}

export async function updateProfileApi(payload: UpdateProfilePayload): Promise<ApiResponse<UserProfile>> {
  const response = await apiClient.patch<ApiResponse<UserProfile>>("/users/profile", payload);
  return response.data;
}

export async function changePasswordApi(payload: ChangePasswordPayload): Promise<ApiResponse<null>> {
  const response = await apiClient.post<ApiResponse<null>>("/users/change-password", payload);
  return response.data;
}
