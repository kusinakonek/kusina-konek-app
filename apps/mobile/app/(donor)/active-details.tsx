import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, DeviceEventEmitter } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, MapPin, User, MessageCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAlert } from '../../context/AlertContext';
import axiosClient from '../../src/api/axiosClient';
import { API_ENDPOINTS } from '../../src/api/endpoints';
import CancelDonationModal from '../../src/components/CancelDonationModal';

export default function DonorActiveDetailsScreen() {
    const { disID } = useLocalSearchParams<{ disID: string }>();
    const router = useRouter();
    const { colors } = useTheme();
    const { showAlert } = useAlert();

    const [distribution, setDistribution] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    const fetchDetails = async () => {
        try {
            const response = await axiosClient.get(API_ENDPOINTS.DISTRIBUTION.GET_BY_ID(disID));
            setDistribution(response.data.distribution);
        } catch (error) {
            console.error("Failed to fetch donor active details", error);
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
            pathname: '/(donor)/chat',
            params: { disID },
        });
    };

    const handleCancelDonation = async () => {
        if (!distribution?.food?.foodID) return;
        setCancelling(true);
        try {
            await axiosClient.post(API_ENDPOINTS.FOOD.CANCEL_DONATION(distribution.food.foodID));
            showAlert("Success", "Donation has been cancelled.");
            DeviceEventEmitter.emit('dashboard:force-refresh');
            router.back();
        } catch (error: any) {
            console.error("Failed to cancel donation:", error);
            const msg = error.response?.data?.message || "Failed to cancel donation. Please try again.";
            Alert.alert("Error", msg);
        } finally {
            setCancelling(false);
            setShowCancelModal(false);
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
    const recipient = distribution.recipient;
    const recipientName = recipient ? `${recipient.firstName ?? ''} ${recipient.lastName ?? ''}`.trim() || recipient.email : null;
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
                <Text style={[styles.headerTitle, { color: colors.text }]}>Food Details</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Image 
                    source={food?.image ? { uri: food.image } : require('../../assets/KusinaKonek-Logo.png')} 
                    style={styles.foodImage}
                />

                <View style={styles.detailsContainer}>
                    <Text style={[styles.foodName, { color: colors.text }]}>{food?.foodName}</Text>
                    <Text style={[styles.servingsText, { color: colors.textSecondary }]}>{distribution.quantity} Servings Offered</Text>

                    <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.infoRow}>
                            <MapPin size={20} color={colors.primary} />
                            <Text style={[styles.infoText, { color: colors.text, flex: 1 }]}>Drop-off: {distribution.location?.barangay || distribution.location?.streetAddress || "Location Unavailable"}</Text>
                        </View>
                        
                        {recipientName && (
                            <View style={styles.infoRow}>
                                <User size={20} color={colors.primary} />
                                <Text style={[styles.infoText, { color: colors.text }]}>Claimed by: <Text style={{fontWeight:'bold'}}>{recipientName}</Text></Text>
                            </View>
                        )}

                        <View style={styles.statusRow}>
                            <View style={[styles.statusBadge, { backgroundColor: statusColorMap[status] || '#F5F5F5' }]}>
                                <Text style={styles.statusText}>{status.toUpperCase()}</Text>
                            </View>
                        </View>
                    </View>

                    <Text style={[styles.waitingText, { color: colors.textSecondary }]}>
                        {status === 'pending' ? "Waiting for a recipient to claim your food." : 
                         status === 'completed' ? "This donation is completed. Waiting for the recipient to provide a rating and feedback!" :
                         "This food is currently active and belongs to the claimed recipient."}
                    </Text>

                    {/* Cancel Button - only show for pending donations */}
                    {status === 'pending' && (
                        <TouchableOpacity
                            style={styles.cancelDonationButton}
                            onPress={() => setShowCancelModal(true)}
                            disabled={cancelling}
                        >
                            <Text style={styles.cancelDonationText}>
                                {cancelling ? 'Cancelling...' : 'Cancel Donation'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>

            {/* Floating Chat Button: Only visible if someone has claimed it */}
            {recipient && (
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
            )}

            <CancelDonationModal
                visible={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onConfirm={handleCancelDonation}
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
    waitingText: { textAlign: 'center', fontSize: 15, fontStyle: 'italic', marginTop: 10 },
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
    },
    cancelDonationButton: {
        marginTop: 24,
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#e53935',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelDonationText: {
        color: '#e53935',
        fontSize: 16,
        fontWeight: '600',
    },
});
