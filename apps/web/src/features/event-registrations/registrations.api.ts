import { apiClient } from "../../services/api.js";
import type { ApiResponse } from "../../types/api.js";
import type { CampusEvent } from "../events/events.api.js";

export type RegistrationStatus = "REGISTERED" | "ATTENDED" | "CANCELLED";

export interface ParticipantUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  department?: string | null;
  yearOfStudy?: number | null;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  status: RegistrationStatus;
  registeredAt: string;
  attendedAt?: string | null;
  user?: ParticipantUser;
  event?: CampusEvent;
}

export interface RegistrationStatusResponse {
  isRegistered: boolean;
  registration: EventRegistration | null;
}

export interface ListParticipantsParams {
  page?: number;
  limit?: number;
  status?: RegistrationStatus;
  search?: string;
}

export async function registerEventApi(eventId: string): Promise<ApiResponse<EventRegistration>> {
  const response = await apiClient.post<ApiResponse<EventRegistration>>(`/events/${eventId}/register`);
  return response.data;
}

export async function cancelRegistrationApi(eventId: string): Promise<ApiResponse<EventRegistration>> {
  const response = await apiClient.delete<ApiResponse<EventRegistration>>(`/events/${eventId}/register`);
  return response.data;
}

export async function getRegistrationStatusApi(eventId: string): Promise<ApiResponse<RegistrationStatusResponse>> {
  const response = await apiClient.get<ApiResponse<RegistrationStatusResponse>>(`/events/${eventId}/registration-status`);
  return response.data;
}

export async function getMyRegistrationsApi(): Promise<ApiResponse<EventRegistration[]>> {
  const response = await apiClient.get<ApiResponse<EventRegistration[]>>("/users/me/registrations");
  return response.data;
}

export async function getEventParticipantsApi(
  eventId: string,
  params?: ListParticipantsParams
): Promise<ApiResponse<EventRegistration[]>> {
  const response = await apiClient.get<ApiResponse<EventRegistration[]>>(`/events/${eventId}/participants`, {
    params,
  });
  return response.data;
}

export async function updateAttendanceApi(
  eventId: string,
  userId: string,
  status: RegistrationStatus
): Promise<ApiResponse<EventRegistration>> {
  const response = await apiClient.patch<ApiResponse<EventRegistration>>(
    `/events/${eventId}/attendance/${userId}`,
    { status }
  );
  return response.data;
}
