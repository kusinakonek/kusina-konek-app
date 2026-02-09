import React from 'react';
import { ActivityIndicator, View, StyleSheet, ActivityIndicatorProps } from 'react-native';

interface SpinnerProps extends ActivityIndicatorProps {
    fullScreen?: boolean;
}

export const Spinner: React.FC<SpinnerProps> = ({ fullScreen, size = 'large', color = '#00C853', ...props }) => {
    if (fullScreen) {
        return (
            <View style={styles.fullScreen}>
                <ActivityIndicator size={size} color={color} {...props} />
            </View>
        );
    }
    return <ActivityIndicator size={size} color={color} {...props} />;
};

const styles = StyleSheet.create({
    fullScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.8)', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 },
});
