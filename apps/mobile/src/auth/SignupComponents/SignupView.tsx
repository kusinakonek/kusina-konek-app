import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, User, MapPin, Phone, ArrowLeft, Eye, EyeOff, Building2, CheckSquare, Square } from 'lucide-react-native';
import { styles } from './SignupCSS/styles';
import { useSignupLogic } from './SignupJS/useSignupLogic';

import { useTheme } from '../../../context/ThemeContext';

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
        router,
        emailError,
        phoneError
    } = useSignupLogic();

    const { colors, isDark } = useTheme();

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
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
                            source={require('../../../assets/KUSINAKONEK-NEW-LOGO.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                        <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            Join our food sharing community as a <Text style={styles.roleHighlight}>{role}</Text>
                        </Text>
                    </View>

                    <View style={styles.form}>
                        <View style={[styles.inputContainer, { backgroundColor: isDark ? colors.card : '#F5F5F5' }]}>
                            <User size={20} color={colors.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Full Name"
                                value={formData.fullName}
                                onChangeText={(text) => handleChange('fullName', text)}
                                placeholderTextColor={colors.textTertiary}
                            />
                        </View>

                        <View style={[styles.inputContainer, { backgroundColor: isDark ? colors.card : '#F5F5F5' }]}>
                            <Mail size={20} color={colors.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Email"
                                value={formData.email}
                                onChangeText={(text) => handleChange('email', text)}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                placeholderTextColor={colors.textTertiary}
                            />
                        </View>
                        {/* Error Message for Email */
                            emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

                        <View style={[styles.inputContainer, { backgroundColor: isDark ? colors.card : '#F5F5F5' }]}>
                            <MapPin size={20} color={colors.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Barangay e.g., Abella"
                                value={formData.barangay}
                                onChangeText={(text) => handleChange('barangay', text)}
                                placeholderTextColor={colors.textTertiary}
                            />
                        </View>

                        <View style={[styles.inputContainer, { backgroundColor: isDark ? colors.card : '#F5F5F5' }]}>
                            <Phone size={20} color={colors.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Phone Number *"
                                value={formData.phoneNo}
                                onChangeText={(text) => handleChange('phoneNo', text)}
                                keyboardType="phone-pad"
                                placeholderTextColor={colors.textTertiary}
                            />
                        </View>
                        {/* Error Message for Phone */
                            phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}

                        {/* Organization/LGU option - commented out for now
                        <TouchableOpacity
                            style={styles.checkboxContainer}
                            onPress={() => handleChange('isOrg', !formData.isOrg)}
                        >
                            {formData.isOrg ? (
                                <CheckSquare size={20} color="#00C853" />
                            ) : (
                                <Square size={20} color={colors.textSecondary} />
                            )}
                            <Text style={[styles.checkboxLabel, { color: colors.text }]}>Sign up as an Organization/LGU</Text>
                        </TouchableOpacity>

                        {formData.isOrg && (
                            <View style={[styles.inputContainer, { backgroundColor: isDark ? colors.card : '#F5F5F5' }]}>
                                <Building2 size={20} color={colors.textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="Organization / LGU Name *"
                                    value={formData.orgName}
                                    onChangeText={(text) => handleChange('orgName', text)}
                                    placeholderTextColor={colors.textTertiary}
                                />
                            </View>
                        )}
                        */}

                        <View style={[styles.inputContainer, { backgroundColor: isDark ? colors.card : '#F5F5F5' }]}>
                            <Lock size={20} color={colors.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Password"
                                value={formData.password}
                                onChangeText={(text) => handleChange('password', text)}
                                secureTextEntry={!showPassword}
                                placeholderTextColor={colors.textTertiary}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                {showPassword ? <EyeOff size={20} color={colors.textSecondary} /> : <Eye size={20} color={colors.textSecondary} />}
                            </TouchableOpacity>
                        </View>

                        {/* Password Strength Indicator */}
                        {formData.password.length > 0 && (
                            <View style={styles.strengthContainer}>
                                <View style={[styles.strengthBarBg, { backgroundColor: isDark ? '#444' : '#E0E0E0' }]}>
                                    <View style={[styles.strengthBarFill, { width: `${passwordStrength.percent}%`, backgroundColor: passwordStrength.color }]} />
                                </View>
                                <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                                    {passwordStrength.label}
                                </Text>
                                <View style={styles.strengthHints}>
                                    <Text style={[styles.hintText, { color: colors.textTertiary }, /[a-z]/.test(formData.password) && styles.hintMet]}>
                                        {/[a-z]/.test(formData.password) ? '✓' : '○'} lowercase
                                    </Text>
                                    <Text style={[styles.hintText, { color: colors.textTertiary }, /[A-Z]/.test(formData.password) && styles.hintMet]}>
                                        {/[A-Z]/.test(formData.password) ? '✓' : '○'} UPPERCASE
                                    </Text>
                                    <Text style={[styles.hintText, { color: colors.textTertiary }, /[0-9]/.test(formData.password) && styles.hintMet]}>
                                        {/[0-9]/.test(formData.password) ? '✓' : '○'} number
                                    </Text>
                                    <Text style={[styles.hintText, { color: colors.textTertiary }, /[^a-zA-Z0-9]/.test(formData.password) && styles.hintMet]}>
                                        {/[^a-zA-Z0-9]/.test(formData.password) ? '✓' : '○'} symbol
                                    </Text>
                                    <Text style={[styles.hintText, { color: colors.textTertiary }, formData.password.length >= 8 && styles.hintMet]}>
                                        {formData.password.length >= 8 ? '✓' : '○'} 8+ chars
                                    </Text>
                                </View>
                            </View>
                        )}

                        <View style={[styles.inputContainer, { backgroundColor: isDark ? colors.card : '#F5F5F5' }]}>
                            <Lock size={20} color={colors.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Confirm Password"
                                value={formData.confirmPassword}
                                onChangeText={(text) => handleChange('confirmPassword', text)}
                                secureTextEntry={!showConfirmPassword}
                                placeholderTextColor={colors.textTertiary}
                            />
                            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                                {showConfirmPassword ? <EyeOff size={20} color={colors.textSecondary} /> : <Eye size={20} color={colors.textSecondary} />}
                            </TouchableOpacity>
                        </View>

                        {/* Show Password checkbox - replaced with eye icons inside each field
                        <TouchableOpacity
                            style={styles.checkboxContainer}
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? (
                                <CheckSquare size={20} color="#00C853" />
                            ) : (
                                <Square size={20} color={colors.textSecondary} />
                            )}
                            <Text style={[styles.checkboxLabel, { color: colors.text }]}>Show Password</Text>
                        </TouchableOpacity>
                        */}

                        {/* Registration Agreement */}
                        <TouchableOpacity
                            style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, gap: 10, paddingHorizontal: 4 }}
                            onPress={() => handleChange('agreedToTerms', !formData.agreedToTerms)}
                            activeOpacity={0.7}
                        >
                            {formData.agreedToTerms ? (
                                <CheckSquare size={22} color="#00C853" style={{ marginTop: 2 }} />
                            ) : (
                                <Square size={22} color={colors.textSecondary} style={{ marginTop: 2 }} />
                            )}
                            <Text style={{ flex: 1, fontSize: 13, lineHeight: 20, color: colors.textSecondary }}>
                                By registering, I accept the terms of participation both as a recipient and as a donor.
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, (loading || !formData.agreedToTerms) && styles.buttonDisabled]}
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
                        <Text style={[styles.footerText, { color: colors.textSecondary }]}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                            <Text style={styles.linkText}>Login</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
