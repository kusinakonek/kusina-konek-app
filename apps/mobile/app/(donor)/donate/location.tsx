import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
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
  Map,
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

export default function LocationScreen() {
  const router = useRouter();
  const { formData, updateFormData, resetForm } = useDonation();
  const { invalidateCache } = useFoodCache();
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSelectBarangay = (barangay: BarangayHall) => {
    updateFormData({
      locationType: "barangay",
      selectedBarangay: barangay,
      customLocation: null,
    });
  };

  const handleSubmitDonation = async () => {
    if (formData.locationType === "barangay" && !formData.selectedBarangay) {
      Alert.alert("Error", "Please select a drop-off location");
      return;
    }
    if (formData.locationType === "custom" && !formData.customLocation?.name) {
      Alert.alert("Error", "Please tap on the map to select your location");
      return;
    }

    setSubmitting(true);
    try {
      let imageBase64 = undefined;
      if (formData.imageUri) {
        try {
          const response = await fetch(formData.imageUri);
          const blob = await response.blob();
          const reader = new FileReader();
          imageBase64 = await new Promise((resolve) => {
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
        } catch (e) {
          console.error("Failed to convert image to base64", e);
          // Continue without image or handle error
        }
      }

      const payload = {
        foodName: formData.foodName,
        description: formData.description,
        quantity: formData.quantity,
        dateCooked: new Date().toISOString(),
        image: imageBase64,
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
                : undefined,
          },
        ],
        scheduledTime: new Date(Date.now() + 3600 * 1000).toISOString(), // Default 1 hour from now
      };

      await axiosClient.post(API_ENDPOINTS.FOOD.ADD_DONATION, payload);

      // Invalidate food cache so browse food list updates
      invalidateCache();

      setShowSuccessModal(true);
    } catch (error: any) {
      console.error("Donation submission error:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to submit donation. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedLocation = formData.selectedBarangay;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Donate Food</Text>
          <Text style={styles.subtitle}>Step 3 of 3</Text>
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Location Type Toggle */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Select Drop-off Point</Text>
          <Text style={styles.cardSubtitle}>
            Choose from barangay halls or set your own custom location
          </Text>

          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                formData.locationType === "barangay" &&
                styles.toggleButtonActive,
              ]}
              onPress={() => updateFormData({ locationType: "barangay" })}>
              <MapPin
                size={16}
                color={formData.locationType === "barangay" ? "#fff" : "#333"}
              />
              <Text
                style={[
                  styles.toggleText,
                  formData.locationType === "barangay" &&
                  styles.toggleTextActive,
                ]}>
                Barangay Hall
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                formData.locationType === "custom" && styles.toggleButtonActive,
              ]}
              onPress={() => updateFormData({ locationType: "custom" })}>
              <Navigation
                size={16}
                color={formData.locationType === "custom" ? "#fff" : "#333"}
              />
              <Text
                style={[
                  styles.toggleText,
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
                    selectedLocation?.id === hall.id && styles.hallCardSelected,
                  ]}
                  onPress={() => handleSelectBarangay(hall)}>
                  <View style={styles.hallHeader}>
                    <View
                      style={[
                        styles.hallIcon,
                        selectedLocation?.id === hall.id &&
                        styles.hallIconSelected,
                      ]}>
                      <MapPin
                        size={20}
                        color={
                          selectedLocation?.id === hall.id ? "#00C853" : "#666"
                        }
                      />
                    </View>
                    <View style={styles.hallInfo}>
                      <Text style={styles.hallName}>{hall.name}</Text>
                      <View style={styles.hallDetail}>
                        <MapPin size={12} color="#666" />
                        <Text style={styles.hallDetailText}>
                          {hall.address}
                        </Text>
                      </View>
                      <View style={styles.hallDetail}>
                        <Clock size={12} color="#666" />
                        <Text style={styles.hallDetailText}>{hall.hours}</Text>
                      </View>
                      <View style={styles.hallDetail}>
                        <Phone size={12} color="#666" />
                        <Text style={styles.hallDetailText}>{hall.phone}</Text>
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
          <View style={styles.mapCard}>
            <View style={styles.mapHeader}>
              <Map size={20} color="#333" />
              <Text style={styles.mapTitle}>Drop-off Location Map</Text>
            </View>

            <MapPreview
              latitude={selectedLocation.latitude}
              longitude={selectedLocation.longitude}
              title={selectedLocation.name}
              height={180}
            />

            <View style={styles.locationDetails}>
              <Text style={styles.locationName}>{selectedLocation.name}</Text>
              <Text style={styles.locationDesc}>
                {selectedLocation.description ||
                  `A community hall located in ${selectedLocation.address.split(",")[0]}.`}
              </Text>
              <View style={styles.locationInfo}>
                <MapPin size={14} color="#666" />
                <Text style={styles.locationInfoText}>
                  {selectedLocation.address}
                </Text>
              </View>
              <View style={styles.locationInfo}>
                <Clock size={14} color="#666" />
                <Text style={styles.locationInfoText}>
                  Operating Hours: {selectedLocation.hours}
                </Text>
              </View>
              <View style={styles.locationInfo}>
                <Phone size={14} color="#666" />
                <Text style={styles.locationInfoText}>
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

            <View style={styles.noteBox}>
              <Text style={styles.noteLabel}>Note:</Text>
              <Text style={styles.noteText}>
                Please drop off your donation within 2 hours of submitting this
                form. Make sure the food is properly packaged and labeled.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
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
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Confirm & Submit Donation</Text>
          )}
        </TouchableOpacity>
      </View>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F5F5",
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
    gap: 12,
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
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
    fontSize: 14,
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
