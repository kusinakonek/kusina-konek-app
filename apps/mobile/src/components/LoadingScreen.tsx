import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    Animated,
    Easing,
    useWindowDimensions,
    ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { fp } from '../utils/responsive';

interface LoadingScreenProps {
    message?: string;
    steps?: string[];
    currentStep?: number;
    progress?: number;
    isLogout?: boolean;
    logoutName?: string;
}

export default function LoadingScreen({ 
    message = 'Loading...', 
    steps, 
    currentStep = 0, 
    progress = 0, 
    isLogout = false, 
    logoutName 
}: LoadingScreenProps) {
    const { width, height } = useWindowDimensions();
    const isSmall = width < 360;
    const isLandscape = width > height;

    const { colors } = useTheme();

    const dotAnim1 = useRef(new Animated.Value(0)).current;
    const dotAnim2 = useRef(new Animated.Value(0)).current;
    const dotAnim3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
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

    const renderProgressBar = () => {
        if (progress === undefined || !steps) return null;
        const widthPercent = `${Math.min(1, Math.max(0, progress)) * 100}%`;
        return (
            <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarGutter, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
                <View style={[styles.progressBarFill, { backgroundColor: '#FFFFFF', width: widthPercent as any }]} />
            </View>
        );
    };

    const renderSteps = () => {
        if (!steps || steps.length === 0) return null;
        return (
            <View style={styles.stepsContainer}>
                {steps.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isCurrent = index === currentStep;
                    const isUpcoming = index > currentStep;
                    
                    let indicator = null;
                    if (isCompleted) {
                        indicator = (
                            <View style={[styles.pill, styles.pillCompleted, { backgroundColor: '#FFFFFF', overflow: 'hidden' }]}>
                                <MaterialCommunityIcons name="check-circle" size={16} color={colors.primary} />
                            </View>
                        );
                    } else if (isCurrent) {
                        indicator = (
                            <View style={[styles.pill, styles.pillCurrent, { borderColor: '#FFFFFF', backgroundColor: 'transparent' }]}>
                                <ActivityIndicator size="small" color="#FFFFFF" style={{ transform: [{ scale: 0.75 }] }} />
                            </View>
                        );
                    } else {
                        indicator = (
                            <View style={[styles.pill, styles.pillUpcoming, { borderColor: 'rgba(255,255,255,0.5)', backgroundColor: 'transparent' }]} />
                        );
                    }

                    return (
                        <View key={step} style={styles.stepRow}>
                            <View style={styles.indicatorContainer}>
                                {indicator}
                            </View>
                            <Text style={[
                                styles.stepText,
                                isCompleted && { color: '#FFFFFF', fontWeight: '600' },
                                isCurrent && { color: '#FFFFFF', fontWeight: '700', fontSize: fp(15) },
                                isUpcoming && { color: 'rgba(255,255,255,0.7)' }
                            ]}>
                                {step}
                            </Text>
                        </View>
                    );
                })}
            </View>
        );
    };

    const isPremiumUi = isLogout === true || (steps && steps.length > 0);

    if (!isPremiumUi) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={[styles.content, { justifyContent: 'center' }]}>
                    <View style={[styles.logoShadow, { marginBottom: 16 }]}>
                        <Image
                            source={require('../../assets/KUSINAKONEK-NEW-LOGO.png')}
                            style={{
                                width: logoSize,
                                height: logoSize,
                                borderRadius: logoSize / 2,
                            }}
                            resizeMode="contain"
                        />
                    </View>
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
                    <Text style={[styles.text, { fontSize: fp(isSmall ? 13 : 15), color: colors.textSecondary, marginTop: 16 }]}>
                        {message}
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.primary }]}>
            <View style={styles.content}>
                <View style={[
                    { marginBottom: height * 0.02 },
                    styles.logoShadow
                ]}>
                    <Image
                        source={require('../../assets/KUSINAKONEK-NEW-LOGO.png')}
                        style={{
                            width: logoSize, 
                            height: logoSize,
                            borderRadius: logoSize / 2,
                        }}
                        resizeMode="contain"
                    />
                </View>

                <View style={styles.headerContainer}>
                    <Text style={[styles.headerText, { color: '#FFFFFF' }]}>KusinaKonek</Text>
                    <Text style={[styles.subtitleText, { color: 'rgba(255,255,255,0.8)' }]}>Connecting Communities</Text>
                </View>

                {(!steps || steps.length === 0) && !isLogout && (
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
                                        backgroundColor: '#FFFFFF'
                                    },
                                ]}
                            />
                        ))}
                    </View>
                )}

                {isLogout ? (
                    <Text style={[styles.text, { fontSize: fp(isSmall ? 15 : 18), color: '#FFFFFF', marginTop: 16 }]}>
                        Goodbye {logoutName}...
                    </Text>
                ) : steps && steps.length > 0 ? (
                    <View style={[styles.detailsContainer, { backgroundColor: 'transparent', shadowOpacity: 0, elevation: 0 }]}>
                        <Text style={[styles.text, styles.almostReady, { color: '#FFFFFF' }]}>Almost ready...</Text>
                        {renderProgressBar()}
                        {renderSteps()}
                    </View>
                ) : null}
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
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    headerText: {
        fontSize: fp(26),
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    subtitleText: {
        fontSize: fp(14),
        fontWeight: '600',
        marginTop: 4,
        letterSpacing: 0.25,
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: 24,
        width: '100%',
    },
    detailsContainer: {
        width: '100%',
        maxWidth: 320,
        alignItems: 'center',
        marginTop: 15,
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    almostReady: {
        fontSize: fp(18),
        fontWeight: '700',
        marginBottom: 16,
        letterSpacing: 0.25,
    },
    progressBarContainer: {
        width: '100%',
        position: 'relative',
        height: 10,
        borderRadius: 5,
        overflow: 'hidden',
        marginBottom: 24,
    },
    progressBarGutter: {
        position: 'absolute',
        top: 0, left: 0, bottom: 0, right: 0,
        opacity: 0.6,
    },
    progressBarFill: {
        position: 'absolute',
        top: 0, left: 0, bottom: 0,
        borderRadius: 5,
    },
    stepsContainer: {
        width: '100%',
        paddingHorizontal: 5,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    indicatorContainer: {
        width: 36,
        alignItems: 'center',
        marginRight: 10,
    },
    pill: {
        height: 26,
        width: 26,
        borderRadius: 13,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF',
    },
    pillCompleted: {
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    pillCurrent: {
        borderWidth: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    pillUpcoming: {
        borderWidth: 1.5,
        backgroundColor: '#F5F5F5',
    },
    stepText: {
        fontSize: fp(14.5),
        fontWeight: '500',
    },
    dotsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 16,
        height: 24,
    },
    dot: {
        // dynamic background color
    },
    text: {
        fontWeight: '600',
        textAlign: 'center',
        letterSpacing: 0.25,
    },
});
