// __tests__/components/CustomExerciseModal.test.js
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { CustomExerciseModal } from '../../components/CustomExerciseModal';

// Mock Alert.alert
jest.spyOn(Alert, 'alert');

describe('CustomExerciseModal', () => {
    const defaultProps = {
        visible: true,
        onClose: jest.fn(),
        onSave: jest.fn(() => Promise.resolve()),
        userId: 'user-123',
        userRole: 'survivor',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders when visible=true', () => {
        const { getByText } = render(<CustomExerciseModal {...defaultProps} />);
        expect(getByText('Create Custom Exercise')).toBeTruthy();
    });

    it('does not render modal content when visible=false', () => {
        const { queryByText } = render(
            <CustomExerciseModal {...defaultProps} visible={false} />
        );
        // Modal does not render children when visible=false
        expect(queryByText('Create Custom Exercise')).toBeNull();
    });

    it('shows "Edit Exercise" title when exercise prop is provided', () => {
        const exercise = {
            id: 'ex-1',
            title: 'Test Exercise',
            category: 'Legs',
            mode: 'solo',
            instructions: ['Step 1', 'Step 2'],
        };
        const { getByText } = render(
            <CustomExerciseModal {...defaultProps} exercise={exercise} />
        );
        expect(getByText('Edit Exercise')).toBeTruthy();
    });

    it('shows "Update Exercise" button text when editing', () => {
        const exercise = {
            id: 'ex-1',
            title: 'Test Exercise',
            instructions: ['Step 1'],
        };
        const { getByText } = render(
            <CustomExerciseModal {...defaultProps} exercise={exercise} />
        );
        expect(getByText('Update Exercise')).toBeTruthy();
    });

    it('shows "Create Exercise" button text when creating new', () => {
        const { getByText } = render(<CustomExerciseModal {...defaultProps} />);
        expect(getByText('Create Exercise')).toBeTruthy();
    });

    it('calls onClose when close button is pressed', () => {
        const { getByText } = render(<CustomExerciseModal {...defaultProps} />);
        fireEvent.press(getByText('Cancel'));
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('displays all category options', () => {
        const { getByText } = render(<CustomExerciseModal {...defaultProps} />);
        expect(getByText('Arms')).toBeTruthy();
        expect(getByText('Legs')).toBeTruthy();
        expect(getByText('Core')).toBeTruthy();
        expect(getByText('Hands')).toBeTruthy();
    });

    it('displays all difficulty options', () => {
        const { getByText } = render(<CustomExerciseModal {...defaultProps} />);
        expect(getByText('Beginner')).toBeTruthy();
        expect(getByText('Intermediate')).toBeTruthy();
        expect(getByText('Advanced')).toBeTruthy();
    });

    it('displays required field labels', () => {
        const { getByText } = render(<CustomExerciseModal {...defaultProps} />);
        expect(getByText('Title *')).toBeTruthy();
        expect(getByText('Category *')).toBeTruthy();
        expect(getByText('Mode *')).toBeTruthy();
        expect(getByText('Instructions *')).toBeTruthy();
    });

    it('shows "Share with Care Team" for survivor role', () => {
        const { getByText } = render(
            <CustomExerciseModal {...defaultProps} userRole="survivor" />
        );
        expect(getByText('Share with Care Team')).toBeTruthy();
    });

    it('shows "Share with my Circle" for caregiver role', () => {
        const { getByText } = render(
            <CustomExerciseModal {...defaultProps} userRole="caregiver" />
        );
        expect(getByText('Share with my Circle')).toBeTruthy();
    });

    it('shows validation error when title is empty', async () => {
        const { getByText, getByLabelText } = render(
            <CustomExerciseModal {...defaultProps} />
        );

        // Fill instructions but leave title empty
        fireEvent.changeText(getByLabelText('Exercise instructions'), 'Step 1');
        fireEvent.press(getByText('Create Exercise'));

        expect(Alert.alert).toHaveBeenCalledWith(
            'Validation Error',
            'Please enter an exercise title.'
        );
        expect(defaultProps.onSave).not.toHaveBeenCalled();
    });

    it('shows validation error when instructions are empty', async () => {
        const { getByText, getByLabelText } = render(
            <CustomExerciseModal {...defaultProps} />
        );

        // Fill title but leave instructions empty
        fireEvent.changeText(getByLabelText('Exercise title'), 'My Exercise');
        fireEvent.press(getByText('Create Exercise'));

        expect(Alert.alert).toHaveBeenCalledWith(
            'Validation Error',
            'Please enter exercise instructions.'
        );
        expect(defaultProps.onSave).not.toHaveBeenCalled();
    });

    it('calls onSave with correct data on valid submission', async () => {
        const { getByText, getByLabelText } = render(
            <CustomExerciseModal {...defaultProps} />
        );

        fireEvent.changeText(getByLabelText('Exercise title'), 'Shoulder Rolls');
        fireEvent.changeText(getByLabelText('Exercise instructions'), 'Roll shoulders forward\nRoll shoulders back');
        fireEvent.press(getByText('Create Exercise'));

        await waitFor(() => {
            expect(defaultProps.onSave).toHaveBeenCalledTimes(1);
        });

        const savedData = defaultProps.onSave.mock.calls[0][0];
        expect(savedData.title).toBe('Shoulder Rolls');
        expect(savedData.category).toBe('Arms');
        expect(savedData.mode).toBe('solo');
        expect(savedData.difficulty).toBe('Beginner');
        expect(savedData.instructions).toEqual(['Roll shoulders forward', 'Roll shoulders back']);
        expect(savedData.isSharedWithCareTeam).toBe(false);
    });

    it('passes exercise id when editing', async () => {
        const exercise = {
            id: 'ex-42',
            title: 'Existing Exercise',
            category: 'Core',
            mode: 'solo',
            instructions: ['Step 1'],
        };
        const { getByText } = render(
            <CustomExerciseModal {...defaultProps} exercise={exercise} />
        );

        fireEvent.press(getByText('Update Exercise'));

        await waitFor(() => {
            expect(defaultProps.onSave).toHaveBeenCalledTimes(1);
        });

        const exerciseId = defaultProps.onSave.mock.calls[0][1];
        expect(exerciseId).toBe('ex-42');
    });

    it('shows error alert when onSave rejects', async () => {
        const failingSave = jest.fn(() => Promise.reject(new Error('Network error')));
        const { getByText, getByLabelText } = render(
            <CustomExerciseModal {...defaultProps} onSave={failingSave} />
        );

        fireEvent.changeText(getByLabelText('Exercise title'), 'Test');
        fireEvent.changeText(getByLabelText('Exercise instructions'), 'Step 1');
        fireEvent.press(getByText('Create Exercise'));

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith('Error', 'Network error');
        });
    });

    it('populates form fields when editing an existing exercise', () => {
        const exercise = {
            id: 'ex-1',
            title: 'Finger Taps',
            category: 'Hands',
            mode: 'solo',
            time: '5 min',
            target: 'Fine motor',
            description: 'Tap fingers sequentially',
            difficulty: 'Intermediate',
            instructions: ['Tap index', 'Tap middle'],
            isSharedWithCareTeam: true,
        };
        const { getByLabelText } = render(
            <CustomExerciseModal {...defaultProps} exercise={exercise} />
        );

        expect(getByLabelText('Exercise title').props.value).toBe('Finger Taps');
        expect(getByLabelText('Exercise instructions').props.value).toBe('Tap index\nTap middle');
    });
});
