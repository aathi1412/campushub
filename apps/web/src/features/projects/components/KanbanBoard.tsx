import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Button,
  Avatar,
  Stack,
  Tooltip,
  Menu,
  MenuItem,
  Grid,
} from "@mui/material";
import {
  Plus,
  MoreVertical,
  Calendar,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Trash2,
  Edit,
} from "lucide-react";
import type {
  ProjectTask,
  ProjectMember,
  TaskStatus,
  TaskPriority,
} from "../projects.api.js";

interface KanbanBoardProps {
  tasks: ProjectTask[];
  members: ProjectMember[];
  canEdit: boolean;
  onAddTask: (status: TaskStatus) => void;
  onEditTask: (task: ProjectTask) => void;
  onUpdateTaskStatus: (task: ProjectTask, newStatus: TaskStatus) => void;
  onDeleteTask: (task: ProjectTask) => void;
}

const COLUMNS: { id: TaskStatus; label: string; color: string; bgColor: string }[] = [
  { id: "TODO", label: "To Do", color: "text.primary", bgColor: "grey.50" },
  { id: "IN_PROGRESS", label: "In Progress", color: "primary.main", bgColor: "primary.50" },
  { id: "IN_REVIEW", label: "In Review", color: "warning.main", bgColor: "warning.50" },
  { id: "DONE", label: "Done", color: "success.main", bgColor: "success.50" },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  canEdit,
  onAddTask,
  onEditTask,
  onUpdateTaskStatus,
  onDeleteTask,
}) => {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [activeTask, setActiveTask] = useState<ProjectTask | null>(null);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, task: ProjectTask) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
    setActiveTask(task);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setActiveTask(null);
  };

  const getPriorityChip = (priority: TaskPriority) => {
    switch (priority) {
      case "URGENT":
        return <Chip label="Urgent" size="small" color="error" sx={{ fontWeight: 700, height: 20, fontSize: "0.65rem" }} />;
      case "HIGH":
        return <Chip label="High" size="small" color="warning" sx={{ fontWeight: 700, height: 20, fontSize: "0.65rem" }} />;
      case "MEDIUM":
        return <Chip label="Medium" size="small" color="primary" sx={{ fontWeight: 600, height: 20, fontSize: "0.65rem" }} />;
      case "LOW":
      default:
        return <Chip label="Low" size="small" sx={{ fontWeight: 600, height: 20, fontSize: "0.65rem" }} />;
    }
  };

  const getNextStatus = (current: TaskStatus): TaskStatus | null => {
    if (current === "TODO") return "IN_PROGRESS";
    if (current === "IN_PROGRESS") return "IN_REVIEW";
    if (current === "IN_REVIEW") return "DONE";
    return null;
  };

  const getPrevStatus = (current: TaskStatus): TaskStatus | null => {
    if (current === "DONE") return "IN_REVIEW";
    if (current === "IN_REVIEW") return "IN_PROGRESS";
    if (current === "IN_PROGRESS") return "TODO";
    return null;
  };

  return (
    <Box sx={{ overflowX: "auto", pb: 2 }}>
      <Grid container spacing={2.5} sx={{ minWidth: 900 }}>
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);

          return (
            <Grid item xs={3} key={col.id}>
              <Box
                sx={{
                  bgcolor: col.bgColor,
                  borderRadius: 3,
                  p: 2,
                  minHeight: 520,
                  display: "flex",
                  flexDirection: "column",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                {/* Column Header */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                    px: 0.5,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="subtitle2" fontWeight={700} color={col.color}>
                      {col.label}
                    </Typography>
                    <Chip
                      label={colTasks.length}
                      size="small"
                      sx={{ fontWeight: 700, height: 20, fontSize: "0.7rem", bgcolor: "background.paper" }}
                    />
                  </Box>

                  {canEdit && (
                    <IconButton size="small" onClick={() => onAddTask(col.id)} sx={{ p: 0.5 }}>
                      <Plus size={16} />
                    </IconButton>
                  )}
                </Box>

                {/* Task Cards */}
                <Stack spacing={1.5} sx={{ flexGrow: 1 }}>
                  {colTasks.length === 0 ? (
                    <Box
                      sx={{
                        textAlign: "center",
                        py: 5,
                        color: "text.secondary",
                        border: "1px dashed",
                        borderColor: "divider",
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="caption">No tasks in {col.label}</Typography>
                    </Box>
                  ) : (
                    colTasks.map((task) => {
                      const next = getNextStatus(task.status);
                      const prev = getPrevStatus(task.status);
                      const isDone = task.status === "DONE";

                      return (
                        <Card
                          key={task.id}
                          elevation={1}
                          sx={{
                            borderRadius: 2.5,
                            border: "1px solid",
                            borderColor: isDone ? "success.200" : "divider",
                            bgcolor: "background.paper",
                            transition: "box-shadow 0.2s, transform 0.2s",
                            "&:hover": {
                              boxShadow: 3,
                              transform: "translateY(-2px)",
                            },
                          }}
                        >
                          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                            {/* Card Top: Priority & Menu */}
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                              {getPriorityChip(task.priority)}

                              {canEdit && (
                                <IconButton
                                  size="small"
                                  onClick={(e) => handleMenuOpen(e, task)}
                                  sx={{ p: 0.25, color: "text.secondary" }}
                                >
                                  <MoreVertical size={15} />
                                </IconButton>
                              )}
                            </Box>

                            {/* Title */}
                            <Typography
                              variant="subtitle2"
                              fontWeight={700}
                              sx={{
                                mb: 1,
                                lineHeight: 1.4,
                                textDecoration: isDone ? "line-through" : "none",
                                color: isDone ? "text.secondary" : "text.primary",
                              }}
                            >
                              {task.title}
                            </Typography>

                            {/* Description preview */}
                            {task.description && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                  mb: 1.5,
                                  lineHeight: 1.4,
                                }}
                              >
                                {task.description}
                              </Typography>
                            )}

                            {/* Due Date & Assignee */}
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                mt: 1.5,
                                pt: 1,
                                borderTop: "1px solid",
                                borderColor: "divider",
                              }}
                            >
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.secondary" }}>
                                {task.dueDate ? (
                                  <>
                                    <Calendar size={13} />
                                    <Typography variant="caption" sx={{ fontSize: "0.7rem", fontWeight: 600 }}>
                                      {new Date(task.dueDate).toLocaleDateString([], { month: "short", day: "numeric" })}
                                    </Typography>
                                  </>
                                ) : (
                                  <Typography variant="caption" sx={{ fontSize: "0.7rem" }}>
                                    No due date
                                  </Typography>
                                )}
                              </Box>

                              {task.assignee ? (
                                <Tooltip title={`Assigned to ${task.assignee.name}`}>
                                  <Avatar
                                    src={task.assignee.avatarUrl || undefined}
                                    sx={{ width: 24, height: 24, fontSize: "0.7rem", bgcolor: "primary.main" }}
                                  >
                                    {task.assignee.name.charAt(0).toUpperCase()}
                                  </Avatar>
                                </Tooltip>
                              ) : (
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                                  Unassigned
                                </Typography>
                              )}
                            </Box>

                            {/* Quick Move Controls */}
                            {canEdit && (
                              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1.5, pt: 0.5 }}>
                                {prev ? (
                                  <Tooltip title={`Move to ${prev.replace("_", " ")}`}>
                                    <Button
                                      size="small"
                                      variant="text"
                                      startIcon={<ArrowLeft size={12} />}
                                      onClick={() => onUpdateTaskStatus(task, prev)}
                                      sx={{ fontSize: "0.68rem", p: 0.25, minWidth: 0, textTransform: "none" }}
                                    >
                                      Back
                                    </Button>
                                  </Tooltip>
                                ) : <Box />}

                                {next ? (
                                  <Tooltip title={`Move to ${next.replace("_", " ")}`}>
                                    <Button
                                      size="small"
                                      variant="text"
                                      color="primary"
                                      endIcon={<ArrowRight size={12} />}
                                      onClick={() => onUpdateTaskStatus(task, next)}
                                      sx={{ fontSize: "0.68rem", p: 0.25, minWidth: 0, textTransform: "none", fontWeight: 700 }}
                                    >
                                      {next === "DONE" ? "Complete" : "Advance"}
                                    </Button>
                                  </Tooltip>
                                ) : (
                                  <Chip
                                    icon={<CheckCircle2 size={12} />}
                                    label="Done"
                                    color="success"
                                    size="small"
                                    sx={{ height: 20, fontSize: "0.65rem", fontWeight: 700 }}
                                  />
                                )}
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </Stack>
              </Box>
            </Grid>
          );
        })}
      </Grid>

      {/* Task Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{ sx: { minWidth: 140, borderRadius: 2 } }}
      >
        <MenuItem
          onClick={() => {
            if (activeTask) onEditTask(activeTask);
            handleMenuClose();
          }}
          sx={{ gap: 1, fontSize: "0.85rem" }}
        >
          <Edit size={14} />
          Edit Task
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (activeTask) onDeleteTask(activeTask);
            handleMenuClose();
          }}
          sx={{ gap: 1, fontSize: "0.85rem", color: "error.main" }}
        >
          <Trash2 size={14} />
          Delete Task
        </MenuItem>
      </Menu>
    </Box>
  );
};
