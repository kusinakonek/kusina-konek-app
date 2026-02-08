import { useState, useMemo } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../../context/AuthContext';

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

export const useSignupLogic = () => {
    const router = useRouter();
    const { signUp, role } = useAuth(); // Assuming useAuth is accessible

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
            // Navigation happens inside signUp usually, or allow handling here
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

    return {
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
    };
};
