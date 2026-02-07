import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function Welcome() {
    const router = useRouter();
    const { setRole } = useAuth();

    const handleRoleSelect = (role: 'DONOR' | 'RECIPIENT') => {
        setRole(role);
        router.push('/(auth)/login');
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Image
                    source={require('../../assets/KusinaKonek-Logo.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                />
                <Text style={styles.title}>Welcome to KusinaKonek!</Text>
                <Text style={styles.subtitle}>How would you like to use the app?</Text>
            </View>

            <View style={styles.content}>
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => handleRoleSelect('DONOR')}
                    activeOpacity={0.9}
                >
                    <View style={[styles.iconCircle, { backgroundColor: '#e8f5e9' }]}>
                        <Heart size={32} color="#2e7d32" />
                    </View>
                    <View style={styles.cardContent}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>I'm a Donor</Text>
                            <ArrowRight size={20} color="#666" />
                        </View>
                        <Text style={styles.cardDescription}>
                            Share food with families in need across Naga City
                        </Text>
                        <View style={styles.features}>
                            <FeatureItem text="Donate surplus food to help others" />
                            <FeatureItem text="Make a difference in your community" />
                            <FeatureItem text="Receive feedback from recipients" />
                        </View>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.card}
                    onPress={() => handleRoleSelect('RECIPIENT')}
                    activeOpacity={0.9}
                >
                    <View style={[styles.iconCircle, { backgroundColor: '#e3f2fd' }]}>
                        <ShoppingBag size={32} color="#1565c0" />
                    </View>
                    <View style={styles.cardContent}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>I'm a Recipient</Text>
                            <ArrowRight size={20} color="#666" />
                        </View>
                        <Text style={styles.cardDescription}>
                            Find and claim food donations from generous donors
                        </Text>
                        <View style={styles.features}>
                            <FeatureItem text="Browse available food donations" />
                            <FeatureItem text="Claim food from nearby drop-off points" />
                            <FeatureItem text="Share feedback with donors" />
                        </View>
                    </View>
                </TouchableOpacity>
            </View>

            <Text style={styles.footer}>
                You can update your account type later in settings
            </Text>
        </View>
    );
}

const FeatureItem = ({ text }: { text: string }) => (
    <View style={styles.featureItem}>
        <View style={styles.dot} />
        <Text style={styles.featureText}>{text}</Text>
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
