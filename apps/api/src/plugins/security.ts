import fp from "fastify-plugin";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import type { FastifyPluginAsync } from "fastify";
import { env } from "../config/env.js";

const securityPlugin: FastifyPluginAsync = async (fastify) => {
  // 1. Helmet: Sets secure HTTP response headers
  await fastify.register(helmet, {
    contentSecurityPolicy: env.NODE_ENV === "production" ? undefined : false,
    crossOriginEmbedderPolicy: false,
  });

  // 2. Rate Limiting: Protects against brute-force and DDoS
  const isTest = env.NODE_ENV === "test";

  await fastify.register(rateLimit, {
    max: isTest ? 10000 : 300,
    timeWindow: "1 minute",
    allowList: (req) => {
      // Exclude internal health checks from rate limiting
      return req.url === "/health" || req.url === "/health/ready" || req.url === "/health/live";
    },
    errorResponseBuilder: (_request, context) => ({
      success: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: `Too many requests from this IP. Rate limit exceeded, retry in ${context.after}.`,
      },
    }),
  });
};

export default fp(securityPlugin, {
  name: "security",
});
