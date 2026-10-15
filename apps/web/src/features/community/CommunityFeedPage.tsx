import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Grid,
  CircularProgress,
  Alert,
  Paper,
  Snackbar,
} from "@mui/material";
import {
  MessageSquarePlus,
  Vote,
  Search,
  Sparkles,
  Megaphone,
  Tag,
  AlertCircle,
  Inbox,
} from "lucide-react";
import {
  communityApi,
  type CommunityPost,
  type PollItem,
  type PostType,
} from "./community.api.js";
import { PostCard } from "./PostCard.js";
import { PostFormDialog } from "./PostFormDialog.js";
import { PollCard } from "./PollCard.js";
import { PollFormDialog } from "./PollFormDialog.js";

export const CommunityFeedPage: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [polls, setPolls] = useState<PollItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialogs
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [pollDialogOpen, setPollDialogOpen] = useState(false);

  // Notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchPosts = useCallback(async (type?: PostType, search?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await communityApi.listPosts({
        type,
        search: search || undefined,
        limit: 50,
      });
      setPosts(data.posts);
    } catch {
      setError("Failed to load community posts. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPolls = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await communityApi.listPolls({ limit: 50 });
      setPolls(data.polls);
    } catch {
      setError("Failed to load campus polls. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentTab === 0) {
      fetchPosts(undefined, debouncedSearch);
    } else if (currentTab === 1) {
      fetchPosts("ANNOUNCEMENT", debouncedSearch);
    } else if (currentTab === 2) {
      fetchPosts("LOST_AND_FOUND", debouncedSearch);
    } else if (currentTab === 3) {
      fetchPolls();
    }
  }, [currentTab, debouncedSearch, fetchPosts, fetchPolls]);

  const handleTogglePin = async (id: string, currentPinned: boolean) => {
    try {
      await communityApi.updatePost(id, { isPinned: !currentPinned });
      setToastMessage(currentPinned ? "Post unpinned." : "Post pinned to top.");
      // Refresh posts
      const type = currentTab === 1 ? "ANNOUNCEMENT" : currentTab === 2 ? "LOST_AND_FOUND" : undefined;
      fetchPosts(type, debouncedSearch);
    } catch {
      setError("Failed to update post pin status.");
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await communityApi.deletePost(id);
      setToastMessage("Post deleted successfully.");
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setError("Failed to delete post.");
    }
  };

  const handleDeletePoll = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this poll?")) return;
    try {
      await communityApi.deletePoll(id);
      setToastMessage("Poll deleted successfully.");
      setPolls((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setError("Failed to delete poll.");
    }
  };

  const handlePollVoted = (updatedPoll: PollItem) => {
    setToastMessage("Vote cast successfully!");
    setPolls((prev) => prev.map((p) => (p.id === updatedPoll.id ? updatedPoll : p)));
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Top Banner */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          mb: 4,
          borderRadius: "20px",
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          color: "#ffffff",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
          gap: 3,
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Sparkles size={20} className="text-amber-400" />
            <Typography variant="overline" sx={{ letterSpacing: 1.5, fontWeight: 700, color: "grey.400" }}>
              Campus Voices & Pulse
            </Typography>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: -0.5 }}>
            Campus Community & Polls
          </Typography>
          <Typography variant="body1" sx={{ color: "grey.300", maxWidth: 620, lineHeight: 1.6 }}>
            Stay informed with verified announcements, exchange ideas with students across departments, report lost items, and participate in campus sentiment polls.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<MessageSquarePlus size={18} />}
            onClick={() => setPostDialogOpen(true)}
            sx={{
              borderRadius: "10px",
              px: 2.5,
              py: 1,
              fontWeight: 700,
              boxShadow: "0 4px 14px 0 rgba(0, 118, 255, 0.39)",
            }}
          >
            New Post
          </Button>

          <Button
            variant="outlined"
            startIcon={<Vote size={18} />}
            onClick={() => setPollDialogOpen(true)}
            sx={{
              borderRadius: "10px",
              px: 2.5,
              py: 1,
              fontWeight: 700,
              color: "#ffffff",
              borderColor: "rgba(255,255,255,0.4)",
              "&:hover": {
                borderColor: "#ffffff",
                bgcolor: "rgba(255,255,255,0.08)",
              },
            }}
          >
            Launch Poll
          </Button>
        </Box>
      </Paper>

      {/* Tabs & Search Controls */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "center" },
          gap: 2,
          mb: 3,
        }}
      >
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
          <Tab icon={<Sparkles size={16} />} iconPosition="start" label="All Posts" />
          <Tab icon={<Megaphone size={16} />} iconPosition="start" label="Announcements" />
          <Tab icon={<Tag size={16} />} iconPosition="start" label="Lost & Found" />
          <Tab icon={<Vote size={16} />} iconPosition="start" label="Campus Polls" />
        </Tabs>

        {currentTab !== 3 && (
          <TextField
            size="small"
            placeholder="Search discussions or items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ width: { xs: "100%", sm: 280 } }}
          />
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Content Rendering */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : currentTab === 3 ? (
        // Polls Tab
        polls.length === 0 ? (
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
            <Inbox size={48} className="mx-auto mb-2 text-slate-400" />
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              No Active Campus Polls
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 3, maxWidth: 450, mx: "auto" }}>
              Be the first to gauge campus consensus! Launch an opinion poll on dining, campus facilities, or academics.
            </Typography>
            <Button
              variant="contained"
              startIcon={<Vote size={16} />}
              onClick={() => setPollDialogOpen(true)}
              sx={{ borderRadius: "8px", fontWeight: 600 }}
            >
              Launch First Poll
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {polls.map((poll) => (
              <Grid item xs={12} md={6} key={poll.id}>
                <PollCard
                  poll={poll}
                  onVoted={handlePollVoted}
                  onDelete={handleDeletePoll}
                />
              </Grid>
            ))}
          </Grid>
        )
      ) : (
        // Posts Tab
        posts.length === 0 ? (
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
            <AlertCircle size={48} className="mx-auto mb-2 text-slate-400" />
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              {searchQuery ? "No Matching Posts Found" : "No Discussions in This Category Yet"}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 3, maxWidth: 450, mx: "auto" }}>
              {searchQuery
                ? `No posts matched "${searchQuery}". Try different search terms or clear the filter.`
                : "Start the conversation by sharing a question, study tip, or notice with your campus."}
            </Typography>
            <Button
              variant="contained"
              startIcon={<MessageSquarePlus size={16} />}
              onClick={() => setPostDialogOpen(true)}
              sx={{ borderRadius: "8px", fontWeight: 600 }}
            >
              Start First Discussion
            </Button>
          </Paper>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onTogglePin={handleTogglePin}
                onDelete={handleDeletePost}
              />
            ))}
          </Box>
        )
      )}

      {/* Dialogs */}
      <PostFormDialog
        open={postDialogOpen}
        onClose={() => setPostDialogOpen(false)}
        onSuccess={() => {
          setToastMessage("Post published successfully!");
          fetchPosts(undefined, debouncedSearch);
        }}
      />

      <PollFormDialog
        open={pollDialogOpen}
        onClose={() => setPollDialogOpen(false)}
        onSuccess={() => {
          setToastMessage("Campus poll created successfully!");
          setCurrentTab(3);
          fetchPolls();
        }}
      />

      {/* Toast Feedback */}
      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={4000}
        onClose={() => setToastMessage(null)}
        message={toastMessage}
      />
    </Container>
  );
};
