import { Tabs, router } from "expo-router";
import { Home, ShoppingCart, User, Utensils } from "lucide-react-native";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

function CartIcon({
  color,
  size,
  badgeCount,
}: {
  color: string;
  size: number;
  badgeCount?: number;
}) {
  return (
    <View>
      <ShoppingCart size={size} color={color} />
      {badgeCount != null && badgeCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {badgeCount > 9 ? "9+" : badgeCount}
          </Text>
        </View>
      )}
    </View>
  );
}

function FloatingActionButton() {
  return (
    <View style={styles.fabContainer} pointerEvents="none">
      <View style={styles.fab}>
        <Utensils size={28} color="#fff" />
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { role } = useAuth();
  const { items: cartItems } = useCart();
  const isDonor = role === "DONOR";
  const isRecipient = role === "RECIPIENT";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#00C853",
        tabBarInactiveTintColor: "#999",
        tabBarStyle: {
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 8,
          paddingTop: 8,
          backgroundColor: '#fff',
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="action"
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push('/(donor)/donate');
          },
        }}
        options={{
          title: "",
          href: isDonor ? "/(tabs)/action" : null,
          tabBarIcon: () => <FloatingActionButton />,
          tabBarLabel: () => null,
        }}
      />

      <Tabs.Screen
        name="my-cart"
        options={{
          title: "Cart",
          href: isRecipient ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <CartIcon color={color} size={size} badgeCount={cartItems.length} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    top: -28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00C853',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: "#D32F2F",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
});
