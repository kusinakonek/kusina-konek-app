import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Linking, Platform } from 'react-native';
import { Map, Navigation2, ExternalLink } from 'lucide-react-native';
import InteractiveMap from '../../../src/components/InteractiveMap';
import Input from '../../../src/components/Input';

export interface LocationValue {
    latitude: number;
    longitude: number;
    name: string;
    address: string;
    barangay?: string;
}

interface LocationPickerProps {
    value: LocationValue | null;
    onChange: (value: LocationValue) => void;
    label?: string;
    placeholder?: string;
}

export default function LocationPicker({
    value,
    onChange,
    label = 'Tap on map to select location',
    placeholder = 'e.g., SM City Naga, Naga City Hall'
}: LocationPickerProps) {

    const handleLocationSelect = (location: {
        latitude: number; longitude: number; address: string;
        barangay?: string; landmark?: string; fullAddress?: string;
    }) => {
        // Handle loading state
        if (!location.address) {
            onChange({
                latitude: location.latitude,
                longitude: location.longitude,
                name: 'Fetching location...',
                address: 'Fetching address details...',
                barangay: '',
            });
            return;
        }

        // Landmark: use detected landmark, or fall back to first part of address
        const landmark = location.landmark || location.address.split(',')[0]?.trim() || 'Selected Location';

        // Full structured address from Nominatim
        const fullAddress = location.fullAddress || location.address;

        onChange({
            latitude: location.latitude,
            longitude: location.longitude,
            name: landmark,
            address: fullAddress,
            barangay: location.barangay || '',
        });
    };

    const openGoogleMapsNavigation = (lat: number, lng: number) => {
        const destination = `${lat},${lng}`;
        const googleMapsAppUrl = Platform.select({
            android: `google.navigation:q=${destination}&mode=d`,
            ios: `comgooglemaps://?daddr=${destination}&directionsmode=driving`,
        });
        const googleMapsWebUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;

        if (googleMapsAppUrl) {
            Linking.canOpenURL(googleMapsAppUrl)
                .then((supported) => {
                    if (supported) {
                        Linking.openURL(googleMapsAppUrl);
                    } else {
                        Linking.openURL(googleMapsWebUrl);
                    }
                })
                .catch(() => Linking.openURL(googleMapsWebUrl));
        } else {
            Linking.openURL(googleMapsWebUrl);
        }
    };

    return (
        <View style={styles.container}>
            {/* Interactive Map */}
            <View style={styles.mapSection}>
                <View style={styles.mapHeader}>
                    <Map size={18} color="#333" />
                    <Text style={styles.mapSectionTitle}>{label}</Text>
                </View>
                <InteractiveMap
                    onLocationSelect={handleLocationSelect}
                    initialLatitude={value?.latitude}
                    initialLongitude={value?.longitude}
                    height={250}
                />
            </View>

            {/* Coordinates Display + Navigate Button */}
            {value && value.latitude !== 0 && (
                <>
                    <View style={styles.coordsContainer}>
                        <View style={styles.coordItem}>
                            <Text style={styles.coordLabel}>Latitude</Text>
                            <Text style={styles.coordValue}>{value.latitude.toFixed(6)}</Text>
                        </View>
                        <View style={styles.coordItem}>
                            <Text style={styles.coordLabel}>Longitude</Text>
                            <Text style={styles.coordValue}>{value.longitude.toFixed(6)}</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.navigateButton}
                        onPress={() => openGoogleMapsNavigation(value.latitude, value.longitude)}
                    >
                        <Navigation2 size={16} color="#fff" />
                        <Text style={styles.navigateText}>Navigate with Google Maps</Text>
                        <ExternalLink size={12} color="rgba(255,255,255,0.7)" />
                    </TouchableOpacity>
                </>
            )}

            {/* Barangay (auto-detected from map pin) */}
            <Input
                label="Barangay"
                placeholder="Auto-detected from map pin"
                value={value?.barangay || ''}
                onChangeText={(text) => onChange({
                    ...(value || { latitude: 0, longitude: 0, name: '', address: '' }),
                    barangay: text,
                })}
            />

            {/* Landmark / Nearest Store / Street */}
            <Input
                label="Landmark / Nearest Store"
                placeholder="e.g., SM City Naga, Jollibee, or street name"
                value={value?.name || ''}
                onChangeText={(text) => onChange({
                    ...(value || { latitude: 0, longitude: 0, address: '' }),
                    name: text,
                })}
            />

            {/* Full Address */}
            <Input
                label="Complete Address"
                placeholder="Zone/Street, Barangay, Municipality, Province, Region, Zip, Country"
                multiline
                numberOfLines={3}
                value={value?.address || ''}
                onChangeText={(text) => onChange({
                    ...(value || { latitude: 0, longitude: 0, name: '' }),
                    address: text,
                })}
                style={{ height: 80 }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 8,
    },
    mapSection: {
        marginBottom: 16,
    },
    mapHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    mapSectionTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    coordsContainer: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
        backgroundColor: '#E8F5E9',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#C8E6C9',
    },
    coordItem: {
        flex: 1,
    },
    coordLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    coordValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2E7D32',
        fontFamily: 'monospace',
    },
    navigateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#4285F4',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        marginBottom: 16,
        shadowColor: '#4285F4',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    navigateText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },

});
