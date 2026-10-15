import React, { useState, useEffect, useCallback } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  IconButton,
  Badge,
  Popover,
  Box,
  Typography,
  Button,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Chip,
} from "@mui/material";
import {
  Bell,
  CalendarCheck,
  CalendarX,
  Users,
  Briefcase,
  CheckSquare,
  Megaphone,
  CheckCheck,
  ArrowRight,
  Inbox,
} from "lucide-react";
import {
  notificationsApi,
  type NotificationItem,
  type NotificationType,
} from "./notifications.api.js";
import { useAuth } from "../auth/AuthContext.js";

export const NotificationBell: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [recentNotifications, setRecentNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const count = await notificationsApi.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Quiet fail on polling
    }
  }, [isAuthenticated]);

  const fetchRecent = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificationsApi.listNotifications({ limit: 5 });
      setRecentNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // Quiet fail
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll unread count every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    fetchRecent();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setUnreadCount(0);
      setRecentNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // Ignore
    }
  };

  const handleItemClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      try {
        await notificationsApi.markAsRead(notif.id);
        setUnreadCount((c) => Math.max(0, c - 1));
        setRecentNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
      } catch {
        // Ignore
      }
    }
    handleClose();
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case "EVENT_REGISTRATION":
        return <CalendarCheck size={18} className="text-emerald-500" />;
      case "EVENT_CANCELLED":
        return <CalendarX size={18} className="text-rose-500" />;
      case "CLUB_MEMBERSHIP_UPDATE":
        return <Users size={18} className="text-indigo-500" />;
      case "PROJECT_INVITATION":
        return <Briefcase size={18} className="text-blue-500" />;
      case "TASK_ASSIGNED":
        return <CheckSquare size={18} className="text-violet-500" />;
      case "COMMUNITY_ANNOUNCEMENT":
        return <Megaphone size={18} className="text-amber-500" />;
      default:
        return <Bell size={18} className="text-slate-500" />;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        onClick={handleOpen}
        size="small"
        sx={{
          p: 1,
          color: open ? "primary.main" : "text.secondary",
          bgcolor: open ? "action.selected" : "transparent",
          "&:hover": { bgcolor: "action.hover" },
        }}
        aria-label="Notifications"
      >
        <Badge badgeContent={unreadCount} color="error" max={99}>
          <Bell size={20} />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            width: 360,
            maxWidth: "92vw",
            maxHeight: 520,
            borderRadius: "16px",
            boxShadow: 4,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            px: 2.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            bgcolor: "background.paper",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Chip
                label={`${unreadCount} new`}
                size="small"
                color="primary"
                sx={{ height: 20, fontSize: "0.6875rem", fontWeight: 700 }}
              />
            )}
          </Box>

          {unreadCount > 0 && (
            <Button
              size="small"
              variant="text"
              onClick={handleMarkAllRead}
              startIcon={<CheckCheck size={14} />}
              sx={{ textTransform: "none", fontSize: "0.75rem", fontWeight: 600, py: 0.25 }}
            >
              Mark all read
            </Button>
          )}
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : recentNotifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
              <Inbox size={36} className="mx-auto mb-1 text-slate-300" />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                You're all caught up!
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                No notifications right now
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {recentNotifications.map((item, idx) => (
                <React.Fragment key={item.id}>
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => handleItemClick(item)}
                      sx={{
                        py: 1.5,
                        px: 2.5,
                        alignItems: "flex-start",
                        bgcolor: item.isRead ? "inherit" : "action.hover",
                        transition: "background-color 0.15s ease",
                        "&:hover": {
                          bgcolor: "action.selected",
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                        {getTypeIcon(item.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: item.isRead ? 600 : 700,
                                color: "text.primary",
                                lineHeight: 1.3,
                              }}
                            >
                              {item.title}
                            </Typography>
                            {!item.isRead && (
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  bgcolor: "primary.main",
                                  flexShrink: 0,
                                }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Typography
                              variant="caption"
                              sx={{
                                color: "text.secondary",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                lineHeight: 1.4,
                              }}
                            >
                              {item.message}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                display: "block",
                                color: "text.disabled",
                                fontSize: "0.6875rem",
                                mt: 0.5,
                              }}
                            >
                              {formatTimeAgo(item.createdAt)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                  {idx < recentNotifications.length - 1 && <Divider component="li" />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>

        {/* Footer */}
        <Box
          sx={{
            p: 1.25,
            px: 2,
            borderTop: "1px solid",
            borderColor: "divider",
            bgcolor: "background.default",
            textAlign: "center",
          }}
        >
          <Button
            component={RouterLink}
            to="/notifications"
            onClick={handleClose}
            size="small"
            fullWidth
            endIcon={<ArrowRight size={14} />}
            sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.8125rem" }}
          >
            See all notifications
          </Button>
        </Box>
      </Popover>
    </>
  );
};
