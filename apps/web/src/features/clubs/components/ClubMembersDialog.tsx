import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
} from "@mui/material";
import {
  Users,
  Search,
  Check,
  X,
  Shield,
  Crown,
} from "lucide-react";
import { clubsApi } from "../clubs.api.js";
import type { ClubMember, ClubDetail } from "../clubs.api.js";
import { useAuth } from "../../auth/AuthContext.js";

interface ClubMembersDialogProps {
  open: boolean;
  club: ClubDetail;
  onClose: () => void;
  onMemberUpdated?: () => void;
}

export const ClubMembersDialog: React.FC<ClubMembersDialogProps> = ({
  open,
  club,
  onClose,
  onMemberUpdated,
}) => {
  const { user } = useAuth();
  const [tab, setTab] = useState<"ALL" | "PENDING">("ALL");
  const [search, setSearch] = useState("");
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isLeaderOrAdmin =
    user?.role === "ADMIN" || club.leader.id === user?.id;

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await clubsApi.listClubMembers(club.id, {
        status: tab === "PENDING" ? "PENDING" : undefined,
        search: search.trim() || undefined,
        limit: 50,
      });
      setMembers(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to load club members");
    } finally {
      setLoading(false);
    }
  }, [club.id, tab, search]);

  useEffect(() => {
    if (open) {
      fetchMembers();
    }
  }, [open, fetchMembers]);

  const handleStatusUpdate = async (targetUserId: string, status: "APPROVED" | "REJECTED") => {
    try {
      setActionLoadingId(targetUserId);
      await clubsApi.updateMember(club.id, targetUserId, { status });
      await fetchMembers();
      onMemberUpdated?.();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || `Failed to ${status.toLowerCase()} member`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRoleUpdate = async (targetUserId: string, role: "MEMBER" | "OFFICER") => {
    try {
      setActionLoadingId(targetUserId);
      await clubsApi.updateMember(club.id, targetUserId, { role });
      await fetchMembers();
      onMemberUpdated?.();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to update member role");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              bgcolor: "primary.50",
              color: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Users size={20} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Manage Club Members
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {club.name} • {club.memberCount} Approved Members
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <Box sx={{ px: 3, pt: 1, borderBottom: "1px solid", borderColor: "divider" }}>
        <Tabs value={tab} onChange={(_, val) => setTab(val)}>
          <Tab label="Approved Members" value="ALL" sx={{ fontWeight: 600 }} />
          <Tab label="Pending Requests" value="PENDING" sx={{ fontWeight: 600 }} />
        </Tabs>
      </Box>

      <DialogContent sx={{ py: 2.5, px: 3 }}>
        {/* Search input */}
        <Box sx={{ mb: 2 }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Search by name, email, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={36} />
          </Box>
        ) : members.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 6, color: "text.secondary" }}>
            <Users size={40} style={{ opacity: 0.3, marginBottom: 8 }} />
            <Typography variant="body1" fontWeight={600}>
              No members found
            </Typography>
            <Typography variant="body2">
              {tab === "PENDING"
                ? "There are currently no pending join requests for this club."
                : "No active members match your search query."}
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {members.map((member, idx) => {
              const isProcessing = actionLoadingId === member.userId;
              const isClubLeader = member.role === "LEADER" || club.leader.id === member.userId;

              return (
                <React.Fragment key={member.id}>
                  {idx > 0 && <Divider component="li" />}
                  <ListItem sx={{ py: 1.5, px: 1 }}>
                    <ListItemAvatar>
                      <Avatar
                        src={member.user.avatarUrl || undefined}
                        sx={{
                          bgcolor: isClubLeader
                            ? "primary.main"
                            : member.role === "OFFICER"
                            ? "secondary.main"
                            : "grey.400",
                          fontWeight: 700,
                        }}
                      >
                        {member.user.name.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>

                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="subtitle2" fontWeight={700}>
                            {member.user.name}
                          </Typography>
                          {isClubLeader ? (
                            <Chip
                              icon={<Crown size={12} />}
                              label="Leader"
                              size="small"
                              color="primary"
                              sx={{ fontWeight: 700, height: 22, fontSize: "0.68rem" }}
                            />
                          ) : member.role === "OFFICER" ? (
                            <Chip
                              icon={<Shield size={12} />}
                              label="Officer"
                              size="small"
                              color="secondary"
                              sx={{ fontWeight: 700, height: 22, fontSize: "0.68rem" }}
                            />
                          ) : (
                            <Chip
                              label={member.status === "PENDING" ? "Pending" : "Member"}
                              size="small"
                              color={member.status === "PENDING" ? "warning" : "default"}
                              variant="outlined"
                              sx={{ fontWeight: 600, height: 22, fontSize: "0.68rem" }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary" display="block">
                          {member.user.email}
                          {member.user.department ? ` • ${member.user.department}` : ""}
                          {member.user.yearOfStudy ? ` (Year ${member.user.yearOfStudy})` : ""}
                        </Typography>
                      }
                    />

                    <ListItemSecondaryAction>
                      {isProcessing ? (
                        <CircularProgress size={24} />
                      ) : tab === "PENDING" ? (
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Tooltip title="Approve Request">
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              startIcon={<Check size={16} />}
                              onClick={() => handleStatusUpdate(member.userId, "APPROVED")}
                              sx={{ fontWeight: 600 }}
                            >
                              Approve
                            </Button>
                          </Tooltip>
                          <Tooltip title="Reject Request">
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              startIcon={<X size={16} />}
                              onClick={() => handleStatusUpdate(member.userId, "REJECTED")}
                              sx={{ fontWeight: 600 }}
                            >
                              Reject
                            </Button>
                          </Tooltip>
                        </Box>
                      ) : (
                        !isClubLeader &&
                        isLeaderOrAdmin && (
                          <Box sx={{ display: "flex", gap: 1 }}>
                            {member.role === "OFFICER" ? (
                              <Tooltip title="Demote to Regular Member">
                                <Button
                                  variant="outlined"
                                  size="small"
                                  color="inherit"
                                  onClick={() => handleRoleUpdate(member.userId, "MEMBER")}
                                  sx={{ fontSize: "0.75rem", textTransform: "none" }}
                                >
                                  Demote to Member
                                </Button>
                              </Tooltip>
                            ) : (
                              <Tooltip title="Promote to Club Officer">
                                <Button
                                  variant="outlined"
                                  size="small"
                                  color="secondary"
                                  startIcon={<Shield size={14} />}
                                  onClick={() => handleRoleUpdate(member.userId, "OFFICER")}
                                  sx={{ fontSize: "0.75rem", textTransform: "none" }}
                                >
                                  Make Officer
                                </Button>
                              </Tooltip>
                            )}
                          </Box>
                        )
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                </React.Fragment>
              );
            })}
          </List>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "divider" }}>
        <Button onClick={onClose} variant="contained">
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};
