import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import api from '../../../../lib/api';
import { useRouter } from 'expo-router';
import { Heart, Package, Star } from 'lucide-react-native';
import { RecentItem } from '../../../../src/components/RecentItemsList';

export const useHomeLogic = () => {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState<any>(null);

    const fetchDashboardData = useCallback(async () => {
        try {
            const response = await api.get('/dashboard/donor');
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

    const getStats = () => {
        const stats = dashboardData?.stats;
        return [
            {
                icon: Heart,
                value: stats?.totalDonated ?? 0,
                label: 'Donated',
                color: '#00C853',
                bgColor: '#E8F5E9',
            },
            {
                icon: Package,
                value: stats?.availableItems ?? 0,
                label: 'Available',
                color: '#2196F3',
                bgColor: '#E3F2FD',
            },
            {
                icon: Star,
                value: stats?.averageRating ? stats.averageRating.toFixed(1) : '0.0',
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

    return {
        dashboardData,
        loading,
        refreshing,
        onRefresh,
        handleLogout,
        getStats,
        getRecentItems,
        router
    };
};
