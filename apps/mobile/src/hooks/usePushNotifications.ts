import { useRef, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotification } from '../../context/NotificationContext';

/**
 * Navigate to the appropriate screen based on notification type.
 */
async function handleNotificationNavigation(data: any) {
    const type = data?.type;
    console.log("[usePushNotifications] Handling navigation for type:", type);

    switch (type) {
        case 'CLAIM_ALERT':
        case 'CLAIM':
        case 'ON_THE_WAY':
        case 'DELIVERY_CONFIRMED':
        case 'CONFIRM':
        case 'DONATION_CANCELLED':
        case 'FOOD_EXPIRED':
            // Donor notifications → go to home (donor dashboard)
            router.push('/(tabs)');
            break;
        case 'NEW_FOOD':
            // Recipient notifications → go to browse food
            router.push('/(tabs)');
            break;
        case 'NEW_MESSAGE': {
            const disID = String(data?.disID || data?.entityID || '');
            if (!disID) {
                router.push('/(tabs)/notifications');
                break;
            }

            const role = await AsyncStorage.getItem('userRole');
            if (role === 'DONOR') {
                router.push({ pathname: '/(donor)/chat', params: { disID } });
            } else if (role === 'RECIPIENT') {
                router.push({ pathname: '/(recipient)/chat', params: { disID } });
            } else {
                router.push('/(tabs)/notifications');
            }
            break;
        }
        default:
            // Generic → go to notifications list
            router.push('/(tabs)/notifications');
            break;
    }
}

export function usePushNotifications() {
    const { expoPushToken, notification, clearNotification, registerToken, notificationsEnabled, setNotificationsEnabled } = useNotification();
    const responseListener = useRef<Notifications.EventSubscription>(null);

    useEffect(() => {
        // Listen for user interaction (when they click the notification)
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            handleNotificationNavigation(data).catch((error) => {
                console.error('[usePushNotifications] Navigation handler failed:', error);
            });
        });

        return () => {
            if (responseListener.current) responseListener.current.remove();
        };
    }, []);

    return {
        expoPushToken,
        notification,
        clearNotification,
        registerToken,
        notificationsEnabled,
        setNotificationsEnabled
    };
}
