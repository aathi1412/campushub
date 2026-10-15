import type { FastifyPluginAsync } from "fastify";
import { ClubsService } from "./clubs.service.js";
import {
  createClubSchema,
  updateClubSchema,
  getClubParamsSchema,
  listClubsQuerySchema,
  listClubMembersQuerySchema,
  updateMemberStatusRoleSchema,
} from "./clubs.schema.js";
import type {
  CreateClubBody,
  UpdateClubBody,
  ListClubsQuery,
  ListClubMembersQuery,
  UpdateMemberStatusRoleBody,
} from "./clubs.schema.js";
import { sendSuccess, sendCreated } from "../../common/utils/response.js";

export const clubsRoutes: FastifyPluginAsync = async (fastify) => {
  const clubsService = new ClubsService(fastify.prisma);

  // Helper for optional JWT verification
  const optionalAuthenticate = async (request: any) => {
    try {
      if (request.headers.authorization) {
        await request.jwtVerify();
      }
    } catch {
      // Ignored for optional authentication
    }
  };

  // 1. List all clubs (Public with optional auth)
  fastify.get<{ Querystring: ListClubsQuery }>(
    "/",
    {
      schema: listClubsQuerySchema,
      preHandler: [optionalAuthenticate],
    },
    async (request, reply) => {
      const currentUserId = request.user?.sub;
      const currentUserRole = request.user?.role;

      const { clubs, meta } = await clubsService.listClubs(
        request.query,
        currentUserId,
        currentUserRole
      );

      return sendSuccess(reply, clubs, "Clubs retrieved successfully", 200, meta);
    }
  );

  // 2. Get current user's clubs and memberships (Authenticated)
  fastify.get(
    "/my-memberships",
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const currentUserId = request.user.sub;
      const userClubs = await clubsService.getUserClubs(currentUserId);
      return sendSuccess(reply, userClubs, "User memberships retrieved successfully");
    }
  );

  // 3. Create a new club (CLUB_LEADER or ADMIN only)
  fastify.post<{ Body: CreateClubBody }>(
    "/",
    {
      schema: createClubSchema,
      preHandler: [fastify.authenticate, fastify.authorize(["CLUB_LEADER", "ADMIN"])],
    },
    async (request, reply) => {
      const currentUserId = request.user.sub;
      const club = await clubsService.createClub(currentUserId, request.body);
      return sendCreated(reply, club, "Club created successfully");
    }
  );

  // 4. Get club details by ID (Public with optional auth)
  fastify.get<{ Params: { id: string } }>(
    "/:id",
    {
      schema: getClubParamsSchema,
      preHandler: [optionalAuthenticate],
    },
    async (request, reply) => {
      const currentUserId = request.user?.sub;
      const club = await clubsService.getClubById(request.params.id, currentUserId);
      return sendSuccess(reply, club, "Club details retrieved successfully");
    }
  );

  // 5. Update club details (Leader, Officer, or Admin)
  fastify.patch<{ Params: { id: string }; Body: UpdateClubBody }>(
    "/:id",
    {
      schema: updateClubSchema,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const currentUserId = request.user.sub;
      const currentUserRole = request.user.role;

      const updatedClub = await clubsService.updateClub(
        request.params.id,
        currentUserId,
        currentUserRole,
        request.body
      );

      return sendSuccess(reply, updatedClub, "Club updated successfully");
    }
  );

  // 6. Deactivate / Delete club (Leader or Admin)
  fastify.delete<{ Params: { id: string } }>(
    "/:id",
    {
      schema: getClubParamsSchema,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const currentUserId = request.user.sub;
      const currentUserRole = request.user.role;

      const result = await clubsService.deleteClub(
        request.params.id,
        currentUserId,
        currentUserRole
      );

      return sendSuccess(reply, result, "Club deactivated successfully");
    }
  );

  // 7. Request to join a club (Authenticated Student / User)
  fastify.post<{ Params: { id: string } }>(
    "/:id/join",
    {
      schema: getClubParamsSchema,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const currentUserId = request.user.sub;
      const result = await clubsService.joinClub(request.params.id, currentUserId);
      return sendSuccess(reply, result.membership, result.message, 200);
    }
  );

  // 8. Leave a club (Authenticated Member)
  fastify.delete<{ Params: { id: string } }>(
    "/:id/leave",
    {
      schema: getClubParamsSchema,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const currentUserId = request.user.sub;
      const result = await clubsService.leaveClub(request.params.id, currentUserId);
      return sendSuccess(reply, result, result.message);
    }
  );

  // 9. List club members (Public sees APPROVED, Leader/Officer/Admin can filter all)
  fastify.get<{ Params: { id: string }; Querystring: ListClubMembersQuery }>(
    "/:id/members",
    {
      schema: listClubMembersQuerySchema,
      preHandler: [optionalAuthenticate],
    },
    async (request, reply) => {
      const currentUserId = request.user?.sub;
      const currentUserRole = request.user?.role;

      const { members, meta } = await clubsService.listClubMembers(
        request.params.id,
        request.query,
        currentUserId,
        currentUserRole
      );

      return sendSuccess(reply, members, "Club members retrieved successfully", 200, meta);
    }
  );

  // 10. Update member status (Approve/Reject) or Role (Member/Officer)
  fastify.patch<{
    Params: { id: string; userId: string };
    Body: UpdateMemberStatusRoleBody;
  }>(
    "/:id/members/:userId",
    {
      schema: updateMemberStatusRoleSchema,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const currentUserId = request.user.sub;
      const currentUserRole = request.user.role;

      const updatedMember = await clubsService.updateMember(
        request.params.id,
        request.params.userId,
        currentUserId,
        currentUserRole,
        request.body
      );

      return sendSuccess(reply, updatedMember, "Member updated successfully");
    }
  );
};
