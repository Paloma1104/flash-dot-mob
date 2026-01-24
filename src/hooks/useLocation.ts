import { locationEngine, LocationMode, UserLocation } from '@/src/services/location/locationEngine';
import { useUserStore } from '@/src/stores/userStore';
import { useCallback, useEffect, useState } from 'react';

interface UseLocationReturn {
  location: UserLocation | null;
  isLoading: boolean;
  error: string | null;
  mode: LocationMode;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
  enableHighAccuracy: () => Promise<void>;
  disableHighAccuracy: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<LocationMode>('battery');
  
  const hasPermission = useUserStore((state) => state.hasLocationPermission);
  const setLocationPermission = useUserStore((state) => state.setLocationPermission);

  // Initialize location on mount
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const init = async () => {
      try {
        const hasPerms = await locationEngine.checkPermissions();
        setLocationPermission(hasPerms);

        if (hasPerms) {
          // Get initial location
          const initialLocation = await locationEngine.getCurrentLocation();
          if (initialLocation) {
            setLocation(initialLocation);
          }

          // Start watching
          await locationEngine.startWatching();

          // Subscribe to updates
          unsubscribe = locationEngine.subscribe((loc) => {
            setLocation(loc);
            setMode(locationEngine.getMode());
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get location');
      } finally {
        setIsLoading(false);
      }
    };

    init();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      locationEngine.stopWatching();
    };
  }, [setLocationPermission]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const granted = await locationEngine.requestPermissions();
      setLocationPermission(granted);

      if (granted) {
        await locationEngine.startWatching();
        const loc = await locationEngine.getCurrentLocation();
        if (loc) setLocation(loc);
      } else {
        setError('Location permission denied');
      }

      return granted;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request permission');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [setLocationPermission]);

  const enableHighAccuracy = useCallback(async () => {
    await locationEngine.enableHighAccuracyMode();
    setMode('high-accuracy');
  }, []);

  const disableHighAccuracy = useCallback(async () => {
    await locationEngine.disableHighAccuracyMode();
    setMode('battery');
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const loc = await locationEngine.getCurrentLocation();
      if (loc) setLocation(loc);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh location');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    location,
    isLoading,
    error,
    mode,
    hasPermission,
    requestPermission,
    enableHighAccuracy,
    disableHighAccuracy,
    refresh,
  };
}
