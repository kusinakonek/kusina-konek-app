import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../constants/theme";

type CartBottomBarProps = {
  disabled?: boolean;
  onPickUp?: () => void;
  message?: string;
};

export default function CartBottomBar({
  disabled = true,
  onPickUp,
  message = "Please select a pickup point for each item",
}: CartBottomBarProps) {
  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.pickUpButton, disabled && styles.pickUpButtonDisabled]}
        onPress={disabled ? undefined : onPickUp}
        accessibilityRole="button"
        accessibilityLabel="Pick up Ulam(s)"
        disabled={disabled}>
        <Text
          style={[styles.pickUpText, disabled && styles.pickUpTextDisabled]}>
          Pick up Ulam(s)
        </Text>
      </Pressable>

      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: 4,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  pickUpButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  pickUpButtonDisabled: {
    backgroundColor: "#C8E6C9",
  },
  pickUpText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  pickUpTextDisabled: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  message: {
    fontSize: 12,
    color: theme.colors.mutedText,
    textAlign: "center",
    marginTop: 6,
  },
});
