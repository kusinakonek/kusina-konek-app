import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { differenceInSeconds } from 'date-fns';

const TIMER_KEY_PREFIX = 'resend_timer_';
const ATTEMPTS_KEY_PREFIX = 'resend_attempts_';

// Cooldowns in seconds: 30s, 60s, 5m (300s), 24h (86400s)
const COOLDOWNS = [30, 60, 300, 86400];

export const useResendTimer = (email: string, type: 'signup' | 'reset') => {
    const [countdown, setCountdown] = useState(0);
    const [attempts, setAttempts] = useState(0);
    const [loading, setLoading] = useState(true);

    const storageKeyTimer = `${TIMER_KEY_PREFIX}${type}_${email}`;
    const storageKeyAttempts = `${ATTEMPTS_KEY_PREFIX}${type}_${email}`;

    // Load state from storage
    useEffect(() => {
        const loadState = async () => {
            try {
                const [storedTimer, storedAttempts] = await Promise.all([
                    AsyncStorage.getItem(storageKeyTimer),
                    AsyncStorage.getItem(storageKeyAttempts)
                ]);

                if (storedAttempts) {
                    setAttempts(parseInt(storedAttempts, 10));
                }

                if (storedTimer) {
                    const targetTime = parseInt(storedTimer, 10);
                    const now = Math.floor(Date.now() / 1000);
                    const diff = targetTime - now;
                    if (diff > 0) {
                        setCountdown(diff);
                    }
                }
            } catch (e) {
                console.error('Failed to load timer state', e);
            } finally {
                setLoading(false);
            }
        };

        if (email) {
            loadState();
        }
    }, [email, storageKeyTimer, storageKeyAttempts]);

    // Timer countdown effect
    useEffect(() => {
        if (countdown <= 0) return;

        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [countdown]);

    const startTimer = useCallback(async () => {
        const nextAttempts = attempts + 1;
        // Clamp to max index of COOLDOWNS array
        const cooldownIndex = Math.min(nextAttempts - 1, COOLDOWNS.length - 1);
        const cooldownSeconds = COOLDOWNS[cooldownIndex]; // Default to first bracket if 0 attempts

        const now = Math.floor(Date.now() / 1000);
        const targetTime = now + cooldownSeconds;

        setCountdown(cooldownSeconds);
        setAttempts(nextAttempts);

        try {
            await Promise.all([
                AsyncStorage.setItem(storageKeyTimer, targetTime.toString()),
                AsyncStorage.setItem(storageKeyAttempts, nextAttempts.toString())
            ]);
        } catch (e) {
            console.error('Failed to save timer state', e);
        }
    }, [attempts, storageKeyTimer, storageKeyAttempts]);

    const resetTimer = useCallback(async () => {
        setCountdown(0);
        setAttempts(0);
        try {
            await Promise.all([
                AsyncStorage.removeItem(storageKeyTimer),
                AsyncStorage.removeItem(storageKeyAttempts)
            ]);
        } catch (e) {
            console.error('Failed to clear timer state', e);
        }
    }, [storageKeyTimer, storageKeyAttempts]);

    return {
        countdown,
        attempts,
        loading,
        startTimer,
        resetTimer
    };
};
