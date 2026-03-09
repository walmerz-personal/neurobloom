// __tests__/components/KudosSendModal.test.js
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { KudosSendModal } from '../../components/KudosSendModal';
import { KudosService } from '../../services/KudosService';

// Mock KudosService
jest.mock('../../services/KudosService', () => ({
    KudosService: {
        sendKudos: jest.fn(),
        getItemTypeLabel: jest.fn((type) => {
            const labels = { streak: 'Day Streak', exercises: 'Exercises', checkin_rate: 'Check-in Rate', mood: 'Mood' };
            return labels[type] || type;
        }),
        getItemTypeEmoji: jest.fn((type) => {
            const emojis = { streak: '🔥', exercises: '💪', checkin_rate: '📈', mood: '😊' };
            return emojis[type] || '⭐';
        }),
    },
}));

describe('KudosSendModal', () => {
    const defaultProps = {
        visible: true,
        onClose: jest.fn(),
        caregiverId: 'cg-1',
        survivorId: 'sv-1',
        survivorName: 'Jane Doe',
        itemType: 'streak',
        itemValue: '7',
        itemDate: '2026-03-08',
        onSuccess: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders when visible=true', () => {
        const { getByText } = render(<KudosSendModal {...defaultProps} />);
        expect(getByText('Send Kudos! 💜')).toBeTruthy();
    });

    it('does not show send UI when visible=false', () => {
        const { queryByText } = render(
            <KudosSendModal {...defaultProps} visible={false} />
        );
        // Modal does not render children when visible=false
        expect(queryByText('Send Kudos! 💜')).toBeNull();
    });

    it('displays survivor first name in message', () => {
        const { getByText } = render(<KudosSendModal {...defaultProps} />);
        expect(getByText(/Jane/)).toBeTruthy();
    });

    it('displays item type label and value', () => {
        const { getByText } = render(<KudosSendModal {...defaultProps} />);
        expect(getByText('7 Day Streak')).toBeTruthy();
    });

    it('displays item type emoji', () => {
        const { getByText } = render(<KudosSendModal {...defaultProps} />);
        expect(getByText('🔥')).toBeTruthy();
    });

    it('calls onClose when Cancel is pressed', () => {
        const { getByText } = render(<KudosSendModal {...defaultProps} />);
        fireEvent.press(getByText('Cancel'));
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('calls KudosService.sendKudos on send button press', async () => {
        KudosService.sendKudos.mockResolvedValue({ error: null });
        const { getByText } = render(<KudosSendModal {...defaultProps} />);

        await act(async () => {
            fireEvent.press(getByText('Send Kudos'));
        });

        await waitFor(() => {
            expect(KudosService.sendKudos).toHaveBeenCalledWith(
                'cg-1', 'sv-1', 'streak', '7', '2026-03-08'
            );
        });
    });

    it('shows success state after successful send', async () => {
        KudosService.sendKudos.mockResolvedValue({ error: null });
        const { getByText } = render(<KudosSendModal {...defaultProps} />);

        await act(async () => {
            fireEvent.press(getByText('Send Kudos'));
        });

        await waitFor(() => {
            expect(getByText('Kudos Sent!')).toBeTruthy();
        });
    });

    it('calls onSuccess and onClose after success timeout', async () => {
        jest.useFakeTimers({ legacyFakeTimers: true });
        KudosService.sendKudos.mockResolvedValue({ error: null });
        const { getByText } = render(<KudosSendModal {...defaultProps} />);

        await act(async () => {
            fireEvent.press(getByText('Send Kudos'));
        });

        await waitFor(() => {
            expect(getByText('Kudos Sent!')).toBeTruthy();
        });

        // Fast-forward the 1500ms timeout
        act(() => {
            jest.advanceTimersByTime(1500);
        });

        expect(defaultProps.onSuccess).toHaveBeenCalledTimes(1);
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
        jest.useRealTimers();
    });

    it('does not show success when sendKudos returns error', async () => {
        KudosService.sendKudos.mockResolvedValue({ error: 'Some error' });
        const { getByText, queryByText } = render(<KudosSendModal {...defaultProps} />);

        await act(async () => {
            fireEvent.press(getByText('Send Kudos'));
        });

        await waitFor(() => {
            expect(KudosService.sendKudos).toHaveBeenCalled();
        });

        // Should still show the send UI, not success
        expect(queryByText('Kudos Sent!')).toBeNull();
        expect(getByText('Send Kudos! 💜')).toBeTruthy();
    });

    it('handles missing survivorName gracefully', () => {
        const { getByText } = render(
            <KudosSendModal {...defaultProps} survivorName={undefined} />
        );
        expect(getByText(/them/)).toBeTruthy();
    });

    it('handles missing itemValue gracefully', () => {
        const { getByText } = render(
            <KudosSendModal {...defaultProps} itemValue={undefined} />
        );
        // Should show just the label without value prefix
        expect(getByText('Day Streak')).toBeTruthy();
    });
});
