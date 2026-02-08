import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';
import { Session, User } from '@supabase/supabase-js';
import * as Crypto from 'expo-crypto';

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
                const { data: { session: currentSession } } = await supabase.auth.getSession();
                setSession(currentSession);
                setUser(currentSession?.user ?? null);
                setUserToken(currentSession?.access_token ?? null);

                const storedRole = await AsyncStorage.getItem('userRole');
                if (storedRole === 'DONOR' || storedRole === 'RECIPIENT') {
                    setRoleState(storedRole);
                }
            } catch (e) {
                console.error('Failed to load auth data', e);
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession);
            setUser(newSession?.user ?? null);
            setUserToken(newSession?.access_token ?? null);
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

        // Get role from user metadata or stored role
        const userRole = data.user?.user_metadata?.role || role;
        if (userRole === 'DONOR') {
            router.replace('/(donor)');
        } else {
            router.replace('/(tabs)');
        }
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
                // Don't block login — profile creation is secondary
            }
            setPendingSignup(null);
            // Route based on role from signup metadata
            if (pendingSignup.metadata?.role === 'DONOR') {
                router.replace('/(donor)');
                return;
            }
        }

        // Default to recipient tabs
        router.replace('/(tabs)');
    };

    // Helper: Create user profile in database via RPC
    // Sends raw data — encryption (AES-256) and bcrypt happen server-side in PostgreSQL
    const createUserProfile = async (userId: string, password: string, metadata?: any) => {
        const normalizedEmail = metadata?.email || pendingSignup?.email || '';
        const phone = metadata?.phone_no || '';

        // SHA-256 hashes for indexed lookup fields (unique constraints in DB)
        const emailHash = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            normalizedEmail
        );
        const phoneNoHash = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            phone || `no-phone-${userId}`
        );

        // Split full name into first and last
        const nameParts = (metadata?.full_name || '').trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

        const selectedRole = metadata?.role || 'RECIPIENT';

        // Call the RPC function — raw data sent over HTTPS
        // The PostgreSQL function handles:
        //   - AES-256 encryption for PII fields (firstName, lastName, email, phoneNo)
        //   - bcrypt hashing for password
        const { error: rpcError } = await supabase.rpc('create_user_profile', {
            p_user_id: userId,
            p_role_name: selectedRole,
            p_first_name: firstName,
            p_last_name: lastName || firstName,
            p_phone_no: phone,
            p_phone_no_hash: phoneNoHash,
            p_email: normalizedEmail,
            p_email_hash: emailHash,
            p_password: password,
        });

        if (rpcError) {
            console.error('Failed to create user profile:', rpcError);
            throw rpcError;
        }
    };

    // Resend OTP email
    const resendOtp = async (email: string) => {
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email,
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
            signIn, signOut, signUp, verifyOtp, resendOtp, pendingSignup,
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
