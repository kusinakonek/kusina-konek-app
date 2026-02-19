import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { MapPin, Star } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';

// Define a common interface for items (donations or claims)
export interface RecentItem {
    id: string;
    title: string;
    quantity: string;
    location: string;
    time: string;
    status?: 'pending' | 'donated' | 'claimed' | 'on-the-way' | 'completed';
    rating?: number;
    recipientName?: string; // For donors seeing who claimed
    showFeedback?: boolean; // Show feedback button for recipients
}

interface RecentItemsListProps {
    items: RecentItem[];
    role: 'DONOR' | 'RECIPIENT';
    onSeeAll?: () => void;
    onConfirm?: (id: string) => void;
    onMarkOnTheWay?: (id: string) => void;
}

export const RecentItemsList = ({ items, role, onSeeAll, onConfirm, onMarkOnTheWay }: RecentItemsListProps) => {
    const { colors, isDark } = useTheme();

    const renderItem = ({ item }: { item: RecentItem }) => (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={[styles.itemTitle, { color: colors.text }]}>{item.title}</Text>
                    <Text style={[styles.itemQuantity, { color: colors.textSecondary }]}>{item.quantity}</Text>
                </View>
                {item.status && (
                    <View style={[styles.statusBadge, styles[`status_${item.status}`]]}>
                        <Text style={styles.statusText}>{item.status}</Text>
                    </View>
                )}
            </View>

            {role === 'DONOR' && item.recipientName && (
                <Text style={[styles.claimedBy, { color: colors.textSecondary }]}>Claimed: <Text style={styles.recipientName}>{item.recipientName}</Text></Text>
            )}

            <View style={styles.locationContainer}>
                <MapPin size={14} color={colors.textSecondary} style={styles.pinIcon} />
                <Text style={[styles.locationText, { color: colors.textSecondary }]}>{item.location}</Text>
            </View>

            <View style={styles.footer}>
                <Text style={[styles.timeText, { color: colors.textTertiary }]}>{item.time}</Text>
                {item.rating && (
                    <View style={styles.ratingContainer}>
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                size={16}
                                color={i < Math.floor(item.rating!) ? "#FFC107" : "#E0E0E0"}
                                fill={i < Math.floor(item.rating!) ? "#FFC107" : "transparent"}
                            />
                        ))}
                        <Text style={[styles.greatText, { color: colors.text }]}>Great!</Text>
                    </View>
                )}
            </View>

            {role === 'RECIPIENT' && item.showFeedback && (
                <TouchableOpacity style={styles.feedbackButton}>
                    <Text style={styles.feedbackButtonText}>Give Feedback</Text>
                </TouchableOpacity>
            )}

            {/* Recipient claimed food — show 'I'm On My Way' button */}
            {role === 'RECIPIENT' && item.status === 'claimed' && onMarkOnTheWay && (
                <TouchableOpacity
                    style={styles.onTheWayButton}
                    onPress={() => onMarkOnTheWay(item.id)}
                >
                    <Text style={styles.onTheWayButtonText}>🚶 I'm On My Way</Text>
                </TouchableOpacity>
            )}

            {/* Recipient is on the way — show 'Confirm Received' button */}
            {role === 'RECIPIENT' && item.status === 'on-the-way' && onConfirm && (
                <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={() => onConfirm(item.id)}
                >
                    <Text style={styles.confirmButtonText}>✅ Confirm Received</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {role === 'DONOR' ? 'My Recent Donations' : 'My Recent Food'}
                </Text>
                <TouchableOpacity onPress={onSeeAll}>
                    <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={items}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false} // Since it's inside a ScrollView in the main screen
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    seeAllText: {
        color: '#00C853',
        fontSize: 14,
        fontWeight: '600',
    },
    listContent: {
        gap: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        marginBottom: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    itemQuantity: {
        fontSize: 14,
        color: '#666',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    status_donated: {
        backgroundColor: '#E8F5E9',
    },
    status_claimed: {
        backgroundColor: '#FFF3E0',
    },
    'status_on-the-way': {
        backgroundColor: '#E3F2FD',
    },
    status_completed: {
        backgroundColor: '#E8F5E9',
    },
    status_pending: {
        backgroundColor: '#F5F5F5',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#333',
    },
    claimedBy: {
        fontSize: 14,
        color: '#333',
        marginBottom: 8,
    },
    recipientName: {
        fontWeight: 'bold',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    pinIcon: {
        marginRight: 4,
    },
    locationText: {
        fontSize: 14,
        color: '#666',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    timeText: {
        fontSize: 12,
        color: '#999',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    greatText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    feedbackButton: {
        marginTop: 12,
        backgroundColor: '#00C853',
        height: 44,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    feedbackButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    onTheWayButton: {
        marginTop: 12,
        backgroundColor: '#FF9800',
        height: 44,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    onTheWayButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    confirmButton: {
        marginTop: 12,
        backgroundColor: '#2196F3',
        height: 44,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
