// PROMIS Global Health v1.2 (Global-10) — a validated 10-item patient-reported
// outcome measure of global physical and mental health. Public-domain (NIH).
//
// We administer all 10 items and store every response. For in-app display we
// compute the two standard raw component sums (Physical Health and Mental
// Health, each 4 items, range 4–20, higher = better). We deliberately do NOT
// compute official T-scores here — those require the PROMIS conversion tables
// and can be derived downstream from the stored raw responses. Showing raw
// component sums avoids presenting unverified clinical numbers while still
// giving a meaningful month-over-month trend.

// Standard 5-point response sets (value 5 = best health).
const EXCELLENT_TO_POOR = [
    { label: 'Excellent', value: 5 },
    { label: 'Very good', value: 4 },
    { label: 'Good', value: 3 },
    { label: 'Fair', value: 2 },
    { label: 'Poor', value: 1 },
];

const COMPLETELY_TO_NOT = [
    { label: 'Completely', value: 5 },
    { label: 'Mostly', value: 4 },
    { label: 'Moderately', value: 3 },
    { label: 'A little', value: 2 },
    { label: 'Not at all', value: 1 },
];

const FATIGUE = [
    { label: 'None', value: 5 },
    { label: 'Mild', value: 4 },
    { label: 'Moderate', value: 3 },
    { label: 'Severe', value: 2 },
    { label: 'Very severe', value: 1 },
];

const FREQUENCY = [
    { label: 'Never', value: 5 },
    { label: 'Rarely', value: 4 },
    { label: 'Sometimes', value: 3 },
    { label: 'Often', value: 2 },
    { label: 'Always', value: 1 },
];

// The 10 items. `type: 'choice'` items use the option sets above; the pain item
// is a 0–10 numeric scale (type: 'scale').
export const PROMIS_GLOBAL10_ITEMS = [
    { id: 'global01', type: 'choice', question: 'In general, would you say your health is:', options: EXCELLENT_TO_POOR },
    { id: 'global02', type: 'choice', question: 'In general, would you say your quality of life is:', options: EXCELLENT_TO_POOR },
    { id: 'global03', type: 'choice', question: 'In general, how would you rate your physical health?', options: EXCELLENT_TO_POOR },
    { id: 'global04', type: 'choice', question: 'In general, how would you rate your mental health, including your mood and your ability to think?', options: EXCELLENT_TO_POOR },
    { id: 'global05', type: 'choice', question: 'In general, how would you rate your satisfaction with your social activities and relationships?', options: EXCELLENT_TO_POOR },
    { id: 'global06', type: 'choice', question: 'In general, please rate how well you carry out your usual social activities and roles.', options: EXCELLENT_TO_POOR },
    { id: 'global07', type: 'choice', question: 'To what extent are you able to carry out your everyday physical activities such as walking, climbing stairs, carrying groceries, or moving a chair?', options: COMPLETELY_TO_NOT },
    { id: 'global08', type: 'choice', question: 'How would you rate your fatigue on average?', options: FATIGUE },
    { id: 'global09', type: 'choice', question: 'How often have you been bothered by emotional problems such as feeling anxious, depressed, or irritable?', options: FREQUENCY },
    { id: 'global10', type: 'scale', question: 'How would you rate your pain on average?', min: 0, max: 10, minLabel: 'No pain', maxLabel: 'Worst pain' },
];

// Recode the 0–10 pain item to the 5-point scale used by the physical summary.
export function recodePain(pain) {
    if (pain === 0) return 5;
    if (pain <= 3) return 4;
    if (pain <= 6) return 3;
    if (pain <= 9) return 2;
    return 1;
}

/**
 * Score a completed PROMIS Global-10.
 * @param {Object} responses - map of item id -> selected value (pain is 0–10)
 * @returns {{ physicalRaw: number, mentalRaw: number, complete: boolean }}
 *   physicalRaw/mentalRaw are 4–20 raw component sums (higher = better).
 */
export function scorePromis(responses) {
    const r = responses || {};
    const ids = PROMIS_GLOBAL10_ITEMS.map((i) => i.id);
    const complete = ids.every((id) => r[id] !== undefined && r[id] !== null);

    // Physical Health summary: global03, global06, global07, global10 (pain recoded)
    const physicalRaw = (r.global03 || 0) + (r.global06 || 0) + (r.global07 || 0) + recodePain(r.global10 || 0);
    // Mental Health summary: global02, global04, global05, global09
    const mentalRaw = (r.global02 || 0) + (r.global04 || 0) + (r.global05 || 0) + (r.global09 || 0);

    return { physicalRaw, mentalRaw, complete };
}
