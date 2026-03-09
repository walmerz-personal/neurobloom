// __tests__/components/KudosReceivedModal.test.js
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { KudosReceivedModal } from '../../components/KudosReceivedModal';

// Mock KudosService
jest.mock('../../services/KudosService', () => ({
    KudosService: {
        getItemTypeLabel: jest.fn((type) => {
            const labels = { streak: 'Day Streak', exercises: 'Exercises' };
            return labels[type] || type;
        }),
        getItemTypeEmoji: jest.fn((type) => {
            const emojis = { streak: '🔥', exercises: '💪' };
            return emojis[type] || '⭐';
        }),
    },
}));

describe('KudosReceivedModal', () => {
    const singleKudos = [
        {
            id: 'k-1',
            item_type: 'streak',
            item_value: '5',
            caregiver: { id: 'cg-1', name: 'Alice Smith' },
        },
    ];

    const multipleKudos = [
        ...singleKudos,
        {
            id: 'k-2',
            item_type: 'exercises',
            item_value: '3',
            caregiver: { id: 'cg-2', name: 'Bob Jones' },
        },
        {
            id: 'k-3',
            item_type: 'exercises',
            item_value: '10',
            caregiver: { id: 'cg-3', name: 'Carol Lee' },
        },
    ];

    const defaultProps = {
        visible: true,
        onClose: jest.fn(),
        kudosList: singleKudos,
        onDismiss: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns null when kudosList is empty', () => {
        const { toJSON } = render(
            <KudosReceivedModal {...defaultProps} kudosList={[]} />
        );
        expect(toJSON()).toBeNull();
    });

    it('renders when visible=true with kudos', () => {
        const { getByText } = render(<KudosReceivedModal {...defaultProps} />);
        expect(getByText('You got a Kudos! 🎉')).toBeTruthy();
    });

    it('displays caregiver first name', () => {
        const { getByText } = render(<KudosReceivedModal {...defaultProps} />);
        expect(getByText('Alice')).toBeTruthy();
    });

    it('displays item type label with value', () => {
        const { getByText } = render(<KudosReceivedModal {...defaultProps} />);
        expect(getByText('5 Day Streak!')).toBeTruthy();
    });

    it('displays item type emoji', () => {
        const { getByText } = render(<KudosReceivedModal {...defaultProps} />);
        expect(getByText('🔥')).toBeTruthy();
    });

    it('shows encouragement text', () => {
        const { getByText } = render(<KudosReceivedModal {...defaultProps} />);
        expect(getByText('Keep up the amazing work! 💪')).toBeTruthy();
    });

    it('does not show "more kudos" text for single kudos', () => {
        const { queryByText } = render(<KudosReceivedModal {...defaultProps} />);
        expect(queryByText(/more kudos/)).toBeNull();
    });

    it('shows "more kudos" count for multiple kudos', () => {
        const { getByText } = render(
            <KudosReceivedModal {...defaultProps} kudosList={multipleKudos} />
        );
        expect(getByText('+ 2 more kudos waiting for you!')).toBeTruthy();
    });

    it('calls onDismiss and onClose when Celebrate button is pressed', () => {
        const { getByText } = render(<KudosReceivedModal {...defaultProps} />);
        fireEvent.press(getByText('Celebrate! ✨'));
        expect(defaultProps.onDismiss).toHaveBeenCalledTimes(1);
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('handles missing caregiver name gracefully', () => {
        const kudosNoName = [
            { id: 'k-1', item_type: 'streak', item_value: '5', caregiver: {} },
        ];
        const { getByText } = render(
            <KudosReceivedModal {...defaultProps} kudosList={kudosNoName} />
        );
        expect(getByText('Someone')).toBeTruthy();
    });

    it('handles kudos without item_value', () => {
        const kudosNoValue = [
            {
                id: 'k-1',
                item_type: 'streak',
                caregiver: { id: 'cg-1', name: 'Alice' },
            },
        ];
        const { getByText } = render(
            <KudosReceivedModal {...defaultProps} kudosList={kudosNoValue} />
        );
        expect(getByText('Day Streak!')).toBeTruthy();
    });

    it('works without onDismiss callback', () => {
        const { getByText } = render(
            <KudosReceivedModal {...defaultProps} onDismiss={undefined} />
        );
        // Should not throw when pressing celebrate
        fireEvent.press(getByText('Celebrate! ✨'));
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
});
