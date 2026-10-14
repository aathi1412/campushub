import type { FastifyPluginAsync } from "fastify";
import { EventsService } from "./events.service.js";
import {
  createEventSchema,
  updateEventSchema,
  getEventParamsSchema,
  listEventsQuerySchema,
} from "./events.schema.js";
import type {
  CreateEventBody,
  UpdateEventBody,
  ListEventsQuery,
} from "./events.schema.js";
import { sendSuccess, sendCreated } from "../../common/utils/response.js";

export const eventsRoutes: FastifyPluginAsync = async (fastify) => {
  const eventsService = new EventsService(fastify.prisma);

  // Helper for optional JWT verification (doesn't fail if token absent)
  const optionalAuthenticate = async (request: any) => {
    try {
      if (request.headers.authorization) {
        await request.jwtVerify();
      }
    } catch {
      // Ignored for optional authentication
    }
  };

  // 1. List events (Public with optional auth)
  fastify.get<{ Querystring: ListEventsQuery }>(
    "/",
    {
      schema: listEventsQuerySchema,
      preHandler: [optionalAuthenticate],
    },
    async (request, reply) => {
      const currentUserId = request.user?.sub;
      const currentUserRole = request.user?.role;

      const { events, meta } = await eventsService.listEvents(
        request.query,
        currentUserId,
        currentUserRole
      );

      return sendSuccess(reply, events, "Events retrieved successfully", 200, meta);
    }
  );

  // 2. Get single event by ID (Public with optional auth)
  fastify.get<{ Params: { id: string } }>(
    "/:id",
    {
      schema: getEventParamsSchema,
      preHandler: [optionalAuthenticate],
    },
    async (request, reply) => {
      const currentUserId = request.user?.sub;
      const currentUserRole = request.user?.role;

      const event = await eventsService.getEventById(
        request.params.id,
        currentUserId,
        currentUserRole
      );

      return sendSuccess(reply, event, "Event retrieved successfully");
    }
  );

  // 3. Create Event (CLUB_LEADER or ADMIN)
  fastify.post<{ Body: CreateEventBody }>(
    "/",
    {
      schema: createEventSchema,
      preHandler: [fastify.authenticate, fastify.authorize(["CLUB_LEADER", "ADMIN"])],
    },
    async (request, reply) => {
      const organizerId = request.user.sub;
      const event = await eventsService.createEvent(organizerId, request.body);
      return sendCreated(reply, event, "Event created successfully");
    }
  );

  // 4. Update Event (Organizer or ADMIN)
  fastify.patch<{ Params: { id: string }; Body: UpdateEventBody }>(
    "/:id",
    {
      schema: updateEventSchema,
      preHandler: [fastify.authenticate, fastify.authorize(["CLUB_LEADER", "ADMIN"])],
    },
    async (request, reply) => {
      const userId = request.user.sub;
      const userRole = request.user.role;

      const updated = await eventsService.updateEvent(
        request.params.id,
        userId,
        userRole,
        request.body
      );

      return sendSuccess(reply, updated, "Event updated successfully");
    }
  );

  // 5. Delete or Cancel Event (Organizer or ADMIN)
  fastify.delete<{ Params: { id: string } }>(
    "/:id",
    {
      schema: getEventParamsSchema,
      preHandler: [fastify.authenticate, fastify.authorize(["CLUB_LEADER", "ADMIN"])],
    },
    async (request, reply) => {
      const userId = request.user.sub;
      const userRole = request.user.role;

      const result = await eventsService.deleteEvent(request.params.id, userId, userRole);
      return sendSuccess(reply, result, result.message);
    }
  );
};
