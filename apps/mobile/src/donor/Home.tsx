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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import axiosClient from "../api/axiosClient";
import { API_ENDPOINTS } from "../api/endpoints";
import { DashboardStats } from "../components/DashboardStats";
import { RecentItemsList, RecentItem } from "../components/RecentItemsList";
import { Heart, Package, Star, Plus, Utensils } from "lucide-react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { wp, hp, fp, isTablet } from "../utils/responsive";

export default function DonorHome() {
  const { user } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return; // Prevent fetching if logged out

    try {
      const response = await axiosClient.get(API_ENDPOINTS.DASHBOARD.DONOR);
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
  // This ensures the dashboard shows the latest donation data
  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [fetchDashboardData]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getStats = () => {
    if (!dashboardData?.stats) return [];
    return [
      {
        icon: Heart,
        value: dashboardData.stats.totalDonated || 0,
        label: "Donated",
        color: "#00C853",
        bgColor: "#E8F5E9",
      },
      {
        icon: Package,
        value: dashboardData.stats.availableItems || 0,
        label: "Available",
        color: "#2196F3",
        bgColor: "#E3F2FD",
      },
      {
        icon: Star,
        value: dashboardData.stats.averageRating || "N/A",
        label: "Ratings",
        color: "#FFC107",
        bgColor: "#FFF8E1",
      },
    ];
  };

  const getRecentItems = (): RecentItem[] => {
    return (dashboardData?.recentDonations || []).map((d: any) => ({
      id: d.disID || d.id,
      title: d.foodName || "Food Donation",
      quantity: `${d.quantity} servings`,
      location: d.location || "Location",
      time: d.timeAgo || "Recently",
      status: d.status?.toLowerCase(),
      recipientName: d.claimedBy,
      rating: d.rating,
    }));
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerLeft}
          onPress={() => router.push("/donate")}
          activeOpacity={0.7}>
          <Image
            source={require("../../assets/KusinaKonek-Logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.appName}>KusinaKonek</Text>
            <Text style={styles.dashboardTitle}>Donor Dashboard</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#00C853"]}
          />
        }>
        <View style={styles.heroContainer}>
          <ImageBackground
            source={{
              uri: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1000&auto=format&fit=crop",
            }}
            style={styles.heroImage}
            imageStyle={{ borderRadius: wp(16), opacity: 0.85 }}>
            <View style={styles.heroOverlay}>
              <Text style={styles.heroTitle}>Share Your Blessings Today</Text>
              <Text style={styles.heroSubtitle}>
                Help families in Naga City with your extra food
              </Text>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.statsContainer}>
          <DashboardStats stats={getStats()} />
        </View>

        <TouchableOpacity
          style={styles.mainButton}
          onPress={() => router.push("/donate")}>
          <Plus size={wp(24)} color="#fff" style={{ marginRight: wp(8) }} />
          <Text style={styles.mainButtonText}>Donate Food</Text>
        </TouchableOpacity>

        <RecentItemsList
          items={getRecentItems()}
          role="DONOR"
          onSeeAll={() => {}}
        />

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
  scrollContent: { padding: wp(20) },
  heroContainer: {
    height: hp(160),
    borderRadius: wp(16),
    marginBottom: hp(24),
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
  statsContainer: { marginBottom: 0 },
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
});
