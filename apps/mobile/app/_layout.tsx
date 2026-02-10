import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "react-native";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <AuthProvider>
        <CartProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
