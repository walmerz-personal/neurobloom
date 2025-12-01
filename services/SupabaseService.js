// services/SupabaseService.js
import { createClient } from '@supabase/supabase-js';
import { Config } from '../constants/Config';
import 'react-native-url-polyfill/auto';

// Initialize Supabase client with error handling
let supabase = null;
let initError = null;

try {
    // Validate credentials exist
    if (!Config.SUPABASE_URL || Config.SUPABASE_URL === '') {
        const errorMsg = '❌ CRITICAL: SUPABASE_URL is not configured. Please set EXPO_PUBLIC_SUPABASE_URL environment variable.';
        console.error(errorMsg);
        initError = new Error(errorMsg);
    } else if (!Config.SUPABASE_ANON_KEY || Config.SUPABASE_ANON_KEY === '') {
        const errorMsg = '❌ CRITICAL: SUPABASE_ANON_KEY is not configured. Please set EXPO_PUBLIC_SUPABASE_ANON_KEY environment variable.';
        console.error(errorMsg);
        initError = new Error(errorMsg);
    } else {
        // Credentials exist, create client
        supabase = createClient(Config.SUPABASE_URL, Config.SUPABASE_ANON_KEY);
        console.log('✅ Supabase client initialized successfully');
    }
} catch (error) {
    const errorMsg = `❌ CRITICAL: Failed to initialize Supabase client: ${error.message}`;
    console.error(errorMsg);
    initError = error;
}


/**
 * Supabase Service
 * Central service for all backend operations
 */
export const SupabaseService = {
    // =============================================
    // INITIALIZATION CHECK
    // =============================================

    /**
     * Check if Supabase is properly initialized
     * @returns {boolean} true if initialized, false otherwise
     */
    isInitialized() {
        return supabase !== null && initError === null;
    },

    /**
     * Get initialization error if any
     * @returns {Error|null}
     */
    getInitError() {
        return initError;
    },

    // =============================================
    // AUTHENTICATION
    // =============================================

    /**
     * Sign up a new user
     * @param {string} email 
     * @param {string} password 
     * @param {string} name 
     * @param {string} role - 'survivor' or 'caregiver'
     * @returns {Promise<{user, error}>}
     */
    async signUp(email, password, name, role) {
        // Check initialization
        if (!this.isInitialized()) {
            return { user: null, error: initError || new Error('Supabase not initialized') };
        }

        try {
            // Create auth user with metadata (trigger will create users table entry)
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name,
                        role,
                    }
                }
            });

            if (authError) {
                console.error('❌ Auth signup error:', authError);
                return { user: null, error: authError };
            }

            console.log('✅ User signed up:', authData.user.id);
            // The trigger will automatically create the users table entry
            return { user: authData.user, error: null };
        } catch (error) {
            console.error('❌ Signup error:', error);
            return { user: null, error };
        }
    },

    /**
     * Sign in existing user
     * @param {string} email 
     * @param {string} password 
     * @returns {Promise<{user, session, error}>}
     */
    async signIn(email, password) {
        // Check initialization
        if (!this.isInitialized()) {
            return { user: null, session: null, error: initError || new Error('Supabase not initialized') };
        }

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error('❌ Sign in error:', error);
                return { user: null, session: null, error };
            }

            console.log('✅ User signed in:', data.user.id);
            return { user: data.user, session: data.session, error: null };
        } catch (error) {
            console.error('❌ Sign in error:', error);
            return { user: null, session: null, error };
        }
    },

    /**
     * Sign out current user
     */
    async signOut() {
        // Check initialization
        if (!this.isInitialized()) {
            return { error: initError || new Error('Supabase not initialized') };
        }

        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('❌ Sign out error:', error);
                return { error };
            }
            console.log('✅ User signed out');
            return { error: null };
        } catch (error) {
            console.error('❌ Sign out error:', error);
            return { error };
        }
    },

    /**
     * Get current session
     * @returns {Promise<{session, error}>}
     */
    async getSession() {
        // Check initialization
        if (!this.isInitialized()) {
            return { session: null, error: initError || new Error('Supabase not initialized') };
        }

        try {
            const { data, error } = await supabase.auth.getSession();
            return { session: data.session, error };
        } catch (error) {
            console.error('❌ Get session error:', error);
            return { session: null, error };
        }
    },

    /**
     * Get current user
     * @returns {Promise<{user, error}>}
     */
    async getCurrentUser() {
        // Check initialization
        if (!this.isInitialized()) {
            return { user: null, error: initError || new Error('Supabase not initialized') };
        }

        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            return { user, error };
        } catch (error) {
            console.error('❌ Get current user error:', error);
            return { user: null, error };
        }
    },

    /**
     * Listen to auth state changes
     */
    onAuthStateChange(callback) {
        // Check initialization
        if (!this.isInitialized()) {
            console.error('❌ Cannot listen to auth changes: Supabase not initialized');
            return { data: { subscription: { unsubscribe: () => { } } } };
        }
        return supabase.auth.onAuthStateChange(callback);
    },

    // =============================================
    // USER PROFILE
    // =============================================

    /**
     * Save user profile data
     * @param {string} userId 
     * @param {Object} profileData - {strokeDate, impairments, recoveryPhase, goals, preferences}
     * @returns {Promise<{data, error}>}
     */
    async saveUserProfile(userId, profileData) {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .upsert({
                    user_id: userId,
                    stroke_date: profileData.strokeDate || null,
                    impairments: profileData.impairments || [],
                    recovery_phase: profileData.recoveryPhase || null,
                    goals: profileData.goals || null,
                    preferences: profileData.preferences || {},
                })
                .select()
                .single();

            if (error) {
                console.error('❌ Save profile error:', error);
                return { data: null, error };
            }

            console.log('✅ Profile saved for user:', userId);
            return { data, error: null };
        } catch (error) {
            console.error('❌ Save profile error:', error);
            return { data: null, error };
        }
    },

    /**
     * Get user profile
     * @param {string} userId 
     * @returns {Promise<{profile, error}>}
     */
    async getUserProfile(userId) {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
                console.error('❌ Get profile error:', error);
                return { profile: null, error };
            }

            return { profile: data, error: null };
        } catch (error) {
            console.error('❌ Get profile error:', error);
            return { profile: null, error };
        }
    },

    /**
     * Get user data (from users table)
     * @param {string} userId 
     * @returns {Promise<{user, error}>}
     */
    async getUserData(userId) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('❌ Get user data error:', error);
                return { user: null, error };
            }

            return { user: data, error: null };
        } catch (error) {
            console.error('❌ Get user data error:', error);
            return { user: null, error };
        }
    },

    // =============================================
    // DAILY LOGS
    // =============================================

    /**
     * Save daily check-in log
     * @param {string} userId 
     * @param {Object} logData - {logDate, mood, painLevel, energyLevel, exercisesCompleted, notes}
     * @returns {Promise<{data, error}>}
     */
    async saveDailyLog(userId, logData) {
        try {
            const { data, error } = await supabase
                .from('daily_logs')
                .upsert({
                    user_id: userId,
                    log_date: logData.logDate,
                    mood: logData.mood,
                    pain_level: logData.painLevel,
                    energy_level: logData.energyLevel,
                    exercises_completed: logData.exercisesCompleted || [],
                    notes: logData.notes || null,
                }, {
                    onConflict: 'user_id,log_date' // Update if already exists for this date
                })
                .select()
                .single();

            if (error) {
                console.error('❌ Save daily log error:', error);
                return { data: null, error };
            }

            console.log('✅ Daily log saved for:', logData.logDate);
            return { data, error: null };
        } catch (error) {
            console.error('❌ Save daily log error:', error);
            return { data: null, error };
        }
    },

    /**
     * Get daily logs for a user
     * @param {string} userId 
     * @param {number} limit - Number of logs to retrieve (default: 30)
     * @returns {Promise<{logs, error}>}
     */
    async getDailyLogs(userId, limit = 30) {
        try {
            const { data, error } = await supabase
                .from('daily_logs')
                .select('*')
                .eq('user_id', userId)
                .order('log_date', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('❌ Get daily logs error:', error);
                return { logs: [], error };
            }

            return { logs: data, error: null };
        } catch (error) {
            console.error('❌ Get daily logs error:', error);
            return { logs: [], error };
        }
    },

    /**
     * Get today's log
     * @param {string} userId 
     * @returns {Promise<{log, error}>}
     */
    async getTodayLog(userId) {
        try {
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            const { data, error } = await supabase
                .from('daily_logs')
                .select('*')
                .eq('user_id', userId)
                .eq('log_date', today)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('❌ Get today log error:', error);
                return { log: null, error };
            }

            return { log: data, error: null };
        } catch (error) {
            console.error('❌ Get today log error:', error);
            return { log: null, error };
        }
    },

    // =============================================
    // CONVERSATIONS
    // =============================================

    /**
     * Save conversation with Lilly
     * @param {string} userId 
     * @param {Array} messages - Array of {role, content, timestamp}
     * @param {string} conversationId - Optional, for updating existing conversation
     * @returns {Promise<{data, error}>}
     */
    async saveConversation(userId, messages, conversationId = null) {
        try {
            if (conversationId) {
                // Update existing conversation
                const { data, error } = await supabase
                    .from('conversations')
                    .update({ messages })
                    .eq('id', conversationId)
                    .select()
                    .single();

                if (error) {
                    console.error('❌ Update conversation error:', error);
                    return { data: null, error };
                }

                return { data, error: null };
            } else {
                // Create new conversation
                const { data, error } = await supabase
                    .from('conversations')
                    .insert([{ user_id: userId, messages }])
                    .select()
                    .single();

                if (error) {
                    console.error('❌ Create conversation error:', error);
                    return { data: null, error };
                }

                console.log('✅ Conversation saved:', data.id);
                return { data, error: null };
            }
        } catch (error) {
            console.error('❌ Save conversation error:', error);
            return { data: null, error };
        }
    },

    /**
     * Get user's conversations
     * @param {string} userId 
     * @param {number} limit 
     * @returns {Promise<{conversations, error}>}
     */
    async getConversations(userId, limit = 10) {
        try {
            const { data, error } = await supabase
                .from('conversations')
                .select('*')
                .eq('user_id', userId)
                .order('updated_at', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('❌ Get conversations error:', error);
                return { conversations: [], error };
            }

            return { conversations: data, error: null };
        } catch (error) {
            console.error('❌ Get conversations error:', error);
            return { conversations: [], error };
        }
    },

    /**
     * Get most recent conversation
     * @param {string} userId 
     * @returns {Promise<{conversation, error}>}
     */
    async getLatestConversation(userId) {
        try {
            const { data, error } = await supabase
                .from('conversations')
                .select('*')
                .eq('user_id', userId)
                .order('updated_at', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('❌ Get latest conversation error:', error);
                return { conversation: null, error };
            }

            return { conversation: data, error: null };
        } catch (error) {
            console.error('❌ Get latest conversation error:', error);
            return { conversation: null, error };
        }
    },
};

export default SupabaseService;
