// __tests__/app/caregiver/accept-survivor-invite.test.js
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AcceptSurvivorInvite from '../../../app/caregiver/accept-survivor-invite';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: mockReplace,
        back: jest.fn(),
    }),
    useLocalSearchParams: () => ({
        token: 'test-token-123',
    }),
}));

jest.mock('../../../contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'caregiver-1' },
        userData: { role: 'caregiver' },
    }),
}));

jest.mock('../../../services/CareTeamService', () => ({
    CareTeamService: {
        getAccessRequestByToken: jest.fn(),
        acceptSurvivorInvite: jest.fn(),
    },
}));

jest.mock('../../../services/MedicalStaffService', () => ({
    MedicalStaffService: {},
}));

jest.mock('expo-linking', () => ({
    getInitialURL: jest.fn(() => Promise.resolve(null)),
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    parse: jest.fn(),
}));

jest.mock('../../../components/ScreenWrapper', () => {
    const { View } = require('react-native');
    return { ScreenWrapper: ({ children }) => <View>{children}</View> };
});

const { CareTeamService } = require('../../../services/CareTeamService');

describe('AcceptSurvivorInvite', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('shows loading state while looking up invite', () => {
        CareTeamService.getAccessRequestByToken.mockReturnValue(new Promise(() => {}));

        const { getByText } = render(<AcceptSurvivorInvite />);
        expect(getByText('Looking up invite...')).toBeTruthy();
    });

    it('shows error when invite not found', async () => {
        CareTeamService.getAccessRequestByToken.mockResolvedValue({
            data: null,
            error: { message: 'Invite not found or has expired' },
        });

        const { getByText } = render(<AcceptSurvivorInvite />);

        await waitFor(() => {
            expect(getByText('Invite Not Found')).toBeTruthy();
        });
        expect(getByText('Go to Home')).toBeTruthy();
    });

    it('shows error when invite is not from a survivor', async () => {
        CareTeamService.getAccessRequestByToken.mockResolvedValue({
            data: { id: 'req-1', requesterRole: 'caregiver', requester: { name: 'Bob' } },
            error: null,
        });

        const { getByText } = render(<AcceptSurvivorInvite />);

        await waitFor(() => {
            expect(getByText('Invite Not Found')).toBeTruthy();
        });
    });

    it('renders invite details when valid', async () => {
        CareTeamService.getAccessRequestByToken.mockResolvedValue({
            data: {
                id: 'req-1',
                requesterRole: 'survivor',
                requester: { name: 'Jane Doe' },
                relationship: 'family',
            },
            error: null,
        });

        const { getByText, getAllByText } = render(<AcceptSurvivorInvite />);

        await waitFor(() => {
            expect(getByText('Join Care Team')).toBeTruthy();
        });
        // Jane Doe appears in subtitle and request card
        expect(getAllByText('Jane Doe').length).toBeGreaterThan(0);
        expect(getByText('Survivor')).toBeTruthy();
        // "Accept Invite" appears in header title + button
        expect(getAllByText('Accept Invite').length).toBeGreaterThanOrEqual(2);
        expect(getByText('Decline')).toBeTruthy();
    });

    it('shows permissions list', async () => {
        CareTeamService.getAccessRequestByToken.mockResolvedValue({
            data: {
                id: 'req-1',
                requesterRole: 'survivor',
                requester: { name: 'Jane' },
            },
            error: null,
        });

        const { getByText } = render(<AcceptSurvivorInvite />);

        await waitFor(() => {
            expect(getByText(/View their daily progress/)).toBeTruthy();
        });
        expect(getByText(/exercise completion/)).toBeTruthy();
        expect(getByText(/recovery trends/)).toBeTruthy();
    });

    it('calls acceptSurvivorInvite on accept press', async () => {
        CareTeamService.getAccessRequestByToken.mockResolvedValue({
            data: {
                id: 'req-1',
                requesterRole: 'survivor',
                requester: { name: 'Jane' },
            },
            error: null,
        });
        CareTeamService.acceptSurvivorInvite.mockResolvedValue({
            success: true,
            survivor: { name: 'Jane' },
            error: null,
        });
        jest.spyOn(Alert, 'alert');

        const { getByText, getAllByText } = render(<AcceptSurvivorInvite />);

        await waitFor(() => {
            expect(getAllByText('Accept Invite').length).toBeGreaterThan(0);
        });

        // Press the button (last "Accept Invite" text, which is the button)
        const acceptButtons = getAllByText('Accept Invite');
        await act(async () => {
            fireEvent.press(acceptButtons[acceptButtons.length - 1]);
        });

        expect(CareTeamService.acceptSurvivorInvite).toHaveBeenCalledWith(
            'test-token-123',
            'caregiver-1',
            'caregiver'
        );
        expect(Alert.alert).toHaveBeenCalledWith(
            expect.stringContaining('Connected'),
            expect.stringContaining('Jane'),
            expect.any(Array)
        );
    });

    it('shows decline confirmation alert', async () => {
        CareTeamService.getAccessRequestByToken.mockResolvedValue({
            data: {
                id: 'req-1',
                requesterRole: 'survivor',
                requester: { name: 'Jane' },
            },
            error: null,
        });
        jest.spyOn(Alert, 'alert');

        const { getByText } = render(<AcceptSurvivorInvite />);

        await waitFor(() => {
            expect(getByText('Decline')).toBeTruthy();
        });

        fireEvent.press(getByText('Decline'));

        expect(Alert.alert).toHaveBeenCalledWith(
            'Decline Invite',
            expect.any(String),
            expect.any(Array)
        );
    });

    it('shows accept error alert on failure', async () => {
        CareTeamService.getAccessRequestByToken.mockResolvedValue({
            data: {
                id: 'req-1',
                requesterRole: 'survivor',
                requester: { name: 'Jane' },
            },
            error: null,
        });
        CareTeamService.acceptSurvivorInvite.mockResolvedValue({
            success: false,
            error: { message: 'Already connected' },
        });
        jest.spyOn(Alert, 'alert');

        const { getAllByText } = render(<AcceptSurvivorInvite />);

        await waitFor(() => {
            expect(getAllByText('Accept Invite').length).toBeGreaterThan(0);
        });

        const acceptButtons = getAllByText('Accept Invite');
        await act(async () => {
            fireEvent.press(acceptButtons[acceptButtons.length - 1]);
        });

        expect(Alert.alert).toHaveBeenCalledWith('Error', expect.any(String));
    });
});
