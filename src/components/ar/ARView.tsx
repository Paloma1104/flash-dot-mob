import { calculateBearing, haversineDistance } from '@/utils/geo';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

/**
 * AR View Component
 * 
 * Overlays drop markers on camera view based on:
 * - User's GPS location
 * - Device compass heading
 * - Drop locations
 * 
 * Note: For production AR, consider:
 * - ViroReact for full 3D AR
 * - expo-three for 3D rendering
 * - ARKit/ARCore via native modules
 */

interface Drop {
  id: string;
  latitude: number;
  longitude: number;
  amount: number;
  isActive: boolean;
}

interface ARViewProps {
  drops: Drop[];
  userLatitude: number;
  userLongitude: number;
  userHeading: number; // Device compass heading in degrees
  onDropTap?: (dropId: string) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HORIZONTAL_FOV = 60; // Camera horizontal field of view in degrees
const MAX_VISIBLE_DISTANCE = 500; // Maximum distance to show drops (meters)

export function ARView({
  drops,
  userLatitude,
  userLongitude,
  userHeading,
  onDropTap,
}: ARViewProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [visibleDrops, setVisibleDrops] = useState<
    Array<Drop & { bearing: number; distance: number; screenX: number }>
  >([]);

  // Calculate visible drops and their screen positions
  useEffect(() => {
    const visible = drops
      .filter((drop) => drop.isActive)
      .map((drop) => {
        const distance = haversineDistance(
          userLatitude,
          userLongitude,
          drop.latitude,
          drop.longitude
        );

        const bearing = calculateBearing(
          userLatitude,
          userLongitude,
          drop.latitude,
          drop.longitude
        );

        // Calculate relative angle from user's heading
        let relativeBearing = bearing - userHeading;
        if (relativeBearing > 180) relativeBearing -= 360;
        if (relativeBearing < -180) relativeBearing += 360;

        // Calculate screen X position (-FOV/2 to +FOV/2 maps to 0 to SCREEN_WIDTH)
        const screenX =
          SCREEN_WIDTH / 2 + (relativeBearing / HORIZONTAL_FOV) * SCREEN_WIDTH;

        return {
          ...drop,
          bearing,
          distance,
          screenX,
        };
      })
      // Filter to visible range
      .filter((drop) => {
        return (
          drop.distance <= MAX_VISIBLE_DISTANCE &&
          Math.abs(drop.bearing - userHeading) <= HORIZONTAL_FOV / 2 + 30 // Some margin
        );
      })
      // Sort by distance (closest first for z-ordering)
      .sort((a, b) => a.distance - b.distance);

    setVisibleDrops(visible);
  }, [drops, userLatitude, userLongitude, userHeading]);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            Camera permission is required for AR mode
          </Text>
          <Text style={styles.permissionButton} onPress={requestPermission}>
            Grant Permission
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back">
        {/* AR Overlay */}
        <View style={styles.overlay}>
          {visibleDrops.map((drop) => (
            <ARDropMarker
              key={drop.id}
              drop={drop}
              onTap={() => onDropTap?.(drop.id)}
            />
          ))}

          {/* Compass indicator */}
          <View style={styles.compassContainer}>
            <Text style={styles.compassText}>{Math.round(userHeading)}°</Text>
          </View>

          {/* Distance legend */}
          <View style={styles.legendContainer}>
            <Text style={styles.legendText}>
              {visibleDrops.length} drops visible
            </Text>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

/**
 * AR Drop Marker Component
 */
function ARDropMarker({
  drop,
  onTap,
}: {
  drop: { id: string; amount: number; distance: number; screenX: number };
  onTap?: () => void;
}) {
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withTiming(1.2, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // Size based on distance (closer = bigger)
  const size = Math.max(40, 100 - drop.distance / 5);

  // Vertical position based on distance (further = higher)
  const screenY = SCREEN_HEIGHT * 0.4 + (drop.distance / MAX_VISIBLE_DISTANCE) * 100;

  return (
    <Animated.View
      style={[
        styles.dropMarker,
        animatedStyle,
        {
          left: drop.screenX - size / 2,
          top: screenY - size / 2,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
      onTouchEnd={onTap}
    >
      <Text style={styles.dropAmount}>{drop.amount}</Text>
      <Text style={styles.dropDistance}>{Math.round(drop.distance)}m</Text>
    </Animated.View>
  );
}

/**
 * Hook for device compass heading
 */
export function useCompassHeading(): number {
  const [heading, setHeading] = useState(0);

  useEffect(() => {
    // In production, use expo-sensors Magnetometer
    // This is a placeholder that updates randomly for demo
    const interval = setInterval(() => {
      setHeading((prev) => (prev + Math.random() * 2 - 1 + 360) % 360);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return heading;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D0D0F',
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 40,
  },
  permissionButton: {
    color: '#836EF9',
    fontSize: 18,
    fontWeight: '600',
  },
  dropMarker: {
    position: 'absolute',
    backgroundColor: 'rgba(131, 110, 249, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#836EF9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  dropAmount: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  dropDistance: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
  },
  compassContainer: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  compassText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  legendContainer: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  legendText: {
    color: '#fff',
    fontSize: 14,
  },
});

