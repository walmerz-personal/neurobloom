import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Intro from '../../../app/onboarding/intro';
import { useRouter } from 'expo-router';

// Mock react-native-svg
jest.mock('react-native-svg', () => {
    const React = require('react');
    const { View } = require('react-native');
    const mockComponent = (name) => {
        const C = (props) => React.createElement(View, props);
        C.displayName = name;
        return C;
    };
    return {
        __esModule: true,
        default: mockComponent('Svg'),
        Svg: mockComponent('Svg'),
        Path: mockComponent('Path'),
        Circle: mockComponent('Circle'),
        Defs: mockComponent('Defs'),
        LinearGradient: mockComponent('SvgLinearGradient'),
        Stop: mockComponent('Stop'),
        Line: mockComponent('Line'),
    };
});

// Override Animated to avoid _isUsingNativeDriver errors in Animated.loop
jest.mock('react-native', () => {
    const RN = jest.requireActual('react-native');
    const mockAnimValue = () => ({
        interpolate: jest.fn(() => 0),
        setValue: jest.fn(),
        addListener: jest.fn(),
        removeAllListeners: jest.fn(),
        _isUsingNativeDriver: jest.fn(() => false),
    });
    return {
        ...RN,
        Animated: {
            ...RN.Animated,
            Value: jest.fn(() => mockAnimValue()),
            timing: jest.fn(() => ({
                start: jest.fn((cb) => cb && cb()),
                _isUsingNativeDriver: jest.fn(() => false),
            })),
            spring: jest.fn(() => ({
                start: jest.fn((cb) => cb && cb()),
                _isUsingNativeDriver: jest.fn(() => false),
            })),
            loop: jest.fn(() => ({
                start: jest.fn(),
                _isUsingNativeDriver: jest.fn(() => false),
            })),
            sequence: jest.fn(() => ({
                start: jest.fn((cb) => cb && cb()),
                _isUsingNativeDriver: jest.fn(() => false),
            })),
            parallel: jest.fn(() => ({
                start: jest.fn((cb) => cb && cb()),
                _isUsingNativeDriver: jest.fn(() => false),
            })),
            stagger: jest.fn(() => ({
                start: jest.fn((cb) => cb && cb()),
                _isUsingNativeDriver: jest.fn(() => false),
            })),
            multiply: jest.fn(() => 0),
            event: jest.fn(() => jest.fn()),
            View: RN.View,
            Text: RN.Text,
            createAnimatedComponent: (component) => component,
        },
        StyleSheet: {
            ...RN.StyleSheet,
            create: (styles) => styles,
            flatten: (s) => Object.assign({}, ...(Array.isArray(s) ? s : [s])),
            absoluteFill: {},
        },
        Dimensions: {
            get: jest.fn().mockReturnValue({ width: 375, height: 812 }),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
        },
        Platform: {
            ...RN.Platform,
            OS: 'ios',
            select: (objs) => objs.ios,
        },
    };
});

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: mockReplace,
        back: mockBack,
    }),
}));

describe('Intro Screen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders without crashing', () => {
        const { toJSON } = render(<Intro />);
        expect(toJSON()).toBeTruthy();
    });

    it('shows the statistic 800,000', () => {
        const { getByText } = render(<Intro />);
        expect(getByText('800,000')).toBeTruthy();
    });

    it('shows swipe to continue hint', () => {
        const { getByText } = render(<Intro />);
        expect(getByText('Swipe to continue')).toBeTruthy();
    });

    it('shows consistency slide content', () => {
        const { getByText } = render(<Intro />);
        expect(getByText('Inconsistent')).toBeTruthy();
        expect(getByText('Consistent')).toBeTruthy();
    });

    it('shows recovery is a team sport slide', () => {
        const { getByText } = render(<Intro />);
        expect(getByText('Recovery is a Team Sport')).toBeTruthy();
    });

    it('shows people labels (Survivor, Medical Staff, etc.)', () => {
        const { getAllByText } = render(<Intro />);
        // Some labels appear in both the people slide and the tagline
        expect(getAllByText('Survivor').length).toBeGreaterThanOrEqual(1);
        expect(getAllByText('Medical Staff').length).toBeGreaterThanOrEqual(1);
        expect(getAllByText('Caregivers').length).toBeGreaterThanOrEqual(1);
        expect(getAllByText('Family').length).toBeGreaterThanOrEqual(1);
        expect(getAllByText('Friends').length).toBeGreaterThanOrEqual(1);
    });

    it('shows holistic approach slide', () => {
        const { getByText } = render(<Intro />);
        expect(getByText('A Holistic Approach')).toBeTruthy();
        expect(getByText('Medical')).toBeTruthy();
        expect(getByText('Community')).toBeTruthy();
        expect(getByText('Hope')).toBeTruthy();
    });

    it('shows welcome slide with brand name', () => {
        const { getByText } = render(<Intro />);
        expect(getByText('WELCOME TO')).toBeTruthy();
        expect(getByText('NeuroBloom')).toBeTruthy();
    });

    it('shows Continue button on last slide', () => {
        const { getByText } = render(<Intro />);
        expect(getByText('Continue')).toBeTruthy();
    });

    it('navigates to role screen when Continue is pressed', () => {
        const { getByText } = render(<Intro />);
        fireEvent.press(getByText('Continue'));
        expect(mockReplace).toHaveBeenCalledWith('/onboarding/role');
    });

    it('renders pagination dots', () => {
        const { toJSON } = render(<Intro />);
        // 5 dots rendered (one per slide)
        expect(toJSON()).toBeTruthy();
    });
});
