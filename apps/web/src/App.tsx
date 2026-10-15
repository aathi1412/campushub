import React from "react";
import { BrowserRouter, Routes, Route, Link as RouterLink } from "react-router-dom";
import {
  ThemeProvider,
  CssBaseline,
  Container,
  Box,
  Typography,
  Button,
} from "@mui/material";
import { theme } from "./theme/theme.js";
import { Header } from "./components/layout/Header.js";
import { Footer } from "./components/layout/Footer.js";
import { AuthProvider } from "./features/auth/AuthContext.js";
import { HomePage } from "./pages/HomePage.js";
import { PlatformArchitecturePage } from "./pages/PlatformArchitecturePage.js";
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
                <Route path="/" element={<HomePage />} />
                <Route path="/platform" element={<PlatformArchitecturePage />} />
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
            <Footer />
          </Box>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
