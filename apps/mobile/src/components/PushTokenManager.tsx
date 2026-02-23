import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../api/axiosClient';

export const PushTokenManager = ({ token }: { token?: string }) => {
    const { user } = useAuth();
    // Track the last user+token+location combo that was successfully sent to avoid duplicates
    const lastSentRef = useRef<string | null>(null);

    useEffect(() => {
        const updateTokenAndLocation = async (retryCount = 0) => {
            if (!user || !token) return;

            // Optional: Request location to update backend for proximity matching
            let currentLat: number | undefined;
            let currentLon: number | undefined;

            try {
                // Only request if they're a recipient, since only they need proximity notifications
                // But doing it for everyone ensures we have their location if they switch.
                const { status } = await Location.requestForegroundPermissionsAsync();

                if (status === 'granted') {
                    // Fast, low accuracy request just to get a general vicinity for push notifications
                    const location = await Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.Balanced,
                    });
                    currentLat = location.coords.latitude;
                    currentLon = location.coords.longitude;
                }
            } catch (locationErr) {
                console.warn("[PushTokenManager] Could not get location for push registry:", locationErr);
            }

            // Include coordinates in key so it re-syncs if user moves significantly (simplified check)
            const locKey = currentLat ? `${currentLat.toFixed(2)},${currentLon?.toFixed(2)}` : "no-loc";
            const key = `${user.id}:${token}:${locKey}`;

            if (lastSentRef.current === key) return; // already sent this combination

            try {
                console.log(`[PushTokenManager] Attempting to sync token with backend (attempt ${retryCount + 1})...`);
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

                // If it's a 404/500 (user profile maybe not created yet) and we have retries left
                if ((status === 404 || status === 500 || !status) && retryCount < 3) {
                    const delay = 3000 * (retryCount + 1);
                    console.log(`[PushTokenManager] User profile may not be ready yet. Retrying in ${delay / 1000}s...`);
                    setTimeout(() => updateTokenAndLocation(retryCount + 1), delay);
                }
            }
        };
        updateTokenAndLocation();
    }, [user, token]);

    return null;
};

