import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TouchableOpacity } from 'react-native';
import Welcome from '../../../app/onboarding/welcome';

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

describe('Welcome Screen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders without crashing', () => {
        const { toJSON } = render(<Welcome />);
        expect(toJSON()).toBeTruthy();
    });

    it('shows the welcome title', () => {
        const { getByText } = render(<Welcome />);
        expect(getByText(/Welcome to/)).toBeTruthy();
        expect(getByText(/NeuroBloom/)).toBeTruthy();
    });

    it('shows the subtitle', () => {
        const { getByText } = render(<Welcome />);
        expect(getByText(/Your companion for stroke recovery/)).toBeTruthy();
    });

    it('shows Get Started button', () => {
        const { getByText } = render(<Welcome />);
        expect(getByText('Get Started')).toBeTruthy();
    });

    it('navigates to role screen when Get Started is pressed', () => {
        const { getByText } = render(<Welcome />);
        fireEvent.press(getByText('Get Started'));
        expect(mockPush).toHaveBeenCalledWith('/onboarding/role');
    });

    it('calls router.back when back button is pressed', () => {
        const { getByText } = render(<Welcome />);
        // Ionicons mock renders the icon name as text
        fireEvent.press(getByText('arrow-back'));
        expect(mockBack).toHaveBeenCalled();
    });
});
