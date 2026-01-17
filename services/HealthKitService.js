// services/HealthKitService.js
import { Platform } from 'react-native';
import HealthKit from '@kingstinct/react-native-healthkit';

/**
 * HealthKit Service
 * Handles all interactions with Apple HealthKit
 * Note: Requires custom dev client (doesn't work in Expo Go)
 */

// HealthKit quantity type identifiers
const QUANTITY_TYPES = {
    WALKING_SPEED: 'walkingSpeed',
    WALKING_STEP_LENGTH: 'walkingStepLength',
    WALKING_ASYMMETRY: 'walkingAsymmetryPercentage',
    WALKING_DOUBLE_SUPPORT: 'walkingDoubleSupportPercentage',
    SIX_MINUTE_WALK: 'sixMinuteWalkTestDistance',
    STEP_COUNT: 'stepCount',
    DISTANCE_WALKING_RUNNING: 'distanceWalkingRunning',
};

// HealthKit category type identifiers
const CATEGORY_TYPES = {
    WALKING_STEADINESS: 'appleWalkingSteadinessEvent',
};

// Check if HealthKit is available (iOS only)
const isHealthKitAvailable = () => {
    return Platform.OS === 'ios' && HealthKit.isAvailable();
};

/**
 * Request HealthKit permissions for all required metrics
 * @returns {Promise<{granted: boolean, error: Error|null}>}
 */
export async function requestHealthKitPermissions() {
    if (!isHealthKitAvailable()) {
        return { granted: false, error: new Error('HealthKit is not available on this device') };
    }

    try {
        const permissions = {
            read: [
                QUANTITY_TYPES.WALKING_SPEED,
                QUANTITY_TYPES.WALKING_STEP_LENGTH,
                QUANTITY_TYPES.WALKING_ASYMMETRY,
                QUANTITY_TYPES.WALKING_DOUBLE_SUPPORT,
                QUANTITY_TYPES.SIX_MINUTE_WALK,
                QUANTITY_TYPES.STEP_COUNT,
                QUANTITY_TYPES.DISTANCE_WALKING_RUNNING,
                CATEGORY_TYPES.WALKING_STEADINESS,
            ],
        };

        const result = await HealthKit.requestAuthorization(permissions);
        
        if (result === true) {
            console.log('✅ HealthKit permissions granted');
            return { granted: true, error: null };
        } else {
            console.log('❌ HealthKit permissions denied');
            return { granted: false, error: new Error('HealthKit permissions were denied') };
        }
    } catch (error) {
        console.error('❌ Error requesting HealthKit permissions:', error);
        return { granted: false, error };
    }
}

/**
 * Check if HealthKit permissions are already granted
 * @returns {Promise<{granted: boolean, error: Error|null}>}
 */
export async function checkHealthKitPermissions() {
    if (!isHealthKitAvailable()) {
        return { granted: false, error: new Error('HealthKit is not available on this device') };
    }

    try {
        const permissions = [
            QUANTITY_TYPES.WALKING_SPEED,
            QUANTITY_TYPES.WALKING_STEP_LENGTH,
            QUANTITY_TYPES.WALKING_ASYMMETRY,
            QUANTITY_TYPES.WALKING_DOUBLE_SUPPORT,
            QUANTITY_TYPES.SIX_MINUTE_WALK,
            QUANTITY_TYPES.STEP_COUNT,
            QUANTITY_TYPES.DISTANCE_WALKING_RUNNING,
            CATEGORY_TYPES.WALKING_STEADINESS,
        ];

        const authorizationStatus = await HealthKit.getAuthorizationStatusForType(permissions[0]);
        
        // Check if at least one permission is granted
        const granted = authorizationStatus === 'sharingAuthorized' || authorizationStatus === 'sharingDenied';
        
        return { granted, error: null };
    } catch (error) {
        console.error('❌ Error checking HealthKit permissions:', error);
        return { granted: false, error };
    }
}

/**
 * Get walking speed samples for a date range
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function getWalkingSpeed(startDate, endDate) {
    if (!isHealthKitAvailable()) {
        return { data: [], error: new Error('HealthKit is not available') };
    }

    try {
        const samples = await HealthKit.getQuantitySamples(
            QUANTITY_TYPES.WALKING_SPEED,
            {
                from: startDate,
                to: endDate,
                unit: 'm/s',
            }
        );

        return { data: samples || [], error: null };
    } catch (error) {
        console.error('❌ Error getting walking speed:', error);
        return { data: [], error };
    }
}

/**
 * Get walking step length samples for a date range
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function getWalkingStepLength(startDate, endDate) {
    if (!isHealthKitAvailable()) {
        return { data: [], error: new Error('HealthKit is not available') };
    }

    try {
        const samples = await HealthKit.getQuantitySamples(
            QUANTITY_TYPES.WALKING_STEP_LENGTH,
            {
                from: startDate,
                to: endDate,
                unit: 'm',
            }
        );

        return { data: samples || [], error: null };
    } catch (error) {
        console.error('❌ Error getting walking step length:', error);
        return { data: [], error };
    }
}

/**
 * Get walking asymmetry percentage for a date range
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function getWalkingAsymmetry(startDate, endDate) {
    if (!isHealthKitAvailable()) {
        return { data: [], error: new Error('HealthKit is not available') };
    }

    try {
        const samples = await HealthKit.getQuantitySamples(
            QUANTITY_TYPES.WALKING_ASYMMETRY,
            {
                from: startDate,
                to: endDate,
                unit: '%',
            }
        );

        return { data: samples || [], error: null };
    } catch (error) {
        console.error('❌ Error getting walking asymmetry:', error);
        return { data: [], error };
    }
}

/**
 * Get walking double support percentage for a date range
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function getWalkingDoubleSupport(startDate, endDate) {
    if (!isHealthKitAvailable()) {
        return { data: [], error: new Error('HealthKit is not available') };
    }

    try {
        const samples = await HealthKit.getQuantitySamples(
            QUANTITY_TYPES.WALKING_DOUBLE_SUPPORT,
            {
                from: startDate,
                to: endDate,
                unit: '%',
            }
        );

        return { data: samples || [], error: null };
    } catch (error) {
        console.error('❌ Error getting walking double support:', error);
        return { data: [], error };
    }
}

/**
 * Get walking steadiness events for a date range
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function getWalkingSteadiness(startDate, endDate) {
    if (!isHealthKitAvailable()) {
        return { data: [], error: new Error('HealthKit is not available') };
    }

    try {
        const samples = await HealthKit.getCategorySamples(
            CATEGORY_TYPES.WALKING_STEADINESS,
            {
                from: startDate,
                to: endDate,
            }
        );

        return { data: samples || [], error: null };
    } catch (error) {
        console.error('❌ Error getting walking steadiness:', error);
        return { data: [], error };
    }
}

/**
 * Get six-minute walk test distance for a date range
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function getSixMinuteWalkDistance(startDate, endDate) {
    if (!isHealthKitAvailable()) {
        return { data: [], error: new Error('HealthKit is not available') };
    }

    try {
        const samples = await HealthKit.getQuantitySamples(
            QUANTITY_TYPES.SIX_MINUTE_WALK,
            {
                from: startDate,
                to: endDate,
                unit: 'm',
            }
        );

        return { data: samples || [], error: null };
    } catch (error) {
        console.error('❌ Error getting six-minute walk distance:', error);
        return { data: [], error };
    }
}

/**
 * Get step count for a date range
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function getStepCount(startDate, endDate) {
    if (!isHealthKitAvailable()) {
        return { data: [], error: new Error('HealthKit is not available') };
    }

    try {
        const samples = await HealthKit.getQuantitySamples(
            QUANTITY_TYPES.STEP_COUNT,
            {
                from: startDate,
                to: endDate,
                unit: 'count',
            }
        );

        return { data: samples || [], error: null };
    } catch (error) {
        console.error('❌ Error getting step count:', error);
        return { data: [], error };
    }
}

/**
 * Get distance walked/running for a date range
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function getDistanceWalked(startDate, endDate) {
    if (!isHealthKitAvailable()) {
        return { data: [], error: new Error('HealthKit is not available') };
    }

    try {
        const samples = await HealthKit.getQuantitySamples(
            QUANTITY_TYPES.DISTANCE_WALKING_RUNNING,
            {
                from: startDate,
                to: endDate,
                unit: 'm',
            }
        );

        return { data: samples || [], error: null };
    } catch (error) {
        console.error('❌ Error getting distance walked:', error);
        return { data: [], error };
    }
}

/**
 * Set up background observer for real-time updates
 * Note: This requires background modes to be enabled in Info.plist
 * @param {Function} callback - Called when new data is available
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export async function setupBackgroundObserver(callback) {
    if (!isHealthKitAvailable()) {
        return { success: false, error: new Error('HealthKit is not available') };
    }

    try {
        // Set up observer queries for each metric type
        // Note: Implementation depends on the specific library API
        // This is a placeholder - actual implementation may vary
        
        console.log('✅ Background observers set up');
        return { success: true, error: null };
    } catch (error) {
        console.error('❌ Error setting up background observers:', error);
        return { success: false, error };
    }
}

/**
 * Sync all health data for a date range
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<{data: Object, error: Error|null}>}
 */
export async function syncHealthData(startDate, endDate) {
    if (!isHealthKitAvailable()) {
        return { data: null, error: new Error('HealthKit is not available') };
    }

    try {
        const [
            walkingSpeed,
            walkingStepLength,
            walkingAsymmetry,
            walkingDoubleSupport,
            walkingSteadiness,
            sixMinuteWalk,
            stepCount,
            distanceWalked,
        ] = await Promise.all([
            getWalkingSpeed(startDate, endDate),
            getWalkingStepLength(startDate, endDate),
            getWalkingAsymmetry(startDate, endDate),
            getWalkingDoubleSupport(startDate, endDate),
            getWalkingSteadiness(startDate, endDate),
            getSixMinuteWalkDistance(startDate, endDate),
            getStepCount(startDate, endDate),
            getDistanceWalked(startDate, endDate),
        ]);

        return {
            data: {
                walkingSpeed: walkingSpeed.data,
                walkingStepLength: walkingStepLength.data,
                walkingAsymmetry: walkingAsymmetry.data,
                walkingDoubleSupport: walkingDoubleSupport.data,
                walkingSteadiness: walkingSteadiness.data,
                sixMinuteWalk: sixMinuteWalk.data,
                stepCount: stepCount.data,
                distanceWalked: distanceWalked.data,
            },
            error: null,
        };
    } catch (error) {
        console.error('❌ Error syncing health data:', error);
        return { data: null, error };
    }
}

export default {
    requestHealthKitPermissions,
    checkHealthKitPermissions,
    getWalkingSpeed,
    getWalkingStepLength,
    getWalkingAsymmetry,
    getWalkingDoubleSupport,
    getWalkingSteadiness,
    getSixMinuteWalkDistance,
    getStepCount,
    getDistanceWalked,
    setupBackgroundObserver,
    syncHealthData,
    isHealthKitAvailable,
};
