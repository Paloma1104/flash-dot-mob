import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useRef } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GameModal } from "@/components/games/GameModal";
import {
  MultiplayerGameModal,
  MultiplayerLobby,
} from "@/components/multiplayer";
import { GlassCard } from "@/components/ui/GlassCard";
import { RadarPulse } from "@/components/ui/RadarPulse";
import { useLocation } from "@/hooks/useLocation";
import { useGameStore } from "@/stores/gameStore";
import { useMultiplayerStore } from "@/stores/multiplayerStore";
import type { GameDrop } from "@/types/game";
import { GAME_CONFIGS, GameType } from "@/types/game";
import type { MultiplayerStation } from "@/types/multiplayer";
import {
  generateMockGameDrops,
  getNearbyGameDrops,
} from "@/utils/gameDropGenerator";

// ============ DESIGN SYSTEM TOKENS ============

const COLORS = {
  primary: "#836EF9",
  secondary: "#00D9FF",
  background: "#0D0D0F",
  surface: "#1A1A2E",
  textPrimary: "#FFFFFF",
  textSecondary: "rgba(255, 255, 255, 0.6)",
  textTertiary: "rgba(255, 255, 255, 0.5)",
  textQuaternary: "rgba(255, 255, 255, 0.4)",
  success: "#06FFA5",
  warning: "#FFD93D",
  error: "#FF6B9D",
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

const TYPOGRAPHY = {
  h1: { fontSize: 28, fontWeight: "900" as const },
  h2: { fontSize: 24, fontWeight: "800" as const },
  h3: { fontSize: 18, fontWeight: "700" as const },
  title1: { fontSize: 28, fontWeight: "800" as const },
  title3: { fontSize: 20, fontWeight: "700" as const },
  headline: { fontSize: 17, fontWeight: "600" as const },
  subheadline: { fontSize: 15, fontWeight: "500" as const },
  body: { fontSize: 14, fontWeight: "500" as const },
  footnote: { fontSize: 13, fontWeight: "400" as const },
  caption: { fontSize: 12, fontWeight: "600" as const },
  caption1: { fontSize: 12, fontWeight: "500" as const },
  caption2: { fontSize: 11, fontWeight: "400" as const },
  small: { fontSize: 10, fontWeight: "600" as const },
  tiny: { fontSize: 9, fontWeight: "700" as const },
};

const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

const LAYOUT = {
  screenPadding: 20,
  cardPadding: 16,
  headerHeight: 60,
  tabBarHeight: 80,
};

// Simple icon component placeholder
function AppIcon({
  name,
  size,
  color,
}: {
  name: string;
  size: number;
  color: string;
}) {
  const icons: Record<string, string> = {
    location: "📍",
    game: "🎮",
    wallet: "💰",
    trophy: "🏆",
    lock: "🔒",
    map: "🗺️",
  };
  return <Text style={{ fontSize: size, color }}>{icons[name] || "•"}</Text>;
}

// Compact header component
function CompactHeader({
  title,
  transparent,
  leftContent,
  rightContent,
}: {
  title?: string;
  transparent?: boolean;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.md,
        paddingBottom: SPACING.sm,
        backgroundColor: transparent ? "transparent" : COLORS.surface,
      }}
    >
      {leftContent || (
        <Text
          style={{ color: COLORS.textPrimary, fontSize: 18, fontWeight: "700" }}
        >
          {title}
        </Text>
      )}
      {rightContent}
    </View>
  );
}

// Check if Mapbox is available (requires native build)
let FlashMobMapView: React.ComponentType<any> | null = null;
let mapboxAvailable = false;

try {
  const MapViewModule = require("@/components/map/MapView");
  FlashMobMapView = MapViewModule.FlashMobMapView;
  mapboxAvailable = true;
} catch {
  mapboxAvailable = false;
}

export default function MapScreen() {
  const {
    location,
    isLoading: locationLoading,
    hasPermission,
    requestPermission,
  } = useLocation();
  const {
    selectedGameDrop,
    selectGameDrop,
    setGameDrops,
    isLoadingGames,
    loadCachedGames,
    cacheGames,
    shouldRefreshGames,
    setLoadingGames,
  } = useGameStore();
  const {
    nearbyStations,
    currentStation,
    currentSession,
    isInLobby,
    isInMultiplayerGame,
    fetchNearbyStations,
    setSelectedGame,
    clearCurrentStation,
  } = useMultiplayerStore();

  const [gameModalVisible, setGameModalVisible] = React.useState(false);
  const [nearbyGameDrops, setNearbyGameDrops] = React.useState<GameDrop[]>([]);
  const [multiplayerLobbyVisible, setMultiplayerLobbyVisible] =
    React.useState(false);
  const [selectedStation, setSelectedStation] =
    React.useState<MultiplayerStation | null>(null);
  const [isFromCache, setIsFromCache] = React.useState(false);

  // Ref to track last processed location for debouncing
  const lastLocationRef = useRef<{
    lat: number;
    lng: number;
    time: number;
  } | null>(null);

  // Load cached games immediately on mount (instant loading)
  React.useEffect(() => {
    const loadCache = async () => {
      setLoadingGames(true);
      const cached = await loadCachedGames();
      if (cached) {
        const nearby = getNearbyGameDrops(
          cached.location.latitude,
          cached.location.longitude,
          cached.games,
          5000,
        );
        setNearbyGameDrops(nearby);
        setIsFromCache(true);
        console.log("⚡ Instant load: Showing cached games");
      }
      setLoadingGames(false);
    };
    loadCache();
  }, [loadCachedGames, setLoadingGames]);

  // Debounced game generation when location changes
  const generateGamesForLocation = useCallback(
    async (lat: number, lng: number) => {
      // Debounce: Skip if last update was within 1 second
      const now = Date.now();
      if (
        lastLocationRef.current &&
        now - lastLocationRef.current.time < 1000
      ) {
        return;
      }

      // Skip if user hasn't moved significantly (>100m)
      if (!shouldRefreshGames(lat, lng)) {
        console.log("📍 User hasn't moved significantly, using cached games");
        setIsFromCache(false); // But mark as up-to-date
        return;
      }

      lastLocationRef.current = { lat, lng, time: now };
      setLoadingGames(true);
      setIsFromCache(false);

      // Generate new games
      const mockDrops = generateMockGameDrops(lat, lng);
      setGameDrops(mockDrops);

      const nearby = getNearbyGameDrops(lat, lng, mockDrops, 5000);
      setNearbyGameDrops(nearby);

      // Cache for next time
      await cacheGames(mockDrops, lat, lng);
      setLoadingGames(false);
      console.log(`🎮 Generated ${nearby.length} games at new location`);
    },
    [shouldRefreshGames, setLoadingGames, setGameDrops, cacheGames],
  );

  // Update games when location changes (with debouncing)
  React.useEffect(() => {
    if (location?.latitude && location?.longitude) {
      generateGamesForLocation(location.latitude, location.longitude);

      // Fetch multiplayer stations
      fetchNearbyStations(location.latitude, location.longitude);
    }
  }, [
    location?.latitude,
    location?.longitude,
    generateGamesForLocation,
    fetchNearbyStations,
  ]);

  const handleGameDropPress = (dropId: string) => {
    selectGameDrop(dropId);
    setGameModalVisible(true);
  };

  const handleCloseGameModal = () => {
    setGameModalVisible(false);
    selectGameDrop(null);
  };

  const handleMultiplayerStationPress = (stationId: string) => {
    const station = nearbyStations.find((s) => s.id === stationId);
    if (station) {
      setSelectedStation(station);
      setMultiplayerLobbyVisible(true);
    }
  };

  const handleCloseLobby = () => {
    setMultiplayerLobbyVisible(false);
    setSelectedStation(null);
  };

  const handleMultiplayerGameStart = (gameType: GameType) => {
    if (currentStation) {
      setSelectedGame(currentStation.id, gameType);
      setMultiplayerLobbyVisible(false);
    }
  };

  const handleMultiplayerGameComplete = (score: number) => {
    console.log("Multiplayer game completed with score:", score);
    clearCurrentStation();
  };

  // 1. Permission Request UI
  if (!hasPermission && !locationLoading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <LinearGradient
          colors={["#0D0D0F", "#1A1A25", "#836EF9"]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.centerContainer}>
          <GlassCard style={styles.permissionCard} intensity={40}>
            <View style={styles.monadBadge}>
              <Text style={styles.monadText}>POWERED BY MONAD</Text>
            </View>
            <View style={styles.iconContainer}>
              <AppIcon name="location" size={48} color={COLORS.primary} />
            </View>
            <Text style={styles.permissionTitle}>Welcome to Flash.Mob</Text>
            <Text style={styles.permissionSubtitle}>
              Play Games, Earn Crypto
            </Text>
            <Text style={styles.permissionText}>
              Discover mini-games at real locations. Walk, explore, play games
              and earn AP tokens. Collect MON testnet tokens in your wallet!
            </Text>
            <View style={styles.featureList}>
              <View style={styles.featureRow}>
                <AppIcon name="game" size={16} color={COLORS.textSecondary} />
                <Text style={styles.featureItem}>10 Unique Mini-Games</Text>
              </View>
              <View style={styles.featureRow}>
                <AppIcon name="wallet" size={16} color={COLORS.textSecondary} />
                <Text style={styles.featureItem}>Earn MON Tokens</Text>
              </View>
              <View style={styles.featureRow}>
                <AppIcon name="trophy" size={16} color={COLORS.textSecondary} />
                <Text style={styles.featureItem}>Compete on Leaderboards</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={requestPermission}
            >
              <Text style={styles.primaryButtonText}>Start Playing</Text>
            </TouchableOpacity>
            <View style={styles.privacyRow}>
              <AppIcon name="lock" size={12} color={COLORS.textQuaternary} />
              <Text style={styles.privacyNote}>
                We only use your location to find nearby games
              </Text>
            </View>
          </GlassCard>
        </SafeAreaView>
      </View>
    );
  }

  // 2. Fallback UI (Scanner Mode) - Now showing games!
  if (!mapboxAvailable) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <LinearGradient
          colors={["#0D0D0F", "#13131F", "#09090B"]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.gridOverlay} />

        {/* Compact Header */}
        <CompactHeader
          leftContent={
            <View>
              <Text style={styles.appName}>FLASH.MOB</Text>
              <Text style={styles.appStatus}>SCANNING...</Text>
            </View>
          }
        />

        <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
          {/* Radar Scanner */}
          <View
            style={[
              styles.scannerContainer,
              { marginTop: LAYOUT.headerHeight },
            ]}
          >
            <RadarPulse />
            <View style={styles.monadScanBadge}>
              <Text style={styles.monadScanText}>MONAD NETWORK</Text>
            </View>
            <Text style={styles.scannerText}>
              {location
                ? `${nearbyGameDrops.length} GAMES DETECTED`
                : "ACQUIRING LOCATION..."}
            </Text>
            {location && (
              <Text style={styles.scannerCoords}>
                {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              </Text>
            )}
          </View>

          {/* Nearby Games List */}
          <View style={styles.bottomSheet}>
            <Text style={styles.sectionTitle}>
              NEARBY GAMES ({nearbyGameDrops.length})
            </Text>
            <ScrollView
              style={styles.dropsList}
              contentContainerStyle={{ paddingBottom: 200 }}
              showsVerticalScrollIndicator={false}
            >
              {nearbyGameDrops.slice(0, 20).map((gameDrop) => {
                const config = GAME_CONFIGS[gameDrop.gameType];
                return (
                  <GlassCard
                    key={gameDrop.id}
                    style={styles.gameItem}
                    variant="dark"
                  >
                    <TouchableOpacity
                      onPress={() => handleGameDropPress(gameDrop.id)}
                      style={styles.gameItemContent}
                    >
                      <View
                        style={[
                          styles.gameIcon,
                          { backgroundColor: config.color },
                        ]}
                      >
                        <Text style={{ fontSize: 28 }}>{config.icon}</Text>
                      </View>
                      <View style={styles.gameDetails}>
                        <Text style={styles.gameName}>{config.name}</Text>
                        <Text style={styles.gameReward}>
                          {gameDrop.rewardAmount} AP
                        </Text>
                        <View style={styles.difficultyBadge}>
                          <Text
                            style={[
                              styles.difficultyText,
                              {
                                color:
                                  gameDrop.difficulty === "easy"
                                    ? "#06FFA5"
                                    : gameDrop.difficulty === "medium"
                                      ? "#FFD93D"
                                      : "#FF6B9D",
                              },
                            ]}
                          >
                            {gameDrop.difficulty.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.gameAction}>
                        <AppIcon
                          name="arrow-right"
                          size={20}
                          color={COLORS.primary}
                        />
                      </View>
                    </TouchableOpacity>
                  </GlassCard>
                );
              })}

              {nearbyGameDrops.length === 0 && location && (
                <View style={styles.emptyState}>
                  <AppIcon
                    name="game"
                    size={64}
                    color={COLORS.textQuaternary}
                  />
                  <Text style={styles.emptyText}>No games nearby</Text>
                  <Text style={styles.emptySubtext}>
                    Move around to discover games!
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </SafeAreaView>

        <GameModal
          visible={gameModalVisible}
          gameDrop={selectedGameDrop}
          onClose={handleCloseGameModal}
        />

        {/* Multiplayer Modals */}
        <MultiplayerLobby
          visible={multiplayerLobbyVisible && !isInMultiplayerGame}
          station={selectedStation || currentStation}
          onClose={handleCloseLobby}
          onGameStart={handleMultiplayerGameStart}
        />

        <MultiplayerGameModal
          visible={isInMultiplayerGame}
          session={currentSession}
          onGameComplete={handleMultiplayerGameComplete}
          onClose={() => clearCurrentStation()}
        />
      </View>
    );
  }

  // 3. Full Map UI (Pokémon GO Style)
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {FlashMobMapView && (
        <FlashMobMapView
          drops={nearbyGameDrops}
          multiplayerStations={nearbyStations}
          userLocation={location}
          onDropPress={(dropId: string) => handleGameDropPress(dropId)}
          onMultiplayerStationPress={(stationId: string) =>
            handleMultiplayerStationPress(stationId)
          }
        />
      )}

      {/* Header and Badge removed as per request */}

      <GameModal
        visible={gameModalVisible}
        gameDrop={selectedGameDrop}
        onClose={handleCloseGameModal}
      />

      {/* Multiplayer Modals */}
      <MultiplayerLobby
        visible={multiplayerLobbyVisible && !isInMultiplayerGame}
        station={selectedStation || currentStation}
        onClose={handleCloseLobby}
        onGameStart={handleMultiplayerGameStart}
      />

      <MultiplayerGameModal
        visible={isInMultiplayerGame}
        session={currentSession}
        onGameComplete={handleMultiplayerGameComplete}
        onClose={() => clearCurrentStation()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingBottom: 90, // Space for tab bar
  },
  safeArea: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
  },

  // Permission UI
  permissionCard: {
    padding: SPACING.xxxl,
    width: "100%",
    alignItems: "center",
  },
  monadBadge: {
    backgroundColor: "rgba(131, 110, 249, 0.2)",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  monadText: {
    color: COLORS.primary,
    ...TYPOGRAPHY.caption2,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(131, 110, 249, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.xxl,
  },
  permissionTitle: {
    ...TYPOGRAPHY.title1,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  permissionSubtitle: {
    ...TYPOGRAPHY.headline,
    color: COLORS.secondary,
    marginBottom: SPACING.lg,
  },
  permissionText: {
    ...TYPOGRAPHY.subheadline,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  featureList: {
    alignSelf: "stretch",
    marginBottom: SPACING.xxl,
    gap: SPACING.md,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  featureItem: {
    color: COLORS.textSecondary,
    ...TYPOGRAPHY.footnote,
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xxxl,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    width: "100%",
    alignItems: "center",
  },
  primaryButtonText: {
    color: COLORS.textPrimary,
    ...TYPOGRAPHY.headline,
    fontWeight: "700",
  },
  privacyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginTop: SPACING.md,
  },
  privacyNote: {
    color: COLORS.textQuaternary,
    ...TYPOGRAPHY.caption2,
  },

  // Scanner Mode
  appName: {
    ...TYPOGRAPHY.headline,
    fontWeight: "900",
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  appStatus: {
    ...TYPOGRAPHY.caption2,
    color: COLORS.primary,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  scannerContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 240,
    marginBottom: SPACING.lg,
  },
  monadScanBadge: {
    backgroundColor: "rgba(131, 110, 249, 0.2)",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.xl,
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  monadScanText: {
    color: COLORS.primary,
    ...TYPOGRAPHY.caption2,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  scannerText: {
    color: COLORS.textTertiary,
    ...TYPOGRAPHY.caption1,
    letterSpacing: 2,
    marginTop: SPACING.lg,
    fontWeight: "600",
  },
  scannerCoords: {
    color: COLORS.textQuaternary,
    ...TYPOGRAPHY.caption1,
    marginTop: SPACING.xs,
  },

  // Game List
  bottomSheet: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  sectionTitle: {
    color: COLORS.textTertiary,
    ...TYPOGRAPHY.caption1,
    fontWeight: "700",
    marginBottom: SPACING.md,
    letterSpacing: 1,
  },
  dropsList: {
    flex: 1,
  },
  gameItem: {
    marginBottom: SPACING.md,
    overflow: "hidden",
  },
  gameItemContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
  },
  gameIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
    elevation: 5,
  },
  gameDetails: {
    flex: 1,
  },
  gameName: {
    color: COLORS.textPrimary,
    ...TYPOGRAPHY.headline,
    fontWeight: "bold",
    marginBottom: SPACING.xs,
  },
  gameReward: {
    color: "#FFD93D",
    ...TYPOGRAPHY.subheadline,
    fontWeight: "600",
    marginBottom: SPACING.xs,
  },
  difficultyBadge: {
    alignSelf: "flex-start",
  },
  difficultyText: {
    ...TYPOGRAPHY.caption2,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  gameAction: {
    paddingLeft: SPACING.sm,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: COLORS.textPrimary,
    ...TYPOGRAPHY.title3,
    fontWeight: "bold",
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    color: COLORS.textTertiary,
    ...TYPOGRAPHY.subheadline,
  },

  // Map Overlay
  distanceIndicator: {
    position: "absolute",
    bottom: LAYOUT.tabBarHeight + SPACING.xl,
    alignSelf: "center",
  },
  distanceCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.xl,
  },
  distanceText: {
    color: COLORS.textPrimary,
    ...TYPOGRAPHY.headline,
    fontWeight: "700",
  },
  distanceLabel: {
    color: COLORS.textTertiary,
    ...TYPOGRAPHY.caption2,
    fontWeight: "600",
  },
});
