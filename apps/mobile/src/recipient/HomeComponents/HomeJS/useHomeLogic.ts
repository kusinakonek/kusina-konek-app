import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import api from '../../../../lib/api';
import { useRouter } from 'expo-router';
import { RecentItem } from '../../../components/RecentItemsList';

export interface DashboardData {
    stats: {
        availableFoods: number;
        locations: number;
        totalServings: number;
    };
    recentFoods: any[];
}

export const useHomeLogic = () => {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

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

    return {
        dashboardData,
        loading,
        refreshing,
        onRefresh,
        handleLogout,
        getUserName,
        getRecentItems,
        router,
        user
    };
};
