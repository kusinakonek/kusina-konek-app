import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';

export default function SignupView() {
    const router = useRouter();
    const { signUp } = useAuth();

    // Default to RECIPIENT, can be changed via UI if needed
    const [role, setRole] = useState<'DONOR' | 'RECIPIENT'>('RECIPIENT');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
    });
    const [loading, setLoading] = useState(false);

    const handleSignup = async () => {
        if (!formData.email || !formData.password || !formData.fullName) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await signUp(formData.email, formData.password, { full_name: formData.fullName, role });
            // Navigation handled by auth state
        } catch (error: any) {
            Alert.alert('Signup Failed', error.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Create Account</Text>

            <View style={styles.roleContainer}>
                <TouchableOpacity
                    style={[styles.roleButton, role === 'RECIPIENT' && styles.roleButtonActive]}
                    onPress={() => setRole('RECIPIENT')}
                >
                    <Text style={[styles.roleText, role === 'RECIPIENT' && styles.roleTextActive]}>Recipient</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.roleButton, role === 'DONOR' && styles.roleButtonActive]}
                    onPress={() => setRole('DONOR')}
                >
                    <Text style={[styles.roleText, role === 'DONOR' && styles.roleTextActive]}>Donor</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.form}>
                <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    value={formData.fullName}
                    onChangeText={(t) => setFormData({ ...formData, fullName: t })}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={formData.email}
                    onChangeText={(t) => setFormData({ ...formData, email: t })}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={formData.password}
                    onChangeText={(t) => setFormData({ ...formData, password: t })}
                    secureTextEntry
                />
                <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChangeText={(t) => setFormData({ ...formData, confirmPassword: t })}
                    secureTextEntry
                />

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleSignup}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>{loading ? 'Creating Account...' : 'Sign Up'}</Text>
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text>Already have an account? </Text>
                    <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                        <Text style={styles.link}>Login</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#00C853',
    },
    roleContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        gap: 10,
    },
    roleButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#00C853',
        alignItems: 'center',
    },
    roleButtonActive: {
        backgroundColor: '#00C853',
    },
    roleText: {
        color: '#00C853',
        fontWeight: '600',
    },
    roleTextActive: {
        color: '#fff',
    },
    form: {
        gap: 15,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 15,
        borderRadius: 8,
        fontSize: 16,
    },
    button: {
        backgroundColor: '#00C853',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    link: {
        color: '#00C853',
        fontWeight: 'bold',
    },
});
