import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import CreateAccount from '../../../app/auth/signup';
import { useAuth } from '../../../contexts/AuthContext';
import { SupabaseService } from '../../../services/SupabaseService';

// Mock dependencies
jest.mock('../../../contexts/AuthContext');
jest.mock('../../../services/SupabaseService');

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: mockReplace,
        back: jest.fn(),
    }),
    useLocalSearchParams: () => ({
        name: 'Test User',
        role: 'survivor',
        strokeDate: '2024-01-01',
        impairments: JSON.stringify(['mobility']),
        affectedSide: 'left',
        impairmentSeverity: 'moderate',
        recoveryPhase: 'subacute',
        goals: 'Improve mobility',
    }),
}));

describe('Signup Screen', () => {
    const mockSignUp = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue({ signUp: mockSignUp });
        SupabaseService.getCurrentUser.mockResolvedValue({ user: { id: 'user-123' } });
        SupabaseService.saveUserProfile.mockResolvedValue({ error: null });
    });

    it('renders without crashing', () => {
        const { getByText } = render(<CreateAccount />);
        expect(getByText('Create Your Account')).toBeTruthy();
    });

    it('shows correct form fields', () => {
        const { getByLabelText } = render(<CreateAccount />);
        expect(getByLabelText('Email address')).toBeTruthy();
        expect(getByLabelText('Password')).toBeTruthy();
        expect(getByLabelText('Confirm password')).toBeTruthy();
    });

    it('shows personalized greeting with name from params', () => {
        const { getByText } = render(<CreateAccount />);
        expect(getByText(/Hi Test User!/)).toBeTruthy();
    });

    it('shows password helper text', () => {
        const { getByText } = render(<CreateAccount />);
        expect(getByText('At least 8 characters')).toBeTruthy();
    });

    it('shows create account button and login link', () => {
        const { getByText } = render(<CreateAccount />);
        expect(getByText('Create Account')).toBeTruthy();
        expect(getByText('Log In')).toBeTruthy();
    });

    it('alerts when submitting with empty fields', () => {
        const alertSpy = jest.spyOn(Alert, 'alert');
        const { getByText } = render(<CreateAccount />);

        fireEvent.press(getByText('Create Account'));

        expect(alertSpy).toHaveBeenCalledWith('Error', 'Please fill in all fields');
        expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('alerts when password is too short', () => {
        const alertSpy = jest.spyOn(Alert, 'alert');
        const { getByText, getByLabelText } = render(<CreateAccount />);

        fireEvent.changeText(getByLabelText('Email address'), 'test@example.com');
        fireEvent.changeText(getByLabelText('Password'), 'short');
        fireEvent.changeText(getByLabelText('Confirm password'), 'short');
        fireEvent.press(getByText('Create Account'));

        expect(alertSpy).toHaveBeenCalledWith('Error', 'Password must be at least 8 characters');
        expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('alerts when passwords do not match', () => {
        const alertSpy = jest.spyOn(Alert, 'alert');
        const { getByText, getByLabelText } = render(<CreateAccount />);

        fireEvent.changeText(getByLabelText('Email address'), 'test@example.com');
        fireEvent.changeText(getByLabelText('Password'), 'password123');
        fireEvent.changeText(getByLabelText('Confirm password'), 'password456');
        fireEvent.press(getByText('Create Account'));

        expect(alertSpy).toHaveBeenCalledWith('Error', 'Passwords do not match');
        expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('calls signUp with correct args on valid submit', async () => {
        mockSignUp.mockResolvedValue({ error: null });
        const { getByText, getByLabelText } = render(<CreateAccount />);

        fireEvent.changeText(getByLabelText('Email address'), 'test@example.com');
        fireEvent.changeText(getByLabelText('Password'), 'password123');
        fireEvent.changeText(getByLabelText('Confirm password'), 'password123');
        fireEvent.press(getByText('Create Account'));

        await waitFor(() => {
            expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password123', 'Test User', 'survivor');
        });
    });

    it('saves user profile after successful signup', async () => {
        mockSignUp.mockResolvedValue({ error: null });
        const { getByText, getByLabelText } = render(<CreateAccount />);

        fireEvent.changeText(getByLabelText('Email address'), 'test@example.com');
        fireEvent.changeText(getByLabelText('Password'), 'password123');
        fireEvent.changeText(getByLabelText('Confirm password'), 'password123');
        fireEvent.press(getByText('Create Account'));

        await waitFor(() => {
            expect(SupabaseService.saveUserProfile).toHaveBeenCalledWith('user-123', expect.objectContaining({
                strokeDate: '2024-01-01',
                impairments: ['mobility'],
                affectedSide: 'left',
                impairmentSeverity: 'moderate',
                recoveryPhase: 'subacute',
                goals: 'Improve mobility',
            }));
        });
    });

    it('navigates to reminders for survivor role', async () => {
        mockSignUp.mockResolvedValue({ error: null });
        const { getByText, getByLabelText } = render(<CreateAccount />);

        fireEvent.changeText(getByLabelText('Email address'), 'test@example.com');
        fireEvent.changeText(getByLabelText('Password'), 'password123');
        fireEvent.changeText(getByLabelText('Confirm password'), 'password123');
        fireEvent.press(getByText('Create Account'));

        await waitFor(() => {
            expect(mockReplace).toHaveBeenCalledWith('/onboarding/reminders');
        });
    });

    it('displays error alert on signup failure', async () => {
        const alertSpy = jest.spyOn(Alert, 'alert');
        mockSignUp.mockResolvedValue({ error: { message: 'Email already taken' } });
        const { getByText, getByLabelText } = render(<CreateAccount />);

        fireEvent.changeText(getByLabelText('Email address'), 'test@example.com');
        fireEvent.changeText(getByLabelText('Password'), 'password123');
        fireEvent.changeText(getByLabelText('Confirm password'), 'password123');
        fireEvent.press(getByText('Create Account'));

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith('Sign Up Failed', 'Email already taken');
        });
    });

    it('displays error alert on unexpected exception', async () => {
        const alertSpy = jest.spyOn(Alert, 'alert');
        mockSignUp.mockRejectedValue(new Error('Network error'));
        const { getByText, getByLabelText } = render(<CreateAccount />);

        fireEvent.changeText(getByLabelText('Email address'), 'test@example.com');
        fireEvent.changeText(getByLabelText('Password'), 'password123');
        fireEvent.changeText(getByLabelText('Confirm password'), 'password123');
        fireEvent.press(getByText('Create Account'));

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith('Error', 'Failed to create account. Please try again.');
        });
    });

    it('shows loading state while creating account', async () => {
        let resolveSignUp;
        mockSignUp.mockImplementation(() => new Promise(resolve => { resolveSignUp = resolve; }));
        const { getByText, getByLabelText } = render(<CreateAccount />);

        fireEvent.changeText(getByLabelText('Email address'), 'test@example.com');
        fireEvent.changeText(getByLabelText('Password'), 'password123');
        fireEvent.changeText(getByLabelText('Confirm password'), 'password123');
        fireEvent.press(getByText('Create Account'));

        await waitFor(() => {
            expect(getByText('Creating Account...')).toBeTruthy();
        });

        resolveSignUp({ error: null });

        await waitFor(() => {
            expect(getByText('Create Account')).toBeTruthy();
        });
    });

    it('navigates to login screen', () => {
        const { getByText } = render(<CreateAccount />);
        fireEvent.press(getByText('Log In'));
        expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });

    it('toggles password visibility', () => {
        const { getByLabelText, getAllByLabelText } = render(<CreateAccount />);

        const passwordInput = getByLabelText('Password');
        expect(passwordInput.props.secureTextEntry).toBe(true);

        // There are two "Show password" buttons (password + confirm password)
        const showButtons = getAllByLabelText('Show password');
        fireEvent.press(showButtons[0]);

        expect(getByLabelText('Password').props.secureTextEntry).toBe(false);
    });

    it('toggles confirm password visibility', () => {
        const { getByLabelText, getAllByLabelText } = render(<CreateAccount />);

        const confirmInput = getByLabelText('Confirm password');
        expect(confirmInput.props.secureTextEntry).toBe(true);

        const showButtons = getAllByLabelText('Show password');
        fireEvent.press(showButtons[1]);

        expect(getByLabelText('Confirm password').props.secureTextEntry).toBe(false);
    });
});
