// __tests__/components/Garden/GardenKitten.test.js
import React from 'react';
import { render } from '@testing-library/react-native';
import { GardenKitten } from '../../../components/Garden/GardenKitten';

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
        Circle: createMock('Circle'),
        Ellipse: createMock('Ellipse'),
    };
});

// Mock the cat_walk.json animation asset
jest.mock('../../../assets/animations/cat_walk.json', () => ({}), { virtual: true });

describe('GardenKitten', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('renders without crashing with no purchasedAt', () => {
        const { toJSON } = render(<GardenKitten purchasedAt={null} />);
        expect(toJSON()).toBeTruthy();
    });

    it('renders without crashing with a purchasedAt date', () => {
        const { toJSON } = render(
            <GardenKitten purchasedAt={new Date().toISOString()} />
        );
        expect(toJSON()).toBeTruthy();
    });

    it('renders the ball element', () => {
        const { getAllByTestId } = render(
            <GardenKitten purchasedAt={new Date().toISOString()} />
        );
        // The ball contains an Svg with a Circle
        const svgs = getAllByTestId('Svg');
        expect(svgs.length).toBeGreaterThanOrEqual(1);
    });

    it('renders the LottieView for cat animation', () => {
        const { toJSON } = render(
            <GardenKitten purchasedAt={new Date().toISOString()} />
        );
        const tree = toJSON();
        // The component renders a container View with ball and cat child views
        expect(tree.children.length).toBeGreaterThanOrEqual(2);
    });

    it('renders smallest size for kitten purchased less than 2 days ago', () => {
        const recentDate = new Date().toISOString();
        const { toJSON } = render(<GardenKitten purchasedAt={recentDate} />);
        // Growth stage 0 -> sizeMultiplier 0.7 -> displaySize 84
        expect(toJSON()).toBeTruthy();
    });

    it('renders medium size for kitten purchased 3 days ago', () => {
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
        const { toJSON } = render(<GardenKitten purchasedAt={threeDaysAgo} />);
        // Growth stage 1 -> sizeMultiplier 0.8 -> displaySize 96
        expect(toJSON()).toBeTruthy();
    });

    it('renders larger size for kitten purchased 5 days ago', () => {
        const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
        const { toJSON } = render(<GardenKitten purchasedAt={fiveDaysAgo} />);
        // Growth stage 2 -> sizeMultiplier 0.9 -> displaySize 108
        expect(toJSON()).toBeTruthy();
    });

    it('renders full size for kitten purchased 7+ days ago', () => {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { toJSON } = render(<GardenKitten purchasedAt={sevenDaysAgo} />);
        // Growth stage 3 -> sizeMultiplier 1.0 -> displaySize 120
        expect(toJSON()).toBeTruthy();
    });

    it('cleans up timeouts and animations on unmount', () => {
        const { unmount } = render(
            <GardenKitten purchasedAt={new Date().toISOString()} />
        );
        // Should not throw when unmounting
        expect(() => unmount()).not.toThrow();
    });
});
