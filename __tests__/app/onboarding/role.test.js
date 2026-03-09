import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import RoleSelection from '../../../app/onboarding/role';

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
}));

describe('Role Selection Screen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders without crashing', () => {
        const { toJSON } = render(<RoleSelection />);
        expect(toJSON()).toBeTruthy();
    });

    it('shows the title', () => {
        const { getByText } = render(<RoleSelection />);
        expect(getByText('Who is this account for?')).toBeTruthy();
    });

    it('shows the subtitle', () => {
        const { getByText } = render(<RoleSelection />);
        expect(getByText('This helps us personalize your experience.')).toBeTruthy();
    });

    it('shows name input field', () => {
        const { getByLabelText } = render(<RoleSelection />);
        expect(getByLabelText('First name')).toBeTruthy();
    });

    it('shows all three role options', () => {
        const { getByText } = render(<RoleSelection />);
        expect(getByText('I am a Stroke Survivor')).toBeTruthy();
        expect(getByText('I am a Caregiver')).toBeTruthy();
        expect(getByText('I am Medical Staff')).toBeTruthy();
    });

    it('shows role descriptions', () => {
        const { getByText } = render(<RoleSelection />);
        expect(getByText('I want to work on my recovery.')).toBeTruthy();
        expect(getByText('I am helping a loved one recover.')).toBeTruthy();
        expect(getByText('I am a PT, OT, SLP, or other healthcare provider.')).toBeTruthy();
    });

    it('allows typing a name', () => {
        const { getByLabelText } = render(<RoleSelection />);
        const nameInput = getByLabelText('First name');
        fireEvent.changeText(nameInput, 'John');
        expect(nameInput.props.value).toBe('John');
    });

    it('navigates to details with survivor role when survivor is pressed', () => {
        const { getByText } = render(<RoleSelection />);
        fireEvent.press(getByText('I am a Stroke Survivor'));
        expect(mockPush).toHaveBeenCalledWith({
            pathname: '/onboarding/details',
            params: { role: 'survivor', name: '' },
        });
    });

    it('navigates to details with caregiver role when caregiver is pressed', () => {
        const { getByText } = render(<RoleSelection />);
        fireEvent.press(getByText('I am a Caregiver'));
        expect(mockPush).toHaveBeenCalledWith({
            pathname: '/onboarding/details',
            params: { role: 'caregiver', name: '' },
        });
    });

    it('navigates to details with medical_staff role when medical staff is pressed', () => {
        const { getByText } = render(<RoleSelection />);
        fireEvent.press(getByText('I am Medical Staff'));
        expect(mockPush).toHaveBeenCalledWith({
            pathname: '/onboarding/details',
            params: { role: 'medical_staff', name: '' },
        });
    });

    it('passes entered name with role selection', () => {
        const { getByText, getByLabelText } = render(<RoleSelection />);
        const nameInput = getByLabelText('First name');
        fireEvent.changeText(nameInput, 'Jane');
        fireEvent.press(getByText('I am a Stroke Survivor'));
        expect(mockPush).toHaveBeenCalledWith({
            pathname: '/onboarding/details',
            params: { role: 'survivor', name: 'Jane' },
        });
    });

    it('calls router.back when back button is pressed', () => {
        const { getByText } = render(<RoleSelection />);
        fireEvent.press(getByText('arrow-back'));
        expect(mockBack).toHaveBeenCalled();
    });
});
