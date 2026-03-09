// __tests__/components/Logo.test.js
import React from 'react';
import { render } from '@testing-library/react-native';
import Logo from '../../components/Logo';

describe('Logo', () => {
    it('should render without crashing', () => {
        const { toJSON } = render(<Logo />);
        expect(toJSON()).toBeTruthy();
    });

    it('should render an Image element', () => {
        const { root } = render(<Logo />);
        // The root element should be an Image with resizeMode contain
        expect(root.props.resizeMode).toBe('contain');
    });

    it('should apply default styles', () => {
        const { root } = render(<Logo />);
        const style = root.props.style;
        // Style is an array [defaultStyles, customStyle]
        const flatStyle = Array.isArray(style)
            ? Object.assign({}, ...style.filter(Boolean))
            : style;
        expect(flatStyle.width).toBe(40);
        expect(flatStyle.height).toBe(40);
    });

    it('should apply custom style prop', () => {
        const customStyle = { width: 80, height: 80 };
        const { root } = render(<Logo style={customStyle} />);
        const style = root.props.style;
        // Style array should include the custom style
        const flatStyle = Array.isArray(style)
            ? Object.assign({}, ...style.filter(Boolean))
            : style;
        expect(flatStyle.width).toBe(80);
        expect(flatStyle.height).toBe(80);
    });

    it('should render with undefined style prop', () => {
        const { root } = render(<Logo style={undefined} />);
        const style = root.props.style;
        const flatStyle = Array.isArray(style)
            ? Object.assign({}, ...style.filter(Boolean))
            : style;
        expect(flatStyle.width).toBe(40);
        expect(flatStyle.height).toBe(40);
    });
});
