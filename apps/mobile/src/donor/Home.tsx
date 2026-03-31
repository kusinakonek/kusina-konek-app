import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ImageBackground,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import axiosClient from "../api/axiosClient";
import { API_ENDPOINTS } from "../api/endpoints";
import { DashboardStats } from "../components/DashboardStats";
import { RecentItemsList, RecentItem } from "../components/RecentItemsList";
import { Heart, Package, Star, Plus, Utensils, Bell } from "lucide-react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { wp, hp, fp, isTablet } from "../utils/responsive";
import LoadingScreen from "../components/LoadingScreen";
import { useTheme } from "../../context/ThemeContext";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { useNetwork } from "../../context/NetworkContext";
import { cacheData, getCachedDataAnyAge, CACHE_KEYS } from "../utils/dataCache";

export default function DonorHome() {
  const { user } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const { notification } = usePushNotifications();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const channelsRef = useRef<any[]>([]);
  const { isOnline, justReconnected, clearJustReconnected } = useNetwork();

  // Load from cache on mount for instant UI
  useEffect(() => {
    const loadCache = async () => {
      const cached = await getCachedDataAnyAge(CACHE_KEYS.DONOR_DASHBOARD);
      if (cached && !dashboardData) {
        setDashboardData(cached);
        setLoading(false); // Only set loading false if we have cache to show
      }
    };
    loadCache();
  }, []);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return; // Prevent fetching if logged out

    if (!isOnline && dashboardData) {
       // If offline and we already have cache, just stop loading
       setLoading(false);
       setRefreshing(false);
       return;
    }

    try {
      const response = await axiosClient.get(API_ENDPOINTS.DASHBOARD.DONOR);
      setDashboardData(response.data);
      await cacheData(CACHE_KEYS.DONOR_DASHBOARD, response.data);
      
      // Initialize unread counts from the new backend response
      const distributions = response.data?.recentDonations || [];
      const counts: Record<string, number> = {};
      
      for (const d of distributions) {
        if (d.disID || d.id) {
          counts[d.disID || d.id] = d.unreadMessages || 0;
        }
      }
      
      setUnreadCounts(counts);
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


  // Handle auto-refresh when a notification is received
  useEffect(() => {
    if (notification) {
      console.log("[DonorHome] Notification received, auto-refreshing stats...");
      fetchDashboardData();
    }
  }, [notification, fetchDashboardData]);

  // Handle reconnect auto-refresh
  useEffect(() => {
    if (justReconnected) {
      fetchDashboardData();
      clearJustReconnected();
    }
  }, [justReconnected, fetchDashboardData, clearJustReconnected]);

  // Refetch full dashboard data whenever the screen comes into focus
  // This ensures cancelled donations disappear immediately when navigating back
  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [fetchDashboardData]),
  );

  // Listen for real-time message read events
  useEffect(() => {
    if (!dashboardData?.recentDonations || !user) return;

    // Clean up old channels
    channelsRef.current.forEach(channel => {
      supabase.removeChannel(channel);
    });
    channelsRef.current = [];

    // Subscribe to each distribution's chat channel
    const distributions = dashboardData.recentDonations || [];
    distributions.forEach((d: any) => {
      const disID = d.disID || d.id;
      if (!disID) return;

      const channel = supabase.channel(`chat:${disID}`, {
        config: {
          broadcast: { self: false },
        },
      });

      channel
        .on('broadcast', { event: 'messages_read' }, async (payload) => {
          console.log('[Dashboard] Messages read broadcast received:', payload);
          // Refresh just this distribution's unread count
          try {
            const countRes = await axiosClient.get(API_ENDPOINTS.MESSAGE.UNREAD_COUNT(disID));
            setUnreadCounts(prev => ({
              ...prev,
              [disID]: countRes.data.count || 0,
            }));
          } catch (err) {
            console.error('Failed to refresh unread count:', err);
          }
        })
        .subscribe();

      channelsRef.current.push(channel);
    });

    return () => {
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    };
  }, [dashboardData?.recentDonations, user]);

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
        onPress: () => {
          setLoading(true);
          setTimeout(() => {
            router.push("/(donor)/feedback");
            setLoading(false);
          }, 100);
        },
      },
    ];
  };

  const getRecentItems = (): RecentItem[] => {
    return (dashboardData?.recentDonations || []).map((d: any) => {
      const disID = d.disID || d.id;
      return {
        id: disID,
        foodID: d.foodID, // Add foodID for cancellation
        title: d.foodName || "Food Donation",
        quantity: `${d.quantity} servings`,
        location: d.location || "Location",
        time: d.timeAgo || "Recently",
        status: d.status?.toLowerCase(),
        recipientName: d.claimedBy,
        rating: d.rating,
        role: 'DONOR',
        image: d.image || null,
        unreadMessages: unreadCounts[disID] || 0,
      };
    });
  };



  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
        <View style={styles.headerLeft}>
          <Image
            source={require("../../assets/KusinaKonek-Logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <View>
            <Text style={[styles.appName, { color: colors.text }]}>KusinaKonek</Text>
            <Text style={[styles.dashboardTitle, { color: colors.textSecondary }]}>Donor Dashboard</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/notifications')}
          style={{ padding: 8, position: "relative" }}
        >
          <Bell size={wp(24)} color="#00C853" />
          {(dashboardData?.stats?.unreadNotifications || 0) > 0 && (
            <View
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                backgroundColor: "#FF3B30",
                width: wp(16),
                height: wp(16),
                borderRadius: wp(8),
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 1.5,
                borderColor: colors.headerBg,
              }}
            >
              <Text style={{ color: "white", fontSize: fp(9), fontWeight: "bold" }}>
                {dashboardData.stats.unreadNotifications > 9 ? "9+" : dashboardData.stats.unreadNotifications}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
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
            onPress={() => {
              setLoading(true);
              setTimeout(() => {
                router.push("/donate");
                setLoading(false);
              }, 100);
            }}>
            <Plus size={wp(24)} color="#fff" style={{ marginRight: wp(8) }} />
            <Text style={styles.mainButtonText}>Donate Food</Text>
          </TouchableOpacity>

          <View>
            <RecentItemsList
              items={getRecentItems()}
              role="DONOR"
              onSeeAll={() => router.push("/(donor)/all-recent-donations")}
              onPressCard={(item) => {
                setLoading(true);
                setTimeout(() => {
                  if (item.rating) {
                    // Navigate to review-details for items that have feedback
                    router.push({
                      pathname: "/(donor)/review-details",
                      params: { disID: item.id }
                    });
                  } else {
                    // Navigate to active-details for items without feedback
                    router.push({
                      pathname: "/(donor)/active-details",
                      params: { disID: item.id }
                    });
                  }
                  setLoading(false);
                }, 100);
              }}
              onFeedback={(id) => {
                setLoading(true);
                // Small timeout to allow UI to update before freezing on navigation
                setTimeout(() => {
                  router.push({
                    pathname: "/(donor)/review-details",
                    params: { disID: id }
                  });
                  // Reset loading state after navigation (when coming back)
                  // Use a focus effect or just time it out if push is instant
                  setLoading(false);
                }, 100);
              }}
            />
          </View>

          <View style={{ height: hp(20) }} />
        </ScrollView>
        {loading && !refreshing && (
          <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#00C853" />
          </View>
        )}
      </View>
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
