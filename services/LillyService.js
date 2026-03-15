// services/LillyService.js
import { SupabaseService } from './SupabaseService';

/**
 * Main message handler - calls secure Supabase Edge Function
 * @param {string} message - The user's message
 * @param {Array} history - Conversation history
 * @param {Object} userProfile - User profile from onboarding (optional)
 * @param {Object} context - Rich context: userName, role, todayLog, recentLogs, assignedExercises (optional)
 */
export async function sendMessage(message, history = [], userProfile = null, context = null) {
    console.log("\n=== New Message ===");
    console.log("User:", message.substring(0, 100));

    // SAFETY FIRST: Emergency keyword check (local)
    const emergencyKeywords = [
        /\bchest\s+pain\b/i,
        /\bcan'?t\s+breathe\b/i,
        /\bheart\s+attack\b/i,
        /\bworst\s+headache\b/i,
        /\bsuicide\b/i,
        /\bkill\s+myself\b/i,
        /\bface\s+droop(?:ing)?/i,
        /\barm\s+weakness\b/i,
    ];

    const hasEmergency = emergencyKeywords.some(regex => regex.test(message));
    if (hasEmergency) {
        console.log("🚨 EMERGENCY DETECTED - Immediate response");
        return {
            text: "I'm very concerned about what you're describing. This sounds like a medical emergency. Please call 911 or your local emergency number RIGHT NOW. I'm here to support you, but I can't replace emergency care. Please get help immediately.",
            isEmergency: true
        };
    }

    try {
        console.log('🤖 Calling Lilly Chat Edge Function...');

        // Call the secure Supabase Edge Function using SupabaseService
        const { data, error } = await SupabaseService.callEdgeFunction('lilly-chat', {
            message,
            history,
            userProfile,
            context
        });

        if (error) {
            console.error('❌ Edge Function Error:', error);
            return {
                text: "I'm having trouble connecting to my AI backend right now. Please try again in a moment.\n\nIn the meantime, I'm here to support you with stroke recovery. What would you like to talk about?"
            };
        }

        if (!data || !data.text) {
            console.error('❌ No data returned from Edge Function');
            return {
                text: "I'm having trouble processing your message right now. Please try again."
            };
        }

        console.log('✅ Response received from Edge Function');
        return data;

    } catch (error) {
        console.error("❌ Network Error calling Edge Function:", error.message);
        return {
            text: "I'm having trouble connecting right now. Please check your internet connection and try again."
        };
    }
}
