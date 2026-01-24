import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

interface Puzzle2048GameProps {
  difficulty: "easy" | "medium" | "hard";
  onComplete: (score: number, timeSpent?: number) => void;
  onCancel: () => void;
}

const TARGET_TILES = { easy: 512, medium: 1024, hard: 2048 };
const GRID_SIZE = 4;

export function Puzzle2048Game({
  difficulty,
  onComplete,
  onCancel,
}: Puzzle2048GameProps) {
  const [grid, setGrid] = useState<number[][]>(
    Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(0)),
  );
  const [score, setScore] = useState(0);
  const [startTime] = useState(Date.now());
  const [isComplete, setIsComplete] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const gameEndedRef = useRef(false);

  const celebrationScale = useSharedValue(1);

  useEffect(() => {
    initializeGrid();
  }, []);

  const initializeGrid = () => {
    const newGrid = Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(0));
    addRandomTile(newGrid);
    addRandomTile(newGrid);
    setGrid(newGrid);
  };

  const addRandomTile = (currentGrid: number[][]) => {
    const emptyCells: [number, number][] = [];

    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const row = currentGrid[i];
        if (row && row[j] === 0) {
          emptyCells.push([i, j]);
        }
      }
    }

    if (emptyCells.length > 0) {
      const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      if (cell) {
        const [row, col] = cell;
        const gridRow = currentGrid[row];
        if (gridRow) {
          gridRow[col] = Math.random() < 0.9 ? 2 : 4;
        }
      }
    }
  };

  const moveLeft = () => {
    if (isComplete || hasWon || gameEndedRef.current) {
      return;
    }

    const newGrid = grid.map((row) => [...row]);
    let moved = false;
    let newScore = score;

    for (let i = 0; i < GRID_SIZE; i++) {
      const gridRow = newGrid[i];
      if (!gridRow) continue;
      const row = gridRow.filter((val) => val !== 0);

      for (let j = 0; j < row.length - 1; j++) {
        const currentValue = row[j];
        if (currentValue !== undefined && currentValue === row[j + 1]) {
          const mergedValue = currentValue * 2;
          row[j] = mergedValue;
          newScore += mergedValue;
          row.splice(j + 1, 1);
        }
      }

      while (row.length < GRID_SIZE) {
        row.push(0);
      }

      if (row.join(",") !== gridRow.join(",")) {
        moved = true;
      }

      newGrid[i] = row;
    }

    if (moved) {
      addRandomTile(newGrid);
      setGrid(newGrid);
      setScore(newScore);
      Vibration.vibrate(10);
      if (!hasWon && checkWin(newGrid)) {
        gameEndedRef.current = true;
        setHasWon(true);
        setIsComplete(true);
        celebrationScale.value = withSpring(1.2, {}, () => {
          celebrationScale.value = withSpring(1);
        });
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        const finalScore = Math.max(0, newScore + 1000 - timeSpent * 2);
        setTimeout(() => onComplete(finalScore, timeSpent), 1500);
        return;
      }

      // Check game over if not won yet
      if (!hasWon && checkGameOver(newGrid)) {
        gameEndedRef.current = true;
        setIsComplete(true);
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        setTimeout(() => onComplete(0, timeSpent), 1500);
      }
    }
  };

  const moveRight = () => {
    if (isComplete || hasWon || gameEndedRef.current) {
      return;
    }

    const newGrid = grid.map((row) => [...row].reverse());
    let moved = false;
    let newScore = score;

    for (let i = 0; i < GRID_SIZE; i++) {
      const gridRow = newGrid[i];
      if (!gridRow) continue;
      const row = gridRow.filter((val) => val !== 0);

      for (let j = 0; j < row.length - 1; j++) {
        const currentValue = row[j];
        if (currentValue !== undefined && currentValue === row[j + 1]) {
          row[j] = currentValue * 2;
          newScore += row[j] ?? 0;
          row.splice(j + 1, 1);
        }
      }

      while (row.length < GRID_SIZE) {
        row.push(0);
      }

      if (row.join(",") !== gridRow.join(",")) {
        moved = true;
      }

      newGrid[i] = row.reverse();
    }

    if (moved) {
      addRandomTile(newGrid);
      setGrid(newGrid);
      setScore(newScore);
      Vibration.vibrate(10);

      // Check win first
      if (!hasWon && checkWin(newGrid)) {
        gameEndedRef.current = true;
        setHasWon(true);
        setIsComplete(true);
        celebrationScale.value = withSpring(1.2, {}, () => {
          celebrationScale.value = withSpring(1);
        });
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        const finalScore = Math.max(0, newScore + 1000 - timeSpent * 2);
        setTimeout(() => onComplete(finalScore, timeSpent), 1500);
        return;
      }

      // Check game over if not won yet
      if (!hasWon && checkGameOver(newGrid)) {
        gameEndedRef.current = true;
        setIsComplete(true);
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        setTimeout(() => onComplete(0, timeSpent), 1500);
      }
    }
  };

  const moveUp = () => {
    if (isComplete || hasWon || gameEndedRef.current) {
      return;
    }

    const newGrid = grid.map((row) => [...row]);
    let moved = false;
    let newScore = score;

    for (let j = 0; j < GRID_SIZE; j++) {
      const column: number[] = [];
      for (let i = 0; i < GRID_SIZE; i++) {
        const cellValue = newGrid[i]?.[j];
        if (cellValue !== undefined && cellValue !== 0) {
          column.push(cellValue);
        }
      }

      for (let i = 0; i < column.length - 1; i++) {
        const currentValue = column[i];
        if (currentValue !== undefined && currentValue === column[i + 1]) {
          column[i] = currentValue * 2;
          newScore += column[i] ?? 0;
          column.splice(i + 1, 1);
        }
      }

      while (column.length < GRID_SIZE) {
        column.push(0);
      }

      for (let i = 0; i < GRID_SIZE; i++) {
        const gridRow = newGrid[i];
        const colValue = column[i] ?? 0;
        if (gridRow && gridRow[j] !== colValue) {
          moved = true;
        }
        if (gridRow) {
          gridRow[j] = colValue;
        }
      }
    }

    if (moved) {
      addRandomTile(newGrid);
      setGrid(newGrid);
      setScore(newScore);
      Vibration.vibrate(10);

      // Check win first
      if (!hasWon && checkWin(newGrid)) {
        gameEndedRef.current = true;
        setHasWon(true);
        setIsComplete(true);
        celebrationScale.value = withSpring(1.2, {}, () => {
          celebrationScale.value = withSpring(1);
        });
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        const finalScore = Math.max(0, newScore + 1000 - timeSpent * 2);
        setTimeout(() => onComplete(finalScore, timeSpent), 1500);
        return;
      }

      // Check game over if not won yet
      if (!hasWon && checkGameOver(newGrid)) {
        gameEndedRef.current = true;
        setIsComplete(true);
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        setTimeout(() => onComplete(0, timeSpent), 1500);
      }
    }
  };

  const moveDown = () => {
    if (isComplete || hasWon || gameEndedRef.current) {
      return;
    }

    const newGrid = grid.map((row) => [...row]);
    let moved = false;
    let newScore = score;

    for (let j = 0; j < GRID_SIZE; j++) {
      const column: number[] = [];
      for (let i = GRID_SIZE - 1; i >= 0; i--) {
        const cellValue = newGrid[i]?.[j];
        if (cellValue !== undefined && cellValue !== 0) {
          column.push(cellValue);
        }
      }

      for (let i = 0; i < column.length - 1; i++) {
        const currentValue = column[i];
        if (currentValue !== undefined && currentValue === column[i + 1]) {
          column[i] = currentValue * 2;
          newScore += column[i] ?? 0;
          column.splice(i + 1, 1);
        }
      }

      while (column.length < GRID_SIZE) {
        column.push(0);
      }

      for (let i = 0; i < GRID_SIZE; i++) {
        const gridRow = newGrid[GRID_SIZE - 1 - i];
        const colValue = column[i] ?? 0;
        if (gridRow && gridRow[j] !== colValue) {
          moved = true;
        }
        if (gridRow) {
          gridRow[j] = colValue;
        }
      }
    }

    if (moved) {
      addRandomTile(newGrid);
      setGrid(newGrid);
      setScore(newScore);
      Vibration.vibrate(10);

      // Check win first
      if (!hasWon && checkWin(newGrid)) {
        gameEndedRef.current = true;
        setHasWon(true);
        setIsComplete(true);
        celebrationScale.value = withSpring(1.2, {}, () => {
          celebrationScale.value = withSpring(1);
        });
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        const finalScore = Math.max(0, newScore + 1000 - timeSpent * 2);
        setTimeout(() => onComplete(finalScore, timeSpent), 1500);
        return;
      }

      // Check game over if not won yet
      if (!hasWon && checkGameOver(newGrid)) {
        gameEndedRef.current = true;
        setIsComplete(true);
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        setTimeout(() => onComplete(0, timeSpent), 1500);
      }
    }
  };

  const checkWin = (currentGrid: number[][]) => {
    const targetTile = TARGET_TILES[difficulty];
    const maxTile = Math.max(...currentGrid.flat());
    const hasTarget = currentGrid.some((row) =>
      row.some((cell) => cell >= targetTile),
    );
    return hasTarget;
  };

  const checkGameOver = (currentGrid: number[][]) => {
    // Check if there are any empty cells
    for (let i = 0; i < GRID_SIZE; i++) {
      const row = currentGrid[i];
      if (!row) continue;
      for (let j = 0; j < GRID_SIZE; j++) {
        if (row[j] === 0) return false;
      }
    }

    // Check if any adjacent cells can be merged (horizontal)
    for (let i = 0; i < GRID_SIZE; i++) {
      const row = currentGrid[i];
      if (!row) continue;
      for (let j = 0; j < GRID_SIZE - 1; j++) {
        if (row[j] === row[j + 1]) return false;
      }
    }

    // Check if any adjacent cells can be merged (vertical)
    for (let i = 0; i < GRID_SIZE - 1; i++) {
      const row = currentGrid[i];
      const nextRow = currentGrid[i + 1];
      if (!row || !nextRow) continue;
      for (let j = 0; j < GRID_SIZE; j++) {
        if (row[j] === nextRow[j]) return false;
      }
    }

    return true; // No moves possible
  };

  const getTileColor = (value: number): [string, string] => {
    const colors: Record<number, [string, string]> = {
      0: ["#1A1A2E", "#16213E"],
      2: ["#FFD93D", "#F5C400"],
      4: ["#FFB347", "#FF8C00"],
      8: ["#FF6B9D", "#C44569"],
      16: ["#C77DFF", "#9D4EDD"],
      32: ["#06FFA5", "#00C9A7"],
      64: ["#4ECDC4", "#44A08D"],
      128: ["#FF8B94", "#F67280"],
      256: ["#95E1D3", "#66D3C7"],
      512: ["#AA96DA", "#9B7EDE"],
      1024: ["#FCBAD3", "#F8A5C2"],
      2048: ["#FFD93D", "#FFC300"],
    };
    return colors[value] ?? ["#FFD93D", "#FFC300"];
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: celebrationScale.value }],
  }));

  const panGesture = Gesture.Pan().onEnd((event) => {
    const { translationX, translationY } = event;

    if (Math.abs(translationX) > Math.abs(translationY)) {
      if (translationX > 50) {
        moveRight();
      } else if (translationX < -50) {
        moveLeft();
      }
    } else {
      if (translationY > 50) {
        moveDown();
      } else if (translationY < -50) {
        moveUp();
      }
    }
  });

  return (
    <GestureHandlerRootView style={styles.container}>
      <LinearGradient colors={["#FFD93D", "#F5C400"]} style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🎯 2048 Challenge</Text>
        <View style={styles.stats}>
          <Text style={styles.statText}>
            Score: {score} | Target Tile: {TARGET_TILES[difficulty]}
          </Text>
        </View>
      </LinearGradient>

      {isComplete ? (
        <Animated.View style={[styles.completionContainer, animatedStyle]}>
          <Text style={styles.completionEmoji}>🏆</Text>
          <Text style={styles.completionText}>You Did It!</Text>
          <Text style={styles.completionSubtext}>Calculating rewards...</Text>
        </Animated.View>
      ) : (
        <GestureDetector gesture={panGesture}>
          <View style={styles.gridContainer}>
            <View style={styles.grid}>
              {grid.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <View
                    key={`${rowIndex}-${colIndex}`}
                    style={styles.cellWrapper}
                  >
                    <LinearGradient
                      colors={getTileColor(cell)}
                      style={styles.cell}
                    >
                      {cell > 0 && (
                        <Text
                          style={[
                            styles.cellText,
                            { fontSize: cell >= 1024 ? 24 : 32 },
                          ]}
                        >
                          {cell}
                        </Text>
                      )}
                    </LinearGradient>
                  </View>
                )),
              )}
            </View>
            <Text style={styles.instructionText}>Swipe to move tiles</Text>
          </View>
        </GestureDetector>
      )}

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={moveUp}>
          <Text style={styles.controlText}>↑</Text>
        </TouchableOpacity>
        <View style={styles.controlRow}>
          <TouchableOpacity style={styles.controlButton} onPress={moveLeft}>
            <Text style={styles.controlText}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={moveDown}>
            <Text style={styles.controlText}>↓</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={moveRight}>
            <Text style={styles.controlText}>→</Text>
          </TouchableOpacity>
        </View>
      </View>
    </GestureHandlerRootView>
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
    shadowColor: "#FFD93D",
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
  gridContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  grid: {
    width: 320,
    height: 320,
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#16213E",
    borderRadius: 15,
    padding: 8,
    elevation: 20,
  },
  cellWrapper: {
    width: "25%",
    aspectRatio: 1,
    padding: 4,
  },
  cell: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  cellText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  instructionText: {
    color: "#AAA",
    fontSize: 14,
    marginTop: 20,
  },
  controls: {
    padding: 20,
    alignItems: "center",
  },
  controlRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  controlButton: {
    width: 60,
    height: 60,
    backgroundColor: "#FFD93D",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  controlText: {
    fontSize: 28,
    color: "#000",
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
