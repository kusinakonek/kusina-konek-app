import React, { useCallback, useEffect, useState } from "react";
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
import api from "../../lib/api";
import { API_ENDPOINTS } from "../../src/api/endpoints";
import BrowseFoodCard from "../../src/components/BrowseFoodCard";
import SearchBar from "../../src/components/SearchBar";
import { theme } from "../../src/constants/theme";
import { useCart } from "../../context/CartContext";

// Distribution type based on the API response
type Distribution = {
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
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [filteredDistributions, setFilteredDistributions] = useState<
    Distribution[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { items: cartItems, addItem } = useCart();

  const fetchAvailableDistributions = useCallback(async () => {
    try {
      setError(null);
      const response = await api.get(API_ENDPOINTS.DISTRIBUTION.GET_AVAILABLE);
      const data = response.data?.distributions ?? [];
      setDistributions(data);
      setFilteredDistributions(data);
    } catch (err: any) {
      console.error("Failed to fetch distributions:", err);
      setError(
        err?.response?.data?.message ?? "Failed to load available food.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAvailableDistributions();
  }, [fetchAvailableDistributions]);

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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAvailableDistributions();
  }, [fetchAvailableDistributions]);

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
      onRequest={() => handleRequest(item)}
    />
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {error ? error : "No available food at the moment."}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <ArrowLeft size={24} color={theme.colors.text} />
        </Pressable>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Browse Food</Text>
          <Text style={styles.headerSubtitle}>Available Foods</Text>
        </View>

        <Pressable
          style={styles.cartButton}
          onPress={() => router.push("/(tabs)/my-cart")}
          accessibilityRole="button"
          accessibilityLabel="Cart">
          <View>
            <ShoppingCart size={22} color={theme.colors.text} />
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
        <Text style={styles.countText}>
          Available Foods ({filteredDistributions.length})
        </Text>

        {/* Loading State */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading available food...</Text>
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
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: theme.colors.mutedText,
    marginTop: 1,
  },
  cartButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
  countText: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  listContent: {
    paddingBottom: theme.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: theme.spacing.sm,
    fontSize: 14,
    color: theme.colors.mutedText,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
    color: theme.colors.mutedText,
    textAlign: "center",
  },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: "#D32F2F",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
});
