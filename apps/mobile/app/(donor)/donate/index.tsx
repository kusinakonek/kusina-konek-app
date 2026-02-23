import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus } from 'lucide-react-native';
import { useDonation, PRESET_FOODS, FoodItem } from '../../../context/DonationContext';
import DisclaimerModal from '../../../src/components/DisclaimerModal';
import { useTheme } from '../../../context/ThemeContext';
import LoadingScreen from '../../../src/components/LoadingScreen';

export default function SelectFoodScreen() {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const { formData, updateFormData, setCurrentStep } = useDonation();
    const [showDisclaimer, setShowDisclaimer] = useState(true);

    const handleAcceptDisclaimer = () => {
        setShowDisclaimer(false);
    };

    const handleDeclineDisclaimer = () => {
        setShowDisclaimer(false);
        router.back();
    };

    const [loading, setLoading] = useState(false);

    const handleSelectFood = (food: FoodItem) => {
        setLoading(true);
        updateFormData({
            selectedFood: food,
            isCustomFood: false,
            foodName: food.name,
            description: food.description,
        });
        setCurrentStep(2);
        setTimeout(() => {
            router.push('/(donor)/donate/details');
            setLoading(false);
        }, 100);
    };

    const handleCustomFood = () => {
        setLoading(true);
        updateFormData({
            selectedFood: null,
            isCustomFood: true,
            foodName: '',
            description: '',
        });
        setCurrentStep(2);
        setTimeout(() => {
            router.push('/(donor)/donate/details');
            setLoading(false);
        }, 100);
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            {loading && <LoadingScreen message="Loading..." />}
            {!loading && (
                <>
                    {/* Disclaimer Modal */}
                    <DisclaimerModal
                        visible={showDisclaimer}
                        onAccept={handleAcceptDisclaimer}
                        onDecline={handleDeclineDisclaimer}
                    />

                    {/* Header */}
                    <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <ArrowLeft size={24} color={colors.text} />
                        </TouchableOpacity>
                        <View style={styles.headerTextContainer}>
                            <Text style={[styles.title, { color: colors.text }]}>Donate Food</Text>
                            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Step 1 of 3</Text>
                        </View>
                    </View>

                    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
                        {/* Instruction Card */}
                        <View style={[styles.card, { backgroundColor: colors.card }]}>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>Select Food Item</Text>
                            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>Choose from our menu or create a custom donation</Text>

                            {/* Food Grid */}
                            <View style={styles.foodGrid}>
                                {PRESET_FOODS.map((food) => (
                                    <TouchableOpacity
                                        key={food.id}
                                        style={[
                                            styles.foodItem,
                                            { backgroundColor: colors.card, borderColor: colors.border },
                                            formData.selectedFood?.id === food.id && {
                                                borderColor: '#00C853',
                                                backgroundColor: isDark ? '#003300' : '#F1FFF6',
                                            },
                                        ]}
                                        onPress={() => handleSelectFood(food)}
                                    >
                                        <Text style={[styles.foodName, { color: colors.text }]} numberOfLines={1}>{food.name}</Text>
                                        <Text style={[styles.foodDesc, { color: colors.textSecondary }]} numberOfLines={3}>{food.description}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Custom Item */}
                            <TouchableOpacity
                                style={[
                                    styles.customItem,
                                    { backgroundColor: colors.card, borderColor: colors.border },
                                    formData.isCustomFood && {
                                        borderColor: '#00C853',
                                        backgroundColor: isDark ? '#003300' : '#F1FFF6',
                                    }
                                ]}
                                onPress={handleCustomFood}
                            >
                                <View style={[styles.customIconContainer, { backgroundColor: isDark ? '#1a3a1a' : '#E8F5E9' }]}>
                                    <Plus size={32} color="#00C853" />
                                </View>
                                <Text style={[styles.customTitle, { color: colors.text }]}>Custom Item</Text>
                                <Text style={[styles.customDesc, { color: colors.textSecondary }]}>Add your own food</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        // backgroundColor: '#F5F5F5', // handled dynamically
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backButton: {
        padding: 8,
        marginRight: 12,
    },
    headerTextContainer: {
        flex: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    subtitle: {
        fontSize: 12,
        color: '#666',
    },
    container: {
        flex: 1,
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    foodGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    foodItem: {
        width: '47%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        borderWidth: 2,
        borderColor: '#f0f0f0',
    },
    foodItemSelected: {
        borderColor: '#00C853',
        backgroundColor: '#F1FFF6',
    },
    foodName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 6,
    },
    foodDesc: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
    },
    customItem: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 2,
        borderColor: '#f0f0f0',
        borderStyle: 'dashed',
        alignItems: 'center',
        marginTop: 12,
    },
    customItemSelected: {
        borderColor: '#00C853',
        backgroundColor: '#F1FFF6',
    },
    customIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    customTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    customDesc: {
        fontSize: 12,
        color: '#666',
    },
});
