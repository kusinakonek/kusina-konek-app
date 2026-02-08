import React from 'react';
import { View, Text } from 'react-native';
import { Package, MapPin, Utensils } from 'lucide-react-native';
import { styles } from './HomeCSS/styles';

interface StatsCardProps {
    stats: {
        availableFoods: number;
        locations: number;
        totalServings: number;
    } | undefined;
}

export const StatsCard: React.FC<StatsCardProps> = ({ stats }) => {
    return (
        <View style={styles.recipientStatsCard}>
            <View style={styles.recipientStatsIconContainer}>
                <Package size={56} color="#2962FF" />
            </View>
            <View style={styles.recipientStatsContent}>
                <Text style={styles.recipientStatsValue}>{stats?.availableFoods ?? 0}</Text>
                <Text style={styles.recipientStatsLabel}>Available Foods</Text>
                <View style={styles.recipientStatsMeta}>
                    <MapPin size={14} color="#00C853" />
                    <Text style={styles.recipientStatsMetaText}>{stats?.locations ?? 0} locations</Text>
                    <Text style={styles.recipientStatsMetaDot}>•</Text>
                    <Utensils size={14} color="#2962FF" />
                    <Text style={styles.recipientStatsMetaText}>{stats?.totalServings ?? 0}+ servings</Text>
                </View>
            </View>
        </View>
    );
};
