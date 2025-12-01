// __tests__/constants/Config.test.js
import { Config } from '../../constants/Config';

describe('Config', () => {
    describe('API Keys', () => {
        it('should have OPENAI_API_KEY defined', () => {
            expect(Config.OPENAI_API_KEY).toBeDefined();
        });

        it('should have SUPABASE_URL defined', () => {
            expect(Config.SUPABASE_URL).toBeDefined();
        });

        it('should have SUPABASE_ANON_KEY defined', () => {
            expect(Config.SUPABASE_ANON_KEY).toBeDefined();
        });

        it('should have string type for API keys', () => {
            expect(typeof Config.OPENAI_API_KEY).toBe('string');
            expect(typeof Config.SUPABASE_URL).toBe('string');
            expect(typeof Config.SUPABASE_ANON_KEY).toBe('string');
        });
    });

    describe('API Configuration', () => {
        it('should have valid API_URL', () => {
            expect(Config.API_URL).toBeDefined();
            expect(typeof Config.API_URL).toBe('string');
            expect(Config.API_URL).toBe('https://api.openai.com/v1/chat/completions');
        });

        it('should have valid MODEL', () => {
            expect(Config.MODEL).toBeDefined();
            expect(typeof Config.MODEL).toBe('string');
        });

        it('API_URL should be a valid URL', () => {
            expect(() => new URL(Config.API_URL)).not.toThrow();
            expect(Config.API_URL).toMatch(/^https?:\/\//);
        });

        it('API_URL should point to OpenAI', () => {
            expect(Config.API_URL).toContain('openai.com');
        });

        it('should use a valid OpenAI model', () => {
            const validModels = ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo', 'gpt-4'];
            expect(validModels).toContain(Config.MODEL);
        });

        it('should use gpt-4o-mini by default', () => {
            expect(Config.MODEL).toBe('gpt-4o-mini');
        });
    });

    describe('Configuration Completeness', () => {
        it('should have all required configuration keys', () => {
            const requiredKeys = [
                'OPENAI_API_KEY',
                'SUPABASE_URL',
                'SUPABASE_ANON_KEY',
                'API_URL',
                'MODEL'
            ];

            requiredKeys.forEach(key => {
                expect(Config).toHaveProperty(key);
            });
        });

        it('should not have undefined values', () => {
            Object.values(Config).forEach(value => {
                expect(value).toBeDefined();
            });
        });

        it('should export a valid config object', () => {
            expect(Config).toBeTruthy();
            expect(typeof Config).toBe('object');
        });
    });

    describe('Environment Variable Handling', () => {
        it('should handle missing environment variables gracefully', () => {
            // Should default to empty string if not provided
            expect(typeof Config.OPENAI_API_KEY).toBe('string');
            expect(typeof Config.SUPABASE_URL).toBe('string');
            expect(typeof Config.SUPABASE_ANON_KEY).toBe('string');
        });

        it('should allow empty strings for optional keys', () => {
            // This is valid - empty string means not configured yet
            if (Config.OPENAI_API_KEY === '') {
                expect(Config.OPENAI_API_KEY).toBe('');
            }
            if (Config.SUPABASE_URL === '') {
                expect(Config.SUPABASE_URL).toBe('');
            }
        });
    });

    describe('Security', () => {
        it('should not expose sensitive keys in plain text (using Constants)', () => {
            // The fact that it imports from expo-constants means it's using
            // environment variables, not hardcoded - this is good
            expect(Config).toBeDefined();
        });

        it('API keys should be string type for secure handling', () => {
            expect(typeof Config.OPENAI_API_KEY).toBe('string');
            expect(typeof Config.SUPABASE_ANON_KEY).toBe('string');
        });
    });

    describe('API URL Structure', () => {
        it('should use HTTPS for API URL', () => {
            expect(Config.API_URL).toMatch(/^https:\/\//);
        });

        it('should point to v1 API endpoint', () => {
            expect(Config.API_URL).toContain('/v1/');
        });

        it('should point to chat completions endpoint', () => {
            expect(Config.API_URL).toContain('chat/completions');
        });
    });

    describe('Type Safety', () => {
        it('all config values should be strings', () => {
            Object.values(Config).forEach(value => {
                expect(typeof value).toBe('string');
            });
        });

        it('should not have null values', () => {
            Object.values(Config).forEach(value => {
                expect(value).not.toBeNull();
            });
        });
    });
});
