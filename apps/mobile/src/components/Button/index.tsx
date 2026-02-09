import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
    onPress: () => void;
    title: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'small' | 'medium' | 'large';
    disabled?: boolean;
    loading?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    onPress,
    title,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    style,
    textStyle,
    icon
}) => {
    return (
        <TouchableOpacity
            style={[
                styles.button,
                styles[variant],
                styles[size],
                disabled && styles.disabled,
                style
            ]}
            onPress={onPress}
            disabled={disabled || loading}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? '#00C853' : '#fff'} />
            ) : (
                <>
                    {icon}
                    <Text style={[
                        styles.text,
                        styles[`${variant}Text`],
                        styles[`${size}Text`],
                        textStyle
                    ]}>
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
    disabled: { opacity: 0.5 },

    // Variants
    primary: { backgroundColor: '#00C853' },
    secondary: { backgroundColor: '#2962FF' },
    outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#00C853' },
    ghost: { backgroundColor: 'transparent' },

    // Sizes
    small: { paddingVertical: 6, paddingHorizontal: 12 },
    medium: { paddingVertical: 12, paddingHorizontal: 20 },
    large: { paddingVertical: 16, paddingHorizontal: 24 },

    // Text Styles
    text: { fontWeight: '600' },
    primaryText: { color: '#fff' },
    secondaryText: { color: '#fff' },
    outlineText: { color: '#00C853' },
    ghostText: { color: '#00C853' },
    smallText: { fontSize: 14 },
    mediumText: { fontSize: 16 },
    largeText: { fontSize: 18 },
});
