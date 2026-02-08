import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Heart, Clock, CheckCircle } from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';
import axiosClient from '../../src/api/axiosClient';
import { API_ENDPOINTS } from '../../src/api/endpoints';

export default function DonorHome() {
    const { user, signOut } = useAuth();
    const [donations, setDonations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 });

    const fetchDonations = async () => {
        try {
            setLoading(true);
            const response = await axiosClient.get(API_ENDPOINTS.FOOD.GET_MY_DONATIONS);
            const foods = response.data.foods || [];

            // Sort by timestamp desc
            foods.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            setDonations(foods);

            // Calculate stats
            const total = foods.length;
            const completed = foods.filter((f: any) =>
                f.distributions?.some((d: any) => d.status === 'COMPLETED')
            ).length;
            const pending = total - completed;

            setStats({ total, pending, completed });
        } catch (error) {
            console.error('Error fetching donations:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchDonations();
        }, [])
    );

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusParams = (food: any) => {
        const isCompleted = food.distributions?.some((d: any) => d.status === 'COMPLETED');
        if (isCompleted) return { label: 'Completed', color: '#4CAF50', bg: '#E8F5E9' };

        const isAccepted = food.distributions?.some((d: any) => d.status === 'ACCEPTED');
        if (isAccepted) return { label: 'Accepted', color: '#2196F3', bg: '#E3F2FD' };

        return { label: 'Pending', color: '#FF9800', bg: '#FFF3E0' };
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Welcome back,</Text>
                        <Text style={styles.userName}>{user?.user_metadata?.first_name || 'Donor'}</Text>
                    </View>
                    <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
                        <LogOut size={20} color="#666" />
                    </TouchableOpacity>
                </View>

                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: '#E8F5E9' }]}>
                            <Heart size={24} color="#00C853" />
                        </View>
                        <Text style={styles.statNumber}>{loading ? '-' : stats.total}</Text>
                        <Text style={styles.statLabel}>Total Donations</Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: '#FFF3E0' }]}>
                            <Clock size={24} color="#FF9800" />
                        </View>
                        <Text style={styles.statNumber}>{loading ? '-' : stats.pending}</Text>
                        <Text style={styles.statLabel}>Pending</Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: '#E3F2FD' }]}>
                            <CheckCircle size={24} color="#2196F3" />
                        </View>
                        <Text style={styles.statNumber}>{loading ? '-' : stats.completed}</Text>
                        <Text style={styles.statLabel}>Completed</Text>
                    </View>
                </View>

                {/* Recent Activity */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Activity</Text>

                    {loading ? (
                        <ActivityIndicator size="large" color="#00C853" style={{ marginTop: 20 }} />
                    ) : donations.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Heart size={48} color="#E0E0E0" />
                            <Text style={styles.emptyText}>No donations yet</Text>
                            <Text style={styles.emptySubtext}>Tap the heart button below to donate food</Text>
                        </View>
                    ) : (
                        donations.map((food: any) => {
                            const status = getStatusParams(food);
                            return (
                                <View key={food.foodID} style={styles.donationCard}>
                                    <View style={styles.donationHeader}>
                                        <View style={{ flex: 1, marginRight: 8 }}>
                                            <Text style={styles.foodName}>{food.foodName}</Text>
                                            <View style={[styles.statusBadge, { backgroundColor: status.bg, alignSelf: 'flex-start', marginTop: 4 }]}>
                                                <Text style={[styles.statusText, { color: status.color }]}>
                                                    {status.label}
                                                </Text>
                                            </View>
                                        </View>
                                        {food.image && (
                                            <Image
                                                source={{ uri: food.image }}
                                                style={{ width: 60, height: 60, borderRadius: 8, backgroundColor: '#f0f0f0' }}
                                                resizeMode="cover"
                                            />
                                        )}
                                    </View>
                                    <Text style={styles.foodDesc} numberOfLines={2}>{food.description}</Text>
                                    <View style={styles.donationFooter}>
                                        <Text style={styles.dateText}>{formatDate(food.timestamp)}</Text>
                                        <Text style={styles.quantityText}>{food.quantity}</Text>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    greeting: {
        fontSize: 14,
        color: '#666',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    logoutBtn: {
        padding: 10,
        backgroundColor: '#fff',
        borderRadius: 12,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    statIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
        textAlign: 'center',
    },
    section: {
        marginBottom: 80, // Add padding for bottom nav
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 16,
    },
    emptyState: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 40,
        alignItems: 'center',
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#999',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#bbb',
        marginTop: 4,
        textAlign: 'center',
    },
    donationCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    donationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    foodName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a1a1a',
        flex: 1,
        marginRight: 8,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    foodDesc: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    donationFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#f5f5f5',
        paddingTop: 8,
    },
    dateText: {
        fontSize: 12,
        color: '#999',
    },
    quantityText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#333',
    },
});
