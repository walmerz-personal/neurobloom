// __tests__/app/caregiver/request-access.test.js
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';
import RequestAccess from '../../../app/caregiver/request-access';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        back: mockBack,
    }),
    useLocalSearchParams: () => ({}),
}));

const mockUseAuth = jest.fn();
jest.mock('../../../contexts/AuthContext', () => ({
    useAuth: () => mockUseAuth(),
}));

jest.mock('../../../services/CareTeamService', () => ({
    CareTeamService: {
        createAccessRequest: jest.fn(),
    },
}));

jest.mock('../../../services/MedicalStaffService', () => ({
    MedicalStaffService: {
        createAccessRequest: jest.fn(),
    },
}));

jest.mock('../../../components/ScreenWrapper', () => {
    const { View } = require('react-native');
    return { ScreenWrapper: ({ children }) => <View>{children}</View> };
});

const { CareTeamService } = require('../../../services/CareTeamService');
const { MedicalStaffService } = require('../../../services/MedicalStaffService');

describe('RequestAccess', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseAuth.mockReturnValue({
            user: { id: 'caregiver-1' },
            userData: { name: 'Bob Caregiver', role: 'caregiver' },
        });
    });

    it('renders without crashing', () => {
        const { getByText } = render(<RequestAccess />);
        expect(getByText('Request Access')).toBeTruthy();
    });

    it('shows title and description', () => {
        const { getByText } = render(<RequestAccess />);
        expect(getByText('Request Access via SMS')).toBeTruthy();
        expect(getByText(/open Messages and select a contact/)).toBeTruthy();
    });

    it('shows Open Messages button', () => {
        const { getByText } = render(<RequestAccess />);
        expect(getByText('Open Messages')).toBeTruthy();
    });

    it('shows privacy note', () => {
        const { getByText } = render(<RequestAccess />);
        expect(getByText(/survivor will receive an SMS/)).toBeTruthy();
    });

    it('calls CareTeamService.createAccessRequest for caregiver role', async () => {
        CareTeamService.createAccessRequest.mockResolvedValue({ token: 'abc123', error: null });
        jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
        jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
        jest.spyOn(Alert, 'alert');

        const { getByText } = render(<RequestAccess />);

        await act(async () => {
            fireEvent.press(getByText('Open Messages'));
        });

        expect(CareTeamService.createAccessRequest).toHaveBeenCalledWith('caregiver-1', null);
    });

    it('calls MedicalStaffService.createAccessRequest for medical_staff role', async () => {
        mockUseAuth.mockReturnValue({
            user: { id: 'staff-1' },
            userData: { name: 'Dr. Smith', role: 'medical_staff' },
        });
        MedicalStaffService.createAccessRequest.mockResolvedValue({ token: 'xyz789', error: null });
        jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
        jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
        jest.spyOn(Alert, 'alert');

        const { getByText } = render(<RequestAccess />);

        await act(async () => {
            fireEvent.press(getByText('Open Messages'));
        });

        expect(MedicalStaffService.createAccessRequest).toHaveBeenCalledWith('staff-1', null);
    });

    it('shows error alert when token creation fails', async () => {
        CareTeamService.createAccessRequest.mockResolvedValue({
            token: null,
            error: { message: 'Server error' },
        });
        jest.spyOn(Alert, 'alert');

        const { getByText } = render(<RequestAccess />);

        await act(async () => {
            fireEvent.press(getByText('Open Messages'));
        });

        expect(Alert.alert).toHaveBeenCalledWith('Error', expect.any(String));
    });

    it('shows fallback alert when SMS URL cannot be opened', async () => {
        CareTeamService.createAccessRequest.mockResolvedValue({ token: 'tok123', error: null });
        jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false);
        jest.spyOn(Alert, 'alert');

        const { getByText } = render(<RequestAccess />);

        await act(async () => {
            fireEvent.press(getByText('Open Messages'));
        });

        expect(Alert.alert).toHaveBeenCalledWith(
            'Access Request Created',
            expect.stringContaining('tok123'),
            expect.any(Array)
        );
    });
});
