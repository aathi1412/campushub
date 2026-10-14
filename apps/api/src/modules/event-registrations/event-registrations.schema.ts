import type { FastifySchema } from "fastify";

export const eventRegistrationParamsSchema: FastifySchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
    },
  },
};

export const updateAttendanceSchema: FastifySchema = {
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
    required: ["status"],
    additionalProperties: false,
    properties: {
      status: {
        type: "string",
        enum: ["REGISTERED", "ATTENDED", "CANCELLED"],
      },
    },
  },
};

export const listParticipantsQuerySchema: FastifySchema = {
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
      status: { type: "string", enum: ["REGISTERED", "ATTENDED", "CANCELLED"] },
      search: { type: "string", maxLength: 100 },
    },
  },
};

export interface ListParticipantsQuery {
  page?: number;
  limit?: number;
  status?: "REGISTERED" | "ATTENDED" | "CANCELLED";
  search?: string;
}

export interface UpdateAttendanceBody {
  status: "REGISTERED" | "ATTENDED" | "CANCELLED";
}
