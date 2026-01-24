import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface Transaction {
  id: string;
  type: "claim" | "send" | "receive";
  amount: number;
  timestamp: number;
  status: "pending" | "success" | "failed";
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
  progress: number; // 0-100
  target: number;
}

export type AchievementId =
  | "first_drop"
  | "explorer_10"
  | "collector_50"
  | "master_100"
  | "millionaire"
  | "whale_10k"
  | "speed_demon"
  | "big_catch"
  | "daily_streak_7"
  | "monad_pioneer";

interface UserState {
  // Auth
  isAuthenticated: boolean;
  walletAddress: string | null;

  // Balance (optimistic)
  balance: number; // MON testnet
  pendingBalance: number; // Amount being claimed

  // AP Token (Activity Points) - NEW
  apBalance: number; // AP token balance
  hasClaimedInitialAP: boolean; // Track if user claimed 5000 AP welcome bonus

  // History & Stats
  history: Transaction[];
  stats: {
    totalClaims: number;
    bestDrop: number;
    avgValue: number;
  };

  // Achievements
  achievements: Achievement[];
  newAchievements: string[]; // IDs of recently unlocked achievements

  // Location permissions
  hasLocationPermission: boolean;

  // Onboarding
  hasCompletedOnboarding: boolean;

  // Actions
  setAuthenticated: (isAuth: boolean, walletAddress?: string) => void;
  setBalance: (balance: number) => void;

  // AP Token actions - NEW
  setAPBalance: (balance: number) => void;
  deductAP: (amount: number) => void;
  addAP: (amount: number) => void;
  setHasClaimedInitialAP: (claimed: boolean) => void;

  // Transaction helpers
  addPendingBalance: (amount: number) => void;
  confirmPendingBalance: (amount: number) => void; // Pass amount to log transaction
  revertPendingBalance: () => void;

  // Achievement helpers
  checkAchievements: () => void;
  dismissNewAchievements: () => void;

  setOnboardingComplete: () => void;
  setLocationPermission: (hasPermission: boolean) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      walletAddress: null,
      balance: 0,
      pendingBalance: 0,

      // AP Token state - NEW
      apBalance: 0,
      hasClaimedInitialAP: false,

      hasLocationPermission: false,
      hasCompletedOnboarding: false,
      history: [],
      stats: {
        totalClaims: 0,
        bestDrop: 0,
        avgValue: 0,
      },
      achievements: [
        {
          id: "monad_pioneer",
          name: "Monad Pioneer",
          description: "Join Flash.Mob on Monad",
          icon: "⚡",
          unlocked: true,
          unlockedAt: Date.now(),
          progress: 100,
          target: 1,
        },
        {
          id: "first_drop",
          name: "First Drop",
          description: "Claim your first drop",
          icon: "🎉",
          unlocked: false,
          progress: 0,
          target: 1,
        },
        {
          id: "explorer_10",
          name: "Explorer",
          description: "Claim 10 drops",
          icon: "🗺️",
          unlocked: false,
          progress: 0,
          target: 10,
        },
        {
          id: "collector_50",
          name: "Collector",
          description: "Claim 50 drops",
          icon: "💎",
          unlocked: false,
          progress: 0,
          target: 50,
        },
        {
          id: "master_100",
          name: "Drop Master",
          description: "Claim 100 drops",
          icon: "🏆",
          unlocked: false,
          progress: 0,
          target: 100,
        },
        {
          id: "millionaire",
          name: "Millionaire",
          description: "Earn 1,000 $MON",
          icon: "💰",
          unlocked: false,
          progress: 0,
          target: 1000,
        },
        {
          id: "whale_10k",
          name: "Whale Status",
          description: "Earn 10,000 $MON",
          icon: "🐳",
          unlocked: false,
          progress: 0,
          target: 10000,
        },
        {
          id: "big_catch",
          name: "Big Catch",
          description: "Claim a drop worth 500+ $MON",
          icon: "🎁",
          unlocked: false,
          progress: 0,
          target: 500,
        },
        {
          id: "speed_demon",
          name: "Speed Demon",
          description: "Claim 5 drops in 10 minutes",
          icon: "🔥",
          unlocked: false,
          progress: 0,
          target: 5,
        },
      ],
      newAchievements: [],

      // Actions
      setAuthenticated: (isAuth, walletAddress) =>
        set((state) => {
          // Grant 5000 AP to new users on first wallet connection
          const isNewUser = isAuth && !state.hasClaimedInitialAP;
          return {
            isAuthenticated: isAuth,
            walletAddress: walletAddress ?? null,
            // Give new users 5000 AP tokens as welcome bonus
            apBalance: isNewUser ? 5000 : state.apBalance,
            hasClaimedInitialAP: isAuth ? true : state.hasClaimedInitialAP,
          };
        }),

      setBalance: (balance) => set({ balance }),

      // AP Token actions - NEW
      setAPBalance: (balance) => set({ apBalance: balance }),

      deductAP: (amount) =>
        set((state) => ({
          apBalance: Math.max(0, state.apBalance - amount),
        })),

      addAP: (amount) =>
        set((state) => ({
          apBalance: state.apBalance + amount,
        })),

      setHasClaimedInitialAP: (claimed) =>
        set({ hasClaimedInitialAP: claimed }),

      // Optimistic balance updates
      addPendingBalance: (amount) =>
        set((state) => ({
          pendingBalance: state.pendingBalance + amount,
          balance: state.balance + amount, // Optimistic update
        })),

      confirmPendingBalance: (amount) => {
        set((state) => {
          // Create new transaction record
          const newTx: Transaction = {
            id: Math.random().toString(36).substring(7),
            type: "claim",
            amount,
            timestamp: Date.now(),
            status: "success",
          };

          const newHistory = [newTx, ...state.history];

          // Update stats
          const totalClaims = newHistory.filter(
            (t) => t.type === "claim",
          ).length;
          const bestDrop = Math.max(state.stats.bestDrop, amount);
          const totalClaimedValue = newHistory
            .filter((t) => t.type === "claim")
            .reduce((sum, t) => sum + t.amount, 0);

          return {
            pendingBalance: 0,
            history: newHistory,
            stats: {
              totalClaims,
              bestDrop,
              avgValue: totalClaims > 0 ? totalClaimedValue / totalClaims : 0,
            },
          };
        });

        // Check achievements after state update
        get().checkAchievements();
      },

      revertPendingBalance: () =>
        set((state) => ({
          balance: state.balance - state.pendingBalance,
          pendingBalance: 0,
        })),

      checkAchievements: () =>
        set((state) => {
          const { stats, balance, achievements, history } = state;
          const updatedAchievements = achievements.map((achievement) => {
            if (achievement.unlocked) return achievement;

            let progress = 0;
            let shouldUnlock = false;

            switch (achievement.id) {
              case "first_drop":
                progress = Math.min(100, (stats.totalClaims / 1) * 100);
                shouldUnlock = stats.totalClaims >= 1;
                break;
              case "explorer_10":
                progress = Math.min(100, (stats.totalClaims / 10) * 100);
                shouldUnlock = stats.totalClaims >= 10;
                break;
              case "collector_50":
                progress = Math.min(100, (stats.totalClaims / 50) * 100);
                shouldUnlock = stats.totalClaims >= 50;
                break;
              case "master_100":
                progress = Math.min(100, (stats.totalClaims / 100) * 100);
                shouldUnlock = stats.totalClaims >= 100;
                break;
              case "millionaire":
                progress = Math.min(100, (balance / 1000) * 100);
                shouldUnlock = balance >= 1000;
                break;
              case "whale_10k":
                progress = Math.min(100, (balance / 10000) * 100);
                shouldUnlock = balance >= 10000;
                break;
              case "big_catch":
                progress = Math.min(100, (stats.bestDrop / 500) * 100);
                shouldUnlock = stats.bestDrop >= 500;
                break;
              case "speed_demon": {
                // Check last 5 claims within 10 minutes
                const recentClaims = history
                  .filter((tx) => tx.type === "claim")
                  .slice(0, 5);
                if (recentClaims.length >= 5) {
                  const timeDiff =
                    recentClaims[0].timestamp - recentClaims[4].timestamp;
                  shouldUnlock = timeDiff <= 10 * 60 * 1000;
                  progress = shouldUnlock
                    ? 100
                    : Math.min(100, (recentClaims.length / 5) * 100);
                } else {
                  progress = Math.min(100, (recentClaims.length / 5) * 100);
                }
                break;
              }
            }

            if (shouldUnlock) {
              return {
                ...achievement,
                unlocked: true,
                unlockedAt: Date.now(),
                progress: 100,
              };
            }

            return { ...achievement, progress };
          });

          // Find newly unlocked achievements
          const newlyUnlocked = updatedAchievements
            .filter((a, idx) => a.unlocked && !achievements[idx].unlocked)
            .map((a) => a.id);

          return {
            achievements: updatedAchievements,
            newAchievements: [...state.newAchievements, ...newlyUnlocked],
          };
        }),

      dismissNewAchievements: () => set({ newAchievements: [] }),

      setOnboardingComplete: () => set({ hasCompletedOnboarding: true }),

      setLocationPermission: (hasPermission) =>
        set({ hasLocationPermission: hasPermission }),

      logout: () =>
        set({
          isAuthenticated: false,
          walletAddress: null,
          balance: 0,
          pendingBalance: 0,
          // Keep history and stats - only disconnect wallet and clear balances
        }),
    }),
    {
      name: "flash-mob-user-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
