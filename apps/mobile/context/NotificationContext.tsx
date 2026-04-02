import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Location from 'expo-location';
import { DeviceEventEmitter, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import axiosClient from '../src/api/axiosClient';
import { API_ENDPOINTS } from '../src/api/endpoints';
import { cacheData, CACHE_KEYS } from '../src/utils/dataCache';

interface NotificationContextType {
    expoPushToken: string | undefined;
    notification: Notifications.Notification | null;
    clearNotification: () => void;
    registerToken: () => Promise<string | undefined>;
    notificationsEnabled: boolean;
    setNotificationsEnabled: (enabled: boolean) => Promise<void>;
    syncTokenAndLocation: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Configure notification handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const { user, role } = useAuth();
    const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
    const [notification, setNotification] = useState<Notifications.Notification | null>(null);
    const [notificationsEnabled, setNotificationsEnabledState] = useState(true);

    const notificationListener = useRef<Notifications.EventSubscription>(null);
    const responseListener = useRef<Notifications.EventSubscription>(null);
    const lastSentRef = useRef<string | null>(null);
    const lastSilentRefreshRef = useRef<number>(0);

    const refreshDashboardSilently = useCallback(async (data: any = {}) => {
        if (!user) {
            return;
        }

        const now = Date.now();
        if (now - lastSilentRefreshRef.current < 3000) {
            return;
        }
        lastSilentRefreshRef.current = now;

        const type = String(data?.type || '').toUpperCase();
        const refreshableTypes = new Set([
            'NEW_FOOD',
            'CLAIM_ALERT',
            'CLAIM',
            'CLAIM_BAN',
            'CLAIM_TIMEOUT_WARNING',
            'CLAIM_TIMEOUT',
            'ON_THE_WAY',
            'RECEIVE_REQUIRED',
            'DELIVERY_CONFIRMED',
            'CONFIRM',
            'AUTO_RECEIVED',
            'FEEDBACK_REMINDER',
            'NEW_MESSAGE',
            'DONATION_CANCELLED',
            'FOOD_EXPIRED',
        ]);

        try {
            if (refreshableTypes.has(type)) {
                const activeRole = role || await AsyncStorage.getItem('userRole');

                if (activeRole === 'DONOR') {
                    const response = await axiosClient.get(API_ENDPOINTS.DASHBOARD.DONOR);
                    await cacheData(CACHE_KEYS.DONOR_DASHBOARD, response.data);
                } else if (activeRole === 'RECIPIENT') {
                    const response = await axiosClient.get(API_ENDPOINTS.DASHBOARD.RECIPIENT);
                    await cacheData(CACHE_KEYS.RECIPIENT_DASHBOARD, response.data);
                }
            }
        } catch (error) {
            console.warn('[NotificationContext] Silent dashboard refresh failed:', error);
        } finally {
            // Home screens listen to this and refresh quietly without full-screen loaders.
            DeviceEventEmitter.emit('dashboard:force-refresh');
        }
    }, [user, role]);

    // Get the native FCM token directly
    const registerToken = useCallback(async () => {
        if (!Device.isDevice) {
            console.log('[NotificationContext] Push notifications require a physical device');
            return undefined;
        }

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('[NotificationContext] Failed to get push notification permission');
            return undefined;
        }

        try {
            const deviceToken = await Notifications.getDevicePushTokenAsync();
            const token = deviceToken.data;
            setExpoPushToken(token);
            console.log("[NotificationContext] FCM token obtained:", token.substring(0, 20) + "...");
            return token;
        } catch (error) {
            console.error('[NotificationContext] Error getting FCM token:', error);
            return undefined;
        }
    }, []);

    const syncTokenAndLocation = useCallback(async (retryCount = 0) => {
        if (!user) return;

        // Check preferences
        const prefs = await AsyncStorage.getItem('notificationsEnabled');
        if (prefs === 'false') {
            console.log("[NotificationContext] Notifications disabled, skipping sync");
            return;
        }

        let token = expoPushToken;
        if (!token) {
            token = await registerToken();
        }
        if (!token) return;

        let latitude: number | undefined;
        let longitude: number | undefined;

        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                latitude = location.coords.latitude;
                longitude = location.coords.longitude;
            }
        } catch (err) {
            console.warn("[NotificationContext] Location sync skipped:", err);
        }

        const locKey = latitude ? `${latitude.toFixed(2)},${longitude?.toFixed(2)}` : "no-loc";
        const key = `${user.id}:${token}:${locKey}`;
        if (lastSentRef.current === key) return;

        try {
            console.log(`[NotificationContext] Syncing token & location (attempt ${retryCount + 1})...`);
            await axiosClient.put('/users/push-token', {
                pushToken: token,
                latitude,
                longitude
            });
            lastSentRef.current = key;
            console.log("[NotificationContext] ✅ Sync complete");
        } catch (err: any) {
            console.error("[NotificationContext] Sync failed:", err.message);
            if (retryCount < 2) {
                setTimeout(() => syncTokenAndLocation(retryCount + 1), 5000 * (retryCount + 1));
            }
        }
    }, [user, expoPushToken, registerToken]);

    const setNotificationsEnabled = useCallback(async (enabled: boolean) => {
        setNotificationsEnabledState(enabled);
        await AsyncStorage.setItem('notificationsEnabled', String(enabled));

        if (user) {
            try {
                if (enabled) {
                    await syncTokenAndLocation();
                } else {
                    await axiosClient.put('/users/push-token', { pushToken: null });
                    lastSentRef.current = null;
                }
            } catch (error) {
                console.error("[NotificationContext] Error updating notification preference:", error);
            }
        }
    }, [user, syncTokenAndLocation]);

    useEffect(() => {
        AsyncStorage.getItem('notificationsEnabled').then(val => {
            if (val === 'false') setNotificationsEnabledState(false);
        });

        registerToken();

        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            setNotification(notification);
            const data = notification.request?.content?.data || {};
            refreshDashboardSilently(data).catch(() => {
                // No-op: failure already handled in refreshDashboardSilently
            });
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
            const data = response.notification.request?.content?.data || {};
            refreshDashboardSilently(data).catch(() => {
                // No-op: failure already handled in refreshDashboardSilently
            });
        });

        return () => {
            notificationListener.current && notificationListener.current.remove();
            responseListener.current && responseListener.current.remove();
        };
    }, [registerToken, refreshDashboardSilently]);

    // Perform sync when user or token becomes available
    useEffect(() => {
        if (user && notificationsEnabled) {
            syncTokenAndLocation();
        }
    }, [user, notificationsEnabled, syncTokenAndLocation]);

    return (
        <NotificationContext.Provider value={{
            expoPushToken,
            notification,
            clearNotification: () => setNotification(null),
            registerToken,
            notificationsEnabled,
            setNotificationsEnabled,
            syncTokenAndLocation
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};
