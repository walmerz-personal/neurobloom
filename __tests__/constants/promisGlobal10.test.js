import { PROMIS_GLOBAL10_ITEMS, recodePain, scorePromis } from '../../constants/promisGlobal10';

describe('promisGlobal10', () => {
    it('has 10 items with unique ids', () => {
        expect(PROMIS_GLOBAL10_ITEMS).toHaveLength(10);
        const ids = PROMIS_GLOBAL10_ITEMS.map((i) => i.id);
        expect(new Set(ids).size).toBe(10);
    });

    it('recodes 0-10 pain to the 5-point scale', () => {
        expect(recodePain(0)).toBe(5);
        expect(recodePain(3)).toBe(4);
        expect(recodePain(6)).toBe(3);
        expect(recodePain(9)).toBe(2);
        expect(recodePain(10)).toBe(1);
    });

    it('scores best-possible responses to 20/20', () => {
        const best = {};
        PROMIS_GLOBAL10_ITEMS.forEach((i) => { best[i.id] = i.type === 'scale' ? 0 : 5; });
        const { physicalRaw, mentalRaw, complete } = scorePromis(best);
        expect(physicalRaw).toBe(20);
        expect(mentalRaw).toBe(20);
        expect(complete).toBe(true);
    });

    it('scores worst-possible responses to 4/4', () => {
        const worst = {};
        PROMIS_GLOBAL10_ITEMS.forEach((i) => { worst[i.id] = i.type === 'scale' ? 10 : 1; });
        const { physicalRaw, mentalRaw } = scorePromis(worst);
        expect(physicalRaw).toBe(4);
        expect(mentalRaw).toBe(4);
    });

    it('marks incomplete when an item is missing', () => {
        expect(scorePromis({ global01: 5 }).complete).toBe(false);
        expect(scorePromis(null).complete).toBe(false);
    });
});
