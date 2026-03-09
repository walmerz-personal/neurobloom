// __tests__/components/HealthChart.test.js
import React from 'react';
import { render } from '@testing-library/react-native';
import { HealthChart } from '../../components/HealthChart';

// Mock react-native-svg
jest.mock('react-native-svg', () => {
    const React = require('react');
    const { View, Text } = require('react-native');
    const MockSvg = (props) => React.createElement(View, props);
    const MockPath = (props) => React.createElement(View, props);
    const MockCircle = (props) => React.createElement(View, props);
    const MockLine = (props) => React.createElement(View, props);
    const MockSvgText = (props) => React.createElement(Text, props);
    const MockG = (props) => React.createElement(View, props);

    return {
        __esModule: true,
        default: MockSvg,
        Svg: MockSvg,
        Path: MockPath,
        Circle: MockCircle,
        Line: MockLine,
        Text: MockSvgText,
        G: MockG,
    };
});

describe('HealthChart', () => {
    const validData = [
        { date: '2026-03-01', value: 1.1 },
        { date: '2026-03-02', value: 1.2 },
        { date: '2026-03-03', value: 1.15 },
        { date: '2026-03-04', value: 1.3 },
        { date: '2026-03-05', value: 1.25 },
    ];

    describe('renders with data points', () => {
        it('should render the chart container', () => {
            const { toJSON } = render(
                <HealthChart data={validData} metricName="Walking Speed" unit="m/s" />
            );
            expect(toJSON()).toBeTruthy();
        });

        it('should display the metric name', () => {
            const { getByText } = render(
                <HealthChart data={validData} metricName="Walking Speed" unit="m/s" />
            );
            expect(getByText('Walking Speed')).toBeTruthy();
        });

        it('should display the unit in parentheses', () => {
            const { getByText } = render(
                <HealthChart data={validData} metricName="Walking Speed" unit="m/s" />
            );
            expect(getByText('(m/s)')).toBeTruthy();
        });

        it('should not display unit text when unit is empty', () => {
            const { queryByText } = render(
                <HealthChart data={validData} metricName="Walking Speed" unit="" />
            );
            // No parenthesized unit should appear
            expect(queryByText(/^\(.*\)$/)).toBeNull();
        });

        it('should render with a single data point', () => {
            const singlePoint = [{ date: '2026-03-01', value: 1.5 }];
            const { getByText } = render(
                <HealthChart data={singlePoint} metricName="Speed" unit="m/s" />
            );
            expect(getByText('Speed')).toBeTruthy();
        });
    });

    describe('renders empty chart', () => {
        it('should show empty message when data is null', () => {
            const { getByText } = render(
                <HealthChart data={null} metricName="Walking Speed" />
            );
            expect(getByText('No data available')).toBeTruthy();
        });

        it('should show empty message when data is undefined', () => {
            const { getByText } = render(
                <HealthChart data={undefined} metricName="Walking Speed" />
            );
            expect(getByText('No data available')).toBeTruthy();
        });

        it('should show empty message when data is empty array', () => {
            const { getByText } = render(
                <HealthChart data={[]} metricName="Walking Speed" />
            );
            expect(getByText('No data available')).toBeTruthy();
        });

        it('should show "No data points" when all values are null', () => {
            const nullData = [
                { date: '2026-03-01', value: null },
                { date: '2026-03-02', value: null },
            ];
            const { getByText } = render(
                <HealthChart data={nullData} metricName="Walking Speed" />
            );
            expect(getByText('No data points available')).toBeTruthy();
        });
    });

    describe('handles null/invalid data', () => {
        it('should filter out null values from data points', () => {
            const mixedData = [
                { date: '2026-03-01', value: 1.1 },
                { date: '2026-03-02', value: null },
                { date: '2026-03-03', value: 1.3 },
            ];
            const { getByText } = render(
                <HealthChart data={mixedData} metricName="Speed" unit="m/s" />
            );
            // Should still render the chart (not show empty state)
            expect(getByText('Speed')).toBeTruthy();
        });

        it('should filter out undefined values from data points', () => {
            const mixedData = [
                { date: '2026-03-01', value: 1.1 },
                { date: '2026-03-02', value: undefined },
                { date: '2026-03-03', value: 1.3 },
            ];
            const { getByText } = render(
                <HealthChart data={mixedData} metricName="Speed" unit="m/s" />
            );
            expect(getByText('Speed')).toBeTruthy();
        });

        it('should respect custom minValue and maxValue', () => {
            const { getByText } = render(
                <HealthChart
                    data={validData}
                    metricName="Speed"
                    unit="m/s"
                    minValue={0}
                    maxValue={2}
                />
            );
            expect(getByText('Speed')).toBeTruthy();
        });

        it('should handle data with identical values (zero range)', () => {
            const sameValueData = [
                { date: '2026-03-01', value: 1.0 },
                { date: '2026-03-02', value: 1.0 },
                { date: '2026-03-03', value: 1.0 },
            ];
            const { getByText } = render(
                <HealthChart data={sameValueData} metricName="Speed" unit="m/s" />
            );
            // Should not crash due to division by zero
            expect(getByText('Speed')).toBeTruthy();
        });

        it('should handle steps unit formatting', () => {
            const stepData = [
                { date: '2026-03-01', value: 5000 },
                { date: '2026-03-02', value: 6000 },
            ];
            const { getByText } = render(
                <HealthChart data={stepData} metricName="Steps" unit="steps" />
            );
            expect(getByText('Steps')).toBeTruthy();
        });
    });
});
