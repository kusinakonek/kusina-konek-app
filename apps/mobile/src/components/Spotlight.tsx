import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SpotlightProps {
  visible: boolean;
  targetX?: number;
  targetY?: number;
  targetWidth?: number;
  targetHeight?: number;
  borderRadius?: number;
  onBackdropPress?: () => void;
  children?: React.ReactNode;
}

export const Spotlight: React.FC<SpotlightProps> = ({
  visible,
  targetX = 0,
  targetY = 0,
  targetWidth = 100,
  targetHeight = 100,
  borderRadius = 8,
  onBackdropPress,
  children,
}) => {
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      // Pulse animation for the spotlight
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // Infinite repeat
        false
      );
    } else {
      pulseScale.value = 1;
    }
  }, [visible]);

  const spotlightAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseScale.value }],
    };
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onBackdropPress}
    >
      <TouchableWithoutFeedback onPress={onBackdropPress}>
        <View style={styles.container}>
          {/* Dark overlay with hole */}
          <View style={styles.overlayContainer}>
            {/* Top overlay */}
            <View
              style={[
                styles.overlay,
                {
                  height: targetY,
                },
              ]}
            />
            
            {/* Middle row with left, spotlight, and right */}
            <View style={styles.middleRow}>
              {/* Left overlay */}
              <View
                style={[
                  styles.overlay,
                  {
                    width: targetX,
                  },
                ]}
              />
              
              {/* Spotlight area (transparent) */}
              <Animated.View
                style={[
                  {
                    width: targetWidth,
                    height: targetHeight,
                    borderRadius: borderRadius,
                    borderWidth: 4, // Thicker border
                    borderColor: '#00C853', // Use brand color instead of white
                    shadowColor: '#00C853',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 8,
                    elevation: 8,
                  },
                  spotlightAnimatedStyle,
                ]}
              />
              
              {/* Right overlay */}
              <View
                style={[
                  styles.overlay,
                  {
                    flex: 1,
                  },
                ]}
              />
            </View>
            
            {/* Bottom overlay */}
            <View
              style={[
                styles.overlay,
                {
                  flex: 1,
                },
              ]}
            />
          </View>

          {/* Children (e.g., description card) */}
          <TouchableWithoutFeedback>
            <View style={styles.childrenContainer}>
              {children}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  middleRow: {
    flexDirection: 'row',
  },
  childrenContainer: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
});
