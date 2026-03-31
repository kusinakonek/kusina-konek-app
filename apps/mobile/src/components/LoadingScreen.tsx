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
import { useTheme } from '../../context/ThemeContext';
import { fp } from '../utils/responsive';

interface LoadingScreenProps {
    message?: string;
}

export default function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
    const { width, height } = useWindowDimensions();
    const isSmall = width < 360;
    const isLandscape = width > height;

    const spinAnim = useRef(new Animated.Value(0)).current;
    const dotAnim1 = useRef(new Animated.Value(0)).current;
    const dotAnim2 = useRef(new Animated.Value(0)).current;
    const dotAnim3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Optional: you can remove the spin loop entirely, or just keep it for reference.
        // For now, I'm bypassing starting the spin animation on `spinAnim`.

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

    const logoSize = isSmall ? width * 0.28 : isLandscape ? height * 0.22 : width * 0.32;
    const dotSize = isSmall ? 7 : 9;

    const spinRotation = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const { colors, isDark } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                <Animated.View style={[
                    // { transform: [{ rotate: spinRotation }] }, // Removed rotation
                    { marginBottom: height * 0.025 },
                    styles.logoShadow
                ]}>
                    <Image
                        source={require('../../assets/loading-opening.png')}
                        style={{
                            width: logoSize, 
                            height: logoSize,
                            borderRadius: logoSize / 2,
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
                                    backgroundColor: colors.primary
                                },
                            ]}
                        />
                    ))}
                </View>

                <Text style={[styles.text, { fontSize: fp(isSmall ? 13 : 15), color: colors.textSecondary }]}>
                    {message}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoShadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 8,
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
        // backgroundColor set dynamically
    },
    text: {
        fontWeight: '500',
        textAlign: 'center',
    },
});
