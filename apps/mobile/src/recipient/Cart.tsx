import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useCart } from '../../context/CartContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trash2 } from 'lucide-react-native';

export default function Cart() {
    const { items, removeItem, pickUpAll, isPickingUp, clearCart } = useCart();

    const handleCheckout = async () => {
        if (items.length === 0) return;
        await pickUpAll();
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.info}>
                <Text style={styles.name}>{item.food?.foodName || 'Unknown Food'}</Text>
                <Text style={styles.details}>{item.quantity} servings • {item.location?.barangay}</Text>
            </View>
            <TouchableOpacity onPress={() => removeItem(item.disID)} style={styles.removeButton}>
                <Trash2 size={20} color="#FF5252" />
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>My Cart ({items.length})</Text>
                {items.length > 0 && (
                    <TouchableOpacity onPress={clearCart}>
                        <Text style={styles.clearText}>Clear</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={items}
                renderItem={renderItem}
                keyExtractor={item => item.disID}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={styles.emptyText}>Your cart is empty.</Text>}
            />

            {items.length > 0 && (
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.checkoutButton, isPickingUp && styles.disabled]}
                        onPress={handleCheckout}
                        disabled={isPickingUp}
                    >
                        {isPickingUp ? <ActivityIndicator color="#fff" /> : <Text style={styles.checkoutText}>Request All Items</Text>}
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
    title: { fontSize: 20, fontWeight: 'bold' },
    clearText: { color: '#FF5252' },
    list: { padding: 15 },
    card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10 },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: 'bold' },
    details: { color: '#666', marginTop: 4 },
    removeButton: { padding: 8 },
    footer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
    checkoutButton: { backgroundColor: '#00C853', padding: 16, borderRadius: 12, alignItems: 'center' },
    disabled: { opacity: 0.7 },
    checkoutText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    emptyText: { textAlign: 'center', marginTop: 50, color: '#999' }
});
