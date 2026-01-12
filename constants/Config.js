import Constants from 'expo-constants';

// Helper to safely get config values with detailed logging
function getConfigValue(name, envKey, extraKey) {
    // In production builds, process.env.EXPO_PUBLIC_* is undefined at runtime
    // because Metro only inlines them from .env files (not from EAS Secrets)
    // So we prioritize Constants.expoConfig.extra which is set by app.config.js
    const fromExtra = Constants.expoConfig?.extra?.[extraKey];
    const fromEnv = process.env[envKey];

    const value = fromExtra || fromEnv || '';
    const source = fromExtra ? 'Constants.expoConfig.extra' : (fromEnv ? 'process.env' : 'missing');

    console.log(`📋 Config.${name}: ${value ? `✅ Loaded from ${source} (${value.length} chars)` : `❌ Not found`}`);

    return value;
}

export const Config = {
    // Supabase Configuration
    // Prioritize Constants.expoConfig.extra for production builds (works with EAS Secrets)
    // Fall back to process.env for local development (works with .env.local)
    SUPABASE_URL: getConfigValue('SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_URL', 'supabaseUrl'),
    SUPABASE_ANON_KEY: getConfigValue('SUPABASE_ANON_KEY', 'EXPO_PUBLIC_SUPABASE_ANON_KEY', 'supabaseAnonKey'),

    // OpenAI Configuration
    OPENAI_API_KEY: getConfigValue('OPENAI_API_KEY', 'EXPO_PUBLIC_OPENAI_API_KEY', 'openaiApiKey'),
    API_URL: 'https://api.openai.com/v1/chat/completions',
    MODEL: 'gpt-4o-mini',
};

// Log configuration status (in both dev and production for debugging)
console.log('🔑 Config Summary:', {
    supabase: Config.SUPABASE_URL ? '✅ Ready' : '❌ Missing',
    environment: __DEV__ ? 'Development' : 'Production',
});
