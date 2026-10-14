import type { FastifyPluginAsync } from "fastify";
import { sendSuccess } from "../../common/utils/response.js";

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  // Liveness check
  fastify.get("/health", async (_request, reply) => {
    return sendSuccess(reply, { status: "ok" }, "Service is healthy");
  });

  // Detailed readiness check under /api/v1/health
  fastify.get("/api/v1/health", async (_request, reply) => {
    let databaseStatus = "unknown";
    let dbLatencyMs: number | null = null;

    try {
      const start = Date.now();
      await fastify.prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - start;
      databaseStatus = "connected";
    } catch {
      databaseStatus = "disconnected";
    }

    const memoryUsage = process.memoryUsage();

    const healthData = {
      status: databaseStatus === "connected" ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: "1.0.0",
      services: {
        database: {
          status: databaseStatus,
          latencyMs: dbLatencyMs,
        },
      },
      system: {
        nodeVersion: process.version,
        memory: {
          rssMb: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100,
          heapUsedMb: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
        },
      },
    };

    const statusCode = databaseStatus === "connected" ? 200 : 503;
    return sendSuccess(reply, healthData, "CampusHub API health check completed", statusCode);
  });
};
