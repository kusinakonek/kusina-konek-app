import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator, Platform } from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { API_ENDPOINTS } from '../../src/api/endpoints';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, MapPin, X } from 'lucide-react-native';

// Conditionally import react-native-maps (not supported on web)
let MapView: any = null;
let Marker: any = null;
if (Platform.OS !== 'web') {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
}

// Define Region type for location state
type Region = {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
};

export default function AddFood() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Form State
    const [foodName, setFoodName] = useState('');
    const [description, setDescription] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unit, setUnit] = useState('servings');

    // Location State
    const [location, setLocation] = useState<Region>({
        latitude: 13.621775, // Naga City Default
        longitude: 123.194824,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    });
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [locationName, setLocationName] = useState('');

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission to access location was denied');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            });
        })();
    }, []);

    const handleMapPress = (e: any) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        setSelectedLocation({ lat: latitude, lng: longitude });
        // Optionally reverse geocode here to get address name
        setLocationName(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
    };

    const handleSubmit = async () => {
        if (!foodName || !quantity || !selectedLocation) {
            Alert.alert('Error', 'Please fill in all required fields and select a location.');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                food_name: foodName,
                description,
                quantity: parseInt(quantity),
                unit,
                pickup_location: locationName,
                latitude: selectedLocation.lat,
                longitude: selectedLocation.lng,
                status: 'AVAILABLE'
            };

            // Using DISTRIBUTION endpoint based on inference, adapting if needed
            await api.post(API_ENDPOINTS.DISTRIBUTION.ADD_DISTRIBUTION, payload);

            Alert.alert('Success', 'Food donation added successfully!', [
                { text: 'OK', onPress: () => router.push('/(tabs)') }
            ]);
        } catch (error: any) {
            console.error(error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to add food.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.title}>Add Food Donation</Text>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Food Name *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Chicken Adobo"
                        value={foodName}
                        onChangeText={setFoodName}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Describe the food..."
                        multiline
                        numberOfLines={3}
                        value={description}
                        onChangeText={setDescription}
                    />
                </View>

                <View style={styles.row}>
                    <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                        <Text style={styles.label}>Quantity *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 5"
                            keyboardType="numeric"
                            value={quantity}
                            onChangeText={setQuantity}
                        />
                    </View>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                        <Text style={styles.label}>Unit</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="servings"
                            value={unit}
                            onChangeText={setUnit}
                        />
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Pickup Location (Tap on Map) *</Text>
                    <View style={styles.mapContainer}>
                        {Platform.OS !== 'web' && MapView ? (
                            <MapView
                                style={styles.map}
                                region={location}
                                onPress={handleMapPress}
                                showsUserLocation
                            >
                                {selectedLocation && (
                                    <Marker
                                        coordinate={{ latitude: selectedLocation.lat, longitude: selectedLocation.lng }}
                                        title="Pickup Location"
                                    />
                                )}
                            </MapView>
                        ) : (
                            <View style={[styles.map, styles.webMapFallback]}>
                                <MapPin size={32} color="#666" />
                                <Text style={styles.webMapText}>Map not available on web.</Text>
                                <Text style={styles.webMapSubtext}>Please use the mobile app to select a location.</Text>
                            </View>
                        )}
                    </View>
                    {selectedLocation && (
                        <Text style={styles.locationText}>Selected: {locationName}</Text>
                    )}
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.disabledButton]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Post Donation</Text>}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scrollContent: { padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#1a1a1a' },
    formGroup: { marginBottom: 15 },
    label: { fontSize: 16, fontWeight: '600', marginBottom: 5, color: '#333' },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#f9f9f9' },
    textArea: { height: 80, textAlignVertical: 'top' },
    row: { flexDirection: 'row' },
    mapContainer: { height: 200, borderRadius: 12, overflow: 'hidden', marginTop: 5, borderWidth: 1, borderColor: '#ddd' },
    map: { width: '100%', height: '100%' },
    locationText: { fontSize: 14, color: '#666', marginTop: 5, fontStyle: 'italic' },
    submitButton: { backgroundColor: '#00C853', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
    disabledButton: { opacity: 0.7 },
    submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    webMapFallback: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' },
    webMapText: { fontSize: 16, color: '#666', marginTop: 10, fontWeight: '600' },
    webMapSubtext: { fontSize: 14, color: '#999', marginTop: 4 }
});
