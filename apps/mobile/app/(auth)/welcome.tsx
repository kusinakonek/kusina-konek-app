import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function Welcome() {
    const router = useRouter();
    const { setRole } = useAuth();
    const { colors, isDark } = useTheme();

    const handleRoleSelect = (role: 'DONOR' | 'RECIPIENT') => {
        setRole(role);
        router.push('/(auth)/login');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
            <View style={styles.header}>
                <Image
                    source={require('../../assets/KusinaKonek-Logo.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                />
                <Text style={[styles.title, { color: colors.text }]}>Welcome to KusinaKonek!</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>How would you like to use the app?</Text>
            </View>

            <View style={styles.content}>
                <TouchableOpacity
                    style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => handleRoleSelect('DONOR')}
                    activeOpacity={0.9}
                >
                    <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(46, 125, 50, 0.2)' : '#e8f5e9' }]}>
                        <Heart size={32} color="#2e7d32" />
                    </View>
                    <View style={styles.cardContent}>
                        <View style={styles.cardHeader}>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>I'm a Donor</Text>
                            <ArrowRight size={20} color={colors.textSecondary} />
                        </View>
                        <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                            Share food with families in need across Naga City
                        </Text>
                        <View style={styles.features}>
                            <FeatureItem text="Donate surplus food to help others" color={colors.textTertiary} />
                            <FeatureItem text="Make a difference in your community" color={colors.textTertiary} />
                            <FeatureItem text="Receive feedback from recipients" color={colors.textTertiary} />
                        </View>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => handleRoleSelect('RECIPIENT')}
                    activeOpacity={0.9}
                >
                    <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(21, 101, 192, 0.2)' : '#e3f2fd' }]}>
                        <ShoppingBag size={32} color={isDark ? '#42a5f5' : "#1565c0"} />
                    </View>
                    <View style={styles.cardContent}>
                        <View style={styles.cardHeader}>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>I'm a Recipient</Text>
                            <ArrowRight size={20} color={colors.textSecondary} />
                        </View>
                        <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                            Find and claim food donations from generous donors
                        </Text>
                        <View style={styles.features}>
                            <FeatureItem text="Browse available food donations" color={colors.textTertiary} />
                            <FeatureItem text="Claim food from nearby drop-off points" color={colors.textTertiary} />
                            <FeatureItem text="Share feedback with donors" color={colors.textTertiary} />
                        </View>
                    </View>
                </TouchableOpacity>
            </View>

            <Text style={[styles.footer, { color: colors.textTertiary }]}>
                You can update your account type later in settings
            </Text>
        </SafeAreaView>
    );
}

const FeatureItem = ({ text, color = '#777' }: { text: string, color?: string }) => (
    <View style={styles.featureItem}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={[styles.featureText, { color }]}>{text}</Text>
    </View>
);



const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff', // White background or very light grey
        padding: 20,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 40,
    },
    logoImage: {
        width: 100,
        height: 100,
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    content: {
        gap: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 16,
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContent: {
        flex: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
    },
    cardDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
        lineHeight: 20,
    },
    features: {
        gap: 8,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#999',
    },
    featureText: {
        fontSize: 12,
        color: '#777',
        flex: 1,
    },
    footer: {
        textAlign: 'center',
        color: '#999',
        fontSize: 12,
        marginTop: 30,
    },
});
