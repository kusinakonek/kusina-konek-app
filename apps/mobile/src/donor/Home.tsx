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
  DeviceEventEmitter,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import axiosClient from "../api/axiosClient";
import { API_ENDPOINTS } from "../api/endpoints";
import { DashboardStats } from "../components/DashboardStats";
import { RecentItemsList, RecentItem } from "../components/RecentItemsList";
import { Heart, Package, Star, Plus, Utensils, Bell, MessageCircle } from "lucide-react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { wp, hp, fp, isTablet } from "../utils/responsive";
import LoadingScreen from "../components/LoadingScreen";
import { useTheme } from "../../context/ThemeContext";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { useNetwork } from "../../context/NetworkContext";
import { useFoodCache } from "../../context/FoodCacheContext";
import { cacheData, getCachedDataAnyAge, CACHE_KEYS } from "../utils/dataCache";
import TutorialOverlay, { TUTORIAL_STORAGE_KEYS, isTutorialCompleted } from "../components/TutorialOverlay";
import { useTutorial } from "../hooks/useTutorial";
import { DONOR_HOME_STEPS, DONOR_POST_CLAIM_STEPS } from "../hooks/tutorialSteps";

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
  const { isOnline, justReconnected } = useNetwork();
  const { invalidateCache } = useFoodCache();
  const dashboardDataRef = useRef<any>(null);
  const isOnlineRef = useRef(isOnline);
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);

  // Tutorial - only show when dashboard data is loaded
  const tutorial = useTutorial({
    steps: DONOR_HOME_STEPS,
    storageKey: TUTORIAL_STORAGE_KEYS.DONOR_HOME,
    enabled: !loading && dashboardData !== null,
  });

  // Post-Claim Tutorial: Messaging guidance
  const postClaimTutorial = useTutorial({
    steps: DONOR_POST_CLAIM_STEPS,
    storageKey: TUTORIAL_STORAGE_KEYS.DONOR_POST_CLAIM,
    enabled: !loading && dashboardData?.recentDonations?.some((d: any) => d.status?.toUpperCase() === "CLAIMED"),
  });

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

    // Prevent fetching if we just fetched within exactly 30 seconds
    const now = Date.now();
    if (dashboardDataRef.current && (now - lastFetchTimeRef.current < 30000)) {
       setLoading(false);
       setRefreshing(false);
       return;
    }

    if (!isOnline && dashboardData) {
       // If offline and we already have cache, just stop loading
       setLoading(false);
       setRefreshing(false);
       return;
    }

    isFetchingRef.current = true;
    try {
      const response = await axiosClient.get(API_ENDPOINTS.DASHBOARD.DONOR);
      setDashboardData(response.data);
      dashboardDataRef.current = response.data;
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
      lastFetchTimeRef.current = Date.now();
      isFetchingRef.current = false;
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
      lastFetchTimeRef.current = 0; // Bypass throttle to immediately load new changes
      fetchDashboardData();
    }
  }, [notification, fetchDashboardData]);

  // Handle reconnect auto-refresh
  useEffect(() => {
    if (justReconnected) {
      console.log("[DonorHome] Reconnected, fetching fresh data.");
      fetchDashboardData();
    }
  }, [justReconnected, fetchDashboardData]);

  // Listen for force-refresh events strictly from user actions (Claim, Add, Cancel, Feedback)
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('dashboard:force-refresh', () => {
      console.log("[DonorHome] Force refresh event received after user action!");
      // Reset throttle so fetch is allowed
      lastFetchTimeRef.current = 0;
      // Show subtle pull-to-refresh spinner instead of full screen loading
      setRefreshing(true);
      fetchDashboardData();
    });
    
    return () => subscription.remove();
  }, [fetchDashboardData]);

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
    (channelsRef.current || []).forEach(channel => {
      if (channel) supabase.removeChannel(channel);
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
      (channelsRef.current || []).forEach(channel => {
        if (channel) supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    };
  }, [dashboardData?.recentDonations, user]);

  const onRefresh = useCallback(() => {
    lastFetchTimeRef.current = 0; // Force fresh fetch on pull
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleCancelDonation = async (foodID: string) => {
    setLoading(true);
    try {
      // Invalidate food cache so browse food list updates
      invalidateCache();
      await axiosClient.post(API_ENDPOINTS.FOOD.CANCEL_DONATION(foodID));
      lastFetchTimeRef.current = 0; // Force fresh fetch
      DeviceEventEmitter.emit('dashboard:force-refresh');
      fetchDashboardData();
    } catch (error) {
      console.error("Failed to cancel donation", error);
    } finally {
      setLoading(false);
    }
  };



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
        onPress: () => router.push("/(donor)/feedback"),
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



  const totalUnreadMessages = Object.values(unreadCounts || {}).reduce((sum, count) => sum + count, 0);

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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: wp(8) }}>
          <View collapsable={false} ref={tutorial.refs.notificationBell}>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/notifications')}
              style={{ padding: 8, position: "relative" }}
            >
              <View>
                <Bell size={wp(24)} color="#00C853" />
                {(dashboardData?.stats?.unreadNotifications || 0) > 0 && (
                  <View
                    style={{
                      position: "absolute",
                      top: -2,
                      right: -2,
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
              </View>
            </TouchableOpacity>
          </View>
        </View>
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

          <View collapsable={false} ref={tutorial.refs.statsContainer} style={styles.statsContainer}>
            <DashboardStats stats={getStats()} />
          </View>

          <View collapsable={false} ref={tutorial.refs.donateButton}>
            <TouchableOpacity
              style={styles.mainButton}
              onPress={() => router.push("/donate")}>
            <Plus size={wp(24)} color="#fff" style={{ marginRight: wp(8) }} />
            <Text style={styles.mainButtonText}>Donate Food</Text>
          </TouchableOpacity>
          </View>

          <View collapsable={false} ref={tutorial.refs.recentDonations}>
            <RecentItemsList
              items={getRecentItems()}
              role="DONOR"
              onSeeAll={() => router.push("/(donor)/all-recent-donations")}
              onPressCard={(item) => {
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
              }}
              onFeedback={(id) => {
                router.push({
                  pathname: "/(donor)/review-details",
                  params: { disID: id }
                });
              }}
              onCancel={handleCancelDonation}
              chatRef={postClaimTutorial.refs.chatButton}
              statusRef={postClaimTutorial.refs.activeDonation}
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

      {/* Post-Claim Tutorial Overlay */}
      <TutorialOverlay
        steps={postClaimTutorial.steps}
        storageKey={postClaimTutorial.storageKey}
        visible={postClaimTutorial.showTutorial}
        onComplete={postClaimTutorial.handleComplete}
        onSkip={postClaimTutorial.handleSkip}
        targetRefs={postClaimTutorial.refs}
        onStepChange={(step) => {
          console.log('[Post-Claim Tutorial] Step changed to:', step);
        }}
      />
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
