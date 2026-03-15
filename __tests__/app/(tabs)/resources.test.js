// __tests__/app/(tabs)/resources.test.js
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import Resources from '../../../app/(tabs)/resources';
import { useAuth } from '../../../contexts/AuthContext';

const mockReplace = jest.fn();
jest.mock('../../../contexts/AuthContext');
jest.mock('expo-router', () => ({
    useRouter: () => ({
        replace: mockReplace,
    }),
}));

describe('Resources Tab', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders caregiver resource titles when role is caregiver', async () => {
        useAuth.mockReturnValue({ userData: { role: 'caregiver' } });

        const { getByText } = render(<Resources />);

        await waitFor(() => {
            expect(getByText('Resources')).toBeTruthy();
            expect(getByText('Caregiver Burnout: Signs to Watch')).toBeTruthy();
            expect(getByText('Celebrating Small Wins')).toBeTruthy();
            expect(getByText('Understanding Neuroplasticity')).toBeTruthy();
        });
        expect(mockReplace).not.toHaveBeenCalled();
    });

    it('renders medical staff resource titles when role is medical_staff', async () => {
        useAuth.mockReturnValue({ userData: { role: 'medical_staff' } });

        const { getByText } = render(<Resources />);

        await waitFor(() => {
            expect(getByText('Resources')).toBeTruthy();
            expect(getByText('Effective Exercise Assignment')).toBeTruthy();
            expect(getByText('Tracking Patient Progress')).toBeTruthy();
            expect(getByText('Collaborating with Care Teams')).toBeTruthy();
        });
        expect(mockReplace).not.toHaveBeenCalled();
    });

    it('redirects to home when role is survivor', async () => {
        useAuth.mockReturnValue({ userData: { role: 'survivor' } });

        render(<Resources />);

        await waitFor(() => {
            expect(mockReplace).toHaveBeenCalledWith('/(tabs)/home');
        });
    });
});
