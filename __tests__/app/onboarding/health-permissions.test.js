import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import HealthPermissions from '../../../app/onboarding/health-permissions';
import * as HealthKitService from '../../../services/HealthKitService';
import * as HealthMetricsService from '../../../services/HealthMetricsService';
import { useAuth } from '../../../contexts/AuthContext';

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
    const { Text } = require('react-native');
    return {
        Ionicons: (props) => <Text>{props.name}</Text>,
    };
});

// Mock ScreenWrapper
jest.mock('../../../components/ScreenWrapper', () => {
    const { View } = require('react-native');
    return {
        ScreenWrapper: ({ children }) => <View>{children}</View>,
    };
});

// Mock services
jest.mock('../../../services/HealthKitService');
jest.mock('../../../services/HealthMetricsService');
jest.mock('../../../contexts/AuthContext');

const mockBack = jest.fn();

jest.mock('expo-router', () => ({
    useRouter: () => ({
        back: mockBack,
    }),
}));

describe('Health Permissions Screen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue({ user: { id: 'test-user' } });
        HealthKitService.isHealthKitAvailable.mockReturnValue(true);
        HealthKitService.checkHealthKitDataAvailable.mockResolvedValue(true);
        HealthKitService.requestHealthKitPermissions.mockResolvedValue({ granted: true, error: null });
        HealthMetricsService.syncAndSaveHealthData.mockResolvedValue({ success: true, synced: 5, error: null });
    });

    it('renders without crashing', () => {
        const { toJSON } = render(<HealthPermissions />);
        expect(toJSON()).toBeTruthy();
    });

    it('shows the title', () => {
        const { getAllByText } = render(<HealthPermissions />);
        // Title and button both contain "Connect Apple Health"
        expect(getAllByText('Connect Apple Health').length).toBeGreaterThanOrEqual(1);
    });

    it('shows the subtitle', () => {
        const { getByText } = render(<HealthPermissions />);
        expect(getByText('Track your recovery progress automatically')).toBeTruthy();
    });

    it('shows benefit titles', () => {
        const { getByText } = render(<HealthPermissions />);
        expect(getByText('Automatic Tracking')).toBeTruthy();
        expect(getByText('Progress Insights')).toBeTruthy();
        expect(getByText('Privacy First')).toBeTruthy();
    });

    it('shows benefit descriptions', () => {
        const { getByText } = render(<HealthPermissions />);
        expect(getByText(/walking speed, steadiness, and step count/)).toBeTruthy();
        expect(getByText(/mobility improves over time/)).toBeTruthy();
        expect(getByText(/health data stays private/)).toBeTruthy();
    });

    it('shows Connect Apple Health button', () => {
        const { getAllByText } = render(<HealthPermissions />);
        expect(getAllByText('Connect Apple Health').length).toBeGreaterThanOrEqual(2);
    });

    it('shows Skip button', () => {
        const { getByText } = render(<HealthPermissions />);
        expect(getByText('Skip for now')).toBeTruthy();
    });

    it('shows info text about tracked metrics', () => {
        const { getByText } = render(<HealthPermissions />);
        expect(getByText(/walking speed, step length, walking steadiness/)).toBeTruthy();
    });

    it('calls router.back when Skip is pressed', () => {
        const { getByText } = render(<HealthPermissions />);
        fireEvent.press(getByText('Skip for now'));
        expect(mockBack).toHaveBeenCalled();
    });

    it('requests permissions when Connect is pressed', async () => {
        const { getAllByText } = render(<HealthPermissions />);
        // The button is the second instance (first is the title)
        const buttons = getAllByText('Connect Apple Health');
        fireEvent.press(buttons[buttons.length - 1]);
        await waitFor(() => {
            expect(HealthKitService.requestHealthKitPermissions).toHaveBeenCalled();
        });
    });

    it('syncs health data after permissions granted', async () => {
        const { getAllByText } = render(<HealthPermissions />);
        const buttons = getAllByText('Connect Apple Health');
        fireEvent.press(buttons[buttons.length - 1]);
        await waitFor(() => {
            expect(HealthMetricsService.syncAndSaveHealthData).toHaveBeenCalledWith(
                'test-user',
                expect.any(Date),
                expect.any(Date)
            );
        });
    });
});
