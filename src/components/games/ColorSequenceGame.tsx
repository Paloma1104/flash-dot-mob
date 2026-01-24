import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Vibration } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withSequence, withTiming } from 'react-native-reanimated';

interface ColorSequenceGameProps {
  difficulty: 'easy' | 'medium' | 'hard';
  onComplete: (score: number, timeSpent?: number) => void;
  onCancel: () => void;
}

const COLORS = [
  { id: 'red', color: ['#FF6B9D', '#C44569'], name: '🔴' },
  { id: 'blue', color: ['#4ECDC4', '#44A08D'], name: '🔵' },
  { id: 'green', color: ['#06FFA5', '#00C9A7'], name: '🟢' },
  { id: 'yellow', color: ['#FFD93D', '#F5C400'], name: '🟡' },
  { id: 'purple', color: ['#C77DFF', '#9D4EDD'], name: '🟣' },
  { id: 'orange', color: ['#FFB347', '#FF8C00'], name: '🟠' },
];

const SEQUENCE_LENGTHS = { easy: 5, medium: 8, hard: 12 };

export function ColorSequenceGame({ difficulty, onComplete, onCancel }: ColorSequenceGameProps) {
  const [sequence, setSequence] = useState<string[]>([]);
  const [playerSequence, setPlayerSequence] = useState<string[]>([]);
  const [isShowing, setIsShowing] = useState(true);
  const [currentShowIndex, setCurrentShowIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [startTime] = useState(Date.now());
  const [isComplete, setIsComplete] = useState(false);

  const celebrationScale = useSharedValue(1);
  const flashOpacity = useSharedValue(1);

  useEffect(() => {
    generateSequence();
  }, []);

  useEffect(() => {
    if (isShowing && sequence.length > 0) {
      showSequence();
    }
  }, [isShowing, sequence]);

  const generateSequence = () => {
    const length = SEQUENCE_LENGTHS[difficulty];
    const newSequence = Array.from({ length }, () => COLORS[Math.floor(Math.random() * COLORS.length)].id);
    setSequence(newSequence);
  };

  const showSequence = async () => {
    for (let i = 0; i < sequence.length; i++) {
      setCurrentShowIndex(i);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setCurrentShowIndex(-1);
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    setIsShowing(false);
    setCurrentShowIndex(-1);
  };

  const handleColorPress = (colorId: string) => {
    if (isShowing || isComplete) return;

    const newPlayerSequence = [...playerSequence, colorId];
    setPlayerSequence(newPlayerSequence);
    Vibration.vibrate(10);

    const currentIndex = newPlayerSequence.length - 1;
    
    if (newPlayerSequence[currentIndex] !== sequence[currentIndex]) {
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      Vibration.vibrate([0, 50, 50, 50]);
      
      // Game over if too many mistakes
      if (newMistakes >= 3) {
        setIsComplete(true);
        setTimeout(() => onComplete(0, Math.floor((Date.now() - startTime) / 1000)), 1500);
        return;
      }
      
      // Reset and show sequence again
      setTimeout(() => {
        setPlayerSequence([]);
        setIsShowing(true);
        setCurrentShowIndex(0);
      }, 1000);
    } else if (newPlayerSequence.length === sequence.length) {
      setIsComplete(true);
      celebrationScale.value = withSpring(1.2, {}, () => {
        celebrationScale.value = withSpring(1);
      });
      
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      const score = Math.max(0, 1000 - mistakes * 100 - timeSpent * 2);
      setTimeout(() => onComplete(score, timeSpent), 1500);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: celebrationScale.value }],
  }));

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#06FFA5', '#00C9A7']} style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🌈 Color Memory</Text>
        <View style={styles.stats}>
          <Text style={styles.statText}>
            Progress: {playerSequence.length}/{sequence.length} | Mistakes: {mistakes}
          </Text>
        </View>
      </LinearGradient>

      {isComplete ? (
        <Animated.View style={[styles.completionContainer, animatedStyle]}>
          <Text style={styles.completionEmoji}>🎉</Text>
          <Text style={styles.completionText}>Perfect Memory!</Text>
          <Text style={styles.completionSubtext}>Calculating rewards...</Text>
        </Animated.View>
      ) : (
        <View style={styles.gameContainer}>
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>{isShowing ? '👀 Watch the sequence...' : '🎮 Repeat the sequence!'}</Text>
          </View>

          <View style={styles.colorGrid}>
            {COLORS.map((color, index) => {
              const isHighlighted = isShowing && sequence[currentShowIndex] === color.id;
              
              return (
                <TouchableOpacity
                  key={color.id}
                  style={styles.colorButton}
                  onPress={() => handleColorPress(color.id)}
                  disabled={isShowing}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={color.color}
                    style={[
                      styles.colorGradient,
                      isHighlighted && styles.highlighted,
                      !isShowing && styles.interactiveButton
                    ]}
                  >
                    <Text style={[styles.colorEmoji, isHighlighted && styles.highlightedEmoji]}>{color.name}</Text>
                    {isHighlighted && <View style={styles.pulseRing} />}
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.sequenceDisplay}>
            <Text style={styles.sequenceTitle}>Your Progress:</Text>
            <View style={styles.sequenceBar}>
              {sequence.map((colorId, index) => {
                const color = COLORS.find((c) => c.id === colorId);
                const isCorrect = playerSequence[index] === colorId;
                const isActive = index === playerSequence.length;
                
                return (
                  <View
                    key={index}
                    style={[
                      styles.sequenceDot,
                      {
                        backgroundColor: isCorrect
                          ? color?.color[0]
                          : index < playerSequence.length
                          ? '#FF6B9D'
                          : '#1A1A2E',
                        borderColor: isActive ? '#06FFA5' : 'transparent',
                        borderWidth: isActive ? 3 : 0,
                      },
                    ]}
                  />
                );
              })}
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
    backgroundColor: '#0D0D0F',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 10,
    shadowColor: '#06FFA5',
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
    color: '#000',
    fontSize: 28,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 10,
  },
  stats: {
    alignItems: 'center',
  },
  statText: {
    color: '#000',
    fontSize: 16,
    opacity: 0.9,
    fontWeight: '600',
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
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
  },
  colorButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
    transform: [{ scale: 1.25 }],
    borderWidth: 5,
    borderColor: '#fff',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  colorEmoji: {
    fontSize: 40,
  },
  highlightedEmoji: {
    transform: [{ scale: 1.3 }],
    textShadowColor: '#fff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  interactiveButton: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  pulseRing: {
    position: 'absolute',
    width: '120%',
    height: '120%',
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
    opacity: 0.7,
  },
  sequenceDisplay: {
    alignItems: 'center',
    padding: 20,
  },
  sequenceTitle: {
    color: '#AAA',
    fontSize: 16,
    marginBottom: 15,
  },
  sequenceBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  sequenceDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
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
