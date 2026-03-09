// __tests__/app/medical-staff/manage-assignments.test.js
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        back: mockBack,
    }),
    useLocalSearchParams: () => ({
        survivorId: 'surv-1',
        survivorName: 'Jane Doe',
    }),
}));

// Use stable object references to prevent infinite re-render loops
const mockUser = { id: 'staff-1' };
jest.mock('../../../contexts/AuthContext', () => ({
    useAuth: () => ({
        user: mockUser,
    }),
}));

jest.mock('../../../services/MedicalStaffService', () => ({
    MedicalStaffService: {
        getMedicalStaffAssignments: jest.fn(),
        removeAssignment: jest.fn(),
    },
}));

jest.mock('../../../services/SupabaseService', () => ({
    SupabaseService: {
        updateAssignmentNotes: jest.fn(),
    },
}));

jest.mock('../../../components/ScreenWrapper', () => {
    const { View } = require('react-native');
    return { ScreenWrapper: ({ children }) => <View>{children}</View> };
});

const { MedicalStaffService } = require('../../../services/MedicalStaffService');
const { SupabaseService } = require('../../../services/SupabaseService');
import ManageAssignments from '../../../app/medical-staff/manage-assignments';

describe('ManageAssignments', () => {
    const mockAssignments = [
        {
            id: 'assign-1',
            survivor_id: 'surv-1',
            exercise_id: 'a1',
            exercise_type: 'built_in',
            status: 'assigned',
            assigned_date: '2026-03-01',
            due_date: '2026-03-15',
            notes: 'Do 3 sets of 10',
        },
        {
            id: 'assign-2',
            survivor_id: 'surv-1',
            exercise_id: 'l2',
            exercise_type: 'built_in',
            status: 'completed',
            assigned_date: '2026-02-20',
            due_date: null,
            notes: null,
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('shows loading state', () => {
        MedicalStaffService.getMedicalStaffAssignments.mockReturnValue(new Promise(() => {}));

        const { getByText } = render(<ManageAssignments />);
        expect(getByText('Manage Assignments')).toBeTruthy();
    });

    it('renders patient name and assignment count', async () => {
        MedicalStaffService.getMedicalStaffAssignments.mockResolvedValue({
            assignments: mockAssignments,
            error: null,
        });

        const { getByText } = render(<ManageAssignments />);

        await waitFor(() => {
            expect(getByText('Jane Doe')).toBeTruthy();
        });
        expect(getByText('2 assignment(s)')).toBeTruthy();
    });

    it('shows exercise titles instead of raw IDs', async () => {
        MedicalStaffService.getMedicalStaffAssignments.mockResolvedValue({
            assignments: mockAssignments,
            error: null,
        });

        const { getByText } = render(<ManageAssignments />);

        await waitFor(() => {
            expect(getByText('Shoulder Shrugs')).toBeTruthy();
        });
        expect(getByText('Seated Marching')).toBeTruthy();
    });

    it('shows assignment status labels', async () => {
        MedicalStaffService.getMedicalStaffAssignments.mockResolvedValue({
            assignments: mockAssignments,
            error: null,
        });

        const { getAllByText } = render(<ManageAssignments />);

        await waitFor(() => {
            // "Assigned" appears in filter tab + status label
            expect(getAllByText('Assigned').length).toBeGreaterThanOrEqual(2);
        });
        // "Completed" appears in filter tab + status label
        expect(getAllByText('Completed').length).toBeGreaterThanOrEqual(2);
    });

    it('shows filter tabs', async () => {
        MedicalStaffService.getMedicalStaffAssignments.mockResolvedValue({
            assignments: mockAssignments,
            error: null,
        });

        const { getByText } = render(<ManageAssignments />);

        await waitFor(() => {
            expect(getByText('All')).toBeTruthy();
            expect(getByText('Skipped')).toBeTruthy();
        });
    });

    it('shows empty state when no assignments', async () => {
        MedicalStaffService.getMedicalStaffAssignments.mockResolvedValue({
            assignments: [],
            error: null,
        });

        const { getByText } = render(<ManageAssignments />);

        await waitFor(() => {
            expect(getByText('No assignments yet')).toBeTruthy();
        });
    });

    it('shows notes when present', async () => {
        MedicalStaffService.getMedicalStaffAssignments.mockResolvedValue({
            assignments: mockAssignments,
            error: null,
        });

        const { getByText } = render(<ManageAssignments />);

        await waitFor(() => {
            expect(getByText('Do 3 sets of 10')).toBeTruthy();
        });
    });

    it('shows Edit Notes and Delete buttons', async () => {
        MedicalStaffService.getMedicalStaffAssignments.mockResolvedValue({
            assignments: mockAssignments,
            error: null,
        });

        const { getAllByText } = render(<ManageAssignments />);

        await waitFor(() => {
            expect(getAllByText('Edit Notes').length).toBeGreaterThan(0);
        });
        expect(getAllByText('Delete').length).toBeGreaterThan(0);
    });

    it('shows delete confirmation alert', async () => {
        MedicalStaffService.getMedicalStaffAssignments.mockResolvedValue({
            assignments: mockAssignments,
            error: null,
        });
        jest.spyOn(Alert, 'alert');

        const { getAllByText } = render(<ManageAssignments />);

        await waitFor(() => {
            expect(getAllByText('Delete').length).toBeGreaterThan(0);
        });

        fireEvent.press(getAllByText('Delete')[0]);

        expect(Alert.alert).toHaveBeenCalledWith(
            'Delete Assignment',
            expect.stringContaining('cannot be undone'),
            expect.any(Array)
        );
    });

    it('opens notes editor on Edit Notes press', async () => {
        MedicalStaffService.getMedicalStaffAssignments.mockResolvedValue({
            assignments: mockAssignments,
            error: null,
        });

        const { getAllByText, getByPlaceholderText, getByText } = render(<ManageAssignments />);

        await waitFor(() => {
            expect(getAllByText('Edit Notes').length).toBeGreaterThan(0);
        });

        fireEvent.press(getAllByText('Edit Notes')[0]);

        expect(getByPlaceholderText('Add notes...')).toBeTruthy();
        expect(getByText('Save')).toBeTruthy();
        expect(getByText('Cancel')).toBeTruthy();
    });

    it('filters assignments by status', async () => {
        MedicalStaffService.getMedicalStaffAssignments.mockResolvedValue({
            assignments: mockAssignments,
            error: null,
        });

        const { getByText, getAllByText } = render(<ManageAssignments />);

        await waitFor(() => {
            expect(getByText('Jane Doe')).toBeTruthy();
        });

        // "Completed" appears in both filter tab and status label; press first one (the filter)
        fireEvent.press(getAllByText('Completed')[0]);

        expect(getByText('1 assignment(s)')).toBeTruthy();
    });

    it('shows due date when present', async () => {
        MedicalStaffService.getMedicalStaffAssignments.mockResolvedValue({
            assignments: mockAssignments,
            error: null,
        });

        const { getByText } = render(<ManageAssignments />);

        await waitFor(() => {
            expect(getByText(/Due:/)).toBeTruthy();
        });
    });
});
