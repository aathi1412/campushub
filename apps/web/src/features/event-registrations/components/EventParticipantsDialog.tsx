import React, { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Search, CheckCircle2, XCircle, Users, RefreshCw } from "lucide-react";
import type { EventRegistration, RegistrationStatus } from "../registrations.api.js";
import { getEventParticipantsApi, updateAttendanceApi } from "../registrations.api.js";

interface EventParticipantsDialogProps {
  open: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
}

export const EventParticipantsDialog: React.FC<EventParticipantsDialogProps> = ({
  open,
  onClose,
  eventId,
  eventTitle,
}) => {
  const [participants, setParticipants] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const fetchParticipants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getEventParticipantsApi(eventId, {
        search: search.trim() || undefined,
        limit: 50,
      });
      setParticipants(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to load participants.");
    } finally {
      setLoading(false);
    }
  }, [eventId, search]);

  useEffect(() => {
    if (open) {
      fetchParticipants();
    }
  }, [open, fetchParticipants]);

  const handleToggleAttendance = async (userId: string, currentStatus: RegistrationStatus) => {
    setUpdatingUserId(userId);
    try {
      const nextStatus: RegistrationStatus = currentStatus === "ATTENDED" ? "REGISTERED" : "ATTENDED";
      const res = await updateAttendanceApi(eventId, userId, nextStatus);
      setParticipants((prev) =>
        prev.map((p) => (p.userId === userId ? { ...p, status: res.data.status, attendedAt: res.data.attendedAt } : p))
      );
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to update attendance.");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const attendedCount = participants.filter((p) => p.status === "ATTENDED").length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Users size={22} className="text-blue-600" />
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Event Participants & Attendance
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 350, display: "block" }}>
                {eventTitle}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
            <Chip
              label={`${attendedCount} / ${participants.length} Attended`}
              color="primary"
              size="small"
              sx={{ fontWeight: 600 }}
            />
            <Tooltip title="Refresh attendee list">
              <IconButton size="small" onClick={fetchParticipants}>
                <RefreshCw size={16} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2.5 }}>
        {/* Search Input */}
        <Box sx={{ mb: 2.5 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search participant by name, email, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} className="text-slate-400" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        ) : participants.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 6, color: "text.secondary" }}>
            <Typography variant="body1">No registered participants found.</Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: "grey.50" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Attendee</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Registered</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Attendance Action
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {participants.map((p) => {
                  const isAttended = p.status === "ATTENDED";
                  const isUpdating = updatingUserId === p.userId;

                  return (
                    <TableRow key={p.id} hover>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Avatar sx={{ width: 32, height: 32, fontSize: "0.8rem", bgcolor: "primary.main" }}>
                            {p.user?.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {p.user?.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {p.user?.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {p.user?.department || "General"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(p.registeredAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={p.status}
                          size="small"
                          color={isAttended ? "success" : p.status === "CANCELLED" ? "default" : "primary"}
                          variant={isAttended ? "filled" : "outlined"}
                          sx={{ fontWeight: 600, fontSize: "0.7rem" }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant={isAttended ? "outlined" : "contained"}
                          color={isAttended ? "inherit" : "success"}
                          disabled={isUpdating || p.status === "CANCELLED"}
                          onClick={() => handleToggleAttendance(p.userId, p.status)}
                          startIcon={
                            isUpdating ? (
                              <CircularProgress size={12} color="inherit" />
                            ) : isAttended ? (
                              <XCircle size={14} />
                            ) : (
                              <CheckCircle2 size={14} />
                            )
                          }
                          sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                        >
                          {isAttended ? "Undo Attendance" : "Mark Attended"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained" size="small">
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};
