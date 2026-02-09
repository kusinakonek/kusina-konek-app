import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface CardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    variant?: 'elevated' | 'outlined' | 'flat';
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'elevated' }) => {
    return (
        <View style={[styles.card, styles[variant], style]}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
    elevated: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    outlined: { borderWidth: 1, borderColor: '#e0e0e0' },
    flat: { backgroundColor: '#f5f5f5' },
});
