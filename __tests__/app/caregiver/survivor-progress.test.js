// __tests__/app/caregiver/survivor-progress.test.js
import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import SurvivorProgress from '../../../app/caregiver/survivor-progress';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: jest.fn(),
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
        user: { id: 'caregiver-1' },
        userData: { name: 'Bob Caregiver' },
    }),
}));

jest.mock('../../../services/CareTeamService', () => ({
    CareTeamService: {
        getSurvivorProgress: jest.fn(),
    },
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
    return { KudosSendModal: (props) => <View testID="kudos-modal" /> };
});

jest.mock('../../../components/NudgeSendModal', () => {
    const { View } = require('react-native');
    return { NudgeSendModal: (props) => <View testID="nudge-modal" /> };
});

jest.mock('../../../components/HealthMetricsCard', () => {
    const { View } = require('react-native');
    return { HealthMetricsCard: (props) => <View testID="health-metrics-card" /> };
});

const { CareTeamService } = require('../../../services/CareTeamService');
const { SupabaseService } = require('../../../services/SupabaseService');

describe('Caregiver SurvivorProgress', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        SupabaseService.getHealthMetricsForViewer.mockResolvedValue({ data: [], error: null });
    });

    it('shows loading state initially', () => {
        CareTeamService.getSurvivorProgress.mockReturnValue(new Promise(() => {}));

        const { getByText } = render(<SurvivorProgress />);
        expect(getByText('Jane Doe')).toBeTruthy();
    });

    it('shows error state when loading fails', async () => {
        CareTeamService.getSurvivorProgress.mockResolvedValue({
            progress: null,
            error: { message: 'Access denied' },
        });

        const { findByText } = render(<SurvivorProgress />);
        expect(await findByText('Access denied')).toBeTruthy();
        expect(await findByText('Try Again')).toBeTruthy();
    });

    it('renders progress data with stats', async () => {
        CareTeamService.getSurvivorProgress.mockResolvedValue({
            progress: {
                survivor: { name: 'Jane Doe', goals: 'Walk independently' },
                recentLogs: [],
                stats: {
                    streak: 5,
                    exercisesDone: 12,
                    checkInRate: 85,
                    avgMood: 4.0,
                    avgPain: 3,
                    avgEnergy: 6,
                },
            },
            error: null,
        });

        const { findByText } = render(<SurvivorProgress />);

        expect(await findByText('5')).toBeTruthy();
        expect(await findByText('Day Streak')).toBeTruthy();
        expect(await findByText('12')).toBeTruthy();
        expect(await findByText('Exercises (14d)')).toBeTruthy();
        expect(await findByText('85%')).toBeTruthy();
        expect(await findByText('Check-in Rate')).toBeTruthy();
    });

    it('shows empty check-ins message', async () => {
        CareTeamService.getSurvivorProgress.mockResolvedValue({
            progress: {
                survivor: { name: 'Jane Doe' },
                recentLogs: [],
                stats: { streak: 0, exercisesDone: 0, checkInRate: 0 },
            },
            error: null,
        });

        const { findByText } = render(<SurvivorProgress />);
        expect(await findByText('No check-ins yet')).toBeTruthy();
    });

    it('shows 14-Day Averages section', async () => {
        CareTeamService.getSurvivorProgress.mockResolvedValue({
            progress: {
                survivor: { name: 'Jane' },
                recentLogs: [],
                stats: { avgMood: 3.5, avgPain: 4, avgEnergy: 5 },
            },
            error: null,
        });

        const { findByText } = render(<SurvivorProgress />);
        expect(await findByText('14-Day Averages')).toBeTruthy();
        expect(await findByText('Mood')).toBeTruthy();
        expect(await findByText('Pain')).toBeTruthy();
        expect(await findByText('Energy')).toBeTruthy();
    });

    it('shows recovery goals when present', async () => {
        CareTeamService.getSurvivorProgress.mockResolvedValue({
            progress: {
                survivor: { name: 'Jane', goals: 'Walk 30 min daily' },
                recentLogs: [],
                stats: {},
            },
            error: null,
        });

        const { findByText } = render(<SurvivorProgress />);
        expect(await findByText('Recovery Goals')).toBeTruthy();
        expect(await findByText('Walk 30 min daily')).toBeTruthy();
    });

    it('shows Send Nudge button', async () => {
        CareTeamService.getSurvivorProgress.mockResolvedValue({
            progress: {
                survivor: { name: 'Jane' },
                recentLogs: [],
                stats: {},
            },
            error: null,
        });

        const { findByText } = render(<SurvivorProgress />);
        expect(await findByText('Send Nudge')).toBeTruthy();
    });

    it('renders recent check-in logs', async () => {
        CareTeamService.getSurvivorProgress.mockResolvedValue({
            progress: {
                survivor: { name: 'Jane' },
                recentLogs: [
                    {
                        id: 'log-1',
                        log_date: '2026-03-07',
                        mood: '🙂',
                        pain_level: 3,
                        energy_level: 7,
                        exercises_completed: ['a1', 'l1'],
                    },
                ],
                stats: {},
            },
            error: null,
        });

        const { findByText } = render(<SurvivorProgress />);
        expect(await findByText('Recent Check-ins')).toBeTruthy();
    });

    it('retry button calls getSurvivorProgress again', async () => {
        CareTeamService.getSurvivorProgress
            .mockResolvedValueOnce({ progress: null, error: { message: 'Access denied' } })
            .mockResolvedValueOnce({
                progress: { survivor: { name: 'Jane' }, recentLogs: [], stats: {} },
                error: null,
            });

        const { findByText } = render(<SurvivorProgress />);
        const retry = await findByText('Try Again');
        fireEvent.press(retry);
        await waitFor(() => {
            expect(CareTeamService.getSurvivorProgress).toHaveBeenCalledTimes(2);
        });
    });

    it('loads health metrics via getHealthMetricsForViewer', async () => {
        CareTeamService.getSurvivorProgress.mockResolvedValue({
            progress: { survivor: { name: 'Jane' }, recentLogs: [], stats: {} },
            error: null,
        });
        SupabaseService.getHealthMetricsForViewer.mockResolvedValue({
            data: [{ date: '2026-03-01', steps: 500 }],
            error: null,
        });

        const { findByText } = render(<SurvivorProgress />);
        await findByText('Send Nudge');
        expect(SupabaseService.getHealthMetricsForViewer).toHaveBeenCalled();
    });
});
