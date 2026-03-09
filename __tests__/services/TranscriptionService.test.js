// __tests__/services/TranscriptionService.test.js
import { transcribeAudio } from '../../services/TranscriptionService';
import { SupabaseService } from '../../services/SupabaseService';
import { Config } from '../../constants/Config';

// Mock SupabaseService
jest.mock('../../services/SupabaseService', () => ({
    SupabaseService: {
        getSession: jest.fn(),
    },
}));

// Mock Config
jest.mock('../../constants/Config', () => ({
    Config: {
        SUPABASE_URL: 'https://test-project.supabase.co',
    },
}));

describe('TranscriptionService', () => {
    const mockAudioUri = 'file:///tmp/test-audio.m4a';
    const mockAccessToken = 'test-access-token-123';
    const mockSession = { access_token: mockAccessToken };

    beforeEach(() => {
        jest.clearAllMocks();
        global.fetch = jest.fn();
    });

    describe('transcribeAudio - success cases', () => {
        it('should return transcribed text on successful response', async () => {
            SupabaseService.getSession.mockResolvedValue({
                session: mockSession,
                error: null,
            });
            global.fetch.mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue({ text: 'Hello world' }),
            });

            const result = await transcribeAudio(mockAudioUri);

            expect(result).toEqual({ text: 'Hello world', error: null });
        });

        it('should call fetch with correct URL, auth header, and FormData body', async () => {
            SupabaseService.getSession.mockResolvedValue({
                session: mockSession,
                error: null,
            });
            global.fetch.mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue({ text: 'test' }),
            });

            await transcribeAudio(mockAudioUri);

            expect(global.fetch).toHaveBeenCalledTimes(1);
            const [url, options] = global.fetch.mock.calls[0];
            expect(url).toBe('https://test-project.supabase.co/functions/v1/transcribe-audio');
            expect(options.method).toBe('POST');
            expect(options.headers.Authorization).toBe(`Bearer ${mockAccessToken}`);
            // Body should be a FormData instance
            expect(options.body).toBeInstanceOf(FormData);
        });

        it('should append audio file with correct metadata to FormData', async () => {
            const appendSpy = jest.spyOn(FormData.prototype, 'append');
            SupabaseService.getSession.mockResolvedValue({
                session: mockSession,
                error: null,
            });
            global.fetch.mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue({ text: 'test' }),
            });

            await transcribeAudio(mockAudioUri);

            expect(appendSpy).toHaveBeenCalledWith('audio', {
                uri: mockAudioUri,
                type: 'audio/m4a',
                name: 'audio.m4a',
            });
            appendSpy.mockRestore();
        });

        it('should handle empty transcription text', async () => {
            SupabaseService.getSession.mockResolvedValue({
                session: mockSession,
                error: null,
            });
            global.fetch.mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue({ text: '' }),
            });

            const result = await transcribeAudio(mockAudioUri);

            expect(result).toEqual({ text: '', error: null });
        });
    });

    describe('transcribeAudio - authentication errors', () => {
        it('should return error when session has an error', async () => {
            SupabaseService.getSession.mockResolvedValue({
                session: null,
                error: new Error('Session expired'),
            });

            const result = await transcribeAudio(mockAudioUri);

            expect(result.text).toBeNull();
            expect(result.error).toBeInstanceOf(Error);
            expect(result.error.message).toBe('Authentication required');
            expect(global.fetch).not.toHaveBeenCalled();
        });

        it('should return error when session is null with no error object', async () => {
            SupabaseService.getSession.mockResolvedValue({
                session: null,
                error: null,
            });

            const result = await transcribeAudio(mockAudioUri);

            expect(result.text).toBeNull();
            expect(result.error.message).toBe('Authentication required');
            expect(global.fetch).not.toHaveBeenCalled();
        });
    });

    describe('transcribeAudio - API error responses', () => {
        it('should return error message from API when response is not ok', async () => {
            SupabaseService.getSession.mockResolvedValue({
                session: mockSession,
                error: null,
            });
            global.fetch.mockResolvedValue({
                ok: false,
                json: jest.fn().mockResolvedValue({ error: 'Invalid audio format' }),
            });

            const result = await transcribeAudio(mockAudioUri);

            expect(result.text).toBeNull();
            expect(result.error).toBeInstanceOf(Error);
            expect(result.error.message).toBe('Invalid audio format');
        });

        it('should return default error message when API error has no message', async () => {
            SupabaseService.getSession.mockResolvedValue({
                session: mockSession,
                error: null,
            });
            global.fetch.mockResolvedValue({
                ok: false,
                json: jest.fn().mockResolvedValue({}),
            });

            const result = await transcribeAudio(mockAudioUri);

            expect(result.text).toBeNull();
            expect(result.error.message).toBe('Failed to transcribe audio');
        });

        it('should handle 500 server error response', async () => {
            SupabaseService.getSession.mockResolvedValue({
                session: mockSession,
                error: null,
            });
            global.fetch.mockResolvedValue({
                ok: false,
                json: jest.fn().mockResolvedValue({ error: 'Internal server error' }),
            });

            const result = await transcribeAudio(mockAudioUri);

            expect(result.text).toBeNull();
            expect(result.error.message).toBe('Internal server error');
        });
    });

    describe('transcribeAudio - network and unexpected errors', () => {
        it('should catch and return network errors from fetch', async () => {
            SupabaseService.getSession.mockResolvedValue({
                session: mockSession,
                error: null,
            });
            const networkError = new Error('Network request failed');
            global.fetch.mockRejectedValue(networkError);

            const result = await transcribeAudio(mockAudioUri);

            expect(result.text).toBeNull();
            expect(result.error).toBe(networkError);
        });

        it('should catch and return errors when json parsing fails', async () => {
            SupabaseService.getSession.mockResolvedValue({
                session: mockSession,
                error: null,
            });
            global.fetch.mockResolvedValue({
                ok: true,
                json: jest.fn().mockRejectedValue(new SyntaxError('Unexpected token')),
            });

            const result = await transcribeAudio(mockAudioUri);

            expect(result.text).toBeNull();
            expect(result.error).toBeInstanceOf(SyntaxError);
        });

        it('should catch errors thrown by getSession', async () => {
            const sessionError = new Error('Supabase client not initialized');
            SupabaseService.getSession.mockRejectedValue(sessionError);

            const result = await transcribeAudio(mockAudioUri);

            expect(result.text).toBeNull();
            expect(result.error).toBe(sessionError);
        });
    });

    describe('transcribeAudio - edge cases', () => {
        it('should handle undefined audioUri', async () => {
            SupabaseService.getSession.mockResolvedValue({
                session: mockSession,
                error: null,
            });
            global.fetch.mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue({ text: 'transcribed' }),
            });

            // Should not throw - FormData.append receives undefined uri
            const result = await transcribeAudio(undefined);

            expect(result.text).toBe('transcribed');
        });

        it('should handle null audioUri', async () => {
            SupabaseService.getSession.mockResolvedValue({
                session: mockSession,
                error: null,
            });
            global.fetch.mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue({ text: 'transcribed' }),
            });

            const result = await transcribeAudio(null);

            expect(result.text).toBe('transcribed');
        });

        it('should handle very long transcription text', async () => {
            const longText = 'word '.repeat(10000).trim();
            SupabaseService.getSession.mockResolvedValue({
                session: mockSession,
                error: null,
            });
            global.fetch.mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue({ text: longText }),
            });

            const result = await transcribeAudio(mockAudioUri);

            expect(result.text).toBe(longText);
            expect(result.error).toBeNull();
        });
    });
});
