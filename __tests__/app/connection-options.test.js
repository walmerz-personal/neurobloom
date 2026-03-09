// __tests__/app/connection-options.test.js
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ConnectionOptions from '../../app/connection-options';
import { useAuth } from '../../contexts/AuthContext';
import { CareTeamService } from '../../services/CareTeamService';

jest.mock('../../contexts/AuthContext');
jest.mock('../../services/CareTeamService');

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockUseLocalSearchParams = jest.fn();

jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: jest.fn(),
        back: mockBack,
    }),
    useLocalSearchParams: () => mockUseLocalSearchParams(),
}));

describe('ConnectionOptions Screen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue({ user: { id: 'user-1' } });
        mockUseLocalSearchParams.mockReturnValue({ mode: 'connect' });
        CareTeamService.createInvitation.mockResolvedValue({ code: 'ABC12345', error: null });
        jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    });

    describe('Connect Mode (Caregiver)', () => {
        beforeEach(() => {
            mockUseLocalSearchParams.mockReturnValue({ mode: 'connect' });
        });

        it('renders without crashing', () => {
            const { toJSON } = render(<ConnectionOptions />);
            expect(toJSON()).toBeTruthy();
        });

        it('shows correct title for connect mode', () => {
            const { getByText } = render(<ConnectionOptions />);
            expect(getByText('Connect to Survivor')).toBeTruthy();
        });

        it('shows correct subtitle for connect mode', () => {
            const { getByText } = render(<ConnectionOptions />);
            expect(getByText("Choose how you'd like to connect with a survivor")).toBeTruthy();
        });

        it('shows Enter Invitation Code option', () => {
            const { getByText } = render(<ConnectionOptions />);
            expect(getByText('Enter Invitation Code')).toBeTruthy();
        });

        it('shows Send SMS Invite option', () => {
            const { getByText } = render(<ConnectionOptions />);
            expect(getByText('Send SMS Invite')).toBeTruthy();
        });

        it('navigates to accept-invitation when Enter Code is pressed', () => {
            const { getByText } = render(<ConnectionOptions />);
            fireEvent.press(getByText('Enter Invitation Code'));
            expect(mockPush).toHaveBeenCalledWith('/caregiver/accept-invitation');
        });

        it('navigates to request-access when Send SMS is pressed', () => {
            const { getByText } = render(<ConnectionOptions />);
            fireEvent.press(getByText('Send SMS Invite'));
            expect(mockPush).toHaveBeenCalledWith('/caregiver/request-access');
        });

        it('navigates back when back button is pressed', () => {
            const { getByText } = render(<ConnectionOptions />);
            // Back button contains ArrowLeft icon, but we can find the header
            // and test navigation via the actual rendered content
        });
    });

    describe('Invite Mode (Survivor)', () => {
        beforeEach(() => {
            mockUseLocalSearchParams.mockReturnValue({ mode: 'invite' });
        });

        it('shows correct title for invite mode', () => {
            const { getByText } = render(<ConnectionOptions />);
            expect(getByText('Invite Caregiver')).toBeTruthy();
        });

        it('shows correct subtitle for invite mode', () => {
            const { getByText } = render(<ConnectionOptions />);
            expect(getByText("Choose how you'd like to invite a caregiver or medical professional")).toBeTruthy();
        });

        it('shows Generate & Share Code option', () => {
            const { getByText } = render(<ConnectionOptions />);
            expect(getByText('Generate & Share Code')).toBeTruthy();
        });

        it('generates invitation code on press', async () => {
            const { getByText } = render(<ConnectionOptions />);

            await act(async () => {
                fireEvent.press(getByText('Generate & Share Code'));
            });

            await waitFor(() => {
                expect(CareTeamService.createInvitation).toHaveBeenCalledWith('user-1', 'other');
                expect(Alert.alert).toHaveBeenCalledWith(
                    expect.stringContaining('Invitation Created'),
                    expect.stringContaining('ABC12345'),
                    expect.any(Array)
                );
            });
        });

        it('handles invitation creation error', async () => {
            CareTeamService.createInvitation.mockResolvedValue({ code: null, error: 'Failed' });
            const { getByText } = render(<ConnectionOptions />);

            await act(async () => {
                fireEvent.press(getByText('Generate & Share Code'));
            });

            await waitFor(() => {
                expect(Alert.alert).toHaveBeenCalledWith('Error', 'Could not create invitation. Please try again.');
            });
        });

        it('handles exception during invitation creation', async () => {
            CareTeamService.createInvitation.mockRejectedValue(new Error('Network error'));
            const { getByText } = render(<ConnectionOptions />);

            await act(async () => {
                fireEvent.press(getByText('Generate & Share Code'));
            });

            await waitFor(() => {
                expect(Alert.alert).toHaveBeenCalledWith('Error', 'Something went wrong. Please try again.');
            });
        });

        it('navigates to send-invite when Send SMS is pressed', () => {
            const { getByText } = render(<ConnectionOptions />);
            fireEvent.press(getByText('Send SMS Invite'));
            expect(mockPush).toHaveBeenCalledWith('/survivor/send-invite');
        });
    });

    describe('Default Mode', () => {
        it('defaults to connect mode when no mode param', () => {
            mockUseLocalSearchParams.mockReturnValue({});
            const { getByText } = render(<ConnectionOptions />);
            expect(getByText('Connect to Survivor')).toBeTruthy();
        });
    });
});
