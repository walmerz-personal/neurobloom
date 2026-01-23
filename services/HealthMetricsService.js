// services/HealthMetricsService.js
import * as HealthKitService from './HealthKitService';
import { SupabaseService } from './SupabaseService';

/**
 * Health Metrics Service
 * Processes, aggregates, and validates health data from HealthKit
 */

// Meaningful Change Detection thresholds (MCID)
const MCID_THRESHOLDS = {
    WALKING_SPEED: 0.05, // meters per second
    STEP_LENGTH_PERCENT: 5, // 5% change
    ASYMMETRY_PERCENT: 10, // 10% improvement
};

// Data quality thresholds
const QUALITY_THRESHOLDS = {
    MIN_WALKING_MINUTES: 10, // Minimum minutes of walking data for "good" quality
    MIN_SAMPLES: 3, // Minimum number of samples for reliable average
};

/**
 * Calculate daily aggregates from HealthKit samples
 * @param {Array} samples - Array of HealthKit samples
 * @param {string} metricType - Type of metric ('speed', 'length', 'percentage', 'count', 'distance')
 * @returns {Object} Aggregated data with average, min, max, count
 */
function aggregateDailySamples(samples, metricType) {
    if (!samples || samples.length === 0) {
        return { average: null, min: null, max: null, count: 0, values: [] };
    }

    const values = samples
        .map(sample => {
            // Extract value based on sample structure (may vary by library)
            const value = sample.value || sample.quantity || sample.amount;
            return typeof value === 'number' ? value : parseFloat(value);
        })
        .filter(val => !isNaN(val) && val > 0);

    if (values.length === 0) {
        return { average: null, min: null, max: null, count: 0, values: [] };
    }

    const sum = values.reduce((acc, val) => acc + val, 0);
    const average = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return {
        average: parseFloat(average.toFixed(3)),
        min: parseFloat(min.toFixed(3)),
        max: parseFloat(max.toFixed(3)),
        count: values.length,
        values,
    };
}

/**
 * Get most recent walking steadiness classification
 * @param {Array} samples - Array of steadiness event samples
 * @returns {string|null} - 'OK', 'Low', 'Very Low', or null
 */
function getLatestSteadiness(samples) {
    if (!samples || samples.length === 0) {
        return null;
    }

    // Sort by date (most recent first)
    const sorted = [...samples].sort((a, b) => {
        const dateA = new Date(a.startDate || a.date || a.timestamp);
        const dateB = new Date(b.startDate || b.date || b.timestamp);
        return dateB - dateA;
    });

    const latest = sorted[0];
    const value = latest.value || latest.categoryValue;

    // Map HealthKit category values to our text values
    // HealthKit uses: 0 = OK, 1 = Low, 2 = Very Low
    const steadinessMap = {
        0: 'OK',
        1: 'Low',
        2: 'Very Low',
        'OK': 'OK',
        'Low': 'Low',
        'Very Low': 'Very Low',
    };

    return steadinessMap[value] || null;
}

/**
 * Calculate daily step count total
 * @param {Array} samples - Array of step count samples
 * @returns {number} Total step count for the day
 */
function calculateDailyStepCount(samples) {
    if (!samples || samples.length === 0) {
        return null;
    }

    // Sum all step count samples for the day
    const total = samples.reduce((sum, sample) => {
        const value = sample.value || sample.quantity || sample.count || 0;
        return sum + (typeof value === 'number' ? value : parseFloat(value) || 0);
    }, 0);

    return Math.round(total);
}

/**
 * Calculate daily distance total
 * @param {Array} samples - Array of distance samples
 * @returns {number} Total distance in meters
 */
function calculateDailyDistance(samples) {
    if (!samples || samples.length === 0) {
        return null;
    }

    const total = samples.reduce((sum, sample) => {
        const value = sample.value || sample.quantity || sample.distance || 0;
        return sum + (typeof value === 'number' ? value : parseFloat(value) || 0);
    }, 0);

    return parseFloat(total.toFixed(2));
}

/**
 * Assess data quality based on sample count and duration
 * @param {Object} metrics - Aggregated metrics object
 * @returns {string} - 'good', 'fair', 'poor', or 'insufficient'
 */
function assessDataQuality(metrics) {
    const { sampleCount, walkingSpeedAvg } = metrics;

    if (!sampleCount || sampleCount === 0) {
        return 'insufficient';
    }

    if (sampleCount < QUALITY_THRESHOLDS.MIN_SAMPLES) {
        return 'poor';
    }

    // If we have walking speed data, it's a good indicator of quality
    if (walkingSpeedAvg && sampleCount >= QUALITY_THRESHOLDS.MIN_SAMPLES) {
        return 'good';
    }

    return 'fair';
}

/**
 * Detect device source from samples
 * @param {Array} samples - Array of HealthKit samples
 * @returns {string} - 'iPhone', 'Apple Watch', or 'Unknown'
 */
function detectDeviceSource(samples) {
    if (!samples || samples.length === 0) {
        return 'Unknown';
    }

    // Check first sample for device info
    const firstSample = samples[0];
    const source = firstSample.source?.name || firstSample.device?.name || '';

    if (source.toLowerCase().includes('iphone')) {
        return 'iPhone';
    } else if (source.toLowerCase().includes('watch')) {
        return 'Apple Watch';
    }

    return 'Unknown';
}

/**
 * Process and aggregate health data for a specific date
 * @param {Date} date - Date to process
 * @param {Object} rawData - Raw HealthKit data from syncHealthData
 * @returns {Object} Processed daily metrics
 */
export async function processDailyMetrics(date, rawData) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Filter samples for this specific date
    const filterByDate = (samples) => {
        if (!samples) return [];
        return samples.filter(sample => {
            const sampleDate = new Date(sample.startDate || sample.date || sample.timestamp);
            return sampleDate >= startOfDay && sampleDate <= endOfDay;
        });
    };

    const walkingSpeedSamples = filterByDate(rawData.walkingSpeed || []);
    const walkingStepLengthSamples = filterByDate(rawData.walkingStepLength || []);
    const walkingAsymmetrySamples = filterByDate(rawData.walkingAsymmetry || []);
    const walkingDoubleSupportSamples = filterByDate(rawData.walkingDoubleSupport || []);
    const walkingSteadinessSamples = filterByDate(rawData.walkingSteadiness || []);
    const sixMinuteWalkSamples = filterByDate(rawData.sixMinuteWalk || []);
    const stepCountSamples = filterByDate(rawData.stepCount || []);
    const distanceWalkedSamples = filterByDate(rawData.distanceWalked || []);

    // Aggregate metrics
    const walkingSpeedAgg = aggregateDailySamples(walkingSpeedSamples, 'speed');
    const walkingStepLengthAgg = aggregateDailySamples(walkingStepLengthSamples, 'length');
    const walkingAsymmetryAgg = aggregateDailySamples(walkingAsymmetrySamples, 'percentage');
    const walkingDoubleSupportAgg = aggregateDailySamples(walkingDoubleSupportSamples, 'percentage');

    const stepCount = calculateDailyStepCount(stepCountSamples);
    const distanceWalked = calculateDailyDistance(distanceWalkedSamples);
    const walkingSteadiness = getLatestSteadiness(walkingSteadinessSamples);

    // Get six-minute walk distance (usually a single value per test)
    const sixMinuteWalkDistance = sixMinuteWalkSamples.length > 0
        ? parseFloat((sixMinuteWalkSamples[0].value || sixMinuteWalkSamples[0].quantity || 0).toFixed(2))
        : null;

    // Calculate total sample count
    const totalSamples = walkingSpeedSamples.length + walkingStepLengthSamples.length;

    // Assess data quality
    const metrics = {
        walkingSpeedAvg: walkingSpeedAgg.average,
        walkingStepLengthAvg: walkingStepLengthAgg.average,
        walkingAsymmetryPercentage: walkingAsymmetryAgg.average,
        walkingDoubleSupportPercentage: walkingDoubleSupportAgg.average,
        walkingSteadiness,
        sixMinuteWalkDistance,
        stepCount,
        distanceWalked,
        sampleCount: totalSamples,
    };

    const dataQuality = assessDataQuality(metrics);
    const deviceSource = detectDeviceSource([
        ...walkingSpeedSamples,
        ...walkingStepLengthSamples,
    ]);

    return {
        metricDate: date.toISOString().split('T')[0],
        ...metrics,
        dataQuality,
        deviceSource,
    };
}

/**
 * Sync health data for a date range and save to database
 * @param {string} userId - User ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<{success: boolean, synced: number, error: Error|null}>}
 */
export async function syncAndSaveHealthData(userId, startDate, endDate) {
    try {
        // Check permissions first (userInitiated=true to verify with native HealthKit API)
        const { granted } = await HealthKitService.checkHealthKitPermissions(true);
        if (!granted) {
            return { success: false, synced: 0, error: new Error('HealthKit permissions not granted') };
        }

        // Sync raw data from HealthKit
        const { data: rawData, error: syncError } = await HealthKitService.syncHealthData(startDate, endDate);
        if (syncError || !rawData) {
            return { success: false, synced: 0, error: syncError || new Error('Failed to sync health data') };
        }

        // Process data for each day in range
        const date = new Date(startDate);
        let synced = 0;
        const errors = [];

        while (date <= endDate) {
            try {
                const dailyMetrics = await processDailyMetrics(new Date(date), rawData);
                
                // Save to database
                const { error: saveError } = await SupabaseService.saveHealthMetrics(userId, dailyMetrics);
                
                if (!saveError) {
                    synced++;
                } else {
                    errors.push({ date: date.toISOString().split('T')[0], error: saveError });
                }
            } catch (error) {
                errors.push({ date: date.toISOString().split('T')[0], error });
            }

            date.setDate(date.getDate() + 1);
        }

        if (errors.length > 0 && synced === 0) {
            return { success: false, synced: 0, error: errors[0].error };
        }

        return { success: true, synced, error: errors.length > 0 ? new Error(`Some dates failed: ${errors.length}`) : null };
    } catch (error) {
        console.error('❌ Error syncing and saving health data:', error);
        return { success: false, synced: 0, error };
    }
}

/**
 * Detect meaningful changes in health metrics
 * @param {Array} metrics - Array of daily metrics (sorted by date, oldest first)
 * @returns {Object} Detected changes and improvements
 */
export function detectMeaningfulChanges(metrics) {
    if (!metrics || metrics.length < 2) {
        return { changes: [], improvements: [] };
    }

    const changes = [];
    const improvements = [];

    // Compare last 7 days average with previous 7 days average
    const recent = metrics.slice(-7);
    const previous = metrics.slice(-14, -7);

    if (previous.length === 0) {
        return { changes: [], improvements: [] };
    }

    // Walking speed change
    const recentSpeed = recent
        .map(m => m.walking_speed_avg)
        .filter(v => v !== null && v !== undefined);
    const previousSpeed = previous
        .map(m => m.walking_speed_avg)
        .filter(v => v !== null && v !== undefined);

    if (recentSpeed.length > 0 && previousSpeed.length > 0) {
        const recentAvg = recentSpeed.reduce((a, b) => a + b, 0) / recentSpeed.length;
        const previousAvg = previousSpeed.reduce((a, b) => a + b, 0) / previousSpeed.length;
        const change = recentAvg - previousAvg;

        if (Math.abs(change) >= MCID_THRESHOLDS.WALKING_SPEED) {
            changes.push({
                metric: 'walking_speed',
                change: change,
                changePercent: ((change / previousAvg) * 100).toFixed(1),
                isImprovement: change > 0,
            });

            if (change > 0) {
                improvements.push({
                    metric: 'walking_speed',
                    message: `Your walking speed improved by ${(change * 100).toFixed(0)} cm/s!`,
                });
            }
        }
    }

    // Step length change
    const recentLength = recent
        .map(m => m.walking_step_length_avg)
        .filter(v => v !== null && v !== undefined);
    const previousLength = previous
        .map(m => m.walking_step_length_avg)
        .filter(v => v !== null && v !== undefined);

    if (recentLength.length > 0 && previousLength.length > 0) {
        const recentAvg = recentLength.reduce((a, b) => a + b, 0) / recentLength.length;
        const previousAvg = previousLength.reduce((a, b) => a + b, 0) / previousLength.length;
        const changePercent = ((recentAvg - previousAvg) / previousAvg) * 100;

        if (Math.abs(changePercent) >= MCID_THRESHOLDS.STEP_LENGTH_PERCENT) {
            changes.push({
                metric: 'step_length',
                change: changePercent,
                changePercent: changePercent.toFixed(1),
                isImprovement: changePercent > 0,
            });

            if (changePercent > 0) {
                improvements.push({
                    metric: 'step_length',
                    message: `Your step length increased by ${changePercent.toFixed(1)}%!`,
                });
            }
        }
    }

    return { changes, improvements };
}

/**
 * Get health metrics summary for a user
 * @param {string} userId - User ID
 * @param {number} days - Number of days to look back
 * @returns {Promise<{summary: Object, error: Error|null}>}
 */
export async function getHealthMetricsSummary(userId, days = 30) {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data: metrics, error } = await SupabaseService.getHealthMetrics(userId, startDate, endDate);

        if (error) {
            return { summary: null, error };
        }

        if (!metrics || metrics.length === 0) {
            return {
                summary: {
                    hasData: false,
                    daysWithData: 0,
                    latestSteadiness: null,
                    averageSpeed: null,
                    averageSteps: null,
                },
                error: null,
            };
        }

        const daysWithData = metrics.length;
        const latestSteadiness = metrics[0]?.walking_steadiness || null;

        const speeds = metrics
            .map(m => m.walking_speed_avg)
            .filter(v => v !== null && v !== undefined);
        const averageSpeed = speeds.length > 0
            ? speeds.reduce((a, b) => a + b, 0) / speeds.length
            : null;

        const steps = metrics
            .map(m => m.step_count)
            .filter(v => v !== null && v !== undefined);
        const averageSteps = steps.length > 0
            ? Math.round(steps.reduce((a, b) => a + b, 0) / steps.length)
            : null;

        return {
            summary: {
                hasData: true,
                daysWithData,
                latestSteadiness,
                averageSpeed: averageSpeed ? parseFloat(averageSpeed.toFixed(3)) : null,
                averageSteps,
            },
            error: null,
        };
    } catch (error) {
        console.error('❌ Error getting health metrics summary:', error);
        return { summary: null, error };
    }
}

export default {
    processDailyMetrics,
    syncAndSaveHealthData,
    detectMeaningfulChanges,
    getHealthMetricsSummary,
};
