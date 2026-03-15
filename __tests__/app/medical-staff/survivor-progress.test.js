// __tests__/app/medical-staff/survivor-progress.test.js
import React from 'react';
import { render, waitFor, fireEvent, act } from '@testing-library/react-native';
import SurvivorProgress from '../../../app/medical-staff/survivor-progress';

const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: jest.fn(),
        back: mockBack,
    }),
    useLocalSearchParams: () => ({
        survivorId: 'surv-1',
        survivorName: 'Jane Doe',
    }),
}));

jest.mock('../../../contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'staff-1' },
        userData: { name: 'Dr. Smith' },
    }),
}));

jest.mock('../../../services/MedicalStaffService', () => ({
    MedicalStaffService: {
        getSurvivorProgress: jest.fn(),
        getMedicalStaffAssignments: jest.fn(),
    },
}));

jest.mock('../../../services/CareTeamService', () => ({
    CareTeamService: {},
}));

jest.mock('../../../services/SupabaseService', () => ({
    SupabaseService: {
        getHealthMetricsForViewer: jest.fn(),
    },
}));

jest.mock('../../../components/ScreenWrapper', () => {
    const { View } = require('react-native');
    return { ScreenWrapper: ({ children }) => <View>{children}</View> };
});

jest.mock('../../../components/KudosSendModal', () => {
    const { View } = require('react-native');
    return { KudosSendModal: () => <View testID="kudos-modal" /> };
});

jest.mock('../../../components/NudgeSendModal', () => {
    const { View } = require('react-native');
    return { NudgeSendModal: () => <View testID="nudge-modal" /> };
});

jest.mock('../../../components/HealthChart', () => {
    const { View } = require('react-native');
    return { HealthChart: () => <View testID="health-chart" /> };
});

jest.mock('../../../constants/progressTimeRanges', () => ({
    TIME_RANGE_OPTIONS: ['14d', '1m', '3m', '1y'],
    DEFAULT_TIME_RANGE: '14d',
    getDateRangeForSelection: jest.fn(() => ({ startDate: new Date(), endDate: new Date() })),
    getTimeRangeLabel: jest.fn((key) => key === '14d' ? '14 days' : key),
}));

const { MedicalStaffService } = require('../../../services/MedicalStaffService');
const { SupabaseService } = require('../../../services/SupabaseService');

describe('Medical Staff SurvivorProgress', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        SupabaseService.getHealthMetricsForViewer.mockResolvedValue({ data: [], error: null });
        MedicalStaffService.getMedicalStaffAssignments.mockResolvedValue({ assignments: [], error: null });
    });

    it('shows loading state initially', () => {
        MedicalStaffService.getSurvivorProgress.mockReturnValue(new Promise(() => {}));

        const { getByText } = render(<SurvivorProgress />);
        expect(getByText('Jane Doe')).toBeTruthy();
    });

    it('shows error state with retry button', async () => {
        MedicalStaffService.getSurvivorProgress.mockResolvedValue({
            progress: null,
            error: { message: 'Unauthorized' },
        });

        const { findByText } = render(<SurvivorProgress />);
        expect(await findByText('Unauthorized')).toBeTruthy();
        expect(await findByText('Try Again')).toBeTruthy();
    });

    it('renders progress stats', async () => {
        MedicalStaffService.getSurvivorProgress.mockResolvedValue({
            progress: {
                survivor: { name: 'Jane Doe' },
                recentLogs: [],
                stats: {
                    streak: 10,
                    exercisesDone: 20,
                    checkInRate: 90,
                    avgMood: 4.5,
                    avgPain: 2,
                    avgEnergy: 7,
                },
            },
            error: null,
        });

        const { findByText } = render(<SurvivorProgress />);

        expect(await findByText('10')).toBeTruthy();
        expect(await findByText('Day Streak')).toBeTruthy();
        expect(await findByText('20')).toBeTruthy();
        expect(await findByText('90%')).toBeTruthy();
    });

    it('shows empty check-ins state', async () => {
        MedicalStaffService.getSurvivorProgress.mockResolvedValue({
            progress: {
                survivor: { name: 'Jane' },
                recentLogs: [],
                stats: {},
            },
            error: null,
        });

        const { findByText } = render(<SurvivorProgress />);
        expect(await findByText('No check-ins yet')).toBeTruthy();
    });

    it('shows Exercise Assignments section', async () => {
        MedicalStaffService.getSurvivorProgress.mockResolvedValue({
            progress: {
                survivor: { name: 'Jane' },
                recentLogs: [],
                stats: {},
            },
            error: null,
        });

        const { findByText } = render(<SurvivorProgress />);
        expect(await findByText('Exercise Assignments')).toBeTruthy();
    });

    it('shows Nudge button in header', async () => {
        MedicalStaffService.getSurvivorProgress.mockResolvedValue({
            progress: {
                survivor: { name: 'Jane' },
                recentLogs: [],
                stats: {},
            },
            error: null,
        });

        const { findByText } = render(<SurvivorProgress />);
        expect(await findByText('Nudge')).toBeTruthy();
    });

    it('shows 14-Day Averages', async () => {
        MedicalStaffService.getSurvivorProgress.mockResolvedValue({
            progress: {
                survivor: { name: 'Jane' },
                recentLogs: [],
                stats: { avgMood: 3.0, avgPain: 5, avgEnergy: 4 },
            },
            error: null,
        });

        const { findByText } = render(<SurvivorProgress />);
        expect(await findByText('14-Day Averages')).toBeTruthy();
        expect(await findByText('Mood')).toBeTruthy();
        expect(await findByText('Pain')).toBeTruthy();
        expect(await findByText('Energy')).toBeTruthy();
    });

    it('shows active assignments count', async () => {
        MedicalStaffService.getSurvivorProgress.mockResolvedValue({
            progress: {
                survivor: { name: 'Jane' },
                recentLogs: [],
                stats: {},
            },
            error: null,
        });
        MedicalStaffService.getMedicalStaffAssignments.mockResolvedValue({
            assignments: [
                { id: 'a1', survivor_id: 'surv-1', status: 'assigned', exercise_id: 'a1' },
                { id: 'a2', survivor_id: 'surv-1', status: 'completed', exercise_id: 'l1' },
            ],
            error: null,
        });

        const { findByText } = render(<SurvivorProgress />);
        expect(await findByText('1 active')).toBeTruthy();
    });

    it('shows recovery goals when present', async () => {
        MedicalStaffService.getSurvivorProgress.mockResolvedValue({
            progress: {
                survivor: { name: 'Jane', goals: 'Improve arm strength' },
                recentLogs: [],
                stats: {},
            },
            error: null,
        });

        const { findByText } = render(<SurvivorProgress />);
        expect(await findByText('Recovery Goals')).toBeTruthy();
        expect(await findByText('Improve arm strength')).toBeTruthy();
    });

    it('loads health metrics and shows Health Metrics section when data returned', async () => {
        MedicalStaffService.getSurvivorProgress.mockResolvedValue({
            progress: {
                survivor: { name: 'Jane' },
                recentLogs: [],
                stats: {},
            },
            error: null,
        });
        SupabaseService.getHealthMetricsForViewer.mockResolvedValue({
            data: [{ date: '2025-03-01', steps: 1000 }],
            error: null,
        });

        const { findByText, getByTestId } = render(<SurvivorProgress />);
        await findByText('Exercise Assignments');
        expect(SupabaseService.getHealthMetricsForViewer).toHaveBeenCalled();
        expect(getByTestId('health-chart')).toBeTruthy();
    });

    it('retry button calls loadProgress again', async () => {
        MedicalStaffService.getSurvivorProgress
            .mockRejectedValueOnce(new Error('Network error'))
            .mockResolvedValueOnce({
                progress: { survivor: { name: 'Jane' }, recentLogs: [], stats: {} },
                error: null,
            });

        const { findByText } = render(<SurvivorProgress />);
        const retry = await findByText('Try Again');
        fireEvent.press(retry);
        await waitFor(() => {
            expect(MedicalStaffService.getSurvivorProgress).toHaveBeenCalledTimes(2);
        });
    });
});
