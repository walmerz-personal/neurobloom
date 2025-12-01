import Constants from 'expo-constants';

export const Config = {
    // Load from environment variables (set in app.config.js)
    OPENAI_API_KEY: Constants.expoConfig?.extra?.openaiApiKey || '',
    SUPABASE_URL: Constants.expoConfig?.extra?.supabaseUrl || '',
    SUPABASE_ANON_KEY: Constants.expoConfig?.extra?.supabaseAnonKey || '',

    // API Configuration
    API_URL: 'https://api.openai.com/v1/chat/completions',
    // gpt-4o-mini: Best balance of cost and quality for expert responses
    // gpt-4o: Most capable, higher cost
    // gpt-3.5-turbo: Cheapest, less nuanced
    MODEL: 'gpt-4o-mini',
};
