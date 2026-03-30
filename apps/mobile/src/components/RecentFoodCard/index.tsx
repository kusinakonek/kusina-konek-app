import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { MapPin, Star, Utensils } from "lucide-react-native";
import { useTheme } from "../../../context/ThemeContext";
import { RecentItem } from "../RecentItemsList";

interface RecentFoodCardProps {
  item: RecentItem;
  role: "DONOR" | "RECIPIENT";
  onConfirm?: (id: string) => void;
  onMarkOnTheWay?: (id: string) => void;
  onFeedback?: (id: string) => void;
  onCancel?: (id: string) => void;
  onTrack?: (id: string) => void;
  onPressCard?: (id: string) => void;
}

export default function RecentFoodCard({
  item,
  role,
  onConfirm,
  onMarkOnTheWay,
  onFeedback,
  onCancel,
  onTrack,
  onPressCard,
}: RecentFoodCardProps) {
  const { colors } = useTheme();

  const handlePress = () => {
    if (onPressCard) {
      onPressCard(item.id);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      activeOpacity={0.7}
      disabled={!onPressCard}
      onPress={handlePress}>

      <View style={styles.cardHeader}>
        {/* Render Image Thumbnail if available */}
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.foodImage} />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: colors.border }]}>
            <Utensils size={24} color={colors.textSecondary} />
          </View>
        )}

        <View style={styles.headerTextInfo}>
          <Text style={[styles.itemTitle, { color: colors.text }]}>
            {item.title}
          </Text>
          <Text style={[styles.itemQuantity, { color: colors.textSecondary }]}>
            {item.quantity}
          </Text>
        </View>
        {item.status && (
          <View
            style={[
              styles.statusBadge,
              item.status === "pending" && styles.status_pending,
              item.status === "donated" && styles.status_donated,
              item.status === "claimed" && styles.status_claimed,
              item.status === "on-the-way" && styles["status_on-the-way"],
              item.status === "completed" && styles.status_completed,
            ]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        )}
      </View>

      {role === "DONOR" && item.recipientName && (
        <Text style={[styles.claimedBy, { color: colors.textSecondary }]}>
          Claimed:{" "}
          <Text style={styles.recipientName}>{item.recipientName}</Text>
        </Text>
      )}

      <View style={styles.locationContainer}>
        <MapPin size={14} color={colors.textSecondary} style={styles.pinIcon} />
        <Text style={[styles.locationText, { color: colors.textSecondary }]}>
          {item.location}
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.timeText, { color: colors.textTertiary }]}>
          {item.time}
        </Text>
        {item.rating && (
          <View style={styles.ratingContainer}>
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={16}
                color={i < Math.floor(item.rating!) ? "#FFC107" : "#E0E0E0"}
                fill={i < Math.floor(item.rating!) ? "#FFC107" : "transparent"}
              />
            ))}
            <Text style={[styles.greatText, { color: colors.text }]}>
              Great!
            </Text>
          </View>
        )}
      </View>

      {role === "RECIPIENT" && item.showFeedback && (
        <TouchableOpacity
          style={styles.feedbackButton}
          onPress={() => onFeedback && onFeedback(item.id)}>
          <Text style={styles.feedbackButtonText}>Give Feedback</Text>
        </TouchableOpacity>
      )}

      {role === "RECIPIENT" && item.status === "claimed" && onMarkOnTheWay && (
        <TouchableOpacity
          style={styles.onTheWayButton}
          onPress={() => onMarkOnTheWay(item.id)}>
          <Text style={styles.onTheWayButtonText}>🚶 I'm On My Way</Text>
        </TouchableOpacity>
      )}

      {role === "RECIPIENT" && item.status === "on-the-way" && onConfirm && (
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => onConfirm(item.id)}>
          <Text style={styles.confirmButtonText}>✅ Confirm Received</Text>
        </TouchableOpacity>
      )}

      {role === "DONOR" && (item.status === "pending" || item.status === "available" || item.status === "donated" || !item.status) && onCancel && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => onCancel(item.foodID || item.id)}>
          <Text style={styles.cancelButtonText}>Cancel Donation</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  foodImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTextInfo: {
    flex: 1,
    paddingRight: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: "#666",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  status_donated: {
    backgroundColor: "#E8F5E9",
  },
  status_claimed: {
    backgroundColor: "#FFF3E0",
  },
  "status_on-the-way": {
    backgroundColor: "#E3F2FD",
  },
  status_completed: {
    backgroundColor: "#E8F5E9",
  },
  status_pending: {
    backgroundColor: "#F5F5F5",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#333",
  },
  claimedBy: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
  },
  recipientName: {
    fontWeight: "bold",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  pinIcon: {
    marginRight: 4,
  },
  locationText: {
    fontSize: 14,
    color: "#666",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  timeText: {
    fontSize: 12,
    color: "#999",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  greatText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  feedbackButton: {
    marginTop: 12,
    backgroundColor: "#00C853",
    height: 44,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  feedbackButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  onTheWayButton: {
    marginTop: 12,
    backgroundColor: "#FF9800",
    height: 44,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  onTheWayButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmButton: {
    marginTop: 12,
    backgroundColor: "#2196F3",
    height: 44,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    marginTop: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e53935",
    height: 44,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#e53935",
    fontSize: 16,
    fontWeight: "600",
  },
});
