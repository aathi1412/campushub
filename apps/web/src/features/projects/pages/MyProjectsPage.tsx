import React, { useState, useEffect, useCallback } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Stack,
  Divider,
} from "@mui/material";
import {
  FolderGit2,
  Mail,
  Plus,
  Compass,
  ArrowRight,
  Globe,
  Lock,
  Building,
  Check,
  X,
} from "lucide-react";
import { projectsApi } from "../projects.api.js";
import type {
  UserProjectItem,
  ProjectInvitation,
  CreateProjectPayload,
} from "../projects.api.js";
import { ProjectFormDialog } from "../components/ProjectFormDialog.js";

export const MyProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<UserProjectItem[]>([]);
  const [invitations, setInvitations] = useState<ProjectInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"PROJECTS" | "INVITATIONS">("PROJECTS");

  // Create Project Dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [projData, invData] = await Promise.all([
        projectsApi.getMyProjects(),
        projectsApi.listMyInvitations(),
      ]);
      setProjects(projData);
      setInvitations(invData);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to load project workspaces");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRespondInvitation = async (invitationId: string, action: "ACCEPT" | "REJECT") => {
    try {
      setError(null);
      await projectsApi.respondInvitation(invitationId, action);
      setSuccessMsg(action === "ACCEPT" ? "Invitation accepted! You joined the team." : "Invitation declined");
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to respond to invitation");
    }
  };

  const handleCreateProject = async (data: CreateProjectPayload) => {
    await projectsApi.createProject(data);
    await fetchData();
  };

  return (
    <Container maxWidth="xl" sx={{ py: 5 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: "primary.main",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FolderGit2 size={22} />
            </Box>
            <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: "-0.02em" }}>
              My Projects & Teams
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            Manage your project workspaces, sprint boards, and incoming team invitations.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button
            component={RouterLink}
            to="/projects"
            variant="outlined"
            startIcon={<Compass size={16} />}
            sx={{ fontWeight: 600, borderRadius: 2 }}
          >
            Explore Projects
          </Button>
          <Button
            variant="contained"
            startIcon={<Plus size={16} />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{ fontWeight: 600, borderRadius: 2 }}
          >
            New Project
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: "1px solid", borderColor: "divider", mb: 4 }}>
        <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
          <Tab
            label={`My Workspaces (${projects.length})`}
            value="PROJECTS"
            sx={{ fontWeight: 600 }}
          />
          <Tab
            label={`Team Invitations (${invitations.length})`}
            value="INVITATIONS"
            sx={{ fontWeight: 600 }}
          />
        </Tabs>
      </Box>

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

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress size={44} />
        </Box>
      ) : activeTab === "PROJECTS" ? (
        projects.length === 0 ? (
          <Card sx={{ textAlign: "center", py: 8, borderRadius: 3, border: "1px dashed", borderColor: "divider" }}>
            <CardContent>
              <FolderGit2 size={44} style={{ opacity: 0.3, marginBottom: 12 }} />
              <Typography variant="h6" fontWeight={700} gutterBottom>
                No active projects
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 450, mx: "auto", mb: 2 }}>
                You haven't joined or created any campus projects yet. Launch a new initiative or explore ongoing projects.
              </Typography>
              <Button variant="contained" onClick={() => setCreateDialogOpen(true)}>
                Start a Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {projects.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.membershipId}>
                <Card
                  sx={{
                    borderRadius: 3,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    border: "1px solid",
                    borderColor: "divider",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": { transform: "translateY(-3px)", boxShadow: 3 },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                      <Chip
                        label={item.role}
                        size="small"
                        color={item.role === "OWNER" ? "secondary" : "default"}
                        sx={{ fontWeight: 700, fontSize: "0.72rem" }}
                      />
                      <Chip
                        icon={
                          item.project.visibility === "PUBLIC" ? (
                            <Globe size={12} />
                          ) : item.project.visibility === "PRIVATE" ? (
                            <Lock size={12} />
                          ) : (
                            <Building size={12} />
                          )
                        }
                        label={item.project.visibility.replace("_", " ")}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 600, fontSize: "0.7rem", height: 22 }}
                      />
                    </Box>

                    <Typography
                      variant="h6"
                      fontWeight={700}
                      component={RouterLink}
                      to={`/projects/${item.project.id}`}
                      sx={{
                        textDecoration: "none",
                        color: "text.primary",
                        display: "block",
                        mb: 1,
                        "&:hover": { color: "primary.main" },
                      }}
                    >
                      {item.project.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        mb: 2,
                      }}
                    >
                      {item.project.description}
                    </Typography>

                    <Divider sx={{ my: 1.5 }} />

                    <Stack direction="row" justifyContent="space-between" color="text.secondary">
                      <Typography variant="caption">
                        {item.project.memberCount} Team Members
                      </Typography>
                      <Typography variant="caption">
                        {item.project.taskCount} Kanban Tasks
                      </Typography>
                    </Stack>
                  </CardContent>

                  <Box sx={{ p: 2, pt: 0 }}>
                    <Button
                      component={RouterLink}
                      to={`/projects/${item.project.id}`}
                      variant="outlined"
                      fullWidth
                      size="small"
                      endIcon={<ArrowRight size={15} />}
                      sx={{ fontWeight: 600 }}
                    >
                      Open Workspace
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )
      ) : invitations.length === 0 ? (
        <Card sx={{ textAlign: "center", py: 8, borderRadius: 3, border: "1px dashed", borderColor: "divider" }}>
          <CardContent>
            <Mail size={44} style={{ opacity: 0.3, marginBottom: 12 }} />
            <Typography variant="h6" fontWeight={700} gutterBottom>
              No pending invitations
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You do not have any pending invitations to join project teams right now.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {invitations.map((inv) => (
            <Grid item xs={12} sm={6} md={4} key={inv.id}>
              <Card sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", p: 2.5 }}>
                <Typography variant="caption" color="text.secondary" textTransform="uppercase" fontWeight={700}>
                  Team Invitation
                </Typography>
                <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5, mb: 1 }}>
                  {inv.project?.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Invited by {inv.inviter.name} to join as a Contributor.
                </Typography>

                <Box sx={{ display: "flex", gap: 1.5 }}>
                  <Button
                    variant="contained"
                    size="small"
                    fullWidth
                    startIcon={<Check size={16} />}
                    onClick={() => handleRespondInvitation(inv.id, "ACCEPT")}
                    sx={{ fontWeight: 600 }}
                  >
                    Accept
                  </Button>
                  <Button
                    variant="outlined"
                    color="inherit"
                    size="small"
                    fullWidth
                    startIcon={<X size={16} />}
                    onClick={() => handleRespondInvitation(inv.id, "REJECT")}
                  >
                    Decline
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Project Modal */}
      <ProjectFormDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateProject as any}
      />
    </Container>
  );
};
