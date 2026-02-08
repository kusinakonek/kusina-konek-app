import { Tabs } from "expo-router";
import { Home, ShoppingCart, User } from "lucide-react-native";
import { View, Text, StyleSheet } from "react-native";
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

export default function TabLayout() {
  const { role } = useAuth();
  const { items: cartItems } = useCart();
  const isRecipient = role === "RECIPIENT";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#00C853",
        tabBarInactiveTintColor: "#999",
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: "#f0f0f0",
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: '#fff',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
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
        name="my-cart"
        options={{
          title: "My Cart",
          href: isRecipient ? "/(tabs)/my-cart" : null,
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
