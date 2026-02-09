import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// This screen is not directly accessed - the tab press is intercepted
// in _layout.tsx to navigate directly to donate/browse flows
export default function Action() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Loading...</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    text: {
        color: '#999',
    },
});
