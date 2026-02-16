import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform, SafeAreaView } from 'react-native';
import { X, Bell } from 'lucide-react-native';

interface NotificationBannerProps {
    title: string;
    message: string;
    visible: boolean;
    onPress?: () => void;
    onClose: () => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
    title,
    message,
    visible,
    onPress,
    onClose,
}) => {
    const slideAnim = useRef(new Animated.Value(-200)).current;

    useEffect(() => {
        if (visible) {
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }).start();

            // Auto hide
            const timer = setTimeout(() => {
                handleClose();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [visible]);

    const handleClose = () => {
        Animated.timing(slideAnim, {
            toValue: -200,
            duration: 300,
            useNativeDriver: true,
        }).start(() => onClose());
    };

    if (!visible) return null;

    return (
        <Animated.View style={[styles.wrapper, { transform: [{ translateY: slideAnim }] }]}>
            <SafeAreaView>
                <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.container}>
                    <View style={styles.iconContainer}>
                        <Bell size={24} color="#FFF" />
                    </View>
                    <View style={styles.contentContainer}>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.message} numberOfLines={2}>{message}</Text>
                    </View>
                </TouchableOpacity>
            </SafeAreaView>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? 40 : 10,
    },
    container: {
        backgroundColor: 'rgba(32, 32, 32, 0.95)',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FF6F00', // Brand Accent
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    contentContainer: {
        flex: 1,
    },
    title: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    message: {
        color: '#E0E0E0',
        fontSize: 13,
    },
});
