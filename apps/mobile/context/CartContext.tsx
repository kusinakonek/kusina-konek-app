import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Alert } from "react-native";
import axiosClient from "../src/api/axiosClient";
import { API_ENDPOINTS } from "../src/api/endpoints";

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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Periodically purge expired items (every 30 s)
  useEffect(() => {
    timerRef.current = setInterval(() => {
      const now = Date.now();
      setItems((prev) => {
        const valid = prev.filter(
          (item) => now - item.addedAt < RESERVATION_DURATION_MS,
        );
        if (valid.length !== prev.length) {
          Alert.alert(
            "Items Expired",
            "Some items were removed from your cart because the 15-minute reservation expired.",
          );
        }
        return valid;
      });
    }, 30_000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

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
      Alert.alert("Expired", "All items have expired. Please add food again.");
      setItems([]);
      return;
    }

    setIsPickingUp(true);

    const results: { disID: string; success: boolean; error?: string }[] = [];

    for (const item of validItems) {
      try {
        await axiosClient.post(API_ENDPOINTS.DISTRIBUTION.REQUEST(item.disID), {});
        results.push({ disID: item.disID, success: true });
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ?? err?.message ?? "Request failed";
        results.push({ disID: item.disID, success: false, error: msg });
      }
    }

    setIsPickingUp(false);

    const succeeded = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    // Remove successfully claimed items from cart
    if (succeeded.length > 0) {
      const claimedIds = new Set(succeeded.map((r) => r.disID));
      setItems((prev) => prev.filter((i) => !claimedIds.has(i.disID)));
    }

    if (failed.length > 0 && succeeded.length > 0) {
      Alert.alert(
        "Partial Success",
        `${succeeded.length} item(s) claimed successfully.\n${failed.length} item(s) failed: ${failed.map((f) => f.error).join(", ")}`,
      );
    } else if (failed.length > 0) {
      Alert.alert(
        "Request Failed",
        `Could not claim items: ${failed.map((f) => f.error).join(", ")}`,
      );
    } else {
      Alert.alert("Success", "All items have been claimed! 🎉");
    }
  }, [items]);

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
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
