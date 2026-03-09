// __tests__/app/accept-invite.test.js
import React from 'react';
import { render } from '@testing-library/react-native';
import AcceptInviteRedirect from '../../app/accept-invite';

const mockUseLocalSearchParams = jest.fn();
jest.mock('expo-router', () => ({
    useLocalSearchParams: () => mockUseLocalSearchParams(),
    Redirect: ({ href }) => {
        const { Text } = require('react-native');
        return <Text testID="redirect">{href}</Text>;
    },
}));

describe('AcceptInviteRedirect', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders without crashing', () => {
        mockUseLocalSearchParams.mockReturnValue({});
        const { toJSON } = render(<AcceptInviteRedirect />);
        expect(toJSON()).toBeTruthy();
    });

    it('redirects to caregiver accept-survivor-invite with token when token is present', () => {
        mockUseLocalSearchParams.mockReturnValue({ token: 'abc123' });
        const { getByTestId } = render(<AcceptInviteRedirect />);
        const redirect = getByTestId('redirect');
        expect(redirect.props.children).toBe('/caregiver/accept-survivor-invite?token=abc123');
    });

    it('redirects to home when no token', () => {
        mockUseLocalSearchParams.mockReturnValue({});
        const { getByTestId } = render(<AcceptInviteRedirect />);
        const redirect = getByTestId('redirect');
        expect(redirect.props.children).toBe('/(tabs)/home');
    });

    it('redirects to home when token is undefined', () => {
        mockUseLocalSearchParams.mockReturnValue({ token: undefined });
        const { getByTestId } = render(<AcceptInviteRedirect />);
        const redirect = getByTestId('redirect');
        expect(redirect.props.children).toBe('/(tabs)/home');
    });
});
