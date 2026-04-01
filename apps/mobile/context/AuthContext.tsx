import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';
import { Session, User } from '@supabase/supabase-js';

// Define the shape of the AuthContext
import { clearAllCache } from '../src/utils/dataCache';

interface AuthContextType {
    userToken: string | null;
    session: Session | null;
    user: User | null;
    isLoading: boolean;
    isPostLoginLoading: boolean;
    loadingSteps?: string[];
    currentLoadingStep?: number;
    loadingProgress?: number;
    isLoggingOut?: boolean;
    logoutName?: string;
    role: 'DONOR' | 'RECIPIENT' | null;
    setRole: (role: 'DONOR' | 'RECIPIENT') => void;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    signUp: (email: string, password: string, metadata?: any) => Promise<void>;
    verifyOtp: (email: string, token: string) => Promise<void>;
    resendOtp: (email: string) => Promise<void>;
    sendRecoveryOtp: (email: string) => Promise<void>;
    verifyRecoveryOtp: (email: string, token: string) => Promise<void>;
    updatePassword: (password: string) => Promise<void>;
    sendDeleteAccountOtp: (email: string) => Promise<void>;
    verifyDeleteAccountOtp: (email: string, token: string) => Promise<void>;
    pendingSignup: { email: string; password: string; metadata?: any } | null;
    prefetchUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [userToken, setUserToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPostLoginLoading, setIsPostLoginLoading] = useState(false);
    const [loadingSteps, setLoadingSteps] = useState<string[]>([]);
    const [currentLoadingStep, setCurrentLoadingStep] = useState(0);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [logoutName, setLogoutName] = useState('');
    const [role, setRoleState] = useState<'DONOR' | 'RECIPIENT' | null>(null);
    const [pendingSignup, setPendingSignup] = useState<{ email: string; password: string; metadata?: any } | null>(null);

    const prefetchUserData = async () => {
        try {
            setLoadingSteps(['Server Connection', 'Authentication', 'Profile Data', 'Dashboard Setup', 'Finalizing']);
            setCurrentLoadingStep(0);
            setLoadingProgress(0.1);

            console.log('[Auth] Prefetching user data during transition...');
            const axiosClient = (await import('../src/api/axiosClient')).default;
            const { API_ENDPOINTS } = await import('../src/api/endpoints');
            const { cacheData, CACHE_KEYS } = await import('../src/utils/dataCache');

            // Simulate Server Connection
            setCurrentLoadingStep(0);
            setLoadingProgress(0.2);
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Simulate Authentication
            setCurrentLoadingStep(1);
            setLoadingProgress(0.4);
            await new Promise(resolve => setTimeout(resolve, 300));

            // Fetch Profile Data
            setCurrentLoadingStep(2);
            setLoadingProgress(0.6);
            const [profileRes, donorRes, recipientRes] = await Promise.all([
                axiosClient.get(API_ENDPOINTS.USER.GET_PROFILE).catch(() => null),
                axiosClient.get(API_ENDPOINTS.DASHBOARD.DONOR).catch(() => null),
                axiosClient.get(API_ENDPOINTS.DASHBOARD.RECIPIENT).catch(() => null)
            ]);

            const pData = profileRes?.data;
            const donorData = donorRes?.data;
            const recipientData = recipientRes?.data;

            // Setup Dashboard
            setCurrentLoadingStep(3);
            setLoadingProgress(0.8);
            await new Promise(resolve => setTimeout(resolve, 300));

            if (pData) {
                await cacheData(CACHE_KEYS.USER_PROFILE, pData);
            }

            if (donorData) {
                await cacheData(CACHE_KEYS.DONOR_DASHBOARD, donorData);
                await cacheData(`${CACHE_KEYS.PROFILE_DATA}_DONOR`, { 
                    profileData: pData, 
                    statsData: donorData.stats, 
                    donorHistoryStats: donorData.stats 
                });
            }

            if (recipientData) {
                await cacheData(CACHE_KEYS.RECIPIENT_DASHBOARD, recipientData);
                await cacheData(`${CACHE_KEYS.PROFILE_DATA}_RECIPIENT`, { 
                    profileData: pData, 
                    statsData: recipientData.stats, 
                    donorHistoryStats: donorData?.stats || null 
                });
            }

            // Finalizing
            setCurrentLoadingStep(4);
            setLoadingProgress(1.0);
            await new Promise(resolve => setTimeout(resolve, 400));
            console.log('[Auth] Prefetching complete.');
        } catch (e) {
            console.warn('[Auth] Failed to prefetch data:', e);
        }
    };

    useEffect(() => {
        // Get initial session
        const initAuth = async () => {
            try {
                const { data: { session: currentSession }, error } = await supabase.auth.getSession();
                if (error || !currentSession) {
                    // Session is invalid/expired — clear stale state silently
                    setSession(null);
                    setUser(null);
                    setUserToken(null);
                } else {
                    setSession(currentSession);
                    setUser(currentSession.user);
                    setUserToken(currentSession.access_token);
                    
                    // Pre-fetch fresh data during app startup
                    await prefetchUserData();
                }

                const storedRole = await AsyncStorage.getItem('userRole');
                if (storedRole === 'DONOR' || storedRole === 'RECIPIENT') {
                    setRoleState(storedRole);
                }
            } catch (e: any) {
                // Refresh token errors (e.g. "Refresh Token Not Found") end up here
                console.log('Auth init error (expected on fresh start):', e?.message || e);

                // If the error is related to invalid tokens, strictly clear everything
                if (e?.message?.includes('Refresh Token Not Found') || e?.message?.includes('Invalid Refresh Token')) {
                    await AsyncStorage.removeItem('userRole');
                    await supabase.auth.signOut(); // Ensure Supabase client is also cleared
                }

                setSession(null);
                setUser(null);
                setUserToken(null);
                setRoleState(null);
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            // Ignore TOKEN_REFRESHED failures — they happen when refresh token is stale
            if (event === 'TOKEN_REFRESHED' && !newSession) {
                console.log('Token refresh failed, ignoring');
                return;
            }

            setSession(newSession);
            setUser(newSession?.user ?? null);
            setUserToken(newSession?.access_token ?? null);

            if (event === 'SIGNED_OUT') {
                // Clear state
                setRoleState(null);
                setPendingSignup(null);
                await AsyncStorage.removeItem('userRole');
                // Redirect to welcome screen
                router.replace('/(auth)/welcome');
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const setRole = async (newRole: 'DONOR' | 'RECIPIENT') => {
        setRoleState(newRole);
        await AsyncStorage.setItem('userRole', newRole);
    };

    const signIn = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            throw error;
        }

        // Set post-login loading state FIRST
        setIsPostLoginLoading(true);
        
        setSession(data.session);
        setUser(data.user);
        setUserToken(data.session?.access_token ?? null);

        // Add small delay to ensure state updates are processed before navigation
        await new Promise(resolve => setTimeout(resolve, 50));

        // Navigate to tabs - LoadingScreen will render because isPostLoginLoading is true
        router.replace('/(tabs)');

        // Fetch data while loading screen is visible
        await Promise.all([
            prefetchUserData(),
            new Promise(resolve => setTimeout(resolve, 800)) // Minimum visible time
        ]);

        // Only set to false after all data is fetched
        setIsPostLoginLoading(false);
    };

    // Step 1: Sign up — creates unconfirmed user, sends OTP email
    // Only send role to Auth metadata — sensitive data (name, phone, barangay)
    // goes ONLY to the encrypted User table after verification
    const signUp = async (email: string, password: string, metadata?: any) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    role: metadata?.role || 'RECIPIENT',
                },
            },
        });

        if (error) {
            throw error;
        }

        // Store signup data so we can create the profile after OTP verification
        setPendingSignup({ email: email.trim().toLowerCase(), password, metadata });

        // Navigate to OTP verification screen
        router.push({
            pathname: '/(auth)/verify',
            params: { email: email.trim().toLowerCase() },
        });
    };

    // Step 2: Verify OTP — confirms email, creates user profile, auto-login
    const verifyOtp = async (email: string, token: string) => {
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'signup',
        });

        if (error) {
            throw error;
        }

        if (!data.session || !data.user) {
            throw new Error('Verification succeeded but no session returned');
        }

        setIsLoading(true);
        
        // Set auth state
        setSession(data.session);
        setUser(data.user);
        setUserToken(data.session.access_token);

        // Now create the user profile in the User table
        if (pendingSignup) {
            try {
                await createUserProfile(data.user.id, pendingSignup.password, pendingSignup.metadata);
            } catch (e) {
                console.error('Error creating user profile:', e);
            }
            // Save role
            if (pendingSignup.metadata?.role) {
                await setRole(pendingSignup.metadata.role as 'DONOR' | 'RECIPIENT');
            }
            setPendingSignup(null);
        }

        // Set post-login loading state FIRST
        setIsPostLoginLoading(true);

        // Add small delay to ensure state updates are processed before navigation
        await new Promise(resolve => setTimeout(resolve, 50));

        // Transition to tabs layer. The LoadingScreen.tsx component will show.
        router.replace('/(tabs)');

        // Fetch data while loading screen is visible
        await Promise.all([
            prefetchUserData(),
            new Promise(resolve => setTimeout(resolve, 800)) // Minimum visible time
        ]);

        // Only set to false after all data is fetched
        setIsPostLoginLoading(false);
    };

    // Helper: Create user profile in database via the Node.js API
    // The backend handles encryption with AES-256-GCM consistently
    const createUserProfile = async (userId: string, password: string, metadata?: any) => {
        const normalizedEmail = metadata?.email || pendingSignup?.email || '';
        const phone = metadata?.phone_no || '';

        // Split full name into first and last
        const nameParts = (metadata?.full_name || '').trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

        const selectedRole = metadata?.role || 'RECIPIENT';
        // Organization fields - commented out for now
        // const isOrg = metadata?.isOrg || false;
        // const orgName = metadata?.orgName || '';
        const isOrg = false;
        const orgName = '';

        // Use the backend API which encrypts consistently with Node.js AES-256-GCM
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        if (!token) {
            throw new Error('No auth token available to create profile');
        }

        const axiosClient = (await import('../src/api/axiosClient')).default;

        const barangay = metadata?.barangay || '';

        const response = await axiosClient.put('/users/profile', {
            firstName,
            lastName: lastName || firstName,
            phoneNo: phone || `no-phone-${userId}`,
            role: selectedRole,
            isOrg,
            orgName: isOrg && orgName ? orgName : null,
            password,
            ...(barangay ? {
                address: {
                    latitude: 0,
                    longitude: 0,
                    streetAddress: '',
                    barangay,
                }
            } : {}),
        });

        if (response.status !== 200) {
            throw new Error('Failed to create user profile via API');
        }
    };

    // Resend OTP email (for signup)
    const resendOtp = async (email: string) => {
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email,
        });

        if (error) {
            throw error;
        }
    };

    // Send recovery OTP (for forgot password)
    const sendRecoveryOtp = async (email: string) => {
        // Use resetPasswordForEmail to trigger the "Reset Password" template
        const { error } = await supabase.auth.resetPasswordForEmail(email);

        if (error) {
            throw error;
        }
    };

    // Verify recovery OTP (logs user in)
    const verifyRecoveryOtp = async (email: string, token: string) => {
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'recovery', // Changed from 'email' (Magic Link) to 'recovery' (Reset Password)
        });

        if (error) {
            throw error;
        }

        if (data.session) {
            setSession(data.session);
            setUser(data.user);
            setUserToken(data.session.access_token);
        }
    };

    // Send OTP for Account Deletion
    const sendDeleteAccountOtp = async (email: string) => {
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: false,
            }
        });

        if (error) {
            throw error;
        }
    };

    // Verify OTP for Account Deletion (ensures user owns the email)
    const verifyDeleteAccountOtp = async (email: string, token: string) => {
        const { error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'email',
        });

        if (error) {
            throw error;
        }
    };

    // Update user password
    const updatePassword = async (password: string) => {
        const { error } = await supabase.auth.updateUser({
            password
        });

        if (error) {
            throw error;
        }
    };

    const signOut = async () => {
        setIsLoggingOut(true);
        const nameUser = user?.user_metadata?.full_name?.split(' ')[0] || user?.user_metadata?.firstName || 'User';
        setLogoutName(nameUser);

        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate closing
        
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setUserToken(null);
        setRoleState(null);
        setPendingSignup(null);
        await AsyncStorage.removeItem('userRole');
        await clearAllCache(); // Clear everything from cache for the logged-out user
        
        // Use a short timeout to let the router replace take effect before we flip `isLoggingOut` to false, 
        // to prevent the login loading screen from flashing up
        router.replace('/(auth)/welcome');
        setTimeout(() => setIsLoggingOut(false), 500);
    };

    return (
        <AuthContext.Provider value={{
            userToken, session, user, isLoading, isPostLoginLoading, role, setRole,
            loadingSteps, currentLoadingStep, loadingProgress, isLoggingOut, logoutName,
            signIn, signOut, signUp, verifyOtp, resendOtp,
            sendRecoveryOtp, verifyRecoveryOtp, updatePassword,
            sendDeleteAccountOtp, verifyDeleteAccountOtp,
            pendingSignup, prefetchUserData
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use the auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
