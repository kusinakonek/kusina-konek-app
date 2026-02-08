import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { MapPin, Star } from 'lucide-react-native';

// Define a common interface for items (donations or claims)
export interface RecentItem {
    id: string;
    title: string;
    quantity: string;
    location: string;
    time: string;
    status?: 'donated' | 'claimed' | 'on-the-way';
    rating?: number;
    recipientName?: string; // For donors seeing who claimed
}

interface RecentItemsListProps {
    items: RecentItem[];
    role: 'DONOR' | 'RECIPIENT';
    onSeeAll?: () => void;
}

export const RecentItemsList = ({ items, role, onSeeAll }: RecentItemsListProps) => {
    const renderItem = ({ item }: { item: RecentItem }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemQuantity}>{item.quantity}</Text>
                </View>
                {item.status && (
                    <View style={[styles.statusBadge, styles[`status_${item.status}`]]}>
                        <Text style={styles.statusText}>{item.status}</Text>
                    </View>
                )}
            </View>

            {role === 'DONOR' && item.recipientName && (
                <Text style={styles.claimedBy}>Claimed: <Text style={styles.recipientName}>{item.recipientName}</Text></Text>
            )}

            <View style={styles.locationContainer}>
                <MapPin size={14} color="#666" style={styles.pinIcon} />
                <Text style={styles.locationText}>{item.location}</Text>
            </View>

            <View style={styles.footer}>
                <Text style={styles.timeText}>{item.time}</Text>
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
                        <Text style={styles.greatText}>Great!</Text>
                    </View>
                )}
            </View>

            {/* Conditional feedback button for Recipient if not rated? 
                Or simply display as per design. Design shows "Give Feedback" button for recipient.
                I'll leave that for the main integration if needed, but the design 
                shows it inside the card.
            */}
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.sectionTitle}>
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
        backgroundColor: '#EEEEEE',
    },
    'status_on-the-way': {
        backgroundColor: '#E8F5E9',
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
}) as any; // Using any to avoid strict typing on dynamic status styles for now
