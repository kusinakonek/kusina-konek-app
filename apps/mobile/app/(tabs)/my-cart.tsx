import React from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import CartHeader from "../../src/components/CartHeader";
import CartBottomBar from "../../src/components/CartBottomBar";
import CartItemCard from "../../src/components/CartItemCard";
import EmptyCart from "../../src/components/EmptyCart";
import { theme } from "../../src/constants/theme";
import { useCart } from "../../context/CartContext";

export default function CartTab() {
  const { items, removeItem, pickUpAll, isPickingUp } = useCart();

  const handleBrowseFood = () => {
    router.push("/(recipient)/browse-food");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <CartHeader itemCount={items.length} onBack={() => router.back()} />

      <View style={styles.content}>
        {items.length === 0 ? (
          <EmptyCart onBrowseFood={handleBrowseFood} />
        ) : (
          <FlatList
            data={items}
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
                  unit="serving"
                  barangay={item.location?.barangay ?? "Unknown Location"}
                  addedAt={item.addedAt}
                  onRemove={() => removeItem(item.disID)}
                />
              );
            }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      {isPickingUp ? (
        <View style={styles.loadingBar}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Claiming your food...</Text>
        </View>
      ) : (
        <CartBottomBar
          disabled={items.length === 0}
          onPickUp={pickUpAll}
          message="Please select a pickup point for each item"
        />
      )}
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
  loadingBar: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.mutedText,
  },
});
