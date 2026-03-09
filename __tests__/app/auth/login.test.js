import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import Login from '../../../app/auth/login';
import { useAuth } from '../../../contexts/AuthContext';

// Mock dependencies
jest.mock('../../../contexts/AuthContext');
jest.mock('../../../components/Logo', () => 'Logo');

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: mockReplace,
        back: jest.fn(),
    }),
}));

describe('Login Screen', () => {
    const mockSignIn = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue({ signIn: mockSignIn });
    });

    it('renders without crashing', () => {
        const { getByText } = render(<Login />);
        expect(getByText('Welcome Back')).toBeTruthy();
    });

    it('shows correct form fields', () => {
        const { getByLabelText } = render(<Login />);
        expect(getByLabelText('Email address')).toBeTruthy();
        expect(getByLabelText('Password')).toBeTruthy();
    });

    it('shows login button and navigation links', () => {
        const { getByText } = render(<Login />);
        expect(getByText('Log In')).toBeTruthy();
        expect(getByText('Forgot Password?')).toBeTruthy();
        expect(getByText('Sign Up')).toBeTruthy();
    });

    it('shows app name and subtitle', () => {
        const { getByText } = render(<Login />);
        expect(getByText('NeuroBloom')).toBeTruthy();
        expect(getByText('Log in to continue your recovery journey')).toBeTruthy();
    });

    it('alerts when submitting with empty fields', () => {
        const alertSpy = jest.spyOn(Alert, 'alert');
        const { getByText } = render(<Login />);

        fireEvent.press(getByText('Log In'));

        expect(alertSpy).toHaveBeenCalledWith('Error', 'Please enter both email and password');
        expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('alerts when submitting with only email', () => {
        const alertSpy = jest.spyOn(Alert, 'alert');
        const { getByText, getByLabelText } = render(<Login />);

        fireEvent.changeText(getByLabelText('Email address'), 'test@example.com');
        fireEvent.press(getByText('Log In'));

        expect(alertSpy).toHaveBeenCalledWith('Error', 'Please enter both email and password');
        expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('alerts when submitting with only password', () => {
        const alertSpy = jest.spyOn(Alert, 'alert');
        const { getByText, getByLabelText } = render(<Login />);

        fireEvent.changeText(getByLabelText('Password'), 'password123');
        fireEvent.press(getByText('Log In'));

        expect(alertSpy).toHaveBeenCalledWith('Error', 'Please enter both email and password');
        expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('calls signIn with email and password on valid submit', async () => {
        mockSignIn.mockResolvedValue({ error: null });
        const { getByText, getByLabelText } = render(<Login />);

        fireEvent.changeText(getByLabelText('Email address'), 'test@example.com');
        fireEvent.changeText(getByLabelText('Password'), 'password123');
        fireEvent.press(getByText('Log In'));

        await waitFor(() => {
            expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
        });
    });

    it('navigates to home on successful login', async () => {
        mockSignIn.mockResolvedValue({ error: null });
        const { getByText, getByLabelText } = render(<Login />);

        fireEvent.changeText(getByLabelText('Email address'), 'test@example.com');
        fireEvent.changeText(getByLabelText('Password'), 'password123');
        fireEvent.press(getByText('Log In'));

        await waitFor(() => {
            expect(mockReplace).toHaveBeenCalledWith('/(tabs)/home');
        });
    });

    it('displays error alert on login failure', async () => {
        const alertSpy = jest.spyOn(Alert, 'alert');
        mockSignIn.mockResolvedValue({ error: { message: 'Invalid credentials' } });
        const { getByText, getByLabelText } = render(<Login />);

        fireEvent.changeText(getByLabelText('Email address'), 'test@example.com');
        fireEvent.changeText(getByLabelText('Password'), 'wrongpassword');
        fireEvent.press(getByText('Log In'));

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith('Login Failed', 'Invalid credentials');
        });
    });

    it('displays fallback error message when error has no message', async () => {
        const alertSpy = jest.spyOn(Alert, 'alert');
        mockSignIn.mockResolvedValue({ error: {} });
        const { getByText, getByLabelText } = render(<Login />);

        fireEvent.changeText(getByLabelText('Email address'), 'test@example.com');
        fireEvent.changeText(getByLabelText('Password'), 'wrongpassword');
        fireEvent.press(getByText('Log In'));

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith('Login Failed', 'Invalid email or password');
        });
    });

    it('shows loading state while logging in', async () => {
        let resolveSignIn;
        mockSignIn.mockImplementation(() => new Promise(resolve => { resolveSignIn = resolve; }));
        const { getByText, getByLabelText } = render(<Login />);

        fireEvent.changeText(getByLabelText('Email address'), 'test@example.com');
        fireEvent.changeText(getByLabelText('Password'), 'password123');
        fireEvent.press(getByText('Log In'));

        await waitFor(() => {
            expect(getByText('Logging in...')).toBeTruthy();
        });

        resolveSignIn({ error: null });

        await waitFor(() => {
            expect(getByText('Log In')).toBeTruthy();
        });
    });

    it('navigates to forgot password screen', () => {
        const { getByText } = render(<Login />);
        fireEvent.press(getByText('Forgot Password?'));
        expect(mockPush).toHaveBeenCalledWith('/auth/forgot-password');
    });

    it('navigates to sign up screen', () => {
        const { getByText } = render(<Login />);
        fireEvent.press(getByText('Sign Up'));
        expect(mockPush).toHaveBeenCalledWith('/onboarding/intro');
    });

    it('toggles password visibility', () => {
        const { getByLabelText } = render(<Login />);

        const passwordInput = getByLabelText('Password');
        expect(passwordInput.props.secureTextEntry).toBe(true);

        fireEvent.press(getByLabelText('Show password'));

        expect(getByLabelText('Password').props.secureTextEntry).toBe(false);
        expect(getByLabelText('Hide password')).toBeTruthy();
    });
});
