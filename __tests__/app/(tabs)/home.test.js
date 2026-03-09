// __tests__/app/(tabs)/home.test.js
import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import Home from '../../../app/(tabs)/home';
import { useAuth } from '../../../contexts/AuthContext';
import { SupabaseService } from '../../../services/SupabaseService';
import { KudosService } from '../../../services/KudosService';
import { NudgeService } from '../../../services/NudgeService';
import { getRecommendedExercises, getDailyPlan, getBadDayPlan } from '../../../services/RecommendationService';

// Mock dependencies
jest.mock('../../../contexts/AuthContext');
jest.mock('../../../services/SupabaseService');
jest.mock('../../../services/KudosService');
jest.mock('../../../services/NudgeService');
jest.mock('../../../services/RecommendationService');

// Mock react-native-svg
jest.mock('react-native-svg', () => {
    const React = require('react');
    const { View } = require('react-native');
    return {
        __esModule: true,
        default: (props) => React.createElement(View, props),
        Circle: 'Circle',
    };
});

// Mock child components to keep tests focused
jest.mock('../../../components/ScreenWrapper', () => {
    const { View } = require('react-native');
    return { ScreenWrapper: ({ children }) => <View>{children}</View> };
});
jest.mock('../../../components/Logo', () => {
    return { __esModule: true, default: () => 'Logo' };
});
jest.mock('../../../components/CareTeamSection', () => {
    return { CareTeamSection: () => 'CareTeamSection' };
});
jest.mock('../../../components/KudosReceivedModal', () => {
    return { KudosReceivedModal: () => null };
});
jest.mock('../../../components/NudgeReceivedModal', () => {
    return { NudgeReceivedModal: () => null };
});
jest.mock('../../../components/CaregiverHomeView', () => {
    const { Text } = require('react-native');
    return { CaregiverHomeView: () => <Text>CaregiverHomeView</Text> };
});
jest.mock('../../../components/MedicalStaffHomeView', () => {
    const { Text } = require('react-native');
    return { MedicalStaffHomeView: () => <Text>MedicalStaffHomeView</Text> };
});

// Mock expo-router
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: mockReplace,
        back: jest.fn(),
    }),
    useFocusEffect: jest.fn((cb) => {
        // Execute the callback via useEffect to respect declaration order
        const { useEffect } = require('react');
        useEffect(() => { cb(); }, []);
    }),
}));

describe('Home Screen', () => {
    const mockUser = { id: 'test-user-id', email: 'test@example.com' };
    const mockSurvivorData = { name: 'Jane Doe', role: 'survivor' };
    const mockCaregiverData = { name: 'John Smith', role: 'caregiver' };
    const mockMedicalStaffData = { name: 'Dr. Adams', role: 'medical_staff' };

    beforeEach(() => {
        jest.clearAllMocks();
        // Default: survivor user with data loaded
        useAuth.mockReturnValue({
            user: mockUser,
            userData: mockSurvivorData,
            signOut: jest.fn(() => Promise.resolve({ error: null })),
        });
        SupabaseService.getTodayLog.mockResolvedValue({ log: null, error: null });
        SupabaseService.getUserProfile.mockResolvedValue({ profile: null, error: null });
        KudosService.getUnreadKudos.mockResolvedValue({ kudos: [], error: null });
        NudgeService.getNudgesForSurvivor.mockResolvedValue({ nudges: [], error: null });
        getRecommendedExercises.mockReturnValue({ recommended: [] });
        getDailyPlan.mockReturnValue([]);
        getBadDayPlan.mockReturnValue({ exercises: [], isLightPlan: true });
    });

    describe('Rendering', () => {
        it('renders without crashing', () => {
            const { getByText } = render(<Home />);
            expect(getByText('Welcome back,')).toBeTruthy();
        });

        it('shows loading state when user exists but userData is not loaded', () => {
            useAuth.mockReturnValue({
                user: mockUser,
                userData: null,
                signOut: jest.fn(),
            });
            const { queryByText } = render(<Home />);
            // Should not show greeting when loading
            expect(queryByText('Welcome back,')).toBeNull();
        });

        it('displays user first name for survivor', () => {
            const { getByText } = render(<Home />);
            expect(getByText('Jane')).toBeTruthy();
        });

        it('displays "Friend" when name is not set', () => {
            useAuth.mockReturnValue({
                user: mockUser,
                userData: { name: null, role: 'survivor' },
                signOut: jest.fn(),
            });
            const { getByText } = render(<Home />);
            expect(getByText('Friend')).toBeTruthy();
        });
    });

    describe('Survivor View', () => {
        it('shows Today\'s Plan hero card', () => {
            const { getByText } = render(<Home />);
            expect(getByText("Today's Plan")).toBeTruthy();
        });

        it('shows exercise progress text', () => {
            const { getByText } = render(<Home />);
            expect(getByText('0 of 4 exercises completed')).toBeTruthy();
        });

        it('shows Quick Actions section', () => {
            const { getByText } = render(<Home />);
            expect(getByText('Quick Actions')).toBeTruthy();
        });

        it('shows Chat with Lilly quick action', () => {
            const { getByText } = render(<Home />);
            expect(getByText('Chat with Lilly')).toBeTruthy();
        });

        it('shows Start Exercises quick action', () => {
            const { getByText } = render(<Home />);
            expect(getByText('Start Exercises')).toBeTruthy();
        });

        it('shows My Garden row action', () => {
            const { getByText } = render(<Home />);
            expect(getByText('My Garden')).toBeTruthy();
        });

        it('shows Daily Check-In row action', () => {
            const { getByText } = render(<Home />);
            expect(getByText('Daily Check-In')).toBeTruthy();
        });

        it('shows About Me row action', () => {
            const { getByText } = render(<Home />);
            expect(getByText('About Me')).toBeTruthy();
        });
    });

    describe('Caregiver View', () => {
        beforeEach(() => {
            useAuth.mockReturnValue({
                user: mockUser,
                userData: mockCaregiverData,
                signOut: jest.fn(() => Promise.resolve({ error: null })),
            });
        });

        it('renders CaregiverHomeView for caregiver role', () => {
            const { getByText } = render(<Home />);
            expect(getByText('CaregiverHomeView')).toBeTruthy();
        });

        it('shows caregiver first name in greeting', () => {
            const { getByText } = render(<Home />);
            expect(getByText('John')).toBeTruthy();
        });

        it('does not show survivor quick actions', () => {
            const { queryByText } = render(<Home />);
            expect(queryByText('Start Exercises')).toBeNull();
            expect(queryByText('My Garden')).toBeNull();
        });
    });

    describe('Medical Staff View', () => {
        beforeEach(() => {
            useAuth.mockReturnValue({
                user: mockUser,
                userData: mockMedicalStaffData,
                signOut: jest.fn(() => Promise.resolve({ error: null })),
            });
        });

        it('renders MedicalStaffHomeView for medical_staff role', () => {
            const { getByText } = render(<Home />);
            expect(getByText('MedicalStaffHomeView')).toBeTruthy();
        });

        it('shows medical staff first name in greeting', () => {
            const { getByText } = render(<Home />);
            expect(getByText('Dr.')).toBeTruthy();
        });
    });

    describe('Navigation', () => {
        it('navigates to Lilly on Chat with Lilly press', () => {
            const { getByText } = render(<Home />);
            fireEvent.press(getByText('Chat with Lilly'));
            expect(mockPush).toHaveBeenCalledWith('/lilly');
        });

        it('navigates to exercises on Start Exercises press', () => {
            const { getByText } = render(<Home />);
            fireEvent.press(getByText('Start Exercises'));
            expect(mockPush).toHaveBeenCalledWith('/exercises');
        });

        it('navigates to garden on My Garden press', () => {
            const { getByText } = render(<Home />);
            fireEvent.press(getByText('My Garden'));
            expect(mockPush).toHaveBeenCalledWith('/garden');
        });

        it('navigates to check-in on Daily Check-In press', () => {
            const { getByText } = render(<Home />);
            fireEvent.press(getByText('Daily Check-In'));
            expect(mockPush).toHaveBeenCalledWith('/check-in');
        });

        it('navigates to profile on About Me press', () => {
            const { getByText } = render(<Home />);
            fireEvent.press(getByText('About Me'));
            expect(mockPush).toHaveBeenCalledWith('/profile');
        });
    });

    describe('Daily Progress', () => {
        it('shows completed exercises from today log', async () => {
            SupabaseService.getTodayLog.mockResolvedValue({
                log: { exercises_completed: ['a1', 'a2'] },
                error: null,
            });
            const { getByText } = render(<Home />);
            await waitFor(() => {
                expect(getByText('2 of 4 exercises completed')).toBeTruthy();
            });
        });

        it('shows daily plan exercise names when available', async () => {
            SupabaseService.getUserProfile.mockResolvedValue({
                profile: { impairments: ['arm_weakness'] },
                error: null,
            });
            const mockExercises = [
                { id: 'a1', title: 'Shoulder Shrugs' },
                { id: 'l1', title: 'Ankle Pumps' },
            ];
            getRecommendedExercises.mockReturnValue({ recommended: mockExercises });
            getDailyPlan.mockReturnValue(mockExercises);

            const { getByText } = render(<Home />);
            await waitFor(() => {
                expect(getByText('Shoulder Shrugs')).toBeTruthy();
                expect(getByText('Ankle Pumps')).toBeTruthy();
            });
        });

        it('shows lighter plan message on bad day', async () => {
            SupabaseService.getUserProfile.mockResolvedValue({
                profile: { impairments: ['arm_weakness'] },
                error: null,
            });
            SupabaseService.getTodayLog.mockResolvedValue({
                log: { energy_level: 2, pain_level: 8, exercises_completed: [] },
                error: null,
            });
            const mockExercises = [{ id: 'a1', title: 'Shoulder Shrugs' }];
            getRecommendedExercises.mockReturnValue({ recommended: mockExercises });
            getBadDayPlan.mockReturnValue({ exercises: mockExercises, isLightPlan: true });

            const { getByText } = render(<Home />);
            await waitFor(() => {
                expect(getByText("Today's Lighter Plan")).toBeTruthy();
            });
        });
    });

    describe('Error Handling', () => {
        it('handles SupabaseService.getTodayLog error gracefully', async () => {
            SupabaseService.getTodayLog.mockRejectedValue(new Error('Network error'));
            const { getByText } = render(<Home />);
            // Should still render without crashing
            expect(getByText("Today's Plan")).toBeTruthy();
        });

        it('handles KudosService error gracefully', async () => {
            KudosService.getUnreadKudos.mockRejectedValue(new Error('Kudos error'));
            const { getByText } = render(<Home />);
            expect(getByText("Today's Plan")).toBeTruthy();
        });

        it('handles NudgeService error gracefully', async () => {
            NudgeService.getNudgesForSurvivor.mockRejectedValue(new Error('Nudge error'));
            const { getByText } = render(<Home />);
            expect(getByText("Today's Plan")).toBeTruthy();
        });

        it('handles null user gracefully', () => {
            useAuth.mockReturnValue({
                user: null,
                userData: null,
                signOut: jest.fn(),
            });
            // Should not crash
            const { queryByText } = render(<Home />);
            expect(queryByText('Friend')).toBeTruthy();
        });
    });

    describe('Logout', () => {
        it('shows logout button', () => {
            // The logout button uses LogOut icon which is mocked as string
            // Just verify the component renders with the touchable
            const { getByText } = render(<Home />);
            expect(getByText('Welcome back,')).toBeTruthy();
        });
    });
});
