/**
 * Modern Tab Bar Component
 * Full-width tab bar with glow effects and smooth animations
 */
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
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

const TAB_CONFIG: Record<string, { icon: string; label: string }> = {
  index: { icon: "🗺️", label: "Map" },
  wallet: { icon: "💳", label: "Wallet" },
  profile: { icon: "👤", label: "Profile" },
};

export function ModernTabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const scaleAnims = useRef(
    state.routes.map(() => new Animated.Value(1)),
  ).current;

  const handlePress = (route: any, isFocused: boolean, index: number) => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Bounce animation
    Animated.sequence([
      Animated.spring(scaleAnims[index], {
        toValue: 0.9,
        useNativeDriver: true,
        damping: 15,
      }),
      Animated.spring(scaleAnims[index], {
        toValue: 1,
        useNativeDriver: true,
        damping: 15,
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
      style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}
    >
      <BlurView intensity={80} tint="dark" style={styles.container}>
        <View style={styles.tabRow}>
          {state.routes.map((route: any, index: number) => {
            const isFocused = state.index === index;
            const config = TAB_CONFIG[route.name] || {
              icon: "📍",
              label: route.name,
            };

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                onPress={() => handlePress(route, isFocused, index)}
                style={styles.tab}
                activeOpacity={0.7}
              >
                {/* Glow behind active tab */}
                {isFocused && <View style={styles.activeGlow} />}

                {/* Icon */}
                <Animated.View
                  style={[
                    styles.iconContainer,
                    { transform: [{ scale: scaleAnims[index] }] },
                  ]}
                >
                  <Text style={[styles.icon, isFocused && styles.iconActive]}>
                    {config.icon}
                  </Text>
                </Animated.View>

                {/* Label */}
                <Text style={[styles.label, isFocused && styles.labelActive]}>
                  {config.label}
                </Text>
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
    paddingHorizontal: 12,
  },
  container: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(131, 110, 249, 0.3)",
    backgroundColor: "rgba(13, 13, 15, 0.95)",
    ...Platform.select({
      ios: {
        shadowColor: "#836EF9",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabRow: {
    flexDirection: "row",
    height: 70,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    position: "relative",
  },
  activeGlow: {
    position: "absolute",
    top: 8,
    left: "20%",
    right: "20%",
    height: 35,
    backgroundColor: "rgba(131, 110, 249, 0.2)",
    borderRadius: 18,
  },
  iconContainer: {
    marginBottom: 4,
  },
  icon: {
    fontSize: 24,
  },
  iconActive: {
    fontSize: 26,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.5)",
  },
  labelActive: {
    color: "#836EF9",
    fontWeight: "700",
  },
});
