import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "react-native";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { FoodCacheProvider } from "../context/FoodCacheContext";
import { usePushNotifications } from "../src/hooks/usePushNotifications";
import { NotificationBanner } from "../src/components/NotificationBanner";
import { PushTokenManager } from "../src/components/PushTokenManager";

export default function RootLayout() {
  const { expoPushToken, notification, clearNotification } = usePushNotifications();

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <AuthProvider>
        <PushTokenManager token={expoPushToken} />
        <FoodCacheProvider>
          <CartProvider>
            <Stack screenOptions={{ headerShown: false }} />
            <NotificationBanner
              visible={!!notification}
              title={notification?.request.content.title || ''}
              message={notification?.request.content.body || ''}
              onClose={clearNotification}
            />
          </CartProvider>
        </FoodCacheProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
