import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Details from '../../../app/onboarding/details';

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
    const { Text } = require('react-native');
    return {
        Ionicons: (props) => <Text>{props.name}</Text>,
    };
});

// Mock DateTimePicker
jest.mock('@react-native-community/datetimepicker', () => {
    const { View } = require('react-native');
    return {
        __esModule: true,
        default: (props) => <View testID="date-time-picker" />,
    };
});

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: mockPush,
        back: mockBack,
    }),
    useLocalSearchParams: jest.fn(),
}));

const { useLocalSearchParams } = require('expo-router');

describe('Details Screen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Survivor role', () => {
        beforeEach(() => {
            useLocalSearchParams.mockReturnValue({ role: 'survivor', name: 'John' });
        });

        it('renders without crashing', () => {
            const { toJSON } = render(<Details />);
            expect(toJSON()).toBeTruthy();
        });

        it('shows the title', () => {
            const { getByText } = render(<Details />);
            expect(getByText('Tell us a bit more')).toBeTruthy();
        });

        it('shows survivor-specific stroke date question', () => {
            const { getByText } = render(<Details />);
            expect(getByText('When did you have your stroke?')).toBeTruthy();
        });

        it('shows survivor-specific challenges question', () => {
            const { getByText } = render(<Details />);
            expect(getByText('What are your main challenges?')).toBeTruthy();
        });

        it('shows impairment options', () => {
            const { getByText } = render(<Details />);
            expect(getByText('Movement / Mobility')).toBeTruthy();
            expect(getByText('Speech / Communication')).toBeTruthy();
            expect(getByText('Memory / Thinking')).toBeTruthy();
            expect(getByText('Vision')).toBeTruthy();
        });

        it('shows affected side options', () => {
            const { getByText } = render(<Details />);
            expect(getByText('Left side')).toBeTruthy();
            expect(getByText('Right side')).toBeTruthy();
            expect(getByText('Both sides')).toBeTruthy();
            expect(getByText("I'm not sure")).toBeTruthy();
        });

        it('shows severity options', () => {
            const { getByText } = render(<Details />);
            expect(getByText('Mild')).toBeTruthy();
            expect(getByText('Moderate')).toBeTruthy();
            expect(getByText('Severe')).toBeTruthy();
        });

        it('shows Select date placeholder', () => {
            const { getByText } = render(<Details />);
            expect(getByText('Select date')).toBeTruthy();
        });

        it('shows Next button', () => {
            const { getByText } = render(<Details />);
            expect(getByText('Next')).toBeTruthy();
        });

        it('shows Skip button for survivor', () => {
            const { getByText } = render(<Details />);
            expect(getByText('Skip for now')).toBeTruthy();
        });

        it('navigates to goals with params when Next is pressed', () => {
            const { getByText } = render(<Details />);
            fireEvent.press(getByText('Next'));
            expect(mockPush).toHaveBeenCalledWith({
                pathname: '/onboarding/goals',
                params: expect.objectContaining({
                    role: 'survivor',
                    name: 'John',
                    impairments: JSON.stringify([]),
                }),
            });
        });

        it('navigates to goals with empty data when Skip is pressed', () => {
            const { getByText } = render(<Details />);
            fireEvent.press(getByText('Skip for now'));
            expect(mockPush).toHaveBeenCalledWith({
                pathname: '/onboarding/goals',
                params: expect.objectContaining({
                    role: 'survivor',
                    name: 'John',
                    strokeDate: '',
                    impairments: JSON.stringify([]),
                    affectedSide: '',
                    impairmentSeverity: '',
                }),
            });
        });

        it('calls router.back when back button is pressed', () => {
            const { getByText } = render(<Details />);
            fireEvent.press(getByText('arrow-back'));
            expect(mockBack).toHaveBeenCalled();
        });

        it('toggles impairment selection', () => {
            const { getByText, queryAllByText } = render(<Details />);
            fireEvent.press(getByText('Movement / Mobility'));
            // After selecting, a checkmark should appear
            expect(queryAllByText('✓').length).toBeGreaterThan(0);
        });
    });

    describe('Caregiver role', () => {
        beforeEach(() => {
            useLocalSearchParams.mockReturnValue({ role: 'caregiver', name: 'Jane' });
        });

        it('shows caregiver-specific stroke date question', () => {
            const { getByText } = render(<Details />);
            expect(getByText('When did your loved one have their stroke?')).toBeTruthy();
        });

        it('shows caregiver-specific challenges question', () => {
            const { getByText } = render(<Details />);
            expect(getByText('What are their main challenges?')).toBeTruthy();
        });

        it('shows Skip button for caregiver', () => {
            const { getByText } = render(<Details />);
            expect(getByText('Skip for now')).toBeTruthy();
        });
    });

    describe('Medical Staff role', () => {
        beforeEach(() => {
            useLocalSearchParams.mockReturnValue({ role: 'medical_staff', name: 'Dr. Smith' });
        });

        it('renders without crashing', () => {
            const { toJSON } = render(<Details />);
            expect(toJSON()).toBeTruthy();
        });

        it('shows medical staff role question', () => {
            const { getByText } = render(<Details />);
            expect(getByText('What is your role?')).toBeTruthy();
        });

        it('shows medical staff role options', () => {
            const { getByText } = render(<Details />);
            expect(getByText('Occupational Therapist (OT)')).toBeTruthy();
            expect(getByText('Speech Language Pathologist (SLP)')).toBeTruthy();
            expect(getByText('Physical Therapist (PT)')).toBeTruthy();
            expect(getByText('Psychologist')).toBeTruthy();
            expect(getByText('Nurse')).toBeTruthy();
            expect(getByText('Other')).toBeTruthy();
        });

        it('does not show Skip button for medical staff', () => {
            const { queryByText } = render(<Details />);
            expect(queryByText('Skip for now')).toBeNull();
        });

        it('does not show stroke date or impairment questions', () => {
            const { queryByText } = render(<Details />);
            expect(queryByText('When did you have your stroke?')).toBeNull();
            expect(queryByText('What are your main challenges?')).toBeNull();
        });

        it('selects a medical staff role and navigates', () => {
            const { getByText } = render(<Details />);
            fireEvent.press(getByText('Physical Therapist (PT)'));
            fireEvent.press(getByText('Next'));
            expect(mockPush).toHaveBeenCalledWith({
                pathname: '/onboarding/goals',
                params: expect.objectContaining({
                    role: 'medical_staff',
                    name: 'Dr. Smith',
                    medicalStaffRole: 'physical_therapist',
                }),
            });
        });

        it('shows other role input when Other is selected', () => {
            const { getByText, getByLabelText } = render(<Details />);
            fireEvent.press(getByText('Other'));
            expect(getByLabelText('Your role')).toBeTruthy();
        });
    });
});
