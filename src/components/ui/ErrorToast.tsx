/**
 * Error Toast Component
 * Sliding notification for errors/success messages
 */
import { BlurView } from "expo-blur";
import { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ToastProps {
  visible: boolean;
  message: string;
  type?: "error" | "success" | "info" | "warning";
  duration?: number;
  onDismiss: () => void;
}

const TOAST_ICONS: Record<string, string> = {
  error: "❌",
  success: "✅",
  info: "ℹ️",
  warning: "⚠️",
};

const TOAST_COLORS: Record<string, { bg: string; border: string }> = {
  error: { bg: "rgba(239, 68, 68, 0.15)", border: "#EF4444" },
  success: { bg: "rgba(6, 255, 165, 0.15)", border: "#06FFA5" },
  info: { bg: "rgba(0, 217, 255, 0.15)", border: "#00D9FF" },
  warning: { bg: "rgba(255, 217, 61, 0.15)", border: "#FFD93D" },
};

export function ErrorToast({
  visible,
  message,
  type = "error",
  duration = 5000,
  onDismiss,
}: ToastProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 15,
          stiffness: 200,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss
      if (duration > 0) {
        const timer = setTimeout(() => {
          dismissToast();
        }, duration);
        return () => clearTimeout(timer);
      }
    }
    return undefined;
  }, [visible]);

  const dismissToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss());
  };

  if (!visible) return null;

  const colors = TOAST_COLORS[type] || TOAST_COLORS.error;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 10,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <BlurView intensity={80} tint="dark" style={styles.blur}>
        <View
          style={[
            styles.content,
            { backgroundColor: colors!.bg, borderColor: colors!.border },
          ]}
        >
          <Text style={styles.icon}>{TOAST_ICONS[type]}</Text>
          <Text style={styles.message} numberOfLines={3}>
            {message}
          </Text>
          <TouchableOpacity onPress={dismissToast} style={styles.dismissButton}>
            <Text style={styles.dismissText}>✕</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </Animated.View>
  );
}

// Global toast state management
let toastCallback: ((toast: { message: string; type: string }) => void) | null =
  null;

export function setToastHandler(
  callback: (toast: { message: string; type: string }) => void,
) {
  toastCallback = callback;
}

export function showToast(
  message: string,
  type: "error" | "success" | "info" | "warning" = "error",
) {
  if (toastCallback) {
    toastCallback({ message, type });
  }
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  blur: {
    borderRadius: 16,
    overflow: "hidden",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  icon: {
    fontSize: 20,
  },
  message: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  dismissButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  dismissText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    fontWeight: "600",
  },
});
