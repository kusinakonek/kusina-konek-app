import { Tabs } from 'expo-router';
import { Home, User, ShoppingBag, PlusCircle, Search } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { View, Text, StyleSheet } from 'react-native';

export default function TabLayout() {
  const { role } = useAuth();
  const isDonor = role === 'DONOR';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#00C853',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          height: 60,
          paddingBottom: 8, // Adjust for Safe Area if needed, but handled by OS usually
          paddingTop: 8,
          backgroundColor: '#fff',
          elevation: 8, // Android shadow
          shadowColor: '#000', // iOS shadow
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />

      {/* Middle Tab - Dynamic based on Role */}
      <Tabs.Screen
        name="action" // We'll map this to a specific route or handle it
        options={{
          title: isDonor ? 'Donate' : 'Browse',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.middleButtonContainer}>
              <View style={[styles.middleButton, { backgroundColor: isDonor ? '#00C853' : (focused ? '#E8F5E9' : '#fff') }]}>
                {/* Donor has a filled green circle button. Recipient has a standard icon or outlined? 
                            The recipient screenshot shows a simple Box icon (ShoppingBag/Archive) with a badge.
                            Let's stick to the design interpretation:
                            Donor: Big Green Plus/Cutlery
                            Recipient: Search/Box
                         */}
                {isDonor ? (
                  <PlusCircle size={32} color="#fff" />
                ) : (
                  <Search size={24} color={color} />
                )}
              </View>
            </View>
          ),
          // For now, we might need a listener to redirect or a dummy component if we don't have the page yet.
          // But usually this would route to a /browse or /donate page.
          // I'll set href to null and handle press if needed, or just let it go to a placeholder "action" route.
          // Since "action" file doesn't exist, I should probably create it or use a modal.
          // For this scope, I will create a placeholder "action.tsx" to avoid 404.
          tabBarLabel: isDonor ? 'Donate' : 'Browse',
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  middleButtonContainer: {
    top: -10, // Raise it slightly if we want the "floating" effect, or keep inline
    justifyContent: 'center',
    alignItems: 'center',
  },
  middleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    // Shadow for the button
    shadowColor: "#00C853",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
});