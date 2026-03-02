import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    Easing,
} from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import { wp, hp, fp } from '../utils/responsive';
import { useTheme } from '../../context/ThemeContext';

interface SuccessModalProps {
    visible: boolean;
    onClose: () => void;
    title?: string;
    message?: string;
    buttonText?: string;
}

export default function SuccessModal({
    visible,
    onClose,
    title = 'Success!',
    message = 'Your action was completed successfully.',
    buttonText = 'Done',
}: SuccessModalProps) {
    const { colors, isDark } = useTheme();
    const successColor = '#00C853';

    // Animations
    const scaleAnim = useRef(new Animated.Value(0.6)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const checkScale = useRef(new Animated.Value(0)).current;
    const ringScale = useRef(new Animated.Value(0.5)).current;
    const ringOpacity = useRef(new Animated.Value(0.6)).current;

    useEffect(() => {
        if (visible) {
            // Reset values
            scaleAnim.setValue(0.6);
            opacityAnim.setValue(0);
            checkScale.setValue(0);
            ringScale.setValue(0.5);
            ringOpacity.setValue(0.6);

            // Modal entrance
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 6,
                    tension: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();

            // Check icon bounce-in (delayed)
            setTimeout(() => {
                Animated.spring(checkScale, {
                    toValue: 1,
                    friction: 4,
                    tension: 120,
                    useNativeDriver: true,
                }).start();
            }, 200);

            // Ripple ring effect
            Animated.loop(
                Animated.sequence([
                    Animated.parallel([
                        Animated.timing(ringScale, {
                            toValue: 1.8,
                            duration: 1400,
                            easing: Easing.out(Easing.ease),
                            useNativeDriver: true,
                        }),
                        Animated.timing(ringOpacity, {
                            toValue: 0,
                            duration: 1400,
                            easing: Easing.out(Easing.ease),
                            useNativeDriver: true,
                        }),
                    ]),
                    Animated.parallel([
                        Animated.timing(ringScale, {
                            toValue: 0.5,
                            duration: 0,
                            useNativeDriver: true,
                        }),
                        Animated.timing(ringOpacity, {
                            toValue: 0.6,
                            duration: 0,
                            useNativeDriver: true,
                        }),
                    ]),
                ]),
            ).start();
        }
    }, [visible]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
                <Animated.View
                    style={[
                        styles.container,
                        {
                            backgroundColor: colors.card,
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    {/* Animated icon area */}
                    <View style={styles.iconContainer}>
                        {/* Ripple ring */}
                        <Animated.View
                            style={[
                                styles.rippleRing,
                                {
                                    borderColor: successColor,
                                    transform: [{ scale: ringScale }],
                                    opacity: ringOpacity,
                                },
                            ]}
                        />
                        {/* Icon circle */}
                        <Animated.View
                            style={[
                                styles.iconCircle,
                                {
                                    backgroundColor: isDark
                                        ? 'rgba(0, 200, 83, 0.2)'
                                        : 'rgba(0, 200, 83, 0.1)',
                                    transform: [{ scale: checkScale }],
                                },
                            ]}
                        >
                            <CheckCircle
                                size={fp(40)}
                                color={successColor}
                                strokeWidth={2.5}
                            />
                        </Animated.View>
                    </View>

                    {/* Title */}
                    <Text style={[styles.title, { color: colors.text }]}>
                        {title}
                    </Text>

                    {/* Message */}
                    <Text style={[styles.message, { color: colors.textSecondary }]}>
                        {message}
                    </Text>

                    {/* Button */}
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: successColor }]}
                        onPress={onClose}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>{buttonText}</Text>
                    </TouchableOpacity>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: wp(24),
    },
    container: {
        borderRadius: wp(20),
        padding: wp(28),
        width: '100%',
        maxWidth: wp(340),
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 10,
    },
    iconContainer: {
        marginBottom: hp(20),
        justifyContent: 'center',
        alignItems: 'center',
        width: wp(80),
        height: wp(80),
    },
    rippleRing: {
        position: 'absolute',
        width: wp(72),
        height: wp(72),
        borderRadius: wp(36),
        borderWidth: 2,
    },
    iconCircle: {
        width: wp(72),
        height: wp(72),
        borderRadius: wp(36),
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: fp(20),
        fontWeight: '700',
        marginBottom: hp(8),
        textAlign: 'center',
    },
    message: {
        fontSize: fp(14),
        textAlign: 'center',
        lineHeight: fp(20),
        marginBottom: hp(24),
        paddingHorizontal: wp(8),
    },
    button: {
        width: '100%',
        borderRadius: wp(12),
        paddingVertical: hp(14),
        alignItems: 'center',
        shadowColor: '#00C853',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        fontSize: fp(16),
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
