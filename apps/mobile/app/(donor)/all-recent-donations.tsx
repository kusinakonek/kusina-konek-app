import React, { useCallback, useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    Platform,
    Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import axiosClient from "../../src/api/axiosClient";
import { API_ENDPOINTS } from "../../src/api/endpoints";
import { RecentItem } from "../../src/components/RecentItemsList";
import RecentFoodCard from "../../src/components/RecentFoodCard";
import EmptyRecentFood from "../../src/components/EmptyRecentFood";
import { RecentFoodSkeleton } from "../../src/components/SkeletonLoader";
import { useTheme } from "../../context/ThemeContext";
import { wp, hp, fp } from "../../src/utils/responsive";
import CancelDonationModal from "../../src/components/CancelDonationModal";
import { useNetwork } from "../../context/NetworkContext";
import { getCachedDataAnyAge, CACHE_KEYS, cacheData } from "../../src/utils/dataCache";
import { Alert } from "react-native";

export default function AllRecentDonations() {
    const { user } = useAuth();
    const { colors } = useTheme();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [recentDonations, setRecentDonations] = useState<RecentItem[]>([]);
    const { isOnline } = useNetwork();

    // Cancel logic state
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [donationToCancel, setDonationToCancel] = useState<string | null>(null);

    const mapDonations = (data: any[]) => {
        return data.map((d: any) => ({
            id: d.disID || d.id,
            foodID: d.foodID,
            title: d.foodName || "Food Donation",
            quantity: `${d.quantity} servings`,
            location: d.location || "Location",
            time: d.timeAgo || "Recently",
            status: d.status?.toLowerCase(),
            recipientName: d.claimedBy,
            rating: d.rating,
            role: "DONOR" as "DONOR",
            image: d.image || d.food?.image,
        }));
    };

    // Load from cache on mount
    useEffect(() => {
        const loadCache = async () => {
            const cached = await getCachedDataAnyAge(CACHE_KEYS.DONOR_DASHBOARD);
            if (cached && (cached as any).recentDonations) {
                setRecentDonations(mapDonations((cached as any).recentDonations));
                setLoading(false);
            }
        };
        loadCache();
    }, []);

    const fetchRecentDonations = useCallback(async () => {
        if (!user) return;
        if (!isOnline && recentDonations.length > 0) {
            setLoading(false);
            setRefreshing(false);
            return;
        }

        try {
            const response = await axiosClient.get(API_ENDPOINTS.DASHBOARD.DONOR);
            const rawDonations = response.data?.recentDonations || [];
            setRecentDonations(mapDonations(rawDonations));
            await cacheData(CACHE_KEYS.DONOR_DASHBOARD, response.data);
        } catch (error) {
            console.error("Error fetching recent donations:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    useEffect(() => {
        fetchRecentDonations();
    }, [fetchRecentDonations]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchRecentDonations();
    }, [fetchRecentDonations]);

    const handleFeedbackNavigation = (id: string) => {
        router.push({
            pathname: "/(donor)/review-details",
            params: { disID: id },
        });
    };

    const handlePressCard = (item: RecentItem) => {
        if (item.rating) {
            router.push({ pathname: "/(donor)/review-details", params: { disID: item.id } });
        } else {
            router.push({ pathname: "/(donor)/active-details", params: { disID: item.id } });
        }
    };

    const handleCancelDonation = (foodID: string) => {
        setDonationToCancel(foodID);
        setShowCancelModal(true);
    };

    const confirmCancelDonation = async () => {
        if (!donationToCancel) return;
        setLoading(true);
        try {
            await axiosClient.post(API_ENDPOINTS.FOOD.CANCEL_DONATION(donationToCancel));
            await fetchRecentDonations();
        } catch (error: any) {
            console.error("Failed to cancel donation:", error);
            const msg = error.response?.data?.message || "Failed to cancel donation. Please try again.";
            Alert.alert("Error", msg);
            setLoading(false);
        } finally {
            setDonationToCancel(null);
            setShowCancelModal(false);
        }
    };

    const renderItem = ({ item }: { item: RecentItem }) => (
        <RecentFoodCard
            item={item}
            role="DONOR"
            onFeedback={handleFeedbackNavigation}
            onCancel={handleCancelDonation}
            onPressCard={handlePressCard}
        />
    );

    const renderEmpty = () => {
        if (loading) return null;
        return (
            <EmptyRecentFood
                title="No Donations Yet"
                message="You haven't generated any food donations yet. Share your blessings to start building your history!"
                icon="heart"
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
                        My Recent Donations
                    </Text>
                    <Text
                        style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                        Your entire giving history
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
                        data={recentDonations}
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

            <CancelDonationModal
                visible={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onConfirm={confirmCancelDonation}
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
