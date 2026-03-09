// __tests__/app/accept-access.test.js
import React from 'react';
import { render } from '@testing-library/react-native';
import AcceptAccessRedirect from '../../app/accept-access';

const mockUseLocalSearchParams = jest.fn();
jest.mock('expo-router', () => ({
    useLocalSearchParams: () => mockUseLocalSearchParams(),
    Redirect: ({ href }) => {
        const { Text } = require('react-native');
        return <Text testID="redirect">{href}</Text>;
    },
}));

describe('AcceptAccessRedirect', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders without crashing', () => {
        mockUseLocalSearchParams.mockReturnValue({});
        const { toJSON } = render(<AcceptAccessRedirect />);
        expect(toJSON()).toBeTruthy();
    });

    it('redirects to accept-access-request with token when token is present', () => {
        mockUseLocalSearchParams.mockReturnValue({ token: 'xyz789' });
        const { getByTestId } = render(<AcceptAccessRedirect />);
        const redirect = getByTestId('redirect');
        expect(redirect.props.children).toBe('/accept-access-request?token=xyz789');
    });

    it('redirects to home when no token', () => {
        mockUseLocalSearchParams.mockReturnValue({});
        const { getByTestId } = render(<AcceptAccessRedirect />);
        const redirect = getByTestId('redirect');
        expect(redirect.props.children).toBe('/(tabs)/home');
    });

    it('redirects to home when token is undefined', () => {
        mockUseLocalSearchParams.mockReturnValue({ token: undefined });
        const { getByTestId } = render(<AcceptAccessRedirect />);
        const redirect = getByTestId('redirect');
        expect(redirect.props.children).toBe('/(tabs)/home');
    });
});
