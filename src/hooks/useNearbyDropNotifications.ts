import { notifyEnterZone, notifyNearbyDrop } from '@/services/notifications/pushNotifications';
import { useDropStore } from '@/stores/dropStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { haversineDistance } from '@/utils/geo';
import { useCallback, useEffect, useRef } from 'react';

/**
 * Hook for monitoring nearby drops and sending notifications
 * 
 * Features:
 * - Monitors drops within notification radius
 * - Sends push notification when new drop is nearby
 * - Sends alert when entering claim zone
 * - Debounces notifications to prevent spam
 */

interface NearbyDropMonitorOptions {
  notificationRadius: number; // meters - when to notify about nearby
  claimRadius: number; // meters - when to notify about being in range
  debounceMs: number; // minimum time between notifications
}

const DEFAULT_OPTIONS: NearbyDropMonitorOptions = {
  notificationRadius: 500, // 500m
  claimRadius: 50, // 50m
  debounceMs: 60000, // 1 minute
};

export function useNearbyDropNotifications(
  userLatitude: number | null,
  userLongitude: number | null,
  options: Partial<NearbyDropMonitorOptions> = {}
) {
  const { notificationRadius, claimRadius, debounceMs } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const drops = useDropStore((state) => state.drops);
  const notificationsEnabled = useSettingsStore((state) => state.notificationsEnabled);
  
  // Track which drops we've already notified about
  const notifiedDrops = useRef<Map<string, { type: 'nearby' | 'inRange'; timestamp: number }>>(
    new Map()
  );

  const checkAndNotify = useCallback(async () => {
    if (!notificationsEnabled || userLatitude === null || userLongitude === null) {
      return;
    }

    const now = Date.now();

    for (const drop of drops) {
      if (!drop.isActive || drop.claimedBy) continue;

      const distance = haversineDistance(
        userLatitude,
        userLongitude,
        drop.latitude,
        drop.longitude
      );

      const existingNotification = notifiedDrops.current.get(drop.id);

      // Check if in claim range
      if (distance <= claimRadius) {
        // Only notify if we haven't notified about being in range recently
        if (
          !existingNotification ||
          existingNotification.type !== 'inRange' ||
          now - existingNotification.timestamp > debounceMs
        ) {
          await notifyEnterZone(drop.id, drop.amount);
          notifiedDrops.current.set(drop.id, { type: 'inRange', timestamp: now });
        }
      }
      // Check if nearby (but not in range yet)
      else if (distance <= notificationRadius) {
        // Only notify about nearby drops if we haven't already
        if (!existingNotification || now - existingNotification.timestamp > debounceMs * 5) {
          await notifyNearbyDrop(drop.id, drop.amount, distance);
          notifiedDrops.current.set(drop.id, { type: 'nearby', timestamp: now });
        }
      }
    }

    // Clean up old notifications (older than 1 hour)
    const oneHourAgo = now - 60 * 60 * 1000;
    for (const [dropId, notification] of notifiedDrops.current.entries()) {
      if (notification.timestamp < oneHourAgo) {
        notifiedDrops.current.delete(dropId);
      }
    }
  }, [userLatitude, userLongitude, drops, notificationsEnabled, notificationRadius, claimRadius, debounceMs]);

  // Run check when location or drops change
  useEffect(() => {
    checkAndNotify();
  }, [checkAndNotify]);

  // Return function to manually trigger check
  return { checkAndNotify };
}

