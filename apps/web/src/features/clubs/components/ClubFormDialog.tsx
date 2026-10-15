import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Box,
  Typography,
  Alert,
} from "@mui/material";
import { Users } from "lucide-react";
import { clubCategories } from "../clubs.api.js";
import type { Club, CreateClubPayload, UpdateClubPayload } from "../clubs.api.js";

const clubSchema = z.object({
  name: z.string().min(3, "Club name must be at least 3 characters").max(150),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(2, "Please select a category"),
  logoUrl: z.string().url("Please provide a valid URL").or(z.literal("")).optional(),
  bannerUrl: z.string().url("Please provide a valid URL").or(z.literal("")).optional(),
});

type ClubFormData = z.infer<typeof clubSchema>;

interface ClubFormDialogProps {
  open: boolean;
  club?: Club | null;
  onClose: () => void;
  onSubmit: (data: CreateClubPayload | UpdateClubPayload) => Promise<void>;
}

export const ClubFormDialog: React.FC<ClubFormDialogProps> = ({
  open,
  club,
  onClose,
  onSubmit,
}) => {
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClubFormData>({
    resolver: zodResolver(clubSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "Technology & Coding",
      logoUrl: "",
      bannerUrl: "",
    },
  });

  useEffect(() => {
    if (club) {
      reset({
        name: club.name,
        description: club.description,
        category: club.category,
        logoUrl: club.logoUrl || "",
        bannerUrl: club.bannerUrl || "",
      });
    } else {
      reset({
        name: "",
        description: "",
        category: "Technology & Coding",
        logoUrl: "",
        bannerUrl: "",
      });
    }
    setServerError(null);
  }, [club, reset, open]);

  const onFormSubmit = async (data: ClubFormData) => {
    try {
      setServerError(null);
      await onSubmit({
        name: data.name,
        description: data.description,
        category: data.category,
        logoUrl: data.logoUrl || undefined,
        bannerUrl: data.bannerUrl || undefined,
      });
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || "Failed to save club";
      setServerError(msg);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <DialogTitle sx={{ pb: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: "primary.50",
              color: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Users size={20} />
          </Box>
          <Typography variant="h6" fontWeight={700}>
            {club ? "Edit Club Details" : "Register a New Student Club"}
          </Typography>
        </DialogTitle>

        <DialogContent dividers sx={{ py: 3 }}>
          {serverError && (
            <Alert severity="error" sx={{ mb: 2.5 }}>
              {serverError}
            </Alert>
          )}

          <Grid container spacing={2.5}>
            {/* Club Name */}
            <Grid item xs={12}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Club Name"
                    fullWidth
                    required
                    error={Boolean(errors.name)}
                    helperText={errors.name?.message}
                    placeholder="e.g. AI & Robotics Society"
                  />
                )}
              />
            </Grid>

            {/* Category */}
            <Grid item xs={12}>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Category"
                    fullWidth
                    required
                    error={Boolean(errors.category)}
                    helperText={errors.category?.message}
                  >
                    {clubCategories.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {cat}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Club Description"
                    multiline
                    rows={4}
                    fullWidth
                    required
                    error={Boolean(errors.description)}
                    helperText={errors.description?.message || "Explain the club's mission, activities, and goals."}
                  />
                )}
              />
            </Grid>

            {/* Logo URL */}
            <Grid item xs={12}>
              <Controller
                name="logoUrl"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Logo Image URL (Optional)"
                    fullWidth
                    error={Boolean(errors.logoUrl)}
                    helperText={errors.logoUrl?.message || "Square emblem or crest image link"}
                  />
                )}
              />
            </Grid>

            {/* Banner URL */}
            <Grid item xs={12}>
              <Controller
                name="bannerUrl"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Banner Image URL (Optional)"
                    fullWidth
                    error={Boolean(errors.bannerUrl)}
                    helperText={errors.bannerUrl?.message || "Wide header banner image link"}
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={isSubmitting} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : club ? "Update Club" : "Create Club"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
