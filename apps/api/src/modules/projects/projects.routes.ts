import type { FastifyPluginAsync } from "fastify";
import { ProjectsService } from "./projects.service.js";
import {
  createProjectSchema,
  updateProjectSchema,
  getProjectParamsSchema,
  listProjectsQuerySchema,
  sendInvitationSchema,
  respondInvitationSchema,
  updateMemberRoleSchema,
  createTaskSchema,
  updateTaskSchema,
  taskParamsSchema,
  listTasksQuerySchema,
} from "./projects.schema.js";
import type {
  CreateProjectBody,
  UpdateProjectBody,
  ListProjectsQuery,
  SendInvitationBody,
  RespondInvitationBody,
  UpdateMemberRoleBody,
  CreateTaskBody,
  UpdateTaskBody,
  ListTasksQuery,
} from "./projects.schema.js";
import { sendSuccess, sendCreated } from "../../common/utils/response.js";

export const projectsRoutes: FastifyPluginAsync = async (fastify) => {
  const projectsService = new ProjectsService(fastify.prisma);

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

  // 1. List projects (Public with optional auth)
  fastify.get<{ Querystring: ListProjectsQuery }>(
    "/",
    {
      schema: listProjectsQuerySchema,
      preHandler: [optionalAuthenticate],
    },
    async (request, reply) => {
      const currentUserId = request.user?.sub;
      const currentUserRole = request.user?.role;

      const { projects, meta } = await projectsService.listProjects(
        request.query,
        currentUserId,
        currentUserRole
      );

      return sendSuccess(reply, projects, "Projects retrieved successfully", 200, meta);
    }
  );

  // 2. Get current user's projects (Owned & Collaborating)
  fastify.get(
    "/my-projects",
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const currentUserId = request.user.sub;
      const myProjects = await projectsService.getUserProjects(currentUserId);
      return sendSuccess(reply, myProjects, "User projects retrieved successfully");
    }
  );

  // 3. Get invitations received by current user
  fastify.get(
    "/my-invitations",
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const currentUserId = request.user.sub;
      const invitations = await projectsService.listUserInvitations(currentUserId);
      return sendSuccess(reply, invitations, "User invitations retrieved successfully");
    }
  );

  // 4. Respond to invitation (ACCEPT / REJECT)
  fastify.post<{
    Params: { invitationId: string };
    Body: RespondInvitationBody;
  }>(
    "/invitations/:invitationId/respond",
    {
      schema: respondInvitationSchema,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const currentUserId = request.user.sub;
      const result = await projectsService.respondInvitation(
        request.params.invitationId,
        currentUserId,
        request.body.action
      );

      return sendSuccess(reply, result, result.message);
    }
  );

  // 5. Create a new project (Authenticated students, club leaders, admins)
  fastify.post<{ Body: CreateProjectBody }>(
    "/",
    {
      schema: createProjectSchema,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const currentUserId = request.user.sub;
      const project = await projectsService.createProject(
        currentUserId,
        request.body
      );
      return sendCreated(reply, project, "Project created successfully");
    }
  );

  // 6. Get single project by ID (Public with optional auth)
  fastify.get<{ Params: { id: string } }>(
    "/:id",
    {
      schema: getProjectParamsSchema,
      preHandler: [optionalAuthenticate],
    },
    async (request, reply) => {
      const currentUserId = request.user?.sub;
      const currentUserRole = request.user?.role;

      const project = await projectsService.getProjectById(
        request.params.id,
        currentUserId,
        currentUserRole
      );

      return sendSuccess(reply, project, "Project details retrieved successfully");
    }
  );

  // 7. Update project (OWNER, MAINTAINER, or ADMIN)
  fastify.patch<{ Params: { id: string }; Body: UpdateProjectBody }>(
    "/:id",
    {
      schema: updateProjectSchema,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const currentUserId = request.user.sub;
      const currentUserRole = request.user.role;

      const updated = await projectsService.updateProject(
        request.params.id,
        currentUserId,
        currentUserRole,
        request.body
      );

      return sendSuccess(reply, updated, "Project updated successfully");
    }
  );

  // 8. Delete project (OWNER or ADMIN)
  fastify.delete<{ Params: { id: string } }>(
    "/:id",
    {
      schema: getProjectParamsSchema,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const currentUserId = request.user.sub;
      const currentUserRole = request.user.role;

      const result = await projectsService.deleteProject(
        request.params.id,
        currentUserId,
        currentUserRole
      );

      return sendSuccess(reply, result, result.message);
    }
  );

  // 9. Send invitation to collaborator
  fastify.post<{ Params: { id: string }; Body: SendInvitationBody }>(
    "/:id/invitations",
    {
      schema: sendInvitationSchema,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const currentUserId = request.user.sub;
      const currentUserRole = request.user.role;

      const invitation = await projectsService.sendInvitation(
        request.params.id,
        currentUserId,
        currentUserRole,
        request.body.email
      );

      return sendCreated(reply, invitation, "Project invitation sent successfully");
    }
  );

  // 10. List project invitations
  fastify.get<{ Params: { id: string } }>(
    "/:id/invitations",
    {
      schema: getProjectParamsSchema,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const currentUserId = request.user.sub;
      const currentUserRole = request.user.role;

      const invitations = await projectsService.listProjectInvitations(
        request.params.id,
        currentUserId,
        currentUserRole
      );

      return sendSuccess(reply, invitations, "Project invitations retrieved successfully");
    }
  );

  // 11. Update team member role
  fastify.patch<{
    Params: { id: string; userId: string };
    Body: UpdateMemberRoleBody;
  }>(
    "/:id/members/:userId",
    {
      schema: updateMemberRoleSchema,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const currentUserId = request.user.sub;
      const currentUserRole = request.user.role;

      const member = await projectsService.updateMemberRole(
        request.params.id,
        request.params.userId,
        currentUserId,
        currentUserRole,
        request.body.role
      );

      return sendSuccess(reply, member, "Member role updated successfully");
    }
  );

  // 12. Remove member or leave project
  fastify.delete<{ Params: { id: string; userId: string } }>(
    "/:id/members/:userId",
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const currentUserId = request.user.sub;
      const currentUserRole = request.user.role;

      const result = await projectsService.removeMember(
        request.params.id,
        request.params.userId,
        currentUserId,
        currentUserRole
      );

      return sendSuccess(reply, result, result.message);
    }
  );

  // 13. List tasks (Kanban)
  fastify.get<{ Params: { id: string }; Querystring: ListTasksQuery }>(
    "/:id/tasks",
    {
      schema: listTasksQuerySchema,
      preHandler: [optionalAuthenticate],
    },
    async (request, reply) => {
      const currentUserId = request.user?.sub;
      const currentUserRole = request.user?.role;

      const tasks = await projectsService.listTasks(
        request.params.id,
        request.query,
        currentUserId,
        currentUserRole
      );

      return sendSuccess(reply, tasks, "Project tasks retrieved successfully");
    }
  );

  // 14. Create task
  fastify.post<{ Params: { id: string }; Body: CreateTaskBody }>(
    "/:id/tasks",
    {
      schema: createTaskSchema,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const currentUserId = request.user.sub;
      const task = await projectsService.createTask(
        request.params.id,
        currentUserId,
        request.body
      );

      return sendCreated(reply, task, "Task created successfully");
    }
  );

  // 15. Update task
  fastify.patch<{
    Params: { id: string; taskId: string };
    Body: UpdateTaskBody;
  }>(
    "/:id/tasks/:taskId",
    {
      schema: updateTaskSchema,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const currentUserId = request.user.sub;
      const currentUserRole = request.user.role;

      const task = await projectsService.updateTask(
        request.params.id,
        request.params.taskId,
        currentUserId,
        currentUserRole,
        request.body
      );

      return sendSuccess(reply, task, "Task updated successfully");
    }
  );

  // 16. Delete task
  fastify.delete<{ Params: { id: string; taskId: string } }>(
    "/:id/tasks/:taskId",
    {
      schema: taskParamsSchema,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const currentUserId = request.user.sub;
      const currentUserRole = request.user.role;

      const result = await projectsService.deleteTask(
        request.params.id,
        request.params.taskId,
        currentUserId,
        currentUserRole
      );

      return sendSuccess(reply, result, result.message);
    }
  );
};
