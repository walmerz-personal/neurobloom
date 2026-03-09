// __tests__/services/SupabaseService.test.js

// Build a chainable mock where every query-builder method returns `mockSupabase` itself,
// except terminal methods (single, maybeSingle, insert, update, upsert, delete, rpc)
// which we control per-test.
const mockSupabase = {
    from: jest.fn(() => mockSupabase),
    select: jest.fn(() => mockSupabase),
    eq: jest.fn(() => mockSupabase),
    gte: jest.fn(() => mockSupabase),
    lte: jest.fn(() => mockSupabase),
    order: jest.fn(() => mockSupabase),
    limit: jest.fn(() => mockSupabase),
    single: jest.fn(),
    maybeSingle: jest.fn(),
    insert: jest.fn(() => mockSupabase),
    update: jest.fn(() => mockSupabase),
    upsert: jest.fn(() => mockSupabase),
    delete: jest.fn(() => mockSupabase),
    rpc: jest.fn(),
    auth: {
        signUp: jest.fn(),
        signInWithPassword: jest.fn(),
        signOut: jest.fn(),
        getSession: jest.fn(),
        getUser: jest.fn(),
        onAuthStateChange: jest.fn(),
        resetPasswordForEmail: jest.fn(),
        setSession: jest.fn(),
        updateUser: jest.fn(),
        admin: {
            deleteUser: jest.fn(),
        },
    },
    functions: {
        invoke: jest.fn(),
    },
};

jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => mockSupabase),
}));

jest.mock('../../constants/Config', () => ({
    Config: {
        SUPABASE_URL: 'https://test.supabase.co',
        SUPABASE_ANON_KEY: 'test-anon-key',
    },
}));

// Must import after mocks are set up
const { SupabaseService } = require('../../services/SupabaseService');

describe('SupabaseService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset chainable methods to return mockSupabase by default
        mockSupabase.from.mockReturnValue(mockSupabase);
        mockSupabase.select.mockReturnValue(mockSupabase);
        mockSupabase.eq.mockReturnValue(mockSupabase);
        mockSupabase.gte.mockReturnValue(mockSupabase);
        mockSupabase.lte.mockReturnValue(mockSupabase);
        mockSupabase.order.mockReturnValue(mockSupabase);
        mockSupabase.limit.mockReturnValue(mockSupabase);
        mockSupabase.insert.mockReturnValue(mockSupabase);
        mockSupabase.update.mockReturnValue(mockSupabase);
        mockSupabase.upsert.mockReturnValue(mockSupabase);
        mockSupabase.delete.mockReturnValue(mockSupabase);
    });

    // =============================================
    // INITIALIZATION
    // =============================================

    describe('isInitialized', () => {
        it('should return true when supabase client is created', () => {
            expect(SupabaseService.isInitialized()).toBe(true);
        });
    });

    describe('getInitError', () => {
        it('should return null when initialized successfully', () => {
            expect(SupabaseService.getInitError()).toBeNull();
        });
    });

    // =============================================
    // AUTHENTICATION
    // =============================================

    describe('signUp', () => {
        it('should sign up a user successfully', async () => {
            const mockUser = { id: 'user-1', email: 'test@example.com' };
            mockSupabase.auth.signUp.mockResolvedValue({
                data: { user: mockUser },
                error: null,
            });

            const { user, error } = await SupabaseService.signUp('test@example.com', 'password123', 'Test User', 'survivor');

            expect(user).toEqual(mockUser);
            expect(error).toBeNull();
            expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123',
                options: { data: { name: 'Test User', role: 'survivor' } },
            });
        });

        it('should return error on auth failure', async () => {
            const authError = new Error('Email already taken');
            mockSupabase.auth.signUp.mockResolvedValue({
                data: { user: null },
                error: authError,
            });

            const { user, error } = await SupabaseService.signUp('test@example.com', 'password123', 'Test', 'survivor');

            expect(user).toBeNull();
            expect(error).toBe(authError);
        });

        it('should handle thrown exceptions', async () => {
            mockSupabase.auth.signUp.mockRejectedValue(new Error('Network error'));

            const { user, error } = await SupabaseService.signUp('test@example.com', 'pass', 'Test', 'survivor');

            expect(user).toBeNull();
            expect(error.message).toBe('Network error');
        });
    });

    describe('signIn', () => {
        it('should sign in a user successfully', async () => {
            const mockUser = { id: 'user-1' };
            const mockSession = { access_token: 'token-123' };
            mockSupabase.auth.signInWithPassword.mockResolvedValue({
                data: { user: mockUser, session: mockSession },
                error: null,
            });

            const { user, session, error } = await SupabaseService.signIn('test@example.com', 'password');

            expect(user).toEqual(mockUser);
            expect(session).toEqual(mockSession);
            expect(error).toBeNull();
        });

        it('should return error on invalid credentials', async () => {
            const authError = new Error('Invalid login credentials');
            mockSupabase.auth.signInWithPassword.mockResolvedValue({
                data: { user: null, session: null },
                error: authError,
            });

            const { user, session, error } = await SupabaseService.signIn('test@example.com', 'wrong');

            expect(user).toBeNull();
            expect(session).toBeNull();
            expect(error).toBe(authError);
        });

        it('should handle thrown exceptions', async () => {
            mockSupabase.auth.signInWithPassword.mockRejectedValue(new Error('Network error'));

            const { user, session, error } = await SupabaseService.signIn('test@example.com', 'pass');

            expect(user).toBeNull();
            expect(session).toBeNull();
            expect(error.message).toBe('Network error');
        });
    });

    describe('signOut', () => {
        it('should sign out successfully', async () => {
            mockSupabase.auth.signOut.mockResolvedValue({ error: null });

            const { error } = await SupabaseService.signOut();

            expect(error).toBeNull();
        });

        it('should return error on sign out failure', async () => {
            const signOutError = new Error('Sign out failed');
            mockSupabase.auth.signOut.mockResolvedValue({ error: signOutError });

            const { error } = await SupabaseService.signOut();

            expect(error).toBe(signOutError);
        });

        it('should handle thrown exceptions', async () => {
            mockSupabase.auth.signOut.mockRejectedValue(new Error('Network error'));

            const { error } = await SupabaseService.signOut();

            expect(error.message).toBe('Network error');
        });
    });

    describe('getSession', () => {
        it('should return current session', async () => {
            const mockSession = { access_token: 'token-123', user: { id: 'user-1' } };
            mockSupabase.auth.getSession.mockResolvedValue({
                data: { session: mockSession },
                error: null,
            });

            const { session, error } = await SupabaseService.getSession();

            expect(session).toEqual(mockSession);
            expect(error).toBeNull();
        });

        it('should return null session when not logged in', async () => {
            mockSupabase.auth.getSession.mockResolvedValue({
                data: { session: null },
                error: null,
            });

            const { session, error } = await SupabaseService.getSession();

            expect(session).toBeNull();
            expect(error).toBeNull();
        });

        it('should handle thrown exceptions', async () => {
            mockSupabase.auth.getSession.mockRejectedValue(new Error('Session error'));

            const { session, error } = await SupabaseService.getSession();

            expect(session).toBeNull();
            expect(error.message).toBe('Session error');
        });
    });

    describe('getCurrentUser', () => {
        it('should return current user', async () => {
            const mockUser = { id: 'user-1', email: 'test@example.com' };
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: mockUser },
                error: null,
            });

            const { user, error } = await SupabaseService.getCurrentUser();

            expect(user).toEqual(mockUser);
            expect(error).toBeNull();
        });

        it('should return null user on error', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: new Error('Not authenticated'),
            });

            const { user, error } = await SupabaseService.getCurrentUser();

            expect(user).toBeNull();
            expect(error.message).toBe('Not authenticated');
        });

        it('should handle thrown exceptions', async () => {
            mockSupabase.auth.getUser.mockRejectedValue(new Error('Network error'));

            const { user, error } = await SupabaseService.getCurrentUser();

            expect(user).toBeNull();
            expect(error.message).toBe('Network error');
        });
    });

    describe('resetPasswordForEmail', () => {
        it('should send password reset email successfully', async () => {
            mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });

            const { data, error } = await SupabaseService.resetPasswordForEmail('test@example.com');

            expect(error).toBeNull();
            expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
                redirectTo: 'neurobloom://auth/reset-password',
            });
        });

        it('should return error on failure', async () => {
            const resetError = new Error('User not found');
            mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ data: null, error: resetError });

            const { data, error } = await SupabaseService.resetPasswordForEmail('unknown@example.com');

            expect(data).toBeNull();
            expect(error).toBe(resetError);
        });
    });

    describe('setSession', () => {
        it('should set session successfully', async () => {
            mockSupabase.auth.setSession.mockResolvedValue({ data: { session: {} }, error: null });

            const { data, error } = await SupabaseService.setSession('access-token', 'refresh-token');

            expect(error).toBeNull();
            expect(mockSupabase.auth.setSession).toHaveBeenCalledWith({
                access_token: 'access-token',
                refresh_token: 'refresh-token',
            });
        });

        it('should return error on failure', async () => {
            mockSupabase.auth.setSession.mockResolvedValue({ data: null, error: new Error('Invalid token') });

            const { data, error } = await SupabaseService.setSession('bad', 'bad');

            expect(data).toBeNull();
            expect(error.message).toBe('Invalid token');
        });
    });

    describe('updatePassword', () => {
        it('should update password successfully', async () => {
            mockSupabase.auth.updateUser.mockResolvedValue({ data: { user: {} }, error: null });

            const { data, error } = await SupabaseService.updatePassword('newpassword123');

            expect(error).toBeNull();
            expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({ password: 'newpassword123' });
        });

        it('should return error on failure', async () => {
            mockSupabase.auth.updateUser.mockResolvedValue({ data: null, error: new Error('Weak password') });

            const { data, error } = await SupabaseService.updatePassword('123');

            expect(data).toBeNull();
            expect(error.message).toBe('Weak password');
        });
    });

    describe('onAuthStateChange', () => {
        it('should register auth state listener', () => {
            const callback = jest.fn();
            const mockSubscription = { data: { subscription: { unsubscribe: jest.fn() } } };
            mockSupabase.auth.onAuthStateChange.mockReturnValue(mockSubscription);

            const result = SupabaseService.onAuthStateChange(callback);

            expect(result).toBe(mockSubscription);
            expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalledWith(callback);
        });
    });

    // =============================================
    // USER PROFILE
    // =============================================

    describe('saveUserProfile', () => {
        it('should save profile successfully', async () => {
            const profileData = {
                strokeDate: '2024-01-15',
                impairments: ['motor', 'speech'],
                affectedSide: 'left',
                recoveryPhase: 'subacute',
                goals: 'Improve mobility',
                preferences: { notifications: true },
            };
            const savedData = { id: 'profile-1', user_id: 'user-1', ...profileData };
            mockSupabase.single.mockResolvedValue({ data: savedData, error: null });

            const { data, error } = await SupabaseService.saveUserProfile('user-1', profileData);

            expect(data).toEqual(savedData);
            expect(error).toBeNull();
            expect(mockSupabase.from).toHaveBeenCalledWith('user_profiles');
        });

        it('should return error on save failure', async () => {
            const dbError = new Error('Database error');
            mockSupabase.single.mockResolvedValue({ data: null, error: dbError });

            const { data, error } = await SupabaseService.saveUserProfile('user-1', {});

            expect(data).toBeNull();
            expect(error).toBe(dbError);
        });

        it('should handle thrown exceptions', async () => {
            mockSupabase.single.mockRejectedValue(new Error('Connection lost'));

            const { data, error } = await SupabaseService.saveUserProfile('user-1', {});

            expect(data).toBeNull();
            expect(error.message).toBe('Connection lost');
        });

        it('should handle missing optional fields with defaults', async () => {
            mockSupabase.single.mockResolvedValue({ data: { id: 'profile-1' }, error: null });

            await SupabaseService.saveUserProfile('user-1', {});

            expect(mockSupabase.upsert).toHaveBeenCalledWith({
                user_id: 'user-1',
                stroke_date: null,
                impairments: [],
                affected_side: null,
                impairment_severity: null,
                recovery_phase: null,
                goals: null,
                medical_staff_role: null,
                preferences: {},
            });
        });
    });

    describe('getUserProfile', () => {
        it('should return user profile', async () => {
            const profile = { id: 'profile-1', user_id: 'user-1', recovery_phase: 'subacute' };
            mockSupabase.single.mockResolvedValue({ data: profile, error: null });

            const { profile: result, error } = await SupabaseService.getUserProfile('user-1');

            expect(result).toEqual(profile);
            expect(error).toBeNull();
            expect(mockSupabase.from).toHaveBeenCalledWith('user_profiles');
            expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-1');
        });

        it('should return null profile when not found (PGRST116)', async () => {
            mockSupabase.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

            const { profile, error } = await SupabaseService.getUserProfile('user-1');

            expect(profile).toBeNull();
            expect(error).toBeNull();
        });

        it('should return error for non-PGRST116 errors', async () => {
            const dbError = { code: '42000', message: 'Some DB error' };
            mockSupabase.single.mockResolvedValue({ data: null, error: dbError });

            const { profile, error } = await SupabaseService.getUserProfile('user-1');

            expect(profile).toBeNull();
            expect(error).toBe(dbError);
        });

        it('should handle thrown exceptions', async () => {
            mockSupabase.single.mockRejectedValue(new Error('Network error'));

            const { profile, error } = await SupabaseService.getUserProfile('user-1');

            expect(profile).toBeNull();
            expect(error.message).toBe('Network error');
        });
    });

    describe('getUserData', () => {
        it('should return user data', async () => {
            const userData = { id: 'user-1', name: 'Test User', role: 'survivor' };
            mockSupabase.single.mockResolvedValue({ data: userData, error: null });

            const { user, error } = await SupabaseService.getUserData('user-1');

            expect(user).toEqual(userData);
            expect(error).toBeNull();
            expect(mockSupabase.from).toHaveBeenCalledWith('users');
            expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'user-1');
        });

        it('should return error on failure', async () => {
            const dbError = new Error('Not found');
            mockSupabase.single.mockResolvedValue({ data: null, error: dbError });

            const { user, error } = await SupabaseService.getUserData('user-1');

            expect(user).toBeNull();
            expect(error).toBe(dbError);
        });

        it('should handle thrown exceptions', async () => {
            mockSupabase.single.mockRejectedValue(new Error('Timeout'));

            const { user, error } = await SupabaseService.getUserData('user-1');

            expect(user).toBeNull();
            expect(error.message).toBe('Timeout');
        });
    });

    describe('updateUserData', () => {
        it('should update user data successfully', async () => {
            const updatedUser = { id: 'user-1', name: 'Updated Name' };
            mockSupabase.single.mockResolvedValue({ data: updatedUser, error: null });

            const { user, error } = await SupabaseService.updateUserData('user-1', { name: 'Updated Name' });

            expect(user).toEqual(updatedUser);
            expect(error).toBeNull();
            expect(mockSupabase.from).toHaveBeenCalledWith('users');
            expect(mockSupabase.update).toHaveBeenCalledWith({ name: 'Updated Name' });
        });

        it('should return error on failure', async () => {
            const dbError = new Error('Update failed');
            mockSupabase.single.mockResolvedValue({ data: null, error: dbError });

            const { user, error } = await SupabaseService.updateUserData('user-1', { name: 'X' });

            expect(user).toBeNull();
            expect(error).toBe(dbError);
        });

        it('should handle thrown exceptions', async () => {
            mockSupabase.single.mockRejectedValue(new Error('Connection lost'));

            const { user, error } = await SupabaseService.updateUserData('user-1', {});

            expect(user).toBeNull();
            expect(error.message).toBe('Connection lost');
        });
    });

    describe('updateLastActivity', () => {
        it('should update last activity successfully', async () => {
            // No .single() call here — just .eq() returns { error }
            mockSupabase.eq.mockResolvedValue({ error: null });

            const { success, error } = await SupabaseService.updateLastActivity('user-1');

            expect(success).toBe(true);
            expect(error).toBeNull();
        });

        it('should handle missing column gracefully (42703)', async () => {
            mockSupabase.eq.mockResolvedValue({ error: { code: '42703' } });

            const { success, error } = await SupabaseService.updateLastActivity('user-1');

            expect(success).toBe(true);
            expect(error).toBeNull();
        });

        it('should handle missing column gracefully (PGRST204)', async () => {
            mockSupabase.eq.mockResolvedValue({ error: { code: 'PGRST204' } });

            const { success, error } = await SupabaseService.updateLastActivity('user-1');

            expect(success).toBe(true);
            expect(error).toBeNull();
        });

        it('should return error for other database errors', async () => {
            const dbError = { code: '42000', message: 'Other error' };
            mockSupabase.eq.mockResolvedValue({ error: dbError });

            const { success, error } = await SupabaseService.updateLastActivity('user-1');

            expect(success).toBe(false);
            expect(error).toBe(dbError);
        });

        it('should handle thrown exceptions with missing column code', async () => {
            const thrown = new Error('Column missing');
            thrown.code = '42703';
            mockSupabase.eq.mockRejectedValue(thrown);

            const { success, error } = await SupabaseService.updateLastActivity('user-1');

            expect(success).toBe(true);
            expect(error).toBeNull();
        });

        it('should handle thrown exceptions with other codes', async () => {
            const thrown = new Error('Some error');
            thrown.code = '99999';
            mockSupabase.eq.mockRejectedValue(thrown);

            const { success, error } = await SupabaseService.updateLastActivity('user-1');

            expect(success).toBe(false);
            expect(error.message).toBe('Some error');
        });
    });

    describe('getLastActivity', () => {
        it('should return last activity timestamp', async () => {
            mockSupabase.single.mockResolvedValue({
                data: { last_activity_at: '2026-03-08T12:00:00Z' },
                error: null,
            });

            const { lastActivity, error } = await SupabaseService.getLastActivity('user-1');

            expect(lastActivity).toBe('2026-03-08T12:00:00Z');
            expect(error).toBeNull();
        });

        it('should return null when no activity timestamp', async () => {
            mockSupabase.single.mockResolvedValue({
                data: { last_activity_at: null },
                error: null,
            });

            const { lastActivity, error } = await SupabaseService.getLastActivity('user-1');

            expect(lastActivity).toBeNull();
            expect(error).toBeNull();
        });

        it('should handle missing column gracefully', async () => {
            mockSupabase.single.mockResolvedValue({ data: null, error: { code: '42703' } });

            const { lastActivity, error } = await SupabaseService.getLastActivity('user-1');

            expect(lastActivity).toBeNull();
            expect(error).toBeNull();
        });

        it('should return error for other database errors', async () => {
            const dbError = { code: '42000', message: 'DB error' };
            mockSupabase.single.mockResolvedValue({ data: null, error: dbError });

            const { lastActivity, error } = await SupabaseService.getLastActivity('user-1');

            expect(lastActivity).toBeNull();
            expect(error).toBe(dbError);
        });
    });

    // =============================================
    // DAILY LOGS
    // =============================================

    describe('saveDailyLog', () => {
        it('should save daily log successfully', async () => {
            const logData = {
                logDate: '2026-03-08',
                mood: 7,
                painLevel: 3,
                energyLevel: 6,
                exercisesCompleted: ['ex-1', 'ex-2'],
                notes: 'Feeling good today',
            };
            const savedData = { id: 'log-1', user_id: 'user-1' };
            mockSupabase.single.mockResolvedValue({ data: savedData, error: null });

            const { data, error } = await SupabaseService.saveDailyLog('user-1', logData);

            expect(data).toEqual(savedData);
            expect(error).toBeNull();
            expect(mockSupabase.from).toHaveBeenCalledWith('daily_logs');
        });

        it('should return error on failure', async () => {
            const dbError = new Error('Insert failed');
            mockSupabase.single.mockResolvedValue({ data: null, error: dbError });

            const { data, error } = await SupabaseService.saveDailyLog('user-1', { logDate: '2026-03-08' });

            expect(data).toBeNull();
            expect(error).toBe(dbError);
        });

        it('should handle missing optional fields', async () => {
            mockSupabase.single.mockResolvedValue({ data: { id: 'log-1' }, error: null });

            await SupabaseService.saveDailyLog('user-1', { logDate: '2026-03-08' });

            expect(mockSupabase.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    exercises_completed: [],
                    notes: null,
                }),
                { onConflict: 'user_id,log_date' }
            );
        });
    });

    describe('getDailyLogs', () => {
        it('should return daily logs', async () => {
            const logs = [{ id: 'log-1' }, { id: 'log-2' }];
            mockSupabase.limit.mockResolvedValue({ data: logs, error: null });

            const { logs: result, error } = await SupabaseService.getDailyLogs('user-1');

            expect(result).toEqual(logs);
            expect(error).toBeNull();
            expect(mockSupabase.from).toHaveBeenCalledWith('daily_logs');
        });

        it('should use custom limit', async () => {
            mockSupabase.limit.mockResolvedValue({ data: [], error: null });

            await SupabaseService.getDailyLogs('user-1', 10);

            expect(mockSupabase.limit).toHaveBeenCalledWith(10);
        });

        it('should return empty array on error', async () => {
            mockSupabase.limit.mockResolvedValue({ data: null, error: new Error('DB error') });

            const { logs, error } = await SupabaseService.getDailyLogs('user-1');

            expect(logs).toEqual([]);
            expect(error).toBeTruthy();
        });

        it('should handle thrown exceptions', async () => {
            mockSupabase.limit.mockRejectedValue(new Error('Connection lost'));

            const { logs, error } = await SupabaseService.getDailyLogs('user-1');

            expect(logs).toEqual([]);
            expect(error.message).toBe('Connection lost');
        });
    });

    describe('getTodayLog', () => {
        it('should return today\'s log', async () => {
            const log = { id: 'log-1', mood: 7 };
            mockSupabase.single.mockResolvedValue({ data: log, error: null });

            const { log: result, error } = await SupabaseService.getTodayLog('user-1');

            expect(result).toEqual(log);
            expect(error).toBeNull();
            expect(mockSupabase.from).toHaveBeenCalledWith('daily_logs');
        });

        it('should return null log when no entry exists (PGRST116)', async () => {
            mockSupabase.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

            const { log, error } = await SupabaseService.getTodayLog('user-1');

            expect(log).toBeNull();
            expect(error).toBeNull();
        });

        it('should return error for non-PGRST116 errors', async () => {
            const dbError = { code: '42000', message: 'DB error' };
            mockSupabase.single.mockResolvedValue({ data: null, error: dbError });

            const { log, error } = await SupabaseService.getTodayLog('user-1');

            expect(log).toBeNull();
            expect(error).toBe(dbError);
        });
    });

    describe('toggleExerciseCompletion', () => {
        it('should add exercise when no log exists', async () => {
            // getTodayLog returns null (no log for today)
            mockSupabase.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });
            // saveDailyLog resolves
            mockSupabase.single.mockResolvedValueOnce({ data: { id: 'log-1', exercises_completed: ['ex-1'] }, error: null });

            const { data, error } = await SupabaseService.toggleExerciseCompletion('user-1', 'ex-1');

            expect(error).toBeNull();
            expect(data).toBeTruthy();
        });

        it('should add exercise to existing log', async () => {
            const existingLog = { id: 'log-1', exercises_completed: ['ex-1'], mood: 7, pain_level: 3, energy_level: 6, notes: null };
            mockSupabase.single.mockResolvedValueOnce({ data: existingLog, error: null });
            mockSupabase.single.mockResolvedValueOnce({ data: { ...existingLog, exercises_completed: ['ex-1', 'ex-2'] }, error: null });

            const { data, error } = await SupabaseService.toggleExerciseCompletion('user-1', 'ex-2');

            expect(error).toBeNull();
        });

        it('should remove exercise if already completed', async () => {
            const existingLog = { id: 'log-1', exercises_completed: ['ex-1', 'ex-2'], mood: 7, pain_level: 3, energy_level: 6, notes: null };
            mockSupabase.single.mockResolvedValueOnce({ data: existingLog, error: null });
            mockSupabase.single.mockResolvedValueOnce({ data: { ...existingLog, exercises_completed: ['ex-2'] }, error: null });

            const { data, error } = await SupabaseService.toggleExerciseCompletion('user-1', 'ex-1');

            expect(error).toBeNull();
        });

        it('should propagate getTodayLog errors', async () => {
            const dbError = { code: '42000', message: 'DB error' };
            mockSupabase.single.mockResolvedValueOnce({ data: null, error: dbError });

            const { data, error } = await SupabaseService.toggleExerciseCompletion('user-1', 'ex-1');

            expect(data).toBeNull();
            expect(error).toBe(dbError);
        });

        it('should handle thrown exceptions', async () => {
            mockSupabase.single.mockRejectedValue(new Error('Connection error'));

            const { data, error } = await SupabaseService.toggleExerciseCompletion('user-1', 'ex-1');

            expect(data).toBeNull();
            expect(error.message).toBe('Connection error');
        });
    });

    // =============================================
    // CONVERSATIONS
    // =============================================

    describe('saveConversation', () => {
        const messages = [{ role: 'user', content: 'Hello' }];

        it('should create new conversation when no id provided', async () => {
            const saved = { id: 'conv-1', messages };
            mockSupabase.single.mockResolvedValue({ data: saved, error: null });

            const { data, error } = await SupabaseService.saveConversation('user-1', messages);

            expect(data).toEqual(saved);
            expect(error).toBeNull();
            expect(mockSupabase.insert).toHaveBeenCalledWith([{ user_id: 'user-1', messages }]);
        });

        it('should update existing conversation when id provided', async () => {
            const saved = { id: 'conv-1', messages };
            mockSupabase.single.mockResolvedValue({ data: saved, error: null });

            const { data, error } = await SupabaseService.saveConversation('user-1', messages, 'conv-1');

            expect(data).toEqual(saved);
            expect(error).toBeNull();
            expect(mockSupabase.update).toHaveBeenCalledWith({ messages });
        });

        it('should return error on create failure', async () => {
            const dbError = new Error('Insert failed');
            mockSupabase.single.mockResolvedValue({ data: null, error: dbError });

            const { data, error } = await SupabaseService.saveConversation('user-1', messages);

            expect(data).toBeNull();
            expect(error).toBe(dbError);
        });

        it('should return error on update failure', async () => {
            const dbError = new Error('Update failed');
            mockSupabase.single.mockResolvedValue({ data: null, error: dbError });

            const { data, error } = await SupabaseService.saveConversation('user-1', messages, 'conv-1');

            expect(data).toBeNull();
            expect(error).toBe(dbError);
        });
    });

    describe('getConversations', () => {
        it('should return conversations', async () => {
            const conversations = [{ id: 'conv-1' }, { id: 'conv-2' }];
            mockSupabase.limit.mockResolvedValue({ data: conversations, error: null });

            const { conversations: result, error } = await SupabaseService.getConversations('user-1');

            expect(result).toEqual(conversations);
            expect(error).toBeNull();
        });

        it('should return empty array on error', async () => {
            mockSupabase.limit.mockResolvedValue({ data: null, error: new Error('DB error') });

            const { conversations, error } = await SupabaseService.getConversations('user-1');

            expect(conversations).toEqual([]);
            expect(error).toBeTruthy();
        });
    });

    describe('getLatestConversation', () => {
        it('should return latest conversation', async () => {
            const conversation = { id: 'conv-1', messages: [] };
            mockSupabase.single.mockResolvedValue({ data: conversation, error: null });

            const { conversation: result, error } = await SupabaseService.getLatestConversation('user-1');

            expect(result).toEqual(conversation);
            expect(error).toBeNull();
        });

        it('should return null when no conversations exist (PGRST116)', async () => {
            mockSupabase.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

            const { conversation, error } = await SupabaseService.getLatestConversation('user-1');

            expect(conversation).toBeNull();
            expect(error).toBeNull();
        });
    });

    // =============================================
    // GAMIFICATION
    // =============================================

    describe('getUserPoints', () => {
        it('should return user points', async () => {
            mockSupabase.single.mockResolvedValue({ data: { points: 150 }, error: null });

            const { points, error } = await SupabaseService.getUserPoints('user-1');

            expect(points).toBe(150);
            expect(error).toBeNull();
            expect(mockSupabase.from).toHaveBeenCalledWith('user_profiles');
            expect(mockSupabase.select).toHaveBeenCalledWith('points');
        });

        it('should return 0 when no points data', async () => {
            mockSupabase.single.mockResolvedValue({ data: { points: null }, error: null });

            const { points, error } = await SupabaseService.getUserPoints('user-1');

            expect(points).toBe(0);
            expect(error).toBeNull();
        });

        it('should return 0 on error', async () => {
            mockSupabase.single.mockResolvedValue({ data: null, error: new Error('DB error') });

            const { points, error } = await SupabaseService.getUserPoints('user-1');

            expect(points).toBe(0);
            expect(error).toBeTruthy();
        });

        it('should handle thrown exceptions', async () => {
            mockSupabase.single.mockRejectedValue(new Error('Connection error'));

            const { points, error } = await SupabaseService.getUserPoints('user-1');

            expect(points).toBe(0);
            expect(error.message).toBe('Connection error');
        });
    });

    describe('updateUserPoints', () => {
        it('should update points successfully', async () => {
            const updatedData = { user_id: 'user-1', points: 200 };
            mockSupabase.single.mockResolvedValue({ data: updatedData, error: null });

            const { data, error } = await SupabaseService.updateUserPoints('user-1', 200);

            expect(data).toEqual(updatedData);
            expect(error).toBeNull();
            expect(mockSupabase.from).toHaveBeenCalledWith('user_profiles');
            expect(mockSupabase.update).toHaveBeenCalledWith({ points: 200 });
        });

        it('should return error on failure', async () => {
            mockSupabase.single.mockResolvedValue({ data: null, error: new Error('Update failed') });

            const { data, error } = await SupabaseService.updateUserPoints('user-1', 200);

            expect(data).toBeNull();
            expect(error).toBeTruthy();
        });
    });

    describe('getItems', () => {
        it('should return all items sorted by cost', async () => {
            const items = [{ id: 'item-1', cost: 10 }, { id: 'item-2', cost: 20 }];
            mockSupabase.order.mockResolvedValue({ data: items, error: null });

            const { items: result, error } = await SupabaseService.getItems();

            expect(result).toEqual(items);
            expect(error).toBeNull();
            expect(mockSupabase.from).toHaveBeenCalledWith('items');
        });

        it('should return empty array on error', async () => {
            mockSupabase.order.mockResolvedValue({ data: null, error: new Error('DB error') });

            const { items, error } = await SupabaseService.getItems();

            expect(items).toEqual([]);
            expect(error).toBeTruthy();
        });
    });

    describe('getInventory', () => {
        it('should return user inventory', async () => {
            const inventory = [{ id: 'inv-1', quantity: 3, items: { name: 'Seed' } }];
            mockSupabase.eq.mockResolvedValue({ data: inventory, error: null });

            const { inventory: result, error } = await SupabaseService.getInventory('user-1');

            expect(result).toEqual(inventory);
            expect(error).toBeNull();
            expect(mockSupabase.from).toHaveBeenCalledWith('user_inventory');
        });

        it('should return empty array on error', async () => {
            mockSupabase.eq.mockResolvedValue({ data: null, error: new Error('DB error') });

            const { inventory, error } = await SupabaseService.getInventory('user-1');

            expect(inventory).toEqual([]);
            expect(error).toBeTruthy();
        });
    });

    describe('getGardenPlants', () => {
        it('should return garden plants', async () => {
            const plants = [{ id: 'plant-1', box_index: 0 }];
            mockSupabase.order.mockResolvedValue({ data: plants, error: null });

            const { plants: result, error } = await SupabaseService.getGardenPlants('user-1');

            expect(result).toEqual(plants);
            expect(error).toBeNull();
            expect(mockSupabase.from).toHaveBeenCalledWith('garden_plants');
        });

        it('should return empty array on error', async () => {
            mockSupabase.order.mockResolvedValue({ data: null, error: new Error('DB error') });

            const { plants, error } = await SupabaseService.getGardenPlants('user-1');

            expect(plants).toEqual([]);
            expect(error).toBeTruthy();
        });
    });

    describe('getPet', () => {
        it('should return user pet', async () => {
            const pet = { id: 'pet-1', item_id: 'kitten-1' };
            mockSupabase.maybeSingle.mockResolvedValue({ data: pet, error: null });

            const { pet: result, error } = await SupabaseService.getPet('user-1');

            expect(result).toEqual(pet);
            expect(error).toBeNull();
            expect(mockSupabase.from).toHaveBeenCalledWith('garden_pets');
        });

        it('should return null when no pet', async () => {
            mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null });

            const { pet, error } = await SupabaseService.getPet('user-1');

            expect(pet).toBeNull();
            expect(error).toBeNull();
        });

        it('should return error on failure', async () => {
            mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: new Error('DB error') });

            const { pet, error } = await SupabaseService.getPet('user-1');

            expect(pet).toBeNull();
            expect(error).toBeTruthy();
        });
    });

    // =============================================
    // ACCOUNT MANAGEMENT
    // =============================================

    describe('deleteUserAccount', () => {
        it('should delete via admin API when available', async () => {
            mockSupabase.auth.admin.deleteUser.mockResolvedValue({ error: null });

            const { success, error } = await SupabaseService.deleteUserAccount('user-1');

            expect(success).toBe(true);
            expect(error).toBeNull();
            expect(mockSupabase.auth.admin.deleteUser).toHaveBeenCalledWith('user-1');
        });

        it('should delete manually when admin API fails', async () => {
            mockSupabase.auth.admin.deleteUser.mockResolvedValue({ error: new Error('No admin') });
            // Each .delete().eq() chain resolves
            mockSupabase.eq.mockResolvedValue({ error: null });

            const { success, error } = await SupabaseService.deleteUserAccount('user-1');

            expect(success).toBe(true);
            expect(error).toBeNull();
            // Should have called from() for each table
            expect(mockSupabase.from).toHaveBeenCalledWith('user_inventory');
            expect(mockSupabase.from).toHaveBeenCalledWith('garden_plants');
            expect(mockSupabase.from).toHaveBeenCalledWith('conversations');
            expect(mockSupabase.from).toHaveBeenCalledWith('daily_logs');
            expect(mockSupabase.from).toHaveBeenCalledWith('user_profiles');
            expect(mockSupabase.from).toHaveBeenCalledWith('users');
        });

        it('should handle thrown exceptions', async () => {
            mockSupabase.auth.admin.deleteUser.mockRejectedValue(new Error('Network error'));

            const { success, error } = await SupabaseService.deleteUserAccount('user-1');

            expect(success).toBe(false);
            expect(error.message).toBe('Network error');
        });
    });

    // =============================================
    // EDGE FUNCTIONS
    // =============================================

    describe('callEdgeFunction', () => {
        it('should invoke edge function successfully', async () => {
            const responseData = { result: 'success' };
            mockSupabase.functions.invoke.mockResolvedValue({ data: responseData, error: null });

            const { data, error } = await SupabaseService.callEdgeFunction('my-function', { key: 'value' });

            expect(data).toEqual(responseData);
            expect(error).toBeNull();
            expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('my-function', { body: { key: 'value' } });
        });

        it('should return error from edge function', async () => {
            const fnError = new Error('Function error');
            mockSupabase.functions.invoke.mockResolvedValue({ data: null, error: fnError });

            const { data, error } = await SupabaseService.callEdgeFunction('my-function', {});

            expect(data).toBeNull();
            expect(error).toBe(fnError);
        });

        it('should handle thrown exceptions', async () => {
            mockSupabase.functions.invoke.mockRejectedValue(new Error('Network error'));

            const { data, error } = await SupabaseService.callEdgeFunction('my-function', {});

            expect(data).toBeNull();
            expect(error.message).toBe('Network error');
        });
    });

    // =============================================
    // CARE TEAM MANAGEMENT
    // =============================================

    describe('createCareTeamLink', () => {
        it('should create care team link successfully', async () => {
            const linkData = { survivor_id: 'user-1', relationship: 'family', status: 'pending' };
            const saved = { id: 'link-1', ...linkData };
            mockSupabase.single.mockResolvedValue({ data: saved, error: null });

            const { data, error } = await SupabaseService.createCareTeamLink(linkData);

            expect(data).toEqual(saved);
            expect(error).toBeNull();
            expect(mockSupabase.from).toHaveBeenCalledWith('care_team_links');
        });

        it('should return error on failure', async () => {
            mockSupabase.single.mockResolvedValue({ data: null, error: new Error('Insert failed') });

            const { data, error } = await SupabaseService.createCareTeamLink({});

            expect(data).toBeNull();
            expect(error).toBeTruthy();
        });
    });

    describe('getCareTeamLinks', () => {
        it('should filter by survivor_id for survivor role', async () => {
            const links = [{ id: 'link-1' }];
            mockSupabase.eq.mockResolvedValue({ data: links, error: null });

            const { data, error } = await SupabaseService.getCareTeamLinks('user-1', 'survivor');

            expect(data).toEqual(links);
            expect(error).toBeNull();
            expect(mockSupabase.eq).toHaveBeenCalledWith('survivor_id', 'user-1');
        });

        it('should filter by caregiver_id for caregiver role', async () => {
            mockSupabase.eq.mockResolvedValue({ data: [], error: null });

            await SupabaseService.getCareTeamLinks('user-1', 'caregiver');

            expect(mockSupabase.eq).toHaveBeenCalledWith('caregiver_id', 'user-1');
        });

        it('should filter by medical_staff_id for medical_staff role', async () => {
            mockSupabase.eq.mockResolvedValue({ data: [], error: null });

            await SupabaseService.getCareTeamLinks('user-1', 'medical_staff');

            expect(mockSupabase.eq).toHaveBeenCalledWith('medical_staff_id', 'user-1');
        });

        it('should return empty array on error', async () => {
            mockSupabase.eq.mockResolvedValue({ data: null, error: new Error('DB error') });

            const { data, error } = await SupabaseService.getCareTeamLinks('user-1', 'survivor');

            expect(data).toEqual([]);
            expect(error).toBeTruthy();
        });
    });

    describe('getCareTeamLink', () => {
        it('should get specific link for caregiver type', async () => {
            const link = { id: 'link-1', status: 'accepted' };
            mockSupabase.single.mockResolvedValue({ data: link, error: null });

            const { data, error } = await SupabaseService.getCareTeamLink('cg-1', 'sv-1', 'caregiver');

            expect(data).toEqual(link);
            expect(error).toBeNull();
        });

        it('should get specific link for medical_staff type', async () => {
            const link = { id: 'link-1', status: 'accepted' };
            mockSupabase.single.mockResolvedValue({ data: link, error: null });

            const { data, error } = await SupabaseService.getCareTeamLink('ms-1', 'sv-1', 'medical_staff');

            expect(data).toEqual(link);
            expect(error).toBeNull();
            expect(mockSupabase.eq).toHaveBeenCalledWith('medical_staff_id', 'ms-1');
        });

        it('should return null when not found (PGRST116)', async () => {
            mockSupabase.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

            const { data, error } = await SupabaseService.getCareTeamLink('cg-1', 'sv-1');

            expect(data).toBeNull();
            expect(error).toBeNull();
        });
    });

    describe('getInvitationByCode', () => {
        it('should return invitation by code', async () => {
            const invitation = { id: 'link-1', invitation_code: 'ABC123' };
            mockSupabase.rpc.mockResolvedValue({ data: [invitation], error: null });

            const { data, error } = await SupabaseService.getInvitationByCode('ABC123');

            expect(data).toEqual(invitation);
            expect(error).toBeNull();
            expect(mockSupabase.rpc).toHaveBeenCalledWith('get_invitation_by_code', { code: 'ABC123' });
        });

        it('should return error when not found', async () => {
            mockSupabase.rpc.mockResolvedValue({ data: [], error: null });

            const { data, error } = await SupabaseService.getInvitationByCode('INVALID');

            expect(data).toBeNull();
            expect(error.message).toBe('Invitation not found');
        });

        it('should return error when data is null', async () => {
            mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

            const { data, error } = await SupabaseService.getInvitationByCode('INVALID');

            expect(data).toBeNull();
            expect(error.message).toBe('Invitation not found');
        });

        it('should return error on RPC failure', async () => {
            const rpcError = new Error('RPC failed');
            mockSupabase.rpc.mockResolvedValue({ data: null, error: rpcError });

            const { data, error } = await SupabaseService.getInvitationByCode('ABC123');

            expect(data).toBeNull();
            expect(error).toBe(rpcError);
        });
    });

    describe('updateCareTeamLink', () => {
        it('should update link successfully', async () => {
            const updated = { id: 'link-1', status: 'accepted' };
            mockSupabase.single.mockResolvedValue({ data: updated, error: null });

            const { data, error } = await SupabaseService.updateCareTeamLink('link-1', { status: 'accepted' });

            expect(data).toEqual(updated);
            expect(error).toBeNull();
            expect(mockSupabase.from).toHaveBeenCalledWith('care_team_links');
        });

        it('should return error on failure', async () => {
            mockSupabase.single.mockResolvedValue({ data: null, error: new Error('Update failed') });

            const { data, error } = await SupabaseService.updateCareTeamLink('link-1', {});

            expect(data).toBeNull();
            expect(error).toBeTruthy();
        });
    });

    describe('deleteCareTeamLink', () => {
        it('should delete link successfully', async () => {
            mockSupabase.eq.mockResolvedValue({ error: null });

            const { error } = await SupabaseService.deleteCareTeamLink('link-1');

            expect(error).toBeNull();
            expect(mockSupabase.from).toHaveBeenCalledWith('care_team_links');
        });

        it('should return error on failure', async () => {
            mockSupabase.eq.mockResolvedValue({ error: new Error('Delete failed') });

            const { error } = await SupabaseService.deleteCareTeamLink('link-1');

            expect(error.message).toBe('Delete failed');
        });
    });

    describe('generateAccessRequestToken', () => {
        it('should generate a 16-character token', () => {
            const token = SupabaseService.generateAccessRequestToken();

            expect(token).toHaveLength(16);
        });

        it('should only use valid characters', () => {
            const validChars = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/;
            const token = SupabaseService.generateAccessRequestToken();

            expect(token).toMatch(validChars);
        });

        it('should generate different tokens on each call', () => {
            const tokens = new Set();
            for (let i = 0; i < 20; i++) {
                tokens.add(SupabaseService.generateAccessRequestToken());
            }
            // With 16 chars from 30-char alphabet, collision is extremely unlikely
            expect(tokens.size).toBeGreaterThan(1);
        });
    });

    // =============================================
    // CUSTOM EXERCISES
    // =============================================

    describe('_getThumbnailColorForCategory', () => {
        it('should return correct colors for known categories', () => {
            expect(SupabaseService._getThumbnailColorForCategory('Arms')).toBe('#E0F2FE');
            expect(SupabaseService._getThumbnailColorForCategory('Legs')).toBe('#FED7AA');
            expect(SupabaseService._getThumbnailColorForCategory('Core')).toBe('#D1FAE5');
            expect(SupabaseService._getThumbnailColorForCategory('Hands')).toBe('#E9D5FF');
        });

        it('should return default color for unknown category', () => {
            expect(SupabaseService._getThumbnailColorForCategory('Unknown')).toBe('#E0F2FE');
        });
    });

    describe('createCustomExercise', () => {
        const validExercise = {
            title: 'Arm Stretch',
            category: 'Arms',
            mode: 'Solo',
            instructions: ['Step 1', 'Step 2'],
        };

        it('should create exercise successfully', async () => {
            const saved = { id: 'ex-1', ...validExercise };
            mockSupabase.single.mockResolvedValue({ data: saved, error: null });

            const { data, error } = await SupabaseService.createCustomExercise('user-1', validExercise);

            expect(data).toEqual(saved);
            expect(error).toBeNull();
            expect(mockSupabase.from).toHaveBeenCalledWith('user_exercises');
        });

        it('should return error when required fields missing', async () => {
            const { data, error } = await SupabaseService.createCustomExercise('user-1', { title: 'Test' });

            expect(data).toBeNull();
            expect(error.message).toBe('Title, category, mode, and instructions are required');
        });

        it('should return error when title missing', async () => {
            const { data, error } = await SupabaseService.createCustomExercise('user-1', {
                category: 'Arms', mode: 'solo', instructions: ['Step 1'],
            });

            expect(data).toBeNull();
            expect(error.message).toContain('required');
        });

        it('should filter empty instructions', async () => {
            mockSupabase.single.mockResolvedValue({ data: { id: 'ex-1' }, error: null });

            await SupabaseService.createCustomExercise('user-1', {
                ...validExercise,
                instructions: ['Step 1', '', '  ', 'Step 2'],
            });

            expect(mockSupabase.insert).toHaveBeenCalledWith([
                expect.objectContaining({
                    instructions: ['Step 1', 'Step 2'],
                }),
            ]);
        });

        it('should use auto-assigned thumbnail color', async () => {
            mockSupabase.single.mockResolvedValue({ data: { id: 'ex-1' }, error: null });

            await SupabaseService.createCustomExercise('user-1', validExercise);

            expect(mockSupabase.insert).toHaveBeenCalledWith([
                expect.objectContaining({
                    thumbnail_color: '#E0F2FE', // Arms color
                }),
            ]);
        });

        it('should return error on database failure', async () => {
            mockSupabase.single.mockResolvedValue({ data: null, error: new Error('Insert failed') });

            const { data, error } = await SupabaseService.createCustomExercise('user-1', validExercise);

            expect(data).toBeNull();
            expect(error).toBeTruthy();
        });
    });

    describe('getCustomExercises', () => {
        it('should return transformed exercises', async () => {
            const rawExercises = [{
                id: 'ex-1',
                category: 'Arms',
                mode: 'solo',
                title: 'Arm Stretch',
                time: '3 min',
                target: 'upper body',
                description: 'A stretch',
                difficulty: 'Beginner',
                thumbnail_color: '#E0F2FE',
                instructions: ['Step 1'],
                user_id: 'user-1',
                is_shared_with_care_team: false,
                creator: { name: 'Test User' },
            }];
            mockSupabase.order.mockResolvedValue({ data: rawExercises, error: null });

            const { data, error } = await SupabaseService.getCustomExercises('user-1');

            expect(error).toBeNull();
            expect(data).toHaveLength(1);
            expect(data[0]).toEqual({
                id: 'ex-1',
                category: 'Arms',
                mode: 'solo',
                title: 'Arm Stretch',
                time: '3 min',
                target: 'upper body',
                description: 'A stretch',
                difficulty: 'Beginner',
                thumbnailColor: '#E0F2FE',
                instructions: ['Step 1'],
                isCustom: true,
                userId: 'user-1',
                isSharedWithCareTeam: false,
                creatorName: 'Test User',
            });
        });

        it('should handle null optional fields in transform', async () => {
            const rawExercises = [{
                id: 'ex-1',
                category: 'Arms',
                mode: 'solo',
                title: 'Test',
                time: null,
                target: null,
                description: null,
                difficulty: null,
                thumbnail_color: '#E0F2FE',
                instructions: null,
                user_id: 'user-1',
                is_shared_with_care_team: false,
                creator: null,
            }];
            mockSupabase.order.mockResolvedValue({ data: rawExercises, error: null });

            const { data, error } = await SupabaseService.getCustomExercises('user-1');

            expect(error).toBeNull();
            expect(data[0].time).toBeUndefined();
            expect(data[0].target).toBeUndefined();
            expect(data[0].instructions).toEqual([]);
            expect(data[0].creatorName).toBeNull();
        });

        it('should return null data on error', async () => {
            mockSupabase.order.mockResolvedValue({ data: null, error: new Error('DB error') });

            const { data, error } = await SupabaseService.getCustomExercises('user-1');

            expect(data).toBeNull();
            expect(error).toBeTruthy();
        });

        it('should handle empty result set', async () => {
            mockSupabase.order.mockResolvedValue({ data: [], error: null });

            const { data, error } = await SupabaseService.getCustomExercises('user-1');

            expect(data).toEqual([]);
            expect(error).toBeNull();
        });
    });

    describe('updateCustomExercise', () => {
        it('should update exercise successfully', async () => {
            const updated = { id: 'ex-1', title: 'Updated Title' };
            mockSupabase.single.mockResolvedValue({ data: updated, error: null });

            const { data, error } = await SupabaseService.updateCustomExercise('ex-1', { title: 'Updated Title' });

            expect(data).toEqual(updated);
            expect(error).toBeNull();
            expect(mockSupabase.from).toHaveBeenCalledWith('user_exercises');
        });

        it('should update thumbnail color when category changes', async () => {
            mockSupabase.single.mockResolvedValue({ data: { id: 'ex-1' }, error: null });

            await SupabaseService.updateCustomExercise('ex-1', { category: 'Legs' });

            expect(mockSupabase.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    category: 'Legs',
                    thumbnail_color: '#FED7AA',
                })
            );
        });

        it('should not override explicit thumbnailColor', async () => {
            mockSupabase.single.mockResolvedValue({ data: { id: 'ex-1' }, error: null });

            await SupabaseService.updateCustomExercise('ex-1', { category: 'Legs', thumbnailColor: '#FF0000' });

            expect(mockSupabase.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    thumbnail_color: '#FF0000',
                })
            );
        });

        it('should filter empty instructions on update', async () => {
            mockSupabase.single.mockResolvedValue({ data: { id: 'ex-1' }, error: null });

            await SupabaseService.updateCustomExercise('ex-1', { instructions: ['Step 1', '', 'Step 2'] });

            expect(mockSupabase.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    instructions: ['Step 1', 'Step 2'],
                })
            );
        });

        it('should return error on failure', async () => {
            mockSupabase.single.mockResolvedValue({ data: null, error: new Error('Update failed') });

            const { data, error } = await SupabaseService.updateCustomExercise('ex-1', { title: 'X' });

            expect(data).toBeNull();
            expect(error).toBeTruthy();
        });
    });

    describe('deleteCustomExercise', () => {
        it('should delete exercise successfully', async () => {
            mockSupabase.eq.mockResolvedValue({ error: null });

            const { error } = await SupabaseService.deleteCustomExercise('ex-1');

            expect(error).toBeNull();
            expect(mockSupabase.from).toHaveBeenCalledWith('user_exercises');
        });

        it('should return error on failure', async () => {
            mockSupabase.eq.mockResolvedValue({ error: new Error('Delete failed') });

            const { error } = await SupabaseService.deleteCustomExercise('ex-1');

            expect(error.message).toBe('Delete failed');
        });
    });

    // =============================================
    // EXERCISE ASSIGNMENTS
    // =============================================

    describe('assignExercise', () => {
        it('should assign exercise successfully', async () => {
            const saved = { id: 'assign-1', status: 'assigned' };
            mockSupabase.single.mockResolvedValue({ data: saved, error: null });

            const { data, error } = await SupabaseService.assignExercise('sv-1', 'ms-1', 'ex-1', 'built_in');

            expect(data).toEqual(saved);
            expect(error).toBeNull();
            expect(mockSupabase.from).toHaveBeenCalledWith('exercise_assignments');
        });

        it('should pass optional dueDate and notes', async () => {
            mockSupabase.single.mockResolvedValue({ data: { id: 'assign-1' }, error: null });

            await SupabaseService.assignExercise('sv-1', 'ms-1', 'ex-1', 'custom', '2026-03-15', 'Do daily');

            expect(mockSupabase.insert).toHaveBeenCalledWith([
                expect.objectContaining({
                    due_date: '2026-03-15',
                    notes: 'Do daily',
                }),
            ]);
        });

        it('should return error on failure', async () => {
            mockSupabase.single.mockResolvedValue({ data: null, error: new Error('Insert failed') });

            const { data, error } = await SupabaseService.assignExercise('sv-1', 'ms-1', 'ex-1', 'built_in');

            expect(data).toBeNull();
            expect(error).toBeTruthy();
        });
    });

    describe('getAssignedExercises', () => {
        it('should return assigned exercises', async () => {
            const assignments = [{ id: 'assign-1' }];
            // Without status filter: from -> select -> eq -> order resolves
            mockSupabase.order.mockResolvedValue({ data: assignments, error: null });

            const { data, error } = await SupabaseService.getAssignedExercises('sv-1');

            expect(data).toEqual(assignments);
            expect(error).toBeNull();
        });

        it('should filter by status when provided', async () => {
            mockSupabase.order.mockReturnValue(mockSupabase);
            mockSupabase.eq
                .mockReturnValueOnce(mockSupabase) // first call: survivor_id
                .mockResolvedValueOnce({ data: [], error: null }); // second call: status

            await SupabaseService.getAssignedExercises('sv-1', 'completed');

            expect(mockSupabase.eq).toHaveBeenNthCalledWith(2, 'status', 'completed');
        });

        it('should return empty array on error', async () => {
            mockSupabase.order.mockResolvedValue({ data: null, error: new Error('DB error') });

            const { data, error } = await SupabaseService.getAssignedExercises('sv-1');

            expect(data).toEqual([]);
            expect(error).toBeTruthy();
        });
    });

    describe('updateAssignmentStatus', () => {
        it('should update assignment status', async () => {
            const updated = { id: 'assign-1', status: 'completed' };
            mockSupabase.single.mockResolvedValue({ data: updated, error: null });

            const { data, error } = await SupabaseService.updateAssignmentStatus('assign-1', 'completed');

            expect(data).toEqual(updated);
            expect(error).toBeNull();
            expect(mockSupabase.from).toHaveBeenCalledWith('exercise_assignments');
        });

        it('should return error on failure', async () => {
            mockSupabase.single.mockResolvedValue({ data: null, error: new Error('Update failed') });

            const { data, error } = await SupabaseService.updateAssignmentStatus('assign-1', 'completed');

            expect(data).toBeNull();
            expect(error).toBeTruthy();
        });
    });

    describe('updateAssignmentNotes', () => {
        it('should update assignment notes', async () => {
            const updated = { id: 'assign-1', notes: 'New notes' };
            mockSupabase.single.mockResolvedValue({ data: updated, error: null });

            const { data, error } = await SupabaseService.updateAssignmentNotes('assign-1', 'New notes');

            expect(data).toEqual(updated);
            expect(error).toBeNull();
        });

        it('should return error on failure', async () => {
            mockSupabase.single.mockResolvedValue({ data: null, error: new Error('Update failed') });

            const { data, error } = await SupabaseService.updateAssignmentNotes('assign-1', 'notes');

            expect(data).toBeNull();
            expect(error).toBeTruthy();
        });
    });

    describe('getMedicalStaffAssignments', () => {
        it('should return assignments by medical staff', async () => {
            const assignments = [{ id: 'assign-1' }];
            mockSupabase.order.mockResolvedValue({ data: assignments, error: null });

            const { data, error } = await SupabaseService.getMedicalStaffAssignments('ms-1');

            expect(data).toEqual(assignments);
            expect(error).toBeNull();
            expect(mockSupabase.eq).toHaveBeenCalledWith('assigned_by_id', 'ms-1');
        });

        it('should return empty array on error', async () => {
            mockSupabase.order.mockResolvedValue({ data: null, error: new Error('DB error') });

            const { data, error } = await SupabaseService.getMedicalStaffAssignments('ms-1');

            expect(data).toEqual([]);
            expect(error).toBeTruthy();
        });
    });

    describe('deleteAssignment', () => {
        it('should delete assignment successfully', async () => {
            mockSupabase.eq.mockResolvedValue({ error: null });

            const { error } = await SupabaseService.deleteAssignment('assign-1');

            expect(error).toBeNull();
            expect(mockSupabase.from).toHaveBeenCalledWith('exercise_assignments');
        });

        it('should return error on failure', async () => {
            mockSupabase.eq.mockResolvedValue({ error: new Error('Delete failed') });

            const { error } = await SupabaseService.deleteAssignment('assign-1');

            expect(error.message).toBe('Delete failed');
        });
    });

    // =============================================
    // HEALTH METRICS
    // =============================================

    describe('saveHealthMetrics', () => {
        const metricsData = {
            metricDate: '2026-03-08',
            walkingSpeedAvg: 1.2,
            walkingStepLengthAvg: 0.7,
            walkingAsymmetryPercentage: 5,
            walkingDoubleSupportPercentage: 30,
            walkingSteadiness: 'OK',
            sixMinuteWalkDistance: 400,
            stepCount: 5000,
            distanceWalked: 3000,
            dataQuality: 'good',
            sampleCount: 100,
            deviceSource: 'iPhone',
        };

        it('should save health metrics successfully', async () => {
            const saved = { id: 'hm-1', ...metricsData };
            mockSupabase.single.mockResolvedValue({ data: saved, error: null });

            const { data, error } = await SupabaseService.saveHealthMetrics('user-1', metricsData);

            expect(data).toEqual(saved);
            expect(error).toBeNull();
            expect(mockSupabase.from).toHaveBeenCalledWith('health_metrics');
        });

        it('should return error on failure', async () => {
            mockSupabase.single.mockResolvedValue({ data: null, error: new Error('Insert failed') });

            const { data, error } = await SupabaseService.saveHealthMetrics('user-1', metricsData);

            expect(data).toBeNull();
            expect(error).toBeTruthy();
        });
    });

    describe('getHealthMetrics', () => {
        it('should return health metrics for date range', async () => {
            const metrics = [{ id: 'hm-1' }];
            mockSupabase.order.mockResolvedValue({ data: metrics, error: null });

            const startDate = new Date('2026-03-01');
            const endDate = new Date('2026-03-08');
            const { data, error } = await SupabaseService.getHealthMetrics('user-1', startDate, endDate);

            expect(data).toEqual(metrics);
            expect(error).toBeNull();
            expect(mockSupabase.from).toHaveBeenCalledWith('health_metrics');
            expect(mockSupabase.gte).toHaveBeenCalledWith('metric_date', '2026-03-01');
            expect(mockSupabase.lte).toHaveBeenCalledWith('metric_date', '2026-03-08');
        });

        it('should return empty array on error', async () => {
            mockSupabase.order.mockResolvedValue({ data: null, error: new Error('DB error') });

            const { data, error } = await SupabaseService.getHealthMetrics('user-1', new Date(), new Date());

            expect(data).toEqual([]);
            expect(error).toBeTruthy();
        });
    });

    describe('getHealthMetricsForViewer', () => {
        it('should call RPC with correct params', async () => {
            const metrics = [{ id: 'hm-1' }];
            mockSupabase.rpc.mockResolvedValue({ data: metrics, error: null });

            const startDate = new Date('2026-03-01');
            const endDate = new Date('2026-03-08');
            const { data, error } = await SupabaseService.getHealthMetricsForViewer('target-1', 'viewer-1', startDate, endDate);

            expect(data).toEqual(metrics);
            expect(error).toBeNull();
            expect(mockSupabase.rpc).toHaveBeenCalledWith('get_health_metrics_for_viewer', {
                target_user_id: 'target-1',
                viewer_user_id: 'viewer-1',
                start_date: '2026-03-01',
                end_date: '2026-03-08',
            });
        });

        it('should return empty array on error', async () => {
            mockSupabase.rpc.mockResolvedValue({ data: null, error: new Error('RPC error') });

            const { data, error } = await SupabaseService.getHealthMetricsForViewer('t', 'v', new Date(), new Date());

            expect(data).toEqual([]);
            expect(error).toBeTruthy();
        });
    });

    describe('getHealthSharingPreferences', () => {
        it('should return sharing preferences', async () => {
            const prefs = [{ id: 'pref-1', share_all_metrics: true }];
            mockSupabase.eq.mockResolvedValue({ data: prefs, error: null });

            const { data, error } = await SupabaseService.getHealthSharingPreferences('user-1');

            expect(data).toEqual(prefs);
            expect(error).toBeNull();
            expect(mockSupabase.from).toHaveBeenCalledWith('health_sharing_preferences');
        });

        it('should return empty array on error', async () => {
            mockSupabase.eq.mockResolvedValue({ data: null, error: new Error('DB error') });

            const { data, error } = await SupabaseService.getHealthSharingPreferences('user-1');

            expect(data).toEqual([]);
            expect(error).toBeTruthy();
        });
    });

    describe('saveHealthSharingPreferences', () => {
        it('should save sharing preferences successfully', async () => {
            const saved = { id: 'pref-1' };
            mockSupabase.single.mockResolvedValue({ data: saved, error: null });

            const prefs = {
                relationshipType: 'caregiver',
                sharedWithUserId: 'cg-1',
                shareAllMetrics: true,
                metrics: {
                    shareWalkingSpeed: true,
                    shareStepCount: true,
                },
            };
            const { data, error } = await SupabaseService.saveHealthSharingPreferences('user-1', prefs);

            expect(data).toEqual(saved);
            expect(error).toBeNull();
            expect(mockSupabase.from).toHaveBeenCalledWith('health_sharing_preferences');
        });

        it('should return error on failure', async () => {
            mockSupabase.single.mockResolvedValue({ data: null, error: new Error('Upsert failed') });

            const { data, error } = await SupabaseService.saveHealthSharingPreferences('user-1', {});

            expect(data).toBeNull();
            expect(error).toBeTruthy();
        });
    });

    describe('deleteHealthSharingPreferences', () => {
        it('should delete sharing preferences successfully', async () => {
            mockSupabase.eq
                .mockReturnValueOnce(mockSupabase) // first eq: user_id
                .mockReturnValueOnce(mockSupabase) // second eq: viewer_id
                .mockResolvedValueOnce({ error: null }); // third eq: viewer_type

            const { error } = await SupabaseService.deleteHealthSharingPreferences('user-1', 'cg-1', 'caregiver');

            expect(error).toBeNull();
            expect(mockSupabase.from).toHaveBeenCalledWith('health_sharing_preferences');
        });

        it('should return error on failure', async () => {
            mockSupabase.eq
                .mockReturnValueOnce(mockSupabase)
                .mockReturnValueOnce(mockSupabase)
                .mockResolvedValueOnce({ error: new Error('Delete failed') });

            const { error } = await SupabaseService.deleteHealthSharingPreferences('user-1', 'cg-1', 'caregiver');

            expect(error.message).toBe('Delete failed');
        });
    });
});
