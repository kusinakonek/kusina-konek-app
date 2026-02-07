import axios from 'axios';
import { Platform } from 'react-native';

const LAN_IP = '192.168.1.105'; // Same as lib/api.ts — update if your IP changes

const axiosClient = axios.create({
  baseURL: `http://${LAN_IP}:4000/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosClient;