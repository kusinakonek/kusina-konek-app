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
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import axiosClient from "../api/axiosClient";
import { API_ENDPOINTS } from "../api/endpoints";
import { RecentItemsList, RecentItem } from "../components/RecentItemsList";
import EmptyRecentFood from "../components/EmptyRecentFood";
import { Package, MapPin, Utensils, Search, Bell } from "lucide-react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { wp, hp, fp } from "../utils/responsive";
import LoadingScreen from "../components/LoadingScreen";
import { RecentFoodSkeleton } from "../components/SkeletonLoader";
import { useTheme } from "../../context/ThemeContext";
import FeedbackModal from "../components/FeedbackModal";
import { useAlert } from "../../context/AlertContext";
import { usePushNotifications } from "../hooks/usePushNotifications";

export default function RecipientHome() {
  const { user } = useAuth();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { showAlert } = useAlert();
  const { notification } = usePushNotifications();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Feedback Modal State
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [selectedDisID, setSelectedDisID] = useState<string | null>(null);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

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

  // Handle auto-refresh when a notification is received
  useEffect(() => {
    if (notification) {
      console.log("[RecipientHome] Notification received, auto-refreshing stats...");
      fetchDashboardData();
    }
  }, [notification, fetchDashboardData]);

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
    showAlert(
      "Confirm Receipt",
      "Have you successfully received this food?",
      [
        { text: "Cancel", style: "cancel" },
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
      ],
      { type: 'warning' }
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
                { type: 'info' }
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
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/notifications")}
          style={{ padding: 8, position: "relative" }}>
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
              <Text style={styles.greenText}>ULAM</Text>.
            </Text>
          </View>
        </View>

        {/* Hero Banner */}
        <View style={styles.heroContainer}>
          <ImageBackground
            source={require("../../assets/homepage-header.png")}
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

        {/* Browse Food Button */}
        <TouchableOpacity
          style={styles.mainButton}
          onPress={() => router.push("/(recipient)/browse-food")}>
          <Search size={wp(24)} color="#fff" style={{ marginRight: wp(8) }} />
          <Text style={styles.mainButtonText}>Browse Food</Text>
        </TouchableOpacity>

        {/* Recent Food */}
        {loading && !refreshing ? (
          <RecentFoodSkeleton count={3} />
        ) : getRecentItems().length > 0 ? (
          <RecentItemsList
            items={getRecentItems().slice(0, 4)}
            role="RECIPIENT"
            onSeeAll={() => router.push("/(recipient)/all-recent-foods")}
            onConfirm={handleConfirmDonation}
            onMarkOnTheWay={handleMarkOnTheWay}
            onFeedback={handleFeedback}
          />
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
