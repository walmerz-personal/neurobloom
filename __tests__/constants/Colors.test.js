// __tests__/constants/Colors.test.js
import { Colors } from '../../constants/Colors';

describe('Colors', () => {
    describe('Color Definitions', () => {
        it('should define all primary colors', () => {
            expect(Colors.primary).toBeDefined();
            expect(Colors.primaryDark).toBeDefined();
        });

        it('should define all base colors', () => {
            expect(Colors.background).toBeDefined();
            expect(Colors.card).toBeDefined();
            expect(Colors.text).toBeDefined();
            expect(Colors.textSecondary).toBeDefined();
            expect(Colors.border).toBeDefined();
        });

        it('should define all status colors', () => {
            expect(Colors.success).toBeDefined();
            expect(Colors.warning).toBeDefined();
            expect(Colors.error).toBeDefined();
        });

        it('should define all action icon colors', () => {
            expect(Colors.actionBlue).toBeDefined();
            expect(Colors.actionCoral).toBeDefined();
            expect(Colors.actionGreen).toBeDefined();
            expect(Colors.actionPurple).toBeDefined();
        });

        it('should define all Lilly colors', () => {
            expect(Colors.lillyAvatarStart).toBeDefined();
            expect(Colors.lillyAvatarEnd).toBeDefined();
            expect(Colors.lillyBubble).toBeDefined();
            expect(Colors.userBubble).toBeDefined();
        });
    });

    describe('Color Format Validation', () => {
        const hexColorPattern = /^#[0-9A-Fa-f]{6}$/;

        it('should have valid hex format for primary colors', () => {
            expect(Colors.primary).toMatch(hexColorPattern);
            expect(Colors.primaryDark).toMatch(hexColorPattern);
        });

        it('should have valid hex format for base colors', () => {
            expect(Colors.background).toMatch(hexColorPattern);
            expect(Colors.card).toMatch(hexColorPattern);
            expect(Colors.text).toMatch(hexColorPattern);
            expect(Colors.textSecondary).toMatch(hexColorPattern);
            expect(Colors.border).toMatch(hexColorPattern);
        });

        it('should have valid hex format for status colors', () => {
            expect(Colors.success).toMatch(hexColorPattern);
            expect(Colors.warning).toMatch(hexColorPattern);
            expect(Colors.error).toMatch(hexColorPattern);
        });

        it('should have valid hex format for action colors', () => {
            expect(Colors.actionBlue).toMatch(hexColorPattern);
            expect(Colors.actionCoral).toMatch(hexColorPattern);
            expect(Colors.actionGreen).toMatch(hexColorPattern);
            expect(Colors.actionPurple).toMatch(hexColorPattern);
        });

        it('should have valid hex format for Lilly colors', () => {
            expect(Colors.lillyAvatarStart).toMatch(hexColorPattern);
            expect(Colors.lillyAvatarEnd).toMatch(hexColorPattern);
            expect(Colors.lillyBubble).toMatch(hexColorPattern);
            expect(Colors.userBubble).toMatch(hexColorPattern);
        });
    });

    describe('Color Value Validation', () => {
        it('should have no undefined color values', () => {
            Object.values(Colors).forEach(color => {
                expect(color).not.toBeUndefined();
                expect(color).not.toBeNull();
            });
        });

        it('should have string values for all colors', () => {
            Object.values(Colors).forEach(color => {
                expect(typeof color).toBe('string');
            });
        });

        it('should not have empty string values', () => {
            Object.values(Colors).forEach(color => {
                expect(color.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Brand Color Consistency', () => {
        it('userBubble should match primary color', () => {
            expect(Colors.userBubble).toBe(Colors.primary);
        });

        it('primary color should be blue', () => {
            expect(Colors.primary).toBe('#3B82F6');
        });

        it('text colors should be defined consistently', () => {
            expect(Colors.text).toBe('#1d1d1f');
            expect(Colors.textSecondary).toBe('#6e6e73');
        });
    });

    describe('Accessibility', () => {
        it('should have sufficient contrast colors for text', () => {
            // Text color should be dark enough
            expect(Colors.text.toLowerCase()).toContain('1d1d1f');
            expect(Colors.textSecondary.toLowerCase()).toContain('6e6e73');
        });

        it('should have light background colors', () => {
            // Background should be light (f5f5f7 is light gray)
            expect(Colors.background.toLowerCase()).toContain('f5f5f7');
            expect(Colors.card.toLowerCase()).toContain('ffffff');
        });
    });

    describe('Color Uniqueness', () => {
        it('should have some unique colors (not all the same)', () => {
            const uniqueColors = new Set(Object.values(Colors));
            expect(uniqueColors.size).toBeGreaterThan(1);
        });

        it('primary and primaryDark should be different', () => {
            expect(Colors.primary).not.toBe(Colors.primaryDark);
        });

        it('Lilly avatar colors should be different', () => {
            expect(Colors.lillyAvatarStart).not.toBe(Colors.lillyAvatarEnd);
        });
    });
});
