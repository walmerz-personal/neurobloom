import Constants from 'expo-constants';

export const Config = {
    // Load from environment variables
    // EXPO_PUBLIC_ variables are automatically inlined by Metro bundler during build
    OPENAI_API_KEY: process.env.EXPO_PUBLIC_OPENAI_API_KEY || '',
    SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || Constants.expoConfig?.extra?.supabaseUrl || '',
    SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || Constants.expoConfig?.extra?.supabaseAnonKey || '',

    // API Configuration
    API_URL: 'https://api.openai.com/v1/chat/completions',
    // gpt-4o-mini: Best balance of cost and quality for expert responses
    // gpt-4o: Most capable, higher cost
    // gpt-3.5-turbo: Cheapest, less nuanced
    MODEL: 'gpt-4o-mini',
};

// Log configuration status in development (DO NOT log actual keys!)
if (__DEV__) {
    console.log('🔑 Config Status:', {
        openAI: Config.OPENAI_API_KEY ? `✅ Configured (${Config.OPENAI_API_KEY.length} chars)` : '❌ Missing',
        supabase: Config.SUPABASE_URL ? '✅ Configured' : '❌ Missing',
    });
}
