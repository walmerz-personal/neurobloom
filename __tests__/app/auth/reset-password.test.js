import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ResetPassword from '../../../app/auth/reset-password';
import { useAuth } from '../../../contexts/AuthContext';

// Mock dependencies
jest.mock('../../../contexts/AuthContext');
jest.mock('../../../components/Logo', () => 'Logo');
jest.mock('../../../services/SupabaseService');
jest.mock('expo-linking', () => ({
    useURL: () => null,
}));

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: mockReplace,
        back: jest.fn(),
    }),
}));

describe('Reset Password Screen', () => {
    const mockUpdatePassword = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue({ updatePassword: mockUpdatePassword });
    });

    it('renders without crashing', () => {
        const { getByText } = render(<ResetPassword />);
        expect(getByText('Reset Password')).toBeTruthy();
    });

    it('shows correct form fields', () => {
        const { getByLabelText } = render(<ResetPassword />);
        expect(getByLabelText('New password')).toBeTruthy();
        expect(getByLabelText('Confirm new password')).toBeTruthy();
    });

    it('shows subtitle and button', () => {
        const { getByText } = render(<ResetPassword />);
        expect(getByText('Enter your new password')).toBeTruthy();
        expect(getByText('Update Password')).toBeTruthy();
    });

    it('alerts when submitting with empty fields', () => {
        const alertSpy = jest.spyOn(Alert, 'alert');
        const { getByText } = render(<ResetPassword />);

        fireEvent.press(getByText('Update Password'));

        expect(alertSpy).toHaveBeenCalledWith('Error', 'Please enter and confirm your new password');
        expect(mockUpdatePassword).not.toHaveBeenCalled();
    });

    it('alerts when only password is entered', () => {
        const alertSpy = jest.spyOn(Alert, 'alert');
        const { getByText, getByLabelText } = render(<ResetPassword />);

        fireEvent.changeText(getByLabelText('New password'), 'newpassword123');
        fireEvent.press(getByText('Update Password'));

        expect(alertSpy).toHaveBeenCalledWith('Error', 'Please enter and confirm your new password');
        expect(mockUpdatePassword).not.toHaveBeenCalled();
    });

    it('alerts when passwords do not match', () => {
        const alertSpy = jest.spyOn(Alert, 'alert');
        const { getByText, getByLabelText } = render(<ResetPassword />);

        fireEvent.changeText(getByLabelText('New password'), 'newpassword123');
        fireEvent.changeText(getByLabelText('Confirm new password'), 'different456');
        fireEvent.press(getByText('Update Password'));

        expect(alertSpy).toHaveBeenCalledWith('Error', 'Passwords do not match');
        expect(mockUpdatePassword).not.toHaveBeenCalled();
    });

    it('alerts when password is too short', () => {
        const alertSpy = jest.spyOn(Alert, 'alert');
        const { getByText, getByLabelText } = render(<ResetPassword />);

        fireEvent.changeText(getByLabelText('New password'), 'short');
        fireEvent.changeText(getByLabelText('Confirm new password'), 'short');
        fireEvent.press(getByText('Update Password'));

        expect(alertSpy).toHaveBeenCalledWith('Error', 'Password must be at least 6 characters long');
        expect(mockUpdatePassword).not.toHaveBeenCalled();
    });

    it('calls updatePassword with password on valid submit', async () => {
        mockUpdatePassword.mockResolvedValue({ error: null });
        const { getByText, getByLabelText } = render(<ResetPassword />);

        fireEvent.changeText(getByLabelText('New password'), 'newpassword123');
        fireEvent.changeText(getByLabelText('Confirm new password'), 'newpassword123');
        fireEvent.press(getByText('Update Password'));

        await waitFor(() => {
            expect(mockUpdatePassword).toHaveBeenCalledWith('newpassword123');
        });
    });

    it('shows success alert on successful update', async () => {
        const alertSpy = jest.spyOn(Alert, 'alert');
        mockUpdatePassword.mockResolvedValue({ error: null });
        const { getByText, getByLabelText } = render(<ResetPassword />);

        fireEvent.changeText(getByLabelText('New password'), 'newpassword123');
        fireEvent.changeText(getByLabelText('Confirm new password'), 'newpassword123');
        fireEvent.press(getByText('Update Password'));

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith(
                'Success',
                'Your password has been updated successfully.',
                expect.arrayContaining([
                    expect.objectContaining({ text: 'OK' }),
                ])
            );
        });
    });

    it('displays error alert on update failure', async () => {
        const alertSpy = jest.spyOn(Alert, 'alert');
        mockUpdatePassword.mockResolvedValue({ error: { message: 'Session expired' } });
        const { getByText, getByLabelText } = render(<ResetPassword />);

        fireEvent.changeText(getByLabelText('New password'), 'newpassword123');
        fireEvent.changeText(getByLabelText('Confirm new password'), 'newpassword123');
        fireEvent.press(getByText('Update Password'));

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith('Error', 'Session expired');
        });
    });

    it('displays fallback error message when error has no message', async () => {
        const alertSpy = jest.spyOn(Alert, 'alert');
        mockUpdatePassword.mockResolvedValue({ error: {} });
        const { getByText, getByLabelText } = render(<ResetPassword />);

        fireEvent.changeText(getByLabelText('New password'), 'newpassword123');
        fireEvent.changeText(getByLabelText('Confirm new password'), 'newpassword123');
        fireEvent.press(getByText('Update Password'));

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith('Error', 'Failed to update password');
        });
    });

    it('shows loading state while updating', async () => {
        let resolveUpdate;
        mockUpdatePassword.mockImplementation(() => new Promise(resolve => { resolveUpdate = resolve; }));
        const { getByText, getByLabelText } = render(<ResetPassword />);

        fireEvent.changeText(getByLabelText('New password'), 'newpassword123');
        fireEvent.changeText(getByLabelText('Confirm new password'), 'newpassword123');
        fireEvent.press(getByText('Update Password'));

        await waitFor(() => {
            expect(getByText('Updating...')).toBeTruthy();
        });

        resolveUpdate({ error: null });

        await waitFor(() => {
            expect(getByText('Update Password')).toBeTruthy();
        });
    });

    it('toggles new password visibility', () => {
        const { getByLabelText, getAllByLabelText } = render(<ResetPassword />);

        const passwordInput = getByLabelText('New password');
        expect(passwordInput.props.secureTextEntry).toBe(true);

        const showButtons = getAllByLabelText('Show password');
        fireEvent.press(showButtons[0]);

        expect(getByLabelText('New password').props.secureTextEntry).toBe(false);
    });

    it('toggles confirm password visibility', () => {
        const { getByLabelText, getAllByLabelText } = render(<ResetPassword />);

        const confirmInput = getByLabelText('Confirm new password');
        expect(confirmInput.props.secureTextEntry).toBe(true);

        const showButtons = getAllByLabelText('Show password');
        fireEvent.press(showButtons[1]);

        expect(getByLabelText('Confirm new password').props.secureTextEntry).toBe(false);
    });
});
