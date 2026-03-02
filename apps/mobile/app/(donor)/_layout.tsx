import React from 'react';
import { Stack } from 'expo-router';
import { DonationProvider } from '../../context/DonationContext';

export default function DonorLayout() {
    return (
        <DonationProvider>
            <Stack
                screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                }}
            >
                <Stack.Screen name="donate/index" />
                <Stack.Screen name="all-recent-donations" />
            </Stack>
        </DonationProvider>
    );
}



