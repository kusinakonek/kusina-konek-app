import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Maximize2, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface MapPreviewProps {
    latitude: number;
    longitude: number;
    title?: string;
    height?: number;
}

export default function MapPreview({ latitude, longitude, title, height = 200 }: MapPreviewProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const insets = useSafeAreaInsets();

    const region = {
        latitude,
        longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
    };

    return (
        <View style={[styles.container, { height }]}>
            {/* Inline Google Map (non-interactive preview) */}
            <MapView
                style={styles.map}
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                initialRegion={region}
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
                toolbarEnabled={false}
            >
                <Marker
                    coordinate={{ latitude, longitude }}
                    title={title}
                    pinColor="#00C853"
                />
            </MapView>

            {/* Enlarge Button Overlay */}
            <TouchableOpacity
                style={styles.enlargeButton}
                onPress={() => setIsFullscreen(true)}
            >
                <Maximize2 size={16} color="#fff" />
                <Text style={styles.enlargeText}>View Full Map</Text>
            </TouchableOpacity>

            {/* Fullscreen Map Modal */}
            <Modal
                visible={isFullscreen}
                animationType="slide"
                onRequestClose={() => setIsFullscreen(false)}
                statusBarTranslucent
            >
                <View style={styles.modalContainer}>
                    {/* Fullscreen Google Map (interactive) */}
                    <MapView
                        style={StyleSheet.absoluteFillObject}
                        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                        initialRegion={{
                            ...region,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                        }}
                        showsUserLocation
                        showsMyLocationButton
                    >
                        <Marker
                            coordinate={{ latitude, longitude }}
                            title={title}
                            pinColor="#00C853"
                        />
                    </MapView>

                    {/* Header */}
                    <View style={[styles.modalHeader, { top: insets.top + 8 }]}>
                        <TouchableOpacity onPress={() => setIsFullscreen(false)} style={styles.closeButton}>
                            <X size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>{title || 'Map Preview'}</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* Coordinates Overlay */}
                    <View style={[styles.coordsOverlay, { bottom: insets.bottom + 20 }]}>
                        <Text style={styles.coordsText}>
                            {latitude.toFixed(6)}, {longitude.toFixed(6)}
                        </Text>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
        position: 'relative',
    },
    map: {
        flex: 1,
        width: '100%',
    },
    enlargeButton: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.7)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        gap: 6,
    },
    enlargeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    modalHeader: {
        position: 'absolute',
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 8,
        zIndex: 10,
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#fff',
        textShadowColor: 'rgba(0,0,0,0.6)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
        maxWidth: '60%',
        textAlign: 'center',
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    coordsOverlay: {
        position: 'absolute',
        alignSelf: 'center',
        backgroundColor: '#fff',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    coordsText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#2E7D32',
        fontFamily: 'monospace',
    },
});
