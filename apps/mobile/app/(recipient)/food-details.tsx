import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  MessageCircle,
  MapPin,
  Users,
  Clock,
  Navigation,
  AlertCircle,
  Star,
} from 'lucide-react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import axiosClient from '../../src/api/axiosClient';
import { API_ENDPOINTS } from '../../src/api/endpoints';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { Distribution } from '../../context/FoodCacheContext';
import LoadingScreen from '../../src/components/LoadingScreen';

export default function FoodDetails() {
  const { disID } = useLocalSearchParams<{ disID: string }>();
  const [distribution, setDistribution] = useState<Distribution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapRef = useRef<MapView>(null);

  const { colors, isDark } = useTheme();
  const { addItem } = useCart();
  const { user } = useAuth();
  const { showAlert } = useAlert();

  const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.android?.config?.googleMaps?.apiKey || Constants.expoConfig?.ios?.config?.googleMapsApiKey || 'AIzaSyAOVYRIgupAurZup5y1PRh8Ismb1A3lLao';

  // Fetch distribution details
  useEffect(() => {
    const fetchDetails = async () => {
      if (!disID) {
        setError('No distribution ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axiosClient.get(
          API_ENDPOINTS.DISTRIBUTION.GET_BY_ID(disID)
        );
        setDistribution(response.data.distribution);
      } catch (err: any) {
        console.error('Failed to fetch food details:', err);
        setError(err.response?.data?.error || 'Failed to load food details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [disID]);

  const handleAddToCart = () => {
    if (!distribution) return;

    try {
      addItem(distribution);
      showAlert('Success', 'Food added to cart');
    } catch (err: any) {
      showAlert('Error', err.message);
    }
  };

  const handleNavigate = () => {
    if (!distribution?.location) return;
    router.push({
      pathname: '/(recipient)/track/[disID]',
      params: { disID: disID },
    });
  };

  const handleChat = () => {
    if (!disID) return;
    router.push({
      pathname: '/(recipient)/chat',
      params: { disID },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Food Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <LoadingScreen message="Loading food details..." />
      </SafeAreaView>
    );
  }

  if (error || !distribution) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Food Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={(colors as any).error} />
          <Text style={[styles.errorText, { color: (colors as any).error }]}>
            {error || 'Food not found'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const food = distribution.food;
  const location = distribution.location;
  const donor = distribution.donor;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Food Details</Text>
        {distribution?.recipientID === user?.id ? (
          <Pressable onPress={handleChat} style={styles.chatButton}>
            <MessageCircle size={24} color={colors.primary} />
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Food Image */}
        {food?.image && (
          <Image source={{ uri: food.image }} style={styles.foodImage} resizeMode="cover" />
        )}

        {/* Content Container */}
        <View style={styles.content}>
          {/* Food Name */}
          <Text style={[styles.foodName, { color: colors.text }]}>{food?.foodName}</Text>

          {/* Donor Info */}
          {donor && (
            <View style={styles.donorSection}>
              <View style={styles.donorInfo}>
                <Text style={[styles.donorName, { color: colors.textSecondary }]}>
                  by {donor.orgName || `${donor.firstName} ${donor.lastName}`}
                </Text>

                {/* Donor Rating */}
                <View style={styles.ratingContainer}>
                  <Star size={16} color="#FFD700" fill="#FFD700" />
                  <Text style={[styles.ratingText, { color: colors.text }]}>
                    {/* Note: You'll need to add averageRating and ratingCount to donor type */}
                    {(donor as any).averageRating
                      ? `${(donor as any).averageRating.toFixed(1)} (${(donor as any).ratingCount} reviews)`
                      : 'No ratings yet'
                    }
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Description */}
          {food?.description && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
              <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
                {food.description}
              </Text>
            </View>
          )}

          {/* Ingredients */}
          {food?.ingredients && (
            <View style={[styles.section, styles.ingredientsSection, { borderColor: (colors as any).warning }]}>
              <View style={styles.ingredientsHeader}>
                <AlertCircle size={20} color={(colors as any).warning} />
                <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: 8 }]}>
                  Ingredients
                </Text>
              </View>
              <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
                {food.ingredients}
              </Text>
              <Text style={[styles.allergyNote, { color: (colors as any).warning }]}>
                Please check for allergens before requesting
              </Text>
            </View>
          )}

          {/* Details Grid */}
          <View style={styles.detailsGrid}>
            <View style={[styles.detailCard, { backgroundColor: colors.card }]}>
              <Users size={20} color={colors.primary} />
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Servings</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {distribution.quantity}
              </Text>
            </View>

            <View style={[styles.detailCard, { backgroundColor: colors.card }]}>
              <Clock size={20} color={colors.primary} />
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Posted</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {new Date(distribution.timestamp).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {/* Location Section */}
          {location && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Pickup Location</Text>

              <View style={styles.locationInfo}>
                <MapPin size={20} color={colors.primary} />
                <View style={styles.locationText}>
                  <Text style={[styles.addressText, { color: colors.text }]}>
                    {location.streetAddress}
                  </Text>
                  {location.barangay && (
                    <Text style={[styles.barangayText, { color: colors.textSecondary }]}>
                      {location.barangay}
                    </Text>
                  )}
                </View>
              </View>

              {/* Embedded Map */}
              <View style={styles.mapContainer}>
                <MapView
                  ref={mapRef}
                  style={styles.map}
                  provider={PROVIDER_GOOGLE}
                  initialRegion={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  scrollEnabled={true}
                  zoomEnabled={true}
                  pitchEnabled={false}
                  rotateEnabled={false}
                >
                  <Marker
                    coordinate={{
                      latitude: location.latitude,
                      longitude: location.longitude,
                    }}
                    title={food?.foodName}
                    description={location.streetAddress}
                  />
                </MapView>
              </View>

              {/* Navigate Button */}
              <Pressable
                style={[styles.navigateButton, { backgroundColor: colors.primary }]}
                onPress={handleNavigate}
              >
                <Navigation size={20} color="#fff" />
                <Text style={styles.navigateButtonText}>Navigate to Location</Text>
              </Pressable>
            </View>
          )}

          {/* Bottom Spacing */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Add to Cart Button */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Pressable
          style={[styles.addToCartButton, { backgroundColor: (colors as any).success || '#00C853' }]}
          onPress={handleAddToCart}
        >
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  chatButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  scrollContent: {
    flexGrow: 1,
  },
  foodImage: {
    width: '100%',
    height: 300,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  foodName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  donorSection: {
    marginBottom: 20,
  },
  donorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  donorName: {
    fontSize: 14,
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 22,
  },
  ingredientsSection: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 167, 38, 0.1)',
  },
  ingredientsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  allergyNote: {
    fontSize: 12,
    marginTop: 12,
    fontStyle: 'italic',
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  detailCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
  },
  detailLabel: {
    fontSize: 11,
    marginTop: 8,
    textAlign: 'center',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  locationText: {
    marginLeft: 12,
    flex: 1,
  },
  addressText: {
    fontSize: 14,
    fontWeight: '500',
  },
  barangayText: {
    fontSize: 12,
    marginTop: 4,
  },
  mapContainer: {
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  map: {
    flex: 1,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  navigateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  addToCartButton: {
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  addToCartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
