import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  Modal,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useAuth } from "../../../context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
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
} from "lucide-react-native";
import { useRouter } from "expo-router";
import axiosClient from "../../api/axiosClient";
import { API_ENDPOINTS } from "../../api/endpoints";
import { wp, hp, fp, isTablet } from "../../utils/responsive";
import LoadingScreen from "../LoadingScreen";

export default function Profile() {
  const { user, signOut, role, setRole } = useAuth();
  const router = useRouter();
  const [profileData, setProfileData] = useState<any>(null);
  const [statsData, setStatsData] = useState<any>(null);
  const [donorHistoryStats, setDonorHistoryStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);

  const fetchProfileData = useCallback(async () => {
    if (!user) return;

    try {
      const profileRes = await axiosClient.get(API_ENDPOINTS.USER.GET_PROFILE);
      setProfileData(profileRes.data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }

    try {
      const dashboardRes =
        role === "DONOR"
          ? await axiosClient.get(API_ENDPOINTS.DASHBOARD.DONOR)
          : await axiosClient.get(API_ENDPOINTS.DASHBOARD.RECIPIENT);
      setStatsData(dashboardRes.data?.stats || null);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
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

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

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
      Alert.alert("Error", "Failed to switch role. Please try again.");
    } finally {
      setSwitchingRole(false);
    }
  };

  const handleLogout = async () => {
    try {
      setProfileData(null);
      setStatsData(null);
      setDonorHistoryStats(null);
      await signOut();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to logout");
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
  const hasDonorHistory =
    donorHistoryStats &&
    ((donorHistoryStats.totalDonated && donorHistoryStats.totalDonated > 0) ||
      (donorHistoryStats.availableItems &&
        donorHistoryStats.availableItems > 0));

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBtn}>
          <ArrowLeft size={wp(22)} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.push("/(tabs)/edit-profile")}>
          <Edit2 size={wp(20)} color="#333" />
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
        <View style={styles.profileCard}>
          <View style={styles.bannerImage}>
            <View style={styles.bannerGradient} />
          </View>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarContainer}>
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
              <User size={wp(16)} color="#666" />
              <Text style={styles.infoLabel}>Full Name</Text>
            </View>
            <Text style={styles.infoValue}>{displayName}</Text>

            <View style={[styles.infoRow, { marginTop: hp(16) }]}>
              <Mail size={wp(16)} color="#666" />
              <Text style={styles.infoLabel}>Email Address</Text>
            </View>
            <Text style={styles.infoValue}>{displayEmail}</Text>

            <View style={[styles.infoRow, { marginTop: hp(16) }]}>
              <Phone size={wp(16)} color="#666" />
              <Text style={styles.infoLabel}>Phone Number</Text>
            </View>
            <Text style={styles.infoValue}>{displayPhone}</Text>

            <View style={[styles.infoRow, { marginTop: hp(16) }]}>
              <MapPin size={wp(16)} color="#666" />
              <Text style={styles.infoLabel}>Barangay</Text>
            </View>
            <Text style={styles.infoValue}>{displayBarangay}</Text>

            <View style={[styles.infoRow, { marginTop: hp(16) }]}>
              <Calendar size={wp(16)} color="#666" />
              <Text style={styles.infoLabel}>Member Since</Text>
            </View>
            <Text style={styles.infoValue}>{memberSince}</Text>
          </View>
        </View>

        {/* Statistics Card */}
        <View style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <View style={styles.statsIconWrap}>
              <Star size={wp(20)} color="#FFC107" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statsTitle}>
                {role === "DONOR"
                  ? "Donation Statistics"
                  : "Food Received Statistics"}
              </Text>
              <Text style={styles.statsSubtitle}>
                {role === "DONOR"
                  ? "Your contribution to the community"
                  : "Your food consumption currently."}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statBadge, { backgroundColor: "#FFEBEE" }]}>
              <Heart size={wp(16)} color="#E53935" />
              <Text style={styles.statLabel}>
                {role === "DONOR" ? "Total Donations" : "Total Received"}
              </Text>
              <Text style={styles.statValue}>
                {role === "DONOR"
                  ? statsData?.totalDonated || 0
                  : statsData?.availableFoods || 0}
              </Text>
            </View>
            <View style={[styles.statBadge, { backgroundColor: "#E3F2FD" }]}>
              <Globe size={wp(16)} color="#1E88E5" />
              <Text style={styles.statLabel}>Active Now</Text>
              <Text style={styles.statValue}>
                {role === "DONOR"
                  ? statsData?.availableItems || 0
                  : statsData?.locations || 0}
              </Text>
            </View>
          </View>

          {role === "DONOR" && (
            <View style={styles.donorExtraStats}>
              <View
                style={[styles.statBadgeWide, { backgroundColor: "#E8F5E9" }]}>
                <View style={styles.statBadgeWideRow}>
                  <View>
                    <Heart size={wp(16)} color="#E53935" />
                    <Text style={styles.statLabel}>Families Helped</Text>
                    <Text style={styles.statValue}>
                      {statsData?.familiesHelped || 0}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Star size={wp(16)} color="#FFC107" fill="#FFC107" />
                    <Text style={styles.statLabel}>Rating</Text>
                    <Text style={styles.statValue}>
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
          <View style={styles.donorHistoryCard}>
            <View style={styles.donorHistoryHeader}>
              <View style={styles.donorHistoryIconWrap}>
                <Package size={wp(20)} color="#2E7D32" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.donorHistoryTitle}>
                  Your Donor Activity
                </Text>
                <Text style={styles.donorHistorySubtitle}>
                  Contributions you made as a donor
                </Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={[styles.statBadge, { backgroundColor: "#E8F5E9" }]}>
                <Heart size={wp(16)} color="#2E7D32" />
                <Text style={styles.statLabel}>Total Donated</Text>
                <Text style={styles.statValue}>
                  {donorHistoryStats?.totalDonated || 0}
                </Text>
              </View>
              <View style={[styles.statBadge, { backgroundColor: "#FFF8E1" }]}>
                <Star size={wp(16)} color="#FFC107" fill="#FFC107" />
                <Text style={styles.statLabel}>Avg Rating</Text>
                <Text style={styles.statValue}>
                  {donorHistoryStats?.averageRating || "N/A"}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Account Settings */}
        <View style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>Account Settings</Text>

          <TouchableOpacity style={styles.settingsRow}>
            <Settings size={wp(20)} color="#333" />
            <Text style={styles.settingsRowText}>Settings</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

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
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Switch Role</Text>
            <Text style={styles.modalSubtitle}>
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
  bannerImage: { height: hp(100), backgroundColor: "#F5C518" },
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
    borderColor: "#f0f0f0",
    marginBottom: hp(12),
  },
  roleOptionActive: { borderColor: "#00C853", backgroundColor: "#F1F8E9" },
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
});
