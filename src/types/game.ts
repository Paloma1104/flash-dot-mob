export enum GameType {
  SUDOKU = "SUDOKU",
  MEMORY_MATCH = "MEMORY_MATCH",
  PUZZLE_2048 = "PUZZLE_2048",
  TIC_TAC_TOE = "TIC_TAC_TOE",
  COLOR_SEQUENCE = "COLOR_SEQUENCE",
  WORD_SCRAMBLE = "WORD_SCRAMBLE",
  MATH_CHALLENGE = "MATH_CHALLENGE",
  PATTERN_LOCK = "PATTERN_LOCK",
  SIMON_SAYS = "SIMON_SAYS",
  SPOT_DIFFERENCE = "SPOT_DIFFERENCE",
}

export interface GameDrop {
  id: string;
  latitude: number;
  longitude: number;
  gameType: GameType;
  difficulty: "easy" | "medium" | "hard";
  rewardAmount: number; // AP tokens reward for winning
  apCost: number; // AP tokens required to play
  tokenSymbol: string;
  expiresAt: string | null;
  createdAt: string;
  completedBy: string[];
  isActive: boolean;
  maxCompletions?: number;
}

export interface GameSession {
  id: string;
  gameDropId: string;
  gameType: GameType;
  startedAt: string;
  completedAt?: string;
  score: number;
  timeSpent: number; // in seconds
  isCompleted: boolean;
  rewardEarned: number; // AP tokens earned
  apSpent: number; // AP tokens spent
}

export interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  totalRewards: number;
  favoriteGame?: GameType;
  highScores: Record<GameType, number>;
}

export interface GameConfig {
  type: GameType;
  name: string;
  icon: string;
  color: string;
  description: string;
  estimatedTime: number; // in seconds
  difficultyLevels: {
    easy: { reward: number; apCost: number; description: string };
    medium: { reward: number; apCost: number; description: string };
    hard: { reward: number; apCost: number; description: string };
  };
}

export const GAME_CONFIGS: Record<GameType, GameConfig> = {
  [GameType.SUDOKU]: {
    type: GameType.SUDOKU,
    name: "Sudoku Master",
    icon: "🔢",
    color: "#FF6B9D",
    description: "Fill the grid with numbers 1-9",
    estimatedTime: 180,
    difficultyLevels: {
      easy: { reward: 25, apCost: 10, description: "4x4 grid" },
      medium: { reward: 60, apCost: 25, description: "6x6 grid" },
      hard: { reward: 120, apCost: 50, description: "9x9 grid" },
    },
  },
  [GameType.MEMORY_MATCH]: {
    type: GameType.MEMORY_MATCH,
    name: "Memory Match",
    icon: "🃏",
    color: "#4ECDC4",
    description: "Match pairs of cards",
    estimatedTime: 90,
    difficultyLevels: {
      easy: { reward: 20, apCost: 10, description: "8 cards" },
      medium: { reward: 50, apCost: 25, description: "16 cards" },
      hard: { reward: 100, apCost: 50, description: "24 cards" },
    },
  },
  [GameType.PUZZLE_2048]: {
    type: GameType.PUZZLE_2048,
    name: "2048 Challenge",
    icon: "🎯",
    color: "#FFD93D",
    description: "Combine tiles to reach 2048",
    estimatedTime: 120,
    difficultyLevels: {
      easy: { reward: 25, apCost: 10, description: "Reach 512" },
      medium: { reward: 65, apCost: 25, description: "Reach 1024" },
      hard: { reward: 130, apCost: 50, description: "Reach 2048" },
    },
  },
  [GameType.TIC_TAC_TOE]: {
    type: GameType.TIC_TAC_TOE,
    name: "Tic-Tac-Toe",
    icon: "⭕",
    color: "#C77DFF",
    description: "Beat the AI in 3 rounds",
    estimatedTime: 60,
    difficultyLevels: {
      easy: { reward: 18, apCost: 10, description: "Beginner AI" },
      medium: { reward: 45, apCost: 25, description: "Intermediate AI" },
      hard: { reward: 90, apCost: 50, description: "Expert AI" },
    },
  },
  [GameType.COLOR_SEQUENCE]: {
    type: GameType.COLOR_SEQUENCE,
    name: "Color Memory",
    icon: "🌈",
    color: "#06FFA5",
    description: "Remember the color sequence",
    estimatedTime: 60,
    difficultyLevels: {
      easy: { reward: 20, apCost: 10, description: "5 colors" },
      medium: { reward: 48, apCost: 25, description: "8 colors" },
      hard: { reward: 95, apCost: 50, description: "12 colors" },
    },
  },
  [GameType.WORD_SCRAMBLE]: {
    type: GameType.WORD_SCRAMBLE,
    name: "Word Scramble",
    icon: "📝",
    color: "#FF8B94",
    description: "Unscramble the words",
    estimatedTime: 90,
    difficultyLevels: {
      easy: { reward: 18, apCost: 10, description: "5-letter words" },
      medium: { reward: 42, apCost: 25, description: "7-letter words" },
      hard: { reward: 85, apCost: 50, description: "10-letter words" },
    },
  },
  [GameType.MATH_CHALLENGE]: {
    type: GameType.MATH_CHALLENGE,
    name: "Math Master",
    icon: "➗",
    color: "#95E1D3",
    description: "Solve math problems quickly",
    estimatedTime: 90,
    difficultyLevels: {
      easy: { reward: 22, apCost: 10, description: "Addition/Subtraction" },
      medium: {
        reward: 52,
        apCost: 25,
        description: "Multiplication/Division",
      },
      hard: { reward: 105, apCost: 50, description: "Complex equations" },
    },
  },
  [GameType.PATTERN_LOCK]: {
    type: GameType.PATTERN_LOCK,
    name: "Pattern Lock",
    icon: "🔐",
    color: "#F38181",
    description: "Recreate the pattern",
    estimatedTime: 45,
    difficultyLevels: {
      easy: { reward: 23, apCost: 10, description: "4-dot pattern" },
      medium: { reward: 55, apCost: 25, description: "6-dot pattern" },
      hard: { reward: 110, apCost: 50, description: "9-dot pattern" },
    },
  },
  [GameType.SIMON_SAYS]: {
    type: GameType.SIMON_SAYS,
    name: "Simon Says",
    icon: "🎵",
    color: "#AA96DA",
    description: "Follow the sequence",
    estimatedTime: 75,
    difficultyLevels: {
      easy: { reward: 20, apCost: 10, description: "6 steps" },
      medium: { reward: 50, apCost: 25, description: "10 steps" },
      hard: { reward: 100, apCost: 50, description: "15 steps" },
    },
  },
  [GameType.SPOT_DIFFERENCE]: {
    type: GameType.SPOT_DIFFERENCE,
    name: "Spot the Difference",
    icon: "👀",
    color: "#FCBAD3",
    description: "Find all differences",
    estimatedTime: 120,
    difficultyLevels: {
      easy: { reward: 25, apCost: 10, description: "3 differences" },
      medium: { reward: 60, apCost: 25, description: "5 differences" },
      hard: { reward: 115, apCost: 50, description: "8 differences" },
    },
  },
};
