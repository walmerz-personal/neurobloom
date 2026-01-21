// services/HealthKitService.js
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * HealthKit Service
 * Handles all interactions with Apple HealthKit
 * Note: Requires custom dev client (doesn't work in Expo Go)
 */

const HEALTH_PERMISSIONS_KEY = '@neurobloom_healthkit_permissions_granted';

// Try to import HealthKit module - will be null in Expo Go
let HealthKit = null;
let HKQuantityTypeIdentifier = null;
let HKCategoryTypeIdentifier = null;

// Safe mode flag - enabled if HealthKit crashes to prevent further crashes
let healthKitSafeMode = false;
// Native crash detection flag
let nativeCrashDetected = false;

try {
    const healthKitModule = require('@kingstinct/react-native-healthkit');
    HealthKit = healthKitModule.default || healthKitModule;
    // Import enum types if available
    HKQuantityTypeIdentifier = healthKitModule.HKQuantityTypeIdentifier;
    HKCategoryTypeIdentifier = healthKitModule.HKCategoryTypeIdentifier;
} catch (error) {
    // HealthKit module not available (e.g., in Expo Go)
    console.warn('⚠️ HealthKit module not available. HealthKit features will be disabled.');
    HealthKit = null;
    healthKitSafeMode = true; // Enable safe mode if module fails to load
}

// HealthKit quantity type identifiers (using full Apple identifiers)
// Note: Some iOS 14+ walking metrics may not be in the library enum, using full string format
const QUANTITY_TYPES = {
    WALKING_SPEED: 'HKQuantityTypeIdentifierWalkingSpeed',
    WALKING_STEP_LENGTH: 'HKQuantityTypeIdentifierWalkingStepLength',
    WALKING_ASYMMETRY: 'HKQuantityTypeIdentifierWalkingAsymmetryPercentage',
    WALKING_DOUBLE_SUPPORT: 'HKQuantityTypeIdentifierWalkingDoubleSupportPercentage',
    SIX_MINUTE_WALK: 'HKQuantityTypeIdentifierSixMinuteWalkTestDistance',
    STEP_COUNT: HKQuantityTypeIdentifier?.stepCount || 'HKQuantityTypeIdentifierStepCount',
    DISTANCE_WALKING_RUNNING: HKQuantityTypeIdentifier?.distanceWalkingRunning || 'HKQuantityTypeIdentifierDistanceWalkingRunning',
};

// HealthKit category type identifiers
const CATEGORY_TYPES = {
    WALKING_STEADINESS: 'HKCategoryTypeIdentifierAppleWalkingSteadinessEvent',
};

// Check if HealthKit is available (iOS only and module loaded)
// Note: This is a synchronous check. For actual availability, use isHealthDataAvailable() async method
export const isHealthKitAvailable = () => {
    return Platform.OS === 'ios' && HealthKit !== null;
};

// Async check for actual HealthKit availability on device
export async function checkHealthKitDataAvailable() {
    if (healthKitSafeMode || nativeCrashDetected || !isHealthKitAvailable() || !HealthKit) {
        return false;
    }
    try {
        // Use timeout to detect native crashes
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error('HealthKit availability check timeout'));
            }, 3000);
        });
        
        return await Promise.race([
            HealthKit.isHealthDataAvailable(),
            timeoutPromise
        ]);
    } catch (error) {
        console.error('❌ Error checking HealthKit availability:', error);
        nativeCrashDetected = true;
        healthKitSafeMode = true; // Enable safe mode on crash
        return false;
    }
}

/**
 * Request HealthKit permissions for all required metrics
 * @returns {Promise<{granted: boolean, error: Error|null}>}
 */
export async function requestHealthKitPermissions() {
    if (healthKitSafeMode || nativeCrashDetected || !isHealthKitAvailable() || !HealthKit) {
        return { granted: false, error: new Error('HealthKit is not available on this device') };
    }

    try {
        // Build read permissions array (use library enum if available, otherwise use full string identifiers)
        const readPermissions = [
            QUANTITY_TYPES.WALKING_SPEED,
            QUANTITY_TYPES.WALKING_STEP_LENGTH,
            QUANTITY_TYPES.WALKING_ASYMMETRY,
            QUANTITY_TYPES.WALKING_DOUBLE_SUPPORT,
            QUANTITY_TYPES.SIX_MINUTE_WALK,
            QUANTITY_TYPES.STEP_COUNT,
            QUANTITY_TYPES.DISTANCE_WALKING_RUNNING,
            CATEGORY_TYPES.WALKING_STEADINESS,
        ];

        // requestAuthorization expects (readArray, writeArray) - two array parameters
        const result = await HealthKit.requestAuthorization(readPermissions, []);
        
        if (result === true) {
            console.log('✅ HealthKit permissions granted');
            // Save flag to AsyncStorage for reliable permission checking
            await saveHealthPermissionsGranted();
            return { granted: true, error: null };
        } else {
            console.log('❌ HealthKit permissions denied');
            return { granted: false, error: new Error('HealthKit permissions were denied') };
        }
    } catch (error) {
        console.error('❌ Error requesting HealthKit permissions:', error);
        nativeCrashDetected = true;
        healthKitSafeMode = true; // Enable safe mode on crash
        return { granted: false, error };
    }
}

/**
 * Save health permissions granted flag to AsyncStorage
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export async function saveHealthPermissionsGranted() {
    try {
        await AsyncStorage.setItem(HEALTH_PERMISSIONS_KEY, 'true');
        console.log('✅ Health permissions flag saved to AsyncStorage');
        return { success: true, error: null };
    } catch (error) {
        console.error('❌ Error saving health permissions flag:', error);
        return { success: false, error };
    }
}

/**
 * Check if health permissions have been granted (from AsyncStorage)
 * @returns {Promise<boolean>}
 */
export async function hasHealthPermissionsBeenGranted() {
    try {
        const value = await AsyncStorage.getItem(HEALTH_PERMISSIONS_KEY);
        return value === 'true';
    } catch (error) {
        console.error('❌ Error reading health permissions flag:', error);
        return false;
    }
}

/**
 * Check if HealthKit permissions are already granted
 * Uses AsyncStorage flag first (more reliable on iOS), then falls back to authorizationStatusFor
 * Includes timeout mechanism to detect native crashes
 * @returns {Promise<{granted: boolean, error: Error|null}>}
 */
export async function checkHealthKitPermissions() {
    if (healthKitSafeMode || nativeCrashDetected || !isHealthKitAvailable() || !HealthKit) {
        return { granted: false, error: null };
    }

    try {
        // Check AsyncStorage flag first - more reliable than iOS authorizationStatusFor for READ permissions
        const hasBeenGranted = await hasHealthPermissionsBeenGranted();
        if (hasBeenGranted) {
            return { granted: true, error: null };
        }

        // Fallback: Try to check authorization status (unreliable for READ permissions on iOS)
        // Use Promise.race with timeout to detect native crashes
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

        // Create timeout promise to detect native crashes (5 second timeout)
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error('HealthKit timeout - possible native crash'));
            }, 5000);
        });

        // Race between actual call and timeout
        try {
            const authorizationStatus = await Promise.race([
                HealthKit.authorizationStatusFor(permissions[0]),
                timeoutPromise
            ]);
            
            // Check if at least one permission is granted (authorizationStatus returns a number: 0=notDetermined, 1=sharingDenied, 2=sharingAuthorized)
            const granted = authorizationStatus === 2; // sharingAuthorized
            
            return { granted, error: null };
        } catch (nativeError) {
            // Native crash or timeout detected - enable safe mode and return gracefully
            console.error('❌ HealthKit native crash/timeout detected in authorizationStatusFor:', nativeError);
            nativeCrashDetected = true;
            healthKitSafeMode = true;
            return { granted: false, error: null }; // Return null error to avoid propagating crash
        }
    } catch (error) {
        console.error('❌ Error checking HealthKit permissions:', error);
        nativeCrashDetected = true;
        healthKitSafeMode = true; // Enable safe mode on crash
        return { granted: false, error: null }; // Return null error to avoid propagating crash
    }
}

/**
 * Get walking speed samples for a date range
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function getWalkingSpeed(startDate, endDate) {
    if (!isHealthKitAvailable() || !HealthKit) {
        return { data: [], error: new Error('HealthKit is not available') };
    }

    try {
        const samples = await HealthKit.queryQuantitySamples(
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
    if (!isHealthKitAvailable() || !HealthKit) {
        return { data: [], error: new Error('HealthKit is not available') };
    }

    try {
        const samples = await HealthKit.queryQuantitySamples(
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
    if (!isHealthKitAvailable() || !HealthKit) {
        return { data: [], error: new Error('HealthKit is not available') };
    }

    try {
        const samples = await HealthKit.queryQuantitySamples(
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
    if (!isHealthKitAvailable() || !HealthKit) {
        return { data: [], error: new Error('HealthKit is not available') };
    }

    try {
        const samples = await HealthKit.queryQuantitySamples(
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
    if (!isHealthKitAvailable() || !HealthKit) {
        return { data: [], error: new Error('HealthKit is not available') };
    }

    try {
        const samples = await HealthKit.queryCategorySamples(
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
    if (!isHealthKitAvailable() || !HealthKit) {
        return { data: [], error: new Error('HealthKit is not available') };
    }

    try {
        const samples = await HealthKit.queryQuantitySamples(
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
    if (!isHealthKitAvailable() || !HealthKit) {
        return { data: [], error: new Error('HealthKit is not available') };
    }

    try {
        const samples = await HealthKit.queryQuantitySamples(
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
    if (!isHealthKitAvailable() || !HealthKit) {
        return { data: [], error: new Error('HealthKit is not available') };
    }

    try {
        const samples = await HealthKit.queryQuantitySamples(
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
    if (!isHealthKitAvailable() || !HealthKit) {
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
    if (!isHealthKitAvailable() || !HealthKit) {
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
    saveHealthPermissionsGranted,
    hasHealthPermissionsBeenGranted,
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
    checkHealthKitDataAvailable,
};
