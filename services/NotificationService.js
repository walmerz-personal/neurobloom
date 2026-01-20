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
const LAST_INACTIVITY_REMINDER_KEY = '@neurobloom_last_inactivity_reminder';

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

/**
 * Send an immediate push notification for a kudos received
 * @param {string} caregiverName - Name of the caregiver/medical professional who sent the kudos
 * @returns {Promise<{sent, error}>} - Whether notification was sent
 */
export async function sendKudosNotification(caregiverName) {
    try {
        // Check if we have notification permissions
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
            console.log('⏭️ Skipping kudos notification: notification permissions not granted');
            return { sent: false, error: null };
        }

        // Send the kudos notification immediately
        const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
                title: "You received a kudos! 🎉",
                body: `You received a kudos from ${caregiverName}! 🎉`,
                sound: true,
                data: { type: 'kudos' },
            },
            trigger: null, // Send immediately
        });

        if (notificationId) {
            console.log(`✅ Kudos notification sent from ${caregiverName}`);
            return { sent: true, error: null };
        } else {
            console.error('❌ Failed to send kudos notification: notification ID not returned');
            return { sent: false, error: new Error('Notification scheduling failed') };
        }
    } catch (error) {
        console.error('❌ Error sending kudos notification:', error);
        return { sent: false, error };
    }
}

/**
 * Check if user hasn't opened app for 2+ days and send reminder notification
 * @param {string} userId - User ID
 * @param {string} lastActivityAt - ISO timestamp of last activity (from database)
 * @returns {Promise<{sent, error}>} - Whether notification was sent
 */
export async function checkAndSendInactivityReminder(userId, lastActivityAt) {
    try {
        // Check if we have notification permissions
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
            console.log('⏭️ Skipping inactivity reminder: notification permissions not granted');
            return { sent: false, error: null };
        }

        // If no last activity timestamp, user is new - skip reminder
        if (!lastActivityAt) {
            console.log('⏭️ Skipping inactivity reminder: no previous activity');
            return { sent: false, error: null };
        }

        // Calculate days since last activity
        const lastActivity = new Date(lastActivityAt);
        const now = new Date();
        const daysSinceLastActivity = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));

        // Only send reminder if 2+ days have passed
        if (daysSinceLastActivity < 2) {
            console.log(`⏭️ Skipping inactivity reminder: only ${daysSinceLastActivity} days since last activity`);
            return { sent: false, error: null };
        }

        // Check if we've already sent a reminder recently (within last 24 hours)
        // This prevents spam if user opens app multiple times after 2+ days
        try {
            const lastReminderJson = await AsyncStorage.getItem(`${LAST_INACTIVITY_REMINDER_KEY}_${userId}`);
            if (lastReminderJson) {
                const lastReminder = new Date(JSON.parse(lastReminderJson));
                const hoursSinceLastReminder = (now - lastReminder) / (1000 * 60 * 60);
                if (hoursSinceLastReminder < 24) {
                    console.log(`⏭️ Skipping inactivity reminder: already sent ${hoursSinceLastReminder.toFixed(1)} hours ago`);
                    return { sent: false, error: null };
                }
            }
        } catch (storageError) {
            console.warn('⚠️ Error checking last reminder time:', storageError);
            // Continue anyway - better to send reminder than miss it
        }

        // Send the reminder notification immediately
        const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
                title: "We Miss You! 🌸",
                body: "Regular check-ins and exercises help track your recovery progress. Every day counts - let's continue your journey together!",
                sound: true,
                data: { type: 'inactivity-reminder' },
            },
            trigger: null, // Send immediately
        });

        if (notificationId) {
            // Store the timestamp of when we sent this reminder
            await AsyncStorage.setItem(`${LAST_INACTIVITY_REMINDER_KEY}_${userId}`, JSON.stringify(now.toISOString()));
            console.log(`✅ Inactivity reminder sent for user (${daysSinceLastActivity} days inactive):`, userId);
            return { sent: true, error: null };
        } else {
            console.error('❌ Failed to send inactivity reminder: notification ID not returned');
            return { sent: false, error: new Error('Notification scheduling failed') };
        }
    } catch (error) {
        console.error('❌ Error checking and sending inactivity reminder:', error);
        return { sent: false, error };
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
    checkAndSendInactivityReminder,
    sendKudosNotification,
    DEFAULT_HOUR,
    DEFAULT_MINUTE,
};
