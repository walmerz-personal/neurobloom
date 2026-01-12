// __tests__/components/Button.test.js
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PrimaryButton, SecondaryButton } from '../../components/Button';
import { Colors } from '../../constants/Colors';

describe('Button Components', () => {
    // Helper to flatten styles
    const getStyle = (element) => {
        const style = element.props.style;
        return Array.isArray(style) ? Object.assign({}, ...style) : style;
    };

    describe('PrimaryButton', () => {
        it('should render with correct title', () => {
            const { getByText } = render(
                <PrimaryButton title="Click Me" onPress={() => { }} />
            );

            expect(getByText('Click Me')).toBeTruthy();
        });

        it('should call onPress when pressed', () => {
            const mockOnPress = jest.fn();
            const { getByText } = render(
                <PrimaryButton title="Test Button" onPress={mockOnPress} />
            );

            fireEvent.press(getByText('Test Button'));

            expect(mockOnPress).toHaveBeenCalledTimes(1);
        });

        it('should apply custom styles', () => {
            const customStyle = { marginBottom: 20 };
            const { getByRole } = render(
                <PrimaryButton
                    title="Styled Button"
                    onPress={() => { }}
                    style={customStyle}
                />
            );

            const button = getByRole('button', { name: 'Styled Button' });
            expect(button.props.style).toMatchObject(customStyle);
        });

        it('should have correct background color', () => {
            const { getByRole } = render(
                <PrimaryButton title="Test" onPress={() => { }} />
            );

            const button = getByRole('button', { name: 'Test' });
            const backgroundColor = getStyle(button).backgroundColor;

            expect(backgroundColor).toBe(Colors.primary);
        });

        it('should have correct text color', () => {
            const { getByText } = render(
                <PrimaryButton title="Test" onPress={() => { }} />
            );

            const text = getByText('Test');
            const color = getStyle(text).color;

            expect(color).toBe('white');
        });

        it('should be accessible', () => {
            const { getByRole } = render(
                <PrimaryButton title="Accessible Button" onPress={() => { }} />
            );

            const button = getByRole('button', { name: 'Accessible Button' });
            expect(button.props.accessible).toBeTruthy();
        });

        it('should handle multiple presses', () => {
            const mockOnPress = jest.fn();
            const { getByText } = render(
                <PrimaryButton title="Multi Press" onPress={mockOnPress} />
            );

            const button = getByText('Multi Press');
            fireEvent.press(button);
            fireEvent.press(button);
            fireEvent.press(button);

            expect(mockOnPress).toHaveBeenCalledTimes(3);
        });

        it('should render with long text', () => {
            const longText = 'This is a very long button title that might wrap';
            const { getByText } = render(
                <PrimaryButton title={longText} onPress={() => { }} />
            );

            expect(getByText(longText)).toBeTruthy();
        });
    });

    describe('SecondaryButton', () => {
        it('should render with correct title', () => {
            const { getByText } = render(
                <SecondaryButton title="Secondary" onPress={() => { }} />
            );

            expect(getByText('Secondary')).toBeTruthy();
        });

        it('should call onPress when pressed', () => {
            const mockOnPress = jest.fn();
            const { getByText } = render(
                <SecondaryButton title="Test Secondary" onPress={mockOnPress} />
            );

            fireEvent.press(getByText('Test Secondary'));

            expect(mockOnPress).toHaveBeenCalledTimes(1);
        });

        it('should apply custom styles', () => {
            const customStyle = { marginTop: 10 };
            const { getByRole } = render(
                <SecondaryButton
                    title="Custom Secondary"
                    onPress={() => { }}
                    style={customStyle}
                />
            );

            const button = getByRole('button', { name: 'Custom Secondary' });
            expect(button.props.style).toMatchObject(customStyle);
        });

        it('should have correct background color', () => {
            const { getByRole } = render(
                <SecondaryButton title="Test" onPress={() => { }} />
            );

            const button = getByRole('button', { name: 'Test' });
            const backgroundColor = getStyle(button).backgroundColor;

            expect(backgroundColor).toBe(Colors.lillyBubble);
        });

        it('should have correct text color', () => {
            const { getByText } = render(
                <SecondaryButton title="Test" onPress={() => { }} />
            );

            const text = getByText('Test');
            const color = getStyle(text).color;

            expect(color).toBe(Colors.text);
        });

        it('should be accessible', () => {
            const { getByRole } = render(
                <SecondaryButton title="Accessible Secondary" onPress={() => { }} />
            );

            const button = getByRole('button', { name: 'Accessible Secondary' });
            expect(button.props.accessible).toBeTruthy();
        });

        it('should handle rapid presses', () => {
            const mockOnPress = jest.fn();
            const { getByText } = render(
                <SecondaryButton title="Rapid Press" onPress={mockOnPress} />
            );

            const button = getByText('Rapid Press');
            for (let i = 0; i < 10; i++) {
                fireEvent.press(button);
            }

            expect(mockOnPress).toHaveBeenCalledTimes(10);
        });

        it('should render with empty title', () => {
            const { getByText } = render(
                <SecondaryButton title="" onPress={() => { }} />
            );

            // Should still render the button even with empty text
            const button = getByText('').parent;
            expect(button).toBeTruthy();
        });
    });

    describe('Button Style Consistency', () => {
        it('both buttons should have same border radius', () => {
            const { getByRole: getPrimary } = render(
                <PrimaryButton title="Primary" onPress={() => { }} />
            );
            const { getByRole: getSecondary } = render(
                <SecondaryButton title="Secondary" onPress={() => { }} />
            );

            const primaryButton = getPrimary('button', { name: 'Primary' });
            const secondaryButton = getSecondary('button', { name: 'Secondary' });

            const primaryRadius = getStyle(primaryButton).borderRadius;
            const secondaryRadius = getStyle(secondaryButton).borderRadius;

            expect(primaryRadius).toBe(secondaryRadius);
            expect(primaryRadius).toBe(14);
        });

        it('both buttons should have same padding', () => {
            const { getByRole: getPrimary } = render(
                <PrimaryButton title="Primary" onPress={() => { }} />
            );
            const { getByRole: getSecondary } = render(
                <SecondaryButton title="Secondary" onPress={() => { }} />
            );

            const primaryButton = getPrimary('button', { name: 'Primary' });
            const secondaryButton = getSecondary('button', { name: 'Secondary' });

            const primaryPadding = getStyle(primaryButton).padding;
            const secondaryPadding = getStyle(secondaryButton).padding;

            expect(primaryPadding).toBe(secondaryPadding);
            expect(primaryPadding).toBe(18);
        });

        it('both buttons should have same font size', () => {
            const { getByText: getPrimary } = render(
                <PrimaryButton title="Primary" onPress={() => { }} />
            );
            const { getByText: getSecondary } = render(
                <SecondaryButton title="Secondary" onPress={() => { }} />
            );

            const primaryText = getPrimary('Primary');
            const secondaryText = getSecondary('Secondary');

            const primarySize = getStyle(primaryText).fontSize;
            const secondarySize = getStyle(secondaryText).fontSize;

            expect(primarySize).toBe(secondarySize);
            expect(primarySize).toBe(18);
        });
    });
});
