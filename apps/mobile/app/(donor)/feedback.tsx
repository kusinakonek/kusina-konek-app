import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext'; // Adjusted import path
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Star, MessageSquare, Award } from 'lucide-react-native';
import axiosClient from '../../src/api/axiosClient'; // Adjusted import path
import { API_ENDPOINTS } from '../../src/api/endpoints'; // Adjusted import path
import { wp, hp, fp } from '../../src/utils/responsive'; // Adjusted import path

interface Feedback {
    feedbackID: string;
    ratingScore: number;
    comments?: string;
    photoUrl?: string; // Recipient's proof photo or feedback photo
    timestamp: string;
    distribution?: {
        food: {
            foodName: string;
            image?: string;
        };
        recipient?: {
            firstName: string;
            lastName: string;
        };
    };
    recipient?: {
        firstName: string;
        lastName: string;
    };
    donor?: {
        averageRating: number;
        ratingCount: number;
    }
}

export default function FeedbackScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [stats, setStats] = useState({
        average: 0,
        total: 0,
        breakdown: [0, 0, 0, 0, 0], // 1 to 5 stars
        withComments: 0,
        fiveStar: 0,
        positiveRate: 0
    });

    useEffect(() => {
        fetchFeedback();
    }, []);

    const fetchFeedback = async () => {
        try {
            const response = await axiosClient.get(API_ENDPOINTS.FEEDBACK.LIST_RECEIVED);
            const data: Feedback[] = response.data.feedbacks || [];
            setFeedbacks(data);
            calculateStats(data);
        } catch (error) {
            console.error("Error fetching feedback:", error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data: Feedback[]) => {
        if (data.length === 0) return;

        const total = data.length;
        const sum = data.reduce((acc, curr) => acc + curr.ratingScore, 0);
        const average = sum / total;

        const breakdown = [0, 0, 0, 0, 0];
        let withComments = 0;
        let fiveStar = 0;
        let positive = 0; // 4 or 5 stars

        data.forEach(f => {
            const score = Math.max(1, Math.min(5, f.ratingScore));
            breakdown[5 - score]++; // Index 0 is 5 stars, index 4 is 1 star? No, let's map index 0->5, 1->4...
            // Visuals usually show 5 top, 1 bottom.

            if (f.comments && f.comments.trim().length > 0) withComments++;
            if (f.ratingScore === 5) fiveStar++;
            if (f.ratingScore >= 4) positive++;
        });

        // Mapping for array: breakdown[0] = count of 5 stars, breakdown[1] = 4 stars... 
        const visualBreakdown = [0, 0, 0, 0, 0];
        data.forEach(f => {
            const score = Math.floor(f.ratingScore);
            if (score >= 1 && score <= 5) {
                // We want 5 stars at index 0
                visualBreakdown[5 - score]++;
            }
        });

        setStats({
            average,
            total,
            breakdown: visualBreakdown,
            withComments,
            fiveStar,
            positiveRate: Math.round((positive / total) * 100)
        });
    };

    const renderRatingBar = (star: number, count: number) => {
        const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
        return (
            <View key={star} style={styles.ratingRow}>
                <View style={styles.starLabel}>
                    <Text style={[styles.starText, { color: colors.text }]}>{star}</Text>
                    <Star size={12} color={colors.text} fill={colors.text} />
                </View>
                <View style={styles.barContainer}>
                    <View style={[styles.barBackground, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]} />
                    <View style={[styles.barFill, { width: `${percentage}%`, backgroundColor: '#FFC107' }]} />
                </View>
                <Text style={[styles.countText, { color: colors.textSecondary }]}>{count}</Text>
            </View>
        );
    };

    // Helper to check themes
    const isDark = colors.background === '#000000' || colors.background === '#121212';

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Feedback</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color="#00C853" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <View>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Feedback</Text>
                    <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{feedbacks.length} review(s)</Text>
                </View>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Overall Rating Card */}
                <View style={[styles.card, { backgroundColor: '#FFF9C4', borderColor: '#FFC107' }]}>
                    <View style={styles.overallHeader}>
                        <View>
                            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                                <Text style={styles.bigRating}>{stats.average.toFixed(1)}</Text>
                                <Text style={styles.maxRating}> / 5.0</Text>
                            </View>
                            <View style={styles.starsRow}>
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <Star
                                        key={s}
                                        size={20}
                                        color={s <= Math.round(stats.average) ? "#FFC107" : "#E0E0E0"}
                                        fill={s <= Math.round(stats.average) ? "#FFC107" : "transparent"}
                                    />
                                ))}
                            </View>
                            <Text style={styles.basedOn}>Based on {stats.total} review{stats.total !== 1 ? 's' : ''}</Text>
                        </View>
                        <View style={styles.badgeIcon}>
                            <Award size={48} color="#FBC02D" />
                        </View>
                    </View>

                    <View style={styles.breakdownContainer}>
                        {stats.breakdown.map((count, index) => renderRatingBar(5 - index, count))}
                    </View>
                </View>

                {/* My Impact Stats */}
                <View style={[styles.impactContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.impactHeader}>
                        <Text style={[styles.sectionTitle, { color: '#00C853' }]}>Your Impact</Text>
                    </View>

                    <View style={styles.impactGrid}>
                        <View style={styles.impactItem}>
                            <View style={[styles.impactIconBox, { backgroundColor: '#E8F5E9' }]}>
                                <MessageSquare size={24} color="#00C853" />
                            </View>
                            <Text style={[styles.impactValue, { color: '#00C853' }]}>{stats.withComments}</Text>
                            <Text style={[styles.impactLabel, { color: colors.textSecondary }]}>With Comments</Text>
                        </View>

                        <View style={styles.impactItem}>
                            <View style={[styles.impactIconBox, { backgroundColor: '#FFF8E1' }]}>
                                <Star size={24} color="#FFC107" fill="#FFC107" />
                            </View>
                            <Text style={[styles.impactValue, { color: '#FFB300' }]}>{stats.fiveStar}</Text>
                            <Text style={[styles.impactLabel, { color: colors.textSecondary }]}>5-Star Reviews</Text>
                        </View>

                        <View style={styles.impactItem}>
                            <View style={[styles.impactIconBox, { backgroundColor: '#E3F2FD' }]}>
                                <Award size={24} color="#2979FF" />
                            </View>
                            <Text style={[styles.impactValue, { color: '#2979FF' }]}>{stats.positiveRate}%</Text>
                            <Text style={[styles.impactLabel, { color: colors.textSecondary }]}>Positive Rate</Text>
                        </View>
                    </View>

                    <View style={styles.impactFooter}>
                        <Text style={styles.impactFooterText}>🎉 Excellent work! Your donations are making a real difference!</Text>
                    </View>
                </View>

                {/* Recent Reviews */}
                <Text style={[styles.sectionHeader, { color: colors.text }]}>Recent Reviews</Text>

                {feedbacks.map((item) => (
                    <TouchableOpacity
                        key={item.feedbackID}
                        style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={() => {
                            setLoading(true);
                            setTimeout(() => {
                                router.push({
                                    pathname: "/(donor)/review-details",
                                    params: {
                                        feedbackID: item.feedbackID,
                                        item: JSON.stringify(item),
                                    }
                                });
                                setLoading(false);
                            }, 100);
                        }}
                    >
                        {item.distribution?.food?.image ? (
                            <Image
                                source={{ uri: item.distribution.food.image }}
                                style={styles.reviewImage}
                            />
                        ) : (
                            <View style={[styles.reviewImagePlaceholder, { backgroundColor: colors.border }]}>
                                <Text style={{ color: colors.textSecondary }}>No Image</Text>
                            </View>
                        )}

                        <View style={styles.reviewContent}>
                            <Text style={[styles.reviewFoodName, { color: colors.text }]} numberOfLines={1}>
                                {item.distribution?.food?.foodName || "Food Donation"}
                            </Text>
                            <Text style={[styles.reviewDate, { color: colors.textTertiary }]}>
                                {new Date(item.timestamp).toLocaleDateString()}
                                {item.recipient?.firstName ? ` • ${item.recipient.firstName}` : ''}
                            </Text>

                            <View style={styles.reviewRatingRow}>
                                <View style={{ flexDirection: 'row' }}>
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star
                                            key={s}
                                            size={14}
                                            color={s <= item.ratingScore ? "#FFC107" : "#E0E0E0"}
                                            fill={s <= item.ratingScore ? "#FFC107" : "transparent"}
                                        />
                                    ))}
                                </View>
                                <Text style={styles.reviewRatingText}>{item.ratingScore.toFixed(1)}</Text>
                            </View>

                            {item.comments ? (
                                <Text style={[styles.reviewComment, { color: colors.textSecondary }]} numberOfLines={2}>
                                    "{item.comments}"
                                </Text>
                            ) : (
                                <Text style={[styles.reviewComment, { color: colors.textTertiary, fontStyle: 'italic' }]}>
                                    No additional comments provided
                                </Text>
                            )}
                        </View>
                    </TouchableOpacity>
                ))}

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: fp(12),
        textAlign: 'center',
    },
    scrollContent: {
        padding: wp(16),
    },
    card: {
        borderRadius: wp(16),
        padding: wp(20),
        marginBottom: hp(24),
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    overallHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: hp(16),
    },
    bigRating: {
        fontSize: fp(32),
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    maxRating: {
        fontSize: fp(16),
        color: '#666',
        marginBottom: 6,
    },
    starsRow: {
        flexDirection: 'row',
        gap: 4,
        marginBottom: 4,
    },
    basedOn: {
        fontSize: fp(12),
        color: '#666',
    },
    badgeIcon: {
        width: wp(64),
        height: wp(64),
        borderRadius: wp(32),
        backgroundColor: '#FFF8E1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    breakdownContainer: {
        gap: 8,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    starLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 30,
        gap: 4,
    },
    starText: {
        fontSize: fp(12),
        fontWeight: '600',
    },
    barContainer: {
        flex: 1,
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
        position: 'relative',
    },
    barBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    barFill: {
        height: '100%',
        borderRadius: 3,
    },
    countText: {
        fontSize: fp(12),
        width: 20,
        textAlign: 'right',
    },

    // Impact Section
    impactContainer: {
        borderRadius: wp(16),
        padding: wp(20),
        marginBottom: hp(24),
        borderWidth: 1,
        backgroundColor: '#fff', // default
    },
    impactHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(20),
        gap: 8,
    },
    sectionTitle: {
        fontSize: fp(16),
        fontWeight: 'bold',
    },
    impactGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: hp(16),
    },
    impactItem: {
        alignItems: 'center',
        flex: 1,
    },
    impactIconBox: {
        width: wp(48),
        height: wp(48),
        borderRadius: wp(16),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    impactValue: {
        fontSize: fp(20),
        fontWeight: 'bold',
        marginBottom: 2,
    },
    impactLabel: {
        fontSize: fp(11),
        textAlign: 'center',
    },
    impactFooter: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: hp(16),
        alignItems: 'center',
    },
    impactFooterText: {
        fontSize: fp(13),
        color: '#00C853',
        textAlign: 'center',
        fontWeight: '500',
    },

    // Recent Reviews
    sectionHeader: {
        fontSize: fp(18),
        fontWeight: 'bold',
        marginBottom: hp(12),
        flexDirection: 'row',
        alignItems: 'center',
    },
    reviewCard: {
        borderRadius: wp(12),
        marginBottom: hp(16),
        overflow: 'hidden',
        borderWidth: 1,
        elevation: 2,
    },
    reviewImage: {
        width: '100%',
        height: hp(120),
    },
    reviewImagePlaceholder: {
        width: '100%',
        height: hp(120),
        justifyContent: 'center',
        alignItems: 'center',
    },
    reviewContent: {
        padding: wp(16),
    },
    reviewFoodName: {
        fontSize: fp(16),
        fontWeight: '600',
        marginBottom: 4,
    },
    reviewDate: {
        fontSize: fp(12),
        marginBottom: 8,
    },
    reviewRatingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    reviewRatingText: {
        fontSize: fp(14),
        fontWeight: 'bold',
        color: '#333',
    },
    reviewComment: {
        fontSize: fp(14),
        lineHeight: 20,
    },
});
