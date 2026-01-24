import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Vibration } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface MathChallengeGameProps {
  difficulty: 'easy' | 'medium' | 'hard';
  onComplete: (score: number, timeSpent?: number) => void;
  onCancel: () => void;
}

const QUESTION_COUNT = 10;

export function MathChallengeGame({ difficulty, onComplete, onCancel }: MathChallengeGameProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [question, setQuestion] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [options, setOptions] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [startTime] = useState(Date.now());
  const [isComplete, setIsComplete] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerFeedback, setAnswerFeedback] = useState<'correct' | 'wrong' | null>(null);

  const celebrationScale = useSharedValue(1);

  useEffect(() => {
    generateQuestion();
  }, [currentQuestion]);

  useEffect(() => {
    if (isComplete) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeout();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestion, isComplete]);

  const generateQuestion = () => {
    let q = '';
    let answer = 0;

    if (difficulty === 'easy') {
      const a = Math.floor(Math.random() * 50) + 1;
      const b = Math.floor(Math.random() * 50) + 1;
      const op = Math.random() < 0.5 ? '+' : '-';
      
      if (op === '+') {
        q = `${a} + ${b}`;
        answer = a + b;
      } else {
        q = `${Math.max(a, b)} - ${Math.min(a, b)}`;
        answer = Math.max(a, b) - Math.min(a, b);
      }
    } else if (difficulty === 'medium') {
      const a = Math.floor(Math.random() * 12) + 2;
      const b = Math.floor(Math.random() * 12) + 2;
      const op = Math.random() < 0.5 ? '×' : '÷';
      
      if (op === '×') {
        q = `${a} × ${b}`;
        answer = a * b;
      } else {
        const product = a * b;
        q = `${product} ÷ ${a}`;
        answer = b;
      }
    } else {
      const operations = [
        () => {
          const a = Math.floor(Math.random() * 20) + 5;
          const b = Math.floor(Math.random() * 20) + 5;
          const c = Math.floor(Math.random() * 10) + 1;
          q = `(${a} + ${b}) × ${c}`;
          return (a + b) * c;
        },
        () => {
          const a = Math.floor(Math.random() * 10) + 2;
          q = `${a}² + ${a}`;
          return a * a + a;
        },
        () => {
          const a = Math.floor(Math.random() * 15) + 5;
          const b = Math.floor(Math.random() * 15) + 5;
          const c = Math.floor(Math.random() * 5) + 1;
          q = `${a} × ${b} - ${c * 10}`;
          return a * b - c * 10;
        },
      ];
      
      answer = operations[Math.floor(Math.random() * operations.length)]();
    }

    setQuestion(q);
    setCorrectAnswer(answer);
    
    // Generate options
    const opts = [answer];
    while (opts.length < 4) {
      const offset = Math.floor(Math.random() * 20) - 10;
      const option = answer + offset;
      if (!opts.includes(option) && option > 0) {
        opts.push(option);
      }
    }
    setOptions(opts.sort(() => Math.random() - 0.5));
    setTimeLeft(30);
  };

  const handleTimeout = () => {
    setStreak(0);
    Vibration.vibrate([0, 50, 50, 50]);
    moveToNextQuestion();
  };

  const handleAnswer = (selected: number) => {
    if (isComplete) return;
    if (selectedAnswer !== null) return;
    
    const isCorrect = selected === correctAnswer;
    setSelectedAnswer(selected);
    setAnswerFeedback(isCorrect ? 'correct' : 'wrong');
    
    if (isCorrect) {
      const timeBonus = Math.floor(timeLeft / 3);
      const streakBonus = streak * 10;
      setScore(score + 100 + timeBonus + streakBonus);
      setStreak(streak + 1);
      Vibration.vibrate(20);
      celebrationScale.value = withSpring(1.1, {}, () => {
        celebrationScale.value = withSpring(1);
      });
    } else {
      setStreak(0);
      Vibration.vibrate([0, 50, 50, 50]);
    }

    // Wait for feedback animation
    setTimeout(() => {
      setSelectedAnswer(null);
      setAnswerFeedback(null);
      moveToNextQuestion();
    }, 800);
  };

  const moveToNextQuestion = () => {
    if (currentQuestion >= QUESTION_COUNT - 1) {
      setIsComplete(true);
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      setTimeout(() => onComplete(score, timeSpent), 1500);
    } else {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 500);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: celebrationScale.value }],
  }));

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#95E1D3', '#66D3C7']} style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>➗ Math Master</Text>
        <View style={styles.stats}>
          <Text style={styles.statText}>
            Q{currentQuestion + 1}/{QUESTION_COUNT} | Score: {score} | 🔥 {streak}
          </Text>
        </View>
      </LinearGradient>

      {isComplete ? (
        <Animated.View style={[styles.completionContainer, animatedStyle]}>
          <Text style={styles.completionEmoji}>🎉</Text>
          <Text style={styles.completionText}>Challenge Complete!</Text>
          <Text style={styles.completionSubtext}>Final Score: {score}</Text>
        </Animated.View>
      ) : (
        <View style={styles.gameContainer}>
          <View style={styles.timerContainer}>
            <LinearGradient
              colors={timeLeft > 10 ? ['#06FFA5', '#00C9A7'] : ['#FF6B9D', '#C44569']}
              style={[styles.timerBar, { width: `${(timeLeft / 30) * 100}%` }]}
            />
            <Text style={styles.timerText}>{timeLeft}s</Text>
          </View>

          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>{question}</Text>
            <Text style={styles.equalsText}>=  ?</Text>
          </View>

          <View style={styles.optionsContainer}>
            {options.map((option, index) => {
              const isSelected = selectedAnswer === option;
              const isCorrectOption = option === correctAnswer;
              let colors = ['#1A1A2E', '#16213E'];
              
              if (isSelected) {
                if (answerFeedback === 'correct') {
                  colors = ['#06FFA5', '#00D084'];
                } else if (answerFeedback === 'wrong') {
                  colors = ['#FF3B30', '#C0392B'];
                }
              } else if (answerFeedback === 'wrong' && isCorrectOption) {
                colors = ['#06FFA5', '#00D084'];
              }
              
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.optionButton}
                  onPress={() => handleAnswer(option)}
                  disabled={answerFeedback !== null}
                >
                  <LinearGradient
                    colors={colors}
                    style={[styles.optionGradient, isSelected && styles.selectedOption]}
                  >
                    <Text style={styles.optionText}>{option}</Text>
                    {isSelected && answerFeedback === 'correct' && <Text style={styles.feedbackIcon}>✓</Text>}
                    {isSelected && answerFeedback === 'wrong' && <Text style={styles.feedbackIcon}>✗</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>

          {streak > 2 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 {streak} Streak! +{streak * 10} bonus</Text>
            </View>
          )}
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
    shadowColor: '#95E1D3',
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
  timerContainer: {
    height: 40,
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  timerBar: {
    height: '100%',
    borderRadius: 20,
  },
  timerText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    lineHeight: 40,
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  questionContainer: {
    alignItems: 'center',
    padding: 40,
  },
  questionText: {
    color: '#FFF',
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  equalsText: {
    color: '#95E1D3',
    fontSize: 36,
    fontWeight: 'bold',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  optionButton: {
    width: '47%',
    aspectRatio: 2,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
  },
  optionGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#95E1D3',
  },
  optionText: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  selectedOption: {
    transform: [{ scale: 1.05 }],
    elevation: 10,
  },
  feedbackIcon: {
    position: 'absolute',
    top: 8,
    right: 12,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  streakBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 107, 157, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FF6B9D',
  },
  streakText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
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
