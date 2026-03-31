import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { router } from "expo-router";
import { DeviceEventEmitter } from "react-native";
import axiosClient from "../src/api/axiosClient";
import { API_ENDPOINTS } from "../src/api/endpoints";
import ClaimsConfirmedModal from "../src/components/ClaimsConfirmedModal";
import { useFoodCache } from "./FoodCacheContext";
import { useAlert } from "./AlertContext";

const RESERVATION_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/** A distribution that was locally added to the cart */
export type CartItem = {
  disID: string;
  donorID: string;
  recipientID: string | null;
  locID: string;
  foodID: string;
  quantity: number;
  status: string;
  scheduledTime: string;
  timestamp: string;
  /** Time this item was added to the local cart */
  addedAt: number;
  food: {
    foodID: string;
    foodName: string;
    description: string | null;
    image: string | null;
    quantity: number;
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

interface CartContextType {
  items: CartItem[];
  addItem: (distribution: Omit<CartItem, "addedAt">) => void;
  removeItem: (disID: string) => void;
  clearCart: () => void;
  pickUpAll: () => Promise<void>;
  isPickingUp: boolean;
  /** Milliseconds remaining for the oldest item (drives the 15-min window) */
  getRemainingMs: (disID: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isPickingUp, setIsPickingUp] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [claimedItems, setClaimedItems] = useState<
    { disID: string; foodName: string; location: string }[]
  >([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Access food cache context to invalidate when items are picked up
  const { invalidateCache } = useFoodCache();

  // Access custom alert system for styled, themed alerts
  const { showAlert } = useAlert();

  // Periodically purge expired items (every 30 s)
  useEffect(() => {
    timerRef.current = setInterval(() => {
      const now = Date.now();
      setItems((prev) => {
        const valid = prev.filter(
          (item) => now - item.addedAt < RESERVATION_DURATION_MS,
        );
        if (valid.length !== prev.length) {
          showAlert(
            "Items Expired",
            "Some items were removed from your cart because the 15-minute reservation expired.",
            undefined,
            { type: "warning" },
          );
        }
        return valid;
      });
    }, 30_000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [showAlert]);

  const addItem = useCallback((distribution: Omit<CartItem, "addedAt">) => {
    setItems((prev) => {
      // Don't add duplicates
      if (prev.some((i) => i.disID === distribution.disID)) return prev;
      return [...prev, { ...distribution, addedAt: Date.now() }];
    });
  }, []);

  const removeItem = useCallback((disID: string) => {
    setItems((prev) => prev.filter((i) => i.disID !== disID));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getRemainingMs = useCallback(
    (disID: string) => {
      const item = items.find((i) => i.disID === disID);
      if (!item) return 0;
      const elapsed = Date.now() - item.addedAt;
      return Math.max(0, RESERVATION_DURATION_MS - elapsed);
    },
    [items],
  );

  /**
   * Call POST /distributions/:disID/request for every item in the cart.
   * On success the distribution becomes CLAIMED in the DB and belongs to the user.
   */
  const pickUpAll = useCallback(async () => {
    if (items.length === 0) return;

    // Purge expired before submitting
    const now = Date.now();
    const validItems = items.filter(
      (i) => now - i.addedAt < RESERVATION_DURATION_MS,
    );

    if (validItems.length === 0) {
      showAlert(
        "Expired",
        "All items have expired. Please add food again.",
        undefined,
        { type: "warning" },
      );
      setItems([]);
      return;
    }

    setIsPickingUp(true);

    const results: { disID: string; success: boolean; error?: string; notFound?: boolean }[] = [];

    for (const item of validItems) {
      try {
        await axiosClient.post(
          API_ENDPOINTS.DISTRIBUTION.REQUEST(item.disID),
          {},
        );
        results.push({ disID: item.disID, success: true });
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 404) {
          // Distribution was deleted (expired) — treat as unavailable
          results.push({
            disID: item.disID,
            success: false,
            error: `"${item.food?.foodName ?? "Food"}" is no longer available`,
            notFound: true,
          });
        } else {
          const msg =
            err?.response?.data?.message ?? err?.message ?? "Request failed";
          results.push({ disID: item.disID, success: false, error: msg });
        }
      }
    }

    setIsPickingUp(false);

    const succeeded = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);
    const notFoundItems = results.filter((r) => r.notFound);

    // Remove successfully claimed items AND unavailable (404) items from cart
    const idsToRemove = new Set([
      ...succeeded.map((r) => r.disID),
      ...notFoundItems.map((r) => r.disID),
    ]);
    if (idsToRemove.size > 0) {
      setItems((prev) => prev.filter((i) => !idsToRemove.has(i.disID)));
      // Invalidate food cache so browse food will show updated list
      invalidateCache();
    }

    // Only count non-404 failures as real errors
    const realFailed = failed.filter((r) => !r.notFound);

    if (notFoundItems.length > 0 && succeeded.length === 0 && realFailed.length === 0) {
      // All items were expired/unavailable
      showAlert(
        "Food No Longer Available",
        "The food you selected has expired or been claimed by someone else. The list has been refreshed.",
        undefined,
        { type: "warning" },
      );
    } else if (failed.length > 0 && succeeded.length > 0) {
      showAlert(
        "Partial Success",
        `${succeeded.length} item(s) claimed successfully.\n${failed.length} item(s) failed: ${failed.map((f) => f.error).join(", ")}`,
        [{ text: "OK", style: "default", onPress: () => router.push("/(tabs)") }],
        { type: "info" },
      );
    } else if (realFailed.length > 0) {
      showAlert(
        "Request Failed",
        `Could not claim items: ${realFailed.map((f) => f.error).join(", ")}`,
        undefined,
        { type: "error" },
      );
    } else {
      // All items claimed successfully — show success modal
      const claimedData = succeeded.map((result) => {
        const item = validItems.find((i) => i.disID === result.disID);
        return {
          disID: result.disID,
          foodName: item?.food?.foodName || "Food Item",
          location: item?.location?.barangay || "Location",
        };
      });
      setClaimedItems(claimedData);
      setShowSuccessModal(true);
    }
  }, [items, invalidateCache, showAlert]);

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    DeviceEventEmitter.emit('dashboard:force-refresh');
    router.push("/(tabs)");
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        clearCart,
        pickUpAll,
        isPickingUp,
        getRemainingMs,
      }}>
      {children}
      <ClaimsConfirmedModal
        visible={showSuccessModal}
        claimedItems={claimedItems}
        onClose={handleCloseSuccessModal}
      />
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
