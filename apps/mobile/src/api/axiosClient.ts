import axios from "axios";
import { supabase } from '../../lib/supabase';

// Use your LAN IP for development — update if your IP changes
const LAN_IP = '192.168.1.105';

const axiosClient = axios.create({
  baseURL: `http://${LAN_IP}:3000/api`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

axiosClient.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.log("Unauthorized access - token may be expired");
    }
    return Promise.reject(error);
  },
);

export default axiosClient;
