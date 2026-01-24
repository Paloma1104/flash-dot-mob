/**
 * Background Geolocation Service
 * 
 * For production, this requires 'react-native-background-geolocation' 
 * which needs a native build. This module provides the interface and
 * mock implementation for development.
 * 
 * Features (with native module):
 * - Battery-efficient background tracking
 * - Geofencing for drop zones
 * - Automatic notifications when entering zones
 * - Location history for velocity checks
 * 
 * Note: Background location requires:
 * - iOS: Background Modes capability
 * - Android: Foreground service with persistent notification
 */

import * as Location from 'expo-location';
import { notifyEnterZone } from '../notifications/pushNotifications';
import { addBreadcrumb } from '../sentry';

export interface GeofenceRegion {
  id: string;
  latitude: number;
  longitude: number;
  radius: number; // meters
  notifyOnEntry: boolean;
  notifyOnExit: boolean;
  data?: Record<string, unknown>;
}

export interface BackgroundLocationConfig {
  desiredAccuracy: 'high' | 'balanced' | 'low';
  distanceFilter: number; // meters - minimum distance between updates
  stopOnTerminate: boolean;
  startOnBoot: boolean;
  showNotification: boolean; // Android foreground service notification
  notificationTitle?: string;
  notificationText?: string;
}

// Default configuration
const DEFAULT_CONFIG: BackgroundLocationConfig = {
  desiredAccuracy: 'balanced',
  distanceFilter: 50, // Update every 50 meters
  stopOnTerminate: false,
  startOnBoot: true,
  showNotification: true,
  notificationTitle: 'Flash.Mob',
  notificationText: 'Monitoring for nearby drops',
};

// Geofence storage
const geofences: Map<string, GeofenceRegion> = new Map();
let isTracking = false;
let locationSubscription: Location.LocationSubscription | null = null;

/**
 * Start background location tracking
 * Note: This is a simplified version using expo-location foreground tracking
 * For true background tracking, use react-native-background-geolocation
 */
export async function startBackgroundTracking(
  config: Partial<BackgroundLocationConfig> = {}
): Promise<boolean> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  try {
    // Check permissions
    const { status: foreground } = await Location.requestForegroundPermissionsAsync();
    if (foreground !== 'granted') {
      console.warn('Foreground location permission not granted');
      return false;
    }

    // Request background permission
    const { status: background } = await Location.requestBackgroundPermissionsAsync();
    if (background !== 'granted') {
      console.warn('Background location permission not granted');
      // Continue with foreground-only tracking
    }

    // Map accuracy
    const accuracy = {
      high: Location.Accuracy.High,
      balanced: Location.Accuracy.Balanced,
      low: Location.Accuracy.Low,
    }[finalConfig.desiredAccuracy];

    // Start watching location
    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy,
        distanceInterval: finalConfig.distanceFilter,
        timeInterval: 10000, // Update at least every 10 seconds
      },
      (location) => {
        handleLocationUpdate(location.coords);
      }
    );

    isTracking = true;
    addBreadcrumb('location', 'Background tracking started', finalConfig);

    return true;
  } catch (error) {
    console.error('Error starting background tracking:', error);
    return false;
  }
}

/**
 * Stop background location tracking
 */
export async function stopBackgroundTracking(): Promise<void> {
  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
  }
  isTracking = false;
  addBreadcrumb('location', 'Background tracking stopped');
}

/**
 * Check if background tracking is active
 */
export function isBackgroundTrackingActive(): boolean {
  return isTracking;
}

/**
 * Add a geofence for a drop zone
 */
export function addGeofence(region: GeofenceRegion): void {
  geofences.set(region.id, region);
  addBreadcrumb('location', 'Geofence added', { id: region.id, radius: region.radius });
}

/**
 * Remove a geofence
 */
export function removeGeofence(id: string): void {
  geofences.delete(id);
  addBreadcrumb('location', 'Geofence removed', { id });
}

/**
 * Remove all geofences
 */
export function clearGeofences(): void {
  geofences.clear();
  addBreadcrumb('location', 'All geofences cleared');
}

/**
 * Get all active geofences
 */
export function getGeofences(): GeofenceRegion[] {
  return Array.from(geofences.values());
}

/**
 * Handle location update and check geofences
 */
function handleLocationUpdate(coords: { latitude: number; longitude: number }): void {
  // Check each geofence
  for (const geofence of geofences.values()) {
    const distance = haversineDistance(
      coords.latitude,
      coords.longitude,
      geofence.latitude,
      geofence.longitude
    );

    if (distance <= geofence.radius) {
      // User is inside geofence
      if (geofence.notifyOnEntry) {
        handleGeofenceEntry(geofence, distance);
      }
    }
  }
}

/**
 * Handle entering a geofence
 */
function handleGeofenceEntry(geofence: GeofenceRegion, distance: number): void {
  addBreadcrumb('location', 'Geofence entry', { 
    id: geofence.id, 
    distance,
  });

  // If this is a drop geofence, notify user
  if (geofence.data?.dropId && geofence.data?.amount) {
    notifyEnterZone(
      geofence.data.dropId as string,
      geofence.data.amount as number
    );
  }
}

/**
 * Haversine distance calculation
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Add drops as geofences
 */
export function addDropsAsGeofences(
  drops: Array<{ id: string; latitude: number; longitude: number; amount: number }>,
  radius: number = 50
): void {
  for (const drop of drops) {
    addGeofence({
      id: `drop-${drop.id}`,
      latitude: drop.latitude,
      longitude: drop.longitude,
      radius,
      notifyOnEntry: true,
      notifyOnExit: false,
      data: { dropId: drop.id, amount: drop.amount },
    });
  }
}
