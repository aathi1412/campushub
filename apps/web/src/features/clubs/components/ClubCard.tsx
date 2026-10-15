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
  Button,
  Stack,
} from "@mui/material";
import { Users, Calendar, ArrowRight, ShieldCheck, Clock } from "lucide-react";
import type { Club } from "../clubs.api.js";

interface ClubCardProps {
  club: Club;
}

export const ClubCard: React.FC<ClubCardProps> = ({ club }) => {
  const userMembership = club.userMembership;

  // Generate pleasant fallback gradient based on club name
  const getGradient = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h1 = Math.abs(hash % 360);
    const h2 = (h1 + 40) % 360;
    return `linear-gradient(135deg, hsl(${h1}, 70%, 50%), hsl(${h2}, 80%, 40%))`;
  };

  return (
    <Card
      elevation={1}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 3,
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: 4,
        },
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Banner / Header Visual */}
      <Box sx={{ position: "relative", height: 110, background: club.bannerUrl ? undefined : getGradient(club.name) }}>
        {club.bannerUrl && (
          <CardMedia
            component="img"
            height="110"
            image={club.bannerUrl}
            alt={club.name}
            sx={{ objectFit: "cover" }}
          />
        )}
        <Box
          sx={{
            position: "absolute",
            top: 10,
            right: 10,
            display: "flex",
            gap: 1,
          }}
        >
          {userMembership && (
            <Chip
              size="small"
              icon={userMembership.status === "PENDING" ? <Clock size={12} /> : <ShieldCheck size={12} />}
              label={
                userMembership.status === "PENDING"
                  ? "Pending"
                  : userMembership.role === "LEADER"
                  ? "Leader"
                  : userMembership.role === "OFFICER"
                  ? "Officer"
                  : "Member"
              }
              color={
                userMembership.status === "PENDING"
                  ? "warning"
                  : userMembership.role === "LEADER"
                  ? "primary"
                  : userMembership.role === "OFFICER"
                  ? "secondary"
                  : "success"
              }
              sx={{ fontWeight: 700, fontSize: "0.7rem", bgcolor: "background.paper" }}
            />
          )}
        </Box>
      </Box>

      {/* Club Logo / Avatar */}
      <Box sx={{ px: 2.5, position: "relative", top: -28, mb: -2.5 }}>
        <Avatar
          src={club.logoUrl || undefined}
          alt={club.name}
          sx={{
            width: 56,
            height: 56,
            boxShadow: 2,
            border: "3px solid white",
            bgcolor: "primary.main",
            fontSize: "1.25rem",
            fontWeight: 700,
          }}
        >
          {club.name.charAt(0).toUpperCase()}
        </Avatar>
      </Box>

      <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", pt: 1.5, pb: 2.5 }}>
        {/* Category Chip */}
        <Box sx={{ mb: 1 }}>
          <Chip
            label={club.category}
            size="small"
            sx={{
              bgcolor: "primary.50",
              color: "primary.dark",
              fontWeight: 600,
              fontSize: "0.72rem",
            }}
          />
        </Box>

        {/* Club Name */}
        <Typography
          variant="h6"
          fontWeight={700}
          component={RouterLink}
          to={`/clubs/${club.id}`}
          sx={{
            textDecoration: "none",
            color: "text.primary",
            mb: 1,
            lineHeight: 1.3,
            "&:hover": { color: "primary.main" },
          }}
        >
          {club.name}
        </Typography>

        {/* Description snippet */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2.5,
            flexGrow: 1,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            lineHeight: 1.5,
          }}
        >
          {club.description}
        </Typography>

        {/* Stats Row */}
        <Stack direction="row" spacing={2} sx={{ mb: 2, color: "text.secondary", fontSize: "0.8rem" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Users size={15} />
            <Typography variant="caption" fontWeight={600}>
              {club.memberCount} {club.memberCount === 1 ? "Member" : "Members"}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Calendar size={15} />
            <Typography variant="caption" fontWeight={600}>
              {club.eventCount} {club.eventCount === 1 ? "Event" : "Events"}
            </Typography>
          </Box>
        </Stack>

        {/* Footer Actions */}
        <Box sx={{ pt: 1, borderTop: "1px solid", borderColor: "divider" }}>
          <Button
            component={RouterLink}
            to={`/clubs/${club.id}`}
            variant="outlined"
            fullWidth
            size="small"
            endIcon={<ArrowRight size={15} />}
            sx={{ fontWeight: 600, borderRadius: 2 }}
          >
            View Club
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};
