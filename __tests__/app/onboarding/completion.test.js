import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Completion from '../../../app/onboarding/completion';

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
    useRouter: () => ({
        replace: mockReplace,
    }),
}));

describe('Completion Screen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders without crashing', () => {
        const { toJSON } = render(<Completion />);
        expect(toJSON()).toBeTruthy();
    });

    it('shows the completion title', () => {
        const { getByText } = render(<Completion />);
        expect(getByText("You're all set!")).toBeTruthy();
    });

    it('shows the completion subtitle', () => {
        const { getByText } = render(<Completion />);
        expect(getByText(/NeuroBloom is ready to help you/)).toBeTruthy();
    });

    it('shows the celebration emoji', () => {
        const { getByText } = render(<Completion />);
        expect(getByText('🎉')).toBeTruthy();
    });

    it('shows Go to Home button', () => {
        const { getByText } = render(<Completion />);
        expect(getByText('Go to Home')).toBeTruthy();
    });

    it('navigates to home when Go to Home is pressed', () => {
        const { getByText } = render(<Completion />);
        fireEvent.press(getByText('Go to Home'));
        expect(mockReplace).toHaveBeenCalledWith('/(tabs)/home');
    });
});
