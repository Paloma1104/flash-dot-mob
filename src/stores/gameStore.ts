import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { GameDrop, GameSession, GameStats, GameType } from "../types/game";
import { useUserStore } from "./userStore";

interface GameState {
  // Current game session
  activeSession: GameSession | null;
  isGameActive: boolean;

  // Available games on map
  gameDrops: GameDrop[];
  selectedGameDrop: GameDrop | null;

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
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      activeSession: null,
      isGameActive: false,
      gameDrops: [],
      selectedGameDrop: null,
      gameStats: {
        gamesPlayed: 0,
        gamesWon: 0,
        totalRewards: 0,
        highScores: {} as Record<GameType, number>,
      },
      recentSessions: [],

      startGame: async (gameDrop: GameDrop) => {
        const userStore = useUserStore.getState();

        // Check if user has enough AP tokens
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

        // Deduct AP tokens optimistically
        userStore.deductAP(gameDrop.apCost);

        set({
          activeSession: session,
          isGameActive: true,
          selectedGameDrop: gameDrop,
        });

        // Call smart contract to burn AP tokens on-chain
        try {
          // Get wallet client from Privy hook (needs to be passed in)
          // This is now handled by the frontend component that calls startGame
          console.log("✅ Game session created:", session.id);
          console.log("Ready for blockchain integration via wallet client");

          // Note: The actual blockchain call should be made from the component
          // that has access to useWallet() hook. Example:
          // const { walletClient } = useWallet();
          // const { getAPTokenService } = await import('../services/blockchain/apTokenService');
          // const apService = getAPTokenService();
          // await apService.startGameOnChain(
          //   session.id,
          //   gameDrop.gameType,
          //   gameDrop.difficulty,
          //   userStore.walletAddress as `0x${string}`,
          //   walletClient
          // );
        } catch (error) {
          console.error("Failed to start game on blockchain:", error);
          // Refund AP if blockchain call fails
          userStore.addAP(gameDrop.apCost);
          set({
            activeSession: null,
            isGameActive: false,
            selectedGameDrop: null,
          });
          return false;
        }

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

        // Update user balance if won
        if (didWin) {
          const userStore = useUserStore.getState();
          userStore.addPendingBalance(rewardEarned);
          userStore.confirmPendingBalance(rewardEarned);
        }
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
