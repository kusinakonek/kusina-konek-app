import { Platform } from "react-native";

/**
 * Auto-detects the API base URL based on the environment
 *
 * For development:
 * - Android Emulator: Uses 10.0.2.2 (special alias for host machine)
 * - iOS Simulator: Uses localhost
 * - Physical Device: Uses LAN IP from environment variable or falls back to a default
 *
 * For production: Uses the production API URL
 */

// Default fallback IP - team members should set EXPO_PUBLIC_API_HOST in their .env file
const DEFAULT_LAN_IP = "10.142.135.110";

const getApiHost = (): string => {
  // Check for environment variable first (best practice for team)
  const envApiHost = process.env.EXPO_PUBLIC_API_HOST;
  if (envApiHost) {
    return envApiHost;
  }

  // Auto-detect based on platform in development
  if (__DEV__) {
    if (Platform.OS === "android") {
      // Check if running on emulator or physical device
      // Android emulator uses 10.0.2.2 to access host machine's localhost
      // Physical devices need the LAN IP
      return DEFAULT_LAN_IP; // Change this if you know it's an emulator: '10.0.2.2'
    } else if (Platform.OS === "ios") {
      // iOS simulator can use localhost
      return "localhost";
    }
  }

  // Production or web
  return process.env.EXPO_PUBLIC_API_URL || "https://your-production-api.com";
};

const getApiPort = (): string => {
  return process.env.EXPO_PUBLIC_API_PORT || "3000";
};

export const getApiBaseUrl = (): string => {
  const host = getApiHost();
  const port = getApiPort();

  // If host already includes protocol and port, use it as is
  if (host.startsWith("http://") || host.startsWith("https://")) {
    return host;
  }

  return `http://${host}:${port}/api`;
};

export const API_CONFIG = {
  baseURL: getApiBaseUrl(),
  timeout: 30000,
};
