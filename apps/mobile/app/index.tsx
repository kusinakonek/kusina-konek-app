import { useEffect, useState, useRef } from 'react';
import { Redirect } from 'expo-router';
import { View, StyleSheet, Image as RNImage, Text, Animated, Dimensions, StatusBar } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const LOADING_BAR_WIDTH = width * 0.6;

export default function Index() {
    const { userToken, isLoading, role } = useAuth();
    const [showSplash, setShowSplash] = useState(true);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.6)).current;
    const loadingProgress = useRef(new Animated.Value(0)).current;
    const footerFade = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Animate logo entrance
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 6,
                tension: 50,
                useNativeDriver: true,
            }),
        ]).start();

        // Animate loading bar
        Animated.timing(loadingProgress, {
            toValue: 1,
            duration: 2200,
            useNativeDriver: false,
        }).start();

        // Fade in footer
        Animated.timing(footerFade, {
            toValue: 1,
            duration: 800,
            delay: 400,
            useNativeDriver: true,
        }).start();

        // Show splash for at least 2.5 seconds
        const timer = setTimeout(() => {
            setShowSplash(false);
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    if (isLoading || showSplash) {
        const loadingBarWidth = loadingProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, LOADING_BAR_WIDTH],
        });

        return (
            <LinearGradient
                colors={['#00E676', '#00C853', '#00A844']}
                style={styles.container}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
            >
                <StatusBar barStyle="light-content" backgroundColor="#00C853" />

                <Animated.View style={[styles.logoWrapper, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                    {/* White circle with logo */}
                    <View style={styles.logoCircle}>
                        <RNImage
                            source={require('../assets/KUSINAKONEK-NEW-LOGO.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>

                    {/* App name and tagline */}
                    <Text style={styles.appName}>KusinaKonek</Text>
                    <Text style={styles.tagline}>Sharing food, connecting hearts</Text>
                </Animated.View>

                {/* Loading bar */}
                <View style={styles.loadingSection}>
                    <View style={styles.loadingBarContainer}>
                        <Animated.View style={[styles.loadingBarFill, { width: loadingBarWidth }]} />
                    </View>
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>

                {/* Footer */}
                <Animated.View style={[styles.footer, { opacity: footerFade }]}>
                    <Text style={styles.footerText}>Naga City Food Sharing Platform</Text>
                </Animated.View>
            </LinearGradient>
        );
    }

    if (userToken) {
        return <Redirect href="/(tabs)" />;
    }

    return <Redirect href="/(auth)/welcome" />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoWrapper: {
        alignItems: 'center',
    },
    logoCircle: {
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    logo: {
        width: 180,
        height: 180,
    },
    appName: {
        fontSize: 34,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
        letterSpacing: 1,
    },
    tagline: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        fontWeight: '400',
    },
    loadingSection: {
        position: 'absolute',
        bottom: 120,
        alignItems: 'center',
    },
    loadingBarContainer: {
        width: LOADING_BAR_WIDTH,
        height: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 12,
    },
    loadingBarFill: {
        height: '100%',
        backgroundColor: '#fff',
        borderRadius: 3,
    },
    loadingText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '500',
    },
    footer: {
        position: 'absolute',
        bottom: 50,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.7)',
        fontWeight: '400',
    },
});
