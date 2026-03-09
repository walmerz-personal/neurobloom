// __tests__/components/HealthMetricsCard.test.js
import React from 'react';
import { render } from '@testing-library/react-native';
import { HealthMetricsCard } from '../../components/HealthMetricsCard';

describe('HealthMetricsCard', () => {
    const validMetrics = {
        walkingSteadiness: 'OK',
        walkingSpeedAvg: 1.2,
        stepCount: 5432,
        distanceWalked: 3200,
    };

    describe('renders with valid health data', () => {
        it('should render the card title', () => {
            const { getByText } = render(<HealthMetricsCard metrics={validMetrics} />);
            expect(getByText('Mobility Metrics')).toBeTruthy();
        });

        it('should render the steadiness badge with "Good" for OK steadiness', () => {
            const { getByText } = render(<HealthMetricsCard metrics={validMetrics} />);
            expect(getByText('Good')).toBeTruthy();
        });

        it('should render "Low" steadiness label', () => {
            const metrics = { ...validMetrics, walkingSteadiness: 'Low' };
            const { getByText } = render(<HealthMetricsCard metrics={metrics} />);
            expect(getByText('Low')).toBeTruthy();
        });

        it('should render "Very Low" steadiness label and alert box', () => {
            const metrics = { ...validMetrics, walkingSteadiness: 'Very Low' };
            const { getByText } = render(<HealthMetricsCard metrics={metrics} />);
            expect(getByText('Very Low')).toBeTruthy();
            expect(getByText(/walking steadiness is very low/i)).toBeTruthy();
        });

        it('should render "Unknown" for unrecognized steadiness value', () => {
            const metrics = { ...validMetrics, walkingSteadiness: 'Something Else' };
            const { getByText } = render(<HealthMetricsCard metrics={metrics} />);
            expect(getByText('Unknown')).toBeTruthy();
        });
    });

    describe('renders empty/loading state', () => {
        it('should render empty state when metrics is null', () => {
            const { getByText } = render(<HealthMetricsCard metrics={null} />);
            expect(getByText('No health data available')).toBeTruthy();
            expect(getByText(/Connect Apple Health/)).toBeTruthy();
        });

        it('should render empty state when metrics is undefined', () => {
            const { getByText } = render(<HealthMetricsCard metrics={undefined} />);
            expect(getByText('No health data available')).toBeTruthy();
        });
    });

    describe('displays metric values correctly', () => {
        it('should display walking speed in cm/s', () => {
            const { getByText } = render(<HealthMetricsCard metrics={validMetrics} />);
            // 1.2 m/s * 100 = 120 cm/s
            expect(getByText('120 cm/s')).toBeTruthy();
        });

        it('should display step count with locale formatting', () => {
            const { getByText } = render(<HealthMetricsCard metrics={validMetrics} />);
            expect(getByText('5,432')).toBeTruthy();
        });

        it('should display distance in km when >= 1000m', () => {
            const { getByText } = render(<HealthMetricsCard metrics={validMetrics} />);
            // 3200m = 3.20 km
            expect(getByText('3.20 km')).toBeTruthy();
        });

        it('should display distance in meters when < 1000m', () => {
            const metrics = { ...validMetrics, distanceWalked: 500 };
            const { getByText } = render(<HealthMetricsCard metrics={metrics} />);
            expect(getByText('500 m')).toBeTruthy();
        });

        it('should display dash for missing walking speed', () => {
            const metrics = { ...validMetrics, walkingSpeedAvg: null };
            const { getAllByText } = render(<HealthMetricsCard metrics={metrics} />);
            // At least one dash for the missing speed
            expect(getAllByText('—').length).toBeGreaterThanOrEqual(1);
        });

        it('should display dash for missing step count', () => {
            const metrics = { ...validMetrics, stepCount: 0 };
            const { getAllByText } = render(<HealthMetricsCard metrics={metrics} />);
            expect(getAllByText('—').length).toBeGreaterThanOrEqual(1);
        });

        it('should display dash for missing distance', () => {
            const metrics = { ...validMetrics, distanceWalked: null };
            const { getAllByText } = render(<HealthMetricsCard metrics={metrics} />);
            expect(getAllByText('—').length).toBeGreaterThanOrEqual(1);
        });

        it('should show details section when showDetails is true', () => {
            const metrics = {
                ...validMetrics,
                walkingStepLengthAvg: 0.65,
                walkingAsymmetryPercentage: 5.3,
            };
            const { getByText } = render(<HealthMetricsCard metrics={metrics} showDetails={true} />);
            expect(getByText('Step Length:')).toBeTruthy();
            expect(getByText('65 cm')).toBeTruthy();
            expect(getByText('Asymmetry:')).toBeTruthy();
            expect(getByText('5.3%')).toBeTruthy();
        });

        it('should not show details section when showDetails is false', () => {
            const metrics = {
                ...validMetrics,
                walkingStepLengthAvg: 0.65,
            };
            const { queryByText } = render(<HealthMetricsCard metrics={metrics} showDetails={false} />);
            expect(queryByText('Step Length:')).toBeNull();
        });
    });
});
