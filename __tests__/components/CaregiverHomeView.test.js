// __tests__/components/CaregiverHomeView.test.js
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CaregiverHomeView } from '../../components/CaregiverHomeView';

// Mock services
jest.mock('../../services/CareTeamService', () => ({
    CareTeamService: {
        getLinkedSurvivors: jest.fn(() => Promise.resolve({ survivors: [], error: null })),
    },
}));

jest.mock('../../services/SupabaseService', () => ({
    SupabaseService: {
        getTodayLog: jest.fn(() => Promise.resolve({ log: null })),
    },
}));

// Mock react-native-svg
jest.mock('react-native-svg', () => {
    const React = require('react');
    const { View } = require('react-native');
    return {
        __esModule: true,
        default: (props) => React.createElement(View, props),
        Circle: 'Circle',
    };
});

const { CareTeamService } = require('../../services/CareTeamService');
const { SupabaseService } = require('../../services/SupabaseService');

// Mock expo-router to capture push calls
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: jest.fn(),
        back: jest.fn(),
    }),
    useSegments: () => [],
    usePathname: () => '/',
    useFocusEffect: (cb) => {
        // Execute the callback immediately for testing
        const React = require('react');
        React.useEffect(() => {
            const cleanup = cb();
            return typeof cleanup === 'function' ? cleanup : undefined;
        }, []);
    },
}));

describe('CaregiverHomeView', () => {
    const defaultProps = {
        userData: { name: 'Test Caregiver', role: 'caregiver' },
        user: { id: 'user-123' },
        onLogout: jest.fn(),
        onNavigateToCaregiver: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        CareTeamService.getLinkedSurvivors.mockResolvedValue({ survivors: [], error: null });
    });

    it('should render without crashing', async () => {
        const { toJSON } = render(<CaregiverHomeView {...defaultProps} />);
        await waitFor(() => {
            expect(toJSON()).toBeTruthy();
        });
    });

    it('should display Lilly Tip section', async () => {
        const { getByText } = render(<CaregiverHomeView {...defaultProps} />);
        await waitFor(() => {
            expect(getByText("Lilly's Tip")).toBeTruthy();
        });
    });

    it('should display Your Survivors section title', async () => {
        const { getByText } = render(<CaregiverHomeView {...defaultProps} />);
        await waitFor(() => {
            expect(getByText('Your Survivors')).toBeTruthy();
        });
    });

    it('should show empty state when no survivors are linked', async () => {
        CareTeamService.getLinkedSurvivors.mockResolvedValue({ survivors: [], error: null });

        const { getByText } = render(<CaregiverHomeView {...defaultProps} />);
        await waitFor(() => {
            expect(getByText('No survivors connected yet.')).toBeTruthy();
            expect(getByText('Connect to Survivor')).toBeTruthy();
        });
    });

    it('should navigate to connection options when Connect to Survivor is pressed', async () => {
        CareTeamService.getLinkedSurvivors.mockResolvedValue({ survivors: [], error: null });

        const { getByText } = render(<CaregiverHomeView {...defaultProps} />);
        await waitFor(() => {
            expect(getByText('Connect to Survivor')).toBeTruthy();
        });
        fireEvent.press(getByText('Connect to Survivor'));
        expect(mockPush).toHaveBeenCalledWith('/connection-options?mode=connect');
    });

    it('should display survivors when they are linked', async () => {
        const mockSurvivors = [
            { id: 'surv-1', name: 'John Doe' },
            { id: 'surv-2', name: 'Jane Smith' },
        ];
        CareTeamService.getLinkedSurvivors.mockResolvedValue({ survivors: mockSurvivors, error: null });
        SupabaseService.getTodayLog.mockResolvedValue({ log: { exercises_completed: ['a1', 'a2'] } });

        const { getByText } = render(<CaregiverHomeView {...defaultProps} />);
        await waitFor(() => {
            expect(getByText('John Doe')).toBeTruthy();
            expect(getByText('Jane Smith')).toBeTruthy();
        });
    });

    it('should show avatar initial for survivor', async () => {
        const mockSurvivors = [{ id: 'surv-1', name: 'Alice' }];
        CareTeamService.getLinkedSurvivors.mockResolvedValue({ survivors: mockSurvivors, error: null });
        SupabaseService.getTodayLog.mockResolvedValue({ log: null });

        const { getByText } = render(<CaregiverHomeView {...defaultProps} />);
        await waitFor(() => {
            expect(getByText('A')).toBeTruthy();
        });
    });

    it('should show exercise progress for survivors', async () => {
        const mockSurvivors = [{ id: 'surv-1', name: 'Bob' }];
        CareTeamService.getLinkedSurvivors.mockResolvedValue({ survivors: mockSurvivors, error: null });
        SupabaseService.getTodayLog.mockResolvedValue({ log: { exercises_completed: ['a1', 'a2', 'a3'] } });

        const { getByText } = render(<CaregiverHomeView {...defaultProps} />);
        await waitFor(() => {
            expect(getByText('3/4 Exercises')).toBeTruthy();
        });
    });

    it('should call onNavigateToCaregiver when a survivor card is pressed', async () => {
        const mockSurvivors = [{ id: 'surv-1', name: 'Bob' }];
        CareTeamService.getLinkedSurvivors.mockResolvedValue({ survivors: mockSurvivors, error: null });
        SupabaseService.getTodayLog.mockResolvedValue({ log: null });

        const mockNavigate = jest.fn();
        const { getByText } = render(
            <CaregiverHomeView {...defaultProps} onNavigateToCaregiver={mockNavigate} />
        );
        await waitFor(() => {
            expect(getByText('Bob')).toBeTruthy();
        });
        fireEvent.press(getByText('Bob'));
        expect(mockNavigate).toHaveBeenCalledWith('survivor-progress', { id: 'surv-1', name: 'Bob' });
    });

    it('should show Connect Another Survivor button when survivors exist', async () => {
        const mockSurvivors = [{ id: 'surv-1', name: 'Bob' }];
        CareTeamService.getLinkedSurvivors.mockResolvedValue({ survivors: mockSurvivors, error: null });
        SupabaseService.getTodayLog.mockResolvedValue({ log: null });

        const { getByText } = render(<CaregiverHomeView {...defaultProps} />);
        await waitFor(() => {
            expect(getByText('Connect Another Survivor')).toBeTruthy();
        });
    });

    it('should display Helpful Resources section', async () => {
        const { getByText } = render(<CaregiverHomeView {...defaultProps} />);
        await waitFor(() => {
            expect(getByText('Helpful Resources')).toBeTruthy();
        });
    });

    it('should display resource cards', async () => {
        const { getByText } = render(<CaregiverHomeView {...defaultProps} />);
        await waitFor(() => {
            expect(getByText('Caregiver Burnout: Signs to Watch')).toBeTruthy();
            expect(getByText('Celebrating Small Wins')).toBeTruthy();
            expect(getByText('Understanding Neuroplasticity')).toBeTruthy();
        });
    });

    it('should display About Me row', async () => {
        const { getByText } = render(<CaregiverHomeView {...defaultProps} />);
        await waitFor(() => {
            expect(getByText('About Me')).toBeTruthy();
            expect(getByText('View and edit your profile')).toBeTruthy();
        });
    });

    it('should navigate to profile when About Me is pressed', async () => {
        const { getByText } = render(<CaregiverHomeView {...defaultProps} />);
        await waitFor(() => {
            expect(getByText('About Me')).toBeTruthy();
        });
        fireEvent.press(getByText('About Me'));
        expect(mockPush).toHaveBeenCalledWith('/profile');
    });

    it('should handle error loading survivors gracefully', async () => {
        CareTeamService.getLinkedSurvivors.mockRejectedValue(new Error('Network error'));

        const { getByText } = render(<CaregiverHomeView {...defaultProps} />);
        await waitFor(() => {
            // Should still render the page despite the error
            expect(getByText("Lilly's Tip")).toBeTruthy();
        });
    });

    it('should handle getTodayLog error for individual survivor', async () => {
        const mockSurvivors = [{ id: 'surv-1', name: 'Bob' }];
        CareTeamService.getLinkedSurvivors.mockResolvedValue({ survivors: mockSurvivors, error: null });
        SupabaseService.getTodayLog.mockRejectedValue(new Error('Log error'));

        const { getByText } = render(<CaregiverHomeView {...defaultProps} />);
        await waitFor(() => {
            expect(getByText('Bob')).toBeTruthy();
            expect(getByText('0/4 Exercises')).toBeTruthy();
        });
    });

    it('should render with null user', () => {
        const { getByText } = render(
            <CaregiverHomeView {...defaultProps} user={null} />
        );
        expect(getByText("Lilly's Tip")).toBeTruthy();
    });
});
