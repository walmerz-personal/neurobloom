// __tests__/app/index.test.js
import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import Index from '../../app/index';
import { useAuth } from '../../contexts/AuthContext';

jest.mock('../../contexts/AuthContext');

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({
        replace: mockReplace,
        push: jest.fn(),
        back: jest.fn(),
    }),
}));

describe('Index (Root Router)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('renders without crashing', () => {
        useAuth.mockReturnValue({ user: null, userData: null, loading: true });
        const { toJSON } = render(<Index />);
        expect(toJSON()).toBeTruthy();
    });

    it('shows loading indicator while auth is loading', () => {
        useAuth.mockReturnValue({ user: null, userData: null, loading: true });
        const { UNSAFE_getByType } = render(<Index />);
        const { ActivityIndicator } = require('react-native');
        expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });

    it('navigates to login when not authenticated', async () => {
        useAuth.mockReturnValue({ user: null, userData: null, loading: false });
        render(<Index />);

        await waitFor(() => {
            expect(mockReplace).toHaveBeenCalledWith('/auth/login');
        });
    });

    it('navigates to home when user and userData are present', async () => {
        useAuth.mockReturnValue({
            user: { id: 'user-1' },
            userData: { name: 'Test User', role: 'survivor' },
            loading: false,
        });
        render(<Index />);

        await waitFor(() => {
            expect(mockReplace).toHaveBeenCalledWith('/(tabs)/home');
        });
    });

    it('stays on loading screen when user exists but userData is null', () => {
        useAuth.mockReturnValue({
            user: { id: 'user-1' },
            userData: null,
            loading: false,
        });
        render(<Index />);

        // Should not navigate yet
        expect(mockReplace).not.toHaveBeenCalled();
    });

    it('navigates via safety timeout when loading takes too long', async () => {
        useAuth.mockReturnValue({
            user: { id: 'user-1' },
            userData: null,
            loading: true,
        });
        render(<Index />);

        // Fast-forward past the 10s safety timeout
        act(() => {
            jest.advanceTimersByTime(11000);
        });

        expect(mockReplace).toHaveBeenCalledWith('/(tabs)/home');
    });

    it('safety timeout navigates to login when no user', async () => {
        useAuth.mockReturnValue({
            user: null,
            userData: null,
            loading: true,
        });
        render(<Index />);

        act(() => {
            jest.advanceTimersByTime(11000);
        });

        expect(mockReplace).toHaveBeenCalledWith('/auth/login');
    });

    it('cleans up timeout on unmount', () => {
        useAuth.mockReturnValue({ user: null, userData: null, loading: true });
        const { unmount } = render(<Index />);
        unmount();

        // Advancing timers should not cause navigation after unmount
        act(() => {
            jest.advanceTimersByTime(11000);
        });

        expect(mockReplace).not.toHaveBeenCalled();
    });
});
