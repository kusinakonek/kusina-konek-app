import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { AlertTriangle, CheckSquare, Square } from "lucide-react-native";
import { wp, hp, fp } from "../../utils/responsive";
import { theme } from "../../constants/theme";
import { useTheme } from "../../../context/ThemeContext";

interface RecipientDisclaimerModalProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export default function RecipientDisclaimerModal({
  visible,
  onAccept,
  onDecline,
}: RecipientDisclaimerModalProps) {
  const [agreed, setAgreed] = useState(false);
  const { colors, isDark } = useTheme();

  // Reset checkbox when modal visibility changes
  React.useEffect(() => {
    if (visible) {
      setAgreed(false);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDecline}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.card }]}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: isDark
                    ? "rgba(255, 152, 0, 0.2)"
                    : "rgba(255, 152, 0, 0.12)",
                },
              ]}>
              <AlertTriangle
                size={fp(36)}
                color={theme.colors.secondary}
                strokeWidth={2.5}
              />
            </View>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>
            KUSINAKONEK Disclaimer
          </Text>

          <ScrollView
            style={styles.scrollArea}
            showsVerticalScrollIndicator={true}>
            {/* For Recipients Section */}
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              For Recipients
            </Text>
            <Text
              style={[styles.sectionIntro, { color: colors.textSecondary }]}>
              By requesting and receiving food through the KUSINAKONEK
              application, you agree to the following:
            </Text>

            <View style={styles.bulletItem}>
              <Text style={[styles.bullet, { color: colors.text }]}>•</Text>
              <Text
                style={[styles.bulletText, { color: colors.textSecondary }]}>
                You understand that the food available on the platform is
                donated by individual donors and is not promoted, endorsed, or
                guaranteed by KUSINAKONEK.
              </Text>
            </View>

            <View style={styles.bulletItem}>
              <Text style={[styles.bullet, { color: colors.text }]}>•</Text>
              <Text
                style={[styles.bulletText, { color: colors.textSecondary }]}>
                You accept full responsibility for the consumption of any food
                you request and receive through the app.
              </Text>
            </View>

            <View style={styles.bulletItem}>
              <Text style={[styles.bullet, { color: colors.text }]}>•</Text>
              <Text
                style={[styles.bulletText, { color: colors.textSecondary }]}>
                You acknowledge that KUSINAKONEK and its owners/operators hold
                no liability for any adverse effects, including but not limited
                to food poisoning, allergic reactions, or other health-related
                concerns.
              </Text>
            </View>

            {/* General Terms Section */}
            <Text
              style={[
                styles.sectionTitle,
                { marginTop: hp(16), color: colors.primary },
              ]}>
              General Terms
            </Text>

            <View style={styles.bulletItem}>
              <Text style={[styles.bullet, { color: colors.text }]}>•</Text>
              <Text
                style={[styles.bulletText, { color: colors.textSecondary }]}>
                Participation in the KUSINAKONEK food-sharing program is
                voluntary.
              </Text>
            </View>

            <View style={styles.bulletItem}>
              <Text style={[styles.bullet, { color: colors.text }]}>•</Text>
              <Text
                style={[styles.bulletText, { color: colors.textSecondary }]}>
                By using the application, both Donors and Recipients accept the
                risks associated with food donation and consumption.
              </Text>
            </View>

            <View style={styles.bulletItem}>
              <Text style={[styles.bullet, { color: colors.text }]}>•</Text>
              <Text
                style={[styles.bulletText, { color: colors.textSecondary }]}>
                KUSINAKONEK serves solely as a platform to connect donors and
                recipients and does not guarantee the quality, safety, or
                suitability of donated food.
              </Text>
            </View>

            {/* Agreement Checkbox */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setAgreed(!agreed)}
              activeOpacity={0.7}>
              {agreed ? (
                <CheckSquare
                  size={fp(20)}
                  color={theme.colors.primary}
                  strokeWidth={2.5}
                />
              ) : (
                <Square
                  size={fp(20)}
                  color={theme.colors.mutedText}
                  strokeWidth={2}
                />
              )}
              <Text style={[styles.checkboxText, { color: colors.text }]}>
                I have read and agree to the terms and conditions
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.declineButton,
                {
                  backgroundColor: colors.card,
                  borderColor: theme.colors.danger,
                },
              ]}
              onPress={onDecline}
              activeOpacity={0.8}>
              <Text style={styles.declineText}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.acceptButton,
                !agreed && styles.acceptButtonDisabled,
              ]}
              onPress={onAccept}
              activeOpacity={0.8}
              disabled={!agreed}>
              <Text
                style={[
                  styles.acceptText,
                  !agreed && styles.acceptTextDisabled,
                ]}>
                Accept
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: wp(20),
  },
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: wp(20),
    padding: wp(24),
    width: "100%",
    maxWidth: wp(360),
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: hp(12),
  },
  iconCircle: {
    width: wp(64),
    height: wp(64),
    borderRadius: wp(32),
    backgroundColor: "rgba(255, 152, 0, 0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: fp(19),
    fontWeight: "700",
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: hp(14),
  },
  scrollArea: {
    maxHeight: hp(400),
    marginBottom: hp(18),
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(10),
    paddingVertical: hp(12),
    paddingHorizontal: wp(4),
    marginTop: hp(16),
    marginBottom: hp(4),
  },
  checkboxText: {
    flex: 1,
    fontSize: fp(13),
    color: theme.colors.text,
    lineHeight: fp(18),
  },
  sectionTitle: {
    fontSize: fp(15),
    fontWeight: "700",
    color: theme.colors.primary,
    marginBottom: hp(6),
  },
  sectionIntro: {
    fontSize: fp(13),
    color: theme.colors.mutedText,
    lineHeight: fp(19),
    marginBottom: hp(10),
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: hp(8),
    paddingRight: wp(4),
  },
  bullet: {
    fontSize: fp(14),
    color: theme.colors.text,
    marginRight: wp(8),
    lineHeight: fp(19),
  },
  bulletText: {
    flex: 1,
    fontSize: fp(13),
    color: theme.colors.mutedText,
    lineHeight: fp(19),
  },
  buttonRow: {
    flexDirection: "row",
    gap: wp(12),
  },
  declineButton: {
    flex: 1,
    borderRadius: wp(12),
    paddingVertical: hp(14),
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: theme.colors.danger,
    backgroundColor: "#FFF",
  },
  declineText: {
    fontSize: fp(15),
    fontWeight: "600",
    color: theme.colors.danger,
  },
  acceptButton: {
    flex: 1,
    borderRadius: wp(12),
    paddingVertical: hp(14),
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptText: {
    fontSize: fp(15),
    fontWeight: "600",
    color: "#FFFFFF",
  },
  acceptButtonDisabled: {
    backgroundColor: theme.colors.mutedText,
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  acceptTextDisabled: {
    opacity: 0.7,
  },
});
