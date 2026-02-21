import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    Image,
    ActivityIndicator,
    Alert,
} from "react-native";
import { Star, Camera, X } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { wp, hp, fp } from "../../utils/responsive";
import { theme } from "../../constants/theme";
import { useTheme } from "../../../context/ThemeContext";

interface FeedbackModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (rating: number, comment: string, photo: string) => Promise<void>;
    isSubmitting?: boolean;
}

export default function FeedbackModal({
    visible,
    onClose,
    onSubmit,
    isSubmitting = false,
}: FeedbackModalProps) {
    const { colors, isDark } = useTheme();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [photo, setPhoto] = useState<string | null>(null);

    const handleRating = (score: number) => {
        setRating(score);
    };

    const pickImage = async () => {
        // Request permissions first
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert(
                "Permission required",
                "Please grant camera roll permissions to upload a photo."
            );
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
            base64: true, // We need base64 to send to backend or display
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            // In a real app, you might upload this to a storage bucket and get a URL.
            // For this implementation, we'll assume the backend handles the base64 or we send it as is.
            // However, the schema expects a "photoUrl". 
            // If we send base64 data URI, it might be too large for a simple string field if not text/longtext.
            // But for now, let's use the uri or base64.
            // The instruction said "required photo of the food selfie".
            // We will pass the base64 string if available, or just the URI if we are finding a way to upload it.
            // Let's assume we pass the data URI for now.
            const selectedAsset = result.assets[0];
            const imageUri = `data:image/jpeg;base64,${selectedAsset.base64}`;
            setPhoto(imageUri);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permission required", "Please grant camera permissions.");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const selectedAsset = result.assets[0];
            const imageUri = `data:image/jpeg;base64,${selectedAsset.base64}`;
            setPhoto(imageUri);
        }
    };

    const handleSubmit = () => {
        if (rating === 0) {
            Alert.alert("Rating Required", "Please select a star rating.");
            return;
        }
        if (!photo) {
            Alert.alert("Photo Required", "Please upload a photo of the food/selfie.");
            return;
        }
        onSubmit(rating, comment, photo);
    };

    const cleanUp = () => {
        setRating(0);
        setComment("");
        setPhoto(null);
        onClose();
    }

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={cleanUp}>
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: isDark ? colors.card : '#FFF' }]}>

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.text }]}>Rate Transaction</Text>
                        <TouchableOpacity onPress={cleanUp} style={styles.closeButton}>
                            <X size={fp(24)} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        How was the food? Please rate your experience.
                    </Text>

                    {/* Star Rating */}
                    <View style={styles.starsContainer}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity
                                key={star}
                                onPress={() => handleRating(star)}
                                activeOpacity={0.7}>
                                <Star
                                    size={fp(32)}
                                    color={star <= rating ? "#FFD700" : isDark ? "#555" : "#E0E0E0"}
                                    fill={star <= rating ? "#FFD700" : "transparent"}
                                    style={{ marginHorizontal: wp(5) }}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Comment Input */}
                    <Text style={[styles.label, { color: colors.text }]}>Comment (Optional)</Text>
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: isDark ? colors.background : '#F5F5F5',
                            color: colors.text,
                            borderColor: isDark ? colors.border : '#E0E0E0'
                        }]}
                        placeholder="Write a comment..."
                        placeholderTextColor={colors.textTertiary}
                        multiline
                        numberOfLines={4}
                        value={comment}
                        onChangeText={setComment}
                        textAlignVertical="top"
                    />

                    {/* Photo Upload */}
                    <Text style={[styles.label, { color: colors.text, marginTop: hp(15) }]}>
                        Photo Proof *
                    </Text>
                    <View style={styles.photoContainer}>
                        {photo ? (
                            <View style={styles.photoPreviewWrapper}>
                                <Image source={{ uri: photo }} style={styles.photoPreview} />
                                <TouchableOpacity
                                    style={styles.removePhotoButton}
                                    onPress={() => setPhoto(null)}>
                                    <X size={fp(16)} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={{ flexDirection: 'row', gap: wp(10) }}>
                                <TouchableOpacity
                                    style={[styles.uploadButton, { borderColor: colors.border }]}
                                    onPress={pickImage}>
                                    <Camera size={fp(24)} color={theme.colors.primary} />
                                    <Text style={[styles.uploadText, { color: theme.colors.primary }]}>Gallery</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.uploadButton, { borderColor: colors.border }]}
                                    onPress={takePhoto}>
                                    <Camera size={fp(24)} color={theme.colors.primary} />
                                    <Text style={[styles.uploadText, { color: theme.colors.primary }]}>Camera</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            { opacity: isSubmitting ? 0.7 : 1 },
                        ]}
                        onPress={handleSubmit}
                        disabled={isSubmitting}>
                        {isSubmitting ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.submitButtonText}>Submit Feedback</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        alignItems: "center",
        padding: wp(20),
        justifyContent: "center",
    },
    container: {
        width: "100%",
        borderRadius: wp(16),
        padding: wp(20),
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: hp(10),
    },
    closeButton: {
        padding: 5,
    },
    title: {
        fontSize: fp(18),
        fontWeight: "bold",
    },
    subtitle: {
        fontSize: fp(14),
        marginBottom: hp(20),
    },
    starsContainer: {
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: hp(20),
    },
    label: {
        fontSize: fp(14),
        fontWeight: "600",
        marginBottom: hp(8),
    },
    input: {
        borderRadius: wp(8),
        borderWidth: 1,
        padding: wp(12),
        height: hp(100),
    },
    photoContainer: {
        marginBottom: hp(25),
    },
    uploadButton: {
        flex: 1,
        height: hp(80),
        borderWidth: 1,
        borderStyle: "dashed",
        borderRadius: wp(8),
        justifyContent: "center",
        alignItems: "center",
        gap: hp(5),
    },
    uploadText: {
        fontSize: fp(12),
        fontWeight: "500",
    },
    photoPreviewWrapper: {
        width: "100%",
        height: hp(150),
        borderRadius: wp(8),
        overflow: "hidden",
        position: "relative",
    },
    photoPreview: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    removePhotoButton: {
        position: "absolute",
        top: wp(8),
        right: wp(8),
        backgroundColor: "rgba(0,0,0,0.6)",
        borderRadius: wp(12),
        padding: wp(4),
    },
    submitButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: wp(12),
        height: hp(50),
        justifyContent: "center",
        alignItems: "center",
    },
    submitButtonText: {
        color: "#FFF",
        fontSize: fp(16),
        fontWeight: "bold",
    },
});
