import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../api/axiosClient';
import { usePushNotifications } from '../hooks/usePushNotifications';

export const PushTokenManager = ({ token: initialToken }: { token?: string }) => {
    const { user } = useAuth();
    const { registerToken } = usePushNotifications();
    // Track the last user+token+location combo that was successfully sent to avoid duplicates
    const lastSentRef = useRef<string | null>(null);

    useEffect(() => {
        const updateTokenAndLocation = async (retryCount = 0) => {
            if (!user) {
                console.log("[PushTokenManager] No user logged in, skipping sync.");
                return;
            }

            let token = initialToken;

            // If token is missing but user is logged in, try to get it now
            if (!token) {
                console.log("[PushTokenManager] Token missing for logged-in user, attempting registration...");
                token = await registerToken();
            }

            if (!token) {
                console.warn("[PushTokenManager] Still no token after registration attempt. Will retry next mount or update.");
                return;
            }

            // Optional: Request location to update backend for proximity matching
            let currentLat: number | undefined;
            let currentLon: number | undefined;

            try {
                const { status } = await Location.requestForegroundPermissionsAsync();

                if (status === 'granted') {
                    const location = await Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.Balanced,
                    });
                    currentLat = location.coords.latitude;
                    currentLon = location.coords.longitude;
                }
            } catch (locationErr) {
                console.warn("[PushTokenManager] Could not get location for push registry:", locationErr);
            }

            const locKey = currentLat ? `${currentLat.toFixed(2)},${currentLon?.toFixed(2)}` : "no-loc";
            const key = `${user.id}:${token}:${locKey}`;

            if (lastSentRef.current === key) return;

            try {
                console.log(`[PushTokenManager] Syncing token with backend (attempt ${retryCount + 1})... Token: ${token.substring(0, 20)}...`);
                await axiosClient.put('/users/push-token', {
                    pushToken: token,
                    latitude: currentLat,
                    longitude: currentLon
                });
                lastSentRef.current = key;
                console.log("[PushTokenManager] Push token & location successfully updated for user", user.id);
            } catch (err: any) {
                const status = err?.response?.status;
                const message = err?.response?.data?.error || err?.message;

                console.error(`[PushTokenManager] Failed to update push token (status: ${status}):`, message);

                if ((status === 404 || status === 500 || !status) && retryCount < 3) {
                    const delay = 3000 * (retryCount + 1);
                    console.log(`[PushTokenManager] Retrying in ${delay / 1000}s...`);
                    setTimeout(() => updateTokenAndLocation(retryCount + 1), delay);
                }
            }
        };
        updateTokenAndLocation();
    }, [user, initialToken]);

    return null;
};

