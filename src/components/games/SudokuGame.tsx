import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Vibration } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

interface SudokuGameProps {
  difficulty: 'easy' | 'medium' | 'hard';
  onComplete: (score: number, timeSpent?: number) => void;
  onCancel: () => void;
}

const GRID_SIZES = { easy: 4, medium: 6, hard: 9 };

export function SudokuGame({ difficulty, onComplete, onCancel }: SudokuGameProps) {
  const gridSize = GRID_SIZES[difficulty];
  const [grid, setGrid] = useState<(number | null)[][]>([]);
  const [solution, setSolution] = useState<number[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [startTime] = useState(Date.now());
  const [isComplete, setIsComplete] = useState(false);

  const celebrationScale = useSharedValue(1);

  useEffect(() => {
    generateSudoku();
  }, []);

  useEffect(() => {
    if (isComplete) {
      celebrationScale.value = withSpring(1.2, {}, () => {
        celebrationScale.value = withSpring(1);
      });
    }
  }, [isComplete]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: celebrationScale.value }],
  }));

  const generateSudoku = () => {
    // Generate a valid sudoku solution
    const newSolution: number[][] = Array(gridSize)
      .fill(null)
      .map(() => Array(gridSize).fill(0));

    // Fill diagonal boxes first
    for (let i = 0; i < gridSize; i += Math.sqrt(gridSize)) {
      fillBox(newSolution, i, i, gridSize);
    }

    // Create puzzle by removing numbers
    const newGrid: (number | null)[][] = newSolution.map((row) => [...row]);
    const cellsToRemove = difficulty === 'easy' ? gridSize * 2 : difficulty === 'medium' ? gridSize * 3 : gridSize * 4;

    for (let i = 0; i < cellsToRemove; i++) {
      const row = Math.floor(Math.random() * gridSize);
      const col = Math.floor(Math.random() * gridSize);
      newGrid[row][col] = null;
    }

    setGrid(newGrid);
    setSolution(newSolution);
  };

  const fillBox = (grid: number[][], row: number, col: number, size: number) => {
    const boxSize = Math.sqrt(size);
    const numbers = Array.from({ length: size }, (_, i) => i + 1);
    
    for (let i = 0; i < boxSize; i++) {
      for (let j = 0; j < boxSize; j++) {
        const randomIndex = Math.floor(Math.random() * numbers.length);
        grid[row + i][col + j] = numbers[randomIndex];
        numbers.splice(randomIndex, 1);
      }
    }
  };

  const handleCellPress = (row: number, col: number) => {
    if (isComplete) return;
    if (grid[row][col] === null) {
      setSelectedCell({ row, col });
      Vibration.vibrate(10);
    }
  };

  const handleNumberPress = (num: number) => {
    if (isComplete) return;
    if (!selectedCell) return;

    const { row, col } = selectedCell;
    const newGrid = grid.map((r) => [...r]);
    
    if (solution[row][col] === num) {
      newGrid[row][col] = num;
      setGrid(newGrid);
      Vibration.vibrate(20);

      // Check if puzzle is complete
      const isCompleted = newGrid.every((row) => row.every((cell) => cell !== null));
      if (isCompleted) {
        setIsComplete(true);
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        const score = Math.max(0, 1000 - mistakes * 50 - timeSpent);
        setTimeout(() => onComplete(score, timeSpent), 1500);
      }
    } else {
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      Vibration.vibrate([0, 50, 50, 50]);
      
      // Game over if too many mistakes
      if (newMistakes >= 10) {
        setIsComplete(true);
        setTimeout(() => onComplete(0, Math.floor((Date.now() - startTime) / 1000)), 1500);
      }
    }
  };

  const cellSize = 320 / gridSize;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FF6B9D', '#C44569']} style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🔢 Sudoku Master</Text>
        <View style={styles.stats}>
          <Text style={styles.statText}>Mistakes: {mistakes}/10</Text>
        </View>
      </LinearGradient>

      {isComplete ? (
        <Animated.View style={[styles.completionContainer, animatedStyle]}>
          <Text style={styles.completionEmoji}>🎉</Text>
          <Text style={styles.completionText}>Puzzle Solved!</Text>
          <Text style={styles.completionSubtext}>Calculating rewards...</Text>
        </Animated.View>
      ) : (
        <>
          <View style={styles.gridContainer}>
            <View style={[styles.grid, { width: gridSize * cellSize, height: gridSize * cellSize }]}>
              {grid.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                  const isGiven = cell !== null && solution[rowIndex][colIndex] === cell;

                  return (
                    <TouchableOpacity
                      key={`${rowIndex}-${colIndex}`}
                      style={[
                        styles.cell,
                        {
                          width: cellSize,
                          height: cellSize,
                          backgroundColor: isSelected ? '#FFD93D' : isGiven ? '#1A1A2E' : '#16213E',
                          borderRightWidth: (colIndex + 1) % Math.sqrt(gridSize) === 0 ? 2 : 1,
                          borderBottomWidth: (rowIndex + 1) % Math.sqrt(gridSize) === 0 ? 2 : 1,
                        },
                      ]}
                      onPress={() => handleCellPress(rowIndex, colIndex)}
                    >
                      {cell !== null && (
                        <Text style={[styles.cellText, { fontSize: 40 / (gridSize / 4) }]}>{cell}</Text>
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </View>

          <View style={styles.numberPad}>
            {Array.from({ length: gridSize }, (_, i) => i + 1).map((num) => (
              <TouchableOpacity key={num} style={styles.numberButton} onPress={() => handleNumberPress(num)}>
                <LinearGradient colors={['#FF6B9D', '#C44569']} style={styles.numberGradient}>
                  <Text style={styles.numberText}>{num}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </>
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
    shadowColor: '#FF6B9D',
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
  gridContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  grid: {
    backgroundColor: '#0F3460',
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#FF6B9D',
    borderWidth: 1,
  },
  cellText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  numberPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 20,
    gap: 10,
  },
  numberButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 5,
  },
  numberGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    color: '#FFF',
    fontSize: 24,
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
