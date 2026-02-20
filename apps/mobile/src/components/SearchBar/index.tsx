import React from "react";
import { StyleSheet, TextInput, View, Pressable } from "react-native";
import { Search, SlidersHorizontal } from "lucide-react-native";
import { theme } from "../../constants/theme";
import { useTheme } from "../../../context/ThemeContext";

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
};

export default function SearchBar({
  value,
  onChangeText,
  placeholder = "Search for food...",
  onFilterPress,
}: SearchBarProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.searchSection, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
        <Search size={18} color={colors.textTertiary} style={styles.icon} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {onFilterPress && (
        <Pressable
          style={[styles.filterButton, { borderColor: colors.border, backgroundColor: colors.inputBg }]}
          onPress={onFilterPress}
          accessibilityRole="button"
          accessibilityLabel="Filter">
          <SlidersHorizontal size={20} color={colors.textSecondary} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  searchSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.sm,
    height: 44,
  },
  icon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text,
    padding: 0,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
});
