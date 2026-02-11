import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Package, Utensils } from "lucide-react-native";
import { wp, hp, fp } from "../../utils/responsive";

type EmptyRecentFoodProps = {
  title?: string;
  message?: string;
  icon?: "package" | "utensils";
};

export default function EmptyRecentFood({
  title = "No Food Requests Yet",
  message = "You haven't requested any food yet. Start browsing available food donations in your area!",
  icon = "package",
}: EmptyRecentFoodProps) {
  const renderIcon = () => {
    const iconProps = { size: wp(64), color: "#BDBDBD" };
    switch (icon) {
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
    marginBottom: hp(16),
    lineHeight: fp(20),
    paddingHorizontal: wp(12),
  },
});
