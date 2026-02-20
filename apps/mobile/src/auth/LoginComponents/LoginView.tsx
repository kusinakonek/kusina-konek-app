import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { styles } from './LoginCSS/styles';
import { useLoginLogic } from './LoginJS/useLoginLogic';

import { useTheme } from '../../../context/ThemeContext';

export default function LoginView() {
    const {
        email,
        setEmail,
        password,
        setPassword,
        loading,
        showPassword,
        setShowPassword,
        handleLogin,
        role,
        router
    } = useLoginLogic();

    const { colors, isDark } = useTheme();

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['left', 'right']}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

            {/* Fixed Header */}
            <View style={[styles.fixedHeader, { backgroundColor: colors.background }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={[styles.container, { backgroundColor: colors.background }]}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <Image
                            source={require('../../../assets/KusinaKonek-Logo.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                        <Text style={[styles.title, { color: colors.text }]}>Welcome Back!</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            Login to continue as <Text style={styles.roleHighlight}>{role}</Text>
                        </Text>
                    </View>

                    <View style={styles.form}>
                        <View style={[styles.inputContainer, { backgroundColor: isDark ? colors.card : '#F5F5F5' }]}>
                            <Mail size={20} color={colors.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Email"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                placeholderTextColor={colors.textTertiary}
                            />
                        </View>

                        <View style={[styles.inputContainer, { backgroundColor: isDark ? colors.card : '#F5F5F5' }]}>
                            <Lock size={20} color={colors.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Password"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                placeholderTextColor={colors.textTertiary}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                {showPassword ? <EyeOff size={20} color={colors.textSecondary} /> : <Eye size={20} color={colors.textSecondary} />}
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.forgotPassword}
                            onPress={() => router.push('/(auth)/forgot-password')}
                        >
                            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Login</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: colors.textSecondary }]}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                            <Text style={styles.linkText}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
