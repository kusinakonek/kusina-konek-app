import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { MapPin, Star } from "lucide-react-native";

// Match the DistributionStatus enum from the database
export type DistributionStatus =
  | "pending"
  | "claimed"
  | "on_the_way"
  | "delivered"
  | "completed";

// Define a common interface for items (donations or claims)
export interface RecentItem {
  id: string;
  title: string;
  quantity: string;
  location: string;
  time: string;
  status?: DistributionStatus;
  rating?: number;
  recipientName?: string; // For donors seeing who claimed
  showFeedback?: boolean; // Show feedback button for recipients
}

// Helper function to format status for display
const getStatusDisplay = (status: DistributionStatus): string => {
  const statusMap: Record<DistributionStatus, string> = {
    pending: "Pending",
    claimed: "Claimed",
    on_the_way: "On The Way",
    delivered: "Delivered",
    completed: "Completed",
  };
  return statusMap[status] || status;
};

// Get status colors
const getStatusColors = (
  status: DistributionStatus,
): { bg: string; text: string } => {
  const colorMap: Record<DistributionStatus, { bg: string; text: string }> = {
    pending: { bg: "#FFF3E0", text: "#E65100" }, // Orange
    claimed: { bg: "#E3F2FD", text: "#1565C0" }, // Blue
    on_the_way: { bg: "#F3E5F5", text: "#6A1B9A" }, // Purple
    delivered: { bg: "#E8F5E9", text: "#2E7D32" }, // Green
    completed: { bg: "#E0F2F1", text: "#00695C" }, // Teal
  };
  return colorMap[status] || { bg: "#F5F5F5", text: "#666" };
};

interface RecentItemsListProps {
  items: RecentItem[];
  role: "DONOR" | "RECIPIENT";
  onSeeAll?: () => void;
}

export const RecentItemsList = ({
  items,
  role,
  onSeeAll,
}: RecentItemsListProps) => {
  const renderItem = ({ item }: { item: RecentItem }) => {
    const statusColors = item.status ? getStatusColors(item.status) : null;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemQuantity}>{item.quantity}</Text>
          </View>
          {item.status && statusColors && (
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColors.bg },
              ]}>
              <Text style={[styles.statusText, { color: statusColors.text }]}>
                {getStatusDisplay(item.status)}
              </Text>
            </View>
          )}
        </View>

        {role === "DONOR" && item.recipientName && (
          <Text style={styles.claimedBy}>
            Claimed:{" "}
            <Text style={styles.recipientName}>{item.recipientName}</Text>
          </Text>
        )}

        <View style={styles.locationContainer}>
          <MapPin size={14} color="#666" style={styles.pinIcon} />
          <Text style={styles.locationText}>{item.location}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.timeText}>{item.time}</Text>
          {item.rating && (
            <View style={styles.ratingContainer}>
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  color={i < Math.floor(item.rating!) ? "#FFC107" : "#E0E0E0"}
                  fill={
                    i < Math.floor(item.rating!) ? "#FFC107" : "transparent"
                  }
                />
              ))}
              <Text style={styles.greatText}>Great!</Text>
            </View>
          )}
        </View>

        {role === "RECIPIENT" && item.showFeedback && (
          <TouchableOpacity style={styles.feedbackButton}>
            <Text style={styles.feedbackButtonText}>Give Feedback</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>
          {role === "DONOR" ? "My Recent Donations" : "My Recent Food"}
        </Text>
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={false} // Since it's inside a ScrollView in the main screen
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  seeAllText: {
    color: "#00C853",
    fontSize: 14,
    fontWeight: "600",
  },
  listContent: {
    gap: 12,
  },
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
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
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
});
