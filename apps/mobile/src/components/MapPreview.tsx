import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, SafeAreaView, Platform, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import { Maximize2, X } from 'lucide-react-native';

interface MapPreviewProps {
    latitude: number;
    longitude: number;
    title?: string;
    height?: number;
}

export default function MapPreview({ latitude, longitude, title, height = 200 }: MapPreviewProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Generate OpenStreetMap HTML with Leaflet
    const getMapHtml = (isFull: boolean) => `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        * { margin: 0; padding: 0; }
        html, body, #map { height: 100%; width: 100%; }
        .leaflet-container {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        var map = L.map('map', {
            zoomControl: ${isFull ? 'true' : 'false'},
            attributionControl: false
        }).setView([${latitude}, ${longitude}], 16);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        
        var marker = L.marker([${latitude}, ${longitude}]).addTo(map);
        ${title ? `marker.bindPopup("${title.replace(/"/g, '\\"')}").openPopup();` : ''}
    </script>
</body>
</html>
    `;

    return (
        <View style={[styles.container, { height }]}>
            <WebView
                source={{ html: getMapHtml(false) }}
                style={styles.webview}
                scrollEnabled={false}
                javaScriptEnabled={true}
                domStorageEnabled={true}
            />

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
                presentationStyle="fullScreen"
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setIsFullscreen(false)} style={styles.closeButton}>
                            <X size={24} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>{title || 'Map Preview'}</Text>
                        <View style={{ width: 40 }} /> {/* Spacer */}
                    </View>

                    <WebView
                        source={{ html: getMapHtml(true) }}
                        style={styles.webview}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                    />

                    {/* Coordinates Overlay */}
                    <View style={styles.coordsOverlay}>
                        <Text style={styles.coordsText}>
                            {latitude.toFixed(6)}, {longitude.toFixed(6)}
                        </Text>
                    </View>
                </SafeAreaView>
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
    webview: {
        flex: 1,
        opacity: 0.99,
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
        backgroundColor: '#fff',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#fff',
        zIndex: 1,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        maxWidth: '70%',
    },
    closeButton: {
        padding: 8,
    },
    coordsOverlay: {
        position: 'absolute',
        bottom: 30,
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
