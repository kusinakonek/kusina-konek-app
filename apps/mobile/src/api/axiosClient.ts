import axios from "axios";
import { supabase } from "../../lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_CONFIG } from "../config/apiConfig";
import { DeviceEventEmitter } from "react-native";

const axiosClient = axios.create({
  ...API_CONFIG,
  headers: {
    "Content-Type": "application/json",
  },
});

// Flag to prevent multiple concurrent refresh attempts
let isRefreshing = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// Add metadata typing
declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    metadata?: { startTime: number };
    _retry?: boolean;
  }
}

// Request interceptor: add auth token and role, start timer
axiosClient.interceptors.request.use(async (config) => {
  // Start timer for slow connection detection
  config.metadata = { startTime: Date.now() };

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }

  // Disable HTTP caching for GET requests so profile/dashboard data is always fresh
  if (!config.method || config.method.toLowerCase() === "get") {
    config.headers["Cache-Control"] = "no-cache";
    config.headers["Pragma"] = "no-cache";
  }

  // Add current role from AsyncStorage to headers
  // This allows the backend to use the current role instead of the JWT metadata role
  try {
    const currentRole = await AsyncStorage.getItem("userRole");
    if (currentRole) {
      config.headers["X-User-Role"] = currentRole;
    }
  } catch (error) {
    console.log("Failed to get role from AsyncStorage:", error);
  }

  return config;
});

// Response interceptor: check duration and handle 401s
axiosClient.interceptors.response.use(
  (response) => {
    // Check response time
    if (response.config.metadata?.startTime) {
      const duration = Date.now() - response.config.metadata.startTime;
      if (duration > 3000) {
        DeviceEventEmitter.emit('network:slow');
        console.warn(`[Axios] Slow API call (${duration}ms): ${response.config.url}`);
      } else {
        DeviceEventEmitter.emit('network:fast');
      }
    }
    return response;
  },
  async (error) => {
    // If it timed out or took a long time, emit slow event
    if (error.config?.metadata?.startTime) {
      const duration = Date.now() - error.config.metadata.startTime;
      if (duration > 3000 || error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        DeviceEventEmitter.emit('network:slow');
      }
    }

    const originalRequest = error.config;

    // If 401 and we haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request until the refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(axiosClient(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try refreshing the Supabase session
        const { data, error: refreshError } =
          await supabase.auth.refreshSession();

        if (refreshError || !data.session) {
          processQueue(
            refreshError || new Error("Session refresh failed"),
            null,
          );
          isRefreshing = false;
          return Promise.reject(error);
        }

        const newToken = data.session.access_token;
        processQueue(null, newToken);
        isRefreshing = false;

        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        isRefreshing = false;
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  },
);

export default axiosClient;
