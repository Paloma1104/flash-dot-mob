import { GameType } from "./game";

/**
 * Multiplayer Station Types for Flash.Mob
 * Enables competitive gaming with AP token staking
 */

export enum StationStatus {
  INACTIVE = "inactive",
  WAITING_PLAYERS = "waiting",
  GAME_STARTING = "starting",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
}

export interface MultiplayerStation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  stakeAmount: number; // AP tokens required to join
  minPlayers: number;
  maxPlayers: number;
  currentPlayers: MultiplayerPlayer[];
  status: StationStatus;
  selectedGame?: GameType;
  createdAt: string;
  createdBy: string;
  isActive: boolean;
}

export interface MultiplayerPlayer {
  address: string;
  displayName: string;
  stakedAmount: number;
  score?: number;
  hasSubmitted: boolean;
  isReady: boolean;
  joinedAt: string;
}

export interface MultiplayerSession {
  stationId: string;
  gameType: GameType;
  players: MultiplayerPlayer[];
  totalPool: number;
  startedAt: string;
  completedAt?: string;
  winnerId?: string;
  winnerPrize?: number;
}

export interface MultiplayerGameResult {
  stationId: string;
  playerId: string;
  score: number;
  timeSpent: number;
  signature?: string;
}

// LNMIIT Campus Station - The LNM Institute of Information Technology, Jaipur
export const LNMIIT_MULTIPLAYER_STATION: Omit<
  MultiplayerStation,
  "currentPlayers" | "status"
> = {
  id: "lnmiit-arena-001",
  name: "LNMIIT Gaming Arena",
  latitude: 26.9363,
  longitude: 75.9235,
  stakeAmount: 50,
  minPlayers: 2,
  maxPlayers: 4,
  createdAt: new Date().toISOString(),
  createdBy: "system",
  isActive: true,
};

// Multiplayer-compatible games (subset of all games)
export const MULTIPLAYER_GAMES: GameType[] = [
  GameType.TIC_TAC_TOE,
  GameType.MEMORY_MATCH,
  GameType.MATH_CHALLENGE,
  GameType.COLOR_SEQUENCE,
  GameType.WORD_SCRAMBLE,
  GameType.PATTERN_LOCK,
];

// Map game type number from contract to GameType enum
export const CONTRACT_GAME_MAP: Record<number, GameType> = {
  0: GameType.TIC_TAC_TOE,
  1: GameType.MEMORY_MATCH,
  2: GameType.MATH_CHALLENGE,
  3: GameType.COLOR_SEQUENCE,
  4: GameType.WORD_SCRAMBLE,
  5: GameType.PATTERN_LOCK,
};
