import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import axiosClient from "../src/api/axiosClient";
import { API_ENDPOINTS } from "../src/api/endpoints";

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

export function FoodCacheProvider({ children }: { children: ReactNode }) {
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);

  const fetchDistributions = useCallback(
    async (forceRefresh: boolean = false, lat?: number, lng?: number) => {
      // If data is already cached and not forcing refresh, skip fetch
      if (isCached && !forceRefresh) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Build query params for location-based sorting
        const params: Record<string, string> = {};
        if (lat !== undefined && lng !== undefined) {
          params.lat = lat.toString();
          params.lng = lng.toString();
        }

        const response = await axiosClient.get(
          API_ENDPOINTS.DISTRIBUTION.GET_AVAILABLE,
          { params },
        );
        const data = response.data?.distributions ?? [];
        setDistributions(data);
        setIsCached(true);
      } catch (err: any) {
        console.error("Failed to fetch distributions:", err);
        setError(
          err?.response?.data?.message ?? "Failed to load available food.",
        );
      } finally {
        setLoading(false);
      }
    },
    [isCached],
  );

  const invalidateCache = useCallback(() => {
    setIsCached(false);
    setDistributions([]);
  }, []);

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
