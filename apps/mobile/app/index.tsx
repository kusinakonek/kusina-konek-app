import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet, Image, Text, Animated } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function Index() {
    const { userToken, isLoading, role } = useAuth();
    const [showSplash, setShowSplash] = useState(true);
    const fadeAnim = useState(new Animated.Value(0))[0];
    const scaleAnim = useState(new Animated.Value(0.8))[0];

    useEffect(() => {
        // Animate logo entrance
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 6,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();

        // Show splash for at least 2 seconds
        const timer = setTimeout(() => {
            setShowSplash(false);
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    if (isLoading || showSplash) {
        return (
            <View style={styles.container}>
                <Animated.View style={[styles.logoWrapper, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                    <Image
                        source={require('../assets/KusinaKonek-Logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.appName}>KusinaKonek</Text>
                    <Text style={styles.tagline}>Connecting communities through food</Text>
                </Animated.View>
                <ActivityIndicator size="large" color="#00C853" style={styles.loader} />
            </View>
        );
    }

    if (userToken) {
        // Both DONOR and RECIPIENT use the tabs view
        return <Redirect href="/(tabs)" />;
    }

    return <Redirect href="/(auth)/welcome" />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    logoWrapper: {
        alignItems: 'center',
    },
    logo: {
        width: 140,
        height: 140,
        marginBottom: 16,
    },
    appName: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    tagline: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    loader: {
        position: 'absolute',
        bottom: 80,
    },
});
