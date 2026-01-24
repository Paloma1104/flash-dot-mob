import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    StyleSheet,
    Text,
    View,
} from "react-native";
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from "react-native-maps";

import type { GameDrop } from "@/types/game";
import { GAME_CONFIGS } from "@/types/game";
import type { MultiplayerStation } from "@/types/multiplayer";

interface FlashMobMapViewProps {
  drops?: GameDrop[];
  multiplayerStations?: MultiplayerStation[];
  userLocation?: Location.LocationObject | null;
  onDropPress?: (dropId: string) => void;
  onMultiplayerStationPress?: (stationId: string) => void;
}

export function FlashMobMapView({
  drops,
  multiplayerStations,
  userLocation,
  onDropPress,
  onMultiplayerStationPress,
}: FlashMobMapViewProps) {
  const mapRef = useRef<MapView>(null);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(
    null,
  );
  const [internalUserLocation, setInternalUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [hasAnimatedToUser, setHasAnimatedToUser] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  // Pulse animation for multiplayer stations
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Use provided userLocation or fallback to internal state
  const currentUserLocation = userLocation?.coords
    ? {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
      }
    : internalUserLocation;

  // Animate to user location once when it becomes available
  useEffect(() => {
    if (currentUserLocation && !hasAnimatedToUser && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: currentUserLocation.latitude,
          longitude: currentUserLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000,
      );
      setHasAnimatedToUser(true);
    }
  }, [
    currentUserLocation?.latitude,
    currentUserLocation?.longitude,
    hasAnimatedToUser,
  ]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === "granted");

      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({});
        const userCoords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setInternalUserLocation(userCoords);
      }
    })();
  }, []);

  // Loading state - wait for location before showing map
  if (
    locationPermission === null ||
    (locationPermission && !currentUserLocation)
  ) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#836EF9" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  // Permission denied
  if (!locationPermission) {
    return (
      <View style={styles.centered}>
        <AppIcon name="location" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Location permission required</Text>
        <Text style={styles.subText}>Enable location to find nearby drops</Text>
      </View>
    );
  }

  // Use user's location for initial region, fallback to LNMIIT if somehow null
  const initialRegion = {
    latitude: currentUserLocation?.latitude ?? 26.9363,
    longitude: currentUserLocation?.longitude ?? 75.9235,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        followsUserLocation={false}
        customMapStyle={darkMapStyle}
      >
        {/* Render game markers with unique icons */}
        {drops &&
          Array.isArray(drops) &&
          drops.map((gameDrop) => {
            const config = GAME_CONFIGS[gameDrop.gameType];
            return (
              <Marker
                key={gameDrop.id}
                coordinate={{
                  latitude: gameDrop.latitude,
                  longitude: gameDrop.longitude,
                }}
                onPress={() => onDropPress && onDropPress(gameDrop.id)}
                anchor={{ x: 0.5, y: 0.5 }}
                centerOffset={{ x: 0, y: 0 }}
              >
                <View style={styles.gameMarker}>
                  {/* Game Icon with colored background */}
                  <View
                    style={[
                      styles.gameIconContainer,
                      { backgroundColor: config.color },
                    ]}
                  >
                    <Text style={styles.gameEmoji}>{config.icon}</Text>
                  </View>
                  {/* Difficulty Badge */}
                  <View
                    style={[
                      styles.difficultyBadge,
                      {
                        backgroundColor:
                          gameDrop.difficulty === "easy"
                            ? "#06FFA5"
                            : gameDrop.difficulty === "medium"
                              ? "#FFD93D"
                              : "#FF6B9D",
                      },
                    ]}
                  >
                    <Text style={styles.difficultyText}>
                      {gameDrop.difficulty === "easy"
                        ? "E"
                        : gameDrop.difficulty === "medium"
                          ? "M"
                          : "H"}
                    </Text>
                  </View>
                  {/* Reward Badge */}
                  <View style={styles.rewardBadge}>
                    <Text style={styles.rewardText}>
                      {gameDrop.rewardAmount}
                    </Text>
                  </View>
                </View>
              </Marker>
            );
          })}

        {/* Render interaction radius for games */}
        {drops &&
          Array.isArray(drops) &&
          drops.map((gameDrop) => {
            const config = GAME_CONFIGS[gameDrop.gameType];
            return (
              <Circle
                key={`radius-${gameDrop.id}`}
                center={{
                  latitude: gameDrop.latitude,
                  longitude: gameDrop.longitude,
                }}
                radius={100}
                strokeColor={`${config.color}80`}
                fillColor={`${config.color}20`}
                strokeWidth={2}
              />
            );
          })}

        {/* Render Multiplayer Stations */}
        {multiplayerStations &&
          Array.isArray(multiplayerStations) &&
          multiplayerStations.map((station) => (
            <Marker
              key={`mp-${station.id}`}
              coordinate={{
                latitude: station.latitude,
                longitude: station.longitude,
              }}
              onPress={() =>
                onMultiplayerStationPress &&
                onMultiplayerStationPress(station.id)
              }
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <Animated.View
                style={[
                  styles.multiplayerMarker,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <View style={styles.multiplayerIconContainer}>
                  <AppIcon name="trophy" size={28} color="#000" />
                </View>
                <View style={styles.multiplayerBadge}>
                  <Text style={styles.multiplayerBadgeText}>
                    {station.currentPlayers.length}/{station.maxPlayers}
                  </Text>
                </View>
                <View style={styles.multiplayerStake}>
                  <Text style={styles.multiplayerStakeText}>
                    {station.stakeAmount}
                  </Text>
                </View>
              </Animated.View>
            </Marker>
          ))}

        {/* Render Multiplayer Station radius */}
        {multiplayerStations &&
          Array.isArray(multiplayerStations) &&
          multiplayerStations.map((station) => (
            <Circle
              key={`mp-radius-${station.id}`}
              center={{
                latitude: station.latitude,
                longitude: station.longitude,
              }}
              radius={200}
              strokeColor="rgba(255, 217, 61, 0.6)"
              fillColor="rgba(255, 217, 61, 0.15)"
              strokeWidth={3}
            />
          ))}
      </MapView>
    </View>
  );
}

// Dark theme for Google Maps (Monad-inspired)
const darkMapStyle = [
  {
    elementType: "geometry",
    stylers: [{ color: "#0D0D0F" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#A594FF" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#0D0D0F" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1A1A2E" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212136" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#16213E" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#1A1A2E" }],
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0D0D0F",
  },
  loadingText: {
    marginTop: 16,
    color: "#A594FF",
    fontSize: 16,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 18,
    fontWeight: "600",
  },
  subText: {
    marginTop: 8,
    color: "#888",
    fontSize: 14,
  },
  gameMarker: {
    alignItems: "center",
    gap: 4,
    width: 56,
  },
  gameIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: "#fff",
    overflow: "hidden",
    aspectRatio: 1,
    backgroundColor: "#000",
  },
  gameEmoji: {
    fontSize: 24,
    textAlign: "center",
    lineHeight: 24,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: -8,
    borderWidth: 2,
    borderColor: "#fff",
    minWidth: 24,
    alignItems: "center",
  },
  difficultyText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "900",
  },
  rewardBadge: {
    backgroundColor: "rgba(131, 110, 249, 0.95)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#00D9FF",
  },
  rewardText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },
  // Multiplayer station marker styles
  multiplayerMarker: {
    alignItems: "center",
    gap: 4,
    width: 70,
  },
  multiplayerIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFD93D",
    shadowColor: "#FFD93D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 4,
    borderColor: "#fff",
  },
  multiplayerEmoji: {
    fontSize: 28,
    textAlign: "center",
  },
  multiplayerBadge: {
    backgroundColor: "#06FFA5",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: -10,
    borderWidth: 2,
    borderColor: "#fff",
  },
  multiplayerBadgeText: {
    color: "#000",
    fontSize: 11,
    fontWeight: "900",
  },
  multiplayerStake: {
    backgroundColor: "rgba(131, 110, 249, 0.95)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#00D9FF",
  },
  multiplayerStakeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },
});

