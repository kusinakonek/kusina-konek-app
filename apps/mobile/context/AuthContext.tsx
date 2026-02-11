import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';
import { Session, User } from '@supabase/supabase-js';

// Define the shape of the AuthContext
interface AuthContextType {
    userToken: string | null;
    session: Session | null;
    user: User | null;
    isLoading: boolean;
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
    pendingSignup: { email: string; password: string; metadata?: any } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [userToken, setUserToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [role, setRoleState] = useState<'DONOR' | 'RECIPIENT' | null>(null);
    const [pendingSignup, setPendingSignup] = useState<{ email: string; password: string; metadata?: any } | null>(null);

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

        setSession(data.session);
        setUser(data.user);
        setUserToken(data.session?.access_token ?? null);

        // Keep the role the user selected on the welcome screen.
        // Do NOT override with user_metadata.role — the same account
        // can switch between DONOR and RECIPIENT freely.
        // `role` is already set by the welcome screen's setRole() call.
        // Both roles use the tabs view
        router.replace('/(tabs)');
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

        // Both roles use the tabs view
        router.replace('/(tabs)');
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

        // Use the backend API which encrypts consistently with Node.js AES-256-GCM
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        if (!token) {
            throw new Error('No auth token available to create profile');
        }

        const axiosClient = (await import('../src/api/axiosClient')).default;
        const response = await axiosClient.put('/users/profile', {
            firstName,
            lastName: lastName || firstName,
            phoneNo: phone || `no-phone-${userId}`,
            role: selectedRole,
            isOrg: false,
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
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: false, // Ensure we don't create new users
            }
        });

        if (error) {
            throw error;
        }
    };

    // Verify recovery OTP (logs user in)
    const verifyRecoveryOtp = async (email: string, token: string) => {
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'email',
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
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setUserToken(null);
        setRoleState(null);
        setPendingSignup(null);
        await AsyncStorage.removeItem('userRole');
        router.replace('/(auth)/welcome');
    };

    return (
        <AuthContext.Provider value={{
            userToken, session, user, isLoading, role, setRole,
            signIn, signOut, signUp, verifyOtp, resendOtp,
            sendRecoveryOtp, verifyRecoveryOtp, updatePassword,
            pendingSignup,
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
