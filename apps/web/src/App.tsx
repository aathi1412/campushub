import React from "react";
import { ThemeProvider, CssBaseline, Container, Box, Typography, Grid, Card, CardContent, Chip } from "@mui/material";
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
} from "lucide-react";
import { theme } from "./theme/theme.js";
import { Header } from "./components/layout/Header.js";

const modulesList = [
  { id: 1, title: "Module 1: Backend Foundation", status: "Active", desc: "Fastify 5, Prisma 7, MySQL, centralized errors & CORS", icon: Server },
  { id: 2, title: "Module 2: Auth & Users", status: "Next", desc: "Argon2id, Fastify JWT, refresh tokens, RBAC", icon: ShieldCheck },
  { id: 3, title: "Module 3: Events Management", status: "Upcoming", desc: "Campus events lifecycle, filtering, pagination", icon: Calendar },
  { id: 4, title: "Module 4: Registrations & Attendance", status: "Upcoming", desc: "Capacity transactions, attendance tracking", icon: CheckCircle2 },
  { id: 5, title: "Module 5: Clubs & Memberships", status: "Upcoming", desc: "Club directories, join requests, approval flows", icon: Users },
  { id: 6, title: "Module 6: Projects Collaboration", status: "Upcoming", desc: "Student teams, task Kanban, invitation workflows", icon: Briefcase },
  { id: 7, title: "Module 7: Campus Community", status: "Upcoming", desc: "Announcements, lost-and-found, polls & voting", icon: MessageSquare },
  { id: 8, title: "Module 8: Notifications", status: "Upcoming", desc: "In-app notifications, event triggers & alerts", icon: Bell },
  { id: 9, title: "Module 9: Admin Dashboard", status: "Upcoming", desc: "Platform metrics, role moderation & controls", icon: Sliders },
];

export const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Header />
        
        <Box component="main" sx={{ flexGrow: 1, py: 6 }}>
          <Container maxWidth="xl">
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
                CampusHub Platform
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640, mx: "auto", fontSize: "1.125rem" }}>
                Enterprise-grade campus management with Fastify, Prisma 7, MySQL, Argon2id, and React TypeScript.
              </Typography>
            </Box>

            {/* Modules Grid */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
                Platform Modules Architecture
              </Typography>
              <Grid container spacing={3}>
                {modulesList.map((m) => {
                  const Icon = m.icon;
                  const isActive = m.status === "Active";
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
                          borderLeft: isActive ? "4px solid #1e40af" : isNext ? "4px solid #2563eb" : undefined,
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                            <Box
                              sx={{
                                p: 1,
                                borderRadius: 1.5,
                                bgcolor: isActive ? "primary.main" : "grey.100",
                                color: isActive ? "white" : "text.secondary",
                              }}
                            >
                              <Icon size={20} />
                            </Box>
                            <Chip
                              label={m.status}
                              size="small"
                              color={isActive ? "success" : isNext ? "primary" : "default"}
                              variant={isActive ? "filled" : "outlined"}
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
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default App;
