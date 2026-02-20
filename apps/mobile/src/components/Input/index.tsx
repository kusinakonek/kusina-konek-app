import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: StyleProp<ViewStyle>;
}

export default function Input({
    label,
    error,
    containerStyle,
    style,
    placeholderTextColor,
    ...props
}: InputProps) {
    const { colors } = useTheme();
    const defaultPlaceholderColor = colors.textTertiary;

    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
            <TextInput
                style={[
                    styles.input,
                    {
                        backgroundColor: colors.inputBg,
                        borderColor: colors.border,
                        color: colors.text
                    },
                    props.multiline && styles.textArea,
                    error ? { borderColor: '#D32F2F', backgroundColor: '#FFEBEE' } : {},
                    style
                ]}
                placeholderTextColor={placeholderTextColor || defaultPlaceholderColor}
                textAlignVertical={props.multiline ? 'top' : 'center'}
                {...props}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#333',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    textArea: {
        minHeight: 100,
        paddingTop: 14,
    },
    errorText: {
        color: '#D32F2F',
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
});
