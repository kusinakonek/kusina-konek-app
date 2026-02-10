import axios from "axios";
import { supabase } from '../../lib/supabase';

// Use your LAN IP for development — update if your IP changes
const LAN_IP = '178.16.101.110';

const axiosClient = axios.create({
  baseURL: `http://${LAN_IP}:3000/api`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Flag to prevent multiple concurrent refresh attempts
let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (error: any) => void }[] = [];

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
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
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
        const { data, error: refreshError } = await supabase.auth.refreshSession();

        if (refreshError || !data.session) {
          processQueue(refreshError || new Error('Session refresh failed'), null);
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
