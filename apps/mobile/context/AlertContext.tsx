import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Pressable, Platform, Dimensions } from 'react-native';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react-native';
import { useTheme } from './ThemeContext';
import { hp, wp, fp } from '../src/utils/responsive';

// Emulating the native React Native Alert button interface
export interface CustomAlertButton {
    text?: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
}

export interface AlertOptions {
    title: string;
    message?: string;
    buttons?: CustomAlertButton[];
    type?: 'error' | 'success' | 'warning' | 'info';
}

interface AlertContextType {
    showAlert: (title: string, message?: string, buttons?: CustomAlertButton[], options?: { type?: 'error' | 'success' | 'warning' | 'info' }) => void;
    hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
    const [visible, setVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState<AlertOptions | null>(null);
    const { colors, isDark } = useTheme();

    const showAlert = useCallback((title: string, message?: string, buttons?: CustomAlertButton[], options?: { type?: 'error' | 'success' | 'warning' | 'info' }) => {

        // Auto-detect type based on title keywords if explicit type isn't provided
        let detectedType = options?.type || 'info';
        const lowerTitle = title.toLowerCase();
        if (!options?.type) {
            if (lowerTitle.includes('error') || lowerTitle.includes('failed') || lowerTitle.includes('denied')) detectedType = 'error';
            if (lowerTitle.includes('success') || lowerTitle.includes('thank you')) detectedType = 'success';
            if (lowerTitle.includes('warning') || lowerTitle.includes('expired')) detectedType = 'warning';
        }

        // Default to a single "OK" button if none provided (matching native Alert behavior)
        const defaultButtons: CustomAlertButton[] = [{ text: 'OK', style: 'default' }];

        setAlertConfig({
            title,
            message,
            buttons: buttons && buttons.length > 0 ? buttons : defaultButtons,
            type: detectedType as any,
        });
        setVisible(true);
    }, []);

    const hideAlert = useCallback(() => {
        setVisible(false);
        // Small delay before clearing config to allow exit animation to run smoothly if we add one later
        setTimeout(() => setAlertConfig(null), 300);
    }, []);

    // Helper to render the appropriate Icon
    const renderIcon = (type: string) => {
        const size = wp(48);
        switch (type) {
            case 'error': return <XCircle size={size} color="#EF4444" />;
            case 'success': return <CheckCircle2 size={size} color="#10B981" />;
            case 'warning': return <AlertCircle size={size} color="#F59E0B" />;
            case 'info':
            default: return <Info size={size} color="#3B82F6" />;
        }
    };

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert }}>
            {children}

            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={hideAlert}
            >
                <Pressable style={styles.overlay} /* Intentionally NOT closing on background tap to force user response, like native alerts */>
                    {alertConfig && (
                        <View style={[styles.alertBox, { backgroundColor: colors.card, shadowColor: isDark ? '#000' : '#888' }]}>

                            {/* Icon Header */}
                            <View style={styles.iconContainer}>
                                {renderIcon(alertConfig.type || 'info')}
                            </View>

                            {/* Text Content */}
                            <Text style={[styles.title, { color: colors.text }]}>
                                {alertConfig.title}
                            </Text>
                            {!!alertConfig.message && (
                                <Text style={[styles.message, { color: colors.textSecondary }]}>
                                    {alertConfig.message}
                                </Text>
                            )}

                            {/* Buttons Container */}
                            <View style={[
                                styles.buttonContainer,
                                // Stack vertically if there are more than 2 buttons or text is too long
                                (() => {
                                    const shouldStack = alertConfig.buttons!.length > 2 || alertConfig.buttons!.some(b => (b.text?.length || 0) > 14);
                                    return shouldStack ? { flexDirection: 'column' } : { flexDirection: 'row' };
                                })()
                            ]}>
                                {alertConfig.buttons!.map((btn, index) => {

                                    // Determine button color semantics
                                    let btnColor = isDark ? '#333' : '#F3F4F6'; // Default background (Cancel)
                                    let textColor = colors.text;

                                    if (btn.style === 'destructive') {
                                        btnColor = '#EF4444'; // Red for Delete/Logout confirm
                                        textColor = '#fff';
                                    } else if (btn.style === 'default' && alertConfig.buttons!.length <= 2 && index === alertConfig.buttons!.length - 1) {
                                        // The primary "OK" / "Confirm" button (rightmost if 2 buttons)
                                        btnColor = '#10B981'; // App Primary Green
                                        textColor = '#fff';
                                    } else if (btn.style === 'cancel') {
                                        // Ensure cancel stands out as secondary
                                        textColor = colors.textTertiary;
                                    }

                                    const shouldStack = alertConfig.buttons!.length > 2 || alertConfig.buttons!.some(b => (b.text?.length || 0) > 14);

                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            style={[
                                                styles.button,
                                                { backgroundColor: btnColor },
                                                shouldStack && { width: '100%', marginBottom: hp(8) },
                                                !shouldStack && { flex: 1, marginHorizontal: wp(4) }
                                            ]}
                                            onPress={() => {
                                                hideAlert();
                                                setTimeout(() => {
                                                    if (btn.onPress) btn.onPress();
                                                }, 50); // Small delay to let modal close before firing action
                                            }}
                                        >
                                            <Text style={[styles.buttonText, { color: textColor }]}>
                                                {btn.text || 'OK'}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    )}
                </Pressable>
            </Modal>
        </AlertContext.Provider>
    );
};

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: wp(20),
    },
    alertBox: {
        width: '100%',
        maxWidth: 360,
        borderRadius: wp(20),
        padding: wp(24),
        alignItems: 'center',
        elevation: 10,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
    },
    iconContainer: {
        marginBottom: hp(16),
    },
    title: {
        fontSize: fp(20),
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: hp(8),
    },
    message: {
        fontSize: fp(15),
        textAlign: 'center',
        lineHeight: fp(22),
        marginBottom: hp(24),
    },
    buttonContainer: {
        width: '100%',
        justifyContent: 'space-between',
        gap: wp(8),
    },
    button: {
        paddingVertical: hp(14),
        paddingHorizontal: wp(16),
        borderRadius: wp(12),
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        fontSize: fp(15),
        fontWeight: '600',
    }
});
