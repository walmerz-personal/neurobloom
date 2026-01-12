// __tests__/services/LillyService.test.js
import { sendMessage } from '../../services/LillyService';
import { SupabaseService } from '../../services/SupabaseService';

// Mock SupabaseService
jest.mock('../../services/SupabaseService', () => ({
    SupabaseService: {
        callEdgeFunction: jest.fn(),
    },
}));

// Mock console to avoid clutter
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('LillyService', () => {
    beforeAll(() => {
        console.log = jest.fn();
        console.error = jest.fn();
    });

    afterAll(() => {
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('sendMessage - Emergency Detection', () => {
        it('should detect chest pain as emergency locally', async () => {
            const response = await sendMessage('I have chest pain', []);

            expect(response.text).toContain('medical emergency');
            expect(response.text).toContain('911');
            expect(response.isEmergency).toBe(true);
            // Should NOT call edge function for local emergency
            expect(SupabaseService.callEdgeFunction).not.toHaveBeenCalled();
        });

        it('should detect suicide keywords as emergency', async () => {
            const response = await sendMessage('I want to kill myself', []);

            expect(response.isEmergency).toBe(true);
            expect(response.text).toContain('911');
        });
    });

    describe('sendMessage - Edge Function Integration', () => {
        it('should call Edge Function and return response', async () => {
            const mockData = { text: "I'm here to help." };
            SupabaseService.callEdgeFunction.mockResolvedValue({
                data: mockData,
                error: null,
            });

            const response = await sendMessage('Hello', []);

            expect(response).toEqual(mockData);
            expect(SupabaseService.callEdgeFunction).toHaveBeenCalledWith('lilly-chat', {
                message: 'Hello',
                history: [],
                userProfile: null,
            });
        });

        it('should pass user profile to Edge Function', async () => {
            const mockData = { text: 'Hello Bob' };
            SupabaseService.callEdgeFunction.mockResolvedValue({
                data: mockData,
                error: null,
            });

            const userProfile = { name: 'Bob' };
            await sendMessage('Hi', [], userProfile);

            expect(SupabaseService.callEdgeFunction).toHaveBeenCalledWith('lilly-chat', expect.objectContaining({
                userProfile,
            }));
        });
    });

    describe('sendMessage - Error Handling', () => {
        it('should handle Edge Function error return', async () => {
            SupabaseService.callEdgeFunction.mockResolvedValue({
                data: null,
                error: new Error('Edge Function Error'),
            });

            const response = await sendMessage('Hello', []);

            expect(response.text).toContain("having trouble connecting to my AI backend");
            expect(response.text).toContain("stroke recovery");
        });

        it('should handle missing data from Edge Function', async () => {
            SupabaseService.callEdgeFunction.mockResolvedValue({
                data: null, // No text
                error: null,
            });

            const response = await sendMessage('Hello', []);

            expect(response.text).toContain("having trouble processing your message");
        });

        it('should handle network crash (exception)', async () => {
            SupabaseService.callEdgeFunction.mockRejectedValue(new Error('Network Crash'));

            const response = await sendMessage('Hello', []);

            expect(response.text).toContain("having trouble connecting right now");
        });
    });
});
