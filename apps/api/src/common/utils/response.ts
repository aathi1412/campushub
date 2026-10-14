import type { FastifyReply } from "fastify";
import type { ApiResponse } from "../types/api.js";

export function sendSuccess<T>(
  reply: FastifyReply,
  data: T,
  message = "Operation completed successfully",
  statusCode = 200,
  meta?: ApiResponse<T>["meta"]
) {
  const payload: ApiResponse<T> = {
    success: true,
    data,
    message,
    ...(meta ? { meta } : {}),
  };
  return reply.status(statusCode).send(payload);
}

export function sendCreated<T>(
  reply: FastifyReply,
  data: T,
  message = "Resource created successfully"
) {
  return sendSuccess(reply, data, message, 201);
}
