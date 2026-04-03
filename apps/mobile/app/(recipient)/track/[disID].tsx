import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { LocateFixed, MessageCircle, ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useAlert } from '../../../context/AlertContext';
import axiosClient from '../../../src/api/axiosClient';
import { API_ENDPOINTS } from '../../../src/api/endpoints';
import LoadingScreen from '../../../src/components/LoadingScreen';

export default function TrackFoodScreen() {
    const { disID } = useLocalSearchParams<{ disID: string }>();
    const router = useRouter();
    const mapRef = useRef<MapView>(null);
    const { colors } = useTheme();
    const { showAlert } = useAlert();

    const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [destination, setDestination] = useState<{ latitude: number; longitude: number } | null>(null);
    const [loading, setLoading] = useState(true);

    const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.android?.config?.googleMaps?.apiKey || Constants.expoConfig?.ios?.config?.googleMapsApiKey || 'AIzaSyAOVYRIgupAurZup5y1PRh8Ismb1A3lLao';

    useEffect(() => {
        const init = async () => {
            try {
                // Fetch distribution location
                const res = await axiosClient.get(API_ENDPOINTS.DISTRIBUTION.GET_BY_ID(disID));
                const loc = res.data.distribution.location;
                if (!loc || !loc.latitude || !loc.longitude) {
                    throw new Error("No location found");
                }
                setDestination({ latitude: loc.latitude, longitude: loc.longitude });

                // Start location tracking
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    showAlert('Permission Denied', 'Location permission is required for live tracking.');
                    setLoading(false);
                    return;
                }

                const initialLoc = await Location.getCurrentPositionAsync({});
                setUserLocation({
                    latitude: initialLoc.coords.latitude,
                    longitude: initialLoc.coords.longitude,
                });
                
                const sub = await Location.watchPositionAsync(
                    { accuracy: Location.Accuracy.High, distanceInterval: 10 },
                    (locData) => {
                        setUserLocation({
                            latitude: locData.coords.latitude,
                            longitude: locData.coords.longitude,
                        });
                    }
                );
                setLocationSubscription(sub);
            } catch (err: any) {
                console.error("Tracking init error:", err);
                showAlert('Error', err.message || 'Failed to initialize tracking');
            } finally {
                setLoading(false);
            }
        };
        init();

        return () => {
            if (locationSubscription) {
                locationSubscription.remove();
            }
        };
    }, [disID]);

    const handleRecenter = () => {
        if (!userLocation || !destination) return;
        mapRef.current?.fitToCoordinates([userLocation, destination], {
            edgePadding: { top: 100, right: 60, bottom: 100, left: 60 },
            animated: true,
        });
    };

    const handleChat = () => {
        router.push({
            pathname: '/(recipient)/chat',
            params: { disID },
        });
    };

    if (loading || !destination) {
      return <LoadingScreen message="Starting tracker..." />;
    }

    // Google Maps Default Dark Theme JSON to replicate premium dark maps
    const darkMapStyle = [
      {
        "elementType": "geometry",
        "stylers": [
          { "color": "#242f3e" }
        ]
      },
      {
        "elementType": "labels.text.fill",
        "stylers": [
          { "color": "#746855" }
        ]
      },
      {
        "elementType": "labels.text.stroke",
        "stylers": [
          { "color": "#242f3e" }
        ]
      },
      {
        "featureType": "administrative.locality",
        "elementType": "labels.text.fill",
        "stylers": [
          { "color": "#d59563" }
        ]
      },
      {
        "featureType": "poi",
        "elementType": "labels.text.fill",
        "stylers": [
          { "color": "#d59563" }
        ]
      },
      {
        "featureType": "poi.park",
        "elementType": "geometry",
        "stylers": [
          { "color": "#263c3f" }
        ]
      },
      {
        "featureType": "poi.park",
        "elementType": "labels.text.fill",
        "stylers": [
          { "color": "#6b9a76" }
        ]
      },
      {
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [
          { "color": "#38414e" }
        ]
      },
      {
        "featureType": "road",
        "elementType": "geometry.stroke",
        "stylers": [
          { "color": "#212a37" }
        ]
      },
      {
        "featureType": "road",
        "elementType": "labels.text.fill",
        "stylers": [
          { "color": "#9ca5b3" }
        ]
      },
      {
        "featureType": "road.highway",
        "elementType": "geometry",
        "stylers": [
          { "color": "#746855" }
        ]
      },
      {
        "featureType": "road.highway",
        "elementType": "geometry.stroke",
        "stylers": [
          { "color": "#1f2835" }
        ]
      },
      {
        "featureType": "road.highway",
        "elementType": "labels.text.fill",
        "stylers": [
          { "color": "#f3d19c" }
        ]
      },
      {
        "featureType": "transit",
        "elementType": "geometry",
        "stylers": [
          { "color": "#2f3948" }
        ]
      },
      {
        "featureType": "transit.station",
        "elementType": "labels.text.fill",
        "stylers": [
          { "color": "#d59563" }
        ]
      },
      {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [
          { "color": "#17263c" }
        ]
      },
      {
        "featureType": "water",
        "elementType": "labels.text.fill",
        "stylers": [
          { "color": "#515c6d" }
        ]
      },
      {
        "featureType": "water",
        "elementType": "labels.text.stroke",
        "stylers": [
          { "color": "#17263c" }
        ]
      }
    ];

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                customMapStyle={darkMapStyle}
                initialRegion={{
                    latitude: destination.latitude,
                    longitude: destination.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
                showsUserLocation={false} 
                showsMyLocationButton={false}
            >
                <Marker
                    coordinate={destination}
                    title="Food Location"
                    pinColor="red"
                />

                {userLocation && (
                    <Marker
                        coordinate={userLocation}
                        title="You"
                        pinColor="blue"
                    />
                )}

                {userLocation && (
                    <MapViewDirections
                        origin={userLocation}
                        destination={destination}
                        apikey={GOOGLE_MAPS_API_KEY}
                        strokeWidth={6}
                        strokeColor="#00BFFF" 
                        onReady={(result) => {
                            mapRef.current?.fitToCoordinates(result.coordinates, {
                                edgePadding: { top: 100, right: 60, bottom: 100, left: 60 },
                                animated: true,
                            });
                        }}
                    />
                )}
            </MapView>

            <TouchableOpacity 
                style={[styles.backButton, { backgroundColor: colors.card }]} 
                onPress={() => router.back()}
            >
                <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.chatButton, { backgroundColor: '#1877F2' }]} 
                onPress={handleChat}
            >
                <MessageCircle size={30} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.recenterButton, { backgroundColor: colors.card }]} 
                onPress={handleRecenter}
            >
                <LocateFixed size={20} color={colors.text} />
                <Text style={[styles.recenterText, { color: colors.text }]}>Re-center</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    chatButton: {
        position: 'absolute',
        top: '50%',
        right: 16,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ translateY: -30 }],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    recenterButton: {
        position: 'absolute',
        bottom: 50,
        left: 20,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    recenterText: {
        marginLeft: 8,
        fontWeight: '700',
        fontSize: 16,
    },
});
