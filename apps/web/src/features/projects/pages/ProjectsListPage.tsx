import React, { useState, useEffect, useCallback } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  MenuItem,
  Button,
  Pagination,
  CircularProgress,
  Alert,
  Card,
  CardContent,
} from "@mui/material";
import {
  Search,
  Plus,
  FolderGit2,
  Mail,
  Compass,
} from "lucide-react";
import { projectsApi } from "../projects.api.js";
import type {
  Project,
  CreateProjectPayload,
  ProjectStatus,
  ProjectVisibility,
  ProjectInvitation,
} from "../projects.api.js";
import { ProjectCard } from "../components/ProjectCard.js";
import { ProjectFormDialog } from "../components/ProjectFormDialog.js";
import { useAuth } from "../../auth/AuthContext.js";

export const ProjectsListPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [visibilityFilter, setVisibilityFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Invitations
  const [pendingInvitations, setPendingInvitations] = useState<ProjectInvitation[]>([]);

  // Dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await projectsApi.listProjects({
        page,
        limit: 9,
        search: search.trim() || undefined,
        status: statusFilter === "ALL" ? undefined : (statusFilter as ProjectStatus),
        visibility: visibilityFilter === "ALL" ? undefined : (visibilityFilter as ProjectVisibility),
      });

      setProjects(res.data);
      setTotalPages(res.meta?.totalPages ?? 1);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, visibilityFilter]);

  const fetchInvitations = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await projectsApi.listMyInvitations();
      setPendingInvitations(data);
    } catch {
      // Ignore
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchProjects();
    fetchInvitations();
  }, [fetchProjects, fetchInvitations]);

  const handleCreateProject = async (data: CreateProjectPayload) => {
    await projectsApi.createProject(data);
    await fetchProjects();
  };

  const handleRespondInvitation = async (invitationId: string, action: "ACCEPT" | "REJECT") => {
    try {
      await projectsApi.respondInvitation(invitationId, action);
      await fetchInvitations();
      await fetchProjects();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to respond to invitation");
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 5 }}>
      {/* Page Header */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
          gap: 2,
        }}
      >
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
              Collaborative Projects
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            Discover student-led engineering, research, and creative projects across campus.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5 }}>
          {isAuthenticated && (
            <Button
              component={RouterLink}
              to="/my-projects"
              variant="outlined"
              sx={{ fontWeight: 600, borderRadius: 2 }}
            >
              My Projects
            </Button>
          )}

          {isAuthenticated && (
            <Button
              variant="contained"
              startIcon={<Plus size={18} />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{ fontWeight: 600, borderRadius: 2 }}
            >
              Start a Project
            </Button>
          )}
        </Box>
      </Box>

      {/* Pending Invitations Alert Banner */}
      {pendingInvitations.length > 0 && (
        <Alert
          severity="info"
          icon={<Mail size={20} />}
          sx={{ mb: 4, borderRadius: 3, alignItems: "center" }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", flexWrap: "wrap", gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={700}>
                You have {pendingInvitations.length} pending project team invitation{pendingInvitations.length > 1 ? "s" : ""}!
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {pendingInvitations[0].inviter.name} invited you to collaborate on '{pendingInvitations[0].project?.title}'.
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                size="small"
                variant="contained"
                color="primary"
                onClick={() => handleRespondInvitation(pendingInvitations[0].id, "ACCEPT")}
                sx={{ fontWeight: 700, fontSize: "0.75rem" }}
              >
                Accept
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                onClick={() => handleRespondInvitation(pendingInvitations[0].id, "REJECT")}
                sx={{ fontSize: "0.75rem" }}
              >
                Decline
              </Button>
            </Box>
          </Box>
        </Alert>
      )}

      {/* Filter and Search Bar */}
      <Card elevation={0} sx={{ mb: 4, p: 2, bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search projects by title, stack, or keywords..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} color="gray" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={6} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="ALL">All Statuses</MenuItem>
              <MenuItem value="PLANNING">Planning</MenuItem>
              <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
              <MenuItem value="COMPLETED">Completed</MenuItem>
              <MenuItem value="ARCHIVED">Archived</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={6} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Visibility"
              value={visibilityFilter}
              onChange={(e) => {
                setVisibilityFilter(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="ALL">All Visibilities</MenuItem>
              <MenuItem value="PUBLIC">Public</MenuItem>
              <MenuItem value="CAMPUS_ONLY">Campus Only</MenuItem>
              <MenuItem value="PRIVATE">Private</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Card>

      {/* Error alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Projects Grid */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress size={44} />
        </Box>
      ) : projects.length === 0 ? (
        <Card sx={{ textAlign: "center", py: 8, borderRadius: 3, border: "1px dashed", borderColor: "divider" }}>
          <CardContent>
            <Compass size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
            <Typography variant="h6" fontWeight={700} gutterBottom>
              No projects found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 450, mx: "auto", mb: 2 }}>
              No campus projects matched your current search filters. Try adjusting your query or launch a project of your own!
            </Typography>
            {isAuthenticated && (
              <Button
                variant="contained"
                startIcon={<Plus size={16} />}
                onClick={() => setCreateDialogOpen(true)}
              >
                Create Project
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Grid container spacing={3}>
            {projects.map((project) => (
              <Grid item xs={12} sm={6} md={4} key={project.id}>
                <ProjectCard project={project} />
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, val) => setPage(val)}
                color="primary"
                shape="rounded"
              />
            </Box>
          )}
        </>
      )}

      {/* Project Form Dialog */}
      <ProjectFormDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateProject as any}
      />
    </Container>
  );
};
