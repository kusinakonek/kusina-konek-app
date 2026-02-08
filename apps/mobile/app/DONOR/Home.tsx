import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ImageBackground, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { DashboardStats } from '../../src/components/DashboardStats';
import { RecentItemsList, RecentItem } from '../../src/components/RecentItemsList';
import { Heart, Package, Star, Plus, Utensils } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function DonorHome() {
    const { user } = useAuth();
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState<any>(null);

    const fetchDashboardData = useCallback(async () => {
        try {
            const response = await api.get('/dashboard/donor');
            setDashboardData(response.data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchDashboardData();
    }, [fetchDashboardData]);

    const getStats = () => {
        if (!dashboardData?.stats) return [];
        return [
            {
                icon: Heart,
                value: dashboardData.stats.totalDonated || 0,
                label: 'Donated',
                color: '#00C853',
                bgColor: '#E8F5E9',
            },
            {
                icon: Package,
                value: dashboardData.stats.availableItems || 0,
                label: 'Available',
                color: '#2196F3',
                bgColor: '#E3F2FD',
            },
            {
                icon: Star,
                value: dashboardData.stats.averageRating || 'N/A',
                label: 'Ratings',
                color: '#FFC107',
                bgColor: '#FFF8E1',
            },
        ];
    };

    const getRecentItems = (): RecentItem[] => {
        return (dashboardData?.recentDonations || []).map((d: any) => ({
            id: d.id,
            title: d.food_name || 'Food Donation',
            quantity: `${d.quantity} ${d.unit || 'servings'}`,
            location: d.pickup_location || 'Location',
            time: d.timeAgo || 'Recently',
            status: d.status?.toLowerCase(),
            recipientName: d.claimed_by_name,
            rating: d.rating,
        }));
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.logoIcon}>
                        <Utensils size={20} color="#fff" />
                    </View>
                    <View>
                        <Text style={styles.appName}>KusinaKonek</Text>
                        <Text style={styles.dashboardTitle}>Donor Dashboard</Text>
                    </View>
                </View>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{user?.email?.charAt(0).toUpperCase()}</Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00C853']} />
                }
            >
                <View style={styles.heroContainer}>
                    <ImageBackground
                        source={{ uri: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1000&auto=format&fit=crop' }}
                        style={styles.heroImage}
                        imageStyle={{ borderRadius: 16, opacity: 0.8 }}
                    >
                        <View style={styles.heroOverlay}>
                            <Text style={styles.heroTitle}>Share Your Blessings Today</Text>
                            <Text style={styles.heroSubtitle}>Help families in Naga City with your extra food</Text>
                        </View>
                    </ImageBackground>
                </View>

                <View style={styles.statsContainer}>
                    <DashboardStats stats={getStats()} />
                </View>

                <TouchableOpacity style={styles.mainButton} onPress={() => router.push('/(tabs)/action')}>
                    <Plus size={24} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.mainButtonText}>Donate Food</Text>
                </TouchableOpacity>

                <RecentItemsList
                    items={getRecentItems()}
                    role="DONOR"
                    onSeeAll={() => { }}
                />

                <View style={{ height: 20 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#fff' },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    logoIcon: { width: 36, height: 36, backgroundColor: '#00C853', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    appName: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
    dashboardTitle: { fontSize: 12, color: '#666' },
    avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 16, fontWeight: 'bold', color: '#666' },
    scrollContent: { padding: 20 },
    heroContainer: { height: 160, borderRadius: 16, marginBottom: 24, overflow: 'hidden', backgroundColor: '#333' },
    heroImage: { width: '100%', height: '100%', justifyContent: 'flex-end' },
    heroOverlay: { padding: 16, backgroundColor: 'rgba(0,0,0,0.3)' },
    heroTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
    heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
    statsContainer: { marginBottom: 24 },
    mainButton: { flexDirection: 'row', backgroundColor: '#00C853', height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8, shadowColor: '#00C853', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    mainButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
