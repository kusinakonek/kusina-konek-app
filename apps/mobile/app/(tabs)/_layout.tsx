import { Tabs, router } from "expo-router";
import { Home, ShoppingCart, User, Utensils } from "lucide-react-native";
import { View, Text, StyleSheet, Platform, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useTheme } from "../../context/ThemeContext";
import { wp, hp, fp } from "../../src/utils/responsive";
import LoadingScreen from "../../src/components/LoadingScreen";

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
    <View style={{ alignItems: "center", justifyContent: "center" }}>
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
        <Utensils size={wp(28)} color="#fff" />
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { role, isLoading, isPostLoginLoading, user, loadingSteps, currentLoadingStep, loadingProgress, isLoggingOut, logoutName } = useAuth();
  const { items: cartItems } = useCart();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isDonor = role === "DONOR";
  const isRecipient = role === "RECIPIENT";

  if (isLoggingOut) {
    return <LoadingScreen isLogout logoutName={logoutName} />;
  }

  if (isLoading || isPostLoginLoading || !user) {
    return (
      <LoadingScreen 
        steps={loadingSteps}
        currentStep={currentLoadingStep}
        progress={loadingProgress}
      />
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#00C853",
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          borderTopWidth: 0,
          height:
            Platform.OS === "ios"
              ? hp(85) + insets.bottom
              : hp(65) + insets.bottom,
          paddingBottom:
            Platform.OS === "ios"
              ? hp(25) + insets.bottom
              : hp(8) + insets.bottom,
          paddingTop: hp(8),
          backgroundColor: colors.tabBar,
          elevation: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: fp(11),
          fontWeight: "600",
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
        options={{
          title: "",
          ...(isDonor
            ? {
              tabBarButton: (props) => {
                // Only extract necessary props to avoid type mismatches with spread
                const { accessibilityState, accessibilityLabel, testID } =
                  props;
                return (
                  <TouchableOpacity
                    style={styles.fabContainer}
                    onPress={() => router.push("/donate")}
                    activeOpacity={0.8}
                    accessibilityState={accessibilityState}
                    accessibilityLabel={accessibilityLabel}
                    testID={testID}>
                    <View style={styles.fab}>
                      <Utensils size={wp(28)} color="#fff" />
                    </View>
                  </TouchableOpacity>
                );
              },
            }
            : { href: null }),
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

      {/* Hidden screens — accessible via navigation but not in tab bar */}
      <Tabs.Screen
        name="edit-profile"
        options={{
          title: "Edit Profile",
          href: null,
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: "absolute",
    top: wp(-28),
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  fab: {
    width: wp(56),
    height: wp(56),
    borderRadius: wp(28),
    backgroundColor: "#00C853",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#00C853",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: "#D32F2F",
    borderRadius: wp(10),
    minWidth: wp(18),
    height: wp(18),
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: wp(4),
  },
  badgeText: {
    color: "#fff",
    fontSize: fp(10),
    fontWeight: "700",
  },
});
