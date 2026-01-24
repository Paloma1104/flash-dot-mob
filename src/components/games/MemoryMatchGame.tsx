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

interface MemoryMatchGameProps {
  difficulty: "easy" | "medium" | "hard";
  onComplete: (score: number, timeSpent?: number) => void;
  onCancel: () => void;
}

const CARD_COUNTS = { easy: 8, medium: 16, hard: 24 };
const EMOJIS = [
  "🎮",
  "🎯",
  "🎨",
  "🎭",
  "🎪",
  "🎬",
  "🎸",
  "🎹",
  "🎺",
  "🎻",
  "🎲",
  "🎰",
];

export function MemoryMatchGame({
  difficulty,
  onComplete,
  onCancel,
}: MemoryMatchGameProps) {
  const cardCount = CARD_COUNTS[difficulty];
  const [cards, setCards] = useState<
    { id: number; emoji: string; isFlipped: boolean; isMatched: boolean }[]
  >([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [startTime] = useState(Date.now());

  const celebrationScale = useSharedValue(1);

  useEffect(() => {
    initializeCards();
  }, []);

  const initializeCards = () => {
    const pairCount = cardCount / 2;
    const selectedEmojis = EMOJIS.slice(0, pairCount);
    const cardPairs = [...selectedEmojis, ...selectedEmojis];

    const shuffled = cardPairs
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false,
      }));

    setCards(shuffled);
  };

  const handleCardPress = (id: number) => {
    const isCompleted = matches === cardCount / 2;
    const card = cards[id];
    if (
      isCompleted ||
      selectedCards.length >= 2 ||
      !card ||
      card.isFlipped ||
      card.isMatched
    )
      return;

    const newCards = [...cards];
    const cardToFlip = newCards[id];
    if (cardToFlip) {
      cardToFlip.isFlipped = true;
    }
    setCards(newCards);
    Vibration.vibrate(10);

    const newSelected = [...selectedCards, id];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setMoves(moves + 1);
      const first = newSelected[0];
      const second = newSelected[1];
      if (first !== undefined && second !== undefined) {
        checkMatch(first, second);
      }
    }
  };

  const checkMatch = (id1: number, id2: number) => {
    setTimeout(() => {
      const newCards = [...cards];
      const card1 = newCards[id1];
      const card2 = newCards[id2];

      if (!card1 || !card2) return;

      if (card1.emoji === card2.emoji) {
        card1.isMatched = true;
        card2.isMatched = true;
        Vibration.vibrate(20);

        const newMatches = matches + 1;
        setMatches(newMatches);

        if (newMatches === cardCount / 2) {
          celebrationScale.value = withSpring(1.2, {}, () => {
            celebrationScale.value = withSpring(1);
          });
          const timeSpent = Math.floor((Date.now() - startTime) / 1000);
          const score = Math.max(0, 1000 - moves * 10 - timeSpent);
          setTimeout(() => onComplete(score, timeSpent), 1500);
        }
      } else {
        card1.isFlipped = false;
        card2.isFlipped = false;
        Vibration.vibrate([0, 50, 50, 50]);
      }

      setCards(newCards);
      setSelectedCards([]);
    }, 800);
  };

  const columns = difficulty === "easy" ? 4 : difficulty === "medium" ? 4 : 6;
  const cardSize = (320 - (columns + 1) * 8) / columns;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: celebrationScale.value }],
  }));

  const isComplete = matches === cardCount / 2;

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#4ECDC4", "#44A08D"]} style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🃏 Memory Match</Text>
        <View style={styles.stats}>
          <Text style={styles.statText}>
            Moves: {moves} | Matches: {matches}/{cardCount / 2}
          </Text>
        </View>
      </LinearGradient>

      {isComplete ? (
        <Animated.View style={[styles.completionContainer, animatedStyle]}>
          <Text style={styles.completionEmoji}>🎉</Text>
          <Text style={styles.completionText}>Perfect Match!</Text>
          <Text style={styles.completionSubtext}>Calculating rewards...</Text>
        </Animated.View>
      ) : (
        <View style={styles.gridContainer}>
          <View style={[styles.grid, { width: columns * (cardSize + 8) }]}>
            {cards.map((card) => (
              <TouchableOpacity
                key={card.id}
                style={[styles.card, { width: cardSize, height: cardSize }]}
                onPress={() => handleCardPress(card.id)}
                disabled={card.isFlipped || card.isMatched}
              >
                {card.isFlipped || card.isMatched ? (
                  <LinearGradient
                    colors={
                      card.isMatched
                        ? ["#06FFA5", "#00C9A7"]
                        : ["#4ECDC4", "#44A08D"]
                    }
                    style={styles.cardFront}
                  >
                    <Text
                      style={[styles.cardEmoji, { fontSize: cardSize * 0.5 }]}
                    >
                      {card.emoji}
                    </Text>
                  </LinearGradient>
                ) : (
                  <LinearGradient
                    colors={["#1A1A2E", "#16213E"]}
                    style={styles.cardBack}
                  >
                    <Text
                      style={[
                        styles.cardQuestion,
                        { fontSize: cardSize * 0.4 },
                      ]}
                    >
                      ?
                    </Text>
                  </LinearGradient>
                )}
              </TouchableOpacity>
            ))}
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
    shadowColor: "#4ECDC4",
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
  gridContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  card: {
    borderRadius: 12,
    overflow: "hidden",
    elevation: 5,
  },
  cardFront: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cardBack: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cardEmoji: {
    fontWeight: "bold",
  },
  cardQuestion: {
    color: "#4ECDC4",
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
