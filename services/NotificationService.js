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
const DAILY_REMINDER_ID_PREFIX = 'daily-exercise-reminder-';
const LAST_INACTIVITY_REMINDER_KEY = '@neurobloom_last_inactivity_reminder';

// Default reminder times: 8:30 AM and 12:30 PM
const DEFAULT_TIMES = [
    { hour: 8, minute: 30 },
    { hour: 12, minute: 30 }
];

// Legacy defaults for backward compatibility
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
 * Schedule daily reminder notifications at the specified times
 * @param {Array<{hour: number, minute: number}>|number} timesOrHour - Array of {hour, minute} objects, or single hour for backward compatibility
 * @param {number} minute - Minute (0-59) - only used if first param is a number (backward compatibility)
 * @returns {Promise<Array<string>|string|null>} - Array of notification identifiers, single identifier, or null on failure
 */
export async function scheduleDailyReminder(timesOrHour = DEFAULT_TIMES, minute = undefined) {
    try {
        // Cancel any existing reminders first
        await cancelAllReminders();

        // Handle backward compatibility: if first param is a number, treat as single hour
        let times;
        if (typeof timesOrHour === 'number') {
            times = [{ hour: timesOrHour, minute: minute !== undefined ? minute : DEFAULT_MINUTE }];
        } else if (Array.isArray(timesOrHour)) {
            times = timesOrHour;
        } else {
            times = DEFAULT_TIMES;
        }

        // Validate times array
        if (!Array.isArray(times) || times.length === 0) {
            console.error('❌ Invalid times array:', times);
            return null;
        }

        // Schedule reminders for each time
        const identifiers = [];
        for (let i = 0; i < times.length; i++) {
            const { hour, minute: min } = times[i];
            
            try {
                const identifier = await Notifications.scheduleNotificationAsync({
                    content: {
                        title: "Time for Your Exercises! 🌸",
                        body: "A few minutes of exercise can make a big difference. Your recovery journey continues today!",
                        sound: true,
                        data: { type: 'daily-reminder', index: i },
                    },
                    trigger: {
                        type: Notifications.SchedulableTriggerInputTypes.DAILY,
                        hour,
                        minute: min,
                    },
                });
                identifiers.push(identifier);
                console.log(`✅ Daily reminder ${i + 1} scheduled for ${hour}:${min.toString().padStart(2, '0')}`);
            } catch (error) {
                console.error(`❌ Error scheduling reminder ${i + 1}:`, error);
            }
        }

        // Return single identifier for backward compatibility if only one reminder
        if (identifiers.length === 1) {
            return identifiers[0];
        }
        
        return identifiers.length > 0 ? identifiers : null;
    } catch (error) {
        console.error('❌ Error scheduling daily reminders:', error);
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
 * @param {Object} prefs - { enabled: boolean, times?: Array<{hour, minute}>, hour?: number, minute?: number }
 * Supports both new format (times array) and old format (hour, minute) for backward compatibility
 */
export async function saveNotificationPrefs(prefs) {
    try {
        // Normalize to new format if old format is provided
        let normalizedPrefs = { ...prefs };
        if (normalizedPrefs.hour !== undefined && normalizedPrefs.minute !== undefined && !normalizedPrefs.times) {
            normalizedPrefs.times = [{ hour: normalizedPrefs.hour, minute: normalizedPrefs.minute }];
            // Keep hour and minute for backward compatibility
        } else if (normalizedPrefs.times && normalizedPrefs.times.length > 0) {
            // New format - ensure times is an array
            if (!Array.isArray(normalizedPrefs.times)) {
                normalizedPrefs.times = [normalizedPrefs.times];
            }
        }
        
        await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(normalizedPrefs));
        console.log('✅ Notification preferences saved:', normalizedPrefs);
    } catch (error) {
        console.error('❌ Error saving notification preferences:', error);
    }
}

/**
 * Load notification preferences
 * @returns {Promise<Object|null>} - Saved preferences (migrated to new format) or null
 * Migrates old format (hour, minute) to new format (times array)
 */
export async function loadNotificationPrefs() {
    try {
        const prefsJson = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
        if (prefsJson) {
            const prefs = JSON.parse(prefsJson);
            
            // Migrate old format to new format
            if (prefs.hour !== undefined && prefs.minute !== undefined && !prefs.times) {
                console.log('🔄 Migrating old notification preferences format to new format');
                prefs.times = [{ hour: prefs.hour, minute: prefs.minute }];
                // Save migrated format
                await saveNotificationPrefs(prefs);
            } else if (!prefs.times || !Array.isArray(prefs.times)) {
                // Invalid format, use defaults
                console.warn('⚠️ Invalid notification preferences format, using defaults');
                return { enabled: prefs.enabled !== false, times: DEFAULT_TIMES };
            }
            
            return prefs;
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

        if (prefs && prefs.enabled && prefs.times && Array.isArray(prefs.times) && prefs.times.length > 0) {
            const hasPermission = await requestPermissions();
            if (hasPermission) {
                await scheduleDailyReminder(prefs.times);
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
    DEFAULT_TIMES,
    DEFAULT_HOUR, // For backward compatibility
    DEFAULT_MINUTE, // For backward compatibility
};
