import React, { useState, useEffect } from "react";
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
  Avatar,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Stack,
  Divider,
} from "@mui/material";
import { Users, Clock, ShieldCheck, ArrowRight, Compass } from "lucide-react";
import { clubsApi } from "../clubs.api.js";
import type { UserClubItem } from "../clubs.api.js";

export const MyClubsPage: React.FC = () => {
  const [clubs, setClubs] = useState<UserClubItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "PENDING">("ACTIVE");

  useEffect(() => {
    const fetchMyClubs = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await clubsApi.getMyClubs();
        setClubs(data);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || "Failed to load your club memberships");
      } finally {
        setLoading(false);
      }
    };

    fetchMyClubs();
  }, []);

  const activeClubs = clubs.filter((c) => c.status === "APPROVED");
  const pendingClubs = clubs.filter((c) => c.status === "PENDING");
  const displayedClubs = activeTab === "ACTIVE" ? activeClubs : pendingClubs;

  return (
    <Container maxWidth="xl" sx={{ py: 5 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: "primary.main",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Users size={22} />
            </Box>
            <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: "-0.02em" }}>
              My Club Memberships
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            Manage your active campus organizations and track pending join requests.
          </Typography>
        </Box>

        <Button
          component={RouterLink}
          to="/clubs"
          variant="outlined"
          startIcon={<Compass size={16} />}
          sx={{ fontWeight: 600, borderRadius: 2 }}
        >
          Explore All Clubs
        </Button>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: "1px solid", borderColor: "divider", mb: 4 }}>
        <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
          <Tab
            label={`Active Memberships (${activeClubs.length})`}
            value="ACTIVE"
            sx={{ fontWeight: 600 }}
          />
          <Tab
            label={`Pending Applications (${pendingClubs.length})`}
            value="PENDING"
            sx={{ fontWeight: 600 }}
          />
        </Tabs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress size={44} />
        </Box>
      ) : displayedClubs.length === 0 ? (
        <Card sx={{ textAlign: "center", py: 8, borderRadius: 3, border: "1px dashed", borderColor: "divider" }}>
          <CardContent>
            <Users size={44} style={{ opacity: 0.3, marginBottom: 12 }} />
            <Typography variant="h6" fontWeight={700} gutterBottom>
              {activeTab === "ACTIVE" ? "No active club memberships" : "No pending applications"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 450, mx: "auto", mb: 2 }}>
              {activeTab === "ACTIVE"
                ? "You haven't joined any campus clubs yet. Browse our directory to connect with student groups!"
                : "You don't have any pending club membership applications at this time."}
            </Typography>
            <Button component={RouterLink} to="/clubs" variant="contained">
              Browse Student Clubs
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {displayedClubs.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.membershipId}>
              <Card
                sx={{
                  borderRadius: 3,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": { transform: "translateY(-3px)", boxShadow: 3 },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                    <Avatar
                      src={item.club.logoUrl || undefined}
                      sx={{ width: 50, height: 50, bgcolor: "primary.main", fontWeight: 700 }}
                    >
                      {item.club.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Chip
                      icon={item.status === "PENDING" ? <Clock size={12} /> : <ShieldCheck size={12} />}
                      label={
                        item.status === "PENDING"
                          ? "Pending Review"
                          : item.role === "LEADER"
                          ? "Leader"
                          : item.role === "OFFICER"
                          ? "Officer"
                          : "Member"
                      }
                      color={
                        item.status === "PENDING"
                          ? "warning"
                          : item.role === "LEADER"
                          ? "primary"
                          : item.role === "OFFICER"
                          ? "secondary"
                          : "success"
                      }
                      size="small"
                      sx={{ fontWeight: 700, fontSize: "0.72rem" }}
                    />
                  </Box>

                  <Chip
                    label={item.club.category}
                    size="small"
                    sx={{ bgcolor: "primary.50", color: "primary.dark", fontWeight: 600, mb: 1 }}
                  />

                  <Typography
                    variant="h6"
                    fontWeight={700}
                    component={RouterLink}
                    to={`/clubs/${item.club.id}`}
                    sx={{
                      textDecoration: "none",
                      color: "text.primary",
                      display: "block",
                      mb: 1,
                      "&:hover": { color: "primary.main" },
                    }}
                  >
                    {item.club.name}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      mb: 2,
                    }}
                  >
                    {item.club.description}
                  </Typography>

                  <Divider sx={{ my: 1.5 }} />

                  <Stack direction="row" justifyContent="space-between" color="text.secondary">
                    <Typography variant="caption">
                      {item.club.memberCount} Members
                    </Typography>
                    <Typography variant="caption">
                      {item.joinedAt
                        ? `Joined ${new Date(item.joinedAt).toLocaleDateString()}`
                        : `Applied ${new Date(item.createdAt).toLocaleDateString()}`}
                    </Typography>
                  </Stack>
                </CardContent>

                <Box sx={{ p: 2, pt: 0 }}>
                  <Button
                    component={RouterLink}
                    to={`/clubs/${item.club.id}`}
                    variant="outlined"
                    fullWidth
                    size="small"
                    endIcon={<ArrowRight size={15} />}
                    sx={{ fontWeight: 600 }}
                  >
                    View Club Details
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};
