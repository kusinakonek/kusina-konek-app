import { useRef, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useNotification } from '../../context/NotificationContext';

/**
 * Navigate to the appropriate screen based on notification type.
 */
function handleNotificationNavigation(data: any) {
    const type = data?.type;
    console.log("[usePushNotifications] Handling navigation for type:", type);

    switch (type) {
        case 'CLAIM_ALERT':
        case 'ON_THE_WAY':
        case 'DELIVERY_CONFIRMED':
            // Donor notifications → go to home (donor dashboard)
            router.push('/(tabs)');
            break;
        case 'NEW_FOOD':
            // Recipient notifications → go to browse food
            router.push('/(tabs)');
            break;
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
            handleNotificationNavigation(data);
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
