import axios from "axios";
import { Platform } from "react-native";

const LAN_IP = "10.142.135.110"; // Same as lib/api.ts — update if IP changes

const axiosClient = axios.create({
  baseURL: `http://${LAN_IP}:3000/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosClient;
