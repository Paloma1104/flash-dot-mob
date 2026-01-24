/**
 * Games Counter Badge
 * Premium floating badge showing nearby games count with pulsing animation
 */
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface GamesCounterBadgeProps {
  count: number;
  onPress?: () => void;
}

export function GamesCounterBadge({ count, onPress }: GamesCounterBadgeProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Continuous pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.6,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  if (count === 0) return null;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={styles.wrapper}
    >
      <Animated.View
        style={[styles.container, { transform: [{ scale: pulseAnim }] }]}
      >
        {/* Glow effect */}
        <Animated.View style={[styles.glow, { opacity: glowAnim }]} />

        <BlurView intensity={60} tint="dark" style={styles.blur}>
          <LinearGradient
            colors={["rgba(131, 110, 249, 0.2)", "rgba(0, 217, 255, 0.1)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.content}
          >
            {/* Game icon with glow */}
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🎮</Text>
              <View style={styles.iconGlow} />
            </View>

            {/* Count and label */}
            <View style={styles.textContainer}>
              <View style={styles.countRow}>
                <Text style={styles.count}>{count}</Text>
                <Text style={styles.countLabel}>Games</Text>
              </View>
              <Text style={styles.subtitle}>nearby to play</Text>
            </View>

            {/* Arrow indicator */}
            <View style={styles.arrowContainer}>
              <Text style={styles.arrow}>›</Text>
            </View>
          </LinearGradient>
        </BlurView>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 130, // Above tab bar
    alignSelf: "center",
    zIndex: 100,
  },
  container: {
    borderRadius: 20,
    overflow: "visible",
  },
  glow: {
    position: "absolute",
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 30,
    backgroundColor: "#836EF9",
  },
  blur: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(131, 110, 249, 0.4)",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 14,
  },
  iconContainer: {
    position: "relative",
  },
  icon: {
    fontSize: 28,
  },
  iconGlow: {
    position: "absolute",
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    backgroundColor: "#836EF9",
    borderRadius: 20,
    opacity: 0.3,
  },
  textContainer: {
    flex: 1,
  },
  countRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  count: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  countLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 2,
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(131, 110, 249, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  arrow: {
    fontSize: 22,
    fontWeight: "300",
    color: "#836EF9",
  },
});
