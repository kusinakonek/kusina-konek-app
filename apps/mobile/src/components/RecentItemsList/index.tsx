import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import RecentFoodCard from "../RecentFoodCard";

// Define a common interface for items (donations or claims)
export interface RecentItem {
  id: string;
  title: string;
  quantity: string;
  location: string;
  time: string;
  status?: "pending" | "available" | "donated" | "claimed" | "on-the-way" | "completed";
  rating?: number;
  recipientName?: string; // For donors seeing who claimed
  showFeedback?: boolean; // Show feedback button for recipients
  role?: "DONOR" | "RECIPIENT";
  latitude?: number | null;
  longitude?: number | null;
  image?: string | null;
}

interface RecentItemsListProps {
  items: RecentItem[];
  role: "DONOR" | "RECIPIENT";
  onSeeAll?: () => void;
  onConfirm?: (id: string) => void;
  onMarkOnTheWay?: (id: string) => void;
  onFeedback?: (id: string) => void;
  onCancel?: (id: string) => void;
}

export const RecentItemsList = ({
  items,
  role,
  onSeeAll,
  onConfirm,
  onMarkOnTheWay,
  onFeedback,
  onCancel,
}: RecentItemsListProps) => {
  const { colors, isDark } = useTheme();

  const renderItem = ({ item }: { item: RecentItem }) => (
    <RecentFoodCard
      item={item}
      role={role}
      onConfirm={onConfirm}
      onMarkOnTheWay={onMarkOnTheWay}
      onFeedback={onFeedback}
      onCancel={onCancel}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
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
        scrollEnabled={false}
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
    gap: 16,
  },
});
