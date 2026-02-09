import React from 'react';
import { useAuth } from '../../context/AuthContext';
import DonorHome from '../../src/donor/Home';
import RecipientHome from '../../src/recipient/Home';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function Home() {
    const { role, isLoading } = useAuth();
    //...
    if (isLoading) {
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
