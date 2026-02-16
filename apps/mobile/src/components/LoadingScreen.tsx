import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    Animated,
    Easing,
    useWindowDimensions,
} from 'react-native';
import { theme } from '../constants/theme';
import { fp } from '../utils/responsive';

interface LoadingScreenProps {
    message?: string;
}

export default function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
    const { width, height } = useWindowDimensions();
    const isSmall = width < 360;
    const isLandscape = width > height;

    const pulseAnim = useRef(new Animated.Value(1)).current;
    const dotAnim1 = useRef(new Animated.Value(0)).current;
    const dotAnim2 = useRef(new Animated.Value(0)).current;
    const dotAnim3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Logo pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.08,
                    duration: 900,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 900,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ]),
        ).start();

        // Bouncing dots animation
        const animateDot = (anim: Animated.Value, delay: number) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(anim, {
                        toValue: -8,
                        duration: 300,
                        easing: Easing.out(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim, {
                        toValue: 0,
                        duration: 300,
                        easing: Easing.in(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.delay(600 - delay),
                ]),
            );

        animateDot(dotAnim1, 0).start();
        animateDot(dotAnim2, 150).start();
        animateDot(dotAnim3, 300).start();
    }, []);

    const logoSize = isSmall ? width * 0.22 : isLandscape ? height * 0.18 : width * 0.24;
    const dotSize = isSmall ? 7 : 9;

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <Image
                        source={require('../../assets/KusinaKonek-Logo.png')}
                        style={{
                            width: logoSize,
                            height: logoSize,
                            marginBottom: height * 0.025,
                        }}
                        resizeMode="contain"
                    />
                </Animated.View>

                {/* Bouncing dots */}
                <View style={styles.dotsContainer}>
                    {[dotAnim1, dotAnim2, dotAnim3].map((anim, i) => (
                        <Animated.View
                            key={i}
                            style={[
                                styles.dot,
                                {
                                    width: dotSize,
                                    height: dotSize,
                                    borderRadius: dotSize / 2,
                                    transform: [{ translateY: anim }],
                                },
                            ]}
                        />
                    ))}
                </View>

                <Text style={[styles.text, { fontSize: fp(isSmall ? 13 : 15) }]}>
                    {message}
                </Text>
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
        paddingHorizontal: 24,
    },
    dotsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginBottom: 16,
        height: 24,
    },
    dot: {
        backgroundColor: theme.colors.primary,
    },
    text: {
        color: theme.colors.mutedText,
        fontWeight: '500',
        textAlign: 'center',
    },
});
