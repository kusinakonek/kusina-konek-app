import React from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity } from "react-native";
import { Ban } from "lucide-react-native";
import { wp, hp, fp } from "../../utils/responsive";
import { theme } from "../../constants/theme";
import { useTheme } from "../../../context/ThemeContext";

interface ClaimLimitModalProps {
  visible: boolean;
  onClose: () => void;
  dailyClaims: number;
  weeklyClaims: number;
  monthlyClaims: number;
}

const MAX_DAILY = 1;
const MAX_WEEKLY = 3;
const MAX_MONTHLY = 5;

export default function ClaimLimitModal({
  visible,
  onClose,
  dailyClaims,
  weeklyClaims,
  monthlyClaims,
}: ClaimLimitModalProps) {
  const { colors, isDark } = useTheme();
  const dailyExceeded = dailyClaims >= MAX_DAILY;
  const weeklyExceeded = weeklyClaims >= MAX_WEEKLY;
  const monthlyExceeded = monthlyClaims >= MAX_MONTHLY;

  let message = "You have reached your claim limit.";
  if (monthlyExceeded) {
    message =
      "You have reached your monthly limit of 5 claims. Your limit will refresh next month.";
  } else if (weeklyExceeded) {
    message =
      "You have reached your weekly limit of 3 claims. Please try again next week.";
  } else if (dailyExceeded) {
    message =
      "You have reached your daily limit of 1 claim. Please try again tomorrow.";
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.card }]}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(211, 47, 47, 0.2)' : 'rgba(211, 47, 47, 0.1)' }]}>
              <Ban
                size={fp(36)}
                color={theme.colors.danger}
                strokeWidth={2.5}
              />
            </View>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>Claim Limit Reached</Text>

          {/* Message */}
          <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>

          {/* Usage Summary */}
          <View style={styles.usageSection}>
            <View
              style={[
                styles.usageRow,
                { backgroundColor: isDark ? colors.background : '#F8F9FA' },
                dailyExceeded && styles.usageRowExceeded,
              ]}>
              <Text style={[styles.usageLabel, { color: colors.text }]}>Today</Text>
              <Text
                style={[
                  styles.usageValue,
                  dailyExceeded && styles.usageValueExceeded,
                ]}>
                {dailyClaims}/{MAX_DAILY}
              </Text>
            </View>
            <View
              style={[
                styles.usageRow,
                { backgroundColor: isDark ? colors.background : '#F8F9FA' },
                weeklyExceeded && styles.usageRowExceeded,
              ]}>
              <Text style={[styles.usageLabel, { color: colors.text }]}>This Week</Text>
              <Text
                style={[
                  styles.usageValue,
                  weeklyExceeded && styles.usageValueExceeded,
                ]}>
                {weeklyClaims}/{MAX_WEEKLY}
              </Text>
            </View>
            <View
              style={[
                styles.usageRow,
                { backgroundColor: isDark ? colors.background : '#F8F9FA' },
                monthlyExceeded && styles.usageRowExceeded,
              ]}>
              <Text style={[styles.usageLabel, { color: colors.text }]}>This Month</Text>
              <Text
                style={[
                  styles.usageValue,
                  monthlyExceeded && styles.usageValueExceeded,
                ]}>
                {monthlyClaims}/{MAX_MONTHLY}
              </Text>
            </View>
          </View>

          {/* OK Button */}
          <TouchableOpacity
            style={styles.okButton}
            onPress={onClose}
            activeOpacity={0.8}>
            <Text style={styles.okButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: wp(20),
  },
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: wp(20),
    padding: wp(28),
    width: "100%",
    maxWidth: wp(380),
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  iconContainer: {
    marginBottom: hp(14),
  },
  iconCircle: {
    width: wp(70),
    height: wp(70),
    borderRadius: wp(35),
    backgroundColor: "rgba(211, 47, 47, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: fp(20),
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: hp(10),
    textAlign: "center",
  },
  message: {
    fontSize: fp(14),
    color: theme.colors.mutedText,
    textAlign: "center",
    lineHeight: fp(20),
    marginBottom: hp(20),
    paddingHorizontal: wp(8),
  },
  usageSection: {
    width: "100%",
    marginBottom: hp(24),
    gap: hp(8),
  },
  usageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: wp(10),
    paddingVertical: hp(12),
    paddingHorizontal: wp(16),
  },
  usageRowExceeded: {
    backgroundColor: "rgba(211, 47, 47, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(211, 47, 47, 0.2)",
  },
  usageLabel: {
    fontSize: fp(14),
    fontWeight: "500",
    color: theme.colors.text,
  },
  usageValue: {
    fontSize: fp(14),
    fontWeight: "700",
    color: theme.colors.primary,
  },
  usageValueExceeded: {
    color: theme.colors.danger,
  },
  okButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: wp(12),
    paddingVertical: hp(14),
    paddingHorizontal: wp(40),
    width: "100%",
    alignItems: "center",
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  okButtonText: {
    fontSize: fp(15),
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
