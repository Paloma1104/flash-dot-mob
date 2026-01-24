import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Push Notification Service
 * 
 * Handles:
 * - Permission requests
 * - Push token registration
 * - Local notifications (nearby drops)
 * - Remote notifications (server-pushed)
 */

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface PushToken {
  token: string;
  platform: 'ios' | 'android' | 'web';
}

/**
 * Request notification permissions and get push token
 */
export async function registerForPushNotifications(): Promise<PushToken | null> {
  // Check if on physical device
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request if not granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push notification permissions');
    return null;
  }

  try {
    // Get Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });

    console.log('[Notification] Push token registered');

    return {
      token: tokenData.data,
      platform: Platform.OS as 'ios' | 'android',
    };
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

/**
 * Send local notification for nearby drop
 */
export async function notifyNearbyDrop(
  dropId: string,
  amount: number,
  distance: number
): Promise<string | null> {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💰 Drop Nearby!',
        body: `${amount} $MON is just ${Math.round(distance)}m away!`,
        data: { dropId, type: 'nearby_drop' },
        sound: 'default',
        badge: 1,
      },
      trigger: null, // Send immediately
    });

    console.log('[Notification] Nearby drop notification sent', { dropId });

    return notificationId;
  } catch (error) {
    console.error('Error sending notification:', error);
    return null;
  }
}

/**
 * Send local notification for successful claim
 */
export async function notifyClaimSuccess(
  amount: number,
  txHash: string
): Promise<string | null> {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 Claim Successful!',
        body: `You claimed ${amount} $MON!`,
        data: { txHash, type: 'claim_success' },
        sound: 'default',
      },
      trigger: null,
    });

    return notificationId;
  } catch (error) {
    console.error('Error sending notification:', error);
    return null;
  }
}

/**
 * Send local notification for entering drop zone
 */
export async function notifyEnterZone(
  dropId: string,
  amount: number
): Promise<string | null> {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📍 You\'re In Range!',
        body: `Tap to claim ${amount} $MON now!`,
        data: { dropId, type: 'in_range' },
        sound: 'default',
        badge: 1,
      },
      trigger: null,
    });

    return notificationId;
  } catch (error) {
    console.error('Error sending notification:', error);
    return null;
  }
}

/**
 * Schedule a reminder notification
 */
export async function scheduleReminder(
  title: string,
  body: string,
  delaySeconds: number
): Promise<string | null> {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: 'reminder' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: delaySeconds,
      },
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
}

/**
 * Cancel a scheduled notification
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Cancel all notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get badge count
 */
export async function getBadgeCount(): Promise<number> {
  return Notifications.getBadgeCountAsync();
}

/**
 * Set badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Clear all badges
 */
export async function clearBadges(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}

/**
 * Add notification response listener
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Add notification received listener
 */
export function addNotificationListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener(callback);
}
