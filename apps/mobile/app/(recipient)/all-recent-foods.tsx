import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Pressable } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import axiosClient from "../../src/api/axiosClient";
import { API_ENDPOINTS } from "../../src/api/endpoints";
import { RecentItem } from "../../src/components/RecentItemsList";
import RecentFoodCard from "../../src/components/RecentFoodCard";
import EmptyRecentFood from "../../src/components/EmptyRecentFood";
import { RecentFoodSkeleton } from "../../src/components/SkeletonLoader";
import FeedbackModal from "../../src/components/FeedbackModal";
import { useTheme } from "../../context/ThemeContext";
import { wp, hp, fp } from "../../src/utils/responsive";

export default function AllRecentFoods() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentFoods, setRecentFoods] = useState<RecentItem[]>([]);

  // Feedback Modal State
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [selectedDisID, setSelectedDisID] = useState<string | null>(null);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const fetchRecentFoods = useCallback(async () => {
    if (!user) return;
    try {
      const response = await axiosClient.get(API_ENDPOINTS.DASHBOARD.RECIPIENT);
      const foods = (response.data?.recentFoods || []).map((f: any) => ({
        id: f.disID || f.id,
        title: f.foodName,
        quantity: `${f.quantity} servings`,
        location: f.location,
        time: f.timeAgo,
        status: (() => {
          switch (f.status?.toUpperCase()) {
            case "PENDING":
              return "pending";
            case "CLAIMED":
              return "claimed";
            case "ON_THE_WAY":
              return "on-the-way";
            case "COMPLETED":
            case "DELIVERED":
              return "completed";
            default:
              return f.status?.toLowerCase();
          }
        })() as RecentItem["status"],
        rating: f.myRating,
        showFeedback: f.canGiveFeedback,
      }));
      setRecentFoods(foods);
    } catch (error) {
      console.error("Error fetching recent foods:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRecentFoods();
  }, [fetchRecentFoods]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRecentFoods();
  }, [fetchRecentFoods]);

  const handleConfirmDonation = async (id: string) => {
    Alert.alert(
      "Confirm Receipt",
      "Have you successfully received this food?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Confirm",
          onPress: async () => {
            try {
              await axiosClient.post(API_ENDPOINTS.DISTRIBUTION.COMPLETE(id));
              setSelectedDisID(id);
              setFeedbackVisible(true);
            } catch (error) {
              console.error("Failed to confirm donation", error);
              Alert.alert("Error", "Failed to confirm. Please try again.");
            }
          },
        },
      ],
    );
  };

  const handleMarkOnTheWay = async (id: string) => {
    Alert.alert("On the Way", "Are you heading to pick up this food now?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes, I'm On My Way",
        onPress: async () => {
          try {
            await axiosClient.post(API_ENDPOINTS.DISTRIBUTION.ON_THE_WAY(id));
            fetchRecentFoods();
            Alert.alert(
              "Great!",
              "The donor has been notified you're on your way.",
            );
          } catch (error) {
            console.error("Failed to mark on the way", error);
            Alert.alert("Error", "Failed to update status. Please try again.");
          }
        },
      },
    ]);
  };

  const handleFeedback = (id: string) => {
    setSelectedDisID(id);
    setFeedbackVisible(true);
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
      Alert.alert("Thank You!", "Your feedback has been submitted.");
      fetchRecentFoods();
      setSelectedDisID(null);
    } catch (error) {
      console.error("Feedback submit error:", error);
      Alert.alert("Error", "Failed to submit feedback. Please try again.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const renderItem = ({ item }: { item: RecentItem }) => (
    <RecentFoodCard
      item={item}
      role="RECIPIENT"
      onConfirm={handleConfirmDonation}
      onMarkOnTheWay={handleMarkOnTheWay}
      onFeedback={handleFeedback}
    />
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <EmptyRecentFood
        title="No Food Requests Yet"
        message="You haven't requested any food yet. Start browsing available food donations in your area and make your first request!"
        icon="package"
      />
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top"]}>
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
            My Recent Food
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            All requested foods
          </Text>
        </View>
        <View style={{ width: wp(44) }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading && !refreshing ? (
          <RecentFoodSkeleton count={5} />
        ) : (
          <FlatList
            data={recentFoods}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListEmptyComponent={renderEmpty}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#00C853"]}
                tintColor="#00C853"
              />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

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
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: wp(16),
    paddingVertical: hp(8),
    borderBottomWidth: 1,
  },
  backButton: {
    width: wp(44),
    height: wp(44),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: wp(12),
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: wp(8),
  },
  headerTitle: {
    fontSize: fp(20),
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: fp(13),
    marginTop: hp(1),
  },
  content: {
    flex: 1,
    paddingHorizontal: wp(16),
    paddingTop: hp(16),
  },
  listContent: {
    gap: 16,
    paddingBottom: Platform.OS === "ios" ? hp(40) : hp(24),
  },
});
