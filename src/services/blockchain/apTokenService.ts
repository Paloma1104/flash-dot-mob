/**
 * @file apTokenService.ts
 * @description Service for interacting with APToken and GameRewards smart contracts
 */

import {
    createPublicClient,
    encodeFunctionData,
    formatUnits,
    http,
    parseUnits,
} from "viem";

import { defaultChain } from "./config";

// ABIs
export const AP_TOKEN_ABI = [
  {
    inputs: [{ name: "user", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "canClaimAirdrop",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "claimInitialAirdrop",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "monAmount", type: "uint256" }],
    name: "purchaseAP",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "monAmount", type: "uint256" }],
    name: "calculateAPForMON",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [{ name: "apAmount", type: "uint256" }],
    name: "calculateMONForAP",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "easyGameCost",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "mediumGameCost",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "hardGameCost",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const GAME_REWARDS_ABI = [
  {
    inputs: [
      { name: "sessionId", type: "bytes32" },
      { name: "gameType", type: "string" },
      { name: "difficulty", type: "string" },
    ],
    name: "startGame",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "sessionId", type: "bytes32" },
      { name: "monReward", type: "uint256" },
      { name: "score", type: "uint256" },
      { name: "deadline", type: "uint256" },
      { name: "signature", type: "bytes" },
    ],
    name: "claimReward",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserStats",
    outputs: [
      { name: "gamesPlayed", type: "uint256" },
      { name: "gamesWon", type: "uint256" },
      { name: "totalAPSpent", type: "uint256" },
      { name: "totalMONEarned", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "canPlay",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getRemainingPlays",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "nonces",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Create public client for reading
const publicClient = createPublicClient({
  chain: defaultChain,
  transport: http(),
});

export interface APTokenService {
  // Contract addresses
  contractAddress: `0x${string}`;
  gameRewardsAddress: `0x${string}`;
  monTokenAddress: `0x${string}`;

  // AP Token functions
  getAPBalance: (userAddress: `0x${string}`) => Promise<string>;
  canClaimAirdrop: (userAddress: `0x${string}`) => Promise<boolean>;
  claimAirdrop: (userAddress: `0x${string}`) => Promise<`0x${string}` | null>;
  purchaseAP: (
    monAmount: string,
    userAddress: `0x${string}`,
  ) => Promise<`0x${string}` | null>;
  calculateAPForMON: (monAmount: string) => Promise<string>;
  calculateMONForAP: (apAmount: string) => Promise<string>;
  getGameCosts: () => Promise<{ easy: string; medium: string; hard: string }>;

  // Game Rewards functions
  startGame: (
    sessionId: string,
    gameType: string,
    difficulty: "easy" | "medium" | "hard",
    userAddress: `0x${string}`,
  ) => Promise<`0x${string}` | null>;
  startGameOnChain: (
    sessionId: string,
    gameType: string,
    difficulty: string,
    userAddress: `0x${string}`,
    walletClient: any,
  ) => Promise<`0x${string}`>;
  canPlayGame: (userAddress: `0x${string}`) => Promise<boolean>;
  getRemainingPlays: (userAddress: `0x${string}`) => Promise<number>;
  getUserGameStats: (userAddress: `0x${string}`) => Promise<{
    gamesPlayed: number;
    gamesWon: number;
    totalAPSpent: string;
    totalMONEarned: string;
  }>;
}

/**
 * AP Token Service
 * Handles all interactions with APToken and GameRewards contracts
 */
export function createAPTokenService(
  apTokenAddress: `0x${string}`,
  gameRewardsAddress: `0x${string}`,
  monTokenAddress: `0x${string}` = "0x5FbDB2315678afecb367f032d93F642f64180aa3",
): APTokenService {
  // ============ AP TOKEN FUNCTIONS ============

  async function getAPBalance(userAddress: `0x${string}`): Promise<string> {
    try {
      const balance = await publicClient.readContract({
        address: apTokenAddress,
        abi: AP_TOKEN_ABI,
        functionName: "balanceOf",
        args: [userAddress],
      });

      return formatUnits(balance, 18);
    } catch (error) {
      console.error("Error getting AP balance:", error);
      return "0";
    }
  }

  async function canClaimAirdrop(userAddress: `0x${string}`): Promise<boolean> {
    try {
      const canClaim = await publicClient.readContract({
        address: apTokenAddress,
        abi: AP_TOKEN_ABI,
        functionName: "canClaimAirdrop",
        args: [userAddress],
      });

      return canClaim;
    } catch (error) {
      console.error("Error checking airdrop eligibility:", error);
      return false;
    }
  }

  async function claimAirdrop(
    userAddress: `0x${string}`,
  ): Promise<`0x${string}` | null> {
    try {
      // This should be called via wallet transaction
      // Return encoded data for wallet to sign
      const data = encodeFunctionData({
        abi: AP_TOKEN_ABI,
        functionName: "claimInitialAirdrop",
      });

      // In real implementation, this would be sent via wallet
      console.log("Claim airdrop transaction data:", data);
      return data as `0x${string}`;
    } catch (error) {
      console.error("Error claiming airdrop:", error);
      return null;
    }
  }

  async function purchaseAP(
    monAmount: string,
    userAddress: `0x${string}`,
  ): Promise<`0x${string}` | null> {
    try {
      const amount = parseUnits(monAmount, 18);

      const data = encodeFunctionData({
        abi: AP_TOKEN_ABI,
        functionName: "purchaseAP",
        args: [amount],
      });

      console.log("Purchase AP transaction data:", data);
      return data as `0x${string}`;
    } catch (error) {
      console.error("Error purchasing AP:", error);
      return null;
    }
  }

  async function calculateAPForMON(monAmount: string): Promise<string> {
    try {
      const amount = parseUnits(monAmount, 18);

      const apAmount = await publicClient.readContract({
        address: apTokenAddress,
        abi: AP_TOKEN_ABI,
        functionName: "calculateAPForMON",
        args: [amount],
      });

      return formatUnits(apAmount, 18);
    } catch (error) {
      console.error("Error calculating AP for MON:", error);
      return "0";
    }
  }

  async function calculateMONForAP(apAmount: string): Promise<string> {
    try {
      const amount = parseUnits(apAmount, 18);

      const monAmount = await publicClient.readContract({
        address: apTokenAddress,
        abi: AP_TOKEN_ABI,
        functionName: "calculateMONForAP",
        args: [amount],
      });

      return formatUnits(monAmount, 18);
    } catch (error) {
      console.error("Error calculating MON for AP:", error);
      return "0";
    }
  }

  async function getGameCosts(): Promise<{
    easy: string;
    medium: string;
    hard: string;
  }> {
    try {
      const [easy, medium, hard] = await Promise.all([
        publicClient.readContract({
          address: apTokenAddress,
          abi: AP_TOKEN_ABI,
          functionName: "easyGameCost",
        }),
        publicClient.readContract({
          address: apTokenAddress,
          abi: AP_TOKEN_ABI,
          functionName: "mediumGameCost",
        }),
        publicClient.readContract({
          address: apTokenAddress,
          abi: AP_TOKEN_ABI,
          functionName: "hardGameCost",
        }),
      ]);

      return {
        easy: formatUnits(easy, 18),
        medium: formatUnits(medium, 18),
        hard: formatUnits(hard, 18),
      };
    } catch (error) {
      console.error("Error getting game costs:", error);
      return { easy: "10", medium: "25", hard: "50" };
    }
  }

  // ============ GAME REWARDS FUNCTIONS ============

  async function startGame(
    sessionId: string,
    gameType: string,
    difficulty: "easy" | "medium" | "hard",
    userAddress: `0x${string}`,
  ): Promise<`0x${string}` | null> {
    try {
      // Convert sessionId to bytes32
      const sessionIdBytes = `0x${sessionId.padEnd(64, "0")}` as `0x${string}`;

      const data = encodeFunctionData({
        abi: GAME_REWARDS_ABI,
        functionName: "startGame",
        args: [sessionIdBytes, gameType, difficulty],
      });

      console.log("Start game transaction data:", data);
      return data as `0x${string}`;
    } catch (error) {
      console.error("Error starting game:", error);
      return null;
    }
  }

  async function canPlayGame(userAddress: `0x${string}`): Promise<boolean> {
    try {
      const canPlay = await publicClient.readContract({
        address: gameRewardsAddress,
        abi: GAME_REWARDS_ABI,
        functionName: "canPlay",
        args: [userAddress],
      });

      return canPlay;
    } catch (error) {
      console.error("Error checking if can play:", error);
      return false;
    }
  }

  async function getRemainingPlays(
    userAddress: `0x${string}`,
  ): Promise<number> {
    try {
      const remaining = await publicClient.readContract({
        address: gameRewardsAddress,
        abi: GAME_REWARDS_ABI,
        functionName: "getRemainingPlays",
        args: [userAddress],
      });

      return Number(remaining);
    } catch (error) {
      console.error("Error getting remaining plays:", error);
      return 0;
    }
  }

  async function getUserGameStats(userAddress: `0x${string}`) {
    try {
      const stats = await publicClient.readContract({
        address: gameRewardsAddress,
        abi: GAME_REWARDS_ABI,
        functionName: "getUserStats",
        args: [userAddress],
      });

      return {
        gamesPlayed: Number(stats[0]),
        gamesWon: Number(stats[1]),
        totalAPSpent: formatUnits(stats[2], 18),
        totalMONEarned: formatUnits(stats[3], 18),
      };
    } catch (error) {
      console.error("Error getting user game stats:", error);
      return {
        gamesPlayed: 0,
        gamesWon: 0,
        totalAPSpent: "0",
        totalMONEarned: "0",
      };
    }
  }

  /**
   * Start a game session on blockchain - burns AP tokens
   * @param sessionId - Unique session identifier
   * @param gameType - Type of game (e.g., 'capture', 'puzzle', 'racing')
   * @param difficulty - Game difficulty ('easy', 'medium', 'hard')
   * @param userAddress - Player's wallet address
   * @param walletClient - Wallet client for signing transactions
   * @returns Transaction hash
   */
  async function startGameOnChain(
    sessionId: string,
    gameType: string,
    difficulty: string,
    userAddress: `0x${string}`,
    walletClient: any, // viem WalletClient
  ) {
    try {
      // Convert sessionId to bytes32
      const sessionIdBytes32 = `0x${sessionId
        .replace(/[^a-f0-9]/gi, "")
        .padEnd(64, "0")
        .slice(0, 64)}` as `0x${string}`;

      // Call startGame on GameRewards contract
      const hash = await walletClient.writeContract({
        address: gameRewardsAddress,
        abi: GAME_REWARDS_ABI,
        functionName: "startGame",
        args: [sessionIdBytes32, gameType, difficulty],
        account: userAddress,
      });

      console.log("Game started on blockchain:", hash);
      return hash;
    } catch (error) {
      console.error("Error starting game on blockchain:", error);
      throw error;
    }
  }

  return {
    contractAddress: apTokenAddress,
    gameRewardsAddress: gameRewardsAddress,
    monTokenAddress,
    getAPBalance,
    canClaimAirdrop,
    claimAirdrop,
    purchaseAP,
    calculateAPForMON,
    calculateMONForAP,
    getGameCosts,
    startGame,
    startGameOnChain,
    canPlayGame,
    getRemainingPlays,
    getUserGameStats,
  };
}

// Singleton instance (will be initialized with contract addresses)
let apTokenServiceInstance: APTokenService | null = null;

export function initAPTokenService(
  apTokenAddress: `0x${string}`,
  gameRewardsAddress: `0x${string}`,
) {
  apTokenServiceInstance = createAPTokenService(
    apTokenAddress,
    gameRewardsAddress,
  );
}

export function getAPTokenService(): APTokenService {
  if (!apTokenServiceInstance) {
    throw new Error(
      "APTokenService not initialized. Call initAPTokenService first.",
    );
  }
  return apTokenServiceInstance;
}
