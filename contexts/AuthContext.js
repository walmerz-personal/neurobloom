// contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { SupabaseService } from '../services/SupabaseService';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null); // Name, role, etc from users table

    useEffect(() => {
        // Check for existing session on mount
        checkSession();

        // Listen for auth changes
        const { data: authListener } = SupabaseService.onAuthStateChange(
            async (event, session) => {
                console.log('🔐 Auth event:', event);
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    // Load user data from users table
                    await loadUserData(session.user.id);
                } else {
                    setUserData(null);
                }
            }
        );

        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, []);

    const checkSession = async () => {
        try {
            const { session } = await SupabaseService.getSession();
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                await loadUserData(session.user.id);
            }
        } catch (error) {
            console.error('❌ Error checking session:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadUserData = async (userId) => {
        try {
            const { user: dbUser, error } = await SupabaseService.getUserData(userId);
            if (!error && dbUser) {
                setUserData(dbUser);
                console.log('✅ User data loaded:', dbUser.name);
            }
        } catch (error) {
            console.error('❌ Error loading user data:', error);
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
            await loadUserData(user.id);

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
            await SupabaseService.signOut();
            setUser(null);
            setSession(null);
            setUserData(null);
            return { error: null };
        } catch (error) {
            console.error('❌ Sign out error:', error);
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
