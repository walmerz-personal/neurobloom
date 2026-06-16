import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import PromisCheckIn from '../../app/promis-checkin';
import { useAuth } from '../../contexts/AuthContext';
import { SupabaseService } from '../../services/SupabaseService';

jest.mock('../../contexts/AuthContext');
jest.mock('../../services/SupabaseService');

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: mockBack }),
}));

jest.mock('../../components/CustomSlider', () => {
    const { View } = require('react-native');
    return { CustomSlider: (props) => <View testID="custom-slider" {...props} /> };
});

describe('PromisCheckIn Screen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue({ user: { id: 'user-1' } });
        SupabaseService.savePromisAssessment.mockResolvedValue({ data: {}, error: null });
        jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    });

    it('renders the header and the first question', () => {
        const { getByText } = render(<PromisCheckIn />);
        expect(getByText('Monthly Check-In')).toBeTruthy();
        expect(getByText(/In general, would you say your health is/)).toBeTruthy();
    });

    it('blocks submission until all questions are answered', async () => {
        const { getByText } = render(<PromisCheckIn />);

        await act(async () => {
            fireEvent.press(getByText('Submit Check-In'));
        });

        expect(Alert.alert).toHaveBeenCalledWith('Almost there', expect.any(String));
        expect(SupabaseService.savePromisAssessment).not.toHaveBeenCalled();
    });

    it('navigates back when Cancel is pressed', () => {
        const { getByText } = render(<PromisCheckIn />);
        fireEvent.press(getByText('Cancel'));
        expect(mockBack).toHaveBeenCalled();
    });
});
