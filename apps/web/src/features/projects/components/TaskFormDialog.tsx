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
import { CheckSquare } from "lucide-react";
import type {
  ProjectTask,
  ProjectMember,
  CreateTaskPayload,
  UpdateTaskPayload,
  TaskPriority,
  TaskStatus,
} from "../projects.api.js";

const taskSchema = z.object({
  title: z.string().min(3, "Task title must be at least 3 characters").max(200),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormDialogProps {
  open: boolean;
  task?: ProjectTask | null;
  members: ProjectMember[];
  initialStatus?: TaskStatus;
  onClose: () => void;
  onSubmit: (data: CreateTaskPayload | UpdateTaskPayload) => Promise<void>;
}

export const TaskFormDialog: React.FC<TaskFormDialogProps> = ({
  open,
  task,
  members,
  initialStatus = "TODO",
  onClose,
  onSubmit,
}) => {
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "MEDIUM",
      status: initialStatus,
      assigneeId: "",
      dueDate: "",
    },
  });

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description || "",
        priority: task.priority,
        status: task.status,
        assigneeId: task.assigneeId || "",
        dueDate: task.dueDate ? task.dueDate.substring(0, 10) : "",
      });
    } else {
      reset({
        title: "",
        description: "",
        priority: "MEDIUM",
        status: initialStatus,
        assigneeId: "",
        dueDate: "",
      });
    }
    setServerError(null);
  }, [task, initialStatus, reset, open]);

  const onFormSubmit = async (data: TaskFormData) => {
    try {
      setServerError(null);
      await onSubmit({
        title: data.title,
        description: data.description || undefined,
        priority: data.priority as TaskPriority,
        status: data.status as TaskStatus,
        assigneeId: data.assigneeId || null,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
      });
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || "Failed to save task";
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
            <CheckSquare size={20} />
          </Box>
          <Typography variant="h6" fontWeight={700}>
            {task ? "Edit Task" : "Create New Task"}
          </Typography>
        </DialogTitle>

        <DialogContent dividers sx={{ py: 3 }}>
          {serverError && (
            <Alert severity="error" sx={{ mb: 2.5 }}>
              {serverError}
            </Alert>
          )}

          <Grid container spacing={2.5}>
            {/* Title */}
            <Grid item xs={12}>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Task Title"
                    fullWidth
                    required
                    error={Boolean(errors.title)}
                    helperText={errors.title?.message}
                    placeholder="e.g. Implement OAuth2 login flow"
                  />
                )}
              />
            </Grid>

            {/* Status and Priority */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Column / Status"
                    fullWidth
                    required
                    error={Boolean(errors.status)}
                  >
                    <MenuItem value="TODO">To Do</MenuItem>
                    <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                    <MenuItem value="IN_REVIEW">In Review</MenuItem>
                    <MenuItem value="DONE">Done</MenuItem>
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Priority"
                    fullWidth
                    required
                    error={Boolean(errors.priority)}
                  >
                    <MenuItem value="LOW">Low</MenuItem>
                    <MenuItem value="MEDIUM">Medium</MenuItem>
                    <MenuItem value="HIGH">High</MenuItem>
                    <MenuItem value="URGENT">Urgent</MenuItem>
                  </TextField>
                )}
              />
            </Grid>

            {/* Assignee */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="assigneeId"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Assignee"
                    fullWidth
                    error={Boolean(errors.assigneeId)}
                    helperText={errors.assigneeId?.message}
                  >
                    <MenuItem value="">Unassigned</MenuItem>
                    {members.map((m) => (
                      <MenuItem key={m.user.id} value={m.user.id}>
                        {m.user.name} ({m.role})
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            {/* Due Date */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="dueDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Due Date"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={Boolean(errors.dueDate)}
                  />
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
                    label="Task Details & Acceptance Criteria (Optional)"
                    multiline
                    rows={3}
                    fullWidth
                    error={Boolean(errors.description)}
                    placeholder="Describe implementation details, dependencies, or links."
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
            {isSubmitting ? "Saving..." : task ? "Update Task" : "Add Task"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
