import { EXERCISE_METADATA, REGION_REASONS } from '../constants/exerciseMetadata';

const EXPECTED_IDS = ['a1', 'a2', 'a3', 'l1', 'l2', 'l3', 'c1', 'c2', 'c3', 'h1', 'h2', 'h3'];
const VALID_BODY_REGIONS = ['upper', 'lower', 'core', 'fine_motor'];
const VALID_IMPAIRMENTS = ['motor', 'speech', 'cognitive', 'vision'];
const VALID_PHASES = ['acute', 'subacute', 'chronic'];

describe('EXERCISE_METADATA', () => {
    it('has metadata for all 12 exercise IDs', () => {
        const keys = Object.keys(EXERCISE_METADATA);
        expect(keys).toHaveLength(12);
        for (const id of EXPECTED_IDS) {
            expect(EXERCISE_METADATA).toHaveProperty(id);
        }
    });

    it('has no extra/unknown exercise IDs', () => {
        const keys = Object.keys(EXERCISE_METADATA);
        for (const key of keys) {
            expect(EXPECTED_IDS).toContain(key);
        }
    });

    describe.each(EXPECTED_IDS)('exercise %s', (id) => {
        const entry = EXERCISE_METADATA[id];

        it('has a non-empty targetImpairments array', () => {
            expect(Array.isArray(entry.targetImpairments)).toBe(true);
            expect(entry.targetImpairments.length).toBeGreaterThan(0);
        });

        it('has only valid targetImpairments values', () => {
            for (const imp of entry.targetImpairments) {
                expect(VALID_IMPAIRMENTS).toContain(imp);
            }
        });

        it('has a valid bodyRegion string', () => {
            expect(typeof entry.bodyRegion).toBe('string');
            expect(VALID_BODY_REGIONS).toContain(entry.bodyRegion);
        });

        it('has bilateral as a boolean', () => {
            expect(typeof entry.bilateral).toBe('boolean');
        });

        it('has safeForSevere as a boolean', () => {
            expect(typeof entry.safeForSevere).toBe('boolean');
        });

        it('has a phaseRelevance object with all three phases', () => {
            expect(typeof entry.phaseRelevance).toBe('object');
            expect(entry.phaseRelevance).not.toBeNull();
            for (const phase of VALID_PHASES) {
                expect(entry.phaseRelevance).toHaveProperty(phase);
            }
        });

        it('has phaseRelevance values between 0 and 3', () => {
            for (const phase of VALID_PHASES) {
                const val = entry.phaseRelevance[phase];
                expect(typeof val).toBe('number');
                expect(val).toBeGreaterThanOrEqual(0);
                expect(val).toBeLessThanOrEqual(3);
            }
        });
    });
});

describe('REGION_REASONS', () => {
    it('has entries for all 4 body regions', () => {
        const keys = Object.keys(REGION_REASONS);
        expect(keys).toHaveLength(4);
        for (const region of VALID_BODY_REGIONS) {
            expect(REGION_REASONS).toHaveProperty(region);
        }
    });

    it.each(VALID_BODY_REGIONS)('region "%s" has a non-empty string value', (region) => {
        const val = REGION_REASONS[region];
        expect(typeof val).toBe('string');
        expect(val.length).toBeGreaterThan(0);
    });
});
