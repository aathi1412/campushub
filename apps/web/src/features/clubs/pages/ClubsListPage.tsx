import React, { useState, useEffect, useCallback } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  Chip,
  Button,
  Pagination,
  CircularProgress,
  Alert,
  Stack,
  Card,
  CardContent,
} from "@mui/material";
import {
  Search,
  Plus,
  Users,
  Compass,
} from "lucide-react";
import { clubsApi, clubCategories } from "../clubs.api.js";
import type { Club, CreateClubPayload, UpdateClubPayload } from "../clubs.api.js";
import { ClubCard } from "../components/ClubCard.js";
import { ClubFormDialog } from "../components/ClubFormDialog.js";
import { useAuth } from "../../auth/AuthContext.js";

export const ClubsListPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Create Club Dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const canCreateClub =
    isAuthenticated && (user?.role === "CLUB_LEADER" || user?.role === "ADMIN");

  const fetchClubs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await clubsApi.listClubs({
        page,
        limit: 9,
        search: search.trim() || undefined,
        category: selectedCategory === "ALL" ? undefined : selectedCategory,
      });

      setClubs(res.data);
      setTotalPages(res.meta?.totalPages ?? 1);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to load clubs directory");
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedCategory]);

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  const handleCreateClub = async (data: CreateClubPayload | UpdateClubPayload) => {
    await clubsApi.createClub(data as CreateClubPayload);
    await fetchClubs();
  };

  return (
    <Container maxWidth="xl" sx={{ py: 5 }}>
      {/* Page Header */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
          gap: 2,
        }}
      >
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
              Student Clubs & Societies
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            Discover student organizations, join vibrant communities, and build lasting projects.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5 }}>
          {isAuthenticated && (
            <Button
              component={RouterLink}
              to="/my-clubs"
              variant="outlined"
              sx={{ fontWeight: 600, borderRadius: 2 }}
            >
              My Clubs
            </Button>
          )}

          {canCreateClub && (
            <Button
              variant="contained"
              startIcon={<Plus size={18} />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{ fontWeight: 600, borderRadius: 2 }}
            >
              Start a Club
            </Button>
          )}
        </Box>
      </Box>

      {/* Filter and Search Bar */}
      <Card elevation={0} sx={{ mb: 4, p: 2, bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
        <Stack spacing={2}>
          <TextField
            fullWidth
            placeholder="Search clubs by name or keywords..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} color="gray" />
                </InputAdornment>
              ),
            }}
            size="small"
          />

          {/* Category Chips Horizontal Scroll */}
          <Box sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 0.5 }}>
            <Chip
              label="All Categories"
              clickable
              color={selectedCategory === "ALL" ? "primary" : "default"}
              onClick={() => {
                setSelectedCategory("ALL");
                setPage(1);
              }}
              sx={{ fontWeight: 600 }}
            />
            {clubCategories.map((cat) => (
              <Chip
                key={cat}
                label={cat}
                clickable
                color={selectedCategory === cat ? "primary" : "default"}
                onClick={() => {
                  setSelectedCategory(cat);
                  setPage(1);
                }}
                sx={{ fontWeight: 600 }}
              />
            ))}
          </Box>
        </Stack>
      </Card>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Clubs Grid */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress size={44} />
        </Box>
      ) : clubs.length === 0 ? (
        <Card sx={{ textAlign: "center", py: 8, borderRadius: 3, border: "1px dashed", borderColor: "divider" }}>
          <CardContent>
            <Compass size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
            <Typography variant="h6" fontWeight={700} gutterBottom>
              No clubs found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 450, mx: "auto", mb: 2 }}>
              We couldn't find any student organizations matching your search criteria. Try modifying your filters or start a new club!
            </Typography>
            {canCreateClub && (
              <Button
                variant="contained"
                startIcon={<Plus size={16} />}
                onClick={() => setCreateDialogOpen(true)}
              >
                Register a Club
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Grid container spacing={3}>
            {clubs.map((club) => (
              <Grid item xs={12} sm={6} md={4} key={club.id}>
                <ClubCard club={club} />
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, val) => setPage(val)}
                color="primary"
                shape="rounded"
              />
            </Box>
          )}
        </>
      )}

      {/* Create Club Dialog */}
      <ClubFormDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateClub}
      />
    </Container>
  );
};
