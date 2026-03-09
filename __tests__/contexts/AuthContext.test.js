// __tests__/contexts/AuthContext.test.js

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';

// --- Mocks ---

// Store the auth state change callback so tests can trigger it
let authStateChangeCallback = null;

const mockSupabaseService = {
    isInitialized: jest.fn(() => true),
    getInitError: jest.fn(() => null),
    onAuthStateChange: jest.fn((callback) => {
        authStateChangeCallback = callback;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
    }),
    getSession: jest.fn(() => Promise.resolve({ session: null, error: null })),
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    getUserData: jest.fn(),
    getLastActivity: jest.fn(() => Promise.resolve({ lastActivity: null, error: null })),
    updateLastActivity: jest.fn(() => Promise.resolve()),
    deleteUserAccount: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    updatePassword: jest.fn(),
};

const mockSupabaseClient = {
    channel: jest.fn(() => ({
        on: jest.fn(function () { return this; }),
        subscribe: jest.fn(function () { return this; }),
    })),
    removeChannel: jest.fn(),
};

jest.mock('../../services/SupabaseService', () => ({
    SupabaseService: mockSupabaseService,
    supabase: mockSupabaseClient,
}));

jest.mock('../../services/NotificationService', () => ({
    NotificationService: {
        checkAndSendInactivityReminder: jest.fn(() => Promise.resolve()),
        sendKudosNotification: jest.fn(() => Promise.resolve()),
    },
}));

jest.mock('../../services/KudosService', () => ({
    KudosService: {},
}));

// Import after mocks
const { AuthProvider, useAuth } = require('../../contexts/AuthContext');

// --- Helpers ---

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

// Helper to render the hook and wait for initial loading to finish
const renderAuthHook = async () => {
    const result = renderHook(() => useAuth(), { wrapper });
    // Wait for initial loading to settle
    await waitFor(() => {
        expect(result.result.current.loading).toBe(false);
    });
    return result;
};

// --- Test Data ---

const mockAuthUser = {
    id: 'user-123',
    email: 'test@example.com',
    user_metadata: {
        name: 'Test User',
        role: 'survivor',
    },
};

const mockSession = {
    user: mockAuthUser,
    access_token: 'mock-token',
};

const mockDbUser = {
    id: 'user-123',
    name: 'Test User',
    role: 'survivor',
    email: 'test@example.com',
};

// --- Tests ---

describe('AuthContext', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        authStateChangeCallback = null;

        // Default mocks: no session, Supabase initialized
        mockSupabaseService.isInitialized.mockReturnValue(true);
        mockSupabaseService.getSession.mockResolvedValue({ session: null, error: null });
        mockSupabaseService.getLastActivity.mockResolvedValue({ lastActivity: null, error: null });
        mockSupabaseService.updateLastActivity.mockResolvedValue();
    });

    describe('useAuth outside provider', () => {
        it('returns empty context when used outside AuthProvider', () => {
            // AuthContext is created with createContext({}) so useAuth returns {}
            // outside the provider — it does NOT throw.
            const { result } = renderHook(() => useAuth());
            expect(result.current).toBeDefined();
            // The empty default has no signIn/signUp etc.
            expect(result.current.signIn).toBeUndefined();
        });
    });

    describe('initial state', () => {
        it('starts with loading=true and no user', async () => {
            const hookResult = renderHook(() => useAuth(), { wrapper });
            // After mount with no session, loading should eventually be false
            await waitFor(() => {
                expect(hookResult.result.current.loading).toBe(false);
            });
            expect(hookResult.result.current.user).toBeNull();
            expect(hookResult.result.current.userData).toBeNull();
            expect(hookResult.result.current.session).toBeNull();
        });

        it('sets loading=false when Supabase is not initialized', async () => {
            mockSupabaseService.isInitialized.mockReturnValue(false);

            // When Supabase is not initialized, setupAuthListener retries with
            // setTimeout. Use fake timers to flush the retries quickly.
            jest.useFakeTimers();

            const hookResult = renderHook(() => useAuth(), { wrapper });

            // Advance past all retries (5 retries * 1s each)
            for (let i = 0; i < 5; i++) {
                await act(async () => {
                    jest.advanceTimersByTime(1000);
                });
            }

            jest.useRealTimers();

            await waitFor(() => {
                expect(hookResult.result.current.loading).toBe(false);
            });
            expect(hookResult.result.current.user).toBeNull();
        });
    });

    describe('signIn', () => {
        it('signs in successfully and loads user data', async () => {
            mockSupabaseService.signIn.mockResolvedValue({
                user: mockAuthUser,
                session: mockSession,
                error: null,
            });
            mockSupabaseService.getUserData.mockResolvedValue({
                user: mockDbUser,
                error: null,
            });

            const { result } = await renderAuthHook();

            let signInResult;
            await act(async () => {
                signInResult = await result.current.signIn('test@example.com', 'password123');
            });

            expect(signInResult.error).toBeNull();
            expect(signInResult.user).toEqual(mockAuthUser);
            expect(mockSupabaseService.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
            expect(mockSupabaseService.getUserData).toHaveBeenCalledWith('user-123');
            expect(result.current.user).toEqual(mockAuthUser);
            expect(result.current.userData).toEqual(mockDbUser);
        });

        it('returns error on sign in failure', async () => {
            const mockError = new Error('Invalid credentials');
            mockSupabaseService.signIn.mockResolvedValue({
                user: null,
                session: null,
                error: mockError,
            });

            const { result } = await renderAuthHook();

            let signInResult;
            await act(async () => {
                signInResult = await result.current.signIn('bad@example.com', 'wrong');
            });

            expect(signInResult.error).toEqual(mockError);
            expect(result.current.user).toBeNull();
        });

        it('catches thrown exceptions during sign in', async () => {
            const thrownError = new Error('Network error');
            mockSupabaseService.signIn.mockRejectedValue(thrownError);

            const { result } = await renderAuthHook();

            let signInResult;
            await act(async () => {
                signInResult = await result.current.signIn('test@example.com', 'password123');
            });

            expect(signInResult.error).toEqual(thrownError);
        });
    });

    describe('signUp', () => {
        it('signs up then signs in on success', async () => {
            mockSupabaseService.signUp.mockResolvedValue({
                user: mockAuthUser,
                error: null,
            });
            mockSupabaseService.signIn.mockResolvedValue({
                user: mockAuthUser,
                session: mockSession,
                error: null,
            });
            mockSupabaseService.getUserData.mockResolvedValue({
                user: mockDbUser,
                error: null,
            });

            const { result } = await renderAuthHook();

            let signUpResult;
            await act(async () => {
                signUpResult = await result.current.signUp('test@example.com', 'password123', 'Test User', 'survivor');
            });

            expect(signUpResult.error).toBeNull();
            expect(mockSupabaseService.signUp).toHaveBeenCalledWith('test@example.com', 'password123', 'Test User', 'survivor');
            // After signUp, signIn is called automatically
            expect(mockSupabaseService.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
            expect(result.current.user).toEqual(mockAuthUser);
        });

        it('returns error when signUp fails', async () => {
            const mockError = new Error('Email already registered');
            mockSupabaseService.signUp.mockResolvedValue({
                user: null,
                error: mockError,
            });

            const { result } = await renderAuthHook();

            let signUpResult;
            await act(async () => {
                signUpResult = await result.current.signUp('existing@example.com', 'password123', 'Test', 'survivor');
            });

            expect(signUpResult.error).toEqual(mockError);
            // signIn should NOT be called when signUp fails
            expect(mockSupabaseService.signIn).not.toHaveBeenCalled();
        });

        it('catches thrown exceptions during sign up', async () => {
            const thrownError = new Error('Network error');
            mockSupabaseService.signUp.mockRejectedValue(thrownError);

            const { result } = await renderAuthHook();

            let signUpResult;
            await act(async () => {
                signUpResult = await result.current.signUp('test@example.com', 'pw', 'Name', 'survivor');
            });

            expect(signUpResult.error).toEqual(thrownError);
        });
    });

    describe('signOut', () => {
        it('clears user state and calls SupabaseService.signOut', async () => {
            // First sign in
            mockSupabaseService.signIn.mockResolvedValue({
                user: mockAuthUser,
                session: mockSession,
                error: null,
            });
            mockSupabaseService.getUserData.mockResolvedValue({
                user: mockDbUser,
                error: null,
            });
            mockSupabaseService.signOut.mockResolvedValue({ error: null });

            const { result } = await renderAuthHook();

            await act(async () => {
                await result.current.signIn('test@example.com', 'password123');
            });
            expect(result.current.user).toEqual(mockAuthUser);

            let signOutResult;
            await act(async () => {
                signOutResult = await result.current.signOut();
            });

            expect(signOutResult.error).toBeNull();
            expect(mockSupabaseService.signOut).toHaveBeenCalled();
            expect(result.current.user).toBeNull();
            expect(result.current.session).toBeNull();
            expect(result.current.userData).toBeNull();
        });

        it('clears local state even if SupabaseService.signOut errors', async () => {
            mockSupabaseService.signOut.mockResolvedValue({ error: new Error('Network error') });

            const { result } = await renderAuthHook();

            let signOutResult;
            await act(async () => {
                signOutResult = await result.current.signOut();
            });

            // Should still return success since local state is cleared
            expect(signOutResult.error).toBeNull();
            expect(result.current.user).toBeNull();
            expect(result.current.session).toBeNull();
            expect(result.current.userData).toBeNull();
        });

        it('clears local state even when signOut throws', async () => {
            mockSupabaseService.signOut.mockRejectedValue(new Error('Crash'));

            const { result } = await renderAuthHook();

            let signOutResult;
            await act(async () => {
                signOutResult = await result.current.signOut();
            });

            expect(signOutResult.error).toBeNull();
            expect(result.current.user).toBeNull();
        });
    });

    describe('deleteAccount', () => {
        it('deletes account and signs out', async () => {
            // Sign in first
            mockSupabaseService.signIn.mockResolvedValue({
                user: mockAuthUser,
                session: mockSession,
                error: null,
            });
            mockSupabaseService.getUserData.mockResolvedValue({
                user: mockDbUser,
                error: null,
            });
            mockSupabaseService.deleteUserAccount.mockResolvedValue({ success: true, error: null });
            mockSupabaseService.signOut.mockResolvedValue({ error: null });

            const { result } = await renderAuthHook();

            await act(async () => {
                await result.current.signIn('test@example.com', 'password123');
            });

            let deleteResult;
            await act(async () => {
                deleteResult = await result.current.deleteAccount();
            });

            expect(deleteResult.error).toBeNull();
            expect(mockSupabaseService.deleteUserAccount).toHaveBeenCalledWith('user-123');
            expect(result.current.user).toBeNull();
            expect(result.current.userData).toBeNull();
        });

        it('returns error when no user is logged in', async () => {
            const { result } = await renderAuthHook();

            let deleteResult;
            await act(async () => {
                deleteResult = await result.current.deleteAccount();
            });

            expect(deleteResult.error).toBeDefined();
            expect(deleteResult.error.message).toBe('No user logged in');
            expect(mockSupabaseService.deleteUserAccount).not.toHaveBeenCalled();
        });

        it('returns error when deleteUserAccount fails', async () => {
            mockSupabaseService.signIn.mockResolvedValue({
                user: mockAuthUser,
                session: mockSession,
                error: null,
            });
            mockSupabaseService.getUserData.mockResolvedValue({
                user: mockDbUser,
                error: null,
            });
            const deleteError = new Error('Delete failed');
            mockSupabaseService.deleteUserAccount.mockResolvedValue({ success: false, error: deleteError });

            const { result } = await renderAuthHook();

            await act(async () => {
                await result.current.signIn('test@example.com', 'password123');
            });

            let deleteResult;
            await act(async () => {
                deleteResult = await result.current.deleteAccount();
            });

            expect(deleteResult.error).toEqual(deleteError);
        });
    });

    describe('resetPassword', () => {
        it('calls SupabaseService.resetPasswordForEmail', async () => {
            mockSupabaseService.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });

            const { result } = await renderAuthHook();

            let resetResult;
            await act(async () => {
                resetResult = await result.current.resetPassword('test@example.com');
            });

            expect(resetResult.error).toBeNull();
            expect(mockSupabaseService.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com');
        });

        it('returns error on failure', async () => {
            const mockError = new Error('User not found');
            mockSupabaseService.resetPasswordForEmail.mockResolvedValue({ data: null, error: mockError });

            const { result } = await renderAuthHook();

            let resetResult;
            await act(async () => {
                resetResult = await result.current.resetPassword('nobody@example.com');
            });

            expect(resetResult.error).toEqual(mockError);
        });
    });

    describe('updatePassword', () => {
        it('calls SupabaseService.updatePassword', async () => {
            mockSupabaseService.updatePassword.mockResolvedValue({ data: {}, error: null });

            const { result } = await renderAuthHook();

            let updateResult;
            await act(async () => {
                updateResult = await result.current.updatePassword('newPassword123');
            });

            expect(updateResult.error).toBeNull();
            expect(mockSupabaseService.updatePassword).toHaveBeenCalledWith('newPassword123');
        });

        it('returns error on failure', async () => {
            const mockError = new Error('Password too weak');
            mockSupabaseService.updatePassword.mockResolvedValue({ data: null, error: mockError });

            const { result } = await renderAuthHook();

            let updateResult;
            await act(async () => {
                updateResult = await result.current.updatePassword('weak');
            });

            expect(updateResult.error).toEqual(mockError);
        });
    });

    describe('auth state change listener', () => {
        it('updates user and userData when auth state changes to signed in', async () => {
            mockSupabaseService.getUserData.mockResolvedValue({
                user: mockDbUser,
                error: null,
            });

            const { result } = await renderAuthHook();

            expect(authStateChangeCallback).toBeDefined();

            // Simulate auth state change (e.g., session restored)
            await act(async () => {
                await authStateChangeCallback('SIGNED_IN', mockSession);
            });

            expect(result.current.user).toEqual(mockAuthUser);
            expect(result.current.userData).toEqual(mockDbUser);
            expect(result.current.loading).toBe(false);
        });

        it('clears user data when auth state changes to signed out', async () => {
            // First simulate signed in
            mockSupabaseService.getUserData.mockResolvedValue({
                user: mockDbUser,
                error: null,
            });

            const { result } = await renderAuthHook();

            await act(async () => {
                await authStateChangeCallback('SIGNED_IN', mockSession);
            });

            await waitFor(() => {
                expect(result.current.user).toEqual(mockAuthUser);
            });

            // Now simulate signed out
            await act(async () => {
                await authStateChangeCallback('SIGNED_OUT', null);
            });

            await waitFor(() => {
                expect(result.current.user).toBeNull();
            });
            expect(result.current.userData).toBeNull();
            expect(result.current.loading).toBe(false);
        });

        it('uses fallback user data when getUserData fails', async () => {
            mockSupabaseService.getUserData.mockResolvedValue({
                user: null,
                error: new Error('DB error'),
            });

            const { result } = await renderAuthHook();

            await act(async () => {
                await authStateChangeCallback('SIGNED_IN', mockSession);
            });

            // Should fall back to auth metadata
            expect(result.current.userData).toEqual({
                id: 'user-123',
                name: 'Test User',
                role: 'survivor',
                email: 'test@example.com',
            });
        });
    });

    describe('context value shape', () => {
        it('provides all expected methods and state', async () => {
            const { result } = await renderAuthHook();

            expect(result.current).toHaveProperty('user');
            expect(result.current).toHaveProperty('session');
            expect(result.current).toHaveProperty('userData');
            expect(result.current).toHaveProperty('loading');
            expect(typeof result.current.signIn).toBe('function');
            expect(typeof result.current.signUp).toBe('function');
            expect(typeof result.current.signOut).toBe('function');
            expect(typeof result.current.resetPassword).toBe('function');
            expect(typeof result.current.updatePassword).toBe('function');
            expect(typeof result.current.deleteAccount).toBe('function');
        });
    });
});
