import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ImageBackground, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../api/axiosClient';
import { API_ENDPOINTS } from '../api/endpoints';
import { RecentItemsList, RecentItem } from '../components/RecentItemsList';
import { Package, MapPin, Utensils, Search } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function RecipientHome() {
    const { user } = useAuth();
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState<any>(null);

    const fetchDashboardData = useCallback(async () => {
        try {
            const response = await axiosClient.get(API_ENDPOINTS.DASHBOARD.RECIPIENT);
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

    const getRecentItems = (): RecentItem[] => {
        return (dashboardData?.recentFoods || []).map((f: any) => ({
            id: f.disID || f.id,
            title: f.foodName,
            quantity: `${f.quantity} servings`,
            location: f.location,
            time: f.timeAgo,
            status: f.status?.toLowerCase(),
            rating: f.myRating,
            showFeedback: f.canGiveFeedback,
        }));
    };

    const userName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Image
                        source={require('../../assets/KusinaKonek-Logo.png')}
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                    <View>
                        <Text style={styles.appName}>KusinaKonek</Text>
                        <Text style={styles.dashboardTitle}>RECIPIENT Dashboard</Text>
                    </View>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00C853']} />
                }
            >
                {/* Greeting */}
                <View style={styles.greetingRow}>
                    <View style={styles.greetingAvatar}>
                        <Text style={styles.greetingAvatarText}>{userName.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View>
                        <Text style={styles.greetingName}>Hi {userName}!</Text>
                        <Text style={styles.greetingSubtitle}>Discover bunch of different free <Text style={styles.greenText}>ULAM</Text>.</Text>
                    </View>
                </View>

                {/* Hero Banner */}
                <View style={styles.heroContainer}>
                    <ImageBackground
                        source={{ uri: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=1000&auto=format&fit=crop' }}
                        style={styles.heroImage}
                        imageStyle={{ borderRadius: 16, opacity: 0.85 }}
                    >
                        <View style={styles.heroOverlay}>
                            <Text style={styles.heroTitle}>Get free foods for your family</Text>
                            <Text style={styles.heroSubtitle}>Help families in Naga City with your extra food</Text>
                        </View>
                    </ImageBackground>
                </View>

                {/* Available Foods Stats Card */}
                <View style={styles.recipientStatsCard}>
                    <View style={styles.recipientStatsIconContainer}>
                        <Package size={48} color="#2962FF" />
                    </View>
                    <View>
                        <Text style={styles.recipientStatsValue}>{dashboardData?.stats?.availableFoods || 0}</Text>
                        <Text style={styles.recipientStatsLabel}>Available Foods</Text>
                        <View style={styles.recipientStatsMeta}>
                            <MapPin size={12} color="#00C853" />
                            <Text style={styles.recipientStatsMetaText}>{dashboardData?.stats?.locations || 0} locations</Text>
                            <Text style={styles.recipientStatsMetaDot}>•</Text>
                            <Utensils size={12} color="#2962FF" />
                            <Text style={styles.recipientStatsMetaText}>{dashboardData?.stats?.totalServings || 0}+ servings</Text>
                        </View>
                    </View>
                </View>

                {/* Browse Food Button */}
                <TouchableOpacity style={styles.mainButton} onPress={() => router.push('/(recipient)/browse-food')}>
                    <Search size={24} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.mainButtonText}>Browse Food</Text>
                </TouchableOpacity>

                {/* Recent Food */}
                <RecentItemsList
                    items={getRecentItems()}
                    role="RECIPIENT"
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
    logoImage: { width: 40, height: 40, borderRadius: 8 },
    appName: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
    dashboardTitle: { fontSize: 12, color: '#666' },
    scrollContent: { padding: 20 },
    greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
    greetingAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
    greetingAvatarText: { fontSize: 18, fontWeight: 'bold', color: '#2E7D32' },
    greetingName: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a' },
    greetingSubtitle: { fontSize: 13, color: '#666' },
    greenText: { color: '#00C853', fontWeight: 'bold' },
    heroContainer: { height: 160, borderRadius: 16, marginBottom: 20, overflow: 'hidden', backgroundColor: '#333' },
    heroImage: { width: '100%', height: '100%', justifyContent: 'flex-end' },
    heroOverlay: { padding: 16, backgroundColor: 'rgba(0,0,0,0.3)' },
    heroTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
    heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
    recipientStatsCard: { backgroundColor: '#E3F2FD', borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 20, borderWidth: 1, borderColor: '#BBDEFB', marginBottom: 20 },
    recipientStatsIconContainer: { width: 64, height: 64, justifyContent: 'center', alignItems: 'center' },
    recipientStatsValue: { fontSize: 32, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 4 },
    recipientStatsLabel: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
    recipientStatsMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    recipientStatsMetaText: { fontSize: 12, color: '#555' },
    recipientStatsMetaDot: { fontSize: 12, color: '#999' },
    mainButton: { flexDirection: 'row', backgroundColor: '#00C853', height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8, shadowColor: '#00C853', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    mainButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
