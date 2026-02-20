import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { MapPin, Clock, Users, Navigation } from "lucide-react-native";
import { theme } from "../../constants/theme";
import { useTheme } from "../../../context/ThemeContext";

const DEFAULT_FOOD_IMAGE = require("../../../assets/KusinaKonek-Logo.png");

export type BrowseFoodCardProps = {
  imageUri?: string | null;
  foodName: string;
  description?: string | null;
  servings: number;
  barangay: string;
  timeAgo: string;
  distanceKm?: number | null;
  onRequest?: () => void;
};

export default function BrowseFoodCard({
  imageUri,
  foodName,
  description,
  servings,
  barangay,
  timeAgo,
  distanceKm,
  onRequest,
}: BrowseFoodCardProps) {
  const { colors } = useTheme();

  const distanceLabel =
    distanceKm != null
      ? distanceKm < 1
        ? `${Math.round(distanceKm * 1000)}m away`
        : `${distanceKm} km away`
      : null;
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.row}>
        {/* Food Image */}
        <View style={styles.imageContainer}>
          <Image
            source={imageUri ? { uri: imageUri } : DEFAULT_FOOD_IMAGE}
            style={styles.image}
            resizeMode="cover"
          />
        </View>

        {/* Food Info */}
        <View style={styles.info}>
          <Text style={[styles.foodName, { color: colors.text }]} numberOfLines={1}>
            {foodName}
          </Text>

          {description ? (
            <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
              {description}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            <Users size={14} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>{servings} servings</Text>
          </View>

          <View style={styles.metaRow}>
            <MapPin size={14} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
              {barangay}
            </Text>
          </View>

          {distanceLabel ? (
            <View style={styles.metaRow}>
              <Navigation size={14} color={colors.primary} />
              <Text style={[styles.metaText, styles.distanceText]}>
                {distanceLabel}
              </Text>
            </View>
          ) : null}

          {/* Bottom row: time + request button */}
          <View style={styles.bottomRow}>
            <View style={styles.timeRow}>
              <Clock size={12} color={colors.textTertiary} />
              <Text style={[styles.timeText, { color: colors.textTertiary }]}>{timeAgo}</Text>
            </View>

            <Pressable
              style={styles.requestButton}
              onPress={onRequest}
              accessibilityRole="button"
              accessibilityLabel={`Request ${foodName}`}>
              <Text style={styles.requestText}>Request</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
  },
  imageContainer: {
    marginRight: theme.spacing.md,
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: theme.radius.sm,
  },
  imagePlaceholder: {
    backgroundColor: theme.colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 11,
    color: theme.colors.mutedText,
  },
  info: {
    flex: 1,
    justifyContent: "space-between",
  },
  foodName: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    color: theme.colors.mutedText,
    marginBottom: 4,
    lineHeight: 17,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  metaText: {
    fontSize: 12,
    color: theme.colors.mutedText,
    flexShrink: 1,
  },
  distanceText: {
    color: theme.colors.primary,
    fontWeight: "600",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: theme.colors.mutedText,
  },
  requestButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  requestText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
});
