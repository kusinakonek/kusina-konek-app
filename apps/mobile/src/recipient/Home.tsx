import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ImageBackground,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import axiosClient from "../api/axiosClient";
import { API_ENDPOINTS } from "../api/endpoints";
import { RecentItemsList, RecentItem } from "../components/RecentItemsList";
import EmptyRecentFood from "../components/EmptyRecentFood";
import { Package, MapPin, Utensils, Search } from "lucide-react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { wp, hp, fp } from "../utils/responsive";
import LoadingScreen from "../components/LoadingScreen";

export default function RecipientHome() {
  const { user } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return; // Prevent fetching if logged out

    try {
      const response = await axiosClient.get(API_ENDPOINTS.DASHBOARD.RECIPIENT);
      setDashboardData(response.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Refetch dashboard data whenever the screen comes into focus
  // This ensures recently requested food appears after pickup
  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [fetchDashboardData]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getRecentItems = (): RecentItem[] => {
    return (dashboardData?.recentFoods || []).map((f: any) => ({
      id: f.disID || f.id,
      title: f.foodName,
      quantity: `${f.quantity} servings`,
      location: f.location,
      time: f.timeAgo,
      status: f.status?.toLowerCase(),
      rating: f.myRating,
      showFeedback: f.canGiveFeedback,
    }));
  };

  const userName =
    user?.user_metadata?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "there";

  if (loading && !refreshing) {
    return <LoadingScreen message="Loading dashboard..." />;
  }

  const handleConfirmDonation = async (id: string) => {
    Alert.alert(
      "Confirm Receipt",
      "Have you successfully received this food?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Confirm",
          onPress: async () => {
            setLoading(true);
            try {
              await axiosClient.post(`/donations/${id}/confirm`);
              fetchDashboardData();
              Alert.alert("Success", "Donation marked as received!");
            } catch (error) {
              console.error("Failed to confirm donation", error);
              Alert.alert("Error", "Failed to confirm donation. Please try again.");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerLeft}
          onPress={() => router.push("/(recipient)/browse-food")}>
          <Image
            source={require("../../assets/KusinaKonek-Logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.appName}>KusinaKonek</Text>
            <Text style={styles.dashboardTitle}>RECIPIENT Dashboard</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#00C853"]}
          />
        }>
        {/* Greeting */}
        <View style={styles.greetingRow}>
          <View style={styles.greetingAvatar}>
            <Text style={styles.greetingAvatarText}>
              {userName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.greetingName}>Hi {userName}!</Text>
            <Text style={styles.greetingSubtitle}>
              Discover bunch of different free{" "}
              <Text style={styles.greenText}>ULAM</Text>.
            </Text>
          </View>
        </View>

        {/* Hero Banner */}
        <View style={styles.heroContainer}>
          <ImageBackground
            source={{
              uri: "https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=1000&auto=format&fit=crop",
            }}
            style={styles.heroImage}
            imageStyle={{ borderRadius: wp(16), opacity: 0.85 }}>
            <View style={styles.heroOverlay}>
              <Text style={styles.heroTitle}>
                Get free foods for your family
              </Text>
              <Text style={styles.heroSubtitle}>
                Help families in Naga City with your extra food
              </Text>
            </View>
          </ImageBackground>
        </View>

        {/* Available Foods Stats Card */}
        <View style={styles.recipientStatsCard}>
          <View style={styles.recipientStatsIconContainer}>
            <Package size={wp(48)} color="#2962FF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.recipientStatsValue}>
              {dashboardData?.stats?.availableFoods || 0}
            </Text>
            <Text style={styles.recipientStatsLabel}>Available Foods</Text>
            <View style={styles.recipientStatsMeta}>
              <MapPin size={wp(12)} color="#00C853" />
              <Text style={styles.recipientStatsMetaText}>
                {dashboardData?.stats?.locations || 0} locations
              </Text>
              <Text style={styles.recipientStatsMetaDot}>•</Text>
              <Utensils size={wp(12)} color="#2962FF" />
              <Text style={styles.recipientStatsMetaText}>
                {dashboardData?.stats?.totalServings || 0}+ servings
              </Text>
            </View>
          </View>
        </View>

        {/* Browse Food Button */}
        <TouchableOpacity
          style={styles.mainButton}
          onPress={() => router.push("/(recipient)/browse-food")}>
          <Search size={wp(24)} color="#fff" style={{ marginRight: wp(8) }} />
          <Text style={styles.mainButtonText}>Browse Food</Text>
        </TouchableOpacity>

        {/* Recent Food */}
        {getRecentItems().length > 0 ? (
          <RecentItemsList
            items={getRecentItems()}
            role="RECIPIENT"
            onSeeAll={() => { }}
            onConfirm={handleConfirmDonation}
          />
        ) : (
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Recent Food</Text>
              <TouchableOpacity onPress={() => { }}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <EmptyRecentFood
              title="No Food Requests Yet"
              message="You haven't requested any food yet. Start browsing available food donations in your area and make your first request!"
              icon="package"
            />
          </View>
        )}

        <View style={{ height: hp(20) }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: wp(20),
    paddingVertical: hp(12),
    backgroundColor: "#fff",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: wp(12) },
  logoImage: { width: wp(40), height: wp(40), borderRadius: wp(8) },
  appName: { fontSize: fp(18), fontWeight: "bold", color: "#1a1a1a" },
  dashboardTitle: { fontSize: fp(12), color: "#666" },
  scrollContent: {
    padding: wp(20),
    paddingBottom: Platform.OS === "ios" ? hp(110) : hp(90),
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(12),
    marginBottom: hp(20),
  },
  greetingAvatar: {
    width: wp(44),
    height: wp(44),
    borderRadius: wp(22),
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },
  greetingAvatarText: {
    fontSize: fp(18),
    fontWeight: "bold",
    color: "#2E7D32",
  },
  greetingName: { fontSize: fp(16), fontWeight: "bold", color: "#1a1a1a" },
  greetingSubtitle: { fontSize: fp(13), color: "#666" },
  greenText: { color: "#00C853", fontWeight: "bold" },
  heroContainer: {
    height: hp(160),
    borderRadius: wp(16),
    marginBottom: hp(20),
    overflow: "hidden",
    backgroundColor: "#333",
  },
  heroImage: { width: "100%", height: "100%", justifyContent: "flex-end" },
  heroOverlay: { padding: wp(16), backgroundColor: "rgba(0,0,0,0.3)" },
  heroTitle: {
    fontSize: fp(22),
    fontWeight: "bold",
    color: "#fff",
    marginBottom: hp(4),
  },
  heroSubtitle: { fontSize: fp(14), color: "rgba(255,255,255,0.9)" },
  recipientStatsCard: {
    backgroundColor: "#E3F2FD",
    borderRadius: wp(16),
    padding: wp(20),
    flexDirection: "row",
    alignItems: "center",
    gap: wp(20),
    borderWidth: 1,
    borderColor: "#BBDEFB",
    marginBottom: hp(20),
  },
  recipientStatsIconContainer: {
    width: wp(64),
    height: wp(64),
    justifyContent: "center",
    alignItems: "center",
  },
  recipientStatsValue: {
    fontSize: fp(32),
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: hp(4),
  },
  recipientStatsLabel: {
    fontSize: fp(16),
    fontWeight: "600",
    color: "#333",
    marginBottom: hp(8),
  },
  recipientStatsMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(6),
    flexWrap: "wrap",
  },
  recipientStatsMetaText: { fontSize: fp(12), color: "#555" },
  recipientStatsMetaDot: { fontSize: fp(12), color: "#999" },
  mainButton: {
    flexDirection: "row",
    backgroundColor: "#00C853",
    height: hp(56),
    borderRadius: wp(12),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: hp(8),
    shadowColor: "#00C853",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  mainButtonText: { color: "#fff", fontSize: fp(18), fontWeight: "bold" },
  recentSection: {
    marginTop: hp(24),
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(16),
  },
  sectionTitle: {
    fontSize: fp(20),
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  seeAllText: {
    fontSize: fp(14),
    color: "#00C853",
    fontWeight: "600",
  },
});
