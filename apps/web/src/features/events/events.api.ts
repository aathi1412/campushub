import { apiClient } from "../../services/api.js";
import type { ApiResponse } from "../../types/api.js";

export type EventCategory =
  | "ACADEMIC"
  | "CULTURAL"
  | "SPORTS"
  | "TECHNICAL"
  | "WORKSHOP"
  | "OTHER";

export type EventStatus = "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED";

export interface EventOrganizer {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  department?: string | null;
}

export interface EventClub {
  id: string;
  name: string;
  logoUrl?: string | null;
}

export interface CampusEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  venue: string;
  startTime: string;
  endTime: string;
  registrationDeadline: string;
  capacity: number;
  bannerUrl?: string | null;
  status: EventStatus;
  organizerId: string;
  organizer: EventOrganizer;
  clubId?: string | null;
  club?: EventClub | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    registrations: number;
  };
}

export interface CreateEventPayload {
  title: string;
  description: string;
  category: EventCategory;
  venue: string;
  startTime: string;
  endTime: string;
  registrationDeadline: string;
  capacity: number;
  bannerUrl?: string;
  status?: "DRAFT" | "PUBLISHED";
  clubId?: string;
}

export interface UpdateEventPayload {
  title?: string;
  description?: string;
  category?: EventCategory;
  venue?: string;
  startTime?: string;
  endTime?: string;
  registrationDeadline?: string;
  capacity?: number;
  bannerUrl?: string;
  status?: EventStatus;
  clubId?: string;
}

export interface ListEventsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: EventCategory;
  status?: EventStatus;
  timeframe?: "upcoming" | "past" | "all";
  organizerId?: string;
  clubId?: string;
  sortBy?: "startTime" | "createdAt" | "title";
  sortOrder?: "asc" | "desc";
}

export async function listEventsApi(params?: ListEventsParams): Promise<ApiResponse<CampusEvent[]>> {
  const response = await apiClient.get<ApiResponse<CampusEvent[]>>("/events", { params });
  return response.data;
}

export async function getEventByIdApi(id: string): Promise<ApiResponse<CampusEvent>> {
  const response = await apiClient.get<ApiResponse<CampusEvent>>(`/events/${id}`);
  return response.data;
}

export async function createEventApi(payload: CreateEventPayload): Promise<ApiResponse<CampusEvent>> {
  const response = await apiClient.post<ApiResponse<CampusEvent>>("/events", payload);
  return response.data;
}

export async function updateEventApi(id: string, payload: UpdateEventPayload): Promise<ApiResponse<CampusEvent>> {
  const response = await apiClient.patch<ApiResponse<CampusEvent>>(`/events/${id}`, payload);
  return response.data;
}

export async function deleteEventApi(id: string): Promise<ApiResponse<{ status: string; message: string }>> {
  const response = await apiClient.delete<ApiResponse<{ status: string; message: string }>>(`/events/${id}`);
  return response.data;
}
