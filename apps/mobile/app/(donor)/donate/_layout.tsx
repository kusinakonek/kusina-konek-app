import React from 'react';
import { Stack } from 'expo-router';

export default function DonateLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="details" />
            <Stack.Screen name="location" />
        </Stack>
    );
}
