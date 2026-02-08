import { Tabs } from 'expo-router';
import { Home, User, ShoppingBag, PlusCircle, Search, Utensils } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { View, Text, StyleSheet, Platform, Image } from 'react-native';

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
          height: Platform.OS === 'android' ? 65 : 85,
          paddingBottom: Platform.OS === 'android' ? 10 : 28,
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
        name="action"
        options={{
          title: isDonor ? 'Donate' : 'Browse',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.middleButtonContainer}>
              <View style={[styles.middleButton, { backgroundColor: '#00C853' }]}>
                {isDonor ? (
                  <Utensils size={28} color="#fff" />
                ) : (
                  <Image
                    source={require('../../assets/MyCart.png')}
                    style={{ width: 28, height: 28, tintColor: '#fff' }}
                  />
                )}
              </View>
            </View>
          ),
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
    top: -16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  middleButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00C853',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
});