import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import CartHeader from "../../src/components/CartHeader";
import CartBottomBar from "../../src/components/CartBottomBar";
import CartItemCard from "../../src/components/CartItemCard";
import EmptyCart from "../../src/components/EmptyCart";
import ClaimLimitModal from "../../src/components/ClaimLimitModal";
import RecipientDisclaimerModal from "../../src/components/RecipientDisclaimerModal";
import { theme } from "../../src/constants/theme";
import { useCart } from "../../context/CartContext";
import axiosClient from "../../src/api/axiosClient";
import { API_ENDPOINTS } from "../../src/api/endpoints";
import { useTheme } from "../../context/ThemeContext";

interface ClaimLimitsResponse {
  dailyClaims: number;
  weeklyClaims: number;
  monthlyClaims: number;
  maxDaily: number;
  maxWeekly: number;
  maxMonthly: number;
  canClaim: boolean;
}

export default function CartTab() {
  const { items, removeItem, pickUpAll, isPickingUp } = useCart();
  const { colors } = useTheme();
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  const [claimLimits, setClaimLimits] = useState<ClaimLimitsResponse | null>(
    null,
  );
  const [isCheckingLimits, setIsCheckingLimits] = useState(false);

  const handleBrowseFood = () => {
    router.push("/(recipient)/browse-food");
  };

  /**
   * When "Pick up Ulam(s)" is pressed, show the recipient disclaimer first.
   */
  const handlePickUpPress = () => {
    setShowDisclaimerModal(true);
  };

  /**
   * After accepting the disclaimer, check claim limits,
   * then proceed with pickup.
   */
  const handleDisclaimerAccept = async () => {
    setShowDisclaimerModal(false);
    setIsCheckingLimits(true);
    try {
      const response = await axiosClient.get<ClaimLimitsResponse>(
        API_ENDPOINTS.DISTRIBUTION.CLAIM_LIMITS,
      );
      const limits = response.data;
      setClaimLimits(limits);

      if (!limits.canClaim) {
        // Show limit exceeded modal
        setShowLimitModal(true);
      } else {
        pickUpAll();
      }
    } catch (err: any) {
      // If the limit check fails, still proceed
      // (server will enforce limits on the actual request)
      pickUpAll();
    } finally {
      setIsCheckingLimits(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top"]}>
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

      {isPickingUp || isCheckingLimits ? (
        <View
          style={[
            styles.loadingBar,
            { backgroundColor: colors.surface, borderTopColor: colors.border },
          ]}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {isCheckingLimits
              ? "Checking claim limits..."
              : "Claiming your food..."}
          </Text>
        </View>
      ) : (
        <CartBottomBar
          disabled={items.length === 0}
          onPickUp={handlePickUpPress}
          message="Please select a pickup point for each item"
        />
      )}

      {/* Recipient Disclaimer Modal */}
      <RecipientDisclaimerModal
        visible={showDisclaimerModal}
        onAccept={handleDisclaimerAccept}
        onDecline={() => setShowDisclaimerModal(false)}
      />

      {/* Claim Limit Modal */}
      <ClaimLimitModal
        visible={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        dailyClaims={claimLimits?.dailyClaims ?? 0}
        weeklyClaims={claimLimits?.weeklyClaims ?? 0}
        monthlyClaims={claimLimits?.monthlyClaims ?? 0}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    // backgroundColor: theme.colors.background,
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
