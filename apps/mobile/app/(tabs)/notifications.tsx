import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Bell, ChevronLeft, Trash2, Check } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosClient from '../../src/api/axiosClient';
import { API_ENDPOINTS } from '../../src/api/endpoints';
import { useTheme } from '../../context/ThemeContext';
import { useNetwork } from '../../context/NetworkContext';
import { cacheData, getCachedDataAnyAge, CACHE_KEYS } from '../../src/utils/dataCache';
import LoadingScreen from '../../src/components/LoadingScreen';

interface Notification {
    notificationID: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    entityID?: string;
    createdAt: string;
}

function getTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

function getNotificationIcon(type: string): string {
    switch (type) {
        case 'CLAIM_ALERT': return '🎉';
        case 'CLAIM': return '🎉';
        case 'CLAIM_BAN': return '⛔';
        case 'CLAIM_TIMEOUT_WARNING': return '⏱️';
        case 'CLAIM_TIMEOUT': return '⌛';
        case 'ON_THE_WAY': return '🚶';
        case 'RECEIVE_REQUIRED': return '📩';
        case 'DELIVERY_CONFIRMED': return '✅';
        case 'CONFIRM': return '✅';
        case 'AUTO_RECEIVED': return '🤖';
        case 'FEEDBACK_REMINDER': return '⭐';
        case 'NEW_FOOD': return '🍱';
        case 'NEW_MESSAGE': return '💬';
        case 'DONATION_CANCELLED': return '❌';
        case 'FOOD_EXPIRED': return '⏰';
        default: return '🔔';
    }
}

async function navigateForNotificationType(type: string, entityID?: string) {
    switch (type) {
        case 'CLAIM_ALERT':
        case 'CLAIM':
        case 'CLAIM_BAN':
        case 'CLAIM_TIMEOUT_WARNING':
        case 'CLAIM_TIMEOUT':
        case 'ON_THE_WAY':
        case 'RECEIVE_REQUIRED':
        case 'DELIVERY_CONFIRMED':
        case 'CONFIRM':
        case 'AUTO_RECEIVED':
        case 'FEEDBACK_REMINDER':
        case 'DONATION_CANCELLED':
        case 'FOOD_EXPIRED':
            router.push('/(tabs)');
            break;
        case 'NEW_FOOD':
            router.push('/(tabs)');
            break;
        case 'NEW_MESSAGE': {
            if (!entityID) {
                router.push('/(tabs)');
                break;
            }

            const role = await AsyncStorage.getItem('userRole');
            if (role === 'DONOR') {
                router.push({ pathname: '/(donor)/chat', params: { disID: entityID } });
            } else if (role === 'RECIPIENT') {
                router.push({ pathname: '/(recipient)/chat', params: { disID: entityID } });
            } else {
                router.push('/(tabs)');
            }
            break;
        }
        default:
            break;
    }
}

export default function NotificationsScreen() {
    const { colors, isDark } = useTheme();
    const { isOnline, justReconnected } = useNetwork();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Load from cache on mount
    useEffect(() => {
        const loadCache = async () => {
            const cached = await getCachedDataAnyAge(CACHE_KEYS.NOTIFICATIONS);
            if (cached) {
                setNotifications((cached as any).notifications || []);
                setLoading(false);
            }
        };
        loadCache();
    }, []);

    const fetchNotifications = useCallback(async () => {
        if (!isOnline && notifications.length > 0) {
            setLoading(false);
            setRefreshing(false);
            return;
        }

        try {
            const res = await axiosClient.get(API_ENDPOINTS.NOTIFICATION.LIST);
            setNotifications(res.data.notifications || []);
            await cacheData(CACHE_KEYS.NOTIFICATIONS, res.data);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Auto silent refresh after internet reconnects.
    useEffect(() => {
        if (justReconnected) {
            fetchNotifications();
        }
    }, [justReconnected, fetchNotifications]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const handleNotificationTap = async (notification: Notification) => {
        try {
            // Mark as read
            await axiosClient.put(API_ENDPOINTS.NOTIFICATION.MARK_READ(notification.notificationID));
            // Remove from list
            setNotifications(prev => prev.filter(n => n.notificationID !== notification.notificationID));
            // Navigate to relevant screen
            await navigateForNotificationType(notification.type, notification.entityID);
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleDelete = async (notificationID: string) => {
        try {
            await axiosClient.delete(API_ENDPOINTS.NOTIFICATION.DELETE(notificationID));
            setNotifications(prev => prev.filter(n => n.notificationID !== notificationID));
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const renderNotification = ({ item }: { item: Notification }) => (
        <TouchableOpacity
            style={[styles.notificationCard, { backgroundColor: colors.card, borderColor: colors.border }, !item.isRead && { borderLeftWidth: 3, borderLeftColor: '#00C853', backgroundColor: isDark ? '#1a3a1a' : '#f0fff4' }]}
            onPress={() => handleNotificationTap(item)}
            activeOpacity={0.7}
        >
            <View style={styles.notificationLeft}>
                <Text style={styles.notificationEmoji}>{getNotificationIcon(item.type)}</Text>
                <View style={styles.notificationContent}>
                    <Text style={[styles.notificationTitle, { color: colors.text }, !item.isRead && { fontWeight: '700' }]}>
                        {item.title}
                    </Text>
                    <Text style={[styles.notificationMessage, { color: colors.textSecondary }]} numberOfLines={2}>
                        {item.message}
                    </Text>
                    <Text style={[styles.notificationTime, { color: colors.textTertiary }]}>{getTimeAgo(item.createdAt)}</Text>
                </View>
            </View>
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item.notificationID)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Trash2 size={16} color={colors.textTertiary} />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ChevronLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <LoadingScreen message="Loading notifications..." />
            ) : notifications.length === 0 ? (
                <View style={styles.centerContent}>
                    <Bell size={48} color={colors.textTertiary} />
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No notifications yet</Text>
                    <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
                        You'll get notified when someone interacts with your donations
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.notificationID}
                    renderItem={renderNotification}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={['#00C853']}
                            tintColor="#00C853"
                        />
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
    listContent: {
        padding: 16,
        gap: 8,
    },
    notificationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    unreadCard: {
        borderLeftWidth: 3,
        borderLeftColor: '#00C853',
        backgroundColor: '#f0fff4',
    },
    notificationLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    notificationEmoji: {
        fontSize: 28,
        marginRight: 12,
    },
    notificationContent: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    unreadTitle: {
        fontWeight: '700',
        color: '#1a1a1a',
    },
    notificationMessage: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
        marginBottom: 4,
    },
    notificationTime: {
        fontSize: 11,
        color: '#999',
    },
    deleteButton: {
        padding: 8,
        marginLeft: 8,
    },
});
