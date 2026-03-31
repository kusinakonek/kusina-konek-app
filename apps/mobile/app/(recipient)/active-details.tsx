import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, MapPin, User, MessageCircle, Navigation, CheckCircle, Star } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAlert } from '../../context/AlertContext';
import axiosClient from '../../src/api/axiosClient';
import { API_ENDPOINTS } from '../../src/api/endpoints';
import { Distribution } from '../../context/FoodCacheContext';
import FeedbackModal from '../../src/components/FeedbackModal';

export default function ActiveDetailsScreen() {
    const { disID } = useLocalSearchParams<{ disID: string }>();
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const { showAlert } = useAlert();

    const [distribution, setDistribution] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // Feedback Modal State
    const [feedbackVisible, setFeedbackVisible] = useState(false);
    const [submittingFeedback, setSubmittingFeedback] = useState(false);

    const fetchDetails = async () => {
        try {
            const response = await axiosClient.get(API_ENDPOINTS.DISTRIBUTION.GET_BY_ID(disID));
            setDistribution(response.data.distribution);
        } catch (error) {
            console.error("Failed to fetch active details", error);
            showAlert("Error", "Could not load food details.");
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const response = await axiosClient.get(API_ENDPOINTS.MESSAGE.UNREAD_COUNT(disID));
            setUnreadCount(response.data.count || 0);
        } catch (error) {
            console.error("Failed to fetch unread count", error);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [disID]);

    // Refresh unread count when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchUnreadCount();
        }, [disID])
    );

    const handleChat = () => {
        router.push({
            pathname: '/(recipient)/chat',
            params: { disID },
        });
    };

    const handleTrack = () => {
        router.push({
            pathname: '/(recipient)/track/[disID]',
            params: { disID },
        });
    };

    const handleMarkOnTheWay = async () => {
        showAlert("On the Way", "Are you heading to pick up this food now?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Yes, I'm On My Way",
                onPress: async () => {
                    setActionLoading(true);
                    try {
                        await axiosClient.post(API_ENDPOINTS.DISTRIBUTION.ON_THE_WAY(disID));
                        await fetchDetails();
                        handleTrack(); 
                    } catch (error) {
                        console.error("Failed", error);
                        showAlert("Error", "Failed to update status. Please try again.");
                    } finally {
                        setActionLoading(false);
                    }
                },
            },
        ]);
    };

    const handleConfirmReceived = async () => {
        showAlert(
            "Confirm Receipt",
            "Have you successfully received this food?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Yes, Confirm",
                    onPress: async () => {
                        setActionLoading(true);
                        try {
                            await axiosClient.post(API_ENDPOINTS.DISTRIBUTION.COMPLETE(disID));
                            await fetchDetails();
                            setFeedbackVisible(true);
                        } catch (error) {
                            console.error("Failed", error);
                            showAlert("Error", "Failed to confirm. Please try again.");
                        } finally {
                            setActionLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const handleSubmitFeedback = async (rating: number, comment: string, photo: string) => {
        setSubmittingFeedback(true);
        try {
            await axiosClient.post(API_ENDPOINTS.FEEDBACK.CREATE, {
                disID: disID,
                ratingScore: rating,
                comments: comment,
                photoUrl: photo,
            });
            setFeedbackVisible(false);
            showAlert("Thank You!", "Your feedback has been submitted.", undefined, { type: 'success' });
            fetchDetails();
        } catch (error) {
            console.error("Feedback error:", error);
            showAlert("Error", "Failed to submit feedback.");
        } finally {
            setSubmittingFeedback(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </SafeAreaView>
        );
    }

    if (!distribution) return null;

    const food = distribution.food;
    const donor = distribution.donor;
    const donorName = donor?.orgName || `${donor?.firstName ?? ''} ${donor?.lastName ?? ''}`.trim() || "Generous Donor";
    const status = distribution.status.toLowerCase();

    const statusColorMap: Record<string, string> = {
        pending: '#F5F5F5',
        claimed: '#FFF3E0',
        on_the_way: '#E3F2FD',
        completed: '#E8F5E9',
        delivered: '#E8F5E9',
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
            <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Active Order Details</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Image 
                    source={food?.image ? { uri: food.image } : require('../../assets/KusinaKonek-Logo.png')} 
                    style={styles.foodImage}
                />

                <View style={styles.detailsContainer}>
                    <Text style={[styles.foodName, { color: colors.text }]}>{food?.foodName}</Text>
                    <Text style={[styles.servingsText, { color: colors.textSecondary }]}>{distribution.quantity} Servings Requested</Text>

                    <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.infoRow}>
                            <User size={20} color={colors.primary} />
                            <Text style={[styles.infoText, { color: colors.text }]}>Donor: <Text style={{fontWeight:'bold'}}>{donorName}</Text></Text>
                        </View>
                        <View style={styles.infoRow}>
                            <MapPin size={20} color={colors.primary} />
                            <Text style={[styles.infoText, { color: colors.text, flex: 1 }]}>{distribution.location?.barangay || distribution.location?.streetAddress || "Location Unavailable"}</Text>
                        </View>
                        <View style={styles.statusRow}>
                            <View style={[styles.statusBadge, { backgroundColor: statusColorMap[status] || '#F5F5F5' }]}>
                                <Text style={styles.statusText}>{status.toUpperCase()}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Action Panel based on status */}
                    <View style={styles.actionPanel}>
                        {status === 'pending' && (
                            <Text style={[styles.waitingText, { color: colors.textSecondary }]}>Waiting for donor to approve your claim.</Text>
                        )}

                        {status === 'claimed' && (
                            <TouchableOpacity 
                                style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
                                onPress={handleMarkOnTheWay}
                                disabled={actionLoading}
                            >
                                <Text style={styles.actionButtonText}>🚶 I'm On My Way</Text>
                            </TouchableOpacity>
                        )}

                        {status === 'on_the_way' && (
                            <View style={styles.dualActions}>
                                <TouchableOpacity 
                                    style={[styles.actionButtonHalf, { backgroundColor: '#1877F2' }]}
                                    onPress={handleTrack}
                                >
                                    <Navigation size={20} color="#fff" />
                                    <Text style={styles.actionButtonTextInside}>Track Route</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    style={[styles.actionButtonHalf, { backgroundColor: '#4CAF50' }]}
                                    onPress={handleConfirmReceived}
                                    disabled={actionLoading}
                                >
                                    <CheckCircle size={20} color="#fff" />
                                    <Text style={styles.actionButtonTextInside}>Received</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {(status === 'completed' || status === 'delivered') && !distribution.review && (
                            <TouchableOpacity 
                                style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                                onPress={() => setFeedbackVisible(true)}
                                disabled={actionLoading}
                            >
                                <Star size={20} color="#fff" />
                                <Text style={styles.actionButtonText}> Give Feedback</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Floating Chat Button */}
            <TouchableOpacity 
                style={[styles.chatButton, { backgroundColor: '#00C853' }]} 
                onPress={handleChat}
            >
                <MessageCircle size={28} color="#fff" />
                {unreadCount > 0 && (
                    <View style={styles.chatBadge}>
                        <Text style={styles.chatBadgeText}>
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>

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
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
    },
    backButton: { width: 44, height: 44, justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    scrollContent: { paddingBottom: 100 },
    foodImage: { width: '100%', height: 250, resizeMode: 'cover' },
    detailsContainer: { padding: 20 },
    foodName: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
    servingsText: { fontSize: 16, marginBottom: 20 },
    infoCard: {
        padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 24, gap: 12
    },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    infoText: { fontSize: 15 },
    statusRow: { marginTop: 8, flexDirection: 'row' },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    statusText: { fontSize: 12, fontWeight: '700', color: '#333' },
    actionPanel: { gap: 12 },
    actionButton: {
        flexDirection: 'row', padding: 16, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
    },
    actionButtonText: { color: '#fff', fontSize: 16, fontWeight: '700', marginLeft: 8 },
    waitingText: { textAlign: 'center', fontSize: 15, fontStyle: 'italic', marginTop: 10 },
    dualActions: { flexDirection: 'row', gap: 12 },
    actionButtonHalf: {
        flex: 1, flexDirection: 'row', padding: 14, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center', gap: 6,
    },
    actionButtonTextInside: { color: '#fff', fontSize: 14, fontWeight: '700' },
    chatButton: {
        position: 'absolute', bottom: 30, right: 20,
        width: 60, height: 60, borderRadius: 30,
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
    },
    chatBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#F44336',
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
        borderWidth: 2,
        borderColor: '#fff',
    },
    chatBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    }
});
