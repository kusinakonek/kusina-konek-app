import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Bell } from 'lucide-react-native';
import { wp, hp, fp } from '../../utils/responsive';

interface NotificationBannerProps {
    visible: boolean;
    title: string;
    message: string;
    onClose: () => void;
    duration?: number;
}

export const NotificationBanner = ({
    visible,
    title,
    message,
    onClose,
    duration = 5000,
}: NotificationBannerProps) => {
    const slideAnim = useRef(new Animated.Value(-100)).current;
    const [isRendered, setIsRendered] = useState(visible);

    useEffect(() => {
        if (visible) {
            setIsRendered(true);
            // Slide down
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();

            // Auto hide
            const timer = setTimeout(() => {
                handleClose();
            }, duration);

            return () => clearTimeout(timer);
        } else {
            // Slide up (hidden state)
            Animated.timing(slideAnim, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                setIsRendered(false);
            });
        }
    }, [visible]);

    const handleClose = () => {
        Animated.timing(slideAnim, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setIsRendered(false);
            onClose();
        });
    };

    if (!isRendered) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                { transform: [{ translateY: slideAnim }] },
            ]}
        >
            <SafeAreaView edges={['top']} style={styles.safeArea}>
                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <Bell size={wp(20)} color="#fff" />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.title} numberOfLines={1}>
                            {title}
                        </Text>
                        <Text style={styles.message} numberOfLines={2}>
                            {message}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                        <X size={wp(20)} color="#fff" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: '#00C853',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    safeArea: {
        backgroundColor: 'transparent',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: wp(16),
        paddingVertical: hp(12),
        minHeight: hp(60),
    },
    iconContainer: {
        marginRight: wp(12),
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: wp(8),
        borderRadius: wp(20),
    },
    textContainer: {
        flex: 1,
        marginRight: wp(8),
    },
    title: {
        color: '#fff',
        fontSize: fp(14),
        fontWeight: 'bold',
        marginBottom: hp(2),
    },
    message: {
        color: '#fff',
        fontSize: fp(12),
        opacity: 0.9,
    },
    closeButton: {
        padding: wp(4),
    },
});
