import React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  Button,
  Stack,
} from "@mui/material";
import {
  Users,
  CheckSquare,
  ArrowRight,
  Globe,
  Lock,
  Building,
  Github,
} from "lucide-react";
import type { Project } from "../projects.api.js";

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const techList = project.technologies
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "success";
      case "IN_PROGRESS":
        return "primary";
      case "PLANNING":
        return "warning";
      case "ARCHIVED":
        return "default";
      default:
        return "primary";
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case "PUBLIC":
        return <Globe size={13} />;
      case "PRIVATE":
        return <Lock size={13} />;
      case "CAMPUS_ONLY":
      default:
        return <Building size={13} />;
    }
  };

  return (
    <Card
      elevation={1}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: 4,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", p: 3 }}>
        {/* Top Badges Row */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Chip
              icon={getVisibilityIcon(project.visibility)}
              label={
                project.visibility === "CAMPUS_ONLY"
                  ? "Campus Only"
                  : project.visibility === "PUBLIC"
                  ? "Public"
                  : "Private"
              }
              size="small"
              variant="outlined"
              sx={{ fontWeight: 600, fontSize: "0.7rem", height: 24 }}
            />
            <Chip
              label={project.status.replace("_", " ")}
              size="small"
              color={getStatusColor(project.status) as any}
              sx={{ fontWeight: 700, fontSize: "0.7rem", height: 24 }}
            />
          </Box>

          {project.userRole && (
            <Chip
              label={project.userRole}
              size="small"
              color={project.userRole === "OWNER" ? "secondary" : "default"}
              sx={{ fontWeight: 700, fontSize: "0.68rem", height: 22 }}
            />
          )}
        </Box>

        {/* Title */}
        <Typography
          variant="h6"
          fontWeight={700}
          component={RouterLink}
          to={`/projects/${project.id}`}
          sx={{
            textDecoration: "none",
            color: "text.primary",
            mb: 1,
            lineHeight: 1.3,
            "&:hover": { color: "primary.main" },
          }}
        >
          {project.title}
        </Typography>

        {/* Description */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            lineHeight: 1.5,
          }}
        >
          {project.description}
        </Typography>

        {/* Tech Stack Pills */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 3 }}>
          {techList.slice(0, 4).map((tech) => (
            <Chip
              key={tech}
              label={tech}
              size="small"
              sx={{
                bgcolor: "grey.100",
                color: "text.secondary",
                fontSize: "0.72rem",
                fontWeight: 600,
                height: 22,
              }}
            />
          ))}
          {techList.length > 4 && (
            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center", ml: 0.5 }}>
              +{techList.length - 4} more
            </Typography>
          )}
        </Box>

        {/* Owner Info & Stats */}
        <Box sx={{ mt: "auto", pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <Avatar
                src={project.owner.avatarUrl || undefined}
                sx={{ width: 28, height: 28, fontSize: "0.75rem", bgcolor: "primary.main" }}
              >
                {project.owner.name.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="caption" fontWeight={600} color="text.primary">
                {project.owner.name}
              </Typography>
            </Box>

            <Stack direction="row" spacing={2} color="text.secondary">
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Users size={14} />
                <Typography variant="caption" fontWeight={600}>
                  {project.memberCount}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <CheckSquare size={14} />
                <Typography variant="caption" fontWeight={600}>
                  {project.taskCount}
                </Typography>
              </Box>
              {project.repoUrl && (
                <Box
                  component="a"
                  href={project.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  sx={{ color: "text.secondary", "&:hover": { color: "primary.main" } }}
                >
                  <Github size={14} />
                </Box>
              )}
            </Stack>
          </Box>

          <Button
            component={RouterLink}
            to={`/projects/${project.id}`}
            variant="outlined"
            size="small"
            fullWidth
            endIcon={<ArrowRight size={15} />}
            sx={{ fontWeight: 600, borderRadius: 2 }}
          >
            Open Project Workspace
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};
