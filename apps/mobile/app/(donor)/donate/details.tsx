import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Platform, KeyboardAvoidingView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useDonation } from '../../../context/DonationContext';
import Input from '../../../src/components/Input';
import { useTheme } from '../../../context/ThemeContext';
import LoadingScreen from '../../../src/components/LoadingScreen';
import { useAlert } from '../../../context/AlertContext';
import { compressImageFast } from '../../../src/utils/imageCompressor';
import CameraOptionModal from '../../../src/components/CameraOptionModal';
import TutorialOverlay, { TUTORIAL_STORAGE_KEYS } from '../../../src/components/TutorialOverlay';
import { DONATE_DETAILS_STEPS, useTutorial } from '../../../src/hooks/useTutorial';

export default function FoodDetailsScreen() {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const { formData, updateFormData, setCurrentStep } = useDonation();
    const { showAlert } = useAlert();
    const [loading, setLoading] = useState(false);
    const [showCameraModal, setShowCameraModal] = useState(false);

    const tutorial = useTutorial({
        steps: DONATE_DETAILS_STEPS,
        storageKey: TUTORIAL_STORAGE_KEYS.DONATE_DETAILS,
        enabled: !loading && !showCameraModal,
    });

    const takePhoto = () => {
        setShowCameraModal(true);
    };

    const handleCameraOption = (allowsEditing: boolean) => {
        launchCamera(allowsEditing);
    };

    const launchCamera = async (allowsEditing: boolean) => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            showAlert('Permission Required', 'Please allow access to your camera.', undefined, { type: 'warning' });
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing,
            aspect: allowsEditing ? [4, 3] : undefined,
            quality: 0.7, // Capture at decent quality, compression handles the rest
        });

        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            try {
                setLoading(true);
                // Compress and scale the image in a single fast pass limit
                const compressedDataUri = await compressImageFast(asset.uri);
                updateFormData({ imageUri: compressedDataUri });
            } catch (error: any) {
                console.error('Image compression failed:', error);
                showAlert('Error', error.message || 'Failed to process photo. Please try again.', undefined, { type: 'error' });
            } finally {
                setLoading(false);
            }
        }
    };

    const handleContinue = () => {
        if (!formData.foodName.trim()) {
            showAlert('Error', 'Please enter the food name', undefined, { type: 'warning' });
            return;
        }
        if (!formData.quantity.trim()) {
            showAlert('Error', 'Please enter the quantity', undefined, { type: 'warning' });
            return;
        }
        if (!formData.availableDurationValue.trim()) {
            showAlert('Error', 'Please enter how long the food is available', undefined, { type: 'warning' });
            return;
        }
        if (!formData.imageUri) {
            showAlert('Error', 'An actual photo of the food is required to proceed.', undefined, { type: 'warning' });
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

                    <KeyboardAvoidingView
                        style={{ flex: 1 }}
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
                    >
                        <ScrollView
                            style={[styles.container, { backgroundColor: colors.background }]}
                            contentContainerStyle={{ paddingBottom: 120 }}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
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
                                    label="Quantity (Number of Servings)"
                                    placeholder="e.g., 5, 10, 20"
                                    value={formData.quantity}
                                    keyboardType="phone-pad"
                                    onChangeText={(text) => {
                                        // Remove any non-numeric characters
                                        const numericText = text.replace(/[^0-9]/g, '');
                                        updateFormData({ quantity: numericText });
                                    }}
                                />

                                {/* Duration */}
                                <View style={{ marginBottom: 16 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <Text style={[styles.imageLabel, { color: colors.text, marginBottom: 0 }]}>Availability Duration</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', gap: 12 }}>
                                        <View style={{ flex: 1 }}>
                                            <Input
                                                label=""
                                                placeholder="e.g., 2, 30"
                                                value={formData.availableDurationValue}
                                                keyboardType="phone-pad"
                                                containerStyle={{ marginBottom: 0 }}
                                                onChangeText={(text) => {
                                                    const numericText = text.replace(/[^0-9]/g, '');
                                                    updateFormData({ availableDurationValue: numericText });
                                                }}
                                            />
                                        </View>
                                        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                                            <TouchableOpacity 
                                                style={[
                                                    styles.unitToggle, 
                                                    formData.availableDurationUnit === 'minutes' && styles.unitToggleActive
                                                ]}
                                                onPress={() => updateFormData({ availableDurationUnit: 'minutes' })}
                                            >
                                                <Text style={[styles.unitText, formData.availableDurationUnit === 'minutes' && styles.unitTextActive]}>Mins</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity 
                                                style={[
                                                    styles.unitToggle, 
                                                    formData.availableDurationUnit === 'hours' && styles.unitToggleActive
                                                ]}
                                                onPress={() => updateFormData({ availableDurationUnit: 'hours' })}
                                            >
                                                <Text style={[styles.unitText, formData.availableDurationUnit === 'hours' && styles.unitTextActive]}>Hrs</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>

                                {/* Image Upload */}
                                <View style={{ marginBottom: 20 }}>
                                    <Text style={[styles.imageLabel, { color: colors.text }]}>Take Photo of Actual Food *</Text>
                                    <TouchableOpacity
                                        style={[
                                            styles.imageUpload,
                                            { backgroundColor: colors.inputBg, borderColor: colors.border }
                                        ]}
                                        onPress={takePhoto}
                                    >
                                        {formData.imageUri ? (
                                            <Image source={{ uri: formData.imageUri }} style={styles.previewImage} />
                                        ) : (
                                            <View style={styles.uploadPlaceholder}>
                                                <Camera size={32} color={colors.textTertiary} />
                                                <Text style={[styles.uploadText, { color: colors.textSecondary }]}>
                                                    <Text style={styles.uploadLink}>Open Camera</Text> to capture food
                                                </Text>
                                                <Text style={[styles.uploadHint, { color: colors.textTertiary }]}>Take a clear photo of the food</Text>
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

                        {/* Buttons Footer */}
                        <View style={[styles.footer, { backgroundColor: colors.headerBg, borderTopColor: colors.border }]}>
                            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                                <Text style={styles.continueText}>Continue</Text>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>

                    {/* Camera Option Modal */}
                    <CameraOptionModal
                        visible={showCameraModal}
                        onClose={() => setShowCameraModal(false)}
                        onSelectCrop={handleCameraOption}
                    />
                </>
            )}

            <TutorialOverlay
                steps={tutorial.steps}
                storageKey={tutorial.storageKey}
                visible={tutorial.showTutorial}
                onComplete={tutorial.handleComplete}
                onSkip={tutorial.handleSkip}
            />
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
    cancelButtonOuter: {
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    cancelTextOuter: {
        color: '#e53935',
        fontSize: 15,
        fontWeight: '600',
    },
    unitToggle: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        backgroundColor: '#f5f5f5',
        height: 48,
        justifyContent: 'center',
    },
    unitToggleActive: {
        backgroundColor: '#E8F5E9',
        borderColor: '#00C853',
    },
    unitText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    unitTextActive: {
        color: '#00C853',
        fontWeight: 'bold',
    },
});
