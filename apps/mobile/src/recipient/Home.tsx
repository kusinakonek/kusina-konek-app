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
  Platform,
  Linking,
  DeviceEventEmitter,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import axiosClient from "../api/axiosClient";
import { API_ENDPOINTS } from "../api/endpoints";
import { RecentItemsList, RecentItem } from "../components/RecentItemsList";
import EmptyRecentFood from "../components/EmptyRecentFood";
import { Package, MapPin, Utensils, Search, Bell, MessageCircle } from "lucide-react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { wp, hp, fp } from "../utils/responsive";
import LoadingScreen from "../components/LoadingScreen";
import { RecentFoodSkeleton } from "../components/SkeletonLoader";
import { useTheme } from "../../context/ThemeContext";
import FeedbackModal from "../components/FeedbackModal";
import { useAlert } from "../../context/AlertContext";
import { useNetwork } from "../../context/NetworkContext";
import { cacheData, getCachedDataAnyAge, CACHE_KEYS } from "../utils/dataCache";
import TutorialOverlay, { TUTORIAL_STORAGE_KEYS } from "../components/TutorialOverlay";
import { useTutorial } from "../hooks/useTutorial";
import { RECIPIENT_HOME_STEPS, RECIPIENT_POST_CLAIM_STEPS } from "../hooks/tutorialSteps";

export default function RecipientHome() {
  const { user } = useAuth();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { showAlert } = useAlert();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const channelsRef = useRef<any[]>([]);
  const { isOnline, justReconnected } = useNetwork();
  const dashboardDataRef = useRef<any>(null);
  const isOnlineRef = useRef(isOnline);
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);

  // Feedback Modal State
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [selectedDisID, setSelectedDisID] = useState<string | null>(null);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  // Tutorial - only show when dashboard data is loaded
  const tutorial = useTutorial({
    steps: RECIPIENT_HOME_STEPS,
    storageKey: TUTORIAL_STORAGE_KEYS.RECIPIENT_HOME,
    enabled: !loading && dashboardData !== null,
  });

  // New Feature Tutorial: Post-Claim Messaging
  const postClaimTutorial = useTutorial({
    steps: RECIPIENT_POST_CLAIM_STEPS,
    storageKey: TUTORIAL_STORAGE_KEYS.RECIPIENT_POST_CLAIM,
    enabled: !loading && dashboardData?.recentFoods?.some((f: any) => f.status?.toUpperCase() === "CLAIMED" || f.status?.toUpperCase() === "ON_THE_WAY"),
  });

  // Keep refs in sync with latest state
  useEffect(() => { isOnlineRef.current = isOnline; }, [isOnline]);

  // Load from cache on mount for instant UI
  useEffect(() => {
    const loadCache = async () => {
      const cached = await getCachedDataAnyAge(CACHE_KEYS.RECIPIENT_DASHBOARD);
      if (cached && !dashboardDataRef.current) {
        setDashboardData(cached);
        dashboardDataRef.current = cached;
        setLoading(false);
      }
    };
    loadCache();
  }, []);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    // Prevent concurrent fetches
    if (isFetchingRef.current) return;

    if (!isOnlineRef.current && dashboardDataRef.current) {
       setLoading(false);
       setRefreshing(false);
       return;
    }

    // Prevent fetching if we just fetched within exactly 30 seconds
    const now = Date.now();
    if (dashboardDataRef.current && (now - lastFetchTimeRef.current < 30000)) {
       setLoading(false);
       setRefreshing(false);
       return;
    }

    isFetchingRef.current = true;
    try {
      const response = await axiosClient.get(API_ENDPOINTS.DASHBOARD.RECIPIENT);
      setDashboardData(response.data);
      dashboardDataRef.current = response.data;
      await cacheData(CACHE_KEYS.RECIPIENT_DASHBOARD, response.data);
      
      const distributions = response.data?.recentFoods || [];
      const counts: Record<string, number> = {};
      
      for (const f of distributions) {
        if (f.disID || f.id) {
          counts[f.disID || f.id] = f.unreadMessages || 0;
        }
      }
      
      setUnreadCounts(counts);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      lastFetchTimeRef.current = Date.now();
      setLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  }, [user]); // Only depends on user - no dashboardData/isOnline to prevent infinite loop

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);
  
  // Handle reconnect auto-refresh
  useEffect(() => {
    if (justReconnected) {
      console.log("[RecipientHome] Reconnected, refreshing dashboard...");
      fetchDashboardData();
    }
  }, [justReconnected, fetchDashboardData]);

  // Listen for force-refresh events strictly from user actions (Claim, Add, Cancel, Feedback)
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('dashboard:force-refresh', () => {
      console.log("[RecipientHome] Force refresh event received after user action!");
      // Reset throttle so fetch is allowed
      lastFetchTimeRef.current = 0;
      // Show subtle pull-to-refresh spinner instead of full screen loading
      setRefreshing(true);
      fetchDashboardData();
    });
    
    return () => subscription.remove();
  }, [fetchDashboardData]);

  // Refetch full dashboard data whenever the screen comes into focus
  // This ensures cancelled/updated donations reflect immediately
  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [fetchDashboardData]),
  );

  // Listen for real-time message read events
  useEffect(() => {
    if (!dashboardData?.recentFoods || !user) return;

    // Clean up old channels
    (channelsRef.current || []).forEach(channel => {
      if (channel) supabase.removeChannel(channel);
    });
    channelsRef.current = [];

    // Subscribe to each distribution's chat channel
    const distributions = dashboardData.recentFoods || [];
    distributions.forEach((f: any) => {
      const disID = f.disID || f.id;
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
  }, [dashboardData?.recentFoods, user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getRecentItems = (): RecentItem[] => {
    return (dashboardData?.recentFoods || []).map((f: any) => {
      const disID = f.disID || f.id;
      return {
        id: disID,
        title: f.foodName,
        quantity: `${f.quantity} servings`,
        location: f.location,
        time: f.timeAgo,
        // Map API status values to UI status values
        status: (() => {
          switch (f.status?.toUpperCase()) {
            case "PENDING":
              return "pending";
            case "CLAIMED":
              return "claimed";
            case "ON_THE_WAY":
              return "on-the-way";
            case "COMPLETED":
              return "completed";
            case "DELIVERED":
              return "completed";
            default:
              return f.status?.toLowerCase();
          }
        })() as RecentItem["status"],
        rating: f.myRating,
        showFeedback: f.canGiveFeedback,
        latitude: f.latitude ?? null,
        longitude: f.longitude ?? null,
        image: f.image || null,
        unreadMessages: unreadCounts[disID] || 0,
      };
    });
  };

  const userName =
    user?.user_metadata?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "there";

  const totalUnreadMessages = Object.values(unreadCounts || {}).reduce((sum, count) => sum + count, 0);

  if (loading && !refreshing) {
    return <LoadingScreen message="Loading dashboard..." />;
  }

  const handleConfirmDonation = async (id: string) => {
    showAlert(
      "Confirm Receipt",
      "Have you successfully received this food?",
      [
        {
          text: "Yes, Confirm",
          style: "default",
          onPress: async () => {
            setLoading(true);
            try {
              await axiosClient.post(API_ENDPOINTS.DISTRIBUTION.COMPLETE(id));
              // Don't show success alert yet, show Feedback Modal instead
              setSelectedDisID(id);
              setFeedbackVisible(true);
            } catch (error) {
              console.error("Failed to confirm donation", error);
              showAlert("Error", "Failed to confirm. Please try again.");
              setLoading(false);
            } finally {
              // Only stop loading if we are NOT showing the modal (error case)
              // If success, we keep loading state or just handle it?
              // Actually, we want to hide global loading and show modal.
              setLoading(false);
            }
          },
        },
        { text: "Cancel", style: "cancel" },
      ],
      { type: 'warning', stackButtons: true }
    );
  };

  const handleSubmitFeedback = async (
    rating: number,
    comment: string,
    photo: string,
  ) => {
    if (!selectedDisID) return;

    setSubmittingFeedback(true);
    try {
      await axiosClient.post(API_ENDPOINTS.FEEDBACK.CREATE, {
        disID: selectedDisID,
        ratingScore: rating,
        comments: comment,
        photoUrl: photo,
      });

      setFeedbackVisible(false);
      showAlert("Thank You!", "Your feedback has been submitted.", undefined, { type: 'success' });
      lastFetchTimeRef.current = 0; // Force fresh fetch
      DeviceEventEmitter.emit('dashboard:force-refresh');
      fetchDashboardData();
      setSelectedDisID(null);
    } catch (error) {
      console.error("Feedback submit error:", error);
      showAlert("Error", "Failed to submit feedback. Please try again.", undefined, { type: 'error' });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleMarkOnTheWay = async (id: string) => {
    showAlert("On the Way", "Are you heading to pick up this food now?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes, I'm On My Way",
        style: "default",
        onPress: async () => {
          setLoading(true);
          try {
            await axiosClient.post(API_ENDPOINTS.DISTRIBUTION.ON_THE_WAY(id));
            lastFetchTimeRef.current = 0; // Force immediate refresh
            DeviceEventEmitter.emit('dashboard:force-refresh');
            fetchDashboardData();

            // Find the item's lat/lng and open navigation
            const item = getRecentItems().find((i) => i.id === id);
            if (
              item?.latitude != null &&
              item?.longitude != null &&
              item.latitude !== 0 &&
              item.longitude !== 0
            ) {
              const lat = item.latitude;
              const lng = item.longitude;
              const url = Platform.select({
                ios: `maps://app?daddr=${lat},${lng}`,
                android: `google.navigation:q=${lat},${lng}`,
                default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
              });
              showAlert(
                "Navigate to Pickup",
                "The donor has been notified. Open maps for directions?",
                [
                  { text: "Not Now", style: "cancel" },
                  {
                    text: "Open Maps",
                    style: "default",
                    onPress: () => {
                      Linking.openURL(url!).catch(() =>
                        Linking.openURL(
                          `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
                        ),
                      );
                    },
                  },
                ],
                { type: 'info', stackButtons: true }
              );
            } else {
              showAlert(
                "Great!",
                "The donor has been notified you're on your way.",
                undefined,
                { type: 'success' }
              );
            }
          } catch (error) {
            console.error("Failed to mark on the way", error);
            showAlert("Error", "Failed to update status. Please try again.", undefined, { type: 'error' });
          } finally {
            setLoading(false);
          }
        },
      },
    ], { type: 'info' });
  };

  const handleFeedback = (id: string) => {
    setSelectedDisID(id);
    setFeedbackVisible(true);
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top"]}>
      <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
        <View style={styles.headerLeft}>
          <Image
            source={require("../../assets/KUSINAKONEK-NEW-LOGO.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <View>
            <Text style={[styles.appName, { color: colors.text }]}>
              KusinaKonek
            </Text>
            <Text
              style={[styles.dashboardTitle, { color: colors.textSecondary }]}>
              Recipient Dashboard
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: wp(8) }}>
          <View collapsable={false} ref={tutorial.refs.notificationBell}>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/notifications")}
              style={{ padding: 8, position: "relative" }}>
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
          <View
            style={[
              styles.greetingAvatar,
              { backgroundColor: isDark ? "#1a3a1a" : "#E8F5E9" },
            ]}>
            <Text style={styles.greetingAvatarText}>
              {userName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={[styles.greetingName, { color: colors.text }]}>
              Hi {userName}!
            </Text>
            <Text
              style={[
                styles.greetingSubtitle,
                { color: colors.textSecondary },
              ]}>
              Discover bunch of different free{" "}
              <Text style={styles.greenText}>food</Text>.
            </Text>
          </View>
        </View>

        {/* Hero Banner */}
        <View style={styles.heroContainer}>
          <ImageBackground
            source={require("../../assets/recipient-hero-banner.png")}
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
        <View collapsable={false} ref={tutorial.refs.statsCard}>
          <View
            style={[
              styles.recipientStatsCard,
              {
                backgroundColor: colors.primaryLight,
                borderColor: colors.border,
              },
            ]}>
          <View style={styles.recipientStatsIconContainer}>
            <Package size={wp(48)} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.recipientStatsValue, { color: colors.text }]}>
              {dashboardData?.stats?.availableFoods || 0}
            </Text>
            <Text style={[styles.recipientStatsLabel, { color: colors.text }]}>
              Available Foods
            </Text>
            <View style={styles.recipientStatsMeta}>
              <MapPin size={wp(12)} color="#00C853" />
              <Text
                style={[
                  styles.recipientStatsMetaText,
                  { color: colors.textSecondary },
                ]}>
                {dashboardData?.stats?.locations || 0} locations
              </Text>
              <Text
                style={[
                  styles.recipientStatsMetaDot,
                  { color: colors.textTertiary },
                ]}>
                •
              </Text>
              <Utensils size={wp(12)} color={colors.primary} />
              <Text
                style={[
                  styles.recipientStatsMetaText,
                  { color: colors.textSecondary },
                ]}>
                {dashboardData?.stats?.totalServings || 0}+ servings
              </Text>
            </View>
          </View>
        </View>
        </View>

        {/* Browse Food Button */}
        <View collapsable={false} ref={tutorial.refs.browseButton}>
          <TouchableOpacity
            style={styles.mainButton}
            onPress={() => router.push("/(recipient)/browse-food")}>
            <Search size={wp(24)} color="#fff" style={{ marginRight: wp(8) }} />
            <Text style={styles.mainButtonText}>Browse Food</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Food */}
        {loading && !refreshing ? (
          <RecentFoodSkeleton count={3} />
        ) : getRecentItems().length > 0 ? (
          <View collapsable={false} ref={tutorial.refs.recentFoods}>
            <RecentItemsList
            items={getRecentItems().slice(0, 4)}
            role="RECIPIENT"
            onSeeAll={() => router.push("/(recipient)/all-recent-foods")}
            onConfirm={handleConfirmDonation}
            onMarkOnTheWay={handleMarkOnTheWay}
            onFeedback={handleFeedback}
            onPressCard={(item) => router.push({
              pathname: '/(recipient)/active-details',
              params: { disID: item.id }
            })}
            chatRef={postClaimTutorial.refs.chatButton}
            statusRef={postClaimTutorial.refs.statusBadge}
            navigateRef={postClaimTutorial.refs.navigateButton}
          />
          </View>
        ) : (
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                My Recent Food
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(recipient)/all-recent-foods")}>
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

      {/* Feedback Modal */}
      <FeedbackModal
        visible={feedbackVisible}
        onClose={() => setFeedbackVisible(false)}
        onSubmit={handleSubmitFeedback}
        isSubmitting={submittingFeedback}
      />

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
