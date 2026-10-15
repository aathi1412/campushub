import React, { useState, useEffect, useCallback } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Paper,
  Snackbar,
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
  Check,
  Trash2,
  ExternalLink,
  Inbox,
  Radio,
} from "lucide-react";
import {
  notificationsApi,
  type NotificationItem,
  type NotificationType,
} from "./notifications.api.js";
import { BroadcastDialog } from "./BroadcastDialog.js";
import { useAuth } from "../auth/AuthContext.js";

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [currentTab, setCurrentTab] = useState<number>(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Broadcast Dialog
  const [broadcastOpen, setBroadcastOpen] = useState(false);

  // Snackbar Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);

    let unreadOnly: boolean | undefined;
    let type: NotificationType | undefined;

    if (currentTab === 1) {
      unreadOnly = true;
    } else if (currentTab === 2) {
      type = "EVENT_REGISTRATION";
    } else if (currentTab === 3) {
      type = "CLUB_MEMBERSHIP_UPDATE";
    } else if (currentTab === 4) {
      type = "TASK_ASSIGNED";
    } else if (currentTab === 5) {
      type = "COMMUNITY_ANNOUNCEMENT";
    }

    try {
      const data = await notificationsApi.listNotifications({
        unreadOnly,
        type,
        limit: 50,
      });
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      setError("Failed to load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [currentTab]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      setToastMessage("Notification marked as read.");
    } catch {
      setError("Failed to mark notification as read.");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      setToastMessage("All notifications marked as read.");
    } catch {
      setError("Failed to mark all as read.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationsApi.deleteNotification(id);
      const target = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (target && !target.isRead) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      setToastMessage("Notification removed.");
    } catch {
      setError("Failed to delete notification.");
    }
  };

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case "EVENT_REGISTRATION":
        return <CalendarCheck size={20} className="text-emerald-500" />;
      case "EVENT_CANCELLED":
        return <CalendarX size={20} className="text-rose-500" />;
      case "CLUB_MEMBERSHIP_UPDATE":
        return <Users size={20} className="text-indigo-500" />;
      case "PROJECT_INVITATION":
        return <Briefcase size={20} className="text-blue-500" />;
      case "TASK_ASSIGNED":
        return <CheckSquare size={20} className="text-violet-500" />;
      case "COMMUNITY_ANNOUNCEMENT":
        return <Megaphone size={20} className="text-amber-500" />;
      default:
        return <Bell size={20} className="text-slate-500" />;
    }
  };

  const getTypeBadge = (type: NotificationType) => {
    switch (type) {
      case "EVENT_REGISTRATION":
      case "EVENT_CANCELLED":
        return <Chip size="small" label="Event" color="success" variant="outlined" sx={{ height: 20, fontSize: "0.6875rem" }} />;
      case "CLUB_MEMBERSHIP_UPDATE":
        return <Chip size="small" label="Club" color="primary" variant="outlined" sx={{ height: 20, fontSize: "0.6875rem" }} />;
      case "PROJECT_INVITATION":
      case "TASK_ASSIGNED":
        return <Chip size="small" label="Project" color="info" variant="outlined" sx={{ height: 20, fontSize: "0.6875rem" }} />;
      case "COMMUNITY_ANNOUNCEMENT":
        return <Chip size="small" label="Announcement" color="warning" variant="outlined" sx={{ height: 20, fontSize: "0.6875rem" }} />;
      default:
        return <Chip size="small" label="General" variant="outlined" sx={{ height: 20, fontSize: "0.6875rem" }} />;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Chip
                label={`${unreadCount} unread`}
                color="primary"
                size="small"
                sx={{ fontWeight: 700 }}
              />
            )}
          </Box>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Keep track of campus announcements, event updates, team invitations, and task assignments
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          {unreadCount > 0 && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<CheckCheck size={16} />}
              onClick={handleMarkAllRead}
              sx={{ borderRadius: "8px", fontWeight: 600, textTransform: "none" }}
            >
              Mark all read
            </Button>
          )}

          {isAdmin && (
            <Button
              variant="contained"
              color="warning"
              size="small"
              startIcon={<Radio size={16} />}
              onClick={() => setBroadcastOpen(true)}
              sx={{ borderRadius: "8px", fontWeight: 700, textTransform: "none" }}
            >
              Broadcast Alert
            </Button>
          )}
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(_, newVal) => setCurrentTab(newVal)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.9375rem",
              minHeight: 48,
            },
          }}
        >
          <Tab label="All" />
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <span>Unread</span>
                {unreadCount > 0 && (
                  <Box
                    sx={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      bgcolor: "primary.main",
                    }}
                  />
                )}
              </Box>
            }
          />
          <Tab label="Events" />
          <Tab label="Clubs" />
          <Tab label="Projects & Tasks" />
          <Tab label="Announcements" />
        </Tabs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Notifications List */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : notifications.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: "center",
            borderRadius: "16px",
            border: "1px dashed",
            borderColor: "divider",
          }}
        >
          <Inbox size={48} className="mx-auto mb-2 text-slate-300" />
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
            No Notifications Found
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 400, mx: "auto" }}>
            {currentTab === 1
              ? "All your notifications have been marked as read. You're all caught up!"
              : "You do not have any alerts or updates in this category at this moment."}
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {notifications.map((item) => (
            <Card
              key={item.id}
              elevation={item.isRead ? 0 : 2}
              sx={{
                borderRadius: "14px",
                border: "1px solid",
                borderColor: item.isRead ? "divider" : "primary.main",
                bgcolor: item.isRead ? "background.paper" : "action.hover",
                transition: "all 0.2s ease",
                "&:hover": {
                  boxShadow: 2,
                },
              }}
            >
              <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                  {/* Icon */}
                  <Box
                    sx={{
                      p: 1.25,
                      borderRadius: "10px",
                      bgcolor: "background.paper",
                      border: "1px solid",
                      borderColor: "divider",
                      display: "flex",
                      mt: 0.25,
                    }}
                  >
                    {getTypeIcon(item.type)}
                  </Box>

                  {/* Body */}
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5, flexWrap: "wrap" }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: item.isRead ? 600 : 700, lineHeight: 1.2 }}>
                        {item.title}
                      </Typography>
                      {getTypeBadge(item.type)}
                      {!item.isRead && (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor: "primary.main",
                          }}
                        />
                      )}
                    </Box>

                    <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.6, mb: 1.5 }}>
                      {item.message}
                    </Typography>

                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
                      <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 500 }}>
                        {formatDate(item.createdAt)}
                      </Typography>

                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {item.link && (
                          <Button
                            component={RouterLink}
                            to={item.link}
                            size="small"
                            variant="text"
                            endIcon={<ExternalLink size={13} />}
                            sx={{ textTransform: "none", fontSize: "0.8125rem", fontWeight: 600, py: 0.25 }}
                          >
                            Open Details
                          </Button>
                        )}

                        {!item.isRead && (
                          <Tooltip title="Mark as read">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleMarkAsRead(item.id)}
                            >
                              <Check size={16} />
                            </IconButton>
                          </Tooltip>
                        )}

                        <Tooltip title="Delete notification">
                          <IconButton
                            size="small"
                            color="default"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Broadcast Dialog */}
      <BroadcastDialog
        open={broadcastOpen}
        onClose={() => setBroadcastOpen(false)}
        onSuccess={(msg) => {
          setToastMessage(msg);
          fetchNotifications();
        }}
      />

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
