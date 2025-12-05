// services/SupabaseService.js
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config } from '../constants/Config';
import 'react-native-url-polyfill/auto';

// Custom storage adapter for React Native using AsyncStorage
// This ensures sessions persist across app restarts
const customStorage = {
    getItem: async (key) => {
        try {
            const value = await AsyncStorage.getItem(key);
            return value;
        } catch (error) {
            console.error('Error getting item from AsyncStorage:', error);
            return null;
        }
    },
    setItem: async (key, value) => {
        try {
            await AsyncStorage.setItem(key, value);
        } catch (error) {
            console.error('Error setting item in AsyncStorage:', error);
        }
    },
    removeItem: async (key) => {
        try {
            await AsyncStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing item from AsyncStorage:', error);
        }
    },
};

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
        // Credentials exist, create client with AsyncStorage for session persistence
        supabase = createClient(Config.SUPABASE_URL, Config.SUPABASE_ANON_KEY, {
            auth: {
                storage: customStorage,
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: false, // We handle deep links manually
            },
        });
        console.log('✅ Supabase client initialized successfully with AsyncStorage');
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
     * Send password reset email
     * @param {string} email
     * @returns {Promise<{data, error}>}
     */
    async resetPasswordForEmail(email) {
        // Check initialization
        if (!this.isInitialized()) {
            return { data: null, error: initError || new Error('Supabase not initialized') };
        }

        try {
            const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: 'neurobloom://auth/reset-password',
            });

            if (error) {
                console.error('❌ Reset password error:', error);
                return { data: null, error };
            }

            console.log('✅ Password reset email sent to:', email);
            return { data, error: null };
        } catch (error) {
            console.error('❌ Reset password error:', error);
            return { data: null, error };
        }
    },



    /**
     * Set session manually (e.g. from deep link)
     * @param {string} accessToken 
     * @param {string} refreshToken 
     * @returns {Promise<{data, error}>}
     */
    async setSession(accessToken, refreshToken) {
        if (!this.isInitialized()) {
            return { data: null, error: initError || new Error('Supabase not initialized') };
        }

        try {
            const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
            });

            if (error) {
                console.error('❌ Set session error:', error);
                return { data: null, error };
            }

            console.log('✅ Session set manually');
            return { data, error: null };
        } catch (error) {
            console.error('❌ Set session error:', error);
            return { data: null, error };
        }
    },

    /**
     * Update user password
     * @param {string} newPassword
     * @returns {Promise<{data, error}>}
     */
    async updatePassword(newPassword) {
        // Check initialization
        if (!this.isInitialized()) {
            return { data: null, error: initError || new Error('Supabase not initialized') };
        }

        try {
            const { data, error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) {
                console.error('❌ Update password error:', error);
                return { data: null, error };
            }

            console.log('✅ Password updated successfully');
            return { data, error: null };
        } catch (error) {
            console.error('❌ Update password error:', error);
            return { data: null, error };
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

    /**
     * Update user data (in users table)
     * @param {string} userId 
     * @param {Object} updates - { name, etc }
     * @returns {Promise<{user, error}>}
     */
    async updateUserData(userId, updates) {
        try {
            const { data, error } = await supabase
                .from('users')
                .update(updates)
                .eq('id', userId)
                .select()
                .single();

            if (error) {
                console.error('❌ Update user data error:', error);
                return { user: null, error };
            }

            return { user: data, error: null };
        } catch (error) {
            console.error('❌ Update user data error:', error);
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

    /**
     * Toggle exercise completion status for today
     * @param {string} userId 
     * @param {string} exerciseId 
     * @returns {Promise<{data, error}>}
     */
    async toggleExerciseCompletion(userId, exerciseId) {
        try {
            const today = new Date().toISOString().split('T')[0];

            // 1. Get today's log
            const { log, error: getError } = await this.getTodayLog(userId);

            if (getError) return { data: null, error: getError };

            let exercises = [];
            let logData = {};

            if (log) {
                // Log exists, update it
                exercises = log.exercises_completed || [];
                const exists = exercises.includes(exerciseId);

                if (exists) {
                    exercises = exercises.filter(id => id !== exerciseId);
                } else {
                    exercises.push(exerciseId);
                }

                logData = {
                    ...log,
                    exercises_completed: exercises
                };
            } else {
                // Create new log
                exercises = [exerciseId];
                logData = {
                    user_id: userId,
                    log_date: today,
                    exercises_completed: exercises
                };
            }

            // 2. Save updated log
            const { data, error: saveError } = await this.saveDailyLog(userId, {
                logDate: today,
                mood: logData.mood,
                painLevel: logData.pain_level,
                energyLevel: logData.energy_level,
                exercisesCompleted: exercises,
                notes: logData.notes
            });

            if (saveError) return { data: null, error: saveError };

            return { data, error: null };

        } catch (error) {
            console.error('❌ Toggle exercise error:', error);
            return { data: null, error };
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

    // =============================================
    // GAMIFICATION (GARDEN)
    // =============================================

    /**
     * Get user points
     * @param {string} userId 
     * @returns {Promise<{points, error}>}
     */
    async getUserPoints(userId) {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('points')
                .eq('user_id', userId)
                .single();

            if (error) {
                console.error('❌ Get points error:', error);
                return { points: 0, error };
            }

            return { points: data?.points || 0, error: null };
        } catch (error) {
            console.error('❌ Get points error:', error);
            return { points: 0, error };
        }
    },

    /**
     * Update user points
     * @param {string} userId 
     * @param {number} points 
     * @returns {Promise<{data, error}>}
     */
    async updateUserPoints(userId, points) {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .update({ points })
                .eq('user_id', userId)
                .select()
                .single();

            if (error) {
                console.error('❌ Update points error:', error);
                return { data: null, error };
            }

            return { data, error: null };
        } catch (error) {
            console.error('❌ Update points error:', error);
            return { data: null, error };
        }
    },

    /**
     * Get all available items (seeds)
     * @returns {Promise<{items, error}>}
     */
    async getItems() {
        try {
            const { data, error } = await supabase
                .from('items')
                .select('*')
                .order('cost', { ascending: true });

            if (error) {
                console.error('❌ Get items error:', error);
                return { items: [], error };
            }

            return { items: data, error: null };
        } catch (error) {
            console.error('❌ Get items error:', error);
            return { items: [], error };
        }
    },

    /**
     * Get user inventory
     * @param {string} userId 
     * @returns {Promise<{inventory, error}>}
     */
    async getInventory(userId) {
        try {
            const { data, error } = await supabase
                .from('user_inventory')
                .select('*, items(*)')
                .eq('user_id', userId);

            if (error) {
                console.error('❌ Get inventory error:', error);
                return { inventory: [], error };
            }

            return { inventory: data, error: null };
        } catch (error) {
            console.error('❌ Get inventory error:', error);
            return { inventory: [], error };
        }
    },

    /**
     * Buy an item
     * @param {string} userId 
     * @param {string} itemId 
     * @param {number} cost 
     * @returns {Promise<{success, error}>}
     */
    async buyItem(userId, itemId, cost) {
        try {
            // 1. Check points
            const { points, error: pointsError } = await this.getUserPoints(userId);
            if (pointsError) return { success: false, error: pointsError };

            if (points < cost) {
                return { success: false, error: new Error('Insufficient points') };
            }

            // 2. Deduct points
            const { error: updateError } = await this.updateUserPoints(userId, points - cost);
            if (updateError) return { success: false, error: updateError };

            // 3. Add to inventory
            // Check if already owns
            const { data: existing } = await supabase
                .from('user_inventory')
                .select('*')
                .eq('user_id', userId)
                .eq('item_id', itemId)
                .single();

            let inventoryError;
            if (existing) {
                const { error } = await supabase
                    .from('user_inventory')
                    .update({ quantity: existing.quantity + 1 })
                    .eq('id', existing.id);
                inventoryError = error;
            } else {
                const { error } = await supabase
                    .from('user_inventory')
                    .insert([{ user_id: userId, item_id: itemId, quantity: 1 }]);
                inventoryError = error;
            }

            if (inventoryError) {
                // Rollback points (simplified)
                await this.updateUserPoints(userId, points);
                return { success: false, error: inventoryError };
            }

            return { success: true, error: null };

        } catch (error) {
            console.error('❌ Buy item error:', error);
            return { success: false, error };
        }
    },

    /**
     * Get garden plants
     * @param {string} userId 
     * @returns {Promise<{plants, error}>}
     */
    async getGardenPlants(userId) {
        try {
            const { data, error } = await supabase
                .from('garden_plants')
                .select('*, items(*)')
                .eq('user_id', userId)
                .order('box_index', { ascending: true });

            if (error) {
                console.error('❌ Get garden plants error:', error);
                return { plants: [], error };
            }

            return { plants: data, error: null };
        } catch (error) {
            console.error('❌ Get garden plants error:', error);
            return { plants: [], error };
        }
    },

    /**
     * Plant a seed
     * @param {string} userId 
     * @param {string} itemId 
     * @param {number} boxIndex 
     * @returns {Promise<{success, error}>}
     */
    async plantSeed(userId, itemId, boxIndex) {
        try {
            // 1. Check inventory
            const { data: inventoryItem } = await supabase
                .from('user_inventory')
                .select('*')
                .eq('user_id', userId)
                .eq('item_id', itemId)
                .single();

            if (!inventoryItem || inventoryItem.quantity < 1) {
                return { success: false, error: new Error('Item not in inventory') };
            }

            // 2. Plant it
            const { error: plantError } = await supabase
                .from('garden_plants')
                .insert([{
                    user_id: userId,
                    item_id: itemId,
                    box_index: boxIndex,
                    planted_at: new Date().toISOString()
                }]);

            if (plantError) return { success: false, error: plantError };

            // 3. Decrement inventory
            if (inventoryItem.quantity > 1) {
                await supabase
                    .from('user_inventory')
                    .update({ quantity: inventoryItem.quantity - 1 })
                    .eq('id', inventoryItem.id);
            } else {
                await supabase
                    .from('user_inventory')
                    .delete()
                    .eq('id', inventoryItem.id);
            }

            return { success: true, error: null };

        } catch (error) {
            console.error('❌ Plant seed error:', error);
            return { success: false, error };
        }
    },

    // =============================================
    // ACCOUNT MANAGEMENT
    // =============================================

    /**
     * Delete user account and all associated data
     * WARNING: This is a destructive operation that cannot be undone
     * @param {string} userId 
     * @returns {Promise<{success, error}>}
     */
    async deleteUserAccount(userId) {
        // Check initialization
        if (!this.isInitialized()) {
            return { success: false, error: initError || new Error('Supabase not initialized') };
        }

        try {
            console.log('🗑️ Starting account deletion for user:', userId);

            // Delete user from auth.users
            // This will CASCADE delete from all tables due to ON DELETE CASCADE foreign keys
            // Tables affected: users, user_profiles, daily_logs, conversations, user_inventory, garden_plants
            const { error: authError } = await supabase.auth.admin.deleteUser(userId);

            if (authError) {
                // If we don't have admin access, try deleting from the tables directly
                console.warn('⚠️ Auth admin delete not available, deleting data manually');

                // Delete in correct order (children first, parents last)
                await supabase.from('user_inventory').delete().eq('user_id', userId);
                await supabase.from('garden_plants').delete().eq('user_id', userId);
                await supabase.from('conversations').delete().eq('user_id', userId);
                await supabase.from('daily_logs').delete().eq('user_id', userId);
                await supabase.from('user_profiles').delete().eq('user_id', userId);
                await supabase.from('users').delete().eq('id', userId);

                // Note: Without admin access, we cannot delete from auth.users
                // The user will need to contact support or the auth record will remain orphaned
                console.log('✅ User data deleted from database tables');
            } else {
                console.log('✅ User account and all data deleted successfully');
            }

            return { success: true, error: null };
        } catch (error) {
            console.error('❌ Delete account error:', error);
            return { success: false, error };
        }
    },

    /**
     * Call a Supabase Edge Function with automatic authentication
     * @param {string} functionName - Name of the Edge Function
     * @param {object} body - Request body to send to the function
     * @returns {Promise<{data: any, error: any}>}
     */
    async callEdgeFunction(functionName, body) {
        if (!supabase) {
            return {
                data: null,
                error: new Error('Supabase client not initialized')
            };
        }

        try {
            const { data, error } = await supabase.functions.invoke(functionName, {
                body
            });

            return { data, error };
        } catch (error) {
            console.error(`❌ Error calling Edge Function ${functionName}:`, error);
            return { data: null, error };
        }
    },
};

export default SupabaseService;
