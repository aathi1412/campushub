import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Divider,
  CircularProgress,
} from "@mui/material";
import { UserPlus, Clock } from "lucide-react";
import { projectsApi } from "../projects.api.js";
import type { ProjectInvitation } from "../projects.api.js";

interface ProjectInviteDialogProps {
  open: boolean;
  projectId: string;
  projectTitle: string;
  onClose: () => void;
  onInvitationSent?: () => void;
}

export const ProjectInviteDialog: React.FC<ProjectInviteDialogProps> = ({
  open,
  projectId,
  projectTitle,
  onClose,
  onInvitationSent,
}) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [invitations, setInvitations] = useState<ProjectInvitation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchInvitations = async () => {
    try {
      setInvitesLoading(true);
      const data = await projectsApi.listProjectInvitations(projectId);
      setInvitations(data);
    } catch {
      // Ignore if user lacks permissions
    } finally {
      setInvitesLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setEmail("");
      setError(null);
      setSuccess(null);
      fetchInvitations();
    }
  }, [open, projectId]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      await projectsApi.sendInvitation(projectId, email.trim());
      setSuccess(`Invitation successfully sent to ${email.trim()}`);
      setEmail("");
      await fetchInvitations();
      onInvitationSent?.();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to send invitation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            bgcolor: "primary.50",
            color: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <UserPlus size={20} />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Invite Team Collaborator
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {projectTitle}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ py: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2.5 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2.5 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSendInvite} sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Invite a student or peer by entering their university email address:
          </Typography>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <TextField
              size="small"
              fullWidth
              required
              type="email"
              placeholder="student@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={loading || !email.trim()}
              sx={{ fontWeight: 600, minWidth: 100 }}
            >
              {loading ? "Sending..." : "Invite"}
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Existing Pending Invitations List */}
        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
          Pending Invitations ({invitations.length})
        </Typography>

        {invitesLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : invitations.length === 0 ? (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ py: 1 }}>
            No pending invitations sent for this project.
          </Typography>
        ) : (
          <List disablePadding>
            {invitations.map((inv) => (
              <ListItem key={inv.id} sx={{ px: 1, py: 1 }}>
                <ListItemAvatar>
                  <Avatar
                    src={inv.invitee?.avatarUrl || undefined}
                    sx={{ width: 32, height: 32, fontSize: "0.8rem", bgcolor: "grey.400" }}
                  >
                    {inv.invitee?.name?.charAt(0).toUpperCase() || "?"}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="subtitle2" fontWeight={600}>
                      {inv.invitee?.name || "Student"}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {inv.invitee?.email}
                    </Typography>
                  }
                />
                <Chip
                  icon={<Clock size={12} />}
                  label="Pending"
                  size="small"
                  color="warning"
                  sx={{ fontWeight: 600, fontSize: "0.68rem", height: 22 }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained">
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};
