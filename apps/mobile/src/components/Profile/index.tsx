import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Modal,
  Pressable,
  ActivityIndicator,
  Platform,
  Switch,
  TextInput,
  Image as RNImage,
} from "react-native";
import { useAuth } from "../../../context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  User,
  LogOut,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ArrowLeft,
  Edit2,
  Settings,
  Heart,
  Globe,
  Star,
  ChevronDown,
  Package,
  RefreshCw,
  Trash2,
  Moon,
  Info,
  BellOff,
  Bell,
} from "lucide-react-native";
import { useRouter, useFocusEffect } from "expo-router";
import axiosClient from "../../api/axiosClient";
import { API_ENDPOINTS } from "../../api/endpoints";
import { wp, hp, fp, isTablet } from "../../utils/responsive";
import LoadingScreen from "../LoadingScreen";
import { useTheme } from "../../../context/ThemeContext";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import { useAlert } from "../../../context/AlertContext";

export default function Profile() {
  const { user, signOut, role, setRole, sendDeleteAccountOtp, verifyDeleteAccountOtp } = useAuth();
  const router = useRouter();
  const { showAlert } = useAlert();
  const [profileData, setProfileData] = useState<any>(null);
  const [statsData, setStatsData] = useState<any>(null);
  const [donorHistoryStats, setDonorHistoryStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const { isDark, colors, toggleTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { registerToken, expoPushToken } = usePushNotifications();

  // Logout/Delete states
  const [isLoadingLogout, setIsLoadingLogout] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteOtp, setDeleteOtp] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Load preferences
  useEffect(() => {
    AsyncStorage.getItem('notificationsEnabled').then(val => {
      if (val === 'false') setNotificationsEnabled(false);
    });
  }, []);

  const fetchProfileData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const profileRes = await axiosClient.get(API_ENDPOINTS.USER.GET_PROFILE);
      setProfileData(profileRes.data);
    } catch (error: any) {
      console.error("Error fetching profile:", error?.response?.data || error?.message || error);
    }

    try {
      const dashboardRes =
        role === "DONOR"
          ? await axiosClient.get(API_ENDPOINTS.DASHBOARD.DONOR)
          : await axiosClient.get(API_ENDPOINTS.DASHBOARD.RECIPIENT);
      setStatsData(dashboardRes.data?.stats || null);
    } catch (error: any) {
      console.error("Error fetching dashboard stats:", error?.response?.data || error?.message || error);
    }

    // If current role is RECIPIENT, also fetch donor stats for history card
    if (role === "RECIPIENT") {
      try {
        const donorRes = await axiosClient.get(API_ENDPOINTS.DASHBOARD.DONOR);
        setDonorHistoryStats(donorRes.data?.stats || null);
      } catch (error) {
        // User may not have any donor activity — that's fine
        setDonorHistoryStats(null);
      }
    } else {
      setDonorHistoryStats(null);
    }

    setLoading(false);
    setRefreshing(false);
  }, [role, user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchProfileData();
    }, [fetchProfileData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfileData();
  }, [fetchProfileData]);

  const handleRoleSwitch = async (newRole: "DONOR" | "RECIPIENT") => {
    if (newRole === role) {
      setShowRolePicker(false);
      return;
    }
    setSwitchingRole(true);
    setShowRolePicker(false);
    try {
      await setRole(newRole);
      // Re-fetch all data for the new role
      setStatsData(null);
      setDonorHistoryStats(null);
      setLoading(true);
      // fetchProfileData will run due to the role dependency change
    } catch (error) {
      console.error("Error switching role:", error);
      showAlert("Error", "Failed to switch role. Please try again.", undefined, { type: 'error' });
    } finally {
      setSwitchingRole(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoadingLogout(true);
      // Small delay to let the UI update if needed, though state change should be immediate
      await new Promise(resolve => setTimeout(resolve, 500));

      setProfileData(null);
      setStatsData(null);
      setDonorHistoryStats(null);
      await signOut();
    } catch (error) {
      console.error(error);
      showAlert("Error", "Failed to logout", undefined, { type: 'error' });
      setIsLoadingLogout(false);
    }
  };

  const handleDarkModeToggle = () => {
    toggleTheme();
  };

  const handleNotificationsToggle = async (value: boolean) => {
    // Optimistic UI update
    setNotificationsEnabled(value);
    await AsyncStorage.setItem('notificationsEnabled', String(value));

    try {
      if (value) {
        // Turning ON: request token and send to backend
        const token = await registerToken();
        if (token) {
          await axiosClient.put(API_ENDPOINTS.USER.PUSH_TOKEN, { pushToken: token });
        }
      } else {
        // Turning OFF: tell backend to remove token (by sending a null or empty token, or empty payload if the backend unsets it when empty)
        await axiosClient.put(API_ENDPOINTS.USER.PUSH_TOKEN, { pushToken: null });
      }
    } catch (error) {
      console.error("Error updating push token preference on backend:", error);
      // Revert if API call fails
      setNotificationsEnabled(!value);
      await AsyncStorage.setItem('notificationsEnabled', String(!value));
    }
  };

  const handleDeleteAccount = () => {
    showAlert(
      "Delete Account",
      "Are you sure you want to delete your account? You will need to verify your email to confirm.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send Code",
          style: "destructive",
          onPress: async () => {
            try {
              if (user?.email) {
                setLoading(true);
                await sendDeleteAccountOtp(user.email);
                setLoading(false);
                setShowDeleteModal(true);
              } else {
                showAlert("Error", "No email found for this user.", undefined, { type: 'error' });
              }
            } catch (error: any) {
              setLoading(false);
              console.error("Delete account OTP error:", error);
              showAlert("Error", "Failed to send verification code. Please try again.", undefined, { type: 'error' });
            }
          },
        },
      ],
      { type: 'warning' }
    );
  };

  const handleConfirmDelete = async () => {
    if (!deleteOtp || deleteOtp.length < 6) {
      showAlert("Error", "Please enter a valid code (6-8 digits).", undefined, { type: 'warning' });
      return;
    }

    try {
      setIsDeleting(true);
      if (user?.email) {
        // 1. Verify OTP
        await verifyDeleteAccountOtp(user.email, deleteOtp);

        // 2. Delete Account
        await axiosClient.delete(API_ENDPOINTS.USER.DELETE_ACCOUNT);

        // 3. Sign Out
        await signOut();

        setShowDeleteModal(false);
        showAlert("Account Deleted", "Your account has been permanently deleted.", undefined, { type: 'success' });
      }
    } catch (error: any) {
      setIsDeleting(false);
      console.error("Confirm delete error:", error);
      showAlert("Error", "Failed to verify code or delete account. Please check the code and try again.", undefined, { type: 'error' });
    }
  };

  const displayName = profileData?.profile
    ? `${profileData.profile.firstName || ""} ${profileData.profile.lastName || ""}`.trim() ||
    profileData?.user?.displayName ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "User"
    : user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const displayEmail = profileData?.user?.email || user?.email || "";
  const displayPhone =
    profileData?.profile?.phoneNo || user?.phone || "Not provided";
  const displayBarangay =
    profileData?.profile?.address?.barangay ||
    user?.user_metadata?.barangay ||
    "Not set";
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    })
    : "N/A";
  const needsProfileUpdate = profileData?.needsProfileUpdate === true;

  // Check if user has any donor history worth showing
  const hasDonorHistory = !!(
    donorHistoryStats &&
    ((donorHistoryStats.totalDonated && donorHistoryStats.totalDonated > 0) ||
      (donorHistoryStats.availableItems &&
        donorHistoryStats.availableItems > 0))
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
        <LoadingScreen message="Loading profile..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBtn}>
          <ArrowLeft size={wp(22)} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Profile</Text>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.push("/(tabs)/edit-profile")}>
          <Edit2 size={wp(20)} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#00C853"]}
          />
        }>
        {/* Profile update banner */}
        {needsProfileUpdate && (
          <View style={styles.updateBanner}>
            <Text style={styles.updateBannerText}>
              Your profile information needs to be updated. Please edit your
              profile to fix displayed data.
            </Text>
          </View>
        )}

        {/* Profile Card with Banner */}
        <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
          <View style={styles.bannerImage}>
            <View style={styles.bannerGradient} />
          </View>
          <View style={styles.avatarWrapper}>
            <View style={[styles.avatarContainer, { borderColor: colors.card }]}>
              <User size={wp(40)} color="#2E7D32" />
            </View>
          </View>

          {/* Role Switcher */}
          <TouchableOpacity
            style={styles.roleBadge}
            onPress={() => setShowRolePicker(true)}
            activeOpacity={0.7}>
            <View style={styles.roleDot} />
            <Text style={styles.roleText}>{role || "USER"}</Text>
            <ChevronDown size={wp(14)} color="#1E88E5" />
            {switchingRole && (
              <ActivityIndicator
                size="small"
                color="#1E88E5"
                style={{ marginLeft: wp(4) }}
              />
            )}
          </TouchableOpacity>

          {/* Info Rows */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <User size={wp(16)} color={colors.textTertiary} />
              <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Full Name</Text>
            </View>
            <Text style={[styles.infoValue, { color: colors.text }]}>{displayName}</Text>

            <View style={[styles.infoRow, { marginTop: hp(16) }]}>
              <Mail size={wp(16)} color={colors.textTertiary} />
              <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Email Address</Text>
            </View>
            <Text style={[styles.infoValue, { color: colors.text }]}>{displayEmail}</Text>

            <View style={[styles.infoRow, { marginTop: hp(16) }]}>
              <Phone size={wp(16)} color={colors.textTertiary} />
              <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Phone Number</Text>
            </View>
            <Text style={[styles.infoValue, { color: colors.text }]}>{displayPhone}</Text>

            <View style={[styles.infoRow, { marginTop: hp(16) }]}>
              <MapPin size={wp(16)} color={colors.textTertiary} />
              <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Barangay</Text>
            </View>
            <Text style={[styles.infoValue, { color: colors.text }]}>{displayBarangay}</Text>

            <View style={[styles.infoRow, { marginTop: hp(16) }]}>
              <Calendar size={wp(16)} color={colors.textTertiary} />
              <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Member Since</Text>
            </View>
            <Text style={[styles.infoValue, { color: colors.text }]}>{memberSince}</Text>
          </View>
        </View>

        {/* Statistics Card */}
        <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
          <View style={styles.statsHeader}>
            <View style={styles.statsIconWrap}>
              <Star size={wp(20)} color="#FFC107" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.statsTitle, { color: colors.text }]}>
                {role === "DONOR"
                  ? "Donation Statistics"
                  : "Food Received Statistics"}
              </Text>
              <Text style={[styles.statsSubtitle, { color: colors.textTertiary }]}>
                {role === "DONOR"
                  ? "Your contribution to the community"
                  : "Your food consumption currently."}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statBadge, { backgroundColor: isDark ? '#3a1a1a' : "#FFEBEE" }]}>
              <Heart size={wp(16)} color="#E53935" />
              <Text style={styles.statLabel}>
                {role === "DONOR" ? "Total Donations" : "Total Received"}
              </Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {role === "DONOR"
                  ? statsData?.totalDonated || 0
                  : statsData?.totalReceived || 0}
              </Text>
            </View>
            <View style={[styles.statBadge, { backgroundColor: isDark ? '#1a2a3a' : "#E3F2FD" }]}>
              <Globe size={wp(16)} color="#1E88E5" />
              <Text style={styles.statLabel}>Active Now</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {role === "DONOR"
                  ? statsData?.availableItems || 0
                  : statsData?.activeNow || 0}
              </Text>
            </View>
          </View>

          {role === "DONOR" && (
            <View style={styles.donorExtraStats}>
              <View
                style={[styles.statBadgeWide, { backgroundColor: isDark ? '#1a3a1a' : "#E8F5E9" }]}>
                <View style={styles.statBadgeWideRow}>
                  <View>
                    <Heart size={wp(16)} color="#E53935" />
                    <Text style={styles.statLabel}>Families Helped</Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {statsData?.familiesHelped || 0}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Star size={wp(16)} color="#FFC107" fill="#FFC107" />
                    <Text style={styles.statLabel}>Rating</Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {statsData?.averageRating || "N/A"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Donor History Card (shown only to recipients who have donor activity) */}
        {role === "RECIPIENT" && hasDonorHistory && (
          <View style={[styles.donorHistoryCard, { backgroundColor: colors.card, borderColor: isDark ? colors.border : '#E8F5E9' }]}>
            <View style={styles.donorHistoryHeader}>
              <View style={[styles.donorHistoryIconWrap, { backgroundColor: isDark ? '#1a3a1a' : '#E8F5E9' }]}>
                <Package size={wp(20)} color="#2E7D32" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.donorHistoryTitle}>
                  Your Donor Activity
                </Text>
                <Text style={[styles.donorHistorySubtitle, { color: colors.textSecondary }]}>
                  Contributions you made as a donor
                </Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={[styles.statBadge, { backgroundColor: isDark ? '#1a3a1a' : "#E8F5E9" }]}>
                <Heart size={wp(16)} color="#2E7D32" />
                <Text style={styles.statLabel}>Total Donated</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {donorHistoryStats?.totalDonated || 0}
                </Text>
              </View>
              <View style={[styles.statBadge, { backgroundColor: isDark ? '#3a3a1a' : "#FFF8E1" }]}>
                <Star size={wp(16)} color="#FFC107" fill="#FFC107" />
                <Text style={styles.statLabel}>Avg Rating</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {donorHistoryStats?.averageRating || "N/A"}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Account Settings */}
        <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.settingsTitle, { color: colors.text }]}>Account Settings</Text>

          <TouchableOpacity style={styles.settingsRow} onPress={() => setShowSettingsModal(true)}>
            <Settings size={wp(20)} color={colors.text} />
            <Text style={[styles.settingsRowText, { color: colors.text }]}>
              Settings
            </Text>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity style={styles.settingsRow} onPress={handleLogout}>
            <LogOut size={wp(20)} color="#E53935" />
            <Text style={[styles.settingsRowText, { color: "#E53935" }]}>
              Log Out
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: hp(30) }} />
      </ScrollView>

      {/* Role Picker Modal */}
      <Modal
        visible={showRolePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRolePicker(false)}>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowRolePicker(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Switch Role</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Choose how you want to use KusinaKonek
            </Text>

            <TouchableOpacity
              style={[
                styles.roleOption,
                role === "DONOR" && styles.roleOptionActive,
              ]}
              onPress={() => handleRoleSwitch("DONOR")}>
              <View
                style={[styles.roleOptionIcon, { backgroundColor: "#E8F5E9" }]}>
                <Heart size={wp(24)} color="#2E7D32" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.roleOptionTitle}>Donor</Text>
                <Text style={styles.roleOptionDesc}>
                  Share food with families in need
                </Text>
              </View>
              {role === "DONOR" && <View style={styles.roleOptionCheck} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleOption,
                role === "RECIPIENT" && styles.roleOptionActive,
              ]}
              onPress={() => handleRoleSwitch("RECIPIENT")}>
              <View
                style={[styles.roleOptionIcon, { backgroundColor: "#E3F2FD" }]}>
                <Package size={wp(24)} color="#1E88E5" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.roleOptionTitle}>Recipient</Text>
                <Text style={styles.roleOptionDesc}>
                  Browse and receive free food
                </Text>
              </View>
              {role === "RECIPIENT" && <View style={styles.roleOptionCheck} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setShowRolePicker(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* About App Modal */}
      <Modal
        visible={showAboutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAboutModal(false)}>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowAboutModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>About KusinaKonek</Text>

            <View style={{ alignItems: 'center', marginVertical: hp(16) }}>
              <View style={[styles.avatarContainer, { width: wp(60), height: wp(60), borderRadius: wp(16), marginBottom: hp(12), borderColor: 'transparent' }]}>
                <RNImage source={require('../../../assets/KusinaKonek-Logo.png')} style={{ width: wp(40), height: wp(40) }} resizeMode="contain" />
              </View>
              <Text style={{ fontSize: fp(16), fontWeight: 'bold', color: colors.text }}>KusinaKonek</Text>
              <Text style={{ fontSize: fp(14), color: colors.textSecondary, marginTop: hp(4) }}>Version 1.0.1</Text>
            </View>

            <Text style={[styles.modalSubtitle, { color: colors.text, textAlign: 'center', lineHeight: 22 }]}>
              KusinaKonek is a community-driven food sharing platform dedicated to reducing food waste and helping families in need.
            </Text>

            <View style={{ marginTop: hp(16), padding: wp(12), backgroundColor: isDark ? '#333' : '#F5F5F5', borderRadius: wp(8) }}>
              <Text style={{ fontSize: fp(10), color: colors.textSecondary, marginBottom: hp(4) }}>Device Push Token:</Text>
              <Text selectable style={{ fontSize: fp(9), color: colors.text, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                {expoPushToken || "Token not available. Please ensure notifications are enabled."}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.modalCancelBtn, { marginTop: hp(24), backgroundColor: '#00C853', borderWidth: 0 }]}
              onPress={() => setShowAboutModal(false)}>
              <Text style={[styles.modalCancelText, { color: '#fff' }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Delete Account OTP Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            // Do not close on outside click to ensure user consciously cancels
            // if (!isDeleting) setShowDeleteModal(false);
          }}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Verify Deletion</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Please enter the verification code sent to {user?.email}
            </Text>

            <TextInput
              style={[
                styles.otpInput,
                {
                  backgroundColor: isDark ? '#333' : '#F5F5F5',
                  color: colors.text,
                  borderColor: colors.border
                }
              ]}
              placeholder="Enter verification code"
              placeholderTextColor={colors.textTertiary}
              value={deleteOtp}
              onChangeText={setDeleteOtp}
              keyboardType="number-pad"
              maxLength={8}
              editable={!isDeleting}
            />

            <TouchableOpacity
              style={[styles.deleteConfirmBtn, isDeleting && styles.disabledBtn]}
              onPress={handleConfirmDelete}
              disabled={isDeleting}>
              {isDeleting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.deleteConfirmText}>Verify & Delete</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setShowDeleteModal(false)}
              disabled={isDeleting}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Full Settings Modal */}
      <Modal
        visible={showSettingsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSettingsModal(false)}>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowSettingsModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, paddingVertical: hp(32) }]}>
            <Text style={[styles.modalTitle, { color: colors.text, marginBottom: hp(24) }]}>Settings</Text>

            <View style={styles.settingsRow}>
              <Moon size={wp(20)} color={colors.text} />
              <Text style={[styles.settingsRowText, { flex: 1, color: colors.text }]}>Dark Theme</Text>
              <Switch
                value={isDark}
                onValueChange={handleDarkModeToggle}
                trackColor={{ false: '#ddd', true: '#81C784' }}
                thumbColor={isDark ? '#2E7D32' : '#f4f3f4'}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.settingsRow}>
              {notificationsEnabled
                ? <Bell size={wp(20)} color={colors.text} />
                : <BellOff size={wp(20)} color={colors.textTertiary} />}
              <Text style={[styles.settingsRowText, { flex: 1, color: colors.text }]}>Notifications</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationsToggle}
                trackColor={{ false: '#ddd', true: '#81C784' }}
                thumbColor={notificationsEnabled ? '#2E7D32' : '#f4f3f4'}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity style={styles.settingsRow} onPress={() => { setShowSettingsModal(false); setShowAboutModal(true); }}>
              <Info size={wp(20)} color={colors.text} />
              <Text style={[styles.settingsRowText, { color: colors.text }]}>About KusinaKonek</Text>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity style={styles.settingsRow} onPress={() => { setShowSettingsModal(false); handleDeleteAccount(); }}>
              <Trash2 size={wp(20)} color="#E53935" />
              <Text style={[styles.settingsRowText, { color: "#E53935" }]}>
                Delete Account
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalCancelBtn, { marginTop: hp(24) }]}
              onPress={() => setShowSettingsModal(false)}>
              <Text style={styles.modalCancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Logout Loading Overlay */}
      {isLoadingLogout && (
        <View style={StyleSheet.absoluteFill}>
          <LoadingScreen message="Logging out..." />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: wp(16),
    paddingVertical: hp(12),
    backgroundColor: "#fff",
  },
  headerBtn: {
    width: wp(40),
    height: wp(40),
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: fp(18), fontWeight: "bold", color: "#1a1a1a" },
  scrollContent: {
    padding: wp(16),
    paddingBottom: Platform.OS === "ios" ? hp(110) : hp(90),
  },
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: wp(20),
    overflow: "hidden",
    marginBottom: hp(16),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  bannerImage: { height: hp(100), backgroundColor: "#00C853" },
  bannerGradient: { flex: 1, opacity: 0.8 },
  avatarWrapper: { alignItems: "center", marginTop: hp(-40) },
  avatarContainer: {
    width: wp(80),
    height: wp(80),
    borderRadius: wp(40),
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#fff",
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: wp(6),
    backgroundColor: "#E3F2FD",
    paddingHorizontal: wp(14),
    paddingVertical: hp(6),
    borderRadius: wp(14),
    marginTop: hp(8),
  },
  roleDot: {
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
    backgroundColor: "#00C853",
  },
  roleText: { color: "#1E88E5", fontWeight: "600", fontSize: fp(13) },
  infoSection: { padding: wp(20) },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(6),
    marginBottom: hp(2),
  },
  infoLabel: { fontSize: fp(12), color: "#999" },
  infoValue: {
    fontSize: fp(16),
    fontWeight: "600",
    color: "#1a1a1a",
    marginLeft: wp(22),
  },
  statsCard: {
    backgroundColor: "#fff",
    borderRadius: wp(20),
    padding: wp(20),
    marginBottom: hp(16),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(12),
    marginBottom: hp(16),
  },
  statsIconWrap: {
    width: wp(36),
    height: wp(36),
    borderRadius: wp(18),
    backgroundColor: "#FFF8E1",
    justifyContent: "center",
    alignItems: "center",
  },
  statsTitle: { fontSize: fp(16), fontWeight: "bold", color: "#1a1a1a" },
  statsSubtitle: { fontSize: fp(12), color: "#999", marginTop: hp(2) },
  statsRow: {
    flexDirection: "row",
    gap: wp(12),
    marginBottom: hp(12),
    flexWrap: "wrap",
  },
  statBadge: {
    flex: 1,
    minWidth: isTablet ? wp(140) : wp(120),
    borderRadius: wp(14),
    padding: wp(16),
  },
  statLabel: {
    fontSize: fp(12),
    color: "#666",
    marginTop: hp(8),
    marginBottom: hp(4),
  },
  statValue: { fontSize: fp(24), fontWeight: "bold", color: "#1a1a1a" },
  donorExtraStats: { marginTop: 0 },
  statBadgeWide: { borderRadius: wp(14), padding: wp(16) },
  statBadgeWideRow: { flexDirection: "row", justifyContent: "space-between" },
  // Donor History Card (for recipients)
  donorHistoryCard: {
    backgroundColor: "#fff",
    borderRadius: wp(20),
    padding: wp(20),
    marginBottom: hp(16),
    borderWidth: 1,
    borderColor: "#E8F5E9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  donorHistoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(12),
    marginBottom: hp(16),
  },
  donorHistoryIconWrap: {
    width: wp(36),
    height: wp(36),
    borderRadius: wp(18),
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },
  donorHistoryTitle: { fontSize: fp(16), fontWeight: "bold", color: "#2E7D32" },
  donorHistorySubtitle: { fontSize: fp(12), color: "#666", marginTop: hp(2) },
  // Settings
  settingsCard: {
    backgroundColor: "#fff",
    borderRadius: wp(20),
    padding: wp(20),
    marginBottom: hp(16),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  settingsTitle: {
    fontSize: fp(16),
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: hp(16),
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(12),
    paddingVertical: hp(14),
  },
  settingsRowText: { fontSize: fp(15), color: "#333", fontWeight: "500" },
  divider: { height: 1, backgroundColor: "#f0f0f0" },
  updateBanner: {
    backgroundColor: "#FFF3E0",
    borderRadius: wp(12),
    padding: wp(14),
    marginBottom: hp(16),
    borderWidth: 1,
    borderColor: "#FFE0B2",
  },
  updateBannerText: { fontSize: fp(13), color: "#E65100", lineHeight: fp(18) },
  // Role Picker Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: wp(20),
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: wp(24),
    padding: wp(24),
    width: "100%",
    maxWidth: wp(400),
  },
  modalTitle: {
    fontSize: fp(20),
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: hp(4),
  },
  modalSubtitle: { fontSize: fp(14), color: "#666", marginBottom: hp(20) },
  roleOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(14),
    padding: wp(16),
    borderRadius: wp(16),
    borderWidth: 2,
    borderColor: "transparent",
    marginBottom: hp(12),
  },
  roleOptionActive: { borderColor: "#00C853", backgroundColor: "rgba(0, 200, 83, 0.1)" },
  roleOptionIcon: {
    width: wp(48),
    height: wp(48),
    borderRadius: wp(24),
    justifyContent: "center",
    alignItems: "center",
  },
  roleOptionTitle: { fontSize: fp(16), fontWeight: "bold", color: "#1a1a1a" },
  roleOptionDesc: { fontSize: fp(13), color: "#666", marginTop: hp(2) },
  roleOptionCheck: {
    width: wp(20),
    height: wp(20),
    borderRadius: wp(10),
    backgroundColor: "#00C853",
  },
  modalCancelBtn: {
    alignItems: "center",
    paddingVertical: hp(14),
    marginTop: hp(4),
  },
  modalCancelText: { fontSize: fp(15), color: "#999", fontWeight: "600" },
  otpInput: {
    padding: wp(16),
    borderRadius: wp(12),
    borderWidth: 1,
    fontSize: fp(20),
    textAlign: "center",
    marginBottom: hp(24),
    letterSpacing: 4,
  },
  deleteConfirmBtn: {
    backgroundColor: "#E53935",
    paddingVertical: hp(16),
    borderRadius: wp(12),
    alignItems: "center",
    marginBottom: hp(8),
  },
  deleteConfirmText: {
    color: "#fff",
    fontSize: fp(16),
    fontWeight: "bold",
  },
  disabledBtn: {
    opacity: 0.7,
  },
});
