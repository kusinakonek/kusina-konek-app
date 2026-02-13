import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { theme } from '../constants/theme';
import { wp, hp, fp } from '../utils/responsive';

interface LoadingScreenProps {
    message?: string;
}

export default function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Image
                    source={require('../../assets/KusinaKonek-Logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <ActivityIndicator size="large" color={theme.colors.primary} style={styles.spinner} />
                <Text style={styles.text}>{message}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
    },
    logo: {
        width: wp(100),
        height: wp(100),
        marginBottom: hp(24),
    },
    spinner: {
        marginBottom: hp(16),
    },
    text: {
        fontSize: fp(16),
        color: theme.colors.mutedText,
        fontWeight: '500',
    },
});
