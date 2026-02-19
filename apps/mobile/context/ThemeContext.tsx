import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const lightColors = {
    background: '#ffffff',
    surface: '#f8f9fa',
    card: '#ffffff',
    text: '#1a1a1a',
    textSecondary: '#666666',
    textTertiary: '#999999',
    border: '#f0f0f0',
    headerBg: '#ffffff',
    primary: '#00C853',
    primaryLight: '#E8F5E9',
    inputBg: '#f5f5f5',
    tabBar: '#ffffff',
    tabBarBorder: '#e0e0e0',
    statusBar: 'dark-content' as const,
};

export const darkColors = {
    background: '#121212',
    surface: '#1e1e1e',
    card: '#2c2c2c',
    text: '#e0e0e0',
    textSecondary: '#aaaaaa',
    textTertiary: '#888888',
    border: '#333333',
    headerBg: '#1e1e1e',
    primary: '#00C853',
    primaryLight: '#1b3a1b',
    inputBg: '#2c2c2c',
    tabBar: '#1e1e1e',
    tabBarBorder: '#333333',
    statusBar: 'light-content' as const,
};

export type ThemeColors = typeof lightColors;

interface ThemeContextType {
    isDark: boolean;
    colors: ThemeColors;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    isDark: false,
    colors: lightColors,
    toggleTheme: () => { },
});

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem('darkMode').then(val => {
            if (val === 'true') setIsDark(true);
        });
    }, []);

    const toggleTheme = async () => {
        const newVal = !isDark;
        setIsDark(newVal);
        await AsyncStorage.setItem('darkMode', String(newVal));
    };

    const colors = isDark ? darkColors : lightColors;

    return (
        <ThemeContext.Provider value={{ isDark, colors, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
