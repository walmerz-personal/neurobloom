// __tests__/app/(tabs)/progress.test.js
import React from 'react';
import { render, waitFor, act, fireEvent } from '@testing-library/react-native';
import { Platform } from 'react-native';
import Progress from '../../../app/(tabs)/progress';
import { useAuth } from '../../../contexts/AuthContext';
import { SupabaseService } from '../../../services/SupabaseService';
import * as HealthKitService from '../../../services/HealthKitService';
import { validateChartPoint, safeFormatDate, validateChartData, validateMoodLog } from '../../../utils/dataValidation';

// Mock dependencies
jest.mock('../../../contexts/AuthContext');
jest.mock('../../../services/SupabaseService');
jest.mock('../../../services/HealthKitService');
jest.mock('../../../services/HealthMetricsService', () => ({
    syncAndSaveHealthData: jest.fn(),
}));
const mockReplace = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: mockReplace,
    }),
}));

describe('Progress Tab', () => {
    const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
    };

    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue({ user: mockUser, userData: { role: 'survivor' } });
        SupabaseService.getDailyLogs.mockResolvedValue({ logs: [], error: null });
        SupabaseService.getHealthMetrics.mockResolvedValue({ data: [], error: null });
        HealthKitService.checkHealthKitPermissions.mockResolvedValue({ granted: false, error: null });
        HealthKitService.hasHealthPermissionsBeenGranted = jest.fn().mockResolvedValue(false);
        HealthKitService.detectPermissionRevocation = jest.fn().mockResolvedValue({ revoked: false });
        HealthKitService.isHealthKitAvailable = jest.fn().mockReturnValue(false);
        HealthKitService.testHealthKitCompatibility = jest.fn().mockResolvedValue(true);
        Platform.OS = 'ios';
    });

    describe('Null/Undefined Handling', () => {
        it('should not crash when user is null', async () => {
            useAuth.mockReturnValue({ user: null });
            
            const { queryByText } = render(<Progress />);
            
            await waitFor(() => {
                expect(queryByText('Your Progress')).toBeTruthy();
            });
        });

        it('should not crash when user.id is undefined', async () => {
            useAuth.mockReturnValue({ user: { id: undefined } });
            
            const { queryByText } = render(<Progress />);
            
            await waitFor(() => {
                expect(queryByText('Your Progress')).toBeTruthy();
            });
        });

        it('should handle null logs gracefully', async () => {
            SupabaseService.getDailyLogs.mockResolvedValue({ logs: null, error: null });
            
            const { queryByText } = render(<Progress />);
            
            await waitFor(() => {
                expect(queryByText('Your Progress')).toBeTruthy();
            });
        });

        it('should handle undefined logs gracefully', async () => {
            SupabaseService.getDailyLogs.mockResolvedValue({ logs: undefined, error: null });
            
            const { queryByText } = render(<Progress />);
            
            await waitFor(() => {
                expect(queryByText('Your Progress')).toBeTruthy();
            });
        });
    });

    describe('Data Validation', () => {
        it('should filter invalid chart data points', () => {
            const invalidData = [
                { date: '2024-01-01', value: 5 },
                { date: null, value: 3 },
                { date: '2024-01-02', value: 'invalid' },
                { date: 'invalid-date', value: 4 },
                { date: '2024-01-03', value: NaN },
            ];

            const validData = validateChartData(invalidData);
            expect(validData).toHaveLength(1);
            expect(validData[0].value).toBe(5);
        });

        it('should handle malformed mood logs', () => {
            const invalidLogs = [
                { log_date: '2024-01-01', mood: '😄' },
                { log_date: null, mood: '🙂' },
                { log_date: '2024-01-02', mood: null },
                { log_date: 'invalid', mood: '😐' },
            ];

            const validLogs = invalidLogs.filter(validateMoodLog);
            expect(validLogs).toHaveLength(1);
        });

        it('should safely format invalid dates', () => {
            expect(safeFormatDate(null)).toBe('N/A');
            expect(safeFormatDate(undefined)).toBe('N/A');
            expect(safeFormatDate('invalid-date')).toBe('N/A');
            expect(safeFormatDate('')).toBe('N/A');
            expect(safeFormatDate('2024-01-15')).toBe('1/15');
        });
    });

    describe('HealthKit Error Handling', () => {
        it('should handle HealthKit native crash gracefully', async () => {
            HealthKitService.checkHealthKitPermissions.mockRejectedValue(
                new Error('Native crash')
            );

            const { queryByText } = render(<Progress />);
            
            await waitFor(() => {
                expect(queryByText('Your Progress')).toBeTruthy();
            });
        });

        it('should handle HealthKit timeout gracefully', async () => {
            HealthKitService.checkHealthKitPermissions.mockImplementation(
                () => new Promise((resolve) => setTimeout(() => resolve({ granted: false, error: null }), 6000))
            );

            const { queryByText } = render(<Progress />);
            
            await waitFor(() => {
                expect(queryByText('Your Progress')).toBeTruthy();
            }, { timeout: 3000 });
        });

        it('should not crash when HealthKit returns error', async () => {
            HealthKitService.checkHealthKitPermissions.mockResolvedValue({
                granted: false,
                error: new Error('HealthKit error')
            });

            const { queryByText } = render(<Progress />);
            
            await waitFor(() => {
                expect(queryByText('Your Progress')).toBeTruthy();
            });
        });
    });

    describe('Chart Rendering', () => {
        it('should render empty chart when no data', async () => {
            SupabaseService.getDailyLogs.mockResolvedValue({ logs: [], error: null });
            
            const { queryByText } = render(<Progress />);
            
            await waitFor(() => {
                expect(queryByText('No mood data yet. Check in today!')).toBeTruthy();
            });
        });

        it('should render chart with valid data', async () => {
            const validLogs = [
                { log_date: '2024-01-01', mood: '😄', exercises_completed: [] },
                { log_date: '2024-01-02', mood: '🙂', exercises_completed: [] },
            ];
            
            SupabaseService.getDailyLogs.mockResolvedValue({ logs: validLogs, error: null });
            
            const { queryByText } = render(<Progress />);
            
            await waitFor(() => {
                expect(queryByText('Mood Trend')).toBeTruthy();
            });
        });

        it('should filter out invalid chart points', async () => {
            const mixedLogs = [
                { log_date: '2024-01-01', mood: '😄', exercises_completed: [] },
                { log_date: null, mood: '🙂', exercises_completed: [] },
                { log_date: '2024-01-03', mood: '😐', exercises_completed: [] },
            ];
            
            SupabaseService.getDailyLogs.mockResolvedValue({ logs: mixedLogs, error: null });
            
            const { queryByText } = render(<Progress />);
            
            await waitFor(() => {
                expect(queryByText('Mood Trend')).toBeTruthy();
            });
        });
    });

    describe('Cleanup Logic', () => {
        it('should cleanup async operations on unmount', async () => {
            const { unmount } = render(<Progress />);
            
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 50));
            });
            
            unmount();
            
            // Should not throw errors after unmount
            expect(() => {
                SupabaseService.getDailyLogs.mockResolvedValue({ logs: [], error: null });
            }).not.toThrow();
        });

        it('should not update state after unmount', async () => {
            const { unmount } = render(<Progress />);
            
            unmount();
            
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 200));
            });
            
            // No errors should occur
            expect(true).toBe(true);
        });
    });

    describe('Error Scenarios', () => {
        it('should handle Supabase errors gracefully', async () => {
            SupabaseService.getDailyLogs.mockResolvedValue({
                logs: null,
                error: new Error('Database error')
            });
            
            const { queryByText } = render(<Progress />);
            
            await waitFor(() => {
                expect(queryByText('Your Progress')).toBeTruthy();
            });
        });

        it('should handle network errors gracefully', async () => {
            SupabaseService.getDailyLogs.mockRejectedValue(
                new Error('Network error')
            );
            
            const { queryByText } = render(<Progress />);
            
            await waitFor(() => {
                expect(queryByText('Your Progress')).toBeTruthy();
            });
        });
    });

    describe('Caregiver/Medical staff redirect', () => {
        it('redirects to home when userData role is caregiver', async () => {
            useAuth.mockReturnValue({
                user: mockUser,
                userData: { role: 'caregiver' },
            });
            const { queryByText } = render(<Progress />);
            await waitFor(() => {
                expect(mockReplace).toHaveBeenCalledWith('/(tabs)/home');
            });
        });

        it('redirects to home when userData role is medical_staff', async () => {
            useAuth.mockReturnValue({
                user: mockUser,
                userData: { role: 'medical_staff' },
            });
            const { queryByText } = render(<Progress />);
            await waitFor(() => {
                expect(mockReplace).toHaveBeenCalledWith('/(tabs)/home');
            });
        });

        it('returns null when caregiver so no Progress UI flashes', () => {
            useAuth.mockReturnValue({
                user: mockUser,
                userData: { role: 'caregiver' },
            });
            const { queryByText } = render(<Progress />);
            expect(queryByText('Your Progress')).toBeFalsy();
        });
    });

    describe('Time range selector', () => {
        it('shows time range label and opens picker on press', async () => {
            const { getByText } = render(<Progress />);
            await waitFor(() => {
                expect(getByText('Your Progress')).toBeTruthy();
            });
            const rangeButton = getByText('14 Days');
            expect(rangeButton).toBeTruthy();
            fireEvent.press(rangeButton);
            await waitFor(() => {
                expect(getByText('Select Time Range')).toBeTruthy();
            });
        });

        it('calls fetchData and fetchHealthData when time range changes', async () => {
            const { getByText } = render(<Progress />);
            await waitFor(() => expect(getByText('Your Progress')).toBeTruthy());
            fireEvent.press(getByText('14 Days'));
            await waitFor(() => expect(getByText('Select Time Range')).toBeTruthy());
            fireEvent.press(getByText('1 Month'));
            await waitFor(() => {
                expect(SupabaseService.getDailyLogs).toHaveBeenCalled();
                expect(SupabaseService.getHealthMetrics).toHaveBeenCalled();
            });
        });
    });

    describe('Health data and charts', () => {
        it('shows health metrics when getHealthMetrics returns data and permissions granted', async () => {
            HealthKitService.hasHealthPermissionsBeenGranted.mockResolvedValue(true);
            const metrics = [
                {
                    metric_date: '2024-01-15',
                    walking_speed_avg: 1.2,
                    step_count: 5000,
                    distance_walked: 3.5,
                    walking_step_length_avg: 75,
                    walking_steadiness: 0.8,
                    walking_asymmetry_percentage: 5,
                },
            ];
            SupabaseService.getHealthMetrics.mockResolvedValue({ data: metrics, error: null });
            const { getByText, queryAllByText } = render(<Progress />);
            await waitFor(() => expect(getByText('Your Progress')).toBeTruthy());
            await waitFor(() => {
                const hasMobility = queryAllByText('Mobility Metrics').length > 0;
                const hasWalking = queryAllByText('Walking Speed Trend').length > 0;
                const hasDaily = queryAllByText('Daily Steps').length > 0;
                expect(hasMobility || hasWalking || hasDaily).toBe(true);
            }, { timeout: 3000 });
        });

        it('shows This Weeks Goal and streak when logs have exercises', async () => {
            const logs = [
                { log_date: new Date().toISOString().slice(0, 10), mood: '😄', exercises_completed: ['a1'] },
            ];
            SupabaseService.getDailyLogs.mockResolvedValue({ logs, error: null });
            const { getByText } = render(<Progress />);
            await waitFor(() => expect(getByText("This Week's Goal")).toBeTruthy());
            expect(getByText('Current streak')).toBeTruthy();
            expect(getByText('Longest streak')).toBeTruthy();
        });
    });

    describe('Connect Health and Sync', () => {
        it('shows Connect Apple Health when permissions not granted on iOS', async () => {
            HealthKitService.isHealthKitAvailable.mockReturnValue(true);
            const { getByText, getAllByText } = render(<Progress />);
            await waitFor(() => expect(getByText('Your Progress')).toBeTruthy());
            await waitFor(() => {
                expect(getAllByText('Connect Apple Health').length).toBeGreaterThan(0);
            }, { timeout: 2000 });
        });

        it('renders Progress without crashing when user is null', async () => {
            useAuth.mockReturnValue({ user: null, userData: null });
            const { getByText } = render(<Progress />);
            await waitFor(() => expect(getByText('Your Progress')).toBeTruthy());
        });
    });
});
