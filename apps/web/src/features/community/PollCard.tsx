import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Radio,
  RadioGroup,
  FormControlLabel,
  Button,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Vote,
  Clock,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Users,
} from "lucide-react";
import type { PollItem } from "./community.api.js";
import { communityApi } from "./community.api.js";
import { useAuth } from "../auth/AuthContext.js";

interface PollCardProps {
  poll: PollItem;
  onVoted?: (updatedPoll: PollItem) => void;
  onDelete?: (id: string) => Promise<void>;
}

export const PollCard: React.FC<PollCardProps> = ({ poll, onVoted, onDelete }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const isCreator = user?.id === poll.creatorId;
  const canDelete = isCreator || isAdmin;

  const [selectedOption, setSelectedOption] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasVoted = Boolean(poll.userVotedOptionId);
  const isExpired = poll.isExpired || new Date(poll.expiresAt).getTime() <= Date.now();
  const showResults = hasVoted || isExpired;

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "Closed";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 1) return `Ends in ${days} days`;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours > 1) return `Ends in ${hours} hours`;
    return "Ending soon";
  };

  const handleVote = async () => {
    if (!selectedOption) return;
    setSubmitting(true);
    setError(null);

    try {
      const updated = await communityApi.votePoll(poll.id, selectedOption);
      if (onVoted) {
        onVoted(updated);
      }
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(errorMsg || "Failed to submit vote.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card
      elevation={1}
      sx={{
        borderRadius: "16px",
        border: "1px solid",
        borderColor: "divider",
        transition: "box-shadow 0.2s ease",
        "&:hover": {
          boxShadow: 3,
        },
      }}
    >
      <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar
              src={poll.creator.avatarUrl ?? undefined}
              alt={poll.creator.name}
              sx={{ width: 38, height: 38, bgcolor: "secondary.main", fontSize: "0.875rem" }}
            >
              {poll.creator.name?.charAt(0) || "U"}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.primary", lineHeight: 1.2 }}>
                {poll.creator.name}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Created {formatDate(poll.createdAt)}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip
              size="small"
              icon={isExpired ? <AlertCircle size={13} /> : <Clock size={13} />}
              label={isExpired ? "Closed" : getTimeRemaining(poll.expiresAt)}
              color={isExpired ? "default" : "success"}
              variant={isExpired ? "outlined" : "filled"}
              sx={{ fontWeight: 600, borderRadius: "8px" }}
            />

            {canDelete && onDelete && (
              <Tooltip title="Delete poll">
                <IconButton size="small" color="error" onClick={() => onDelete(poll.id)}>
                  <Trash2 size={16} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Question */}
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.25, mb: 2.5 }}>
          <Box
            sx={{
              p: 0.75,
              borderRadius: "8px",
              bgcolor: "primary.light",
              color: "primary.main",
              display: "flex",
              mt: 0.25,
            }}
          >
            <Vote size={18} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.1rem", lineHeight: 1.4 }}>
            {poll.question}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Options / Results */}
        {showResults ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75, mb: 2 }}>
            {poll.options.map((option) => {
              const isUserChoice = poll.userVotedOptionId === option.id;
              return (
                <Box
                  key={option.id}
                  sx={{
                    p: 1.75,
                    borderRadius: "10px",
                    bgcolor: isUserChoice ? "primary.light" : "action.hover",
                    border: "1px solid",
                    borderColor: isUserChoice ? "primary.main" : "transparent",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.75 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: isUserChoice ? 700 : 500 }}>
                        {option.text}
                      </Typography>
                      {isUserChoice && (
                        <Chip
                          icon={<CheckCircle2 size={12} />}
                          label="Your vote"
                          size="small"
                          color="primary"
                          sx={{ height: 20, fontSize: "0.6875rem", fontWeight: 700 }}
                        />
                      )}
                    </Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
                      {option.percentage}% ({option.voteCount})
                    </Typography>
                  </Box>

                  <LinearProgress
                    variant="determinate"
                    value={option.percentage}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: "action.disabledBackground",
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 4,
                        bgcolor: isUserChoice ? "primary.main" : "text.secondary",
                      },
                    }}
                  />
                </Box>
              );
            })}
          </Box>
        ) : (
          <Box sx={{ mb: 2.5 }}>
            <RadioGroup
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value)}
            >
              {poll.options.map((option) => (
                <Box
                  key={option.id}
                  onClick={() => setSelectedOption(option.id)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    p: 1.25,
                    px: 1.5,
                    mb: 1,
                    borderRadius: "10px",
                    border: "1px solid",
                    borderColor: selectedOption === option.id ? "primary.main" : "divider",
                    bgcolor: selectedOption === option.id ? "action.selected" : "background.paper",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    "&:hover": {
                      bgcolor: "action.hover",
                    },
                  }}
                >
                  <FormControlLabel
                    value={option.id}
                    control={<Radio size="small" />}
                    label={
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {option.text}
                      </Typography>
                    }
                    sx={{ m: 0, width: "100%" }}
                  />
                </Box>
              ))}
            </RadioGroup>

            <Button
              variant="contained"
              fullWidth
              disabled={!selectedOption || submitting}
              onClick={handleVote}
              startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <Vote size={16} />}
              sx={{ mt: 1, borderRadius: "10px", py: 1, fontWeight: 600 }}
            >
              {submitting ? "Casting Vote..." : "Cast Your Vote"}
            </Button>
          </Box>
        )}

        {/* Footer info */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pt: 1, borderTop: "1px solid", borderColor: "divider" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, color: "text.secondary" }}>
            <Users size={14} />
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {poll.totalVotes} {poll.totalVotes === 1 ? "student voted" : "students voted"}
            </Typography>
          </Box>

          <Typography variant="caption" sx={{ color: "text.disabled" }}>
            {hasVoted ? "Vote recorded" : isExpired ? "Voting ended" : "Single vote enforced"}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};
