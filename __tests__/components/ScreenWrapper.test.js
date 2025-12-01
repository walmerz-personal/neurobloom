// __tests__/components/ScreenWrapper.test.js
import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Colors } from '../../constants/Colors';

describe('ScreenWrapper', () => {
    it('should render children correctly', () => {
        const { getByText } = render(
            <ScreenWrapper>
                <Text>Test Content</Text>
            </ScreenWrapper>
        );

        expect(getByText('Test Content')).toBeTruthy();
    });

    it('should render multiple children', () => {
        const { getByText } = render(
            <ScreenWrapper>
                <Text>First Child</Text>
                <Text>Second Child</Text>
                <Text>Third Child</Text>
            </ScreenWrapper>
        );

        expect(getByText('First Child')).toBeTruthy();
        expect(getByText('Second Child')).toBeTruthy();
        expect(getByText('Third Child')).toBeTruthy();
    });

    it('should apply custom styles to content', () => {
        const customStyle = { padding: 20, backgroundColor: 'red' };
        const { getByText } = render(
            <ScreenWrapper style={customStyle}>
                <Text>Styled Content</Text>
            </ScreenWrapper>
        );

        const content = getByText('Styled Content').parent;
        expect(content.props.style).toContainEqual(customStyle);
    });

    it('should have correct background color', () => {
        const { getByText } = render(
            <ScreenWrapper>
                <Text>Test</Text>
            </ScreenWrapper>
        );

        const container = getByText('Test').parent.parent;
        const styles = container.props.style;
        const backgroundColor = styles.backgroundColor ||
            (Array.isArray(styles) && styles.find(s => s.backgroundColor)?.backgroundColor);

        expect(backgroundColor).toBe(Colors.background);
    });

    it('should use SafeAreaView with correct edges', () => {
        const { getByText } = render(
            <ScreenWrapper>
                <Text>Test</Text>
            </ScreenWrapper>
        );

        const safeArea = getByText('Test').parent.parent;
        expect(safeArea.props.edges).toEqual(['top', 'left', 'right']);
    });

    it('should have flex: 1 layout', () => {
        const { getByText } = render(
            <ScreenWrapper>
                <Text>Test</Text>
            </ScreenWrapper>
        );

        const container = getByText('Test').parent.parent;
        const content = getByText('Test').parent;

        const containerFlex = container.props.style.flex ||
            (Array.isArray(container.props.style) && container.props.style.find(s => s.flex)?.flex);
        const contentFlex = content.props.style.find(s => s.flex)?.flex;

        expect(containerFlex).toBe(1);
        expect(contentFlex).toBe(1);
    });

    it('should render without crashing when no children provided', () => {
        const { container } = render(<ScreenWrapper />);

        expect(container).toBeTruthy();
    });

    it('should merge custom styles with default styles', () => {
        const customStyle = { paddingHorizontal: 16 };
        const { getByText } = render(
            <ScreenWrapper style={customStyle}>
                <Text>Custom</Text>
            </ScreenWrapper>
        );

        const content = getByText('Custom').parent;
        const styles = content.props.style;

        // Should have both default flex and custom padding
        const hasFlex = styles.some(s => s.flex === 1);
        const hasCustomPadding = styles.some(s => s.paddingHorizontal === 16);

        expect(hasFlex).toBe(true);
        expect(hasCustomPadding).toBe(true);
    });

    it('should handle complex nested children', () => {
        const { getByText } = render(
            <ScreenWrapper>
                <Text>
                    <Text>Nested </Text>
                    <Text>Text</Text>
                </Text>
            </ScreenWrapper>
        );

        expect(getByText('Nested ')).toBeTruthy();
        expect(getByText('Text')).toBeTruthy();
    });

    it('should maintain accessibility for wrapped content', () => {
        const { getByText } = render(
            <ScreenWrapper>
                <Text accessible={true} accessibilityLabel="Test Label">
                    Accessible Text
                </Text>
            </ScreenWrapper>
        );

        const text = getByText('Accessible Text');
        expect(text.props.accessible).toBe(true);
        expect(text.props.accessibilityLabel).toBe('Test Label');
    });
});
