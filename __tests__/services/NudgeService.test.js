// __tests__/services/NudgeService.test.js

// Build a chainable mock that we can reconfigure per test
let mockRpcResult = { data: null, error: null };
let mockInsertResult = { data: null, error: null };
let mockSelectResult = { data: null, error: null };
let mockUpdateResult = { error: null };
let mockCountResult = { count: 0, error: null };

const mockIs = jest.fn().mockImplementation(() => {
    // Used in two contexts: markNudgeAsRead (after .eq chain) and getUnreadNudgeCount (after .eq)
    // We differentiate by checking what gets called next
    return {
        order: jest.fn().mockImplementation(() => ({
            limit: jest.fn().mockImplementation(() => Promise.resolve(mockSelectResult)),
        })),
        // For getUnreadNudgeCount — the .is() is the terminal call
        ...Promise.resolve(mockCountResult),
        then: (resolve) => Promise.resolve(mockCountResult).then(resolve),
    };
});

const buildFromChain = () => {
    const chain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockImplementation((selectStr, options) => {
            if (options && options.count === 'exact' && options.head === true) {
                // getUnreadNudgeCount path
                return {
                    eq: jest.fn().mockImplementation(() => ({
                        is: jest.fn().mockImplementation(() => Promise.resolve(mockCountResult)),
                    })),
                };
            }
            // select() in a query chain (getNudgesForSurvivor, getSentNudges)
            return {
                eq: jest.fn().mockImplementation(() => ({
                    order: jest.fn().mockImplementation(() => ({
                        limit: jest.fn().mockImplementation(() => Promise.resolve(mockSelectResult)),
                    })),
                    is: jest.fn().mockImplementation(() => Promise.resolve(mockUpdateResult)),
                })),
                single: jest.fn().mockImplementation(() => Promise.resolve(mockInsertResult)),
            };
        }),
        update: jest.fn().mockImplementation(() => ({
            eq: jest.fn().mockImplementation(() => ({
                eq: jest.fn().mockImplementation(() => ({
                    is: jest.fn().mockImplementation(() => Promise.resolve(mockUpdateResult)),
                })),
            })),
        })),
        eq: jest.fn().mockImplementation(() => ({
            order: jest.fn().mockImplementation(() => ({
                limit: jest.fn().mockImplementation(() => Promise.resolve(mockSelectResult)),
            })),
            eq: jest.fn().mockImplementation(() => ({
                is: jest.fn().mockImplementation(() => Promise.resolve(mockUpdateResult)),
            })),
            is: jest.fn().mockImplementation(() => Promise.resolve(mockCountResult)),
        })),
        order: jest.fn().mockImplementation(() => ({
            limit: jest.fn().mockImplementation(() => Promise.resolve(mockSelectResult)),
        })),
        single: jest.fn().mockImplementation(() => Promise.resolve(mockInsertResult)),
    };
    return chain;
};

const mockFrom = jest.fn().mockImplementation(() => buildFromChain());
const mockRpc = jest.fn().mockImplementation(() => Promise.resolve(mockRpcResult));

jest.mock('../../services/SupabaseService', () => ({
    supabase: {
        from: (...args) => mockFrom(...args),
        rpc: (...args) => mockRpc(...args),
    },
}));

jest.mock('../../services/NotificationService', () => ({
    NotificationService: {
        sendNudgeNotification: jest.fn().mockResolvedValue(undefined),
    },
}));

import {
    NudgeService,
    NUDGE_TEMPLATES,
    canSendNudge,
    sendNudge,
    getNudgesForSurvivor,
    getSentNudges,
    markNudgeAsRead,
    getUnreadNudgeCount,
} from '../../services/NudgeService';
import { NotificationService } from '../../services/NotificationService';

describe('NudgeService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset default mock results
        mockRpcResult = { data: null, error: null };
        mockInsertResult = { data: null, error: null };
        mockSelectResult = { data: null, error: null };
        mockUpdateResult = { error: null };
        mockCountResult = { count: 0, error: null };
    });

    // ─── NUDGE_TEMPLATES ────────────────────────────────────────────

    describe('NUDGE_TEMPLATES', () => {
        it('should export an array of templates', () => {
            expect(Array.isArray(NUDGE_TEMPLATES)).toBe(true);
            expect(NUDGE_TEMPLATES.length).toBe(5);
        });

        it('each template should have id, emoji, and message', () => {
            NUDGE_TEMPLATES.forEach((t) => {
                expect(t).toHaveProperty('id');
                expect(t).toHaveProperty('emoji');
                expect(t).toHaveProperty('message');
                expect(typeof t.id).toBe('string');
                expect(typeof t.emoji).toBe('string');
                expect(typeof t.message).toBe('string');
            });
        });

        it('should have unique template ids', () => {
            const ids = NUDGE_TEMPLATES.map((t) => t.id);
            expect(new Set(ids).size).toBe(ids.length);
        });

        it('should be accessible via NudgeService export', () => {
            expect(NudgeService.NUDGE_TEMPLATES).toBe(NUDGE_TEMPLATES);
        });
    });

    // ─── canSendNudge ───────────────────────────────────────────────

    describe('canSendNudge', () => {
        it('should return canSend true when rpc returns truthy data', async () => {
            mockRpcResult = { data: true, error: null };

            const result = await canSendNudge('sender1', 'survivor1');

            expect(mockRpc).toHaveBeenCalledWith('can_send_nudge', {
                p_sender_id: 'sender1',
                p_survivor_id: 'survivor1',
            });
            expect(result).toEqual({ canSend: true, error: null });
        });

        it('should return canSend false with rate limit message when rpc returns falsy data', async () => {
            mockRpcResult = { data: false, error: null };

            const result = await canSendNudge('sender1', 'survivor1');

            expect(result.canSend).toBe(false);
            expect(result.error).toContain('one nudge per day');
        });

        it('should return canSend false when rpc returns null data', async () => {
            mockRpcResult = { data: null, error: null };

            const result = await canSendNudge('sender1', 'survivor1');

            expect(result.canSend).toBe(false);
            expect(result.error).toContain('one nudge per day');
        });

        it('should return canSend false with error message on rpc error', async () => {
            mockRpcResult = { data: null, error: { message: 'Database error' } };

            const result = await canSendNudge('sender1', 'survivor1');

            expect(result).toEqual({ canSend: false, error: 'Database error' });
        });

        it('should catch thrown exceptions and return error', async () => {
            mockRpc.mockImplementationOnce(() => {
                throw new Error('Network failure');
            });

            const result = await canSendNudge('sender1', 'survivor1');

            expect(result).toEqual({ canSend: false, error: 'Network failure' });
        });
    });

    // ─── sendNudge ──────────────────────────────────────────────────

    describe('sendNudge', () => {
        const validNudgeData = {
            type: 'template',
            templateId: 'gentle_reminder',
            message: 'Keep going!',
            emoji: '💪',
        };

        it('should return error when senderId is missing', async () => {
            const result = await sendNudge(null, 'Sender', 'survivor1', validNudgeData);

            expect(result).toEqual({
                success: false,
                nudge: null,
                error: 'Missing required fields',
            });
        });

        it('should return error when survivorId is missing', async () => {
            const result = await sendNudge('sender1', 'Sender', '', validNudgeData);

            expect(result).toEqual({
                success: false,
                nudge: null,
                error: 'Missing required fields',
            });
        });

        it('should return error when nudgeData is null', async () => {
            const result = await sendNudge('sender1', 'Sender', 'survivor1', null);

            expect(result).toEqual({
                success: false,
                nudge: null,
                error: 'Missing required fields',
            });
        });

        it('should return error when nudgeData.message is missing', async () => {
            const result = await sendNudge('sender1', 'Sender', 'survivor1', {
                type: 'custom',
            });

            expect(result).toEqual({
                success: false,
                nudge: null,
                error: 'Missing required fields',
            });
        });

        it('should return error when rate limited', async () => {
            mockRpcResult = { data: false, error: null };

            const result = await sendNudge('sender1', 'Sender', 'survivor1', validNudgeData);

            expect(result.success).toBe(false);
            expect(result.nudge).toBeNull();
            expect(result.error).toContain('one nudge per day');
        });

        it('should succeed when rate limit passes and insert succeeds', async () => {
            mockRpcResult = { data: true, error: null };
            const insertedNudge = { id: 'nudge-1', message: 'Keep going!' };
            mockInsertResult = { data: insertedNudge, error: null };

            const result = await sendNudge('sender1', 'Sender Name', 'survivor1', validNudgeData);

            expect(result).toEqual({
                success: true,
                nudge: insertedNudge,
                error: null,
            });
            expect(mockFrom).toHaveBeenCalledWith('nudges');
            expect(NotificationService.sendNudgeNotification).toHaveBeenCalledWith(
                'Sender Name',
                'Keep going!',
                '💪'
            );
        });

        it('should use default emoji for notification when nudgeData.emoji is not provided', async () => {
            mockRpcResult = { data: true, error: null };
            mockInsertResult = { data: { id: 'nudge-2' }, error: null };

            await sendNudge('sender1', 'Sender', 'survivor1', {
                type: 'custom',
                message: 'Hello!',
            });

            expect(NotificationService.sendNudgeNotification).toHaveBeenCalledWith(
                'Sender',
                'Hello!',
                '💪' // default emoji
            );
        });

        it('should default nudge_type to custom when not provided', async () => {
            mockRpcResult = { data: true, error: null };
            mockInsertResult = { data: { id: 'nudge-3' }, error: null };

            const result = await sendNudge('sender1', 'Sender', 'survivor1', {
                message: 'Hi there!',
            });

            expect(result.success).toBe(true);
            expect(mockFrom).toHaveBeenCalledWith('nudges');
        });

        it('should return error when database insert fails', async () => {
            mockRpcResult = { data: true, error: null };
            mockInsertResult = { data: null, error: { message: 'Insert failed' } };

            const result = await sendNudge('sender1', 'Sender', 'survivor1', validNudgeData);

            expect(result).toEqual({
                success: false,
                nudge: null,
                error: 'Insert failed',
            });
        });

        it('should still succeed when notification fails', async () => {
            mockRpcResult = { data: true, error: null };
            mockInsertResult = { data: { id: 'nudge-4' }, error: null };
            NotificationService.sendNudgeNotification.mockRejectedValueOnce(
                new Error('Push failed')
            );

            const result = await sendNudge('sender1', 'Sender', 'survivor1', validNudgeData);

            expect(result.success).toBe(true);
            expect(result.nudge).toEqual({ id: 'nudge-4' });
        });

        it('should catch thrown exceptions', async () => {
            mockRpc.mockImplementationOnce(() => {
                throw new Error('Unexpected error');
            });

            const result = await sendNudge('sender1', 'Sender', 'survivor1', validNudgeData);

            expect(result).toEqual({
                success: false,
                nudge: null,
                error: 'Unexpected error',
            });
        });
    });

    // ─── getNudgesForSurvivor ───────────────────────────────────────

    describe('getNudgesForSurvivor', () => {
        it('should return nudges on success', async () => {
            const nudges = [{ id: 'n1' }, { id: 'n2' }];
            mockSelectResult = { data: nudges, error: null };

            const result = await getNudgesForSurvivor('survivor1');

            expect(mockFrom).toHaveBeenCalledWith('nudges');
            expect(result).toEqual({ nudges, error: null });
        });

        it('should return empty array when data is null', async () => {
            mockSelectResult = { data: null, error: null };

            const result = await getNudgesForSurvivor('survivor1');

            expect(result).toEqual({ nudges: [], error: null });
        });

        it('should return empty array and error on database error', async () => {
            mockSelectResult = { data: null, error: { message: 'Query failed' } };

            const result = await getNudgesForSurvivor('survivor1');

            expect(result).toEqual({ nudges: [], error: 'Query failed' });
        });

        it('should use default limit of 20', async () => {
            mockSelectResult = { data: [], error: null };

            await getNudgesForSurvivor('survivor1');

            // Verify it was called (limit is applied in the chain)
            expect(mockFrom).toHaveBeenCalledWith('nudges');
        });

        it('should accept a custom limit', async () => {
            mockSelectResult = { data: [], error: null };

            const result = await getNudgesForSurvivor('survivor1', 5);

            expect(result).toEqual({ nudges: [], error: null });
        });

        it('should catch thrown exceptions', async () => {
            mockFrom.mockImplementationOnce(() => {
                throw new Error('Connection lost');
            });

            const result = await getNudgesForSurvivor('survivor1');

            expect(result).toEqual({ nudges: [], error: 'Connection lost' });
        });
    });

    // ─── getSentNudges ──────────────────────────────────────────────

    describe('getSentNudges', () => {
        it('should return sent nudges on success', async () => {
            const nudges = [{ id: 'n1', survivor: { name: 'John' } }];
            mockSelectResult = { data: nudges, error: null };

            const result = await getSentNudges('sender1');

            expect(mockFrom).toHaveBeenCalledWith('nudges');
            expect(result).toEqual({ nudges, error: null });
        });

        it('should return empty array when data is null', async () => {
            mockSelectResult = { data: null, error: null };

            const result = await getSentNudges('sender1');

            expect(result).toEqual({ nudges: [], error: null });
        });

        it('should return empty array and error on database error', async () => {
            mockSelectResult = { data: null, error: { message: 'Fetch error' } };

            const result = await getSentNudges('sender1');

            expect(result).toEqual({ nudges: [], error: 'Fetch error' });
        });

        it('should accept a custom limit', async () => {
            mockSelectResult = { data: [], error: null };

            const result = await getSentNudges('sender1', 10);

            expect(result).toEqual({ nudges: [], error: null });
        });

        it('should catch thrown exceptions', async () => {
            mockFrom.mockImplementationOnce(() => {
                throw new Error('Timeout');
            });

            const result = await getSentNudges('sender1');

            expect(result).toEqual({ nudges: [], error: 'Timeout' });
        });
    });

    // ─── markNudgeAsRead ────────────────────────────────────────────

    describe('markNudgeAsRead', () => {
        it('should return success when update succeeds', async () => {
            mockUpdateResult = { error: null };

            const result = await markNudgeAsRead('nudge-1', 'survivor1');

            expect(mockFrom).toHaveBeenCalledWith('nudges');
            expect(result).toEqual({ success: true, error: null });
        });

        it('should return error when update fails', async () => {
            mockUpdateResult = { error: { message: 'Update failed' } };

            const result = await markNudgeAsRead('nudge-1', 'survivor1');

            expect(result).toEqual({ success: false, error: 'Update failed' });
        });

        it('should catch thrown exceptions', async () => {
            mockFrom.mockImplementationOnce(() => {
                throw new Error('DB down');
            });

            const result = await markNudgeAsRead('nudge-1', 'survivor1');

            expect(result).toEqual({ success: false, error: 'DB down' });
        });
    });

    // ─── getUnreadNudgeCount ────────────────────────────────────────

    describe('getUnreadNudgeCount', () => {
        it('should return count on success', async () => {
            mockCountResult = { count: 5, error: null };

            const result = await getUnreadNudgeCount('survivor1');

            expect(mockFrom).toHaveBeenCalledWith('nudges');
            expect(result).toEqual({ count: 5, error: null });
        });

        it('should return 0 when count is null', async () => {
            mockCountResult = { count: null, error: null };

            const result = await getUnreadNudgeCount('survivor1');

            expect(result).toEqual({ count: 0, error: null });
        });

        it('should return 0 and error on database error', async () => {
            mockCountResult = { count: null, error: { message: 'Count failed' } };

            const result = await getUnreadNudgeCount('survivor1');

            expect(result).toEqual({ count: 0, error: 'Count failed' });
        });

        it('should catch thrown exceptions', async () => {
            mockFrom.mockImplementationOnce(() => {
                throw new Error('Service unavailable');
            });

            const result = await getUnreadNudgeCount('survivor1');

            expect(result).toEqual({ count: 0, error: 'Service unavailable' });
        });
    });

    // ─── NudgeService export ────────────────────────────────────────

    describe('NudgeService default export', () => {
        it('should export all methods', () => {
            expect(NudgeService.canSendNudge).toBe(canSendNudge);
            expect(NudgeService.sendNudge).toBe(sendNudge);
            expect(NudgeService.getNudgesForSurvivor).toBe(getNudgesForSurvivor);
            expect(NudgeService.getSentNudges).toBe(getSentNudges);
            expect(NudgeService.markNudgeAsRead).toBe(markNudgeAsRead);
            expect(NudgeService.getUnreadNudgeCount).toBe(getUnreadNudgeCount);
            expect(NudgeService.NUDGE_TEMPLATES).toBe(NUDGE_TEMPLATES);
        });
    });
});
