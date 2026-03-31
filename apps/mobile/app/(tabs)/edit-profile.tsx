import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    TextInput, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Save, User, Phone, MapPin, Building2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import axiosClient from '../../src/api/axiosClient';
import { API_ENDPOINTS } from '../../src/api/endpoints';
import { wp, hp, fp } from '../../src/utils/responsive';
import LoadingScreen from '../../src/components/LoadingScreen';
import SuccessModal from '../../src/components/SuccessModal';
import { useTheme } from '../../context/ThemeContext';
import { useAlert } from '../../context/AlertContext';
import { useNetwork } from '../../context/NetworkContext';
import { cacheData, getCachedDataAnyAge, CACHE_KEYS } from '../../src/utils/dataCache';

export default function EditProfile() {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const { showAlert } = useAlert();
    const { isOnline } = useNetwork();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Form fields
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [middleName, setMiddleName] = useState('');
    const [suffix, setSuffix] = useState('');
    const [phoneNo, setPhoneNo] = useState('');
    const [barangay, setBarangay] = useState('');
    const [streetAddress, setStreetAddress] = useState('');
    // Organization fields - commented out for now
    // const [isOrg, setIsOrg] = useState(false);
    // const [orgName, setOrgName] = useState('');

    // Track original profile values for dirty checking
    const originalValues = useRef<Record<string, any>>({});

    const isDirty = useMemo(() => {
        const orig = originalValues.current;
        if (!orig || Object.keys(orig).length === 0) return false;
        return (
            firstName !== orig.firstName ||
            lastName !== orig.lastName ||
            middleName !== orig.middleName ||
            suffix !== orig.suffix ||
            phoneNo !== orig.phoneNo ||
            barangay !== orig.barangay ||
            streetAddress !== orig.streetAddress
            // Organization dirty checks - commented out for now
            // || isOrg !== orig.isOrg
            // || orgName !== orig.orgName
        );
    }, [firstName, lastName, middleName, suffix, phoneNo, barangay, streetAddress]);

    const hydrateProfileData = (profile: any) => {
        if (!profile) return;
        setFirstName(profile.firstName || '');
        setLastName(profile.lastName || '');
        setMiddleName(profile.middleName || '');
        setSuffix(profile.suffix || '');
        setPhoneNo(profile.phoneNo || '');
        setBarangay(profile.address?.barangay || '');
        setStreetAddress(profile.address?.streetAddress || '');

        originalValues.current = {
            firstName: profile.firstName || '',
            lastName: profile.lastName || '',
            middleName: profile.middleName || '',
            suffix: profile.suffix || '',
            phoneNo: profile.phoneNo || '',
            barangay: profile.address?.barangay || '',
            streetAddress: profile.address?.streetAddress || '',
        };
    };

    // Load from cache on mount
    useEffect(() => {
        const loadCache = async () => {
            const cached = await getCachedDataAnyAge(CACHE_KEYS.USER_PROFILE);
            if (cached) {
                hydrateProfileData((cached as any).profile);
                setLoading(false);
            }
        };
        loadCache();
    }, []);

    // Fetch current profile data to sync with server
    const fetchProfile = useCallback(async () => {
        if (!isOnline && Object.keys(originalValues.current).length > 0) {
            setLoading(false);
            return;
        }

        try {
            const res = await axiosClient.get(API_ENDPOINTS.USER.GET_PROFILE);
            const profile = res.data?.profile;
            if (profile) {
                hydrateProfileData(profile);
                await cacheData(CACHE_KEYS.USER_PROFILE, res.data);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleSave = async () => {
        // Basic validation
        if (!firstName.trim()) {
            showAlert('Validation', 'First name is required.', undefined, { type: 'warning' });
            return;
        }
        if (!lastName.trim()) {
            showAlert('Validation', 'Last name is required.', undefined, { type: 'warning' });
            return;
        }
        if (!phoneNo.trim() || phoneNo.trim().length < 7) {
            showAlert('Validation', 'Please enter a valid phone number (min 7 digits).', undefined, { type: 'warning' });
            return;
        }

        setSaving(true);
        try {
            const payload: any = {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                phoneNo: phoneNo.trim(),
                // Organization field - commented out for now
                // isOrg,
            };

            if (middleName.trim()) payload.middleName = middleName.trim();
            if (suffix.trim()) payload.suffix = suffix.trim();
            // Organization name - commented out for now
            // if (orgName.trim()) payload.orgName = orgName.trim();

            // Include address if barangay is provided
            if (barangay.trim()) {
                payload.address = {
                    latitude: 0,
                    longitude: 0,
                    streetAddress: streetAddress.trim() || barangay.trim(),
                    barangay: barangay.trim(),
                };
            }

            await axiosClient.put(API_ENDPOINTS.USER.UPDATE_PROFILE, payload);
            
            // Re-fetch and update all caches so both edit-profile and profile screens are in sync
            try {
                const res = await axiosClient.get(API_ENDPOINTS.USER.GET_PROFILE);
                const profile = res.data?.profile;
                if (profile) {
                    hydrateProfileData(profile);
                    await cacheData(CACHE_KEYS.USER_PROFILE, res.data);
                    // Also update the profile screen's cache key
                    await cacheData(CACHE_KEYS.PROFILE_DATA, res.data);
                }
            } catch (e) {
                // Fallback: just re-fetch
                fetchProfile();
            }
            setShowSuccessModal(true);
        } catch (error: any) {
            console.error('Error updating profile:', error);
            const message = error?.response?.data?.error || error?.response?.data?.message || 'Failed to update profile.';
            showAlert('Error', message, undefined, { type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#00C853" />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading profile...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                    <ArrowLeft size={wp(22)} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
                <TouchableOpacity
                    style={[styles.saveBtn, (saving || !isDirty) && styles.saveBtnDisabled]}
                    onPress={handleSave}
                    disabled={saving || !isDirty}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <>
                            <Save size={wp(16)} color="#fff" />
                            <Text style={styles.saveBtnText}>Save</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Personal Info Section */}
                    <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
                        <View style={styles.sectionHeader}>
                            <User size={wp(20)} color="#2E7D32" />
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Information</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>First Name *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                                value={firstName}
                                onChangeText={setFirstName}
                                placeholder="Enter first name"
                                placeholderTextColor={colors.textTertiary}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Last Name *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                                value={lastName}
                                onChangeText={setLastName}
                                placeholder="Enter last name"
                                placeholderTextColor={colors.textTertiary}
                            />
                        </View>

                        <View style={styles.rowInputs}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Middle Name</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                                    value={middleName}
                                    onChangeText={setMiddleName}
                                    placeholder="Middle name"
                                    placeholderTextColor={colors.textTertiary}
                                />
                            </View>
                            <View style={[styles.inputGroup, { width: wp(100) }]}>
                                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Suffix</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                                    value={suffix}
                                    onChangeText={setSuffix}
                                    placeholder="Jr, Sr"
                                    placeholderTextColor={colors.textTertiary}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Contact Section */}
                    <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
                        <View style={styles.sectionHeader}>
                            <Phone size={wp(20)} color="#1E88E5" />
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Information</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Phone Number *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                                value={phoneNo}
                                onChangeText={setPhoneNo}
                                placeholder="Enter phone number"
                                placeholderTextColor={colors.textTertiary}
                                keyboardType="phone-pad"
                            />
                        </View>
                    </View>

                    {/* Address Section */}
                    <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
                        <View style={styles.sectionHeader}>
                            <MapPin size={wp(20)} color="#E53935" />
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Address</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Barangay</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                                value={barangay}
                                onChangeText={setBarangay}
                                placeholder="Enter barangay"
                                placeholderTextColor={colors.textTertiary}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Street Address</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                                value={streetAddress}
                                onChangeText={setStreetAddress}
                                placeholder="Enter street address"
                                placeholderTextColor={colors.textTertiary}
                            />
                        </View>
                    </View>

                    {/* Organization Section - commented out for now
                    <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
                        <View style={styles.sectionHeader}>
                            <Building2 size={wp(20)} color="#FF6F00" />
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Organization (Optional)</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.toggleRow}
                            onPress={() => setIsOrg(!isOrg)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.toggleBox, { borderColor: colors.border }, isOrg && styles.toggleBoxActive]}>
                                {isOrg && <Text style={styles.toggleCheck}>✓</Text>}
                            </View>
                            <Text style={[styles.toggleLabel, { color: colors.text }]}>I represent an organization</Text>
                        </TouchableOpacity>

                        {isOrg && (
                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Organization Name</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                                    value={orgName}
                                    onChangeText={setOrgName}
                                    placeholder="Enter organization name"
                                    placeholderTextColor={colors.textTertiary}
                                />
                            </View>
                        )}
                    </View>
                    */}

                    <View style={{ height: hp(40) }} />
                </ScrollView>
            </KeyboardAvoidingView>

            <SuccessModal
                visible={showSuccessModal}
                title="Profile Updated"
                message="Your profile changes have been saved successfully."
                buttonText="Go Back"
                onClose={() => {
                    setShowSuccessModal(false);
                    router.back();
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: hp(12), fontSize: fp(14), color: '#666' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: wp(16), paddingVertical: hp(12), backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
    },
    headerBtn: { width: wp(40), height: wp(40), justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: fp(18), fontWeight: 'bold', color: '#1a1a1a' },
    saveBtn: {
        flexDirection: 'row', alignItems: 'center', gap: wp(6),
        backgroundColor: '#00C853', paddingHorizontal: wp(16), paddingVertical: hp(8),
        borderRadius: wp(10),
    },
    saveBtnDisabled: { opacity: 0.6 },
    saveBtnText: { color: '#fff', fontSize: fp(14), fontWeight: '600' },
    scrollContent: { padding: wp(16) },
    sectionCard: {
        backgroundColor: '#fff', borderRadius: wp(20), padding: wp(20), marginBottom: hp(16),
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row', alignItems: 'center', gap: wp(10), marginBottom: hp(16),
    },
    sectionTitle: { fontSize: fp(16), fontWeight: 'bold', color: '#1a1a1a' },
    inputGroup: { marginBottom: hp(14) },
    inputLabel: { fontSize: fp(13), color: '#666', fontWeight: '500', marginBottom: hp(6) },
    input: {
        borderWidth: 1, borderColor: '#E0E0E0', borderRadius: wp(12),
        paddingHorizontal: wp(14), paddingVertical: hp(12),
        fontSize: fp(15), color: '#1a1a1a', backgroundColor: '#FAFAFA',
    },
    rowInputs: { flexDirection: 'row', gap: wp(12) },
    toggleRow: { flexDirection: 'row', alignItems: 'center', gap: wp(12), marginBottom: hp(14) },
    toggleBox: {
        width: wp(24), height: wp(24), borderRadius: wp(6),
        borderWidth: 2, borderColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center',
    },
    toggleBoxActive: { backgroundColor: '#00C853', borderColor: '#00C853' },
    toggleCheck: { color: '#fff', fontSize: fp(14), fontWeight: 'bold' },
    toggleLabel: { fontSize: fp(14), color: '#333' },
});
