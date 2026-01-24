/**
 * Enhanced Floating Tab Bar
 * Premium pill design with glow effects and smooth animations
 */
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const TAB_CONFIG: Record<
  string,
  { icon: string; activeIcon: string; label: string }
> = {
  index: { icon: "🗺️", activeIcon: "🗺️", label: "Map" },
  wallet: { icon: "💳", activeIcon: "💳", label: "Wallet" },
  profile: { icon: "👤", activeIcon: "👤", label: "Profile" },
};

export function ModernTabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const scaleAnims = useRef(
    state.routes.map(() => new Animated.Value(1)),
  ).current;
  const glowAnims = useRef(
    state.routes.map(() => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    // Animate glow on active tab
    state.routes.forEach((_: any, index: number) => {
      const isActive = state.index === index;
      Animated.parallel([
        Animated.spring(glowAnims[index], {
          toValue: isActive ? 1 : 0,
          useNativeDriver: false,
          damping: 15,
        }),
        Animated.spring(scaleAnims[index], {
          toValue: isActive ? 1.1 : 1,
          useNativeDriver: true,
          damping: 15,
        }),
      ]).start();
    });
  }, [state.index]);

  const handlePress = (route: any, isFocused: boolean, index: number) => {
    // Haptic feedback
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Bounce animation
    Animated.sequence([
      Animated.spring(scaleAnims[index], {
        toValue: 0.9,
        useNativeDriver: true,
        damping: 10,
      }),
      Animated.spring(scaleAnims[index], {
        toValue: isFocused ? 1.1 : 1,
        useNativeDriver: true,
        damping: 10,
      }),
    ]).start();

    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  };

  return (
    <View
      style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 20) }]}
    >
      <BlurView intensity={60} tint="dark" style={styles.container}>
        <View style={styles.tabRow}>
          {state.routes.map((route: any, index: number) => {
            const isFocused = state.index === index;
            const config = TAB_CONFIG[route.name] || {
              icon: "📍",
              activeIcon: "📍",
              label: route.name,
            };

            const glowOpacity = glowAnims[index].interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.4],
            });

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                onPress={() => handlePress(route, isFocused, index)}
                style={styles.tab}
                activeOpacity={0.8}
              >
                {/* Glow effect */}
                <Animated.View
                  style={[
                    styles.glow,
                    {
                      opacity: glowOpacity,
                      backgroundColor: "#836EF9",
                    },
                  ]}
                />

                {/* Icon with scale */}
                <Animated.View
                  style={[
                    styles.iconContainer,
                    { transform: [{ scale: scaleAnims[index] }] },
                  ]}
                >
                  <Text style={styles.icon}>
                    {isFocused ? config.activeIcon : config.icon}
                  </Text>
                </Animated.View>

                {/* Label */}
                <Text style={[styles.label, isFocused && styles.labelActive]}>
                  {config.label}
                </Text>

                {/* Active indicator dot */}
                {isFocused && <View style={styles.activeDot} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  container: {
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(131, 110, 249, 0.3)",
    ...Platform.select({
      ios: {
        shadowColor: "#836EF9",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "rgba(13, 13, 15, 0.9)",
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    position: "relative",
  },
  glow: {
    position: "absolute",
    top: -10,
    left: "25%",
    right: "25%",
    height: 40,
    borderRadius: 20,
    transform: [{ scaleX: 1.5 }],
  },
  iconContainer: {
    marginBottom: 4,
  },
  icon: {
    fontSize: 26,
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.5)",
    letterSpacing: 0.5,
  },
  labelActive: {
    color: "#836EF9",
    fontWeight: "700",
  },
  activeDot: {
    position: "absolute",
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#836EF9",
  },
});
