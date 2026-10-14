import fp from "fastify-plugin";
import type { FastifyError, FastifyPluginAsync } from "fastify";
import { AppError } from "../common/errors/index.js";
import { env } from "../config/env.js";

const errorHandlerPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler((error: FastifyError | AppError, request, reply) => {
    // Check for Fastify validation errors (AJV schema validation)
    if ("validation" in error && error.validation) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.message || "Request validation failed",
          details: error.validation,
        },
      });
    }

    // Custom Application errors
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error.details !== undefined ? { details: error.details } : {}),
        },
      });
    }

    // Default Fastify or unexpected errors
    fastify.log.error(error);

    const statusCode = typeof error.statusCode === "number" ? error.statusCode : 500;
    const isProduction = env.NODE_ENV === "production";

    const message =
      statusCode >= 500 && isProduction
        ? "An internal server error occurred"
        : error.message || "An unexpected error occurred";

    const code =
      statusCode === 400
        ? "BAD_REQUEST"
        : statusCode === 401
        ? "UNAUTHORIZED"
        : statusCode === 403
        ? "FORBIDDEN"
        : statusCode === 404
        ? "NOT_FOUND"
        : statusCode === 409
        ? "CONFLICT"
        : "INTERNAL_SERVER_ERROR";

    return reply.status(statusCode).send({
      success: false,
      error: {
        code,
        message,
      },
    });
  });

  // Default 404 Handler
  fastify.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: `Route ${request.method} ${request.url} not found`,
      },
    });
  });
};

export default fp(errorHandlerPlugin, {
  name: "errorHandler",
});
