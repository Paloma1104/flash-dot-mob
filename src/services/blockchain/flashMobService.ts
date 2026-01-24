/**
 * @file flashMobService.ts
 * @description Service for interacting with FlashMobV2 smart contract for drop claiming
 */

import { createPublicClient, http } from "viem";
import { defaultChain } from "./config";

// FlashMobV2 ABI
export const FLASH_MOB_ABI = [
  {
    inputs: [
      { name: "dropId", type: "bytes32" },
      { name: "claimer", type: "address" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
      { name: "signature", type: "bytes" },
    ],
    name: "claimDrop",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "dropId", type: "bytes32" },
      { name: "claimer", type: "address" },
    ],
    name: "isDropClaimed",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "claimer", type: "address" }],
    name: "getNonce",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Create public client for reading blockchain
const publicClient = createPublicClient({
  chain: defaultChain,
  transport: http(),
});

export interface FlashMobService {
  isDropClaimed: (dropId: string, claimer: `0x${string}`) => Promise<boolean>;
  getNonce: (claimer: `0x${string}`) => Promise<number>;
  claimDrop: (
    dropId: string,
    claimer: `0x${string}`,
    nonce: number,
    deadline: number,
    signature: `0x${string}`,
    walletClient: any,
  ) => Promise<`0x${string}`>;
}

export function createFlashMobService(
  flashMobAddress: `0x${string}`,
): FlashMobService {
  /**
   * Check if a drop has been claimed by a user
   */
  async function isDropClaimed(
    dropId: string,
    claimer: `0x${string}`,
  ): Promise<boolean> {
    try {
      // Convert dropId to bytes32
      const dropIdBytes32 = `0x${dropId
        .replace(/[^a-f0-9]/gi, "")
        .padEnd(64, "0")
        .slice(0, 64)}` as `0x${string}`;

      const claimed = await publicClient.readContract({
        address: flashMobAddress,
        abi: FLASH_MOB_ABI,
        functionName: "isDropClaimed",
        args: [dropIdBytes32, claimer],
      });

      return claimed;
    } catch (error) {
      console.error("Error checking drop claimed status:", error);
      return false;
    }
  }

  /**
   * Get nonce for a user (used in EIP-712 signature)
   */
  async function getNonce(claimer: `0x${string}`): Promise<number> {
    try {
      const nonce = await publicClient.readContract({
        address: flashMobAddress,
        abi: FLASH_MOB_ABI,
        functionName: "getNonce",
        args: [claimer],
      });

      return Number(nonce);
    } catch (error) {
      console.error("Error getting nonce:", error);
      return 0;
    }
  }

  /**
   * Claim a drop on blockchain
   * @requires Backend API to verify GPS proximity and generate EIP-712 signature
   */
  async function claimDrop(
    dropId: string,
    claimer: `0x${string}`,
    nonce: number,
    deadline: number,
    signature: `0x${string}`,
    walletClient: any,
  ): Promise<`0x${string}`> {
    try {
      // Convert dropId to bytes32
      const dropIdBytes32 = `0x${dropId
        .replace(/[^a-f0-9]/gi, "")
        .padEnd(64, "0")
        .slice(0, 64)}` as `0x${string}`;

      // Call claimDrop on FlashMobV2 contract
      const hash = await walletClient.writeContract({
        address: flashMobAddress,
        abi: FLASH_MOB_ABI,
        functionName: "claimDrop",
        args: [
          dropIdBytes32,
          claimer,
          BigInt(nonce),
          BigInt(deadline),
          signature,
        ],
        account: claimer,
      });

      console.log("Drop claimed on blockchain:", hash);
      return hash;
    } catch (error) {
      console.error("Error claiming drop on blockchain:", error);
      throw error;
    }
  }

  return {
    isDropClaimed,
    getNonce,
    claimDrop,
  };
}

// Singleton instance
let flashMobServiceInstance: FlashMobService | null = null;

export function initFlashMobService(flashMobAddress: `0x${string}`) {
  flashMobServiceInstance = createFlashMobService(flashMobAddress);
}

export function getFlashMobService(): FlashMobService {
  if (!flashMobServiceInstance) {
    throw new Error(
      "FlashMobService not initialized. Call initFlashMobService first.",
    );
  }
  return flashMobServiceInstance;
}
