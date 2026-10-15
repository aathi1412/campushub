import type { FastifySchema } from "fastify";

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

export const membershipStatuses = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "LEFT",
] as const;

export const clubMembershipRoles = [
  "MEMBER",
  "OFFICER",
  "LEADER",
] as const;

export type ClubCategory = (typeof clubCategories)[number];
export type MembershipStatus = (typeof membershipStatuses)[number];
export type ClubMembershipRole = (typeof clubMembershipRoles)[number];

export const createClubSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["name", "description", "category"],
    additionalProperties: false,
    properties: {
      name: { type: "string", minLength: 3, maxLength: 150 },
      description: { type: "string", minLength: 10 },
      category: { type: "string", minLength: 2, maxLength: 100 },
      logoUrl: { type: "string", maxLength: 500 },
      bannerUrl: { type: "string", maxLength: 500 },
    },
  },
};

export const updateClubSchema: FastifySchema = {
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
      name: { type: "string", minLength: 3, maxLength: 150 },
      description: { type: "string", minLength: 10 },
      category: { type: "string", minLength: 2, maxLength: 100 },
      logoUrl: { type: "string", maxLength: 500 },
      bannerUrl: { type: "string", maxLength: 500 },
      isActive: { type: "boolean" },
    },
  },
};

export const getClubParamsSchema: FastifySchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
    },
  },
};

export const listClubsQuerySchema: FastifySchema = {
  querystring: {
    type: "object",
    additionalProperties: false,
    properties: {
      page: { type: "integer", minimum: 1, default: 1 },
      limit: { type: "integer", minimum: 1, maximum: 100, default: 12 },
      search: { type: "string", maxLength: 100 },
      category: { type: "string", maxLength: 100 },
      isActive: { type: "boolean" },
      sortBy: { type: "string", enum: ["name", "createdAt", "updatedAt"], default: "name" },
      sortOrder: { type: "string", enum: ["asc", "desc"], default: "asc" },
    },
  },
};

export const listClubMembersQuerySchema: FastifySchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
    },
  },
  querystring: {
    type: "object",
    additionalProperties: false,
    properties: {
      page: { type: "integer", minimum: 1, default: 1 },
      limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
      status: { type: "string", enum: membershipStatuses },
      role: { type: "string", enum: clubMembershipRoles },
      search: { type: "string", maxLength: 100 },
    },
  },
};

export const updateMemberStatusRoleSchema: FastifySchema = {
  params: {
    type: "object",
    required: ["id", "userId"],
    properties: {
      id: { type: "string" },
      userId: { type: "string" },
    },
  },
  body: {
    type: "object",
    additionalProperties: false,
    properties: {
      status: { type: "string", enum: ["APPROVED", "REJECTED"] },
      role: { type: "string", enum: ["MEMBER", "OFFICER"] },
    },
  },
};

export interface CreateClubBody {
  name: string;
  description: string;
  category: string;
  logoUrl?: string;
  bannerUrl?: string;
}

export interface UpdateClubBody {
  name?: string;
  description?: string;
  category?: string;
  logoUrl?: string;
  bannerUrl?: string;
  isActive?: boolean;
}

export interface ListClubsQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  isActive?: boolean;
  sortBy?: "name" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface ListClubMembersQuery {
  page?: number;
  limit?: number;
  status?: MembershipStatus;
  role?: ClubMembershipRole;
  search?: string;
}

export interface UpdateMemberStatusRoleBody {
  status?: "APPROVED" | "REJECTED";
  role?: "MEMBER" | "OFFICER";
}
