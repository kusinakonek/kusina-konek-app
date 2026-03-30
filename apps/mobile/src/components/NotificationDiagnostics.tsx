import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { wp, hp, fp } from '../utils/responsive';
import { useAuth } from '../../context/AuthContext';
import { usePushNotifications } from '../hooks/usePushNotifications';
import axiosClient from '../api/axiosClient';

interface DiagnosticResult {
    label: string;
    status: 'pending' | 'success' | 'error';
    message: string;
}

export const NotificationDiagnostics = () => {
    const { user } = useAuth();
    const { expoPushToken, registerToken } = usePushNotifications();
    const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([
        { label: 'Auth Status', status: 'pending', message: 'Checking...' },
        { label: 'Push Token', status: 'pending', message: 'Checking...' },
        { label: 'Backend Sync', status: 'pending', message: 'Checking...' },
    ]);

    useEffect(() => {
        runDiagnostics();
    }, [user, expoPushToken]);

    const runDiagnostics = async () => {
        const results = [...diagnostics];

        // Check 1: Auth Status
        if (user) {
            results[0] = {
                label: 'Auth Status',
                status: 'success',
                message: ((user as any).firstName ? `${(user as any).firstName} ${(user as any).lastName || ''}` : user.email) || 'Unknown User',
            };
        } else {
            results[0] = {
                label: 'Auth Status',
                status: 'error',
                message: 'Not logged in',
            };
        }
        setDiagnostics([...results]);

        // Check 2: Push Token
        if (expoPushToken) {
            results[1] = {
                label: 'Push Token',
                status: 'success',
                message: `✅ ${expoPushToken.substring(0, 20)}...`,
            };
        } else {
            results[1] = {
                label: 'Push Token',
                status: 'error',
                message: 'No token registered',
            };
        }
        setDiagnostics([...results]);

        // Check 3: Backend Sync
        try {
            if (!user) throw new Error('User not authenticated');

            const response = await axiosClient.get('/users/profile');
            const syncedToken = response.data?.user?.pushToken;

            if (syncedToken === expoPushToken) {
                results[2] = {
                    label: 'Backend Sync',
                    status: 'success',
                    message: 'Token synced with backend ✅',
                };
            } else {
                results[2] = {
                    label: 'Backend Sync',
                    status: 'error',
                    message: `Mismatch: App=${expoPushToken?.substring(0, 10)}... | Backend=${syncedToken?.substring(0, 10)}...`,
                };
            }
        } catch (error: any) {
            results[2] = {
                label: 'Backend Sync',
                status: 'error',
                message: error.message || 'Failed to check sync',
            };
        }
        setDiagnostics([...results]);
    };

    const sendTestNotification = async () => {
        try {
            const response = await axiosClient.post('/notifications/test', {});
            console.log('[Diagnostics] Test notification sent:', response.data);
            alert('✅ Test notification sent! Check your phone.');
        } catch (error: any) {
            console.error('[Diagnostics] Error sending test:', error);
            alert(`❌ Error: ${error?.response?.data?.error || error.message}`);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success': return '#4CAF50';
            case 'error': return '#F44336';
            default: return '#2196F3';
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>🔧 Notification Diagnostics</Text>
            </View>

            <View style={styles.diagnosticsContainer}>
                {diagnostics.map((diag, index) => (
                    <View
                        key={index}
                        style={[
                            styles.diagnosticItem,
                            { borderLeftColor: getStatusColor(diag.status) },
                        ]}
                    >
                        <Text style={styles.diagnosticLabel}>{diag.label}</Text>
                        <Text style={[styles.diagnosticMessage, { color: getStatusColor(diag.status) }]}>
                            {diag.message}
                        </Text>
                    </View>
                ))}
            </View>

            <TouchableOpacity style={styles.button} onPress={sendTestNotification}>
                <Text style={styles.buttonText}>📤 Send Test Notification</Text>
            </TouchableOpacity>

            <View style={styles.instructions}>
                <Text style={styles.instructionTitle}>📋 Troubleshooting Steps:</Text>
                <Text style={styles.instructionText}>
                    1. Ensure notifications permission is granted in app settings{'\n'}
                    2. Token should be syncing to backend (check Backend Sync status){'\n'}
                    3. Send a test notification to verify end-to-end flow{'\n'}
                    4. Check browser console logs for errors
                </Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: wp(16),
        backgroundColor: '#f5f5f5',
    },
    header: {
        marginBottom: hp(24),
    },
    title: {
        fontSize: fp(20),
        fontWeight: 'bold',
        color: '#333',
    },
    diagnosticsContainer: {
        marginBottom: hp(24),
    },
    diagnosticItem: {
        backgroundColor: '#fff',
        padding: wp(12),
        marginBottom: hp(12),
        borderRadius: 8,
        borderLeftWidth: 4,
    },
    diagnosticLabel: {
        fontSize: fp(14),
        fontWeight: '600',
        color: '#333',
        marginBottom: hp(4),
    },
    diagnosticMessage: {
        fontSize: fp(12),
        color: '#666',
    },
    button: {
        backgroundColor: '#2196F3',
        padding: wp(16),
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: hp(24),
    },
    buttonText: {
        color: '#fff',
        fontSize: fp(14),
        fontWeight: '600',
    },
    instructions: {
        backgroundColor: '#FFF3E0',
        padding: wp(12),
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#FF9800',
    },
    instructionTitle: {
        fontSize: fp(14),
        fontWeight: '600',
        color: '#E65100',
        marginBottom: hp(8),
    },
    instructionText: {
        fontSize: fp(12),
        color: '#BF360C',
        lineHeight: 20,
    },
});
