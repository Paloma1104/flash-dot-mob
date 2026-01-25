/**
 * Modern Tab Bar Component
 * Full-width tab bar with glow effects and smooth animations
 */
import { Ionicons } from "@expo/vector-icons";
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

const TAB_CONFIG: Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; label: string }
> = {
  index: { icon: "map", label: "Map" },
  market: { icon: "cart", label: "Market" },
  wallet: { icon: "wallet", label: "Wallet" },
  profile: { icon: "person", label: "Profile" },
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
      style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 20) }]}
    >
      <BlurView intensity={95} tint="dark" style={styles.container}>
        <View style={styles.tabRow}>
          {state.routes.map((route: any, index: number) => {
            const isFocused = state.index === index;
            const config = TAB_CONFIG[route.name] || {
              icon: "ellipse",
              label: route.name,
            };

            const iconName = isFocused
              ? config.icon
              : (`${config.icon}-outline` as any);

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

                <Animated.View
                  style={[
                    styles.iconContainer,
                    { transform: [{ scale: scaleAnims[index] }] },
                  ]}
                >
                  <Ionicons
                    name={iconName}
                    size={24}
                    color={isFocused ? "#FFF" : "rgba(255, 255, 255, 0.5)"}
                  />
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
    left: 20,
    right: 20,
  },
  container: {
    borderRadius: 35,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(20, 20, 25, 0.85)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  tabRow: {
    flexDirection: "row",
    height: 65,
    alignItems: "center",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  activeGlow: {
    position: "absolute",
    width: 50,
    height: 50,
    backgroundColor: "rgba(131, 110, 249, 0.25)",
    borderRadius: 25,
  },
  iconContainer: {
    marginBottom: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.5)",
  },
  labelActive: {
    color: "#FFF",
    fontWeight: "700",
  },
});
