import React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  Avatar,
  LinearProgress,
  Button,
} from "@mui/material";
import { Calendar, MapPin, Users, ArrowRight } from "lucide-react";
import type { CampusEvent, EventCategory } from "../events.api.js";

const categoryColors: Record<EventCategory, "primary" | "secondary" | "success" | "warning" | "info" | "default"> = {
  ACADEMIC: "primary",
  TECHNICAL: "info",
  CULTURAL: "secondary",
  WORKSHOP: "warning",
  SPORTS: "success",
  OTHER: "default",
};

interface EventCardProps {
  event: CampusEvent;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const registeredCount = event._count?.registrations || 0;
  const capacityPercent = Math.min(100, Math.round((registeredCount / event.capacity) * 100));

  const startDate = new Date(event.startTime);
  const formattedDate = startDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = startDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isCancelled = event.status === "CANCELLED";
  const isDraft = event.status === "DRAFT";

  return (
    <Card
      elevation={1}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 2.5,
        transition: "all 0.2s ease-in-out",
        opacity: isCancelled ? 0.75 : 1,
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)",
        },
      }}
    >
      {event.bannerUrl ? (
        <CardMedia
          component="img"
          height="160"
          image={event.bannerUrl}
          alt={event.title}
          sx={{ objectFit: "cover", bgcolor: "grey.200" }}
        />
      ) : (
        <Box
          sx={{
            height: 120,
            bgcolor: "primary.50",
            borderBottom: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: 2,
          }}
        >
          <Typography variant="subtitle1" fontWeight={700} color="primary.dark" align="center">
            {event.category} Event
          </Typography>
        </Box>
      )}

      <CardContent sx={{ p: 3, flexGrow: 1, display: "flex", flexDirection: "column" }}>
        {/* Badges */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
          <Chip
            label={event.category}
            size="small"
            color={categoryColors[event.category] || "default"}
            sx={{ fontWeight: 600, fontSize: "0.75rem" }}
          />

          {isCancelled ? (
            <Chip label="Cancelled" size="small" color="error" variant="outlined" sx={{ fontWeight: 600 }} />
          ) : isDraft ? (
            <Chip label="Draft" size="small" color="warning" variant="outlined" sx={{ fontWeight: 600 }} />
          ) : (
            <Chip label="Published" size="small" color="success" variant="outlined" sx={{ fontWeight: 600 }} />
          )}
        </Box>

        {/* Title */}
        <Typography
          variant="h6"
          fontWeight={700}
          component={RouterLink}
          to={`/events/${event.id}`}
          sx={{
            textDecoration: "none",
            color: "text.primary",
            mb: 1,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            "&:hover": { color: "primary.main" },
          }}
        >
          {event.title}
        </Typography>

        {/* Description snippet */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2.5,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            flexGrow: 1,
          }}
        >
          {event.description}
        </Typography>

        {/* Metadata */}
        <Box sx={{ spaceY: 1, mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary", fontSize: "0.875rem", my: 0.5 }}>
            <Calendar size={16} className="text-blue-600 shrink-0" />
            <Typography variant="body2" noWrap>
              {formattedDate} • {formattedTime}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary", fontSize: "0.875rem", my: 0.5 }}>
            <MapPin size={16} className="text-rose-500 shrink-0" />
            <Typography variant="body2" noWrap>
              {event.venue}
            </Typography>
          </Box>
        </Box>

        {/* Capacity indicator */}
        <Box sx={{ mb: 2.5 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.secondary" }}>
              <Users size={14} />
              <Typography variant="caption" fontWeight={600}>
                Capacity
              </Typography>
            </Box>
            <Typography variant="caption" fontWeight={600} color={capacityPercent >= 90 ? "error.main" : "text.secondary"}>
              {registeredCount} / {event.capacity} spots
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={capacityPercent}
            color={capacityPercent >= 90 ? "error" : "primary"}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>

        {/* Footer / Organizer & Action */}
        <Box
          sx={{
            pt: 2,
            borderTop: "1px solid",
            borderColor: "divider",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Avatar sx={{ width: 26, height: 26, fontSize: "0.75rem", bgcolor: "primary.main" }}>
              {event.organizer.name.charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant="caption" color="text.secondary" fontWeight={500} noWrap sx={{ maxWidth: 110 }}>
              {event.organizer.name}
            </Typography>
          </Box>

          <Button
            component={RouterLink}
            to={`/events/${event.id}`}
            size="small"
            endIcon={<ArrowRight size={14} />}
            sx={{ fontWeight: 600, fontSize: "0.8rem" }}
          >
            Details
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};
