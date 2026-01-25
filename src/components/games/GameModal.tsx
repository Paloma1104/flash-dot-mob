import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { useGameCredits } from "@/hooks/useGameCredits";
import { useWallet } from "@/hooks/useWallet";
import { useGameStore } from "@/stores/gameStore";
import type { GameDrop } from "@/types/game";
import { GAME_CONFIGS, GameType } from "@/types/game";
import {
    ColorSequenceGame,
    MathChallengeGame,
    MemoryMatchGame,
    PatternLockGame,
    Puzzle2048Game,
    SimonSaysGame,
    SpotDifferenceGame,
    SudokuGame,
    TicTacToeGame,
    WordScrambleGame,
} from "./index";

interface GameModalProps {
  visible: boolean;
  gameDrop: GameDrop | null;
  onClose: () => void;
}

export function GameModal({ visible, gameDrop, onClose }: GameModalProps) {
  const [gameStarted, setGameStarted] = React.useState(false);
  const [showResults, setShowResults] = React.useState(false);
  const [gameResults, setGameResults] = React.useState<{
    score: number;
    timeSpent: number;
  } | null>(null);

  const { startGame, completeGame, cancelGame } = useGameStore();
  const { isConnected, address } = useWallet();
  const {
    buyCredits,
    startGame: startGameOffChain,
    completeGame: completeGameOffChain,
    isLoading: isStarting,
    error: startError,
  } = useGameCredits();

  const [txHash, setTxHash] = React.useState<string | null>(null);

  // Reset state when modal closes or gameDrop changes
  React.useEffect(() => {
    if (!visible) {
      setGameStarted(false);
      setShowResults(false);
      setGameResults(null);
      setTxHash(null);
    }
  }, [visible]);

  // Legacy variables set to null/false for compatibility if needed
  const isClaiming = false;

  if (!gameDrop) return null;

  const config = GAME_CONFIGS[gameDrop.gameType];

  const handleStartGame = async () => {
    // Check wallet connection
    if (!isConnected || !address) {
      Alert.alert(
        "Wallet Not Connected",
        "Please connect your wallet to play games.",
      );
      return;
    }

    try {
      // Call backend to deduct credits
      const { success, txHash: startTxHash } = await startGameOffChain(
        gameDrop.gameType,
      );

      if (success) {
        // Update local state
        const localSuccess = await startGame(gameDrop);
        if (localSuccess) {
          setGameStarted(true);
          setTxHash(null); // Clear previous hash
        }
      } else {
        // Handle Insufficient Credits specifically
        if (
          startError === "Insufficient credits" ||
          startError?.includes("credits")
        ) {
          Alert.alert(
            "Insufficient Credits",
            "You need 5 Credits to play. Buy 50 Credits now?",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Buy 50 Credits",
                onPress: async () => {
                  // Virtual Purchase (Backend Signer)
                  const { success: buySuccess, txHash: buyTxHash } =
                    await buyCredits();
                  if (buySuccess) {
                    Alert.alert("Success!", "50 Credits added to your account.", [
                      { text: "Play Now", onPress: () => handleStartGame() },
                    ]);
                    setTxHash(buyTxHash);
                  } else {
                    Alert.alert("Error", "Credit purchase failed.");
                  }
                },
              },
            ],
          );
        } else {
          Alert.alert("Start Failed", startError || "Please try again.");
        }
      }
    } catch (error) {
      console.error("Failed to start game:", error);
      Alert.alert(
        "Start Failed",
        startError || "Failed to start game. Please try again.",
      );
    }
  };

  const handleCompleteGame = async (score: number, timeSpent: number = 0) => {
    setGameResults({ score, timeSpent });

    // 1. Update local store
    completeGame(score, timeSpent);

    // 2. Call backend to award points
    if (score > 0) {
      const { success, txHash: completeTxHash } =
        await completeGameOffChain(score);
      if (success && completeTxHash) {
        setTxHash(completeTxHash);
      }
    }

    setGameStarted(false);
    setShowResults(true);
  };

  const handleCancelGame = () => {
    cancelGame();
    setGameStarted(false);
    setShowResults(false);
    setGameResults(null);
    setTxHash(null);
    onClose();
  };

  const handleCloseResults = () => {
    setGameStarted(false);
    setShowResults(false);
    setGameResults(null);
    setTxHash(null);
    onClose();
  };

  const renderGame = () => {
    const gameProps = {
      difficulty: gameDrop.difficulty,
      onComplete: handleCompleteGame,
      onCancel: handleCancelGame,
    };

    switch (gameDrop.gameType) {
      case GameType.SUDOKU:
        return <SudokuGame {...gameProps} />;
      case GameType.MEMORY_MATCH:
        return <MemoryMatchGame {...gameProps} />;
      case GameType.PUZZLE_2048:
        return <Puzzle2048Game {...gameProps} />;
      case GameType.TIC_TAC_TOE:
        return <TicTacToeGame {...gameProps} />;
      case GameType.COLOR_SEQUENCE:
        return <ColorSequenceGame {...gameProps} />;
      case GameType.WORD_SCRAMBLE:
        return <WordScrambleGame {...gameProps} />;
      case GameType.MATH_CHALLENGE:
        return <MathChallengeGame {...gameProps} />;
      case GameType.PATTERN_LOCK:
        return <PatternLockGame {...gameProps} />;
      case GameType.SIMON_SAYS:
        return <SimonSaysGame {...gameProps} />;
      case GameType.SPOT_DIFFERENCE:
        return <SpotDifferenceGame {...gameProps} />;
      default:
        return null;
    }
  };

  if (gameStarted) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        {renderGame()}
      </Modal>
    );
  }

  // Results Screen
  if (showResults && gameResults) {
    const didWin = gameResults.score > 0;
    const pointsEarned = didWin ? Math.floor(gameResults.score / 10) : 0;

    return (
      <Modal visible={visible} transparent animationType="fade">
        <BlurView intensity={90} style={styles.overlay}>
          <View style={styles.resultsContainer}>
            <View
              style={[
                styles.resultsCard,
                didWin ? styles.resultsCardWin : styles.resultsCardLose,
              ]}
            >
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsEmoji}>{didWin ? "🎉" : "💔"}</Text>
                <Text style={styles.resultsTitle}>
                  {didWin ? "VICTORY!" : "GAME OVER"}
                </Text>
                <Text style={styles.resultsSubtitle}>
                  {didWin
                    ? "Outstanding performance!"
                    : "Don't give up, try again!"}
                </Text>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Score</Text>
                  <Text style={styles.statValue}>{gameResults.score}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Time</Text>
                  <Text style={styles.statValue}>
                    {Math.floor(gameResults.timeSpent / 60)}:
                    {String(gameResults.timeSpent % 60).padStart(2, "0")}
                  </Text>
                </View>
              </View>

              {didWin && (
                <View style={styles.rewardSection}>
                  <Text style={styles.rewardLabel}>Rewards Earned</Text>
                  <View style={styles.rewardAmount}>
                    <Text style={styles.rewardValue}>+{pointsEarned}</Text>
                    <Text style={styles.rewardToken}>POINTS</Text>
                  </View>

                  {txHash && (
                    <View style={styles.txBox}>
                      <Text style={styles.txLabel}>
                        Virtual Wallet Tx Confirmed:
                      </Text>
                      <Text style={styles.txHash}>
                        {txHash.slice(0, 10)}...{txHash.slice(-8)}
                      </Text>
                    </View>
                  )}

                  <Text style={styles.rewardSubtext}>
                    Value added to global ledger
                  </Text>
                </View>
              )}

              {!didWin && (
                <View style={styles.tryAgainSection}>
                  <Text style={styles.tryAgainText}>
                    💪 Keep practicing to earn points!
                  </Text>
                </View>
              )}

              <TouchableOpacity style={styles.claimButton} onPress={handleCloseResults}>
                <View
                  style={[
                    styles.claimGradient,
                    didWin ? styles.claimButtonWin : styles.claimButtonLose,
                  ]}
                >
                  <Text style={styles.claimButtonText}>
                    {didWin ? "Continue" : "Back to Map"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <BlurView intensity={80} style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.card}>
            <LinearGradient
              colors={[config.color, "#0D0D0F"]}
              style={styles.cardHeader}
            >
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>

              <Text style={styles.gameIcon}>{config.icon}</Text>
              <Text style={styles.gameName}>{config.name}</Text>
              <Text style={styles.gameDescription}>{config.description}</Text>
            </LinearGradient>

            <ScrollView style={styles.cardContent}>
              <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>⏱️ Estimated Time:</Text>
                  <Text style={styles.infoValue}>
                    {Math.ceil(config.estimatedTime / 60)} minutes
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>🎮 Difficulty:</Text>
                  <Text
                    style={[
                      styles.infoValue,
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
                    {gameDrop.difficulty.toUpperCase()}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>🎟️ Cost to Play:</Text>
                  <Text style={[styles.infoValue, { color: "#FF6B9D" }]}>
                    5 Credits
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>💰 Reward:</Text>
                  <Text style={[styles.infoValue, { color: "#06FFA5" }]}>
                    Points (Score ÷ 10)
                  </Text>
                </View>
              </View>

              <View style={styles.difficultyInfo}>
                <Text style={styles.difficultyTitle}>Difficulty Details:</Text>
                <Text style={styles.difficultyText}>
                  {config.difficultyLevels[gameDrop.difficulty].description}
                </Text>
              </View>

              <View style={styles.rulesSection}>
                <Text style={styles.rulesTitle}>How to Play:</Text>
                <Text style={styles.rulesText}>
                  • Costs 5 Credits to start{"\n"}• Earn Points based on your score{"\n"}• 
                  Higher score = More points{"\n"}• Points = Score ÷ 10
                </Text>
              </View>
            </ScrollView>

            <View style={styles.cardFooter}>
              <TouchableOpacity
                style={styles.playButton}
                onPress={handleStartGame}
                disabled={isStarting}
              >
                <LinearGradient
                  colors={[config.color, "#836EF9"]}
                  style={styles.playGradient}
                >
                  <Text style={styles.playButtonText}>
                    {isStarting ? "⏳ Starting..." : "🎮 Start Game"}
                  </Text>
                  <Text style={styles.playButtonSubtext}>
                    {isStarting ? "Processing..." : `Cost: 5 Credits`}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContainer: {
    width: "90%",
    maxHeight: "80%",
  },
  card: {
    backgroundColor: "#0D0D0F",
    borderRadius: 30,
    overflow: "hidden",
    elevation: 20,
    shadowColor: "#836EF9",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
  },
  cardHeader: {
    padding: 30,
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 15,
    right: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeText: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "bold",
  },
  gameIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  gameName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 10,
  },
  gameDescription: {
    fontSize: 16,
    color: "#AAA",
    textAlign: "center",
  },
  cardContent: {
    padding: 20,
    maxHeight: 300,
  },
  infoSection: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A2E",
  },
  infoLabel: {
    fontSize: 16,
    color: "#AAA",
  },
  infoValue: {
    fontSize: 16,
    color: "#FFF",
    fontWeight: "600",
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    color: "#000",
    fontSize: 14,
    fontWeight: "bold",
  },
  difficultyInfo: {
    backgroundColor: "#1A1A2E",
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
  },
  difficultyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 8,
  },
  difficultyText: {
    fontSize: 14,
    color: "#AAA",
    lineHeight: 20,
  },
  rulesSection: {
    backgroundColor: "rgba(131, 110, 249, 0.1)",
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#836EF9",
  },
  rulesTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#836EF9",
    marginBottom: 8,
  },
  rulesText: {
    fontSize: 14,
    color: "#AAA",
    lineHeight: 22,
  },
  warningBox: {
    backgroundColor: "rgba(255, 107, 157, 0.15)",
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 157, 0.3)",
  },
  warningText: {
    fontSize: 13,
    color: "#FF6B9D",
    textAlign: "center",
    fontWeight: "600",
  },
  cardFooter: {
    padding: 20,
  },
  playButton: {
    height: 70,
    borderRadius: 35,
    overflow: "hidden",
    elevation: 10,
  },
  playGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  playButtonText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 4,
  },
  playButtonSubtext: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  // Results Screen Styles
  resultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  resultsCard: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 30,
    padding: 40,
    alignItems: "center",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  resultsCardWin: {
    backgroundColor: "#008B6B",
  },
  resultsCardLose: {
    backgroundColor: "#C44569",
  },
  resultsHeader: {
    alignItems: "center",
    marginBottom: 30,
  },
  resultsEmoji: {
    fontSize: 100,
    marginBottom: 15,
  },
  resultsTitle: {
    fontSize: 42,
    fontWeight: "900",
    color: "#FFF",
    marginBottom: 10,
    textAlign: "center",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  resultsSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.85)",
    textAlign: "center",
    fontWeight: "500",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 15,
    width: "100%",
    marginBottom: 30,
  },
  statBox: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 15,
    padding: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 5,
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
  },
  rewardSection: {
    width: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    marginBottom: 25,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  rewardLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  rewardAmount: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  rewardValue: {
    fontSize: 48,
    fontWeight: "900",
    color: "#FFF",
  },
  rewardToken: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
    opacity: 0.9,
  },
  rewardSubtext: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 8,
  },
  tryAgainSection: {
    width: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    marginBottom: 25,
  },
  tryAgainText: {
    fontSize: 16,
    color: "#FFF",
    textAlign: "center",
  },
  claimButton: {
    width: "100%",
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
    elevation: 10,
  },
  claimGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  claimButtonWin: {
    backgroundColor: "#6C5CE7",
  },
  claimButtonLose: {
    backgroundColor: "#444",
  },
  claimButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
  },
  txBox: {
    marginTop: 15,
    padding: 10,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(131, 110, 249, 0.3)",
    alignItems: "center",
  },
  txLabel: {
    fontSize: 12,
    color: "#AAA",
    marginBottom: 4,
  },
  txHash: {
    fontSize: 12,
    fontFamily: "monospace",
    color: "#836EF9",
  },
});
