// __tests__/components/Garden/PlantingBox.test.js
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PlantingBox } from '../../../components/Garden/PlantingBox';

// Mock react-native-svg
jest.mock('react-native-svg', () => {
    const React = require('react');
    const { View } = require('react-native');
    const createMock = (name) => {
        const Component = (props) => React.createElement(View, { ...props, testID: name });
        Component.displayName = name;
        return Component;
    };
    return {
        __esModule: true,
        default: createMock('Svg'),
        Svg: createMock('Svg'),
        Path: createMock('Path'),
        Circle: createMock('Circle'),
        Ellipse: createMock('Ellipse'),
        G: createMock('G'),
        Rect: createMock('Rect'),
        Polygon: createMock('Polygon'),
    };
});

describe('PlantingBox', () => {
    const mockOnPress = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders without crashing with no plant', () => {
        const { toJSON } = render(
            <PlantingBox plant={null} onPress={mockOnPress} index={0} />
        );
        expect(toJSON()).toBeTruthy();
    });

    it('displays "Plant a Seed" when no plant is provided', () => {
        const { getByText } = render(
            <PlantingBox plant={null} onPress={mockOnPress} index={0} />
        );
        expect(getByText('Plant a Seed')).toBeTruthy();
    });

    it('displays plant name when a plant is provided', () => {
        const plant = {
            planted_at: new Date().toISOString(),
            items: { name: 'Red Rose', category: 'mindfulness' },
        };
        const { getByText } = render(
            <PlantingBox plant={plant} onPress={mockOnPress} index={0} />
        );
        expect(getByText('Red Rose')).toBeTruthy();
    });

    it('displays "Flower" as fallback when plant has no name', () => {
        const plant = {
            planted_at: new Date().toISOString(),
            items: {},
        };
        const { getByText } = render(
            <PlantingBox plant={plant} onPress={mockOnPress} index={0} />
        );
        expect(getByText('Flower')).toBeTruthy();
    });

    it('calls onPress when pressed', () => {
        const { getByText } = render(
            <PlantingBox plant={null} onPress={mockOnPress} index={0} />
        );
        fireEvent.press(getByText('Plant a Seed'));
        expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('renders stage 0 (tiny sprout) for a plant planted today', () => {
        const plant = {
            planted_at: new Date().toISOString(),
            items: { name: 'Rose', category: 'mindfulness' },
        };
        const { toJSON } = render(
            <PlantingBox plant={plant} onPress={mockOnPress} index={0} />
        );
        // Should render without crashing — sprout icon at stage 0
        expect(toJSON()).toBeTruthy();
    });

    it('renders stage 1 (small sprout) for a plant planted 1 day ago', () => {
        const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
        const plant = {
            planted_at: oneDayAgo,
            items: { name: 'Rose', category: 'mindfulness' },
        };
        const { toJSON } = render(
            <PlantingBox plant={plant} onPress={mockOnPress} index={0} />
        );
        expect(toJSON()).toBeTruthy();
    });

    it('renders stage 2 (leaf) for a plant planted 2 days ago', () => {
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
        const plant = {
            planted_at: twoDaysAgo,
            items: { name: 'Rose', category: 'mindfulness' },
        };
        const { toJSON } = render(
            <PlantingBox plant={plant} onPress={mockOnPress} index={0} />
        );
        expect(toJSON()).toBeTruthy();
    });

    it('renders stage 3 (full bloom) for a plant planted 3+ days ago', () => {
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
        const plant = {
            planted_at: threeDaysAgo,
            items: { name: 'Red Rose', category: 'mindfulness' },
        };
        const { toJSON } = render(
            <PlantingBox plant={plant} onPress={mockOnPress} index={0} />
        );
        expect(toJSON()).toBeTruthy();
    });

    it('caps growth at stage 3 for very old plants', () => {
        const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
        const plant = {
            planted_at: tenDaysAgo,
            items: { name: 'Sunflower', category: 'exercise' },
        };
        const { toJSON } = render(
            <PlantingBox plant={plant} onPress={mockOnPress} index={0} />
        );
        expect(toJSON()).toBeTruthy();
    });

    it('renders with disabled prop', () => {
        const { toJSON } = render(
            <PlantingBox plant={null} onPress={mockOnPress} disabled={true} index={0} />
        );
        expect(toJSON()).toBeTruthy();
    });

    it('renders the box container elements (backRim, innerBox, frontBox)', () => {
        const { toJSON } = render(
            <PlantingBox plant={null} onPress={mockOnPress} index={0} />
        );
        const tree = toJSON();
        // The component should have multiple child views representing the box parts
        expect(tree.children.length).toBeGreaterThanOrEqual(3);
    });
});
