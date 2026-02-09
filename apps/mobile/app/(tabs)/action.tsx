import React from 'react';
import { useAuth } from '../../context/AuthContext';
import AddFood from '../../src/donor/AddFood';
import BrowseFood from '../../src/recipient/BrowseFood';
import Cart from '../../src/recipient/Cart';
import { useLocalSearchParams } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

export default function Action() {
    const { role, isLoading } = useAuth();
    const params = useLocalSearchParams();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#00C853" />
            </View>
        );
    }

    if (role === 'RECIPIENT' && params.screen === 'Cart') {
        return <Cart />;
    }

    return role === 'DONOR' ? <AddFood /> : <BrowseFood />;
}
