// __tests__/components/NudgeReceivedModal.test.js
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NudgeReceivedModal } from '../../components/NudgeReceivedModal';

describe('NudgeReceivedModal', () => {
    const singleNudge = [
        {
            id: 'n-1',
            emoji: '💪',
            message: 'Keep going, you are doing great!',
            sender: { id: 'cg-1', name: 'Dr. Smith' },
        },
    ];

    const multipleNudges = [
        ...singleNudge,
        {
            id: 'n-2',
            emoji: '🌟',
            message: 'We believe in you!',
            sender: { id: 'cg-2', name: 'Alice' },
        },
    ];

    const defaultProps = {
        visible: true,
        onClose: jest.fn(),
        nudgesList: singleNudge,
        onDismiss: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns null when nudgesList is empty', () => {
        const { toJSON } = render(
            <NudgeReceivedModal {...defaultProps} nudgesList={[]} />
        );
        expect(toJSON()).toBeNull();
    });

    it('renders when visible=true with nudges', () => {
        const { getByText } = render(<NudgeReceivedModal {...defaultProps} />);
        expect(getByText("You've got a nudge!")).toBeTruthy();
    });

    it('displays sender name', () => {
        const { getByText } = render(<NudgeReceivedModal {...defaultProps} />);
        expect(getByText('Dr. Smith')).toBeTruthy();
    });

    it('displays nudge message in quotes', () => {
        const { getByText } = render(<NudgeReceivedModal {...defaultProps} />);
        expect(getByText('"Keep going, you are doing great!"')).toBeTruthy();
    });

    it('displays nudge emoji', () => {
        const { getByText } = render(<NudgeReceivedModal {...defaultProps} />);
        expect(getByText('💪')).toBeTruthy();
    });

    it('shows encouragement text', () => {
        const { getByText } = render(<NudgeReceivedModal {...defaultProps} />);
        expect(getByText('Your care team believes in you! 💙')).toBeTruthy();
    });

    it('does not show "more nudges" text for single nudge', () => {
        const { queryByText } = render(<NudgeReceivedModal {...defaultProps} />);
        expect(queryByText(/more nudge/)).toBeNull();
    });

    it('shows "more nudges" count for multiple nudges (singular)', () => {
        const { getByText } = render(
            <NudgeReceivedModal {...defaultProps} nudgesList={multipleNudges} />
        );
        expect(getByText('+ 1 more nudge waiting for you!')).toBeTruthy();
    });

    it('shows plural "nudges" for 3+ nudges', () => {
        const threeNudges = [
            ...multipleNudges,
            {
                id: 'n-3',
                emoji: '🌸',
                message: 'Third nudge',
                sender: { id: 'cg-3', name: 'Bob' },
            },
        ];
        const { getByText } = render(
            <NudgeReceivedModal {...defaultProps} nudgesList={threeNudges} />
        );
        expect(getByText('+ 2 more nudges waiting for you!')).toBeTruthy();
    });

    it('calls onDismiss and onClose when acknowledge button is pressed', () => {
        const { getByText } = render(<NudgeReceivedModal {...defaultProps} />);
        fireEvent.press(getByText('Got it! 💪'));
        expect(defaultProps.onDismiss).toHaveBeenCalledTimes(1);
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('handles missing sender name gracefully', () => {
        const nudgesNoName = [
            { id: 'n-1', emoji: '💪', message: 'Hello', sender: {} },
        ];
        const { getByText } = render(
            <NudgeReceivedModal {...defaultProps} nudgesList={nudgesNoName} />
        );
        expect(getByText('Someone')).toBeTruthy();
    });

    it('handles missing sender object gracefully', () => {
        const nudgesNoSender = [
            { id: 'n-1', emoji: '💪', message: 'Hello' },
        ];
        const { getByText } = render(
            <NudgeReceivedModal {...defaultProps} nudgesList={nudgesNoSender} />
        );
        expect(getByText('Someone')).toBeTruthy();
    });

    it('uses default emoji when nudge has no emoji', () => {
        const nudgesNoEmoji = [
            { id: 'n-1', message: 'Hello', sender: { name: 'Alice' } },
        ];
        const { getByText } = render(
            <NudgeReceivedModal {...defaultProps} nudgesList={nudgesNoEmoji} />
        );
        // Falls back to '💪'
        expect(getByText('💪')).toBeTruthy();
    });

    it('works without onDismiss callback', () => {
        const { getByText } = render(
            <NudgeReceivedModal {...defaultProps} onDismiss={undefined} />
        );
        // Should not throw when pressing acknowledge
        fireEvent.press(getByText('Got it! 💪'));
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
});
