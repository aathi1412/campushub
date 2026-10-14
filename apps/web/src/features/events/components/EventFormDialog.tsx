import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  Alert,
  CircularProgress,
  Box,
} from "@mui/material";
import type { CampusEvent, EventCategory } from "../events.api.js";
import { createEventApi, updateEventApi } from "../events.api.js";

const categories: EventCategory[] = [
  "ACADEMIC",
  "CULTURAL",
  "SPORTS",
  "TECHNICAL",
  "WORKSHOP",
  "OTHER",
];

const eventFormSchema = z
  .object({
    title: z.string().trim().min(3, "Title must be at least 3 characters").max(255),
    description: z.string().trim().min(10, "Description must be at least 10 characters"),
    category: z.enum(["ACADEMIC", "CULTURAL", "SPORTS", "TECHNICAL", "WORKSHOP", "OTHER"]),
    venue: z.string().trim().min(2, "Venue is required").max(255),
    startTime: z.string().min(1, "Start date and time are required"),
    endTime: z.string().min(1, "End date and time are required"),
    registrationDeadline: z.string().min(1, "Registration deadline is required"),
    capacity: z.coerce.number().int().min(1, "Capacity must be at least 1"),
    bannerUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "CANCELLED", "COMPLETED"]).optional(),
  })
  .refine(
    (data) => new Date(data.startTime) < new Date(data.endTime),
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  )
  .refine(
    (data) => new Date(data.registrationDeadline) <= new Date(data.startTime),
    {
      message: "Registration deadline cannot be after start time",
      path: ["registrationDeadline"],
    }
  );

type EventFormData = z.infer<typeof eventFormSchema>;

interface EventFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (event: CampusEvent) => void;
  initialEvent?: CampusEvent | null;
}

// Helper to convert ISO string to datetime-local format (YYYY-MM-DDTHH:mm)
const toDatetimeLocal = (isoString?: string) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export const EventFormDialog: React.FC<EventFormDialogProps> = ({
  open,
  onClose,
  onSuccess,
  initialEvent,
}) => {
  const isEditing = !!initialEvent;
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "TECHNICAL",
      venue: "",
      startTime: "",
      endTime: "",
      registrationDeadline: "",
      capacity: 50,
      bannerUrl: "",
      status: "PUBLISHED",
    },
  });

  useEffect(() => {
    if (initialEvent) {
      reset({
        title: initialEvent.title,
        description: initialEvent.description,
        category: initialEvent.category,
        venue: initialEvent.venue,
        startTime: toDatetimeLocal(initialEvent.startTime),
        endTime: toDatetimeLocal(initialEvent.endTime),
        registrationDeadline: toDatetimeLocal(initialEvent.registrationDeadline),
        capacity: initialEvent.capacity,
        bannerUrl: initialEvent.bannerUrl || "",
        status: initialEvent.status,
      });
    } else {
      const now = new Date();
      const defaultStart = new Date(now.getTime() + 86400000 * 2); // 2 days ahead
      const defaultEnd = new Date(defaultStart.getTime() + 7200000); // 2 hours duration
      const defaultDeadline = new Date(now.getTime() + 86400000); // 1 day ahead

      reset({
        title: "",
        description: "",
        category: "TECHNICAL",
        venue: "",
        startTime: toDatetimeLocal(defaultStart.toISOString()),
        endTime: toDatetimeLocal(defaultEnd.toISOString()),
        registrationDeadline: toDatetimeLocal(defaultDeadline.toISOString()),
        capacity: 50,
        bannerUrl: "",
        status: "PUBLISHED",
      });
    }
    setServerError(null);
  }, [initialEvent, open, reset]);

  const onSubmit = async (data: EventFormData) => {
    setServerError(null);
    try {
      const payload = {
        ...data,
        startTime: new Date(data.startTime).toISOString(),
        endTime: new Date(data.endTime).toISOString(),
        registrationDeadline: new Date(data.registrationDeadline).toISOString(),
        bannerUrl: data.bannerUrl || undefined,
      };

      if (isEditing && initialEvent) {
        const res = await updateEventApi(initialEvent.id, payload);
        onSuccess(res.data);
      } else {
        const res = await createEventApi({
          ...payload,
          status: data.status === "DRAFT" ? "DRAFT" : "PUBLISHED",
        });
        onSuccess(res.data);
      }
      onClose();
    } catch (err: any) {
      setServerError(err.response?.data?.error?.message || "Failed to save event. Please check your inputs.");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle fontWeight={700}>
        {isEditing ? "Edit Campus Event" : "Create New Campus Event"}
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent dividers sx={{ p: 3 }}>
          {serverError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {serverError}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Event Title"
                placeholder="e.g. Annual Campus AI Hackathon 2026"
                {...register("title")}
                error={!!errors.title}
                helperText={errors.title?.message}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Category"
                defaultValue={initialEvent?.category || "TECHNICAL"}
                {...register("category")}
                error={!!errors.category}
                helperText={errors.category?.message}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Capacity"
                {...register("capacity")}
                error={!!errors.capacity}
                helperText={errors.capacity?.message}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Venue / Location"
                placeholder="e.g. Engineering Building, Room 402 or Main Auditorium"
                {...register("venue")}
                error={!!errors.venue}
                helperText={errors.venue?.message}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Start Time"
                InputLabelProps={{ shrink: true }}
                {...register("startTime")}
                error={!!errors.startTime}
                helperText={errors.startTime?.message}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="datetime-local"
                label="End Time"
                InputLabelProps={{ shrink: true }}
                {...register("endTime")}
                error={!!errors.endTime}
                helperText={errors.endTime?.message}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Registration Deadline"
                InputLabelProps={{ shrink: true }}
                {...register("registrationDeadline")}
                error={!!errors.registrationDeadline}
                helperText={errors.registrationDeadline?.message}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Banner Image URL (optional)"
                placeholder="https://example.com/banner.jpg"
                {...register("bannerUrl")}
                error={!!errors.bannerUrl}
                helperText={errors.bannerUrl?.message}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Event Description"
                placeholder="Provide a comprehensive agenda, rules, speaker lineup, or requirements for attendees..."
                {...register("description")}
                error={!!errors.description}
                helperText={errors.description?.message}
              />
            </Grid>

            {isEditing && (
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Status"
                  defaultValue={initialEvent?.status || "PUBLISHED"}
                  {...register("status")}
                >
                  <MenuItem value="PUBLISHED">Published</MenuItem>
                  <MenuItem value="DRAFT">Draft</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
                  <MenuItem value="COMPLETED">Completed</MenuItem>
                </TextField>
              </Grid>
            )}
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={onClose} color="inherit" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            sx={{ minWidth: 120 }}
          >
            {isSubmitting ? <CircularProgress size={20} color="inherit" /> : isEditing ? "Save Changes" : "Publish Event"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};
