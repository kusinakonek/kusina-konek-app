import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../../context/AuthContext';

export const useLoginLogic = () => {
    const router = useRouter();
    const { signIn, role } = useAuth(); // Assuming useAuth is accessible via this path

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (!role) {
            Alert.alert('Error', 'No role selected. Please go back and select a role.');
            return;
        }

        setLoading(true);
        try {
            await signIn(email.trim().toLowerCase(), password);
        } catch (error: any) {
            console.error(error);
            const message = error.message || 'Something went wrong';
            if (message.includes('Invalid login credentials')) {
                Alert.alert('Login Failed', 'Invalid email or password');
            } else if (message.includes('Email not confirmed')) {
                Alert.alert('Login Failed', 'Please verify your email before signing in');
            } else {
                Alert.alert('Login Failed', message);
            }
        } finally {
            setLoading(false);
        }
    };

    return {
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
    };
};
