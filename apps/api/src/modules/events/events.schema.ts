import type { FastifySchema } from "fastify";

export const eventCategories = [
  "ACADEMIC",
  "CULTURAL",
  "SPORTS",
  "TECHNICAL",
  "WORKSHOP",
  "OTHER",
] as const;

export const eventStatuses = [
  "DRAFT",
  "PUBLISHED",
  "CANCELLED",
  "COMPLETED",
] as const;

export const createEventSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["title", "description", "category", "venue", "startTime", "endTime", "registrationDeadline", "capacity"],
    additionalProperties: false,
    properties: {
      title: { type: "string", minLength: 3, maxLength: 255 },
      description: { type: "string", minLength: 10 },
      category: { type: "string", enum: eventCategories },
      venue: { type: "string", minLength: 2, maxLength: 255 },
      startTime: { type: "string", format: "date-time" },
      endTime: { type: "string", format: "date-time" },
      registrationDeadline: { type: "string", format: "date-time" },
      capacity: { type: "integer", minimum: 1, maximum: 100000 },
      bannerUrl: { type: "string", maxLength: 500 },
      status: { type: "string", enum: ["DRAFT", "PUBLISHED"] },
      clubId: { type: "string" },
    },
  },
};

export const updateEventSchema: FastifySchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
    },
  },
  body: {
    type: "object",
    additionalProperties: false,
    properties: {
      title: { type: "string", minLength: 3, maxLength: 255 },
      description: { type: "string", minLength: 10 },
      category: { type: "string", enum: eventCategories },
      venue: { type: "string", minLength: 2, maxLength: 255 },
      startTime: { type: "string", format: "date-time" },
      endTime: { type: "string", format: "date-time" },
      registrationDeadline: { type: "string", format: "date-time" },
      capacity: { type: "integer", minimum: 1, maximum: 100000 },
      bannerUrl: { type: "string", maxLength: 500 },
      status: { type: "string", enum: eventStatuses },
      clubId: { type: "string" },
    },
  },
};

export const getEventParamsSchema: FastifySchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
    },
  },
};

export const listEventsQuerySchema: FastifySchema = {
  querystring: {
    type: "object",
    additionalProperties: false,
    properties: {
      page: { type: "integer", minimum: 1, default: 1 },
      limit: { type: "integer", minimum: 1, maximum: 100, default: 10 },
      search: { type: "string", maxLength: 100 },
      category: { type: "string", enum: eventCategories },
      status: { type: "string", enum: eventStatuses },
      timeframe: { type: "string", enum: ["upcoming", "past", "all"], default: "all" },
      organizerId: { type: "string" },
      clubId: { type: "string" },
      sortBy: { type: "string", enum: ["startTime", "createdAt", "title"], default: "startTime" },
      sortOrder: { type: "string", enum: ["asc", "desc"], default: "asc" },
    },
  },
};

export type EventCategory = (typeof eventCategories)[number];
export type EventStatus = (typeof eventStatuses)[number];

export interface CreateEventBody {
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

export interface UpdateEventBody {
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

export interface ListEventsQuery {
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
