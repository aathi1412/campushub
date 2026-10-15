import React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Avatar,
  IconButton,
  Tooltip,
  Divider,
} from "@mui/material";
import {
  MessageSquare,
  Pin,
  PinOff,
  Megaphone,
  Trash2,
  Tag,
  Clock,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import type { CommunityPost } from "./community.api.js";
import { useAuth } from "../auth/AuthContext.js";

interface PostCardProps {
  post: CommunityPost;
  onTogglePin?: (id: string, currentPinned: boolean) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onTogglePin, onDelete }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const isAuthor = user?.id === post.authorId;
  const canDelete = isAuthor || isAdmin;

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getTypeChip = () => {
    switch (post.type) {
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

  return (
    <Card
      elevation={post.isPinned ? 3 : 1}
      sx={{
        borderRadius: "16px",
        transition: "all 0.25s ease",
        position: "relative",
        border: post.isPinned
          ? "2px solid"
          : "1px solid",
        borderColor: post.isPinned
          ? "amber.main"
          : "divider",
        overflow: "hidden",
        "&:hover": {
          boxShadow: 4,
          transform: "translateY(-2px)",
        },
      }}
    >
      {post.isPinned && (
        <Box
          sx={{
            background: "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)",
            color: "#ffffff",
            px: 2,
            py: 0.5,
            display: "flex",
            alignItems: "center",
            gap: 1,
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}
        >
          <Pin size={13} fill="#ffffff" />
          Pinned Campus Notice
        </Box>
      )}

      <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2, gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar
              src={post.author.avatarUrl ?? undefined}
              alt={post.author.name}
              sx={{
                width: 42,
                height: 42,
                bgcolor: post.type === "ANNOUNCEMENT" ? "warning.main" : "primary.main",
                fontWeight: 600,
              }}
            >
              {post.author.name?.charAt(0) || "U"}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.primary", lineHeight: 1.2 }}>
                {post.author.name}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.25 }}>
                {post.author.department && (
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {post.author.department}
                  </Typography>
                )}
                <Typography variant="caption" sx={{ color: "text.disabled", display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Clock size={11} />
                  {formatDate(post.createdAt)}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {getTypeChip()}

            {isAdmin && onTogglePin && (
              <Tooltip title={post.isPinned ? "Unpin post" : "Pin post to top"}>
                <IconButton
                  size="small"
                  onClick={() => onTogglePin(post.id, post.isPinned)}
                  color={post.isPinned ? "warning" : "default"}
                >
                  {post.isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                </IconButton>
              </Tooltip>
            )}

            {canDelete && onDelete && (
              <Tooltip title="Delete post">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => onDelete(post.id)}
                >
                  <Trash2 size={16} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        <Typography
          component={RouterLink}
          to={`/community/posts/${post.id}`}
          variant="h6"
          sx={{
            fontWeight: 700,
            textDecoration: "none",
            color: "text.primary",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            mb: 1.5,
            transition: "color 0.15s ease",
            "&:hover": {
              color: "primary.main",
            },
          }}
        >
          {post.title}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            lineHeight: 1.6,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            mb: 2,
          }}
        >
          {post.content}
        </Typography>

        <Divider sx={{ my: 1.5 }} />

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box
            component={RouterLink}
            to={`/community/posts/${post.id}`}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              textDecoration: "none",
              color: "text.secondary",
              transition: "color 0.15s ease",
              "&:hover": { color: "primary.main" },
            }}
          >
            <MessageSquare size={16} />
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {post.commentCount} {post.commentCount === 1 ? "comment" : "comments"}
            </Typography>
          </Box>

          <Box
            component={RouterLink}
            to={`/community/posts/${post.id}`}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              textDecoration: "none",
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: "primary.main",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            Read thread
            <ArrowRight size={14} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
