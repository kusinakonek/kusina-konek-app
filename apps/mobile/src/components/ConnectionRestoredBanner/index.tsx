import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Wifi, CheckCircle2, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetwork } from '../../../context/NetworkContext';
import { wp, hp, fp } from '../../utils/responsive';
import { useTheme } from '../../../context/ThemeContext';

export default function ConnectionRestoredBanner() {
  const { justReconnected } = useNetwork();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-150)).current;

  useEffect(() => {
    if (justReconnected) {
      Animated.spring(translateY, {
        toValue: insets.top + hp(12),
        useNativeDriver: true,
        bounciness: 12,
      }).start();

      // Auto dismiss after 3 seconds
      const timer = setTimeout(() => {
        hideBanner();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [justReconnected, translateY, insets.top]);

  const hideBanner = () => {
    Animated.timing(translateY, {
      toValue: -150,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      // The network context automatically clears justReconnected after 3s now!
    });
  };

  if (!justReconnected) {
      return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          zIndex: 9999, // Ensure it's above everything
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <CheckCircle2 size={fp(24)} color="#4CAF50" strokeWidth={2.5} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Connection Restored</Text>
          <Text style={styles.subtitle}>
            You are back online.
          </Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={hideBanner}>
          <X size={fp(20)} color="#2E7D32" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: wp(16),
    right: wp(16),
  },
  content: {
    backgroundColor: '#E8F5E9', // Green light
    borderRadius: wp(12),
    paddingVertical: hp(12),
    paddingHorizontal: wp(16),
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  iconContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    width: wp(40),
    height: wp(40),
    borderRadius: wp(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(12),
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: fp(15),
    fontWeight: '700',
    color: '#2E7D32', // Deep green text
    marginBottom: hp(2),
  },
  subtitle: {
    fontSize: fp(13),
    color: '#43A047', // Green text
  },
  closeButton: {
    padding: wp(8),
    marginLeft: wp(8),
  },
});
