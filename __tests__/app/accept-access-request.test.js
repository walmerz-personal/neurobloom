// __tests__/app/accept-access-request.test.js
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AcceptAccessRequest from '../../app/accept-access-request';
import { useAuth } from '../../contexts/AuthContext';
import { CareTeamService } from '../../services/CareTeamService';

jest.mock('../../contexts/AuthContext');
jest.mock('../../services/CareTeamService');
jest.mock('../../services/MedicalStaffService');

const mockReplace = jest.fn();
const mockUseLocalSearchParams = jest.fn();

jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: mockReplace,
        back: jest.fn(),
    }),
    useLocalSearchParams: () => mockUseLocalSearchParams(),
}));

jest.mock('expo-linking', () => ({
    getInitialURL: jest.fn().mockResolvedValue(null),
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    parse: jest.fn(),
}));

describe('AcceptAccessRequest Screen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue({
            user: { id: 'user-1' },
            userData: { role: 'survivor' },
        });
        mockUseLocalSearchParams.mockReturnValue({ token: 'test-token' });
        CareTeamService.getAccessRequestByToken.mockResolvedValue({
            data: {
                id: 'req-1',
                requester: { name: 'Dr. Smith' },
                requesterRole: 'caregiver',
                relationship: 'caregiver',
            },
            error: null,
        });
        CareTeamService.acceptAccessRequest.mockResolvedValue({
            success: true,
            requester: { name: 'Dr. Smith' },
            error: null,
        });
        jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    });

    it('renders without crashing', async () => {
        const { toJSON } = render(<AcceptAccessRequest />);
        await waitFor(() => {
            expect(toJSON()).toBeTruthy();
        });
    });

    it('shows loading state while looking up request', () => {
        CareTeamService.getAccessRequestByToken.mockReturnValue(new Promise(() => {}));
        const { getByText } = render(<AcceptAccessRequest />);
        expect(getByText('Looking up access request...')).toBeTruthy();
    });

    it('shows access request details after loading', async () => {
        const { getByText } = render(<AcceptAccessRequest />);
        await waitFor(() => {
            expect(getByText('Approve Access Request')).toBeTruthy();
            expect(getByText('Dr. Smith')).toBeTruthy();
            expect(getByText('caregiver')).toBeTruthy();
        });
    });

    it('shows header with Access Request title', async () => {
        const { getByText } = render(<AcceptAccessRequest />);
        await waitFor(() => {
            expect(getByText('Access Request')).toBeTruthy();
        });
    });

    it('shows permissions list', async () => {
        const { getByText } = render(<AcceptAccessRequest />);
        await waitFor(() => {
            expect(getByText('They will be able to:')).toBeTruthy();
        });
    });

    it('shows Approve Access button', async () => {
        const { getByText } = render(<AcceptAccessRequest />);
        await waitFor(() => {
            expect(getByText('Approve Access')).toBeTruthy();
        });
    });

    it('shows Decline button', async () => {
        const { getByText } = render(<AcceptAccessRequest />);
        await waitFor(() => {
            expect(getByText('Decline')).toBeTruthy();
        });
    });

    it('accepts access request successfully', async () => {
        const { getByText } = render(<AcceptAccessRequest />);
        await waitFor(() => {
            expect(getByText('Approve Access')).toBeTruthy();
        });

        await act(async () => {
            fireEvent.press(getByText('Approve Access'));
        });

        await waitFor(() => {
            expect(CareTeamService.acceptAccessRequest).toHaveBeenCalledWith('test-token', 'user-1');
            expect(Alert.alert).toHaveBeenCalledWith(
                expect.stringContaining('Access Granted'),
                expect.stringContaining('Dr. Smith'),
                expect.any(Array)
            );
        });
    });

    it('shows decline confirmation dialog', async () => {
        const { getByText } = render(<AcceptAccessRequest />);
        await waitFor(() => {
            expect(getByText('Decline')).toBeTruthy();
        });

        fireEvent.press(getByText('Decline'));

        expect(Alert.alert).toHaveBeenCalledWith(
            'Decline Access Request',
            'Are you sure you want to decline this access request?',
            expect.any(Array)
        );
    });

    it('shows error when access request not found', async () => {
        CareTeamService.getAccessRequestByToken.mockResolvedValue({
            data: null,
            error: { message: 'Not found' },
        });
        const { getByText } = render(<AcceptAccessRequest />);
        await waitFor(() => {
            expect(getByText('Access Request Not Found')).toBeTruthy();
        });
    });

    it('shows Go to Home button on error', async () => {
        CareTeamService.getAccessRequestByToken.mockResolvedValue({
            data: null,
            error: { message: 'Not found' },
        });
        const { getByText } = render(<AcceptAccessRequest />);
        await waitFor(() => {
            expect(getByText('Go to Home')).toBeTruthy();
        });

        fireEvent.press(getByText('Go to Home'));
        expect(mockReplace).toHaveBeenCalledWith('/(tabs)/home');
    });

    it('shows error when no token provided', async () => {
        mockUseLocalSearchParams.mockReturnValue({});
        const { getByText } = render(<AcceptAccessRequest />);
        await waitFor(() => {
            expect(getByText('Access Request Not Found')).toBeTruthy();
            expect(getByText('No access token provided')).toBeTruthy();
        });
    });

    it('prevents non-survivors from accepting', async () => {
        useAuth.mockReturnValue({
            user: { id: 'user-1' },
            userData: { role: 'caregiver' },
        });
        const { getByText } = render(<AcceptAccessRequest />);
        await waitFor(() => {
            expect(getByText('Approve Access')).toBeTruthy();
        });

        await act(async () => {
            fireEvent.press(getByText('Approve Access'));
        });

        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Only survivors can accept access requests.');
    });

    it('handles accept error gracefully', async () => {
        CareTeamService.acceptAccessRequest.mockResolvedValue({
            success: false,
            error: { message: 'Failed to accept' },
        });
        const { getByText } = render(<AcceptAccessRequest />);
        await waitFor(() => {
            expect(getByText('Approve Access')).toBeTruthy();
        });

        await act(async () => {
            fireEvent.press(getByText('Approve Access'));
        });

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to accept');
        });
    });

    it('handles exception during accept', async () => {
        CareTeamService.acceptAccessRequest.mockRejectedValue(new Error('Network error'));
        const { getByText } = render(<AcceptAccessRequest />);
        await waitFor(() => {
            expect(getByText('Approve Access')).toBeTruthy();
        });

        await act(async () => {
            fireEvent.press(getByText('Approve Access'));
        });

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith('Error', 'Something went wrong. Please try again.');
        });
    });

    it('shows medical staff member label for medical_staff role', async () => {
        CareTeamService.getAccessRequestByToken.mockResolvedValue({
            data: {
                id: 'req-1',
                requester: { name: 'Dr. Jones' },
                requesterRole: 'medical_staff',
                relationship: 'doctor',
            },
            error: null,
        });
        const { getByText } = render(<AcceptAccessRequest />);
        await waitFor(() => {
            expect(getByText('medical staff member')).toBeTruthy();
        });
    });
});
