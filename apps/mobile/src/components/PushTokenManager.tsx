import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../api/axiosClient';

export const PushTokenManager = ({ token }: { token?: string }) => {
    const { user } = useAuth();

    useEffect(() => {
        const updateToken = async () => {
            if (user && token) {
                try {
                    await axiosClient.put('/users/push-token', { pushToken: token });
                    console.log("Push token updated for user", user.id);
                } catch (err) {
                    console.error("Failed to update push token", err);
                }
            }
        };
        updateToken();
    }, [user, token]);

    return null;
};
