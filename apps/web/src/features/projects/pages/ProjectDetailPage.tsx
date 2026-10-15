import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Avatar,
  CircularProgress,
  Alert,
  Divider,
  Stack,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  Users,
  CheckSquare,
  ArrowLeft,
  UserPlus,
  LogOut,
  Edit,
  Trash2,
  Github,
  Globe,
  Lock,
  Building,
  Plus,
  Crown,
  Shield,
} from "lucide-react";
import { projectsApi } from "../projects.api.js";
import type {
  ProjectDetail,
  ProjectTask,
  CreateProjectPayload,
  UpdateProjectPayload,
  CreateTaskPayload,
  UpdateTaskPayload,
  TaskStatus,
} from "../projects.api.js";
import { ProjectFormDialog } from "../components/ProjectFormDialog.js";
import { ProjectInviteDialog } from "../components/ProjectInviteDialog.js";
import { TaskFormDialog } from "../components/TaskFormDialog.js";
import { KanbanBoard } from "../components/KanbanBoard.js";
import { useAuth } from "../../auth/AuthContext.js";

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"BOARD" | "TEAM" | "ABOUT">("BOARD");

  // Modals
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [initialTaskStatus, setInitialTaskStatus] = useState<TaskStatus>("TODO");

  const fetchProject = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await projectsApi.getProjectById(id);
      setProject(data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to load project");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchTasks = useCallback(async () => {
    if (!id) return;
    try {
      setTasksLoading(true);
      const data = await projectsApi.listTasks(id);
      setTasks(data);
    } catch (err: any) {
      // If user lacks permission to view tasks
    } finally {
      setTasksLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProject();
    fetchTasks();
  }, [fetchProject, fetchTasks]);

  const isOwner = project?.owner.id === user?.id || project?.userRole === "OWNER";
  const isMaintainer = project?.userRole === "MAINTAINER";
  const isAdmin = user?.role === "ADMIN";
  const canManage = isOwner || isMaintainer || isAdmin;
  const isMember = Boolean(project?.userRole);

  const handleUpdateProject = async (data: CreateProjectPayload | UpdateProjectPayload) => {
    if (!project) return;
    await projectsApi.updateProject(project.id, data as UpdateProjectPayload);
    setSuccessMsg("Project details updated successfully");
    await fetchProject();
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    if (!window.confirm(`Are you sure you want to permanently delete "${project.title}"?`)) return;

    try {
      await projectsApi.deleteProject(project.id);
      navigate("/projects");
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to delete project");
    }
  };

  const handleLeaveProject = async () => {
    if (!project || !user) return;
    if (!window.confirm(`Are you sure you want to leave "${project.title}"?`)) return;

    try {
      await projectsApi.removeMember(project.id, user.id);
      setSuccessMsg("You have left the project team");
      await fetchProject();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to leave project");
    }
  };

  const handleMemberRoleUpdate = async (userId: string, role: "MAINTAINER" | "CONTRIBUTOR") => {
    if (!project) return;
    try {
      await projectsApi.updateMemberRole(project.id, userId, role);
      setSuccessMsg("Member role updated");
      await fetchProject();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to update member role");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!project) return;
    if (!window.confirm("Are you sure you want to remove this member from the project?")) return;

    try {
      await projectsApi.removeMember(project.id, userId);
      setSuccessMsg("Member removed from team");
      await fetchProject();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to remove member");
    }
  };

  // Task actions
  const handleOpenCreateTask = (status: TaskStatus = "TODO") => {
    setSelectedTask(null);
    setInitialTaskStatus(status);
    setTaskDialogOpen(true);
  };

  const handleOpenEditTask = (task: ProjectTask) => {
    setSelectedTask(task);
    setInitialTaskStatus(task.status);
    setTaskDialogOpen(true);
  };

  const handleSaveTask = async (data: CreateTaskPayload | UpdateTaskPayload) => {
    if (!project) return;
    if (selectedTask) {
      await projectsApi.updateTask(project.id, selectedTask.id, data as UpdateTaskPayload);
      setSuccessMsg("Task updated successfully");
    } else {
      await projectsApi.createTask(project.id, data as CreateTaskPayload);
      setSuccessMsg("Task created successfully");
    }
    await fetchTasks();
  };

  const handleUpdateTaskStatus = async (task: ProjectTask, newStatus: TaskStatus) => {
    if (!project) return;
    try {
      await projectsApi.updateTask(project.id, task.id, { status: newStatus });
      await fetchTasks();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to update task status");
    }
  };

  const handleDeleteTask = async (task: ProjectTask) => {
    if (!project) return;
    if (!window.confirm(`Delete task "${task.title}"?`)) return;

    try {
      await projectsApi.deleteTask(project.id, task.id);
      await fetchTasks();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to delete task");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 15 }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (error && !project) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button component={RouterLink} to="/projects" startIcon={<ArrowLeft size={18} />}>
          Back to Projects Directory
        </Button>
      </Container>
    );
  }

  if (!project) return null;

  const techList = project.technologies.split(",").map((t) => t.trim()).filter(Boolean);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Back button */}
      <Button
        component={RouterLink}
        to="/projects"
        startIcon={<ArrowLeft size={16} />}
        sx={{ mb: 2.5, color: "text.secondary", fontWeight: 600 }}
      >
        All Projects
      </Button>

      {/* Hero Header Card */}
      <Card elevation={0} sx={{ mb: 4, borderRadius: 3, border: "1px solid", borderColor: "divider", p: 3 }}>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, justifyContent: "space-between", gap: 3 }}>
          {/* Project Details Left */}
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", mb: 1.5 }}>
              <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: "-0.02em" }}>
                {project.title}
              </Typography>
              <Chip
                icon={
                  project.visibility === "PUBLIC" ? (
                    <Globe size={13} />
                  ) : project.visibility === "PRIVATE" ? (
                    <Lock size={13} />
                  ) : (
                    <Building size={13} />
                  )
                }
                label={project.visibility.replace("_", " ")}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
              <Chip
                label={project.status.replace("_", " ")}
                size="small"
                color="primary"
                sx={{ fontWeight: 700 }}
              />
              {project.userRole && (
                <Chip
                  label={project.userRole}
                  size="small"
                  color="secondary"
                  sx={{ fontWeight: 700 }}
                />
              )}
            </Box>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 2.5, maxWidth: 850 }}>
              {project.description}
            </Typography>

            {/* Tech Stack Pills */}
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
              {techList.map((t) => (
                <Chip
                  key={t}
                  label={t}
                  size="small"
                  sx={{ bgcolor: "grey.100", fontWeight: 600, fontSize: "0.75rem" }}
                />
              ))}
            </Box>

            {/* Quick Meta */}
            <Stack direction="row" spacing={3} color="text.secondary">
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Users size={16} />
                <Typography variant="caption" fontWeight={600}>
                  {project.memberCount} Team Members
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <CheckSquare size={16} />
                <Typography variant="caption" fontWeight={600}>
                  {tasks.length} Tasks
                </Typography>
              </Box>
              {project.repoUrl && (
                <Box
                  component="a"
                  href={project.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    color: "primary.main",
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  <Github size={16} />
                  <Typography variant="caption">Repository</Typography>
                </Box>
              )}
            </Stack>
          </Box>

          {/* Action Buttons Right */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, minWidth: 200, alignSelf: { xs: "stretch", md: "flex-start" } }}>
            {canManage && (
              <Button
                variant="contained"
                startIcon={<UserPlus size={16} />}
                onClick={() => setInviteDialogOpen(true)}
                sx={{ fontWeight: 600, borderRadius: 2 }}
              >
                Invite Member
              </Button>
            )}

            {canManage && (
              <Button
                variant="outlined"
                startIcon={<Edit size={16} />}
                onClick={() => setEditDialogOpen(true)}
                sx={{ fontWeight: 600, borderRadius: 2 }}
              >
                Edit Project
              </Button>
            )}

            {isMember && !isOwner && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<LogOut size={16} />}
                onClick={handleLeaveProject}
                sx={{ fontWeight: 600, borderRadius: 2 }}
              >
                Leave Team
              </Button>
            )}

            {(isOwner || isAdmin) && (
              <Button
                variant="text"
                color="error"
                size="small"
                startIcon={<Trash2 size={15} />}
                onClick={handleDeleteProject}
                sx={{ fontSize: "0.8rem" }}
              >
                Delete Project
              </Button>
            )}
          </Box>
        </Box>
      </Card>

      {/* Alerts */}
      {successMsg && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: "1px solid", borderColor: "divider", mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
          <Tab
            label={`Kanban Task Board (${tasks.length})`}
            value="BOARD"
            sx={{ fontWeight: 600 }}
          />
          <Tab
            label={`Team Roster (${project.members.length})`}
            value="TEAM"
            sx={{ fontWeight: 600 }}
          />
          <Tab label="Project Specs & Repo" value="ABOUT" sx={{ fontWeight: 600 }} />
        </Tabs>
      </Box>

      {/* Tab 1: Kanban Task Board */}
      {activeTab === "BOARD" && (
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
            <Typography variant="h6" fontWeight={700}>
              Sprint Board & Tasks
            </Typography>
            {isMember && (
              <Button
                variant="contained"
                size="small"
                startIcon={<Plus size={16} />}
                onClick={() => handleOpenCreateTask("TODO")}
                sx={{ fontWeight: 600, borderRadius: 2 }}
              >
                Add Task
              </Button>
            )}
          </Box>

          {tasksLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress size={36} />
            </Box>
          ) : (
            <KanbanBoard
              tasks={tasks}
              members={project.members}
              canEdit={isMember || isAdmin}
              onAddTask={handleOpenCreateTask}
              onEditTask={handleOpenEditTask}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onDeleteTask={handleDeleteTask}
            />
          )}
        </Box>
      )}

      {/* Tab 2: Team Roster */}
      {activeTab === "TEAM" && (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" fontWeight={700}>
                Project Collaborators ({project.members.length})
              </Typography>
              {canManage && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<UserPlus size={16} />}
                  onClick={() => setInviteDialogOpen(true)}
                  sx={{ fontWeight: 600 }}
                >
                  Invite New Member
                </Button>
              )}
            </Box>
            <Divider sx={{ mb: 2 }} />

            <List disablePadding>
              {project.members.map((mem, idx) => {
                const isProjectOwner = mem.role === "OWNER" || project.owner.id === mem.user.id;

                return (
                  <React.Fragment key={mem.id}>
                    {idx > 0 && <Divider component="li" />}
                    <ListItem sx={{ py: 1.5, px: 1 }}>
                      <ListItemAvatar>
                        <Avatar
                          src={mem.user.avatarUrl || undefined}
                          sx={{
                            bgcolor: isProjectOwner
                              ? "primary.main"
                              : mem.role === "MAINTAINER"
                              ? "secondary.main"
                              : "grey.400",
                            fontWeight: 700,
                          }}
                        >
                          {mem.user.name.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography variant="subtitle2" fontWeight={700}>
                              {mem.user.name}
                            </Typography>
                            {isProjectOwner ? (
                              <Chip
                                icon={<Crown size={12} />}
                                label="Owner"
                                size="small"
                                color="primary"
                                sx={{ fontWeight: 700, height: 22, fontSize: "0.68rem" }}
                              />
                            ) : mem.role === "MAINTAINER" ? (
                              <Chip
                                icon={<Shield size={12} />}
                                label="Maintainer"
                                size="small"
                                color="secondary"
                                sx={{ fontWeight: 700, height: 22, fontSize: "0.68rem" }}
                              />
                            ) : (
                              <Chip
                                label="Contributor"
                                size="small"
                                variant="outlined"
                                sx={{ fontWeight: 600, height: 22, fontSize: "0.68rem" }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {mem.user.email}
                            {mem.user.department ? ` • ${mem.user.department}` : ""}
                            {` • Joined ${new Date(mem.joinedAt).toLocaleDateString()}`}
                          </Typography>
                        }
                      />

                      {/* Member Actions */}
                      <ListItemSecondaryAction>
                        {(isOwner || isAdmin) && !isProjectOwner && (
                          <Box sx={{ display: "flex", gap: 1 }}>
                            {mem.role === "MAINTAINER" ? (
                              <Button
                                size="small"
                                variant="outlined"
                                color="inherit"
                                onClick={() => handleMemberRoleUpdate(mem.user.id, "CONTRIBUTOR")}
                                sx={{ fontSize: "0.72rem", textTransform: "none" }}
                              >
                                Demote to Contributor
                              </Button>
                            ) : (
                              <Button
                                size="small"
                                variant="outlined"
                                color="secondary"
                                onClick={() => handleMemberRoleUpdate(mem.user.id, "MAINTAINER")}
                                sx={{ fontSize: "0.72rem", textTransform: "none" }}
                              >
                                Make Maintainer
                              </Button>
                            )}

                            <Tooltip title="Remove member from project">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveMember(mem.user.id)}
                              >
                                <Trash2 size={16} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}
                      </ListItemSecondaryAction>
                    </ListItem>
                  </React.Fragment>
                );
              })}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: About & Specs */}
      {activeTab === "ABOUT" && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: 3, p: 3, mb: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Project Specification & Scope
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: "pre-line", lineHeight: 1.7 }}>
                {project.description}
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 3, p: 3, mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" textTransform="uppercase" fontWeight={700} gutterBottom>
                Lead Architect / Owner
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1.5 }}>
                <Avatar
                  src={project.owner.avatarUrl || undefined}
                  sx={{ width: 48, height: 48, bgcolor: "primary.main", fontWeight: 700 }}
                >
                  {project.owner.name.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {project.owner.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {project.owner.department || "Student Researcher"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {project.owner.email}
                  </Typography>
                </Box>
              </Box>
            </Card>

            <Card sx={{ borderRadius: 3, p: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" textTransform="uppercase" fontWeight={700} gutterBottom>
                Repository & Links
              </Typography>
              {project.repoUrl ? (
                <Button
                  component="a"
                  href={project.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  variant="outlined"
                  fullWidth
                  startIcon={<Github size={16} />}
                  sx={{ mt: 1.5, fontWeight: 600 }}
                >
                  Open Source Code
                </Button>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  No repository linked for this project.
                </Typography>
              )}
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Edit Project Dialog */}
      <ProjectFormDialog
        open={editDialogOpen}
        project={project}
        onClose={() => setEditDialogOpen(false)}
        onSubmit={handleUpdateProject}
      />

      {/* Invite Collaborator Dialog */}
      <ProjectInviteDialog
        open={inviteDialogOpen}
        projectId={project.id}
        projectTitle={project.title}
        onClose={() => setInviteDialogOpen(false)}
        onInvitationSent={fetchProject}
      />

      {/* Task Form Dialog */}
      <TaskFormDialog
        open={taskDialogOpen}
        task={selectedTask}
        members={project.members}
        initialStatus={initialTaskStatus}
        onClose={() => setTaskDialogOpen(false)}
        onSubmit={handleSaveTask}
      />
    </Container>
  );
};
