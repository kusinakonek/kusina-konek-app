import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

// Simple Toast context/hook pattern is better, but this component can be used as a standalone or controlled component
// Or, if the codebase expects a singleton, we might need a library. 
// For now, providing a simple component that can be rendered conditionally.

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info';
    visible: boolean;
    onHide?: () => void;
    duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
    message,
    type = 'info',
    visible,
    onHide,
    duration = 3000
}) => {
    const [fadeAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        if (visible) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();

            const timer = setTimeout(() => {
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }).start(() => {
                    if (onHide) onHide();
                });
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [visible, duration, fadeAnim, onHide]);

    if (!visible) return null;

    return (
        <Animated.View style={[styles.container, styles[type], { opacity: fadeAnim }]}>
            <Text style={styles.text}>{message}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: { position: 'absolute', bottom: 50, left: 20, right: 20, padding: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', elevation: 6, zIndex: 1000 },
    text: { color: '#fff', fontWeight: 'bold' },
    success: { backgroundColor: '#00C853' },
    error: { backgroundColor: '#FF5252' },
    info: { backgroundColor: '#2962FF' },
});
