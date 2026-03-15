// services/UserProfileService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_KEY = '@neurobloom_user_profile';

/**
 * User Profile Service
 * Manages user profile data collected during onboarding
 */

/**
 * Save user profile to AsyncStorage
 * @param {Object} profileData - The complete user profile
 * @param {string} profileData.role - 'survivor' or 'caregiver'
 * @param {string} profileData.strokeDate - Date of stroke (MM/DD/YYYY)
 * @param {Array<string>} profileData.impairments - Array of impairment IDs
 * @param {string} profileData.recoveryPhase - 'acute', 'subacute', or 'chronic'
 * @param {string} profileData.goals - User's recovery goals (free text)
 */
export async function saveUserProfile(profileData) {
    try {
        const jsonValue = JSON.stringify(profileData);
        await AsyncStorage.setItem(PROFILE_KEY, jsonValue);
        console.log('✅ User profile saved:', profileData);
        return true;
    } catch (error) {
        console.error('❌ Error saving user profile:', error);
        return false;
    }
}

/**
 * Get user profile from AsyncStorage
 * @returns {Promise<Object|null>} The user profile or null if not found
 */
export async function getUserProfile() {
    try {
        const jsonValue = await AsyncStorage.getItem(PROFILE_KEY);
        const profile = jsonValue != null ? JSON.parse(jsonValue) : null;
        console.log('📖 User profile loaded:', profile);
        return profile;
    } catch (error) {
        console.error('❌ Error loading user profile:', error);
        return null;
    }
}

/**
 * Clear user profile from AsyncStorage
 * Useful for logout or testing
 */
export async function clearUserProfile() {
    try {
        await AsyncStorage.removeItem(PROFILE_KEY);
        console.log('🗑️  User profile cleared');
        return true;
    } catch (error) {
        console.error('❌ Error clearing user profile:', error);
        return false;
    }
}

/**
 * Format user profile for display in Lilly's context
 * @param {Object} profile - User profile object
 * @returns {string} Formatted context string for AI
 */
export function formatProfileForAI(profile) {
    if (!profile) {
        return "No user profile available yet.";
    }

    const impairmentLabels = {
        motor: 'Movement/Mobility',
        speech: 'Speech/Communication',
        cognitive: 'Memory/Thinking',
        vision: 'Vision'
    };

    const phaseLabels = {
        acute: 'Just happened (0-4 weeks)',
        subacute: 'Early recovery (4 weeks - 6 months)',
        chronic: 'Long-term recovery (6+ months)'
    };

    const impairments = Array.isArray(profile.impairments) && profile.impairments.length > 0
        ? profile.impairments.map(imp => impairmentLabels[imp] || imp).join(', ')
        : 'None specified';

    let context = `CURRENT USER CONTEXT:
- Role: ${profile.role === 'survivor' ? 'Stroke Survivor' : profile.role === 'medical_staff' ? 'Medical Staff' : 'Caregiver'}
- Stroke Date: ${profile.strokeDate || 'Not specified'}
- Main Challenges: ${impairments}
- Recovery Phase: ${phaseLabels[profile.recoveryPhase] || profile.recoveryPhase || 'Not specified'}
- Goals: ${profile.goals || 'Not specified'}`;

    return context;
}
