import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useDonation } from '../../../context/DonationContext';
import Input from '../../../src/components/Input';
import { useTheme } from '../../../context/ThemeContext';
import LoadingScreen from '../../../src/components/LoadingScreen';

export default function FoodDetailsScreen() {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const { formData, updateFormData, setCurrentStep } = useDonation();
    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Please allow access to your photo library.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            updateFormData({ imageUri: result.assets[0].uri });
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Please allow access to your camera.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            updateFormData({ imageUri: result.assets[0].uri });
        }
    };

    const showImageOptions = () => {
        Alert.alert(
            'Upload Image',
            'Choose an option',
            [
                { text: 'Take Photo', onPress: takePhoto },
                { text: 'Choose from Library', onPress: pickImage },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    const handleContinue = () => {
        if (!formData.foodName.trim()) {
            Alert.alert('Error', 'Please enter the food name');
            return;
        }
        if (!formData.quantity.trim()) {
            Alert.alert('Error', 'Please enter the quantity');
            return;
        }
        setLoading(true);
        setCurrentStep(3);
        setTimeout(() => {
            router.push('/(donor)/donate/location');
            setLoading(false);
        }, 100);
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            {loading && <LoadingScreen message="Loading..." />}
            {!loading && (
                <>
                    {/* Header */}
                    <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <ArrowLeft size={24} color={colors.text} />
                        </TouchableOpacity>
                        <View style={styles.headerTextContainer}>
                            <Text style={[styles.title, { color: colors.text }]}>Donate Food</Text>
                            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Step 2 of 3</Text>
                        </View>
                    </View>

                    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
                        <View style={[styles.card, { backgroundColor: colors.card }]}>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>Food Details</Text>
                            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>Tell us about the food you're donating</Text>


                            {/* Food Name */}
                            <Input
                                label="Food Name"
                                placeholder="e.g., Chicken Adobo, Pancit Canton"
                                value={formData.foodName}
                                onChangeText={(text) => updateFormData({ foodName: text })}
                            />

                            {/* Description */}
                            <Input
                                label="Description"
                                placeholder="Brief description of the food (optional)"
                                value={formData.description}
                                onChangeText={(text) => updateFormData({ description: text })}
                                multiline
                                numberOfLines={3}
                            />

                            {/* Quantity */}
                            <Input
                                label="Quantity / Serving(s)"
                                placeholder="e.g., 5 servings, 1 bilao, 20 pieces"
                                value={formData.quantity}
                                onChangeText={(text) => updateFormData({ quantity: text })}
                            />

                            {/* Image Upload */}
                            <View style={{ marginBottom: 20 }}>
                                <Text style={[styles.imageLabel, { color: colors.text }]}>Upload Food Image (Optional)</Text>
                                <TouchableOpacity
                                    style={[
                                        styles.imageUpload,
                                        { backgroundColor: colors.inputBg, borderColor: colors.border }
                                    ]}
                                    onPress={showImageOptions}
                                >
                                    {formData.imageUri ? (
                                        <Image source={{ uri: formData.imageUri }} style={styles.previewImage} />
                                    ) : (
                                        <View style={styles.uploadPlaceholder}>
                                            <Camera size={32} color={colors.textTertiary} />
                                            <Text style={[styles.uploadText, { color: colors.textSecondary }]}>
                                                <Text style={styles.uploadLink}>Click to upload</Text> or take a photo
                                            </Text>
                                            <Text style={[styles.uploadHint, { color: colors.textTertiary }]}>PNG, JPG (MAX. 5MB)</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                                {formData.imageUri && (
                                    <TouchableOpacity
                                        style={styles.removeImage}
                                        onPress={() => updateFormData({ imageUri: null })}
                                    >
                                        <Text style={styles.removeImageText}>Remove Image</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </ScrollView>

                    {/* Continue Button */}
                    <View style={[styles.footer, { backgroundColor: colors.headerBg, borderTopColor: colors.border }]}>
                        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                            <Text style={styles.continueText}>Continue</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        // backgroundColor: '#F5F5F5',
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
    imageLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
    },
    imageUpload: {
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        borderStyle: 'dashed',
        overflow: 'hidden',
    },
    uploadPlaceholder: {
        padding: 40,
        alignItems: 'center',
    },
    uploadText: {
        fontSize: 14,
        color: '#666',
        marginTop: 12,
    },
    uploadLink: {
        color: '#00C853',
        fontWeight: '600',
    },
    uploadHint: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    previewImage: {
        width: '100%',
        height: 200,
    },
    removeImage: {
        alignSelf: 'center',
        marginTop: 8,
    },
    removeImageText: {
        color: '#e53935',
        fontSize: 14,
    },
    footer: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    continueButton: {
        backgroundColor: '#00C853',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    continueText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
