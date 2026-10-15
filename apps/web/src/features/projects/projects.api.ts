import { apiClient } from "../../services/api.js";
import type { ApiResponse } from "../../types/api.js";

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

export interface ProjectOwner {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  department?: string | null;
}

export interface ProjectMemberUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  department?: string | null;
}

export interface ProjectMember {
  id: string;
  role: ProjectMemberRole;
  joinedAt: string;
  user: ProjectMemberUser;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string;
  visibility: ProjectVisibility;
  status: ProjectStatus;
  repoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  owner: ProjectOwner;
  memberCount: number;
  taskCount: number;
  userRole?: ProjectMemberRole | null;
}

export interface ProjectDetail extends Project {
  members: ProjectMember[];
  pendingInvitationsCount: number;
}

export interface ProjectInvitation {
  id: string;
  projectId: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";
  createdAt: string;
  project?: {
    id: string;
    title: string;
    description: string;
    technologies: string;
    status: ProjectStatus;
  };
  inviter: {
    id: string;
    name: string;
    email?: string;
    avatarUrl?: string | null;
  };
  invitee?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    department?: string | null;
  };
}

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  assigneeId?: string | null;
  creatorId: string;
  dueDate?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  assignee?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    department?: string | null;
  } | null;
  creator: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
}

export interface UserProjectItem {
  membershipId: string;
  role: ProjectMemberRole;
  joinedAt: string;
  project: Project;
}

export interface ListProjectsParams {
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

export interface CreateProjectPayload {
  title: string;
  description: string;
  technologies: string;
  visibility?: ProjectVisibility;
  status?: ProjectStatus;
  repoUrl?: string;
}

export interface UpdateProjectPayload {
  title?: string;
  description?: string;
  technologies?: string;
  visibility?: ProjectVisibility;
  status?: ProjectStatus;
  repoUrl?: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  assigneeId?: string;
  dueDate?: string;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  assigneeId?: string | null;
  dueDate?: string | null;
}

export const projectsApi = {
  // 1. List projects
  async listProjects(params: ListProjectsParams = {}) {
    const res = await apiClient.get<ApiResponse<Project[]>>("/projects", { params });
    return res.data;
  },

  // 2. Get single project by ID
  async getProjectById(id: string) {
    const res = await apiClient.get<ApiResponse<ProjectDetail>>(`/projects/${id}`);
    return res.data.data;
  },

  // 3. Create project
  async createProject(payload: CreateProjectPayload) {
    const res = await apiClient.post<ApiResponse<Project>>("/projects", payload);
    return res.data.data;
  },

  // 4. Update project
  async updateProject(id: string, payload: UpdateProjectPayload) {
    const res = await apiClient.patch<ApiResponse<Project>>(`/projects/${id}`, payload);
    return res.data.data;
  },

  // 5. Delete project
  async deleteProject(id: string) {
    const res = await apiClient.delete<ApiResponse<{ message: string }>>(`/projects/${id}`);
    return res.data;
  },

  // 6. Send invitation to collaborator
  async sendInvitation(projectId: string, email: string) {
    const res = await apiClient.post<ApiResponse<ProjectInvitation>>(
      `/projects/${projectId}/invitations`,
      { email }
    );
    return res.data.data;
  },

  // 7. List project invitations
  async listProjectInvitations(projectId: string) {
    const res = await apiClient.get<ApiResponse<ProjectInvitation[]>>(
      `/projects/${projectId}/invitations`
    );
    return res.data.data;
  },

  // 8. List current user's invitations
  async listMyInvitations() {
    const res = await apiClient.get<ApiResponse<ProjectInvitation[]>>(
      "/projects/my-invitations"
    );
    return res.data.data;
  },

  // 9. Respond to invitation
  async respondInvitation(invitationId: string, action: "ACCEPT" | "REJECT") {
    const res = await apiClient.post<ApiResponse<any>>(
      `/projects/invitations/${invitationId}/respond`,
      { action }
    );
    return res.data;
  },

  // 10. Update member role
  async updateMemberRole(
    projectId: string,
    userId: string,
    role: "MAINTAINER" | "CONTRIBUTOR"
  ) {
    const res = await apiClient.patch<ApiResponse<ProjectMember>>(
      `/projects/${projectId}/members/${userId}`,
      { role }
    );
    return res.data.data;
  },

  // 11. Remove member or leave project
  async removeMember(projectId: string, userId: string) {
    const res = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/projects/${projectId}/members/${userId}`
    );
    return res.data;
  },

  // 12. List tasks (Kanban)
  async listTasks(projectId: string, params: { status?: TaskStatus } = {}) {
    const res = await apiClient.get<ApiResponse<ProjectTask[]>>(
      `/projects/${projectId}/tasks`,
      { params }
    );
    return res.data.data;
  },

  // 13. Create task
  async createTask(projectId: string, payload: CreateTaskPayload) {
    const res = await apiClient.post<ApiResponse<ProjectTask>>(
      `/projects/${projectId}/tasks`,
      payload
    );
    return res.data.data;
  },

  // 14. Update task
  async updateTask(
    projectId: string,
    taskId: string,
    payload: UpdateTaskPayload
  ) {
    const res = await apiClient.patch<ApiResponse<ProjectTask>>(
      `/projects/${projectId}/tasks/${taskId}`,
      payload
    );
    return res.data.data;
  },

  // 15. Delete task
  async deleteTask(projectId: string, taskId: string) {
    const res = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/projects/${projectId}/tasks/${taskId}`
    );
    return res.data;
  },

  // 16. Get current user's projects
  async getMyProjects() {
    const res = await apiClient.get<ApiResponse<UserProjectItem[]>>(
      "/projects/my-projects"
    );
    return res.data.data;
  },
};
