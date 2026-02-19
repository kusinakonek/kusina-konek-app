import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ShoppingCart } from "lucide-react-native";
import { theme } from "../../constants/theme";
import { useTheme } from "../../../context/ThemeContext";

type EmptyCartProps = {
  onBrowseFood?: () => void;
};

export default function EmptyCart({ onBrowseFood }: EmptyCartProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.message, { color: colors.textSecondary }]}>You haven't requested your food yet...</Text>
      <Text style={[styles.subMessage, { color: colors.textSecondary }]}>Pick your food here:</Text>

      <Pressable
        style={styles.browseButton}
        onPress={onBrowseFood}
        accessibilityRole="button"
        accessibilityLabel="Browse Food">
        <ShoppingCart size={20} color="#FFFFFF" />
        <Text style={styles.browseButtonText}>Browse Food</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 60,
  },
  message: {
    fontSize: 15,
    color: theme.colors.mutedText,
    textAlign: "center",
    marginBottom: 4,
  },
  subMessage: {
    fontSize: 15,
    color: theme.colors.mutedText,
    textAlign: "center",
    marginBottom: theme.spacing.lg,
  },
  browseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: theme.radius.sm,
    gap: 10,
    width: "100%",
    maxWidth: 280,
  },
  browseButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
