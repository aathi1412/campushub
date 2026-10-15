import React from "react";
import { BrowserRouter, Routes, Route, Link as RouterLink } from "react-router-dom";
import {
  ThemeProvider,
  CssBaseline,
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
} from "@mui/material";
import {
  Layers,
  ShieldCheck,
  Calendar,
  Users,
  Briefcase,
  MessageSquare,
  Bell,
  Sliders,
  CheckCircle2,
  Server,
  ArrowRight,
} from "lucide-react";
import { theme } from "./theme/theme.js";
import { Header } from "./components/layout/Header.js";
import { AuthProvider, useAuth } from "./features/auth/AuthContext.js";
import { LoginPage } from "./features/auth/pages/LoginPage.js";
import { RegisterPage } from "./features/auth/pages/RegisterPage.js";
import { ProfilePage } from "./features/users/pages/ProfilePage.js";
import { EventsListPage } from "./features/events/pages/EventsListPage.js";
import { EventDetailPage } from "./features/events/pages/EventDetailPage.js";
import { MyRegistrationsPage } from "./features/event-registrations/pages/MyRegistrationsPage.js";
import { ClubsListPage } from "./features/clubs/pages/ClubsListPage.js";
import { ClubDetailPage } from "./features/clubs/pages/ClubDetailPage.js";
import { MyClubsPage } from "./features/clubs/pages/MyClubsPage.js";
import { ProjectsListPage } from "./features/projects/pages/ProjectsListPage.js";
import { ProjectDetailPage } from "./features/projects/pages/ProjectDetailPage.js";
import { MyProjectsPage } from "./features/projects/pages/MyProjectsPage.js";
import { CommunityFeedPage } from "./features/community/CommunityFeedPage.js";
import { PostDetailPage } from "./features/community/PostDetailPage.js";
import { NotificationsPage } from "./features/notifications/NotificationsPage.js";
import { AdminDashboardPage } from "./features/admin/AdminDashboardPage.js";
import { ProtectedRoute } from "./components/common/ProtectedRoute.js";

const modulesList = [
  { id: 1, title: "Module 1: Backend Foundation", status: "Completed", desc: "Fastify 5, Prisma 7, MySQL, centralized errors & CORS", icon: Server },
  { id: 2, title: "Module 2: Auth & Users", status: "Completed", desc: "Argon2id, Fastify JWT, refresh tokens, RBAC & profiles", icon: ShieldCheck },
  { id: 3, title: "Module 3: Events Management", status: "Completed", desc: "Campus events lifecycle, filtering, pagination", icon: Calendar },
  { id: 4, title: "Module 4: Registrations & Attendance", status: "Completed", desc: "Capacity transactions, attendance tracking", icon: CheckCircle2 },
  { id: 5, title: "Module 5: Clubs & Memberships", status: "Completed", desc: "Club directories, join requests, approval flows", icon: Users },
  { id: 6, title: "Module 6: Projects Collaboration", status: "Completed", desc: "Student teams, task Kanban, invitation workflows", icon: Briefcase },
  { id: 7, title: "Module 7: Campus Community & Polls", status: "Completed", desc: "Announcements, lost-and-found, polls & voting", icon: MessageSquare },
  { id: 8, title: "Module 8: Notifications & Alerts", status: "Completed", desc: "In-app alerts, unread counts, broadcast engine", icon: Bell },
  { id: 9, title: "Module 9: Admin Dashboard & Analytics", status: "Completed", desc: "Platform metrics, role moderation & controls", icon: Sliders },
  { id: 10, title: "Module 10: Production Hardening & Docker", status: "Completed", desc: "Docker Compose, rate limits, Helmet security & docs", icon: ShieldCheck },
];

const DashboardHome: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <Container maxWidth="xl" sx={{ py: 6 }}>
      {/* Hero Section */}
      <Box sx={{ mb: 6, textAlign: "center" }}>
        <Chip
          label="Modular Monorepo Architecture"
          color="primary"
          variant="outlined"
          icon={<Layers size={14} />}
          sx={{ mb: 2, fontWeight: 500 }}
        />
        <Typography variant="h3" component="h1" fontWeight={800} sx={{ letterSpacing: "-0.03em", mb: 2 }}>
          {isAuthenticated && user ? `Welcome back, ${user.name}` : "CampusHub Platform"}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640, mx: "auto", fontSize: "1.125rem", mb: 3 }}>
          {isAuthenticated && user
            ? `Signed in as ${user.email} (${user.role}). Your campus portal is ready.`
            : "Enterprise-grade campus management with Fastify, Prisma 7, MySQL, Argon2id, and React TypeScript."}
        </Typography>

        {!isAuthenticated && (
          <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
            <Button
              component={RouterLink}
              to="/register"
              variant="contained"
              size="large"
              endIcon={<ArrowRight size={18} />}
              sx={{ px: 3, fontWeight: 600 }}
            >
              Get Started
            </Button>
            <Button
              component={RouterLink}
              to="/login"
              variant="outlined"
              size="large"
              sx={{ px: 3, fontWeight: 600 }}
            >
              Sign In
            </Button>
          </Box>
        )}
      </Box>

      {/* Modules Grid */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
          Platform Modules Architecture
        </Typography>
        <Grid container spacing={3}>
          {modulesList.map((m) => {
            const Icon = m.icon;
            const isCompleted = m.status === "Completed";
            const isNext = m.status === "Next";

            return (
              <Grid item xs={12} sm={6} md={4} key={m.id}>
                <Card
                  elevation={1}
                  sx={{
                    height: "100%",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                    },
                    borderLeft: isCompleted
                      ? "4px solid #10b981"
                      : isNext
                      ? "4px solid #1e40af"
                      : undefined,
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 1.5,
                          bgcolor: isCompleted ? "success.main" : isNext ? "primary.main" : "grey.100",
                          color: isCompleted || isNext ? "white" : "text.secondary",
                        }}
                      >
                        <Icon size={20} />
                      </Box>
                      <Chip
                        label={m.status}
                        size="small"
                        color={isCompleted ? "success" : isNext ? "primary" : "default"}
                        variant={isCompleted ? "filled" : isNext ? "filled" : "outlined"}
                        sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                      />
                    </Box>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {m.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {m.desc}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Container>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <Header />
            <Box component="main" sx={{ flexGrow: 1 }}>
              <Routes>
                <Route path="/" element={<DashboardHome />} />
                <Route path="/events" element={<EventsListPage />} />
                <Route path="/events/:id" element={<EventDetailPage />} />
                <Route path="/clubs" element={<ClubsListPage />} />
                <Route path="/clubs/:id" element={<ClubDetailPage />} />
                <Route
                  path="/my-clubs"
                  element={
                    <ProtectedRoute>
                      <MyClubsPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/projects" element={<ProjectsListPage />} />
                <Route path="/projects/:id" element={<ProjectDetailPage />} />
                <Route
                  path="/my-projects"
                  element={
                    <ProtectedRoute>
                      <MyProjectsPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/community" element={<CommunityFeedPage />} />
                <Route path="/community/posts/:id" element={<PostDetailPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-registrations"
                  element={
                    <ProtectedRoute>
                      <MyRegistrationsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <NotificationsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="*"
                  element={
                    <Container sx={{ py: 8, textAlign: "center" }}>
                      <Typography variant="h4" fontWeight={700} gutterBottom>
                        404 — Page Not Found
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        The page you requested does not exist on CampusHub.
                      </Typography>
                      <Button component={RouterLink} to="/" variant="contained">
                        Return to Dashboard
                      </Button>
                    </Container>
                  }
                />
              </Routes>
            </Box>
          </Box>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
