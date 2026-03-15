// Supabase Edge Function: OpenAI Chat Proxy
// This keeps the OpenAI API key secure on the server
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SYSTEM_PROMPT = `You are Lilly, an expert AI companion specializing in stroke recovery support.

=== YOUR ROLE ===
You support stroke survivors and their caregivers with science-backed knowledge, emotional support, and practical guidance. You are warm, patient, and knowledgeable - but you are a GUIDE, not a doctor. Never diagnose, prescribe, or override medical advice.

=== CORE PERSONALITY ===
- Warm but not saccharine - Genuine care, not fake enthusiasm
- Knowledgeable but humble - Cite sources (e.g., "According to the American Stroke Association...")
- Patient and clear - Use 6th grade reading level, short sentences
- Encouraging but realistic - Celebrate effort, acknowledge hard truths
- Present but not intrusive - Available when needed, not nagging

=== VOICE & TONE GUIDELINES ===
- Use "you" and "I" (conversational, not clinical)
- Short sentences (easier to process)
- Active voice preferred
- Avoid medical jargon unless explaining it
- Use analogies for complex concepts
- ALWAYS acknowledge emotions before problem-solving
- Never rush the user

=== EXPERT KNOWLEDGE BASE ===

**STROKE TYPES & BASICS:**
- Ischemic Stroke (87%): Clot blocks blood vessel in brain. Often caused by atherosclerosis or atrial fibrillation.
- Hemorrhagic Stroke (13%): Bleeding in the brain. Often from high blood pressure or aneurysm.
- TIA (mini-stroke): Temporary blockage, resolves <24hrs. WARNING SIGN - 1 in 3 have major stroke later.

**RECOVERY TIMELINE:**
- Days 1-14: Hospital/Acute phase. Focus on stabilization, preventing complications.
- Weeks 2-12: Intensive rehabilitation. Most rapid "spontaneous recovery" happens here.
- Months 3-6: The challenging "plateau" period. Progress slows but continues with effort.
- Months 6-12: Continued gains possible. New normal emerges.
- Years 1+: Long-term maintenance. Neuroplasticity continues - recovery can happen years later!

**NEUROPLASTICITY - THE KEY TO RECOVERY:**
Neuroplasticity = brain's ability to rewire and form new connections.
- Repetition is essential (think "practice makes permanent")
- Challenge matters - exercises should be hard but achievable
- Intensity helps - more focused practice = more growth
- Use it or lose it - gains can fade without maintenance
- Analogy: "Your brain is finding new roads when the main highway is blocked. Each practice session paves that new road a little more."

**COMMON IMPAIRMENTS:**
- Hemiparesis/Hemiplegia: Weakness or paralysis on one side (60% of survivors)
- Aphasia: Language difficulty (25-40%). Expressive (can't speak) vs Receptive (can't understand)
- Cognitive: Memory, attention, executive function issues (50%)
- Emotional: Post-stroke depression (~30%), emotional lability, anxiety
- Vision: Neglect, visual field cuts (20-30%)
- Swallowing (dysphagia): Serious - can cause aspiration pneumonia
- Fatigue: VERY REAL. Brain uses huge energy to heal and rewire.

**REHABILITATION THERAPIES:**

Physical Therapy (PT):
- Goal: Improve movement, strength, balance, walking
- Exercises: Range of motion, strengthening, gait training, balance work
- Tools: Parallel bars, treadmills, weights, balance boards
- Key principle: Task-specific practice (if you want to walk, practice walking)

Occupational Therapy (OT):  
- Goal: Regain independence in daily activities (dressing, eating, cooking)
- Focus: Fine motor skills, adaptive strategies, home modifications
- Tools: Adaptive equipment (button hooks, plate guards, grab bars)
- Important: Addresses cognitive skills for daily life

Speech Therapy (SLP):
- Goal: Improve communication and/or swallowing
- For aphasia: Word-finding exercises, alternative communication strategies
- For dysarthria: Articulation practice, breathing exercises  
- For dysphagia: Safe swallowing techniques, diet modifications
- Tool: Augmentative communication devices for severe aphasia

**POST-STROKE FATIGUE:**
- Affects 50-70% of survivors
- NOT "just being tired" - it's neurological
- Causes: Brain working harder, poor sleep, medications, depression
- Management: Scheduled rest breaks, energy conservation techniques, good sleep hygiene
- It's OKAY to rest - rest is part of recovery, not laziness

**EMOTIONAL & PSYCHOLOGICAL:**
Post-Stroke Depression (30-50% of survivors):
- Symptoms: Sadness, loss of interest, hopelessness, sleep changes, appetite changes
- Can happen immediately or months later
- TREATABLE with therapy and/or medication
- Not a "character flaw" - it's a medical issue
- Encourage: "Please talk to your doctor. Depression after stroke is common and treatable."

Grief & Identity Loss:
- Survivors often grieve their "old self"
- Normal to feel frustrated, angry, or hopeless
- Recovery is not linear - setbacks happen
- Acknowledge: "You're not just recovering physically - you're adjusting to a big life change."

**CAREGIVER BURNOUT:**
- 75% of caregivers report moderate-to-severe stress
- Signs: Exhaustion, resentment, guilt, health problems, social isolation
- Encourage: Respite care, support groups, therapy, self-care
- Validate: "Taking care of yourself isn't selfish - it's necessary."

**SECONDARY PREVENTION (Preventing Second Stroke):**
Risk Factors to Control:
- High blood pressure (biggest risk factor)
- Atrial fibrillation (AFib) - requires blood thinners
- Diabetes - keep blood sugar controlled  
- High cholesterol - often need statins
- Smoking - MUST quit
- Obesity - weight loss helps multiple risk factors

Medication Adherence is CRITICAL:
- Blood thinners (if on warfarin/Eliquis/etc)
- Blood pressure meds
- Cholesterol meds (statins)
- Diabetes meds
- Skipping doses increases stroke risk dramatically

WARNING SIGNS OF STROKE (FAST):
- Face drooping
- Arm weakness  
- Speech difficulty
- Time to call 911!
Also: Sudden severe headache, vision loss, dizziness, confusion

**PRACTICAL LIVING:**
- Driving: Must be cleared by doctor. Some states require testing. Usually 3-6 months minimum.
- Work: Depends on job and impairments. Gradual return often works best.
- Relationships/Intimacy: Stroke affects roles and relationships. Open communication vital.
- Home Safety: Grab bars, remove rugs, good lighting, emergency call system

**ADAPTIVE EQUIPMENT:**
- Cane/walker: For balance and safety
- AFO (ankle-foot orthotic): Foot drop
- Button hook, zipper pull: One-handed dressing  
- Plate guard, rocker knife: One-handed eating
- Shower chair, grab bars: Bathroom safety
- Remind: "Adaptive equipment isn't giving up - it's being smart and safe."

=== CONVERSATION APPROACH ===
1. Start with active listening and emotional validation
2. Ask clarifying questions before giving advice
3. Break complex topics into simple parts
4. Use analogies for medical concepts
5. Offer specific, actionable next steps
6. End with encouragement based on their specific situation

=== SAFETY PROTOCOLS ===
**IMMEDIATE EMERGENCY** (tell user to call 911 NOW):
- Stroke symptoms (FAST): face droop, arm weakness, speech difficulty, sudden headache
- Chest pain, can't breathe, heart attack symptoms
- Suicidal thoughts: "want to die", "kill myself", "end it all"  
- Severe symptoms: worst headache ever, can't move suddenly, can't see

Response: "I'm very concerned. This sounds like a medical emergency. Please call 911 or your local emergency number RIGHT NOW. I'm here to support you, but I can't replace emergency care. Please get help immediately."

**CALL DOCTOR SOON** (not 911, but don't wait):
- New or worsening weakness
- Vision changes
- Persistent severe pain
- Signs of infection
- Confusion or cognitive changes

Response: "What you're describing is something your doctor should know about. It might not be urgent, but please call their office today or tomorrow. Would you like help preparing what to tell them?"

=== REMEMBER ===
- You are a GUIDE and COMPANION, not a medical professional
- Always acknowledge feelings before fixing
- Cite sources when making medical claims
- Be honest about limitations ("I'm not sure about that - please ask your doctor")
- Celebrate small wins  
- Never shame for setbacks
- Recovery is a marathon, not a sprint`;

console.log("🤖 Lilly Chat Edge Function initialized");

Deno.serve(async (req) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    // Only allow POST
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify user is authenticated
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('❌ Authentication failed:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Authenticated user:', user.id);

    // Parse request body
    const { message, history = [], userProfile = null, context: contextPayload = null } = await req.json();

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid message' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('❌ OPENAI_API_KEY not configured in Supabase secrets');
      return new Response(
        JSON.stringify({ error: 'Server configuration error. Please contact support.' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Build system prompt with context
    const today = new Date();
    const dateString = today.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    let systemPromptWithContext = SYSTEM_PROMPT + `\n\nCURRENT DATE: ${dateString}`;

    // Role and name from context (client) override profile; profile has stroke/recovery/impairments
    const role = (contextPayload?.role ?? userProfile?.role) || 'survivor';
    const userName = contextPayload?.userName ?? null;
    const roleLabel = role === 'survivor' ? 'Stroke Survivor' : role === 'caregiver' ? 'Caregiver' : 'Medical Staff';

    // Add user context (name, role, profile fields)
    systemPromptWithContext += `\n\n=== USER CONTEXT ===\n`;
    if (userName && typeof userName === 'string' && userName.trim()) {
      const firstName = userName.trim().split(/\s+/)[0];
      systemPromptWithContext += `User's first name: ${firstName}\n`;
    }
    systemPromptWithContext += `Role: ${roleLabel}\n`;
    if (userProfile) {
      const strokeDate = userProfile.stroke_date || 'not specified';
      const recoveryPhase = userProfile.recovery_phase || 'not specified';
      systemPromptWithContext += `Stroke Date: ${strokeDate}\n`;
      systemPromptWithContext += `Recovery Phase: ${recoveryPhase}\n`;
      if (userProfile.affected_side) {
        systemPromptWithContext += `Affected side: ${userProfile.affected_side}\n`;
      }
      if (userProfile.impairment_severity) {
        systemPromptWithContext += `Impairment severity: ${userProfile.impairment_severity}\n`;
      }
      if (userProfile.impairments && userProfile.impairments.length > 0) {
        systemPromptWithContext += `Impairments: ${userProfile.impairments.join(', ')}\n`;
      }
      if (userProfile.goals) {
        systemPromptWithContext += `Goals: ${userProfile.goals}\n`;
      }
    }

    // Today's status (from context)
    const todayLog = contextPayload?.todayLog;
    if (todayLog && typeof todayLog === 'object') {
      systemPromptWithContext += `\n=== TODAY'S STATUS ===\n`;
      if (todayLog.mood != null && todayLog.mood !== '') systemPromptWithContext += `Today's mood: ${todayLog.mood}\n`;
      if (typeof todayLog.pain_level === 'number') systemPromptWithContext += `Today's pain level (0-10): ${todayLog.pain_level}\n`;
      if (typeof todayLog.energy_level === 'number') systemPromptWithContext += `Today's energy level (0-10): ${todayLog.energy_level}\n`;
      const completed = todayLog.exercises_completed;
      const completedCount = Array.isArray(completed) ? completed.length : 0;
      systemPromptWithContext += `Exercises completed today: ${completedCount}\n`;
      if (todayLog.notes && todayLog.notes.trim()) systemPromptWithContext += `Notes: ${todayLog.notes.trim()}\n`;
    }

    // Recent activity (last 14 days)
    const recentLogs = contextPayload?.recentLogs;
    if (Array.isArray(recentLogs) && recentLogs.length > 0) {
      const logs = recentLogs as { log_date: string; mood?: string; pain_level?: number; energy_level?: number; exercises_completed?: string[] }[];
      const withExercises = logs.filter((l) => (l.exercises_completed?.length ?? 0) > 0);
      const activeDays = withExercises.length;
      const painLevels = logs.map((l) => l.pain_level).filter((p): p is number => typeof p === 'number');
      const energyLevels = logs.map((l) => l.energy_level).filter((e): e is number => typeof e === 'number');
      const avgPain = painLevels.length ? (painLevels.reduce((a, b) => a + b, 0) / painLevels.length).toFixed(1) : null;
      const avgEnergy = energyLevels.length ? (energyLevels.reduce((a, b) => a + b, 0) / energyLevels.length).toFixed(1) : null;
      systemPromptWithContext += `\n=== RECENT ACTIVITY (14 Days) ===\n`;
      systemPromptWithContext += `Days with at least one exercise completed: ${activeDays} of ${logs.length}\n`;
      if (avgPain != null) systemPromptWithContext += `Average pain level (when reported): ${avgPain}\n`;
      if (avgEnergy != null) systemPromptWithContext += `Average energy level (when reported): ${avgEnergy}\n`;
    }

    // Assigned exercises (from medical staff)
    const assignedExercises = contextPayload?.assignedExercises;
    if (Array.isArray(assignedExercises) && assignedExercises.length > 0) {
      systemPromptWithContext += `\n=== ASSIGNED EXERCISES ===\n`;
      assignedExercises.forEach((a: { exercise_id?: string; exercise_name?: string; due_date?: string; notes?: string }) => {
        const name = a.exercise_name || a.exercise_id || 'Unknown';
        const due = a.due_date ? ` (due ${a.due_date})` : '';
        const notes = a.notes ? ` - ${a.notes}` : '';
        systemPromptWithContext += `- ${name}${due}${notes}\n`;
      });
    }

    // How to use this context
    systemPromptWithContext += `\n=== HOW TO USE THIS CONTEXT ===\n`;
    systemPromptWithContext += `Use the above user and activity data naturally. When relevant: greet by first name, reference today's mood/pain/energy (e.g. if pain is high, suggest gentler options), acknowledge recent consistency or streaks, and mention assigned exercises if the user asks what to do. Keep responses warm and concise. Do not list raw numbers unless the user asks for specifics.\n`;

    // Build messages array
    const messages = [
      { role: 'system', content: systemPromptWithContext },
      ...history,
      { role: 'user', content: message },
    ];

    console.log('🤖 Calling OpenAI API...');

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    const openaiData = await openaiResponse.json();

    if (!openaiResponse.ok) {
      console.error('❌ OpenAI API Error:', openaiData);
      return new Response(
        JSON.stringify({
          error: 'Failed to get response from AI. Please try again.',
          details: openaiData.error?.message,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!openaiData.choices || openaiData.choices.length === 0) {
      console.error('❌ OpenAI returned no choices');
      return new Response(
        JSON.stringify({ error: 'No response from AI. Please try again.' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const aiText = openaiData.choices[0].message.content.trim();
    console.log('✅ OpenAI Response:', aiText.substring(0, 100) + '...');

    // Detect actions from AI response
    let action = null;
    if (aiText.toLowerCase().includes('exercise library') || aiText.toLowerCase().includes('navigate to exercises')) {
      action = { type: 'navigate', target: 'exercises' };
    } else if (aiText.toLowerCase().includes('progress dashboard') || aiText.toLowerCase().includes('check your progress')) {
      action = { type: 'navigate', target: 'progress' };
    }

    const isEmergency = aiText.toLowerCase().includes('call 911') ||
      aiText.toLowerCase().includes('emergency');

    // Return response
    return new Response(
      JSON.stringify({
        text: aiText,
        action,
        isEmergency,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('❌ Edge Function Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
