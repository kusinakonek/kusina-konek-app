import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import { wp, hp, fp } from '../utils/responsive';
import { theme } from '../constants/theme';
import { useTheme } from '../../context/ThemeContext';

interface SuccessModalProps {
    visible: boolean;
    title?: string;
    message: string;
    buttonText?: string;
    onClose: () => void;
}

export default function SuccessModal({
    visible,
    title = 'Success!',
    message,
    buttonText = 'OK',
    onClose,
}: SuccessModalProps) {
    const { colors, isDark } = useTheme();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.card }]}>
                    {/* Success Icon */}
                    <View style={styles.iconContainer}>
                        <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)' }]}>
                            <CheckCircle
                                size={fp(40)}
                                color={theme.colors.primary}
                                strokeWidth={3}
                            />
                        </View>
                    </View>

                    {/* Title */}
                    <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

                    {/* Message */}
                    <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>

                    {/* Button */}
                    <TouchableOpacity
                        style={styles.button}
                        onPress={onClose}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>{buttonText}</Text>
                    </TouchableOpacity>
                </View>
            </View>
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
        backgroundColor: '#FFFFFF',
        borderRadius: wp(20),
        padding: wp(32),
        width: '100%',
        maxWidth: wp(340),
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    iconContainer: {
        marginBottom: hp(20),
    },
    iconCircle: {
        width: wp(80),
        height: wp(80),
        borderRadius: wp(40),
        backgroundColor: 'rgba(76, 175, 80, 0.1)', // Light green bg
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: fp(20),
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: hp(12),
        textAlign: 'center',
    },
    message: {
        fontSize: fp(14),
        color: theme.colors.mutedText,
        textAlign: 'center',
        lineHeight: fp(20),
        marginBottom: hp(24),
        paddingHorizontal: wp(8),
    },
    button: {
        backgroundColor: theme.colors.primary,
        borderRadius: wp(12),
        paddingVertical: hp(14),
        width: '100%',
        alignItems: 'center',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        fontSize: fp(16),
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
