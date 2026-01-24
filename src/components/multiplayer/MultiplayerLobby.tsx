import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useMultiplayerStore } from "@/stores/multiplayerStore";
import { useUserStore } from "@/stores/userStore";
import { GAME_CONFIGS, type GameType } from "@/types/game";
import type { MultiplayerStation } from "@/types/multiplayer";
import { MULTIPLAYER_GAMES } from "@/types/multiplayer";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface MultiplayerLobbyProps {
  visible: boolean;
  station: MultiplayerStation | null;
  onClose: () => void;
  onGameStart: (gameType: GameType) => void;
}

export function MultiplayerLobby({
  visible,
  station,
  onClose,
  onGameStart,
}: MultiplayerLobbyProps) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [pulseAnim] = useState(new Animated.Value(1));

  const {
    joinStation,
    leaveStation,
    isInLobby,
    currentStation,
    isLoading,
    error,
    setError,
  } = useMultiplayerStore();

  const { apBalance, walletAddress } = useUserStore();

  const isJoined = currentStation?.id === station?.id;
  const currentPlayers =
    currentStation?.currentPlayers || station?.currentPlayers || [];
  const canJoin = station && apBalance >= station.stakeAmount && !isJoined;

  // Pulse animation for waiting state
  useEffect(() => {
    if (isJoined && !countdown) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isJoined, countdown]);

  // Countdown when enough players join
  useEffect(() => {
    if (
      currentStation &&
      currentStation.currentPlayers.length >= (station?.minPlayers || 2) &&
      !countdown
    ) {
      setCountdown(5);
    }
  }, [currentStation?.currentPlayers.length]);

  // Countdown timer
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && station) {
      // Select random game and start
      const randomGame =
        MULTIPLAYER_GAMES[Math.floor(Math.random() * MULTIPLAYER_GAMES.length)];
      if (randomGame) {
        onGameStart(randomGame);
      }
    }
  }, [countdown]);

  const handleJoin = async () => {
    if (!station) return;
    setError(null);
    await joinStation(station.id);
  };

  const handleLeave = async () => {
    await leaveStation();
  };

  if (!station) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <LinearGradient
          colors={["#1A1A2E", "#16213E", "#0F3460"]}
          style={styles.container}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.stationName}>{station.name}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Status Badge */}
          <View
            style={[styles.statusBadge, isJoined && styles.statusBadgeJoined]}
          >
            <Text style={styles.statusText}>
              {countdown !== null
                ? `🎮 Starting in ${countdown}...`
                : isJoined
                  ? "🟢 Waiting for opponents..."
                  : `🎯 ${currentPlayers.length}/${station.maxPlayers} Players`}
            </Text>
          </View>

          {/* Stake Info */}
          <View style={styles.stakeContainer}>
            <Text style={styles.stakeLabel}>Entry Stake</Text>
            <Text style={styles.stakeAmount}>🪙 {station.stakeAmount} AP</Text>
            <Text style={styles.poolInfo}>
              Prize Pool: 🪙 {currentPlayers.length * station.stakeAmount} AP
            </Text>
          </View>

          {/* Players List */}
          <View style={styles.playersContainer}>
            <Text style={styles.playersTitle}>Players in Arena</Text>
            <View style={styles.playerSlots}>
              {Array.from({ length: station.maxPlayers }).map((_, index) => {
                const player = currentPlayers[index];
                const isCurrentUser = player?.address === walletAddress;

                return (
                  <Animated.View
                    key={index}
                    style={[
                      styles.playerSlot,
                      player && styles.playerSlotFilled,
                      isCurrentUser && styles.playerSlotCurrent,
                      { transform: [{ scale: isCurrentUser ? pulseAnim : 1 }] },
                    ]}
                  >
                    {player ? (
                      <>
                        <Text style={styles.playerEmoji}>
                          {isCurrentUser ? "👤" : "🎮"}
                        </Text>
                        <Text style={styles.playerName}>
                          {isCurrentUser ? "You" : player.displayName}
                        </Text>
                        <Text style={styles.playerStake}>
                          🪙 {player.stakedAmount}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.emptySlotEmoji}>⏳</Text>
                        <Text style={styles.emptySlotText}>Waiting...</Text>
                      </>
                    )}
                  </Animated.View>
                );
              })}
            </View>
          </View>

          {/* Game Preview */}
          <View style={styles.gamePreview}>
            <Text style={styles.gamePreviewTitle}>Possible Games</Text>
            <View style={styles.gameIcons}>
              {MULTIPLAYER_GAMES.slice(0, 4).map((gameType) => {
                const config = GAME_CONFIGS[gameType];
                return (
                  <View
                    key={gameType}
                    style={[styles.gameIcon, { backgroundColor: config.color }]}
                  >
                    <Text style={styles.gameEmoji}>{config.icon}</Text>
                  </View>
                );
              })}
              <View style={styles.moreGames}>
                <Text style={styles.moreGamesText}>
                  +{MULTIPLAYER_GAMES.length - 4}
                </Text>
              </View>
            </View>
            <Text style={styles.gameNote}>
              Game selected randomly when match starts!
            </Text>
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            {isJoined ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.leaveButton]}
                onPress={handleLeave}
                disabled={isLoading || countdown !== null}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.actionButtonText}>
                    {countdown !== null ? "Game Starting..." : "Leave Arena"}
                  </Text>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.joinButton,
                  !canJoin && styles.actionButtonDisabled,
                ]}
                onPress={handleJoin}
                disabled={!canJoin || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.actionButtonText}>
                    {apBalance < station.stakeAmount
                      ? `Need ${station.stakeAmount} AP`
                      : `Join Arena (${station.stakeAmount} AP)`}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Your Balance */}
          <Text style={styles.balanceInfo}>
            Your Balance: 🪙 {apBalance} AP
          </Text>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  stationName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 18,
  },
  statusBadge: {
    backgroundColor: "rgba(131, 110, 249, 0.3)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#836EF9",
  },
  statusBadgeJoined: {
    backgroundColor: "rgba(6, 255, 165, 0.2)",
    borderColor: "#06FFA5",
  },
  statusText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  stakeContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  stakeLabel: {
    color: "#A594FF",
    fontSize: 14,
    marginBottom: 4,
  },
  stakeAmount: {
    color: "#FFD93D",
    fontSize: 32,
    fontWeight: "800",
  },
  poolInfo: {
    color: "#06FFA5",
    fontSize: 16,
    marginTop: 8,
    fontWeight: "600",
  },
  playersContainer: {
    marginBottom: 20,
  },
  playersTitle: {
    color: "#A594FF",
    fontSize: 14,
    marginBottom: 12,
    textAlign: "center",
  },
  playerSlots: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 12,
  },
  playerSlot: {
    width: (SCREEN_WIDTH - 80) / 2,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderStyle: "dashed",
    alignItems: "center",
  },
  playerSlotFilled: {
    backgroundColor: "rgba(131, 110, 249, 0.2)",
    borderColor: "#836EF9",
    borderStyle: "solid",
  },
  playerSlotCurrent: {
    backgroundColor: "rgba(6, 255, 165, 0.2)",
    borderColor: "#06FFA5",
  },
  playerEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  playerName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  playerStake: {
    color: "#FFD93D",
    fontSize: 12,
  },
  emptySlotEmoji: {
    fontSize: 24,
    marginBottom: 8,
    opacity: 0.5,
  },
  emptySlotText: {
    color: "rgba(255, 255, 255, 0.3)",
    fontSize: 12,
  },
  gamePreview: {
    alignItems: "center",
    marginBottom: 20,
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
  },
  gamePreviewTitle: {
    color: "#A594FF",
    fontSize: 12,
    marginBottom: 12,
  },
  gameIcons: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  gameIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  gameEmoji: {
    fontSize: 20,
  },
  moreGames: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  moreGamesText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  gameNote: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 11,
    fontStyle: "italic",
  },
  errorContainer: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: "#EF4444",
    textAlign: "center",
    fontSize: 14,
  },
  actions: {
    marginBottom: 16,
  },
  actionButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  joinButton: {
    backgroundColor: "#836EF9",
  },
  leaveButton: {
    backgroundColor: "#EF4444",
  },
  actionButtonDisabled: {
    backgroundColor: "rgba(131, 110, 249, 0.3)",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  balanceInfo: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 12,
    textAlign: "center",
  },
});

