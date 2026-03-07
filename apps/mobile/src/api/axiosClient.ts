import axios from "axios";
import { supabase } from "../../lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_CONFIG } from "../config/apiConfig";

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

// In-memory session cache to avoid redundant supabase.auth.getSession() calls
let cachedToken: string | null = null;
let cachedTokenExpiry = 0;
const TOKEN_CACHE_TTL = 50 * 1000; // 50 seconds

// In-memory role cache to avoid AsyncStorage reads on every request
let cachedRole: string | null = null;
let cachedRoleExpiry = 0;
const ROLE_CACHE_TTL = 30 * 1000; // 30 seconds

axiosClient.interceptors.request.use(async (config) => {
  const now = Date.now();

  // Use cached token if fresh
  if (cachedToken && now < cachedTokenExpiry) {
    config.headers.Authorization = `Bearer ${cachedToken}`;
  } else {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      cachedToken = session.access_token;
      cachedTokenExpiry = now + TOKEN_CACHE_TTL;
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  }

  // Disable HTTP caching for GET requests so profile/dashboard data is always fresh
  if (!config.method || config.method.toLowerCase() === "get") {
    config.headers["Cache-Control"] = "no-cache";
    config.headers["Pragma"] = "no-cache";
  }

  // Use cached role if fresh
  if (cachedRole && now < cachedRoleExpiry) {
    config.headers["X-User-Role"] = cachedRole;
  } else {
    try {
      const currentRole = await AsyncStorage.getItem("userRole");
      if (currentRole) {
        cachedRole = currentRole;
        cachedRoleExpiry = now + ROLE_CACHE_TTL;
        config.headers["X-User-Role"] = currentRole;
      }
    } catch (error) {
      console.log("Failed to get role from AsyncStorage:", error);
    }
  }

  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
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
