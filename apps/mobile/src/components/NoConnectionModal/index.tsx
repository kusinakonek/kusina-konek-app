import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { WifiOff, RefreshCw } from "lucide-react-native";
import { wp, hp, fp } from "../../utils/responsive";
import { theme } from "../../constants/theme";
import { useTheme } from "../../../context/ThemeContext";

export default function NoConnectionModal() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [isChecking, setIsChecking] = useState(false);
  const spinAnim = React.useRef(new Animated.Value(0)).current;
  const { colors, isDark } = useTheme();

  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected && state.isInternetReachable !== false);
    });

    return () => unsubscribe();
  }, []);

  const handleRetry = async () => {
    setIsChecking(true);

    // Spin animation
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      })
    ).start();

    // Check connectivity
    const state = await NetInfo.fetch();
    setIsConnected(state.isConnected && state.isInternetReachable !== false);

    // Stop animation
    spinAnim.stopAnimation();
    spinAnim.setValue(0);
    setIsChecking(false);
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Modal
      visible={isConnected === false}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.card }]}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: isDark
                    ? "rgba(239, 68, 68, 0.2)"
                    : "rgba(239, 68, 68, 0.1)",
                },
              ]}
            >
              <WifiOff
                size={fp(36)}
                color="#EF4444"
                strokeWidth={2.5}
              />
            </View>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>
            No Internet Connection
          </Text>

          {/* Description */}
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            It looks like you're not connected to the internet. Please check your
            Wi-Fi or mobile data and try again.
          </Text>

          {/* Tips */}
          <View
            style={[
              styles.tipsContainer,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(0,0,0,0.03)",
              },
            ]}
          >
            <Text style={[styles.tipItem, { color: colors.textSecondary }]}>
              📶  Turn on Wi-Fi or mobile data
            </Text>
            <Text style={[styles.tipItem, { color: colors.textSecondary }]}>
              ✈️  Turn off Airplane mode
            </Text>
            <Text style={[styles.tipItem, { color: colors.textSecondary }]}>
              🔄  Move closer to your router
            </Text>
          </View>

          {/* Retry Button */}
          <TouchableOpacity
            style={[
              styles.retryButton,
              isChecking && styles.retryButtonChecking,
            ]}
            onPress={handleRetry}
            activeOpacity={0.8}
            disabled={isChecking}
          >
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <RefreshCw size={fp(18)} color="#fff" strokeWidth={2.5} />
            </Animated.View>
            <Text style={styles.retryText}>
              {isChecking ? "Checking..." : "Try Again"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: wp(24),
  },
  container: {
    borderRadius: wp(20),
    padding: wp(28),
    width: "100%",
    maxWidth: wp(360),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: hp(16),
  },
  iconCircle: {
    width: wp(72),
    height: wp(72),
    borderRadius: wp(36),
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: fp(20),
    fontWeight: "700",
    textAlign: "center",
    marginBottom: hp(8),
  },
  description: {
    fontSize: fp(14),
    textAlign: "center",
    lineHeight: fp(21),
    marginBottom: hp(18),
  },
  tipsContainer: {
    borderRadius: wp(12),
    padding: wp(14),
    marginBottom: hp(20),
    gap: hp(8),
  },
  tipItem: {
    fontSize: fp(13),
    lineHeight: fp(18),
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: wp(14),
    paddingVertical: hp(15),
    gap: wp(10),
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonChecking: {
    opacity: 0.8,
  },
  retryText: {
    color: "#fff",
    fontSize: fp(16),
    fontWeight: "700",
  },
});
