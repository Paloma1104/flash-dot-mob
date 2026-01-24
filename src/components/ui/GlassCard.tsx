import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  variant?: 'dark' | 'light' | 'accent';
}

export function GlassCard({ 
  children, 
  style, 
  intensity = 30,
  variant = 'dark' 
}: GlassCardProps) {
  // Gradient colors based on variant
  const getGradientColors = (): [string, string] => {
    switch (variant) {
      case 'dark':
        return ['rgba(30, 30, 40, 0.85)', 'rgba(20, 20, 30, 0.95)'];
      case 'light':
        return ['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.08)'];
      case 'accent':
        return ['rgba(131, 110, 249, 0.20)', 'rgba(80, 60, 180, 0.15)'];
      default:
        return ['rgba(30, 30, 40, 0.85)', 'rgba(20, 20, 30, 0.95)'];
    }
  };

  const getBorderColor = () => {
    switch (variant) {
      case 'accent': return 'rgba(131, 110, 249, 0.3)';
      default: return 'rgba(255, 255, 255, 0.1)';
    }
  };

  return (
    <View style={[styles.container, style, { borderColor: getBorderColor() }]}>
      <BlurView intensity={Math.min(intensity, 50)} tint="dark" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={getGradientColors()}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 24,
    borderWidth: 1,
  },
  content: {
    zIndex: 1,
  },
});
