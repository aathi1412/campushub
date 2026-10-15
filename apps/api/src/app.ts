import Fastify from "fastify";
import type { FastifyInstance, FastifyServerOptions } from "fastify";
import corsPlugin from "./plugins/cors.js";
import prismaPlugin from "./plugins/prisma.js";
import errorHandlerPlugin from "./plugins/errorHandler.js";
import authPlugin from "./plugins/auth.js";
import { healthRoutes } from "./modules/health/health.routes.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { usersRoutes } from "./modules/users/users.routes.js";
import { eventsRoutes } from "./modules/events/events.routes.js";
import { eventRegistrationsRoutes } from "./modules/event-registrations/event-registrations.routes.js";
import { clubsRoutes } from "./modules/clubs/clubs.routes.js";
import { projectsRoutes } from "./modules/projects/projects.routes.js";

export async function buildApp(opts: FastifyServerOptions = {}): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: {
      level: process.env.NODE_ENV === "test" ? "silent" : "info",
    },
    ajv: {
      customOptions: {
        removeAdditional: false,
      },
    },
    ...opts,
  });

  // Core Plugins
  await fastify.register(corsPlugin);
  await fastify.register(errorHandlerPlugin);
  await fastify.register(prismaPlugin);
  await fastify.register(authPlugin);

  // Health and System routes
  await fastify.register(healthRoutes);

  // Feature Modules (v1 API)
  await fastify.register(authRoutes, { prefix: "/api/v1/auth" });
  await fastify.register(usersRoutes, { prefix: "/api/v1/users" });
  await fastify.register(eventsRoutes, { prefix: "/api/v1/events" });
  await fastify.register(eventRegistrationsRoutes, { prefix: "/api/v1" });
  await fastify.register(clubsRoutes, { prefix: "/api/v1/clubs" });
  await fastify.register(projectsRoutes, { prefix: "/api/v1/projects" });

  return fastify;
}
