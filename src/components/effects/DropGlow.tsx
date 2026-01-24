import { Blur, Canvas, Circle, Group, Shadow } from '@shopify/react-native-skia';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

interface DropGlowProps {
  size?: number;
  color?: string;
  isNearby?: boolean;
  isInRange?: boolean;
}

/**
 * Skia-powered glow effect for drop markers
 * - Default: subtle purple glow
 * - Nearby: pulsing cyan glow
 * - In range: intense animated glow
 */
export function DropGlow({
  size = 60,
  color = '#836EF9',
  isNearby = false,
  isInRange = false,
}: DropGlowProps) {
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.6);

  useEffect(() => {
    if (isInRange) {
      // Fast pulse when in claiming range
      pulseScale.value = withRepeat(
        withTiming(1.3, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      glowOpacity.value = withRepeat(
        withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else if (isNearby) {
      // Slow pulse when nearby
      pulseScale.value = withRepeat(
        withTiming(1.15, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      glowOpacity.value = 0.8;
    } else {
      pulseScale.value = 1;
      glowOpacity.value = 0.6;
    }
  }, [isInRange, isNearby, pulseScale, glowOpacity]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: glowOpacity.value,
  }));

  const effectiveColor = isInRange ? '#00D9FF' : isNearby ? '#00D9FF' : color;
  const centerX = size / 2;
  const centerY = size / 2;
  const innerRadius = size * 0.15;
  const outerRadius = size * 0.4;

  return (
    <Animated.View style={[styles.container, { width: size, height: size }, animatedContainerStyle]}>
      <Canvas style={styles.canvas}>
        {/* Outer glow */}
        <Group>
          <Circle cx={centerX} cy={centerY} r={outerRadius} color={effectiveColor} opacity={0.3}>
            <Blur blur={8} />
          </Circle>
        </Group>

        {/* Middle glow */}
        <Circle cx={centerX} cy={centerY} r={innerRadius * 2} color={effectiveColor} opacity={0.5}>
          <Shadow dx={0} dy={0} blur={12} color={effectiveColor} />
        </Circle>

        {/* Inner core */}
        <Circle cx={centerX} cy={centerY} r={innerRadius} color={effectiveColor} opacity={0.9}>
          <Shadow dx={0} dy={0} blur={4} color="#FFFFFF" />
        </Circle>
      </Canvas>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  canvas: {
    flex: 1,
  },
});
