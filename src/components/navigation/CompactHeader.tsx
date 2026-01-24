import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '@/constants/DesignTokens';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CompactHeaderProps {
  title?: string;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  transparent?: boolean;
}

export function CompactHeader({
  title,
  leftContent,
  rightContent,
  transparent = false,
}: CompactHeaderProps) {
  const insets = useSafeAreaInsets();

  const content = (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        {/* Left Section */}
        <View style={styles.section}>
          {leftContent || (
            <Text style={styles.logo}>FLASH.MOB</Text>
          )}
        </View>

        {/* Center Section */}
        {title && (
          <View style={[styles.section, styles.centerSection]}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          </View>
        )}

        {/* Right Section */}
        <View style={[styles.section, styles.rightSection]}>
          {rightContent}
        </View>
      </View>
    </View>
  );

  if (transparent && Platform.OS === 'ios') {
    return (
      <BlurView intensity={80} tint="dark" style={[styles.wrapper, { paddingTop: insets.top }]}>
        {content}
      </BlurView>
    );
  }

  return (
    <View style={[styles.wrapper, styles.solidBackground, { paddingTop: insets.top }]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  solidBackground: {
    backgroundColor: COLORS.backgroundElevated,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  container: {
    height: LAYOUT.headerHeight,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: SPACING.md,
  },
  rightSection: {
    justifyContent: 'flex-end',
  },
  logo: {
    ...TYPOGRAPHY.headline,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  title: {
    ...TYPOGRAPHY.headline,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
});
