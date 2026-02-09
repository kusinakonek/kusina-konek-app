import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, LogOut, Phone, Mail, MapPin } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function Profile() {
    const { user, signOut, role } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await signOut();
            router.replace('/(auth)/login');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to logout');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>{user?.email?.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.name}>{user?.user_metadata?.full_name || 'User'}</Text>
                    <Text style={styles.email}>{user?.email}</Text>
                    <View style={styles.roleBadge}>
                        <Text style={styles.roleText}>{role || 'USER'}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account Information</Text>

                    <View style={styles.row}>
                        <Mail size={20} color="#666" />
                        <View style={styles.rowContent}>
                            <Text style={styles.label}>Email</Text>
                            <Text style={styles.value}>{user?.email}</Text>
                        </View>
                    </View>

                    <View style={styles.row}>
                        <Phone size={20} color="#666" />
                        <View style={styles.rowContent}>
                            <Text style={styles.label}>Phone</Text>
                            <Text style={styles.value}>{user?.phone || 'Not provided'}</Text>
                        </View>
                    </View>

                    <View style={styles.row}>
                        <MapPin size={20} color="#666" />
                        <View style={styles.rowContent}>
                            <Text style={styles.label}>Location</Text>
                            <Text style={styles.value}>Naga City</Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <LogOut size={20} color="#FF5252" style={{ marginRight: 10 }} />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9f9f9' },
    scrollContent: { padding: 20 },
    header: { alignItems: 'center', marginBottom: 30, backgroundColor: '#fff', padding: 20, borderRadius: 16, elevation: 2 },
    avatarContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#00C853', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    avatarText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
    name: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 5 },
    email: { fontSize: 16, color: '#666', marginBottom: 10 },
    roleBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    roleText: { color: '#2E7D32', fontWeight: 'bold', fontSize: 12 },
    section: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20, elevation: 1 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: '#1a1a1a' },
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    rowContent: { marginLeft: 15 },
    label: { fontSize: 12, color: '#999', marginBottom: 2 },
    value: { fontSize: 16, color: '#333' },
    logoutButton: { flexDirection: 'row', backgroundColor: '#FFEBEE', padding: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    logoutText: { color: '#FF5252', fontSize: 16, fontWeight: 'bold' }
});
