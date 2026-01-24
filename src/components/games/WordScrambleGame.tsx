import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

interface WordScrambleGameProps {
  difficulty: "easy" | "medium" | "hard";
  onComplete: (score: number, timeSpent?: number) => void;
  onCancel: () => void;
}

const WORDS = {
  easy: [
    "FLASH",
    "MONAD",
    "CRYPTO",
    "BLOCKCHAIN",
    "TOKEN",
    "WALLET",
    "COINS",
    "TRADE",
    "STAKE",
    "GAME",
  ],
  medium: [
    "ETHEREUM",
    "BITCOIN",
    "SOLIDITY",
    "DECENTRALIZED",
    "PROTOCOL",
    "NETWORK",
    "VALIDATOR",
    "CONSENSUS",
  ],
  hard: [
    "CRYPTOCURRENCY",
    "TRANSACTION",
    "DISTRIBUTED",
    "IMMUTABLE",
    "TOKENOMICS",
    "GOVERNANCE",
    "INTEROPERABILITY",
  ],
};

export function WordScrambleGame({
  difficulty,
  onComplete,
  onCancel,
}: WordScrambleGameProps) {
  const [words, setWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [scrambledWord, setScrambledWord] = useState("");
  const [userInput, setUserInput] = useState("");
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [startTime] = useState(Date.now());
  const [isComplete, setIsComplete] = useState(false);

  const celebrationScale = useSharedValue(1);
  const shakeOffset = useSharedValue(0);

  useEffect(() => {
    const selectedWords = WORDS[difficulty]
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);
    setWords(selectedWords);
    const firstWord = selectedWords[0];
    if (firstWord) {
      setScrambledWord(scrambleWord(firstWord));
    }
  }, []);

  const scrambleWord = (word: string): string => {
    const arr = word.split("");
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = arr[i];
      const swap = arr[j];
      if (temp !== undefined && swap !== undefined) {
        arr[i] = swap;
        arr[j] = temp;
      }
    }
    return arr.join("");
  };

  const handleSubmit = () => {
    if (isComplete) return;
    if (!userInput.trim()) return;

    const currentWord = words[currentWordIndex];
    if (userInput.toUpperCase() === currentWord) {
      setScore(score + 200);
      Vibration.vibrate(20);
      celebrationScale.value = withSpring(1.1, {}, () => {
        celebrationScale.value = withSpring(1);
      });

      if (currentWordIndex === words.length - 1) {
        setIsComplete(true);
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        const finalScore =
          score + 200 + Math.max(0, 1000 - mistakes * 50 - timeSpent);
        setTimeout(() => onComplete(finalScore, timeSpent), 1500);
      } else {
        setTimeout(() => {
          const nextIndex = currentWordIndex + 1;
          setCurrentWordIndex(nextIndex);
          const nextWord = words[nextIndex];
          if (nextWord) {
            setScrambledWord(scrambleWord(nextWord));
          }
          setUserInput("");
        }, 500);
      }
    } else {
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      Vibration.vibrate([0, 50, 50, 50]);
      shakeOffset.value = withSpring(10, {}, () => {
        shakeOffset.value = withSpring(-10, {}, () => {
          shakeOffset.value = withSpring(0);
        });
      });

      // Game over if too many mistakes
      if (newMistakes >= 3) {
        setIsComplete(true);
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        setTimeout(() => onComplete(0, timeSpent), 1500);
      }
    }
  };

  const handleHint = () => {
    const correctWord = words[currentWordIndex];
    if (!correctWord) return;
    const revealedLength = Math.ceil(correctWord.length / 3);
    setUserInput(correctWord.substring(0, revealedLength));
    setMistakes(mistakes + 1);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: celebrationScale.value }],
  }));

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeOffset.value }],
  }));

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#FF8B94", "#F67280"]} style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📝 Word Scramble</Text>
        <View style={styles.stats}>
          <Text style={styles.statText}>
            Word {currentWordIndex + 1}/{words.length} | Score: {score} |
            Mistakes: {mistakes}/3
          </Text>
        </View>
      </LinearGradient>

      {isComplete ? (
        <Animated.View style={[styles.completionContainer, animatedStyle]}>
          <Text style={styles.completionEmoji}>🎉</Text>
          <Text style={styles.completionText}>All Words Solved!</Text>
          <Text style={styles.completionSubtext}>Calculating rewards...</Text>
        </Animated.View>
      ) : (
        <View style={styles.gameContainer}>
          <View style={styles.wordContainer}>
            <Text style={styles.label}>Unscramble this word:</Text>
            <Animated.View style={[styles.scrambledContainer, shakeStyle]}>
              <Text style={styles.scrambledText}>{scrambledWord}</Text>
            </Animated.View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Your Answer:</Text>
            <TextInput
              style={styles.input}
              value={userInput}
              onChangeText={setUserInput}
              placeholder="Type the word..."
              placeholderTextColor="#666"
              autoCapitalize="characters"
              autoCorrect={false}
              onSubmitEditing={handleSubmit}
            />
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.hintButton} onPress={handleHint}>
              <LinearGradient
                colors={["#FFD93D", "#F5C400"]}
                style={styles.buttonGradient}
              >
                <Text style={styles.hintButtonText}>💡 Hint (-50)</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <LinearGradient
                colors={["#06FFA5", "#00C9A7"]}
                style={styles.buttonGradient}
              >
                <Text style={styles.submitButtonText}>✓ Submit</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>Progress:</Text>
            <View style={styles.progressBar}>
              {words.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    {
                      backgroundColor:
                        index < currentWordIndex
                          ? "#06FFA5"
                          : index === currentWordIndex
                            ? "#FFD93D"
                            : "#1A1A2E",
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
    shadowColor: "#FF8B94",
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
    padding: 30,
    justifyContent: "space-around",
  },
  wordContainer: {
    alignItems: "center",
  },
  label: {
    color: "#AAA",
    fontSize: 16,
    marginBottom: 15,
  },
  scrambledContainer: {
    backgroundColor: "#1A1A2E",
    padding: 20,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#FF8B94",
    elevation: 5,
  },
  scrambledText: {
    color: "#FFF",
    fontSize: 36,
    fontWeight: "bold",
    letterSpacing: 8,
  },
  inputContainer: {
    alignItems: "center",
  },
  input: {
    width: "100%",
    backgroundColor: "#1A1A2E",
    color: "#FFF",
    fontSize: 24,
    padding: 20,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#06FFA5",
    textAlign: "center",
    fontWeight: "600",
    letterSpacing: 2,
  },
  buttons: {
    flexDirection: "row",
    gap: 15,
  },
  hintButton: {
    flex: 1,
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
    elevation: 5,
  },
  submitButton: {
    flex: 1,
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
    elevation: 5,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  hintButtonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "bold",
  },
  submitButtonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "bold",
  },
  progressContainer: {
    alignItems: "center",
  },
  progressLabel: {
    color: "#AAA",
    fontSize: 14,
    marginBottom: 10,
  },
  progressBar: {
    flexDirection: "row",
    gap: 10,
  },
  progressDot: {
    width: 40,
    height: 8,
    borderRadius: 4,
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
