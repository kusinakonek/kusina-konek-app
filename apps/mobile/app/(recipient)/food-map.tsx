import React, { useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Platform,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    Image,
    Animated,
    Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, {
    Marker,
    PROVIDER_GOOGLE,
} from "react-native-maps";
import * as Location from "expo-location";
import { router } from "expo-router";
import {
    ArrowLeft,
    ShoppingCart,
    MapPin,
    LocateFixed,
    User,
    X,
} from "lucide-react-native";
import { useFoodCache, Distribution } from "../../context/FoodCacheContext";
import { useCart } from "../../context/CartContext";
import { useTheme } from "../../context/ThemeContext";
import { theme } from "../../src/constants/theme";
import { wp, hp, fp } from "../../src/utils/responsive";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const NAGA_CITY = {
    latitude: 13.6218,
    longitude: 123.1948,
    latitudeDelta: 0.04,
    longitudeDelta: 0.04,
};

export default function FoodMap() {
    const mapRef = useRef<MapView | null>(null);
    const { distributions, loading, fetchDistributions } = useFoodCache();
    const { items: cartItems, addItem } = useCart();
    const { colors, isDark } = useTheme();

    const [userLocation, setUserLocation] = useState<{
        latitude: number;
        longitude: number;
    } | null>(null);
    const [initialRegion, setInitialRegion] = useState(NAGA_CITY);
    const [mapReady, setMapReady] = useState(false);

    // Selected marker → bottom panel
    const [selectedFood, setSelectedFood] = useState<Distribution | null>(null);
    const slideAnim = useRef(new Animated.Value(300)).current;

    // Show bottom panel with animation
    const showPanel = (d: Distribution) => {
        setSelectedFood(d);
        Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 80,
            friction: 12,
        }).start();
    };

    // Hide bottom panel
    const hidePanel = () => {
        Animated.timing(slideAnim, {
            toValue: 300,
            duration: 200,
            useNativeDriver: true,
        }).start(() => setSelectedFood(null));
    };

    // Get user location and fetch distributions
    useEffect(() => {
        const init = async () => {
            try {
                const { status } =
                    await Location.requestForegroundPermissionsAsync();
                if (status === "granted") {
                    const loc = await Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.Balanced,
                    });
                    const userCoords = {
                        latitude: loc.coords.latitude,
                        longitude: loc.coords.longitude,
                    };
                    setUserLocation(userCoords);
                    setInitialRegion({
                        ...userCoords,
                        latitudeDelta: 0.04,
                        longitudeDelta: 0.04,
                    });
                    await fetchDistributions(
                        false,
                        userCoords.latitude,
                        userCoords.longitude,
                    );
                } else {
                    await fetchDistributions(false);
                }
            } catch (e) {
                console.log("Location error:", e);
                await fetchDistributions(false);
            }
        };
        init();
    }, []);

    // Filter distributions that have valid coordinates
    const mappableDistributions = distributions.filter(
        (d) =>
            d.location &&
            typeof d.location.latitude === "number" &&
            typeof d.location.longitude === "number" &&
            d.location.latitude !== 0 &&
            d.location.longitude !== 0,
    );

    // Get donor display name
    const getDonorName = (d: Distribution) => {
        if (!d.donor) return "Anonymous Donor";
        if (d.donor.orgName) return d.donor.orgName;
        return (
            `${d.donor.firstName ?? ""} ${d.donor.lastName ?? ""}`.trim() ||
            "Anonymous Donor"
        );
    };

    const handleAddToCart = (distribution: Distribution) => {
        const alreadyInCart = cartItems.some(
            (i) => i.disID === distribution.disID,
        );
        if (alreadyInCart) {
            Alert.alert("Already in Cart", "This food is already in your cart.");
            return;
        }
        addItem(distribution);
        Alert.alert(
            "Added to Cart",
            `${distribution.food?.foodName ?? "Food"} has been added to your cart.`,
        );
    };



    const handleRecenter = () => {
        const target = userLocation || {
            latitude: NAGA_CITY.latitude,
            longitude: NAGA_CITY.longitude,
        };
        mapRef.current?.animateToRegion(
            { ...target, latitudeDelta: 0.04, longitudeDelta: 0.04 },
            600,
        );
    };

    const handleFitMarkers = () => {
        if (mappableDistributions.length === 0) return;
        const coords = mappableDistributions.map((d) => ({
            latitude: d.location!.latitude,
            longitude: d.location!.longitude,
        }));
        if (userLocation) coords.push(userLocation);
        mapRef.current?.fitToCoordinates(coords, {
            edgePadding: { top: 80, right: 60, bottom: 80, left: 60 },
            animated: true,
        });
    };

    return (
        <SafeAreaView
            style={[styles.safeArea, { backgroundColor: colors.background }]}
            edges={["top"]}>
            {/* Header */}
            <View
                style={[
                    styles.header,
                    {
                        backgroundColor: colors.headerBg,
                        borderBottomColor: colors.border,
                    },
                ]}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                    accessibilityRole="button"
                    accessibilityLabel="Go back">
                    <ArrowLeft size={wp(24)} color={colors.text} />
                </TouchableOpacity>

                <View style={styles.headerTitleContainer}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>
                        Food Map
                    </Text>
                    <Text
                        style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                        {mappableDistributions.length} available nearby
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.cartButton}
                    onPress={() => router.push("/(tabs)/my-cart")}
                    accessibilityRole="button"
                    accessibilityLabel="Cart">
                    <View>
                        <ShoppingCart size={wp(24)} color={theme.colors.primary} />
                        {cartItems.length > 0 && (
                            <View style={styles.cartBadge}>
                                <Text style={styles.cartBadgeText}>
                                    {cartItems.length > 9 ? "9+" : cartItems.length}
                                </Text>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
            </View>

            {/* Map */}
            <View style={styles.mapContainer}>
                {loading && !mapReady ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text
                            style={[styles.loadingText, { color: colors.textSecondary }]}>
                            Loading food locations...
                        </Text>
                    </View>
                ) : (
                    <MapView
                        ref={mapRef}
                        style={styles.map}
                        provider={
                            Platform.OS === "android" ? PROVIDER_GOOGLE : undefined
                        }
                        initialRegion={initialRegion}
                        showsUserLocation
                        showsMyLocationButton={false}
                        onPress={() => {
                            if (selectedFood) hidePanel();
                        }}
                        onMapReady={() => {
                            setMapReady(true);
                            setTimeout(() => handleFitMarkers(), 500);
                        }}>
                        {mappableDistributions.map((d) => (
                            <Marker
                                key={d.disID}
                                coordinate={{
                                    latitude: d.location!.latitude,
                                    longitude: d.location!.longitude,
                                }}
                                pinColor={
                                    selectedFood?.disID === d.disID ? "#FF6D00" : "#00C853"
                                }
                                onPress={() => showPanel(d)}
                            />
                        ))}
                    </MapView>
                )}

                {/* FABs */}
                {mapReady && (
                    <View style={styles.fabContainer}>
                        <TouchableOpacity
                            style={[styles.fab, { backgroundColor: colors.background }]}
                            onPress={handleRecenter}>
                            <LocateFixed size={22} color={theme.colors.primary} />
                        </TouchableOpacity>

                        {mappableDistributions.length > 0 && (
                            <TouchableOpacity
                                style={[styles.fab, { backgroundColor: colors.background }]}
                                onPress={handleFitMarkers}>
                                <MapPin size={22} color={theme.colors.primary} />
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Food Count Badge */}
                {mapReady && !selectedFood && (
                    <View style={styles.countBadge}>
                        <MapPin size={14} color="#fff" />
                        <Text style={styles.countBadgeText}>
                            {mappableDistributions.length} food
                            {mappableDistributions.length !== 1 ? "s" : ""} available
                        </Text>
                    </View>
                )}

                {/* ── Bottom Detail Panel ── */}
                {selectedFood && (
                    <Animated.View
                        style={[
                            styles.panel,
                            { backgroundColor: colors.card, transform: [{ translateY: slideAnim }] },
                        ]}>
                        {/* Close Button */}
                        <TouchableOpacity style={styles.panelClose} onPress={hidePanel}>
                            <X size={20} color={colors.textSecondary} />
                        </TouchableOpacity>

                        <View style={styles.panelContent}>
                            {/* Food Image */}
                            <Image
                                source={
                                    selectedFood.food?.image
                                        ? { uri: selectedFood.food.image }
                                        : require("../../assets/KusinaKonek-Logo.png")
                                }
                                style={styles.panelImage}
                                resizeMode="cover"
                            />

                            {/* Info */}
                            <View style={styles.panelInfo}>
                                <Text
                                    style={[styles.panelTitle, { color: colors.text }]}
                                    numberOfLines={1}>
                                    {selectedFood.food?.foodName ?? "Unknown Food"}
                                </Text>

                                {/* Servings */}
                                <Text
                                    style={[
                                        styles.panelMeta,
                                        { color: colors.textSecondary },
                                    ]}>
                                    🍽️ {selectedFood.quantity} servings
                                </Text>

                                {/* Donor */}
                                <View style={styles.panelRow}>
                                    <User size={13} color={colors.textSecondary} />
                                    <Text
                                        style={[
                                            styles.panelMeta,
                                            { color: colors.textSecondary },
                                        ]}
                                        numberOfLines={1}>
                                        {getDonorName(selectedFood)}
                                    </Text>
                                </View>

                                {/* Location */}
                                <View style={styles.panelRow}>
                                    <MapPin size={13} color={colors.textSecondary} />
                                    <Text
                                        style={[
                                            styles.panelMeta,
                                            { color: colors.textSecondary },
                                        ]}
                                        numberOfLines={1}>
                                        {selectedFood.location?.barangay ?? "Unknown"}
                                    </Text>
                                </View>

                                {/* Distance */}
                                {selectedFood.distanceKm != null && (
                                    <View style={styles.panelRow}>
                                        <MapPin size={13} color="#2E7D32" />
                                        <Text style={[styles.panelMeta, { color: "#2E7D32", fontWeight: "600" }]}>
                                            {selectedFood.distanceKm < 1
                                                ? `${Math.round(selectedFood.distanceKm * 1000)}m away`
                                                : `${selectedFood.distanceKm.toFixed(1)}km away`}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Action Button */}
                        <View style={styles.panelActions}>
                            <TouchableOpacity
                                style={styles.panelCartButton}
                                onPress={() => handleAddToCart(selectedFood)}
                                activeOpacity={0.8}>
                                <ShoppingCart size={18} color="#fff" />
                                <Text style={styles.panelCartButtonText}>Add to Cart</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: wp(theme.spacing.md),
        paddingVertical: hp(theme.spacing.sm),
        borderBottomWidth: 1,
    },
    backButton: {
        width: wp(40),
        height: wp(40),
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitleContainer: {
        flex: 1,
        marginLeft: wp(theme.spacing.sm),
    },
    headerTitle: {
        fontSize: fp(20),
        fontWeight: "700",
    },
    headerSubtitle: {
        fontSize: fp(13),
        marginTop: hp(1),
    },
    cartButton: {
        width: wp(44),
        height: wp(44),
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(46, 125, 50, 0.1)",
        borderRadius: wp(12),
        borderWidth: 1,
        borderColor: "rgba(46, 125, 50, 0.2)",
    },
    cartBadge: {
        position: "absolute",
        top: -4,
        right: -8,
        backgroundColor: "#D32F2F",
        borderRadius: wp(10),
        minWidth: wp(18),
        height: wp(18),
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: wp(4),
    },
    cartBadgeText: {
        color: "#fff",
        fontSize: fp(10),
        fontWeight: "700",
    },
    mapContainer: {
        flex: 1,
        position: "relative",
    },
    map: {
        flex: 1,
        width: "100%",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: hp(12),
    },
    loadingText: {
        fontSize: fp(14),
    },

    // FABs
    fabContainer: {
        position: "absolute",
        right: 16,
        bottom: 80,
        gap: 12,
    },
    fab: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },

    // Count Badge
    countBadge: {
        position: "absolute",
        bottom: 24,
        alignSelf: "center",
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "rgba(0,0,0,0.75)",
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    countBadgeText: {
        color: "#fff",
        fontSize: 13,
        fontWeight: "600",
    },

    // ── Bottom Panel ──
    panel: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 12,
        paddingBottom: Platform.OS === "ios" ? 34 : 20,
        paddingHorizontal: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 12,
    },
    panelClose: {
        position: "absolute",
        top: 12,
        right: 14,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "rgba(0,0,0,0.06)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10,
    },
    panelContent: {
        flexDirection: "row",
        marginTop: 4,
    },
    panelImage: {
        width: 90,
        height: 90,
        borderRadius: 12,
        backgroundColor: "#f0f0f0",
    },
    panelInfo: {
        flex: 1,
        marginLeft: 14,
        justifyContent: "center",
    },
    panelTitle: {
        fontSize: 17,
        fontWeight: "700",
        marginBottom: 4,
    },
    panelRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        marginTop: 2,
    },
    panelMeta: {
        fontSize: 13,
    },
    panelActions: {
        flexDirection: "row",
        gap: 10,
        marginTop: 14,
    },
    panelCartButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#00C853",
        borderRadius: 12,
        paddingVertical: 13,
        gap: 8,
    },
    panelCartButtonText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "700",
    },
    panelNavButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#2196F3",
        borderRadius: 12,
        paddingVertical: 13,
        gap: 8,
    },
    panelNavButtonText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "700",
    },
});
