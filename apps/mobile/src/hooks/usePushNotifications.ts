import { useState, useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure: no in-app popup alert, but play sound and set badge
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

async function registerForPushNotificationsAsync() {
    // Check if user has explicitly disabled notifications
    const notificationsEnabled = await AsyncStorage.getItem('notificationsEnabled');
    if (notificationsEnabled === 'false') {
        return undefined; // Do not register
    }

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
        const fromExpoConfig = Constants.expoConfig?.extra?.eas?.projectId;
        const fromEasConfig = Constants.easConfig?.projectId;
        const projectId = fromExpoConfig ?? fromEasConfig ?? "d8943c07-cbc7-4ae8-86a2-783ff4283c00";

        console.log("[PushNotification] === DIAGNOSTICS ===");
        console.log("[PushNotification] Platform:", Platform.OS);
        console.log("[PushNotification] appOwnership:", Constants.appOwnership);
        console.log("[PushNotification] executionEnvironment:", Constants.executionEnvironment);
        console.log("[PushNotification] projectId from expoConfig:", fromExpoConfig);
        console.log("[PushNotification] projectId from easConfig:", fromEasConfig);
        console.log("[PushNotification] Resolved projectId:", projectId);
        console.log("[PushNotification] === END DIAGNOSTICS ===");

        const response = await Notifications.getExpoPushTokenAsync({
            projectId,
        });
        token = response.data;
        console.log("[PushNotification] Successfully generated token:", token);
        console.log("[PushNotification] Token prefix:", token?.substring(0, 25));
    } catch (error: any) {
        console.error('[PushNotification] Error getting push token:', error);
        // Log more detail if available
        if (error.code) console.error('[PushNotification] Error code:', error.code);
        if (error.message) console.error('[PushNotification] Error message:', error.message);
        if (error.stack) console.error('[PushNotification] Stack trace:', error.stack);

        // Specific advice for common error codes
        if (error.code === 'MISSING_PROJECT_ID') {
            console.error('[PushNotification] PRO TIP: Check if app.json has extra.eas.projectId');
        }
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

    const registerToken = async () => {
        const token = await registerForPushNotificationsAsync();
        setExpoPushToken(token);
        return token;
    };

    const clearNotification = () => setNotification(null);

    return { expoPushToken, notification, clearNotification, registerToken };
}
