import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Avatar,
  CircularProgress,
  Alert,
  Divider,
  Stack,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from "@mui/material";
import {
  Users,
  Calendar,
  Clock,
  ArrowLeft,
  UserPlus,
  LogOut,
  Edit,
  Shield,
  Crown,
  CheckCircle,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { clubsApi } from "../clubs.api.js";
import type { ClubDetail, ClubMember, UpdateClubPayload } from "../clubs.api.js";
import { ClubFormDialog } from "../components/ClubFormDialog.js";
import { ClubMembersDialog } from "../components/ClubMembersDialog.js";
import { useAuth } from "../../auth/AuthContext.js";

export const ClubDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [club, setClub] = useState<ClubDetail | null>(null);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"ABOUT" | "EVENTS" | "MEMBERS">("ABOUT");

  // Modals
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);

  const fetchClub = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await clubsApi.getClubById(id);
      setClub(data);

      // Also fetch approved members for the directory tab
      const memRes = await clubsApi.listClubMembers(id, { limit: 50 });
      setMembers(memRes.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to load club details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchClub();
  }, [fetchClub]);

  const handleJoinClub = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!club) return;

    try {
      setActionLoading(true);
      setError(null);
      const res = await clubsApi.joinClub(club.id);
      setSuccessMsg(res.message || "Membership request submitted successfully");
      await fetchClub();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to submit join request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveClub = async () => {
    if (!club) return;
    if (!window.confirm(`Are you sure you want to leave ${club.name}?`)) return;

    try {
      setActionLoading(true);
      setError(null);
      const res = await clubsApi.leaveClub(club.id);
      setSuccessMsg(res.message || "You have left the club");
      await fetchClub();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to leave club");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateClub = async (data: UpdateClubPayload) => {
    if (!club) return;
    await clubsApi.updateClub(club.id, data);
    setSuccessMsg("Club updated successfully");
    await fetchClub();
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 15 }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (error && !club) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button component={RouterLink} to="/clubs" startIcon={<ArrowLeft size={18} />}>
          Back to Clubs Directory
        </Button>
      </Container>
    );
  }

  if (!club) return null;

  const userMembership = club.userMembership;
  const isLeader = club.leader.id === user?.id;
  const isOfficer = userMembership?.status === "APPROVED" && userMembership?.role === "OFFICER";
  const isAdmin = user?.role === "ADMIN";
  const isManager = isLeader || isOfficer || isAdmin;
  const isMember = userMembership?.status === "APPROVED";
  const isPending = userMembership?.status === "PENDING";

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Back button */}
      <Button
        component={RouterLink}
        to="/clubs"
        startIcon={<ArrowLeft size={16} />}
        sx={{ mb: 2.5, color: "text.secondary", fontWeight: 600 }}
      >
        All Clubs
      </Button>

      {/* Hero Header Card */}
      <Card
        elevation={0}
        sx={{
          mb: 4,
          borderRadius: 4,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        {/* Banner image or gradient */}
        <Box
          sx={{
            height: 180,
            background: club.bannerUrl
              ? `url(${club.bannerUrl}) center/cover no-repeat`
              : "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #06b6d4 100%)",
            position: "relative",
          }}
        />

        <Box sx={{ px: { xs: 2.5, md: 4 }, pb: 3 }}>
          {/* Logo and Quick Info Row */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: { xs: "flex-start", md: "flex-end" },
              justifyContent: "space-between",
              gap: 2,
              position: "relative",
              top: -45,
              mb: -3,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "flex-end", gap: 2.5 }}>
              <Avatar
                src={club.logoUrl || undefined}
                alt={club.name}
                sx={{
                  width: 90,
                  height: 90,
                  bgcolor: "primary.main",
                  border: "4px solid white",
                  boxShadow: 3,
                  fontSize: "2rem",
                  fontWeight: 800,
                }}
              >
                {club.name.charAt(0).toUpperCase()}
              </Avatar>

              <Box sx={{ mb: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", mb: 0.5 }}>
                  <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: "-0.02em" }}>
                    {club.name}
                  </Typography>
                  <Chip
                    label={club.category}
                    size="small"
                    sx={{
                      bgcolor: "primary.50",
                      color: "primary.dark",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                    }}
                  />
                  {!club.isActive && (
                    <Chip label="Inactive" size="small" color="error" sx={{ fontWeight: 700 }} />
                  )}
                </Box>
                <Stack direction="row" spacing={3} color="text.secondary">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    <Users size={16} />
                    <Typography variant="body2" fontWeight={600}>
                      {club.memberCount} Approved Members
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    <Calendar size={16} />
                    <Typography variant="body2" fontWeight={600}>
                      {club.eventCount} Events Hosted
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignSelf: { xs: "stretch", md: "flex-end" } }}>
              {isManager && (
                <Button
                  variant="outlined"
                  startIcon={<Users size={16} />}
                  onClick={() => setMembersDialogOpen(true)}
                  sx={{ fontWeight: 600, borderRadius: 2 }}
                >
                  Manage Members
                </Button>
              )}

              {(isLeader || isAdmin) && (
                <Button
                  variant="outlined"
                  startIcon={<Edit size={16} />}
                  onClick={() => setEditDialogOpen(true)}
                  sx={{ fontWeight: 600, borderRadius: 2 }}
                >
                  Edit Club
                </Button>
              )}

              {/* Student Membership Action */}
              {!isAuthenticated ? (
                <Button
                  variant="contained"
                  startIcon={<UserPlus size={16} />}
                  onClick={() => navigate("/login")}
                  sx={{ fontWeight: 600, borderRadius: 2 }}
                >
                  Sign In to Join
                </Button>
              ) : isLeader ? (
                <Chip
                  icon={<Crown size={14} />}
                  label="Club Leader"
                  color="primary"
                  sx={{ fontWeight: 700, px: 1, height: 38 }}
                />
              ) : isPending ? (
                <Chip
                  icon={<Clock size={14} />}
                  label="Application Pending Review"
                  color="warning"
                  sx={{ fontWeight: 700, px: 1, height: 38 }}
                />
              ) : isMember ? (
                <Stack direction="row" spacing={1}>
                  <Chip
                    icon={isOfficer ? <Shield size={14} /> : <CheckCircle size={14} />}
                    label={isOfficer ? "Officer" : "Active Member"}
                    color={isOfficer ? "secondary" : "success"}
                    sx={{ fontWeight: 700, px: 1, height: 38 }}
                  />
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<LogOut size={14} />}
                    onClick={handleLeaveClub}
                    disabled={actionLoading}
                    sx={{ fontWeight: 600, borderRadius: 2 }}
                  >
                    Leave Club
                  </Button>
                </Stack>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<UserPlus size={16} />}
                  onClick={handleJoinClub}
                  disabled={actionLoading}
                  sx={{ fontWeight: 600, borderRadius: 2 }}
                >
                  {actionLoading ? "Submitting..." : "Join Club"}
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </Card>

      {/* Notifications / Alerts */}
      {successMsg && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Navigation Tabs */}
      <Box sx={{ borderBottom: "1px solid", borderColor: "divider", mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
          <Tab label="About & Leadership" value="ABOUT" sx={{ fontWeight: 600 }} />
          <Tab
            label={`Upcoming Events (${club.upcomingEvents.length})`}
            value="EVENTS"
            sx={{ fontWeight: 600 }}
          />
          <Tab
            label={`Members Directory (${members.length})`}
            value="MEMBERS"
            sx={{ fontWeight: 600 }}
          />
        </Tabs>
      </Box>

      {/* Tab 1: About & Leadership */}
      {activeTab === "ABOUT" && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: 3, p: 3, mb: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                About {club.name}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: "pre-line", lineHeight: 1.7 }}>
                {club.description}
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            {/* Club Leader Card */}
            <Card sx={{ borderRadius: 3, p: 3, mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" textTransform="uppercase" fontWeight={700} gutterBottom>
                Club Leadership
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1.5 }}>
                <Avatar
                  src={club.leader.avatarUrl || undefined}
                  sx={{ width: 50, height: 50, bgcolor: "primary.main", fontWeight: 700 }}
                >
                  {club.leader.name.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {club.leader.name}
                    </Typography>
                    <Crown size={14} color="#f59e0b" />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {club.leader.department || "Campus Club Leader"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {club.leader.email}
                  </Typography>
                </Box>
              </Box>
            </Card>

            {/* Club Metadata */}
            <Card sx={{ borderRadius: 3, p: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" textTransform="uppercase" fontWeight={700} gutterBottom>
                Organization Details
              </Typography>
              <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Category:
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {club.category}
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Established:
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {new Date(club.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Status:
                  </Typography>
                  <Chip
                    label={club.isActive ? "Active Organization" : "Inactive"}
                    size="small"
                    color={club.isActive ? "success" : "default"}
                    sx={{ fontWeight: 600, height: 22 }}
                  />
                </Box>
              </Stack>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tab 2: Upcoming Events */}
      {activeTab === "EVENTS" && (
        <Box>
          {club.upcomingEvents.length === 0 ? (
            <Card sx={{ textAlign: "center", py: 8, borderRadius: 3, border: "1px dashed", borderColor: "divider" }}>
              <CardContent>
                <Calendar size={40} style={{ opacity: 0.3, marginBottom: 8 }} />
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  No scheduled events
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This club hasn't published any upcoming events yet. Check back soon!
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {club.upcomingEvents.map((ev) => (
                <Grid item xs={12} sm={6} md={4} key={ev.id}>
                  <Card sx={{ borderRadius: 3, height: "100%", display: "flex", flexDirection: "column" }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Chip
                        label={ev.category}
                        size="small"
                        sx={{ bgcolor: "primary.50", color: "primary.dark", fontWeight: 600, mb: 1.5 }}
                      />
                      <Typography
                        variant="h6"
                        fontWeight={700}
                        component={RouterLink}
                        to={`/events/${ev.id}`}
                        sx={{ textDecoration: "none", color: "text.primary", "&:hover": { color: "primary.main" } }}
                      >
                        {ev.title}
                      </Typography>
                      <Stack spacing={1} sx={{ mt: 2, color: "text.secondary" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Calendar size={14} />
                          <Typography variant="caption">
                            {new Date(ev.startTime).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <MapPin size={14} />
                          <Typography variant="caption" noWrap>
                            {ev.venue}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                    <Box sx={{ p: 2, pt: 0 }}>
                      <Button
                        component={RouterLink}
                        to={`/events/${ev.id}`}
                        variant="outlined"
                        size="small"
                        fullWidth
                        endIcon={<ExternalLink size={14} />}
                      >
                        View Event
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* Tab 3: Members Directory */}
      {activeTab === "MEMBERS" && (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" fontWeight={700}>
                Club Members ({members.length})
              </Typography>
              {isManager && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setMembersDialogOpen(true)}
                  sx={{ fontWeight: 600 }}
                >
                  Manage Membership Roster
                </Button>
              )}
            </Box>
            <Divider sx={{ mb: 2 }} />

            {members.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
                <Typography variant="body2">No members registered yet.</Typography>
              </Box>
            ) : (
              <List disablePadding>
                {members.map((mem, idx) => (
                  <React.Fragment key={mem.id}>
                    {idx > 0 && <Divider component="li" />}
                    <ListItem sx={{ py: 1.5 }}>
                      <ListItemAvatar>
                        <Avatar
                          src={mem.user.avatarUrl || undefined}
                          sx={{
                            bgcolor:
                              mem.role === "LEADER"
                                ? "primary.main"
                                : mem.role === "OFFICER"
                                ? "secondary.main"
                                : "grey.400",
                            fontWeight: 700,
                          }}
                        >
                          {mem.user.name.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography variant="subtitle2" fontWeight={700}>
                              {mem.user.name}
                            </Typography>
                            {mem.role === "LEADER" ? (
                              <Chip
                                icon={<Crown size={12} />}
                                label="Leader"
                                size="small"
                                color="primary"
                                sx={{ fontWeight: 700, height: 22, fontSize: "0.68rem" }}
                              />
                            ) : mem.role === "OFFICER" ? (
                              <Chip
                                icon={<Shield size={12} />}
                                label="Officer"
                                size="small"
                                color="secondary"
                                sx={{ fontWeight: 700, height: 22, fontSize: "0.68rem" }}
                              />
                            ) : null}
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {mem.user.department || "Student Member"}
                            {mem.joinedAt
                              ? ` • Joined ${new Date(mem.joinedAt).toLocaleDateString()}`
                              : ""}
                          </Typography>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <ClubFormDialog
        open={editDialogOpen}
        club={club}
        onClose={() => setEditDialogOpen(false)}
        onSubmit={handleUpdateClub}
      />

      {/* Manage Members Dialog */}
      <ClubMembersDialog
        open={membersDialogOpen}
        club={club}
        onClose={() => setMembersDialogOpen(false)}
        onMemberUpdated={fetchClub}
      />
    </Container>
  );
};
