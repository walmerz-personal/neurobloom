// __tests__/components/ScreenWrapper.test.js
import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Colors } from '../../constants/Colors';

describe('ScreenWrapper', () => {
    // Helper to flatten styles for validation
    const getStyle = (element) => {
        const style = element.props.style;
        return Array.isArray(style) ? Object.assign({}, ...style) : style;
    };

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
        const { getByTestId } = render(
            <ScreenWrapper style={customStyle}>
                <Text>Styled Content</Text>
            </ScreenWrapper>
        );

        // Usage of getStyle helper matches expectations even if style is array
        const content = getByTestId('screen-wrapper');
        const style = getStyle(content);

        expect(style).toMatchObject(customStyle);
    });

    it('should have flex: 1 layout', () => {
        const { getByTestId } = render(
            <ScreenWrapper>
                <Text>Test</Text>
            </ScreenWrapper>
        );

        const content = getByTestId('screen-wrapper');
        const container = content.parent;

        const containerStyle = getStyle(container);
        const contentStyle = getStyle(content);

        expect(containerStyle.flex).toBe(1);
        expect(contentStyle.flex).toBe(1);
    });

    it('should render without crashing when no children provided', () => {
        const { toJSON } = render(<ScreenWrapper />);
        expect(toJSON()).toBeTruthy();
    });

    it('should merge custom styles with default styles', () => {
        const customStyle = { paddingHorizontal: 16 };
        const { getByTestId } = render(
            <ScreenWrapper style={customStyle}>
                <Text>Custom</Text>
            </ScreenWrapper>
        );

        const content = getByTestId('screen-wrapper');
        const style = getStyle(content);

        // Should have both default flex and custom padding
        expect(style.flex).toBe(1);
        expect(style.paddingHorizontal).toBe(16);
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
