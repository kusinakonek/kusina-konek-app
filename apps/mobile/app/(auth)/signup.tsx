import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, User, MapPin, Phone, ArrowLeft, Eye, EyeOff } from 'lucide-react-native';

// Password strength checker
const getPasswordStrength = (password: string) => {
    if (!password) return { label: '', color: 'transparent', percent: 0, score: 0 };

    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 2) return { label: 'Weak', color: '#e53935', percent: 33, score };
    if (score <= 3) return { label: 'Medium', color: '#FB8C00', percent: 66, score };
    return { label: 'Strong', color: '#00C853', percent: 100, score };
};

export default function Signup() {
    const router = useRouter();
    const { signUp, role } = useAuth();

    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        barangay: '',
        phoneNo: '',
    });

    const passwordStrength = useMemo(() => getPasswordStrength(formData.password), [formData.password]);

    const handleChange = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSignup = async () => {
        const { fullName, email, password, confirmPassword, barangay, phoneNo } = formData;

        if (!fullName || !email || !password || !confirmPassword || !barangay) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (password.length < 8) {
            Alert.alert('Error', 'Password must be at least 8 characters');
            return;
        }

        if (!role) {
            Alert.alert('Error', 'No role selected. Please restart the app.');
            return;
        }

        setLoading(true);
        try {
            await signUp(email.trim().toLowerCase(), password, {
                full_name: fullName,
                display_name: fullName,
                barangay,
                phone_no: phoneNo,
                role,
            });
            // Navigation to verify screen happens inside signUp
        } catch (error: any) {
            console.error(error);
            const message = error.message || 'Something went wrong';
            if (message.includes('already registered')) {
                Alert.alert('Signup Failed', 'An account with this email already exists');
            } else {
                Alert.alert('Signup Failed', message);
            }
        } finally {
            setLoading(false);
        }
    };


    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <ArrowLeft size={24} color="#333" />
                </TouchableOpacity>

                <View style={styles.header}>
                    <Image
                        source={require('../../assets/KusinaKonek-Logo.png')}
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>
                        Join our food sharing community as a <Text style={styles.roleHighlight}>{role}</Text>
                    </Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <User size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Full Name"
                            value={formData.fullName}
                            onChangeText={(text) => handleChange('fullName', text)}
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Mail size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            value={formData.email}
                            onChangeText={(text) => handleChange('email', text)}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <MapPin size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Barangay e.g., Abella"
                            value={formData.barangay}
                            onChangeText={(text) => handleChange('barangay', text)}
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Phone size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Phone Number (Optional)"
                            value={formData.phoneNo}
                            onChangeText={(text) => handleChange('phoneNo', text)}
                            keyboardType="phone-pad"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Lock size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            value={formData.password}
                            onChangeText={(text) => handleChange('password', text)}
                            secureTextEntry={!showPassword}
                            placeholderTextColor="#999"
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                            {showPassword ? <EyeOff size={20} color="#666" /> : <Eye size={20} color="#666" />}
                        </TouchableOpacity>
                    </View>

                    {/* Password Strength Indicator */}
                    {formData.password.length > 0 && (
                        <View style={styles.strengthContainer}>
                            <View style={styles.strengthBarBg}>
                                <View style={[styles.strengthBarFill, { width: `${passwordStrength.percent}%`, backgroundColor: passwordStrength.color }]} />
                            </View>
                            <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                                {passwordStrength.label}
                            </Text>
                            <View style={styles.strengthHints}>
                                <Text style={[styles.hintText, /[a-z]/.test(formData.password) && styles.hintMet]}>
                                    {/[a-z]/.test(formData.password) ? '✓' : '○'} lowercase
                                </Text>
                                <Text style={[styles.hintText, /[A-Z]/.test(formData.password) && styles.hintMet]}>
                                    {/[A-Z]/.test(formData.password) ? '✓' : '○'} UPPERCASE
                                </Text>
                                <Text style={[styles.hintText, /[0-9]/.test(formData.password) && styles.hintMet]}>
                                    {/[0-9]/.test(formData.password) ? '✓' : '○'} number
                                </Text>
                                <Text style={[styles.hintText, /[^a-zA-Z0-9]/.test(formData.password) && styles.hintMet]}>
                                    {/[^a-zA-Z0-9]/.test(formData.password) ? '✓' : '○'} symbol
                                </Text>
                                <Text style={[styles.hintText, formData.password.length >= 8 && styles.hintMet]}>
                                    {formData.password.length >= 8 ? '✓' : '○'} 8+ chars
                                </Text>
                            </View>
                        </View>
                    )}

                    <View style={styles.inputContainer}>
                        <Lock size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm Password"
                            value={formData.confirmPassword}
                            onChangeText={(text) => handleChange('confirmPassword', text)}
                            secureTextEntry={!showConfirmPassword}
                            placeholderTextColor="#999"
                        />
                        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                            {showConfirmPassword ? <EyeOff size={20} color="#666" /> : <Eye size={20} color="#666" />}
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleSignup}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Sign Up</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                        <Text style={styles.linkText}>Login</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center',
        paddingTop: 80,
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 24,
        zIndex: 1,
    },
    header: {
        marginBottom: 30,
        alignItems: 'center',
    },
    logoImage: {
        width: 90,
        height: 90,
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    roleHighlight: {
        color: '#00C853',
        fontWeight: '600',
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        marginBottom: 16,
        paddingHorizontal: 16,
        height: 56,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        height: '100%',
    },
    eyeIcon: {
        padding: 4,
    },
    button: {
        backgroundColor: '#00C853',
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        shadowColor: '#00C853',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        backgroundColor: '#A5D6A7',
        shadowOpacity: 0,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 32,
        marginBottom: 20,
    },
    footerText: {
        color: '#666',
        fontSize: 14,
    },
    linkText: {
        color: '#00C853',
        fontSize: 14,
        fontWeight: 'bold',
    },
    strengthContainer: {
        marginTop: -8,
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    strengthBarBg: {
        height: 6,
        backgroundColor: '#E0E0E0',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 6,
    },
    strengthBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    strengthLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 4,
    },
    strengthHints: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    hintText: {
        fontSize: 11,
        color: '#999',
    },
    hintMet: {
        color: '#00C853',
        fontWeight: '600',
    },
});
