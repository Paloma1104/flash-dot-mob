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

interface PatternLockGameProps {
  difficulty: "easy" | "medium" | "hard";
  onComplete: (score: number, timeSpent?: number) => void;
  onCancel: () => void;
}

const GRID_SIZE = 3;
const PATTERN_LENGTHS = { easy: 4, medium: 6, hard: 9 };

export function PatternLockGame({
  difficulty,
  onComplete,
  onCancel,
}: PatternLockGameProps) {
  const [pattern, setPattern] = useState<number[]>([]);
  const [userPattern, setUserPattern] = useState<number[]>([]);
  const [isShowing, setIsShowing] = useState(true);
  const [currentShowIndex, setCurrentShowIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(Date.now());
  const [isComplete, setIsComplete] = useState(false);

  const celebrationScale = useSharedValue(1);

  useEffect(() => {
    generatePattern();
  }, []);

  useEffect(() => {
    if (isShowing && pattern.length > 0) {
      showPattern();
    }
  }, [isShowing, pattern]);

  const generatePattern = () => {
    const length = PATTERN_LENGTHS[difficulty];
    const dots = Array.from({ length: 9 }, (_, i) => i);
    const newPattern: number[] = [];

    while (newPattern.length < length) {
      const randomIndex = Math.floor(Math.random() * dots.length);
      const dot = dots[randomIndex];
      if (dot !== undefined && !newPattern.includes(dot)) {
        newPattern.push(dot);
      }
    }

    setPattern(newPattern);
  };

  const showPattern = async () => {
    for (let i = 0; i < pattern.length; i++) {
      setCurrentShowIndex(i);
      await new Promise((resolve) => setTimeout(resolve, 600));
    }

    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsShowing(false);
    setCurrentShowIndex(-1);
  };

  const handleDotPress = (index: number) => {
    if (isShowing || isComplete) return;
    if (userPattern.includes(index)) return;

    const newPattern = [...userPattern, index];
    setUserPattern(newPattern);
    Vibration.vibrate(10);

    if (newPattern.length === pattern.length) {
      checkPattern(newPattern);
    }
  };

  const checkPattern = (userPat: number[]) => {
    const isCorrect = userPat.every((dot, idx) => dot === pattern[idx]);

    if (isCorrect) {
      setIsComplete(true);
      celebrationScale.value = withSpring(1.2, {}, () => {
        celebrationScale.value = withSpring(1);
      });
      Vibration.vibrate(20);

      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      const score = Math.max(0, 1000 - attempts * 200 - timeSpent);
      setTimeout(() => onComplete(score, timeSpent), 1500);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      Vibration.vibrate([0, 50, 50, 50]);

      // Game over if too many attempts
      if (newAttempts >= 5) {
        setIsComplete(true);
        setTimeout(
          () => onComplete(0, Math.floor((Date.now() - startTime) / 1000)),
          1500,
        );
        return;
      }

      setTimeout(() => {
        setUserPattern([]);
        if (newAttempts >= 2) {
          setIsShowing(true);
          setCurrentShowIndex(0);
        }
      }, 1000);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: celebrationScale.value }],
  }));

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#F38181", "#E74C3C"]} style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🔐 Pattern Lock</Text>
        <View style={styles.stats}>
          <Text style={styles.statText}>
            Attempts: {attempts} | Length: {pattern.length}
          </Text>
        </View>
      </LinearGradient>

      {isComplete ? (
        <Animated.View style={[styles.completionContainer, animatedStyle]}>
          <Text style={styles.completionEmoji}>🎉</Text>
          <Text style={styles.completionText}>Pattern Unlocked!</Text>
          <Text style={styles.completionSubtext}>Calculating rewards...</Text>
        </Animated.View>
      ) : (
        <View style={styles.gameContainer}>
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              {isShowing
                ? "👀 Watch the pattern..."
                : "🎮 Recreate the pattern!"}
            </Text>
          </View>

          <View style={styles.lockGrid}>
            {Array.from({ length: 9 }).map((_, index) => {
              const row = Math.floor(index / GRID_SIZE);
              const col = index % GRID_SIZE;
              const isInPattern = pattern.includes(index);
              const isShown = isShowing && pattern[currentShowIndex] === index;
              const isSelected = userPattern.includes(index);
              const patternIndex = userPattern.indexOf(index);

              return (
                <TouchableOpacity
                  key={index}
                  style={styles.dot}
                  onPress={() => handleDotPress(index)}
                  disabled={isShowing}
                >
                  <LinearGradient
                    colors={
                      isShown || isSelected
                        ? ["#F38181", "#E74C3C"]
                        : ["#1A1A2E", "#16213E"]
                    }
                    style={[
                      styles.dotGradient,
                      (isShown || isSelected) && styles.dotActive,
                    ]}
                  >
                    {isSelected && (
                      <Text style={styles.dotNumber}>{patternIndex + 1}</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>

          {!isShowing && (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => setUserPattern([])}
            >
              <LinearGradient
                colors={["#FFD93D", "#F5C400"]}
                style={styles.resetGradient}
              >
                <Text style={styles.resetText}>↻ Reset Pattern</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
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
    shadowColor: "#F38181",
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
    color: "#FFF",
    fontSize: 28,
    fontWeight: "bold",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFF",
    textAlign: "center",
    marginBottom: 10,
  },
  stats: {
    alignItems: "center",
  },
  statText: {
    color: "#FFF",
    fontSize: 16,
    opacity: 0.9,
  },
  gameContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "space-around",
  },
  statusContainer: {
    alignItems: "center",
    padding: 20,
  },
  statusText: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },
  lockGrid: {
    width: 300,
    height: 300,
    alignSelf: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
  },
  dot: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    elevation: 5,
  },
  dotGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#F38181",
    borderRadius: 40,
  },
  dotActive: {
    elevation: 15,
    transform: [{ scale: 1.1 }],
  },
  dotNumber: {
    color: "#FFF",
    fontSize: 28,
    fontWeight: "bold",
  },
  resetButton: {
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
    elevation: 5,
    marginHorizontal: 40,
  },
  resetGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  resetText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "bold",
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
