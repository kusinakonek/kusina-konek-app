import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "react-native";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { FoodCacheProvider } from "../context/FoodCacheContext";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { usePushNotifications } from "../src/hooks/usePushNotifications";
import { PushTokenManager } from "../src/components/PushTokenManager";
import { NotificationBanner } from "../src/components/NotificationBanner";
import { AlertProvider } from "../context/AlertContext";

function AppContent() {
  const { expoPushToken, notification, clearNotification } = usePushNotifications();
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />
      <AuthProvider>
        <PushTokenManager token={expoPushToken} />
        <FoodCacheProvider>
          <CartProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
              }}
            />
            <NotificationBanner
              visible={!!notification}
              title={notification?.request?.content?.title || "Notification"}
              message={notification?.request?.content?.body || ""}
              onClose={clearNotification}
            />
          </CartProvider>
        </FoodCacheProvider>
      </AuthProvider>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AlertProvider>
          <AppContent />
        </AlertProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
