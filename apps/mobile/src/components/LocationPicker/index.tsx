import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Map } from 'lucide-react-native';
import InteractiveMap from '../../../src/components/InteractiveMap';
import Input from '../../../src/components/Input';

export interface LocationValue {
    latitude: number;
    longitude: number;
    name: string;
    address: string;
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

    const handleLocationSelect = (location: { latitude: number; longitude: number; address: string }) => {
        // Handle loading state
        if (!location.address) {
            onChange({
                latitude: location.latitude,
                longitude: location.longitude,
                name: 'Fetching location...',
                address: 'Fetching address details...',
            });
            return;
        }

        // Parse address
        const addressParts = location.address.split(',');
        const name = addressParts[0]?.trim() || 'Selected Location';

        onChange({
            latitude: location.latitude,
            longitude: location.longitude,
            name,
            address: location.address,
        });
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

            {/* Coordinates Display */}
            {value && value.latitude !== 0 && (
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
            )}

            {/* Landmark / Location Name */}
            <Input
                label="Landmark / Location Name"
                placeholder={placeholder}
                value={value?.name || ''}
                onChangeText={(text) => onChange({
                    ...(value || { latitude: 0, longitude: 0, address: '' }),
                    name: text,
                })}
            />

            {/* Address / Description */}
            <Input
                label="Address / Description"
                placeholder="Provide specific details (e.g., near the main entrance)"
                multiline
                numberOfLines={3}
                value={value?.address || ''}
                onChangeText={(text) => onChange({
                    ...(value || { latitude: 0, longitude: 0, name: '' }),
                    address: text,
                })}
                style={{ height: 80 }} // Override default minHeight if needed, or stick with Input default
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

});
