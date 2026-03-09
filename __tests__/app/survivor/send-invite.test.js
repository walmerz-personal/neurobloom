// __tests__/app/survivor/send-invite.test.js
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';
import SendInvite from '../../../app/survivor/send-invite';
import { useAuth } from '../../../contexts/AuthContext';
import { CareTeamService } from '../../../services/CareTeamService';

jest.mock('../../../contexts/AuthContext');
jest.mock('../../../services/CareTeamService');

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        back: mockBack,
    }),
}));

describe('SendInvite Screen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue({
            user: { id: 'user-1' },
            userData: { name: 'John Doe' },
        });
        CareTeamService.createSurvivorInvite.mockResolvedValue({ token: 'invite-token-123', error: null });
        jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
        jest.spyOn(Linking, 'openURL').mockResolvedValue();
    });

    it('renders without crashing', () => {
        const { toJSON } = render(<SendInvite />);
        expect(toJSON()).toBeTruthy();
    });

    it('shows header with Send Invite title', () => {
        const { getByText } = render(<SendInvite />);
        expect(getByText('Send Invite')).toBeTruthy();
    });

    it('shows Invite via SMS title', () => {
        const { getByText } = render(<SendInvite />);
        expect(getByText('Invite via SMS')).toBeTruthy();
    });

    it('shows description text', () => {
        const { getByText } = render(<SendInvite />);
        expect(getByText('Tap the button below to open Messages and select a contact to send the invite link.')).toBeTruthy();
    });

    it('shows Open Messages button', () => {
        const { getByText } = render(<SendInvite />);
        expect(getByText('Open Messages')).toBeTruthy();
    });

    it('shows privacy note', () => {
        const { getByText } = render(<SendInvite />);
        expect(getByText(/caregiver or medical professional will receive an SMS/)).toBeTruthy();
    });

    it('creates invite and opens SMS when button pressed', async () => {
        const { getByText } = render(<SendInvite />);

        await act(async () => {
            fireEvent.press(getByText('Open Messages'));
        });

        await waitFor(() => {
            expect(CareTeamService.createSurvivorInvite).toHaveBeenCalledWith('user-1', null);
            expect(Linking.canOpenURL).toHaveBeenCalled();
            expect(Linking.openURL).toHaveBeenCalledWith(
                expect.stringContaining('sms:')
            );
            expect(Alert.alert).toHaveBeenCalledWith(
                'Messages Opened',
                expect.any(String),
                expect.any(Array)
            );
        });
    });

    it('shows fallback message when SMS cannot be opened', async () => {
        Linking.canOpenURL.mockResolvedValue(false);
        const { getByText } = render(<SendInvite />);

        await act(async () => {
            fireEvent.press(getByText('Open Messages'));
        });

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith(
                'Invite Created',
                expect.stringContaining('Please send this message'),
                expect.any(Array)
            );
        });
    });

    it('handles invite creation error', async () => {
        CareTeamService.createSurvivorInvite.mockResolvedValue({
            token: null,
            error: { message: 'Failed to create invite' },
        });
        const { getByText } = render(<SendInvite />);

        await act(async () => {
            fireEvent.press(getByText('Open Messages'));
        });

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to create invite');
        });
    });

    it('handles exception during invite creation', async () => {
        CareTeamService.createSurvivorInvite.mockRejectedValue(new Error('Network error'));
        const { getByText } = render(<SendInvite />);

        await act(async () => {
            fireEvent.press(getByText('Open Messages'));
        });

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith('Error', 'Something went wrong. Please try again.');
        });
    });

    it('uses fallback name when userData.name is missing', async () => {
        useAuth.mockReturnValue({
            user: { id: 'user-1' },
            userData: {},
        });
        const { getByText } = render(<SendInvite />);

        await act(async () => {
            fireEvent.press(getByText('Open Messages'));
        });

        await waitFor(() => {
            // URL is percent-encoded, so check for the encoded form
            expect(Linking.openURL).toHaveBeenCalledWith(
                expect.stringContaining('A%20survivor')
            );
        });
    });
});
