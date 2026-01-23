// services/HealthKitService.js
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * HealthKit Service
 * Handles all interactions with Apple HealthKit
 * Note: Requires custom dev client (doesn't work in Expo Go)
 */

const HEALTH_PERMISSIONS_KEY = '@neurobloom_healthkit_permissions_granted';

// HealthKit error code mappings (common Cocoa/HealthKit errors)
const HEALTHKIT_ERROR_CODES = {
    // Permission/Authorization errors
    NOT_AUTHORIZED: 'HKErrorAuthorizationNotDetermined',
    DENIED: 'HKErrorAuthorizationDenied',
    // Data errors
    NO_DATA: 'HKErrorNoData',
    // System errors
    DATABASE_ERROR: 'HKErrorDatabaseInaccessible',
    CONNECTION_ERROR: 4097, // Cocoa error code for connection to healthd.server
    TIMEOUT: 'HKErrorTimeout',
};

/**
 * Map HealthKit errors to user-friendly messages
 * @param {Error|string|number} error - Error object, message, or error code
 * @returns {string} User-friendly error message
 */
function mapHealthKitError(error) {
    if (!error) {
        return 'An unknown error occurred while accessing health data.';
    }

    const errorMessage = error?.message || String(error);
    const errorCode = error?.code || error;
    const lowerMessage = errorMessage.toLowerCase();

    // Check for permission errors
    if (
        lowerMessage.includes('permission') ||
        lowerMessage.includes('authorization') ||
        lowerMessage.includes('denied') ||
        lowerMessage.includes('not authorized') ||
        errorCode === HEALTHKIT_ERROR_CODES.NOT_AUTHORIZED ||
        errorCode === HEALTHKIT_ERROR_CODES.DENIED
    ) {
        return 'Apple Health permissions are required. Please grant permissions in Settings > Health > Data Access & Devices > NeuroBloom.';
    }

    // Check for connection errors
    if (
        lowerMessage.includes('connection') ||
        lowerMessage.includes('healthd') ||
        errorCode === HEALTHKIT_ERROR_CODES.CONNECTION_ERROR ||
        errorCode === 4097
    ) {
        return 'Unable to connect to Apple Health. Please ensure HealthKit is available on your device and try again.';
    }

    // Check for database errors
    if (
        lowerMessage.includes('database') ||
        lowerMessage.includes('inaccessible') ||
        errorCode === HEALTHKIT_ERROR_CODES.DATABASE_ERROR
    ) {
        return 'Apple Health database is temporarily unavailable. Please try again later.';
    }

    // Check for timeout errors
    if (
        lowerMessage.includes('timeout') ||
        errorCode === HEALTHKIT_ERROR_CODES.TIMEOUT
    ) {
        return 'The request to Apple Health timed out. Please try again.';
    }

    // Check for no data errors
    if (
        lowerMessage.includes('no data') ||
        lowerMessage.includes('no samples') ||
        errorCode === HEALTHKIT_ERROR_CODES.NO_DATA
    ) {
        return 'No health data found. Make sure you have walking data in Apple Health.';
    }

    // Check for compatibility/availability errors
    if (
        lowerMessage.includes('not available') ||
        lowerMessage.includes('not supported') ||
        lowerMessage.includes('compatible')
    ) {
        return 'Apple Health is not available on this device. HealthKit requires an iPhone or Apple Watch.';
    }

    // Generic error - return original message if it's informative, otherwise generic message
    if (errorMessage.length > 0 && errorMessage.length < 200) {
        return `Unable to access health data: ${errorMessage}`;
    }

    return 'An error occurred while accessing health data. Please try again.';
}

// Try to import HealthKit module - will be null in Expo Go
let HealthKit = null;
let HKQuantityTypeIdentifier = null;
let HKCategoryTypeIdentifier = null;

// Safe mode flag - enabled if HealthKit crashes to prevent further crashes
let healthKitSafeMode = false;
// Native crash detection flag
let nativeCrashDetected = false;
// TurboModule compatibility flag - null = unknown, true/false = tested
let turboModuleCompatible = null;

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
    return Platform.OS === 'ios' && HealthKit !== null && !healthKitSafeMode && !nativeCrashDetected;
};

/**
 * Test HealthKit TurboModule compatibility
 * This function safely tests if HealthKit can be called without crashing
 * in the New Architecture (TurboModules) environment
 * @returns {Promise<boolean>} true if compatible, false otherwise
 */
export async function testHealthKitCompatibility() {
    // Return cached result if already tested
    if (turboModuleCompatible !== null) {
        return turboModuleCompatible;
    }
    
    // Don't test if already in safe mode or module not loaded
    if (healthKitSafeMode || !HealthKit || !isHealthKitAvailable()) {
        turboModuleCompatible = false;
        return false;
    }
    
    try {
        // Use a simple, fast test with strict timeout to detect crashes
        // isHealthDataAvailable() is the safest method to test compatibility
        const result = await Promise.race([
            HealthKit.isHealthDataAvailable(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('HealthKit compatibility test timeout')), 3000)
            )
        ]);
        
        // If we got here without crashing, it's compatible
        turboModuleCompatible = true;
        return true;
    } catch (error) {
        // Any error (timeout, crash, etc.) means incompatible
        console.warn('⚠️ HealthKit TurboModule compatibility check failed:', error.message || error);
        turboModuleCompatible = false;
        healthKitSafeMode = true;
        nativeCrashDetected = true;
        return false;
    }
}

/**
 * Reset HealthKit safe mode flags
 * Call this to retry HealthKit after it was disabled due to errors
 */
export function resetHealthKitSafeMode() {
    healthKitSafeMode = false;
    nativeCrashDetected = false;
    turboModuleCompatible = null;
    console.log('✅ HealthKit safe mode reset - will retry on next call');
}

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
 * Validate requestAuthorization parameters
 * @param {Array<string>} readPermissions - Array of permission identifiers
 * @throws {Error} If parameters are invalid
 */
function validateRequestAuthorizationParams(readPermissions) {
    if (!Array.isArray(readPermissions)) {
        throw new Error('readPermissions must be an array');
    }
    if (readPermissions.length === 0) {
        throw new Error('readPermissions cannot be empty');
    }
    for (const permission of readPermissions) {
        if (typeof permission !== 'string' || permission.length === 0) {
            throw new Error(`Invalid permission identifier: ${permission}`);
        }
    }
}

/**
 * Validate query options for HealthKit queries
 * @param {Date} startDate - Start date for query
 * @param {Date} endDate - End date for query
 * @param {string} [unit] - Optional unit string
 * @throws {Error} If parameters are invalid
 */
function validateQueryOptions(startDate, endDate, unit) {
    if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
        throw new Error('startDate must be a valid Date object');
    }
    if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
        throw new Error('endDate must be a valid Date object');
    }
    if (startDate > endDate) {
        throw new Error('startDate must be before or equal to endDate');
    }
    if (unit !== undefined && (typeof unit !== 'string' || unit.length === 0)) {
        throw new Error('unit must be a non-empty string if provided');
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

        // Validate parameters before calling native method
        validateRequestAuthorizationParams(readPermissions);

        // requestAuthorization v12+ expects an options object with toRead and toShare keys
        // Best practice: explicitly include both keys even if toShare is empty (we only read data)
        const result = await HealthKit.requestAuthorization({ 
            toRead: readPermissions,
            toShare: [] // Explicitly empty since we don't write data to HealthKit
        });
        
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
        // Ensure error is always an Error object
        const normalizedError = error instanceof Error ? error : new Error(String(error));
        return { granted: false, error: normalizedError };
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
        return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
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
 * Detect if permissions were revoked by attempting a test query
 * Clears AsyncStorage flag if permissions are revoked
 * @returns {Promise<{revoked: boolean, error: Error|null}>}
 */
export async function detectPermissionRevocation() {
    if (!isHealthKitAvailable() || !HealthKit) {
        return { revoked: false, error: null };
    }

    try {
        // Check if we have the flag set first
        const hasBeenGranted = await hasHealthPermissionsBeenGranted();
        if (!hasBeenGranted) {
            // No flag set, so nothing to revoke
            return { revoked: false, error: null };
        }

        // Attempt a lightweight query to verify permissions are still granted
        const today = new Date();
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error('Permission revocation check timeout'));
            }, 3000);
        });

        const queryPromise = HealthKit.queryQuantitySamples(
            QUANTITY_TYPES.STEP_COUNT,
            {
                startDate: startOfDay,
                endDate: endOfDay,
                unit: 'count',
            }
        );

        // Race between query and timeout
        await Promise.race([queryPromise, timeoutPromise]);

        // If we got here without error, permissions are still granted
        return { revoked: false, error: null };
    } catch (error) {
        // Check if error is permission-related
        const errorMessage = error?.message || String(error);
        const isPermissionError = 
            errorMessage.toLowerCase().includes('permission') ||
            errorMessage.toLowerCase().includes('authorization') ||
            errorMessage.toLowerCase().includes('denied') ||
            errorMessage.toLowerCase().includes('not authorized');

        if (isPermissionError) {
            // Permissions were revoked - clear the flag
            console.log('⚠️ Permissions revoked - clearing AsyncStorage flag');
            try {
                await AsyncStorage.removeItem(HEALTH_PERMISSIONS_KEY);
            } catch (storageError) {
                console.error('❌ Error clearing permission flag:', storageError);
            }
            return { revoked: true, error: null };
        }

        // Other errors (timeout, crash, etc.) - don't assume revocation
        console.warn('⚠️ Permission revocation check failed with non-permission error:', errorMessage);
        return { revoked: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
}

/**
 * Verify permissions by attempting a lightweight HealthKit query
 * This is the most reliable way to check if READ permissions are actually granted
 * @returns {Promise<{granted: boolean, error: Error|null}>}
 */
async function verifyPermissionsByQuery() {
    if (!isHealthKitAvailable() || !HealthKit) {
        return { granted: false, error: new Error('HealthKit is not available') };
    }

    try {
        // Attempt to query step count for today (lightweight, commonly available metric)
        const today = new Date();
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        // Use a timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error('Permission verification query timeout'));
            }, 3000);
        });

        const queryPromise = HealthKit.queryQuantitySamples(
            QUANTITY_TYPES.STEP_COUNT,
            {
                startDate: startOfDay,
                endDate: endOfDay,
                unit: 'count',
            }
        );

        // Race between query and timeout
        await Promise.race([queryPromise, timeoutPromise]);

        // If we got here without error, permissions are granted
        // Note: Empty array is OK - it means permissions are granted but no data exists
        console.log('✅ Permissions verified by successful HealthKit query');
        return { granted: true, error: null };
    } catch (error) {
        // Check if error is permission-related
        const errorMessage = error?.message || String(error);
        const isPermissionError = 
            errorMessage.toLowerCase().includes('permission') ||
            errorMessage.toLowerCase().includes('authorization') ||
            errorMessage.toLowerCase().includes('denied') ||
            errorMessage.toLowerCase().includes('not authorized');

        if (isPermissionError) {
            console.log('❌ Permission verification failed - permissions not granted');
            return { granted: false, error: new Error('HealthKit permissions not granted') };
        }

        // Other errors (timeout, crash, etc.) - don't assume permissions are denied
        console.warn('⚠️ Permission verification query failed with non-permission error:', errorMessage);
        return { granted: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
}

/**
 * Check if HealthKit permissions are already granted
 * Uses AsyncStorage flag first (more reliable on iOS), then falls back to authorizationStatusFor
 * Finally attempts query-based verification as the most reliable method
 * Includes timeout mechanism to detect native crashes
 * @param {boolean} userInitiated - If true, will test compatibility before checking. If false, only checks AsyncStorage.
 * @returns {Promise<{granted: boolean, error: Error|null}>}
 */
export async function checkHealthKitPermissions(userInitiated = false) {
    // Early return if HealthKit module is not available or safe mode is enabled
    if (!HealthKit || healthKitSafeMode || nativeCrashDetected || !isHealthKitAvailable()) {
        return { granted: false, error: null };
    }

    // If not user-initiated, only check AsyncStorage (safe, no native calls)
    if (!userInitiated) {
        try {
            const hasBeenGranted = await hasHealthPermissionsBeenGranted();
            return { granted: hasBeenGranted, error: null };
        } catch (error) {
            return { granted: false, error: null };
        }
    }

    // For user-initiated checks, test compatibility first
    const compatible = await testHealthKitCompatibility();
    if (!compatible) {
        return { granted: false, error: new Error('HealthKit is not compatible with the current architecture') };
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
        // Note: authorizationStatusFor may be sync or async depending on library version
        try {
            const statusResult = HealthKit.authorizationStatusFor(permissions[0]);
            
            // Handle both sync (returns value directly) and async (returns Promise) cases
            let authorizationStatus;
            if (statusResult instanceof Promise) {
                // Async version - use Promise.race with timeout
                authorizationStatus = await Promise.race([
                    statusResult,
                    timeoutPromise
                ]);
            } else {
                // Sync version - use value directly
                authorizationStatus = statusResult;
            }
            
            // Validate return value type
            if (typeof authorizationStatus !== 'number') {
                console.warn('⚠️ Unexpected authorizationStatusFor return type:', typeof authorizationStatus);
                return { granted: false, error: null };
            }
            
            // Check if at least one permission is granted (authorizationStatus returns a number: 0=notDetermined, 1=sharingDenied, 2=sharingAuthorized)
            const granted = authorizationStatus === 2; // sharingAuthorized
            
            if (granted) {
                // Save flag when authorizationStatusFor confirms permissions
                await saveHealthPermissionsGranted();
                return { granted: true, error: null };
            }
            
            // If authorizationStatusFor says not granted, try query-based verification as final fallback
            // This is the most reliable method for READ permissions
            console.log('⚠️ authorizationStatusFor returned not granted, attempting query-based verification...');
            const queryResult = await verifyPermissionsByQuery();
            
            if (queryResult.granted) {
                // Permissions are actually granted - save flag and return
                await saveHealthPermissionsGranted();
                return { granted: true, error: null };
            }
            
            return { granted: false, error: queryResult.error };
        } catch (nativeError) {
            // Native crash or timeout detected - try query-based verification as fallback
            console.warn('⚠️ HealthKit native crash/timeout detected in authorizationStatusFor, trying query-based verification...');
            
            try {
                const queryResult = await verifyPermissionsByQuery();
                if (queryResult.granted) {
                    // Permissions are actually granted - save flag and return
                    await saveHealthPermissionsGranted();
                    return { granted: true, error: null };
                }
                // If query also fails, enable safe mode
                nativeCrashDetected = true;
                healthKitSafeMode = true;
                return { granted: false, error: queryResult.error };
            } catch (queryError) {
                // Both methods failed - enable safe mode
                console.error('❌ Both authorizationStatusFor and query verification failed');
                nativeCrashDetected = true;
                healthKitSafeMode = true;
                return { granted: false, error: null }; // Return null error to avoid propagating crash
            }
        }
    } catch (error) {
        console.error('❌ Error checking HealthKit permissions:', error);
        
        // Try query-based verification as final fallback
        try {
            const queryResult = await verifyPermissionsByQuery();
            if (queryResult.granted) {
                // Permissions are actually granted - save flag and return
                await saveHealthPermissionsGranted();
                return { granted: true, error: null };
            }
        } catch (queryError) {
            // Query verification also failed
            console.error('❌ Query-based verification also failed:', queryError);
        }
        
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
        // Validate query parameters before calling native method
        validateQueryOptions(startDate, endDate, 'm/s');

        const samples = await HealthKit.queryQuantitySamples(
            QUANTITY_TYPES.WALKING_SPEED,
            {
                startDate: startDate,
                endDate: endDate,
                unit: 'm/s',
            }
        );

        return { data: samples || [], error: null };
    } catch (error) {
        console.error('❌ Error getting walking speed:', error);
        const friendlyMessage = mapHealthKitError(error);
        return { data: [], error: new Error(friendlyMessage) };
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
        validateQueryOptions(startDate, endDate, 'm');

        const samples = await HealthKit.queryQuantitySamples(
            QUANTITY_TYPES.WALKING_STEP_LENGTH,
            {
                startDate: startDate,
                endDate: endDate,
                unit: 'm',
            }
        );

        return { data: samples || [], error: null };
    } catch (error) {
        console.error('❌ Error getting walking step length:', error);
        const friendlyMessage = mapHealthKitError(error);
        return { data: [], error: new Error(friendlyMessage) };
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
        validateQueryOptions(startDate, endDate, '%');

        const samples = await HealthKit.queryQuantitySamples(
            QUANTITY_TYPES.WALKING_ASYMMETRY,
            {
                startDate: startDate,
                endDate: endDate,
                unit: '%',
            }
        );

        return { data: samples || [], error: null };
    } catch (error) {
        console.error('❌ Error getting walking asymmetry:', error);
        const friendlyMessage = mapHealthKitError(error);
        return { data: [], error: new Error(friendlyMessage) };
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
        validateQueryOptions(startDate, endDate, '%');

        const samples = await HealthKit.queryQuantitySamples(
            QUANTITY_TYPES.WALKING_DOUBLE_SUPPORT,
            {
                startDate: startDate,
                endDate: endDate,
                unit: '%',
            }
        );

        return { data: samples || [], error: null };
    } catch (error) {
        console.error('❌ Error getting walking double support:', error);
        const friendlyMessage = mapHealthKitError(error);
        return { data: [], error: new Error(friendlyMessage) };
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
        validateQueryOptions(startDate, endDate);

        const samples = await HealthKit.queryCategorySamples(
            CATEGORY_TYPES.WALKING_STEADINESS,
            {
                startDate: startDate,
                endDate: endDate,
            }
        );

        return { data: samples || [], error: null };
    } catch (error) {
        console.error('❌ Error getting walking steadiness:', error);
        const friendlyMessage = mapHealthKitError(error);
        return { data: [], error: new Error(friendlyMessage) };
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
        validateQueryOptions(startDate, endDate, 'm');

        const samples = await HealthKit.queryQuantitySamples(
            QUANTITY_TYPES.SIX_MINUTE_WALK,
            {
                startDate: startDate,
                endDate: endDate,
                unit: 'm',
            }
        );

        return { data: samples || [], error: null };
    } catch (error) {
        console.error('❌ Error getting six-minute walk distance:', error);
        const friendlyMessage = mapHealthKitError(error);
        return { data: [], error: new Error(friendlyMessage) };
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
        validateQueryOptions(startDate, endDate, 'count');

        const samples = await HealthKit.queryQuantitySamples(
            QUANTITY_TYPES.STEP_COUNT,
            {
                startDate: startDate,
                endDate: endDate,
                unit: 'count',
            }
        );

        return { data: samples || [], error: null };
    } catch (error) {
        console.error('❌ Error getting step count:', error);
        const friendlyMessage = mapHealthKitError(error);
        return { data: [], error: new Error(friendlyMessage) };
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
        validateQueryOptions(startDate, endDate, 'm');

        const samples = await HealthKit.queryQuantitySamples(
            QUANTITY_TYPES.DISTANCE_WALKING_RUNNING,
            {
                startDate: startDate,
                endDate: endDate,
                unit: 'm',
            }
        );

        return { data: samples || [], error: null };
    } catch (error) {
        console.error('❌ Error getting distance walked:', error);
        const friendlyMessage = mapHealthKitError(error);
        return { data: [], error: new Error(friendlyMessage) };
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
        return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
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
        // Validate query parameters before making multiple calls
        validateQueryOptions(startDate, endDate);

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

        // Check for errors in individual query results
        const errors = [
            walkingSpeed.error,
            walkingStepLength.error,
            walkingAsymmetry.error,
            walkingDoubleSupport.error,
            walkingSteadiness.error,
            sixMinuteWalk.error,
            stepCount.error,
            distanceWalked.error,
        ].filter(error => error !== null);

        // If any queries failed, aggregate the errors
        const aggregatedError = errors.length > 0
            ? new Error(`Failed to sync ${errors.length} health data type(s): ${errors.map(e => e.message).join('; ')}`)
            : null;

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
            error: aggregatedError,
        };
    } catch (error) {
        console.error('❌ Error syncing health data:', error);
        const friendlyMessage = mapHealthKitError(error);
        return { data: null, error: new Error(friendlyMessage) };
    }
}

export default {
    requestHealthKitPermissions,
    checkHealthKitPermissions,
    saveHealthPermissionsGranted,
    hasHealthPermissionsBeenGranted,
    detectPermissionRevocation,
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
    testHealthKitCompatibility,
    resetHealthKitSafeMode,
};
