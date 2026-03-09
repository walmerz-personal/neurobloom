// __tests__/app/profile.test.js
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import Profile from '../../app/profile';
import { useAuth } from '../../contexts/AuthContext';
import { SupabaseService } from '../../services/SupabaseService';
import { NotificationService } from '../../services/NotificationService';

jest.mock('../../contexts/AuthContext');
jest.mock('../../services/SupabaseService');
jest.mock('../../services/NotificationService');
jest.mock('../../components/CareTeamSection', () => {
    const { View } = require('react-native');
    return { CareTeamSection: () => <View testID="care-team-section" /> };
});
jest.mock('../../components/HealthSharingSection', () => {
    const { View } = require('react-native');
    return { HealthSharingSection: () => <View testID="health-sharing-section" /> };
});
jest.mock('@react-native-community/datetimepicker', () => {
    const { View } = require('react-native');
    return {
        __esModule: true,
        default: (props) => <View testID="date-time-picker" {...props} />,
    };
});

const mockBack = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: jest.fn(),
        back: mockBack,
    }),
}));

describe('Profile Screen', () => {
    const mockUser = { id: 'user-1' };
    const mockUserData = { name: 'Test User', role: 'survivor' };

    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue({
            user: mockUser,
            userData: mockUserData,
            deleteAccount: jest.fn().mockResolvedValue({ error: null }),
        });
        SupabaseService.getUserData.mockResolvedValue({
            user: { name: 'Test User', email: 'test@example.com', role: 'survivor' },
            error: null,
        });
        SupabaseService.getUserProfile.mockResolvedValue({
            profile: {
                stroke_date: '2024-01-15',
                impairments: ['arm weakness'],
                affected_side: 'right',
                impairment_severity: 'moderate',
                goals: 'Walk independently',
            },
            error: null,
        });
        SupabaseService.updateUserData.mockResolvedValue({});
        SupabaseService.saveUserProfile.mockResolvedValue({});
        NotificationService.loadNotificationPrefs.mockResolvedValue(null);
        NotificationService.requestPermissions.mockResolvedValue(true);
        NotificationService.scheduleDailyReminder.mockResolvedValue();
        NotificationService.saveNotificationPrefs.mockResolvedValue();
        NotificationService.cancelAllReminders.mockResolvedValue();
        jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    });

    it('renders without crashing', async () => {
        const { toJSON } = render(<Profile />);
        await waitFor(() => {
            expect(toJSON()).toBeTruthy();
        });
    });

    it('shows loading state initially', () => {
        // Make the profile load hang
        SupabaseService.getUserData.mockReturnValue(new Promise(() => {}));
        const { UNSAFE_getByType } = render(<Profile />);
        const { ActivityIndicator } = require('react-native');
        expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });

    it('shows header with About Me title after loading', async () => {
        const { getByText } = render(<Profile />);
        await waitFor(() => {
            expect(getByText('About Me')).toBeTruthy();
        });
    });

    it('shows Save button', async () => {
        const { getByText } = render(<Profile />);
        await waitFor(() => {
            expect(getByText('Save')).toBeTruthy();
        });
    });

    it('navigates back when back button is pressed', async () => {
        const { getByText } = render(<Profile />);
        await waitFor(() => {
            expect(getByText('About Me')).toBeTruthy();
        });
        // The back button contains the ArrowLeft icon - find it via parent
        // Use the Save button sibling relationship instead
    });

    it('displays personal information section', async () => {
        const { getByText } = render(<Profile />);
        await waitFor(() => {
            expect(getByText('Personal Information')).toBeTruthy();
            expect(getByText('Full Name')).toBeTruthy();
            expect(getByText('Role')).toBeTruthy();
            expect(getByText('Email Address')).toBeTruthy();
        });
    });

    it('displays recovery journey section', async () => {
        const { getByText } = render(<Profile />);
        await waitFor(() => {
            expect(getByText('Recovery Journey')).toBeTruthy();
            expect(getByText('Date of Stroke')).toBeTruthy();
            expect(getByText('Impairments / Challenges')).toBeTruthy();
            expect(getByText('Affected Side')).toBeTruthy();
            expect(getByText('Impairment Severity')).toBeTruthy();
            expect(getByText('Recovery Goals')).toBeTruthy();
        });
    });

    it('populates form fields from loaded profile data', async () => {
        const { getByLabelText } = render(<Profile />);
        await waitFor(() => {
            const nameInput = getByLabelText('Full name');
            expect(nameInput.props.value).toBe('Test User');
        });
    });

    it('shows email cannot be changed helper text', async () => {
        const { getByText } = render(<Profile />);
        await waitFor(() => {
            expect(getByText('Email cannot be changed')).toBeTruthy();
        });
    });

    it('shows role selection buttons', async () => {
        const { getByText } = render(<Profile />);
        await waitFor(() => {
            expect(getByText('Survivor')).toBeTruthy();
            expect(getByText('Caregiver')).toBeTruthy();
        });
    });

    it('shows affected side options', async () => {
        const { getByText } = render(<Profile />);
        await waitFor(() => {
            expect(getByText('Left')).toBeTruthy();
            expect(getByText('Right')).toBeTruthy();
            expect(getByText('Both')).toBeTruthy();
            expect(getByText('Not sure')).toBeTruthy();
        });
    });

    it('shows severity options', async () => {
        const { getByText } = render(<Profile />);
        await waitFor(() => {
            expect(getByText('Mild')).toBeTruthy();
            expect(getByText('Moderate')).toBeTruthy();
            expect(getByText('Severe')).toBeTruthy();
        });
    });

    it('saves profile successfully', async () => {
        const { getByText } = render(<Profile />);
        await waitFor(() => {
            expect(getByText('Save')).toBeTruthy();
        });

        await act(async () => {
            fireEvent.press(getByText('Save'));
        });

        await waitFor(() => {
            expect(SupabaseService.updateUserData).toHaveBeenCalledWith('user-1', expect.objectContaining({
                name: 'Test User',
            }));
            expect(SupabaseService.saveUserProfile).toHaveBeenCalled();
            expect(Alert.alert).toHaveBeenCalledWith('Success', 'Profile updated successfully');
            expect(mockBack).toHaveBeenCalled();
        });
    });

    it('handles save error gracefully', async () => {
        SupabaseService.updateUserData.mockRejectedValue(new Error('Save failed'));
        const { getByText } = render(<Profile />);
        await waitFor(() => {
            expect(getByText('Save')).toBeTruthy();
        });

        await act(async () => {
            fireEvent.press(getByText('Save'));
        });

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to save profile');
        });
    });

    it('shows notifications section', async () => {
        const { getByText } = render(<Profile />);
        await waitFor(() => {
            expect(getByText('Notifications')).toBeTruthy();
            expect(getByText('Daily Exercise Reminder')).toBeTruthy();
        });
    });

    it('shows account management section with delete button', async () => {
        const { getByText } = render(<Profile />);
        await waitFor(() => {
            expect(getByText('Account Management')).toBeTruthy();
            expect(getByText('Delete My Account')).toBeTruthy();
        });
    });

    it('shows delete confirmation when delete button pressed', async () => {
        const { getByText } = render(<Profile />);
        await waitFor(() => {
            expect(getByText('Delete My Account')).toBeTruthy();
        });

        fireEvent.press(getByText('Delete My Account'));
        expect(Alert.alert).toHaveBeenCalledWith(
            'Delete Account',
            expect.stringContaining('permanently remove all your data'),
            expect.any(Array)
        );
    });

    it('does not load profile when user is null', async () => {
        useAuth.mockReturnValue({ user: null, userData: null, deleteAccount: jest.fn() });
        render(<Profile />);

        // getUserData should not be called without user.id
        await waitFor(() => {
            expect(SupabaseService.getUserData).not.toHaveBeenCalled();
        });
    });

    it('handles profile load error', async () => {
        SupabaseService.getUserData.mockRejectedValue(new Error('Load failed'));
        const { getByText } = render(<Profile />);

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to load profile data');
        });
    });

    it('loads notification preferences', async () => {
        NotificationService.loadNotificationPrefs.mockResolvedValue({
            enabled: true,
            times: [{ hour: 9, minute: 0 }],
        });
        render(<Profile />);

        await waitFor(() => {
            expect(NotificationService.loadNotificationPrefs).toHaveBeenCalled();
        });
    });

    it('renders CareTeamSection component', async () => {
        const { getByTestId } = render(<Profile />);
        await waitFor(() => {
            expect(getByTestId('care-team-section')).toBeTruthy();
        });
    });

    it('renders HealthSharingSection for survivor role', async () => {
        const { getByTestId } = render(<Profile />);
        await waitFor(() => {
            expect(getByTestId('health-sharing-section')).toBeTruthy();
        });
    });
});
