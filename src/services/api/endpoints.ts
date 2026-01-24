import type { Drop } from '@/src/types/drop';
import { api } from './client';

// API Response types
interface DropsResponse {
  drops: Drop[];
  total: number;
  page: number;
  pageSize: number;
}

interface ClaimRequest {
  dropId: string;
  userAddress: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  signature: string;
  timestamp: number;
}

interface ClaimResponse {
  success: boolean;
  txHash?: string;
  error?: string;
  claimedAt?: string;
}

interface LeaderboardEntry {
  rank: number;
  address: string;
  username?: string;
  claimsCount: number;
  totalEarned: number;
}

interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  userRank?: number;
  totalUsers: number;
}

// API Endpoints
export const endpoints = {
  /**
   * Fetch drops within a geographic area
   */
  getDrops: (
    latitude: number,
    longitude: number,
    radiusKm: number = 2,
    page: number = 1,
    pageSize: number = 100
  ) =>
    api.get<DropsResponse>('/drops', {
      lat: latitude,
      lng: longitude,
      radius: radiusKm,
      page,
      pageSize,
    }),

  /**
   * Get a single drop by ID
   */
  getDrop: (dropId: string) =>
    api.get<Drop>(`/drops/${dropId}`),

  /**
   * Submit a claim for a drop
   */
  claimDrop: (claim: ClaimRequest) =>
    api.post<ClaimResponse>('/claims', claim),

  /**
   * Get leaderboard
   */
  getLeaderboard: (limit: number = 50, userAddress?: string) =>
    api.get<LeaderboardResponse>('/leaderboard', {
      limit,
      ...(userAddress && { user: userAddress }),
    }),

  /**
   * Get user's claim history
   */
  getUserClaims: (userAddress: string, page: number = 1, pageSize: number = 20) =>
    api.get<{ claims: ClaimResponse[]; total: number }>(`/users/${userAddress}/claims`, {
      page,
      pageSize,
    }),
};

// Export types for consumers
export type { ClaimRequest, ClaimResponse, DropsResponse, LeaderboardEntry, LeaderboardResponse };

