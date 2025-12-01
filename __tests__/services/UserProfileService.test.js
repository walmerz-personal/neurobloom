// __tests__/services/UserProfileService.test.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    saveUserProfile,
    getUserProfile,
    clearUserProfile,
    formatProfileForAI,
} from '../../services/UserProfileService';

describe('UserProfileService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('saveUserProfile', () => {
        it('should save complete profile data successfully', async () => {
            const profileData = {
                role: 'survivor',
                strokeDate: '01/15/2024',
                impairments: ['motor', 'speech'],
                recoveryPhase: 'subacute',
                goals: 'Regain arm mobility and improve speech',
            };

            const result = await saveUserProfile(profileData);

            expect(result).toBe(true);
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@neurobloom_user_profile',
                JSON.stringify(profileData)
            );
            expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
        });

        it('should save minimal profile data', async () => {
            const profileData = {
                role: 'caregiver',
            };

            const result = await saveUserProfile(profileData);

            expect(result).toBe(true);
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@neurobloom_user_profile',
                JSON.stringify(profileData)
            );
        });

        it('should handle AsyncStorage errors gracefully', async () => {
            const profileData = { role: 'survivor' };
            const error = new Error('Storage error');
            AsyncStorage.setItem.mockRejectedValueOnce(error);

            const result = await saveUserProfile(profileData);

            expect(result).toBe(false);
            expect(console.error).toHaveBeenCalledWith(
                '❌ Error saving user profile:',
                error
            );
        });

        it('should save profile with all impairments', async () => {
            const profileData = {
                role: 'survivor',
                impairments: ['motor', 'speech', 'cognitive', 'vision'],
                recoveryPhase: 'chronic',
            };

            const result = await saveUserProfile(profileData);

            expect(result).toBe(true);
        });
    });

    describe('getUserProfile', () => {
        it('should retrieve saved profile correctly', async () => {
            const profileData = {
                role: 'survivor',
                strokeDate: '03/20/2024',
                impairments: ['motor'],
                recoveryPhase: 'acute',
                goals: 'Walk again',
            };
            AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(profileData));

            const result = await getUserProfile();

            expect(result).toEqual(profileData);
            expect(AsyncStorage.getItem).toHaveBeenCalledWith(
                '@neurobloom_user_profile'
            );
        });

        it('should return null when no profile exists', async () => {
            AsyncStorage.getItem.mockResolvedValueOnce(null);

            const result = await getUserProfile();

            expect(result).toBeNull();
        });

        it('should handle corrupted data gracefully', async () => {
            AsyncStorage.getItem.mockResolvedValueOnce('invalid json {{{');

            // This will throw an error, which should be caught
            const result = await getUserProfile();

            expect(result).toBeNull();
            expect(console.error).toHaveBeenCalled();
        });

        it('should handle AsyncStorage errors', async () => {
            const error = new Error('Read error');
            AsyncStorage.getItem.mockRejectedValueOnce(error);

            const result = await getUserProfile();

            expect(result).toBeNull();
            expect(console.error).toHaveBeenCalledWith(
                '❌ Error loading user profile:',
                error
            );
        });

        it('should parse complex profile with all fields', async () => {
            const profileData = {
                role: 'caregiver',
                strokeDate: '12/01/2023',
                impairments: ['motor', 'speech', 'cognitive'],
                recoveryPhase: 'chronic',
                goals: 'Support my loved one in their recovery journey',
            };
            AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(profileData));

            const result = await getUserProfile();

            expect(result).toEqual(profileData);
        });
    });

    describe('clearUserProfile', () => {
        it('should successfully remove profile', async () => {
            const result = await clearUserProfile();

            expect(result).toBe(true);
            expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
                '@neurobloom_user_profile'
            );
            expect(AsyncStorage.removeItem).toHaveBeenCalledTimes(1);
        });

        it('should handle AsyncStorage errors', async () => {
            const error = new Error('Remove error');
            AsyncStorage.removeItem.mockRejectedValueOnce(error);

            const result = await clearUserProfile();

            expect(result).toBe(false);
            expect(console.error).toHaveBeenCalledWith(
                '❌ Error clearing user profile:',
                error
            );
        });
    });

    describe('formatProfileForAI', () => {
        it('should format complete profile correctly', () => {
            const profile = {
                role: 'survivor',
                strokeDate: '01/15/2024',
                impairments: ['motor', 'speech'],
                recoveryPhase: 'subacute',
                goals: 'Regain arm mobility',
            };

            const result = formatProfileForAI(profile);

            expect(result).toContain('CURRENT USER CONTEXT:');
            expect(result).toContain('Role: Stroke Survivor');
            expect(result).toContain('Stroke Date: 01/15/2024');
            expect(result).toContain('Movement/Mobility, Speech/Communication');
            expect(result).toContain('Early recovery (4 weeks - 6 months)');
            expect(result).toContain('Goals: Regain arm mobility');
        });

        it('should format caregiver profile correctly', () => {
            const profile = {
                role: 'caregiver',
                strokeDate: '03/01/2024',
                impairments: ['cognitive'],
                recoveryPhase: 'acute',
                goals: 'Help my parent recover',
            };

            const result = formatProfileForAI(profile);

            expect(result).toContain('Role: Caregiver');
            expect(result).toContain('Memory/Thinking');
            expect(result).toContain('Just happened (0-4 weeks)');
        });

        it('should handle null profile', () => {
            const result = formatProfileForAI(null);

            expect(result).toBe('No user profile available yet.');
        });

        it('should handle undefined profile', () => {
            const result = formatProfileForAI(undefined);

            expect(result).toBe('No user profile available yet.');
        });

        it('should handle missing fields gracefully', () => {
            const profile = {
                role: 'survivor',
            };

            const result = formatProfileForAI(profile);

            expect(result).toContain('Role: Stroke Survivor');
            expect(result).toContain('Stroke Date: Not specified');
            expect(result).toContain('Main Challenges: None specified');
            expect(result).toContain('Recovery Phase: Not specified');
            expect(result).toContain('Goals: Not specified');
        });

        it('should handle all impairment types', () => {
            const profile = {
                role: 'survivor',
                impairments: ['motor', 'speech', 'cognitive', 'vision'],
                recoveryPhase: 'chronic',
            };

            const result = formatProfileForAI(profile);

            expect(result).toContain('Movement/Mobility');
            expect(result).toContain('Speech/Communication');
            expect(result).toContain('Memory/Thinking');
            expect(result).toContain('Vision');
            expect(result).toContain('Long-term recovery (6+ months)');
        });

        it('should handle unknown impairment IDs', () => {
            const profile = {
                role: 'survivor',
                impairments: ['unknown_type', 'motor'],
            };

            const result = formatProfileForAI(profile);

            expect(result).toContain('unknown_type');
            expect(result).toContain('Movement/Mobility');
        });

        it('should handle empty impairments array', () => {
            const profile = {
                role: 'survivor',
                impairments: [],
            };

            const result = formatProfileForAI(profile);

            expect(result).toContain('Main Challenges: None specified');
        });

        it('should handle non-array impairments', () => {
            const profile = {
                role: 'survivor',
                impairments: 'motor',
            };

            const result = formatProfileForAI(profile);

            expect(result).toContain('Main Challenges: None specified');
        });

        it('should format chronic recovery phase correctly', () => {
            const profile = {
                role: 'survivor',
                recoveryPhase: 'chronic',
            };

            const result = formatProfileForAI(profile);

            expect(result).toContain('Long-term recovery (6+ months)');
        });
    });
});
