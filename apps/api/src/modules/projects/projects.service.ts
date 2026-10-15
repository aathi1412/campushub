import type { PrismaClient, Prisma } from "../../generated/prisma/client.js";
import type {
  ProjectVisibility,
  ProjectStatus,
  ProjectMemberRole,
  TaskPriority,
  TaskStatus,
} from "../../generated/prisma/enums.js";
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from "../../common/errors/index.js";
import type {
  CreateProjectBody,
  UpdateProjectBody,
  ListProjectsQuery,
  CreateTaskBody,
  UpdateTaskBody,
  ListTasksQuery,
} from "./projects.schema.js";

export class ProjectsService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Helper: Get user's member role in a project (or null if not a member)
   */
  private async getMemberRole(
    projectId: string,
    userId?: string
  ): Promise<ProjectMemberRole | null> {
    if (!userId) return null;
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { role: true },
    });
    return member?.role || null;
  }

  /**
   * List projects with visibility filtering, search, and pagination
   */
  async listProjects(
    query: ListProjectsQuery,
    currentUserId?: string,
    currentUserRole?: string
  ) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 12));
    const skip = (page - 1) * limit;

    const andConditions: Prisma.ProjectWhereInput[] = [];

    // Visibility rules:
    // Unauthenticated: only PUBLIC
    // Authenticated (non-admin): PUBLIC, CAMPUS_ONLY, or PRIVATE if member
    // Admin: can see everything
    if (currentUserRole !== "ADMIN") {
      if (!currentUserId) {
        andConditions.push({ visibility: "PUBLIC" });
      } else {
        andConditions.push({
          OR: [
            { visibility: "PUBLIC" },
            { visibility: "CAMPUS_ONLY" },
            {
              visibility: "PRIVATE",
              members: { some: { userId: currentUserId } },
            },
          ],
        });
      }
    }

    // Specific visibility filter if requested
    if (query.visibility) {
      andConditions.push({ visibility: query.visibility });
    }

    // Status filter
    if (query.status) {
      andConditions.push({ status: query.status });
    }

    // Search filter across title, description, and technologies
    if (query.search?.trim()) {
      const term = query.search.trim();
      andConditions.push({
        OR: [
          { title: { contains: term } },
          { description: { contains: term } },
          { technologies: { contains: term } },
        ],
      });
    }

    // Technology filter
    if (query.technology?.trim()) {
      andConditions.push({
        technologies: { contains: query.technology.trim() },
      });
    }

    // Owner filter
    if (query.ownerId) {
      andConditions.push({ ownerId: query.ownerId });
    }

    const where: Prisma.ProjectWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {};

    const sortBy = query.sortBy || "createdAt";
    const sortOrder = query.sortOrder || "desc";
    const orderBy: Prisma.ProjectOrderByWithRelationInput = { [sortBy]: sortOrder };

    const [total, projects] = await Promise.all([
      this.prisma.project.count({ where }),
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              department: true,
            },
          },
          _count: {
            select: {
              members: true,
              tasks: true,
            },
          },
        },
      }),
    ]);

    // Attach current user's membership role if authenticated
    const userRoleMap = new Map<string, ProjectMemberRole>();
    if (currentUserId && projects.length > 0) {
      const projectIds = projects.map((p) => p.id);
      const memberships = await this.prisma.projectMember.findMany({
        where: {
          projectId: { in: projectIds },
          userId: currentUserId,
        },
        select: {
          projectId: true,
          role: true,
        },
      });
      for (const m of memberships) {
        userRoleMap.set(m.projectId, m.role);
      }
    }

    const formatted = projects.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      technologies: p.technologies,
      visibility: p.visibility,
      status: p.status,
      repoUrl: p.repoUrl,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      owner: p.owner,
      memberCount: p._count.members,
      taskCount: p._count.tasks,
      userRole: userRoleMap.get(p.id) || null,
    }));

    return {
      projects: formatted,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get project details by ID with access control
   */
  async getProjectById(
    projectId: string,
    currentUserId?: string,
    currentUserRole?: string
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            department: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                department: true,
              },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
        _count: {
          select: {
            tasks: true,
            invitations: { where: { status: "PENDING" } },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundError("Project not found");
    }

    const callerMembership = project.members.find(
      (m) => m.userId === currentUserId
    );
    const userRole = callerMembership?.role || null;
    const isMember = Boolean(callerMembership);
    const isOwner = project.ownerId === currentUserId;
    const isAdmin = currentUserRole === "ADMIN";

    // Access control:
    if (project.visibility === "PRIVATE" && !isMember && !isOwner && !isAdmin) {
      throw new ForbiddenError("This project is private and you are not a member");
    }
    if (project.visibility === "CAMPUS_ONLY" && !currentUserId && !isAdmin) {
      throw new ForbiddenError("You must sign in to view this campus project");
    }

    return {
      id: project.id,
      title: project.title,
      description: project.description,
      technologies: project.technologies,
      visibility: project.visibility,
      status: project.status,
      repoUrl: project.repoUrl,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      owner: project.owner,
      members: project.members.map((m) => ({
        id: m.id,
        role: m.role,
        joinedAt: m.joinedAt,
        user: m.user,
      })),
      memberCount: project.members.length,
      taskCount: project._count.tasks,
      pendingInvitationsCount: project._count.invitations,
      userRole,
    };
  }

  /**
   * Create a project and assign creator as OWNER
   */
  async createProject(userId: string, body: CreateProjectBody) {
    const project = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const created = await tx.project.create({
          data: {
            title: body.title.trim(),
            description: body.description.trim(),
            technologies: body.technologies.trim(),
            visibility: body.visibility || "CAMPUS_ONLY",
            status: body.status || "IN_PROGRESS",
            repoUrl: body.repoUrl?.trim() || null,
            ownerId: userId,
          },
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                department: true,
              },
            },
          },
        });

        await tx.projectMember.create({
          data: {
            projectId: created.id,
            userId,
            role: "OWNER",
          },
        });

        return created;
      }
    );

    return {
      ...project,
      memberCount: 1,
      userRole: "OWNER" as const,
    };
  }

  /**
   * Update project details (OWNER, MAINTAINER, or ADMIN)
   */
  async updateProject(
    projectId: string,
    userId: string,
    userRole: string,
    body: UpdateProjectBody
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundError("Project not found");
    }

    const memberRole = await this.getMemberRole(projectId, userId);
    const canManage =
      userRole === "ADMIN" ||
      project.ownerId === userId ||
      memberRole === "OWNER" ||
      memberRole === "MAINTAINER";

    if (!canManage) {
      throw new ForbiddenError(
        "You do not have permission to update this project"
      );
    }

    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        title: body.title ? body.title.trim() : undefined,
        description: body.description ? body.description.trim() : undefined,
        technologies: body.technologies ? body.technologies.trim() : undefined,
        visibility: body.visibility,
        status: body.status,
        repoUrl: body.repoUrl !== undefined ? body.repoUrl?.trim() || null : undefined,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            department: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Delete project (OWNER or ADMIN)
   */
  async deleteProject(projectId: string, userId: string, userRole: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundError("Project not found");
    }

    if (project.ownerId !== userId && userRole !== "ADMIN") {
      throw new ForbiddenError("Only the project owner or an admin can delete this project");
    }

    await this.prisma.project.delete({
      where: { id: projectId },
    });

    return { message: "Project deleted successfully" };
  }

  /**
   * Send project invitation to a user by email
   */
  async sendInvitation(
    projectId: string,
    inviterId: string,
    userRole: string,
    email: string
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundError("Project not found");
    }

    const memberRole = await this.getMemberRole(projectId, inviterId);
    const canInvite =
      userRole === "ADMIN" ||
      project.ownerId === inviterId ||
      memberRole === "OWNER" ||
      memberRole === "MAINTAINER";

    if (!canInvite) {
      throw new ForbiddenError("You do not have permission to invite members to this project");
    }

    const invitee = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, name: true, email: true },
    });

    if (!invitee) {
      throw new NotFoundError("User with this email not found on CampusHub");
    }

    // Check if already a member
    const existingMember = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: invitee.id } },
    });
    if (existingMember) {
      throw new ConflictError("This user is already a member of the project");
    }

    // Check existing invitation
    const existingInvite = await this.prisma.projectInvitation.findUnique({
      where: { projectId_inviteeId: { projectId, inviteeId: invitee.id } },
    });

    if (existingInvite && existingInvite.status === "PENDING") {
      throw new ConflictError("An invitation is already pending for this user");
    }

    const inviter = await this.prisma.user.findUnique({
      where: { id: inviterId },
      select: { name: true },
    });

    const invitation = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const inv = await tx.projectInvitation.upsert({
          where: { projectId_inviteeId: { projectId, inviteeId: invitee.id } },
          update: {
            inviterId,
            status: "PENDING",
          },
          create: {
            projectId,
            inviterId,
            inviteeId: invitee.id,
            status: "PENDING",
          },
          include: {
            invitee: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                department: true,
              },
            },
          },
        });

        await tx.notification.create({
          data: {
            userId: invitee.id,
            type: "PROJECT_INVITATION",
            title: "Project Team Invitation",
            message: `${inviter?.name || "A collaborator"} invited you to join '${project.title}'.`,
            link: `/projects/${project.id}`,
          },
        });

        return inv;
      }
    );

    return invitation;
  }

  /**
   * List pending invitations sent for a project
   */
  async listProjectInvitations(
    projectId: string,
    userId: string,
    userRole: string
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundError("Project not found");
    }

    const memberRole = await this.getMemberRole(projectId, userId);
    const canView =
      userRole === "ADMIN" ||
      project.ownerId === userId ||
      memberRole === "OWNER" ||
      memberRole === "MAINTAINER";

    if (!canView) {
      throw new ForbiddenError("You do not have permission to view project invitations");
    }

    return this.prisma.projectInvitation.findMany({
      where: { projectId, status: "PENDING" },
      include: {
        invitee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            department: true,
          },
        },
        inviter: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * List pending invitations received by current user
   */
  async listUserInvitations(userId: string) {
    return this.prisma.projectInvitation.findMany({
      where: { inviteeId: userId, status: "PENDING" },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            description: true,
            technologies: true,
            status: true,
          },
        },
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Respond to invitation (ACCEPT or REJECT)
   */
  async respondInvitation(
    invitationId: string,
    userId: string,
    action: "ACCEPT" | "REJECT"
  ) {
    const invitation = await this.prisma.projectInvitation.findUnique({
      where: { id: invitationId },
      include: {
        project: { select: { id: true, title: true, ownerId: true } },
        invitee: { select: { id: true, name: true } },
      },
    });

    if (!invitation) {
      throw new NotFoundError("Invitation not found");
    }

    if (invitation.inviteeId !== userId) {
      throw new ForbiddenError("You can only respond to your own invitations");
    }

    if (invitation.status !== "PENDING") {
      throw new BadRequestError(`Invitation is no longer pending (current: ${invitation.status})`);
    }

    if (action === "ACCEPT") {
      const result = await this.prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          await tx.projectInvitation.update({
            where: { id: invitationId },
            data: { status: "ACCEPTED" },
          });

          const member = await tx.projectMember.create({
            data: {
              projectId: invitation.projectId,
              userId,
              role: "CONTRIBUTOR",
            },
          });

          // Notify project owner
          if (invitation.project.ownerId !== userId) {
            await tx.notification.create({
              data: {
                userId: invitation.project.ownerId,
                type: "PROJECT_INVITATION",
                title: "Invitation Accepted",
                message: `${invitation.invitee.name} joined '${invitation.project.title}' as a contributor.`,
                link: `/projects/${invitation.projectId}`,
              },
            });
          }

          return member;
        }
      );

      return {
        success: true,
        message: "You have joined the project team!",
        member: result,
      };
    } else {
      await this.prisma.projectInvitation.update({
        where: { id: invitationId },
        data: { status: "REJECTED" },
      });

      return {
        success: true,
        message: "Invitation declined",
      };
    }
  }

  /**
   * Update member role in project (OWNER or ADMIN only)
   */
  async updateMemberRole(
    projectId: string,
    targetUserId: string,
    callerId: string,
    callerRole: string,
    newRole: "MAINTAINER" | "CONTRIBUTOR"
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundError("Project not found");
    }

    if (project.ownerId !== callerId && callerRole !== "ADMIN") {
      throw new ForbiddenError("Only project owners or admins can modify member roles");
    }

    if (project.ownerId === targetUserId) {
      throw new BadRequestError("Cannot alter the role of the primary project owner");
    }

    const member = await this.prisma.projectMember.update({
      where: { projectId_userId: { projectId, userId: targetUserId } },
      data: { role: newRole },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    return member;
  }

  /**
   * Remove member or leave project
   */
  async removeMember(
    projectId: string,
    targetUserId: string,
    callerId: string,
    callerRole: string
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundError("Project not found");
    }

    const isSelf = targetUserId === callerId;
    const isOwnerOrAdmin = project.ownerId === callerId || callerRole === "ADMIN";

    if (!isSelf && !isOwnerOrAdmin) {
      throw new ForbiddenError("You do not have permission to remove this member");
    }

    if (project.ownerId === targetUserId) {
      throw new BadRequestError(
        "Project owner cannot leave the project. Please transfer ownership or delete the project."
      );
    }

    await this.prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId: targetUserId } },
    });

    return {
      message: isSelf
        ? "You have left the project"
        : "Member removed from project successfully",
    };
  }

  /**
   * List tasks for a project
   */
  async listTasks(
    projectId: string,
    query: ListTasksQuery,
    userId?: string,
    userRole?: string
  ) {
    // Check project exists and caller has access
    await this.getProjectById(projectId, userId, userRole);

    const where: Prisma.ProjectTaskWhereInput = { projectId };

    if (query.status) {
      where.status = query.status;
    }
    if (query.priority) {
      where.priority = query.priority;
    }
    if (query.assigneeId) {
      where.assigneeId = query.assigneeId;
    }
    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { title: { contains: term } },
        { description: { contains: term } },
      ];
    }

    return this.prisma.projectTask.findMany({
      where,
      orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            department: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  /**
   * Create a new task (Members or Admin only)
   */
  async createTask(projectId: string, creatorId: string, body: CreateTaskBody) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundError("Project not found");
    }

    const memberRole = await this.getMemberRole(projectId, creatorId);
    if (!memberRole && project.ownerId !== creatorId) {
      throw new ForbiddenError("Only project team members can create tasks");
    }

    // If assignee provided, verify they are a member of this project
    if (body.assigneeId) {
      const assigneeMember = await this.prisma.projectMember.findUnique({
        where: {
          projectId_userId: { projectId, userId: body.assigneeId },
        },
      });
      if (!assigneeMember) {
        throw new BadRequestError("Assignee must be an active member of this project");
      }
    }

    const creator = await this.prisma.user.findUnique({
      where: { id: creatorId },
      select: { name: true },
    });

    const task = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const newTask = await tx.projectTask.create({
          data: {
            projectId,
            creatorId,
            title: body.title.trim(),
            description: body.description?.trim() || null,
            priority: body.priority || "MEDIUM",
            status: body.status || "TODO",
            assigneeId: body.assigneeId || null,
            dueDate: body.dueDate ? new Date(body.dueDate) : null,
          },
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
            creator: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        });

        // Notify assignee if not the creator
        if (body.assigneeId && body.assigneeId !== creatorId) {
          await tx.notification.create({
            data: {
              userId: body.assigneeId,
              type: "TASK_ASSIGNED",
              title: "New Task Assigned",
              message: `${creator?.name || "A team member"} assigned you '${newTask.title}' in ${project.title}.`,
              link: `/projects/${projectId}`,
            },
          });
        }

        return newTask;
      }
    );

    return task;
  }

  /**
   * Update task (Members or Admin only)
   */
  async updateTask(
    projectId: string,
    taskId: string,
    userId: string,
    userRole: string,
    body: UpdateTaskBody
  ) {
    const task = await this.prisma.projectTask.findUnique({
      where: { id: taskId },
      include: { project: { select: { id: true, title: true, ownerId: true } } },
    });

    if (!task || task.projectId !== projectId) {
      throw new NotFoundError("Task not found");
    }

    const memberRole = await this.getMemberRole(projectId, userId);
    if (!memberRole && task.project.ownerId !== userId && userRole !== "ADMIN") {
      throw new ForbiddenError("Only project team members can update tasks");
    }

    // If changing assignee, verify new assignee is a member
    if (body.assigneeId && body.assigneeId !== task.assigneeId) {
      const assigneeMember = await this.prisma.projectMember.findUnique({
        where: {
          projectId_userId: { projectId, userId: body.assigneeId },
        },
      });
      if (!assigneeMember) {
        throw new BadRequestError("Assignee must be an active member of this project");
      }
    }

    const updateData: Prisma.ProjectTaskUpdateInput = {};
    if (body.title) updateData.title = body.title.trim();
    if (body.description !== undefined) {
      updateData.description = body.description ? body.description.trim() : null;
    }
    if (body.priority) updateData.priority = body.priority;
    if (body.status) {
      updateData.status = body.status;
      if (body.status === "DONE" && task.status !== "DONE") {
        updateData.completedAt = new Date();
      } else if (body.status !== "DONE" && task.status === "DONE") {
        updateData.completedAt = null;
      }
    }
    if (body.assigneeId !== undefined) {
      updateData.assignee = body.assigneeId
        ? { connect: { id: body.assigneeId } }
        : { disconnect: true };
    }
    if (body.dueDate !== undefined) {
      updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    }

    const updated = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const res = await tx.projectTask.update({
          where: { id: taskId },
          data: updateData,
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                department: true,
              },
            },
            creator: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        });

        // Notify new assignee if changed
        if (
          body.assigneeId &&
          body.assigneeId !== task.assigneeId &&
          body.assigneeId !== userId
        ) {
          await tx.notification.create({
            data: {
              userId: body.assigneeId,
              type: "TASK_ASSIGNED",
              title: "Task Assigned",
              message: `You were assigned '${res.title}' in ${task.project.title}.`,
              link: `/projects/${projectId}`,
            },
          });
        }

        return res;
      }
    );

    return updated;
  }

  /**
   * Delete task
   */
  async deleteTask(
    projectId: string,
    taskId: string,
    userId: string,
    userRole: string
  ) {
    const task = await this.prisma.projectTask.findUnique({
      where: { id: taskId },
      include: { project: { select: { ownerId: true } } },
    });

    if (!task || task.projectId !== projectId) {
      throw new NotFoundError("Task not found");
    }

    const memberRole = await this.getMemberRole(projectId, userId);
    const canDelete =
      userRole === "ADMIN" ||
      task.project.ownerId === userId ||
      task.creatorId === userId ||
      task.assigneeId === userId ||
      memberRole === "OWNER" ||
      memberRole === "MAINTAINER";

    if (!canDelete) {
      throw new ForbiddenError("You do not have permission to delete this task");
    }

    await this.prisma.projectTask.delete({
      where: { id: taskId },
    });

    return { message: "Task deleted successfully" };
  }

  /**
   * Get all projects where the user is an owner or member
   */
  async getUserProjects(userId: string) {
    const memberships = await this.prisma.projectMember.findMany({
      where: { userId },
      orderBy: { joinedAt: "desc" },
      include: {
        project: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
            _count: {
              select: {
                members: true,
                tasks: true,
              },
            },
          },
        },
      },
    });

    return memberships.map((m) => ({
      membershipId: m.id,
      role: m.role,
      joinedAt: m.joinedAt,
      project: {
        id: m.project.id,
        title: m.project.title,
        description: m.project.description,
        technologies: m.project.technologies,
        visibility: m.project.visibility,
        status: m.project.status,
        repoUrl: m.project.repoUrl,
        owner: m.project.owner,
        memberCount: m.project._count.members,
        taskCount: m.project._count.tasks,
      },
    }));
  }
}
