import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Divider,
  TextField,
  CircularProgress,
  Alert,
  Paper,
  Snackbar,
} from "@mui/material";
import {
  ArrowLeft,
  MessageSquare,
  Pin,
  PinOff,
  Trash2,
  Send,
  Clock,
  Megaphone,
  Tag,
  Sparkles,
} from "lucide-react";
import {
  communityApi,
  type CommunityPostDetail,
} from "./community.api.js";
import { useAuth } from "../auth/AuthContext.js";

export const PostDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [post, setPost] = useState<CommunityPostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Comment state
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchPost = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await communityApi.getPostById(id);
      setPost(data);
    } catch {
      setError("Failed to load post thread or post does not exist.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleTogglePin = async () => {
    if (!post) return;
    try {
      const updated = await communityApi.updatePost(post.id, { isPinned: !post.isPinned });
      setPost((prev) => (prev ? { ...prev, isPinned: updated.isPinned } : null));
      setToastMessage(post.isPinned ? "Post unpinned." : "Post pinned to top.");
    } catch {
      setError("Failed to update pin status.");
    }
  };

  const handleDeletePost = async () => {
    if (!post) return;
    if (!window.confirm("Are you sure you want to delete this discussion post?")) return;
    try {
      await communityApi.deletePost(post.id);
      navigate("/community");
    } catch {
      setError("Failed to delete post.");
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !newComment.trim()) return;

    setSubmittingComment(true);
    setCommentError(null);

    try {
      const created = await communityApi.addComment(post.id, newComment.trim());
      setPost((prev) =>
        prev
          ? {
              ...prev,
              commentCount: prev.commentCount + 1,
              comments: [...prev.comments, created],
            }
          : null
      );
      setNewComment("");
      setToastMessage("Comment added!");
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setCommentError(errorMsg || "Failed to post comment.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!post) return;
    if (!window.confirm("Delete this comment?")) return;

    try {
      await communityApi.deleteComment(post.id, commentId);
      setPost((prev) =>
        prev
          ? {
              ...prev,
              commentCount: Math.max(0, prev.commentCount - 1),
              comments: prev.comments.filter((c) => c.id !== commentId),
            }
          : null
      );
      setToastMessage("Comment deleted.");
    } catch {
      setError("Failed to delete comment.");
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const getTypeChip = (type: string) => {
    switch (type) {
      case "ANNOUNCEMENT":
        return (
          <Chip
            size="small"
            icon={<Megaphone size={14} className="text-amber-600 dark:text-amber-400" />}
            label="Official Announcement"
            sx={{
              fontWeight: 600,
              bgcolor: "warning.light",
              color: "warning.contrastText",
              borderRadius: "8px",
            }}
          />
        );
      case "LOST_AND_FOUND":
        return (
          <Chip
            size="small"
            icon={<Tag size={14} className="text-teal-600 dark:text-teal-400" />}
            label="Lost & Found"
            sx={{
              fontWeight: 600,
              bgcolor: "info.light",
              color: "info.contrastText",
              borderRadius: "8px",
            }}
          />
        );
      default:
        return (
          <Chip
            size="small"
            icon={<Sparkles size={14} />}
            label="General Discussion"
            variant="outlined"
            sx={{
              borderRadius: "8px",
              fontWeight: 500,
            }}
          />
        );
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 6, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !post) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || "Post not found"}
        </Alert>
        <Button
          component={RouterLink}
          to="/community"
          startIcon={<ArrowLeft size={16} />}
          variant="outlined"
        >
          Back to Community Feed
        </Button>
      </Container>
    );
  }

  const isAuthor = user?.id === post.authorId;
  const canDeletePost = isAuthor || isAdmin;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Back button */}
      <Button
        component={RouterLink}
        to="/community"
        startIcon={<ArrowLeft size={16} />}
        variant="text"
        color="inherit"
        sx={{ mb: 2.5, fontWeight: 600 }}
      >
        Back to Community Feed
      </Button>

      {/* Main Post Card */}
      <Card
        elevation={post.isPinned ? 3 : 1}
        sx={{
          borderRadius: "16px",
          border: post.isPinned ? "2px solid" : "1px solid",
          borderColor: post.isPinned ? "amber.main" : "divider",
          overflow: "hidden",
          mb: 4,
        }}
      >
        {post.isPinned && (
          <Box
            sx={{
              background: "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)",
              color: "#ffffff",
              px: 2.5,
              py: 0.75,
              display: "flex",
              alignItems: "center",
              gap: 1,
              fontSize: "0.8125rem",
              fontWeight: 700,
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}
          >
            <Pin size={14} fill="#ffffff" />
            Pinned Notice
          </Box>
        )}

        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          {/* Post Header */}
          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 3, gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar
                src={post.author.avatarUrl ?? undefined}
                alt={post.author.name}
                sx={{
                  width: 50,
                  height: 50,
                  bgcolor: post.type === "ANNOUNCEMENT" ? "warning.main" : "primary.main",
                  fontWeight: 700,
                  fontSize: "1.2rem",
                }}
              >
                {post.author.name?.charAt(0) || "U"}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {post.author.name}
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5, mt: 0.5 }}>
                  {post.author.department && (
                    <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
                      {post.author.department}
                    </Typography>
                  )}
                  <Typography variant="caption" sx={{ color: "text.disabled", display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Clock size={12} />
                    {formatDate(post.createdAt)}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {getTypeChip(post.type)}

              {isAdmin && (
                <Tooltip title={post.isPinned ? "Unpin post" : "Pin post to top"}>
                  <IconButton
                    size="small"
                    onClick={handleTogglePin}
                    color={post.isPinned ? "warning" : "default"}
                  >
                    {post.isPinned ? <PinOff size={18} /> : <Pin size={18} />}
                  </IconButton>
                </Tooltip>
              )}

              {canDeletePost && (
                <Tooltip title="Delete post">
                  <IconButton size="small" color="error" onClick={handleDeletePost}>
                    <Trash2 size={18} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>

          {/* Title */}
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, lineHeight: 1.3 }}>
            {post.title}
          </Typography>

          {/* Content */}
          <Typography
            variant="body1"
            sx={{
              color: "text.primary",
              lineHeight: 1.8,
              whiteSpace: "pre-line",
              fontSize: "1.05rem",
              mb: 3,
            }}
          >
            {post.content}
          </Typography>

          <Divider sx={{ my: 2 }} />

          {/* Post Footer */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary" }}>
            <MessageSquare size={18} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {post.commentCount} {post.commentCount === 1 ? "Comment" : "Comments"}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Comments Thread Section */}
      <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: "16px", border: "1px solid", borderColor: "divider", mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2.5 }}>
          Discussion & Replies ({post.comments.length})
        </Typography>

        {/* Comment input box */}
        <Box component="form" onSubmit={handleAddComment} sx={{ mb: 4 }}>
          {commentError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setCommentError(null)}>
              {commentError}
            </Alert>
          )}

          <TextField
            placeholder="Write a constructive response or answer..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            fullWidth
            multiline
            rows={3}
            disabled={submittingComment}
            sx={{ mb: 1.5 }}
          />

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              type="submit"
              variant="contained"
              disabled={!newComment.trim() || submittingComment}
              startIcon={submittingComment ? <CircularProgress size={16} color="inherit" /> : <Send size={16} />}
              sx={{ borderRadius: "8px", px: 3, fontWeight: 600 }}
            >
              {submittingComment ? "Posting..." : "Post Comment"}
            </Button>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Comment list */}
        {post.comments.length === 0 ? (
          <Box sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
            <Typography variant="body2" sx={{ fontStyle: "italic" }}>
              No comments yet. Be the first to share your perspective!
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {post.comments.map((comment) => {
              const isCommentAuthor = user?.id === comment.authorId;
              const canDeleteComment = isCommentAuthor || isAdmin;

              return (
                <Box
                  key={comment.id}
                  sx={{
                    p: 2,
                    borderRadius: "12px",
                    bgcolor: "action.hover",
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                      <Avatar
                        src={comment.author.avatarUrl ?? undefined}
                        alt={comment.author.name}
                        sx={{ width: 32, height: 32, bgcolor: "secondary.main", fontSize: "0.8125rem" }}
                      >
                        {comment.author.name?.charAt(0) || "U"}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                          {comment.author.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          {comment.author.department ? `${comment.author.department} · ` : ""}
                          {formatDate(comment.createdAt)}
                        </Typography>
                      </Box>
                    </Box>

                    {canDeleteComment && (
                      <Tooltip title="Delete comment">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <Trash2 size={15} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>

                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.primary",
                      lineHeight: 1.6,
                      whiteSpace: "pre-line",
                      pl: { sm: 5 },
                    }}
                  >
                    {comment.content}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}
      </Paper>

      {/* Snackbar feedback */}
      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={3000}
        onClose={() => setToastMessage(null)}
        message={toastMessage}
      />
    </Container>
  );
};
