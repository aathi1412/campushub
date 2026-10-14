import React from "react";
import { AppBar, Toolbar, Typography, Box, Container } from "@mui/material";
import { GraduationCap } from "lucide-react";
import { HealthCheckBadge } from "../common/HealthCheckBadge.js";

export const Header: React.FC = () => {
  return (
    <AppBar position="static" color="inherit" elevation={1} sx={{ bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider" }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ justifyContent: "space-between", height: 64 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
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
            <Box
              sx={{
                ml: 1,
                px: 1,
                py: 0.25,
                borderRadius: 1,
                bgcolor: "primary.50",
                color: "primary.dark",
                fontSize: "0.75rem",
                fontWeight: 600,
              }}
            >
              Platform
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <HealthCheckBadge />
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};
