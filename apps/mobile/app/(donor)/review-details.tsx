import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Star, MapPin, Calendar, User, MessageCircle } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { wp, hp, fp } from '../../src/utils/responsive';
import axiosClient from '../../src/api/axiosClient';
import LoadingScreen from '../../src/components/LoadingScreen';
// We might need an endpoint to get specific feedback by ID if we don't pass all data
// For now, let's assume we might need to fetch if only ID is passed.
// But the endpoints.ts only has LIST_RECEIVED. 
// However, RecentItem might not have the full feedback object.
// Let's implement a fetch if needed, or rely on passing data.
// Wait, the user requirement says "use the same method you use in he feedback page".
// The feedback page has the full object.
// But RecentItemsList only has summary data. 
// We should probably add an endpoint to get a single feedback or distribution detail.
// Or we can just use the distribution ID to find the feedback?
// Let's assume we pass what we have, and if we lack data, we might need to fetch.
// Actually, for "RecentItemsList", we have `id` which is `disID` (distribution ID).
// The Feedback endpoint `LIST_FOR_DISTRIBUTION` exists: `/feedback/distribution/:disID`.
// So if we come from RecentItemsList, we have `disID`. We can fetch the feedback for that distribution.

import { API_ENDPOINTS } from '../../src/api/endpoints';

export default function ReviewDetailsScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const params = useLocalSearchParams();
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState<any>(null);

    const itemParam =
        typeof params.item === 'string'
            ? params.item
            : Array.isArray(params.item)
                ? params.item[0]
                : undefined;

    const disIDParam =
        typeof params.disID === 'string'
            ? params.disID
            : Array.isArray(params.disID)
                ? params.disID[0]
                : undefined;

    useEffect(() => {
        // IMPORTANT: do NOT depend on the whole `params` object.
        // `useLocalSearchParams()` returns a new object frequently,
        // and this effect sets state, which can cause an infinite render loop.
        let cancelled = false;

        const loadData = async () => {
            setLoading(true);
            try {
                if (itemParam) {
                    const parsedItem = JSON.parse(itemParam);
                    if (!cancelled) setFeedback(parsedItem);
                    return;
                }

                if (disIDParam) {
                    const response = await axiosClient.get(
                        API_ENDPOINTS.FEEDBACK.LIST_FOR_DISTRIBUTION(disIDParam),
                    );
                    const data = response.data.feedbacks;
                    if (!cancelled) setFeedback(data && data.length > 0 ? data[0] : null);
                    return;
                }

                if (!cancelled) setFeedback(null);
            } catch (error) {
                console.error('Error loading review details:', error);
                if (!cancelled) setFeedback(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadData();

        return () => {
            cancelled = true;
        };
    }, [itemParam, disIDParam]);

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Review Details</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.centerContent}>
                    <LoadingScreen message="Loading review details..." />
                </View>
            </SafeAreaView>
        );
    }

    if (!feedback) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Review Details</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.centerContent}>
                    <Text style={{ color: colors.text }}>Review not found.</Text>
                </View>
            </SafeAreaView>
        );
    }

    const { distribution, ratingScore, comments, timestamp, recipient } = feedback;
    const food = distribution?.food;
    const location = distribution?.location;
    // Recipient might be nested in distribution or on root depending on query include
    const recipientUser = feedback.recipient || distribution?.recipient;

    const handleChat = () => {
        const id = disIDParam || feedback?.disID || distribution?.id;
        if (!id) return;
        router.push({
            pathname: '/(donor)/chat',
            params: { disID: id },
        });
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Review Details</Text>
                <TouchableOpacity onPress={handleChat} style={styles.backButton}>
                    <MessageCircle size={24} color="#00C853" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Proof / Food Image */}
                <View style={styles.imageContainer}>
                    {food?.image ? (
                        <Image source={{ uri: food.image }} style={styles.mainImage} resizeMode="cover" />
                    ) : (
                        <View style={[styles.placeholderImage, { backgroundColor: colors.border }]}>
                            <Text style={{ color: colors.textSecondary }}>No Image Available</Text>
                        </View>
                    )}
                    <View style={styles.ratingBadge}>
                        <Star size={16} color="#FFF" fill="#FFF" />
                        <Text style={styles.ratingBadgeText}>{ratingScore?.toFixed(1)}</Text>
                    </View>
                </View>

                {/* Header Info */}
                <View style={styles.infoSection}>
                    <Text style={[styles.foodName, { color: colors.text }]}>{food?.foodName || "Food Donation"}</Text>

                    <View style={styles.row}>
                        <Calendar size={14} color={colors.textSecondary} />
                        <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                            {new Date(timestamp).toLocaleDateString()} • {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>

                    {location && (
                        <View style={styles.row}>
                            <MapPin size={14} color={colors.textSecondary} />
                            <Text style={[styles.locationText, { color: colors.textSecondary }]}>{location.streetAddress || "Location"}</Text>
                        </View>
                    )}
                </View>

                {/* Recipient Info */}
                <View style={[styles.recipientCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.recipientRow}>
                        <View style={[styles.avatar, { backgroundColor: '#E0E0E0' }]}>
                            <User size={24} color="#757575" />
                        </View>
                        <View>
                            <Text style={[styles.recipientLabel, { color: colors.textSecondary }]}>Reviewed by</Text>
                            <Text style={[styles.recipientName, { color: colors.text }]}>
                                {recipientUser?.firstName} {recipientUser?.lastName}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Review Comment */}
                <View style={[styles.commentSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.commentTitle, { color: colors.text }]}>Feedback</Text>
                    <Text style={[styles.commentText, { color: colors.text }]}>
                        {comments || "No comments provided."}
                    </Text>
                </View>

                {/* Photo Proof if needed? The user said "image that came from recipient". 
                    Usually this is distribution photoProof or feedback photoUrl.
                    Let's check schema. Feedback has `photoUrl`.
                 */}
                {feedback.photoUrl && (
                    <View style={styles.proofSection}>
                        <Text style={[styles.sectionHeader, { color: colors.text }]}>Attached Photo</Text>
                        <Image source={{ uri: feedback.photoUrl }} style={styles.proofImage} resizeMode="cover" />
                    </View>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(16),
        paddingVertical: hp(12),
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: fp(18),
        fontWeight: 'bold',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        paddingBottom: hp(40),
    },
    imageContainer: {
        width: '100%',
        height: hp(250),
        position: 'relative',
    },
    mainImage: {
        width: '100%',
        height: '100%',
    },
    placeholderImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    ratingBadge: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        backgroundColor: '#00C853',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 4,
        elevation: 4,
    },
    ratingBadgeText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: fp(16),
    },
    infoSection: {
        padding: wp(20),
        gap: 8,
    },
    foodName: {
        fontSize: fp(24),
        fontWeight: 'bold',
        marginBottom: 4,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dateText: {
        fontSize: fp(14),
    },
    locationText: {
        fontSize: fp(14),
    },
    recipientCard: {
        marginHorizontal: wp(20),
        marginBottom: hp(20),
        padding: wp(16),
        borderRadius: wp(12),
        borderWidth: 1,
    },
    recipientRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    recipientLabel: {
        fontSize: fp(12),
    },
    recipientName: {
        fontSize: fp(16),
        fontWeight: '600',
    },
    commentSection: {
        marginHorizontal: wp(20),
        padding: wp(20),
        borderRadius: wp(16),
        borderWidth: 1,
        marginBottom: hp(20),
    },
    commentTitle: {
        fontSize: fp(16),
        fontWeight: 'bold',
        marginBottom: 8,
    },
    commentText: {
        fontSize: fp(16),
        lineHeight: 24,
    },
    proofSection: {
        marginHorizontal: wp(20),
        marginBottom: hp(20),
    },
    sectionHeader: {
        fontSize: fp(16),
        fontWeight: 'bold',
        marginBottom: 12,
    },
    proofImage: {
        width: '100%',
        height: hp(200),
        borderRadius: wp(12),
    },
});
