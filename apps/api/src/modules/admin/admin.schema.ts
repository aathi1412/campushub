export const adminUsersQuerySchema = {
  type: "object",
  properties: {
    search: { type: "string" },
    role: { type: "string", enum: ["STUDENT", "CLUB_LEADER", "ADMIN"] },
    status: { type: "string", enum: ["ACTIVE", "SUSPENDED", "PENDING"] },
    page: { type: "integer", minimum: 1, default: 1 },
    limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
  },
  additionalProperties: false,
} as const;

export const adminUserIdParamsSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "string", format: "uuid" },
  },
  additionalProperties: false,
} as const;

export const updateUserRoleSchema = {
  type: "object",
  required: ["role"],
  properties: {
    role: { type: "string", enum: ["STUDENT", "CLUB_LEADER", "ADMIN"] },
  },
  additionalProperties: false,
} as const;

export const updateUserStatusSchema = {
  type: "object",
  required: ["status"],
  properties: {
    status: { type: "string", enum: ["ACTIVE", "SUSPENDED", "PENDING"] },
  },
  additionalProperties: false,
} as const;

export const moderatePostSchema = {
  type: "object",
  required: ["isModerated"],
  properties: {
    isModerated: { type: "boolean" },
  },
  additionalProperties: false,
} as const;

export const pinPostSchema = {
  type: "object",
  required: ["isPinned"],
  properties: {
    isPinned: { type: "boolean" },
  },
  additionalProperties: false,
} as const;
