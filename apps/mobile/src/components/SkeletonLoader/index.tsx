import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  useWindowDimensions,
} from "react-native";
import { theme } from "../../constants/theme";
import { wp, hp, fp } from "../../utils/responsive";

/**
 * Animated shimmer block used as a placeholder while content loads.
 */
const ShimmerBlock = ({
  width,
  height,
  borderRadius = 8,
  style,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: "#E8E8E8",
          opacity,
        },
        style,
      ]}
    />
  );
};

/**
 * Skeleton card that mimics a BrowseFoodCard while data is loading.
 */
export const FoodCardSkeleton = () => {
  const { width } = useWindowDimensions();
  const cardPadding = wp(16);

  return (
    <View style={skeletonStyles.card}>
      {/* Image placeholder */}
      <ShimmerBlock width="100%" height={width * 0.35} borderRadius={wp(12)} />

      <View style={{ padding: cardPadding, gap: hp(8) }}>
        {/* Title */}
        <ShimmerBlock width="65%" height={hp(18)} borderRadius={4} />
        {/* Description */}
        <ShimmerBlock width="90%" height={hp(14)} borderRadius={4} />
        {/* Meta row */}
        <View style={{ flexDirection: "row", gap: wp(12), marginTop: hp(4) }}>
          <ShimmerBlock width={wp(80)} height={hp(14)} borderRadius={4} />
          <ShimmerBlock width={wp(70)} height={hp(14)} borderRadius={4} />
        </View>
        {/* Button */}
        <ShimmerBlock
          width="100%"
          height={hp(42)}
          borderRadius={wp(10)}
          style={{ marginTop: hp(8) }}
        />
      </View>
    </View>
  );
};

/**
 * Shows multiple skeleton cards as a loading placeholder for browse food list.
 */
export const BrowseFoodSkeleton = ({ count = 3 }: { count?: number }) => {
  return (
    <View style={skeletonStyles.container}>
      {Array.from({ length: count }).map((_, i) => (
        <FoodCardSkeleton key={i} />
      ))}
    </View>
  );
};

/**
 * Skeleton card
 */
export const RecentFoodCardSkeleton = () => {
  return (
    <View style={skeletonStyles.recentCard}>
      {/* Header: title + status badge */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: hp(8),
        }}>
        <View style={{ flex: 1, gap: hp(4) }}>
          <ShimmerBlock width="60%" height={hp(16)} borderRadius={4} />
          <ShimmerBlock width="35%" height={hp(14)} borderRadius={4} />
        </View>
        <ShimmerBlock width={wp(70)} height={hp(22)} borderRadius={wp(11)} />
      </View>
      {/* Location row */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: wp(6),
          marginBottom: hp(8),
        }}>
        <ShimmerBlock width={wp(14)} height={hp(14)} borderRadius={7} />
        <ShimmerBlock width="50%" height={hp(14)} borderRadius={4} />
      </View>
      {/* Footer: time */}
      <ShimmerBlock width="30%" height={hp(12)} borderRadius={4} />
    </View>
  );
};

/**
 * Shows multiple skeleton cards as a loading placeholder for recent food list.
 */
export const RecentFoodSkeleton = ({ count = 3 }: { count?: number }) => {
  return (
    <View style={skeletonStyles.recentContainer}>
      {/* Section header skeleton */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: hp(16),
        }}>
        <ShimmerBlock width="45%" height={hp(18)} borderRadius={4} />
        <ShimmerBlock width={wp(50)} height={hp(14)} borderRadius={4} />
      </View>
      {Array.from({ length: count }).map((_, i) => (
        <RecentFoodCardSkeleton key={i} />
      ))}
    </View>
  );
};

/**
 * Generic stat card skeleton for dashboard stats.
 */
export const DashboardStatsSkeleton = ({ count = 3 }: { count?: number }) => {
  return (
    <View style={skeletonStyles.statsRow}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={skeletonStyles.statCard}>
          <ShimmerBlock width={wp(48)} height={wp(48)} borderRadius={wp(16)} />
          <ShimmerBlock
            width={wp(40)}
            height={hp(20)}
            borderRadius={4}
            style={{ marginTop: hp(12) }}
          />
          <ShimmerBlock
            width={wp(55)}
            height={hp(12)}
            borderRadius={4}
            style={{ marginTop: hp(6) }}
          />
        </View>
      ))}
    </View>
  );
};

const skeletonStyles = StyleSheet.create({
  container: {
    gap: hp(16),
    paddingBottom: hp(24),
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: wp(16),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: wp(12),
    marginBottom: hp(24),
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: wp(16),
    borderRadius: wp(16),
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  recentContainer: {
    marginTop: hp(24),
  },
  recentCard: {
    backgroundColor: "#fff",
    borderRadius: wp(16),
    padding: wp(16),
    borderWidth: 1,
    borderColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: hp(16),
  },
});

export { ShimmerBlock };
