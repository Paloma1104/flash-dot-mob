import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Vibration } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface TicTacToeGameProps {
  difficulty: 'easy' | 'medium' | 'hard';
  onComplete: (score: number, timeSpent?: number) => void;
  onCancel: () => void;
}

export function TicTacToeGame({ difficulty, onComplete, onCancel }: TicTacToeGameProps) {
  const [board, setBoard] = useState<('X' | 'O' | null)[]>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [playerWins, setPlayerWins] = useState(0);
  const [aiWins, setAiWins] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost' | 'draw'>('playing');
  const [startTime] = useState(Date.now());

  const celebrationScale = useSharedValue(1);

  const checkWinner = (currentBoard: typeof board): 'X' | 'O' | 'draw' | null => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (const [a, b, c] of lines) {
      if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
        return currentBoard[a] as 'X' | 'O';
      }
    }

    return currentBoard.every((cell) => cell !== null) ? 'draw' : null;
  };

  const getAIMove = (currentBoard: typeof board): number => {
    const availableMoves = currentBoard.map((cell, idx) => (cell === null ? idx : null)).filter((idx) => idx !== null) as number[];

    if (difficulty === 'easy') {
      return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }

    if (difficulty === 'medium' && Math.random() < 0.5) {
      return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }

    // Hard mode: Minimax algorithm
    const minimax = (board: typeof currentBoard, isMaximizing: boolean): number => {
      const winner = checkWinner(board);
      if (winner === 'O') return 10;
      if (winner === 'X') return -10;
      if (winner === 'draw') return 0;

      if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
          if (board[i] === null) {
            board[i] = 'O';
            const score = minimax(board, false);
            board[i] = null;
            bestScore = Math.max(score, bestScore);
          }
        }
        return bestScore;
      } else {
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
          if (board[i] === null) {
            board[i] = 'X';
            const score = minimax(board, true);
            board[i] = null;
            bestScore = Math.min(score, bestScore);
          }
        }
        return bestScore;
      }
    };

    let bestScore = -Infinity;
    let bestMove = availableMoves[0];

    for (const move of availableMoves) {
      currentBoard[move] = 'O';
      const score = minimax([...currentBoard], false);
      currentBoard[move] = null;

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  };

  const handleCellPress = (index: number) => {
    if (board[index] !== null || !isPlayerTurn || gameStatus !== 'playing') return;

    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);
    Vibration.vibrate(10);

    const winner = checkWinner(newBoard);
    if (winner) {
      handleRoundEnd(winner, newBoard);
    } else {
      setIsPlayerTurn(false);
      setTimeout(() => makeAIMove(newBoard), 500);
    }
  };

  const makeAIMove = (currentBoard: typeof board) => {
    const aiMove = getAIMove(currentBoard);
    const newBoard = [...currentBoard];
    newBoard[aiMove] = 'O';
    setBoard(newBoard);
    Vibration.vibrate(10);

    const winner = checkWinner(newBoard);
    if (winner) {
      handleRoundEnd(winner, newBoard);
    } else {
      setIsPlayerTurn(true);
    }
  };

  const handleRoundEnd = (winner: 'X' | 'O' | 'draw', finalBoard: typeof board) => {
    const newRounds = rounds + 1;
    setRounds(newRounds);

    if (winner === 'X') {
      const newPlayerWins = playerWins + 1;
      setPlayerWins(newPlayerWins);
      setGameStatus('won');
      Vibration.vibrate(20);

      if (newRounds >= 3) {
        finishGame(newPlayerWins, aiWins);
      } else {
        setTimeout(resetBoard, 1500);
      }
    } else if (winner === 'O') {
      const newAiWins = aiWins + 1;
      setAiWins(newAiWins);
      setGameStatus('lost');
      Vibration.vibrate([0, 50, 50, 50]);

      if (newRounds >= 3) {
        finishGame(playerWins, newAiWins);
      } else {
        setTimeout(resetBoard, 1500);
      }
    } else {
      setGameStatus('draw');
      if (newRounds >= 3) {
        finishGame(playerWins, aiWins);
      } else {
        setTimeout(resetBoard, 1500);
      }
    }
  };

  const resetBoard = () => {
    setBoard(Array(9).fill(null));
    setGameStatus('playing');
    setIsPlayerTurn(true);
  };

  const finishGame = (playerScore: number, aiScore: number) => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    if (playerScore > aiScore) {
      celebrationScale.value = withSpring(1.2, {}, () => {
        celebrationScale.value = withSpring(1);
      });
      const score = 1000 + playerScore * 200;
      setTimeout(() => onComplete(score, timeSpent), 2000);
    } else {
      setTimeout(() => onComplete(0, timeSpent), 2000);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: celebrationScale.value }],
  }));

  const isGameOver = rounds >= 3;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#C77DFF', '#9D4EDD']} style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>⭕ Tic-Tac-Toe</Text>
        <View style={styles.stats}>
          <Text style={styles.statText}>
            You: {playerWins} | AI: {aiWins} | Round: {rounds}/3
          </Text>
        </View>
      </LinearGradient>

      {isGameOver ? (
        <Animated.View style={[styles.completionContainer, animatedStyle]}>
          <Text style={styles.completionEmoji}>{playerWins > aiWins ? '🎉' : '😢'}</Text>
          <Text style={styles.completionText}>{playerWins > aiWins ? 'You Won!' : 'AI Won!'}</Text>
          <Text style={styles.completionSubtext}>Calculating rewards...</Text>
        </Animated.View>
      ) : (
        <View style={styles.gameContainer}>
          <View style={styles.board}>
            {board.map((cell, index) => (
              <TouchableOpacity
                key={index}
                style={styles.cell}
                onPress={() => handleCellPress(index)}
                disabled={!isPlayerTurn || cell !== null}
              >
                <LinearGradient colors={cell ? ['#C77DFF', '#9D4EDD'] : ['#1A1A2E', '#16213E']} style={styles.cellGradient}>
                  <Text style={[styles.cellText, { color: cell === 'X' ? '#06FFA5' : '#FFD93D' }]}>{cell || ''}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>

          {gameStatus !== 'playing' && (
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {gameStatus === 'won' && '🎉 You won this round!'}
                {gameStatus === 'lost' && '😢 AI won this round'}
                {gameStatus === 'draw' && '🤝 Draw!'}
              </Text>
            </View>
          )}

          <Text style={styles.turnText}>{isPlayerTurn ? "Your Turn (X)" : "AI's Turn (O)"}</Text>
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
    shadowColor: '#C77DFF',
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  board: {
    width: 320,
    height: 320,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cell: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
  },
  cellGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  turnText: {
    color: '#FFF',
    fontSize: 20,
    marginTop: 30,
    fontWeight: '600',
  },
  statusBadge: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(199, 125, 255, 0.2)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#C77DFF',
  },
  statusText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
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
