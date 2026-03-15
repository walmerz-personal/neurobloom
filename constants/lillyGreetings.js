// Role-based greetings from Lilly. Used on the Lilly chat tab for survivor, caregiver, and medical_staff.

function withGreetingPrefix(base, firstName) {
    const name = (firstName && typeof firstName === 'string' && firstName.trim()) ? firstName.trim().split(/\s+/)[0] : null;
    if (!name) return base;
    // Insert "Hi [Name]! " after the first "Hi" in the greeting
    if (base.startsWith('Hi,')) return `Hi ${name}! ${base.slice(4)}`;
    if (base.startsWith('Hi!')) return `Hi ${name}! ${base.slice(4)}`;
    return `Hi ${name}! ${base}`;
}

const SURVIVOR_INTRO = `I'm Lilly! 👋

I'm here to help you with stroke rehabilitation. I can:
• Answer questions about recovery
• Guide you through exercises
• Track your progress
• Provide emotional support

IMPORTANT: I'm an AI assistant, not a medical professional. I cannot provide medical advice, diagnose conditions, or replace consultations with your healthcare team.

For medical emergencies, please call 911 or contact your doctor immediately. Always consult your healthcare providers about treatment decisions.

How are you feeling today?`;

const SURVIVOR_SIMPLE = "I'm Lilly. How are you feeling today?";

const CAREGIVER_INTRO = `I'm Lilly! 👋

I'm here to support caregivers like you. I can help with:
• Understanding stroke recovery
• Tips for supporting your loved one
• Taking care of yourself—you can't pour from an empty cup

How are you doing today?`;

const CAREGIVER_SIMPLE = "I'm Lilly. I'm here to support you as a caregiver. How are you doing today?";

const MEDICAL_STAFF_INTRO = `I'm Lilly! 👋

I'm here to support you and your patients with stroke recovery. I can help with:
• Evidence-based recovery information
• Explaining concepts to share with patients and families
• General guidance (I'm an AI assistant, not a replacement for clinical judgment)

What can I help you with today?`;

const MEDICAL_STAFF_SIMPLE = "I'm Lilly. I'm here to support you and your patients with stroke recovery. What can I help you with today?";

const BY_ROLE = {
    survivor: { intro: SURVIVOR_INTRO, simple: SURVIVOR_SIMPLE },
    caregiver: { intro: CAREGIVER_INTRO, simple: CAREGIVER_SIMPLE },
    medical_staff: { intro: MEDICAL_STAFF_INTRO, simple: MEDICAL_STAFF_SIMPLE },
};

/**
 * Returns the Lilly greeting text for the given role and first-time vs returning user.
 * @param {'survivor'|'caregiver'|'medical_staff'} role
 * @param {boolean} isFirstTime - true for first-time (show intro), false for returning/fallback (show simple)
 * @param {string} [firstName] - Optional first name for personalized greeting (e.g. "Hi Sarah!")
 * @returns {string}
 */
export function getLillyGreeting(role, isFirstTime, firstName = null) {
    const roleKey = role && BY_ROLE[role] ? role : 'survivor';
    const { intro, simple } = BY_ROLE[roleKey];
    const base = isFirstTime ? intro : simple;
    return withGreetingPrefix(base, firstName);
}
