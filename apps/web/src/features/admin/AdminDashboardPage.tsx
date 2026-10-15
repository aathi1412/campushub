import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Button,
  TextField,
  InputAdornment,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  LinearProgress,
  Snackbar,
} from "@mui/material";
import {
  ShieldAlert,
  Users,
  Calendar,
  Layers,
  Briefcase,
  MessageSquare,
  Search,
  Radio,
  RefreshCw,
  UserCheck,
  UserX,
  TrendingUp,
} from "lucide-react";
import {
  adminApi,
  type AdminAnalyticsSummary,
  type AdminUserItem,
} from "./admin.api.js";
import { BroadcastDialog } from "../notifications/BroadcastDialog.js";
import { useAuth } from "../auth/AuthContext.js";

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "ADMIN";

  const [analytics, setAnalytics] = useState<AdminAnalyticsSummary | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // User directory state
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsersCount, setTotalUsersCount] = useState(0);

  // Action dialogs & feedback
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (user && !isAdmin) {
      navigate("/");
    }
  }, [user, isAdmin, navigate]);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const data = await adminApi.getAnalytics();
      setAnalytics(data);
    } catch {
      setActionError("Failed to fetch platform analytics.");
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const data = await adminApi.listUsers({
        search: debouncedSearch || undefined,
        role: roleFilter === "ALL" ? undefined : roleFilter,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        page,
        limit: 10,
      });
      setUsers(data.users);
      setTotalPages(data.totalPages);
      setTotalUsersCount(data.total);
    } catch {
      setActionError("Failed to fetch user directory.");
    } finally {
      setUsersLoading(false);
    }
  }, [debouncedSearch, roleFilter, statusFilter, page]);

  useEffect(() => {
    if (isAdmin) {
      fetchAnalytics();
    }
  }, [isAdmin, fetchAnalytics]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: "STUDENT" | "CLUB_LEADER" | "ADMIN") => {
    try {
      await adminApi.updateUserRole(userId, newRole);
      setToastMessage(`User role updated to ${newRole}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      fetchAnalytics();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
          : null;
      setActionError(msg || "Failed to update user role.");
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: "ACTIVE" | "SUSPENDED" | "PENDING") => {
    const targetStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      await adminApi.updateUserStatus(userId, targetStatus);
      setToastMessage(`User account status changed to ${targetStatus}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: targetStatus } : u))
      );
      fetchAnalytics();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
          : null;
      setActionError(msg || "Failed to update user status.");
    }
  };

  if (!isAdmin) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: "center" }}>
        <Alert severity="error">Access restricted to platform administrators only.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Top Banner */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          mb: 4,
          borderRadius: "20px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
          color: "#ffffff",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
          gap: 3,
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <ShieldAlert size={20} className="text-amber-400" />
            <Typography variant="overline" sx={{ letterSpacing: 1.5, fontWeight: 700, color: "grey.400" }}>
              Administrator Console
            </Typography>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: -0.5 }}>
            Platform Governance & Analytics
          </Typography>
          <Typography variant="body1" sx={{ color: "grey.300", maxWidth: 650, lineHeight: 1.6 }}>
            Real-time telemetry and management across campus identity, event life cycles, clubs, collaborative student projects, and community moderation.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
          <Button
            variant="contained"
            color="warning"
            startIcon={<Radio size={18} />}
            onClick={() => setBroadcastOpen(true)}
            sx={{
              borderRadius: "10px",
              px: 2.5,
              py: 1,
              fontWeight: 700,
            }}
          >
            Broadcast Alert
          </Button>

          <Button
            variant="outlined"
            startIcon={<RefreshCw size={18} />}
            onClick={() => {
              fetchAnalytics();
              fetchUsers();
            }}
            sx={{
              borderRadius: "10px",
              px: 2,
              py: 1,
              fontWeight: 600,
              color: "#ffffff",
              borderColor: "rgba(255,255,255,0.4)",
              "&:hover": { borderColor: "#ffffff", bgcolor: "rgba(255,255,255,0.08)" },
            }}
          >
            Refresh
          </Button>
        </Box>
      </Paper>

      {actionError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      {/* Analytics Metric Cards Grid */}
      {analyticsLoading || !analytics ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          {/* Card 1: Users */}
          <Grid item xs={12} sm={6} lg={2.4}>
            <Card elevation={1} sx={{ borderRadius: "16px", height: "100%" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase" }}>
                    Users
                  </Typography>
                  <Box sx={{ p: 0.75, borderRadius: "8px", bgcolor: "primary.light", color: "primary.main" }}>
                    <Users size={16} />
                  </Box>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
                  {analytics.users.total}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1 }}>
                  {analytics.users.students} students · {analytics.users.clubLeaders} leaders · {analytics.users.admins} admins
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Chip
                    size="small"
                    label={`${analytics.users.active} Active`}
                    color="success"
                    sx={{ height: 20, fontSize: "0.6875rem", fontWeight: 700 }}
                  />
                  {analytics.users.suspended > 0 && (
                    <Chip
                      size="small"
                      label={`${analytics.users.suspended} Suspended`}
                      color="error"
                      sx={{ height: 20, fontSize: "0.6875rem", fontWeight: 700 }}
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 2: Events */}
          <Grid item xs={12} sm={6} lg={2.4}>
            <Card elevation={1} sx={{ borderRadius: "16px", height: "100%" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase" }}>
                    Events
                  </Typography>
                  <Box sx={{ p: 0.75, borderRadius: "8px", bgcolor: "success.light", color: "success.main" }}>
                    <Calendar size={16} />
                  </Box>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
                  {analytics.events.total}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1 }}>
                  {analytics.events.published} published · {analytics.events.completed} completed
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      Attendance Rate
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "success.main" }}>
                      {analytics.events.attendanceRatePercent}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={analytics.events.attendanceRatePercent}
                    color="success"
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 3: Clubs */}
          <Grid item xs={12} sm={6} lg={2.4}>
            <Card elevation={1} sx={{ borderRadius: "16px", height: "100%" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase" }}>
                    Clubs
                  </Typography>
                  <Box sx={{ p: 0.75, borderRadius: "8px", bgcolor: "secondary.light", color: "secondary.main" }}>
                    <Layers size={16} />
                  </Box>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
                  {analytics.clubs.total}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1.5 }}>
                  {analytics.clubs.active} active campus organizations
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.secondary" }}>
                  <TrendingUp size={14} className="text-indigo-500" />
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {analytics.clubs.totalMemberships} Total Members
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 4: Projects */}
          <Grid item xs={12} sm={6} lg={2.4}>
            <Card elevation={1} sx={{ borderRadius: "16px", height: "100%" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase" }}>
                    Projects
                  </Typography>
                  <Box sx={{ p: 0.75, borderRadius: "8px", bgcolor: "info.light", color: "info.main" }}>
                    <Briefcase size={16} />
                  </Box>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
                  {analytics.projects.total}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1.5 }}>
                  {analytics.projects.inProgress} in-progress · {analytics.projects.completed} done
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary" }}>
                  {analytics.projects.totalTasks} Kanban tasks tracked
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 5: Community */}
          <Grid item xs={12} sm={6} lg={2.4}>
            <Card elevation={1} sx={{ borderRadius: "16px", height: "100%" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase" }}>
                    Community
                  </Typography>
                  <Box sx={{ p: 0.75, borderRadius: "8px", bgcolor: "warning.light", color: "warning.main" }}>
                    <MessageSquare size={16} />
                  </Box>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
                  {analytics.community.totalPosts}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1.5 }}>
                  {analytics.community.announcements} official notices
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "warning.dark" }}>
                  {analytics.community.activePolls} polls · {analytics.community.totalPollVotes} votes
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* User Governance & Permissions Directory */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: "16px", border: "1px solid", borderColor: "divider" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "flex-start", md: "center" },
            justifyContent: "space-between",
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Campus User Directory & Permissions
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Total {totalUsersCount} registered university accounts
            </Typography>
          </Box>

          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5, width: { xs: "100%", md: "auto" } }}>
            <TextField
              size="small"
              placeholder="Search by name, email, department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={16} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ minWidth: 260 }}
            />

            <TextField
              select
              size="small"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              sx={{ width: 140 }}
            >
              <MenuItem value="ALL">All Roles</MenuItem>
              <MenuItem value="STUDENT">Students</MenuItem>
              <MenuItem value="CLUB_LEADER">Club Leaders</MenuItem>
              <MenuItem value="ADMIN">Admins</MenuItem>
            </TextField>

            <TextField
              select
              size="small"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              sx={{ width: 140 }}
            >
              <MenuItem value="ALL">All Statuses</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="SUSPENDED">Suspended</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
            </TextField>
          </Box>
        </Box>

        {/* Table */}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "background.default" }}>
                <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">
                  Engagement
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usersLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    No users found matching query.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((row) => {
                  const isSelf = row.id === user?.id;

                  return (
                    <TableRow key={row.id} hover>
                      {/* Name & Email */}
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Avatar
                            src={row.avatarUrl ?? undefined}
                            sx={{ width: 34, height: 34, bgcolor: "primary.main", fontSize: "0.8125rem", fontWeight: 700 }}
                          >
                            {row.name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                              {row.name} {isSelf && "(You)"}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                              {row.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Department */}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {row.department || "—"}
                        </Typography>
                        {row.yearOfStudy && (
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            Year {row.yearOfStudy}
                          </Typography>
                        )}
                      </TableCell>

                      {/* Role Dropdown */}
                      <TableCell>
                        <TextField
                          select
                          size="small"
                          disabled={isSelf}
                          value={row.role}
                          onChange={(e) =>
                            handleRoleChange(
                              row.id,
                              e.target.value as "STUDENT" | "CLUB_LEADER" | "ADMIN"
                            )
                          }
                          sx={{
                            minWidth: 130,
                            "& .MuiSelect-select": {
                              py: 0.5,
                              fontSize: "0.8125rem",
                              fontWeight: 600,
                            },
                          }}
                        >
                          <MenuItem value="STUDENT">Student</MenuItem>
                          <MenuItem value="CLUB_LEADER">Club Leader</MenuItem>
                          <MenuItem value="ADMIN">Admin</MenuItem>
                        </TextField>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Chip
                          size="small"
                          label={row.status}
                          color={
                            row.status === "ACTIVE"
                              ? "success"
                              : row.status === "SUSPENDED"
                              ? "error"
                              : "warning"
                          }
                          sx={{ fontWeight: 700, fontSize: "0.6875rem" }}
                        />
                      </TableCell>

                      {/* Engagement stats */}
                      <TableCell align="center">
                        <Box sx={{ display: "flex", justifyContent: "center", gap: 1.5, fontSize: "0.75rem", color: "text.secondary" }}>
                          <Tooltip title="Registered Events">
                            <span>📅 {row._count.eventRegistrations}</span>
                          </Tooltip>
                          <Tooltip title="Clubs Joined">
                            <span>👥 {row._count.clubMemberships}</span>
                          </Tooltip>
                          <Tooltip title="Projects Owned">
                            <span>💼 {row._count.ownedProjects}</span>
                          </Tooltip>
                        </Box>
                      </TableCell>

                      {/* Action buttons */}
                      <TableCell align="right">
                        {!isSelf && (
                          <Tooltip title={row.status === "ACTIVE" ? "Suspend Account" : "Activate Account"}>
                            <IconButton
                              size="small"
                              color={row.status === "ACTIVE" ? "error" : "success"}
                              onClick={() => handleStatusToggle(row.id, row.status)}
                            >
                              {row.status === "ACTIVE" ? <UserX size={16} /> : <UserCheck size={16} />}
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination controls */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2, pt: 1, borderTop: "1px solid", borderColor: "divider" }}>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Page {page} of {totalPages}
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              size="small"
              disabled={page <= 1 || usersLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              sx={{ textTransform: "none" }}
            >
              Previous
            </Button>
            <Button
              size="small"
              disabled={page >= totalPages || usersLoading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              sx={{ textTransform: "none" }}
            >
              Next
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Broadcast Dialog */}
      <BroadcastDialog
        open={broadcastOpen}
        onClose={() => setBroadcastOpen(false)}
        onSuccess={(msg) => {
          setToastMessage(msg);
          fetchAnalytics();
        }}
      />

      {/* Toast Feedback */}
      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={3500}
        onClose={() => setToastMessage(null)}
        message={toastMessage}
      />
    </Container>
  );
};
