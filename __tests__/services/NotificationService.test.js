// __tests__/services/NotificationService.test.js
import * as NotificationService from '../../services/NotificationService';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
    setNotificationHandler: jest.fn(),
    getPermissionsAsync: jest.fn(),
    requestPermissionsAsync: jest.fn(),
    scheduleNotificationAsync: jest.fn(),
    cancelAllScheduledNotificationsAsync: jest.fn(),
    getAllScheduledNotificationsAsync: jest.fn(),
    SchedulableTriggerInputTypes: {
        DAILY: 'daily',
    },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    setItem: jest.fn(() => Promise.resolve()),
    getItem: jest.fn(() => Promise.resolve(null)),
    removeItem: jest.fn(() => Promise.resolve()),
}));

describe('NotificationService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('requestPermissions', () => {
        it('should return true when permissions are already granted', async () => {
            Notifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' });

            const result = await NotificationService.requestPermissions();

            expect(result).toBe(true);
            expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
        });

        it('should request permissions when not granted', async () => {
            Notifications.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
            Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });

            const result = await NotificationService.requestPermissions();

            expect(result).toBe(true);
            expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
        });

        it('should return false when permissions are denied', async () => {
            Notifications.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
            Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'denied' });

            const result = await NotificationService.requestPermissions();

            expect(result).toBe(false);
        });

        it('should handle errors gracefully', async () => {
            Notifications.getPermissionsAsync.mockRejectedValue(new Error('Permission error'));

            const result = await NotificationService.requestPermissions();

            expect(result).toBe(false);
        });
    });

    describe('scheduleDailyReminder', () => {
        it('should schedule daily reminder successfully', async () => {
            Notifications.cancelAllScheduledNotificationsAsync.mockResolvedValue();
            Notifications.scheduleNotificationAsync.mockResolvedValue('notification-id-123');

            const identifier = await NotificationService.scheduleDailyReminder(8, 30);

            expect(identifier).toBe('notification-id-123');
            expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
            expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
                content: expect.objectContaining({
                    title: "Time for Your Exercises! 🌸",
                    body: expect.any(String),
                    sound: true,
                    data: expect.objectContaining({ type: 'daily-reminder' }),
                }),
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DAILY,
                    hour: 8,
                    minute: 30,
                },
            });
        });

        it('should use default time when not provided', async () => {
            Notifications.cancelAllScheduledNotificationsAsync.mockResolvedValue();
            Notifications.scheduleNotificationAsync.mockResolvedValue('notification-id-123');

            await NotificationService.scheduleDailyReminder();

            expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
                expect.objectContaining({
                    trigger: expect.objectContaining({
                        hour: 8,
                        minute: 30,
                    }),
                })
            );
        });

        it('should handle errors when scheduling', async () => {
            Notifications.cancelAllScheduledNotificationsAsync.mockResolvedValue();
            Notifications.scheduleNotificationAsync.mockRejectedValue(new Error('Schedule failed'));

            const identifier = await NotificationService.scheduleDailyReminder(8, 30);

            expect(identifier).toBeNull();
        });
    });

    describe('cancelAllReminders', () => {
        it('should cancel all scheduled reminders', async () => {
            Notifications.cancelAllScheduledNotificationsAsync.mockResolvedValue();

            await NotificationService.cancelAllReminders();

            expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
        });

        it('should handle errors gracefully', async () => {
            Notifications.cancelAllScheduledNotificationsAsync.mockRejectedValue(new Error('Cancel failed'));

            // Should not throw
            await expect(NotificationService.cancelAllReminders()).resolves.toBeUndefined();
        });
    });

    describe('getScheduledNotifications', () => {
        it('should return all scheduled notifications', async () => {
            const mockNotifications = [
                { identifier: 'notif-1', content: { title: 'Test' } },
                { identifier: 'notif-2', content: { title: 'Test 2' } },
            ];
            Notifications.getAllScheduledNotificationsAsync.mockResolvedValue(mockNotifications);

            const notifications = await NotificationService.getScheduledNotifications();

            expect(notifications).toEqual(mockNotifications);
            expect(Notifications.getAllScheduledNotificationsAsync).toHaveBeenCalled();
        });

        it('should return empty array on error', async () => {
            Notifications.getAllScheduledNotificationsAsync.mockRejectedValue(new Error('Get failed'));

            const notifications = await NotificationService.getScheduledNotifications();

            expect(notifications).toEqual([]);
        });
    });

    describe('saveNotificationPrefs', () => {
        it('should save notification preferences', async () => {
            const prefs = { enabled: true, hour: 9, minute: 0 };
            // Service normalizes prefs by adding times array
            const expectedPrefs = { enabled: true, hour: 9, minute: 0, times: [{ hour: 9, minute: 0 }] };
            AsyncStorage.setItem.mockResolvedValue();

            await NotificationService.saveNotificationPrefs(prefs);

            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@neurobloom_notification_prefs',
                JSON.stringify(expectedPrefs)
            );
        });

        it('should handle errors gracefully', async () => {
            AsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));

            // Should not throw
            await expect(NotificationService.saveNotificationPrefs({ enabled: true })).resolves.toBeUndefined();
        });
    });

    describe('loadNotificationPrefs', () => {
        it('should load notification preferences', async () => {
            const prefs = { enabled: true, hour: 9, minute: 0 };
            // Service migrates old format by adding times array
            const expectedPrefs = { enabled: true, hour: 9, minute: 0, times: [{ hour: 9, minute: 0 }] };
            AsyncStorage.getItem.mockResolvedValue(JSON.stringify(prefs));
            AsyncStorage.setItem.mockResolvedValue(); // Migration saves the updated prefs

            const result = await NotificationService.loadNotificationPrefs();

            expect(result).toEqual(expectedPrefs);
            expect(AsyncStorage.getItem).toHaveBeenCalledWith('@neurobloom_notification_prefs');
        });

        it('should return null when no preferences exist', async () => {
            AsyncStorage.getItem.mockResolvedValue(null);

            const result = await NotificationService.loadNotificationPrefs();

            expect(result).toBeNull();
        });

        it('should handle errors gracefully', async () => {
            AsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

            const result = await NotificationService.loadNotificationPrefs();

            expect(result).toBeNull();
        });
    });

    describe('initializeNotifications', () => {
        it('should initialize notifications when prefs enabled', async () => {
            const prefs = { enabled: true, hour: 9, minute: 0 };
            AsyncStorage.getItem.mockResolvedValue(JSON.stringify(prefs));
            Notifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
            Notifications.cancelAllScheduledNotificationsAsync.mockResolvedValue();
            Notifications.scheduleNotificationAsync.mockResolvedValue('notif-id');

            await NotificationService.initializeNotifications();

            expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
        });

        it('should not initialize when prefs disabled', async () => {
            const prefs = { enabled: false };
            AsyncStorage.getItem.mockResolvedValue(JSON.stringify(prefs));

            await NotificationService.initializeNotifications();

            expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
        });

        it('should not initialize when no prefs', async () => {
            AsyncStorage.getItem.mockResolvedValue(null);

            await NotificationService.initializeNotifications();

            expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
        });

        it('should handle errors gracefully', async () => {
            AsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

            // Should not throw
            await expect(NotificationService.initializeNotifications()).resolves.toBeUndefined();
        });
    });

    describe('checkAndSendInactivityReminder', () => {
        it('should send reminder when user inactive 2+ days', async () => {
            const twoDaysAgo = new Date();
            twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
            const lastActivityAt = twoDaysAgo.toISOString();

            Notifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
            Notifications.scheduleNotificationAsync.mockResolvedValue('notif-id');
            AsyncStorage.getItem.mockResolvedValue(null);
            AsyncStorage.setItem.mockResolvedValue();

            const { sent, error } = await NotificationService.checkAndSendInactivityReminder('user-123', lastActivityAt);

            expect(sent).toBe(true);
            expect(error).toBeNull();
            expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
        });

        it('should not send when permissions not granted', async () => {
            Notifications.getPermissionsAsync.mockResolvedValue({ status: 'denied' });

            const { sent, error } = await NotificationService.checkAndSendInactivityReminder('user-123', '2024-01-01');

            expect(sent).toBe(false);
            expect(error).toBeNull();
            expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
        });

        it('should not send when less than 2 days inactive', async () => {
            const oneDayAgo = new Date();
            oneDayAgo.setDate(oneDayAgo.getDate() - 1);

            Notifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' });

            const { sent, error } = await NotificationService.checkAndSendInactivityReminder('user-123', oneDayAgo.toISOString());

            expect(sent).toBe(false);
            expect(error).toBeNull();
        });

        it('should not send when no last activity', async () => {
            Notifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' });

            const { sent, error } = await NotificationService.checkAndSendInactivityReminder('user-123', null);

            expect(sent).toBe(false);
            expect(error).toBeNull();
        });

        it('should not send if already sent within 24 hours', async () => {
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
            const lastActivityAt = threeDaysAgo.toISOString();

            const oneHourAgo = new Date();
            oneHourAgo.setHours(oneHourAgo.getHours() - 1);

            Notifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
            AsyncStorage.getItem.mockResolvedValue(JSON.stringify(oneHourAgo.toISOString()));

            const { sent, error } = await NotificationService.checkAndSendInactivityReminder('user-123', lastActivityAt);

            expect(sent).toBe(false);
            expect(error).toBeNull();
            expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
        });
    });
});
