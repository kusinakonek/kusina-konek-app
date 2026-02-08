import React, { useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import api from "../../lib/api";
import { API_ENDPOINTS } from "../../src/api/endpoints";
import CartHeader from "../../src/components/CartHeader";
import CartBottomBar from "../../src/components/CartBottomBar";
import CartItemCard from "../../src/components/CartItemCard";
import EmptyCart from "../../src/components/EmptyCart";
import { theme } from "../../src/constants/theme";

// Cart item type — a distribution that the recipient has requested
type CartItem = {
  disID: string;
  donorID: string;
  recipientID: string | null;
  locID: string;
  foodID: string;
  quantity: number;
  status: string;
  scheduledTime: string;
  timestamp: string;
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

export default function MyCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyDistributions = useCallback(async () => {
    try {
      const response = await api.get(API_ENDPOINTS.DISTRIBUTION.GET_MINE);
      const data: CartItem[] = response.data?.distributions ?? [];
      // Filter to show only CLAIMED distributions (items in cart)
      const claimed = data.filter((d) => d.status === "CLAIMED");
      setCartItems(claimed);
    } catch (err: any) {
      console.error("Failed to fetch cart items:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyDistributions();
  }, [fetchMyDistributions]);

  const handleBrowseFood = () => {
    router.push("/(recipient)/browse-food");
  };

  const handleRemoveItem = useCallback((disID: string) => {
    setCartItems((prev) => prev.filter((item) => item.disID !== disID));
    // TODO: call API to cancel/remove the distribution request
  }, []);

  const handlePickUp = () => {
    // TODO: implement pick-up flow
    console.log(
      "Pick up items:",
      cartItems.map((i) => i.disID),
    );
  };

  const allHavePickupPoints =
    cartItems.length > 0 && cartItems.every((i) => i.locID);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Header */}
      <CartHeader itemCount={cartItems.length} onBack={() => router.back()} />

      {/* Content */}
      <View style={styles.content}>
        {cartItems.length === 0 ? (
          <EmptyCart onBrowseFood={handleBrowseFood} />
        ) : (
          <FlatList
            data={cartItems}
            keyExtractor={(item) => item.disID}
            renderItem={({ item }) => {
              const donorFirst = item.donor?.firstName ?? "";
              const donorLast = item.donor?.lastName ?? "";
              const donorName = item.donor?.orgName
                ? item.donor.orgName
                : `${donorFirst} ${donorLast}`.trim() || "Unknown Donor";

              return (
                <CartItemCard
                  imageUri={item.food?.image ?? null}
                  foodName={item.food?.foodName ?? "Unknown Food"}
                  donorName={donorName}
                  quantity={item.quantity}
                  unit={item.quantity === 1 ? "serving" : "serving"}
                  barangay={item.location?.barangay ?? "Unknown Location"}
                  onRemove={() => handleRemoveItem(item.disID)}
                />
              );
            }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      {/* Bottom Bar */}
      <CartBottomBar
        disabled={!allHavePickupPoints}
        onPickUp={handlePickUp}
        message="Please select a pickup point for each item"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
  listContent: {
    paddingBottom: theme.spacing.lg,
  },
});
