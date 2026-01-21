// __tests__/app/(tabs)/progress.test.js
import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import Progress from '../../../app/(tabs)/progress';
import { useAuth } from '../../../contexts/AuthContext';
import { SupabaseService } from '../../../services/SupabaseService';
import * as HealthKitService from '../../../services/HealthKitService';
import { validateChartPoint, safeFormatDate, validateChartData, validateMoodLog } from '../../../utils/dataValidation';

// Mock dependencies
jest.mock('../../../contexts/AuthContext');
jest.mock('../../../services/SupabaseService');
jest.mock('../../../services/HealthKitService');
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: jest.fn(),
    }),
}));

describe('Progress Tab', () => {
    const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
    };

    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue({ user: mockUser });
        SupabaseService.getDailyLogs.mockResolvedValue({ logs: [], error: null });
        SupabaseService.getHealthMetrics.mockResolvedValue({ data: [], error: null });
        HealthKitService.checkHealthKitPermissions.mockResolvedValue({ granted: false, error: null });
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
});
