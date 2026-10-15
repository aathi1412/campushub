import type { FastifySchema } from "fastify";

export const projectVisibilities = ["PUBLIC", "CAMPUS_ONLY", "PRIVATE"] as const;
export const projectStatuses = ["PLANNING", "IN_PROGRESS", "COMPLETED", "ARCHIVED"] as const;
export const projectMemberRoles = ["OWNER", "MAINTAINER", "CONTRIBUTOR"] as const;
export const taskPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export const taskStatuses = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] as const;

export type ProjectVisibility = (typeof projectVisibilities)[number];
export type ProjectStatus = (typeof projectStatuses)[number];
export type ProjectMemberRole = (typeof projectMemberRoles)[number];
export type TaskPriority = (typeof taskPriorities)[number];
export type TaskStatus = (typeof taskStatuses)[number];

// 1. Create Project Schema
export const createProjectSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["title", "description", "technologies"],
    additionalProperties: false,
    properties: {
      title: { type: "string", minLength: 3, maxLength: 200 },
      description: { type: "string", minLength: 10 },
      technologies: { type: "string", minLength: 2, maxLength: 500 },
      visibility: { type: "string", enum: projectVisibilities },
      status: { type: "string", enum: projectStatuses },
      repoUrl: { type: "string", maxLength: 500 },
    },
  },
};

// 2. Update Project Schema
export const updateProjectSchema: FastifySchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
    },
  },
  body: {
    type: "object",
    additionalProperties: false,
    properties: {
      title: { type: "string", minLength: 3, maxLength: 200 },
      description: { type: "string", minLength: 10 },
      technologies: { type: "string", minLength: 2, maxLength: 500 },
      visibility: { type: "string", enum: projectVisibilities },
      status: { type: "string", enum: projectStatuses },
      repoUrl: { type: "string", maxLength: 500 },
    },
  },
};

// 3. Get Project Params Schema
export const getProjectParamsSchema: FastifySchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
    },
  },
};

// 4. List Projects Query Schema
export const listProjectsQuerySchema: FastifySchema = {
  querystring: {
    type: "object",
    additionalProperties: false,
    properties: {
      page: { type: "integer", minimum: 1, default: 1 },
      limit: { type: "integer", minimum: 1, maximum: 100, default: 12 },
      search: { type: "string", maxLength: 100 },
      status: { type: "string", enum: projectStatuses },
      visibility: { type: "string", enum: projectVisibilities },
      technology: { type: "string", maxLength: 100 },
      ownerId: { type: "string" },
      sortBy: { type: "string", enum: ["title", "createdAt", "updatedAt"], default: "createdAt" },
      sortOrder: { type: "string", enum: ["asc", "desc"], default: "desc" },
    },
  },
};

// 5. Send Invitation Schema
export const sendInvitationSchema: FastifySchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
    },
  },
  body: {
    type: "object",
    required: ["email"],
    additionalProperties: false,
    properties: {
      email: { type: "string", format: "email" },
    },
  },
};

// 6. Respond Invitation Schema
export const respondInvitationSchema: FastifySchema = {
  params: {
    type: "object",
    required: ["invitationId"],
    properties: {
      invitationId: { type: "string" },
    },
  },
  body: {
    type: "object",
    required: ["action"],
    additionalProperties: false,
    properties: {
      action: { type: "string", enum: ["ACCEPT", "REJECT"] },
    },
  },
};

// 7. Update Member Role Schema
export const updateMemberRoleSchema: FastifySchema = {
  params: {
    type: "object",
    required: ["id", "userId"],
    properties: {
      id: { type: "string" },
      userId: { type: "string" },
    },
  },
  body: {
    type: "object",
    required: ["role"],
    additionalProperties: false,
    properties: {
      role: { type: "string", enum: ["MAINTAINER", "CONTRIBUTOR"] },
    },
  },
};

// 8. Create Task Schema
export const createTaskSchema: FastifySchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
    },
  },
  body: {
    type: "object",
    required: ["title"],
    additionalProperties: false,
    properties: {
      title: { type: "string", minLength: 3, maxLength: 200 },
      description: { type: "string" },
      priority: { type: "string", enum: taskPriorities },
      status: { type: "string", enum: taskStatuses },
      assigneeId: { type: "string" },
      dueDate: { type: "string", format: "date-time" },
    },
  },
};

// 9. Update Task Schema
export const updateTaskSchema: FastifySchema = {
  params: {
    type: "object",
    required: ["id", "taskId"],
    properties: {
      id: { type: "string" },
      taskId: { type: "string" },
    },
  },
  body: {
    type: "object",
    additionalProperties: false,
    properties: {
      title: { type: "string", minLength: 3, maxLength: 200 },
      description: { type: "string" },
      priority: { type: "string", enum: taskPriorities },
      status: { type: "string", enum: taskStatuses },
      assigneeId: { type: ["string", "null"] },
      dueDate: { type: ["string", "null"], format: "date-time" },
    },
  },
};

// 10. Task Params Schema
export const taskParamsSchema: FastifySchema = {
  params: {
    type: "object",
    required: ["id", "taskId"],
    properties: {
      id: { type: "string" },
      taskId: { type: "string" },
    },
  },
};

// 11. List Tasks Query Schema
export const listTasksQuerySchema: FastifySchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
    },
  },
  querystring: {
    type: "object",
    additionalProperties: false,
    properties: {
      status: { type: "string", enum: taskStatuses },
      priority: { type: "string", enum: taskPriorities },
      assigneeId: { type: "string" },
      search: { type: "string", maxLength: 100 },
    },
  },
};

export interface CreateProjectBody {
  title: string;
  description: string;
  technologies: string;
  visibility?: ProjectVisibility;
  status?: ProjectStatus;
  repoUrl?: string;
}

export interface UpdateProjectBody {
  title?: string;
  description?: string;
  technologies?: string;
  visibility?: ProjectVisibility;
  status?: ProjectStatus;
  repoUrl?: string;
}

export interface ListProjectsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: ProjectStatus;
  visibility?: ProjectVisibility;
  technology?: string;
  ownerId?: string;
  sortBy?: "title" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface SendInvitationBody {
  email: string;
}

export interface RespondInvitationBody {
  action: "ACCEPT" | "REJECT";
}

export interface UpdateMemberRoleBody {
  role: "MAINTAINER" | "CONTRIBUTOR";
}

export interface CreateTaskBody {
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  assigneeId?: string;
  dueDate?: string;
}

export interface UpdateTaskBody {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  assigneeId?: string | null;
  dueDate?: string | null;
}

export interface ListTasksQuery {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  search?: string;
}
