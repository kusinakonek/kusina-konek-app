import React, { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { MapPin, Clock, Trash2, Timer } from "lucide-react-native";
import { theme } from "../../constants/theme";
import { useTheme } from "../../../context/ThemeContext";

const RESERVATION_MS = 15 * 60 * 1000;

function useCountdown(addedAt?: number) {
  const [remaining, setRemaining] = useState(() => {
    if (!addedAt) return 0;
    return Math.max(0, RESERVATION_MS - (Date.now() - addedAt));
  });

  useEffect(() => {
    if (!addedAt) return;
    const tick = () => {
      const left = Math.max(0, RESERVATION_MS - (Date.now() - addedAt));
      setRemaining(left);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [addedAt]);

  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  const label = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  const isExpiring = remaining > 0 && remaining < 3 * 60 * 1000; // < 3 min
  const isExpired = remaining <= 0 && addedAt != null;

  return { remaining, label, isExpiring, isExpired };
}

export type CartItemCardProps = {
  imageUri?: string | null;
  foodName: string;
  donorName: string;
  quantity: number;
  unit?: string;
  barangay: string;
  addedAt?: number;
  onRemove?: () => void;
};

export default function CartItemCard({
  imageUri,
  foodName,
  donorName,
  quantity,
  unit = "serving",
  barangay,
  addedAt,
  onRemove,
}: CartItemCardProps) {
  const { label: timerLabel, isExpiring, isExpired } = useCountdown(addedAt);
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.row}>
        {/* Food Image */}
        <View style={styles.imageContainer}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder, { backgroundColor: colors.border }]}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.info}>
          {/* Title row with delete */}
          <View style={styles.titleRow}>
            <View style={styles.titleGroup}>
              <Text style={[styles.foodName, { color: colors.text }]} numberOfLines={1}>
                {foodName}
              </Text>
              <Text style={[styles.donorName, { color: colors.textSecondary }]} numberOfLines={1}>
                by {donorName}
              </Text>
            </View>

            <Pressable
              onPress={onRemove}
              style={[styles.removeButton, { backgroundColor: isDark ? '#3d0000' : '#FFF5F5', borderColor: isDark ? '#5c0000' : '#FFCDD2' }]}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${foodName}`}>
              <Trash2 size={18} color={theme.colors.danger} />
            </Pressable>
          </View>

          {/* Quantity */}
          <View style={styles.quantityContainer}>
            <View style={styles.quantityLabelRow}>
              <Clock size={14} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>Quantity / Serving(s):</Text>
            </View>
            <View style={[styles.quantityBadge, { backgroundColor: isDark ? '#1b3a1b' : '#E8F5E9', borderColor: isDark ? '#2e5d2e' : '#C8E6C9' }]}>
              <Text style={styles.quantityText}>
                {quantity} {unit}
              </Text>
            </View>
          </View>

          {/* Location */}
          <View style={styles.metaRow}>
            <MapPin size={14} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
              {barangay}
            </Text>
          </View>

          {/* Timer */}
          {addedAt != null && (
            <View
              style={[
                styles.timerRow,
                isExpiring && styles.timerRowExpiring,
                isExpired && styles.timerRowExpired,
              ]}>
              <Timer
                size={13}
                color={
                  isExpired
                    ? theme.colors.danger
                    : isExpiring
                      ? "#E65100"
                      : theme.colors.primary
                }
              />
              <Text
                style={[
                  styles.timerText,
                  isExpiring && styles.timerTextExpiring,
                  isExpired && styles.timerTextExpired,
                ]}>
                {isExpired ? "Expired" : `Reserved: ${timerLabel}`}
              </Text>
            </View>
          )}
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
    borderColor: "#C8E6C9",
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  row: {
    flexDirection: "row",
  },
  imageContainer: {
    marginRight: theme.spacing.md,
  },
  image: {
    width: 80,
    height: 80,
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
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  titleGroup: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  foodName: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
  },
  donorName: {
    fontSize: 13,
    color: theme.colors.mutedText,
    marginTop: 1,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FFCDD2",
    backgroundColor: "#FFF5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    color: theme.colors.mutedText,
  },
  quantityContainer: {
    marginBottom: 6,
  },
  quantityLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  quantityBadge: {
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#C8E6C9",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginLeft: 18,
  },
  quantityText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  timerRowExpiring: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  timerRowExpired: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  timerText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  timerTextExpiring: {
    fontSize: 12,
    fontWeight: "600",
    color: "#F57C00",
  },
  timerTextExpired: {
    fontSize: 12,
    fontWeight: "600",
    color: "#D32F2F",
  },
});
