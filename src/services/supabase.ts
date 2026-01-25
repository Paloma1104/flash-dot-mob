/**
 * @file supabase.ts
 * @description Supabase client configuration for leaderboard and player data
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // We don't need auth sessions for leaderboard
  },
});

// Types
export interface Player {
  id: string;
  wallet_address: string;
  display_name: string | null;
  total_points: number;
  total_games_played: number;
  total_wins: number;
  credits: number;
  has_claimed_free_credits: boolean;
  latitude: number | null;
  longitude: number | null;
  last_active: string;
  created_at: string;
  updated_at: string;
}

export interface GameSession {
  id: string;
  player_id: string | null;
  wallet_address: string;
  game_type: string;
  difficulty: string;
  score: number;
  points_earned: number;
  credits_spent: number;
  time_spent: number | null;
  latitude: number | null;
  longitude: number | null;
  tx_hash: string | null;
  created_at: string;
}

export interface LeaderboardEntry {
  wallet_address: string;
  display_name: string | null;
  total_points: number;
  total_games_played: number;
  total_wins: number;
  distance_meters?: number;
  rank: number;
}

/**
 * Get global leaderboard (top 100 players)
 */
export async function getGlobalLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('leaderboard_global')
    .select('*')
    .limit(100);

  if (error) {
    console.error('Error fetching global leaderboard:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get nearby leaderboard (players within radius)
 */
export async function getNearbyLeaderboard(
  latitude: number,
  longitude: number,
  radiusMeters: number = 5000
): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('get_nearby_leaderboard', {
    user_lat: latitude,
    user_lon: longitude,
    radius_meters: radiusMeters,
  });

  if (error) {
    console.error('Error fetching nearby leaderboard:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get player by wallet address
 */
export async function getPlayer(walletAddress: string): Promise<Player | null> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('wallet_address', walletAddress.toLowerCase())
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Player not found
      return null;
    }
    console.error('Error fetching player:', error);
    throw error;
  }

  return data;
}

/**
 * Get player's recent game sessions
 */
export async function getPlayerGameSessions(
  walletAddress: string,
  limit: number = 10
): Promise<GameSession[]> {
  const { data, error } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('wallet_address', walletAddress.toLowerCase())
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching game sessions:', error);
    throw error;
  }

  return data || [];
}

/**
 * Record a game session (called from backend)
 */
export async function recordGameSession(session: {
  wallet_address: string;
  game_type: string;
  difficulty: string;
  score: number;
  points_earned: number;
  credits_spent?: number;
  time_spent?: number;
  latitude?: number;
  longitude?: number;
  tx_hash?: string;
}): Promise<GameSession> {
  const { data, error } = await supabase
    .from('game_sessions')
    .insert({
      wallet_address: session.wallet_address.toLowerCase(),
      game_type: session.game_type,
      difficulty: session.difficulty,
      score: session.score,
      points_earned: session.points_earned,
      credits_spent: session.credits_spent || 5,
      time_spent: session.time_spent,
      latitude: session.latitude,
      longitude: session.longitude,
      tx_hash: session.tx_hash,
    })
    .select()
    .single();

  if (error) {
    console.error('Error recording game session:', error);
    throw error;
  }

  return data;
}

/**
 * Update player location
 */
export async function updatePlayerLocation(
  walletAddress: string,
  latitude: number,
  longitude: number
): Promise<void> {
  const { error } = await supabase
    .from('players')
    .upsert({
      wallet_address: walletAddress.toLowerCase(),
      latitude,
      longitude,
      last_active: new Date().toISOString(),
    }, {
      onConflict: 'wallet_address',
    });

  if (error) {
    console.error('Error updating player location:', error);
    throw error;
  }
}

/**
 * Update player display name
 */
export async function updatePlayerDisplayName(
  walletAddress: string,
  displayName: string
): Promise<void> {
  const { error } = await supabase
    .from('players')
    .update({ display_name: displayName })
    .eq('wallet_address', walletAddress.toLowerCase());

  if (error) {
    console.error('Error updating display name:', error);
    throw error;
  }
}
