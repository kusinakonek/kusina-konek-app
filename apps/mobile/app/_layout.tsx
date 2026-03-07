import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "react-native";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { FoodCacheProvider } from "../context/FoodCacheContext";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { NotificationProvider, useNotification } from "../context/NotificationContext";
import { NotificationBanner } from "../src/components/NotificationBanner";
import { AlertProvider } from "../context/AlertContext";

function AppContent() {
  const { notification, clearNotification } = useNotification();
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />
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
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AlertProvider>
          <AuthProvider>
            <NotificationProvider>
              <AppContent />
            </NotificationProvider>
          </AuthProvider>
        </AlertProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
