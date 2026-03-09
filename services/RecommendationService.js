import { EXERCISE_METADATA, REGION_REASONS } from '../constants/exerciseMetadata';

/**
 * Recommendation Service
 * Pure client-side scoring engine for 12 exercises.
 */

/**
 * Get recommended exercises sorted by relevance to user profile.
 *
 * @param {Object} userProfile - { impairments, affected_side, impairment_severity, recovery_phase }
 * @param {Array} allExercises - Array of exercise objects with id, difficulty, etc.
 * @returns {{ recommended: Array, all: Array }} - Top 5 recommended + full sorted list
 */
export function getRecommendedExercises(userProfile, allExercises) {
    if (!userProfile) return { recommended: [], all: allExercises };

    const { impairments, affected_side, impairment_severity, recovery_phase } = userProfile;

    // If no meaningful profile data, return empty recommendations
    const hasProfileData = (impairments && impairments.length > 0) || affected_side || impairment_severity || recovery_phase;
    if (!hasProfileData) return { recommended: [], all: allExercises };

    const userImpairments = Array.isArray(impairments) ? impairments : [];
    const phase = recovery_phase || 'chronic'; // default to chronic if not set

    // Filter + Score
    const scored = allExercises.map(exercise => {
        const meta = EXERCISE_METADATA[exercise.id];
        if (!meta) return { exercise, score: 0, reason: null };

        // Filter: remove inappropriate exercises
        if (impairment_severity === 'severe') {
            if (!meta.safeForSevere || exercise.difficulty === 'Advanced' || exercise.difficulty === 'Intermediate') {
                return { exercise, score: -1, reason: null };
            }
        }
        if (impairment_severity === 'moderate' && exercise.difficulty === 'Advanced') {
            return { exercise, score: -1, reason: null };
        }
        if (phase === 'acute' && meta.phaseRelevance.acute === 0) {
            return { exercise, score: -1, reason: null };
        }

        // Score
        let score = 0;

        // +3 for each matching impairment
        for (const imp of userImpairments) {
            if (meta.targetImpairments.includes(imp)) {
                score += 3;
            }
        }

        // +0 to +3 from phase relevance
        score += meta.phaseRelevance[phase] || 0;

        // +2 for unilateral exercises when user has a specific affected side
        if (!meta.bilateral && affected_side && affected_side !== 'both' && affected_side !== 'unknown') {
            score += 2;
        }

        const reason = REGION_REASONS[meta.bodyRegion] || 'Recommended for your recovery';

        return { exercise, score, reason };
    });

    // Remove filtered-out exercises (score === -1) and sort descending
    const valid = scored.filter(s => s.score >= 0);
    valid.sort((a, b) => b.score - a.score);

    const recommended = valid.slice(0, 5).map(s => ({
        ...s.exercise,
        recommendationReason: s.reason,
        recommendationScore: s.score,
    }));

    const all = valid.map(s => ({
        ...s.exercise,
        recommendationReason: s.reason,
        recommendationScore: s.score,
        isRecommended: valid.indexOf(s) < 5,
    }));

    return { recommended, all };
}

/**
 * Get a daily plan of 4 exercises from the recommended list, rotating by day.
 *
 * @param {Array} recommended - Array of recommended exercises (up to 5)
 * @param {number} dayOfWeek - 0-6 (Sunday-Saturday)
 * @returns {Array} - 4 exercises for today
 */
export function getDailyPlan(recommended, dayOfWeek = new Date().getDay()) {
    if (!recommended || recommended.length === 0) return [];
    if (recommended.length <= 4) return recommended;

    // Rotate: skip (dayOfWeek % recommended.length) exercises, then take 4
    const start = dayOfWeek % recommended.length;
    const plan = [];
    for (let i = 0; i < 4; i++) {
        plan.push(recommended[(start + i) % recommended.length]);
    }
    return plan;
}

/**
 * Get a lighter plan for bad days (low energy or high pain).
 *
 * @param {Array} recommended - Array of recommended exercises
 * @param {number} dayOfWeek - 0-6
 * @returns {{ exercises: Array, isLightPlan: boolean }}
 */
export function getBadDayPlan(recommended, dayOfWeek = new Date().getDay()) {
    if (!recommended || recommended.length === 0) return { exercises: [], isLightPlan: false };

    // Only Beginner exercises
    const beginnerOnly = recommended.filter(ex => ex.difficulty === 'Beginner');
    if (beginnerOnly.length === 0) return { exercises: recommended.slice(0, 2), isLightPlan: true };

    // Pick 2 exercises, rotating by day
    const start = dayOfWeek % beginnerOnly.length;
    const plan = [];
    for (let i = 0; i < Math.min(2, beginnerOnly.length); i++) {
        plan.push(beginnerOnly[(start + i) % beginnerOnly.length]);
    }
    return { exercises: plan, isLightPlan: true };
}
