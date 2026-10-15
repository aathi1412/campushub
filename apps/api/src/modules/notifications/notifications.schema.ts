export const listNotificationsQuerySchema = {
  type: "object",
  properties: {
    unreadOnly: { type: "boolean" },
    type: {
      type: "string",
      enum: [
        "EVENT_REGISTRATION",
        "EVENT_CANCELLED",
        "CLUB_MEMBERSHIP_UPDATE",
        "PROJECT_INVITATION",
        "TASK_ASSIGNED",
        "COMMUNITY_ANNOUNCEMENT",
        "GENERAL",
      ],
    },
    page: { type: "integer", minimum: 1, default: 1 },
    limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
  },
  additionalProperties: false,
} as const;

export const notificationIdParamsSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "string", format: "uuid" },
  },
  additionalProperties: false,
} as const;

export const broadcastNotificationSchema = {
  type: "object",
  required: ["title", "message"],
  properties: {
    title: { type: "string", minLength: 3, maxLength: 200 },
    message: { type: "string", minLength: 5, maxLength: 2000 },
    type: {
      type: "string",
      enum: [
        "EVENT_REGISTRATION",
        "EVENT_CANCELLED",
        "CLUB_MEMBERSHIP_UPDATE",
        "PROJECT_INVITATION",
        "TASK_ASSIGNED",
        "COMMUNITY_ANNOUNCEMENT",
        "GENERAL",
      ],
      default: "GENERAL",
    },
    link: { type: "string", maxLength: 500 },
    targetRole: {
      type: "string",
      enum: ["STUDENT", "CLUB_LEADER", "ADMIN"],
    },
    targetDepartment: { type: "string", maxLength: 100 },
  },
  additionalProperties: false,
} as const;
