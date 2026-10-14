import type { FastifyPluginAsync } from "fastify";
import { EventRegistrationsService } from "./event-registrations.service.js";
import {
  eventRegistrationParamsSchema,
  updateAttendanceSchema,
  listParticipantsQuerySchema,
} from "./event-registrations.schema.js";
import type {
  ListParticipantsQuery,
  UpdateAttendanceBody,
} from "./event-registrations.schema.js";
import { sendSuccess, sendCreated } from "../../common/utils/response.js";
import type { RegistrationStatus } from "../../generated/prisma/enums.js";

export const eventRegistrationsRoutes: FastifyPluginAsync = async (fastify) => {
  const registrationsService = new EventRegistrationsService(fastify.prisma);

  // 1. Register authenticated user for an event (POST /api/v1/events/:id/register)
  fastify.post<{ Params: { id: string } }>(
    "/events/:id/register",
    {
      schema: eventRegistrationParamsSchema,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.sub;
      const eventId = request.params.id;

      const registration = await registrationsService.registerForEvent(userId, eventId);
      return sendCreated(reply, registration, "Successfully registered for event");
    }
  );

  // 2. Cancel registration (DELETE /api/v1/events/:id/register)
  fastify.delete<{ Params: { id: string } }>(
    "/events/:id/register",
    {
      schema: eventRegistrationParamsSchema,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.sub;
      const eventId = request.params.id;

      const updated = await registrationsService.cancelRegistration(userId, eventId);
      return sendSuccess(reply, updated, "Registration cancelled successfully");
    }
  );

  // 3. Check registration status (GET /api/v1/events/:id/registration-status)
  fastify.get<{ Params: { id: string } }>(
    "/events/:id/registration-status",
    {
      schema: eventRegistrationParamsSchema,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.sub;
      const eventId = request.params.id;

      const status = await registrationsService.getRegistrationStatus(userId, eventId);
      return sendSuccess(reply, status, "Registration status retrieved");
    }
  );

  // 4. Get event participants roster (GET /api/v1/events/:id/participants)
  fastify.get<{ Params: { id: string }; Querystring: ListParticipantsQuery }>(
    "/events/:id/participants",
    {
      schema: listParticipantsQuerySchema,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const currentUserId = request.user.sub;
      const currentUserRole = request.user.role;
      const eventId = request.params.id;

      const { participants, meta } = await registrationsService.getEventParticipants(
        eventId,
        currentUserId,
        currentUserRole,
        request.query
      );

      return sendSuccess(reply, participants, "Participants roster retrieved", 200, meta);
    }
  );

  // 5. Update attendance status (PATCH /api/v1/events/:id/attendance/:userId)
  fastify.patch<{ Params: { id: string; userId: string }; Body: UpdateAttendanceBody }>(
    "/events/:id/attendance/:userId",
    {
      schema: updateAttendanceSchema,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const currentUserId = request.user.sub;
      const currentUserRole = request.user.role;
      const { id: eventId, userId: targetUserId } = request.params;
      const { status } = request.body;

      const updated = await registrationsService.updateAttendance(
        eventId,
        targetUserId,
        currentUserId,
        currentUserRole,
        status as RegistrationStatus
      );

      return sendSuccess(reply, updated, `Participant marked as ${status}`);
    }
  );

  // 6. Get authenticated student's registrations (GET /api/v1/users/me/registrations)
  fastify.get(
    "/users/me/registrations",
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.sub;
      const registrations = await registrationsService.getMyRegistrations(userId);
      return sendSuccess(reply, registrations, "User registrations retrieved");
    }
  );
};
