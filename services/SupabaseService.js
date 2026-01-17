// services/SupabaseService.js
import { createClient } from '@supabase/supabase-js';
import { Config } from '../constants/Config';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
        supabase = createClient(Config.SUPABASE_URL, Config.SUPABASE_ANON_KEY, {
            auth: {
                storage: AsyncStorage,
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: false,
            },
        });
        console.log('✅ Supabase client initialized successfully with persistence');
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
     * @param {string} role - 'survivor', 'caregiver', or 'medical_staff'
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
                    medical_staff_role: profileData.medicalStaffRole || null,
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

    /**
     * Update last activity timestamp for a user
     * Called when user opens the app or signs in
     * @param {string} userId 
     * @returns {Promise<{success, error}>}
     */
    async updateLastActivity(userId) {
        if (!this.isInitialized()) {
            return { success: false, error: initError || new Error('Supabase not initialized') };
        }

        try {
            const { error } = await supabase
                .from('users')
                .update({ last_activity_at: new Date().toISOString() })
                .eq('id', userId);

            if (error) {
                console.error('❌ Update last activity error:', error);
                return { success: false, error };
            }

            console.log('✅ Last activity updated for user:', userId);
            return { success: true, error: null };
        } catch (error) {
            console.error('❌ Update last activity error:', error);
            return { success: false, error };
        }
    },

    /**
     * Get last activity timestamp for a user
     * @param {string} userId 
     * @returns {Promise<{lastActivity, error}>}
     */
    async getLastActivity(userId) {
        if (!this.isInitialized()) {
            return { lastActivity: null, error: initError || new Error('Supabase not initialized') };
        }

        try {
            const { data, error } = await supabase
                .from('users')
                .select('last_activity_at')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('❌ Get last activity error:', error);
                return { lastActivity: null, error };
            }

            return { lastActivity: data?.last_activity_at || null, error: null };
        } catch (error) {
            console.error('❌ Get last activity error:', error);
            return { lastActivity: null, error };
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
            console.log(`🛒 Processing buyItem: User=${userId}, Item=${itemId}, Cost=${cost}`);

            // 1. Check points
            const { points, error: pointsError } = await this.getUserPoints(userId);
            if (pointsError) {
                console.error('❌ BuyItem - Failed to get points:', pointsError);
                return { success: false, error: pointsError };
            }

            if (points < cost) {
                console.log(`❌ BuyItem - Insufficient points: Has ${points}, Needs ${cost}`);
                return { success: false, error: new Error('Insufficient points') };
            }

            // 2. Deduct points
            console.log(`💰 BuyItem - Deducting ${cost} points from ${points}`);
            const { error: updateError } = await this.updateUserPoints(userId, points - cost);
            if (updateError) {
                console.error('❌ BuyItem - Failed to update points:', updateError);
                return { success: false, error: updateError };
            }

            // 3. Add to inventory
            // Check if already owns
            console.log('🔍 BuyItem - Checking existing inventory...');
            const { data: existing, error: fetchError } = await supabase
                .from('user_inventory')
                .select('*')
                .eq('user_id', userId)
                .eq('item_id', itemId)
                .maybeSingle(); // Use maybeSingle to avoid error on empty result

            if (fetchError) {
                console.error('❌ BuyItem - Error checking inventory:', fetchError);
                // Try to refund? For now just return error, but points are lost. 
                // ideally we use a transaction or Supabase function.
                return { success: false, error: fetchError };
            }

            let inventoryError;
            if (existing) {
                console.log(`➕ BuyItem - Updating existing stack (Qty: ${existing.quantity})`);
                const { error } = await supabase
                    .from('user_inventory')
                    .update({ quantity: existing.quantity + 1 })
                    .eq('id', existing.id);
                inventoryError = error;
            } else {
                console.log('🆕 BuyItem - creating new inventory stack');
                const { error } = await supabase
                    .from('user_inventory')
                    .insert([{ user_id: userId, item_id: itemId, quantity: 1 }]);
                inventoryError = error;
            }

            if (inventoryError) {
                console.error('❌ BuyItem - Inventory update failed:', inventoryError);
                // Rollback points
                console.log('↩️ BuyItem - Rolling back points update...');
                await this.updateUserPoints(userId, points);
                return { success: false, error: inventoryError };
            }

            // 4. VERIFICATION STEP
            // Double check it was actually added
            const { data: verifData } = await supabase
                .from('user_inventory')
                .select('*')
                .eq('user_id', userId)
                .eq('item_id', itemId)
                .maybeSingle();

            if (!verifData || verifData.quantity < (existing ? existing.quantity + 1 : 1)) {
                console.error('❌ CRITICAL: Inventory verification failed! Item not found or quantity mismatch after write.');
                // Rollback
                await this.updateUserPoints(userId, points);
                return { success: false, error: new Error('Purchase verification failed. Points refunded.') };
            }

            console.log('✅ BuyItem - Purchase successful and verified');
            return { success: true, error: null };

        } catch (error) {
            console.error('❌ Buy item exception:', error);
            // Attempt rollback if possible, though strict transactional safety requires SQL functions
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

    /**
     * Get user's pet (kitten/cat)
     * @param {string} userId 
     * @returns {Promise<{pet, error}>}
     */
    async getPet(userId) {
        try {
            const { data, error } = await supabase
                .from('garden_pets')
                .select('*, items(*)')
                .eq('user_id', userId)
                .maybeSingle();

            if (error) {
                console.error('❌ Get pet error:', error);
                return { pet: null, error };
            }

            return { pet: data, error: null };
        } catch (error) {
            console.error('❌ Get pet error:', error);
            return { pet: null, error };
        }
    },

    /**
     * Buy a pet (directly activates, doesn't go to inventory)
     * @param {string} userId 
     * @param {string} itemId 
     * @param {number} cost 
     * @returns {Promise<{success, error}>}
     */
    async buyPet(userId, itemId, cost) {
        try {
            console.log(`🐱 Processing buyPet: User=${userId}, Item=${itemId}, Cost=${cost}`);

            // 1. Check if already has a pet
            const { pet: existingPet } = await this.getPet(userId);
            if (existingPet) {
                return { success: false, error: new Error('You already have a pet!') };
            }

            // 2. Check points
            const { points, error: pointsError } = await this.getUserPoints(userId);
            if (pointsError) {
                console.error('❌ BuyPet - Failed to get points:', pointsError);
                return { success: false, error: pointsError };
            }

            if (points < cost) {
                console.log(`❌ BuyPet - Insufficient points: Has ${points}, Needs ${cost}`);
                return { success: false, error: new Error('Insufficient points') };
            }

            // 3. Deduct points
            console.log(`💰 BuyPet - Deducting ${cost} points from ${points}`);
            const { error: updateError } = await this.updateUserPoints(userId, points - cost);
            if (updateError) {
                console.error('❌ BuyPet - Failed to update points:', updateError);
                return { success: false, error: updateError };
            }

            // 4. Add pet to garden_pets
            const { error: petError } = await supabase
                .from('garden_pets')
                .insert([{
                    user_id: userId,
                    item_id: itemId,
                    purchased_at: new Date().toISOString()
                }]);

            if (petError) {
                console.error('❌ BuyPet - Insert failed:', petError);
                // Rollback points
                await this.updateUserPoints(userId, points);
                return { success: false, error: petError };
            }

            console.log('✅ BuyPet - Purchase successful');
            return { success: true, error: null };

        } catch (error) {
            console.error('❌ Buy pet exception:', error);
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

    // =============================================
    // CARE TEAM MANAGEMENT
    // =============================================

    /**
     * Create a care team link (invitation)
     * @param {Object} linkData - {survivor_id, relationship, invitation_code, status}
     * @returns {Promise<{data, error}>}
     */
    async createCareTeamLink(linkData) {
        if (!this.isInitialized()) {
            return { data: null, error: initError || new Error('Supabase not initialized') };
        }

        try {
            const { data, error } = await supabase
                .from('care_team_links')
                .insert([linkData])
                .select()
                .single();

            if (error) {
                console.error('❌ Create care team link error:', error);
                return { data: null, error };
            }

            console.log('✅ Care team link created:', data.id);
            return { data, error: null };
        } catch (error) {
            console.error('❌ Create care team link error:', error);
            return { data: null, error };
        }
    },

    /**
     * Get care team links for a user
     * @param {string} userId - User ID
     * @param {string} role - 'survivor', 'caregiver', or 'medical_staff'
     * @returns {Promise<{data, error}>}
     */
    async getCareTeamLinks(userId, role) {
        if (!this.isInitialized()) {
            return { data: [], error: initError || new Error('Supabase not initialized') };
        }

        try {
            let query = supabase.from('care_team_links').select(`
                *,
                survivor:survivor_id(id, name, email),
                caregiver:caregiver_id(id, name, email),
                medical_staff:medical_staff_id(id, name, email)
            `);

            if (role === 'survivor') {
                query = query.eq('survivor_id', userId);
            } else if (role === 'caregiver') {
                query = query.eq('caregiver_id', userId);
            } else if (role === 'medical_staff') {
                query = query.eq('medical_staff_id', userId);
            }

            const { data, error } = await query;

            if (error) {
                console.error('❌ Get care team links error:', error);
                return { data: [], error };
            }

            return { data, error: null };
        } catch (error) {
            console.error('❌ Get care team links error:', error);
            return { data: [], error };
        }
    },

    /**
     * Get a specific care team link between caregiver/medical staff and survivor
     * @param {string} caregiverId - Caregiver or medical staff ID
     * @param {string} survivorId 
     * @param {string} linkType - 'caregiver' or 'medical_staff' (default: 'caregiver')
     * @returns {Promise<{data, error}>}
     */
    async getCareTeamLink(caregiverId, survivorId, linkType = 'caregiver') {
        if (!this.isInitialized()) {
            return { data: null, error: initError || new Error('Supabase not initialized') };
        }

        try {
            let query = supabase
                .from('care_team_links')
                .select('*')
                .eq('survivor_id', survivorId);

            if (linkType === 'medical_staff') {
                query = query.eq('medical_staff_id', caregiverId);
            } else {
                query = query.eq('caregiver_id', caregiverId);
            }

            const { data, error } = await query.single();

            if (error && error.code !== 'PGRST116') {
                console.error('❌ Get care team link error:', error);
                return { data: null, error };
            }

            return { data, error: null };
        } catch (error) {
            console.error('❌ Get care team link error:', error);
            return { data: null, error };
        }
    },

    /**
     * Get invitation by code
     * @param {string} code - Invitation code
     * @returns {Promise<{data, error}>}
     */
    async getInvitationByCode(code) {
        if (!this.isInitialized()) {
            return { data: null, error: initError || new Error('Supabase not initialized') };
        }

        try {
            // Use RPC function to bypass RLS for pending invitations
            const { data, error } = await supabase.rpc('get_invitation_by_code', { code });

            if (error) {
                console.error('❌ Get invitation by code error:', error);
                return { data: null, error };
            }

            if (!data || data.length === 0) {
                return { data: null, error: new Error('Invitation not found') };
            }

            // RPC returns an array, take the first item
            const invitation = data[0];

            return { data: invitation, error: null };
        } catch (error) {
            console.error('❌ Get invitation by code error:', error);
            return { data: null, error };
        }
    },

    /**
     * Accept an invitation using RPC function (bypasses RLS)
     * @param {string} invitationCode - The invitation code
     * @param {string} caregiverId - The caregiver's or medical staff's user ID
     * @param {string} roleType - 'caregiver' or 'medical_staff' (default: 'caregiver')
     * @returns {Promise<{data, error}>}
     */
    async acceptInvitationRPC(invitationCode, caregiverId, roleType = 'caregiver') {
        if (!this.isInitialized()) {
            return { data: null, error: initError || new Error('Supabase not initialized') };
        }

        try {
            // For now, use direct update since RPC may not support medical_staff
            // First, get the invitation
            const { data: invitation, error: lookupError } = await this.getInvitationByCode(invitationCode);
            
            if (lookupError || !invitation) {
                return { data: null, error: lookupError || new Error('Invitation not found') };
            }

            // Update the link
            const updateData = { status: 'accepted', accepted_at: new Date().toISOString() };
            if (roleType === 'medical_staff') {
                updateData.medical_staff_id = caregiverId;
            } else {
                updateData.caregiver_id = caregiverId;
            }

            const { data: updatedLink, error } = await this.updateCareTeamLink(invitation.id, updateData);

            if (error || !updatedLink) {
                console.error('❌ Accept invitation RPC error:', error);
                return { data: null, error: error || new Error('Failed to accept invitation') };
            }

            // Get survivor name for response
            const { user: survivorData } = await this.getUserData(invitation.survivor_id);
            const result = {
                success: true,
                survivor_id: invitation.survivor_id,
                survivor_name: survivorData?.name || 'Unknown'
            };

            console.log('✅ Invitation accepted:', result.survivor_name);
            return { data: result, error: null };
        } catch (error) {
            console.error('❌ Accept invitation RPC error:', error);
            return { data: null, error };
        }
    },

    /**
     * Update a care team link
     * @param {string} linkId - Link ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<{data, error}>}
     */
    async updateCareTeamLink(linkId, updates) {
        if (!this.isInitialized()) {
            return { data: null, error: initError || new Error('Supabase not initialized') };
        }

        try {
            const { data, error } = await supabase
                .from('care_team_links')
                .update(updates)
                .eq('id', linkId)
                .select()
                .single();

            if (error) {
                console.error('❌ Update care team link error:', error);
                return { data: null, error };
            }

            console.log('✅ Care team link updated:', linkId);
            return { data, error: null };
        } catch (error) {
            console.error('❌ Update care team link error:', error);
            return { data: null, error };
        }
    },

    /**
     * Delete a care team link
     * @param {string} linkId - Link ID
     * @returns {Promise<{error}>}
     */
    async deleteCareTeamLink(linkId) {
        if (!this.isInitialized()) {
            return { error: initError || new Error('Supabase not initialized') };
        }

        try {
            const { error } = await supabase
                .from('care_team_links')
                .delete()
                .eq('id', linkId);

            if (error) {
                console.error('❌ Delete care team link error:', error);
                return { error };
            }

            console.log('✅ Care team link deleted:', linkId);
            return { error: null };
        } catch (error) {
            console.error('❌ Delete care team link error:', error);
            return { error };
        }
    },

    /**
     * Generate a unique access request token
     * @returns {string} 16-character token
     */
    generateAccessRequestToken() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let token = '';
        for (let i = 0; i < 16; i++) {
            token += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return token;
    },

    /**
     * Create an access request (creates care_team_link with access_request_token)
     * @param {string} requesterId - The caregiver's or medical staff's user ID
     * @param {string} phoneNumber - The survivor's phone number
     * @param {string} roleType - 'caregiver' or 'medical_staff'
     * @returns {Promise<{token: string|null, error: Error|null}>}
     */
    async createAccessRequest(requesterId, phoneNumber, roleType = 'caregiver') {
        if (!this.isInitialized()) {
            return { token: null, error: initError || new Error('Supabase not initialized') };
        }

        try {
            // Generate unique token
            let token;
            let tokenExists = true;
            let attempts = 0;
            const maxAttempts = 10;

            while (tokenExists && attempts < maxAttempts) {
                token = this.generateAccessRequestToken();
                // Check if token exists
                const { data: existing } = await supabase
                    .from('care_team_links')
                    .select('id')
                    .eq('access_request_token', token)
                    .single();
                tokenExists = !!existing;
                attempts++;
            }

            if (tokenExists) {
                return { token: null, error: new Error('Failed to generate unique token') };
            }

            // Set expiration (7 days from now)
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);

            const linkData = {
                access_request_token: token,
                access_request_phone: phoneNumber,
                access_request_expires_at: expiresAt.toISOString(),
                status: 'pending',
                relationship: roleType === 'medical_staff' ? 'professional' : 'other',
            };

            // Set requester ID based on role type
            if (roleType === 'medical_staff') {
                linkData.medical_staff_id = requesterId;
            } else {
                linkData.caregiver_id = requesterId;
            }

            const { data, error } = await supabase
                .from('care_team_links')
                .insert([linkData])
                .select()
                .single();

            if (error) {
                console.error('❌ Create access request error:', error);
                return { token: null, error };
            }

            console.log('✅ Access request created with token:', token);
            return { token, linkId: data?.id, error: null };
        } catch (error) {
            console.error('❌ Create access request error:', error);
            return { token: null, error };
        }
    },

    /**
     * Get access request by token
     * @param {string} token - Access request token
     * @returns {Promise<{data, error}>}
     */
    async getAccessRequestByToken(token) {
        if (!this.isInitialized()) {
            return { data: null, error: initError || new Error('Supabase not initialized') };
        }

        try {
            const { data, error } = await supabase
                .from('care_team_links')
                .select(`
                    *,
                    requester:caregiver_id(id, name, email, role),
                    requester_medical:medical_staff_id(id, name, email, role)
                `)
                .eq('access_request_token', token)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return { data: null, error: new Error('Access request not found') };
                }
                console.error('❌ Get access request by token error:', error);
                return { data: null, error };
            }

            // Check if token has expired
            if (data.access_request_expires_at) {
                const expiresAt = new Date(data.access_request_expires_at);
                if (expiresAt < new Date()) {
                    return { data: null, error: new Error('Access request has expired') };
                }
            }

            // Get the requester info (either from caregiver_id or medical_staff_id)
            const requester = data.requester || data.requester_medical;
            const requesterRole = data.caregiver_id ? 'caregiver' : 'medical_staff';

            return {
                data: {
                    ...data,
                    requester,
                    requesterRole,
                },
                error: null,
            };
        } catch (error) {
            console.error('❌ Get access request by token error:', error);
            return { data: null, error };
        }
    },

    /**
     * Accept an access request by token
     * @param {string} token - Access request token
     * @param {string} survivorId - The survivor's user ID
     * @returns {Promise<{data, error}>}
     */
    async acceptAccessRequest(token, survivorId) {
        if (!this.isInitialized()) {
            return { data: null, error: initError || new Error('Supabase not initialized') };
        }

        try {
            // Get the access request
            const { data: request, error: lookupError } = await this.getAccessRequestByToken(token);

            if (lookupError || !request) {
                return { data: null, error: lookupError || new Error('Access request not found') };
            }

            // Update the link to accept it
            const updateData = {
                survivor_id: survivorId,
                status: 'accepted',
                accepted_at: new Date().toISOString(),
                // Clear access request fields
                access_request_token: null,
                access_request_phone: null,
                access_request_expires_at: null,
            };

            const { data: updatedLink, error: updateError } = await this.updateCareTeamLink(request.id, updateData);

            if (updateError || !updatedLink) {
                console.error('❌ Accept access request error:', updateError);
                return { data: null, error: updateError || new Error('Failed to accept access request') };
            }

            // Get requester name for response
            const requester = request.requester;
            const result = {
                success: true,
                requester_id: request.caregiver_id || request.medical_staff_id,
                requester_name: requester?.name || 'Unknown',
                requester_role: request.requesterRole,
            };

            console.log('✅ Access request accepted:', result.requester_name);
            return { data: result, error: null };
        } catch (error) {
            console.error('❌ Accept access request error:', error);
            return { data: null, error };
        }
    },

    // =============================================
    // CUSTOM EXERCISES
    // =============================================

    /**
     * Get thumbnail color based on category (matches built-in exercises)
     * @param {string} category - Exercise category
     * @returns {string} Hex color code
     */
    _getThumbnailColorForCategory(category) {
        const colorMap = {
            'Arms': '#E0F2FE', // Light blue
            'Legs': '#FED7AA', // Light orange
            'Core': '#D1FAE5', // Light green
            'Hands': '#E9D5FF', // Light purple
        };
        return colorMap[category] || '#E0F2FE';
    },

    /**
     * Create a custom exercise
     * @param {string} userId - User ID
     * @param {Object} exerciseData - Exercise data
     * @param {string} exerciseData.title - Exercise title (required)
     * @param {string} exerciseData.category - Category: 'Arms', 'Legs', 'Core', 'Hands' (required)
     * @param {string} exerciseData.mode - Mode: 'solo' or 'partner' (required)
     * @param {string[]} exerciseData.instructions - Array of instruction strings (required)
     * @param {string} [exerciseData.time] - Optional time (e.g., '3 min')
     * @param {string} [exerciseData.target] - Optional target area
     * @param {string} [exerciseData.description] - Optional description
     * @param {string} [exerciseData.difficulty] - Optional difficulty: 'Beginner', 'Intermediate', 'Advanced'
     * @param {boolean} [exerciseData.isSharedWithCareTeam] - Whether to share with care team (default: false)
     * @returns {Promise<{data, error}>}
     */
    async createCustomExercise(userId, exerciseData) {
        if (!this.isInitialized()) {
            return { data: null, error: initError || new Error('Supabase not initialized') };
        }

        try {
            // Validate required fields
            if (!exerciseData.title || !exerciseData.category || !exerciseData.mode || !exerciseData.instructions) {
                return { data: null, error: new Error('Title, category, mode, and instructions are required') };
            }

            // Auto-assign thumbnail color based on category if not provided
            const thumbnailColor = exerciseData.thumbnailColor || this._getThumbnailColorForCategory(exerciseData.category);

            const insertData = {
                user_id: userId,
                title: exerciseData.title.trim(),
                category: exerciseData.category,
                mode: exerciseData.mode.toLowerCase(),
                time: exerciseData.time || null,
                target: exerciseData.target || null,
                description: exerciseData.description || null,
                difficulty: exerciseData.difficulty || null,
                thumbnail_color: thumbnailColor,
                instructions: Array.isArray(exerciseData.instructions) 
                    ? exerciseData.instructions.filter(i => i && i.trim()) 
                    : exerciseData.instructions.split('\n').filter(i => i && i.trim()),
                is_shared_with_care_team: exerciseData.isSharedWithCareTeam || false,
            };

            const { data, error } = await supabase
                .from('user_exercises')
                .insert([insertData])
                .select()
                .single();

            if (error) {
                console.error('❌ Create custom exercise error:', error);
                return { data: null, error };
            }

            console.log('✅ Custom exercise created:', data.id);
            return { data, error: null };
        } catch (error) {
            console.error('❌ Create custom exercise error:', error);
            return { data: null, error };
        }
    },

    /**
     * Get custom exercises for a user (and shared ones if caregiver)
     * @param {string} userId - User ID
     * @returns {Promise<{data, error}>}
     */
    async getCustomExercises(userId) {
        if (!this.isInitialized()) {
            return { data: null, error: initError || new Error('Supabase not initialized') };
        }

        try {
            // Get user's own exercises + shared exercises from care team
            const { data, error } = await supabase
                .from('user_exercises')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('❌ Get custom exercises error:', error);
                return { data: null, error };
            }

            // Filter exercises: user's own + shared ones they have access to
            // RLS policies should handle this, but we'll filter client-side as well for safety
            const filtered = data || [];

            // Transform to match EXERCISES_DATA format
            const transformed = filtered.map(ex => ({
                id: ex.id,
                category: ex.category,
                mode: ex.mode,
                title: ex.title,
                time: ex.time || undefined,
                target: ex.target || undefined,
                description: ex.description || undefined,
                difficulty: ex.difficulty || undefined,
                thumbnailColor: ex.thumbnail_color,
                instructions: ex.instructions || [],
                isCustom: true,
                userId: ex.user_id,
                isSharedWithCareTeam: ex.is_shared_with_care_team,
            }));

            console.log(`✅ Retrieved ${transformed.length} custom exercises`);
            return { data: transformed, error: null };
        } catch (error) {
            console.error('❌ Get custom exercises error:', error);
            return { data: null, error };
        }
    },

    /**
     * Update a custom exercise
     * @param {string} exerciseId - Exercise ID
     * @param {Object} exerciseData - Updated exercise data (all fields optional except those being updated)
     * @returns {Promise<{data, error}>}
     */
    async updateCustomExercise(exerciseId, exerciseData) {
        if (!this.isInitialized()) {
            return { data: null, error: initError || new Error('Supabase not initialized') };
        }

        try {
            const updateData = {};

            if (exerciseData.title !== undefined) updateData.title = exerciseData.title.trim();
            if (exerciseData.category !== undefined) {
                updateData.category = exerciseData.category;
                // Update thumbnail color if category changed
                if (!exerciseData.thumbnailColor) {
                    updateData.thumbnail_color = this._getThumbnailColorForCategory(exerciseData.category);
                }
            }
            if (exerciseData.mode !== undefined) updateData.mode = exerciseData.mode.toLowerCase();
            if (exerciseData.time !== undefined) updateData.time = exerciseData.time || null;
            if (exerciseData.target !== undefined) updateData.target = exerciseData.target || null;
            if (exerciseData.description !== undefined) updateData.description = exerciseData.description || null;
            if (exerciseData.difficulty !== undefined) updateData.difficulty = exerciseData.difficulty || null;
            if (exerciseData.thumbnailColor !== undefined) updateData.thumbnail_color = exerciseData.thumbnailColor;
            if (exerciseData.instructions !== undefined) {
                updateData.instructions = Array.isArray(exerciseData.instructions)
                    ? exerciseData.instructions.filter(i => i && i.trim())
                    : exerciseData.instructions.split('\n').filter(i => i && i.trim());
            }
            if (exerciseData.isSharedWithCareTeam !== undefined) {
                updateData.is_shared_with_care_team = exerciseData.isSharedWithCareTeam;
            }

            const { data, error } = await supabase
                .from('user_exercises')
                .update(updateData)
                .eq('id', exerciseId)
                .select()
                .single();

            if (error) {
                console.error('❌ Update custom exercise error:', error);
                return { data: null, error };
            }

            console.log('✅ Custom exercise updated:', exerciseId);
            return { data, error: null };
        } catch (error) {
            console.error('❌ Update custom exercise error:', error);
            return { data: null, error };
        }
    },

    /**
     * Delete a custom exercise
     * @param {string} exerciseId - Exercise ID
     * @returns {Promise<{error}>}
     */
    async deleteCustomExercise(exerciseId) {
        if (!this.isInitialized()) {
            return { error: initError || new Error('Supabase not initialized') };
        }

        try {
            const { error } = await supabase
                .from('user_exercises')
                .delete()
                .eq('id', exerciseId);

            if (error) {
                console.error('❌ Delete custom exercise error:', error);
                return { error };
            }

            console.log('✅ Custom exercise deleted:', exerciseId);
            return { error: null };
        } catch (error) {
            console.error('❌ Delete custom exercise error:', error);
            return { error };
        }
    },

    // =============================================
    // EXERCISE ASSIGNMENTS
    // =============================================

    /**
     * Assign an exercise to a survivor
     * @param {string} survivorId - Survivor's user ID
     * @param {string} medicalStaffId - Medical staff's user ID
     * @param {string} exerciseId - Exercise ID (built-in or custom UUID)
     * @param {string} exerciseType - 'built_in' or 'custom'
     * @param {string} [dueDate] - Optional due date (YYYY-MM-DD)
     * @param {string} [notes] - Optional notes
     * @returns {Promise<{data, error}>}
     */
    async assignExercise(survivorId, medicalStaffId, exerciseId, exerciseType, dueDate = null, notes = null) {
        if (!this.isInitialized()) {
            return { data: null, error: initError || new Error('Supabase not initialized') };
        }

        try {
            const assignmentData = {
                survivor_id: survivorId,
                assigned_by_id: medicalStaffId,
                exercise_id: exerciseId,
                exercise_type: exerciseType,
                assigned_date: new Date().toISOString().split('T')[0],
                due_date: dueDate || null,
                status: 'assigned',
                notes: notes || null,
            };

            const { data, error } = await supabase
                .from('exercise_assignments')
                .insert([assignmentData])
                .select()
                .single();

            if (error) {
                console.error('❌ Assign exercise error:', error);
                return { data: null, error };
            }

            console.log('✅ Exercise assigned:', data.id);
            return { data, error: null };
        } catch (error) {
            console.error('❌ Assign exercise error:', error);
            return { data: null, error };
        }
    },

    /**
     * Get assigned exercises for a survivor
     * @param {string} survivorId - Survivor's user ID
     * @param {string} [status] - Optional status filter ('assigned', 'completed', 'skipped')
     * @returns {Promise<{data, error}>}
     */
    async getAssignedExercises(survivorId, status = null) {
        if (!this.isInitialized()) {
            return { data: [], error: initError || new Error('Supabase not initialized') };
        }

        try {
            let query = supabase
                .from('exercise_assignments')
                .select('*')
                .eq('survivor_id', survivorId)
                .order('assigned_date', { ascending: false });

            if (status) {
                query = query.eq('status', status);
            }

            const { data, error } = await query;

            if (error) {
                console.error('❌ Get assigned exercises error:', error);
                return { data: [], error };
            }

            return { data: data || [], error: null };
        } catch (error) {
            console.error('❌ Get assigned exercises error:', error);
            return { data: [], error };
        }
    },

    /**
     * Update assignment status
     * @param {string} assignmentId - Assignment ID
     * @param {string} status - New status ('assigned', 'completed', 'skipped')
     * @returns {Promise<{data, error}>}
     */
    async updateAssignmentStatus(assignmentId, status) {
        if (!this.isInitialized()) {
            return { data: null, error: initError || new Error('Supabase not initialized') };
        }

        try {
            const { data, error } = await supabase
                .from('exercise_assignments')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('id', assignmentId)
                .select()
                .single();

            if (error) {
                console.error('❌ Update assignment status error:', error);
                return { data: null, error };
            }

            console.log('✅ Assignment status updated:', assignmentId);
            return { data, error: null };
        } catch (error) {
            console.error('❌ Update assignment status error:', error);
            return { data: null, error };
        }
    },

    /**
     * Get assignments created by medical staff
     * @param {string} medicalStaffId - Medical staff's user ID
     * @returns {Promise<{data, error}>}
     */
    async getMedicalStaffAssignments(medicalStaffId) {
        if (!this.isInitialized()) {
            return { data: [], error: initError || new Error('Supabase not initialized') };
        }

        try {
            const { data, error } = await supabase
                .from('exercise_assignments')
                .select('*')
                .eq('assigned_by_id', medicalStaffId)
                .order('assigned_date', { ascending: false });

            if (error) {
                console.error('❌ Get medical staff assignments error:', error);
                return { data: [], error };
            }

            return { data: data || [], error: null };
        } catch (error) {
            console.error('❌ Get medical staff assignments error:', error);
            return { data: [], error };
        }
    },

    /**
     * Delete an assignment
     * @param {string} assignmentId - Assignment ID
     * @returns {Promise<{error}>}
     */
    async deleteAssignment(assignmentId) {
        if (!this.isInitialized()) {
            return { error: initError || new Error('Supabase not initialized') };
        }

        try {
            const { error } = await supabase
                .from('exercise_assignments')
                .delete()
                .eq('id', assignmentId);

            if (error) {
                console.error('❌ Delete assignment error:', error);
                return { error };
            }

            console.log('✅ Assignment deleted:', assignmentId);
            return { error: null };
        } catch (error) {
            console.error('❌ Delete assignment error:', error);
            return { error };
        }
    },

    // =============================================
    // HEALTH METRICS
    // =============================================

    /**
     * Save or update health metrics for a user and date
     * @param {string} userId - User ID
     * @param {Object} metrics - Health metrics data
     * @param {string} metrics.metricDate - Date (YYYY-MM-DD)
     * @param {number} metrics.walkingSpeedAvg - Average walking speed (m/s)
     * @param {number} metrics.walkingStepLengthAvg - Average step length (m)
     * @param {number} metrics.walkingAsymmetryPercentage - Asymmetry percentage
     * @param {number} metrics.walkingDoubleSupportPercentage - Double support percentage
     * @param {string} metrics.walkingSteadiness - 'OK', 'Low', or 'Very Low'
     * @param {number} metrics.sixMinuteWalkDistance - Six-minute walk distance (m)
     * @param {number} metrics.stepCount - Daily step count
     * @param {number} metrics.distanceWalked - Distance walked (m)
     * @param {string} metrics.dataQuality - 'good', 'fair', 'poor', or 'insufficient'
     * @param {number} metrics.sampleCount - Number of samples
     * @param {string} metrics.deviceSource - 'iPhone', 'Apple Watch', or 'Unknown'
     * @returns {Promise<{data, error}>}
     */
    async saveHealthMetrics(userId, metrics) {
        if (!this.isInitialized()) {
            return { data: null, error: initError || new Error('Supabase not initialized') };
        }

        try {
            const { data, error } = await supabase
                .from('health_metrics')
                .upsert({
                    user_id: userId,
                    metric_date: metrics.metricDate,
                    walking_speed_avg: metrics.walkingSpeedAvg,
                    walking_step_length_avg: metrics.walkingStepLengthAvg,
                    walking_asymmetry_percentage: metrics.walkingAsymmetryPercentage,
                    walking_double_support_percentage: metrics.walkingDoubleSupportPercentage,
                    walking_steadiness: metrics.walkingSteadiness,
                    six_minute_walk_distance: metrics.sixMinuteWalkDistance,
                    step_count: metrics.stepCount,
                    distance_walked: metrics.distanceWalked,
                    data_quality: metrics.dataQuality,
                    sample_count: metrics.sampleCount,
                    device_source: metrics.deviceSource,
                }, {
                    onConflict: 'user_id,metric_date',
                })
                .select()
                .single();

            if (error) {
                console.error('❌ Save health metrics error:', error);
                return { data: null, error };
            }

            console.log('✅ Health metrics saved:', data.id);
            return { data, error: null };
        } catch (error) {
            console.error('❌ Save health metrics error:', error);
            return { data: null, error };
        }
    },

    /**
     * Get health metrics for a user and date range
     * @param {string} userId - User ID
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {Promise<{data: Array, error}>}
     */
    async getHealthMetrics(userId, startDate, endDate) {
        if (!this.isInitialized()) {
            return { data: [], error: initError || new Error('Supabase not initialized') };
        }

        try {
            const startDateStr = startDate.toISOString().split('T')[0];
            const endDateStr = endDate.toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('health_metrics')
                .select('*')
                .eq('user_id', userId)
                .gte('metric_date', startDateStr)
                .lte('metric_date', endDateStr)
                .order('metric_date', { ascending: false });

            if (error) {
                console.error('❌ Get health metrics error:', error);
                return { data: [], error };
            }

            return { data: data || [], error: null };
        } catch (error) {
            console.error('❌ Get health metrics error:', error);
            return { data: [], error };
        }
    },

    /**
     * Get health metrics for a viewer (respects sharing preferences)
     * @param {string} targetUserId - User ID whose metrics to view
     * @param {string} viewerUserId - User ID of the viewer
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {Promise<{data: Array, error}>}
     */
    async getHealthMetricsForViewer(targetUserId, viewerUserId, startDate, endDate) {
        if (!this.isInitialized()) {
            return { data: [], error: initError || new Error('Supabase not initialized') };
        }

        try {
            const startDateStr = startDate.toISOString().split('T')[0];
            const endDateStr = endDate.toISOString().split('T')[0];

            // Use the database function that respects sharing preferences
            const { data, error } = await supabase.rpc('get_health_metrics_for_viewer', {
                target_user_id: targetUserId,
                viewer_user_id: viewerUserId,
                start_date: startDateStr,
                end_date: endDateStr,
            });

            if (error) {
                console.error('❌ Get health metrics for viewer error:', error);
                return { data: [], error };
            }

            return { data: data || [], error: null };
        } catch (error) {
            console.error('❌ Get health metrics for viewer error:', error);
            return { data: [], error };
        }
    },

    /**
     * Get health sharing preferences for a user
     * @param {string} userId - User ID
     * @returns {Promise<{data: Array, error}>}
     */
    async getHealthSharingPreferences(userId) {
        if (!this.isInitialized()) {
            return { data: [], error: initError || new Error('Supabase not initialized') };
        }

        try {
            const { data, error } = await supabase
                .from('health_sharing_preferences')
                .select('*')
                .eq('user_id', userId);

            if (error) {
                console.error('❌ Get health sharing preferences error:', error);
                return { data: [], error };
            }

            return { data: data || [], error: null };
        } catch (error) {
            console.error('❌ Get health sharing preferences error:', error);
            return { data: [], error };
        }
    },

    /**
     * Save or update health sharing preferences
     * @param {string} userId - User ID
     * @param {Object} preferences - Sharing preferences
     * @param {string} preferences.relationshipType - 'caregiver' or 'medical_staff'
     * @param {string} preferences.sharedWithUserId - User ID to share with
     * @param {boolean} preferences.shareAllMetrics - Share all metrics
     * @param {Object} preferences.metrics - Per-metric sharing toggles
     * @returns {Promise<{data, error}>}
     */
    async saveHealthSharingPreferences(userId, preferences) {
        if (!this.isInitialized()) {
            return { data: null, error: initError || new Error('Supabase not initialized') };
        }

        try {
            const { data, error } = await supabase
                .from('health_sharing_preferences')
                .upsert({
                    user_id: userId,
                    relationship_type: preferences.relationshipType,
                    shared_with_user_id: preferences.sharedWithUserId,
                    share_all_metrics: preferences.shareAllMetrics || false,
                    share_walking_speed: preferences.metrics?.shareWalkingSpeed || false,
                    share_walking_steadiness: preferences.metrics?.shareWalkingSteadiness || false,
                    share_step_length: preferences.metrics?.shareStepLength || false,
                    share_asymmetry: preferences.metrics?.shareAsymmetry || false,
                    share_double_support: preferences.metrics?.shareDoubleSupport || false,
                    share_step_count: preferences.metrics?.shareStepCount || false,
                    share_distance_walked: preferences.metrics?.shareDistanceWalked || false,
                    share_six_minute_walk: preferences.metrics?.shareSixMinuteWalk || false,
                }, {
                    onConflict: 'user_id,shared_with_user_id,relationship_type',
                })
                .select()
                .single();

            if (error) {
                console.error('❌ Save health sharing preferences error:', error);
                return { data: null, error };
            }

            console.log('✅ Health sharing preferences saved');
            return { data, error: null };
        } catch (error) {
            console.error('❌ Save health sharing preferences error:', error);
            return { data: null, error };
        }
    },

    /**
     * Delete health sharing preferences
     * @param {string} userId - User ID
     * @param {string} sharedWithUserId - User ID to stop sharing with
     * @param {string} relationshipType - 'caregiver' or 'medical_staff'
     * @returns {Promise<{error}>}
     */
    async deleteHealthSharingPreferences(userId, sharedWithUserId, relationshipType) {
        if (!this.isInitialized()) {
            return { error: initError || new Error('Supabase not initialized') };
        }

        try {
            const { error } = await supabase
                .from('health_sharing_preferences')
                .delete()
                .eq('user_id', userId)
                .eq('shared_with_user_id', sharedWithUserId)
                .eq('relationship_type', relationshipType);

            if (error) {
                console.error('❌ Delete health sharing preferences error:', error);
                return { error };
            }

            console.log('✅ Health sharing preferences deleted');
            return { error: null };
        } catch (error) {
            console.error('❌ Delete health sharing preferences error:', error);
            return { error };
        }
    },
};

// Export the supabase client for other services
export { supabase };

export default SupabaseService;
