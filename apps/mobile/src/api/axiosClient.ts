import axios from "axios";
import { supabase } from "../../lib/supabase";
import { API_CONFIG } from "../config/apiConfig";
import {
  getRuntimeAccessToken,
  getRuntimeRole,
} from "../state/authRuntime";

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

axiosClient.interceptors.request.use(async (config) => {
  const runtimeToken = getRuntimeAccessToken();

  if (runtimeToken) {
    config.headers.Authorization = `Bearer ${runtimeToken}`;
  } else {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  }

  // Keep read requests responsive on unstable networks.
  if (!config.method || config.method.toLowerCase() === "get") {
    config.timeout = Math.min(config.timeout ?? 25000, 25000);
  }

  const currentRole = getRuntimeRole();
  if (currentRole) {
    config.headers["X-User-Role"] = currentRole;
  }

  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const method = originalRequest?.method?.toLowerCase?.() || "get";
    const isTimeoutError =
      error?.code === "ECONNABORTED" ||
      String(error?.message || "").toLowerCase().includes("timeout");
    const isNetworkError = !error?.response && !!error?.request;

    // Retry idempotent reads once on network timeout/transport failures.
    if (
      originalRequest &&
      method === "get" &&
      !originalRequest._networkRetry &&
      (isTimeoutError || isNetworkError)
    ) {
      originalRequest._networkRetry = true;
      await new Promise((resolve) => setTimeout(resolve, 500));
      return axiosClient(originalRequest);
    }

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
