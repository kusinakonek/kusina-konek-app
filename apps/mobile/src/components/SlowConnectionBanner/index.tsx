import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { WifiOff, AlertTriangle, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetwork } from '../../../context/NetworkContext';
import { wp, hp, fp } from '../../utils/responsive';
import { useTheme } from '../../../context/ThemeContext';

export default function SlowConnectionBanner() {
  const { isSlowConnection, isOnline } = useNetwork();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (isSlowConnection && isOnline) {
      Animated.spring(translateY, {
        toValue: insets.top + hp(12),
        useNativeDriver: true,
        bounciness: 12,
      }).start();

      // Auto dismiss after 6 seconds
      const timer = setTimeout(() => {
        hideBanner();
      }, 6000);

      return () => clearTimeout(timer);
    } else {
      hideBanner();
    }
  }, [isSlowConnection, isOnline]);

  const hideBanner = () => {
    Animated.timing(translateY, {
      toValue: -200,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

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
          <AlertTriangle size={fp(24)} color="#FF9800" strokeWidth={2.5} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Slow Connection</Text>
          <Text style={styles.subtitle}>
            Data may take longer to load.
          </Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={hideBanner}>
          <X size={fp(20)} color="#666" />
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
    backgroundColor: '#FFF3E0', // Amber light
    borderRadius: wp(12),
    paddingVertical: hp(12),
    paddingHorizontal: wp(16),
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 152, 0, 0.15)',
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
    color: '#E65100', // Deep amber text
    marginBottom: hp(2),
  },
  subtitle: {
    fontSize: fp(13),
    color: '#F57C00', // Amber text
  },
  closeButton: {
    padding: wp(8),
    marginLeft: wp(8),
  },
});
