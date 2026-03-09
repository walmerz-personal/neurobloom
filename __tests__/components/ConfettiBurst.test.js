// __tests__/components/ConfettiBurst.test.js
import React from 'react';
import { render } from '@testing-library/react-native';
import { ConfettiBurst } from '../../components/ConfettiBurst';

describe('ConfettiBurst', () => {
    it('should render nothing when trigger is false', () => {
        const { toJSON } = render(
            <ConfettiBurst trigger={false} />
        );
        expect(toJSON()).toBeNull();
    });

    it('should render particles when trigger is true', () => {
        const { toJSON } = render(
            <ConfettiBurst trigger={true} />
        );
        expect(toJSON()).toBeTruthy();
    });

    it('should render default 8 particles when trigger is true', () => {
        const { toJSON } = render(
            <ConfettiBurst trigger={true} />
        );
        const tree = toJSON();
        // The container View should have 8 children (particles)
        expect(tree.children).toHaveLength(8);
    });

    it('should render custom number of particles', () => {
        const { toJSON } = render(
            <ConfettiBurst trigger={true} particleCount={4} />
        );
        const tree = toJSON();
        expect(tree.children).toHaveLength(4);
    });

    it('should render with 1 particle', () => {
        const { toJSON } = render(
            <ConfettiBurst trigger={true} particleCount={1} />
        );
        const tree = toJSON();
        expect(tree.children).toHaveLength(1);
    });

    it('should accept onComplete callback without crashing', () => {
        const mockOnComplete = jest.fn();
        const { toJSON } = render(
            <ConfettiBurst trigger={true} onComplete={mockOnComplete} />
        );
        expect(toJSON()).toBeTruthy();
    });

    it('should render nothing when trigger is undefined', () => {
        const { toJSON } = render(
            <ConfettiBurst trigger={undefined} />
        );
        expect(toJSON()).toBeNull();
    });

    it('should have pointerEvents none on container', () => {
        const { toJSON } = render(
            <ConfettiBurst trigger={true} />
        );
        const tree = toJSON();
        expect(tree.props.pointerEvents).toBe('none');
    });
});
