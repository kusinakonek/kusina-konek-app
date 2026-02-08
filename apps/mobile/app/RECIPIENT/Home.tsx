import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ImageBackground, TouchableOpacity, StatusBar, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { RecentItemsList, RecentItem } from '../../src/components/RecentItemsList';
import { Package, MapPin, Utensils, LogOut } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function RecipientHome() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState<any>(null);

    const fetchDashboardData = useCallback(async () => {
        try {
            const response = await api.get('/dashboard/recipient');
            setDashboardData(response.data);
        } catch (error: any) {
            // Silently handle - use fallback data
            if (__DEV__) console.log('Dashboard API unavailable, using defaults');
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

    const handleLogout = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const getUserName = () => {
        // Extract first name from email or use a default
        const email = user?.email || '';
        const namePart = email.split('@')[0];
        return namePart.charAt(0).toUpperCase() + namePart.slice(1);
    };

    const getRecentItems = (): RecentItem[] => {
        return (dashboardData?.recentFoods || []).map((f: any) => ({
            id: f.id,
            title: f.food_name,
            quantity: `${f.quantity} ${f.unit || 'servings'}`,
            location: f.pickup_location,
            time: f.timeAgo,
            status: f.status?.toLowerCase(),
            rating: f.rating,
            showFeedback: f.status?.toLowerCase() === 'claimed' && !f.rating
        }));
    };

    const renderRecipientStats = () => {
        const stats = dashboardData?.stats;

        return (
            <View style={styles.recipientStatsCard}>
                <View style={styles.recipientStatsIconContainer}>
                    <Package size={56} color="#2962FF" />
                </View>
                <View style={styles.recipientStatsContent}>
                    <Text style={styles.recipientStatsValue}>{stats?.availableFoods ?? 0}</Text>
                    <Text style={styles.recipientStatsLabel}>Available Foods</Text>
                    <View style={styles.recipientStatsMeta}>
                        <MapPin size={14} color="#00C853" />
                        <Text style={styles.recipientStatsMetaText}>{stats?.locations ?? 0} locations</Text>
                        <Text style={styles.recipientStatsMetaDot}>•</Text>
                        <Utensils size={14} color="#2962FF" />
                        <Text style={styles.recipientStatsMetaText}>{stats?.totalServings ?? 0}+ servings</Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.logoIcon}>
                        <Utensils size={20} color="#fff" />
                    </View>
                    <View>
                        <Text style={styles.appName}>KusinaKonek</Text>
                        <Text style={styles.dashboardTitle}>RECIPIENT Dashboard</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <LogOut size={20} color="#666" />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00C853']} />
                }
            >
                <View style={styles.greetingContainer}>
                    <Text style={styles.greetingText}>Hi {getUserName()}!</Text>
                    <Text style={styles.greetingSubtext}>Discover bunch of different free <Text style={styles.ulamText}>ULAM</Text>.</Text>
                </View>

                <View style={styles.heroContainer}>
                    <ImageBackground
                        source={{ uri: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=1000&auto=format&fit=crop' }}
                        style={styles.heroImage}
                        imageStyle={{ borderRadius: 16, opacity: 0.8 }}
                    >
                        <View style={styles.heroOverlay}>
                            <Text style={styles.heroTitle}>Get free foods for your family</Text>
                            <Text style={styles.heroSubtitle}>Help families in Naga City with your extra food</Text>
                        </View>
                    </ImageBackground>
                </View>

                <View style={styles.statsContainer}>
                    {renderRecipientStats()}
                </View>

                <TouchableOpacity style={styles.mainButton} onPress={() => router.push('/(tabs)/action')}>
                    <Image source={require('../../assets/MyCart.png')} style={styles.mainButtonIcon} />
                    <Text style={styles.mainButtonText}>Browse Food</Text>
                </TouchableOpacity>

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
    safeArea: { 
        flex: 1, 
        backgroundColor: '#fff' 
    },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 20, 
        paddingVertical: 16, 
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    headerLeft: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 12 
    },
    logoIcon: { 
        width: 48, 
        height: 48, 
        backgroundColor: '#00C853', 
        borderRadius: 12, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    appName: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        color: '#1a1a1a' 
    },
    dashboardTitle: { 
        fontSize: 12, 
        color: '#666',
        marginTop: 2
    },
    logoutButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#f5f5f5'
    },
    scrollContent: { 
        padding: 20 
    },
    greetingContainer: {
        marginBottom: 20
    },
    greetingText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 4
    },
    greetingSubtext: {
        fontSize: 14,
        color: '#666'
    },
    ulamText: {
        color: '#00C853',
        fontWeight: '600'
    },
    heroContainer: { 
        height: 180, 
        borderRadius: 16, 
        marginBottom: 24, 
        overflow: 'hidden', 
        backgroundColor: '#333',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6
    },
    heroImage: { 
        width: '100%', 
        height: '100%', 
        justifyContent: 'flex-end' 
    },
    heroOverlay: { 
        padding: 20, 
        backgroundColor: 'rgba(0,0,0,0.4)' 
    },
    heroTitle: { 
        fontSize: 24, 
        fontWeight: 'bold', 
        color: '#fff', 
        marginBottom: 6 
    },
    heroSubtitle: { 
        fontSize: 14, 
        color: 'rgba(255,255,255,0.95)' 
    },
    statsContainer: { 
        marginBottom: 24 
    },
    recipientStatsCard: { 
        backgroundColor: '#E3F2FD', 
        borderRadius: 16, 
        padding: 20, 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 16, 
        borderWidth: 1, 
        borderColor: '#BBDEFB',
        shadowColor: '#2962FF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3
    },
    recipientStatsIconContainer: { 
        width: 72, 
        height: 72, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    recipientStatsContent: {
        flex: 1
    },
    recipientStatsValue: { 
        fontSize: 36, 
        fontWeight: 'bold', 
        color: '#1a1a1a', 
        marginBottom: 4 
    },
    recipientStatsLabel: { 
        fontSize: 16, 
        fontWeight: '600', 
        color: '#333', 
        marginBottom: 10 
    },
    recipientStatsMeta: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 6 
    },
    recipientStatsMetaText: { 
        fontSize: 13, 
        color: '#555',
        marginLeft: 2
    },
    recipientStatsMetaDot: { 
        fontSize: 13, 
        color: '#999',
        marginHorizontal: 4
    },
    mainButton: { 
        flexDirection: 'row', 
        backgroundColor: '#00C853', 
        height: 56, 
        borderRadius: 12, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginBottom: 24, 
        shadowColor: '#00C853', 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.3, 
        shadowRadius: 8, 
        elevation: 4 
    },
    mainButtonText: { 
        color: '#fff', 
        fontSize: 18, 
        fontWeight: 'bold',
        marginLeft: 8
    },
    mainButtonIcon: {
        width: 28,
        height: 28,
        tintColor: '#fff',
    },
});
