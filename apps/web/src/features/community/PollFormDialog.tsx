import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
  CircularProgress,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Vote, Plus, Trash2, Calendar } from "lucide-react";
import { communityApi } from "./community.api.js";

interface PollFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PollFormDialog: React.FC<PollFormDialogProps> = ({ open, onClose, onSuccess }) => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  // Default expiration: 7 days from now
  const defaultExp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
  const [expiresAt, setExpiresAt] = useState(defaultExp);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setQuestion("");
    setOptions(["", ""]);
    setExpiresAt(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16));
    setError(null);
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, ""]);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim()) {
      setError("Please specify a question for the poll.");
      return;
    }

    const filteredOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);
    if (filteredOptions.length < 2) {
      setError("Poll must provide at least 2 non-empty choices.");
      return;
    }

    const expTime = new Date(expiresAt).getTime();
    if (isNaN(expTime) || expTime <= Date.now()) {
      setError("Expiration time must be set to a future date and time.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await communityApi.createPoll({
        question: question.trim(),
        options: filteredOptions,
        expiresAt: new Date(expiresAt).toISOString(),
      });

      resetForm();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(errorMsg || "Failed to create campus poll. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: "16px", p: 1 },
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: "10px",
              bgcolor: "primary.light",
              color: "primary.main",
              display: "flex",
            }}
          >
            <Vote size={22} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Launch Campus Poll
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Gather quick opinions and sentiment from student peers
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2.5 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <TextField
            label="Poll Question"
            placeholder="e.g. Which library floor should stay open 24/7 during finals week?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            fullWidth
            required
            disabled={loading}
            slotProps={{
              htmlInput: { maxLength: 300 },
            }}
            helperText={`${question.length}/300 characters`}
          />

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Poll Choices (minimum 2, up to 10)
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {options.map((option, idx) => (
                <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <TextField
                    size="small"
                    placeholder={`Option ${idx + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    fullWidth
                    required
                    disabled={loading}
                    slotProps={{
                      htmlInput: { maxLength: 200 },
                    }}
                  />
                  {options.length > 2 && (
                    <Tooltip title="Remove option">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveOption(idx)}
                        disabled={loading}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              ))}
            </Box>

            {options.length < 10 && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<Plus size={14} />}
                onClick={handleAddOption}
                disabled={loading}
                sx={{ mt: 1.5, borderRadius: "8px", textTransform: "none" }}
              >
                Add Option
              </Button>
            )}
          </Box>

          <TextField
            label="Poll Expiration Date & Time"
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            fullWidth
            required
            disabled={loading}
            slotProps={{
              inputLabel: { shrink: true },
              input: {
                startAdornment: (
                  <Box sx={{ mr: 1, color: "text.secondary", display: "flex" }}>
                    <Calendar size={18} />
                  </Box>
                ),
              },
            }}
            helperText="Voting will automatically conclude when this expiration threshold is reached."
          />
        </DialogContent>

        <DialogActions sx={{ p: 2, px: 3 }}>
          <Button onClick={handleClose} disabled={loading} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ borderRadius: "8px", px: 3, fontWeight: 600 }}
          >
            {loading ? "Creating..." : "Launch Poll"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
