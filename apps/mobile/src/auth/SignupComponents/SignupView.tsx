import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, User, MapPin, Phone, ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { styles } from './SignupCSS/styles';
import { useSignupLogic } from './SignupJS/useSignupLogic';

export default function SignupView() {
    const {
        formData,
        handleChange,
        loading,
        showPassword,
        setShowPassword,
        showConfirmPassword,
        setShowConfirmPassword,
        handleSignup,
        passwordStrength,
        role,
        router
    } = useSignupLogic();

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Fixed Header */}
            <View style={styles.fixedHeader}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <ArrowLeft size={24} color="#333" />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <Image
                            source={require('../../../assets/KusinaKonek-Logo.png')}
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
                                placeholder="Phone Number *"
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
        </SafeAreaView>
    );
}
