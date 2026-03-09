// __tests__/components/Garden/SeedBankModal.test.js
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SeedBankModal } from '../../../components/Garden/SeedBankModal';

describe('SeedBankModal', () => {
    const mockOnClose = jest.fn();

    const mockInventory = [
        {
            items: { name: 'Rose Seed', description: 'A beautiful red rose' },
            quantity: 3,
        },
        {
            items: { name: 'Sunflower Seed', description: 'A bright sunflower' },
            quantity: 1,
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders without crashing when visible', () => {
        const { toJSON } = render(
            <SeedBankModal visible={true} onClose={mockOnClose} inventory={[]} />
        );
        expect(toJSON()).toBeTruthy();
    });

    it('renders without crashing when hidden', () => {
        const { toJSON } = render(
            <SeedBankModal visible={false} onClose={mockOnClose} inventory={[]} />
        );
        // Modal may not render children when not visible, but should not crash
        expect(toJSON).toBeDefined();
    });

    it('displays the title "Seed Bank"', () => {
        const { getByText } = render(
            <SeedBankModal visible={true} onClose={mockOnClose} inventory={[]} />
        );
        expect(getByText('Seed Bank')).toBeTruthy();
    });

    it('shows empty state when inventory is empty', () => {
        const { getByText } = render(
            <SeedBankModal visible={true} onClose={mockOnClose} inventory={[]} />
        );
        expect(getByText('No seeds yet!')).toBeTruthy();
        expect(getByText('Visit the shop to get some seeds.')).toBeTruthy();
    });

    it('displays inventory items with names and descriptions', () => {
        const { getByText } = render(
            <SeedBankModal visible={true} onClose={mockOnClose} inventory={mockInventory} />
        );
        expect(getByText('Rose Seed')).toBeTruthy();
        expect(getByText('A beautiful red rose')).toBeTruthy();
        expect(getByText('Sunflower Seed')).toBeTruthy();
        expect(getByText('A bright sunflower')).toBeTruthy();
    });

    it('displays correct quantities for each item', () => {
        const { getByText } = render(
            <SeedBankModal visible={true} onClose={mockOnClose} inventory={mockInventory} />
        );
        expect(getByText('x3')).toBeTruthy();
        expect(getByText('x1')).toBeTruthy();
    });

    it('does not show empty state when inventory has items', () => {
        const { queryByText } = render(
            <SeedBankModal visible={true} onClose={mockOnClose} inventory={mockInventory} />
        );
        expect(queryByText('No seeds yet!')).toBeNull();
    });

    it('calls onClose when close button is pressed', () => {
        const { getByText } = render(
            <SeedBankModal visible={true} onClose={mockOnClose} inventory={[]} />
        );
        // The close button contains the X icon (mocked as a string "X" by lucide mock)
        // Find the Seed Bank title and use the tree to locate the close button
        // The X icon is mocked as the string "X" via the Proxy in setup.js
        // Use getByText to find the X mock text rendered inside the close button
        fireEvent.press(getByText('Seed Bank'));
        // Since the title is not the close button, we need a different approach
        // The close button's onPress calls onClose - let's find it via testID or accessible tree
        // Actually, let's just verify the onClose prop is wired correctly
        // by directly invoking onRequestClose on the Modal
        mockOnClose.mockClear();

        // Re-render and use UNSAFE_getByType or find the TouchableOpacity
        const { UNSAFE_root } = render(
            <SeedBankModal visible={true} onClose={mockOnClose} inventory={[]} />
        );
        // Find the TouchableOpacity that has onPress=onClose (the close button in header)
        const touchables = UNSAFE_root.findAll(
            (node) => node.props.onPress === mockOnClose
        );
        expect(touchables.length).toBeGreaterThan(0);
        fireEvent.press(touchables[0]);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('renders multiple inventory items', () => {
        const largeInventory = [
            { items: { name: 'Rose', description: 'Red' }, quantity: 5 },
            { items: { name: 'Lavender', description: 'Purple' }, quantity: 2 },
            { items: { name: 'Sunflower', description: 'Yellow' }, quantity: 1 },
            { items: { name: 'Oak', description: 'Tall' }, quantity: 4 },
        ];
        const { getByText } = render(
            <SeedBankModal visible={true} onClose={mockOnClose} inventory={largeInventory} />
        );
        expect(getByText('Rose')).toBeTruthy();
        expect(getByText('Lavender')).toBeTruthy();
        expect(getByText('Sunflower')).toBeTruthy();
        expect(getByText('Oak')).toBeTruthy();
    });

    it('renders with single item inventory', () => {
        const singleItem = [
            { items: { name: 'Daisy', description: 'A simple flower' }, quantity: 10 },
        ];
        const { getByText } = render(
            <SeedBankModal visible={true} onClose={mockOnClose} inventory={singleItem} />
        );
        expect(getByText('Daisy')).toBeTruthy();
        expect(getByText('x10')).toBeTruthy();
    });
});
