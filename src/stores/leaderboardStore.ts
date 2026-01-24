/**
 * Leaderboard Store
 * Tracks player rankings based on actual wallet performance (games won, AP earned)
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface LeaderboardEntry {
  rank: number;
  walletAddress: string;
  displayName: string;
  totalEarnings: number; // Total AP earned all-time
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  lastActive: string;
  isCurrentUser?: boolean;
}

interface LeaderboardState {
  // Rankings
  globalLeaderboard: LeaderboardEntry[];
  weeklyLeaderboard: LeaderboardEntry[];
  userRank: number | null;
  userStats: LeaderboardEntry | null;

  // Loading
  isLoading: boolean;
  lastUpdated: string | null;

  // Actions
  updateUserStats: (stats: Partial<LeaderboardEntry>) => void;
  refreshLeaderboard: () => void;
  getUserRankPercentile: () => number;
}

// Simulated other players (in production, this would come from backend)
const SIMULATED_PLAYERS: Omit<LeaderboardEntry, "rank">[] = [
  {
    walletAddress: "0x1234...abcd",
    displayName: "CryptoKing",
    totalEarnings: 15420,
    gamesPlayed: 289,
    gamesWon: 201,
    winRate: 69.5,
    lastActive: new Date().toISOString(),
  },
  {
    walletAddress: "0x5678...efgh",
    displayName: "FlashMaster",
    totalEarnings: 12350,
    gamesPlayed: 245,
    gamesWon: 186,
    winRate: 75.9,
    lastActive: new Date().toISOString(),
  },
  {
    walletAddress: "0x9abc...ijkl",
    displayName: "MonadWhale",
    totalEarnings: 11200,
    gamesPlayed: 198,
    gamesWon: 142,
    winRate: 71.7,
    lastActive: new Date().toISOString(),
  },
  {
    walletAddress: "0xdef0...mnop",
    displayName: "DropHunter",
    totalEarnings: 9850,
    gamesPlayed: 176,
    gamesWon: 121,
    winRate: 68.8,
    lastActive: new Date().toISOString(),
  },
  {
    walletAddress: "0x1111...qrst",
    displayName: "AlphaGamer",
    totalEarnings: 8420,
    gamesPlayed: 154,
    gamesWon: 108,
    winRate: 70.1,
    lastActive: new Date().toISOString(),
  },
  {
    walletAddress: "0x2222...uvwx",
    displayName: "TokenTitan",
    totalEarnings: 7650,
    gamesPlayed: 132,
    gamesWon: 89,
    winRate: 67.4,
    lastActive: new Date().toISOString(),
  },
  {
    walletAddress: "0x3333...yzab",
    displayName: "ChainLink",
    totalEarnings: 6890,
    gamesPlayed: 118,
    gamesWon: 82,
    winRate: 69.5,
    lastActive: new Date().toISOString(),
  },
  {
    walletAddress: "0x4444...cdef",
    displayName: "BlockRunner",
    totalEarnings: 5420,
    gamesPlayed: 98,
    gamesWon: 64,
    winRate: 65.3,
    lastActive: new Date().toISOString(),
  },
  {
    walletAddress: "0x5555...ghij",
    displayName: "NftCollector",
    totalEarnings: 4350,
    gamesPlayed: 86,
    gamesWon: 58,
    winRate: 67.4,
    lastActive: new Date().toISOString(),
  },
  {
    walletAddress: "0x6666...klmn",
    displayName: "DefiDegen",
    totalEarnings: 3200,
    gamesPlayed: 72,
    gamesWon: 45,
    winRate: 62.5,
    lastActive: new Date().toISOString(),
  },
  {
    walletAddress: "0x7777...opqr",
    displayName: "StakeMaster",
    totalEarnings: 2850,
    gamesPlayed: 58,
    gamesWon: 37,
    winRate: 63.8,
    lastActive: new Date().toISOString(),
  },
  {
    walletAddress: "0x8888...stuv",
    displayName: "YieldFarmer",
    totalEarnings: 2100,
    gamesPlayed: 45,
    gamesWon: 28,
    winRate: 62.2,
    lastActive: new Date().toISOString(),
  },
  {
    walletAddress: "0x9999...wxyz",
    displayName: "GasGuzzler",
    totalEarnings: 1650,
    gamesPlayed: 38,
    gamesWon: 22,
    winRate: 57.9,
    lastActive: new Date().toISOString(),
  },
  {
    walletAddress: "0xaaaa...1234",
    displayName: "MintMaster",
    totalEarnings: 1200,
    gamesPlayed: 28,
    gamesWon: 16,
    winRate: 57.1,
    lastActive: new Date().toISOString(),
  },
  {
    walletAddress: "0xbbbb...5678",
    displayName: "L2Native",
    totalEarnings: 850,
    gamesPlayed: 22,
    gamesWon: 12,
    winRate: 54.5,
    lastActive: new Date().toISOString(),
  },
];

export const useLeaderboardStore = create<LeaderboardState>()(
  persist(
    (set, get) => ({
      globalLeaderboard: [],
      weeklyLeaderboard: [],
      userRank: null,
      userStats: null,
      isLoading: false,
      lastUpdated: null,

      updateUserStats: (stats) => {
        const currentStats = get().userStats;
        const newStats: LeaderboardEntry = {
          rank: 0,
          walletAddress: currentStats?.walletAddress || "",
          displayName: "You",
          totalEarnings: currentStats?.totalEarnings || 0,
          gamesPlayed: currentStats?.gamesPlayed || 0,
          gamesWon: currentStats?.gamesWon || 0,
          winRate: 0,
          lastActive: new Date().toISOString(),
          isCurrentUser: true,
          ...stats,
        };

        // Calculate win rate
        if (newStats.gamesPlayed > 0) {
          newStats.winRate =
            Math.round((newStats.gamesWon / newStats.gamesPlayed) * 1000) / 10;
        }

        set({ userStats: newStats });
        get().refreshLeaderboard();
      },

      refreshLeaderboard: () => {
        const { userStats } = get();

        // Combine simulated players with user
        const allPlayers: LeaderboardEntry[] = [
          ...SIMULATED_PLAYERS.map((p, i) => ({ ...p, rank: i + 1 })),
        ];

        if (userStats) {
          allPlayers.push(userStats);
        }

        // Sort by total earnings (descending)
        allPlayers.sort((a, b) => b.totalEarnings - a.totalEarnings);

        // Assign ranks
        allPlayers.forEach((player, index) => {
          player.rank = index + 1;
        });

        // Find user rank
        const userRank = userStats
          ? allPlayers.findIndex((p) => p.isCurrentUser) + 1
          : null;

        set({
          globalLeaderboard: allPlayers,
          userRank,
          lastUpdated: new Date().toISOString(),
        });
      },

      getUserRankPercentile: () => {
        const { userRank, globalLeaderboard } = get();
        if (!userRank || globalLeaderboard.length === 0) return 0;
        return Math.round(
          (1 - (userRank - 1) / globalLeaderboard.length) * 100,
        );
      },
    }),
    {
      name: "leaderboard-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        userStats: state.userStats,
      }),
    },
  ),
);
