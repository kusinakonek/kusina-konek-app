import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Camera, Scissors, SkipForward } from 'lucide-react-native';
import { wp, hp, fp } from '../utils/responsive';
import { theme } from '../constants/theme';
import { useTheme } from '../../context/ThemeContext';

interface CameraOptionModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectCrop: (crop: boolean) => void;
}

export default function CameraOptionModal({
    visible,
    onClose,
    onSelectCrop,
}: CameraOptionModalProps) {
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
                    {/* Camera Icon */}
                    <View style={styles.iconContainer}>
                        <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(0, 200, 83, 0.2)' : 'rgba(0, 200, 83, 0.1)' }]}>
                            <Camera
                                size={fp(36)}
                                color={theme.colors.primary}
                                strokeWidth={2.5}
                            />
                        </View>
                    </View>

                    {/* Title */}
                    <Text style={[styles.title, { color: colors.text }]}>Camera Option</Text>

                    {/* Message */}
                    <Text style={[styles.message, { color: colors.textSecondary }]}>
                        Would you like to crop your photo after taking it?
                    </Text>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.outlineButton, { borderColor: theme.colors.primary }]}
                            onPress={() => {
                                onSelectCrop(false);
                                onClose();
                            }}
                            activeOpacity={0.8}
                        >
                            <SkipForward size={fp(18)} color={theme.colors.primary} style={styles.buttonIcon} />
                            <Text style={[styles.outlineButtonText, { color: theme.colors.primary }]}>No, skip</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={() => {
                                onSelectCrop(true);
                                onClose();
                            }}
                            activeOpacity={0.8}
                        >
                            <Scissors size={fp(18)} color="#FFFFFF" style={styles.buttonIcon} />
                            <Text style={styles.primaryButtonText}>Yes, crop</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={onClose}
                    >
                        <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
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
        backgroundColor: 'rgba(0, 200, 83, 0.1)', // Light green bg
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
        backgroundColor: theme.colors.primary,
        borderRadius: wp(12),
        paddingVertical: hp(12),
        shadowColor: theme.colors.primary,
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
    cancelButton: {
        paddingVertical: hp(8),
        paddingHorizontal: wp(16),
    },
    cancelText: {
        fontSize: fp(14),
        fontWeight: '500',
    }
});
