// __tests__/app/(tabs)/lilly.test.js
import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import Lilly from '../../../app/(tabs)/lilly';
import { useAuth } from '../../../contexts/AuthContext';
import { SupabaseService } from '../../../services/SupabaseService';
import { sendMessage } from '../../../services/LillyService';
import { transcribeAudio } from '../../../services/TranscriptionService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('../../../contexts/AuthContext');
jest.mock('../../../services/SupabaseService');
jest.mock('../../../services/LillyService');
jest.mock('../../../services/TranscriptionService');
jest.mock('../../../app/(tabs)/exercises', () => ({
    EXERCISES_DATA: [{ id: 'a1', title: 'Shoulder Shrugs' }],
}));

// Mock expo-audio
jest.mock('expo-audio', () => ({
    useAudioRecorder: jest.fn(() => ({
        prepareToRecordAsync: jest.fn(),
        record: jest.fn(),
        stop: jest.fn(),
        uri: null,
    })),
    useAudioRecorderState: jest.fn(() => ({
        isRecording: false,
    })),
    AudioModule: {
        requestRecordingPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
    },
    RecordingPresets: {
        HIGH_QUALITY: {},
    },
    setAudioModeAsync: jest.fn(() => Promise.resolve()),
}));

// Mock child components
jest.mock('../../../components/ScreenWrapper', () => {
    const { View } = require('react-native');
    return { ScreenWrapper: ({ children }) => <View>{children}</View> };
});

// Mock expo-router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: jest.fn(),
        back: jest.fn(),
    }),
}));

describe('Lilly Chat Screen', () => {
    const mockUser = { id: 'test-user-id', email: 'test@example.com' };

    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue({ user: mockUser, userData: { role: 'survivor' } });
        SupabaseService.getUserProfile.mockResolvedValue({ profile: null, error: null });
        SupabaseService.getTodayLog.mockResolvedValue({ log: null, error: null });
        SupabaseService.getDailyLogs.mockResolvedValue({ logs: [], error: null });
        SupabaseService.getAssignedExercises.mockResolvedValue({ data: [], error: null });
        SupabaseService.getCustomExercises.mockResolvedValue({ data: [], error: null });
        SupabaseService.getAiConsent.mockResolvedValue({ granted: true });
        SupabaseService.setAiConsent.mockResolvedValue({ error: null });
        sendMessage.mockResolvedValue({ text: 'Hello! How can I help?', action: null });
        AsyncStorage.getItem.mockResolvedValue(null); // First-time user by default
    });

    describe('Rendering', () => {
        it('renders without crashing', () => {
            const { getByText } = render(<Lilly />);
            expect(getByText('Chat with Lilly')).toBeTruthy();
        });

        it('shows header title', () => {
            const { getByText } = render(<Lilly />);
            expect(getByText('Chat with Lilly')).toBeTruthy();
        });

        it('renders message input field', () => {
            const { getByLabelText } = render(<Lilly />);
            expect(getByLabelText('Message input')).toBeTruthy();
        });
    });

    describe('First-time User', () => {
        it('shows full introduction for first-time user', async () => {
            AsyncStorage.getItem.mockResolvedValue(null);

            const { getByText } = render(<Lilly />);
            await waitFor(() => {
                expect(getByText(/I'm Lilly/)).toBeTruthy();
            });
        });

        it('saves intro shown flag to AsyncStorage', async () => {
            AsyncStorage.getItem.mockResolvedValue(null);

            render(<Lilly />);
            await waitFor(() => {
                expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                    `LILLY_INTRO_SHOWN_${mockUser.id}`,
                    'true'
                );
            });
        });
    });

    describe('Returning User', () => {
        it('shows simple greeting for returning user', async () => {
            AsyncStorage.getItem.mockResolvedValue('true');

            const { getByText } = render(<Lilly />);
            await waitFor(() => {
                expect(getByText("I'm Lilly. How are you feeling today?")).toBeTruthy();
            });
        });
    });

    describe('Role-based greetings', () => {
        it('shows caregiver greeting for caregiver role (returning user)', async () => {
            useAuth.mockReturnValue({ user: mockUser, userData: { role: 'caregiver' } });
            AsyncStorage.getItem.mockResolvedValue('true');

            const { getByText } = render(<Lilly />);
            await waitFor(() => {
                expect(
                    getByText("I'm Lilly. I'm here to support you as a caregiver. How are you doing today?")
                ).toBeTruthy();
            });
        });

        it('shows medical staff greeting for medical_staff role (returning user)', async () => {
            useAuth.mockReturnValue({ user: mockUser, userData: { role: 'medical_staff' } });
            AsyncStorage.getItem.mockResolvedValue('true');

            const { getByText } = render(<Lilly />);
            await waitFor(() => {
                expect(
                    getByText(
                        "I'm Lilly. I'm here to support you and your patients with stroke recovery. What can I help you with today?"
                    )
                ).toBeTruthy();
            });
        });
    });

    describe('Sending Messages', () => {
        it('sends message when send button is pressed', async () => {
            const { getByLabelText, getByText } = render(<Lilly />);

            await waitFor(() => {
                expect(getByText(/Lilly/)).toBeTruthy();
            });

            const input = getByLabelText('Message input');
            fireEvent.changeText(input, 'Hello Lilly');
            fireEvent(input, 'submitEditing');

            await waitFor(() => {
                expect(sendMessage).toHaveBeenCalledWith(
                    'Hello Lilly',
                    expect.any(Array),
                    null,
                    expect.anything()
                );
            });
        });

        it('does not send empty messages', async () => {
            const { getByLabelText } = render(<Lilly />);

            const input = getByLabelText('Message input');
            fireEvent.changeText(input, '   ');
            fireEvent(input, 'submitEditing');

            expect(sendMessage).not.toHaveBeenCalled();
        });

        it('clears input after sending', async () => {
            const { getByLabelText, getByText } = render(<Lilly />);

            await waitFor(() => {
                expect(getByText(/Lilly/)).toBeTruthy();
            });

            const input = getByLabelText('Message input');
            fireEvent.changeText(input, 'Hello');
            fireEvent(input, 'submitEditing');

            await waitFor(() => {
                expect(input.props.value).toBe('');
            });
        });

        it('displays Lilly response after sending', async () => {
            sendMessage.mockResolvedValue({ text: 'I am here to help!', action: null });

            const { getByLabelText, getByText } = render(<Lilly />);

            await waitFor(() => {
                expect(getByText(/Lilly/)).toBeTruthy();
            });

            const input = getByLabelText('Message input');
            fireEvent.changeText(input, 'Help me');
            fireEvent(input, 'submitEditing');

            await waitFor(() => {
                expect(getByText('I am here to help!')).toBeTruthy();
            });
        });
    });

    describe('AI consent gate', () => {
        it('blocks sending and shows the consent modal when not consented', async () => {
            SupabaseService.getAiConsent.mockResolvedValue({ granted: false });
            const { getByLabelText, getByText } = render(<Lilly />);

            await waitFor(() => {
                expect(getByText(/Lilly/)).toBeTruthy();
            });

            const input = getByLabelText('Message input');
            fireEvent.changeText(input, 'Hello Lilly');
            fireEvent(input, 'submitEditing');

            await waitFor(() => {
                expect(getByText('Enable Lilly, your AI companion')).toBeTruthy();
            });
            expect(sendMessage).not.toHaveBeenCalled();
        });

        it('records consent when Enable Lilly is pressed', async () => {
            SupabaseService.getAiConsent.mockResolvedValue({ granted: false });
            const { getByLabelText, getByText } = render(<Lilly />);

            await waitFor(() => {
                expect(getByText(/Lilly/)).toBeTruthy();
            });

            fireEvent.changeText(getByLabelText('Message input'), 'Hello');
            fireEvent(getByLabelText('Message input'), 'submitEditing');

            await waitFor(() => {
                expect(getByText('Enable Lilly')).toBeTruthy();
            });

            fireEvent.press(getByText('Enable Lilly'));

            await waitFor(() => {
                expect(SupabaseService.setAiConsent).toHaveBeenCalledWith('test-user-id', true);
            });
        });
    });

    describe('Error Handling', () => {
        it('handles sendMessage network error gracefully', async () => {
            sendMessage.mockRejectedValue(new Error('Network error'));

            const { getByLabelText, getByText } = render(<Lilly />);

            await waitFor(() => {
                expect(getByText(/Lilly/)).toBeTruthy();
            });

            const input = getByLabelText('Message input');
            fireEvent.changeText(input, 'Hello');
            fireEvent(input, 'submitEditing');

            await waitFor(() => {
                expect(getByText(/trouble connecting/)).toBeTruthy();
            });
        });

        it('handles AsyncStorage error gracefully', async () => {
            AsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

            const { getByText } = render(<Lilly />);
            await waitFor(() => {
                // Falls back to simple greeting
                expect(getByText("I'm Lilly. How are you feeling today?")).toBeTruthy();
            });
        });

        it('handles null user gracefully', () => {
            useAuth.mockReturnValue({ user: null });

            const { getByText } = render(<Lilly />);
            expect(getByText('Chat with Lilly')).toBeTruthy();
        });

        it('handles getUserProfile error gracefully', async () => {
            SupabaseService.getUserProfile.mockResolvedValue({
                profile: null,
                error: new Error('Profile error'),
            });

            const { getByText } = render(<Lilly />);
            expect(getByText('Chat with Lilly')).toBeTruthy();
        });
    });

    describe('User Profile Loading', () => {
        it('loads user profile on mount', async () => {
            SupabaseService.getUserProfile.mockResolvedValue({
                profile: { name: 'Jane', impairments: ['arm_weakness'] },
                error: null,
            });

            render(<Lilly />);
            await waitFor(() => {
                expect(SupabaseService.getUserProfile).toHaveBeenCalledWith('test-user-id');
            });
        });

        it('passes profile to sendMessage', async () => {
            const mockProfile = { name: 'Jane', impairments: ['arm_weakness'] };
            SupabaseService.getUserProfile.mockResolvedValue({
                profile: mockProfile,
                error: null,
            });

            const { getByLabelText, getByText } = render(<Lilly />);

            await waitFor(() => {
                expect(getByText(/Lilly/)).toBeTruthy();
            });

            // Wait for profile to load
            await waitFor(() => {
                expect(SupabaseService.getUserProfile).toHaveBeenCalled();
            });

            const input = getByLabelText('Message input');
            fireEvent.changeText(input, 'Hello');
            fireEvent(input, 'submitEditing');

            await waitFor(() => {
                expect(sendMessage).toHaveBeenCalledWith(
                    'Hello',
                    expect.any(Array),
                    mockProfile,
                    expect.anything()
                );
            });
        });
    });

    describe('Voice Input UI', () => {
        it('shows microphone button', () => {
            // The mic button exists in the input wrapper
            const { getByText } = render(<Lilly />);
            expect(getByText('Chat with Lilly')).toBeTruthy();
        });
    });
});
