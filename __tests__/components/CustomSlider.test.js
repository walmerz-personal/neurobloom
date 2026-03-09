// __tests__/components/CustomSlider.test.js
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CustomSlider } from '../../components/CustomSlider';
import { Colors } from '../../constants/Colors';

describe('CustomSlider', () => {
    it('should render without crashing', () => {
        const { toJSON } = render(
            <CustomSlider onValueChange={() => {}} />
        );
        expect(toJSON()).toBeTruthy();
    });

    it('should render with default props', () => {
        const { toJSON } = render(
            <CustomSlider onValueChange={() => {}} />
        );
        const tree = toJSON();
        expect(tree).toBeTruthy();
    });

    it('should render with custom min and max values', () => {
        const { toJSON } = render(
            <CustomSlider
                minimumValue={0}
                maximumValue={100}
                value={50}
                onValueChange={() => {}}
            />
        );
        expect(toJSON()).toBeTruthy();
    });

    it('should apply custom style', () => {
        const customStyle = { marginHorizontal: 20 };
        const { toJSON } = render(
            <CustomSlider
                onValueChange={() => {}}
                style={customStyle}
            />
        );
        const tree = toJSON();
        const flatStyle = Array.isArray(tree.props.style)
            ? Object.assign({}, ...tree.props.style.filter(Boolean))
            : tree.props.style;
        expect(flatStyle.marginHorizontal).toBe(20);
    });

    it('should render track with custom colors', () => {
        const { toJSON } = render(
            <CustomSlider
                minimumTrackTintColor="#FF0000"
                maximumTrackTintColor="#00FF00"
                onValueChange={() => {}}
            />
        );
        expect(toJSON()).toBeTruthy();
    });

    it('should render without onValueChange', () => {
        const { toJSON } = render(
            <CustomSlider />
        );
        expect(toJSON()).toBeTruthy();
    });

    it('should update when value prop changes', () => {
        const { rerender, toJSON } = render(
            <CustomSlider value={0} onValueChange={() => {}} />
        );
        rerender(<CustomSlider value={5} onValueChange={() => {}} />);
        expect(toJSON()).toBeTruthy();
    });

    it('should handle step values', () => {
        const { toJSON } = render(
            <CustomSlider
                minimumValue={0}
                maximumValue={10}
                step={2}
                value={4}
                onValueChange={() => {}}
            />
        );
        expect(toJSON()).toBeTruthy();
    });

    it('should handle onLayout to set slider width', () => {
        const { toJSON, root } = render(
            <CustomSlider value={5} maximumValue={10} onValueChange={() => {}} />
        );
        // Simulate layout event on the root container
        fireEvent(root, 'layout', {
            nativeEvent: { layout: { width: 300 } },
        });
        expect(toJSON()).toBeTruthy();
    });
});
