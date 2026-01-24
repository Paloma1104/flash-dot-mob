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

import { useGameStore } from "@/stores/gameStore";
import { useUserStore } from "@/stores/userStore";
import type { GameDrop } from "@/types/game";
import { GAME_CONFIGS, GameType } from "@/types/game";
import { useStartGame, useClaimReward } from "@/hooks/useBlockchain";
import { useWallet } from "@/hooks/useWallet";
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
  const { apBalance } = useUserStore();
  const { isConnected, address } = useWallet();
  const { startGame: startGameOnChain, isLoading: isStarting, error: startError } = useStartGame();
  const { claimReward, isLoading: isClaiming, error: claimError } = useClaimReward();

  if (!gameDrop) return null;

  const config = GAME_CONFIGS[gameDrop.gameType];
  const hasEnoughAP = apBalance >= gameDrop.apCost;

  const handleStartGame = async () => {
    // Check wallet connection
    if (!isConnected || !address) {
      Alert.alert("Wallet Not Connected", "Please connect your wallet to play games.");
      return;
    }

    // Check AP balance
    if (!hasEnoughAP) {
      Alert.alert(
        "Insufficient AP Tokens",
        `You need ${gameDrop.apCost} AP to play this game. You have ${apBalance.toFixed(0)} AP.\n\nPurchase more AP tokens to continue.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Buy AP",
            onPress: () => {
              console.log("Open AP purchase modal");
            },
          },
        ],
      );
      return;
    }

    try {
      // Call blockchain to burn AP and start game
      const txHash = await startGameOnChain(
        gameDrop.id, // sessionId
        gameDrop.gameType,
        gameDrop.difficulty
      );

      if (txHash) {
        // Update local state only after blockchain success
        const success = await startGame(gameDrop);
        if (success) {
          setGameStarted(true);
        }
      }
    } catch (error) {
      console.error("Failed to start game:", error);
      Alert.alert(
        "Transaction Failed", 
        startError || "Failed to start game on blockchain. Please try again."
      );
    }
  };

  const handleCompleteGame = (score: number, timeSpent: number = 0) => {
    setGameResults({ score, timeSpent });
    completeGame(score, timeSpent);
    setGameStarted(false);
    setShowResults(true);
    // Don't close immediately - show results first
  };

  const handleClaimRewards = async () => {
    if (!gameResults || !gameDrop) {
      onClose();
      return;
    }

    // Only claim if player won
    if (gameResults.score <= 0) {
      setShowResults(false);
      setGameResults(null);
      onClose();
      return;
    }

    try {
      // Call backend to get signature, then claim on-chain
      const txHash = await claimReward(
        gameDrop.id, // sessionId
        gameResults.score,
        gameDrop.difficulty,
        gameDrop.gameType
      );

      if (txHash) {
        console.log("✅ Rewards claimed on-chain:", txHash);
        Alert.alert("Success!", `Earned ${gameDrop.rewardAmount} AP Tokens!\n\nTransaction: ${txHash.slice(0, 10)}...`);
      }
    } catch (error) {
      console.error("Failed to claim rewards:", error);
      Alert.alert(
        "Claim Failed",
        claimError || "Failed to claim rewards. Please try again."
      );
    } finally {
      setShowResults(false);
      setGameResults(null);
      onClose();
    }
  };

  const handleCancelGame = () => {
    cancelGame();
    setGameStarted(false);
    setShowResults(false);
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
    const rewardEarned = didWin ? gameDrop.rewardAmount : 0;

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
                    {Math.floor(gameResults.timeSpent / 60)}:{String(gameResults.timeSpent % 60).padStart(2, '0')}
                  </Text>
                </View>
              </View>

              {didWin && (
                <View style={styles.rewardSection}>
                  <Text style={styles.rewardLabel}>Rewards Earned</Text>
                  <View style={styles.rewardAmount}>
                    <Text style={styles.rewardValue}>+{rewardEarned}</Text>
                    <Text style={styles.rewardToken}>AP</Text>
                  </View>
                  <Text style={styles.rewardSubtext}>
                    Added to your balance
                  </Text>
                </View>
              )}

              {!didWin && (
                <View style={styles.tryAgainSection}>
                  <Text style={styles.tryAgainText}>
                    💪 Keep practicing to earn MON!
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.claimButton}
                onPress={handleClaimRewards}
                disabled={isClaiming}
              >
                <View
                  style={[
                    styles.claimGradient,
                    didWin ? styles.claimButtonWin : styles.claimButtonLose,
                  ]}
                >
                  <Text style={styles.claimButtonText}>
                    {didWin ? "✨ Claim Rewards" : "← Back to Map"}
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
                  <Text
                    style={[
                      styles.infoValue,
                      { color: hasEnoughAP ? "#4ECDC4" : "#FF6B9D" },
                    ]}
                  >
                    {gameDrop.apCost} AP
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>💰 Reward:</Text>
                  <Text style={styles.infoValue}>
                    {gameDrop.rewardAmount} AP
                  </Text>
                </View>

                {!hasEnoughAP && (
                  <View style={styles.warningBox}>
                    <Text style={styles.warningText}>
                      ⚠️ You need {gameDrop.apCost - apBalance} more AP tokens
                      to play
                    </Text>
                  </View>
                )}
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
                  • Complete the challenge to earn MON tokens{"\n"}• Higher
                  difficulty = More rewards{"\n"}• Faster completion = Bonus
                  points{"\n"}• You can only play each game once!
                </Text>
              </View>
            </ScrollView>

            <View style={styles.cardFooter}>
              <TouchableOpacity
                style={styles.playButton}
                onPress={handleStartGame}
                disabled={isStarting || !hasEnoughAP}
              >
                <LinearGradient
                  colors={[config.color, "#836EF9"]}
                  style={styles.playGradient}
                >
                  <Text style={styles.playButtonText}>
                    {isStarting ? "⏳ Starting..." : "🎮 Start Game"}
                  </Text>
                  <Text style={styles.playButtonSubtext}>
                    {isStarting ? "Burning AP on-chain..." : `Win ${gameDrop.rewardAmount} AP`}
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
});

