import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../../context/AuthContext';
import { useAlert } from '../../../../context/AlertContext';

export const useLoginLogic = () => {
    const router = useRouter();
    const { signIn, role } = useAuth(); // Assuming useAuth is accessible via this path
    const { showAlert } = useAlert();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            showAlert('Error', 'Please fill in all fields', undefined, { type: 'warning' });
            return;
        }

        if (!role) {
            showAlert('Error', 'No role selected. Please go back and select a role.', undefined, { type: 'error' });
            return;
        }

        setLoading(true);
        try {
            await signIn(email.trim().toLowerCase(), password);
        } catch (error: any) {
            console.error(error);
            const message = error.message || 'Something went wrong';
            if (message.includes('Invalid login credentials')) {
                showAlert('Login Failed', 'Invalid email or password', undefined, { type: 'error' });
            } else if (message.includes('Email not confirmed')) {
                showAlert('Login Failed', 'Please verify your email before signing in', undefined, { type: 'warning' });
            } else {
                showAlert('Login Failed', message, undefined, { type: 'error' });
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
