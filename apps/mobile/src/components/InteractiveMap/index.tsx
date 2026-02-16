import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet, View, Text, ActivityIndicator, Modal,
    TouchableOpacity, Platform, Linking,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, MapPressEvent } from 'react-native-maps';
import * as Location from 'expo-location';
import { Maximize2, X, Check, Navigation2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ===== Naga City Barangay Database for accurate detection =====
const NAGA_BARANGAYS = [
    { name: 'Abella', lat: 13.6235, lng: 123.1799 },
    { name: 'Bagumbayan Norte', lat: 13.6362, lng: 123.1848 },
    { name: 'Bagumbayan Sur', lat: 13.6325, lng: 123.1866 },
    { name: 'Balatas', lat: 13.6304, lng: 123.2010 },
    { name: 'Calauag', lat: 13.6098, lng: 123.1978 },
    { name: 'Cararayan', lat: 13.6401, lng: 123.2260 },
    { name: 'Carolina', lat: 13.6643, lng: 123.2909 },
    { name: 'Concepcion Grande', lat: 13.6302, lng: 123.1773 },
    { name: 'Concepcion Pequeña', lat: 13.6265, lng: 123.1847 },
    { name: 'Dayangdang', lat: 13.6191, lng: 123.1744 },
    { name: 'Del Rosario', lat: 13.6089, lng: 123.1830 },
    { name: 'Dinaga', lat: 13.6169, lng: 123.1944 },
    { name: 'Igualdad Interior', lat: 13.6211, lng: 123.1885 },
    { name: 'Lerma', lat: 13.6269, lng: 123.1903 },
    { name: 'Liboton', lat: 13.6072, lng: 123.1812 },
    { name: 'Mabolo', lat: 13.6304, lng: 123.1960 },
    { name: 'Pacol', lat: 13.6550, lng: 123.2529 },
    { name: 'Panicuason', lat: 13.6732, lng: 123.2788 },
    { name: 'Peñafrancia', lat: 13.6188, lng: 123.1892 },
    { name: 'Sabang', lat: 13.6197, lng: 123.1970 },
    { name: 'San Felipe', lat: 13.6227, lng: 123.1848 },
    { name: 'San Francisco', lat: 13.6097, lng: 123.1867 },
    { name: 'Santa Cruz', lat: 13.6205, lng: 123.1851 },
    { name: 'Tabuco', lat: 13.6179, lng: 123.1834 },
    { name: 'Tinago', lat: 13.6148, lng: 123.1863 },
    { name: 'Triangulo', lat: 13.6249, lng: 123.1810 },
];

const NAGA_BOUNDS = { minLat: 13.59, maxLat: 13.70, minLng: 123.16, maxLng: 123.32 };

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestBarangay(lat: number, lng: number) {
    let nearest = NAGA_BARANGAYS[0];
    let minDist = Infinity;
    for (const b of NAGA_BARANGAYS) {
        const d = haversine(lat, lng, b.lat, b.lng);
        if (d < minDist) { minDist = d; nearest = b; }
    }
    return { barangay: nearest, distance: minDist };
}

function isInNagaCity(lat: number, lng: number): boolean {
    return lat >= NAGA_BOUNDS.minLat && lat <= NAGA_BOUNDS.maxLat &&
        lng >= NAGA_BOUNDS.minLng && lng <= NAGA_BOUNDS.maxLng;
}

function isZoneLabel(str: string): boolean {
    return /^(Zone\s*\d+|Zona\s*\d+)$/i.test(str.replace(/^Barangay\s*/i, '').trim());
}

async function reverseGeocodeLocation(lat: number, lng: number) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`
        );
        const data = await response.json();
        const addr = data.address || {};

        // --- Barangay Detection ---
        const rawBarangay = addr.suburb || addr.quarter || addr.neighbourhood || addr.village || '';
        const cleanedBarangay = rawBarangay.replace(/^Brgy\.?\s*/i, '').replace(/^Barangay\s*/i, '').trim();

        let barangay = '';
        if (isInNagaCity(lat, lng)) {
            const nearest = findNearestBarangay(lat, lng);
            const nominatimMatch = (cleanedBarangay && !isZoneLabel(cleanedBarangay))
                ? NAGA_BARANGAYS.find(b => b.name.toLowerCase() === cleanedBarangay.toLowerCase()) || null
                : null;

            if (nominatimMatch) {
                barangay = 'Barangay ' + nominatimMatch.name;
            } else if (nearest && nearest.distance < 3.0) {
                barangay = 'Barangay ' + nearest.barangay.name;
            } else if (cleanedBarangay && !isZoneLabel(cleanedBarangay)) {
                barangay = 'Barangay ' + cleanedBarangay;
            }
        } else {
            if (cleanedBarangay && !isZoneLabel(cleanedBarangay)) {
                barangay = 'Barangay ' + cleanedBarangay;
            }
        }

        // --- Landmark ---
        let landmark = '';
        if (data.name && data.name !== rawBarangay && data.name !== addr.city && data.name !== addr.town) {
            landmark = data.name;
        } else if (addr.amenity) landmark = addr.amenity;
        else if (addr.shop) landmark = addr.shop;
        else if (addr.building) landmark = addr.building;
        else if (addr.road) landmark = addr.road;

        // --- Full structured address ---
        const parts: string[] = [];
        let streetPart = '';
        if (addr.house_number) streetPart += addr.house_number + ' ';
        if (addr.road) streetPart += addr.road;
        if (streetPart.trim()) parts.push(streetPart.trim());
        if (barangay) parts.push(barangay);
        const municipality = addr.city || addr.town || addr.municipality || addr.city_district || '';
        if (municipality) parts.push(municipality);
        if (addr.state_district || addr.county) parts.push(addr.state_district || addr.county);
        if (addr.state) parts.push(addr.state);
        if (addr.postcode) parts.push(addr.postcode);
        if (addr.country) parts.push(addr.country);

        return {
            address: data.display_name || parts.join(', '),
            barangay,
            landmark,
            fullAddress: parts.join(', '),
        };
    } catch {
        return { address: '', barangay: '', landmark: '', fullAddress: '' };
    }
}

// ===== Component =====

interface InteractiveMapProps {
    initialLatitude?: number;
    initialLongitude?: number;
    onLocationSelect: (location: {
        latitude: number;
        longitude: number;
        address: string;
        barangay?: string;
        landmark?: string;
        fullAddress?: string;
    }) => void;
    height?: number;
}

const DEFAULT_DELTA = { latitudeDelta: 0.01, longitudeDelta: 0.01 };

export default function InteractiveMap({
    initialLatitude,
    initialLongitude,
    onLocationSelect,
    height = 300,
}: InteractiveMapProps) {
    const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [markerCoord, setMarkerCoord] = useState<{ latitude: number; longitude: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [mapType, setMapType] = useState<'standard' | 'hybrid'>('standard');
    const [tempMarkerCoord, setTempMarkerCoord] = useState<{ latitude: number; longitude: number } | null>(null);
    const [tempAddressInfo, setTempAddressInfo] = useState<{
        address: string; barangay: string; landmark: string; fullAddress: string;
    } | null>(null);
    const [geocoding, setGeocoding] = useState(false);
    const insets = useSafeAreaInsets();
    const mapRef = useRef<MapView>(null);
    const fullscreenMapRef = useRef<MapView>(null);

    // Get initial location
    useEffect(() => {
        (async () => {
            if (initialLatitude && initialLongitude) {
                const loc = { latitude: initialLatitude, longitude: initialLongitude };
                setCurrentLocation(loc);
                setMarkerCoord(loc);
                setLoading(false);
                return;
            }
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    const location = await Location.getCurrentPositionAsync({});
                    const loc = { latitude: location.coords.latitude, longitude: location.coords.longitude };
                    setCurrentLocation(loc);
                    setMarkerCoord(loc);
                } else {
                    const loc = { latitude: 13.6218, longitude: 123.1948 };
                    setCurrentLocation(loc);
                    setMarkerCoord(loc);
                }
            } catch {
                const loc = { latitude: 13.6218, longitude: 123.1948 };
                setCurrentLocation(loc);
                setMarkerCoord(loc);
            }
            setLoading(false);
        })();
    }, []);

    // Handle map press (inline mode)
    const handleMapPress = async (e: MapPressEvent) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        setMarkerCoord({ latitude, longitude });

        // Immediately notify parent with loading state
        onLocationSelect({
            latitude, longitude,
            address: '', barangay: '', landmark: '', fullAddress: '',
        });

        // Reverse geocode
        const result = await reverseGeocodeLocation(latitude, longitude);
        onLocationSelect({
            latitude, longitude,
            address: result.address,
            barangay: result.barangay,
            landmark: result.landmark,
            fullAddress: result.fullAddress,
        });
    };

    // Handle marker drag end (inline mode)
    const handleMarkerDragEnd = async (e: any) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        setMarkerCoord({ latitude, longitude });

        onLocationSelect({
            latitude, longitude,
            address: '', barangay: '', landmark: '', fullAddress: '',
        });

        const result = await reverseGeocodeLocation(latitude, longitude);
        onLocationSelect({
            latitude, longitude,
            address: result.address,
            barangay: result.barangay,
            landmark: result.landmark,
            fullAddress: result.fullAddress,
        });
    };

    // Handle map press (fullscreen mode)
    const handleFullscreenMapPress = async (e: MapPressEvent) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        setTempMarkerCoord({ latitude, longitude });
        setTempAddressInfo(null);
        setGeocoding(true);

        const result = await reverseGeocodeLocation(latitude, longitude);
        setTempAddressInfo(result);
        setGeocoding(false);
    };

    // Handle marker drag end (fullscreen mode)
    const handleFullscreenMarkerDragEnd = async (e: any) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        setTempMarkerCoord({ latitude, longitude });
        setTempAddressInfo(null);
        setGeocoding(true);

        const result = await reverseGeocodeLocation(latitude, longitude);
        setTempAddressInfo(result);
        setGeocoding(false);
    };

    // Confirm fullscreen selection
    const handleConfirmFullscreen = () => {
        if (tempMarkerCoord && tempAddressInfo) {
            onLocationSelect({
                latitude: tempMarkerCoord.latitude,
                longitude: tempMarkerCoord.longitude,
                address: tempAddressInfo.address,
                barangay: tempAddressInfo.barangay,
                landmark: tempAddressInfo.landmark,
                fullAddress: tempAddressInfo.fullAddress,
            });
            setMarkerCoord(tempMarkerCoord);
            setCurrentLocation(tempMarkerCoord);
        }
        setIsFullscreen(false);
    };

    const handleCloseFullscreen = () => {
        setIsFullscreen(false);
        setTempMarkerCoord(null);
        setTempAddressInfo(null);
    };

    const openFullscreen = () => {
        setTempMarkerCoord(markerCoord);
        setTempAddressInfo(null);
        setIsFullscreen(true);
    };

    const openNavigation = (lat: number, lng: number) => {
        const destination = `${lat},${lng}`;
        const appUrl = Platform.select({
            android: `google.navigation:q=${destination}&mode=d`,
            ios: `comgooglemaps://?daddr=${destination}&directionsmode=driving`,
        });
        const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
        if (appUrl) {
            Linking.canOpenURL(appUrl)
                .then((ok) => Linking.openURL(ok ? appUrl : webUrl))
                .catch(() => Linking.openURL(webUrl));
        } else {
            Linking.openURL(webUrl);
        }
    };

    if (loading || !currentLocation || !markerCoord) {
        return (
            <View style={[styles.container, { height }]}>
                <ActivityIndicator size="large" color="#00C853" />
                <Text style={styles.loadingText}>Loading map...</Text>
            </View>
        );
    }

    const region = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        ...DEFAULT_DELTA,
    };

    return (
        <View style={[styles.container, { height }]}>
            {/* Inline Google Map */}
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                initialRegion={region}
                mapType={mapType}
                onPress={handleMapPress}
                showsUserLocation
                showsMyLocationButton={false}
                toolbarEnabled={false}
                scrollEnabled={false}
                zoomEnabled={true}
                rotateEnabled={false}
                pitchEnabled={false}
            >
                <Marker
                    coordinate={markerCoord}
                    draggable
                    onDragEnd={handleMarkerDragEnd}
                    pinColor="#00C853"
                />
            </MapView>

            {/* Tap instruction */}
            <View style={styles.instructionBadge} pointerEvents="none">
                <Text style={styles.instructionText}>📍 Tap on map to select location</Text>
            </View>

            {/* Map Type Toggle */}
            <View style={styles.mapTypeToggle}>
                <TouchableOpacity
                    style={[styles.mapTypeBtn, mapType === 'standard' && styles.mapTypeBtnActive]}
                    onPress={() => setMapType('standard')}
                >
                    <Text style={[styles.mapTypeBtnText, mapType === 'standard' && styles.mapTypeBtnTextActive]}>
                        Default
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.mapTypeBtn, styles.mapTypeBtnLast, mapType === 'hybrid' && styles.mapTypeBtnActive]}
                    onPress={() => setMapType('hybrid')}
                >
                    <Text style={[styles.mapTypeBtnText, mapType === 'hybrid' && styles.mapTypeBtnTextActive]}>
                        Satellite
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Enlarge Button */}
            <TouchableOpacity style={styles.enlargeButton} onPress={openFullscreen}>
                <Maximize2 size={20} color="#fff" />
                <Text style={styles.enlargeText}>Enlarge Map</Text>
            </TouchableOpacity>

            {/* Fullscreen Map Modal */}
            <Modal
                visible={isFullscreen}
                animationType="slide"
                onRequestClose={handleCloseFullscreen}
                statusBarTranslucent
            >
                <View style={styles.modalContainer}>
                    {/* Fullscreen Google Map */}
                    <MapView
                        ref={fullscreenMapRef}
                        style={StyleSheet.absoluteFillObject}
                        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                        initialRegion={{
                            latitude: tempMarkerCoord?.latitude || currentLocation.latitude,
                            longitude: tempMarkerCoord?.longitude || currentLocation.longitude,
                            ...DEFAULT_DELTA,
                        }}
                        mapType={mapType}
                        onPress={handleFullscreenMapPress}
                        showsUserLocation
                        showsMyLocationButton
                    >
                        {tempMarkerCoord && (
                            <Marker
                                coordinate={tempMarkerCoord}
                                draggable
                                onDragEnd={handleFullscreenMarkerDragEnd}
                                pinColor="#00C853"
                            />
                        )}
                    </MapView>

                    {/* Header */}
                    <View style={[styles.modalHeader, { top: insets.top + 8 }]}>
                        <TouchableOpacity onPress={handleCloseFullscreen} style={styles.closeButton}>
                            <X size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Select Location</Text>
                        <TouchableOpacity
                            onPress={handleConfirmFullscreen}
                            style={[styles.confirmButton, !tempAddressInfo && styles.confirmButtonDisabled]}
                            disabled={!tempAddressInfo}
                        >
                            <Check size={20} color="#fff" />
                            <Text style={styles.confirmText}>Confirm</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Map Type Toggle in Fullscreen */}
                    <View style={[styles.fullscreenMapTypeToggle, { top: insets.top + 64 }]}>
                        <TouchableOpacity
                            style={[styles.mapTypeBtn, mapType === 'standard' && styles.mapTypeBtnActive]}
                            onPress={() => setMapType('standard')}
                        >
                            <Text style={[styles.mapTypeBtnText, mapType === 'standard' && styles.mapTypeBtnTextActive]}>
                                Default
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.mapTypeBtn, styles.mapTypeBtnLast, mapType === 'hybrid' && styles.mapTypeBtnActive]}
                            onPress={() => setMapType('hybrid')}
                        >
                            <Text style={[styles.mapTypeBtnText, mapType === 'hybrid' && styles.mapTypeBtnTextActive]}>
                                Satellite
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Location Preview */}
                    {tempMarkerCoord && (
                        <View style={[styles.locationPreview, { bottom: insets.bottom + 16 }]}>
                            <View style={styles.previewRow}>
                                <View style={styles.previewInfo}>
                                    <Text style={styles.coordText}>
                                        {tempMarkerCoord.latitude.toFixed(6)}, {tempMarkerCoord.longitude.toFixed(6)}
                                    </Text>
                                    {geocoding ? (
                                        <ActivityIndicator size="small" color="#00C853" />
                                    ) : tempAddressInfo?.address ? (
                                        <Text numberOfLines={2} style={styles.addressText}>
                                            {tempAddressInfo.address}
                                        </Text>
                                    ) : null}
                                </View>
                                {tempAddressInfo?.address ? (
                                    <TouchableOpacity
                                        style={styles.navigateBtn}
                                        onPress={() => openNavigation(tempMarkerCoord.latitude, tempMarkerCoord.longitude)}
                                    >
                                        <Navigation2 size={18} color="#fff" />
                                        <Text style={styles.navigateBtnText}>Navigate</Text>
                                    </TouchableOpacity>
                                ) : null}
                            </View>
                        </View>
                    )}
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#e8e8e8',
        position: 'relative',
    },
    map: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    loadingText: {
        marginTop: 8,
        color: '#666',
        fontSize: 14,
    },
    instructionBadge: {
        position: 'absolute',
        bottom: 52,
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    instructionText: {
        color: '#fff',
        fontSize: 12,
    },
    mapTypeToggle: {
        position: 'absolute',
        top: 10,
        right: 10,
        flexDirection: 'row',
        borderRadius: 8,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    fullscreenMapTypeToggle: {
        position: 'absolute',
        right: 10,
        flexDirection: 'row',
        borderRadius: 8,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 10,
    },
    mapTypeBtn: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: '#fff',
        borderRightWidth: 1,
        borderRightColor: '#ddd',
    },
    mapTypeBtnLast: {
        borderRightWidth: 0,
    },
    mapTypeBtnActive: {
        backgroundColor: '#2E7D32',
    },
    mapTypeBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
    },
    mapTypeBtnTextActive: {
        color: '#fff',
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
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmButton: {
        backgroundColor: '#00C853',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 24,
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
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
        left: 16,
        right: 16,
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        maxHeight: 120,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
    },
    previewRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    previewInfo: {
        flex: 1,
    },
    coordText: {
        fontSize: 11,
        color: '#666',
        fontFamily: 'monospace',
        marginBottom: 6,
    },
    addressText: {
        fontSize: 13,
        color: '#1a1a1a',
        fontWeight: '500',
        lineHeight: 18,
    },
    navigateBtn: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4285F4',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
        gap: 2,
        minWidth: 70,
    },
    navigateBtnText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
    },
});
