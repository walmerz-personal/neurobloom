import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_PREFS_KEY = '@neurobloom_notification_prefs';
const DAILY_REMINDER_ID = 'daily-recovery-reminder';

// Configure how notifications should be handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  /**
   * Request notification permissions from the user
   * @returns {Promise<boolean>} - Whether permission was granted
   */
  async requestPermissions() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Check if notification permissions are granted
   * @returns {Promise<boolean>}
   */
  async hasPermissions() {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  }

  /**
   * Schedule a daily notification at a specific time
   * @param {number} hour - Hour (0-23)
   * @param {number} minute - Minute (0-59)
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   * @returns {Promise<boolean>} - Whether scheduling was successful
   */
  async scheduleDailyReminder(hour = 9, minute = 0, title = null, body = null) {
    try {
      // Cancel any existing daily reminder first
      await this.cancelDailyReminder();

      // Check permissions
      const hasPermission = await this.hasPermissions();
      if (!hasPermission) {
        console.log('No notification permissions, skipping scheduling');
        return false;
      }

      // Default motivational messages
      const defaultTitle = title || '🌱 Time to Nurture Your Recovery';
      const defaultBody = body || 'Your daily exercises are waiting! Take a small step toward healing today.';

      // Schedule the notification
      const trigger = {
        hour,
        minute,
        repeats: true,
      };

      const notificationId = await Notifications.scheduleNotificationAsync({
        identifier: DAILY_REMINDER_ID,
        content: {
          title: defaultTitle,
          body: defaultBody,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: {
            type: 'daily_reminder',
            screen: 'home',
          },
        },
        trigger,
      });

      console.log(`Daily reminder scheduled at ${hour}:${minute}, ID: ${notificationId}`);

      // Save preferences
      await this.saveNotificationPreferences({
        enabled: true,
        hour,
        minute,
        title: defaultTitle,
        body: defaultBody,
      });

      return true;
    } catch (error) {
      console.error('Error scheduling daily reminder:', error);
      return false;
    }
  }

  /**
   * Cancel the daily reminder notification
   * @returns {Promise<void>}
   */
  async cancelDailyReminder() {
    try {
      // Cancel by identifier
      await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID);

      // Also cancel all scheduled notifications as a fallback
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const notification of scheduled) {
        if (notification.content.data?.type === 'daily_reminder') {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }

      console.log('Daily reminder cancelled');
    } catch (error) {
      console.error('Error cancelling daily reminder:', error);
    }
  }

  /**
   * Disable daily reminders
   * @returns {Promise<void>}
   */
  async disableDailyReminder() {
    await this.cancelDailyReminder();

    // Update preferences
    const prefs = await this.getNotificationPreferences();
    await this.saveNotificationPreferences({
      ...prefs,
      enabled: false,
    });
  }

  /**
   * Save notification preferences to local storage
   * @param {Object} preferences
   * @returns {Promise<void>}
   */
  async saveNotificationPreferences(preferences) {
    try {
      await AsyncStorage.setItem(
        NOTIFICATION_PREFS_KEY,
        JSON.stringify(preferences)
      );
    } catch (error) {
      console.error('Error saving notification preferences:', error);
    }
  }

  /**
   * Get notification preferences from local storage
   * @returns {Promise<Object>}
   */
  async getNotificationPreferences() {
    try {
      const prefs = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
      if (prefs) {
        return JSON.parse(prefs);
      }

      // Default preferences
      return {
        enabled: false,
        hour: 9,
        minute: 0,
        title: '🌱 Time to Nurture Your Recovery',
        body: 'Your daily exercises are waiting! Take a small step toward healing today.',
      };
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return {
        enabled: false,
        hour: 9,
        minute: 0,
        title: '🌱 Time to Nurture Your Recovery',
        body: 'Your daily exercises are waiting! Take a small step toward healing today.',
      };
    }
  }

  /**
   * Get all scheduled notifications
   * @returns {Promise<Array>}
   */
  async getScheduledNotifications() {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Send an immediate test notification
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   * @returns {Promise<void>}
   */
  async sendTestNotification(title = null, body = null) {
    try {
      const hasPermission = await this.hasPermissions();
      if (!hasPermission) {
        console.log('No notification permissions');
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: title || '🌱 NeuroBloom Reminder',
          body: body || 'This is a test notification. Your daily reminders will look like this!',
          sound: true,
          data: {
            type: 'test',
          },
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }

  /**
   * Initialize notification listeners
   * @param {Function} onNotificationReceived - Called when notification is received
   * @param {Function} onNotificationTapped - Called when notification is tapped
   * @returns {Object} - Subscription object with remove() method
   */
  addNotificationListeners(onNotificationReceived, onNotificationTapped) {
    const receivedSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        if (onNotificationReceived) {
          onNotificationReceived(notification);
        }
      }
    );

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification tapped:', response);
        if (onNotificationTapped) {
          onNotificationTapped(response);
        }
      }
    );

    return {
      remove: () => {
        receivedSubscription.remove();
        responseSubscription.remove();
      },
    };
  }

  /**
   * Initialize notifications on app launch
   * Restores scheduled notifications based on saved preferences
   * @returns {Promise<void>}
   */
  async initializeOnLaunch() {
    try {
      const prefs = await this.getNotificationPreferences();

      if (prefs.enabled) {
        const hasPermission = await this.hasPermissions();
        if (hasPermission) {
          await this.scheduleDailyReminder(
            prefs.hour,
            prefs.minute,
            prefs.title,
            prefs.body
          );
        } else {
          console.log('Notifications enabled in preferences but permissions not granted');
        }
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }
}

export default new NotificationService();
