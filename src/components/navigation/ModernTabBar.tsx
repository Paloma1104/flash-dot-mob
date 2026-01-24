import { AppIcon, AppIconName } from '@/components/ui/AppIcon';
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '@/constants/DesignTokens';
import * as Haptics from 'expo-haptics';
import React from 'react';
import {
    Animated,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const TAB_CONFIG: Record<string, { icon: AppIconName; label: string }> = {
  index: { icon: 'map', label: 'Map' },
  wallet: { icon: 'wallet', label: 'Wallet' },
  profile: { icon: 'profile', label: 'Profile' },
};

export function ModernTabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const [indicatorAnim] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.spring(indicatorAnim, {
      toValue: state.index,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start();
  }, [state.index]);

  const handlePress = (route: any, isFocused: boolean) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  };

  const tabWidth = 100 / state.routes.length;
  const indicatorTranslateX = indicatorAnim.interpolate({
    inputRange: state.routes.map((_: any, i: number) => i),
    outputRange: state.routes.map((_: any, i: number) => i * (100 / state.routes.length)),
  });

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, SPACING.md),
        },
      ]}
    >
      {/* Active Indicator */}
      <Animated.View
        style={[
          styles.indicator,
          {
            width: `${tabWidth}%`,
            transform: [
              {
                translateX: indicatorTranslateX.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ],
          },
        ]}
      />

      {/* Tabs */}
      <View style={styles.tabRow}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const config = TAB_CONFIG[route.name] || {
            icon: 'map' as AppIconName,
            label: route.name,
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={descriptors[route.key].options.tabBarAccessibilityLabel}
              testID={descriptors[route.key].options.tabBarTestID}
              onPress={() => handlePress(route, isFocused)}
              style={styles.tab}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <AppIcon
                  name={config.icon}
                  size={24}
                  color={isFocused ? COLORS.primary : COLORS.textTertiary}
                />
              </View>
              <Text
                style={[
                  styles.label,
                  isFocused && styles.labelActive,
                ]}
              >
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.backgroundElevated,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  indicator: {
    position: 'absolute',
    top: 0,
    height: 2,
    backgroundColor: COLORS.primary,
  },
  tabRow: {
    flexDirection: 'row',
    height: LAYOUT.tabBarHeight,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.sm,
  },
  iconContainer: {
    marginBottom: SPACING.xs,
  },
  label: {
    ...TYPOGRAPHY.caption2,
    fontWeight: '500',
    color: COLORS.textTertiary,
  },
  labelActive: {
    fontWeight: '600',
    color: COLORS.primary,
  },
});
