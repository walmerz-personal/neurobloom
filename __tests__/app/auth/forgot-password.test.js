import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ForgotPassword from '../../../app/auth/forgot-password';
import { useAuth } from '../../../contexts/AuthContext';

// Mock dependencies
jest.mock('../../../contexts/AuthContext');
jest.mock('../../../components/Logo', () => 'Logo');

const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: jest.fn(),
        back: mockBack,
    }),
}));

describe('Forgot Password Screen', () => {
    const mockResetPassword = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue({ resetPassword: mockResetPassword });
    });

    it('renders without crashing', () => {
        const { getByText } = render(<ForgotPassword />);
        expect(getByText('Reset Password')).toBeTruthy();
    });

    it('shows correct form fields', () => {
        const { getByLabelText } = render(<ForgotPassword />);
        expect(getByLabelText('Email address')).toBeTruthy();
    });

    it('shows subtitle and button', () => {
        const { getByText } = render(<ForgotPassword />);
        expect(getByText('Enter your email to receive reset instructions')).toBeTruthy();
        expect(getByText('Send Instructions')).toBeTruthy();
    });

    it('shows back to login link', () => {
        const { getByText } = render(<ForgotPassword />);
        expect(getByText('Back to Login')).toBeTruthy();
    });

    it('alerts when submitting with empty email', () => {
        const alertSpy = jest.spyOn(Alert, 'alert');
        const { getByText } = render(<ForgotPassword />);

        fireEvent.press(getByText('Send Instructions'));

        expect(alertSpy).toHaveBeenCalledWith('Error', 'Please enter your email address');
        expect(mockResetPassword).not.toHaveBeenCalled();
    });

    it('calls resetPassword with email on valid submit', async () => {
        mockResetPassword.mockResolvedValue({ error: null });
        const { getByText, getByLabelText } = render(<ForgotPassword />);

        fireEvent.changeText(getByLabelText('Email address'), 'test@example.com');
        fireEvent.press(getByText('Send Instructions'));

        await waitFor(() => {
            expect(mockResetPassword).toHaveBeenCalledWith('test@example.com');
        });
    });

    it('shows success alert on successful reset', async () => {
        const alertSpy = jest.spyOn(Alert, 'alert');
        mockResetPassword.mockResolvedValue({ error: null });
        const { getByText, getByLabelText } = render(<ForgotPassword />);

        fireEvent.changeText(getByLabelText('Email address'), 'test@example.com');
        fireEvent.press(getByText('Send Instructions'));

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith(
                'Success',
                'Password reset instructions have been sent to your email.',
                expect.arrayContaining([
                    expect.objectContaining({ text: 'OK' }),
                ])
            );
        });
    });

    it('displays error alert on reset failure', async () => {
        const alertSpy = jest.spyOn(Alert, 'alert');
        mockResetPassword.mockResolvedValue({ error: { message: 'User not found' } });
        const { getByText, getByLabelText } = render(<ForgotPassword />);

        fireEvent.changeText(getByLabelText('Email address'), 'notfound@example.com');
        fireEvent.press(getByText('Send Instructions'));

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith('Error', 'User not found');
        });
    });

    it('displays fallback error message when error has no message', async () => {
        const alertSpy = jest.spyOn(Alert, 'alert');
        mockResetPassword.mockResolvedValue({ error: {} });
        const { getByText, getByLabelText } = render(<ForgotPassword />);

        fireEvent.changeText(getByLabelText('Email address'), 'test@example.com');
        fireEvent.press(getByText('Send Instructions'));

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith('Error', 'Failed to send reset instructions');
        });
    });

    it('shows loading state while sending', async () => {
        let resolveReset;
        mockResetPassword.mockImplementation(() => new Promise(resolve => { resolveReset = resolve; }));
        const { getByText, getByLabelText } = render(<ForgotPassword />);

        fireEvent.changeText(getByLabelText('Email address'), 'test@example.com');
        fireEvent.press(getByText('Send Instructions'));

        await waitFor(() => {
            expect(getByText('Sending...')).toBeTruthy();
        });

        resolveReset({ error: null });

        await waitFor(() => {
            expect(getByText('Send Instructions')).toBeTruthy();
        });
    });

    it('navigates back when Back to Login is pressed', () => {
        const { getByText } = render(<ForgotPassword />);
        fireEvent.press(getByText('Back to Login'));
        expect(mockBack).toHaveBeenCalled();
    });
});
