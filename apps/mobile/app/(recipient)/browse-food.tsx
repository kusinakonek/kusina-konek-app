import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, ShoppingCart } from "lucide-react-native";
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

  const { items: cartItems, addItem } = useCart();
  const { distributions, loading, error, fetchDistributions, isCached } =
    useFoodCache();
  const { colors } = useTheme();

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
      fetchDistributions(
        false,
        userLocationRef.current?.lat,
        userLocationRef.current?.lng,
      );
    };

    init();
  }, []);

  // Filter distributions based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredDistributions(distributions);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = distributions.filter((d) => {
      const foodName = d.food?.foodName?.toLowerCase() ?? "";
      const description = d.food?.description?.toLowerCase() ?? "";
      const barangay = d.location?.barangay?.toLowerCase() ?? "";
      return (
        foodName.includes(query) ||
        description.includes(query) ||
        barangay.includes(query)
      );
    });
    setFilteredDistributions(filtered);
  }, [searchQuery, distributions]);

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
      Alert.alert("Already in Cart", "This food is already in your cart.");
      return;
    }
    addItem(distribution);
    Alert.alert(
      "Added to Cart",
      `${distribution.food?.foodName ?? "Food"} has been added to your cart. You have 15 minutes to pick it up.`,
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
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          {error ? error : "No available food at the moment."}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top"]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <ArrowLeft size={wp(24)} color={colors.text} />
        </Pressable>

        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Browse Food</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Available Foods</Text>
        </View>

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

      {/* Content */}
      <View style={styles.content}>
        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search for food..."
          onFilterPress={() => {
            // TODO: implement filter modal
          }}
        />

        {/* Count */}
        <Text style={[styles.countText, { color: colors.text }]}>
          Available Foods ({filteredDistributions.length})
        </Text>

        {/* Loading State */}
        {loading && !refreshing ? (
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
  },
  emptyText: {
    fontSize: fp(15),
    color: theme.colors.mutedText,
    textAlign: "center",
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
});
