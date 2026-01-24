import type { Drop, GeoJSONDropCollection } from '@/src/types/drop';

/**
 * Generate mock drops around a given location for testing.
 * In production, this would come from the API.
 */
export function generateMockDrops(
  centerLat: number,
  centerLng: number,
  count: number = 20,
  radiusKm: number = 1
): GeoJSONDropCollection {
  const drops: GeoJSONDropCollection = {
    type: 'FeatureCollection',
    features: [],
  };

  for (let i = 0; i < count; i++) {
    // Random offset within radius
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * radiusKm;
    
    // Convert km to degrees (approximate)
    const latOffset = (distance * Math.cos(angle)) / 111;
    const lngOffset = (distance * Math.sin(angle)) / (111 * Math.cos(centerLat * Math.PI / 180));

    const drop: Drop = {
      id: `drop-${i}`,
      latitude: centerLat + latOffset,
      longitude: centerLng + lngOffset,
      amount: Math.floor(Math.random() * 100) + 10, // 10-110 tokens
      tokenSymbol: '$MON',
      expiresAt: null,
      createdAt: new Date().toISOString(),
      claimedBy: null,
      isActive: true,
    };

    drops.features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [drop.longitude, drop.latitude],
      },
      properties: drop,
    });
  }

  return drops;
}

/**
 * Check if user is within claiming distance of a drop
 */
export function isWithinClaimRange(
  userLat: number,
  userLng: number,
  dropLat: number,
  dropLng: number,
  rangeMeters: number = 50
): boolean {
  const distance = calculateDistanceMeters(userLat, userLng, dropLat, dropLng);
  return distance <= rangeMeters;
}

/**
 * Calculate distance between two points in meters (Haversine formula)
 */
export function calculateDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Alias for calculateDistanceMeters (used by AR and notification services)
 */
export const haversineDistance = calculateDistanceMeters;

/**
 * Calculate bearing from point A to point B in degrees
 */
export function calculateBearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  
  const bearing = Math.atan2(y, x);
  return ((bearing * 180) / Math.PI + 360) % 360;
}
