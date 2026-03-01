import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Image,
    StatusBar,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Mail, RefreshCw } from 'lucide-react-native';
import { useResendTimer } from '../../src/hooks/useResendTimer';
import { useAlert } from '../../context/AlertContext';

const OTP_LENGTH = 8;

export default function Verify() {
    const router = useRouter();
    const { email } = useLocalSearchParams<{ email: string }>();
    const { verifyOtp, resendOtp } = useAuth();
    const { showAlert } = useAlert();

    const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const inputRefs = useRef<(TextInput | null)[]>([]);

    const { countdown, startTimer } = useResendTimer(email || '', 'signup');

    const handleChange = (value: string, index: number) => {
        // Only allow digits
        const digit = value.replace(/[^0-9]/g, '');
        if (!digit && value !== '') return;

        const newOtp = [...otp];
        newOtp[index] = digit;
        setOtp(newOtp);

        // Auto-focus next input
        if (digit && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all digits filled
        if (digit && index === OTP_LENGTH - 1) {
            const code = newOtp.join('');
            if (code.length === OTP_LENGTH) {
                handleVerify(code);
            }
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
            const newOtp = [...otp];
            newOtp[index - 1] = '';
            setOtp(newOtp);
        }
    };

    const handleVerify = async (code?: string) => {
        const otpCode = code || otp.join('');
        if (otpCode.length !== OTP_LENGTH) {
            showAlert('Error', 'Please enter the complete 8-digit code', undefined, { type: 'warning' });
            return;
        }

        if (!email) {
            showAlert('Error', 'No email found. Please try signing up again.', undefined, { type: 'error' });
            return;
        }

        setLoading(true);
        try {
            await verifyOtp(email, otpCode);
            // Navigation happens inside verifyOtp
        } catch (error: any) {
            console.error(error);
            const message = error.message || 'Invalid verification code';
            if (message.includes('expired')) {
                showAlert('Code Expired', 'Your verification code has expired. Please request a new one.', undefined, { type: 'warning' });
            } else {
                showAlert('Verification Failed', message, undefined, { type: 'error' });
            }
            // Clear OTP inputs on failure
            setOtp(Array(OTP_LENGTH).fill(''));
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (countdown > 0 || !email) return;

        setResending(true);
        try {
            await resendOtp(email);
            startTimer();
            showAlert('Code Sent', 'A new verification code has been sent to your email.', undefined, { type: 'success' });
        } catch (error: any) {
            showAlert('Error', error.message || 'Failed to resend code', undefined, { type: 'error' });
        } finally {
            setResending(false);
        }
    };

    // Mask email for display
    const maskedEmail = email
        ? email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(Math.min(b.length, 5)) + c)
        : '';

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
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.header}>
                        <Image
                            source={require('../../assets/KUSINAKONEK-NEW-LOGO.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        <View style={styles.mailIconContainer}>
                            <Mail size={32} color="#00C853" />
                        </View>
                        <Text style={styles.title}>Verify Your Email</Text>
                        <Text style={styles.subtitle}>
                            We sent an 8-digit verification code to
                        </Text>
                        <Text style={styles.emailText}>{maskedEmail}</Text>
                        <Text style={styles.hintText}>
                            Check your inbox (and spam folder) for the code
                        </Text>
                    </View>

                    {/* OTP Input Boxes */}
                    <View style={styles.otpContainer}>
                        {otp.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={(ref) => { inputRefs.current[index] = ref; }}
                                style={[
                                    styles.otpInput,
                                    digit ? styles.otpInputFilled : null,
                                ]}
                                value={digit}
                                onChangeText={(value) => handleChange(value, index)}
                                onKeyPress={(e) => handleKeyPress(e, index)}
                                keyboardType="number-pad"
                                maxLength={1}
                                selectTextOnFocus
                                autoFocus={index === 0}
                            />
                        ))}
                    </View>

                    {/* Verify Button */}
                    <TouchableOpacity
                        style={[styles.verifyButton, loading && styles.buttonDisabled]}
                        onPress={() => handleVerify()}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.verifyButtonText}>Verify Email</Text>
                        )}
                    </TouchableOpacity>

                    {/* Resend Code */}
                    <View style={styles.resendContainer}>
                        <Text style={styles.resendText}>Didn't receive the code? </Text>
                        {countdown > 0 ? (
                            <Text style={styles.countdownText}>Resend in {countdown}s</Text>
                        ) : (
                            <TouchableOpacity onPress={handleResend} disabled={resending}>
                                <View style={styles.resendRow}>
                                    {resending ? (
                                        <ActivityIndicator size="small" color="#00C853" />
                                    ) : (
                                        <>
                                            <RefreshCw size={14} color="#00C853" />
                                            <Text style={styles.resendLink}> Resend</Text>
                                        </>
                                    )}
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    fixedHeader: {
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 8,
        backgroundColor: '#fff',
        zIndex: 10,
    },
    backButton: {
        alignSelf: 'flex-start',
        padding: 4,
    },
    content: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
        paddingTop: 8,
    },
    header: {
        alignItems: 'center',
        marginBottom: 36,
    },
    logo: {
        width: 70,
        height: 70,
        marginBottom: 16,
    },
    mailIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
    },
    emailText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginTop: 4,
    },
    hintText: {
        fontSize: 13,
        color: '#999',
        marginTop: 8,
        textAlign: 'center',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 32,
    },
    otpInput: {
        width: 40,
        height: 50,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        backgroundColor: '#F5F5F5',
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    otpInputFilled: {
        borderColor: '#00C853',
        backgroundColor: '#E8F5E9',
    },
    verifyButton: {
        backgroundColor: '#00C853',
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
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
    verifyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    resendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
    },
    resendText: {
        fontSize: 14,
        color: '#666',
    },
    countdownText: {
        fontSize: 14,
        color: '#999',
        fontWeight: '600',
    },
    resendRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    resendLink: {
        fontSize: 14,
        color: '#00C853',
        fontWeight: 'bold',
    },
});
