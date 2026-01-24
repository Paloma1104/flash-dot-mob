import type { Drop } from "@/types/drop";
import type {
  ClaimRequest,
  ClaimResponse,
  DropsResponse,
  LeaderboardEntry,
  LeaderboardResponse,
} from "./endpoints";

// Flag to use mock data instead of real API
// ⚠️ Set to FALSE in production - use real backend API
const USE_MOCK_DATA = false;

// Simulate network latency
const simulateLatency = (ms: number = 500) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// In-memory mock state
let mockDrops: Drop[] = [];
let claimedDropIds = new Set<string>();
let mockLeaderboard: LeaderboardEntry[] = [];

/**
 * Generate mock drops around a location
 */
function generateDrops(
  centerLat: number,
  centerLng: number,
  count: number = 50,
  radiusKm: number = 2,
): Drop[] {
  const drops: Drop[] = [];

  for (let i = 0; i < count; i++) {
    const id = `drop-${Date.now()}-${i}`;

    // Random offset within radius
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * radiusKm;

    // Convert km to degrees (approximate)
    const latOffset = (distance * Math.cos(angle)) / 111;
    const lngOffset =
      (distance * Math.sin(angle)) /
      (111 * Math.cos((centerLat * Math.PI) / 180));

    drops.push({
      id,
      latitude: centerLat + latOffset,
      longitude: centerLng + lngOffset,
      amount: Math.floor(Math.random() * 100) + 10,
      tokenSymbol: "$MON",
      expiresAt: null,
      createdAt: new Date().toISOString(),
      claimedBy: null,
      isActive: true,
    });
  }

  return drops;
}

/**
 * Initialize mock leaderboard
 */
function initLeaderboard() {
  if (mockLeaderboard.length > 0) return;

  const addresses = [
    "0x1234...abcd",
    "0x5678...efgh",
    "0x9abc...ijkl",
    "0xdef0...mnop",
    "0x1111...qrst",
    "0x2222...uvwx",
    "0x3333...yz12",
    "0x4444...3456",
    "0x5555...7890",
    "0x6666...abcd",
  ];

  mockLeaderboard = addresses
    .map((address, i) => ({
      rank: i + 1,
      address,
      claimsCount: Math.floor(Math.random() * 50) + 10,
      totalEarned: Math.floor(Math.random() * 5000) + 500,
    }))
    .sort((a, b) => b.totalEarned - a.totalEarned);

  // Update ranks after sorting
  mockLeaderboard.forEach((entry, i) => {
    entry.rank = i + 1;
  });
}

// Mock API implementations
export const mockApi = {
  /**
   * Get drops near a location
   */
  async getDrops(
    latitude: number,
    longitude: number,
    radiusKm: number = 2,
  ): Promise<DropsResponse> {
    await simulateLatency(300);

    // Generate new drops if empty or user moved significantly
    if (mockDrops.length === 0) {
      mockDrops = generateDrops(latitude, longitude, 50, radiusKm);
    }

    // Filter out claimed drops
    const activeDrops = mockDrops.filter(
      (drop) => !claimedDropIds.has(drop.id) && drop.isActive,
    );

    return {
      drops: activeDrops,
      total: activeDrops.length,
      page: 1,
      pageSize: 100,
    };
  },

  /**
   * Claim a drop
   */
  async claimDrop(claim: ClaimRequest): Promise<ClaimResponse> {
    await simulateLatency(1000);

    const drop = mockDrops.find((d) => d.id === claim.dropId);

    if (!drop) {
      return { success: false, error: "Drop not found" };
    }

    if (claimedDropIds.has(claim.dropId)) {
      return { success: false, error: "Drop already claimed" };
    }

    // Simulate 90% success rate
    if (Math.random() < 0.1) {
      return { success: false, error: "Transaction failed. Please try again." };
    }

    // Mark as claimed
    claimedDropIds.add(claim.dropId);

    // Update drop
    const dropIndex = mockDrops.findIndex((d) => d.id === claim.dropId);
    if (dropIndex >= 0) {
      mockDrops[dropIndex] = {
        ...mockDrops[dropIndex]!,
        isActive: false,
        claimedBy: claim.userAddress,
      };
    }

    return {
      success: true,
      txHash: `0x${Math.random().toString(16).slice(2)}`,
      claimedAt: new Date().toISOString(),
    };
  },

  /**
   * Get leaderboard
   */
  async getLeaderboard(
    limit: number = 50,
    userAddress?: string,
  ): Promise<LeaderboardResponse> {
    await simulateLatency(200);

    initLeaderboard();

    const entries = mockLeaderboard.slice(0, limit);

    let userRank: number | undefined;
    if (userAddress) {
      // Add user to leaderboard if not present
      const existingUser = mockLeaderboard.find((e) =>
        e.address.includes(userAddress.slice(-4)),
      );
      if (!existingUser) {
        userRank = mockLeaderboard.length + 1;
      } else {
        userRank = existingUser.rank;
      }
    }

    return {
      entries,
      userRank,
      totalUsers: mockLeaderboard.length,
    };
  },

  /**
   * Reset mock data (for testing)
   */
  reset() {
    mockDrops = [];
    claimedDropIds.clear();
    mockLeaderboard = [];
  },
};

// Export helper to check if using mock
export const isMockMode = () => USE_MOCK_DATA;

