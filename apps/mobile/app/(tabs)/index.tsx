import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DonorHome from '../../src/donor/Home';
import RecipientHome from '../../src/recipient/Home';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';

export default function Home() {
    const { role, isLoading, user } = useAuth();

    useEffect(() => {
        // Redirect to welcome screen if user is not authenticated after loading completes
        if (!isLoading && !user) {
            router.replace('/(auth)/welcome');
        }
    }, [isLoading, user]);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00C853" />
            </View>
        );
    }

    // Show loading briefly while redirect happens
    if (!user) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00C853" />
            </View>
        );
    }

    return role === 'DONOR' ? <DonorHome /> : <RecipientHome />;
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
});
