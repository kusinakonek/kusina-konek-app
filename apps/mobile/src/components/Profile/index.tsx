import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, RefreshControl } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, LogOut, Phone, Mail, MapPin, Calendar, ArrowLeft, Edit2, Settings, Heart, Globe, Star } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import axiosClient from '../../api/axiosClient';
import { API_ENDPOINTS } from '../../api/endpoints';

export default function Profile() {
    const { user, signOut, role } = useAuth();
    const router = useRouter();
    const [profileData, setProfileData] = useState<any>(null);
    const [statsData, setStatsData] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchProfileData = useCallback(async () => {
        if (!user) return; // Prevent fetching if logged out

        try {
            // Fetch profile and dashboard separately so one failure doesn't block the other
            const profileRes = await axiosClient.get(API_ENDPOINTS.USER.GET_PROFILE);
            setProfileData(profileRes.data);
        } catch (error) {
            console.error('Error fetching profile:', error);
        }

        try {
            const dashboardRes = role === 'DONOR'
                ? await axiosClient.get(API_ENDPOINTS.DASHBOARD.DONOR)
                : await axiosClient.get(API_ENDPOINTS.DASHBOARD.RECIPIENT);
            setStatsData(dashboardRes.data?.stats || null);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        }

        setLoading(false);
        setRefreshing(false);
    }, [role, user]);

    useEffect(() => {
        fetchProfileData();
    }, [fetchProfileData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchProfileData();
    }, [fetchProfileData]);

    const handleLogout = async () => {
        try {
            // Clear local data immediately to stop rendering/fetching
            setProfileData(null);
            setStatsData(null);
            await signOut();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to logout');
        }
    };

    const displayName = profileData?.profile
        ? `${profileData.profile.firstName || ''} ${profileData.profile.lastName || ''}`.trim() || profileData?.user?.displayName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
        : user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
    const displayEmail = profileData?.user?.email || user?.email || '';
    const displayPhone = profileData?.profile?.phoneNo || user?.phone || 'Not provided';
    const displayBarangay = profileData?.profile?.address?.barangay || 'Not set';
    const memberSince = user?.created_at
        ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : 'N/A';
    const needsProfileUpdate = profileData?.needsProfileUpdate === true;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                    <ArrowLeft size={22} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Profile</Text>
                <TouchableOpacity style={styles.headerBtn}>
                    <Edit2 size={20} color="#333" />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00C853']} />}
            >
                {/* Profile update banner */}
                {needsProfileUpdate && (
                    <View style={styles.updateBanner}>
                        <Text style={styles.updateBannerText}>
                            Your profile information needs to be updated. Please edit your profile to fix displayed data.
                        </Text>
                    </View>
                )}

                {/* Profile Card with Banner */}
                <View style={styles.profileCard}>
                    <View style={styles.bannerImage}>
                        <View style={styles.bannerGradient} />
                    </View>
                    <View style={styles.avatarWrapper}>
                        <View style={styles.avatarContainer}>
                            <User size={40} color="#2E7D32" />
                        </View>
                    </View>
                    <View style={styles.roleBadge}>
                        <View style={styles.roleDot} />
                        <Text style={styles.roleText}>{role || 'USER'}</Text>
                    </View>

                    {/* Info Rows */}
                    <View style={styles.infoSection}>
                        <View style={styles.infoRow}>
                            <User size={16} color="#666" />
                            <Text style={styles.infoLabel}>Full Name</Text>
                        </View>
                        <Text style={styles.infoValue}>{displayName}</Text>

                        <View style={[styles.infoRow, { marginTop: 16 }]}>
                            <Mail size={16} color="#666" />
                            <Text style={styles.infoLabel}>Email Address</Text>
                        </View>
                        <Text style={styles.infoValue}>{displayEmail}</Text>

                        <View style={[styles.infoRow, { marginTop: 16 }]}>
                            <Phone size={16} color="#666" />
                            <Text style={styles.infoLabel}>Phone Number</Text>
                        </View>
                        <Text style={styles.infoValue}>{displayPhone}</Text>

                        <View style={[styles.infoRow, { marginTop: 16 }]}>
                            <MapPin size={16} color="#666" />
                            <Text style={styles.infoLabel}>Barangay</Text>
                        </View>
                        <Text style={styles.infoValue}>{displayBarangay}</Text>

                        <View style={[styles.infoRow, { marginTop: 16 }]}>
                            <Calendar size={16} color="#666" />
                            <Text style={styles.infoLabel}>Member Since</Text>
                        </View>
                        <Text style={styles.infoValue}>{memberSince}</Text>
                    </View>
                </View>

                {/* Statistics Card */}
                <View style={styles.statsCard}>
                    <View style={styles.statsHeader}>
                        <View style={styles.statsIconWrap}>
                            <Star size={20} color="#FFC107" />
                        </View>
                        <View>
                            <Text style={styles.statsTitle}>
                                {role === 'DONOR' ? 'Donation Statistics' : 'Food Received Statistics'}
                            </Text>
                            <Text style={styles.statsSubtitle}>
                                {role === 'DONOR' ? 'Your contribution to the community' : 'Your food consumption currently.'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={[styles.statBadge, { backgroundColor: '#FFEBEE' }]}>
                            <Heart size={16} color="#E53935" />
                            <Text style={styles.statLabel}>
                                {role === 'DONOR' ? 'Total Donations' : 'Total Received'}
                            </Text>
                            <Text style={styles.statValue}>
                                {role === 'DONOR' ? (statsData?.totalDonated || 0) : (statsData?.availableFoods || 0)}
                            </Text>
                        </View>
                        <View style={[styles.statBadge, { backgroundColor: '#E3F2FD' }]}>
                            <Globe size={16} color="#1E88E5" />
                            <Text style={styles.statLabel}>Active Now</Text>
                            <Text style={styles.statValue}>
                                {role === 'DONOR' ? (statsData?.availableItems || 0) : (statsData?.locations || 0)}
                            </Text>
                        </View>
                    </View>

                    {role === 'DONOR' && (
                        <View style={styles.donorExtraStats}>
                            <View style={[styles.statBadgeWide, { backgroundColor: '#E8F5E9' }]}>
                                <View style={styles.statBadgeWideRow}>
                                    <View>
                                        <Heart size={16} color="#E53935" />
                                        <Text style={styles.statLabel}>Families Helped</Text>
                                        <Text style={styles.statValue}>
                                            {statsData?.familiesHelped || 0}
                                        </Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Star size={16} color="#FFC107" fill="#FFC107" />
                                        <Text style={styles.statLabel}>Rating</Text>
                                        <Text style={styles.statValue}>{statsData?.averageRating || 'N/A'}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}
                </View>

                {/* Account Settings */}
                <View style={styles.settingsCard}>
                    <Text style={styles.settingsTitle}>Account Settings</Text>

                    <TouchableOpacity style={styles.settingsRow}>
                        <Settings size={20} color="#333" />
                        <Text style={styles.settingsRowText}>Settings</Text>
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.settingsRow} onPress={handleLogout}>
                        <ArrowLeft size={20} color="#E53935" />
                        <Text style={[styles.settingsRowText, { color: '#E53935' }]}>Log Out</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 30 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff' },
    headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
    scrollContent: { padding: 16 },
    profileCard: {
        backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    },
    bannerImage: { height: 100, backgroundColor: '#F5C518' },
    bannerGradient: { flex: 1, opacity: 0.8 },
    avatarWrapper: { alignItems: 'center', marginTop: -40 },
    avatarContainer: {
        width: 80, height: 80, borderRadius: 40, backgroundColor: '#E8F5E9',
        justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#fff',
    },
    roleBadge: {
        flexDirection: 'row', alignItems: 'center', alignSelf: 'center', gap: 6,
        backgroundColor: '#E3F2FD', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 8,
    },
    roleDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00C853' },
    roleText: { color: '#1E88E5', fontWeight: '600', fontSize: 12 },
    infoSection: { padding: 20 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
    infoLabel: { fontSize: 12, color: '#999' },
    infoValue: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginLeft: 22 },
    statsCard: {
        backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    },
    statsHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    statsIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF8E1', justifyContent: 'center', alignItems: 'center' },
    statsTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a' },
    statsSubtitle: { fontSize: 12, color: '#999', marginTop: 2 },
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    statBadge: { flex: 1, borderRadius: 14, padding: 16 },
    statLabel: { fontSize: 12, color: '#666', marginTop: 8, marginBottom: 4 },
    statValue: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' },
    donorExtraStats: { marginTop: 0 },
    statBadgeWide: { borderRadius: 14, padding: 16 },
    statBadgeWideRow: { flexDirection: 'row', justifyContent: 'space-between' },
    settingsCard: {
        backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    },
    settingsTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 16 },
    settingsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
    settingsRowText: { fontSize: 15, color: '#333', fontWeight: '500' },
    divider: { height: 1, backgroundColor: '#f0f0f0' },
    updateBanner: {
        backgroundColor: '#FFF3E0', borderRadius: 12, padding: 14, marginBottom: 16,
        borderWidth: 1, borderColor: '#FFE0B2',
    },
    updateBannerText: { fontSize: 13, color: '#E65100', lineHeight: 18 },
});
