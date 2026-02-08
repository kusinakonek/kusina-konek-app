import React from 'react';
import { Tabs, usePathname } from 'expo-router';
import { Home, User } from 'lucide-react-native';
import { View, StyleSheet, Image } from 'react-native';
import { DonationProvider } from '../../context/DonationContext';

export default function DonorTabLayout() {
    const pathname = usePathname();

    // Hide tab bar when in donation flow (not on first step)
    const hideTabBar = pathname?.includes('/donate/details') || pathname?.includes('/donate/location');

    return (
        <DonationProvider>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: '#00C853',
                    tabBarInactiveTintColor: '#999',
                    tabBarStyle: hideTabBar ? { display: 'none' } : {
                        borderTopWidth: 1,
                        borderTopColor: '#f0f0f0',
                        height: 75,
                        paddingBottom: 12,
                        paddingTop: 8,
                        backgroundColor: '#fff',
                    },
                    tabBarLabelStyle: {
                        fontSize: 12,
                        fontWeight: '500',
                    },
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: 'Home',
                        tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="donate"
                    options={{
                        title: '',
                        tabBarIcon: () => (
                            <View style={styles.donateButton}>
                                <Image
                                    source={require('../../assets/adaptive-icon.png')}
                                    style={styles.donateIcon}
                                    resizeMode="contain"
                                />
                            </View>
                        ),
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        title: 'Profile',
                        tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
                    }}
                />
            </Tabs>
        </DonationProvider>
    );
}

const styles = StyleSheet.create({
    donateButton: {
        backgroundColor: '#00C853',
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -38,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    donateIcon: {
        width: 58,
        height: 58,
    },
});



