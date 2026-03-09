// __tests__/components/ResourceCard.test.js
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ResourceCard } from '../../components/ResourceCard';

describe('ResourceCard', () => {
    const defaultProps = {
        title: 'Test Resource',
        snippet: 'A short description of the resource.',
        onPress: jest.fn(),
    };

    it('should render without crashing', () => {
        const { toJSON } = render(<ResourceCard {...defaultProps} />);
        expect(toJSON()).toBeTruthy();
    });

    it('should display the title', () => {
        const { getByText } = render(<ResourceCard {...defaultProps} />);
        expect(getByText('Test Resource')).toBeTruthy();
    });

    it('should display the snippet', () => {
        const { getByText } = render(<ResourceCard {...defaultProps} />);
        expect(getByText('A short description of the resource.')).toBeTruthy();
    });

    it('should call onPress when pressed', () => {
        const mockOnPress = jest.fn();
        const { getByText } = render(
            <ResourceCard {...defaultProps} onPress={mockOnPress} />
        );
        fireEvent.press(getByText('Test Resource'));
        expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple presses', () => {
        const mockOnPress = jest.fn();
        const { getByText } = render(
            <ResourceCard {...defaultProps} onPress={mockOnPress} />
        );
        fireEvent.press(getByText('Test Resource'));
        fireEvent.press(getByText('Test Resource'));
        fireEvent.press(getByText('Test Resource'));
        expect(mockOnPress).toHaveBeenCalledTimes(3);
    });

    it('should render with long title', () => {
        const longTitle = 'This is a very long resource title that should be truncated to one line in the UI';
        const { getByText } = render(
            <ResourceCard {...defaultProps} title={longTitle} />
        );
        expect(getByText(longTitle)).toBeTruthy();
    });

    it('should render with long snippet', () => {
        const longSnippet = 'This is a very long snippet text that would normally span multiple lines but should be truncated to two lines maximum in the card view.';
        const { getByText } = render(
            <ResourceCard {...defaultProps} snippet={longSnippet} />
        );
        expect(getByText(longSnippet)).toBeTruthy();
    });

    it('should render with empty title', () => {
        const { toJSON } = render(
            <ResourceCard title="" snippet="Some snippet" onPress={() => {}} />
        );
        expect(toJSON()).toBeTruthy();
    });

    it('should render with empty snippet', () => {
        const { toJSON } = render(
            <ResourceCard title="Title" snippet="" onPress={() => {}} />
        );
        expect(toJSON()).toBeTruthy();
    });

    it('should render without onPress prop', () => {
        const { toJSON } = render(
            <ResourceCard title="Title" snippet="Snippet" />
        );
        expect(toJSON()).toBeTruthy();
    });
});
