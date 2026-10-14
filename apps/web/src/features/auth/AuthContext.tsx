import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type {
  UserProfile,
  LoginPayload,
  RegisterPayload,
  UpdateProfilePayload,
} from "./auth.api.js";
import {
  loginApi,
  registerApi,
  logoutApi,
  refreshApi,
  getMeApi,
  updateProfileApi,
} from "./auth.api.js";

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<UserProfile>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Silent session restore on app load via HttpOnly cookie
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const res = await refreshApi();
        if (isMounted) {
          setUser(res.data.user);
        }
      } catch {
        // No active refresh session, user remains unauthenticated
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credentials: LoginPayload) => {
    setIsLoading(true);
    try {
      const res = await loginApi(credentials);
      setUser(res.data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    setIsLoading(true);
    try {
      await registerApi(payload);
      // Auto login after registration
      const loginRes = await loginApi({ email: payload.email, password: payload.password });
      setUser(loginRes.data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await logoutApi();
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  };

  const updateProfile = async (payload: UpdateProfilePayload) => {
    const res = await updateProfileApi(payload);
    setUser(res.data);
    return res.data;
  };

  const refreshUser = useCallback(async () => {
    try {
      const res = await getMeApi();
      setUser(res.data);
    } catch {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
