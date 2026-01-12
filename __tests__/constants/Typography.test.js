// __tests__/constants/Typography.test.js
import { Typography } from '../../constants/Typography';

describe('Typography', () => {
    describe('Typography Definitions', () => {
        it('should define all typography styles', () => {
            expect(Typography.title1).toBeDefined();
            expect(Typography.title2).toBeDefined();
            expect(Typography.title3).toBeDefined();
            expect(Typography.headline).toBeDefined();
            expect(Typography.body).toBeDefined();
            expect(Typography.callout).toBeDefined();
            expect(Typography.subhead).toBeDefined();
            expect(Typography.footnote).toBeDefined();
            expect(Typography.caption1).toBeDefined();
            expect(Typography.caption2).toBeDefined();
        });
    });

    describe('Font Size Validation', () => {
        it('should have numeric font sizes', () => {
            Object.values(Typography).forEach(style => {
                expect(typeof style.fontSize).toBe('number');
                expect(style.fontSize).toBeGreaterThan(0);
            });
        });

        it('should have proper font size hierarchy', () => {
            expect(Typography.title1.fontSize).toBeGreaterThan(Typography.title2.fontSize);
            expect(Typography.title2.fontSize).toBeGreaterThan(Typography.title3.fontSize);
            expect(Typography.title3.fontSize).toBeGreaterThan(Typography.headline.fontSize);
        });

        it('should have smallest size for caption2', () => {
            const allSizes = Object.values(Typography).map(style => style.fontSize);
            const minSize = Math.min(...allSizes);
            expect(Typography.caption2.fontSize).toBe(minSize);
        });

        it('should have largest size for title1', () => {
            const allSizes = Object.values(Typography).map(style => style.fontSize);
            const maxSize = Math.max(...allSizes);
            expect(Typography.title1.fontSize).toBe(maxSize);
        });

        it('should have specific size values', () => {
            expect(Typography.title1.fontSize).toBe(34);
            expect(Typography.title2.fontSize).toBe(28);
            expect(Typography.title3.fontSize).toBe(22);
            expect(Typography.body.fontSize).toBe(17);
            expect(Typography.caption2.fontSize).toBe(11);
        });
    });

    describe('Font Weight Validation', () => {

        it('should use serif display font for titles', () => {
            // Check fontFamily is DMSerifDisplay
            expect(Typography.title1.fontFamily).toMatch(/DMSerifDisplay/);
            expect(Typography.title2.fontFamily).toMatch(/DMSerifDisplay/);
        });

        it('should use semibold weight for headline', () => {
            expect(Typography.headline.fontFamily).toMatch(/SemiBold|600/);
        });

        it('should use serif display for title3', () => {
            expect(Typography.title3.fontFamily).toMatch(/DMSerifDisplay/);
        });

        it('should use regular weight for body text', () => {
            expect(Typography.body.fontFamily).toMatch(/Regular|400/);
            expect(Typography.callout.fontFamily).toMatch(/Regular|400/);
            expect(Typography.footnote.fontFamily).toMatch(/Regular|400/);
        });

        it('should have string font families', () => {
            Object.values(Typography).forEach(style => {
                expect(typeof style.fontFamily).toBe('string');
            });
        });
    });

    describe('Color Validation', () => {
        it('should have color defined for all styles', () => {
            Object.values(Typography).forEach(style => {
                expect(style.color).toBeDefined();
                expect(typeof style.color).toBe('string');
            });
        });

        it('should use primary text color for titles', () => {
            expect(Typography.title1.color).toBe('#1d1d1f');
            expect(Typography.title2.color).toBe('#1d1d1f');
            expect(Typography.title3.color).toBe('#1d1d1f');
        });

        it('should use secondary text color for subtexts', () => {
            expect(Typography.subhead.color).toBe('#6e6e73');
            expect(Typography.footnote.color).toBe('#6e6e73');
            expect(Typography.caption1.color).toBe('#6e6e73');
            expect(Typography.caption2.color).toBe('#6e6e73');
        });

        it('should have valid hex color format', () => {
            const hexPattern = /^#[0-9A-Fa-f]{6}$/;

            Object.values(Typography).forEach(style => {
                expect(style.color).toMatch(hexPattern);
            });
        });
    });

    describe('Line Height Validation', () => {
        it('body should have line height defined', () => {
            expect(Typography.body.lineHeight).toBeDefined();
            expect(typeof Typography.body.lineHeight).toBe('number');
            expect(Typography.body.lineHeight).toBe(24);
        });

        it('body line height should be greater than font size', () => {
            expect(Typography.body.lineHeight).toBeGreaterThan(Typography.body.fontSize);
        });
    });

    describe('Typography Consistency', () => {
        it('should have all required properties for each style', () => {
            Object.entries(Typography).forEach(([key, style]) => {
                expect(style).toHaveProperty('fontSize');
                expect(style).toHaveProperty('fontFamily');
                expect(style).toHaveProperty('color');
            });
        });

        it('should have consistent caption sizes descending', () => {
            expect(Typography.caption1.fontSize).toBeGreaterThan(Typography.caption2.fontSize);
        });

        it('should have body and callout similar sizes', () => {
            expect(Math.abs(Typography.body.fontSize - Typography.callout.fontSize)).toBeLessThanOrEqual(1);
        });
    });

    describe('Accessibility', () => {
        it('should have minimum readable font size', () => {
            Object.values(Typography).forEach(style => {
                // Even smallest text should be at least 11px
                expect(style.fontSize).toBeGreaterThanOrEqual(11);
            });
        });

        it('should have sufficient contrast colors', () => {
            // Main text should be dark (#1d1d1f)
            expect(Typography.body.color).toBe('#1d1d1f');
            expect(Typography.headline.color).toBe('#1d1d1f');
        });
    });

    describe('Type System Coverage', () => {
        it('should have at least 10 typography variants', () => {
            const variantCount = Object.keys(Typography).length;
            expect(variantCount).toBeGreaterThanOrEqual(10);
        });

        it('should cover all common use cases', () => {
            const requiredStyles = [
                'title1', 'title2', 'title3',
                'headline', 'body', 'callout',
                'subhead', 'footnote', 'caption1', 'caption2'
            ];

            requiredStyles.forEach(style => {
                expect(Typography[style]).toBeDefined();
            });
        });
    });
});
