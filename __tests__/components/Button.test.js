// __tests__/components/Button.test.js
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PrimaryButton, SecondaryButton } from '../../components/Button';
import { Colors } from '../../constants/Colors';

describe('Button Components', () => {
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
            const { getByText } = render(
                <PrimaryButton
                    title="Styled Button"
                    onPress={() => { }}
                    style={customStyle}
                />
            );

            const button = getByText('Styled Button').parent;
            expect(button.props.style).toContainEqual(customStyle);
        });

        it('should have correct background color', () => {
            const { getByText } = render(
                <PrimaryButton title="Test" onPress={() => { }} />
            );

            const button = getByText('Test').parent;
            const styles = button.props.style;
            const backgroundColor = styles.find(s => s.backgroundColor)?.backgroundColor;

            expect(backgroundColor).toBe(Colors.primary);
        });

        it('should have correct text color', () => {
            const { getByText } = render(
                <PrimaryButton title="Test" onPress={() => { }} />
            );

            const text = getByText('Test');
            const styles = text.props.style;
            const color = styles.color || (Array.isArray(styles) && styles.find(s => s.color)?.color);

            expect(color).toBe('white');
        });

        it('should be accessible', () => {
            const { getByText } = render(
                <PrimaryButton title="Accessible Button" onPress={() => { }} />
            );

            const button = getByText('Accessible Button').parent;
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
            const { getByText } = render(
                <SecondaryButton
                    title="Custom Secondary"
                    onPress={() => { }}
                    style={customStyle}
                />
            );

            const button = getByText('Custom Secondary').parent;
            expect(button.props.style).toContainEqual(customStyle);
        });

        it('should have correct background color', () => {
            const { getByText } = render(
                <SecondaryButton title="Test" onPress={() => { }} />
            );

            const button = getByText('Test').parent;
            const styles = button.props.style;
            const backgroundColor = styles.find(s => s.backgroundColor)?.backgroundColor;

            expect(backgroundColor).toBe(Colors.lillyBubble);
        });

        it('should have correct text color', () => {
            const { getByText } = render(
                <SecondaryButton title="Test" onPress={() => { }} />
            );

            const text = getByText('Test');
            const styles = text.props.style;
            const color = styles.color || (Array.isArray(styles) && styles.find(s => s.color)?.color);

            expect(color).toBe(Colors.text);
        });

        it('should be accessible', () => {
            const { getByText } = render(
                <SecondaryButton title="Accessible Secondary" onPress={() => { }} />
            );

            const button = getByText('Accessible Secondary').parent;
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
            const { getByText: getPrimary } = render(
                <PrimaryButton title="Primary" onPress={() => { }} />
            );
            const { getByText: getSecondary } = render(
                <SecondaryButton title="Secondary" onPress={() => { }} />
            );

            const primaryButton = getPrimary('Primary').parent;
            const secondaryButton = getSecondary('Secondary').parent;

            const primaryRadius = primaryButton.props.style.find(s => s.borderRadius)?.borderRadius;
            const secondaryRadius = secondaryButton.props.style.find(s => s.borderRadius)?.borderRadius;

            expect(primaryRadius).toBe(secondaryRadius);
            expect(primaryRadius).toBe(14);
        });

        it('both buttons should have same padding', () => {
            const { getByText: getPrimary } = render(
                <PrimaryButton title="Primary" onPress={() => { }} />
            );
            const { getByText: getSecondary } = render(
                <SecondaryButton title="Secondary" onPress={() => { }} />
            );

            const primaryButton = getPrimary('Primary').parent;
            const secondaryButton = getSecondary('Secondary').parent;

            const primaryPadding = primaryButton.props.style.find(s => s.padding)?.padding;
            const secondaryPadding = secondaryButton.props.style.find(s => s.padding)?.padding;

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

            const primarySize = primaryText.props.style.fontSize ||
                (Array.isArray(primaryText.props.style) && primaryText.props.style.find(s => s.fontSize)?.fontSize);
            const secondarySize = secondaryText.props.style.fontSize ||
                (Array.isArray(secondaryText.props.style) && secondaryText.props.style.find(s => s.fontSize)?.fontSize);

            expect(primarySize).toBe(secondarySize);
            expect(primarySize).toBe(18);
        });
    });
});
