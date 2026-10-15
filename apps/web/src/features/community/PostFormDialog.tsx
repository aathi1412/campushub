import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  FormControlLabel,
  Switch,
  Box,
  Alert,
  CircularProgress,
  Typography,
} from "@mui/material";
import { MessageSquarePlus, Megaphone, Sparkles, Tag } from "lucide-react";
import { useAuth } from "../auth/AuthContext.js";
import { communityApi, type PostType, type CreatePostPayload } from "./community.api.js";

interface PostFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PostFormDialog: React.FC<PostFormDialogProps> = ({ open, onClose, onSuccess }) => {
  const { user } = useAuth();
  const isLeaderOrAdmin = user?.role === "CLUB_LEADER" || user?.role === "ADMIN";
  const isAdmin = user?.role === "ADMIN";

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<PostType>("GENERAL");
  const [isPinned, setIsPinned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setType("GENERAL");
    setIsPinned(false);
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
    if (!title.trim()) {
      setError("Post title is required.");
      return;
    }
    if (!content.trim()) {
      setError("Post content is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: CreatePostPayload = {
        title: title.trim(),
        content: content.trim(),
        type,
      };

      const post = await communityApi.createPost(payload);

      // If admin selected isPinned, pin the post
      if (isAdmin && isPinned) {
        await communityApi.updatePost(post.id, { isPinned: true });
      }

      resetForm();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(errorMsg || "Failed to create post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
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
              bgcolor: "primary.light",
              color: "primary.main",
              display: "flex",
            }}
          >
            <MessageSquarePlus size={22} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Create Community Post
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Share discussions, ask questions, or announce campus updates
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
            label="Post Title"
            placeholder="What would you like to discuss with campus?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
            disabled={loading}
            slotProps={{
              htmlInput: { maxLength: 255 },
            }}
            helperText={`${title.length}/255 characters`}
          />

          <TextField
            select
            label="Post Type"
            value={type}
            onChange={(e) => setType(e.target.value as PostType)}
            fullWidth
            disabled={loading}
            helperText={
              !isLeaderOrAdmin && type === "GENERAL"
                ? "Official Announcements require Club Leader or Admin privileges."
                : undefined
            }
          >
            <MenuItem value="GENERAL">
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Sparkles size={16} />
                <span>General Discussion</span>
              </Box>
            </MenuItem>
            <MenuItem value="LOST_AND_FOUND">
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Tag size={16} />
                <span>Lost & Found Item</span>
              </Box>
            </MenuItem>
            {isLeaderOrAdmin && (
              <MenuItem value="ANNOUNCEMENT">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "warning.main", fontWeight: 600 }}>
                  <Megaphone size={16} />
                  <span>Official Campus Announcement</span>
                </Box>
              </MenuItem>
            )}
          </TextField>

          <TextField
            label="Content"
            placeholder="Provide context, details, location, or questions for your campus peers..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            fullWidth
            required
            multiline
            rows={5}
            disabled={loading}
          />

          {isAdmin && (
            <Box sx={{ bgcolor: "background.default", p: 2, borderRadius: "12px", border: "1px dashed", borderColor: "divider" }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    color="warning"
                    disabled={loading}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Pin to Top of Community Board
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      Keep this post prominently visible at the top of the feed for all students.
                    </Typography>
                  </Box>
                }
              />
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, px: 3 }}>
          <Button onClick={handleClose} disabled={loading} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ borderRadius: "8px", px: 3, fontWeight: 600 }}
          >
            {loading ? "Publishing..." : "Publish Post"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
