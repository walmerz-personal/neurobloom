// services/LillyService.js
import { Config } from '../constants/Config';

// System Prompt based on PRD Section 10.1 & 10.2
const SYSTEM_PROMPT = `
You are Lilly, an AI companion for stroke recovery.
Your goal is to support stroke survivors and their caregivers with empathy, knowledge, and encouragement.

CORE PERSONALITY:
- Warm but not saccharine. Genuinely caring.
- Knowledgeable but humble. Cite sources when possible (e.g., "According to the American Stroke Association...").
- Patient and clear. Use short sentences and simple language (6th grade level).
- Encouraging but realistic. Celebrate effort, but acknowledge hard truths.
- You are a GUIDE, not a doctor. NEVER diagnose or prescribe.

KNOWLEDGE BASE:
- Stroke Types: Ischemic (clot) vs. Hemorrhagic (bleed).
- Recovery: It's a marathon. Neuroplasticity (brain rewiring) happens with repetition.
- Exercises: Encourage daily practice.
- Emotional: Validate feelings of frustration, grief, and isolation. Post-stroke depression is common.

SAFETY PROTOCOLS:
- If user mentions chest pain, difficulty breathing, worst headache of life, or suicidal thoughts -> MARK AS EMERGENCY. Tell them to call 911 immediately.

APP NAVIGATION:
- If user asks about exercises, suggest navigating to the Exercise Library.
- If user asks about progress/stats, suggest navigating to the Progress Dashboard.
`;

// Enhanced Mock Knowledge Base (Fallback)
const MOCK_KNOWLEDGE_BASE = {
    stroke_types: {
        keywords: ['ischemic', 'hemorrhagic', 'types of stroke', 'what is a stroke', 'clot', 'bleed'],
        response: "There are two main types of stroke: Ischemic (caused by a clot) and Hemorrhagic (caused by bleeding). Ischemic strokes are more common (87%). Recovery is different for everyone, but understanding your type is a great start."
    },
    recovery_timeline: {
        keywords: ['how long', 'timeline', 'recovery time', 'when will i get better', 'forever'],
        response: "Recovery is a marathon, not a sprint. The first 3 months often show fast progress, but improvements can continue for years thanks to neuroplasticity - your brain's ability to rewire itself."
    },
    neuroplasticity: {
        keywords: ['neuroplasticity', 'rewire', 'brain', 'plasticity', 'heal'],
        response: "Neuroplasticity is your brain's amazing ability to form new connections. It's like finding a new route home when the main road is closed. Consistent practice helps build these new pathways."
    },
    exercises: {
        keywords: ['exercise', 'workout', 'physical therapy', 'pt', 'arm', 'leg', 'move'],
        response: "Regular exercise is key to recovery. We have a library of exercises for upper body, lower body, and balance. Would you like to see them?",
        action: { type: 'navigate', target: 'exercises' }
    },
    fatigue: {
        keywords: ['tired', 'fatigue', 'exhausted', 'sleepy', 'nap'],
        response: "Post-stroke fatigue is very real. Your brain is using extra energy to heal. It's not just 'being tired'. Listen to your body and take breaks without guilt."
    },
    emotional: {
        keywords: ['sad', 'depressed', 'cry', 'unhappy', 'frustrated', 'angry', 'mad', 'hate'],
        response: "I hear you. Recovery is an emotional rollercoaster. It's normal to feel frustrated or sad. You're dealing with a big change. Be gentle with yourself. If it feels overwhelming, please talk to your doctor."
    },
    emergency: {
        keywords: ['chest pain', 'can\'t breathe', 'heart attack', 'worst headache', 'suicide', 'kill myself', 'die', 'emergency'],
        response: "I'm concerned. This sounds like a medical emergency. Please call 911 or your local emergency number immediately. I cannot provide emergency care.",
        isEmergency: true
    },
    greeting: {
        keywords: ['hi', 'hello', 'hey', 'greetings', 'start', 'morning', 'afternoon'],
        response: "Hello! I'm Lilly. I'm here to support your recovery. You can ask me about stroke, exercises, or just chat. How are you feeling today?"
    },
    progress: {
        keywords: ['progress', 'how am i doing', 'stats', 'chart', 'track'],
        response: "Tracking your progress helps you see how far you've come! Would you like to check your progress dashboard?",
        action: { type: 'navigate', target: 'progress' }
    },
    cooking: {
        keywords: ['cook', 'kitchen', 'food', 'recipe', 'eat'],
        response: "Cooking is a great goal! It involves many skills - standing, chopping, planning. We can start with simple tasks. Have you talked to an Occupational Therapist about adaptive kitchen tools?"
    }
};

const DEFAULT_MOCK_RESPONSE = "I'm listening. I'm still learning, but I'm here to support you. Could you tell me more about that, or ask me about exercises, stroke recovery, or your progress?";

/**
 * Calls the OpenAI API to generate a response.
 */
async function callOpenAI(userMessage, history = []) {
    try {
        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history, // Add previous context if available
            { role: 'user', content: userMessage }
        ];

        const response = await fetch(Config.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Config.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: Config.MODEL,
                messages: messages,
                max_tokens: 150,
                temperature: 0.7,
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error("OpenAI API Error:", data.error);
            return null; // Fallback to mock
        }

        const aiText = data.choices[0].message.content.trim();

        // Simple heuristic to detect actions from AI text (can be improved with function calling)
        let action = null;
        if (aiText.toLowerCase().includes("exercise library") || aiText.toLowerCase().includes("navigate to exercises")) {
            action = { type: 'navigate', target: 'exercises' };
        } else if (aiText.toLowerCase().includes("progress dashboard") || aiText.toLowerCase().includes("check your progress")) {
            action = { type: 'navigate', target: 'progress' };
        }

        // Simple heuristic for emergency
        const isEmergency = aiText.toLowerCase().includes("call 911") || aiText.toLowerCase().includes("emergency");

        return {
            text: aiText,
            action,
            isEmergency
        };

    } catch (error) {
        console.error("Network Error calling OpenAI:", error);
        return null; // Fallback to mock
    }
}

/**
 * Simulates an AI response based on user input.
 * @param {string} message - The user's message.
 * @param {object} userProfile - The user's profile (optional context).
 * @returns {Promise<object>} - The response object { text, action, isEmergency }.
 */
export async function sendMessage(message, userProfile) {
    // 1. Check for Emergency Keywords locally first (Safety First)
    const lowerMsg = message.toLowerCase();
    const emergencyEntry = MOCK_KNOWLEDGE_BASE.emergency;
    if (emergencyEntry.keywords.some(k => lowerMsg.includes(k))) {
        return {
            text: emergencyEntry.response,
            isEmergency: true
        };
    }

    // 2. Try OpenAI if Key is present
    if (Config.OPENAI_API_KEY && Config.OPENAI_API_KEY.length > 10) {
        const aiResponse = await callOpenAI(message);
        if (aiResponse) {
            return aiResponse;
        }
    }

    // 3. Fallback to Mock Logic
    return new Promise((resolve) => {
        setTimeout(() => {
            let bestMatch = null;

            for (const key in MOCK_KNOWLEDGE_BASE) {
                const entry = MOCK_KNOWLEDGE_BASE[key];
                if (entry.keywords.some(keyword => lowerMsg.includes(keyword))) {
                    bestMatch = entry;
                    if (entry.isEmergency) break;
                }
            }

            if (bestMatch) {
                resolve({
                    text: bestMatch.response,
                    action: bestMatch.action,
                    isEmergency: bestMatch.isEmergency
                });
            } else {
                resolve({
                    text: DEFAULT_MOCK_RESPONSE
                });
            }
        }, 1000);
    });
}
