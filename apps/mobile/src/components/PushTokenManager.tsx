import { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../api/axiosClient';

export const PushTokenManager = ({ token }: { token?: string }) => {
    const { user } = useAuth();
    // Track the last user+token combo that was successfully sent to avoid duplicates
    const lastSentRef = useRef<string | null>(null);

    useEffect(() => {
        const updateToken = async () => {
            if (!user || !token) return;

            const key = `${user.id}:${token}`;
            if (lastSentRef.current === key) return; // already sent this combination

            try {
                await axiosClient.put('/users/push-token', { pushToken: token });
                lastSentRef.current = key;
                console.log("Push token updated for user", user.id);
            } catch (err) {
                console.error("Failed to update push token", err);
            }
        };
        updateToken();
    }, [user, token]);

    return null;
};
