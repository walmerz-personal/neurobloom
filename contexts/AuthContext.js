// contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { SupabaseService } from '../services/SupabaseService';
import { NotificationService } from '../services/NotificationService';
import { supabase } from '../services/SupabaseService';
import { KudosService } from '../services/KudosService';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null); // Name, role, etc from users table
    const kudosChannelRef = useRef(null); // Store Realtime channel reference

    useEffect(() => {
        // Check for existing session on mount
        checkSession();

        // Set up auth listener - retry if Supabase isn't ready yet
        let authListener = null;
        let retryCount = 0;
        const maxRetries = 5;
        const retryDelay = 1000; // 1 second

        const setupAuthListener = () => {
            if (!SupabaseService.isInitialized()) {
                if (retryCount < maxRetries) {
                    retryCount++;
                    console.warn(`⚠️ Supabase not initialized, retrying auth listener setup (${retryCount}/${maxRetries})...`);
                    setTimeout(setupAuthListener, retryDelay);
                    return;
                } else {
                    console.error('❌ Failed to set up auth state listener: Supabase not initialized after retries');
                    return;
                }
            }

            // Listen for auth changes
            const listenerResult = SupabaseService.onAuthStateChange(
                async (event, session) => {
                    console.log('🔐 Auth event:', event);
                    setSession(session);
                    setUser(session?.user ?? null);

                    if (session?.user) {
                        // Load user data from users table with retry
                        await loadUserDataWithRetry(session.user.id, session.user).catch(error => {
                            console.error('❌ Failed to load user data after retries in auth listener:', error);
                        });
                        // Track app launch activity
                        trackActivityAndCheckInactivity(session.user.id).catch(error => {
                            console.error('❌ Failed to track activity:', error);
                        });
                    } else {
                        // No session - clear user data and cleanup
                        setUserData(null);
                        cleanupKudosSubscription();
                    }
                }
            );

            authListener = listenerResult?.data || listenerResult;
        };

        setupAuthListener();

        return () => {
            if (authListener?.subscription) {
                try {
                    authListener.subscription.unsubscribe();
                } catch (error) {
                    console.error('❌ Error unsubscribing auth listener:', error);
                }
            }
            cleanupKudosSubscription();
        };
    }, []);

    // Clean up kudos subscription if user role changes from survivor to something else
    useEffect(() => {
        if (userData && userData.role !== 'survivor') {
            cleanupKudosSubscription();
        }
    }, [userData?.role]);

    const checkSession = async () => {
        try {
            // Check if Supabase is initialized
            if (!SupabaseService.isInitialized()) {
                const initError = SupabaseService.getInitError();
                console.error('❌ Cannot check session: Supabase not initialized', initError);
                setLoading(false);
                // Don't crash, just leave user as logged out
                // This allows the app to show an error message in the UI
                return;
            }

            // Separate session check from user data loading for better reliability
            // First, check for session with a shorter timeout
            const sessionTimeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Session check timeout')), 10000)
            );

            let session = null;
            try {
                const sessionResult = await Promise.race([
                    SupabaseService.getSession(),
                    sessionTimeoutPromise
                ]);
                session = sessionResult.session;
            } catch (error) {
                console.error('❌ Error getting session:', error);
                // Continue without session - user will need to login
                setLoading(false);
                return;
            }

            // Update session state immediately
            setSession(session);
            setUser(session?.user ?? null);

            // If we have a session, load user data with retry logic
            if (session?.user) {
                // Load user data with retry - don't block session restoration
                loadUserDataWithRetry(session.user.id, session.user).catch(error => {
                    console.error('❌ Failed to load user data after retries:', error);
                    // Even if userData fails, we have a session, so continue
                });

                // Track activity in background - don't block session check
                trackActivityAndCheckInactivity(session.user.id).catch(error => {
                    console.error('❌ Failed to track activity:', error);
                    // Non-critical error - don't block app
                });
            }
        } catch (error) {
            console.error('❌ Error checking session:', error);
            // On any error, proceed without session (user will need to login)
        } finally {
            // Always set loading to false, even if there were errors
            setLoading(false);
        }
    };

    /**
     * Load user data with retry logic
     * Retries up to 3 times with exponential backoff
     */
    const loadUserDataWithRetry = async (userId, authUser = null, retries = 3) => {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                await loadUserData(userId, authUser);
                return; // Success, exit retry loop
            } catch (error) {
                console.warn(`⚠️ Load user data attempt ${attempt}/${retries} failed:`, error);
                
                if (attempt < retries) {
                    // Exponential backoff: 500ms, 1000ms, 2000ms
                    const delay = 500 * Math.pow(2, attempt - 1);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    // Last attempt failed, throw error
                    throw error;
                }
            }
        }
    };

    const loadUserData = async (userId, authUser = null) => {
        try {
            // Try to load from database first
            const { user: dbUser, error } = await SupabaseService.getUserData(userId);
            if (!error && dbUser) {
                setUserData(dbUser);
                console.log('✅ User data loaded:', dbUser.name);
                
                // Set up kudos Realtime subscription for survivors
                if (dbUser.role === 'survivor') {
                    setupKudosSubscription(userId);
                }
                return;
            }
            
            // Database query failed or returned no data - use fallback
            console.warn('⚠️ User data not found in DB, using fallback data');
            setFallbackUserData(userId, authUser);
            
        } catch (error) {
            console.error('❌ Error loading user data:', error);
            // Always set fallback data if we have an authUser - never leave userData as null
            setFallbackUserData(userId, authUser);
        }
    };

    /**
     * Set fallback user data from auth metadata
     * Ensures userData is never null when user has a valid session
     */
    const setFallbackUserData = (userId, authUser) => {
        if (!authUser) {
            console.warn('⚠️ No authUser provided for fallback data');
            return;
        }

        let fallbackData;
        
        if (authUser.user_metadata) {
            fallbackData = {
                id: userId,
                name: authUser.user_metadata.name || 'Friend',
                role: authUser.user_metadata.role || 'survivor',
                email: authUser.email || '',
            };
            console.log('⚠️ Using auth metadata fallback:', fallbackData.name);
        } else {
            // Minimal fallback - at least we have a user
            fallbackData = {
                id: userId,
                name: 'Friend',
                role: 'survivor',
                email: authUser.email || '',
            };
            console.log('⚠️ Using minimal fallback data');
        }

        setUserData(fallbackData);
        
        // Set up kudos Realtime subscription for survivors
        if (fallbackData.role === 'survivor') {
            setupKudosSubscription(userId);
        }
    };

    /**
     * Track user activity and check for inactivity reminder
     * Updates last_activity_at and checks if reminder should be sent
     */
    const trackActivityAndCheckInactivity = async (userId) => {
        try {
            // Get last activity before updating (to check for inactivity)
            const { lastActivity, error: getError } = await SupabaseService.getLastActivity(userId);
            
            // Update last activity to current time
            await SupabaseService.updateLastActivity(userId);

            // Check if user hasn't been active for 2+ days and send reminder if needed
            // Only check if we successfully retrieved last activity (to avoid sending on first run)
            if (!getError && lastActivity) {
                await NotificationService.checkAndSendInactivityReminder(userId, lastActivity);
            }
        } catch (error) {
            console.error('❌ Error tracking activity:', error);
            // Non-critical error - don't block app functionality
        }
    };

    /**
     * Set up Supabase Realtime subscription for kudos notifications
     * Only for survivors - listens for new kudos where survivor_id matches current user
     */
    const setupKudosSubscription = (survivorId) => {
        // Clean up any existing subscription first
        cleanupKudosSubscription();

        // Only set up if Supabase is initialized
        if (!SupabaseService.isInitialized()) {
            console.warn('⚠️ Skipping kudos subscription: Supabase not initialized');
            return;
        }

        try {
            // Create a channel for kudos notifications
            const channel = supabase
                .channel(`kudos-notifications-${survivorId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'kudos',
                        filter: `survivor_id=eq.${survivorId}`,
                    },
                    async (payload) => {
                        console.log('🎉 New kudos received via Realtime:', payload);
                        
                        // Get caregiver name from the payload or fetch it
                        let caregiverName = 'Someone';
                        
                        if (payload.new?.caregiver_id) {
                            try {
                                // Fetch caregiver name
                                const { user: caregiver, error } = await SupabaseService.getUserData(payload.new.caregiver_id);
                                if (!error && caregiver?.name) {
                                    caregiverName = caregiver.name.split(' ')[0]; // Use first name
                                }
                            } catch (error) {
                                console.warn('⚠️ Could not fetch caregiver name, using default:', error);
                            }
                        }

                        // Send push notification
                        await NotificationService.sendKudosNotification(caregiverName);
                    }
                )
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        console.log('✅ Kudos Realtime subscription active for survivor:', survivorId);
                    } else if (status === 'CHANNEL_ERROR') {
                        console.error('❌ Kudos Realtime subscription error');
                    }
                });

            // Store channel reference for cleanup
            kudosChannelRef.current = channel;
        } catch (error) {
            console.error('❌ Error setting up kudos subscription:', error);
        }
    };

    /**
     * Clean up kudos Realtime subscription
     */
    const cleanupKudosSubscription = () => {
        if (kudosChannelRef.current) {
            try {
                supabase.removeChannel(kudosChannelRef.current);
                console.log('✅ Kudos Realtime subscription cleaned up');
            } catch (error) {
                console.error('❌ Error cleaning up kudos subscription:', error);
            }
            kudosChannelRef.current = null;
        }
    };

    const signIn = async (email, password) => {
        try {
            const { user, session, error } = await SupabaseService.signIn(email, password);

            if (error) {
                return { error };
            }

            setUser(user);
            setSession(session);
            await loadUserData(user.id, user);
            // Track login activity
            await trackActivityAndCheckInactivity(user.id);

            return { user, error: null };
        } catch (error) {
            console.error('❌ Sign in error:', error);
            return { error };
        }
    };

    const signUp = async (email, password, name, role) => {
        try {
            const { user, error } = await SupabaseService.signUp(email, password, name, role);

            if (error) {
                return { error };
            }

            // Sign in after signup
            const signInResult = await signIn(email, password);

            return signInResult;
        } catch (error) {
            console.error('❌ Sign up error:', error);
            return { error };
        }
    };

    const signOut = async () => {
        try {
            // Clean up kudos subscription before signing out
            cleanupKudosSubscription();
            
            // Clear local state first - this ensures UI updates immediately
            // The auth state listener will also fire and clear state again, which is fine
            setUser(null);
            setSession(null);
            setUserData(null);
            
            // Then sign out from Supabase (this will trigger auth state change)
            if (SupabaseService.isInitialized()) {
                const { error } = await SupabaseService.signOut();
                if (error) {
                    console.warn('⚠️ Supabase signOut had error, but local state cleared:', error);
                    // Even if Supabase signOut fails, local state is already cleared
                } else {
                    console.log('✅ Successfully signed out from Supabase');
                }
            } else {
                console.warn('⚠️ Supabase not initialized, but local state cleared');
            }
            
            return { error: null }; // Return success since local state is cleared
        } catch (error) {
            // Still clear local state on any error
            cleanupKudosSubscription();
            setUser(null);
            setSession(null);
            setUserData(null);
            console.error('❌ Sign out error:', error);
            return { error: null }; // Local state cleared, consider it success
        }
    };

    const resetPassword = async (email) => {
        try {
            const { data, error } = await SupabaseService.resetPasswordForEmail(email);
            if (error) return { error };
            return { data, error: null };
        } catch (error) {
            return { error };
        }
    };

    const updatePassword = async (newPassword) => {
        try {
            const { data, error } = await SupabaseService.updatePassword(newPassword);
            if (error) return { error };
            return { data, error: null };
        } catch (error) {
            return { error };
        }
    };

    const deleteAccount = async () => {
        try {
            if (!user?.id) {
                return { error: new Error('No user logged in') };
            }

            // Delete all user data from database
            const { success, error } = await SupabaseService.deleteUserAccount(user.id);

            if (error) {
                console.error('❌ Delete account error:', error);
                return { error };
            }

            // Sign out the user
            await signOut();

            return { error: null };
        } catch (error) {
            console.error('❌ Delete account error:', error);
            return { error };
        }
    };

    const value = {
        user,
        session,
        userData,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        deleteAccount,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
