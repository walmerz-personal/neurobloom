// __tests__/services/HealthMetricsService.test.js

import {
    processDailyMetrics,
    syncAndSaveHealthData,
    detectMeaningfulChanges,
    getHealthMetricsSummary,
} from '../../services/HealthMetricsService';

// Mock dependencies
jest.mock('../../services/HealthKitService', () => ({
    checkHealthKitPermissions: jest.fn(),
    getStepCount: jest.fn(),
    syncHealthData: jest.fn(),
}));

jest.mock('../../services/SupabaseService', () => ({
    SupabaseService: {
        saveHealthMetrics: jest.fn(),
        getHealthMetrics: jest.fn(),
    },
}));

const HealthKitService = require('../../services/HealthKitService');
const { SupabaseService } = require('../../services/SupabaseService');

// Helper: create a sample with a valid recent date
function makeSample(value, daysAgo = 0, extras = {}) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return { startDate: d.toISOString(), value, ...extras };
}

// Today at noon for date-filtered tests
function todayNoon() {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
}

describe('HealthMetricsService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // =========================================================================
    // processDailyMetrics
    // =========================================================================
    describe('processDailyMetrics', () => {
        const today = todayNoon();

        it('returns processed metrics for a day with full data', async () => {
            const rawData = {
                walkingSpeed: [makeSample(1.2), makeSample(1.4), makeSample(1.3)],
                walkingStepLength: [makeSample(0.7), makeSample(0.8)],
                walkingAsymmetry: [makeSample(5)],
                walkingDoubleSupport: [makeSample(25)],
                walkingSteadiness: [{ startDate: new Date().toISOString(), categoryValue: 0 }],
                sixMinuteWalk: [makeSample(450)],
                stepCount: [makeSample(3000), makeSample(2000)],
                distanceWalked: [makeSample(2500), makeSample(1500)],
            };

            const result = await processDailyMetrics(today, rawData);

            expect(result.metricDate).toBe(today.toISOString().split('T')[0]);
            expect(result.walkingSpeedAvg).toBeCloseTo(1.3, 1);
            expect(result.walkingStepLengthAvg).toBeCloseTo(0.75, 1);
            expect(result.walkingAsymmetryPercentage).toBe(5);
            expect(result.walkingDoubleSupportPercentage).toBe(25);
            expect(result.walkingSteadiness).toBe('OK');
            expect(result.sixMinuteWalkDistance).toBe(450);
            expect(result.stepCount).toBe(5000);
            expect(result.distanceWalked).toBe(4000);
            expect(result.dataQuality).toBeDefined();
            expect(result.deviceSource).toBeDefined();
        });

        it('handles empty rawData gracefully', async () => {
            const result = await processDailyMetrics(today, {});

            expect(result.walkingSpeedAvg).toBeNull();
            expect(result.stepCount).toBeNull();
            expect(result.distanceWalked).toBeNull();
            expect(result.walkingSteadiness).toBeNull();
            expect(result.sixMinuteWalkDistance).toBeNull();
            expect(result.sampleCount).toBe(0);
            expect(result.dataQuality).toBe('insufficient');
        });

        it('filters out samples from a different day', async () => {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            const rawData = {
                stepCount: [
                    // sample from yesterday should be excluded when processing today
                    { startDate: yesterday.toISOString(), value: 9999 },
                ],
            };

            const result = await processDailyMetrics(today, rawData);
            expect(result.stepCount).toBeNull();
        });

        it('detects iPhone device source', async () => {
            const rawData = {
                walkingSpeed: [
                    { startDate: new Date().toISOString(), value: 1.2, source: { name: 'iPhone 15' } },
                ],
            };

            const result = await processDailyMetrics(today, rawData);
            expect(result.deviceSource).toBe('iPhone');
        });

        it('detects Apple Watch device source', async () => {
            const rawData = {
                walkingSpeed: [
                    { startDate: new Date().toISOString(), value: 1.2, source: { name: 'Apple Watch Series 9' } },
                ],
            };

            const result = await processDailyMetrics(today, rawData);
            expect(result.deviceSource).toBe('Apple Watch');
        });

        it('returns Unknown when no device info present', async () => {
            const rawData = {
                walkingSpeed: [makeSample(1.2)],
            };

            const result = await processDailyMetrics(today, rawData);
            expect(result.deviceSource).toBe('Unknown');
        });

        it('handles null arrays in rawData', async () => {
            const rawData = {
                walkingSpeed: null,
                stepCount: null,
                distanceWalked: null,
                walkingSteadiness: null,
                sixMinuteWalk: null,
            };

            const result = await processDailyMetrics(today, rawData);
            expect(result.walkingSpeedAvg).toBeNull();
            expect(result.stepCount).toBeNull();
        });

        it('assigns good data quality when enough speed samples exist', async () => {
            const rawData = {
                walkingSpeed: [makeSample(1.2), makeSample(1.3), makeSample(1.4)],
                walkingStepLength: [makeSample(0.7)],
            };

            const result = await processDailyMetrics(today, rawData);
            expect(result.dataQuality).toBe('good');
        });

        it('assigns poor data quality with too few samples', async () => {
            const rawData = {
                walkingSpeed: [makeSample(1.2)],
            };

            const result = await processDailyMetrics(today, rawData);
            // 1 sample total, below MIN_SAMPLES threshold of 3
            expect(result.dataQuality).toBe('poor');
        });
    });

    // =========================================================================
    // syncAndSaveHealthData
    // =========================================================================
    describe('syncAndSaveHealthData', () => {
        const userId = 'user-123';
        const startDate = new Date('2026-03-07');
        const endDate = new Date('2026-03-08');

        it('syncs and saves health data successfully', async () => {
            HealthKitService.checkHealthKitPermissions.mockResolvedValue({ granted: true });
            HealthKitService.syncHealthData.mockResolvedValue({
                data: {
                    stepCount: [
                        { startDate: '2026-03-07T12:00:00Z', value: 5000 },
                        { startDate: '2026-03-08T12:00:00Z', value: 6000 },
                    ],
                },
                error: null,
            });
            SupabaseService.saveHealthMetrics.mockResolvedValue({ error: null });

            const result = await syncAndSaveHealthData(userId, startDate, endDate);

            expect(result.success).toBe(true);
            expect(result.synced).toBeGreaterThanOrEqual(1);
            expect(result.error).toBeNull();
            expect(SupabaseService.saveHealthMetrics).toHaveBeenCalled();
        });

        it('returns permission denied when permissions not granted and test query fails with permission error', async () => {
            HealthKitService.checkHealthKitPermissions.mockResolvedValue({ granted: false });
            HealthKitService.getStepCount.mockResolvedValue({
                data: null,
                error: { message: 'Authorization denied' },
            });

            const result = await syncAndSaveHealthData(userId, startDate, endDate);

            expect(result.success).toBe(false);
            expect(result.synced).toBe(0);
            expect(result.error.message).toContain('PERMISSION_DENIED');
        });

        it('proceeds when permission check fails but test query succeeds', async () => {
            HealthKitService.checkHealthKitPermissions.mockResolvedValue({ granted: false });
            HealthKitService.getStepCount.mockResolvedValue({ data: [], error: null });
            HealthKitService.syncHealthData.mockResolvedValue({
                data: {
                    stepCount: [{ startDate: '2026-03-07T12:00:00Z', value: 1000 }],
                },
                error: null,
            });
            SupabaseService.saveHealthMetrics.mockResolvedValue({ error: null });

            const result = await syncAndSaveHealthData(userId, startDate, endDate);

            expect(result.success).toBe(true);
        });

        it('returns error when syncHealthData fails', async () => {
            HealthKitService.checkHealthKitPermissions.mockResolvedValue({ granted: true });
            HealthKitService.syncHealthData.mockResolvedValue({
                data: null,
                error: { message: 'Network error' },
            });

            const result = await syncAndSaveHealthData(userId, startDate, endDate);

            expect(result.success).toBe(false);
            expect(result.error.message).toContain('Failed to sync health data');
        });

        it('returns NO_DATA when rawData is null', async () => {
            HealthKitService.checkHealthKitPermissions.mockResolvedValue({ granted: true });
            HealthKitService.syncHealthData.mockResolvedValue({ data: null, error: null });

            const result = await syncAndSaveHealthData(userId, startDate, endDate);

            expect(result.success).toBe(false);
            expect(result.error.message).toContain('NO_DATA');
        });

        it('returns NO_DATA when rawData has no arrays with samples', async () => {
            HealthKitService.checkHealthKitPermissions.mockResolvedValue({ granted: true });
            HealthKitService.syncHealthData.mockResolvedValue({
                data: { stepCount: [], walkingSpeed: [] },
                error: null,
            });

            const result = await syncAndSaveHealthData(userId, startDate, endDate);

            expect(result.success).toBe(false);
            expect(result.error.message).toContain('NO_DATA');
        });

        it('handles database save errors for some dates gracefully', async () => {
            HealthKitService.checkHealthKitPermissions.mockResolvedValue({ granted: true });
            HealthKitService.syncHealthData.mockResolvedValue({
                data: {
                    stepCount: [
                        { startDate: '2026-03-07T12:00:00Z', value: 5000 },
                        { startDate: '2026-03-08T12:00:00Z', value: 6000 },
                    ],
                },
                error: null,
            });
            // First save succeeds, second fails
            SupabaseService.saveHealthMetrics
                .mockResolvedValueOnce({ error: null })
                .mockResolvedValueOnce({ error: new Error('DB write failed') });

            const result = await syncAndSaveHealthData(userId, startDate, endDate);

            expect(result.success).toBe(true);
            expect(result.synced).toBeGreaterThanOrEqual(1);
            expect(result.error).not.toBeNull(); // partial failure
        });

        it('returns error when all saves fail', async () => {
            HealthKitService.checkHealthKitPermissions.mockResolvedValue({ granted: true });
            HealthKitService.syncHealthData.mockResolvedValue({
                data: {
                    stepCount: [{ startDate: '2026-03-07T12:00:00Z', value: 5000 }],
                },
                error: null,
            });
            SupabaseService.saveHealthMetrics.mockResolvedValue({ error: new Error('DB error') });

            const result = await syncAndSaveHealthData(userId, startDate, endDate);

            expect(result.success).toBe(false);
            expect(result.synced).toBe(0);
        });

        it('handles permission denied from syncHealthData error', async () => {
            HealthKitService.checkHealthKitPermissions.mockResolvedValue({ granted: true });
            HealthKitService.syncHealthData.mockResolvedValue({
                data: null,
                error: { message: 'Not authorized to access health data' },
            });

            const result = await syncAndSaveHealthData(userId, startDate, endDate);

            expect(result.success).toBe(false);
            expect(result.error.message).toContain('PERMISSION_DENIED');
        });

        it('handles test query throwing an exception with permission error', async () => {
            HealthKitService.checkHealthKitPermissions.mockResolvedValue({ granted: false });
            HealthKitService.getStepCount.mockRejectedValue(new Error('Permission denied by system'));

            const result = await syncAndSaveHealthData(userId, startDate, endDate);

            expect(result.success).toBe(false);
            expect(result.error.message).toContain('PERMISSION_DENIED');
        });

        it('handles test query throwing a non-permission exception', async () => {
            HealthKitService.checkHealthKitPermissions.mockResolvedValue({ granted: false });
            HealthKitService.getStepCount.mockRejectedValue(new Error('Something went wrong'));

            const result = await syncAndSaveHealthData(userId, startDate, endDate);

            expect(result.success).toBe(false);
            expect(result.error.message).toContain('Failed to verify health data access');
        });

        it('handles test query returning non-permission error', async () => {
            HealthKitService.checkHealthKitPermissions.mockResolvedValue({ granted: false });
            HealthKitService.getStepCount.mockResolvedValue({
                data: null,
                error: { message: 'Network timeout' },
            });

            const result = await syncAndSaveHealthData(userId, startDate, endDate);

            expect(result.success).toBe(false);
            expect(result.error.message).toContain('Unable to access health data');
        });

        it('catches unexpected top-level exceptions', async () => {
            HealthKitService.checkHealthKitPermissions.mockRejectedValue(new Error('Unexpected crash'));

            const result = await syncAndSaveHealthData(userId, startDate, endDate);

            expect(result.success).toBe(false);
            expect(result.synced).toBe(0);
            expect(result.error.message).toBe('Unexpected crash');
        });
    });

    // =========================================================================
    // detectMeaningfulChanges
    // =========================================================================
    describe('detectMeaningfulChanges', () => {
        it('returns empty arrays when metrics is null', () => {
            const result = detectMeaningfulChanges(null);
            expect(result.changes).toEqual([]);
            expect(result.improvements).toEqual([]);
        });

        it('returns empty arrays when fewer than 2 metrics', () => {
            const result = detectMeaningfulChanges([{ walking_speed_avg: 1.2 }]);
            expect(result.changes).toEqual([]);
            expect(result.improvements).toEqual([]);
        });

        it('returns empty arrays when not enough data for previous period', () => {
            // Only 7 entries => recent=7, previous=0
            const metrics = Array.from({ length: 7 }, (_, i) => ({
                walking_speed_avg: 1.2,
                walking_step_length_avg: 0.7,
            }));
            const result = detectMeaningfulChanges(metrics);
            expect(result.changes).toEqual([]);
            expect(result.improvements).toEqual([]);
        });

        it('detects walking speed improvement above MCID threshold', () => {
            // 14 entries: first 7 with speed 1.0, last 7 with speed 1.1 (diff = 0.1 > 0.05 threshold)
            const metrics = [
                ...Array.from({ length: 7 }, () => ({ walking_speed_avg: 1.0, walking_step_length_avg: 0.7 })),
                ...Array.from({ length: 7 }, () => ({ walking_speed_avg: 1.1, walking_step_length_avg: 0.7 })),
            ];

            const result = detectMeaningfulChanges(metrics);

            expect(result.changes.length).toBeGreaterThanOrEqual(1);
            const speedChange = result.changes.find(c => c.metric === 'walking_speed');
            expect(speedChange).toBeDefined();
            expect(speedChange.isImprovement).toBe(true);
            expect(result.improvements.find(i => i.metric === 'walking_speed')).toBeDefined();
        });

        it('detects walking speed decline', () => {
            const metrics = [
                ...Array.from({ length: 7 }, () => ({ walking_speed_avg: 1.2, walking_step_length_avg: 0.7 })),
                ...Array.from({ length: 7 }, () => ({ walking_speed_avg: 1.0, walking_step_length_avg: 0.7 })),
            ];

            const result = detectMeaningfulChanges(metrics);

            const speedChange = result.changes.find(c => c.metric === 'walking_speed');
            expect(speedChange).toBeDefined();
            expect(speedChange.isImprovement).toBe(false);
            // Should NOT be in improvements
            expect(result.improvements.find(i => i.metric === 'walking_speed')).toBeUndefined();
        });

        it('does not flag changes below MCID threshold', () => {
            // Diff = 0.02 < 0.05 threshold
            const metrics = [
                ...Array.from({ length: 7 }, () => ({ walking_speed_avg: 1.0, walking_step_length_avg: 0.7 })),
                ...Array.from({ length: 7 }, () => ({ walking_speed_avg: 1.02, walking_step_length_avg: 0.7 })),
            ];

            const result = detectMeaningfulChanges(metrics);

            const speedChange = result.changes.find(c => c.metric === 'walking_speed');
            expect(speedChange).toBeUndefined();
        });

        it('detects step length improvement above threshold', () => {
            // 6% increase > 5% threshold
            const metrics = [
                ...Array.from({ length: 7 }, () => ({ walking_speed_avg: 1.0, walking_step_length_avg: 0.5 })),
                ...Array.from({ length: 7 }, () => ({ walking_speed_avg: 1.0, walking_step_length_avg: 0.535 })),
            ];

            const result = detectMeaningfulChanges(metrics);

            const lengthChange = result.changes.find(c => c.metric === 'step_length');
            expect(lengthChange).toBeDefined();
            expect(lengthChange.isImprovement).toBe(true);
        });

        it('handles metrics with null speed values', () => {
            const metrics = [
                ...Array.from({ length: 7 }, () => ({ walking_speed_avg: null, walking_step_length_avg: null })),
                ...Array.from({ length: 7 }, () => ({ walking_speed_avg: null, walking_step_length_avg: null })),
            ];

            const result = detectMeaningfulChanges(metrics);
            expect(result.changes).toEqual([]);
            expect(result.improvements).toEqual([]);
        });

        it('handles more than 14 metrics (uses last 14)', () => {
            const metrics = [
                ...Array.from({ length: 10 }, () => ({ walking_speed_avg: 0.8, walking_step_length_avg: 0.5 })),
                ...Array.from({ length: 7 }, () => ({ walking_speed_avg: 1.0, walking_step_length_avg: 0.5 })),
                ...Array.from({ length: 7 }, () => ({ walking_speed_avg: 1.2, walking_step_length_avg: 0.5 })),
            ];

            const result = detectMeaningfulChanges(metrics);

            // Should compare last 7 (1.2 avg) with previous 7 (1.0 avg)
            const speedChange = result.changes.find(c => c.metric === 'walking_speed');
            expect(speedChange).toBeDefined();
            expect(speedChange.isImprovement).toBe(true);
        });
    });

    // =========================================================================
    // getHealthMetricsSummary
    // =========================================================================
    describe('getHealthMetricsSummary', () => {
        const userId = 'user-456';

        it('returns summary with data', async () => {
            SupabaseService.getHealthMetrics.mockResolvedValue({
                data: [
                    { walking_speed_avg: 1.2, step_count: 8000, walking_steadiness: 'OK' },
                    { walking_speed_avg: 1.3, step_count: 9000, walking_steadiness: 'OK' },
                    { walking_speed_avg: 1.1, step_count: 7000, walking_steadiness: 'Low' },
                ],
                error: null,
            });

            const result = await getHealthMetricsSummary(userId, 30);

            expect(result.error).toBeNull();
            expect(result.summary.hasData).toBe(true);
            expect(result.summary.daysWithData).toBe(3);
            expect(result.summary.latestSteadiness).toBe('OK');
            expect(result.summary.averageSpeed).toBeCloseTo(1.2, 1);
            expect(result.summary.averageSteps).toBe(8000);
        });

        it('returns empty summary when no metrics exist', async () => {
            SupabaseService.getHealthMetrics.mockResolvedValue({ data: [], error: null });

            const result = await getHealthMetricsSummary(userId);

            expect(result.error).toBeNull();
            expect(result.summary.hasData).toBe(false);
            expect(result.summary.daysWithData).toBe(0);
            expect(result.summary.averageSpeed).toBeNull();
            expect(result.summary.averageSteps).toBeNull();
        });

        it('returns empty summary when data is null', async () => {
            SupabaseService.getHealthMetrics.mockResolvedValue({ data: null, error: null });

            const result = await getHealthMetricsSummary(userId);

            expect(result.summary.hasData).toBe(false);
        });

        it('returns error when database query fails', async () => {
            const dbError = new Error('Connection lost');
            SupabaseService.getHealthMetrics.mockResolvedValue({ data: null, error: dbError });

            const result = await getHealthMetricsSummary(userId);

            expect(result.summary).toBeNull();
            expect(result.error).toBe(dbError);
        });

        it('handles exception gracefully', async () => {
            SupabaseService.getHealthMetrics.mockRejectedValue(new Error('Unexpected'));

            const result = await getHealthMetricsSummary(userId);

            expect(result.summary).toBeNull();
            expect(result.error.message).toBe('Unexpected');
        });

        it('handles metrics with null speed and step values', async () => {
            SupabaseService.getHealthMetrics.mockResolvedValue({
                data: [
                    { walking_speed_avg: null, step_count: null, walking_steadiness: null },
                ],
                error: null,
            });

            const result = await getHealthMetricsSummary(userId);

            expect(result.summary.hasData).toBe(true);
            expect(result.summary.daysWithData).toBe(1);
            expect(result.summary.averageSpeed).toBeNull();
            expect(result.summary.averageSteps).toBeNull();
            expect(result.summary.latestSteadiness).toBeNull();
        });

        it('uses default of 30 days when days param is omitted', async () => {
            SupabaseService.getHealthMetrics.mockResolvedValue({ data: [], error: null });

            await getHealthMetricsSummary(userId);

            expect(SupabaseService.getHealthMetrics).toHaveBeenCalledWith(
                userId,
                expect.any(Date),
                expect.any(Date),
            );
        });
    });
});
