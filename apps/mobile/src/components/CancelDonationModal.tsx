import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { AlertTriangle, Trash2, X } from 'lucide-react-native';
import { wp, hp, fp } from '../utils/responsive';
import { theme } from '../constants/theme';
import { useTheme } from '../../context/ThemeContext';

interface CancelDonationModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function CancelDonationModal({
    visible,
    onClose,
    onConfirm,
}: CancelDonationModalProps) {
    const { colors, isDark } = useTheme();
    const destructiveColor = '#e53935';

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.card }]}>
                    {/* Icon */}
                    <View style={styles.iconContainer}>
                        <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(229, 57, 53, 0.2)' : 'rgba(229, 57, 53, 0.1)' }]}>
                            <AlertTriangle
                                size={fp(36)}
                                color={destructiveColor}
                                strokeWidth={2.5}
                            />
                        </View>
                    </View>

                    {/* Title */}
                    <Text style={[styles.title, { color: colors.text }]}>Cancel Donation</Text>

                    {/* Message */}
                    <Text style={[styles.message, { color: colors.textSecondary }]}>
                        Are you sure you want to cancel this donation? This action cannot be undone.
                    </Text>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.outlineButton, { borderColor: colors.border }]}
                            onPress={onClose}
                            activeOpacity={0.8}
                        >
                            <X size={fp(18)} color={colors.text} style={styles.buttonIcon} />
                            <Text style={[styles.outlineButtonText, { color: colors.text }]}>Keep it</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.primaryButton, { backgroundColor: destructiveColor }]}
                            onPress={() => {
                                onConfirm();
                                onClose();
                            }}
                            activeOpacity={0.8}
                        >
                            <Trash2 size={fp(18)} color="#FFFFFF" style={styles.buttonIcon} />
                            <Text style={styles.primaryButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
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
        padding: wp(24),
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
        marginBottom: hp(16),
    },
    iconCircle: {
        width: wp(64),
        height: wp(64),
        borderRadius: wp(32),
        backgroundColor: 'rgba(229, 57, 53, 0.1)', // Light red bg
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: fp(18),
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: hp(8),
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
    buttonContainer: {
        flexDirection: 'row',
        gap: wp(12),
        width: '100%',
        marginBottom: hp(16),
    },
    buttonIcon: {
        marginRight: wp(6),
    },
    outlineButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderRadius: wp(12),
        paddingVertical: hp(12),
        backgroundColor: 'transparent',
    },
    outlineButtonText: {
        fontSize: fp(14),
        fontWeight: '600',
    },
    primaryButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: wp(12),
        paddingVertical: hp(12),
        shadowColor: '#e53935',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        fontSize: fp(14),
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
