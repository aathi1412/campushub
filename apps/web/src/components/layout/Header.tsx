import React from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Container,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
} from "@mui/material";
import { GraduationCap, LogOut, User as UserIcon, Shield, Ticket, Users as UsersIcon, FolderGit2 } from "lucide-react";
import { HealthCheckBadge } from "../common/HealthCheckBadge.js";
import { useAuth } from "../../features/auth/AuthContext.js";

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    navigate("/");
  };

  return (
    <AppBar
      position="static"
      color="inherit"
      elevation={1}
      sx={{ bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider" }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ justifyContent: "space-between", height: 64 }}>
          {/* Logo & Brand */}
          <Box
            component={RouterLink}
            to="/"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              textDecoration: "none",
              color: "inherit",
            }}
          >
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
                display: { xs: "none", sm: "block" },
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

          {/* Navigation Links */}
          <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 3 }}>
            <Button
              component={RouterLink}
              to="/events"
              color="inherit"
              sx={{ fontWeight: 600, color: "text.secondary", "&:hover": { color: "primary.main" } }}
            >
              Events
            </Button>
            <Button
              component={RouterLink}
              to="/clubs"
              color="inherit"
              sx={{ fontWeight: 600, color: "text.secondary", "&:hover": { color: "primary.main" } }}
            >
              Clubs
            </Button>
            <Button
              component={RouterLink}
              to="/projects"
              color="inherit"
              sx={{ fontWeight: 600, color: "text.secondary", "&:hover": { color: "primary.main" } }}
            >
              Projects
            </Button>
          </Box>

          {/* Right Navigation Controls */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <HealthCheckBadge />

            {isAuthenticated && user ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Chip
                  icon={<Shield size={12} />}
                  label={user.role}
                  size="small"
                  color={user.role === "ADMIN" ? "secondary" : "primary"}
                  variant="outlined"
                  sx={{ fontWeight: 600, fontSize: "0.7rem", display: { xs: "none", sm: "flex" } }}
                />

                <IconButton onClick={handleMenuOpen} size="small" sx={{ p: 0.5 }}>
                  <Avatar
                    sx={{
                      width: 34,
                      height: 34,
                      bgcolor: "primary.main",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                    }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>

                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  transformOrigin={{ vertical: "top", horizontal: "right" }}
                  PaperProps={{
                    sx: { minWidth: 200, mt: 1, boxShadow: 3, borderRadius: 2 },
                  }}
                >
                  <Box sx={{ px: 2, py: 1.5 }}>
                    <Typography variant="subtitle2" fontWeight={600} noWrap>
                      {user.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap display="block">
                      {user.email}
                    </Typography>
                  </Box>
                  <Divider />
                  <MenuItem
                    component={RouterLink}
                    to="/my-registrations"
                    onClick={handleMenuClose}
                    sx={{ gap: 1.5, py: 1 }}
                  >
                    <Ticket size={16} />
                    My Registrations
                  </MenuItem>
                  <MenuItem
                    component={RouterLink}
                    to="/my-clubs"
                    onClick={handleMenuClose}
                    sx={{ gap: 1.5, py: 1 }}
                  >
                    <UsersIcon size={16} />
                    My Clubs
                  </MenuItem>
                  <MenuItem
                    component={RouterLink}
                    to="/my-projects"
                    onClick={handleMenuClose}
                    sx={{ gap: 1.5, py: 1 }}
                  >
                    <FolderGit2 size={16} />
                    My Projects
                  </MenuItem>
                  <MenuItem
                    component={RouterLink}
                    to="/profile"
                    onClick={handleMenuClose}
                    sx={{ gap: 1.5, py: 1 }}
                  >
                    <UserIcon size={16} />
                    Profile & Account
                  </MenuItem>
                  <MenuItem onClick={handleLogout} sx={{ gap: 1.5, py: 1, color: "error.main" }}>
                    <LogOut size={16} />
                    Sign Out
                  </MenuItem>
                </Menu>
              </Box>
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="text"
                  size="small"
                  sx={{ fontWeight: 600 }}
                >
                  Sign In
                </Button>
                <Button
                  component={RouterLink}
                  to="/register"
                  variant="contained"
                  size="small"
                  sx={{ fontWeight: 600 }}
                >
                  Create Account
                </Button>
              </Box>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};
