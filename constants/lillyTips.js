// Role-specific tips from Lilly. Used on home for survivor, caregiver, and medical_staff.

const LILLY_TIPS_BY_ROLE = {
    survivor: [
        "Every small step forward is progress. You're doing great! 🌟",
        "Recovery isn't a straight line, and that's okay. Keep going! 💪",
        "Your brain is amazing - it's rewiring itself every day. 🧠",
        "Consistency beats perfection. Just showing up matters! ✨",
        "You're stronger than you think. I believe in you! 💙",
        "Celebrate the wins, no matter how small. You've earned it! 🎉",
        "Rest is part of recovery, not a setback. Be kind to yourself. 🌸",
        "Progress might be slow, but you're moving forward. Keep it up! 🚀",
    ],
    caregiver: [
        "Remember to take 5 minutes for yourself today. You can't pour from an empty cup. 🌿",
        "Celebrating small wins matters! Did your survivor smile today? That's worth celebrating. 💜",
        "It's okay to ask for help. You're doing an incredible job, but you don't have to do it alone. 🤝",
        "Rest is not a reward—it's a requirement. Be kind to yourself. 🌸",
        "Progress isn't always visible. Trust the process and keep showing up. ✨",
        "Your patience and love are making a real difference, even on the hard days. 💙",
    ],
    medical_staff: [
        "Your expertise and guidance make all the difference. Thank you for what you do. 🌟",
        "Remember to celebrate small wins with your patients—they matter more than you know. 💜",
        "Consistent exercise assignment leads to better outcomes. Keep up the great work! 💪",
        "Tracking progress helps you adjust treatment plans effectively. Use the app to monitor results. 📊",
        "Clear communication with survivors and their families strengthens recovery. 💙",
        "Every exercise assigned is a step toward better recovery. Your patience matters. ✨",
    ],
};

/**
 * Returns an array of Lilly tips for the given role.
 * @param {'survivor'|'caregiver'|'medical_staff'} role
 * @returns {string[]}
 */
export function getLillyTipsForRole(role) {
    const tips = LILLY_TIPS_BY_ROLE[role];
    return tips || LILLY_TIPS_BY_ROLE.survivor;
}
