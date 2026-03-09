import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Reminders from '../../../app/onboarding/reminders';
import { NotificationService } from '../../../services/NotificationService';

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
    const { Text } = require('react-native');
    return {
        Ionicons: (props) => <Text>{props.name}</Text>,
    };
});

// Mock DateTimePicker
jest.mock('@react-native-community/datetimepicker', () => {
    const { View } = require('react-native');
    return {
        __esModule: true,
        default: (props) => <View testID="date-time-picker" />,
    };
});

// Mock NotificationService
jest.mock('../../../services/NotificationService', () => ({
    NotificationService: {
        requestPermissions: jest.fn(() => Promise.resolve(true)),
        scheduleDailyReminder: jest.fn(() => Promise.resolve()),
        saveNotificationPrefs: jest.fn(() => Promise.resolve()),
    },
}));

const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
    useRouter: () => ({
        replace: mockReplace,
        back: mockBack,
    }),
}));

describe('Reminders Screen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders without crashing', () => {
        const { toJSON } = render(<Reminders />);
        expect(toJSON()).toBeTruthy();
    });

    it('shows the title', () => {
        const { getByText } = render(<Reminders />);
        expect(getByText('Daily Exercise Reminders')).toBeTruthy();
    });

    it('shows the subtitle', () => {
        const { getByText } = render(<Reminders />);
        expect(getByText('When would you like to be reminded to exercise?')).toBeTruthy();
    });

    it('shows Continue button', () => {
        const { getByText } = render(<Reminders />);
        expect(getByText('Continue')).toBeTruthy();
    });

    it('shows Skip button', () => {
        const { getByText } = render(<Reminders />);
        expect(getByText('Skip for now')).toBeTruthy();
    });

    it('shows Add Another Reminder button', () => {
        const { getByText } = render(<Reminders />);
        expect(getByText('Add Another Reminder')).toBeTruthy();
    });

    it('shows info text about changing reminders', () => {
        const { getByText } = render(<Reminders />);
        expect(getByText(/change these reminder times in your Profile/)).toBeTruthy();
    });

    it('starts with two default reminder times', () => {
        const { getAllByLabelText } = render(<Reminders />);
        // Two remove buttons should be rendered (accessibilityLabel="Remove reminder")
        expect(getAllByLabelText('Remove reminder').length).toBe(2);
    });

    it('navigates to completion when Continue is pressed', async () => {
        const { getByText } = render(<Reminders />);
        fireEvent.press(getByText('Continue'));
        await waitFor(() => {
            expect(NotificationService.requestPermissions).toHaveBeenCalled();
            expect(mockReplace).toHaveBeenCalledWith('/onboarding/completion');
        });
    });

    it('schedules reminders on Continue', async () => {
        const { getByText } = render(<Reminders />);
        fireEvent.press(getByText('Continue'));
        await waitFor(() => {
            expect(NotificationService.scheduleDailyReminder).toHaveBeenCalled();
            expect(NotificationService.saveNotificationPrefs).toHaveBeenCalledWith(
                expect.objectContaining({ enabled: true })
            );
        });
    });

    it('navigates to completion when Skip is pressed', async () => {
        const { getByText } = render(<Reminders />);
        fireEvent.press(getByText('Skip for now'));
        await waitFor(() => {
            expect(mockReplace).toHaveBeenCalledWith('/onboarding/completion');
        });
    });

    it('calls router.back when back button is pressed', () => {
        const { getByText } = render(<Reminders />);
        fireEvent.press(getByText('arrow-back'));
        expect(mockBack).toHaveBeenCalled();
    });
});
