/**
 * NotificationService - Handles local push notifications for daily reminders
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

const NOTIFICATION_PREFS_KEY = '@neurobloom_notification_prefs';
const DAILY_REMINDER_ID = 'daily-exercise-reminder';

// Default reminder time: 8:30 AM
const DEFAULT_HOUR = 8;
const DEFAULT_MINUTE = 30;

/**
 * Request notification permissions from the user
 * @returns {Promise<boolean>} - Whether permissions were granted
 */
export async function requestPermissions() {
    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('❌ Notification permissions not granted');
            return false;
        }

        console.log('✅ Notification permissions granted');
        return true;
    } catch (error) {
        console.error('❌ Error requesting notification permissions:', error);
        return false;
    }
}

/**
 * Schedule a daily reminder notification at the specified time
 * @param {number} hour - Hour of day (0-23)
 * @param {number} minute - Minute (0-59)
 * @returns {Promise<string|null>} - Notification identifier or null on failure
 */
export async function scheduleDailyReminder(hour = DEFAULT_HOUR, minute = DEFAULT_MINUTE) {
    try {
        // Cancel any existing reminders first
        await cancelAllReminders();

        // Schedule the new daily reminder
        const identifier = await Notifications.scheduleNotificationAsync({
            content: {
                title: "Time for Your Exercises! 🌸",
                body: "A few minutes of exercise can make a big difference. Your recovery journey continues today!",
                sound: true,
                data: { type: 'daily-reminder' },
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour,
                minute,
            },
        });

        console.log(`✅ Daily reminder scheduled for ${hour}:${minute.toString().padStart(2, '0')}`);
        return identifier;
    } catch (error) {
        console.error('❌ Error scheduling daily reminder:', error);
        return null;
    }
}

/**
 * Cancel all scheduled reminders
 */
export async function cancelAllReminders() {
    try {
        await Notifications.cancelAllScheduledNotificationsAsync();
        console.log('✅ All reminders cancelled');
    } catch (error) {
        console.error('❌ Error cancelling reminders:', error);
    }
}

/**
 * Get all scheduled notifications (for debugging)
 * @returns {Promise<Array>} - Array of scheduled notifications
 */
export async function getScheduledNotifications() {
    try {
        const notifications = await Notifications.getAllScheduledNotificationsAsync();
        console.log('📅 Scheduled notifications:', notifications);
        return notifications;
    } catch (error) {
        console.error('❌ Error getting scheduled notifications:', error);
        return [];
    }
}

/**
 * Save notification preferences locally
 * @param {Object} prefs - { enabled: boolean, hour: number, minute: number }
 */
export async function saveNotificationPrefs(prefs) {
    try {
        await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs));
        console.log('✅ Notification preferences saved:', prefs);
    } catch (error) {
        console.error('❌ Error saving notification preferences:', error);
    }
}

/**
 * Load notification preferences
 * @returns {Promise<Object|null>} - Saved preferences or null
 */
export async function loadNotificationPrefs() {
    try {
        const prefsJson = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
        if (prefsJson) {
            return JSON.parse(prefsJson);
        }
        return null;
    } catch (error) {
        console.error('❌ Error loading notification preferences:', error);
        return null;
    }
}

/**
 * Initialize notifications based on saved preferences
 * Call this on app startup to reschedule notifications if enabled
 */
export async function initializeNotifications() {
    try {
        const prefs = await loadNotificationPrefs();

        if (prefs && prefs.enabled) {
            const hasPermission = await requestPermissions();
            if (hasPermission) {
                await scheduleDailyReminder(prefs.hour, prefs.minute);
            }
        }
    } catch (error) {
        console.error('❌ Error initializing notifications:', error);
    }
}

export const NotificationService = {
    requestPermissions,
    scheduleDailyReminder,
    cancelAllReminders,
    getScheduledNotifications,
    saveNotificationPrefs,
    loadNotificationPrefs,
    initializeNotifications,
    DEFAULT_HOUR,
    DEFAULT_MINUTE,
};
