import { HIGH_ACCURACY_DURATION_MS, LOCATION_POLL_INTERVAL_MS } from '@/src/utils/constants';
import * as Location from 'expo-location';

export type LocationMode = 'battery' | 'high-accuracy';

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
}

type LocationCallback = (location: UserLocation) => void;

class LocationEngine {
  private watchId: Location.LocationSubscription | null = null;
  private mode: LocationMode = 'battery';
  private callbacks: Set<LocationCallback> = new Set();
  private lastLocation: UserLocation | null = null;
  private highAccuracyTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Request location permissions
   */
  async requestPermissions(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Check if location permissions are granted
   */
  async checkPermissions(): Promise<boolean> {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Get current location once
   */
  async getCurrentLocation(): Promise<UserLocation | null> {
    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) return null;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const userLocation: UserLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      };

      this.lastLocation = userLocation;
      return userLocation;
    } catch (error) {
      console.error('Failed to get current location:', error);
      return null;
    }
  }

  /**
   * Start watching location with polling
   */
  async startWatching(): Promise<boolean> {
    const hasPermission = await this.checkPermissions();
    if (!hasPermission) return false;

    // Stop any existing watch
    await this.stopWatching();

    const options = this.getLocationOptions();

    this.watchId = await Location.watchPositionAsync(options, (location) => {
      const userLocation: UserLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      };

      this.lastLocation = userLocation;
      this.notifyCallbacks(userLocation);
    });

    return true;
  }

  /**
   * Stop watching location
   */
  async stopWatching(): Promise<void> {
    if (this.watchId) {
      this.watchId.remove();
      this.watchId = null;
    }

    if (this.highAccuracyTimeout) {
      clearTimeout(this.highAccuracyTimeout);
      this.highAccuracyTimeout = null;
    }
  }

  /**
   * Switch to high accuracy mode temporarily (for claim verification)
   */
  async enableHighAccuracyMode(): Promise<void> {
    if (this.mode === 'high-accuracy') return;

    this.mode = 'high-accuracy';
    await this.startWatching(); // Restart with new options

    // Auto-switch back to battery mode after timeout
    this.highAccuracyTimeout = setTimeout(() => {
      this.disableHighAccuracyMode();
    }, HIGH_ACCURACY_DURATION_MS);
  }

  /**
   * Switch back to battery-saving mode
   */
  async disableHighAccuracyMode(): Promise<void> {
    if (this.mode === 'battery') return;

    this.mode = 'battery';
    await this.startWatching(); // Restart with battery-saving options

    if (this.highAccuracyTimeout) {
      clearTimeout(this.highAccuracyTimeout);
      this.highAccuracyTimeout = null;
    }
  }

  /**
   * Get location options based on current mode
   */
  private getLocationOptions(): Location.LocationOptions {
    if (this.mode === 'high-accuracy') {
      return {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000, // 1 second
        distanceInterval: 1, // 1 meter
      };
    }

    // Battery-saving mode
    return {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: LOCATION_POLL_INTERVAL_MS,
      distanceInterval: 10, // 10 meters
    };
  }

  /**
   * Subscribe to location updates
   */
  subscribe(callback: LocationCallback): () => void {
    this.callbacks.add(callback);

    // Immediately send last known location if available
    if (this.lastLocation) {
      callback(this.lastLocation);
    }

    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Get last known location
   */
  getLastLocation(): UserLocation | null {
    return this.lastLocation;
  }

  /**
   * Get current mode
   */
  getMode(): LocationMode {
    return this.mode;
  }

  /**
   * Notify all callbacks
   */
  private notifyCallbacks(location: UserLocation): void {
    this.callbacks.forEach((callback) => callback(location));
  }
}

// Export singleton instance
export const locationEngine = new LocationEngine();
