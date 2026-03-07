import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  ArrowLeft,
  ShoppingCart,
  SearchX,
  WifiOff,
  RefreshCw,
  Map,
} from "lucide-react-native";
import { Pressable } from "react-native";
import * as Location from "expo-location";
import SearchBar from "../../src/components/SearchBar";
import BrowseFoodCard from "../../src/components/BrowseFoodCard";
import { theme } from "../../src/constants/theme";
import { useCart } from "../../context/CartContext";
import { useFoodCache, Distribution } from "../../context/FoodCacheContext";
import { wp, hp, fp } from "../../src/utils/responsive";
import { BrowseFoodSkeleton } from "../../src/components/SkeletonLoader";
import { useTheme } from "../../context/ThemeContext";
import { useAlert } from "../../context/AlertContext";
import RecipientDisclaimerModal from "../../src/components/RecipientDisclaimerModal";

/** Returns a human-readable relative time string */
function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} mins ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

export default function BrowseFood() {
  const [filteredDistributions, setFilteredDistributions] = useState<
    Distribution[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const { items: cartItems, addItem } = useCart();
  const { distributions, loading, error, fetchDistributions, isCached } =
    useFoodCache();
  const { colors, isDark } = useTheme();
  const { showAlert } = useAlert();

  // Sort and Filter States
  const [sortBy, setSortBy] = useState<'latest' | 'nearest'>('latest');
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Disclaimer State
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  const handleAcceptDisclaimer = () => {
    setShowDisclaimer(false);
  };

  const handleDeclineDisclaimer = () => {
    setShowDisclaimer(false);
    router.back();
  };

  // Store user location for fetching nearest distributions
  const userLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  // Get user location and fetch distributions on mount
  useEffect(() => {
    const init = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          userLocationRef.current = {
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
          };
        }
      } catch (e) {
        // Location not available — we'll fetch without it
        console.log("Could not get user location:", e);
      }

      // Fetch with location if available
      await fetchDistributions(
        false,
        userLocationRef.current?.lat,
        userLocationRef.current?.lng,
      );
      setInitializing(false);
    };

    init();
  }, []);

  // Filter distributions based on search query AND sort
  useEffect(() => {
    let result = [...distributions];

    // 1. Search Query Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((d) => {
        const foodName = d.food?.foodName?.toLowerCase() ?? "";
        const description = d.food?.description?.toLowerCase() ?? "";
        const barangay = d.location?.barangay?.toLowerCase() ?? "";
        return (
          foodName.includes(query) ||
          description.includes(query) ||
          barangay.includes(query)
        );
      });
    }

    // 2. Sorting
    if (sortBy === 'latest') {
      result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } else if (sortBy === 'nearest') {
      result.sort((a, b) => {
        const distA = a.distanceKm ?? 9999;
        const distB = b.distanceKm ?? 9999;
        return distA - distB;
      });
    }

    setFilteredDistributions(result);
  }, [searchQuery, distributions, sortBy]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDistributions(
      true,
      userLocationRef.current?.lat,
      userLocationRef.current?.lng,
    ); // Force refresh with location
    setRefreshing(false);
  }, [fetchDistributions]);

  const handleRequest = (distribution: Distribution) => {
    const alreadyInCart = cartItems.some((i) => i.disID === distribution.disID);
    if (alreadyInCart) {
      showAlert("Already in Cart", "This food is already in your cart.", undefined, { type: 'warning' });
      return;
    }
    addItem(distribution);
    showAlert(
      "Added to Cart",
      `${distribution.food?.foodName ?? "Food"} has been added to your cart. You have 15 minutes to pick it up.`,
      undefined,
      { type: 'success' }
    );
  };

  const renderItem = ({ item }: { item: Distribution }) => (
    <BrowseFoodCard
      imageUri={item.food?.image ?? null}
      foodName={item.food?.foodName ?? "Unknown Food"}
      description={item.food?.description ?? null}
      servings={item.quantity}
      barangay={item.location?.barangay ?? "Unknown Location"}
      timeAgo={timeAgo(item.timestamp)}
      distanceKm={item.distanceKm ?? null}
      onRequest={() => handleRequest(item)}
    />
  );

  const renderEmpty = () => {
    if (loading) return null;

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <View
            style={[
              styles.emptyIconCircle,
              { backgroundColor: isDark ? "#3a2020" : "#FEE2E2" },
            ]}>
            <WifiOff size={wp(32)} color="#EF4444" />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Something went wrong
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {error}
          </Text>
          <Pressable
            style={[styles.emptyButton, { backgroundColor: colors.primary }]}
            onPress={onRefresh}>
            <RefreshCw size={wp(16)} color="#fff" />
            <Text style={styles.emptyButtonText}>Try Again</Text>
          </Pressable>
        </View>
      );
    }

    if (searchQuery.trim()) {
      return (
        <View style={styles.emptyContainer}>
          <View
            style={[
              styles.emptyIconCircle,
              { backgroundColor: isDark ? "#2a2a1a" : "#FEF3C7" },
            ]}>
            <SearchX size={wp(32)} color="#F59E0B" />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No results found
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No food matches &ldquo;{searchQuery}&rdquo;. Try a different search
            term.
          </Text>
          <Pressable
            style={[styles.emptyOutlineButton, { borderColor: colors.primary }]}
            onPress={() => setSearchQuery("")}>
            <Text
              style={[
                styles.emptyOutlineButtonText,
                { color: colors.primary },
              ]}>
              Clear Search
            </Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View
          style={[
            styles.emptyIconCircle,
            { backgroundColor: colors.primaryLight },
          ]}>
          <SearchX size={wp(32)} color={colors.primary} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          No food available
        </Text>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          There are no food donations available right now. Pull down to refresh
          or check back later.
        </Text>
        <Pressable
          style={[styles.emptyButton, { backgroundColor: colors.primary }]}
          onPress={onRefresh}>
          <RefreshCw size={wp(16)} color="#fff" />
          <Text style={styles.emptyButtonText}>Refresh</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top"]}>

      {/* Disclaimer Modal */}
      <RecipientDisclaimerModal
        visible={showDisclaimer}
        onAccept={handleAcceptDisclaimer}
        onDecline={handleDeclineDisclaimer}
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowFilterModal(false)}
        >
          <View style={[styles.filterContent, { backgroundColor: colors.card }]}>
            <View style={styles.filterHeader}>
              <Text style={[styles.filterTitle, { color: colors.text }]}>Sort by</Text>
              <Pressable onPress={() => setShowFilterModal(false)}>
                <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Done</Text>
              </Pressable>
            </View>

            <Pressable
              style={[
                styles.filterOption,
                sortBy === 'latest' && { backgroundColor: isDark ? '#1a3a1a' : '#E8F5E9', borderColor: theme.colors.primary }
              ]}
              onPress={() => { setSortBy('latest'); setShowFilterModal(false); }}
            >
              <Text style={[styles.filterOptionText, { color: sortBy === 'latest' ? theme.colors.primary : colors.text }]}>Latest First</Text>
            </Pressable>

            <Pressable
              style={[
                styles.filterOption,
                sortBy === 'nearest' && { backgroundColor: isDark ? '#1a3a1a' : '#E8F5E9', borderColor: theme.colors.primary }
              ]}
              onPress={() => { setSortBy('nearest'); setShowFilterModal(false); }}
            >
              <Text style={[styles.filterOptionText, { color: sortBy === 'nearest' ? theme.colors.primary : colors.text }]}>Nearest First</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.headerBg,
            borderBottomColor: colors.border,
          },
        ]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <ArrowLeft size={wp(24)} color={colors.text} />
        </Pressable>

        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Browse Food
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Available Foods
          </Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            style={styles.mapButton}
            onPress={() => router.push("/(recipient)/food-map")}
            accessibilityRole="button"
            accessibilityLabel="View Map">
            <Map size={wp(22)} color={theme.colors.primary} />
          </Pressable>

          <Pressable
            style={styles.cartButton}
            onPress={() => router.push("/(tabs)/my-cart")}
            accessibilityRole="button"
            accessibilityLabel="Cart">
            <View>
              <ShoppingCart size={wp(24)} color={theme.colors.primary} />
              {cartItems.length > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>
                    {cartItems.length > 9 ? "9+" : cartItems.length}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search for food..."
          onFilterPress={() => setShowFilterModal(true)}
        />

        {/* Count */}
        <Text style={[styles.countText, { color: colors.text }]}>
          Available Foods ({filteredDistributions.length})
        </Text>

        {/* Loading State */}
        {(loading || initializing) && !refreshing ? (
          <View style={styles.loadingContainer}>
            <BrowseFoodSkeleton count={3} />
          </View>
        ) : (
          <FlatList
            data={filteredDistributions}
            keyExtractor={(item) => item.disID}
            renderItem={renderItem}
            ListEmptyComponent={renderEmpty}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: wp(theme.spacing.md),
    paddingVertical: hp(theme.spacing.sm),
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: wp(40),
    height: wp(40),
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: wp(theme.spacing.sm),
  },
  headerTitle: {
    fontSize: fp(20),
    fontWeight: "700",
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: fp(13),
    color: theme.colors.mutedText,
    marginTop: hp(1),
  },
  cartButton: {
    width: wp(44),
    height: wp(44),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(46, 125, 50, 0.1)",
    borderRadius: wp(12),
    borderWidth: 1,
    borderColor: "rgba(46, 125, 50, 0.2)",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(8),
  },
  mapButton: {
    width: wp(44),
    height: wp(44),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(46, 125, 50, 0.1)",
    borderRadius: wp(12),
    borderWidth: 1,
    borderColor: "rgba(46, 125, 50, 0.2)",
  },
  content: {
    flex: 1,
    paddingHorizontal: wp(theme.spacing.md),
    paddingTop: hp(theme.spacing.md),
  },
  countText: {
    fontSize: fp(16),
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: hp(theme.spacing.md),
  },
  listContent: {
    paddingBottom: hp(theme.spacing.lg),
  },
  loadingContainer: {
    paddingTop: hp(theme.spacing.sm),
    paddingBottom: hp(theme.spacing.lg),
  },
  loadingText: {
    marginTop: hp(theme.spacing.sm),
    fontSize: fp(14),
    color: theme.colors.mutedText,
  },
  emptyContainer: {
    paddingVertical: hp(60),
    alignItems: "center",
    paddingHorizontal: wp(32),
  },
  emptyIconCircle: {
    width: wp(72),
    height: wp(72),
    borderRadius: wp(36),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: hp(16),
  },
  emptyTitle: {
    fontSize: fp(18),
    fontWeight: "700",
    textAlign: "center",
    marginBottom: hp(8),
  },
  emptyText: {
    fontSize: fp(14),
    color: theme.colors.mutedText,
    textAlign: "center",
    lineHeight: fp(20),
    marginBottom: hp(20),
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(8),
    paddingVertical: hp(12),
    paddingHorizontal: wp(24),
    borderRadius: wp(12),
  },
  emptyButtonText: {
    color: "#fff",
    fontSize: fp(15),
    fontWeight: "600",
  },
  emptyOutlineButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(8),
    paddingVertical: hp(12),
    paddingHorizontal: wp(24),
    borderRadius: wp(12),
    borderWidth: 1.5,
  },
  emptyOutlineButtonText: {
    fontSize: fp(15),
    fontWeight: "600",
  },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: "#D32F2F",
    borderRadius: wp(10),
    minWidth: wp(18),
    height: wp(18),
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: wp(4),
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: fp(10),
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    paddingHorizontal: wp(16),
    paddingTop: hp(80),
  },
  filterContent: {
    backgroundColor: "#fff",
    borderRadius: wp(16),
    padding: wp(16),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(24),
  },
  filterTitle: {
    fontSize: fp(18),
    fontWeight: "bold",
  },
  filterOption: {
    padding: wp(16),
    borderRadius: wp(12),
    borderWidth: 1,
    borderColor: "transparent",
    marginBottom: hp(12),
  },
  filterOptionText: {
    fontSize: fp(16),
    fontWeight: "500",
  },
});
