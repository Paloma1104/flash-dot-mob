import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GameModal } from "@/src/components/games/GameModal";
import {
  MultiplayerGameModal,
  MultiplayerLobby,
} from "@/src/components/multiplayer";
import { GlassCard } from "@/src/components/ui/GlassCard";
import { RadarPulse } from "@/src/components/ui/RadarPulse";
import { BalanceDisplay } from "@/src/components/wallet/BalanceDisplay";
import { useLocation } from "@/src/hooks/useLocation";
import { useGameStore } from "@/src/stores/gameStore";
import { useMultiplayerStore } from "@/src/stores/multiplayerStore";
import type { GameDrop } from "@/src/types/game";
import { GAME_CONFIGS, GameType } from "@/src/types/game";
import type { MultiplayerStation } from "@/src/types/multiplayer";
import {
  generateMockGameDrops,
  getNearbyGameDrops,
} from "@/src/utils/gameDropGenerator";

// Check if Mapbox is available (requires native build)
let FlashMobMapView: React.ComponentType<any> | null = null;
let mapboxAvailable = false;

try {
  const MapViewModule = require("@/src/components/map/MapView");
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
  const { selectedGameDrop, selectGameDrop, setGameDrops } = useGameStore();
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

  // Generate mock game drops when location is available
  React.useEffect(() => {
    if (location?.latitude && location?.longitude) {
      const mockDrops = generateMockGameDrops(
        location.latitude,
        location.longitude,
      );
      setGameDrops(mockDrops);

      const nearby = getNearbyGameDrops(
        location.latitude,
        location.longitude,
        mockDrops,
        5000,
      );
      setNearbyGameDrops(nearby);

      // Fetch multiplayer stations
      fetchNearbyStations(location.latitude, location.longitude);
    }
  }, [
    location?.latitude,
    location?.longitude,
    setGameDrops,
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
              <Text style={styles.monadText}>⚡ POWERED BY MONAD</Text>
            </View>
            <View style={styles.iconContainer}>
              <Text style={{ fontSize: 48 }}>🎮</Text>
            </View>
            <Text style={styles.permissionTitle}>Welcome to Flash.Mob</Text>
            <Text style={styles.permissionSubtitle}>
              🎮 Play Games, Earn Crypto
            </Text>
            <Text style={styles.permissionText}>
              Discover mini-games at real locations. Walk, explore, play games
              and earn AP tokens. Collect MON testnet tokens in your wallet!
            </Text>
            <View style={styles.featureList}>
              <Text style={styles.featureItem}>🎯 10 Unique Mini-Games</Text>
              <Text style={styles.featureItem}>💰 Earn MON Tokens</Text>
              <Text style={styles.featureItem}>🏆 Compete on Leaderboards</Text>
            </View>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={requestPermission}
            >
              <Text style={styles.primaryButtonText}>Start Playing</Text>
            </TouchableOpacity>
            <Text style={styles.privacyNote}>
              We only use your location to find nearby games
            </Text>
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

        <SafeAreaView style={styles.safeArea}>
          {/* Compact Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.appName}>⚡ FLASH.MOB</Text>
              <Text style={styles.appStatus}>MONAD • SCANNING...</Text>
            </View>
            <BalanceDisplay variant="compact" />
          </View>

          {/* Radar Scanner */}
          <View style={styles.scannerContainer}>
            <RadarPulse />
            <View style={styles.monadScanBadge}>
              <Text style={styles.monadScanText}>⚡ MONAD NETWORK</Text>
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
              🎮 NEARBY GAMES ({nearbyGameDrops.length})
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
                          🪙 {gameDrop.rewardAmount} AP
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
                        <Text style={styles.playText}>PLAY →</Text>
                      </View>
                    </TouchableOpacity>
                  </GlassCard>
                );
              })}

              {nearbyGameDrops.length === 0 && location && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>🎮</Text>
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

      {/* Overlay UI */}
      <View style={styles.overlay} pointerEvents="box-none">
        <SafeAreaView style={styles.overlaySafeArea} pointerEvents="box-none">
          {/* Compact Top Bar */}
          <View style={styles.mapTopBar} pointerEvents="box-none">
            <GlassCard style={styles.mapHeader} intensity={60}>
              <View style={styles.headerRow}>
                <View>
                  <Text style={styles.logoText}>FLASH.MOB</Text>
                  <Text style={styles.logoSubtext}>SCANNER ACTIVE</Text>
                </View>
                <BalanceDisplay variant="compact" />
              </View>
            </GlassCard>
          </View>

          {/* Nearby Games Counter */}
          {nearbyGameDrops.length > 0 && (
            <View style={styles.distanceIndicator}>
              <GlassCard style={styles.distanceCard} intensity={40}>
                <Text style={styles.distanceIcon}>🎮</Text>
                <View>
                  <Text style={styles.distanceText}>
                    {nearbyGameDrops.length} Games
                  </Text>
                  <Text style={styles.distanceLabel}>nearby to play</Text>
                </View>
              </GlassCard>
            </View>
          )}
        </SafeAreaView>
      </View>

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
    backgroundColor: "#000",
  },
  safeArea: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    marginBottom: 16,
  },
  appName: {
    fontSize: 18,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 1,
    fontStyle: "italic",
  },
  appStatus: {
    fontSize: 9,
    color: "#836EF9",
    fontWeight: "700",
    letterSpacing: 1.5,
  },

  // Scanner
  scannerContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 280,
    marginBottom: 16,
  },
  monadScanBadge: {
    backgroundColor: "rgba(131, 110, 249, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#836EF9",
  },
  monadScanText: {
    color: "#836EF9",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  scannerText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    letterSpacing: 2,
    marginTop: 16,
    fontWeight: "600",
  },

  // List
  bottomSheet: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 12,
    letterSpacing: 1,
  },
  dropsList: {
    flex: 1,
  },
  dropItem: {
    marginBottom: 10,
    borderRadius: 16,
  },
  dropItemHighlight: {
    borderColor: "#836EF9",
    borderWidth: 2,
  },
  dropItemContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  dropIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  dropIconActive: {
    backgroundColor: "rgba(131, 110, 249, 0.3)",
  },
  dropDetails: {
    flex: 1,
  },
  dropAmount: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  dropId: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 9,
    fontFamily: "monospace",
    marginTop: 2,
  },
  dropStatus: {
    alignItems: "flex-end",
  },
  statusText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontWeight: "600",
  },
  statusTextActive: {
    color: "#836EF9",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#00D9FF",
    marginTop: 4,
  },

  // Floating Claim (Scanner Mode)
  floatingClaimContainer: {
    position: "absolute",
    bottom: 100,
    left: 20,
    right: 20,
  },
  claimCard: {
    padding: 20,
    borderRadius: 24,
  },
  claimHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  claimTitle: {
    color: "#00D9FF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 8,
  },
  claimAmount: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "900",
  },

  // Permission UI
  permissionCard: {
    padding: 32,
    width: "100%",
    alignItems: "center",
  },
  monadBadge: {
    backgroundColor: "rgba(131, 110, 249, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#836EF9",
  },
  monadText: {
    color: "#836EF9",
    fontSize: 10,
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
    marginBottom: 24,
  },
  permissionTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 8,
  },
  permissionSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#00D9FF",
    marginBottom: 16,
  },
  permissionText: {
    fontSize: 15,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  featureList: {
    alignSelf: "stretch",
    marginBottom: 24,
    gap: 8,
  },
  featureItem: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  primaryButton: {
    backgroundColor: "#836EF9",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  privacyNote: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    marginTop: 12,
    textAlign: "center",
  },

  // Map Overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlaySafeArea: {
    flex: 1,
    justifyContent: "space-between",
  },
  mapTopBar: {
    paddingHorizontal: 16,
    paddingTop: 48, // Increased from 8 to prevent header cropping
  },
  mapHeader: {
    padding: 14,
    borderRadius: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    fontStyle: "italic",
  },
  logoSubtext: {
    color: "#836EF9",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
  },

  // Map Bottom Area
  mapBottomArea: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  mapClaimPanel: {
    padding: 20,
    borderRadius: 24,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    justifyContent: "center",
  },
  pulseIndicator: {
    marginRight: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#00D9FF",
  },
  panelTitle: {
    color: "#00D9FF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
  },
  panelContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  panelAmount: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 4,
  },
  panelDistance: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontWeight: "600",
  },

  // Distance Indicator
  distanceIndicator: {
    position: "absolute",
    bottom: 120,
    alignSelf: "center",
  },
  distanceCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  distanceIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  distanceText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  distanceLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 9,
    fontWeight: "600",
  },

  // Game-specific styles
  gameItem: {
    marginBottom: 12,
    overflow: "hidden",
  },
  gameItemContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  gameIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    elevation: 5,
  },
  gameDetails: {
    flex: 1,
  },
  gameName: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  gameReward: {
    color: "#FFD93D",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  difficultyBadge: {
    alignSelf: "flex-start",
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  gameAction: {
    paddingLeft: 10,
  },
  playText: {
    color: "#836EF9",
    fontSize: 14,
    fontWeight: "bold",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  emptySubtext: {
    color: "#AAA",
    fontSize: 14,
  },
  scannerCoords: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 12,
    marginTop: 5,
  },
});
