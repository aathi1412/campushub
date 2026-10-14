import React, { useEffect, useState, useCallback } from "react";
import {
  Container,
  Box,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  Button,
  Tabs,
  Tab,
  Chip,
  Pagination,
  Skeleton,
  Alert,
} from "@mui/material";
import { Search, Plus, Calendar, Filter } from "lucide-react";
import type { CampusEvent, EventCategory } from "../events.api.js";
import { listEventsApi } from "../events.api.js";
import { EventCard } from "../components/EventCard.js";
import { EventFormDialog } from "../components/EventFormDialog.js";
import { useAuth } from "../../auth/AuthContext.js";

const categories: (EventCategory | "ALL")[] = [
  "ALL",
  "TECHNICAL",
  "ACADEMIC",
  "WORKSHOP",
  "CULTURAL",
  "SPORTS",
  "OTHER",
];

export const EventsListPage: React.FC = () => {
  const { user } = useAuth();
  const isLeaderOrAdmin = user?.role === "CLUB_LEADER" || user?.role === "ADMIN";

  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination State
  const [search, setSearch] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | "ALL">("ALL");
  const [timeframe, setTimeframe] = useState<"upcoming" | "past" | "all">("upcoming");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Dialog State
  const [formDialogOpen, setFormDialogOpen] = useState<boolean>(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listEventsApi({
        page,
        limit: 9,
        search: search.trim() || undefined,
        category: selectedCategory === "ALL" ? undefined : selectedCategory,
        timeframe,
        sortBy: "startTime",
        sortOrder: timeframe === "past" ? "desc" : "asc",
      });

      setEvents(res.data);
      if (res.meta) {
        setTotalPages(res.meta.totalPages || 1);
        setTotalCount(res.meta.total || 0);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to load campus events.");
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedCategory, timeframe]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleTimeframeChange = (_: React.SyntheticEvent, newValue: "upcoming" | "past" | "all") => {
    setTimeframe(newValue);
    setPage(1);
  };

  const handleCategoryClick = (cat: EventCategory | "ALL") => {
    setSelectedCategory(cat);
    setPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEvents();
  };

  const handleEventCreated = (newEvent: CampusEvent) => {
    setEvents((prev) => [newEvent, ...prev]);
    setTotalCount((c) => c + 1);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 6 }}>
      {/* Top Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 4, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom sx={{ letterSpacing: "-0.02em" }}>
            Campus Events
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Discover hackathons, guest lectures, cultural fests, workshops, and student activities
          </Typography>
        </Box>

        {isLeaderOrAdmin && (
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => setFormDialogOpen(true)}
            sx={{ fontWeight: 600, height: 42, px: 2.5 }}
          >
            Create Event
          </Button>
        )}
      </Box>

      {/* Search and Timeframe Tabs */}
      <Box sx={{ mb: 3, display: "flex", flexDirection: { xs: "column", md: "row" }, justifyContent: "space-between", alignItems: "center", gap: 2 }}>
        <Tabs
          value={timeframe}
          onChange={handleTimeframeChange}
          textColor="primary"
          indicatorColor="primary"
          sx={{ borderBottom: 1, borderColor: "divider", width: { xs: "100%", md: "auto" } }}
        >
          <Tab value="upcoming" label="Upcoming Events" sx={{ fontWeight: 600, textTransform: "none" }} />
          <Tab value="past" label="Past Events" sx={{ fontWeight: 600, textTransform: "none" }} />
          <Tab value="all" label="All Events" sx={{ fontWeight: 600, textTransform: "none" }} />
        </Tabs>

        <Box component="form" onSubmit={handleSearchSubmit} sx={{ width: { xs: "100%", md: 320 } }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search events, venues..."
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
      </Box>

      {/* Category Chips */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 4, overflowX: "auto", pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.secondary", mr: 1 }}>
          <Filter size={16} />
          <Typography variant="body2" fontWeight={600}>
            Category:
          </Typography>
        </Box>
        {categories.map((cat) => (
          <Chip
            key={cat}
            label={cat === "ALL" ? "All Categories" : cat}
            onClick={() => handleCategoryClick(cat)}
            color={selectedCategory === cat ? "primary" : "default"}
            variant={selectedCategory === cat ? "filled" : "outlined"}
            sx={{ fontWeight: 500, cursor: "pointer" }}
          />
        ))}
      </Box>

      {/* Error state */}
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {/* Loading Skeletons */}
      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((k) => (
            <Grid item xs={12} sm={6} md={4} key={k}>
              <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 2.5, mb: 1.5 }} />
              <Skeleton variant="text" width="60%" height={24} />
              <Skeleton variant="text" width="90%" height={18} />
              <Skeleton variant="text" width="40%" height={18} />
            </Grid>
          ))}
        </Grid>
      ) : events.length === 0 ? (
        /* Empty State */
        <Box sx={{ textAlign: "center", py: 8, bgcolor: "background.paper", borderRadius: 3, border: "1px dashed", borderColor: "divider" }}>
          <Calendar size={48} className="mx-auto text-slate-300 mb-2" />
          <Typography variant="h6" fontWeight={700} gutterBottom>
            No events found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: "auto", mb: 3 }}>
            {search || selectedCategory !== "ALL"
              ? "No events match your current search or category filters. Try resetting the filters."
              : "There are currently no events listed in this timeframe."}
          </Typography>
          {isLeaderOrAdmin && (
            <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setFormDialogOpen(true)}>
              Create the first event
            </Button>
          )}
        </Box>
      ) : (
        /* Events Grid */
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Showing {events.length} of {totalCount} events
          </Typography>

          <Grid container spacing={3}>
            {events.map((ev) => (
              <Grid item xs={12} sm={6} md={4} key={ev.id}>
                <EventCard event={ev} />
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

      {/* Event Form Dialog (Create) */}
      <EventFormDialog
        open={formDialogOpen}
        onClose={() => setFormDialogOpen(false)}
        onSuccess={handleEventCreated}
      />
    </Container>
  );
};
