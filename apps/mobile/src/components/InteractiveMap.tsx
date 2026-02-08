import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Modal, TouchableOpacity, SafeAreaView, StatusBar, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Maximize2, X, Check } from 'lucide-react-native';

interface InteractiveMapProps {
    initialLatitude?: number;
    initialLongitude?: number;
    onLocationSelect: (location: { latitude: number; longitude: number; address: string }) => void;
    height?: number;
}

export default function InteractiveMap({
    initialLatitude,
    initialLongitude,
    onLocationSelect,
    height = 300
}: InteractiveMapProps) {
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [tempLocation, setTempLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);

    useEffect(() => {
        (async () => {
            if (initialLatitude && initialLongitude) {
                setCurrentLocation({
                    lat: initialLatitude,
                    lng: initialLongitude,
                });
                setLoading(false);
                return;
            }

            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    const location = await Location.getCurrentPositionAsync({});
                    setCurrentLocation({
                        lat: location.coords.latitude,
                        lng: location.coords.longitude,
                    });
                } else {
                    // Default to Naga City if no permission
                    setCurrentLocation({
                        lat: 13.6218,
                        lng: 123.1948,
                    });
                }
            } catch (error) {
                // Default to Naga City on error
                setCurrentLocation({
                    lat: 13.6218,
                    lng: 123.1948,
                });
            }
            setLoading(false);
        })();
    }, []);

    const [mapKey, setMapKey] = useState(0);

    const handleMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'locationSelected') {
                const newLocation = {
                    latitude: data.lat,
                    longitude: data.lng,
                    address: data.address || '',
                };

                // If in fullscreen, just update local temp state
                if (isFullscreen) {
                    setTempLocation({
                        lat: data.lat,
                        lng: data.lng,
                        address: newLocation.address
                    });
                } else {
                    // If inline, update parent directly
                    onLocationSelect(newLocation);
                }
            }
        } catch (e) {
            console.error('Error parsing message from WebView:', e);
        }
    };

    const handleConfirmFullscreen = () => {
        if (tempLocation) {
            onLocationSelect({
                latitude: tempLocation.lat,
                longitude: tempLocation.lng,
                address: tempLocation.address
            });
            setCurrentLocation({ lat: tempLocation.lat, lng: tempLocation.lng });
        }
        setIsFullscreen(false);
        setMapKey(prev => prev + 1);
    };

    const handleCloseFullscreen = () => {
        setIsFullscreen(false);
        setTempLocation(null);
        setMapKey(prev => prev + 1);
    };

    const getMapHtml = (lat: number, lng: number) => `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body, #map { height: 100%; width: 100%; }
        .instruction {
            position: absolute;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            z-index: 1000;
            white-space: nowrap;
        }
    </style>
</head>
<body>
    <div class="instruction">📍 Tap on map to select location</div>
    <div id="map"></div>
    <script>
        var map = L.map('map', {
            zoomControl: true,
            attributionControl: false
        }).setView([${lat}, ${lng}], 15);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        
        var marker = L.marker([${lat}, ${lng}], {
            draggable: true
        }).addTo(map);
        
        marker.on('dragend', function(e) {
            var pos = marker.getLatLng();
            reverseGeocode(pos.lat, pos.lng);
        });
        
        map.on('click', function(e) {
            marker.setLatLng(e.latlng);
            reverseGeocode(e.latlng.lat, e.latlng.lng);
        });
        
        function reverseGeocode(lat, lng) {
            // Send location immediately to responsive UI
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'locationSelected',
                lat: lat,
                lng: lng,
                address: '' // Address will be fetched by nominatim if needed, but we send coords first
            }));

            fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lng)
                .then(response => response.json())
                .then(data => {
                    var address = data.display_name;
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'locationSelected',
                        lat: lat,
                        lng: lng,
                        address: address
                    }));
                });
        }
    </script>
</body>
</html>
    `;

    const mapSource = React.useMemo(() => {
        if (!currentLocation) return { html: '' };
        return { html: getMapHtml(currentLocation.lat, currentLocation.lng) };
    }, [currentLocation]);

    if (loading || !currentLocation) {
        return (
            <View style={[styles.container, { height }]}>
                <ActivityIndicator size="large" color="#00C853" />
                <Text style={styles.loadingText}>Loading map...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { height }]}>
            {!isFullscreen && (
                <WebView
                    key={`inline-map-${mapKey}`}
                    source={mapSource}
                    style={styles.webview}
                    onMessage={handleMessage}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    scrollEnabled={false}
                    opacity={0.99}
                />
            )}

            {/* Enlarge Button Overlay */}
            <TouchableOpacity
                style={styles.enlargeButton}
                onPress={() => {
                    setTempLocation({
                        lat: currentLocation.lat,
                        lng: currentLocation.lng,
                        address: ''
                    });
                    setIsFullscreen(true);
                }}
            >
                <Maximize2 size={20} color="#fff" />
                <Text style={styles.enlargeText}>Enlarge Map</Text>
            </TouchableOpacity>

            {/* Fullscreen Map Modal */}
            <Modal
                visible={isFullscreen}
                animationType="slide"
                onRequestClose={handleCloseFullscreen}
                presentationStyle="fullScreen"
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={handleCloseFullscreen} style={styles.closeButton}>
                            <X size={24} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Select Location</Text>
                        <TouchableOpacity
                            onPress={handleConfirmFullscreen}
                            style={[styles.confirmButton, (!tempLocation || !tempLocation.address) && styles.confirmButtonDisabled]}
                            disabled={!tempLocation || !tempLocation.address}
                        >
                            <Check size={20} color="#fff" />
                            <Text style={styles.confirmText}>Confirm</Text>
                        </TouchableOpacity>
                    </View>

                    <WebView
                        source={mapSource}
                        style={styles.webview}
                        onMessage={handleMessage}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                    />

                    {/* Location Preview in Modal */}
                    {tempLocation && (
                        <View style={styles.locationPreview}>
                            <Text style={styles.coordText}>
                                {tempLocation.lat.toFixed(6)}, {tempLocation.lng.toFixed(6)}
                            </Text>
                            {tempLocation.address ? (
                                <Text numberOfLines={1} style={styles.addressText}>
                                    {tempLocation.address}
                                </Text>
                            ) : (
                                <ActivityIndicator size="small" color="#00C853" />
                            )}
                        </View>
                    )}
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
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    webview: {
        flex: 1,
        width: '100%',
        opacity: 0.99, // Hack to fix crash on some Android devices
    },
    loadingText: {
        marginTop: 8,
        color: '#666',
        fontSize: 14,
    },
    enlargeButton: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.7)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
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
    },
    closeButton: {
        padding: 8,
    },
    confirmButton: {
        backgroundColor: '#00C853',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        gap: 6,
    },
    confirmButtonDisabled: {
        backgroundColor: '#ccc',
    },
    confirmText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    locationPreview: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    coordText: {
        fontSize: 12,
        color: '#666',
        fontFamily: 'monospace',
        marginBottom: 4,
    },
    addressText: {
        fontSize: 14,
        color: '#1a1a1a',
        fontWeight: '500',
    },
});
