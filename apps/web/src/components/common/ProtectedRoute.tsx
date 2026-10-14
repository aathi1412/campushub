import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useAuth } from "../../features/auth/AuthContext.js";
import type { UserRole } from "../../features/auth/auth.api.js";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: 2 }}>
        <CircularProgress size={32} color="primary" />
        <Typography variant="body2" color="text.secondary">
          Checking campus authentication session...
        </Typography>
      </Box>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h5" color="error" gutterBottom fontWeight={700}>
          Access Restricted
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Your current account role ({user.role}) is not authorized to access this section.
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
};
