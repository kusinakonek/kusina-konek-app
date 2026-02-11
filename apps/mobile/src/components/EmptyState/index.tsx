import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Search, Package, Utensils } from "lucide-react-native";
import { wp, hp, fp } from "../../utils/responsive";

type EmptyStateProps = {
  onBrowseFood?: () => void;
  title?: string;
  message?: string;
  icon?: "search" | "package" | "utensils";
};

export default function EmptyState({
  onBrowseFood,
  title = "No Food Requests Yet",
  message = "You haven't requested any food yet. Start browsing available food donations in your area!",
  icon = "package",
}: EmptyStateProps) {
  const renderIcon = () => {
    const iconProps = { size: wp(64), color: "#BDBDBD" };
    switch (icon) {
      case "search":
        return <Search {...iconProps} />;
      case "utensils":
        return <Utensils {...iconProps} />;
      case "package":
      default:
        return <Package {...iconProps} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>{renderIcon()}</View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      {onBrowseFood && (
        <TouchableOpacity
          style={styles.browseButton}
          onPress={onBrowseFood}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Browse Available Food">
          <Search size={wp(20)} color="#FFFFFF" />
          <Text style={styles.browseButtonText}>Browse Available Food</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F5F5F5",
    borderRadius: wp(16),
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: wp(24),
    paddingVertical: hp(48),
    marginTop: hp(8),
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
  },
  iconContainer: {
    width: wp(96),
    height: wp(96),
    borderRadius: wp(48),
    backgroundColor: "#EEEEEE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: hp(16),
  },
  title: {
    fontSize: fp(18),
    fontWeight: "bold",
    color: "#424242",
    textAlign: "center",
    marginBottom: hp(8),
  },
  message: {
    fontSize: fp(14),
    color: "#757575",
    textAlign: "center",
    marginBottom: hp(24),
    lineHeight: fp(20),
    paddingHorizontal: wp(12),
  },
  browseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00C853",
    paddingHorizontal: wp(32),
    paddingVertical: hp(14),
    borderRadius: wp(12),
    gap: wp(8),
    width: "100%",
    maxWidth: wp(280),
    shadowColor: "#00C853",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  browseButtonText: {
    color: "#FFFFFF",
    fontSize: fp(16),
    fontWeight: "600",
  },
});
