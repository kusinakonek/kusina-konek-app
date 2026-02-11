import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { CheckCircle, MapPin } from "lucide-react-native";
import { wp, hp, fp } from "../../utils/responsive";
import { theme } from "../../constants/theme";

interface ClaimedItem {
  disID: string;
  foodName: string;
  location: string;
}

interface ClaimsConfirmedModalProps {
  visible: boolean;
  claimedItems: ClaimedItem[];
  onClose: () => void;
}

export default function ClaimsConfirmedModal({
  visible,
  claimedItems,
  onClose,
}: ClaimsConfirmedModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <CheckCircle
                size={fp(40)}
                color={theme.colors.primary}
                strokeWidth={3}
              />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Claims Confirmed!</Text>

          {/* Description */}
          <Text style={styles.description}>
            Your food claims have been confirmed. Please pick up your items at
            the selected locations within the available times.
          </Text>

          {/* Claimed Items List */}
          <View style={styles.itemsSection}>
            <Text style={styles.sectionTitle}>
              Claimed Items ({claimedItems.length}):
            </Text>
            <ScrollView
              style={styles.itemsList}
              showsVerticalScrollIndicator={false}>
              {claimedItems.map((item, index) => (
                <View key={item.disID} style={styles.itemCard}>
                  <Text style={styles.itemName}>{item.foodName}</Text>
                  <View style={styles.locationRow}>
                    <MapPin size={fp(14)} color={theme.colors.mutedText} />
                    <Text style={styles.locationText}>{item.location}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Back to Dashboard Button */}
          <TouchableOpacity
            style={styles.dashboardButton}
            onPress={onClose}
            activeOpacity={0.8}>
            <Text style={styles.dashboardButtonText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: wp(20),
  },
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: wp(20),
    padding: wp(30),
    width: "100%",
    maxWidth: wp(400),
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  iconContainer: {
    marginBottom: hp(20),
  },
  iconCircle: {
    width: wp(80),
    height: wp(80),
    borderRadius: wp(40),
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: fp(24),
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: hp(15),
    textAlign: "center",
  },
  description: {
    fontSize: fp(14),
    color: theme.colors.mutedText,
    textAlign: "center",
    lineHeight: fp(20),
    marginBottom: hp(25),
    paddingHorizontal: wp(10),
  },
  itemsSection: {
    width: "100%",
    marginBottom: hp(25),
  },
  sectionTitle: {
    fontSize: fp(14),
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: hp(12),
  },
  itemsList: {
    maxHeight: hp(200),
  },
  itemCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: wp(12),
    padding: wp(15),
    marginBottom: hp(10),
  },
  itemName: {
    fontSize: fp(15),
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: hp(6),
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(6),
  },
  locationText: {
    fontSize: fp(13),
    color: theme.colors.mutedText,
  },
  dashboardButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: wp(12),
    paddingVertical: hp(15),
    paddingHorizontal: wp(30),
    width: "100%",
    alignItems: "center",
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  dashboardButtonText: {
    fontSize: fp(16),
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
