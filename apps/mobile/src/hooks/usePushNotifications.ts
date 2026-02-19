import { useState, useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { router } from 'expo-router';

// Configure: no in-app popup alert, but play sound and set badge
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: false,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: false,
        shouldShowList: true,
    }),
});

async function registerForPushNotificationsAsync() {
    let token: string | undefined;

    if (!Device.isDevice) {
        console.log('Push notifications require a physical device');
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
        console.log('Failed to get push notification permission');
        return undefined;
    }

    try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        token = (await Notifications.getExpoPushTokenAsync({
            projectId,
        })).data;
    } catch (error) {
        console.error('Error getting push token:', error);
    }

    return token;
}

/**
 * Navigate to the appropriate screen based on notification type.
 */
function handleNotificationNavigation(data: any) {
    const type = data?.type;
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
    const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
    const [notification, setNotification] = useState<Notifications.Notification | null>(null);
    const notificationListener = useRef<Notifications.EventSubscription>(null);
    const responseListener = useRef<Notifications.EventSubscription>(null);

    useEffect(() => {
        registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

        // Listen for foreground notifications (drives the slide-down banner)
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            setNotification(notification);
        });

        // Listen for notification taps (both foreground and background/killed)
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            handleNotificationNavigation(data);
        });

        return () => {
            notificationListener.current?.remove();
            responseListener.current?.remove();
        };
    }, []);

    const clearNotification = () => setNotification(null);

    return { expoPushToken, notification, clearNotification };
}
