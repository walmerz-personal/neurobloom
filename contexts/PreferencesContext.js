import React, { createContext, useContext, useState, useEffect } from 'react';
import NotificationService from '../services/NotificationService';
import SupabaseService from '../services/SupabaseService';
import { useAuth } from './AuthContext';

const PreferencesContext = createContext();

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};

export const PreferencesProvider = ({ children }) => {
  const { user } = useAuth();
  const [notificationPrefs, setNotificationPrefs] = useState({
    enabled: false,
    hour: 9,
    minute: 0,
    title: '🌱 Time to Nurture Your Recovery',
    body: 'Your daily exercises are waiting! Take a small step toward healing today.',
  });
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load notification preferences on mount
  useEffect(() => {
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    try {
      setLoading(true);

      // Check notification permissions
      const hasPermission = await NotificationService.hasPermissions();
      setHasNotificationPermission(hasPermission);

      // Load preferences from AsyncStorage
      const localPrefs = await NotificationService.getNotificationPreferences();
      setNotificationPrefs(localPrefs);

      // If user is logged in, sync with Supabase
      if (user) {
        try {
          const userProfile = await SupabaseService.getUserProfile(user.id);
          if (userProfile?.preferences?.notifications) {
            const syncedPrefs = userProfile.preferences.notifications;
            setNotificationPrefs(syncedPrefs);

            // Update local storage with synced preferences
            await NotificationService.saveNotificationPreferences(syncedPrefs);
          }
        } catch (error) {
          console.error('Error syncing preferences from Supabase:', error);
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Request notification permissions
   * @returns {Promise<boolean>}
   */
  const requestNotificationPermissions = async () => {
    const granted = await NotificationService.requestPermissions();
    setHasNotificationPermission(granted);
    return granted;
  };

  /**
   * Enable daily reminder notifications
   * @param {number} hour - Hour (0-23)
   * @param {number} minute - Minute (0-59)
   * @param {string} title - Optional custom title
   * @param {string} body - Optional custom body
   * @returns {Promise<boolean>}
   */
  const enableDailyReminder = async (hour, minute, title = null, body = null) => {
    try {
      // Ensure permissions are granted
      let hasPermission = hasNotificationPermission;
      if (!hasPermission) {
        hasPermission = await requestNotificationPermissions();
        if (!hasPermission) {
          return false;
        }
      }

      // Schedule the notification
      const success = await NotificationService.scheduleDailyReminder(
        hour,
        minute,
        title,
        body
      );

      if (success) {
        const updatedPrefs = {
          enabled: true,
          hour,
          minute,
          title: title || notificationPrefs.title,
          body: body || notificationPrefs.body,
        };

        setNotificationPrefs(updatedPrefs);

        // Sync to Supabase if user is logged in
        if (user) {
          await syncPreferencesToSupabase(updatedPrefs);
        }
      }

      return success;
    } catch (error) {
      console.error('Error enabling daily reminder:', error);
      return false;
    }
  };

  /**
   * Disable daily reminder notifications
   * @returns {Promise<void>}
   */
  const disableDailyReminder = async () => {
    try {
      await NotificationService.disableDailyReminder();

      const updatedPrefs = {
        ...notificationPrefs,
        enabled: false,
      };

      setNotificationPrefs(updatedPrefs);

      // Sync to Supabase if user is logged in
      if (user) {
        await syncPreferencesToSupabase(updatedPrefs);
      }
    } catch (error) {
      console.error('Error disabling daily reminder:', error);
    }
  };

  /**
   * Update notification preferences
   * @param {Object} updates - Preference updates
   * @returns {Promise<void>}
   */
  const updateNotificationPreferences = async (updates) => {
    try {
      const updatedPrefs = {
        ...notificationPrefs,
        ...updates,
      };

      setNotificationPrefs(updatedPrefs);
      await NotificationService.saveNotificationPreferences(updatedPrefs);

      // If enabled and time changed, reschedule
      if (updatedPrefs.enabled && (updates.hour !== undefined || updates.minute !== undefined)) {
        await NotificationService.scheduleDailyReminder(
          updatedPrefs.hour,
          updatedPrefs.minute,
          updatedPrefs.title,
          updatedPrefs.body
        );
      }

      // Sync to Supabase if user is logged in
      if (user) {
        await syncPreferencesToSupabase(updatedPrefs);
      }
    } catch (error) {
      console.error('Error updating notification preferences:', error);
    }
  };

  /**
   * Sync preferences to Supabase
   * @param {Object} prefs - Preferences to sync
   * @returns {Promise<void>}
   */
  const syncPreferencesToSupabase = async (prefs) => {
    try {
      if (!user) return;

      const userProfile = await SupabaseService.getUserProfile(user.id);
      const existingPreferences = userProfile?.preferences || {};

      await SupabaseService.saveUserProfile(user.id, {
        preferences: {
          ...existingPreferences,
          notifications: prefs,
        },
      });
    } catch (error) {
      console.error('Error syncing preferences to Supabase:', error);
    }
  };

  /**
   * Send a test notification
   * @returns {Promise<void>}
   */
  const sendTestNotification = async () => {
    await NotificationService.sendTestNotification(
      notificationPrefs.title,
      notificationPrefs.body
    );
  };

  const value = {
    notificationPrefs,
    hasNotificationPermission,
    loading,
    requestNotificationPermissions,
    enableDailyReminder,
    disableDailyReminder,
    updateNotificationPreferences,
    sendTestNotification,
    refreshPreferences: loadPreferences,
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};
