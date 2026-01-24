import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Vibration } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withSequence, withTiming } from 'react-native-reanimated';

interface SimonSaysGameProps {
  difficulty: 'easy' | 'medium' | 'hard';
  onComplete: (score: number, timeSpent?: number) => void;
  onCancel: () => void;
}

const COLORS = [
  { id: 0, color: ['#FF6B9D', '#C44569'], name: 'Red' },
  { id: 1, color: ['#4ECDC4', '#44A08D'], name: 'Blue' },
  { id: 2, color: ['#06FFA5', '#00C9A7'], name: 'Green' },
  { id: 3, color: ['#FFD93D', '#F5C400'], name: 'Yellow' },
];

const TARGET_SEQUENCES = { easy: 6, medium: 10, hard: 15 };

export function SimonSaysGame({ difficulty, onComplete, onCancel }: SimonSaysGameProps) {
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [isShowing, setIsShowing] = useState(false);
  const [currentShowIndex, setCurrentShowIndex] = useState(-1);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [startTime] = useState(Date.now());
  const [isComplete, setIsComplete] = useState(false);

  const celebrationScale = useSharedValue(1);

  useEffect(() => {
    startNewRound();
  }, []);

  const startNewRound = () => {
    const newSequence = [...sequence, Math.floor(Math.random() * 4)];
    setSequence(newSequence);
    setUserSequence([]);
    setIsShowing(true);
    showSequence(newSequence);
  };

  const showSequence = async (seq: number[]) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    for (let i = 0; i < seq.length; i++) {
      setCurrentShowIndex(i);
      await new Promise((resolve) => setTimeout(resolve, 600));
      setCurrentShowIndex(-1);
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    
    setIsShowing(false);
  };

  const handleColorPress = (colorId: number) => {
    if (isShowing || isComplete) return;

    const newUserSequence = [...userSequence, colorId];
    setUserSequence(newUserSequence);
    Vibration.vibrate(10);

    const currentIndex = newUserSequence.length - 1;

    if (newUserSequence[currentIndex] !== sequence[currentIndex]) {
      // Wrong - Game Over
      Vibration.vibrate([0, 50, 50, 50]);
      setIsComplete(true);
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      setTimeout(() => onComplete(0, timeSpent), 1500);
    } else if (newUserSequence.length === sequence.length) {
      // Correct sequence
      const newScore = score + level * 100;
      setScore(newScore);
      setLevel(level + 1);
      Vibration.vibrate(20);
      
      celebrationScale.value = withSpring(1.1, {}, () => {
        celebrationScale.value = withSpring(1);
      });

      if (sequence.length >= TARGET_SEQUENCES[difficulty]) {
        setIsComplete(true);
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        setTimeout(() => onComplete(newScore, timeSpent), 1500);
      } else {
        setTimeout(startNewRound, 1000);
      }
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: celebrationScale.value }],
  }));

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#AA96DA', '#8B7AB8']} style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🎵 Simon Says</Text>
        <View style={styles.stats}>
          <Text style={styles.statText}>Level: {level} | Score: {score}</Text>
        </View>
      </LinearGradient>

      {isComplete ? (
        <Animated.View style={[styles.completionContainer, animatedStyle]}>
          <Text style={styles.completionEmoji}>🎉</Text>
          <Text style={styles.completionText}>Perfect Memory!</Text>
          <Text style={styles.completionSubtext}>Final Score: {score}</Text>
        </Animated.View>
      ) : (
        <View style={styles.gameContainer}>
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              {isShowing ? '👀 Watch carefully...' : '🎮 Repeat the sequence!'}
            </Text>
            <Text style={styles.progressText}>
              Sequence: {userSequence.length}/{sequence.length}
            </Text>
          </View>

          <View style={styles.colorGrid}>
            {COLORS.map((color) => {
              const isHighlighted = isShowing && sequence[currentShowIndex] === color.id;
              
              return (
                <TouchableOpacity
                  key={color.id}
                  style={styles.colorButton}
                  onPress={() => handleColorPress(color.id)}
                  disabled={isShowing}
                >
                  <LinearGradient
                    colors={color.color}
                    style={[styles.colorGradient, isHighlighted && styles.highlighted]}
                  >
                    <Text style={styles.colorText}>{color.name}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.sequenceDisplay}>
            {sequence.map((colorId, index) => {
              const color = COLORS[colorId];
              const isRevealed = index < userSequence.length || isShowing;
              
              return (
                <View
                  key={index}
                  style={[
                    styles.sequenceDot,
                    {
                      backgroundColor: isRevealed ? color.color[0] : '#1A1A2E',
                      borderColor: index === userSequence.length && !isShowing ? '#AA96DA' : 'transparent',
                      borderWidth: index === userSequence.length && !isShowing ? 3 : 0,
                    },
                  ]}
                />
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0F',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 10,
    shadowColor: '#AA96DA',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },
  closeText: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  stats: {
    alignItems: 'center',
  },
  statText: {
    color: '#FFF',
    fontSize: 16,
    opacity: 0.9,
  },
  gameContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-around',
  },
  statusContainer: {
    alignItems: 'center',
    padding: 20,
  },
  statusText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  progressText: {
    color: '#AAA',
    fontSize: 16,
  },
  colorGrid: {
    width: 300,
    height: 300,
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorButton: {
    width: 145,
    height: 145,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
  },
  colorGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  highlighted: {
    elevation: 20,
    transform: [{ scale: 1.1 }],
  },
  colorText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sequenceDisplay: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 20,
  },
  sequenceDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  completionText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  completionSubtext: {
    fontSize: 18,
    color: '#AAA',
  },
});
