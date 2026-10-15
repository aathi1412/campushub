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
import { FolderGit2 } from "lucide-react";
import type {
  Project,
  CreateProjectPayload,
  UpdateProjectPayload,
  ProjectVisibility,
  ProjectStatus,
} from "../projects.api.js";

const projectSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().min(10, "Description must be at least 10 characters"),
  technologies: z.string().min(2, "List at least one technology (e.g. React, Python)"),
  visibility: z.enum(["PUBLIC", "CAMPUS_ONLY", "PRIVATE"]),
  status: z.enum(["PLANNING", "IN_PROGRESS", "COMPLETED", "ARCHIVED"]),
  repoUrl: z.string().url("Please provide a valid URL").or(z.literal("")).optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectFormDialogProps {
  open: boolean;
  project?: Project | null;
  onClose: () => void;
  onSubmit: (data: CreateProjectPayload | UpdateProjectPayload) => Promise<void>;
}

export const ProjectFormDialog: React.FC<ProjectFormDialogProps> = ({
  open,
  project,
  onClose,
  onSubmit,
}) => {
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      description: "",
      technologies: "",
      visibility: "CAMPUS_ONLY",
      status: "IN_PROGRESS",
      repoUrl: "",
    },
  });

  useEffect(() => {
    if (project) {
      reset({
        title: project.title,
        description: project.description,
        technologies: project.technologies,
        visibility: project.visibility,
        status: project.status,
        repoUrl: project.repoUrl || "",
      });
    } else {
      reset({
        title: "",
        description: "",
        technologies: "",
        visibility: "CAMPUS_ONLY",
        status: "IN_PROGRESS",
        repoUrl: "",
      });
    }
    setServerError(null);
  }, [project, reset, open]);

  const onFormSubmit = async (data: ProjectFormData) => {
    try {
      setServerError(null);
      await onSubmit({
        title: data.title,
        description: data.description,
        technologies: data.technologies,
        visibility: data.visibility as ProjectVisibility,
        status: data.status as ProjectStatus,
        repoUrl: data.repoUrl || undefined,
      });
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || "Failed to save project";
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
            <FolderGit2 size={20} />
          </Box>
          <Typography variant="h6" fontWeight={700}>
            {project ? "Edit Project Details" : "Launch a Collaborative Project"}
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
                    label="Project Title"
                    fullWidth
                    required
                    error={Boolean(errors.title)}
                    helperText={errors.title?.message}
                    placeholder="e.g. Smart Campus Navigation App"
                  />
                )}
              />
            </Grid>

            {/* Technologies */}
            <Grid item xs={12}>
              <Controller
                name="technologies"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Technologies & Stack (Comma Separated)"
                    fullWidth
                    required
                    error={Boolean(errors.technologies)}
                    helperText={errors.technologies?.message || "e.g. React, TypeScript, Fastify, Docker, PyTorch"}
                    placeholder="React, TypeScript, Fastify, MySQL"
                  />
                )}
              />
            </Grid>

            {/* Visibility & Status row */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="visibility"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Visibility"
                    fullWidth
                    required
                    error={Boolean(errors.visibility)}
                  >
                    <MenuItem value="CAMPUS_ONLY">Campus Only</MenuItem>
                    <MenuItem value="PUBLIC">Public</MenuItem>
                    <MenuItem value="PRIVATE">Private (Team Only)</MenuItem>
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Project Status"
                    fullWidth
                    required
                    error={Boolean(errors.status)}
                  >
                    <MenuItem value="PLANNING">Planning</MenuItem>
                    <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                    <MenuItem value="COMPLETED">Completed</MenuItem>
                    <MenuItem value="ARCHIVED">Archived</MenuItem>
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
                    label="Description & Objectives"
                    multiline
                    rows={4}
                    fullWidth
                    required
                    error={Boolean(errors.description)}
                    helperText={errors.description?.message || "Explain project scope, architecture, and collaboration needs."}
                  />
                )}
              />
            </Grid>

            {/* Repo URL */}
            <Grid item xs={12}>
              <Controller
                name="repoUrl"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Repository / Code Link (Optional)"
                    fullWidth
                    error={Boolean(errors.repoUrl)}
                    helperText={errors.repoUrl?.message || "e.g. https://github.com/org/repo"}
                    placeholder="https://github.com/username/project"
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
            {isSubmitting ? "Saving..." : project ? "Update Project" : "Create Project"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
