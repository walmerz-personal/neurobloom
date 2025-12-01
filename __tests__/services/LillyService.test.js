// __tests__/services/LillyService.test.js
import { sendMessage } from '../../services/LillyService';
import { Config } from '../../constants/Config';

describe('LillyService', () => {
    const mockApiKey = 'sk-test-1234567890abcdef';

    beforeEach(() => {
        jest.clearAllMocks();
        // Set up mock API key
        Config.OPENAI_API_KEY = mockApiKey;
        Config.API_URL = 'https://api.openai.com/v1/chat/completions';
        Config.MODEL = 'gpt-3.5-turbo';
    });

    describe('sendMessage - Emergency Detection', () => {
        it('should detect chest pain as emergency', async () => {
            const response = await sendMessage('I have chest pain', []);

            expect(response.text).toContain('medical emergency');
            expect(response.text).toContain('911');
            expect(response.isEmergency).toBe(true);
        });

        it('should detect breathing difficulty as emergency', async () => {
            const response = await sendMessage("I can't breathe", []);

            expect(response.text).toContain('emergency');
            expect(response.text).toContain('911');
            expect(response.isEmergency).toBe(true);
        });

        it('should detect heart attack keywords as emergency', async () => {
            const response = await sendMessage('I think I am having a heart attack', []);

            expect(response.isEmergency).toBe(true);
            expect(response.text).toContain('911');
        });

        it('should detect suicide keywords as emergency', async () => {
            const response = await sendMessage('I want to kill myself', []);

            expect(response.isEmergency).toBe(true);
            expect(response.text).toContain('911');
        });

        it('should detect FAST stroke symptoms - face droop', async () => {
            const response = await sendMessage('My face is drooping', []);

            expect(response.isEmergency).toBe(true);
        });

        it('should detect FAST stroke symptoms - arm weakness', async () => {
            const response = await sendMessage('I have new arm weakness', []);

            expect(response.isEmergency).toBe(true);
        });

        it('should not trigger emergency for normal messages', async () => {
            // Set up mock fetch for OpenAI
            global.fetch.mockResolvedValueOnce({
                json: async () => ({
                    choices: [{
                        message: {
                            content: 'Hello! How can I help you today?'
                        }
                    }]
                })
            });

            const response = await sendMessage('Hello', []);

            expect(response.isEmergency).toBeFalsy();
        });
    });

    describe('sendMessage - OpenAI Integration', () => {
        it('should successfully call OpenAI API and return response', async () => {
            const mockResponse = {
                choices: [{
                    message: {
                        content: 'I can help you with that. Let me explain stroke recovery.'
                    }
                }]
            };

            global.fetch.mockResolvedValueOnce({
                json: async () => mockResponse
            });

            const response = await sendMessage('Tell me about stroke recovery', []);

            expect(fetch).toHaveBeenCalledWith(
                Config.API_URL,
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Authorization': `Bearer ${mockApiKey}`,
                        'Content-Type': 'application/json'
                    })
                })
            );
            expect(response.text).toBe('I can help you with that. Let me explain stroke recovery.');
        });

        it('should include conversation history in API call', async () => {
            const mockResponse = {
                choices: [{
                    message: { content: 'Based on what you told me earlier...' }
                }]
            };

            global.fetch.mockResolvedValueOnce({
                json: async () => mockResponse
            });

            const history = [
                { role: 'user', content: 'I had a stroke last month' },
                { role: 'assistant', content: 'I understand. How are you feeling?' }
            ];

            await sendMessage('I am feeling tired', history);

            const fetchCall = fetch.mock.calls[0];
            const requestBody = JSON.parse(fetchCall[1].body);

            expect(requestBody.messages).toHaveLength(4); // system + 2 history + new message
            expect(requestBody.messages[1]).toEqual(history[0]);
            expect(requestBody.messages[2]).toEqual(history[1]);
        });

        it('should include user profile context in API call', async () => {
            const mockResponse = {
                choices: [{
                    message: { content: 'Given your motor impairments...' }
                }]
            };

            global.fetch.mockResolvedValueOnce({
                json: async () => mockResponse
            });

            const userProfile = {
                role: 'survivor',
                strokeDate: '01/15/2024',
                impairments: ['motor', 'speech'],
                recoveryPhase: 'subacute',
                goals: 'Regain mobility'
            };

            await sendMessage('What exercises should I do?', [], userProfile);

            const fetchCall = fetch.mock.calls[0];
            const requestBody = JSON.parse(fetchCall[1].body);
            const systemMessage = requestBody.messages[0].content;

            expect(systemMessage).toContain('CURRENT USER CONTEXT');
            expect(systemMessage).toContain('Stroke Survivor');
            expect(systemMessage).toContain('01/15/2024');
        });

        it('should include current date in system prompt', async () => {
            const mockResponse = {
                choices: [{
                    message: { content: 'Here is today information...' }
                }]
            };

            global.fetch.mockResolvedValueOnce({
                json: async () => mockResponse
            });

            await sendMessage('What day is it?', []);

            const fetchCall = fetch.mock.calls[0];
            const requestBody = JSON.parse(fetchCall[1].body);
            const systemMessage = requestBody.messages[0].content;

            expect(systemMessage).toContain('CURRENT DATE:');
        });

        it('should send correct model and parameters', async () => {
            const mockResponse = {
                choices: [{
                    message: { content: 'Response' }
                }]
            };

            global.fetch.mockResolvedValueOnce({
                json: async () => mockResponse
            });

            await sendMessage('Test', []);

            const fetchCall = fetch.mock.calls[0];
            const requestBody = JSON.parse(fetchCall[1].body);

            expect(requestBody.model).toBe('gpt-3.5-turbo');
            expect(requestBody.max_tokens).toBe(500);
            expect(requestBody.temperature).toBe(0.7);
        });
    });

    describe('sendMessage - Action Detection', () => {
        it('should detect exercise navigation action', async () => {
            const mockResponse = {
                choices: [{
                    message: {
                        content: 'Sure! Let me navigate to exercises for you.'
                    }
                }]
            };

            global.fetch.mockResolvedValueOnce({
                json: async () => mockResponse
            });

            const response = await sendMessage('Show me exercises', []);

            expect(response.action).toEqual({ type: 'navigate', target: 'exercises' });
        });

        it('should detect progress navigation action', async () => {
            const mockResponse = {
                choices: [{
                    message: {
                        content: 'Let me show you your progress dashboard'
                    }
                }]
            };

            global.fetch.mockResolvedValueOnce({
                json: async () => mockResponse
            });

            const response = await sendMessage('Show my progress', []);

            expect(response.action).toEqual({ type: 'navigate', target: 'progress' });
        });

        it('should not detect action in normal responses', async () => {
            const mockResponse = {
                choices: [{
                    message: {
                        content: 'Let me tell you about recovery.'
                    }
                }]
            };

            global.fetch.mockResolvedValueOnce({
                json: async () => mockResponse
            });

            const response = await sendMessage('Tell me about recovery', []);

            expect(response.action).toBeNull();
        });
    });

    describe('sendMessage - Error Handling', () => {
        it('should handle API errors gracefully', async () => {
            global.fetch.mockResolvedValueOnce({
                json: async () => ({
                    error: {
                        message: 'Invalid API key',
                        type: 'invalid_request_error'
                    }
                })
            });

            const response = await sendMessage('Hello', []);

            expect(response.text).toContain('make sure your OpenAI API key is configured');
        });

        it('should handle empty choices in API response', async () => {
            global.fetch.mockResolvedValueOnce({
                json: async () => ({
                    choices: []
                })
            });

            const response = await sendMessage('Hello', []);

            expect(response.text).toContain('make sure your OpenAI API key is configured');
        });

        it('should handle network errors', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Network error'));

            const response = await sendMessage('Hello', []);

            expect(response.text).toContain('make sure your OpenAI API key is configured');
            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('Network Error'),
                'Network error'
            );
        });

        it('should use fallback when API key is missing', async () => {
            Config.OPENAI_API_KEY = '';

            const response = await sendMessage('Hello', []);

            expect(response.text).toContain('make sure your OpenAI API key is configured');
            expect(fetch).not.toHaveBeenCalled();
        });

        it('should use fallback when API key is too short', async () => {
            Config.OPENAI_API_KEY = 'short';

            const response = await sendMessage('Hello', []);

            expect(response.text).toContain('make sure your OpenAI API key is configured');
            expect(fetch).not.toHaveBeenCalled();
        });
    });

    describe('sendMessage - Message Handling', () => {
        it('should handle empty messages', async () => {
            global.fetch.mockResolvedValueOnce({
                json: async () => ({
                    choices: [{
                        message: { content: 'How can I help you?' }
                    }]
                })
            });

            const response = await sendMessage('', []);

            expect(response).toBeDefined();
        });

        it('should handle very long messages', async () => {
            const longMessage = 'word '.repeat(1000);

            global.fetch.mockResolvedValueOnce({
                json: async () => ({
                    choices: [{
                        message: { content: 'I understand your concern.' }
                    }]
                })
            });

            const response = await sendMessage(longMessage, []);

            expect(fetch).toHaveBeenCalled();
            expect(response.text).toBeDefined();
        });

        it('should trim whitespace from responses', async () => {
            global.fetch.mockResolvedValueOnce({
                json: async () => ({
                    choices: [{
                        message: { content: '  Response with spaces  \n\n' }
                    }]
                })
            });

            const response = await sendMessage('Test', []);

            expect(response.text).toBe('Response with spaces');
        });
    });

    describe('sendMessage - Emergency Detection in AI Response', () => {
        it('should detect emergency flag in AI response', async () => {
            global.fetch.mockResolvedValueOnce({
                json: async () => ({
                    choices: [{
                        message: {
                            content: 'You should call 911 immediately for these symptoms.'
                        }
                    }]
                })
            });

            const response = await sendMessage('I have sudden severe pain', []);

            expect(response.isEmergency).toBe(true);
        });

        it('should detect emergency keyword in AI response', async () => {
            global.fetch.mockResolvedValueOnce({
                json: async () => ({
                    choices: [{
                        message: {
                            content: 'This is a medical emergency, seek help now.'
                        }
                    }]
                })
            });

            const response = await sendMessage('Sudden weakness', []);

            expect(response.isEmergency).toBe(true);
        });
    });

    describe('sendMessage - Conversation Context', () => {
        it('should handle multiple turns of conversation', async () => {
            const history = [
                { role: 'user', content: 'I had a stroke 3 months ago' },
                { role: 'assistant', content: 'I understand. You are in the subacute recovery phase.' },
                { role: 'user', content: 'What exercises should I do?' },
                { role: 'assistant', content: 'Here are some exercises...' }
            ];

            global.fetch.mockResolvedValueOnce({
                json: async () => ({
                    choices: [{
                        message: { content: 'Based on what we discussed...' }
                    }]
                })
            });

            const response = await sendMessage('How often should I exercise?', history);

            const fetchCall = fetch.mock.calls[0];
            const requestBody = JSON.parse(fetchCall[1].body);

            expect(requestBody.messages.length).toBe(6); // system + 4 history + new
        });

        it('should handle conversation with user profile', async () => {
            const userProfile = {
                role: 'caregiver',
                impairments: ['speech'],
                recoveryPhase: 'chronic'
            };

            global.fetch.mockResolvedValueOnce({
                json: async () => ({
                    choices: [{
                        message: { content: 'As a caregiver, here are some tips...' }
                    }]
                })
            });

            const response = await sendMessage('How can I help?', [], userProfile);

            expect(response.text).toContain('As a caregiver');
        });
    });
});
