import axios from 'axios';
import { Platform } from 'react-native';

const LAN_IP = '192.168.254.148'; // Same as lib/api.ts — update if your IP changes

import { supabase } from '../../lib/supabase';

const axiosClient = axios.create({
  baseURL: `http://${LAN_IP}:3000/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

export default axiosClient;