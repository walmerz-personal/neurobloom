import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Goals from '../../../app/onboarding/goals';

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
    const { Text } = require('react-native');
    return {
        Ionicons: (props) => <Text>{props.name}</Text>,
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

describe('Goals Screen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Survivor role', () => {
        beforeEach(() => {
            useLocalSearchParams.mockReturnValue({
                role: 'survivor',
                name: 'John',
                strokeDate: '2024-01-15',
                impairments: JSON.stringify(['motor', 'speech']),
                affectedSide: 'left',
                impairmentSeverity: 'moderate',
            });
        });

        it('renders without crashing', () => {
            const { toJSON } = render(<Goals />);
            expect(toJSON()).toBeTruthy();
        });

        it('shows the title', () => {
            const { getByText } = render(<Goals />);
            expect(getByText('Almost done!')).toBeTruthy();
        });

        it('shows the journey question', () => {
            const { getByText } = render(<Goals />);
            expect(getByText('Where are you in the journey?')).toBeTruthy();
        });

        it('shows recovery phase options', () => {
            const { getByText } = render(<Goals />);
            expect(getByText('Just happened (0-4 weeks)')).toBeTruthy();
            expect(getByText('Early recovery (4 weeks - 6 months)')).toBeTruthy();
            expect(getByText('Long-term (6+ months)')).toBeTruthy();
        });

        it('shows goals question', () => {
            const { getByText } = render(<Goals />);
            expect(getByText('What are your main goals?')).toBeTruthy();
        });

        it('shows goals text input', () => {
            const { getByLabelText } = render(<Goals />);
            expect(getByLabelText('Recovery goals')).toBeTruthy();
        });

        it('shows Complete Setup button', () => {
            const { getByText } = render(<Goals />);
            expect(getByText('Complete Setup')).toBeTruthy();
        });

        it('shows Skip button', () => {
            const { getByText } = render(<Goals />);
            expect(getByText('Skip for now')).toBeTruthy();
        });

        it('allows typing goals', () => {
            const { getByLabelText } = render(<Goals />);
            const goalsInput = getByLabelText('Recovery goals');
            fireEvent.changeText(goalsInput, 'Walk without a cane');
            expect(goalsInput.props.value).toBe('Walk without a cane');
        });

        it('navigates to signup when Complete Setup is pressed', () => {
            const { getByText } = render(<Goals />);
            fireEvent.press(getByText('Complete Setup'));
            expect(mockPush).toHaveBeenCalledWith({
                pathname: '/auth/signup',
                params: expect.objectContaining({
                    role: 'survivor',
                    name: 'John',
                    strokeDate: '2024-01-15',
                    impairments: JSON.stringify(['motor', 'speech']),
                }),
            });
        });

        it('navigates to signup with empty goals when Skip is pressed', () => {
            const { getByText } = render(<Goals />);
            fireEvent.press(getByText('Skip for now'));
            expect(mockPush).toHaveBeenCalledWith({
                pathname: '/auth/signup',
                params: expect.objectContaining({
                    role: 'survivor',
                    name: 'John',
                    recoveryPhase: '',
                    goals: '',
                }),
            });
        });

        it('calls router.back when back button is pressed', () => {
            const { getByText } = render(<Goals />);
            fireEvent.press(getByText('arrow-back'));
            expect(mockBack).toHaveBeenCalled();
        });

        it('selects a recovery phase', () => {
            const { getByText } = render(<Goals />);
            fireEvent.press(getByText('Long-term (6+ months)'));
            fireEvent.press(getByText('Complete Setup'));
            expect(mockPush).toHaveBeenCalledWith({
                pathname: '/auth/signup',
                params: expect.objectContaining({
                    recoveryPhase: 'chronic',
                }),
            });
        });
    });

    describe('Medical Staff role', () => {
        beforeEach(() => {
            useLocalSearchParams.mockReturnValue({
                role: 'medical_staff',
                name: 'Dr. Smith',
                medicalStaffRole: 'physical_therapist',
                impairments: JSON.stringify([]),
            });
        });

        it('redirects medical staff directly to signup', () => {
            render(<Goals />);
            expect(mockPush).toHaveBeenCalledWith({
                pathname: '/auth/signup',
                params: expect.objectContaining({
                    role: 'medical_staff',
                    name: 'Dr. Smith',
                    medicalStaffRole: 'physical_therapist',
                }),
            });
        });

        it('does not show recovery phase for medical staff', () => {
            const { queryByText } = render(<Goals />);
            expect(queryByText('Almost done!')).toBeNull();
            expect(queryByText('Where are you in the journey?')).toBeNull();
        });
    });

    describe('Caregiver role', () => {
        beforeEach(() => {
            useLocalSearchParams.mockReturnValue({
                role: 'caregiver',
                name: 'Jane',
                strokeDate: '',
                impairments: JSON.stringify([]),
                affectedSide: '',
                impairmentSeverity: '',
            });
        });

        it('shows content for caregiver (same as survivor)', () => {
            const { getByText } = render(<Goals />);
            expect(getByText('Almost done!')).toBeTruthy();
            expect(getByText('Where are you in the journey?')).toBeTruthy();
        });
    });
});
