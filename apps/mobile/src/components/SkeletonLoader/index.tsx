import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { theme } from "../../constants/theme";

/**
 * A single pulsing skeleton placeholder bar.
 */
function SkeletonBlock({
  width,
  height,
  borderRadius = theme.radius.sm,
  style,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: theme.colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
}

/**
 * Skeleton placeholder that mimics a BrowseFoodCard layout.
 */
function BrowseFoodCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {/* Image placeholder */}
        <SkeletonBlock width={90} height={90} borderRadius={theme.radius.sm} />

        {/* Text placeholders */}
        <View style={styles.info}>
          <SkeletonBlock width="70%" height={16} />
          <SkeletonBlock width="90%" height={12} style={{ marginTop: 6 }} />
          <SkeletonBlock width="50%" height={12} style={{ marginTop: 6 }} />
          <View style={styles.bottomRow}>
            <SkeletonBlock width="30%" height={10} />
            <SkeletonBlock width={72} height={28} borderRadius={20} />
          </View>
        </View>
      </View>
    </View>
  );
}

/**
 * Renders `count` skeleton food cards as a loading placeholder.
 */
export function BrowseFoodSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <BrowseFoodCardSkeleton key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  row: {
    flexDirection: "row",
  },
  info: {
    flex: 1,
    marginLeft: theme.spacing.md,
    justifyContent: "space-between",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
});
