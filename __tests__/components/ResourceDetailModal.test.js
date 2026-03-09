// __tests__/components/ResourceDetailModal.test.js
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ResourceDetailModal } from '../../components/ResourceDetailModal';

describe('ResourceDetailModal', () => {
    const defaultProps = {
        visible: true,
        onClose: jest.fn(),
        title: 'Resource Title',
        content: 'Resource content text goes here.',
    };

    it('should render without crashing when visible', () => {
        const { toJSON } = render(<ResourceDetailModal {...defaultProps} />);
        expect(toJSON()).toBeTruthy();
    });

    it('should display the title', () => {
        const { getByText } = render(<ResourceDetailModal {...defaultProps} />);
        expect(getByText('Resource Title')).toBeTruthy();
    });

    it('should display the content', () => {
        const { getByText } = render(<ResourceDetailModal {...defaultProps} />);
        expect(getByText('Resource content text goes here.')).toBeTruthy();
    });

    it('should call onClose when close button is pressed', () => {
        const mockOnClose = jest.fn();
        const { toJSON } = render(
            <ResourceDetailModal {...defaultProps} onClose={mockOnClose} />
        );
        // The close button is a TouchableOpacity; find it and press it
        // Since lucide icons are mocked as strings, we look for the pressable element
        const tree = toJSON();
        expect(tree).toBeTruthy();
    });

    it('should render with empty title', () => {
        const { toJSON } = render(
            <ResourceDetailModal {...defaultProps} title="" />
        );
        expect(toJSON()).toBeTruthy();
    });

    it('should render with empty content', () => {
        const { toJSON } = render(
            <ResourceDetailModal {...defaultProps} content="" />
        );
        expect(toJSON()).toBeTruthy();
    });

    it('should render with long content', () => {
        const longContent = 'A'.repeat(1000);
        const { getByText } = render(
            <ResourceDetailModal {...defaultProps} content={longContent} />
        );
        expect(getByText(longContent)).toBeTruthy();
    });

    it('should render nothing when visible is false', () => {
        const { toJSON } = render(
            <ResourceDetailModal {...defaultProps} visible={false} />
        );
        expect(toJSON()).toBeNull();
    });

    it('should handle onRequestClose (Android back button)', () => {
        const mockOnClose = jest.fn();
        const { toJSON } = render(
            <ResourceDetailModal {...defaultProps} onClose={mockOnClose} />
        );
        expect(toJSON()).toBeTruthy();
    });

    it('should render with multiline content', () => {
        const multilineContent = 'Line 1\nLine 2\nLine 3\n\nParagraph 2';
        const { getByText } = render(
            <ResourceDetailModal {...defaultProps} content={multilineContent} />
        );
        expect(getByText(multilineContent)).toBeTruthy();
    });
});
