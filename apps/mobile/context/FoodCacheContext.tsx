import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { AppState, AppStateStatus } from "react-native";
import axiosClient from "../src/api/axiosClient";
import { API_ENDPOINTS } from "../src/api/endpoints";
import { useNetwork } from "./NetworkContext";
import { cacheData, getCachedDataAnyAge, CACHE_KEYS, cacheImage } from "../src/utils/dataCache";

export type Distribution = {
  disID: string;
  donorID: string;
  recipientID: string | null;
  locID: string;
  foodID: string;
  quantity: number;
  status: string;
  photoProof: string | null;
  scheduledTime: string;
  actualTime: string | null;
  timestamp: string;
  /** Distance in km from user's current location (set by server when lat/lng provided) */
  distanceKm: number | null;
  food: {
    foodID: string;
    foodName: string;
    description: string | null;
    ingredients: string | null;
    image: string | null;
    quantity: number;
    dateCooked: string;
  } | null;
  location: {
    locID: string;
    streetAddress: string;
    barangay: string;
    latitude: number;
    longitude: number;
  } | null;
  donor: {
    userID: string;
    firstName: string;
    lastName: string;
    orgName: string | null;
    averageRating: number;
    ratingCount: number;
  } | null;
};

interface FoodCacheContextType {
  distributions: Distribution[];
  loading: boolean;
  error: string | null;
  fetchDistributions: (
    forceRefresh?: boolean,
    lat?: number,
    lng?: number,
  ) => Promise<void>;
  invalidateCache: () => void;
  isCached: boolean;
}

const FoodCacheContext = createContext<FoodCacheContextType | undefined>(
  undefined,
);

const AUTO_REFRESH_MS = 2 * 60 * 1000; // 2 minutes

export function FoodCacheProvider({ children }: { children: ReactNode }) {
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const lastLocationRef = useRef<{ lat: number; lng: number } | null>(null);
  const { isOnline, justReconnected } = useNetwork();

  // Load from offline cache initially
  useEffect(() => {
    const loadCache = async () => {
      const cached = await getCachedDataAnyAge<Distribution[]>(CACHE_KEYS.FOOD_BROWSE_LIST);
      if (cached && !isCached) {
        setDistributions(cached);
        setIsCached(true);
      }
    };
    loadCache();
  }, []);

  const fetchDistributions = useCallback(
    async (forceRefresh: boolean = false, lat?: number, lng?: number) => {
      // If data is already cached and not forcing refresh, skip fetch
      if (isCached && !forceRefresh) {
        return;
      }

      if (!isOnline) {
         return; // Don't try to fetch if offline, rely on cache
      }

      setLoading(true);
      setError(null);

      try {
        // Build query params for location-based sorting
        const params: Record<string, string> = {};
        if (lat !== undefined && lng !== undefined) {
          params.lat = lat.toString();
          params.lng = lng.toString();
          lastLocationRef.current = { lat, lng };
        }

        const response = await axiosClient.get(
          API_ENDPOINTS.DISTRIBUTION.GET_AVAILABLE,
          { params },
        );
        let data = response.data?.distributions ?? [];
        
        // Asynchronously cache food images for offline viewing
        data = await Promise.all(data.map(async (dist: Distribution) => {
          if (dist.food?.image) {
            const cachedImage = await cacheImage(dist.food.image);
            if (cachedImage) {
              return { ...dist, food: { ...dist.food, image: cachedImage } };
            }
          }
          return dist;
        }));

        setDistributions(data);
        setIsCached(true);
        // Save to offline storage
        await cacheData(CACHE_KEYS.FOOD_BROWSE_LIST, data);
      } catch (err: any) {
        console.error("Failed to fetch distributions:", err);
        setError(
          err?.response?.data?.message ?? "Failed to load available food.",
        );
      } finally {
        setLoading(false);
      }
    },
    [isCached, isOnline],
  );

  const invalidateCache = useCallback(() => {
    setIsCached(false);
    setDistributions([]);
  }, []);

  // Auto-refresh every 2 minutes to keep data in sync with server (only if online)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isCached || !isOnline) return; // Don't auto-refresh if never fetched or offline
      const loc = lastLocationRef.current;
      fetchDistributions(true, loc?.lat, loc?.lng);
    }, AUTO_REFRESH_MS);

    return () => clearInterval(interval);
  }, [isCached, isOnline, fetchDistributions]);

  // Handle reconnect auto-refresh
  useEffect(() => {
    if (justReconnected) {
      const loc = lastLocationRef.current;
      fetchDistributions(true, loc?.lat, loc?.lng);
    }
  }, [justReconnected, fetchDistributions]);

  // Also refresh when app comes back to foreground
  useEffect(() => {
    const handleAppState = (state: AppStateStatus) => {
      if (state === "active" && isCached && isOnline) {
        const loc = lastLocationRef.current;
        fetchDistributions(true, loc?.lat, loc?.lng);
      }
    };
    const sub = AppState.addEventListener("change", handleAppState);
    return () => sub.remove();
  }, [isCached, isOnline, fetchDistributions]);

  return (
    <FoodCacheContext.Provider
      value={{
        distributions,
        loading,
        error,
        fetchDistributions,
        invalidateCache,
        isCached,
      }}>
      {children}
    </FoodCacheContext.Provider>
  );
}

export function useFoodCache() {
  const context = useContext(FoodCacheContext);
  if (!context) {
    throw new Error("useFoodCache must be used within a FoodCacheProvider");
  }
  return context;
}
