// __tests__/components/MedicalStaffHomeView.test.js
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { MedicalStaffHomeView } from '../../components/MedicalStaffHomeView';

// Mock services
jest.mock('../../services/MedicalStaffService', () => ({
    MedicalStaffService: {
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

const { MedicalStaffService } = require('../../services/MedicalStaffService');
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
        const React = require('react');
        React.useEffect(() => {
            const cleanup = cb();
            return typeof cleanup === 'function' ? cleanup : undefined;
        }, []);
    },
}));

describe('MedicalStaffHomeView', () => {
    const defaultProps = {
        userData: { name: 'Dr. Test', role: 'medical_staff' },
        user: { id: 'staff-123' },
        onLogout: jest.fn(),
        onNavigateToMedicalStaff: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        MedicalStaffService.getLinkedSurvivors.mockResolvedValue({ survivors: [], error: null });
    });

    it('should render without crashing', async () => {
        const { toJSON } = render(<MedicalStaffHomeView {...defaultProps} />);
        await waitFor(() => {
            expect(toJSON()).toBeTruthy();
        });
    });

    it('should display Lilly Tip section', async () => {
        const { getByText } = render(<MedicalStaffHomeView {...defaultProps} />);
        await waitFor(() => {
            expect(getByText("Lilly's Tip")).toBeTruthy();
        });
    });

    it('should display Your Patients section title', async () => {
        const { getByText } = render(<MedicalStaffHomeView {...defaultProps} />);
        await waitFor(() => {
            expect(getByText('Your Patients')).toBeTruthy();
        });
    });

    it('should show empty state when no patients are linked', async () => {
        MedicalStaffService.getLinkedSurvivors.mockResolvedValue({ survivors: [], error: null });

        const { getByText } = render(<MedicalStaffHomeView {...defaultProps} />);
        await waitFor(() => {
            expect(getByText('No patients connected yet.')).toBeTruthy();
            expect(getByText('Connect to Patient')).toBeTruthy();
        });
    });

    it('should navigate to connection options when Connect to Patient is pressed', async () => {
        MedicalStaffService.getLinkedSurvivors.mockResolvedValue({ survivors: [], error: null });

        const { getByText } = render(<MedicalStaffHomeView {...defaultProps} />);
        await waitFor(() => {
            expect(getByText('Connect to Patient')).toBeTruthy();
        });
        fireEvent.press(getByText('Connect to Patient'));
        expect(mockPush).toHaveBeenCalledWith('/connection-options?mode=connect');
    });

    it('should display patients when they are linked', async () => {
        const mockSurvivors = [
            { id: 'surv-1', name: 'Patient One' },
            { id: 'surv-2', name: 'Patient Two' },
        ];
        MedicalStaffService.getLinkedSurvivors.mockResolvedValue({ survivors: mockSurvivors, error: null });
        SupabaseService.getTodayLog.mockResolvedValue({ log: { exercises_completed: ['a1'] } });

        const { getByText } = render(<MedicalStaffHomeView {...defaultProps} />);
        await waitFor(() => {
            expect(getByText('Patient One')).toBeTruthy();
            expect(getByText('Patient Two')).toBeTruthy();
        });
    });

    it('should show avatar initial for patient', async () => {
        const mockSurvivors = [{ id: 'surv-1', name: 'Maria' }];
        MedicalStaffService.getLinkedSurvivors.mockResolvedValue({ survivors: mockSurvivors, error: null });
        SupabaseService.getTodayLog.mockResolvedValue({ log: null });

        const { getByText } = render(<MedicalStaffHomeView {...defaultProps} />);
        await waitFor(() => {
            expect(getByText('M')).toBeTruthy();
        });
    });

    it('should show exercise progress for patients', async () => {
        const mockSurvivors = [{ id: 'surv-1', name: 'Bob' }];
        MedicalStaffService.getLinkedSurvivors.mockResolvedValue({ survivors: mockSurvivors, error: null });
        SupabaseService.getTodayLog.mockResolvedValue({ log: { exercises_completed: ['a1', 'a2'] } });

        const { getByText } = render(<MedicalStaffHomeView {...defaultProps} />);
        await waitFor(() => {
            expect(getByText('2/4 Exercises')).toBeTruthy();
        });
    });

    it('should call onNavigateToMedicalStaff when a patient card is pressed', async () => {
        const mockSurvivors = [{ id: 'surv-1', name: 'Bob' }];
        MedicalStaffService.getLinkedSurvivors.mockResolvedValue({ survivors: mockSurvivors, error: null });
        SupabaseService.getTodayLog.mockResolvedValue({ log: null });

        const mockNavigate = jest.fn();
        const { getByText } = render(
            <MedicalStaffHomeView {...defaultProps} onNavigateToMedicalStaff={mockNavigate} />
        );
        await waitFor(() => {
            expect(getByText('Bob')).toBeTruthy();
        });
        fireEvent.press(getByText('Bob'));
        expect(mockNavigate).toHaveBeenCalledWith('survivor-progress', { id: 'surv-1', name: 'Bob' });
    });

    it('should show Assign Exercises button when patients exist', async () => {
        const mockSurvivors = [{ id: 'surv-1', name: 'Bob' }];
        MedicalStaffService.getLinkedSurvivors.mockResolvedValue({ survivors: mockSurvivors, error: null });
        SupabaseService.getTodayLog.mockResolvedValue({ log: null });

        const { getByText } = render(<MedicalStaffHomeView {...defaultProps} />);
        await waitFor(() => {
            expect(getByText('Assign Exercises')).toBeTruthy();
        });
    });

    it('should call onNavigateToMedicalStaff with assign-exercises when Assign Exercises is pressed', async () => {
        const mockSurvivors = [{ id: 'surv-1', name: 'Bob' }];
        MedicalStaffService.getLinkedSurvivors.mockResolvedValue({ survivors: mockSurvivors, error: null });
        SupabaseService.getTodayLog.mockResolvedValue({ log: null });

        const mockNavigate = jest.fn();
        const { getByText } = render(
            <MedicalStaffHomeView {...defaultProps} onNavigateToMedicalStaff={mockNavigate} />
        );
        await waitFor(() => {
            expect(getByText('Assign Exercises')).toBeTruthy();
        });
        fireEvent.press(getByText('Assign Exercises'));
        expect(mockNavigate).toHaveBeenCalledWith('assign-exercises');
    });

    it('should show Connect Another Patient button when patients exist', async () => {
        const mockSurvivors = [{ id: 'surv-1', name: 'Bob' }];
        MedicalStaffService.getLinkedSurvivors.mockResolvedValue({ survivors: mockSurvivors, error: null });
        SupabaseService.getTodayLog.mockResolvedValue({ log: null });

        const { getByText } = render(<MedicalStaffHomeView {...defaultProps} />);
        await waitFor(() => {
            expect(getByText('Connect Another Patient')).toBeTruthy();
        });
    });

    it('should display About Me row', async () => {
        const { getByText } = render(<MedicalStaffHomeView {...defaultProps} />);
        await waitFor(() => {
            expect(getByText('About Me')).toBeTruthy();
            expect(getByText('View and edit your profile')).toBeTruthy();
        });
    });

    it('should navigate to profile when About Me is pressed', async () => {
        const { getByText } = render(<MedicalStaffHomeView {...defaultProps} />);
        await waitFor(() => {
            expect(getByText('About Me')).toBeTruthy();
        });
        fireEvent.press(getByText('About Me'));
        expect(mockPush).toHaveBeenCalledWith('/profile');
    });

    it('should handle error loading patients gracefully', async () => {
        MedicalStaffService.getLinkedSurvivors.mockRejectedValue(new Error('Network error'));

        const { getByText } = render(<MedicalStaffHomeView {...defaultProps} />);
        await waitFor(() => {
            expect(getByText("Lilly's Tip")).toBeTruthy();
        });
    });

    it('should handle getTodayLog error for individual patient', async () => {
        const mockSurvivors = [{ id: 'surv-1', name: 'Bob' }];
        MedicalStaffService.getLinkedSurvivors.mockResolvedValue({ survivors: mockSurvivors, error: null });
        SupabaseService.getTodayLog.mockRejectedValue(new Error('Log error'));

        const { getByText } = render(<MedicalStaffHomeView {...defaultProps} />);
        await waitFor(() => {
            expect(getByText('Bob')).toBeTruthy();
            expect(getByText('0/4 Exercises')).toBeTruthy();
        });
    });

    it('should render with null user', () => {
        const { getByText } = render(
            <MedicalStaffHomeView {...defaultProps} user={null} />
        );
        expect(getByText("Lilly's Tip")).toBeTruthy();
    });
});
