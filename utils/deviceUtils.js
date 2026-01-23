// utils/deviceUtils.js
import { Platform } from 'react-native';
import { NativeModules } from 'react-native';

/**
 * Check if the app is running on an iOS Simulator
 * @returns {Promise<boolean>} true if running on simulator, false otherwise
 */
export async function isSimulator() {
    if (Platform.OS !== 'ios') {
        return false;
    }

    try {
        // Try to use react-native-device-info if available
        if (NativeModules.RNDeviceInfo) {
            return NativeModules.RNDeviceInfo.isEmulator === true;
        }
        
        // Fallback: Check if we can access HealthKit (simulators don't support it)
        // This is a heuristic - if HealthKit module exists but returns false for availability,
        // we're likely on a simulator
        return false; // Default to false, let HealthKit service handle the check
    } catch (error) {
        console.warn('Could not determine if running on simulator:', error);
        return false;
    }
}

/**
 * Get a user-friendly message about HealthKit availability
 * @returns {string} Message explaining HealthKit requirements
 */
export function getHealthKitAvailabilityMessage() {
    if (Platform.OS !== 'ios') {
        return 'Apple Health integration is only available on iOS devices.';
    }
    
    return 'Apple Health integration requires a physical iPhone. HealthKit is not available on the iOS Simulator. To test this feature, please run the app on a connected iPhone using: npx expo run:ios --device';
}
