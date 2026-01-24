/**
 * Flash.Mob Backend Signing Service
 *
 * Provides EIP-712 signatures for:
 * - Game reward claims
 * - Location-based drop claims
 *
 * This prevents users from claiming rewards without actually completing games
 * or being at the correct GPS location.
 */

import cors from "cors";
import { config } from "dotenv";
import { ethers } from "ethers";
import express, { Request, Response } from "express";
import { resolve } from "path";

// Load environment variables from parent directory
config({ path: resolve(__dirname, "../.env") });

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Backend signer private key (⚠️ Store securely in production!)
const SIGNER_PRIVATE_KEY =
  process.env.BACKEND_PRIVATE_KEY ||
  "0x0000000000000000000000000000000000000000000000000000000000001234";

const signer = new ethers.Wallet(SIGNER_PRIVATE_KEY);

// Contract addresses (from .env)
const GAME_REWARDS_ADDRESS = process.env.EXPO_PUBLIC_GAME_REWARDS_ADDRESS || "";
const FLASH_MOB_ADDRESS = process.env.EXPO_PUBLIC_FLASH_MOB_ADDRESS || "";
const CHAIN_ID = parseInt(process.env.EXPO_PUBLIC_CHAIN_ID || "31337");

console.log("🚀 Backend Signing Service Starting...");
console.log(`📝 Signer Address: ${signer.address}`);
console.log(`🔗 Chain ID: ${CHAIN_ID}`);
console.log(`🎮 GameRewards: ${GAME_REWARDS_ADDRESS}`);
console.log(`📍 FlashMob: ${FLASH_MOB_ADDRESS}`);

/**
 * EIP-712 Domain for GameRewards
 */
const getGameRewardsDomain = () => ({
  name: "GameRewards",
  version: "1",
  chainId: CHAIN_ID,
  verifyingContract: GAME_REWARDS_ADDRESS as `0x${string}`,
});

/**
 * EIP-712 Domain for FlashMobV2
 */
const getFlashMobDomain = () => ({
  name: "FlashMobV2",
  version: "1",
  chainId: CHAIN_ID,
  verifyingContract: FLASH_MOB_ADDRESS as `0x${string}`,
});

/**
 * Calculate MON reward based on score and difficulty
 */
function calculateReward(
  score: number,
  difficulty: "easy" | "medium" | "hard",
): number {
  const baseRewards = {
    easy: 50,
    medium: 125,
    hard: 250,
  };

  const baseReward = baseRewards[difficulty];

  // Perfect score (100%) gets full reward
  // 70% score gets 70% of reward
  const percentage = Math.min(score / 100, 1);
  return Math.floor(baseReward * percentage);
}

/**
 * Verify GPS location is close enough to drop
 */
function verifyLocation(
  userLat: number,
  userLon: number,
  dropLat: number,
  dropLon: number,
  maxDistance: number = 50, // meters
): boolean {
  const R = 6371000; // Earth radius in meters
  const dLat = ((dropLat - userLat) * Math.PI) / 180;
  const dLon = ((dropLon - userLon) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((userLat * Math.PI) / 180) *
      Math.cos((dropLat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance <= maxDistance;
}

/**
 * POST /api/sign-reward
 *
 * Sign a game reward claim
 * Body: {
 *   sessionId: string,
 *   player: string (address),
 *   score: number,
 *   difficulty: 'easy' | 'medium' | 'hard',
 *   gameType: string
 * }
 */
app.post("/api/sign-reward", async (req: Request, res: Response) => {
  try {
    console.log(
      "📥 Received /api/sign-reward request:",
      JSON.stringify(req.body, null, 2),
    );
    const { sessionId, player, score, difficulty, gameType } = req.body;
    console.log("📝 Extracted values:", {
      sessionId,
      player,
      score,
      difficulty,
      gameType,
    });

    // Validation
    if (!sessionId || !player || score === undefined || !difficulty) {
      console.log("❌ Missing fields:", {
        sessionId: !!sessionId,
        player: !!player,
        score: score !== undefined,
        difficulty: !!difficulty,
      });
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify score is reasonable (0-100)
    if (score < 0 || score > 100) {
      return res.status(400).json({ error: "Invalid score" });
    }

    // Validate address format (basic check)
    if (!player.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({ error: "Invalid address format" });
    }

    // Calculate reward
    const monReward = calculateReward(score, difficulty);

    // Convert sessionId to bytes32 (same as in test)
    const sessionIdBytes32 = ethers.id(sessionId);

    // EIP-712 types for GameRewards
    const types = {
      ClaimReward: [
        { name: "sessionId", type: "bytes32" },
        { name: "player", type: "address" },
        { name: "monReward", type: "uint256" },
        { name: "score", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    };

    // Deadline: 1 hour from now
    const deadline = Math.floor(Date.now() / 1000) + 3600;

    // Normalize address to checksummed format
    console.log("🔍 Before checksum - player:", player);
    console.log("🔍 Lowercased:", player.toLowerCase());
    const checksummedPlayer = ethers.getAddress(player.toLowerCase());
    console.log("🔍 Checksummed player:", checksummedPlayer);

    // Value to sign
    const value = {
      sessionId: sessionIdBytes32,
      player: checksummedPlayer,
      monReward: ethers.parseEther(monReward.toString()),
      score: BigInt(score),
      deadline: BigInt(deadline),
    };
    console.log(
      "🔍 Value to sign:",
      JSON.stringify(
        {
          ...value,
          monReward: value.monReward.toString(),
          score: value.score.toString(),
          deadline: value.deadline.toString(),
        },
        null,
        2,
      ),
    );

    // Sign with EIP-712
    const domain = getGameRewardsDomain();
    const signature = await signer.signTypedData(domain, types, value);

    console.log(
      `✅ Signed reward for ${player}: ${monReward} MON (score: ${score}, difficulty: ${difficulty})`,
    );

    res.json({
      success: true,
      signature,
      monReward,
      deadline,
      sessionIdBytes32,
    });
  } catch (error) {
    console.error("❌ Error signing reward:", error);
    res.status(500).json({
      error: "Failed to sign reward",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/sign-drop
 *
 * Sign a location-based drop claim
 * Body: {
 *   dropId: string,
 *   claimer: string (address),
 *   amount: number,
 *   userLat: number,
 *   userLon: number,
 *   dropLat: number,
 *   dropLon: number
 * }
 */
app.post("/api/sign-drop", async (req: Request, res: Response) => {
  try {
    const { dropId, claimer, amount, userLat, userLon, dropLat, dropLon } =
      req.body;

    // Validation
    if (
      !dropId ||
      !claimer ||
      !amount ||
      userLat === undefined ||
      userLon === undefined ||
      dropLat === undefined ||
      dropLon === undefined
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify user is close enough to drop (50 meters)
    const isCloseEnough = verifyLocation(
      userLat,
      userLon,
      dropLat,
      dropLon,
      50,
    );

    if (!isCloseEnough) {
      return res.status(403).json({
        error: "Not in range",
        message: "You must be within 50 meters of the drop location",
      });
    }

    // Convert dropId to bytes32
    const dropIdBytes32 = ethers.id(dropId);

    // EIP-712 types for FlashMobV2
    const types = {
      Claim: [
        { name: "dropId", type: "bytes32" },
        { name: "claimer", type: "address" },
        { name: "amount", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    };

    // For simplicity, use timestamp as nonce (in production, track nonces per user)
    const nonce = Math.floor(Date.now() / 1000);
    const deadline = nonce + 3600; // 1 hour validity

    const value = {
      dropId: dropIdBytes32,
      claimer: claimer,
      amount: ethers.parseEther(amount.toString()),
      nonce: BigInt(nonce),
      deadline: BigInt(deadline),
    };

    // Sign with EIP-712
    const domain = getFlashMobDomain();
    const signature = await signer.signTypedData(domain, types, value);

    console.log(
      `✅ Signed drop claim for ${claimer}: ${amount} MON at (${userLat}, ${userLon})`,
    );

    res.json({
      success: true,
      signature,
      nonce,
      deadline,
      dropIdBytes32,
    });
  } catch (error) {
    console.error("❌ Error signing drop:", error);
    res.status(500).json({
      error: "Failed to sign drop claim",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    signer: signer.address,
    chainId: CHAIN_ID,
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(
    `\n✅ Backend Signing Service running on http://localhost:${PORT}`,
  );
  console.log(`\n📋 Available endpoints:`);
  console.log(`   POST /api/sign-reward - Sign game reward claims`);
  console.log(`   POST /api/sign-drop - Sign location drop claims`);
  console.log(`   GET /health - Health check\n`);
});

export default app;
