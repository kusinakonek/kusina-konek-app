import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { theme } from "../../constants/theme";

type CartHeaderProps = {
  itemCount: number;
  onBack?: () => void;
};

export default function CartHeader({ itemCount, onBack }: CartHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel="Go back">
        <ArrowLeft size={24} color={theme.colors.text} />
      </Pressable>

      <View style={styles.titleContainer}>
        <Text style={styles.title}>My Cart</Text>
        <Text style={styles.subtitle}>
          {itemCount} item{itemCount !== 1 ? "(s)" : ""}
        </Text>
      </View>

      {/* Spacer to balance the back button */}
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.mutedText,
    marginTop: 1,
  },
  spacer: {
    width: 40,
  },
});
