// __tests__/app/medical-staff/assign-exercises.test.js
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AssignExercises from '../../../app/medical-staff/assign-exercises';

const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: jest.fn(),
        back: mockBack,
    }),
    useLocalSearchParams: () => ({
        survivorId: 'surv-1',
    }),
}));

// Use stable object references to prevent infinite re-render loops
const mockUser = { id: 'staff-1' };
const mockUserData = { role: 'medical_staff' };
jest.mock('../../../contexts/AuthContext', () => ({
    useAuth: () => ({
        user: mockUser,
        userData: mockUserData,
    }),
}));

jest.mock('../../../services/MedicalStaffService', () => ({
    MedicalStaffService: {
        getLinkedSurvivors: jest.fn(),
        assignExercise: jest.fn(),
        getAssignedExercises: jest.fn(),
    },
}));

jest.mock('../../../services/SupabaseService', () => ({
    SupabaseService: {
        getCustomExercises: jest.fn(),
        createCustomExercise: jest.fn(),
        updateCustomExercise: jest.fn(),
    },
}));

jest.mock('../../../components/ScreenWrapper', () => {
    const { View } = require('react-native');
    return { ScreenWrapper: ({ children }) => <View>{children}</View> };
});

jest.mock('../../../components/CustomExerciseModal', () => {
    const { View } = require('react-native');
    return { CustomExerciseModal: () => <View testID="custom-exercise-modal" /> };
});

const { MedicalStaffService } = require('../../../services/MedicalStaffService');
const { SupabaseService } = require('../../../services/SupabaseService');

describe('AssignExercises', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        SupabaseService.getCustomExercises.mockResolvedValue({ data: [], error: null });
        MedicalStaffService.getAssignedExercises.mockResolvedValue({ assignments: [], error: null });
    });

    it('shows loading state initially', () => {
        MedicalStaffService.getLinkedSurvivors.mockReturnValue(new Promise(() => {}));

        const { getByText } = render(<AssignExercises />);
        expect(getByText('Assign Exercises')).toBeTruthy();
    });

    it('renders header and content after loading', async () => {
        MedicalStaffService.getLinkedSurvivors.mockResolvedValue({
            survivors: [{ id: 'surv-1', name: 'Jane Doe' }],
            error: null,
        });

        const { getByText } = render(<AssignExercises />);

        await waitFor(() => {
            expect(getByText('Select Patient')).toBeTruthy();
        });
    });

    it('shows linked survivors as patient options', async () => {
        MedicalStaffService.getLinkedSurvivors.mockResolvedValue({
            survivors: [
                { id: 'surv-1', name: 'Jane Doe' },
                { id: 'surv-2', name: 'John Smith' },
            ],
            error: null,
        });

        const { getByText } = render(<AssignExercises />);

        await waitFor(() => {
            expect(getByText('Jane Doe')).toBeTruthy();
        });
        expect(getByText('John Smith')).toBeTruthy();
    });

    it('shows category filter buttons', async () => {
        MedicalStaffService.getLinkedSurvivors.mockResolvedValue({
            survivors: [{ id: 'surv-1', name: 'Jane' }],
            error: null,
        });

        const { getByText } = render(<AssignExercises />);

        await waitFor(() => {
            expect(getByText('All')).toBeTruthy();
        });
        expect(getByText('Arms')).toBeTruthy();
        expect(getByText('Legs')).toBeTruthy();
        expect(getByText('Core')).toBeTruthy();
        expect(getByText('Hands')).toBeTruthy();
    });

    it('shows exercise list with titles', async () => {
        MedicalStaffService.getLinkedSurvivors.mockResolvedValue({
            survivors: [{ id: 'surv-1', name: 'Jane' }],
            error: null,
        });

        const { getByText } = render(<AssignExercises />);

        await waitFor(() => {
            expect(getByText('Shoulder Shrugs')).toBeTruthy();
        });
        expect(getByText('Ankle Pumps')).toBeTruthy();
        expect(getByText('Trunk Rotations')).toBeTruthy();
        expect(getByText('Fist Clenches')).toBeTruthy();
    });

    it('shows 0 selected initially', async () => {
        MedicalStaffService.getLinkedSurvivors.mockResolvedValue({
            survivors: [{ id: 'surv-1', name: 'Jane' }],
            error: null,
        });

        const { getByText } = render(<AssignExercises />);

        await waitFor(() => {
            expect(getByText('Exercises (0 selected)')).toBeTruthy();
        });
    });

    it('updates selected count when exercise is toggled', async () => {
        MedicalStaffService.getLinkedSurvivors.mockResolvedValue({
            survivors: [{ id: 'surv-1', name: 'Jane' }],
            error: null,
        });

        const { getByText } = render(<AssignExercises />);

        await waitFor(() => {
            expect(getByText('Shoulder Shrugs')).toBeTruthy();
        });

        fireEvent.press(getByText('Shoulder Shrugs'));

        await waitFor(() => {
            expect(getByText('Exercises (1 selected)')).toBeTruthy();
        });
    });

    it('shows assign button with selected count', async () => {
        MedicalStaffService.getLinkedSurvivors.mockResolvedValue({
            survivors: [{ id: 'surv-1', name: 'Jane' }],
            error: null,
        });

        const { getByText } = render(<AssignExercises />);

        await waitFor(() => {
            expect(getByText('Assign 0 Exercise(s)')).toBeTruthy();
        });
    });

    it('calls assignExercise for each selected exercise on save', async () => {
        MedicalStaffService.getLinkedSurvivors.mockResolvedValue({
            survivors: [{ id: 'surv-1', name: 'Jane' }],
            error: null,
        });
        MedicalStaffService.assignExercise.mockResolvedValue({
            assignment: { id: 'new-1' },
            error: null,
        });
        jest.spyOn(Alert, 'alert');

        const { getByText } = render(<AssignExercises />);

        await waitFor(() => {
            expect(getByText('Shoulder Shrugs')).toBeTruthy();
        });

        // Select an exercise
        fireEvent.press(getByText('Shoulder Shrugs'));

        await waitFor(() => {
            expect(getByText('Assign 1 Exercise(s)')).toBeTruthy();
        });

        // Press assign
        await act(async () => {
            fireEvent.press(getByText('Assign 1 Exercise(s)'));
        });

        expect(MedicalStaffService.assignExercise).toHaveBeenCalledWith(
            'surv-1',
            'staff-1',
            'a1',
            'built_in',
            null,
            null
        );
        expect(Alert.alert).toHaveBeenCalledWith(
            'Success',
            expect.stringContaining('1 exercise(s)'),
        );
    });

    it('filters exercises by category', async () => {
        MedicalStaffService.getLinkedSurvivors.mockResolvedValue({
            survivors: [{ id: 'surv-1', name: 'Jane' }],
            error: null,
        });

        const { getByText, queryByText } = render(<AssignExercises />);

        await waitFor(() => {
            expect(getByText('Hands')).toBeTruthy();
        });

        // Click "Hands" filter
        fireEvent.press(getByText('Hands'));

        // Should show hand exercises
        await waitFor(() => {
            expect(getByText('Fist Clenches')).toBeTruthy();
        });
        // Should not show arm exercises
        expect(queryByText('Shoulder Shrugs')).toBeNull();
    });

    it('shows already-assigned badge', async () => {
        MedicalStaffService.getLinkedSurvivors.mockResolvedValue({
            survivors: [{ id: 'surv-1', name: 'Jane' }],
            error: null,
        });
        MedicalStaffService.getAssignedExercises.mockResolvedValue({
            assignments: [{ exercise_id: 'a1' }],
            error: null,
        });

        const { getAllByText } = render(<AssignExercises />);

        await waitFor(() => {
            expect(getAllByText('Assigned').length).toBeGreaterThan(0);
        });
    });

    it('shows assignment details inputs when exercises selected', async () => {
        MedicalStaffService.getLinkedSurvivors.mockResolvedValue({
            survivors: [{ id: 'surv-1', name: 'Jane' }],
            error: null,
        });

        const { getByText, getByPlaceholderText } = render(<AssignExercises />);

        await waitFor(() => {
            expect(getByText('Shoulder Shrugs')).toBeTruthy();
        });

        // Select an exercise to reveal the details section
        fireEvent.press(getByText('Shoulder Shrugs'));

        await waitFor(() => {
            expect(getByText('Assignment Details')).toBeTruthy();
        });
        expect(getByPlaceholderText('YYYY-MM-DD (optional)')).toBeTruthy();
        expect(getByPlaceholderText('Notes for patient (optional)')).toBeTruthy();
    });
});
