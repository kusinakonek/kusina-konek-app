import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../constants/theme';

type FoodCardProps = {
  title: string;
  distance: string;
  type: string;
  expiry: string;
  onPress?: () => void;
};

export default function FoodCard({ title, distance, type, expiry, onPress }: FoodCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.distance}>{distance}</Text>
      </View>

      <Text style={styles.meta}>{type} • expires in {expiry}</Text>

      <Pressable accessibilityRole="button" onPress={onPress} style={styles.claimButton}>
        <Text style={styles.claimText}>Claim</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  title: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
    marginRight: theme.spacing.sm,
  },
  distance: {
    color: theme.colors.mutedText,
    fontSize: 12,
  },
  meta: {
    color: theme.colors.mutedText,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  claimButton: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.sm,
  },
  claimText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
