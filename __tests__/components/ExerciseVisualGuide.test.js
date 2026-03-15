// __tests__/components/ExerciseVisualGuide.test.js
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { EXERCISE_VISUAL_GUIDES } from '../../constants/exerciseVisualGuides';
import { ExerciseVisualGuide, getExerciseHasVisualGuide } from '../../components/ExerciseVisualGuide';

// Use real a1 guide (Shoulder Shrugs). Modal: render children in tree so getByText finds them.
jest.mock('react-native', () => {
    const React = require('react');
    const RN = jest.requireActual('react-native');
    return {
        ...RN,
        Modal: ({ children, visible, ...props }) =>
            visible ? React.createElement(RN.View, { ...props, testID: 'modal-content' }, children) : null,
        Animated: {
            ...RN.Animated,
            timing: () => ({ start: (cb) => typeof cb === 'function' && cb({ finished: true }) }),
        },
    };
});

describe('ExerciseVisualGuide', () => {
    it('returns null when guide does not exist for exerciseId', () => {
        const { toJSON } = render(
            <ExerciseVisualGuide visible={true} exerciseId="nonexistent-id" onClose={() => {}} />
        );
        expect(toJSON()).toBeNull();
    });

    it('renders modal with title and Visual Guide when visible with valid id', async () => {
        const a1 = EXERCISE_VISUAL_GUIDES.a1;
        const { getByText } = render(
            <ExerciseVisualGuide visible={true} exerciseId="a1" onClose={() => {}} />
        );
        await waitFor(() => {
            expect(getByText(a1.title)).toBeTruthy();
            expect(getByText('Visual Guide')).toBeTruthy();
        });
    });

    it('shows step 1 content and step counter', async () => {
        const a1 = EXERCISE_VISUAL_GUIDES.a1;
        const { getByText } = render(
            <ExerciseVisualGuide visible={true} exerciseId="a1" onClose={() => {}} />
        );
        await waitFor(() => {
            expect(getByText(a1.steps[0].instruction)).toBeTruthy();
            expect(getByText(a1.steps[0].lillyTip)).toBeTruthy();
            expect(getByText(`Step 1 of ${a1.steps.length}`)).toBeTruthy();
        });
    });

    it('shows Lilly says header', async () => {
        const { getByText } = render(
            <ExerciseVisualGuide visible={true} exerciseId="a1" onClose={() => {}} />
        );
        await waitFor(() => expect(getByText('Lilly says')).toBeTruthy());
    });

    it('shows Hold badge when step has holdSeconds', async () => {
        const a1 = EXERCISE_VISUAL_GUIDES.a1;
        const stepWithHold = a1.steps.find((s) => s.holdSeconds);
        const { getByText, getByTestId } = render(
            <ExerciseVisualGuide visible={true} exerciseId="a1" onClose={() => {}} />
        );
        await waitFor(() => expect(getByText(`Step 1 of ${a1.steps.length}`)).toBeTruthy());
        fireEvent.press(getByTestId('visual-guide-next'));
        if (stepWithHold) {
            await waitFor(() => expect(getByText(`Hold ${stepWithHold.holdSeconds}s`)).toBeTruthy());
        }
    });

    it('calls onClose when close button is pressed', async () => {
        const onClose = jest.fn();
        const { getByText, getByTestId } = render(
            <ExerciseVisualGuide visible={true} exerciseId="a1" onClose={onClose} />
        );
        await waitFor(() => expect(getByText('Visual Guide')).toBeTruthy());
        fireEvent.press(getByTestId('visual-guide-close'));
        expect(onClose).toHaveBeenCalled();
    });

    it('navigates to step 2 when second dot is pressed', async () => {
        const a1 = EXERCISE_VISUAL_GUIDES.a1;
        const { getByText, getByTestId } = render(
            <ExerciseVisualGuide visible={true} exerciseId="a1" onClose={() => {}} />
        );
        await waitFor(() => expect(getByText(`Step 1 of ${a1.steps.length}`)).toBeTruthy());
        fireEvent.press(getByTestId('visual-guide-dot-1'));
        await waitFor(() => {
            expect(getByText(a1.steps[1].instruction)).toBeTruthy();
            expect(getByText(`Step 2 of ${a1.steps.length}`)).toBeTruthy();
        });
    });
});

describe('getExerciseHasVisualGuide', () => {
    it('returns boolean for known and unknown ids', () => {
        expect(typeof getExerciseHasVisualGuide('a1')).toBe('boolean');
        expect(typeof getExerciseHasVisualGuide('unknown')).toBe('boolean');
    });
});
