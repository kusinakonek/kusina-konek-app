import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

// START: CONFIGURATION
// For Expo Go on physical device, use your machine's LAN IP.
// Find it by running `ipconfig` (Windows) or `ifconfig` (Mac/Linux).
// Android Emulator uses 10.0.2.2 to access host localhost.
const LAN_IP = '192.168.1.105'; // <-- Update this to your machine's LAN IP

const DEV_API_URL = Platform.select({
    android: `http://${LAN_IP}:4000/api`, // Works for both Expo Go & Emulator on physical device
    ios: `http://${LAN_IP}:4000/api`,
    default: `http://${LAN_IP}:4000/api`,
});

const API_URL = DEV_API_URL;
// END: CONFIGURATION

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add the auth token to every request
api.interceptors.request.use(
    async (config) => {
        let token = null;
        try {
            const { data, error } = await supabase.auth.getSession();
            if (error) {
                if (error.message.includes('Refresh Token Not Found') || error.message.includes('Invalid Refresh Token')) {
                    console.log('Session expired or invalid refresh token. Signing out...');
                    await supabase.auth.signOut();
                }
                throw error;
            }
            token = data.session?.access_token;
        } catch (e) {
            // If getSession fails, we might want to proceed without a token or reject
            // Here we just log it. The request will likely fail with 401 later.
            console.error('Error getting session in interceptor:', e);
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle common errors (like 401 Unauthorized)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Handle unauthorized access (e.g., redirect to login)
            // We might effect this via the AuthContext vs direct navigation here
            console.log('Unauthorized access - redirect check needed');
        }
        return Promise.reject(error);
    }
);

export default api;
