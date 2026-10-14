import Fastify from "fastify";
import type { FastifyInstance, FastifyServerOptions } from "fastify";
import corsPlugin from "./plugins/cors.js";
import prismaPlugin from "./plugins/prisma.js";
import errorHandlerPlugin from "./plugins/errorHandler.js";
import { healthRoutes } from "./modules/health/health.routes.js";

export async function buildApp(opts: FastifyServerOptions = {}): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: {
      level: process.env.NODE_ENV === "test" ? "silent" : "info",
    },
    ...opts,
  });

  // Core Plugins
  await fastify.register(corsPlugin);
  await fastify.register(errorHandlerPlugin);
  await fastify.register(prismaPlugin);

  // Health and System routes
  await fastify.register(healthRoutes);

  return fastify;
}
