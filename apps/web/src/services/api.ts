import axios from "axios";
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import type { ApiErrorResponse, SystemHealthData, ApiResponse } from "../types/api.js";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Centralized access token memory holder (avoid storing raw JWT tokens in localStorage)
let memoryAccessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  memoryAccessToken = token;
};

export const getAccessToken = () => memoryAccessToken;

// Request Interceptor: Attach bearer token if present in memory
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (memoryAccessToken && config.headers) {
      config.headers.Authorization = `Bearer ${memoryAccessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Centralized error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    // Handled response or network failure
    return Promise.reject(error);
  }
);

// System Health API function
export async function getSystemHealth(): Promise<ApiResponse<SystemHealthData>> {
  const response = await apiClient.get<ApiResponse<SystemHealthData>>("/health");
  return response.data;
}
