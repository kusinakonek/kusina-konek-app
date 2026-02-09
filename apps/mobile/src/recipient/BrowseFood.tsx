import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useCart } from '../../context/CartContext';
import api from '../../lib/api';
import { API_ENDPOINTS } from '../../src/api/endpoints';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ShoppingCart, MapPin } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function BrowseFood() {
    const { addItem, items } = useCart();
    const router = useRouter();
    const [foods, setFoods] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFoods();
    }, []);

    const fetchFoods = async () => {
        try {
            const response = await api.get(API_ENDPOINTS.DISTRIBUTION.GET_AVAILABLE);
            setFoods(response.data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to fetch available foods.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = (item: any) => {
        // Map API item to CartItem structure
        // Assuming item has necessary fields. Adjust mapping based on actual API response.
        const cartItem = {
            disID: item.id,
            donorID: item.donor_id,
            recipientID: null,
            locID: item.location_id || 'loc_1', // Fallback or real data
            foodID: item.food_id || 'food_1',
            quantity: 1, // Default to 1 for now
            status: 'PENDING',
            scheduledTime: new Date().toISOString(),
            timestamp: new Date().toISOString(),
            // food details
            food: {
                foodID: item.food_id || item.id,
                foodName: item.food_name,
                description: item.description,
                image: item.image_url,
                quantity: item.quantity
            },
            location: {
                locID: item.location_id || 'loc_1',
                streetAddress: item.pickup_location,
                barangay: 'Unknown', // fast fix
                latitude: item.latitude || 0,
                longitude: item.longitude || 0
            },
            donor: {
                userID: item.donor_id,
                firstName: 'Donor', // Placeholder if not in response
                lastName: 'Name',
                orgName: null
            }
        };

        addItem(cartItem);
        Alert.alert('Added', `${item.food_name} added to cart!`);
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <Image
                source={{ uri: item.image_url || 'https://via.placeholder.com/150' }}
                style={styles.image}
            />
            <View style={styles.content}>
                <Text style={styles.foodName}>{item.food_name}</Text>
                <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
                <View style={styles.metaRow}>
                    <MapPin size={14} color="#666" />
                    <Text style={styles.metaText}>{item.pickup_location}</Text>
                </View>
                <Text style={styles.quantity}>{item.quantity} {item.unit} available</Text>

                <TouchableOpacity style={styles.addButton} onPress={() => handleAddToCart(item)}>
                    <Text style={styles.addButtonText}>Add to Cart</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Available Food</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/action?screen=Cart')}>
                    <View>
                        <ShoppingCart size={24} color="#333" />
                        {items.length > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{items.length}</Text>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#00C853" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={foods}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No food available right now.</Text>}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', elevation: 2 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    list: { padding: 15 },
    card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, overflow: 'hidden', elevation: 2 },
    image: { width: '100%', height: 150 },
    content: { padding: 15 },
    foodName: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
    description: { color: '#666', marginBottom: 10 },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5, gap: 5 },
    metaText: { color: '#666', fontSize: 13 },
    quantity: { color: '#00C853', fontWeight: 'bold', marginBottom: 10 },
    addButton: { backgroundColor: '#00C853', padding: 10, borderRadius: 8, alignItems: 'center' },
    addButtonText: { color: '#fff', fontWeight: 'bold' },
    badge: { position: 'absolute', top: -5, right: -5, backgroundColor: 'red', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    emptyText: { textAlign: 'center', marginTop: 50, color: '#999' }
});
