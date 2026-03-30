import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { FoodCacheProvider } from "../context/FoodCacheContext";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { NotificationProvider, useNotification } from "../context/NotificationContext";
import { NotificationBanner } from "../src/components/NotificationBanner";
import { AlertProvider } from "../context/AlertContext";
import NoConnectionModal from "../src/components/NoConnectionModal";

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
      <NoConnectionModal />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
    </GestureHandlerRootView>
  );
}
