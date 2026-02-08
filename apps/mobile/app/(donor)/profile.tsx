import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, LogOut, ChevronRight, Settings, Bell, HelpCircle } from 'lucide-react-native';

export default function DonorProfile() {
    const { user, signOut } = useAuth();

    const menuItems = [
        { icon: Settings, label: 'Settings', onPress: () => { } },
        { icon: Bell, label: 'Notifications', onPress: () => { } },
        { icon: HelpCircle, label: 'Help & Support', onPress: () => { } },
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatar}>
                        <User size={40} color="#00C853" />
                    </View>
                    <Text style={styles.userName}>{user?.email?.split('@')[0] || 'Donor'}</Text>
                    <View style={styles.emailRow}>
                        <Mail size={14} color="#666" />
                        <Text style={styles.email}>{user?.email || 'No email'}</Text>
                    </View>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>DONOR</Text>
                    </View>
                </View>

                {/* Menu Items */}
                <View style={styles.menu}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
                            <View style={styles.menuLeft}>
                                <item.icon size={22} color="#333" />
                                <Text style={styles.menuLabel}>{item.label}</Text>
                            </View>
                            <ChevronRight size={20} color="#999" />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
                    <LogOut size={20} color="#e53935" />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    container: {
        flex: 1,
        padding: 20,
    },
    profileHeader: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        marginBottom: 20,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    emailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
    },
    email: {
        fontSize: 14,
        color: '#666',
    },
    badge: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
    },
    badgeText: {
        color: '#00C853',
        fontWeight: '600',
        fontSize: 12,
    },
    menu: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    menuLabel: {
        fontSize: 16,
        color: '#333',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    logoutText: {
        color: '#e53935',
        fontSize: 16,
        fontWeight: '600',
    },
});
