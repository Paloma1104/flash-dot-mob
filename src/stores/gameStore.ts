import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  getCachedGames,
  hasMovedSignificantly,
  setCachedGames,
} from "../services/gameCache";
import type { GameDrop, GameSession, GameStats, GameType } from "../types/game";
import { useLeaderboardStore } from "./leaderboardStore";
import { usePendingTransactionStore } from "./pendingTransactionStore";
import { useUserStore } from "./userStore";

interface GameState {
  // Current game session
  activeSession: GameSession | null;
  isGameActive: boolean;

  // Available games on map
  gameDrops: GameDrop[];
  selectedGameDrop: GameDrop | null;

  // Loading and caching state
  isLoadingGames: boolean;
  cachedLocation: { latitude: number; longitude: number } | null;
  lastLocationUpdate: number;

  // User stats
  gameStats: GameStats;
  recentSessions: GameSession[];

  // Actions
  startGame: (gameDrop: GameDrop) => Promise<boolean>; // Returns success/failure
  completeGame: (score: number, timeSpent: number) => void;
  cancelGame: () => void;
  selectGameDrop: (dropId: string | null) => void;
  setGameDrops: (drops: GameDrop[]) => void;
  updateGameStats: (newStats: Partial<GameStats>) => void;
  addRecentSession: (session: GameSession) => void;

  // Caching methods
  loadCachedGames: () => Promise<{
    games: GameDrop[];
    location: { latitude: number; longitude: number };
  } | null>;
  cacheGames: (
    games: GameDrop[],
    latitude: number,
    longitude: number,
  ) => Promise<void>;
  shouldRefreshGames: (newLat: number, newLng: number) => boolean;
  setLoadingGames: (loading: boolean) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      activeSession: null,
      isGameActive: false,
      gameDrops: [],
      selectedGameDrop: null,
      isLoadingGames: false,
      cachedLocation: null,
      lastLocationUpdate: 0,
      gameStats: {
        gamesPlayed: 0,
        gamesWon: 0,
        totalRewards: 0,
        highScores: {} as Record<GameType, number>,
      },
      recentSessions: [],

      startGame: async (gameDrop: GameDrop) => {
        const userStore = useUserStore.getState();

        // Check if user has enough AP tokens (optimistic - deducted immediately)
        if (userStore.apBalance < gameDrop.apCost) {
          console.warn("Insufficient AP balance");
          return false;
        }

        const session: GameSession = {
          id: `session-${Date.now()}`,
          gameDropId: gameDrop.id,
          gameType: gameDrop.gameType,
          startedAt: new Date().toISOString(),
          score: 0,
          timeSpent: 0,
          isCompleted: false,
          rewardEarned: 0,
          apSpent: gameDrop.apCost,
        };

        // Deduct AP tokens optimistically (Play Now)
        userStore.deductAP(gameDrop.apCost);

        set({
          activeSession: session,
          isGameActive: true,
          selectedGameDrop: gameDrop,
        });

        // No wallet confirmation needed - game starts immediately!
        console.log("⚡ Game started instantly (Play Now, Confirm Later)");
        console.log("📦 Transactions will be queued for batch claiming");

        return true;
      },

      completeGame: (score: number, timeSpent: number) => {
        const { activeSession, selectedGameDrop, gameStats } = get();

        if (!activeSession || !selectedGameDrop) return;

        // Only give rewards if score > 0 (won)
        const didWin = score > 0;
        const rewardEarned = didWin ? selectedGameDrop.rewardAmount : 0;

        const completedSession: GameSession = {
          ...activeSession,
          completedAt: new Date().toISOString(),
          score,
          timeSpent,
          isCompleted: didWin,
          rewardEarned,
        };

        // Update high scores
        const currentHighScore =
          gameStats.highScores[selectedGameDrop.gameType] || 0;
        const newHighScores = {
          ...gameStats.highScores,
          [selectedGameDrop.gameType]: Math.max(currentHighScore, score),
        };

        set({
          activeSession: null,
          isGameActive: false,
          gameStats: {
            ...gameStats,
            gamesPlayed: gameStats.gamesPlayed + 1,
            gamesWon: gameStats.gamesWon + (didWin ? 1 : 0),
            totalRewards: gameStats.totalRewards + rewardEarned,
            highScores: newHighScores,
          },
        });

        get().addRecentSession(completedSession);

        // Queue reward as pending transaction (Confirm Later)
        if (didWin && rewardEarned > 0) {
          const pendingStore = usePendingTransactionStore.getState();
          pendingStore.addPendingTransaction({
            type: "GAME_REWARD",
            gameType: selectedGameDrop.gameType,
            sessionId: completedSession.id,
            amount: rewardEarned,
          });
          console.log(`🏆 Reward queued: ${rewardEarned} AP (claim later)`);
        }

        // Update leaderboard rankings
        const leaderboardStore = useLeaderboardStore.getState();
        const updatedStats = get().gameStats;
        const userStore = useUserStore.getState();

        leaderboardStore.updateUserStats({
          walletAddress: userStore.walletAddress || "unknown",
          totalEarnings: updatedStats.totalRewards,
          gamesPlayed: updatedStats.gamesPlayed,
          gamesWon: updatedStats.gamesWon,
        });
        console.log(
          `📊 Leaderboard updated: ${updatedStats.gamesWon}/${updatedStats.gamesPlayed} games won`,
        );
      },

      cancelGame: () => {
        set({
          activeSession: null,
          isGameActive: false,
        });
      },

      selectGameDrop: (dropId: string | null) => {
        const { gameDrops } = get();
        const selectedDrop = dropId
          ? gameDrops.find((d) => d.id === dropId) || null
          : null;
        set({ selectedGameDrop: selectedDrop });
      },

      setGameDrops: (drops: GameDrop[]) => {
        set({ gameDrops: drops });
      },

      updateGameStats: (newStats: Partial<GameStats>) => {
        const { gameStats } = get();
        set({ gameStats: { ...gameStats, ...newStats } });
      },

      addRecentSession: (session: GameSession) => {
        const { recentSessions } = get();
        set({
          recentSessions: [session, ...recentSessions].slice(0, 20), // Keep last 20
        });
      },

      // Caching methods for instant loading
      loadCachedGames: async () => {
        try {
          const cached = await getCachedGames();
          if (cached) {
            set({
              gameDrops: cached.games,
              cachedLocation: cached.location,
            });
            console.log(`🎮 Loaded ${cached.games.length} games from cache`);
            return { games: cached.games, location: cached.location };
          }
          return null;
        } catch (error) {
          console.error("Error loading cached games:", error);
          return null;
        }
      },

      cacheGames: async (
        games: GameDrop[],
        latitude: number,
        longitude: number,
      ) => {
        try {
          await setCachedGames(games, latitude, longitude);
          set({
            cachedLocation: { latitude, longitude },
            lastLocationUpdate: Date.now(),
          });
        } catch (error) {
          console.error("Error caching games:", error);
        }
      },

      shouldRefreshGames: (newLat: number, newLng: number): boolean => {
        const { cachedLocation } = get();
        if (!cachedLocation) return true;
        return hasMovedSignificantly(
          cachedLocation.latitude,
          cachedLocation.longitude,
          newLat,
          newLng,
          100, // 100 meter threshold
        );
      },

      setLoadingGames: (loading: boolean) => {
        set({ isLoadingGames: loading });
      },
    }),
    {
      name: "game-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        gameStats: state.gameStats,
        recentSessions: state.recentSessions,
      }),
    },
  ),
);
