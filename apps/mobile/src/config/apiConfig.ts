import { Platform } from "react-native";
import Constants from "expo-constants";

/**
 * API Configuration — Auto-Detects Backend URL
 *
 * In DEVELOPMENT:
 *   The backend runs on the SAME machine as the Expo dev server.
 *   We grab the machine's IP directly from Expo's connection info,
 *   so NO manual IP configuration is needed by any team member.
 *
 *   Just run `npm run dev` (server) + `npx expo start` (mobile) and it works.
 *
 * In PRODUCTION (APK):
 *   Set EXPO_PUBLIC_API_URL to your deployed backend URL.
 */

const API_PORT = process.env.EXPO_PUBLIC_API_PORT || "3000";

/**
 * Extract the host machine's IP from Expo's dev server connection.
 * Expo already knows the IP because it serves the JS bundle over it.
 * Since the backend runs on the same machine, we reuse that IP.
 */
const getDevHostIp = (): string | null => {
  try {
    // Expo SDK 50+: debuggerHost is "ip:port" (e.g. "192.168.1.12:8081")
    const debuggerHost =
      Constants.expoConfig?.hostUri ?? (Constants as any).manifest?.debuggerHost;

    if (debuggerHost) {
      const host = debuggerHost.split(":")[0];
      if (host && host !== "undefined") {
        return host;
      }
    }
  } catch (e) {
    // Silently fail — will use fallbacks
  }
  return null;
};

const getApiBaseUrl = (): string => {
  // --- PRODUCTION (APK builds) ---
  if (!__DEV__) {
    const prodUrl = process.env.EXPO_PUBLIC_API_URL;
    if (prodUrl) {
      return prodUrl.endsWith("/api") ? prodUrl : `${prodUrl}/api`;
    }
    console.error(
      "⚠️ EXPO_PUBLIC_API_URL is not set! APK cannot connect to backend."
    );
    return "https://your-production-api.com/api";
  }

  // --- DEVELOPMENT ---

  // Priority 1: Explicit env var (if someone sets EXPO_PUBLIC_API_HOST manually)
  const envHost = process.env.EXPO_PUBLIC_API_HOST;
  if (envHost) {
    if (envHost.startsWith("http")) {
      return envHost.endsWith("/api") ? envHost : `${envHost}/api`;
    }
    const url = `http://${envHost}:${API_PORT}/api`;
    console.log(`📡 API URL (from env): ${url}`);
    return url;
  }

  // Priority 2: Auto-detect from Expo's dev server (RECOMMENDED — zero config!)
  const autoHost = getDevHostIp();
  if (autoHost) {
    const url = `http://${autoHost}:${API_PORT}/api`;
    console.log(`📡 API URL (auto-detected): ${url}`);
    return url;
  }

  // Priority 3: Platform-specific fallbacks
  if (Platform.OS === "android") {
    // 10.0.2.2 = emulator alias for host machine's localhost
    console.warn("⚠️ Could not auto-detect IP. Using Android emulator fallback.");
    return `http://10.0.2.2:${API_PORT}/api`;
  }

  // iOS simulator / web
  return `http://localhost:${API_PORT}/api`;
};

export const API_CONFIG = {
  baseURL: getApiBaseUrl(),
  timeout: 30000,
};
