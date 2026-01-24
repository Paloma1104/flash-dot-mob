import { addBreadcrumb } from '../sentry';

/**
 * Velocity Check Service (Server-Side)
 * 
 * Detects GPS spoofing by analyzing movement patterns:
 * - Impossible travel speeds (teleportation)
 * - Sudden location jumps
 * - Unrealistic accuracy patterns
 * 
 * This service runs on the backend to prevent client-side tampering.
 */

export interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy: number | null;
}

export interface VelocityCheckResult {
  passed: boolean;
  velocity: number; // meters per second
  distance: number; // meters
  timeElapsed: number; // seconds
  reason?: string;
}

// Maximum realistic speeds (m/s)
const MAX_SPEEDS = {
  walking: 2.5, // ~9 km/h
  running: 6.5, // ~23 km/h
  cycling: 15, // ~54 km/h
  driving: 45, // ~162 km/h (highway + buffer)
  airplane: 280, // ~1000 km/h (commercial jet)
};

// Minimum time between location updates to be valid (ms)
const MIN_TIME_BETWEEN_UPDATES = 1000;

// Store user's location history (server-side, in-memory for demo)
const locationHistory: Map<string, LocationPoint[]> = new Map();

/**
 * Haversine distance in meters
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Check if user's movement is realistic
 */
export function checkVelocity(
  userId: string,
  currentLocation: LocationPoint,
  maxAllowedSpeed: keyof typeof MAX_SPEEDS = 'driving'
): VelocityCheckResult {
  // Get user's location history
  let history = locationHistory.get(userId) ?? [];
  
  // If no history, this is their first location
  if (history.length === 0) {
    history = [currentLocation];
    locationHistory.set(userId, history);
    
    return {
      passed: true,
      velocity: 0,
      distance: 0,
      timeElapsed: 0,
    };
  }

  // Get the most recent location
  const lastLocation = history[history.length - 1]!;
  
  // Calculate time elapsed
  const timeElapsed = (currentLocation.timestamp - lastLocation.timestamp) / 1000; // seconds
  
  // Check for timestamp manipulation
  if (timeElapsed < 0) {
    return {
      passed: false,
      velocity: Infinity,
      distance: 0,
      timeElapsed,
      reason: 'Invalid timestamp (time travel detected)',
    };
  }
  
  // Skip check if update came too quickly
  if (timeElapsed < MIN_TIME_BETWEEN_UPDATES / 1000) {
    return {
      passed: true,
      velocity: 0,
      distance: 0,
      timeElapsed,
      reason: 'Update too quick, skipping check',
    };
  }

  // Calculate distance
  const distance = haversineDistance(
    lastLocation.latitude,
    lastLocation.longitude,
    currentLocation.latitude,
    currentLocation.longitude
  );

  // Calculate velocity
  const velocity = distance / timeElapsed; // m/s

  // Get max allowed speed
  const maxSpeed = MAX_SPEEDS[maxAllowedSpeed];

  // Check if velocity is realistic
  if (velocity > maxSpeed) {
    addBreadcrumb('security', 'Velocity check failed', {
      userId,
      velocity,
      maxSpeed,
      distance,
      timeElapsed,
    });

    return {
      passed: false,
      velocity,
      distance,
      timeElapsed,
      reason: `Speed ${(velocity * 3.6).toFixed(1)} km/h exceeds max ${(maxSpeed * 3.6).toFixed(1)} km/h`,
    };
  }

  // Add to history (keep last 100 points)
  history.push(currentLocation);
  if (history.length > 100) {
    history = history.slice(-100);
  }
  locationHistory.set(userId, history);

  return {
    passed: true,
    velocity,
    distance,
    timeElapsed,
  };
}

/**
 * Check for sudden accuracy changes (potential spoofing indicator)
 */
export function checkAccuracyAnomaly(
  userId: string,
  currentAccuracy: number | null
): boolean {
  const history = locationHistory.get(userId) ?? [];
  
  if (currentAccuracy === null || history.length < 5) {
    return true; // Not enough data
  }

  // Get average accuracy from recent history
  const recentAccuracies = history
    .slice(-10)
    .map(p => p.accuracy)
    .filter((a): a is number => a !== null);

  if (recentAccuracies.length === 0) {
    return true;
  }

  const avgAccuracy = recentAccuracies.reduce((a, b) => a + b, 0) / recentAccuracies.length;

  // Sudden improvement in accuracy is suspicious (spoofed GPS often has perfect accuracy)
  if (currentAccuracy < 5 && avgAccuracy > 20) {
    addBreadcrumb('security', 'Accuracy anomaly detected', {
      userId,
      currentAccuracy,
      avgAccuracy,
    });
    return false;
  }

  return true;
}

/**
 * Clear user's location history (on logout)
 */
export function clearLocationHistory(userId: string): void {
  locationHistory.delete(userId);
}

/**
 * Get user's recent movement summary
 */
export function getMovementSummary(userId: string): {
  totalDistance: number;
  avgSpeed: number;
  locations: number;
} {
  const history = locationHistory.get(userId) ?? [];
  
  if (history.length < 2) {
    return { totalDistance: 0, avgSpeed: 0, locations: history.length };
  }

  let totalDistance = 0;
  let totalTime = 0;

  for (let i = 1; i < history.length; i++) {
    const prev = history[i - 1]!;
    const curr = history[i]!;

    totalDistance += haversineDistance(
      prev.latitude,
      prev.longitude,
      curr.latitude,
      curr.longitude
    );
    totalTime += (curr.timestamp - prev.timestamp) / 1000;
  }

  return {
    totalDistance,
    avgSpeed: totalTime > 0 ? totalDistance / totalTime : 0,
    locations: history.length,
  };
}
