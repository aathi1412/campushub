import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Button,
  Avatar,
  Divider,
  LinearProgress,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Edit,
  Trash2,
  Building2,
  Mail,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import type { CampusEvent } from "../events.api.js";
import { getEventByIdApi, deleteEventApi } from "../events.api.js";
import { EventFormDialog } from "../components/EventFormDialog.js";
import { useAuth } from "../../auth/AuthContext.js";
import {
  registerEventApi,
  cancelRegistrationApi,
  getRegistrationStatusApi,
} from "../../event-registrations/registrations.api.js";
import { EventParticipantsDialog } from "../../event-registrations/components/EventParticipantsDialog.js";

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState<CampusEvent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Dialogs
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [participantsDialogOpen, setParticipantsDialogOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Registration State
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [registrationActionLoading, setRegistrationActionLoading] = useState<boolean>(false);
  const [registrationMessage, setRegistrationMessage] = useState<string | null>(null);

  const fetchEvent = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getEventByIdApi(id);
      setEvent(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to load event details.");
    } finally {
      setLoading(false);
    }
  };

  const checkRegistration = async () => {
    if (!id || !user) {
      setIsRegistered(false);
      return;
    }
    try {
      const res = await getRegistrationStatusApi(id);
      setIsRegistered(res.data.isRegistered);
    } catch {
      setIsRegistered(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [id]);

  useEffect(() => {
    if (user && id) {
      checkRegistration();
    } else {
      setIsRegistered(false);
    }
  }, [user, id]);

  const handleRegister = async () => {
    if (!user) {
      navigate("/login", { state: { from: { pathname: `/events/${id}` } } });
      return;
    }
    if (!id) return;

    setRegistrationActionLoading(true);
    setRegistrationMessage(null);
    try {
      await registerEventApi(id);
      setIsRegistered(true);
      setRegistrationMessage("Successfully registered for this event!");
      if (event) {
        setEvent({
          ...event,
          _count: {
            registrations: (event._count?.registrations || 0) + 1,
          },
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to register for event.");
    } finally {
      setRegistrationActionLoading(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!id) return;
    setRegistrationActionLoading(true);
    setRegistrationMessage(null);
    try {
      await cancelRegistrationApi(id);
      setIsRegistered(false);
      setRegistrationMessage("Registration cancelled successfully.");
      if (event) {
        setEvent({
          ...event,
          _count: {
            registrations: Math.max(0, (event._count?.registrations || 1) - 1),
          },
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to cancel registration.");
    } finally {
      setRegistrationActionLoading(false);
    }
  };

  const isOrganizer = user && event && user.id === event.organizerId;
  const isAdmin = user?.role === "ADMIN";
  const canManage = isOrganizer || isAdmin;

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await deleteEventApi(id);
      navigate("/events");
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to delete event.");
      setDeleteConfirmOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <CircularProgress size={36} />
      </Box>
    );
  }

  if (error || !event) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || "Event not found"}
        </Alert>
        <Button component={RouterLink} to="/events" startIcon={<ArrowLeft size={16} />}>
          Back to Events
        </Button>
      </Container>
    );
  }

  const startDate = new Date(event.startTime);
  const endDate = new Date(event.endTime);
  const deadline = new Date(event.registrationDeadline);
  const now = new Date();

  const isDeadlinePassed = now > deadline;
  const registeredCount = event._count?.registrations || 0;
  const spotsLeft = Math.max(0, event.capacity - registeredCount);
  const capacityPercent = Math.min(100, Math.round((registeredCount / event.capacity) * 100));

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Back button */}
      <Box sx={{ mb: 3 }}>
        <Button component={RouterLink} to="/events" startIcon={<ArrowLeft size={16} />} sx={{ color: "text.secondary" }}>
          All Events
        </Button>
      </Box>

      {/* Hero Banner */}
      {event.bannerUrl ? (
        <CardMedia
          component="img"
          height="320"
          image={event.bannerUrl}
          alt={event.title}
          sx={{ borderRadius: 3, mb: 4, objectFit: "cover", boxShadow: 1 }}
        />
      ) : (
        <Box
          sx={{
            height: 180,
            borderRadius: 3,
            bgcolor: "primary.50",
            border: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 4,
          }}
        >
          <Typography variant="h4" fontWeight={700} color="primary.dark">
            {event.category} Event
          </Typography>
        </Box>
      )}

      <Grid container spacing={4}>
        {/* Left Column: Details & Description */}
        <Grid item xs={12} md={8}>
          <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
            <Chip label={event.category} color="primary" sx={{ fontWeight: 600 }} />
            <Chip
              label={event.status}
              color={event.status === "PUBLISHED" ? "success" : event.status === "CANCELLED" ? "error" : "warning"}
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          </Box>

          <Typography variant="h3" fontWeight={800} gutterBottom sx={{ letterSpacing: "-0.02em" }}>
            {event.title}
          </Typography>

          {/* Key Info Cards */}
          <Grid container spacing={2} sx={{ my: 3 }}>
            <Grid item xs={12} sm={6}>
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, py: 2 }}>
                  <Calendar size={24} className="text-blue-600 shrink-0" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Date & Time
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {startDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, py: 2 }}>
                  <MapPin size={24} className="text-rose-600 shrink-0" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Venue / Location
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {event.venue}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Registration Deadline Alert */}
          {isDeadlinePassed ? (
            <Alert severity="warning" icon={<AlertCircle size={20} />} sx={{ mb: 4 }}>
              Registration for this event closed on {deadline.toLocaleDateString()} at {deadline.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.
            </Alert>
          ) : (
            <Alert severity="info" icon={<Clock size={20} />} sx={{ mb: 4 }}>
              Registration deadline: {deadline.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} at {deadline.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.
            </Alert>
          )}

          {/* Full Description */}
          <Box sx={{ mb: 6 }}>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              About this Event
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: "pre-line", lineHeight: 1.8, color: "text.primary" }}>
              {event.description}
            </Typography>
          </Box>
        </Grid>

        {/* Right Column: Registration Card & Organizer */}
        <Grid item xs={12} md={4}>
          {/* Capacity Card */}
          <Card elevation={2} sx={{ mb: 4, borderRadius: 2.5 }}>
            <CardContent sx={{ p: 3.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>
                  Capacity Status
                </Typography>
                <Chip
                  icon={<Users size={14} />}
                  label={`${spotsLeft} spots left`}
                  color={spotsLeft <= 5 ? "error" : "success"}
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Registered: {registeredCount}
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {capacityPercent}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={capacityPercent}
                  color={capacityPercent >= 90 ? "error" : "primary"}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              {registrationMessage && (
                <Alert severity={isRegistered ? "success" : "info"} sx={{ mb: 2 }}>
                  {registrationMessage}
                </Alert>
              )}

              {isRegistered ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Chip
                    icon={<Users size={16} />}
                    label="You are registered for this event"
                    color="success"
                    sx={{ fontWeight: 600, py: 2 }}
                  />
                  <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    disabled={registrationActionLoading}
                    onClick={handleCancelRegistration}
                    sx={{ height: 42, fontWeight: 600 }}
                  >
                    {registrationActionLoading ? <CircularProgress size={18} color="inherit" /> : "Cancel Registration"}
                  </Button>
                </Box>
              ) : (
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={handleRegister}
                  disabled={registrationActionLoading || isDeadlinePassed || spotsLeft === 0 || event.status !== "PUBLISHED"}
                  sx={{ height: 46, fontWeight: 600 }}
                >
                  {registrationActionLoading ? (
                    <CircularProgress size={22} color="inherit" />
                  ) : event.status !== "PUBLISHED" ? (
                    "Event Not Active"
                  ) : isDeadlinePassed ? (
                    "Registration Closed"
                  ) : spotsLeft === 0 ? (
                    "Capacity Reached"
                  ) : (
                    "Register for Event"
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Organizer Card */}
          <Card elevation={1} sx={{ mb: 4, borderRadius: 2.5 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" fontWeight={600} gutterBottom>
                EVENT ORGANIZER
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, my: 1.5 }}>
                <Avatar sx={{ width: 48, height: 48, bgcolor: "primary.main", fontWeight: 700 }}>
                  {event.organizer.name.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {event.organizer.name}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.secondary" }}>
                    <Mail size={14} />
                    <Typography variant="caption">{event.organizer.email}</Typography>
                  </Box>
                  {event.organizer.department && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.secondary" }}>
                      <Building2 size={14} />
                      <Typography variant="caption">{event.organizer.department}</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Organizer / Admin Actions */}
          {canManage && (
            <Card variant="outlined" sx={{ borderRadius: 2.5, borderColor: "divider" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" fontWeight={600} gutterBottom>
                  EVENT MANAGEMENT
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Users size={16} />}
                    onClick={() => setParticipantsDialogOpen(true)}
                    fullWidth
                  >
                    View Attendees & Attendance
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Edit size={16} />}
                    onClick={() => setEditDialogOpen(true)}
                    fullWidth
                  >
                    Edit Event
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Trash2 size={16} />}
                    onClick={() => setDeleteConfirmOpen(true)}
                    fullWidth
                  >
                    Delete or Cancel Event
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Edit Dialog */}
      <EventFormDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        initialEvent={event}
        onSuccess={(updated) => setEvent(updated)}
      />

      {/* Participants & Attendance Dialog */}
      <EventParticipantsDialog
        open={participantsDialogOpen}
        onClose={() => setParticipantsDialogOpen(false)}
        eventId={event.id}
        eventTitle={event.title}
      />

      {/* Delete / Cancel Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle fontWeight={700}>Confirm Event Action</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete or cancel <strong>{event.title}</strong>? If there are active registrations, the event will be marked as cancelled to preserve audit logs.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={isDeleting}>
            {isDeleting ? <CircularProgress size={18} color="inherit" /> : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
