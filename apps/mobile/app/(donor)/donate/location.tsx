import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Linking,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Phone,
  CheckCircle,
  Navigation,
  Navigation2,
  Map,
  ExternalLink,
} from "lucide-react-native";
import {
  useDonation,
  BARANGAY_HALLS,
  BarangayHall,
} from "../../../context/DonationContext";
import MapPreview from "../../../src/components/MapPreview";
import LocationPicker from "../../../src/components/LocationPicker";
import axiosClient from "../../../src/api/axiosClient";
import { API_ENDPOINTS } from "../../../src/api/endpoints";
import { useFoodCache } from "../../../context/FoodCacheContext";
import SuccessModal from "../../../src/components/SuccessModal";
import { useTheme } from "../../../context/ThemeContext";
import { useAlert } from "../../../context/AlertContext";
import LoadingScreen from "../../../src/components/LoadingScreen";
import TutorialOverlay, { TUTORIAL_STORAGE_KEYS } from "../../../src/components/TutorialOverlay";
import { DONATE_LOCATION_STEPS, useTutorial } from "../../../src/hooks/useTutorial";

export default function LocationScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { formData, updateFormData, resetForm } = useDonation();
  const { invalidateCache } = useFoodCache();
  const { showAlert } = useAlert();
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const tutorial = useTutorial({
    steps: DONATE_LOCATION_STEPS,
    storageKey: TUTORIAL_STORAGE_KEYS.DONATE_LOCATION,
    enabled: !submitting && !showSuccessModal,
  });

  const openGoogleMapsNavigation = (lat: number, lng: number, label?: string) => {
    const destination = `${lat},${lng}`;
    const encodedLabel = encodeURIComponent(label || 'Destination');

    // Try Google Maps app first, fall back to web
    const googleMapsAppUrl = Platform.select({
      android: `google.navigation:q=${destination}&mode=d`,
      ios: `comgooglemaps://?daddr=${destination}&directionsmode=driving`,
    });

    const googleMapsWebUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&destination_place_id=&travelmode=driving`;

    if (googleMapsAppUrl) {
      Linking.canOpenURL(googleMapsAppUrl)
        .then((supported) => {
          if (supported) {
            Linking.openURL(googleMapsAppUrl);
          } else {
            // Fall back to web URL (opens in browser or Google Maps)
            Linking.openURL(googleMapsWebUrl);
          }
        })
        .catch(() => Linking.openURL(googleMapsWebUrl));
    } else {
      Linking.openURL(googleMapsWebUrl);
    }
  };

  const handleSelectBarangay = (barangay: BarangayHall) => {
    updateFormData({
      locationType: "barangay",
      selectedBarangay: barangay,
      customLocation: null,
    });
  };

  const handleSubmitDonation = async () => {
    if (formData.locationType === "barangay" && !formData.selectedBarangay) {
      showAlert("Error", "Please select a drop-off location", undefined, { type: 'warning' });
      return;
    }
    if (formData.locationType === "custom") {
      if (!formData.customLocation || !formData.customLocation.latitude || formData.customLocation.latitude === 0) {
        showAlert("Error", "Please tap on the map to pin your exact location", undefined, { type: 'warning' });
        return;
      }
      if (!formData.customLocation.name || !formData.customLocation.address) {
        showAlert("Error", "Please complete all custom location fields", undefined, { type: 'warning' });
        return;
      }
    }
    if (!formData.imageUri) {
      showAlert("Error", "An actual photo of the food is required.", undefined, { type: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      // imageUri is already a base64 data URI captured at photo time
      const imageBase64 = formData.imageUri || undefined;

      // Calculate scheduledTime based on duration input
      const durationValue = parseInt(formData.availableDurationValue) || 1;
      const durationMs = formData.availableDurationUnit === 'minutes' 
          ? durationValue * 60 * 1000 
          : durationValue * 3600 * 1000;
      const calculatedScheduledTime = new Date(Date.now() + durationMs).toISOString();

      const payload = {
        foodName: formData.foodName,
        description: formData.description,
        quantity: formData.quantity,
        dateCooked: new Date().toISOString(),
        image: imageBase64,
        availabilityDuration: formData.availableDurationUnit === 'minutes' ? durationValue : durationValue * 60,
        locations: [
          {
            latitude:
              formData.locationType === "barangay"
                ? formData.selectedBarangay!.latitude
                : formData.customLocation!.latitude,
            longitude:
              formData.locationType === "barangay"
                ? formData.selectedBarangay!.longitude
                : formData.customLocation!.longitude,
            streetAddress:
              formData.locationType === "barangay"
                ? formData.selectedBarangay!.address
                : formData.customLocation!.address,
            barangay:
              formData.locationType === "barangay"
                ? formData.selectedBarangay!.name
                : formData.customLocation?.barangay || undefined,
          },
        ],
        scheduledTime: calculatedScheduledTime,
        expireAt: calculatedScheduledTime,
      };

      await axiosClient.post(API_ENDPOINTS.FOOD.ADD_DONATION, payload);

      // Invalidate food cache so browse food list updates
      invalidateCache();
      
      // Force dashboard to refresh when user returns
      DeviceEventEmitter.emit('dashboard:force-refresh');

      setShowSuccessModal(true);
      // NOTE: We don't set submitting(false) here on success, 
      // to prevent users from pressing the button again while the modal is up
      // and accidentally doing a duplicate submission.
    } catch (error: any) {
      console.error("Donation submission error:", {
        message: error?.message,
        code: error?.code,
        status: error?.response?.status,
        data: error?.response?.data,
      });
      const isNetworkError = !error?.response;
      const errorMessage = isNetworkError
        ? "Network error while uploading. Please ensure server is running and try again."
        : (error.response?.data?.message || "Failed to submit donation. Please try again.");
      showAlert("Error", errorMessage, undefined, { type: 'error' });
      // Restore the button if it failed so they can try again once they fix the error
      setSubmitting(false);
    }
  };

  const selectedLocation = formData.selectedBarangay;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top"]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.title, { color: colors.text }]}>Donate Food</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Step 3 of 3</Text>
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
          {/* Location Type Toggle */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Select Drop-off Point</Text>
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
              Choose from barangay halls or set your own custom location
            </Text>

            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  { backgroundColor: colors.inputBg, borderColor: colors.border },
                  formData.locationType === "barangay" &&
                  styles.toggleButtonActive,
                ]}
                onPress={() => updateFormData({ locationType: "barangay" })}>
                <MapPin
                  size={16}
                  color={formData.locationType === "barangay" ? "#fff" : colors.text}
                />
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={[
                    styles.toggleText,
                    { color: colors.text },
                    formData.locationType === "barangay" &&
                    styles.toggleTextActive,
                  ]}>
                  Barangay Hall
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  { backgroundColor: colors.inputBg, borderColor: colors.border },
                  formData.locationType === "custom" && styles.toggleButtonActive,
                ]}
                onPress={() => updateFormData({ locationType: "custom" })}>
                <Navigation
                  size={16}
                  color={formData.locationType === "custom" ? "#fff" : colors.text}
                />
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={[
                    styles.toggleText,
                    { color: colors.text },
                    formData.locationType === "custom" && styles.toggleTextActive,
                  ]}>
                  Custom Location
                </Text>
              </TouchableOpacity>
            </View>

            {/* Barangay Hall List */}
            {formData.locationType === "barangay" && (
              <View style={styles.hallList}>
                {BARANGAY_HALLS.map((hall) => (
                  <TouchableOpacity
                    key={hall.id}
                    style={[
                      styles.hallCard,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      selectedLocation?.id === hall.id && {
                        borderColor: '#00C853',
                        backgroundColor: isDark ? '#003300' : '#F1FFF6'
                      },
                    ]}
                    onPress={() => handleSelectBarangay(hall)}>
                    <View style={styles.hallHeader}>
                      <View
                        style={[
                          styles.hallIcon,
                          { backgroundColor: colors.inputBg },
                          selectedLocation?.id === hall.id && {
                            backgroundColor: isDark ? '#1a3a1a' : '#E8F5E9'
                          },
                        ]}>
                        <MapPin
                          size={20}
                          color={
                            selectedLocation?.id === hall.id ? "#00C853" : colors.textSecondary
                          }
                        />
                      </View>
                      <View style={styles.hallInfo}>
                        <Text style={[styles.hallName, { color: colors.text }]}>{hall.name}</Text>
                        <View style={styles.hallDetail}>
                          <MapPin size={12} color={colors.textSecondary} />
                          <Text style={[styles.hallDetailText, { color: colors.textSecondary }]}>
                            {hall.address}
                          </Text>
                        </View>
                        <View style={styles.hallDetail}>
                          <Clock size={12} color={colors.textSecondary} />
                          <Text style={[styles.hallDetailText, { color: colors.textSecondary }]}>{hall.hours}</Text>
                        </View>
                        <View style={styles.hallDetail}>
                          <Phone size={12} color={colors.textSecondary} />
                          <Text style={[styles.hallDetailText, { color: colors.textSecondary }]}>{hall.phone}</Text>
                        </View>
                      </View>
                      {selectedLocation?.id === hall.id && (
                        <CheckCircle size={24} color="#00C853" />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Custom Location Form */}
            {formData.locationType === "custom" && (
              <LocationPicker
                value={formData.customLocation}
                onChange={(location) =>
                  updateFormData({ customLocation: location })
                }
              />
            )}
          </View>

          {/* Map Preview for Selected Barangay */}
          {formData.locationType === "barangay" && selectedLocation && (
            <View style={[styles.mapCard, { backgroundColor: colors.card }]}>
              <View style={styles.mapHeader}>
                <Map size={20} color={colors.text} />
                <Text style={[styles.mapTitle, { color: colors.text }]}>Drop-off Location Map</Text>
              </View>

              <MapPreview
                latitude={selectedLocation.latitude}
                longitude={selectedLocation.longitude}
                title={selectedLocation.name}
                height={180}
              />

              <View style={styles.locationDetails}>
                <Text style={styles.locationName}>{selectedLocation.name}</Text>
                <Text style={[styles.locationDesc, { color: colors.textSecondary }]}>
                  {selectedLocation.description ||
                    `A community hall located in ${selectedLocation.address.split(",")[0]}.`}
                </Text>
                <View style={styles.locationInfo}>
                  <MapPin size={14} color={colors.textSecondary} />
                  <Text style={[styles.locationInfoText, { color: colors.textSecondary }]}>
                    {selectedLocation.address}
                  </Text>
                </View>
                <View style={styles.locationInfo}>
                  <Clock size={14} color={colors.textSecondary} />
                  <Text style={[styles.locationInfoText, { color: colors.textSecondary }]}>
                    Operating Hours: {selectedLocation.hours}
                  </Text>
                </View>
                <View style={styles.locationInfo}>
                  <Phone size={14} color={colors.textSecondary} />
                  <Text style={[styles.locationInfoText, { color: colors.textSecondary }]}>
                    Contact: {selectedLocation.phone}
                  </Text>
                </View>
                <View style={[styles.locationInfo, { marginTop: 4 }]}>
                  <Text style={{ fontSize: 14 }}>📍</Text>
                  <Text
                    style={[
                      styles.locationInfoText,
                      {
                        fontFamily: "monospace",
                        color: "#2E7D32",
                        fontWeight: "600",
                      },
                    ]}>
                    {selectedLocation.latitude.toFixed(4)},{" "}
                    {selectedLocation.longitude.toFixed(4)}
                  </Text>
                </View>
              </View>

              {/* Navigate with Google Maps Button */}
              <TouchableOpacity
                style={styles.navigateButton}
                onPress={() =>
                  openGoogleMapsNavigation(
                    selectedLocation.latitude,
                    selectedLocation.longitude,
                    selectedLocation.name
                  )
                }>
                <Navigation2 size={18} color="#fff" />
                <Text style={styles.navigateButtonText}>
                  Navigate with Google Maps
                </Text>
                <ExternalLink size={14} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>

              <View style={styles.noteBox}>
                <Text style={styles.noteLabel}>Note:</Text>
                <Text style={styles.noteText}>
                  This food is scheduled to be available until {" "}
                  {formData.availableDurationValue} {formData.availableDurationUnit}.
                  Please drop off your donation as soon as possible.
                  Make sure the food is properly packaged and labeled.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Submit Button */}
        <View style={[styles.footer, { backgroundColor: colors.headerBg, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (submitting ||
                (!formData.selectedBarangay &&
                  formData.locationType === "barangay")) &&
              styles.submitButtonDisabled,
            ]}
            onPress={handleSubmitDonation}
            disabled={
              submitting ||
              (!formData.selectedBarangay &&
                formData.locationType === "barangay" &&
                !formData.customLocation?.name)
            }>
            {submitting ? (
              <Text style={styles.submitText}>Confirming...</Text>
            ) : (
              <Text style={styles.submitText}>Confirm & Submit Donation</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {submitting && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 255, 255, 0.9)' }]}>
          <LoadingScreen message="Confirming donation..." />
        </View>
      )}

      <SuccessModal
        visible={showSuccessModal}
        title="Donation Submitted! 🎉"
        message="Thank you for your generosity! Please drop off your donation within 2 hours."
        buttonText="Back to Dashboard"
        onClose={() => {
          setShowSuccessModal(false);
          resetForm();
          router.replace("/(tabs)");
        }}
      />

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
    // backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
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
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  subtitle: {
    fontSize: 12,
    color: "#666",
  },
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  toggleContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 25,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  toggleButtonActive: {
    backgroundColor: "#00C853",
    borderColor: "#00C853",
  },
  toggleText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#333",
  },
  toggleTextActive: {
    color: "#fff",
  },
  hallList: {
    gap: 12,
  },
  hallCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "#f0f0f0",
  },
  hallCardSelected: {
    borderColor: "#00C853",
    backgroundColor: "#F1FFF6",
  },
  hallHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  hallIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  hallIconSelected: {
    backgroundColor: "#E8F5E9",
  },
  hallInfo: {
    flex: 1,
  },
  hallName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 6,
  },
  hallDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  hallDetailText: {
    fontSize: 12,
    color: "#666",
  },

  mapCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  mapHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  locationDetails: {
    marginTop: 16,
  },
  locationName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#00C853",
    marginBottom: 4,
  },
  locationDesc: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  locationInfoText: {
    fontSize: 13,
    color: "#666",
  },
  navigateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#4285F4",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 16,
    shadowColor: "#4285F4",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  navigateButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  noteBox: {
    backgroundColor: "#FFF3E0",
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#FF9800",
  },
  noteLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#E65100",
    marginBottom: 4,
  },
  noteText: {
    fontSize: 13,
    color: "#E65100",
    lineHeight: 18,
  },
  footer: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  submitButton: {
    backgroundColor: "#00C853",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#A5D6A7",
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
