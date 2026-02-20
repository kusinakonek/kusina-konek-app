import React from 'react';
import { View, Modal as RNModal, StyleSheet, TouchableWithoutFeedback, ViewStyle } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';

interface ModalProps {
    visible: boolean;
    onClose: () => void;
    children: React.ReactNode;
    style?: ViewStyle;
    transparent?: boolean;
    animationType?: 'none' | 'slide' | 'fade';
}

export const Modal: React.FC<ModalProps> = ({
    visible,
    onClose,
    children,
    style,
    transparent = true,
    animationType = 'fade'
}) => {
    const { colors } = useTheme();

    return (
        <RNModal
            visible={visible}
            transparent={transparent}
            animationType={animationType}
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={[styles.content, { backgroundColor: colors.card }, style]}>
                            {children}
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </RNModal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    content: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '100%', maxWidth: 400, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 5 },
});
