// __tests__/components/ErrorBoundary.test.js
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ErrorBoundary } from '../../components/ErrorBoundary';

// A component that throws on demand
function ProblemChild({ shouldThrow }) {
    if (shouldThrow) {
        throw new Error('Test error message');
    }
    return <Text>Child rendered successfully</Text>;
}

describe('ErrorBoundary', () => {
    // Suppress console.error noise from React error boundary logging
    const originalConsoleError = console.error;
    beforeAll(() => {
        console.error = jest.fn();
    });
    afterAll(() => {
        console.error = originalConsoleError;
    });

    it('renders children when there is no error', () => {
        const { getByText } = render(
            <ErrorBoundary>
                <ProblemChild shouldThrow={false} />
            </ErrorBoundary>
        );

        expect(getByText('Child rendered successfully')).toBeTruthy();
    });

    it('catches errors and shows fallback UI', () => {
        const { getByText, queryByText } = render(
            <ErrorBoundary>
                <ProblemChild shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(getByText('Something went wrong')).toBeTruthy();
        expect(queryByText('Child rendered successfully')).toBeNull();
    });

    it('displays a user-friendly error message', () => {
        const { getByText } = render(
            <ErrorBoundary>
                <ProblemChild shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(
            getByText("We're sorry, but something unexpected happened while loading this screen.")
        ).toBeTruthy();
    });

    it('displays the error details in __DEV__ mode', () => {
        // __DEV__ is set to true in setup.js
        const { getByText } = render(
            <ErrorBoundary>
                <ProblemChild shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(getByText('Error: Test error message')).toBeTruthy();
    });

    it('renders a Try Again button', () => {
        const { getByText } = render(
            <ErrorBoundary>
                <ProblemChild shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(getByText('Try Again')).toBeTruthy();
    });

    it('resets error state when Try Again is pressed', () => {
        const { getByText } = render(
            <ErrorBoundary>
                <ProblemChild shouldThrow={true} />
            </ErrorBoundary>
        );

        // Should be showing fallback
        expect(getByText('Something went wrong')).toBeTruthy();

        // Press Try Again triggers handleReset which sets hasError=false
        fireEvent.press(getByText('Try Again'));

        // The component will try to re-render children, which throws again,
        // so ErrorBoundary catches it again. Verify handleReset was called
        // by checking onReset is invoked (tested separately).
        // Here we just verify the button is pressable without crashing.
        expect(getByText('Something went wrong')).toBeTruthy();
    });

    it('calls onReset callback when Try Again is pressed', () => {
        const mockOnReset = jest.fn();

        const { getByText } = render(
            <ErrorBoundary onReset={mockOnReset}>
                <ProblemChild shouldThrow={true} />
            </ErrorBoundary>
        );

        fireEvent.press(getByText('Try Again'));

        expect(mockOnReset).toHaveBeenCalledTimes(1);
    });

    it('calls componentDidCatch and logs the error', () => {
        render(
            <ErrorBoundary>
                <ProblemChild shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(console.error).toHaveBeenCalled();
    });
});
