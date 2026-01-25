import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { useMultiplayerStore } from "@/stores/multiplayerStore";
import { useUserStore } from "@/stores/userStore";
import { GAME_CONFIGS } from "@/types/game";
import type {
    MultiplayerPlayer,
    MultiplayerSession,
} from "@/types/multiplayer";

// Import game components
import { ColorSequenceGame } from "../games/ColorSequenceGame";
import { MathChallengeGame } from "../games/MathChallengeGame";
import { MemoryMatchGame } from "../games/MemoryMatchGame";
import { PatternLockGame } from "../games/PatternLockGame";
import { TicTacToeGame } from "../games/TicTacToeGame";
import { WordScrambleGame } from "../games/WordScrambleGame";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface MultiplayerGameModalProps {
  visible: boolean;
  session: MultiplayerSession | null;
  onGameComplete: (score: number) => void;
  onClose: () => void;
}

export function MultiplayerGameModal({
  visible,
  session,
  onGameComplete,
  onClose,
}: MultiplayerGameModalProps) {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [myScore, setMyScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [winner, setWinner] = useState<MultiplayerPlayer | null>(null);

  const { currentSession, submitGameResult, handleGameComplete } =
    useMultiplayerStore();
  const { walletAddress } = useUserStore();

  // Start game countdown
  useEffect(() => {
    if (visible && session && !gameStarted) {
      const timer = setTimeout(() => setGameStarted(true), 1500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [visible, session]);

  const handleScoreUpdate = useCallback((score: number) => {
    setMyScore(score);
  }, []);

  const handleGameEnd = useCallback(
    (finalScore: number, timeSpent?: number) => {
      setMyScore(finalScore);
      setGameEnded(true);

      if (session && walletAddress) {
        submitGameResult({
          stationId: session.stationId,
          playerId: walletAddress,
          score: finalScore,
          timeSpent: timeSpent || 0,
        });
      }

      // Simulate waiting for other players (in production, this comes from backend)
      setTimeout(() => {
        // For demo: determine winner based on scores
        const players = currentSession?.players || [];
        const myPlayer = players.find((p) => p.address === walletAddress);

        // In real implementation, winner comes from backend
        // For now, we'll just show our own score
        setShowResults(true);

        if (myPlayer) {
          handleGameComplete(walletAddress!, session!.totalPool);
        }

        onGameComplete(finalScore);
      }, 2000);
    },
    [
      session,
      walletAddress,
      currentSession,
      submitGameResult,
      handleGameComplete,
      onGameComplete,
    ],
  );

  const renderGame = () => {
    if (!session || !gameStarted) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#836EF9" />
          <Text style={styles.loadingText}>
            {gameStarted ? "Loading game..." : "Get ready!"}
          </Text>
        </View>
      );
    }

    if (gameEnded && !showResults) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#06FFA5" />
          <Text style={styles.loadingText}>Waiting for other players...</Text>
          <Text style={styles.scorePreview}>Your Score: {myScore}</Text>
        </View>
      );
    }

    if (showResults) {
      return (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>🎮 Game Complete!</Text>
          <Text style={styles.yourScore}>Your Score: {myScore}</Text>
          <View style={styles.prizeBox}>
            <Text style={styles.prizeLabel}>Prize Pool</Text>
            <Text style={styles.prizeAmount}>🪙 {session.totalPool} Credits</Text>
          </View>
          <Text style={styles.resultNote}>Results are being calculated...</Text>
        </View>
      );
    }

    const gameConfig = GAME_CONFIGS[session.gameType];
    const commonProps = {
      difficulty: "medium" as const,
      onComplete: handleGameEnd,
      onScoreUpdate: handleScoreUpdate,
      onCancel: () => {
        // In multiplayer, we don't allow canceling mid-game
        // but we need to provide the prop for interface compatibility
        console.log("Cannot cancel multiplayer game");
      },
    };

    switch (session.gameType) {
      case "TIC_TAC_TOE":
        return <TicTacToeGame {...commonProps} />;
      case "MEMORY_MATCH":
        return <MemoryMatchGame {...commonProps} />;
      case "MATH_CHALLENGE":
        return <MathChallengeGame {...commonProps} />;
      case "COLOR_SEQUENCE":
        return <ColorSequenceGame {...commonProps} />;
      case "WORD_SCRAMBLE":
        return <WordScrambleGame {...commonProps} />;
      case "PATTERN_LOCK":
        return <PatternLockGame {...commonProps} />;
      default:
        return (
          <View style={styles.loadingContainer}>
            <Text style={styles.errorText}>Game not available</Text>
          </View>
        );
    }
  };

  if (!session) return null;

  const gameConfig = GAME_CONFIGS[session.gameType];

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <LinearGradient
        colors={["#0D0D0F", "#1A1A2E", "#16213E"]}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.gameInfo}>
            <View
              style={[styles.gameIcon, { backgroundColor: gameConfig.color }]}
            >
              <Text style={styles.gameEmoji}>{gameConfig.icon}</Text>
            </View>
            <View>
              <Text style={styles.gameName}>{gameConfig.name}</Text>
              <Text style={styles.gameMode}>🏆 Multiplayer Mode</Text>
            </View>
          </View>

          {/* Live Score */}
          <View style={styles.liveScore}>
            <Text style={styles.liveScoreLabel}>Score</Text>
            <Text style={styles.liveScoreValue}>{myScore}</Text>
          </View>
        </View>

        {/* Opponents Bar */}
        <View style={styles.opponentsBar}>
          <Text style={styles.opponentsLabel}>Competing against:</Text>
          <View style={styles.opponentsList}>
            {session.players
              .filter((p) => p.address !== walletAddress)
              .map((player, index) => (
                <View key={index} style={styles.opponentChip}>
                  <Text style={styles.opponentEmoji}>🎮</Text>
                  <Text style={styles.opponentName}>{player.displayName}</Text>
                </View>
              ))}
          </View>
        </View>

        {/* Game Area */}
        <View style={styles.gameArea}>{renderGame()}</View>

        {/* Prize Pool Footer */}
        <View style={styles.footer}>
          <Text style={styles.prizePoolLabel}>Prize Pool</Text>
          <Text style={styles.prizePoolValue}>🪙 {session.totalPool} Credits</Text>
          <Text style={styles.winnerTakesAll}>Winner takes all!</Text>
        </View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(131, 110, 249, 0.2)",
  },
  gameInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  gameIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  gameEmoji: {
    fontSize: 24,
  },
  gameName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  gameMode: {
    color: "#FFD93D",
    fontSize: 12,
    fontWeight: "600",
  },
  liveScore: {
    alignItems: "center",
    backgroundColor: "rgba(131, 110, 249, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  liveScoreLabel: {
    color: "#A594FF",
    fontSize: 10,
  },
  liveScoreValue: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
  },
  opponentsBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    gap: 8,
  },
  opponentsLabel: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 12,
  },
  opponentsList: {
    flexDirection: "row",
    gap: 8,
    flex: 1,
  },
  opponentChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  opponentEmoji: {
    fontSize: 12,
  },
  opponentName: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "600",
  },
  gameArea: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 18,
    marginTop: 16,
  },
  scorePreview: {
    color: "#FFD93D",
    fontSize: 24,
    fontWeight: "700",
    marginTop: 16,
  },
  resultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  resultsTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 24,
  },
  yourScore: {
    fontSize: 24,
    fontWeight: "700",
    color: "#06FFA5",
    marginBottom: 24,
  },
  prizeBox: {
    backgroundColor: "rgba(255, 217, 61, 0.2)",
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 24,
  },
  prizeLabel: {
    color: "#FFD93D",
    fontSize: 14,
    marginBottom: 8,
  },
  prizeAmount: {
    color: "#FFD93D",
    fontSize: 36,
    fontWeight: "800",
  },
  resultNote: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 14,
    fontStyle: "italic",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 18,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 16,
    paddingBottom: 32,
    backgroundColor: "rgba(255, 217, 61, 0.1)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 217, 61, 0.2)",
  },
  prizePoolLabel: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 12,
  },
  prizePoolValue: {
    color: "#FFD93D",
    fontSize: 24,
    fontWeight: "800",
  },
  winnerTakesAll: {
    color: "#06FFA5",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
});
