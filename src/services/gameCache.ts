/**
 * Game Cache Service
 * Provides instant game loading by caching location and nearby games in AsyncStorage.
 * Cache expires after 5 minutes to ensure data freshness.
 */
import type { GameDrop } from "@/types/game";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_KEY = "flash_mob_game_cache";
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

interface CachedGameData {
  games: GameDrop[];
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: number;
}

/**
 * Get cached games and location from AsyncStorage
 */
export async function getCachedGames(): Promise<CachedGameData | null> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const data: CachedGameData = JSON.parse(cached);

    // Check if cache has expired
    const now = Date.now();
    if (now - data.timestamp > CACHE_EXPIRY_MS) {
      console.log("📦 Cache expired, clearing...");
      await AsyncStorage.removeItem(CACHE_KEY);
      return null;
    }

    console.log(`📦 Loaded ${data.games.length} games from cache`);
    return data;
  } catch (error) {
    console.error("Error reading game cache:", error);
    return null;
  }
}

/**
 * Save games and location to cache
 */
export async function setCachedGames(
  games: GameDrop[],
  latitude: number,
  longitude: number,
): Promise<void> {
  try {
    const data: CachedGameData = {
      games,
      location: { latitude, longitude },
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
    console.log(
      `📦 Cached ${games.length} games at (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
    );
  } catch (error) {
    console.error("Error saving game cache:", error);
  }
}

/**
 * Clear the game cache
 */
export async function clearGameCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
    console.log("📦 Game cache cleared");
  } catch (error) {
    console.error("Error clearing game cache:", error);
  }
}

/**
 * Check if user has moved significantly from cached location (>100m)
 */
export function hasMovedSignificantly(
  oldLat: number,
  oldLng: number,
  newLat: number,
  newLng: number,
  threshold = 100, // meters
): boolean {
  const distance = calculateDistance(oldLat, oldLng, newLat, newLng);
  return distance > threshold;
}

/**
 * Calculate distance between two coordinates in meters
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Filter games to only those within map viewport bounds
 */
export function filterGamesByViewport(
  games: GameDrop[],
  bounds: {
    northEast: { latitude: number; longitude: number };
    southWest: { latitude: number; longitude: number };
  },
): GameDrop[] {
  return games.filter((game) => {
    return (
      game.latitude >= bounds.southWest.latitude &&
      game.latitude <= bounds.northEast.latitude &&
      game.longitude >= bounds.southWest.longitude &&
      game.longitude <= bounds.northEast.longitude
    );
  });
}
