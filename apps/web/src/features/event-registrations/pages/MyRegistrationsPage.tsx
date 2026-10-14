import React, { useEffect, useState, useCallback } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowRight,
  Ticket,
} from "lucide-react";
import type { EventRegistration } from "../registrations.api.js";
import { getMyRegistrationsApi, cancelRegistrationApi } from "../registrations.api.js";

export const MyRegistrationsPage: React.FC = () => {
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("ALL");

  // Cancel dialog
  const [cancelDialogOpen, setCancelDialogOpen] = useState<boolean>(false);
  const [selectedReg, setSelectedReg] = useState<EventRegistration | null>(null);
  const [cancelling, setCancelling] = useState<boolean>(false);

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyRegistrationsApi();
      setRegistrations(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to load registrations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const handleCancelClick = (reg: EventRegistration) => {
    setSelectedReg(reg);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedReg) return;
    setCancelling(true);
    try {
      await cancelRegistrationApi(selectedReg.eventId);
      setRegistrations((prev) =>
        prev.map((r) => (r.id === selectedReg.id ? { ...r, status: "CANCELLED" } : r))
      );
      setCancelDialogOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to cancel registration.");
    } finally {
      setCancelling(false);
    }
  };

  const filteredRegistrations = registrations.filter((r) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "ACTIVE") return r.status === "REGISTERED";
    if (activeTab === "ATTENDED") return r.status === "ATTENDED";
    if (activeTab === "CANCELLED") return r.status === "CANCELLED";
    return true;
  });

  return (
    <Container maxWidth="xl" sx={{ py: 6 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} gutterBottom sx={{ letterSpacing: "-0.02em" }}>
          My Event Registrations
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your upcoming campus event tickets, attendance records, and cancellations
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab value="ALL" label={`All (${registrations.length})`} sx={{ fontWeight: 600, textTransform: "none" }} />
          <Tab
            value="ACTIVE"
            label={`Active (${registrations.filter((r) => r.status === "REGISTERED").length})`}
            sx={{ fontWeight: 600, textTransform: "none" }}
          />
          <Tab
            value="ATTENDED"
            label={`Attended (${registrations.filter((r) => r.status === "ATTENDED").length})`}
            sx={{ fontWeight: 600, textTransform: "none" }}
          />
          <Tab
            value="CANCELLED"
            label={`Cancelled (${registrations.filter((r) => r.status === "CANCELLED").length})`}
            sx={{ fontWeight: 600, textTransform: "none" }}
          />
        </Tabs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress size={36} />
        </Box>
      ) : filteredRegistrations.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8, bgcolor: "background.paper", borderRadius: 3, border: "1px dashed", borderColor: "divider" }}>
          <Ticket size={48} className="mx-auto text-slate-300 mb-2" />
          <Typography variant="h6" fontWeight={700} gutterBottom>
            No registrations found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: "auto", mb: 3 }}>
            You haven't registered for any events matching this filter yet. Explore upcoming campus events!
          </Typography>
          <Button component={RouterLink} to="/events" variant="contained">
            Explore Campus Events
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredRegistrations.map((reg) => {
            const ev = reg.event;
            if (!ev) return null;

            const startDate = new Date(ev.startTime);
            const isAttended = reg.status === "ATTENDED";
            const isCancelled = reg.status === "CANCELLED";

            return (
              <Grid item xs={12} sm={6} md={4} key={reg.id}>
                <Card
                  elevation={1}
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: 2.5,
                    borderLeft: isAttended
                      ? "4px solid #10b981"
                      : isCancelled
                      ? "4px solid #94a3b8"
                      : "4px solid #1e40af",
                  }}
                >
                  <CardContent sx={{ p: 3, flexGrow: 1, display: "flex", flexDirection: "column" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                      <Chip label={ev.category} size="small" color="primary" sx={{ fontWeight: 600, fontSize: "0.75rem" }} />
                      <Chip
                        icon={isAttended ? <CheckCircle2 size={12} /> : isCancelled ? undefined : <Clock size={12} />}
                        label={reg.status}
                        size="small"
                        color={isAttended ? "success" : isCancelled ? "default" : "info"}
                        variant={isAttended ? "filled" : "outlined"}
                        sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                      />
                    </Box>

                    <Typography
                      variant="h6"
                      fontWeight={700}
                      component={RouterLink}
                      to={`/events/${ev.id}`}
                      sx={{
                        textDecoration: "none",
                        color: "text.primary",
                        mb: 1,
                        "&:hover": { color: "primary.main" },
                      }}
                    >
                      {ev.title}
                    </Typography>

                    <Box sx={{ spaceY: 1, my: 1.5, flexGrow: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary", fontSize: "0.85rem", my: 0.5 }}>
                        <Calendar size={15} className="text-blue-600 shrink-0" />
                        <Typography variant="body2">
                          {startDate.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary", fontSize: "0.85rem", my: 0.5 }}>
                        <MapPin size={15} className="text-rose-600 shrink-0" />
                        <Typography variant="body2" noWrap>
                          {ev.venue}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ pt: 2, borderTop: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Button
                        component={RouterLink}
                        to={`/events/${ev.id}`}
                        size="small"
                        endIcon={<ArrowRight size={14} />}
                        sx={{ fontWeight: 600 }}
                      >
                        View Event
                      </Button>

                      {reg.status === "REGISTERED" && (
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleCancelClick(reg)}
                          sx={{ fontWeight: 600 }}
                        >
                          Cancel
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle fontWeight={700}>Cancel Event Registration</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel your registration for{" "}
            <strong>{selectedReg?.event?.title}</strong>? Your spot will be released to other students.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCancelDialogOpen(false)} disabled={cancelling}>
            Keep Registration
          </Button>
          <Button onClick={handleConfirmCancel} color="error" variant="contained" disabled={cancelling}>
            {cancelling ? <CircularProgress size={18} color="inherit" /> : "Confirm Cancellation"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
