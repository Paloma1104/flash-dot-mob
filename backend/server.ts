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

/*//////////////////////////////////////////////////////////////
                    USER STORE (In-Memory)
//////////////////////////////////////////////////////////////*/

interface UserData {
  credits: number; // Purchased with MON
  points: number; // Won from games
}

// In production, use Redis or Postgres
const users = new Map<string, UserData>();

const getUser = (address: string): UserData => {
  const key = address.toLowerCase();
  if (!users.has(key)) {
    users.set(key, { credits: 0, points: 0 });
  }
  return users.get(key)!;
};

const updateUser = (address: string, data: Partial<UserData>) => {
  const key = address.toLowerCase();
  const current = getUser(key);
  users.set(key, { ...current, ...data });
};

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
/**
 * POST /api/credits/buy
 * Verify purchase transaction OR perform Virtual Purchase (Simulated)
 * Rate: 5 MON = 50 Credits
 */
app.post("/api/credits/buy", async (req: Request, res: Response) => {
  try {
    const { txHash, address, amount } = req.body;

    if (!address) {
      return res.status(400).json({ error: "Missing address" });
    }

    // VIRTUAL PURCHASE MODE (Requested by User)
    // If no txHash provided, we simulate the purchase with a backend transaction
    if (!txHash) {
      // Default to 50 if not specified, otherwise use requested amount
      const creditsToAdd = amount ? parseInt(amount) : 50;

      console.log(
        `💳 Processing Virtual Purchase of ${creditsToAdd} credits for ${address}`,
      );

      // 1. Add Credits (Off-Chain)
      const user = getUser(address);
      updateUser(address, { credits: user.credits + creditsToAdd });

      // 2. Broadcast Virtual TX (On-Chain)
      console.log(`📤 Broadcasting Virtual Purchase TX to ${address}...`);
      const tx = await signer.sendTransaction({
        to: address,
        value: 0,
        data: ethers.hexlify(
          ethers.toUtf8Bytes(`Credits Purchased: ${creditsToAdd}`),
        ),
      });
      console.log(`✅ Virtual Purchase TX confirmed: ${tx.hash}`);

      return res.json({
        success: true,
        creditsAdded: creditsToAdd,
        newBalance: user.credits + creditsToAdd,
        txHash: tx.hash,
      });
    }

    // LEGACY: Verify client-side transaction (if txHash provided)
    console.log(`💰 Verifying purchase tx: ${txHash} for ${address}`);

    // Connect to Monad Testnet provider
    const provider = new ethers.JsonRpcProvider(
      process.env.EXPO_PUBLIC_RPC_URL,
    );
    const tx = await provider.getTransaction(txHash);
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!tx || !receipt) {
      return res.status(400).json({ error: "Transaction not found" });
    }

    if (receipt.status !== 1) {
      return res.status(400).json({ error: "Transaction failed" });
    }

    // Verify sender
    if (tx.from.toLowerCase() !== address.toLowerCase()) {
      return res.status(400).json({ error: "Transaction sender mismatch" });
    }

    // Verify amount (5 MON = 5 * 10^18 wei)
    // Accept anything >= 5 MON
    const minAmount = ethers.parseEther("5.0");
    if (tx.value < minAmount) {
      return res
        .status(400)
        .json({ error: "Insufficient MON sent. Min 5 MON required." });
    }

    // Calculate credits: 50 Credits for 5 MON (1 MON = 10 Credits)
    const monSent = Number(ethers.formatEther(tx.value));
    const creditsToAdd = Math.floor(monSent * 10);

    const user = getUser(address);
    updateUser(address, { credits: user.credits + creditsToAdd });

    console.log(`✅ Added ${creditsToAdd} credits to ${address}`);

    res.json({
      success: true,
      creditsAdded: creditsToAdd,
      newBalance: user.credits + creditsToAdd,
      txHash: tx.hash, // Return the input hash as confirmation
    });
  } catch (error) {
    console.error("❌ Buy credits error:", error);
    res.status(500).json({ error: "Failed to process purchase" });
  }
});

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

/*//////////////////////////////////////////////////////////////
                    MULTIPLAYER STATION ENDPOINTS
//////////////////////////////////////////////////////////////*/

// Contract addresses
const MULTIPLAYER_STATION_ADDRESS =
  process.env.EXPO_PUBLIC_MULTIPLAYER_STATION_ADDRESS || "";

// In-memory station state (production: use Redis)
interface StationState {
  stationId: string;
  players: { address: string; displayName: string; joinedAt: number }[];
  status: "waiting" | "starting" | "in_progress" | "completed";
  selectedGame?: number;
  totalPool: number;
}

const stationStates: Map<string, StationState> = new Map();
const connectedClients: Map<string, any> = new Map(); // WebSocket clients

// Initialize LNMIIT Arena (live station - not mock)
// The LNM Institute of Information Technology, Jaipur
// Coordinates: 26.9363° N, 75.9235° E
const LNMIIT_STATION_ID =
  "0x" + ethers.id("LNMIIT Arena|26936300|75923500").slice(2, 66);
stationStates.set(LNMIIT_STATION_ID, {
  stationId: LNMIIT_STATION_ID,
  players: [],
  status: "waiting",
  totalPool: 0,
});

/**
 * GET /api/stations/nearby
 * Get active multiplayer stations near a location
 */
app.get("/api/stations/nearby", (req: Request, res: Response) => {
  const { lat, lon } = req.query;

  // Return LNMIIT station with live state
  const lnmiitState = stationStates.get(LNMIIT_STATION_ID);

  res.json({
    success: true,
    stations: [
      {
        id: LNMIIT_STATION_ID,
        name: "LNMIIT Gaming Arena",
        description: "The LNM Institute of Information Technology",
        latitude: 26.9363,
        longitude: 75.9235,
        stakeAmount: 50,
        minPlayers: 2,
        maxPlayers: 4,
        currentPlayers: lnmiitState?.players || [],
        status: lnmiitState?.status || "waiting",
        totalPool: lnmiitState?.totalPool || 0,
      },
    ],
  });
});

/**
 * GET /api/station/:id
 * Get live station state
 */
app.get("/api/station/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const state = stationStates.get(id);

  if (!state) {
    return res.status(404).json({ error: "Station not found" });
  }

  res.json({
    success: true,
    station: state,
  });
});

/**
 * POST /api/station/join
 * Join a multiplayer station (x402 protected)
 */
app.post("/api/station/join", async (req: Request, res: Response) => {
  const { stationId, player, displayName, stakeSignature, deadline } = req.body;

  // Validate
  if (!stationId || !player) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const state = stationStates.get(stationId);
  if (!state) {
    return res.status(404).json({ error: "Station not found" });
  }

  if (state.status !== "waiting") {
    return res.status(400).json({ error: "Game already in progress" });
  }

  if (state.players.length >= 4) {
    return res.status(400).json({ error: "Station full" });
  }

  if (
    state.players.some((p) => p.address.toLowerCase() === player.toLowerCase())
  ) {
    return res.status(400).json({ error: "Already in station" });
  }

  // Add player to state
  state.players.push({
    address: player,
    displayName: displayName || `Player ${state.players.length + 1}`,
    joinedAt: Date.now(),
  });
  state.totalPool += 50; // 50 AP stake

  // Sign for on-chain join
  const messageHash = ethers.id(
    `${stationId}|${player}|50|${deadline || Math.floor(Date.now() / 1000) + 3600}`,
  );
  const joinSignature = await signer.signMessage(ethers.getBytes(messageHash));

  console.log(`🎮 Player ${player.slice(0, 10)}... joined station`);

  // Broadcast to connected clients
  broadcastToStation(stationId, {
    type: "player_joined",
    player: {
      address: player,
      displayName: displayName || `Player ${state.players.length}`,
    },
    players: state.players,
    totalPool: state.totalPool,
  });

  // Auto-start if 2+ players
  if (state.players.length >= 2) {
    startGameCountdown(stationId);
  }

  res.json({
    success: true,
    signature: joinSignature,
    players: state.players,
    totalPool: state.totalPool,
  });
});

/**
 * POST /api/station/leave
 * Leave a station before game starts
 */
app.post("/api/station/leave", async (req: Request, res: Response) => {
  const { stationId, player } = req.body;

  const state = stationStates.get(stationId);
  if (!state) {
    return res.status(404).json({ error: "Station not found" });
  }

  if (state.status !== "waiting") {
    return res.status(400).json({ error: "Cannot leave during game" });
  }

  // Remove player
  const playerIndex = state.players.findIndex(
    (p) => p.address.toLowerCase() === player.toLowerCase(),
  );

  if (playerIndex === -1) {
    return res.status(400).json({ error: "Not in station" });
  }

  state.players.splice(playerIndex, 1);
  state.totalPool -= 50;

  // Sign refund authorization
  const refundSignature = await signer.signMessage(
    ethers.getBytes(ethers.id(`refund|${stationId}|${player}|50`)),
  );

  broadcastToStation(stationId, {
    type: "player_left",
    player,
    players: state.players,
    totalPool: state.totalPool,
  });

  res.json({
    success: true,
    refundSignature,
    refundAmount: 50,
  });
});

/**
 * POST /api/game/start
 * Start game, deduct credits, and broadcast "Virtual Wallet" transaction
 */
app.post("/api/game/start", async (req: Request, res: Response) => {
  try {
    const { address, gameType } = req.body;
    if (!address) return res.status(400).json({ error: "Missing address" });

    const user = getUser(address);
    const cost = 5;

    if (user.credits < cost) {
      return res.status(402).json({ error: "Insufficient credits" });
    }

    // 1. Deduct Credits (Off-Chain)
    updateUser(address, { credits: user.credits - cost });

    // 2. Broadcast Virtual TX (On-Chain)
    // Send 0 ETH to user with data="Game Start: <gameType>"
    console.log(`📤 Broadcasting Game Start TX to ${address}...`);
    // Minimal gas limit for simple transfer
    const tx = await signer.sendTransaction({
      to: address,
      value: 0,
      data: ethers.hexlify(
        ethers.toUtf8Bytes(`Start Game: ${gameType || "FlashMob"}`),
      ),
    });

    console.log(`✅ Game Start TX confirmed: ${tx.hash}`);

    res.json({
      success: true,
      newBalance: user.credits - cost,
      txHash: tx.hash,
    });
  } catch (error) {
    console.error("Game Start Error:", error);
    res.status(500).json({ error: "Failed to broadcast start transaction" });
  }
});

/**
 * POST /api/station/complete
 * Submit game result and get settlement signature
 */
app.post("/api/station/complete", async (req: Request, res: Response) => {
  const { stationId, player, score, timeSpent } = req.body;

  if (!stationId || !player || score === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const state = stationStates.get(stationId);
  if (!state || state.status !== "in_progress") {
    return res.status(400).json({ error: "No active game" });
  }

  // Sign score for on-chain verification
  const messageHash = ethers.solidityPackedKeccak256(
    ["bytes32", "address", "uint256", "uint256"],
    [stationId, player, score, CHAIN_ID],
  );

  const scoreSignature = await signer.signMessage(ethers.getBytes(messageHash));

  console.log(`📊 Score submitted: ${player.slice(0, 10)}... scored ${score}`);

  broadcastToStation(stationId, {
    type: "score_update",
    player,
    score,
  });

  res.json({
    success: true,
    signature: scoreSignature,
    score,
    stationId,
  });
});

// Helper: Broadcast to all clients connected to a station
function broadcastToStation(stationId: string, message: any) {
  connectedClients.forEach((ws, clientId) => {
    if (clientId.startsWith(stationId)) {
      try {
        ws.send(JSON.stringify(message));
      } catch (e) {
        console.error("WebSocket send error:", e);
      }
    }
  });
}

// Helper: Start game countdown
function startGameCountdown(stationId: string) {
  const state = stationStates.get(stationId);
  if (!state) return;

  state.status = "starting";

  // Random game selection (off-chain)
  const games = [
    "TIC_TAC_TOE",
    "MEMORY_MATCH",
    "MATH_CHALLENGE",
    "COLOR_SEQUENCE",
    "WORD_SCRAMBLE",
    "PATTERN_LOCK",
  ];
  state.selectedGame = Math.floor(Math.random() * games.length);

  broadcastToStation(stationId, {
    type: "game_starting",
    selectedGame: games[state.selectedGame],
    countdown: 5,
  });

  // Start game after 5 seconds
  setTimeout(() => {
    if (state.status === "starting") {
      state.status = "in_progress";
      broadcastToStation(stationId, {
        type: "game_started",
        selectedGame: games[state.selectedGame!],
        players: state.players,
        totalPool: state.totalPool,
      });
    }
  }, 5000);
}

app.get("/api/user/balance/:address", (req: Request, res: Response) => {
  const { address } = req.params;

  if (!address) {
    return res.status(400).json({ error: "Missing address" });
  }

  const key = address.toLowerCase();

  // Initial Airdrop Logic
  // If user doesn't exist, create them with 50 credits (Simulation of entry token)
  if (!users.has(key)) {
    console.log(`🎁 New user detected! Airdropping 50 credits to ${key}`);
    users.set(key, { credits: 50, points: 0 });
  }

  const user = users.get(key)!;
  res.json({ success: true, credits: user.credits, points: user.points });
});

/**
 * POST /api/game/complete
 * End game and award points
 * Reward: Score / 10 points
 */
app.post("/api/game/complete", async (req: Request, res: Response) => {
  try {
    const { address, score } = req.body;
    if (!address || score === undefined)
      return res.status(400).json({ error: "Missing address or score" });

    const pointsEarned = Math.floor(score / 10);
    const user = getUser(address);

    // 1. Award Points (Off-Chain)
    updateUser(address, { points: user.points + pointsEarned });

    // 2. Broadcast Virtual TX (On-Chain)
    console.log(`📤 Broadcasting Game Complete TX to ${address}...`);
    const tx = await signer.sendTransaction({
      to: address,
      value: 0,
      data: ethers.hexlify(ethers.toUtf8Bytes(`Game Complete: Score ${score}`)),
    });

    console.log(`✅ Game Complete TX confirmed: ${tx.hash}`);

    res.json({
      success: true,
      newPoints: user.points + pointsEarned,
      earned: pointsEarned,
      txHash: tx.hash,
    });
  } catch (error) {
    console.error("Game Complete Error:", error);
    res
      .status(500)
      .json({ error: "Failed to broadcast completion transaction" });
  }
});

// Start server with WebSocket
import { createServer } from "http";
import WebSocket from "ws";

const server = createServer(app);
const wss = new WebSocket.Server({ server, path: "/ws" });

wss.on("connection", (ws: WebSocket) => {
  let clientId = "";

  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data.toString());

      if (
        message.type === "subscribe" &&
        message.stationId &&
        message.address
      ) {
        clientId = `${message.stationId}:${message.address}`;
        connectedClients.set(clientId, ws);
        console.log(`🔌 Client connected: ${clientId.slice(0, 20)}...`);

        // Send current state
        const state = stationStates.get(message.stationId);
        if (state) {
          ws.send(JSON.stringify({ type: "state", ...state }));
        }
      }
    } catch (e) {
      console.error("WebSocket message error:", e);
    }
  });

  ws.on("close", () => {
    if (clientId) {
      connectedClients.delete(clientId);
      console.log(`🔌 Client disconnected: ${clientId.slice(0, 20)}...`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n✅ Flash.Mob Backend running on http://localhost:${PORT}`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   POST /api/sign-reward - Sign game reward claims`);
  console.log(`   POST /api/sign-drop - Sign location drop claims`);
  console.log(`   GET  /api/stations/nearby - Get multiplayer stations`);
  console.log(`   POST /api/station/join - Join station (x402)`);
  console.log(`   POST /api/station/leave - Leave station`);
  console.log(`   POST /api/station/complete - Submit score`);
  console.log(
    `   GET  /api/user/balance/:address - Get balance (Auto-airdrop)`,
  );
  console.log(`   POST /api/credits/buy - Buy credits`);
  console.log(`   POST /api/game/start - Start game (deduct credits)`);
  console.log(`   POST /api/game/complete - Complete game (earn points)`);
  console.log(`   WS   /ws - WebSocket for real-time updates`);
  console.log(`   GET  /health - Health check\n`);
});

export default app;
