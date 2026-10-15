import React, { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  Skeleton,
  Avatar,
  Divider,
  Paper,
  LinearProgress,
} from "@mui/material";
import {
  Calendar,
  Users,
  Briefcase,
  MapPin,
  Clock,
  ArrowRight,
  Sparkles,
  MessageSquare,
  Vote,
  FolderGit2,
  AlertCircle,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "../features/auth/AuthContext.js";
import { listEventsApi, type CampusEvent } from "../features/events/events.api.js";
import { clubsApi, type Club } from "../features/clubs/clubs.api.js";
import { projectsApi, type Project } from "../features/projects/projects.api.js";
import { communityApi, type CommunityPost, type PollItem } from "../features/community/community.api.js";

function formatDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(d);
  } catch {
    return dateStr;
  }
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

export const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  // State for data
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const [clubs, setClubs] = useState<Club[]>([]);
  const [clubsLoading, setClubsLoading] = useState(true);
  const [clubsError, setClubsError] = useState<string | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [activePoll, setActivePoll] = useState<PollItem | null>(null);
  const [communityLoading, setCommunityLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      // 1. Fetch upcoming events
      try {
        setEventsLoading(true);
        const res = await listEventsApi({ status: "PUBLISHED", timeframe: "upcoming", limit: 3 });
        if (isMounted) {
          setEvents(res.data || []);
          setEventsError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setEventsError(err?.response?.data?.error?.message || "Failed to load events");
        }
      } finally {
        if (isMounted) setEventsLoading(false);
      }

      // 2. Fetch featured clubs
      try {
        setClubsLoading(true);
        const res = await clubsApi.listClubs({ limit: 3, isActive: true });
        if (isMounted) {
          setClubs(res.data || []);
          setClubsError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setClubsError(err?.response?.data?.error?.message || "Failed to load clubs");
        }
      } finally {
        if (isMounted) setClubsLoading(false);
      }

      // 3. Fetch student projects
      try {
        setProjectsLoading(true);
        const res = await projectsApi.listProjects({ limit: 3 });
        if (isMounted) {
          setProjects(res.data || []);
          setProjectsError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setProjectsError(err?.response?.data?.error?.message || "Failed to load projects");
        }
      } finally {
        if (isMounted) setProjectsLoading(false);
      }

      // 4. Fetch community posts & polls
      try {
        setCommunityLoading(true);
        const [postsRes, pollsRes] = await Promise.allSettled([
          communityApi.listPosts({ limit: 2 }),
          communityApi.listPolls({ status: "active", limit: 1 }),
        ]);

        if (isMounted) {
          if (postsRes.status === "fulfilled") {
            setPosts(postsRes.value.posts || []);
          }
          if (pollsRes.status === "fulfilled") {
            const pollsList = pollsRes.value.polls || [];
            setActivePoll(pollsList[0] || null);
          }
        }
      } catch {
        // graceful fallback
      } finally {
        if (isMounted) setCommunityLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100%", bgcolor: "background.default" }}>
      {/* 1. Hero Section */}
      <Box
        component="section"
        sx={{
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
          pt: { xs: 6, md: 8 },
          pb: { xs: 7, md: 9 },
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Container maxWidth="xl">
          <Grid container spacing={6} alignItems="center">
            {/* Left Content */}
            <Grid item xs={12} md={7}>
              <Box sx={{ mb: 2 }}>
                <Chip
                  icon={<Sparkles size={14} color="#1e40af" />}
                  label="Unified Student Campus Platform"
                  size="small"
                  sx={{
                    bgcolor: "rgba(30, 64, 175, 0.08)",
                    color: "primary.main",
                    fontWeight: 600,
                    px: 0.5,
                    mb: 2.5,
                  }}
                />
                <Typography
                  variant="h1"
                  component="h1"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: "2.35rem", sm: "3.25rem", md: "3.75rem" },
                    lineHeight: 1.12,
                    letterSpacing: "-0.03em",
                    color: "text.primary",
                    mb: 2.5,
                  }}
                >
                  Your Campus. <br />
                  <Box component="span" sx={{ color: "primary.main" }}>
                    Your Community.
                  </Box>
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: { xs: "1.05rem", md: "1.2rem" },
                    color: "text.secondary",
                    lineHeight: 1.6,
                    maxWidth: 580,
                    mb: 4,
                  }}
                >
                  Discover campus events, connect with active student organizations, build collaborative projects,
                  and engage in university-wide discussions — all in one unified digital hub.
                </Typography>
              </Box>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                <Button
                  component={RouterLink}
                  to="/events"
                  variant="contained"
                  size="large"
                  endIcon={<ArrowRight size={18} />}
                  sx={{
                    px: 3.5,
                    py: 1.5,
                    fontWeight: 600,
                    fontSize: "1rem",
                    bgcolor: "primary.main",
                    "&:hover": { bgcolor: "primary.dark" },
                  }}
                >
                  Explore Events
                </Button>

                {isAuthenticated && user ? (
                  <Button
                    component={RouterLink}
                    to={user.role === "ADMIN" ? "/admin" : "/my-registrations"}
                    variant="outlined"
                    size="large"
                    sx={{
                      px: 3,
                      py: 1.5,
                      fontWeight: 600,
                      fontSize: "1rem",
                      borderColor: "divider",
                      color: "text.primary",
                      "&:hover": { borderColor: "primary.main", bgcolor: "rgba(30, 64, 175, 0.04)" },
                    }}
                  >
                    {user.role === "ADMIN" ? "Admin Console" : "My Dashboard"}
                  </Button>
                ) : (
                  <Button
                    component={RouterLink}
                    to="/register"
                    variant="outlined"
                    size="large"
                    sx={{
                      px: 3,
                      py: 1.5,
                      fontWeight: 600,
                      fontSize: "1rem",
                      borderColor: "divider",
                      color: "text.primary",
                      "&:hover": { borderColor: "primary.main", bgcolor: "rgba(30, 64, 175, 0.04)" },
                    }}
                  >
                    Join CampusHub
                  </Button>
                )}
              </Box>

              {/* Trust/Live Metrics Bar */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: { xs: 2.5, sm: 4 },
                  mt: 5,
                  pt: 3.5,
                  borderTop: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Box>
                  <Typography variant="h6" fontWeight={700} color="primary.main">
                    10+
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Active Modules
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box>
                  <Typography variant="h6" fontWeight={700} color="text.primary">
                    Fast & Secure
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    JWT & Argon2id Auth
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box>
                  <Typography variant="h6" fontWeight={700} color="text.primary">
                    Real-Time
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Capacity & Ticketing
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Right Graphical Illustration */}
            <Grid item xs={12} md={5}>
              <Paper
                elevation={0}
                sx={{
                  p: 3.5,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "#f8fafc",
                  position: "relative",
                }}
              >
                {/* Visual Campus Card Preview */}
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        bgcolor: "primary.main",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                      }}
                    >
                      <GraduationCap size={22} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>
                        University Life Hub
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Live Activity Feed
                      </Typography>
                    </Box>
                  </Box>
                  <Chip label="Live" size="small" color="success" variant="filled" sx={{ height: 22, fontWeight: 700, fontSize: "0.7rem" }} />
                </Box>

                {/* Mock Activity Cards */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: "background.paper",
                      border: "1px solid",
                      borderColor: "divider",
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <Box
                      sx={{
                        p: 1.25,
                        borderRadius: 1.5,
                        bgcolor: "rgba(30, 64, 175, 0.08)",
                        color: "primary.main",
                      }}
                    >
                      <Calendar size={20} />
                    </Box>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        Annual Hackathon 2026
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Registrations closing soon • Main Auditorium
                      </Typography>
                    </Box>
                    <Chip label="Open" size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: "0.65rem", fontWeight: 600 }} />
                  </Paper>

                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: "background.paper",
                      border: "1px solid",
                      borderColor: "divider",
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <Box
                      sx={{
                        p: 1.25,
                        borderRadius: 1.5,
                        bgcolor: "rgba(16, 185, 129, 0.08)",
                        color: "success.main",
                      }}
                    >
                      <Users size={20} />
                    </Box>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        Robotics & AI Club
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        New membership cohort open
                      </Typography>
                    </Box>
                    <Chip label="Recruiting" size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: "0.65rem", fontWeight: 600 }} />
                  </Paper>

                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: "background.paper",
                      border: "1px solid",
                      borderColor: "divider",
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <Box
                      sx={{
                        p: 1.25,
                        borderRadius: 1.5,
                        bgcolor: "rgba(100, 116, 139, 0.08)",
                        color: "secondary.main",
                      }}
                    >
                      <FolderGit2 size={20} />
                    </Box>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        Autonomous Rover Team
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Looking for 2 React & Python contributors
                      </Typography>
                    </Box>
                    <Chip label="3 Tasks" size="small" variant="outlined" sx={{ height: 20, fontSize: "0.65rem" }} />
                  </Paper>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 2. Quick-Access Cards Section */}
      <Box component="section" sx={{ py: 6, bgcolor: "background.default" }}>
        <Container maxWidth="xl">
          <Grid container spacing={3}>
            {/* Events Card */}
            <Grid item xs={12} md={4}>
              <Card
                elevation={0}
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  p: 3,
                  bgcolor: "background.paper",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    transform: "translateY(-3px)",
                    boxShadow: "0 6px 16px -2px rgba(0, 0, 0, 0.08)",
                    borderColor: "primary.light",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: "rgba(30, 64, 175, 0.08)",
                    color: "primary.main",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 2.5,
                  }}
                >
                  <Calendar size={24} />
                </Box>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  Events & Workshops
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flexGrow: 1, lineHeight: 1.6 }}>
                  Stay up to date with fests, technical conferences, academic seminars, and cultural showcases with
                  instant ticket registration.
                </Typography>
                <Button
                  component={RouterLink}
                  to="/events"
                  endIcon={<ArrowRight size={16} />}
                  sx={{ alignSelf: "flex-start", p: 0, fontWeight: 600, color: "primary.main" }}
                >
                  Browse Campus Events
                </Button>
              </Card>
            </Grid>

            {/* Clubs Card */}
            <Grid item xs={12} md={4}>
              <Card
                elevation={0}
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  p: 3,
                  bgcolor: "background.paper",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    transform: "translateY(-3px)",
                    boxShadow: "0 6px 16px -2px rgba(0, 0, 0, 0.08)",
                    borderColor: "primary.light",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: "rgba(16, 185, 129, 0.08)",
                    color: "#059669",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 2.5,
                  }}
                >
                  <Users size={24} />
                </Box>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  Clubs & Organizations
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flexGrow: 1, lineHeight: 1.6 }}>
                  Join verified student societies across tech, arts, sports, science, and community leadership with direct membership applications.
                </Typography>
                <Button
                  component={RouterLink}
                  to="/clubs"
                  endIcon={<ArrowRight size={16} />}
                  sx={{ alignSelf: "flex-start", p: 0, fontWeight: 600, color: "primary.main" }}
                >
                  Discover Student Clubs
                </Button>
              </Card>
            </Grid>

            {/* Projects Card */}
            <Grid item xs={12} md={4}>
              <Card
                elevation={0}
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  p: 3,
                  bgcolor: "background.paper",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    transform: "translateY(-3px)",
                    boxShadow: "0 6px 16px -2px rgba(0, 0, 0, 0.08)",
                    borderColor: "primary.light",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: "rgba(71, 85, 105, 0.08)",
                    color: "secondary.main",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 2.5,
                  }}
                >
                  <Briefcase size={24} />
                </Box>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  Peer Collaborations
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flexGrow: 1, lineHeight: 1.6 }}>
                  Find team partners, manage development roadmaps with integrated task boards, and share open campus projects.
                </Typography>
                <Button
                  component={RouterLink}
                  to="/projects"
                  endIcon={<ArrowRight size={16} />}
                  sx={{ alignSelf: "flex-start", p: 0, fontWeight: 600, color: "primary.main" }}
                >
                  Explore Peer Projects
                </Button>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 3. Upcoming Events Section */}
      <Box component="section" sx={{ py: 6, bgcolor: "background.paper", borderTop: "1px solid", borderColor: "divider" }}>
        <Container maxWidth="xl">
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mb: 4, flexWrap: "wrap", gap: 2 }}>
            <Box>
              <Typography variant="caption" color="primary.main" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Campus Calendar
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: "-0.02em", mt: 0.5 }}>
                Upcoming Events
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Join upcoming workshops, hackathons, and gatherings across departments.
              </Typography>
            </Box>
            <Button
              component={RouterLink}
              to="/events"
              variant="outlined"
              size="small"
              endIcon={<ArrowRight size={16} />}
              sx={{ fontWeight: 600 }}
            >
              View All Events
            </Button>
          </Box>

          {/* Events Grid */}
          <Grid container spacing={3}>
            {eventsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <Card sx={{ height: "100%", p: 2 }}>
                    <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 1.5, mb: 2 }} />
                    <Skeleton width="40%" height={24} sx={{ mb: 1 }} />
                    <Skeleton width="80%" height={28} sx={{ mb: 1.5 }} />
                    <Skeleton width="60%" height={20} sx={{ mb: 1 }} />
                    <Skeleton width="100%" height={36} sx={{ mt: 2 }} />
                  </Card>
                </Grid>
              ))
            ) : eventsError ? (
              <Grid item xs={12}>
                <Paper sx={{ p: 4, textAlign: "center", bgcolor: "background.default", border: "1px dashed", borderColor: "divider" }}>
                  <AlertCircle size={32} color="#64748b" style={{ margin: "0 auto 12px" }} />
                  <Typography variant="body1" fontWeight={600} color="text.secondary">
                    {eventsError}
                  </Typography>
                  <Button component={RouterLink} to="/events" sx={{ mt: 2 }} size="small">
                    Go to Events Catalog
                  </Button>
                </Paper>
              </Grid>
            ) : events.length === 0 ? (
              <Grid item xs={12}>
                <Paper sx={{ p: 5, textAlign: "center", bgcolor: "background.default", border: "1px dashed", borderColor: "divider" }}>
                  <Calendar size={36} color="#94a3b8" style={{ margin: "0 auto 12px" }} />
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    No upcoming events published yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, maxWidth: 420, mx: "auto" }}>
                    Campus coordinators are preparing exciting new events. Check back soon or browse all archives.
                  </Typography>
                  <Button component={RouterLink} to="/events" variant="contained" size="small">
                    Explore Events Hub
                  </Button>
                </Paper>
              </Grid>
            ) : (
              events.map((evt) => (
                <Grid item xs={12} sm={6} md={4} key={evt.id}>
                  <Card
                    elevation={0}
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      bgcolor: "background.paper",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        transform: "translateY(-3px)",
                        boxShadow: "0 6px 16px -2px rgba(0, 0, 0, 0.08)",
                      },
                    }}
                  >
                    {evt.bannerUrl ? (
                      <CardMedia
                        component="img"
                        height="150"
                        image={evt.bannerUrl}
                        alt={evt.title}
                        sx={{ objectFit: "cover" }}
                      />
                    ) : (
                      <Box
                        sx={{
                          height: 120,
                          bgcolor: "rgba(30, 64, 175, 0.06)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "primary.main",
                        }}
                      >
                        <Calendar size={36} />
                      </Box>
                    )}

                    <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", p: 2.5 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                        <Chip
                          label={evt.category}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: "0.7rem",
                            bgcolor: "rgba(30, 64, 175, 0.08)",
                            color: "primary.main",
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          Capacity: {evt.capacity}
                        </Typography>
                      </Box>

                      <Typography
                        variant="h6"
                        fontWeight={700}
                        sx={{
                          mb: 1.5,
                          fontSize: "1.05rem",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          lineHeight: 1.3,
                        }}
                      >
                        {evt.title}
                      </Typography>

                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2, mt: "auto" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary" }}>
                          <Clock size={15} />
                          <Typography variant="caption" fontWeight={500}>
                            {formatDateTime(evt.startTime)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary" }}>
                          <MapPin size={15} />
                          <Typography variant="caption" noWrap fontWeight={500}>
                            {evt.venue}
                          </Typography>
                        </Box>
                      </Box>

                      <Button
                        component={RouterLink}
                        to={`/events/${evt.id}`}
                        variant="contained"
                        fullWidth
                        size="small"
                        sx={{ mt: 1, fontWeight: 600 }}
                      >
                        View Details & Register
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        </Container>
      </Box>

      {/* 4. Featured Clubs Section */}
      <Box component="section" sx={{ py: 6, bgcolor: "background.default" }}>
        <Container maxWidth="xl">
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mb: 4, flexWrap: "wrap", gap: 2 }}>
            <Box>
              <Typography variant="caption" color="#059669" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Student Organizations
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: "-0.02em", mt: 0.5 }}>
                Featured Clubs & Societies
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Discover communities of passion, technical societies, and cultural organizations.
              </Typography>
            </Box>
            <Button
              component={RouterLink}
              to="/clubs"
              variant="outlined"
              size="small"
              endIcon={<ArrowRight size={16} />}
              sx={{ fontWeight: 600 }}
            >
              Browse All Clubs
            </Button>
          </Box>

          <Grid container spacing={3}>
            {clubsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <Card sx={{ height: "100%", p: 2.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                      <Skeleton variant="circular" width={48} height={48} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Skeleton width="60%" height={24} />
                        <Skeleton width="40%" height={18} />
                      </Box>
                    </Box>
                    <Skeleton width="100%" height={40} sx={{ mb: 2 }} />
                    <Skeleton width="100%" height={36} />
                  </Card>
                </Grid>
              ))
            ) : clubsError ? (
              <Grid item xs={12}>
                <Paper sx={{ p: 4, textAlign: "center", bgcolor: "background.paper", border: "1px dashed", borderColor: "divider" }}>
                  <AlertCircle size={32} color="#64748b" style={{ margin: "0 auto 12px" }} />
                  <Typography variant="body1" fontWeight={600} color="text.secondary">
                    {clubsError}
                  </Typography>
                  <Button component={RouterLink} to="/clubs" sx={{ mt: 2 }} size="small">
                    Explore Clubs Directory
                  </Button>
                </Paper>
              </Grid>
            ) : clubs.length === 0 ? (
              <Grid item xs={12}>
                <Paper sx={{ p: 5, textAlign: "center", bgcolor: "background.paper", border: "1px dashed", borderColor: "divider" }}>
                  <Users size={36} color="#94a3b8" style={{ margin: "0 auto 12px" }} />
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    No clubs active at this time
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, maxWidth: 420, mx: "auto" }}>
                    Student clubs are currently updating their registrations. You can be the first to start a new club!
                  </Typography>
                  <Button component={RouterLink} to="/clubs" variant="contained" size="small">
                    Visit Clubs Portal
                  </Button>
                </Paper>
              </Grid>
            ) : (
              clubs.map((club) => (
                <Grid item xs={12} sm={6} md={4} key={club.id}>
                  <Card
                    elevation={0}
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      p: 3,
                      bgcolor: "background.paper",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        transform: "translateY(-3px)",
                        boxShadow: "0 6px 16px -2px rgba(0, 0, 0, 0.08)",
                      },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 2 }}>
                      <Avatar
                        src={club.logoUrl || undefined}
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: "primary.main",
                          fontSize: "1.1rem",
                          fontWeight: 700,
                        }}
                      >
                        {club.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="h6" fontWeight={700} noWrap sx={{ fontSize: "1.05rem" }}>
                          {club.name}
                        </Typography>
                        <Chip
                          label={club.category}
                          size="small"
                          sx={{
                            mt: 0.5,
                            height: 22,
                            fontSize: "0.7rem",
                            fontWeight: 500,
                            bgcolor: "grey.100",
                            color: "text.secondary",
                          }}
                        />
                      </Box>
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2.5,
                        flexGrow: 1,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        lineHeight: 1.5,
                      }}
                    >
                      {club.description}
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        pt: 2,
                        borderTop: "1px solid",
                        borderColor: "divider",
                        mb: 2,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Users size={14} />
                        <strong>{club.memberCount}</strong> Members
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Calendar size={14} />
                        <strong>{club.eventCount}</strong> Events
                      </Typography>
                    </Box>

                    <Button
                      component={RouterLink}
                      to={`/clubs/${club.id}`}
                      variant="outlined"
                      fullWidth
                      size="small"
                      sx={{ fontWeight: 600 }}
                    >
                      Explore Club
                    </Button>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        </Container>
      </Box>

      {/* 5. Student Projects Section */}
      <Box component="section" sx={{ py: 6, bgcolor: "background.paper", borderTop: "1px solid", borderColor: "divider" }}>
        <Container maxWidth="xl">
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mb: 4, flexWrap: "wrap", gap: 2 }}>
            <Box>
              <Typography variant="caption" color="secondary.main" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Innovation & Engineering
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: "-0.02em", mt: 0.5 }}>
                Student Projects & Teams
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Peer-led development teams, research initiatives, and open collaboration.
              </Typography>
            </Box>
            <Button
              component={RouterLink}
              to="/projects"
              variant="outlined"
              size="small"
              endIcon={<ArrowRight size={16} />}
              sx={{ fontWeight: 600 }}
            >
              Browse All Projects
            </Button>
          </Box>

          <Grid container spacing={3}>
            {projectsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <Card sx={{ height: "100%", p: 2.5 }}>
                    <Skeleton width="40%" height={22} sx={{ mb: 1.5 }} />
                    <Skeleton width="80%" height={28} sx={{ mb: 1 }} />
                    <Skeleton width="100%" height={40} sx={{ mb: 2 }} />
                    <Skeleton width="60%" height={24} sx={{ mb: 2 }} />
                    <Skeleton width="100%" height={36} />
                  </Card>
                </Grid>
              ))
            ) : projectsError ? (
              <Grid item xs={12}>
                <Paper sx={{ p: 4, textAlign: "center", bgcolor: "background.default", border: "1px dashed", borderColor: "divider" }}>
                  <AlertCircle size={32} color="#64748b" style={{ margin: "0 auto 12px" }} />
                  <Typography variant="body1" fontWeight={600} color="text.secondary">
                    {projectsError}
                  </Typography>
                  <Button component={RouterLink} to="/projects" sx={{ mt: 2 }} size="small">
                    Go to Projects Directory
                  </Button>
                </Paper>
              </Grid>
            ) : projects.length === 0 ? (
              <Grid item xs={12}>
                <Paper sx={{ p: 5, textAlign: "center", bgcolor: "background.default", border: "1px dashed", borderColor: "divider" }}>
                  <FolderGit2 size={36} color="#94a3b8" style={{ margin: "0 auto 12px" }} />
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    No public student projects listed yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, maxWidth: 420, mx: "auto" }}>
                    Start a project team, recruit fellow students, and track tasks together.
                  </Typography>
                  <Button component={RouterLink} to="/projects" variant="contained" size="small">
                    Launch a Project
                  </Button>
                </Paper>
              </Grid>
            ) : (
              projects.map((proj) => {
                const techList = proj.technologies
                  ? proj.technologies.split(",").map((t) => t.trim()).filter(Boolean)
                  : [];

                return (
                  <Grid item xs={12} sm={6} md={4} key={proj.id}>
                    <Card
                      elevation={0}
                      sx={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        p: 3,
                        bgcolor: "background.paper",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          transform: "translateY(-3px)",
                          boxShadow: "0 6px 16px -2px rgba(0, 0, 0, 0.08)",
                        },
                      }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                        <Chip
                          label={proj.status.replace("_", " ")}
                          size="small"
                          color={proj.status === "COMPLETED" ? "success" : proj.status === "IN_PROGRESS" ? "primary" : "default"}
                          variant="outlined"
                          sx={{ height: 22, fontSize: "0.6875rem", fontWeight: 600 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {proj.memberCount} Contributor{proj.memberCount !== 1 ? "s" : ""}
                        </Typography>
                      </Box>

                      <Typography
                        variant="h6"
                        fontWeight={700}
                        sx={{
                          mb: 1,
                          fontSize: "1.1rem",
                          display: "-webkit-box",
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {proj.title}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 2,
                          flexGrow: 1,
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          lineHeight: 1.5,
                        }}
                      >
                        {proj.description}
                      </Typography>

                      {/* Tech Stack Chips */}
                      {techList.length > 0 && (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 2 }}>
                          {techList.slice(0, 3).map((tech, idx) => (
                            <Chip
                              key={idx}
                              label={tech}
                              size="small"
                              variant="outlined"
                              sx={{ height: 20, fontSize: "0.65rem", bgcolor: "grey.50" }}
                            />
                          ))}
                          {techList.length > 3 && (
                            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center", ml: 0.5 }}>
                              +{techList.length - 3}
                            </Typography>
                          )}
                        </Box>
                      )}

                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: "auto", pt: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: "0.75rem", bgcolor: "secondary.light" }}>
                            {proj.owner?.name?.charAt(0) || "U"}
                          </Avatar>
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 120 }}>
                            {proj.owner?.name || "Campus Student"}
                          </Typography>
                        </Box>

                        <Button
                          component={RouterLink}
                          to={`/projects/${proj.id}`}
                          size="small"
                          endIcon={<ArrowRight size={14} />}
                          sx={{ fontWeight: 600, color: "primary.main", p: 0 }}
                        >
                          Collaborate
                        </Button>
                      </Box>
                    </Card>
                  </Grid>
                );
              })
            )}
          </Grid>
        </Container>
      </Box>

      {/* 6. Campus Community & Polls Section */}
      <Box component="section" sx={{ py: 6, bgcolor: "background.default" }}>
        <Container maxWidth="xl">
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mb: 4, flexWrap: "wrap", gap: 2 }}>
            <Box>
              <Typography variant="caption" color="primary.main" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Campus Voice & Polls
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: "-0.02em", mt: 0.5 }}>
                Community Discussions & Polls
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Campus announcements, student inquiries, lost & found, and live campus voting.
              </Typography>
            </Box>
            <Button
              component={RouterLink}
              to="/community"
              variant="outlined"
              size="small"
              endIcon={<ArrowRight size={16} />}
              sx={{ fontWeight: 600 }}
            >
              Enter Community Hub
            </Button>
          </Box>

          <Grid container spacing={3}>
            {/* Left 7 Cols: Recent Posts */}
            <Grid item xs={12} md={7}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                <MessageSquare size={18} color="#1e40af" />
                Recent Discussions & Announcements
              </Typography>

              {communityLoading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <Card key={i} sx={{ p: 2.5, mb: 2 }}>
                    <Skeleton width="30%" height={20} sx={{ mb: 1 }} />
                    <Skeleton width="80%" height={24} sx={{ mb: 1 }} />
                    <Skeleton width="100%" height={36} />
                  </Card>
                ))
              ) : posts.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: "center", bgcolor: "background.paper", border: "1px dashed", borderColor: "divider" }}>
                  <Typography variant="body2" color="text.secondary">
                    No community posts shared yet. Be the first to start a conversation!
                  </Typography>
                  <Button component={RouterLink} to="/community" size="small" sx={{ mt: 1.5 }}>
                    Open Community Feed
                  </Button>
                </Paper>
              ) : (
                posts.map((post) => (
                  <Card
                    key={post.id}
                    elevation={0}
                    sx={{
                      p: 2.5,
                      mb: 2,
                      bgcolor: "background.paper",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: "0 4px 12px -2px rgba(0, 0, 0, 0.06)",
                      },
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                      <Chip
                        label={post.type.replace("_", " ")}
                        size="small"
                        color={post.type === "ANNOUNCEMENT" ? "primary" : post.type === "LOST_AND_FOUND" ? "warning" : "default"}
                        variant="filled"
                        sx={{ height: 20, fontSize: "0.6875rem", fontWeight: 700 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(post.createdAt)}
                      </Typography>
                    </Box>

                    <Typography
                      component={RouterLink}
                      to={`/community/posts/${post.id}`}
                      variant="h6"
                      fontWeight={700}
                      sx={{
                        fontSize: "1.05rem",
                        color: "text.primary",
                        textDecoration: "none",
                        "&:hover": { color: "primary.main" },
                        display: "block",
                        mb: 1,
                      }}
                    >
                      {post.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        lineHeight: 1.5,
                      }}
                    >
                      {post.content}
                    </Typography>

                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Avatar sx={{ width: 22, height: 22, fontSize: "0.7rem", bgcolor: "primary.main" }}>
                          {post.author?.name?.charAt(0) || "U"}
                        </Avatar>
                        <Typography variant="caption" color="text.secondary">
                          {post.author?.name || "Campus Member"}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <MessageSquare size={13} />
                        {post.commentCount} Comment{post.commentCount !== 1 ? "s" : ""}
                      </Typography>
                    </Box>
                  </Card>
                ))
              )}
            </Grid>

            {/* Right 5 Cols: Active Poll Teaser */}
            <Grid item xs={12} md={5}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                <Vote size={18} color="#059669" />
                Active Campus Poll
              </Typography>

              {communityLoading ? (
                <Card sx={{ p: 3 }}>
                  <Skeleton width="40%" height={20} sx={{ mb: 2 }} />
                  <Skeleton width="90%" height={28} sx={{ mb: 3 }} />
                  <Skeleton width="100%" height={24} sx={{ mb: 1 }} />
                  <Skeleton width="100%" height={24} sx={{ mb: 2 }} />
                </Card>
              ) : activePoll ? (
                <Card
                  elevation={0}
                  sx={{
                    p: 3,
                    bgcolor: "background.paper",
                    border: "1px solid",
                    borderColor: "divider",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                    <Chip
                      label="Active Poll"
                      size="small"
                      color="success"
                      variant="filled"
                      sx={{ height: 20, fontSize: "0.6875rem", fontWeight: 700 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {activePoll.totalVotes} total votes
                    </Typography>
                  </Box>

                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5, fontSize: "1.05rem" }}>
                    {activePoll.question}
                  </Typography>

                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3, flexGrow: 1 }}>
                    {activePoll.options.slice(0, 3).map((opt) => (
                      <Box key={opt.id}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                          <Typography variant="caption" fontWeight={600} color="text.primary">
                            {opt.text}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {opt.percentage}% ({opt.voteCount})
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={opt.percentage}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: "grey.100",
                            "& .MuiLinearProgress-bar": { bgcolor: "primary.main" },
                          }}
                        />
                      </Box>
                    ))}
                  </Box>

                  <Button
                    component={RouterLink}
                    to="/community"
                    variant="contained"
                    fullWidth
                    size="small"
                    sx={{ fontWeight: 600 }}
                  >
                    Cast Your Vote in Community
                  </Button>
                </Card>
              ) : (
                <Card elevation={0} sx={{ p: 4, textAlign: "center", bgcolor: "background.paper" }}>
                  <Vote size={32} color="#94a3b8" style={{ margin: "0 auto 12px" }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    No active polls currently running. Have a question for your peers?
                  </Typography>
                  <Button component={RouterLink} to="/community" variant="outlined" size="small">
                    Create a Poll
                  </Button>
                </Card>
              )}
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 7. Call To Action Banner */}
      <Box
        component="section"
        sx={{
          py: 7,
          bgcolor: "primary.main",
          color: "white",
          textAlign: "center",
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h4" fontWeight={800} sx={{ mb: 2, letterSpacing: "-0.02em" }}>
            Ready to shape your campus journey?
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, opacity: 0.9, fontSize: "1.1rem", lineHeight: 1.6 }}>
            Join thousands of students and faculty members. Attend workshops, join innovative teams, and make your voice heard on CampusHub.
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap" }}>
            {!isAuthenticated && (
              <Button
                component={RouterLink}
                to="/register"
                variant="contained"
                size="large"
                sx={{
                  bgcolor: "white",
                  color: "primary.main",
                  fontWeight: 700,
                  px: 3.5,
                  "&:hover": { bgcolor: "#f1f5f9" },
                }}
              >
                Create Free Account
              </Button>
            )}
            <Button
              component={RouterLink}
              to="/events"
              variant="outlined"
              size="large"
              sx={{
                borderColor: "rgba(255, 255, 255, 0.4)",
                color: "white",
                fontWeight: 600,
                px: 3,
                "&:hover": { borderColor: "white", bgcolor: "rgba(255, 255, 255, 0.1)" },
              }}
            >
              Browse Campus Events
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};
export default HomePage;
