import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Alert,
  CircularProgress,
  Typography,
} from "@mui/material";
import { Megaphone, Send } from "lucide-react";
import {
  notificationsApi,
  notificationTypes,
  type NotificationType,
  type BroadcastPayload,
} from "./notifications.api.js";

interface BroadcastDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const BroadcastDialog: React.FC<BroadcastDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<NotificationType>("COMMUNITY_ANNOUNCEMENT");
  const [targetRole, setTargetRole] = useState<string>("ALL");
  const [targetDepartment, setTargetDepartment] = useState("");
  const [link, setLink] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setTitle("");
    setMessage("");
    setType("COMMUNITY_ANNOUNCEMENT");
    setTargetRole("ALL");
    setTargetDepartment("");
    setLink("");
    setError(null);
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setError("Title and message are required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: BroadcastPayload = {
        title: title.trim(),
        message: message.trim(),
        type,
        link: link.trim() || undefined,
        targetRole:
          targetRole === "ALL"
            ? undefined
            : (targetRole as "STUDENT" | "CLUB_LEADER" | "ADMIN"),
        targetDepartment: targetDepartment.trim() || undefined,
      };

      const res = await notificationsApi.broadcast(payload);
      resetForm();
      onSuccess(res.message);
      onClose();
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(errorMsg || "Failed to broadcast campus notification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: "16px", p: 1 },
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: "10px",
              bgcolor: "warning.light",
              color: "warning.contrastText",
              display: "flex",
            }}
          >
            <Megaphone size={22} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Broadcast Campus Alert
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Publish an urgent notification to students, leaders, or departments
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2.5 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <TextField
            label="Alert Title"
            placeholder="e.g. Severe Weather Campus Advisory"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
            disabled={loading}
            slotProps={{
              htmlInput: { maxLength: 200 },
            }}
          />

          <TextField
            label="Notification Category"
            select
            value={type}
            onChange={(e) => setType(e.target.value as NotificationType)}
            fullWidth
            disabled={loading}
          >
            {notificationTypes.map((t) => (
              <MenuItem key={t} value={t}>
                {t.replace(/_/g, " ")}
              </MenuItem>
            ))}
          </TextField>

          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label="Recipient Role"
              select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              fullWidth
              disabled={loading}
            >
              <MenuItem value="ALL">All Active Users</MenuItem>
              <MenuItem value="STUDENT">Students Only</MenuItem>
              <MenuItem value="CLUB_LEADER">Club Leaders Only</MenuItem>
              <MenuItem value="ADMIN">Administrators Only</MenuItem>
            </TextField>

            <TextField
              label="Department (Optional)"
              placeholder="e.g. Computer Science"
              value={targetDepartment}
              onChange={(e) => setTargetDepartment(e.target.value)}
              fullWidth
              disabled={loading}
            />
          </Box>

          <TextField
            label="Action Link (Optional)"
            placeholder="e.g. /community or /events"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            fullWidth
            disabled={loading}
          />

          <TextField
            label="Message Content"
            placeholder="Write clear instructions, details, or advisories for recipients..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            fullWidth
            required
            multiline
            rows={4}
            disabled={loading}
          />
        </DialogContent>

        <DialogActions sx={{ p: 2, px: 3 }}>
          <Button onClick={handleClose} disabled={loading} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="warning"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Send size={16} />}
            sx={{ borderRadius: "8px", px: 3, fontWeight: 700 }}
          >
            {loading ? "Broadcasting..." : "Broadcast Alert"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
