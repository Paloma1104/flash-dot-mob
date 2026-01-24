/**
 * Game Loading Skeleton Components
 * Provides visual feedback during game loading with shimmer effects
 */
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, Text, View } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/**
 * Animated shimmer effect for loading states
 */
function useShimmer() {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  return translateX;
}

/**
 * Pulsing circle skeleton for map markers
 */
export function MapMarkerSkeleton({ size = 40 }: { size?: number }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        styles.markerSkeleton,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          transform: [{ scale: pulseAnim }],
        },
      ]}
    />
  );
}

/**
 * Shimmer card skeleton for game list items
 */
export function GameListItemSkeleton() {
  const translateX = useShimmer();

  return (
    <View style={styles.listItemSkeleton}>
      {/* Icon placeholder */}
      <View style={styles.iconPlaceholder} />

      {/* Text content */}
      <View style={styles.textContent}>
        <View style={styles.titlePlaceholder} />
        <View style={styles.subtitlePlaceholder} />
      </View>

      {/* Reward placeholder */}
      <View style={styles.rewardPlaceholder} />

      {/* Shimmer overlay */}
      <Animated.View
        style={[styles.shimmerOverlay, { transform: [{ translateX }] }]}
      >
        <LinearGradient
          colors={["transparent", "rgba(255,255,255,0.1)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

/**
 * Loading badge for header
 */
export function LoadingBadge({
  text = "Syncing...",
  count,
}: {
  text?: string;
  count?: number;
}) {
  const pulseAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <Animated.View style={[styles.loadingBadge, { opacity: pulseAnim }]}>
      <View style={styles.loadingDot} />
      <Text style={styles.loadingText}>
        {count ? `Loading ${count} games...` : text}
      </Text>
    </Animated.View>
  );
}

/**
 * Full-screen loading overlay for initial load
 */
export function GamesLoadingOverlay({ gameCount }: { gameCount?: number }) {
  return (
    <View style={styles.overlay}>
      <LinearGradient
        colors={["rgba(13,13,15,0.9)", "rgba(26,26,46,0.95)"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.overlayContent}>
        <MapMarkerSkeleton size={60} />
        <Text style={styles.overlayTitle}>Loading Games</Text>
        <Text style={styles.overlaySubtitle}>
          {gameCount
            ? `Found ${gameCount} nearby games`
            : "Finding games near you..."}
        </Text>
        <View style={styles.skeletonList}>
          {[0, 1, 2].map((i) => (
            <GameListItemSkeleton key={i} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  markerSkeleton: {
    backgroundColor: "rgba(131, 110, 249, 0.4)",
    borderWidth: 2,
    borderColor: "rgba(131, 110, 249, 0.6)",
  },
  listItemSkeleton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
  },
  iconPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(131, 110, 249, 0.2)",
  },
  textContent: {
    flex: 1,
    marginLeft: 12,
  },
  titlePlaceholder: {
    width: "60%",
    height: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    marginBottom: 8,
  },
  subtitlePlaceholder: {
    width: "40%",
    height: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 6,
  },
  rewardPlaceholder: {
    width: 60,
    height: 24,
    backgroundColor: "rgba(255, 217, 61, 0.1)",
    borderRadius: 12,
  },
  shimmerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
  },
  loadingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(131, 110, 249, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(131, 110, 249, 0.3)",
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#836EF9",
    marginRight: 8,
  },
  loadingText: {
    color: "#A594FF",
    fontSize: 12,
    fontWeight: "600",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  overlayContent: {
    alignItems: "center",
    padding: 20,
  },
  overlayTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 8,
  },
  overlaySubtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    marginBottom: 30,
  },
  skeletonList: {
    width: SCREEN_WIDTH - 40,
  },
});
