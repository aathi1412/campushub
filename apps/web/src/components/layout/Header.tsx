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
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  GraduationCap,
  LogOut,
  User as UserIcon,
  Shield,
  Ticket,
  Users as UsersIcon,
  FolderGit2,
  Bell,
  Menu as MenuIcon,
  X as CloseIcon,
  Calendar,
  MessageSquare,
  Layers,
  LayoutDashboard,
} from "lucide-react";
import { HealthCheckBadge } from "../common/HealthCheckBadge.js";
import { useAuth } from "../../features/auth/AuthContext.js";
import { NotificationBell } from "../../features/notifications/NotificationBell.js";

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    setDrawerOpen(false);
    await logout();
    navigate("/");
  };

  const handleDrawerToggle = () => {
    setDrawerOpen((prev) => !prev);
  };

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        borderBottom: "1px solid",
        borderColor: "divider",
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ justifyContent: "space-between", height: 68 }}>
          {/* Logo & Brand */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {/* Mobile Hamburger Button */}
            <IconButton
              color="inherit"
              aria-label="open navigation menu"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ display: { xs: "flex", md: "none" }, mr: 0.5 }}
            >
              <MenuIcon size={22} />
            </IconButton>

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
                  boxShadow: "0 2px 4px rgba(30, 64, 175, 0.2)",
                }}
              >
                <GraduationCap size={22} />
              </Box>
              <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: "-0.02em", color: "text.primary" }}>
                CampusHub
              </Typography>
            </Box>
          </Box>

          {/* Desktop Navigation Links */}
          <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 1 }}>
            <Button
              component={RouterLink}
              to="/events"
              color="inherit"
              sx={{
                fontWeight: 600,
                color: "text.secondary",
                px: 1.5,
                "&:hover": { color: "primary.main", bgcolor: "rgba(30, 64, 175, 0.04)" },
              }}
            >
              Events
            </Button>
            <Button
              component={RouterLink}
              to="/clubs"
              color="inherit"
              sx={{
                fontWeight: 600,
                color: "text.secondary",
                px: 1.5,
                "&:hover": { color: "primary.main", bgcolor: "rgba(30, 64, 175, 0.04)" },
              }}
            >
              Clubs
            </Button>
            <Button
              component={RouterLink}
              to="/projects"
              color="inherit"
              sx={{
                fontWeight: 600,
                color: "text.secondary",
                px: 1.5,
                "&:hover": { color: "primary.main", bgcolor: "rgba(30, 64, 175, 0.04)" },
              }}
            >
              Projects
            </Button>
            <Button
              component={RouterLink}
              to="/community"
              color="inherit"
              sx={{
                fontWeight: 600,
                color: "text.secondary",
                px: 1.5,
                "&:hover": { color: "primary.main", bgcolor: "rgba(30, 64, 175, 0.04)" },
              }}
            >
              Community
            </Button>
            <Button
              component={RouterLink}
              to="/platform"
              color="inherit"
              sx={{
                fontWeight: 500,
                color: "text.secondary",
                px: 1.5,
                fontSize: "0.875rem",
                "&:hover": { color: "primary.main", bgcolor: "rgba(30, 64, 175, 0.04)" },
              }}
            >
              Platform
            </Button>
            {user?.role === "ADMIN" && (
              <Button
                component={RouterLink}
                to="/admin"
                color="secondary"
                variant="outlined"
                size="small"
                sx={{ fontWeight: 700, ml: 1 }}
              >
                Admin
              </Button>
            )}
          </Box>

          {/* Right Navigation Controls */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <HealthCheckBadge />

            {isAuthenticated && user ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <NotificationBell />

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
                  {user.role === "ADMIN" && (
                    <MenuItem
                      component={RouterLink}
                      to="/admin"
                      onClick={handleMenuClose}
                      sx={{ gap: 1.5, py: 1, fontWeight: 700, color: "secondary.main" }}
                    >
                      <Shield size={16} />
                      Admin Console
                    </MenuItem>
                  )}
                  <MenuItem
                    component={RouterLink}
                    to="/notifications"
                    onClick={handleMenuClose}
                    sx={{ gap: 1.5, py: 1 }}
                  >
                    <Bell size={16} />
                    Notifications
                  </MenuItem>
                  <MenuItem
                    component={RouterLink}
                    to={user.role === "ADMIN" ? "/admin" : "/my-registrations"}
                    onClick={handleMenuClose}
                    sx={{ gap: 1.5, py: 1, fontWeight: 600, color: "primary.main" }}
                  >
                    <LayoutDashboard size={16} />
                    {user.role === "ADMIN" ? "Admin Dashboard" : "My Dashboard"}
                  </MenuItem>
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

      {/* Mobile Navigation Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        PaperProps={{ sx: { width: 280, p: 2 } }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                bgcolor: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
              }}
            >
              <GraduationCap size={18} />
            </Box>
            <Typography variant="h6" fontWeight={700}>
              CampusHub
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleDrawerToggle}>
            <CloseIcon size={20} />
          </IconButton>
        </Box>

        {isAuthenticated && user && (
          <Box sx={{ p: 1.5, mb: 1, bgcolor: "grey.50", borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} noWrap>
              {user.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {user.email}
            </Typography>
            <Chip
              label={user.role}
              size="small"
              color={user.role === "ADMIN" ? "secondary" : "primary"}
              sx={{ mt: 1, height: 20, fontSize: "0.6875rem", fontWeight: 600 }}
            />
          </Box>
        )}

        <Divider sx={{ my: 1 }} />

        <List disablePadding>
          <ListItem disablePadding>
            <ListItemButton
              component={RouterLink}
              to="/events"
              onClick={handleDrawerToggle}
              sx={{ borderRadius: 1.5, mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: "primary.main" }}>
                <Calendar size={18} />
              </ListItemIcon>
              <ListItemText primary="Events" primaryTypographyProps={{ fontWeight: 600 }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              component={RouterLink}
              to="/clubs"
              onClick={handleDrawerToggle}
              sx={{ borderRadius: 1.5, mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: "primary.main" }}>
                <UsersIcon size={18} />
              </ListItemIcon>
              <ListItemText primary="Clubs" primaryTypographyProps={{ fontWeight: 600 }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              component={RouterLink}
              to="/projects"
              onClick={handleDrawerToggle}
              sx={{ borderRadius: 1.5, mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: "primary.main" }}>
                <FolderGit2 size={18} />
              </ListItemIcon>
              <ListItemText primary="Projects" primaryTypographyProps={{ fontWeight: 600 }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              component={RouterLink}
              to="/community"
              onClick={handleDrawerToggle}
              sx={{ borderRadius: 1.5, mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: "primary.main" }}>
                <MessageSquare size={18} />
              </ListItemIcon>
              <ListItemText primary="Community" primaryTypographyProps={{ fontWeight: 600 }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              component={RouterLink}
              to="/platform"
              onClick={handleDrawerToggle}
              sx={{ borderRadius: 1.5, mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: "primary.main" }}>
                <Layers size={18} />
              </ListItemIcon>
              <ListItemText primary="Platform Architecture" primaryTypographyProps={{ fontWeight: 500 }} />
            </ListItemButton>
          </ListItem>
        </List>

        <Divider sx={{ my: 1.5 }} />

        {isAuthenticated && user ? (
          <List disablePadding>
            <ListItem disablePadding>
              <ListItemButton
                component={RouterLink}
                to={user.role === "ADMIN" ? "/admin" : "/my-registrations"}
                onClick={handleDrawerToggle}
                sx={{ borderRadius: 1.5, mb: 0.5 }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: "primary.main" }}>
                  <LayoutDashboard size={18} />
                </ListItemIcon>
                <ListItemText
                  primary={user.role === "ADMIN" ? "Admin Dashboard" : "My Dashboard"}
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                component={RouterLink}
                to="/my-registrations"
                onClick={handleDrawerToggle}
                sx={{ borderRadius: 1.5, mb: 0.5 }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Ticket size={18} />
                </ListItemIcon>
                <ListItemText primary="My Registrations" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                component={RouterLink}
                to="/profile"
                onClick={handleDrawerToggle}
                sx={{ borderRadius: 1.5, mb: 0.5 }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <UserIcon size={18} />
                </ListItemIcon>
                <ListItemText primary="My Profile" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                onClick={handleLogout}
                sx={{ borderRadius: 1.5, color: "error.main" }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: "error.main" }}>
                  <LogOut size={18} />
                </ListItemIcon>
                <ListItemText primary="Sign Out" />
              </ListItemButton>
            </ListItem>
          </List>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}>
            <Button
              component={RouterLink}
              to="/login"
              variant="outlined"
              fullWidth
              onClick={handleDrawerToggle}
            >
              Sign In
            </Button>
            <Button
              component={RouterLink}
              to="/register"
              variant="contained"
              fullWidth
              onClick={handleDrawerToggle}
            >
              Create Account
            </Button>
          </Box>
        )}
      </Drawer>
    </AppBar>
  );
};
