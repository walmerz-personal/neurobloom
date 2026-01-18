// __tests__/services/KudosService.test.js
// Mock Supabase before importing KudosService
// Note: KudosService uses Supabase query builder which is complex to mock
// We focus on testing utility functions and basic error handling

jest.mock('../../services/SupabaseService', () => ({
    supabase: {
        from: jest.fn(() => ({
            insert: jest.fn(() => ({
                select: jest.fn(() => ({
                    single: jest.fn().mockRejectedValue(new Error('Mock error')),
                })),
            })),
            select: jest.fn(() => ({
                eq: jest.fn(() => ({
                    is: jest.fn(() => ({
                        order: jest.fn().mockRejectedValue(new Error('Mock error')),
                    })),
                })),
            })),
            update: jest.fn(() => ({
                eq: jest.fn(() => ({
                    select: jest.fn(() => ({
                        single: jest.fn().mockRejectedValue(new Error('Mock error')),
                    })),
                    is: jest.fn(() => ({
                        select: jest.fn().mockRejectedValue(new Error('Mock error')),
                    })),
                })),
            })),
        })),
    },
}));

import { KudosService } from '../../services/KudosService';

describe('KudosService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('sendKudos', () => {
        it('should handle errors when sending kudos', async () => {
            const { kudos, error } = await KudosService.sendKudos('cg1', 's1', 'streak', 7);

            expect(kudos).toBeNull();
            expect(error).toBeTruthy();
        });
    });

    describe('getUnreadKudos', () => {
        it('should return empty array on error', async () => {
            const { kudos, error } = await KudosService.getUnreadKudos('s1');

            expect(kudos).toEqual([]);
            expect(error).toBeTruthy();
        });
    });

    describe('markKudosAsRead', () => {
        it('should handle errors when marking as read', async () => {
            const { kudos, error } = await KudosService.markKudosAsRead('kudos-123');

            expect(kudos).toBeNull();
            expect(error).toBeTruthy();
        });
    });

    describe('markAllKudosAsRead', () => {
        it('should handle errors when marking all as read', async () => {
            const { count, error } = await KudosService.markAllKudosAsRead('s1');

            expect(count).toBe(0);
            expect(error).toBeTruthy();
        });
    });

    describe('getItemTypeLabel', () => {
        it('should return correct label for known item types', () => {
            expect(KudosService.getItemTypeLabel('streak')).toBe('Day Streak');
            expect(KudosService.getItemTypeLabel('exercises')).toBe('Exercises');
            expect(KudosService.getItemTypeLabel('checkin_rate')).toBe('Check-in Rate');
            expect(KudosService.getItemTypeLabel('mood')).toBe('Mood');
            expect(KudosService.getItemTypeLabel('pain')).toBe('Pain Level');
            expect(KudosService.getItemTypeLabel('energy')).toBe('Energy Level');
            expect(KudosService.getItemTypeLabel('daily_checkin')).toBe('Daily Check-in');
        });

        it('should return item type as-is for unknown types', () => {
            expect(KudosService.getItemTypeLabel('unknown_type')).toBe('unknown_type');
        });
    });

    describe('getItemTypeEmoji', () => {
        it('should return correct emoji for known item types', () => {
            expect(KudosService.getItemTypeEmoji('streak')).toBe('🔥');
            expect(KudosService.getItemTypeEmoji('exercises')).toBe('💪');
            expect(KudosService.getItemTypeEmoji('checkin_rate')).toBe('📈');
            expect(KudosService.getItemTypeEmoji('mood')).toBe('😊');
            expect(KudosService.getItemTypeEmoji('pain')).toBe('❤️‍🩹');
            expect(KudosService.getItemTypeEmoji('energy')).toBe('⚡');
            expect(KudosService.getItemTypeEmoji('daily_checkin')).toBe('✅');
        });

        it('should return default emoji for unknown types', () => {
            expect(KudosService.getItemTypeEmoji('unknown_type')).toBe('🎉');
        });
    });
});
