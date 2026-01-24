import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withTiming
} from 'react-native-reanimated';

export function RadarPulse() {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0.6);
  
  const scale2 = useSharedValue(0);
  const opacity2 = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(2, { duration: 2500, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    opacity.value = withRepeat(
      withTiming(0, { duration: 2500, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );

    scale2.value = withDelay(
      1250,
      withRepeat(
        withTiming(2, { duration: 2500, easing: Easing.out(Easing.ease) }),
        -1,
        false
      )
    );
    opacity2.value = withDelay(
      1250,
      withRepeat(
        withTiming(0, { duration: 2500, easing: Easing.out(Easing.ease) }),
        -1,
        false
      )
    );
  }, []);

  const rStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const rStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: scale2.value }],
    opacity: opacity2.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.circle, rStyle1]} />
      <Animated.View style={[styles.circle, rStyle2]} />
      <View style={styles.centerDot} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#836EF9',
    backgroundColor: 'rgba(131, 110, 249, 0.1)',
  },
  centerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#836EF9',
    shadowColor: '#836EF9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
});
