import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

interface SpotDifferenceGameProps {
  difficulty: "easy" | "medium" | "hard";
  onComplete: (score: number, timeSpent?: number) => void;
  onCancel: () => void;
}

const DIFFERENCE_COUNTS = { easy: 3, medium: 5, hard: 8 };

export function SpotDifferenceGame({
  difficulty,
  onComplete,
  onCancel,
}: SpotDifferenceGameProps) {
  const [differences, setDifferences] = useState<number[]>([]);
  const [found, setFound] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [startTime] = useState(Date.now());
  const [isComplete, setIsComplete] = useState(false);

  const celebrationScale = useSharedValue(1);

  useEffect(() => {
    generateDifferences();
  }, []);

  const generateDifferences = () => {
    const count = DIFFERENCE_COUNTS[difficulty];
    const diffs = Array.from({ length: 25 }, (_, i) => i)
      .sort(() => Math.random() - 0.5)
      .slice(0, count);
    setDifferences(diffs);
  };

  const handleCellPress = (index: number) => {
    if (isComplete) return;
    if (found.includes(index)) return;

    if (differences.includes(index)) {
      const newFound = [...found, index];
      setFound(newFound);
      Vibration.vibrate(20);

      celebrationScale.value = withSpring(1.1, {}, () => {
        celebrationScale.value = withSpring(1);
      });

      if (newFound.length === differences.length) {
        setIsComplete(true);
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        const score = Math.max(0, 1000 - mistakes * 100 - timeSpent);
        setTimeout(() => onComplete(score, timeSpent), 1500);
      }
    } else {
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      Vibration.vibrate([0, 50, 50, 50]);

      // Game over if too many mistakes
      if (newMistakes >= 5) {
        setIsComplete(true);
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        setTimeout(() => onComplete(0, timeSpent), 1500);
      }
    }
  };

  const getCellColor = (index: number): [string, string] => {
    if (found.includes(index)) {
      return ["#06FFA5", "#00C9A7"];
    }
    if (differences.includes(index)) {
      return ["#FCBAD3", "#F8A5C2"];
    }
    return ["#1A1A2E", "#16213E"];
  };

  const getCellEmoji = (index: number): string => {
    const emojis = [
      "🎯",
      "🎮",
      "🎨",
      "🎭",
      "🎪",
      "🎬",
      "🎸",
      "🎹",
      "🎺",
      "🎻",
      "⚡",
      "🔥",
      "💎",
      "🌟",
      "✨",
      "🎯",
      "🎲",
      "🎰",
      "🃏",
      "🎴",
      "🏆",
      "🥇",
      "🥈",
      "🥉",
      "🏅",
    ];

    if (differences.includes(index)) {
      return "❌";
    }
    return emojis[index % emojis.length] ?? "🎯";
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: celebrationScale.value }],
  }));

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#FCBAD3", "#F8A5C2"]} style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>👀 Spot the Difference</Text>
        <View style={styles.stats}>
          <Text style={styles.statText}>
            Found: {found.length}/{differences.length} | Mistakes: {mistakes}/5
          </Text>
        </View>
      </LinearGradient>

      {isComplete ? (
        <Animated.View style={[styles.completionContainer, animatedStyle]}>
          <Text style={styles.completionEmoji}>🎉</Text>
          <Text style={styles.completionText}>All Found!</Text>
          <Text style={styles.completionSubtext}>Calculating rewards...</Text>
        </Animated.View>
      ) : (
        <View style={styles.gameContainer}>
          <View style={styles.instructionContainer}>
            <Text style={styles.instructionText}>
              Tap the cells that are different!
            </Text>
            <Text style={styles.hintText}>
              ❌ = Different | 👀 Look for patterns
            </Text>
          </View>

          <View style={styles.grid}>
            {Array.from({ length: 25 }).map((_, index) => (
              <TouchableOpacity
                key={index}
                style={styles.cell}
                onPress={() => handleCellPress(index)}
              >
                <LinearGradient
                  colors={getCellColor(index)}
                  style={styles.cellGradient}
                >
                  <Text style={styles.cellEmoji}>{getCellEmoji(index)}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              {differences.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    {
                      backgroundColor:
                        index < found.length ? "#06FFA5" : "#1A1A2E",
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0F",
  },
  header: {
    padding: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 10,
    shadowColor: "#FCBAD3",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
  },
  closeText: {
    color: "#000",
    fontSize: 28,
    fontWeight: "bold",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
    marginBottom: 10,
  },
  stats: {
    alignItems: "center",
  },
  statText: {
    color: "#000",
    fontSize: 16,
    opacity: 0.9,
    fontWeight: "600",
  },
  gameContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "space-around",
  },
  instructionContainer: {
    alignItems: "center",
    padding: 15,
  },
  instructionText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  hintText: {
    color: "#AAA",
    fontSize: 14,
    textAlign: "center",
  },
  grid: {
    width: 320,
    height: 320,
    alignSelf: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    backgroundColor: "#0F3460",
    padding: 10,
    borderRadius: 15,
    elevation: 10,
  },
  cell: {
    width: 58,
    height: 58,
    borderRadius: 10,
    overflow: "hidden",
    elevation: 3,
  },
  cellGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cellEmoji: {
    fontSize: 24,
  },
  progressContainer: {
    alignItems: "center",
    padding: 20,
  },
  progressBar: {
    flexDirection: "row",
    gap: 10,
  },
  progressDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  completionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  completionEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  completionText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 10,
  },
  completionSubtext: {
    fontSize: 18,
    color: "#AAA",
  },
});
