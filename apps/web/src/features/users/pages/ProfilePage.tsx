import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Avatar,
  Chip,
  Divider,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import {
  User,
  Shield,
  Building2,
  Calendar,
  Lock,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext.js";
import { changePasswordApi } from "../../auth/auth.api.js";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  department: z.string().optional(),
  yearOfStudy: z.coerce.number().min(1).max(6).optional(),
  bio: z.string().max(1000).optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters").max(100),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

const departments = [
  "Computer Science & Engineering",
  "Information Technology",
  "Electrical & Electronics Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Business & Management",
  "Arts & Sciences",
  "Other",
];

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, logout } = useAuth();
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Profile Form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: isProfileSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      department: user?.department || "",
      yearOfStudy: user?.yearOfStudy || 1,
      bio: user?.bio || "",
    },
  });

  // Password Form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onUpdateProfile = async (data: ProfileFormData) => {
    setProfileSuccess(null);
    setProfileError(null);
    try {
      await updateProfile({
        name: data.name,
        department: data.department || undefined,
        yearOfStudy: data.yearOfStudy ? Number(data.yearOfStudy) : undefined,
        bio: data.bio || undefined,
      });
      setProfileSuccess("Profile updated successfully!");
    } catch (err: any) {
      setProfileError(err.response?.data?.error?.message || "Failed to update profile.");
    }
  };

  const onChangePassword = async (data: PasswordFormData) => {
    setPasswordSuccess(null);
    setPasswordError(null);
    try {
      await changePasswordApi({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setPasswordSuccess("Password changed successfully. You will need to log in again with your new password.");
      resetPasswordForm();
      setTimeout(async () => {
        await logout();
      }, 2500);
    } catch (err: any) {
      setPasswordError(err.response?.data?.error?.message || "Failed to change password. Please check your current password.");
    }
  };

  if (!user) return null;

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Account & Profile
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your personal information, campus affiliations, and account security
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* User Card */}
        <Grid item xs={12} md={4}>
          <Card elevation={1}>
            <CardContent sx={{ p: 4, textAlign: "center" }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  mx: "auto",
                  mb: 2,
                  bgcolor: "primary.main",
                  fontSize: "2rem",
                  fontWeight: 600,
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </Avatar>

              <Typography variant="h6" fontWeight={700}>
                {user.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {user.email}
              </Typography>

              <Box sx={{ display: "flex", justifyContent: "center", gap: 1, my: 2 }}>
                <Chip
                  icon={<Shield size={14} />}
                  label={user.role}
                  color={user.role === "ADMIN" ? "secondary" : "primary"}
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
                <Chip
                  icon={<CheckCircle2 size={14} />}
                  label={user.status}
                  color={user.status === "ACTIVE" ? "success" : "default"}
                  size="small"
                  variant="outlined"
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ textAlign: "left", spaceY: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, my: 1 }}>
                  <Building2 size={16} className="text-slate-400" />
                  <Typography variant="body2" color="text.secondary">
                    {user.department || "No department listed"}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, my: 1 }}>
                  <Calendar size={16} className="text-slate-400" />
                  <Typography variant="body2" color="text.secondary">
                    {user.yearOfStudy ? `Year ${user.yearOfStudy}` : "Year not specified"}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Profile & Security Forms */}
        <Grid item xs={12} md={8}>
          {/* Edit Profile Section */}
          <Card elevation={1} sx={{ mb: 4 }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                <User size={20} className="text-blue-600" />
                <Typography variant="h6" fontWeight={600}>
                  Profile Information
                </Typography>
              </Box>

              {profileSuccess && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  {profileSuccess}
                </Alert>
              )}
              {profileError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {profileError}
                </Alert>
              )}

              <Box component="form" onSubmit={handleProfileSubmit(onUpdateProfile)} noValidate>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="name"
                      label="Full Name"
                      {...registerProfile("name")}
                      error={!!profileErrors.name}
                      helperText={profileErrors.name?.message}
                    />
                  </Grid>

                  <Grid item xs={12} sm={8}>
                    <TextField
                      select
                      fullWidth
                      id="department"
                      label="Department / Program"
                      defaultValue={user.department || ""}
                      {...registerProfile("department")}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {departments.map((dept) => (
                        <MenuItem key={dept} value={dept}>
                          {dept}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <TextField
                      select
                      fullWidth
                      id="yearOfStudy"
                      label="Year of Study"
                      defaultValue={user.yearOfStudy || 1}
                      {...registerProfile("yearOfStudy")}
                      error={!!profileErrors.yearOfStudy}
                      helperText={profileErrors.yearOfStudy?.message}
                    >
                      {[1, 2, 3, 4, 5, 6].map((yr) => (
                        <MenuItem key={yr} value={yr}>
                          Year {yr}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      id="bio"
                      label="Campus Bio & Interests"
                      placeholder="Tell fellow students and club leaders about your academic interests, skills, or projects..."
                      {...registerProfile("bio")}
                      error={!!profileErrors.bio}
                      helperText={profileErrors.bio?.message}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isProfileSubmitting}
                    sx={{ minWidth: 140, height: 40 }}
                  >
                    {isProfileSubmitting ? <CircularProgress size={20} color="inherit" /> : "Save Changes"}
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Change Password Section */}
          <Card elevation={1}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                <Lock size={20} className="text-amber-600" />
                <Typography variant="h6" fontWeight={600}>
                  Change Password
                </Typography>
              </Box>

              {passwordSuccess && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  {passwordSuccess}
                </Alert>
              )}
              {passwordError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {passwordError}
                </Alert>
              )}

              <Box component="form" onSubmit={handlePasswordSubmit(onChangePassword)} noValidate>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="password"
                      id="currentPassword"
                      label="Current Password"
                      {...registerPassword("currentPassword")}
                      error={!!passwordErrors.currentPassword}
                      helperText={passwordErrors.currentPassword?.message}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="password"
                      id="newPassword"
                      label="New Password (min 8 chars)"
                      {...registerPassword("newPassword")}
                      error={!!passwordErrors.newPassword}
                      helperText={passwordErrors.newPassword?.message}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="password"
                      id="confirmPassword"
                      label="Confirm New Password"
                      {...registerPassword("confirmPassword")}
                      error={!!passwordErrors.confirmPassword}
                      helperText={passwordErrors.confirmPassword?.message}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    type="submit"
                    variant="outlined"
                    color="warning"
                    disabled={isPasswordSubmitting}
                    sx={{ minWidth: 160, height: 40 }}
                  >
                    {isPasswordSubmitting ? <CircularProgress size={20} color="inherit" /> : "Update Password"}
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};
