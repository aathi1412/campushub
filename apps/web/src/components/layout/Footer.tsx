import React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Container,
  Grid2 as Grid,
  Typography,
  Link,
  Divider,
} from "@mui/material";
import {
  GraduationCap,
  Calendar,
  Users,
  Briefcase,
  MessageSquare,
  Heart,
} from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: "#f1f5f9",
        borderTop: "1px solid",
        borderColor: "divider",
        mt: "auto",
        pt: 6,
        pb: 4,
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={{ xs: 4, md: 14, lg: 30 }} sx={{ mb: 4 }} >
          {/* Brand & Mission Column */}
          <Grid>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1.5,
                  bgcolor: "primary.main",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                }}
              >
                <GraduationCap size={22} />
              </Box>
              <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: "-0.02em", color: "text.primary" }}>
                CampusHub
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 340, mb: 2, lineHeight: 1.6 }}>
              The unified student-focused campus management platform. Connecting students, clubs, peer projects, and community life in one cohesive portal.
            </Typography>
          </Grid>

          {/* Platform Navigation */}
          <Grid >
            <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 2 }}>
              Campus Life
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
              <Link
                component={RouterLink}
                to="/events"
                underline="hover"
                color="text.secondary"
                sx={{
                  fontSize: "0.875rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1,
                  "&:hover": { color: "primary.main" },
                }}
              >
                <Calendar size={15} />
                Upcoming Events
              </Link>
              <Link
                component={RouterLink}
                to="/clubs"
                underline="hover"
                color="text.secondary"
                sx={{
                  fontSize: "0.875rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1,
                  "&:hover": { color: "primary.main" },
                }}
              >
                <Users size={15} />
                Student Clubs
              </Link>
              <Link
                component={RouterLink}
                to="/projects"
                underline="hover"
                color="text.secondary"
                sx={{
                  fontSize: "0.875rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1,
                  "&:hover": { color: "primary.main" },
                }}
              >
                <Briefcase size={15} />
                Peer Projects
              </Link>
              <Link
                component={RouterLink}
                to="/community"
                underline="hover"
                color="text.secondary"
                sx={{
                  fontSize: "0.875rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1,
                  "&:hover": { color: "primary.main" },
                }}
              >
                <MessageSquare size={15} />
                Community & Polls
              </Link>
            </Box>
          </Grid>

          {/* Resources & Support */}
          <Grid >
            <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 2 }}>
              Support & Info
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
              <Link
                component={RouterLink}
                to="#"
                underline="hover"
                color="text.secondary"
                sx={{ fontSize: "0.875rem", "&:hover": { color: "primary.main" } }}
              >
                About CampusHub
              </Link>
              <Link
                component={RouterLink}
                to="#"
                underline="hover"
                color="text.secondary"
                sx={{ fontSize: "0.875rem", "&:hover": { color: "primary.main" } }}
              >
                Help & FAQs
              </Link>
              <Link
                component={RouterLink}
                to="#"
                underline="hover"
                color="text.secondary"
                sx={{ fontSize: "0.875rem", "&:hover": { color: "primary.main" } }}
              >
                Contact Support
              </Link>
              <Link
                component={RouterLink}
                to="#"
                underline="hover"
                color="text.secondary"
                sx={{ fontSize: "0.875rem", "&:hover": { color: "primary.main" } }}
              >
                Privacy Policy
              </Link>
            </Box>
          </Grid>

          {/* Platform & Architecture */}
          {/* <Grid item xs={12} sm={4} md={3}>
            <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 2 }}>
              Platform Engineering
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: "0.875rem" }}>
              Explore the underlying 10-module modular monorepo architecture, APIs, and security configurations.
            </Typography>
            <Link
              component={RouterLink}
              to="/platform"
              underline="hover"
              color="primary.main"
              sx={{
                fontSize: "0.875rem",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Layers size={16} />
              Platform Modules Architecture →
            </Link>
          </Grid> */}
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Bottom row */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary">
              © {new Date().getFullYear()} CampusHub Inc. All rights reserved.
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              Engineered with <Heart size={14} color="#ef4444" fill="#ef4444" /> for university communities.
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 3, mr: 6 }}>
            <Link
              component={RouterLink}
              to="#"
              underline="hover"
              color="text.secondary"
              sx={{ fontSize: "0.75rem" }}
            >
              Privacy Policy
            </Link>
            <Link
              component={RouterLink}
              to="#"
              underline="hover"
              color="text.secondary"
              sx={{ fontSize: "0.75rem" }}
            >
              Terms of Use
            </Link>
          </Box>
        </Box>
      </Container>
    </Box >
  );
};
export default Footer;
