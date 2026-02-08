import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

interface StatCardProps {
    icon: LucideIcon;
    value: string | number;
    label: string;
    color: string;
    bgColor: string;
}

export const StatCard = ({ icon: Icon, value, label, color, bgColor }: StatCardProps) => (
    <View style={styles.card}>
        <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
            <Icon size={24} color={color} />
        </View>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
    </View>
);

interface DashboardStatsProps {
    stats: {
        icon: LucideIcon;
        value: string | number;
        label: string;
        color: string;
        bgColor: string;
    }[];
}

export const DashboardStats = ({ stats }: DashboardStatsProps) => {
    return (
        <View style={styles.container}>
            {stats.map((stat, index) => (
                <StatCard
                    key={index}
                    icon={stat.icon}
                    value={stat.value}
                    label={stat.label}
                    color={stat.color}
                    bgColor={stat.bgColor}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
        gap: 12,
    },
    card: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16, // Squircle shape in design
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    value: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    label: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
});
