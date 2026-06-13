// __tests__/app/check-in.test.js
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import CheckIn from '../../app/check-in';
import { useAuth } from '../../contexts/AuthContext';
import { SupabaseService } from '../../services/SupabaseService';

jest.mock('../../contexts/AuthContext');
jest.mock('../../services/SupabaseService');

// Avoid pulling the heavy (tabs)/exercises route (and its native deps) into
// this test; provide a small real-shaped EXERCISES_DATA for plan building.
jest.mock('../../app/(tabs)/exercises', () => ({
    EXERCISES_DATA: [
        { id: 'a1', category: 'Arms', title: 'Shoulder Shrugs', difficulty: 'Beginner' },
        { id: 'a3', category: 'Arms', title: 'Bicep Curls', difficulty: 'Intermediate' },
        { id: 'l1', category: 'Legs', title: 'Ankle Pumps', difficulty: 'Beginner' },
        { id: 'l2', category: 'Legs', title: 'Seated Marching', difficulty: 'Beginner' },
        { id: 'c1', category: 'Core', title: 'Trunk Rotations', difficulty: 'Beginner' },
        { id: 'h1', category: 'Hands', title: 'Fist Clenches', difficulty: 'Beginner' },
    ],
}));

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        back: mockBack,
    }),
}));

// Mock CustomSlider
jest.mock('../../components/CustomSlider', () => {
    const { View } = require('react-native');
    return {
        CustomSlider: (props) => <View testID="custom-slider" {...props} />,
    };
});

describe('CheckIn Screen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue({ user: { id: 'user-1' } });
        // Default to "no plan" so the check-in shows DEFAULT_EXERCISES;
        // individual tests override these to exercise plan-driven behavior.
        SupabaseService.getUserProfile.mockResolvedValue({ profile: null });
        SupabaseService.getAssignedExercises.mockResolvedValue({ data: [] });
        SupabaseService.getTodayLog.mockResolvedValue({ log: null });
        SupabaseService.saveDailyLog.mockResolvedValue({ data: {}, error: null });
        SupabaseService.getUserPoints.mockResolvedValue({ points: 50 });
        SupabaseService.updateUserPoints.mockResolvedValue({});
        jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    });

    it('renders without crashing', () => {
        const { toJSON } = render(<CheckIn />);
        expect(toJSON()).toBeTruthy();
    });

    it('shows header with correct title', () => {
        const { getByText } = render(<CheckIn />);
        expect(getByText('Daily Check-In')).toBeTruthy();
    });

    it('shows Cancel button that navigates back', () => {
        const { getByText } = render(<CheckIn />);
        fireEvent.press(getByText('Cancel'));
        expect(mockBack).toHaveBeenCalled();
    });

    it('shows mood section', () => {
        const { getByText } = render(<CheckIn />);
        expect(getByText("How's your mood today?")).toBeTruthy();
    });

    it('shows exercise section with all exercises', () => {
        const { getByText } = render(<CheckIn />);
        expect(getByText('Exercises Completed Today')).toBeTruthy();
        expect(getByText('Shoulder Shrugs')).toBeTruthy();
        expect(getByText('Ankle Pumps')).toBeTruthy();
        expect(getByText('Trunk Rotations')).toBeTruthy();
        expect(getByText('Fist Clenches')).toBeTruthy();
        expect(getByText('Seated Marching')).toBeTruthy();
    });

    it('shows staff-assigned exercises from the daily plan', async () => {
        SupabaseService.getUserProfile.mockResolvedValue({
            profile: { impairments: ['motor'], recovery_phase: 'chronic' },
        });
        SupabaseService.getAssignedExercises.mockResolvedValue({ data: [{ exercise_id: 'a3' }] });

        const { findByText } = render(<CheckIn />);

        // a3 (Bicep Curls) is staff-assigned and not in the default list,
        // so its presence proves the check-in is plan-driven.
        expect(await findByText('Bicep Curls')).toBeTruthy();
        expect(SupabaseService.getAssignedExercises).toHaveBeenCalledWith('user-1', 'assigned');
    });

    it('shows pain and energy sections', () => {
        const { getByText } = render(<CheckIn />);
        expect(getByText('Pain Level')).toBeTruthy();
        expect(getByText('Energy Level')).toBeTruthy();
    });

    it('shows notes section', () => {
        const { getByText } = render(<CheckIn />);
        expect(getByText('Any notes for today?')).toBeTruthy();
    });

    it('shows save button', () => {
        const { getByText } = render(<CheckIn />);
        expect(getByText('Save Check-In')).toBeTruthy();
    });

    it('toggles exercise selection on press', () => {
        const { getByText } = render(<CheckIn />);
        fireEvent.press(getByText('Shoulder Shrugs'));
        // Exercise should now be selected (checkmark appears)
        // Press again to deselect
        fireEvent.press(getByText('Shoulder Shrugs'));
    });

    it('shows error alert when saving without being logged in', async () => {
        useAuth.mockReturnValue({ user: null });
        const { getByText } = render(<CheckIn />);

        await act(async () => {
            fireEvent.press(getByText('Save Check-In'));
        });

        expect(Alert.alert).toHaveBeenCalledWith('Error', 'You must be logged in to save check-ins');
    });

    it('saves check-in successfully', async () => {
        const { getByText } = render(<CheckIn />);

        await act(async () => {
            fireEvent.press(getByText('Save Check-In'));
        });

        await waitFor(() => {
            expect(SupabaseService.saveDailyLog).toHaveBeenCalledWith('user-1', expect.objectContaining({
                mood: expect.any(String),
                painLevel: expect.any(Number),
                energyLevel: expect.any(Number),
            }));
        });

        expect(Alert.alert).toHaveBeenCalledWith('Success', 'Check-in saved!', expect.any(Array));
    });

    it('awards points for new exercises', async () => {
        SupabaseService.getTodayLog.mockResolvedValue({ log: { exercises_completed: [] } });
        const { getByText } = render(<CheckIn />);

        // Select an exercise
        fireEvent.press(getByText('Shoulder Shrugs'));

        await act(async () => {
            fireEvent.press(getByText('Save Check-In'));
        });

        await waitFor(() => {
            expect(SupabaseService.getUserPoints).toHaveBeenCalledWith('user-1');
            expect(SupabaseService.updateUserPoints).toHaveBeenCalledWith('user-1', 60); // 50 + 10
        });
    });

    it('handles save error gracefully', async () => {
        SupabaseService.saveDailyLog.mockResolvedValue({ data: null, error: 'DB error' });
        const { getByText } = render(<CheckIn />);

        await act(async () => {
            fireEvent.press(getByText('Save Check-In'));
        });

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to save check-in. Please try again.');
        });
    });

    it('handles exception during save', async () => {
        SupabaseService.getTodayLog.mockRejectedValue(new Error('Network error'));
        const { getByText } = render(<CheckIn />);

        await act(async () => {
            fireEvent.press(getByText('Save Check-In'));
        });

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to save check-in. Please try again.');
        });
    });

    it('allows text input in notes field', () => {
        const { getByLabelText } = render(<CheckIn />);
        const notesInput = getByLabelText('Notes');
        fireEvent.changeText(notesInput, 'Feeling good today');
    });
});
