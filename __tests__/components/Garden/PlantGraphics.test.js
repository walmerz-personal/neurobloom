// __tests__/components/Garden/PlantGraphics.test.js
import React from 'react';
import { render } from '@testing-library/react-native';
import {
    RoseGraphic,
    LavenderGraphic,
    SunflowerGraphic,
    OakTreeGraphic,
    GenericFlowerGraphic,
    getPlantGraphic,
} from '../../../components/Garden/PlantGraphics';

// react-native-svg is not mocked globally, so mock it here
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

describe('PlantGraphics', () => {
    describe('RoseGraphic', () => {
        it('renders without crashing', () => {
            const { toJSON } = render(<RoseGraphic />);
            expect(toJSON()).toBeTruthy();
        });

        it('renders with custom size', () => {
            const { toJSON: small } = render(<RoseGraphic size={40} />);
            const { toJSON: large } = render(<RoseGraphic size={120} />);
            expect(small()).toBeTruthy();
            expect(large()).toBeTruthy();
        });

        it('uses default size of 80', () => {
            const { getAllByTestId } = render(<RoseGraphic />);
            const svgs = getAllByTestId('Svg');
            // The root Svg should have width=80
            expect(svgs[0].props.width).toBe(80);
        });
    });

    describe('LavenderGraphic', () => {
        it('renders without crashing', () => {
            const { toJSON } = render(<LavenderGraphic />);
            expect(toJSON()).toBeTruthy();
        });

        it('renders with custom size', () => {
            const { toJSON } = render(<LavenderGraphic size={60} />);
            expect(toJSON()).toBeTruthy();
        });
    });

    describe('SunflowerGraphic', () => {
        it('renders without crashing', () => {
            const { toJSON } = render(<SunflowerGraphic />);
            expect(toJSON()).toBeTruthy();
        });

        it('renders with custom size', () => {
            const { toJSON } = render(<SunflowerGraphic size={100} />);
            expect(toJSON()).toBeTruthy();
        });
    });

    describe('OakTreeGraphic', () => {
        it('renders without crashing', () => {
            const { toJSON } = render(<OakTreeGraphic />);
            expect(toJSON()).toBeTruthy();
        });

        it('renders with custom size', () => {
            const { toJSON } = render(<OakTreeGraphic size={50} />);
            expect(toJSON()).toBeTruthy();
        });
    });

    describe('GenericFlowerGraphic', () => {
        it('renders without crashing', () => {
            const { toJSON } = render(<GenericFlowerGraphic />);
            expect(toJSON()).toBeTruthy();
        });

        it('renders with custom size and color', () => {
            const { toJSON } = render(<GenericFlowerGraphic size={90} color="#FF0000" />);
            expect(toJSON()).toBeTruthy();
        });

        it('uses default color when none provided', () => {
            const { toJSON } = render(<GenericFlowerGraphic />);
            expect(toJSON()).toBeTruthy();
        });
    });

    describe('getPlantGraphic', () => {
        it('returns RoseGraphic for plant names containing "rose"', () => {
            const result = getPlantGraphic('Red Rose', 80);
            expect(result).toBeTruthy();
            expect(result.type).toBe(RoseGraphic);
        });

        it('returns LavenderGraphic for plant names containing "lavender"', () => {
            const result = getPlantGraphic('Lavender Bloom', 80);
            expect(result).toBeTruthy();
            expect(result.type).toBe(LavenderGraphic);
        });

        it('returns SunflowerGraphic for plant names containing "sunflower"', () => {
            const result = getPlantGraphic('Golden Sunflower', 80);
            expect(result).toBeTruthy();
            expect(result.type).toBe(SunflowerGraphic);
        });

        it('returns OakTreeGraphic for plant names containing "oak"', () => {
            const result = getPlantGraphic('Oak Tree', 80);
            expect(result).toBeTruthy();
            expect(result.type).toBe(OakTreeGraphic);
        });

        it('returns OakTreeGraphic for plant names containing "tree"', () => {
            const result = getPlantGraphic('Cherry Tree', 80);
            expect(result).toBeTruthy();
            expect(result.type).toBe(OakTreeGraphic);
        });

        it('returns GenericFlowerGraphic for unknown plant names', () => {
            const result = getPlantGraphic('Cactus', 80);
            expect(result).toBeTruthy();
            expect(result.type).toBe(GenericFlowerGraphic);
        });

        it('returns GenericFlowerGraphic when plantName is null', () => {
            const result = getPlantGraphic(null, 80);
            expect(result).toBeTruthy();
            expect(result.type).toBe(GenericFlowerGraphic);
        });

        it('returns GenericFlowerGraphic when plantName is undefined', () => {
            const result = getPlantGraphic(undefined, 80);
            expect(result).toBeTruthy();
            expect(result.type).toBe(GenericFlowerGraphic);
        });

        it('is case-insensitive', () => {
            expect(getPlantGraphic('ROSE').type).toBe(RoseGraphic);
            expect(getPlantGraphic('LAVENDER').type).toBe(LavenderGraphic);
            expect(getPlantGraphic('SUNFLOWER').type).toBe(SunflowerGraphic);
        });

        it('passes size to the returned component', () => {
            const result = getPlantGraphic('Rose', 120);
            expect(result.props.size).toBe(120);
        });

        it('defaults size to 80', () => {
            const result = getPlantGraphic('Rose');
            expect(result.props.size).toBe(80);
        });
    });
});
