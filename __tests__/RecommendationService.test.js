// __tests__/RecommendationService.test.js

import {
    getRecommendedExercises,
    getDailyPlan,
    getBadDayPlan,
} from '../services/RecommendationService';

// ---------------------------------------------------------------------------
// Mock exercises (small set matching the real exercise object shape)
// ---------------------------------------------------------------------------
const mockExercises = [
    {
        id: 'a1',
        title: 'Shoulder Shrugs',
        category: 'Arms',
        mode: 'video',
        difficulty: 'Beginner',
    },
    {
        id: 'a2',
        title: 'Table Push',
        category: 'Arms',
        mode: 'video',
        difficulty: 'Beginner',
    },
    {
        id: 'a3',
        title: 'Bicep Curls',
        category: 'Arms',
        mode: 'video',
        difficulty: 'Advanced',
    },
    {
        id: 'l1',
        title: 'Ankle Pumps',
        category: 'Legs',
        mode: 'video',
        difficulty: 'Beginner',
    },
    {
        id: 'h1',
        title: 'Fist Clenches',
        category: 'Hands',
        mode: 'video',
        difficulty: 'Beginner',
    },
    {
        id: 'c3',
        title: 'Seated Balance',
        category: 'Core',
        mode: 'video',
        difficulty: 'Intermediate',
    },
    {
        id: 'l3',
        title: 'Sit-to-Stand',
        category: 'Legs',
        mode: 'video',
        difficulty: 'Intermediate',
    },
];

// ---------------------------------------------------------------------------
// getRecommendedExercises
// ---------------------------------------------------------------------------
describe('getRecommendedExercises', () => {
    it('returns empty recommendations when userProfile is null', () => {
        const result = getRecommendedExercises(null, mockExercises);
        expect(result.recommended).toEqual([]);
        expect(result.all).toBe(mockExercises);
    });

    it('returns empty recommendations when profile has no meaningful data', () => {
        const result = getRecommendedExercises({}, mockExercises);
        expect(result.recommended).toEqual([]);
        expect(result.all).toBe(mockExercises);
    });

    it('filters out non-Beginner exercises when severity is severe', () => {
        const profile = {
            impairments: ['motor'],
            impairment_severity: 'severe',
            recovery_phase: 'subacute',
        };
        const result = getRecommendedExercises(profile, mockExercises);

        // Severe: only safeForSevere AND Beginner difficulty should survive
        // a3 (Advanced, not safe), c3 (Intermediate, not safe), l3 (Intermediate, not safe) should be filtered
        const ids = result.all.map(e => e.id);
        expect(ids).not.toContain('a3');
        expect(ids).not.toContain('c3');
        expect(ids).not.toContain('l3');
    });

    it('filters out Advanced exercises when severity is moderate', () => {
        const profile = {
            impairments: ['motor'],
            impairment_severity: 'moderate',
            recovery_phase: 'subacute',
        };
        const result = getRecommendedExercises(profile, mockExercises);
        const ids = result.all.map(e => e.id);
        expect(ids).not.toContain('a3'); // Advanced
        // Intermediate exercises should still be present
        expect(ids).toContain('c3');
    });

    it('filters out exercises with 0 phase relevance for acute phase', () => {
        const profile = {
            impairments: ['motor'],
            recovery_phase: 'acute',
        };
        const result = getRecommendedExercises(profile, mockExercises);
        const ids = result.all.map(e => e.id);
        // a3, c3, l3 all have acute: 0 in their phaseRelevance
        expect(ids).not.toContain('a3');
        expect(ids).not.toContain('c3');
        expect(ids).not.toContain('l3');
    });

    it('scores higher for matching impairments (+3 per match)', () => {
        const profile = {
            impairments: ['motor', 'cognitive'],
            recovery_phase: 'chronic',
        };
        const result = getRecommendedExercises(profile, mockExercises);

        // c3 and h1's metadata target both 'motor' — but c3 also targets 'cognitive'
        // so c3 gets +3+3 = 6 from impairments, while a1 gets only +3
        const c3 = result.all.find(e => e.id === 'c3');
        const a1 = result.all.find(e => e.id === 'a1');
        expect(c3.recommendationScore).toBeGreaterThan(a1.recommendationScore);
    });

    it('scores higher for phase relevance', () => {
        const profile = {
            impairments: ['motor'],
            recovery_phase: 'acute',
        };
        const result = getRecommendedExercises(profile, mockExercises);
        // a1 has acute: 3, a2 has acute: 2 — both target motor
        const a1 = result.all.find(e => e.id === 'a1');
        const a2 = result.all.find(e => e.id === 'a2');
        expect(a1.recommendationScore).toBeGreaterThan(a2.recommendationScore);
    });

    it('scores higher for unilateral exercises when affected side is left', () => {
        const profile = {
            impairments: ['motor'],
            affected_side: 'left',
            recovery_phase: 'subacute',
        };
        const result = getRecommendedExercises(profile, mockExercises);
        // a2 is unilateral (bilateral: false) and h1 is unilateral
        // a1 is bilateral
        // With same impairment scores, unilateral ones get +2
        const a2 = result.all.find(e => e.id === 'a2');
        const a1 = result.all.find(e => e.id === 'a1');
        // a2: motor(+3) + subacute(+3) + unilateral(+2) = 8
        // a1: motor(+3) + subacute(+2) + bilateral(0) = 5
        expect(a2.recommendationScore).toBe(8);
        expect(a1.recommendationScore).toBe(5);
    });

    it('does NOT boost unilateral score when affected side is both', () => {
        const profile = {
            impairments: ['motor'],
            affected_side: 'both',
            recovery_phase: 'subacute',
        };
        const result = getRecommendedExercises(profile, mockExercises);
        const a2 = result.all.find(e => e.id === 'a2');
        // a2: motor(+3) + subacute(+3) + no unilateral boost = 6
        expect(a2.recommendationScore).toBe(6);
    });

    it('does NOT boost unilateral score when affected side is unknown', () => {
        const profile = {
            impairments: ['motor'],
            affected_side: 'unknown',
            recovery_phase: 'subacute',
        };
        const result = getRecommendedExercises(profile, mockExercises);
        const a2 = result.all.find(e => e.id === 'a2');
        expect(a2.recommendationScore).toBe(6);
    });

    it('returns top 5 as recommended', () => {
        const profile = {
            impairments: ['motor'],
            recovery_phase: 'subacute',
        };
        const result = getRecommendedExercises(profile, mockExercises);
        expect(result.recommended.length).toBeLessThanOrEqual(5);
        // With 7 mock exercises, some may be filtered, but recommended should be at most 5
        expect(result.recommended.length).toBe(5);
    });

    it('marks isRecommended on all items', () => {
        const profile = {
            impairments: ['motor'],
            recovery_phase: 'subacute',
        };
        const result = getRecommendedExercises(profile, mockExercises);
        // The first 5 items in `all` should have isRecommended: true
        const recommendedItems = result.all.filter(e => e.isRecommended === true);
        const notRecommendedItems = result.all.filter(e => e.isRecommended === false);
        expect(recommendedItems.length).toBeLessThanOrEqual(5);
        expect(recommendedItems.length + notRecommendedItems.length).toBe(result.all.length);
    });

    it('each recommended exercise has a recommendationReason string', () => {
        const profile = {
            impairments: ['motor'],
            recovery_phase: 'subacute',
        };
        const result = getRecommendedExercises(profile, mockExercises);
        for (const ex of result.recommended) {
            expect(typeof ex.recommendationReason).toBe('string');
            expect(ex.recommendationReason.length).toBeGreaterThan(0);
        }
    });

    it('full profile with motor impairment returns motor-targeting exercises ranked high', () => {
        const profile = {
            impairments: ['motor'],
            affected_side: 'left',
            impairment_severity: 'mild',
            recovery_phase: 'subacute',
        };
        const result = getRecommendedExercises(profile, mockExercises);
        // All exercises target motor, so all should score > 0
        for (const ex of result.recommended) {
            expect(ex.recommendationScore).toBeGreaterThan(0);
        }
        // Top recommended should include motor-targeting exercises
        const topIds = result.recommended.map(e => e.id);
        // h1 (unilateral, subacute: 3, motor: +3, +2 unilateral = 8) should be near top
        expect(topIds).toContain('h1');
    });
});

// ---------------------------------------------------------------------------
// getDailyPlan
// ---------------------------------------------------------------------------
describe('getDailyPlan', () => {
    const recommended5 = [
        { id: 'a1', title: 'Ex 1' },
        { id: 'a2', title: 'Ex 2' },
        { id: 'l1', title: 'Ex 3' },
        { id: 'h1', title: 'Ex 4' },
        { id: 'c1', title: 'Ex 5' },
    ];

    it('returns empty array when recommended is null', () => {
        expect(getDailyPlan(null, 0)).toEqual([]);
    });

    it('returns empty array when recommended is empty', () => {
        expect(getDailyPlan([], 0)).toEqual([]);
    });

    it('returns all exercises when <= 4', () => {
        const small = recommended5.slice(0, 3);
        const result = getDailyPlan(small, 0);
        expect(result).toEqual(small);
    });

    it('returns exactly 4 exercises when > 4', () => {
        const result = getDailyPlan(recommended5, 0);
        expect(result.length).toBe(4);
    });

    it('different days produce different rotations', () => {
        const day0 = getDailyPlan(recommended5, 0);
        const day1 = getDailyPlan(recommended5, 1);
        // The starting exercise should differ
        expect(day0[0].id).not.toBe(day1[0].id);
    });

    it('all returned exercises come from the recommended list', () => {
        for (let day = 0; day < 7; day++) {
            const plan = getDailyPlan(recommended5, day);
            for (const ex of plan) {
                expect(recommended5).toContainEqual(ex);
            }
        }
    });
});

// ---------------------------------------------------------------------------
// getBadDayPlan
// ---------------------------------------------------------------------------
describe('getBadDayPlan', () => {
    const recommendedMixed = [
        { id: 'a1', title: 'Shoulder Shrugs', difficulty: 'Beginner' },
        { id: 'a2', title: 'Table Push', difficulty: 'Beginner' },
        { id: 'a3', title: 'Bicep Curls', difficulty: 'Advanced' },
        { id: 'c3', title: 'Seated Balance', difficulty: 'Intermediate' },
        { id: 'l1', title: 'Ankle Pumps', difficulty: 'Beginner' },
    ];

    it('returns empty exercises when recommended is null', () => {
        const result = getBadDayPlan(null, 0);
        expect(result.exercises).toEqual([]);
    });

    it('returns empty exercises when recommended is empty', () => {
        const result = getBadDayPlan([], 0);
        expect(result.exercises).toEqual([]);
    });

    it('returns max 2 exercises', () => {
        const result = getBadDayPlan(recommendedMixed, 0);
        expect(result.exercises.length).toBeLessThanOrEqual(2);
    });

    it('only returns Beginner difficulty exercises', () => {
        const result = getBadDayPlan(recommendedMixed, 0);
        for (const ex of result.exercises) {
            expect(ex.difficulty).toBe('Beginner');
        }
    });

    it('sets isLightPlan to true', () => {
        const result = getBadDayPlan(recommendedMixed, 0);
        expect(result.isLightPlan).toBe(true);
    });

    it('falls back to first 2 if no Beginner exercises exist', () => {
        const advancedOnly = [
            { id: 'a3', title: 'Bicep Curls', difficulty: 'Advanced' },
            { id: 'c3', title: 'Seated Balance', difficulty: 'Intermediate' },
            { id: 'l3', title: 'Sit-to-Stand', difficulty: 'Intermediate' },
        ];
        const result = getBadDayPlan(advancedOnly, 0);
        expect(result.isLightPlan).toBe(true);
        expect(result.exercises.length).toBe(2);
        expect(result.exercises[0].id).toBe('a3');
        expect(result.exercises[1].id).toBe('c3');
    });

    it('returns isLightPlan false when recommended is empty', () => {
        const result = getBadDayPlan([], 0);
        expect(result.isLightPlan).toBe(false);
    });

    it('returns only 1 exercise when only 1 Beginner exists', () => {
        const oneBeginner = [
            { id: 'a1', title: 'Shoulder Shrugs', difficulty: 'Beginner' },
            { id: 'a3', title: 'Bicep Curls', difficulty: 'Advanced' },
        ];
        const result = getBadDayPlan(oneBeginner, 0);
        expect(result.exercises.length).toBe(1);
        expect(result.exercises[0].difficulty).toBe('Beginner');
    });
});
