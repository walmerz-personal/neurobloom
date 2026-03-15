# NeuroBloom Product Requirements Document (PRD)

**Version:** 2.0  
**Last Updated:** November 27, 2025  
**Document Owner:** Zack (Katie's Recovery Team)  
**Status:** Ready for Development

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Vision & Mission](#product-vision--mission)
3. [Market Opportunity](#market-opportunity)
4. [Target Users](#target-users)
5. [User Personas](#user-personas)
6. [User Journey & Pain Points](#user-journey--pain-points)
7. [Core Product Principles](#core-product-principles)
8. [Platform Strategy](#platform-strategy)
9. [Feature Requirements](#feature-requirements)
10. [Lilly AI Specifications](#lilly-ai-specifications)
11. [Technical Requirements](#technical-requirements)
12. [Design & Accessibility Requirements](#design--accessibility-requirements)
13. [Success Metrics](#success-metrics)
14. [Development Phases](#development-phases)
15. [Risk Management](#risk-management)

---

## 1. Executive Summary

### The Problem
795,000 people suffer strokes annually in the US, with 90% facing lasting disabilities. Current stroke rehabilitation suffers from:
- **65% non-adherence** to home exercise programs
- **50% of survivors experience social isolation**
- **Fragmented support** - no comprehensive recovery platform exists
- **Hospital-to-home transition gap** - critical period with minimal support
- **Caregiver burden** - 75% report moderate-to-severe stress

### The Solution
**NeuroBloom** is a comprehensive iOS-first mobile platform addressing Mind (cognitive/speech), Body (physical therapy), and Soul (emotional/social) recovery, guided by Lilly - an AI companion trained in stroke rehabilitation science.

### Market Opportunity
- **Market Size:** $773M by 2034 (9-11% CAGR)
- **Total Addressable Market:** 101M stroke survivors globally
- **US Market:** 7M+ survivors, 795K new cases annually
- **Key Advantage:** First comprehensive mobile platform addressing all recovery dimensions with accessibility-first design

### Strategic Approach
**Phase 1 (Weeks 1-8):** Native iOS app MVP for rapid user validation with 10-20 beta testers
**Phase 2 (Months 3-6):** Web companion for caregivers and desktop coordination  
**Phase 3 (Months 7-9):** Android app for broader market reach
**Phase 4 (Months 10-12):** Scale and enterprise features

### Why iOS First?
- **User base**: Stroke survivors (65+) and caregivers are highly mobile-dependent
- **Daily engagement**: Phone is always with them, not tied to desktop
- **Accessibility**: iOS has best-in-class accessibility APIs (VoiceOver, VoiceControl, Switch Control)
- **Critical features**: Push notifications, offline videos, voice input essential for adherence
- **One-handed use**: Many survivors have hemiparesis and need mobile-optimized UI
- **Platform quality**: iOS users have higher income (can afford subscription) and more homogeneous devices (easier to ensure accessibility works)

---

## 2. Product Vision & Mission

### Vision Statement
*"To be the trusted companion for every stroke survivor and their family, transforming the overwhelming journey of recovery into one of hope, progress, and renewed independence."*

### Mission Statement
*"Provide comprehensive, accessible, and evidence-based stroke recovery support that addresses the whole person - their mind, body, and soul - while empowering caregivers with the tools they need to provide effective, sustainable support."*

### Core Value Proposition
**For Stroke Survivors:**
"Never face recovery alone. NeuroBloom provides personalized rehabilitation guidance, daily encouragement, and a clear path forward - all in one place."

**For Caregivers:**
"Coordinate care, track progress, and get expert guidance without the overwhelm. NeuroBloom helps you help them, while taking care of yourself too."

---

## 3. Market Opportunity

### Market Size & Growth
- **Global Stroke Rehabilitation Software Market:** $773M by 2034
- **CAGR:** 9-11% annually
- **Telehealth Component:** $108.4B by 2028 (37.7% CAGR)

### Target Market
- **Primary:** 7M+ stroke survivors in the US
- **Secondary:** 795K new strokes annually in the US
- **Tertiary:** 101M survivors globally

### Market Gaps (Our Advantages)
1. **No comprehensive platform** - competitors focus on single domains
2. **Insufficient caregiver support** - existing tools ignore caregivers
3. **Poor hospital-to-home transition** - critical period underserved
4. **Lack of emotional support** - apps focus on exercises, ignore mental health
5. **Accessibility failures** - most apps not designed for impairments

### Competitive Landscape
**Speech/Cognitive Rehab:**
- Constant Therapy ($200-400/year) - exercises only, no AI companion
- Lingraphica - expensive hardware ($4K-7K), limited scope

**Physical Rehab:**
- Neofect ($299-399 one-time) - gamification but no comprehensive approach
- MindMaze - VR-focused, requires expensive equipment

**Holistic/Support:**
- Stroke Companion (free) - basic tracking, no AI, no exercises
- Rehab Guru ($20-50/month) - for therapists, not direct-to-consumer

**Our Differentiation:**
- ✅ Only platform addressing Mind + Body + Soul
- ✅ AI companion (Lilly) trained specifically on stroke recovery
- ✅ Strong caregiver coordination tools
- ✅ Accessibility-first design
- ✅ Affordable pricing ($9-29/month)

---

## 4. Target Users

### Primary User: Stroke Survivors
**Demographics:**
- Age: 45-85 (majority 65+)
- Post-stroke timeline: Hospital discharge → 5+ years recovery
- Impairment types: Motor (60%), Speech (25-40%), Cognitive (50%), Vision (20-30%)
- Tech proficiency: Low to moderate

**Psychographics:**
- Determined but often overwhelmed
- Frustrated by lack of progress visibility
- Fearful of second stroke
- Socially isolated
- Seeking hope and validation

### Secondary User: Caregivers
**Demographics:**
- Relationship: Spouse (40%), Adult child (35%), Other family (25%)
- Age: 45-75
- Employment: 60% still working
- Tech proficiency: Moderate

**Psychographics:**
- Overwhelmed by coordination burden
- Guilty about own needs
- Frustrated by lack of guidance
- Isolated from support networks
- Desperate for help

### Tertiary Users
- **Physical/Occupational/Speech Therapists:** Track patient progress, assign exercises
- **Family Members:** Stay updated on progress from distance
- **Healthcare Systems:** Population health management (Phase 3+)

---

## 5. User Personas

### Primary Persona: Katie - The Determined Survivor

**Background:**
- Age: 52
- Stroke Type: Hemorrhagic stroke 5 years ago
- Impact: Lost control of left side, ongoing mobility challenges
- Living Situation: With spouse (primary caregiver)
- Employment: Former accountant, on disability

**Technology Profile:**
- Has smartphone (iPhone)
- Comfortable with basic apps
- Struggles with small touch targets
- Prefers voice when available

**Recovery Status:**
- **Physical:** Regained some mobility, still uses cane, limited left arm function
- **Cognitive:** Intact, but fatigues easily
- **Speech:** Fully recovered
- **Emotional:** Frustrated by plateau, worried about second stroke

**Goals:**
- Continue improving mobility
- Regain independence in daily activities
- Stay motivated during plateaus
- Prevent second stroke

**Pain Points:**
- Loses track of which exercises to do
- No one to celebrate small wins with
- Therapist visits only 1x/week - needs daily guidance
- Gets discouraged when progress stalls
- Fears she's doing exercises wrong

**What She Needs from NeuroBloom:**
- Daily exercise routine guidance
- Someone (Lilly) who understands stroke recovery
- Progress tracking that shows even small improvements
- Reminders without nagging
- Education on stroke prevention

**Key Quote:**
*"I just want to know I'm doing the right things and that I'm actually getting better, even if it's slow."*

---

### Secondary Persona: John - The Overwhelmed Caregiver

**Background:**
- Age: 54
- Relationship: Spouse of stroke survivor
- Employment: Full-time engineer, sometimes works from home
- Living Situation: Primary caregiver for wife

**Technology Profile:**
- Very tech-savvy (engineer)
- Always has phone available
- Appreciates efficiency and organization
- Comfortable with complex interfaces

**Caregiving Status:**
- **Duration:** 5 years since wife's stroke
- **Intensity:** High - manages all appointments, medications, exercises
- **Support:** Limited family nearby, doing most alone
- **Impact:** Exhausted, somewhat depressed, guilty about resentment

**Goals:**
- Keep wife safe and progressing
- Coordinate all medical appointments/therapy
- Track medications and exercises
- Find time for himself without guilt
- Understand what's normal vs. concerning

**Pain Points:**
- Paper calendars and notebooks everywhere
- Forgets which exercises therapist recommended
- Doesn't know if wife is doing exercises correctly when alone
- Can't be present 24/7 but feels guilty
- Has no one to ask "is this normal?"
- Burned out but can't stop

**What He Needs from NeuroBloom:**
- Central place to track everything
- Ability to monitor wife's progress remotely
- Clear guidance on what requires medical attention
- Caregiver self-care resources
- Connection to other caregivers

**Key Quote:**
*"I love my wife, but I'm drowning. I need someone to tell me what to do and when, and that it's okay to take a break."*

---

### Tertiary Persona: David - The Young Survivor with Severe Impairments

**Background:**
- Age: 38
- Stroke Type: Ischemic stroke 3 months ago
- Impact: Right hemiparesis, severe expressive aphasia
- Living Situation: Moved back with parents
- Employment: Former marketing manager, on medical leave

**Technology Profile:**
- Was very tech-savvy pre-stroke
- Now struggles with fine motor control
- Cannot type easily or speak clearly
- Extremely frustrated by communication barriers

**Recovery Status:**
- **Physical:** Limited right side use, uses wheelchair
- **Cognitive:** Intact comprehension, severely limited expression
- **Speech:** Can understand everything, can't form words (non-fluent aphasia)
- **Emotional:** Depressed, angry, isolated from friends

**Goals:**
- Regain ability to communicate
- Return to work eventually
- Maintain sense of identity and independence
- Rebuild social connections

**Pain Points:**
- Most apps require typing or clear speech
- Friends stopped visiting because communication is too hard
- Feels "trapped inside" his own mind
- Can't express pain, needs, or emotions effectively
- Traditional speech therapy only 2x/week

**What He Needs from NeuroBloom:**
- **CRITICAL:** Interface that works with severe motor and speech impairments
- Speech therapy exercises he can do independently
- Alternative communication methods (picture boards, word prediction)
- Understanding companion who knows aphasia
- Connection to others with aphasia

**Accessibility Requirements:**
- Large touch targets (minimum 44x44px)
- Voice input when possible, alternatives when not
- Visual communication options
- One-handed operation
- Error tolerance and undo

**Key Quote:**
*[David can't easily express this, but if he could:] "I know what I want to say. I just need tools that work with my body as it is now, not as it used to be."*

---

### Supporting Persona: Maria - The Long-Distance Family Member

**Background:**
- Age: 48
- Relationship: Daughter of stroke survivor
- Location: Lives 300 miles from mother
- Employment: Busy professional with family

**Technology Profile:**
- Very comfortable with technology
- Always checking phone
- Appreciates notifications and updates
- Values quick information access

**Goals:**
- Stay informed about mother's condition
- Support father (primary caregiver)
- Know when to visit vs. when remote support is enough
- Reduce guilt about distance

**Pain Points:**
- Feels out of the loop on mother's daily status
- Father doesn't want to "bother" her with updates
- Doesn't know what questions to ask doctors
- Can't tell if father is coping or needs help
- Visits feel chaotic, no clear way to help

**What She Needs from NeuroBloom:**
- Automatic progress updates
- Ability to see mother's exercise completion
- Communication channel with primary caregiver
- Clear indicators of when concern is warranted
- Specific ways to help remotely

**Key Quote:**
*"I just want to know Mom is okay and that Dad isn't carrying this all alone. I'd help more if I knew what to do."*

---

## 6. User Journey & Pain Points

### Timeline: Hospital Discharge to Long-Term Recovery

#### Phase 1: Hospital Discharge to Week 2 (Crisis Mode)
**Timeline:** Days 1-14 post-discharge

**Survivor Experience:**
- Overwhelmed by new physical limitations
- Terrified and grieving former life
- In pain, exhausted
- Receiving intensive therapy (if insured)
- Desperate for hope

**Caregiver Experience:**
- In complete shock and panic mode
- Scrambling to learn medication schedules
- Home modifications happening
- No sleep, high stress
- Drowning in paperwork and appointments

**Current Gaps:**
- Hospital discharge instructions are overwhelming paper packets
- No clear "what to do today" guidance
- Dozens of new medications to track
- Multiple specialist appointments to coordinate
- No support for emotional trauma
- Family has no idea how to help

**NeuroBloom Opportunity:**
- 🎯 **Guided onboarding wizard** - "We know this is overwhelming. Let's start simple."
- 🎯 **Daily starter tasks** - Just 1-2 things to do today
- 🎯 **Medication tracker** with reminders
- 🎯 **Lilly's "First Week" program** - specialized support for this phase
- 🎯 **Caregiver emergency resources** - What's normal vs. ER-worthy

---

#### Phase 2: Weeks 2-12 (Intensive Recovery)
**Timeline:** Weeks 2-12 post-stroke

**Survivor Experience:**
- Attending outpatient therapy 3-5x/week (if insured)
- Learning exercises to do at home
- Seeing initial improvements, which is encouraging
- Still very fatigued
- Beginning to process what happened

**Caregiver Experience:**
- Driving to countless appointments
- Taking notes at therapy sessions
- Trying to help with exercises at home
- Managing medications becoming routine
- Returning to work (maybe) while caregiving

**Current Gaps:**
- Can't remember all exercises from therapy
- Don't know if doing exercises correctly at home
- Progress feels slow, hard to see improvements
- Isolation setting in - social life gone
- Therapists each give different instructions
- No idea if pain/fatigue is normal
- 65% stop doing home exercises correctly

**NeuroBloom Opportunity:**
- 🎯 **Exercise library** with video demonstrations
- 🎯 **Lilly guides exercises** - "Let's do your shoulder exercises"
- 🎯 **Progress tracking** showing small wins
- 🎯 **Integration with therapist notes** (Phase 2)
- 🎯 **Daily check-ins** - Track pain, fatigue, mood
- 🎯 **Caregiver coordination** - Shared calendar, notes
- 🎯 **Educational content** - What to expect at each phase

---

#### Phase 3: Months 3-6 (The Plateau Begins)
**Timeline:** Months 3-6 post-stroke

**Survivor Experience:**
- Therapy reducing to 1-2x/week or stopping
- Initial rapid gains slowing down
- Frustration and depression increasing
- More independence but still significant limitations
- Wondering "is this as good as it gets?"

**Caregiver Experience:**
- Settling into "new normal" routine
- Some relief as independence increases
- Guilt about feeling relieved
- Returning to work full-time
- Worried about long-term sustainability

**Current Gaps:**
- Therapy reduction feels like abandonment
- Don't know what exercises to do now
- Hard to stay motivated when progress slows
- Social isolation deepening
- No support for depression/anxiety
- This is when 65% stop home exercises completely

**NeuroBloom Opportunity:**
- 🎯 **Lilly's plateau coaching** - "Plateaus are normal, here's what to do"
- 🎯 **Progress graphs** showing long-term trends
- 🎯 **Community features** - Connect with others (Phase 2)
- 🎯 **Adaptive exercise plans** - Adjusts to current capabilities
- 🎯 **Mental health resources** - Depression screening, coping strategies
- 🎯 **Gamification** - Badges, streaks to maintain motivation
- 🎯 **Caregiver respite planning** - Schedule breaks, self-care

---

#### Phase 4: Months 6-12 (Settling In)
**Timeline:** Months 6-12 post-stroke

**Survivor Experience:**
- Therapy likely ended
- Some functions recovered, some may never return
- Learning to adapt rather than recover
- Adjusting identity and expectations
- Either finding new independence or accepting dependence

**Caregiver Experience:**
- New normal established
- Exhaustion becoming chronic
- Relationship dynamics shifted
- Financial stress if patient can't work
- Need ongoing support but services ending

**Current Gaps:**
- Medical system considers them "recovered"
- No ongoing therapy or support
- Adaptive equipment confusing to get
- Social connections still limited
- Don't know what's possible to still improve
- Caregiver burnout increasing

**NeuroBloom Opportunity:**
- 🎯 **Maintenance programs** - Keep gains, prevent decline
- 🎯 **Adaptation strategies** - Live well with limitations
- 🎯 **Lilly long-term companion** - Consistent presence
- 🎯 **Secondary prevention** - Lifestyle for preventing second stroke
- 🎯 **Caregiver support groups** (Phase 2)
- 🎯 **New goal setting** - Focus on quality of life
- 🎯 **Resource directory** - Adaptive equipment, services

---

#### Phase 5: Year 1+ (Long-Term Living)
**Timeline:** 12+ months post-stroke

**Survivor Experience:**
- Living with new baseline
- Some still improving slowly
- Risk of decline without continued exercise
- Fear of second stroke
- Finding meaning and purpose again

**Caregiver Experience:**
- Long-term sustainability concerns
- Relationship satisf action issues
- Need for ongoing support
- Planning for future unknowns

**Current Gaps:**
- No long-term follow-up care
- Risk of losing gains without structure
- Continued isolation
- Second stroke prevention guidance unclear
- Quality of life plateau

**NeuroBloom Opportunity:**
- 🎯 **Lifetime companion** - Lilly knows entire journey
- 🎯 **Continued engagement** - New challenges, content
- 🎯 **Health monitoring** - Detect decline early
- 🎯 **Prevention programs** - Diet, exercise, medication adherence
- 🎯 **Renewed purpose** - Help others, share story (Phase 3)
- 🎯 **Caregiver long-term support**

---

## 7. Core Product Principles

### 1. Accessibility Is Not Optional
**Principle:** Every feature must work for users with significant impairments from day one.

**Implications:**
- Large touch targets (minimum 44x44px, prefer 60x60px)
- High contrast ratios (WCAG AAA: 7:1 for text)
- Voice control for all primary functions
- Alternative input methods (switch control, head tracking compatible)
- One-handed operation for everything
- Error forgiveness (easy undo, no data loss)
- Clear, simple language (6th grade reading level)
- Visual alternatives to audio, audio alternatives to visual

**Anti-patterns to Avoid:**
- ❌ Small buttons or touch targets
- ❌ Relying solely on color to convey information
- ❌ Complex gestures (pinch, multi-touch)
- ❌ Time-limited interactions
- ❌ Text under 16px
- ❌ Medical jargon without explanation

---

### 2. Lilly Is a Guide, Not a Replacement
**Principle:** AI enhances human care but never replaces professional medical advice.

**Implications:**
- Lilly always defers to healthcare providers
- Clear disclaimers about limitations
- Red flags immediately escalate to emergency
- Cites clinical sources for advice
- Encourages sharing progress with doctors
- Never diagnoses conditions
- Suggests when to seek professional help

**What Lilly CAN Do:**
- ✅ Explain therapy exercises
- ✅ Provide encouragement and motivation
- ✅ Answer questions about stroke recovery
- ✅ Help track symptoms and progress
- ✅ Teach coping strategies
- ✅ Connect information from multiple sources

**What Lilly CANNOT Do:**
- ❌ Diagnose medical conditions
- ❌ Prescribe medications or changes
- ❌ Override doctor recommendations
- ❌ Provide crisis mental health counseling
- ❌ Replace emergency services

---

### 3. Never Lose Progress
**Principle:** Every bit of effort a user puts into recovery is precious and must be preserved.

**Implications:**
- Automatic saving of all user input
- Offline functionality with sync
- Version history for all entries
- Explicit confirmation before deleting anything
- Data export at any time
- Clear backup status indicators
- Graceful degradation if features unavailable

**Technical Requirements:**
- Local-first architecture
- Conflict resolution for offline edits
- Regular automated backups
- Data redundancy
- Easy undo for all actions

---

### 4. Default to Encouragement, Not Punishment
**Principle:** Recovery is hard enough. The app should celebrate effort, not shame gaps.

**Implications:**
- Missed exercises acknowledged, not punished
- Streak breaks don't reset to zero
- Progress visualized with compassion
- Setbacks reframed as temporary
- Focus on effort and consistency, not perfection
- Notifications are gentle invitations, not guilt trips

**Anti-patterns to Avoid:**
- ❌ "You broke your streak!" messages
- ❌ Comparison to others (unless opt-in)
- ❌ Harsh language about missed activities
- ❌ Aggressive push notifications
- ❌ Removing earned badges or achievements

**Preferred Patterns:**
- ✅ "Welcome back! Ready to continue?"
- ✅ "You've completed 4 out of 5 days this week - amazing effort!"
- ✅ "It's okay to take breaks. Your progress is still here."
- ✅ Celebrate attempts, not just completions

---

### 5. Privacy and Security Are Sacred
**Principle:** Health data is deeply personal. Users must trust us completely.

**Implications:**
- HIPAA compliance from day one
- End-to-end encryption for sensitive data
- Granular sharing controls
- Clear privacy policy in plain language
- Easy data deletion
- No selling of user data, ever
- Transparent about how AI uses their data

**Technical Requirements:**
- Encryption at rest and in transit
- Role-based access control
- Audit logs for data access
- Regular security audits
- HIPAA-compliant infrastructure
- Data retention policies

---

### 6. Caregiver Coordination Is Core, Not Optional
**Principle:** Stroke recovery is a team sport. The app must serve both patient and caregiver.

**Implications:**
- Shared calendars and task lists
- Communication tools between patient and caregivers
- Caregiver-specific resources and support
- Permission controls for sensitive information
- Progress visible to approved caregivers
- Caregiver respite planning tools
- Support for multiple caregivers (primary, secondary, long-distance)

---

### 7. Start Simple, Grow Complex
**Principle:** New users are overwhelmed. The app should feel simple initially and reveal complexity gradually.

**Implications:**
- Onboarding introduces one concept at a time
- Dashboard starts with 2-3 key actions
- Advanced features hidden until needed
- Progressive disclosure of capabilities
- Personalization happens over time
- User can always access "beginner mode"

**First Session Experience:**
- Welcome from Lilly
- 2-3 questions to personalize
- One simple task to complete
- Clear next steps
- Success feels achievable

---

## 8. Platform Strategy

### Why iOS-First for MVP?

**Strategic Decision:** Build native iOS application first (Weeks 1-8), then web companion (Months 3-6), then Android (Months 7-9).

**Rationale:**

**Why iOS-First Makes Sense for Our Users:**

1. **Stroke Survivors (Primary Users):**
   - Most are 65+ and more comfortable with phones than computers
   - Phone is always with them (bedside table, pocket, wherever they are)
   - Can use one-handed if needed (critical for hemiparesis)
   - Daily exercises happen in living room, not at desk
   - Voice features more accessible on iOS (Siri, VoiceControl built-in)
   - Notifications for exercise reminders are crucial for adherence

2. **Caregivers (Secondary Users):**
   - On the move constantly (work, errands, appointments)
   - Need to check in while away from home
   - Want push notifications when survivor completes exercises
   - Quick access needed, not sitting at desktop
   - Need to coordinate care while commuting, at grocery store, etc.

3. **Daily Engagement Patterns:**
   - Daily check-ins are easier on phone (quick, casual, habitual)
   - Exercise videos more likely to watch on phone in living room
   - Chat with Lilly during downtime (waiting room, before bed, on couch)
   - Progress tracking feels more personal on mobile device
   - 24/7 companion in pocket, not tied to desk

4. **iOS vs Android First:**
   - Higher income demographics = better able to afford subscription
   - More homogeneous platform = easier to ensure accessibility works
   - Better accessibility APIs (VoiceControl, Switch Control, VoiceOver)
   - TestFlight makes beta testing smoother
   - Single device ecosystem to test (fewer variations than Android)

**What Web Becomes (Phase 2):**
The web platform will serve different use cases:
- **Caregiver coordination hub** - Large calendar view, task management on desktop
- **Therapist dashboard** - View patient progress, assign exercises (Phase 3)
- **Long-form content** - Educational articles, stroke prevention resources
- **Family updates** - Long-distance family can check in without app download
- **Onboarding preview** - Let people explore before downloading app

**The Strategy:**
1. **Weeks 1-8:** iOS MVP with 10-20 beta users validates concept
2. **Months 3-6:** Web companion for caregivers and coordination
3. **Months 7-9:** Android version using learnings from iOS
4. **Months 10-12:** Scale and enterprise features across all platforms

---

### Technical Platform: iOS MVP

**Development Approach:** Native iOS using SwiftUI
**Language:** Swift 6.1+
**Minimum iOS Version:** iOS 17+ (for latest accessibility APIs)
**Database & Backend:** Supabase (PostgreSQL + real-time + auth + storage)
**AI:** Anthropic Claude API for Lilly
**Local Storage:** SwiftData for offline-first architecture
**Video Delivery:** Supabase Storage with CDN
**Analytics:** PostHog (privacy-focused)
**Monitoring:** Sentry for error tracking
**Testing:** XCTest + XcodeBuildMCP for Claude Code integration

**Why These Choices:**
- **SwiftUI:** Declarative UI, built-in accessibility, modern iOS development
- **Swift 6.1:** Latest language features, better concurrency, improved safety
- **iOS 17+:** Access to latest accessibility APIs (critical for our users)
- **Supabase:** Backend-as-a-service handles auth, database, real-time, storage
- **SwiftData:** Apple's modern data persistence (replaces Core Data)
- **Claude API:** Best-in-class conversational AI for Lilly
- **Offline-first:** Videos and progress cached locally, sync when online
- **XcodeBuildMCP:** Allows Claude Code to build, test, and iterate on iOS app

**Development Environment:**
- **IDE:** Xcode 16+ (required for iOS 17+ development)
- **AI Assistance:** Claude Code with XcodeBuildMCP integration
- **Version Control:** Git + GitHub
- **TestFlight:** For beta testing with real users
- **App Store Connect:** For eventual public release

**iOS-Specific Features We'll Leverage:**
- VoiceOver for screen reader support
- VoiceControl for hands-free navigation
- Switch Control for users with limited mobility
- Dynamic Type for text size adjustment
- Haptic feedback for tactile confirmation
- HealthKit integration (future: track activity, heart rate)
- Siri Shortcuts (future: "Hey Siri, start my exercises")
- Push Notifications for reminders and caregiver updates
- FaceID/TouchID for secure, easy login

---

## 9. Feature Requirements

### Phase 1 MVP Features (Web, Weeks 1-6)

#### 9.1 Authentication & Onboarding

**Feature:** User Registration and Profile Creation

**User Stories:**
- As a stroke survivor, I want to create an account quickly so I can start using the app
- As a caregiver, I want to create a linked account so I can coordinate with my loved one

**Acceptance Criteria:**
- [ ] Email/password registration
- [ ] Google OAuth option
- [ ] Email verification
- [ ] Profile creation wizard:
  - [ ] Name and role (survivor/caregiver)
  - [ ] Stroke date (if survivor)
  - [ ] Impairment types (checkboxes: motor, speech, cognitive, vision)
  - [ ] Current recovery phase (dropdown)
  - [ ] Goals (free text, optional)
- [ ] Privacy policy acceptance
- [ ] HIPAA consent forms
- [ ] Account linking (survivors can invite caregivers)

**Technical Specifications:**
- Supabase Auth for authentication
- Row Level Security (RLS) policies
- Password requirements: 12+ characters, mixed case, numbers
- Session management: 30-day remember me
- Rate limiting on registration to prevent spam

**Design Requirements:**
- Large, clear form fields
- Progress indicator for multi-step wizard
- Ability to skip optional questions
- Auto-save draft registration

**Success Metrics:**
- 90%+ registration completion rate
- <3 minutes to complete onboarding
- 60%+ enable caregiver linking

---

#### 9.2 Lilly AI Chat Interface

**Feature:** Conversational AI companion for stroke recovery support

**User Stories:**
- As a survivor, I want to ask questions about recovery and get helpful answers
- As a caregiver, I want to ask if symptoms are normal without calling the doctor
- As a user, I want to feel heard and supported, not judged

**Acceptance Criteria:**
- [ ] Chat interface with message history
- [ ] Lilly responds within 3 seconds
- [ ] Lilly personality: Warm, knowledgeable, empathetic, never condescending
- [ ] Lilly remembers context from previous conversations
- [ ] Lilly cites sources for medical claims (e.g., "According to the American Stroke Association...")
- [ ] Lilly flags emergencies ("You should call 911 if...")
- [ ] Lilly suggests relevant exercises or content
- [ ] Voice input option (browser Web Speech API)
- [ ] Text-to-speech for Lilly's responses (optional, user can enable)
- [ ] Conversation history saved and searchable

**Lilly Capabilities (MVP):**
- ✅ Answer questions about stroke recovery
- ✅ Explain therapy exercises
- ✅ Provide emotional support and encouragement
- ✅ Help set realistic goals
- ✅ Suggest when to contact healthcare provider
- ✅ Track progress informally through conversation
- ✅ Teach coping strategies for common challenges

**Lilly Limitations (Enforced):**
- ❌ Never diagnoses conditions
- ❌ Never recommends medication changes
- ❌ Never overrides doctor's advice
- ❌ Cannot provide crisis counseling (refers to hotlines)
- ❌ Cannot access other users' data (HIPAA)

**Technical Specifications:**
- Anthropic Claude 3.5 Sonnet API
- System prompt with stroke rehab knowledge base
- Conversation memory (last 20 messages in context)
- Streaming responses for perceived speed
- Fallback to cached responses if API down
- Rate limiting: 100 messages/day per user (MVP)
- Profanity filter and abuse detection

**Prompt Engineering:**
- Specialized system prompt with stroke recovery protocols
- Few-shot examples for typical questions
- Response templates for medical disclaimers
- Emergency keyword detection (chest pain, stroke symptoms, suicidal ideation)

**Design Requirements:**
- Chat bubbles clearly distinguish user vs. Lilly
- Large text (18px minimum)
- High contrast (black text on white, or user preference)
- Voice input button prominent and easy to hit
- Typing indicator when Lilly is thinking
- Graceful error messages if AI unavailable

**Success Metrics:**
- 70%+ users interact with Lilly in first week
- Average 5+ messages per session
- 80%+ positive sentiment in feedback
- <5% conversations flagged for safety review
- <1% emergency escalations

---

#### 9.3 Exercise Library (Basic)

**Feature:** Video library of common stroke rehabilitation exercises

**User Stories:**
- As a survivor, I want to see how to do exercises correctly so I don't hurt myself
- As a caregiver, I want to help my loved one do exercises without needing to remember therapist instructions

**Acceptance Criteria:**
- [ ] 15-20 exercises in MVP covering:
  - [ ] 5 upper extremity (arm, hand, shoulder)
  - [ ] 5 lower extremity (leg, ankle, foot)
  - [ ] 3 balance and core
  - [ ] 3 speech/swallowing
  - [ ] 2-4 cognitive (memory games, attention exercises)
- [ ] Each exercise includes:
  - [ ] Short video demonstration (30-60 seconds)
  - [ ] Text instructions (simple, numbered steps)
  - [ ] Difficulty level (beginner/intermediate/advanced)
  - [ ] Equipment needed (if any)
  - [ ] Safety tips and contraindications
  - [ ] Recommended frequency/duration
- [ ] Search and filter by body part, difficulty
- [ ] Mark exercises as favorites
- [ ] Lilly can recommend exercises based on user profile

**Technical Specifications:**
- Videos hosted on Mux or similar (CDN-delivered)
- Video player with play/pause, speed control, rewind 10s
- Responsive video (works on mobile and desktop)
- Lazy loading for performance
- Supabase storage for metadata

**Content Requirements:**
- Videos filmed by licensed physical therapist (or sourced legally)
- Demonstrated by someone with visible limitations (authentic)
- Clear camera angles showing form
- Audio instructions for visually impaired
- Captions for hearing impaired

**Design Requirements:**
- Large thumbnail images
- Clear labels with icons
- Grid layout on desktop, list on mobile
- Easy navigation back to exercise list

**Success Metrics:**
- 50%+ users watch at least one exercise video
- Average 3+ exercises viewed per session
- 30%+ complete an exercise after viewing

---

#### 9.4 Daily Check-In & Progress Tracking

**Feature:** Quick daily check-in to log exercises completed, symptoms, and mood

**User Stories:**
- As a survivor, I want to track what exercises I did so I can see progress over time
- As a survivor, I want to log how I'm feeling so Lilly can understand my patterns
- As a caregiver, I want to see if my loved one is doing their exercises

**Acceptance Criteria:**
- [ ] Daily check-in prompt (appears once per day)
- [ ] Quick log interface:
  - [ ] Exercise completion (checkboxes for prescribed exercises)
  - [ ] Pain level (0-10 scale with emoji faces)
  - [ ] Fatigue level (0-10 scale)
  - [ ] Mood (5 emoji options: great, good, okay, bad, terrible)
  - [ ] Notes (optional free text)
- [ ] Can log historical entries (missed yesterday? Can still log it)
- [ ] Progress dashboard showing:
  - [ ] Exercise completion rate (weekly view)
  - [ ] Pain/fatigue trends (line chart)
  - [ ] Mood patterns over time
  - [ ] Motivational stats (total exercises completed, current streak)
- [ ] Share progress with linked caregiver (optional)
- [ ] Export data as CSV or PDF for doctor visits

**Technical Specifications:**
- Supabase real-time for caregiver updates
- Daily check-in trigger at user-selected time
- Data stored in `daily_logs` table
- Charts rendered with Recharts or similar library
- Offline logging with sync when online

**Design Requirements:**
- Large emoji buttons for mood
- Slider interface for pain/fatigue (easy to adjust)
- Green checkmarks for completed exercises (visual reinforcement)
- Streak counter prominent (but non-punishing if broken)
- Graphs simple and not overwhelming

**Success Metrics:**
- 60%+ daily check-in completion rate
- 40%+ users view progress dashboard weekly
- 20%+ share progress with caregiver
- 30%+ export data for doctor visits

---

#### 9.5 Caregiver Coordination (Basic)

**Feature:** Shared calendar and task management between survivor and caregivers

**User Stories:**
- As a caregiver, I want to see upcoming appointments so I can plan my schedule
- As a caregiver, I want to assign tasks to myself or others so we can divide responsibilities
- As a survivor, I want to see who's helping with what so I feel supported

**Acceptance Criteria:**
- [ ] Shared calendar view (week and month views)
- [ ] Add events:
  - [ ] Medical appointments (doctor, PT, OT, speech therapy)
  - [ ] Medication reminders
  - [ ] Exercise sessions
  - [ ] Personal events
- [ ] Task list shared among care team:
  - [ ] Assignable to specific person or "anyone"
  - [ ] Due dates
  - [ ] Priority levels
  - [ ] Mark complete
- [ ] Notifications for:
  - [ ] Upcoming appointments (24hr and 1hr before)
  - [ ] Task assignments
  - [ ] Task completions
- [ ] Multiple caregivers can be linked (primary, secondary, etc.)
- [ ] Permissions: Survivor can control what caregivers see

**Technical Specifications:**
- Supabase real-time subscriptions for live updates
- `events` and `tasks` tables with RLS policies
- iCal export for personal calendars
- Email and in-app notifications (Supabase triggers)

**Design Requirements:**
- Calendar color-coded by event type
- Easy tap/click to add events
- Task list sortable by due date or priority
- Clear indication of who's assigned to what

**Success Metrics:**
- 40%+ survivor-caregiver pairs use shared calendar
- Average 3+ caregivers linked per survivor
- 50%+ tasks marked complete within due date

---

### Phase 2 Features (Mobile Apps, Months 3-6)

*(High-level overview only - will be detailed when starting Phase 2)*

#### 9.6 Offline Exercise Videos
- Download videos for offline viewing
- Guided workout sessions with timer and rep counter
- Form checking with camera (stretch goal)

#### 9.7 Native Push Notifications
- Exercise reminders
- Medication reminders
- Motivational messages from Lilly
- Caregiver updates

#### 9.8 Community Features
- Anonymous forums for survivors and caregivers
- Moderated support groups
- Success story sharing
- Peer mentorship matching (opt-in)

#### 9.9 Health App Integration
- Apple Health and Google Fit sync
- Track steps, heart rate, sleep
- Integrate data into progress tracking

#### 9.10 Advanced Lilly Features
- Proactive check-ins ("How was PT today?")
- Weekly progress summaries
- Goal setting and planning
- Mood tracking with conversation analysis

---

### Phase 3 Features (Months 7-12)

*(High-level overview only)*

#### 9.11 Telehealth Integration
- Video calls with therapists
- Share progress data with providers
- Prescription of exercises by therapists

#### 9.12 Advanced Analytics
- Predictive insights on recovery trajectory
- Anomaly detection (potential decline alerts)
- Personalized exercise recommendations based on progress

#### 9.13 Enterprise Features
- Hospital/clinic licensing
- Population health dashboard for providers
- Outcome measurement tools
- Insurance integration

---

## 10. Lilly AI Specifications

### 10.1 Lilly's Personality & Tone

**Core Personality Traits:**
- **Warm but not saccharine** - Genuinely caring, not fake enthusiasm
- **Knowledgeable but humble** - Cites sources, admits limitations
- **Patient but not patronizing** - Explains clearly without condescension
- **Encouraging but realistic** - Celebrates effort, acknowledges hard truths
- **Present but not intrusive** - Available when needed, not nagging

**Voice & Tone Guidelines:**
- Use "you" and "I" (conversational, not clinical)
- Short sentences (easier to process)
- Active voice preferred
- Avoid medical jargon unless explaining it
- Use analogies and metaphors for complex concepts
- Acknowledge emotions before solving problems
- Never rush the user

**Example Interactions:**

**Good:**
> **User:** I'm so frustrated. My arm isn't getting better.
> 
> **Lilly:** I hear you. Recovery can feel really slow, especially when you're putting in so much effort. Can you tell me more about what you've noticed? Sometimes progress shows up in small ways we don't immediately recognize.

**Bad (too clinical):**
> **Lilly:** Neuroplasticity requires consistent repetition over extended timeframes. Continue your prescribed exercise regimen.

**Bad (too cheerful):**
> **Lilly:** Don't be frustrated! You're doing AMAZING! Keep that positive attitude! 🌟

---

### 10.2 Lilly's Knowledge Base

**Core Knowledge Domains:**

1. **Stroke Types & Recovery**
   - Ischemic vs. hemorrhagic
   - Recovery timelines and expectations
   - Neuroplasticity principles
   - Common complications

2. **Rehabilitation Therapies**
   - Physical therapy exercises and rationale
   - Occupational therapy strategies
   - Speech therapy for aphasia, dysarthria, dysphagia
   - Cognitive rehabilitation techniques

3. **Secondary Prevention**
   - Risk factors (hypertension, diabetes, cholesterol, etc.)
   - Lifestyle modifications
   - Medication adherence importance
   - Warning signs of second stroke

4. **Emotional & Psychological Support**
   - Post-stroke depression (very common, ~30%)
   - Anxiety and fear
   - Grief and identity adjustment
   - Caregiver burnout
   - Coping strategies

5. **Practical Living**
   - Adaptive equipment
   - Home safety modifications
   - Driving after stroke
   - Return to work considerations
   - Relationship and intimacy

6. **Caregiver Support**
   - Managing stress and burnout
   - Communication strategies
   - Respite care resources
   - Legal and financial planning

**Sources (to be compiled):**
- American Stroke Association guidelines
- National Institute of Health stroke resources
- Clinical studies from medical journals
- Patient advocacy organization content
- Interviews with stroke survivors (with consent)

---

### 10.3 Safety Protocols

**Emergency Detection:**
Lilly monitors for keywords/phrases indicating urgent medical need:

**Immediate Emergency (suggests calling 911):**
- Stroke symptoms: "face drooping", "arm weakness", "speech difficulty", "sudden headache"
- Cardiac: "chest pain", "heart attack", "can't breathe"
- Mental health crisis: "want to die", "kill myself", "end it all"
- Severe symptoms: "can't move", "can't see", "worst headache of my life"

**Escalation Needed (suggests calling doctor):**
- New or worsening weakness
- Vision changes
- Severe pain not responsive to medication
- Persistent vomiting
- Confusion or cognitive changes
- Signs of infection

**Response Template:**
> I'm concerned about what you're describing. This sounds like something that needs immediate medical attention. Please:
> 
> 1. Call 911 (or your local emergency number) right now, or
> 2. Have someone take you to the emergency room immediately
> 
> I'm here to support you, but I can't replace emergency medical care. Please seek help now, and you can update me when you're safe.

**Non-Emergency but Recommend Doctor:**
> What you're describing is something your doctor should know about. It may not be urgent, but it's worth a call to their office. Would you like me to help you prepare what to tell them?

---

### 10.4 Conversation Management

**Context Retention:**
- Lilly remembers last 20 messages in conversation
- Long-term memory: User profile, goals, progress milestones
- References past conversations naturally ("Last week you mentioned...")

**Conversation Flow:**
- Starts with active listening and validation
- Asks clarifying questions before giving advice
- Breaks complex topics into digestible parts
- Summarizes key points at end
- Offers next steps or resources

**Handling Difficult Conversations:**

**User is depressed/hopeless:**
- Validate feelings without toxic positivity
- Gently remind of past wins
- Suggest one tiny achievable step
- Offer to connect with mental health resources
- Check in more frequently

**User is angry/frustrated:**
- Let them vent without interruption
- Reflect their emotions ("That sounds incredibly frustrating")
- Avoid defensive responses
- Once calmer, problem-solve together

**User has unrealistic expectations:**
- Acknowledge their hopes with empathy
- Gently introduce realistic timelines
- Focus on what IS possible
- Celebrate alternative wins

---

### 10.5 Technical Implementation

**AI Model:** Anthropic Claude 3.5 Sonnet (via API)

**System Prompt Structure:**
```
You are Lilly, an AI companion for stroke recovery. You provide support to stroke survivors and their caregivers.

CORE KNOWLEDGE:
[Stroke recovery knowledge base - 5,000+ words compiled]

PERSONALITY:
[Personality guidelines from above]

SAFETY PROTOCOLS:
[Emergency detection rules]

CURRENT USER CONTEXT:
- Name: {user_name}
- Role: {survivor/caregiver}
- Stroke Date: {date}
- Impairments: {list}
- Current Phase: {phase}
- Recent Progress: {summary}

CONVERSATION HISTORY:
[Last 20 messages]

YOUR TASK:
Respond to the user's message with warmth, knowledge, and care. Remember you are a guide, not a medical professional. Cite sources when making medical claims. Flag emergencies immediately.
```

**Response Pipeline:**
1. User message received
2. Check for emergency keywords → If found, trigger emergency response
3. Load user context from database
4. Load recent conversation history
5. Construct full prompt with system + context + history + user message
6. Call Claude API with streaming enabled
7. Stream response back to frontend
8. Save conversation to database
9. Update user's interaction log

**Rate Limiting & Costs:**
- MVP: 100 messages/user/day
- Estimated cost: $0.01-0.03 per conversation
- Monthly budget: $500/month covers 15,000-50,000 messages
- Monitor abuse and adjust limits

**Quality Assurance:**
- Log all conversations (with user consent)
- Random sampling for quality review
- Flag conversations with negative sentiment
- User feedback after each interaction (thumbs up/down)
- Monthly review of flagged conversations

---

## 11. Technical Requirements

### 11.1 Technology Stack (Phase 1 iOS MVP)

**iOS Application:**
- **Framework:** SwiftUI (declarative UI, built-in accessibility)
- **Language:** Swift 6.1+
- **Minimum iOS:** iOS 17+ (for latest accessibility APIs)
- **Architecture:** MVVM (Model-View-ViewModel)
- **State Management:** SwiftUI @State, @Observable, @Environment
- **Networking:** URLSession with async/await
- **Local Storage:** SwiftData (Apple's modern data framework)
- **Offline Storage:** FileManager for video caching

**Backend & Services:**
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Real-time:** Supabase Realtime subscriptions
- **File Storage:** Supabase Storage (for exercise videos)
- **API:** Supabase REST API + custom edge functions

**AI Integration:**
- **LLM:** Anthropic Claude 3.5 Sonnet API
- **Streaming:** Server-Sent Events (SSE) for real-time responses
- **Voice Input:** iOS Speech framework (on-device or server)
- **Voice Output:** AVSpeechSynthesizer (optional TTS)

**Infrastructure:**
- **Backend Hosting:** Supabase Cloud
- **Video CDN:** Supabase Storage with CDN
- **Monitoring:** Sentry (crash reporting, performance)
- **Analytics:** PostHog (privacy-focused, self-hosted option)

**Development Tools:**
- **IDE:** Xcode 16+
- **AI Assistant:** Claude Code with XcodeBuildMCP
- **Version Control:** Git + GitHub
- **CI/CD:** Xcode Cloud or GitHub Actions
- **Beta Distribution:** TestFlight
- **Dependency Management:** Swift Package Manager

**iOS-Specific Features:**
- **Accessibility:** VoiceOver, VoiceControl, Switch Control, Dynamic Type
- **Haptics:** UIFeedbackGenerator for tactile feedback
- **Notifications:** UserNotifications framework (local & push)
- **Biometrics:** LocalAuthentication (FaceID/TouchID)
- **Health Integration:** HealthKit (Phase 2 - track activity)
- **Siri:** SiriKit Intents (Phase 2 - voice shortcuts)

---

### 11.2 Database Schema (Supabase PostgreSQL)

**Users Table:**
```sql
users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('survivor', 'caregiver')),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
)
```

**User Profiles Table:**
```sql
user_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id),
  stroke_date date,
  impairments text[], -- ['motor', 'speech', 'cognitive', 'vision']
  recovery_phase text, -- 'acute', 'subacute', 'chronic', 'long_term'
  goals text,
  preferences jsonb, -- accessibility settings, notification prefs, etc.
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
)
```

**Care Team Links Table:**
```sql
care_team_links (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  survivor_id uuid REFERENCES users(id),
  caregiver_id uuid REFERENCES users(id),
  relationship text, -- 'spouse', 'child', 'parent', 'friend', 'professional'
  permissions jsonb, -- what caregiver can see/do
  status text DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
  created_at timestamp DEFAULT now()
)
```

**Conversations Table:**
```sql
conversations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id),
  messages jsonb[], -- Array of {role, content, timestamp}
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
)
```

**Exercises Table:**
```sql
exercises (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  video_url text, -- Supabase Storage URL
  thumbnail_url text,
  category text, -- 'upper_extremity', 'lower_extremity', 'balance', 'speech', 'cognitive'
  difficulty text, -- 'beginner', 'intermediate', 'advanced'
  duration_minutes integer,
  equipment_needed text[],
  safety_tips text,
  created_at timestamp DEFAULT now()
)
```

**Daily Logs Table:**
```sql
daily_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id),
  log_date date NOT NULL,
  exercises_completed uuid[], -- Array of exercise IDs
  pain_level integer CHECK (pain_level >= 0 AND pain_level <= 10),
  fatigue_level integer CHECK (fatigue_level >= 0 AND fatigue_level <= 10),
  mood text, -- 'great', 'good', 'okay', 'bad', 'terrible'
  notes text,
  created_at timestamp DEFAULT now()
)
```

**Push Notification Tokens Table:**
```sql
push_tokens (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id),
  token text NOT NULL,
  platform text DEFAULT 'ios', -- 'ios', 'android', 'web'
  active boolean DEFAULT true,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
)
```

---

### 11.3 iOS App Architecture

**SwiftUI App Structure:**
```
NeuroBloomApp/
├── App/
│   ├── NeuroBloomApp.swift (App entry point)
│   └── ContentView.swift (Root view with tab navigation)
├── Models/
│   ├── User.swift
│   ├── Exercise.swift
│   ├── DailyLog.swift
│   └── Message.swift
├── ViewModels/
│   ├── AuthViewModel.swift
│   ├── ChatViewModel.swift
│   ├── ExerciseViewModel.swift
│   └── ProgressViewModel.swift
├── Views/
│   ├── Onboarding/
│   ├── Home/
│   ├── Chat/
│   ├── Exercises/
│   ├── CheckIn/
│   └── Progress/
├── Services/
│   ├── SupabaseService.swift
│   ├── ClaudeAPIService.swift
│   ├── VideoService.swift
│   └── NotificationService.swift
├── Utilities/
│   ├── Accessibility/
│   ├── Extensions/
│   └── Constants/
└── Resources/
    ├── Assets.xcassets
    └── Colors/
```

**Key Architectural Decisions:**

1. **MVVM Pattern:**
   - Views are passive, display data from ViewModels
   - ViewModels handle business logic, API calls, state
   - Models are simple data structures
   - Keeps views accessible and testable

2. **Offline-First:**
   - SwiftData stores user data locally
   - Videos cached in FileManager
   - Sync to Supabase when online
   - Conflict resolution for offline edits

3. **Accessibility-First:**
   - All custom views use .accessibilityLabel(), .accessibilityHint()
   - Support Dynamic Type (text scales with user preference)
   - Support VoiceOver, VoiceControl, Switch Control
   - High contrast mode support
   - Haptic feedback for important actions

4. **Modular Services:**
   - SupabaseService handles all backend communication
   - ClaudeAPIService handles Lilly conversations
   - VideoService handles download, caching, playback
   - NotificationService handles local & push notifications

---

### 11.4 API Design (Supabase + Custom Edge Functions)

**Supabase REST API (Auto-generated):**
- `GET /users` - Get user profile
- `PATCH /users/:id` - Update user profile
- `GET /exercises` - List exercises (with filters)
- `GET /daily_logs` - Get user's logs
- `POST /daily_logs` - Create log entry

**Custom Edge Functions (Deno):**

**Lilly Chat:**
```typescript
// POST /functions/v1/chat
{
  "user_id": "uuid",
  "message": "I'm frustrated with my progress",
  "conversation_id": "uuid" // optional, for context
}

// Streams back Server-Sent Events
// Returns conversation_id for follow-ups
```

**Emergency Detection:**
```typescript
// POST /functions/v1/check-emergency
{
  "message": "I have chest pain and can't breathe"
}

// Returns:
{
  "is_emergency": true,
  "emergency_type": "medical", // or "mental_health"
  "recommended_action": "Call 911 immediately"
}
```

**Progress Summary:**
```typescript
// GET /functions/v1/progress-summary?user_id=xxx&period=week
// Returns aggregated stats, trends, insights
```

---

### 11.5 Security & Compliance

**HIPAA Compliance Requirements:**
- ✅ End-to-end encryption for data in transit (HTTPS/TLS)
- ✅ Encryption at rest (Supabase provides)
- ✅ Access controls (Row Level Security policies)
- ✅ Audit logging (track who accessed what data when)
- ✅ Business Associate Agreement with Supabase, Anthropic
- ✅ Data breach notification procedures
- ✅ User rights (access, delete, export their data)
- ✅ Minimum necessary access (role-based permissions)

**iOS App Security:**
- Keychain for storing auth tokens (more secure than UserDefaults)
- Certificate pinning for API requests
- Biometric authentication option (FaceID/TouchID)
- Jailbreak detection (optional, may affect accessibility)
- App Transport Security (ATS) enforced

**Row Level Security (RLS) Policies:**
```sql
-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Caregivers can see linked survivor's data (with permissions)
CREATE POLICY "Caregivers can view survivor data" ON daily_logs
  FOR SELECT USING (
    user_id IN (
      SELECT survivor_id FROM care_team_links 
      WHERE caregiver_id = auth.uid() 
      AND status = 'accepted'
    )
  );
```

**Authentication Security:**
- Supabase Auth handles password hashing (bcrypt)
- Email verification required
- Password requirements: 12+ characters, mixed case, numbers
- Session timeout after 30 days inactivity
- Password reset via email

**API Security:**
- Rate limiting on all endpoints (Supabase provides)
- API keys stored in environment variables
- Input validation on all user inputs (Zod schemas)
- SQL injection prevention (Supabase uses parameterized queries)

---

### 11.6 Performance Requirements

**Load Times:**
- App launch: <2 seconds
- Navigation between screens: <500ms
- Lilly response starts streaming: <3 seconds
- Video starts playing: <2 seconds (from cache)
- Video downloads: Background task, doesn't block UI

**Offline Performance:**
- All core features work offline (except Lilly chat)
- Videos cached locally after first view
- Daily logs saved locally, sync when online
- Graceful degradation when offline

**Battery & Memory:**
- Video playback optimized (hardware acceleration)
- Background sync conservative (only on WiFi by default)
- No memory leaks (ARC handles most, but watch for retain cycles)
- Minimal background activity (preserve battery)

**Scalability:**
- Support 10,000 concurrent users (Phase 2 goal)
- Database queries optimized with indexes
- Supabase auto-scales (managed service)
- CDN for video delivery (Supabase Storage)

---

### 11.7 Monitoring & Analytics

**Error Monitoring (Sentry):**
- Track all Swift errors and crashes
- Backend error logging (Supabase edge functions)
- Performance monitoring (slow API calls, view load times)
- User session replay for debugging (privacy-safe)

**Product Analytics (PostHog):**
- Track user actions (privacy-respecting, HIPAA-compliant)
- Feature usage funnels (onboarding → first exercise → daily log)
- Retention cohorts (day 1, 7, 30 retention)
- A/B testing capability (test Lilly prompts, UI variations)

**Custom Metrics:**
- Daily active users (DAU)
- Weekly active users (WAU)
- Messages sent to Lilly per user
- Exercise videos watched
- Daily log completion rate
- Caregiver-survivor linking rate
- App crashes per 1,000 sessions

**Health Metrics Dashboard:**
- Real-time view of app health (Sentry)
- User engagement trends (PostHog)
- API response times (Supabase)
- Video streaming performance (CDN metrics)
- Push notification delivery rates

**Users Table:**
```sql
users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('survivor', 'caregiver')),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
)
```

**User Profiles Table:**
```sql
user_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id),
  stroke_date date,
  impairments text[], -- ['motor', 'speech', 'cognitive', 'vision']
  recovery_phase text, -- 'acute', 'subacute', 'chronic', 'long_term'
  goals text,
  preferences jsonb, -- accessibility settings, notification prefs, etc.
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
)
```

**Care Team Links Table:**
```sql
care_team_links (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  survivor_id uuid REFERENCES users(id),
  caregiver_id uuid REFERENCES users(id),
  relationship text, -- 'spouse', 'child', 'parent', 'friend', 'professional'
  permissions jsonb, -- what caregiver can see/do
  status text DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
  created_at timestamp DEFAULT now()
)
```

**Conversations Table:**
```sql
conversations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id),
  messages jsonb[], -- Array of {role, content, timestamp}
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
)
```

**Exercises Table:**
```sql
exercises (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  video_url text,
  thumbnail_url text,
  category text, -- 'upper_extremity', 'lower_extremity', 'balance', 'speech', 'cognitive'
  difficulty text, -- 'beginner', 'intermediate', 'advanced'
  duration_minutes integer,
  equipment_needed text[],
  safety_tips text,
  created_at timestamp DEFAULT now()
)
```

**Daily Logs Table:**
```sql
daily_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id),
  log_date date NOT NULL,
  exercises_completed uuid[], -- Array of exercise IDs
  pain_level integer CHECK (pain_level >= 0 AND pain_level <= 10),
  fatigue_level integer CHECK (fatigue_level >= 0 AND fatigue_level <= 10),
  mood text, -- 'great', 'good', 'okay', 'bad', 'terrible'
  notes text,
  created_at timestamp DEFAULT now()
)
```

**Events Table:**
```sql
events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id), -- Who created it
  title text NOT NULL,
  description text,
  event_type text, -- 'appointment', 'medication', 'exercise', 'personal'
  start_time timestamp NOT NULL,
  end_time timestamp,
  location text,
  attendees uuid[], -- Array of user IDs
  created_at timestamp DEFAULT now()
)
```

**Tasks Table:**
```sql
tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id), -- Who created it
  assigned_to uuid REFERENCES users(id),
  title text NOT NULL,
  description text,
  due_date date,
  priority text, -- 'low', 'medium', 'high'
  status text DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
  completed_at timestamp,
  created_at timestamp DEFAULT now()
)
```

---

### 11.3 API Design

**Authentication:**
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/user` - Get current user

**User Management:**
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update profile
- `POST /api/users/link-caregiver` - Send caregiver invitation
- `POST /api/users/accept-link` - Accept caregiver invitation

**Lilly Chat:**
- `POST /api/chat` - Send message to Lilly (streaming response)
- `GET /api/chat/history` - Get conversation history
- `DELETE /api/chat/history` - Clear conversation history

**Exercises:**
- `GET /api/exercises` - List exercises (with filters)
- `GET /api/exercises/:id` - Get single exercise details
- `POST /api/exercises/:id/favorite` - Mark as favorite

**Daily Logs:**
- `POST /api/logs` - Create daily log
- `GET /api/logs` - Get logs (date range)
- `PUT /api/logs/:id` - Update log
- `GET /api/logs/stats` - Get progress statistics

**Calendar & Tasks:**
- `GET /api/events` - List events (date range)
- `POST /api/events` - Create event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

---

### 11.4 Security & Compliance

**HIPAA Compliance Requirements:**
- ✅ End-to-end encryption for data in transit (HTTPS)
- ✅ Encryption at rest (Supabase provides)
- ✅ Access controls (Row Level Security policies)
- ✅ Audit logging (track who accessed what data when)
- ✅ Business Associate Agreement with Supabase, Vercel, Anthropic
- ✅ Data breach notification procedures
- ✅ User rights (access, delete, export their data)
- ✅ Minimum necessary access (role-based permissions)

**Row Level Security (RLS) Policies:**
- Users can only see their own data
- Caregivers can see linked survivor's data (with permissions)
- Exercise library is public
- Admin users can see anonymized aggregate data

**Authentication Security:**
- Bcrypt password hashing (handled by Supabase)
- Multi-factor authentication (optional, Phase 2)
- Session timeout after 30 days inactivity
- Password reset via email

**API Security:**
- Rate limiting on all endpoints
- CORS configured properly
- API keys stored in environment variables
- Input validation on all user inputs

**Data Retention:**
- User data kept as long as account active
- 30-day grace period after account deletion
- Conversation logs kept for 1 year (or user preference)
- Audit logs kept for 7 years (HIPAA requirement)

---

### 11.5 Performance Requirements

**Load Times:**
- Initial page load: <2 seconds
- Navigation between pages: <500ms
- Lilly response starts streaming: <3 seconds
- Video starts playing: <2 seconds

**Scalability:**
- Support 10,000 concurrent users (Phase 2 goal)
- Database queries optimized with indexes
- Caching strategy for static content
- CDN for video delivery

**Offline Support (Phase 2 - Mobile):**
- Cached exercise videos
- Offline log entries (sync when online)
- Service worker for PWA functionality

---

### 11.6 Monitoring & Analytics

**Error Monitoring (Sentry):**
- Track all JavaScript errors
- Backend error logging
- Performance monitoring
- User session replay for debugging

**Product Analytics (PostHog):**
- Track user actions (privacy-respecting)
- Feature usage funnels
- Retention cohorts
- A/B testing capability

**Custom Metrics:**
- Daily active users (DAU)
- Weekly active users (WAU)
- Messages sent to Lilly per user
- Exercise videos watched
- Daily log completion rate
- Caregiver-survivor linking rate

---

## 12. Design & Accessibility Requirements

### 12.1 Visual Design Principles

**Color Palette:**
- **Primary:** Soft blue (#3B82F6) - Calming, trustworthy
- **Secondary:** Warm coral (#F97316) - Encouraging, energetic
- **Success:** Green (#10B981) - Progress, achievement
- **Warning:** Amber (#F59E0B) - Caution
- **Error:** Red (#EF4444) - Alerts
- **Neutral:** Grays (#F3F4F6 to #1F2937)

**High Contrast Mode:**
- Black text on white background
- 7:1 contrast ratio (WCAG AAA)
- Option to toggle in settings

**Typography:**
- **Font:** Inter (clean, highly legible)
- **Sizes:** Minimum 18px body text, 24px+ headings
- **Line Height:** 1.6 for body text (easier reading)
- **Letter Spacing:** Slightly increased for readability

---

### 12.2 Accessibility Requirements (WCAG 2.1 Level AA Minimum, AAA Preferred)

**Perceivable:**
- [ ] All images have alt text
- [ ] Videos have captions
- [ ] Color is not the only way information is conveyed
- [ ] Text contrast ratio ≥ 7:1 (AAA)
- [ ] Text can be resized up to 200% without loss of functionality
- [ ] UI components have visible focus indicators

**Operable:**
- [ ] All functionality available via keyboard
- [ ] No keyboard traps
- [ ] Sufficient time to read and interact (no time limits)
- [ ] Touch targets minimum 44x44 CSS pixels
- [ ] Gestures have single-pointer alternatives
- [ ] No content flashing more than 3 times per second

**Understandable:**
- [ ] Language identified (lang="en")
- [ ] Navigation consistent across pages
- [ ] Forms have clear labels and error messages
- [ ] Error suggestions provided
- [ ] Confirmation required for destructive actions

**Robust:**
- [ ] Valid HTML5 semantic markup
- [ ] ARIA labels where needed
- [ ] Compatible with assistive technologies (screen readers, switch control)
- [ ] Progressive enhancement (works without JavaScript)

---

### 12.3 Responsive Design

**Breakpoints:**
- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+

**Mobile-First Approach:**
- Design for mobile first, enhance for larger screens
- Touch-friendly targets on mobile
- Simplified navigation on mobile

---

### 12.4 Component Design Guidelines

**Buttons:**
- Minimum 60x60px (larger than WCAG minimum for easier tapping)
- Clear labels (no icon-only buttons without text)
- Loading states (don't leave user wondering)
- Disabled state visually obvious

**Forms:**
- Labels above inputs (not placeholder text as labels)
- Error messages below field, with icon
- Required fields clearly marked
- Autocomplete attributes for common fields

**Modals/Dialogs:**
- Focus trap (can't tab outside modal)
- ESC key to close
- Click outside to close (with confirmation if unsaved data)
- Heading for screen reader users

**Navigation:**
- Skip to main content link
- Clear active/current page indicator
- Breadcrumbs for deep navigation

---

## 13. Success Metrics

### 13.1 North Star Metric
**Exercise Adherence Rate:** % of prescribed exercises completed per week

**Target:** 50%+ (vs. current 35% industry baseline)

---

### 13.2 Phase 1 MVP Metrics (Weeks 1-12)

**Acquisition:**
- [ ] 50 beta users signed up
- [ ] 30% survivors, 70% survivor+caregiver pairs

**Activation:**
- [ ] 80% complete onboarding
- [ ] 60% send at least one message to Lilly
- [ ] 40% watch at least one exercise video

**Engagement:**
- [ ] 50% return for 2nd session within 48 hours
- [ ] 40% daily log completion rate
- [ ] 30% use app 3+ days per week

**Retention:**
- [ ] 50% still active at Week 4
- [ ] 30% still active at Week 8

**Satisfaction:**
- [ ] 4+ star rating from 70% of users
- [ ] 60% would recommend to others
- [ ] <10% churn due to dissatisfaction

**Lilly Performance:**
- [ ] 80%+ positive feedback on Lilly responses
- [ ] <5% emergency escalations (false positives acceptable)
- [ ] Average 5+ messages per Lilly conversation

---

### 13.3 Health Outcome Metrics (Phase 2, Requires Longer Study)

**Self-Reported Improvement:**
- [ ] 60% report subjective improvement in targeted area
- [ ] 40% report improved mood/reduced depression
- [ ] 50% report feeling less isolated

**Functional Measures (if possible to track):**
- [ ] Improved scores on standardized assessments (e.g., Barthel Index, FIM)
- [ ] Reduced caregiver burden (Zarit Burden Interview)

**Clinical Metrics (Phase 3, with provider partnerships):**
- [ ] Reduced hospital readmissions
- [ ] Improved medication adherence
- [ ] Higher therapy attendance rates

---

## 14. Development Phases

### Phase 1: iOS MVP (Weeks 1-8)

**Goal:** Validate core concept with 10-20 beta users on their iPhones

**Features:**
- User authentication and onboarding
- Basic Lilly chat interface with voice input
- 15-20 exercise videos (downloadable for offline viewing)
- Daily check-in and progress tracking
- Basic caregiver coordination (shared progress viewing)
- Push notifications for reminders

**Success Criteria:**
- App is usable and stable on iOS 17+
- Beta users engage 3+ times/week
- Positive feedback on core features (especially Lilly and accessibility)
- No major security or HIPAA compliance issues
- 50%+ exercise adherence rate among beta users

**Deliverables:**
- Deployed iOS app via TestFlight
- Beta user feedback report
- Decision: Proceed to Phase 2 or pivot?

**Week-by-Week Breakdown:**

**Weeks 1-2: Foundation & Setup**
- Xcode project setup with SwiftUI
- Supabase backend configuration
- Authentication system (email/password, OAuth)
- Basic onboarding flow
- XcodeBuildMCP integration for Claude Code

**Weeks 3-4: Lilly AI Integration**
- Chat interface UI with accessibility features
- Claude API integration with streaming
- Conversation history and memory
- Voice input via iOS Speech framework
- Emergency keyword detection

**Weeks 5-6: Exercise Library**
- Video player with accessibility controls
- Exercise database and content
- Search and filter functionality
- Favorite exercises
- Offline video caching

**Week 7: Daily Check-In & Progress**
- Check-in form with large touch targets
- Progress dashboard with charts
- Mood/pain/energy tracking
- Data visualization

**Week 8: Polish & Beta Launch**
- Push notification system
- Caregiver linking and sharing
- Bug fixes and performance optimization
- TestFlight setup
- Beta user onboarding

---

### Phase 2: Web Companion (Months 3-6)

**Goal:** Build web platform for caregivers and long-distance family

**Platform:** Next.js + TypeScript + Supabase (same backend as iOS)

**Features:**
- Desktop-optimized dashboard for caregivers
- Calendar and task management (larger screens)
- Progress reports and data export
- Educational content library
- Family updates and communication
- Onboarding preview for prospective users

**Success Criteria:**
- 60%+ of caregiver-survivor pairs use web for coordination
- Reduced caregiver burden scores
- Positive feedback on calendar and task management

---

### Phase 3: Android App (Months 7-9)

**Goal:** Expand to Android users

**Platform:** Native Android (Kotlin + Jetpack Compose) OR React Native for both platforms

**New Features:**
- Android-specific accessibility (TalkBack, Voice Access)
- Google Fit integration
- Material Design 3
- Google Play Services

**Success Criteria:**
- Feature parity with iOS
- 1,000+ users across both platforms
- 4+ star rating on Google Play

---

### Phase 4: Scale & Enterprise (Months 10-12)

**Goal:** Grow user base and add enterprise features

**New Features:**
- Telehealth integration
- Provider dashboard (therapists can assign exercises, view progress)
- Advanced analytics and insights
- Insurance integration
- Multi-language support
- White-label option for hospitals/clinics

**Success Criteria:**
- 5,000+ users across all platforms
- 3+ hospital/clinic partnerships
- Revenue positive (break-even or better)
- 70%+ exercise adherence rate

---

### Phase 4: Beyond (Year 2+)

**Future Possibilities:**
- **Care provider search (Zocdoc-like):** Let survivors search for and contact care providers (PTs, OTs, SLPs, etc.) by insurance, location, and need. Entry point could be a "Find care providers" card on Home or a dedicated tab; implementation options include link-out to trusted finder sites (APTA, ASHA, AOTA), in-app directory (own DB or curated list), or third-party API (e.g. Zocdoc API, NPI Registry for location + specialty, or payer/aggregator APIs for insurance). Profile could optionally store zip and insurance to prefill search.
- International expansion
- Other neurological conditions (TBI, MS, Parkinson's)
- Research partnerships (clinical studies using our data)
- Voice-only interface for accessibility
- VR/AR rehabilitation exercises
- Predictive models for recovery trajectories

---

## 15. Risk Management

### 15.1 Technical Risks

**Risk:** Claude API goes down or changes pricing
**Mitigation:** 
- Fallback to cached responses for common questions
- Budget alerts for API costs
- Evaluate alternative LLMs (GPT-4, Llama, etc.) as backup

**Risk:** Supabase reliability or scaling issues
**Mitigation:**
- Choose Supabase Pro tier with SLA
- Regular database backups
- Have migration plan to self-hosted PostgreSQL if needed

**Risk:** Security breach or HIPAA violation
**Mitigation:**
- Penetration testing before public launch
- Strict RLS policies
- Regular security audits
- Incident response plan documented
- Cyber insurance

---

### 15.2 Product Risks

**Risk:** Users don't engage with Lilly
**Mitigation:**
- A/B test different Lilly personalities
- Offer traditional FAQ as alternative
- Conduct user interviews to understand why

**Risk:** Exercise videos don't resonate (quality, selection, etc.)
**Mitigation:**
- Start with 15-20 most common exercises
- Get feedback from beta users
- Partner with licensed therapists for content

**Risk:** Caregivers feel app adds burden rather than reduces it
**Mitigation:**
- Prioritize simplicity in caregiver features
- Make all features optional
- User test with real caregivers before launch

---

### 15.3 Market Risks

**Risk:** Large competitor enters market (e.g., Hinge Health launches stroke product)
**Mitigation:**
- Move fast, establish brand with users
- Focus on superior accessibility (hard to copy)
- Build community moat (network effects)

**Risk:** Stroke survivors can't afford $9-29/month
**Mitigation:**
- Offer generous free tier
- Financial assistance program
- Partner with insurance for coverage
- Apply for grants to subsidize for low-income users

**Risk:** Insurance reimbursement doesn't materialize
**Mitigation:**
- Focus on direct-to-consumer initially
- Build outcomes data to prove value to insurers
- Phase 3 enterprise features generate B2B revenue

---

### 15.4 Regulatory Risks

**Risk:** FDA classifies app as medical device requiring approval
**Mitigation:**
- Consult with healthcare attorney early
- Design as "wellness" tool, not diagnostic or treatment
- Clear disclaimers that it's not medical advice
- Track regulatory changes proactively

**Risk:** HIPAA audits find violations
**Mitigation:**
- HIPAA compliance from day one
- Annual third-party audits
- BAAs with all vendors
- Staff training on HIPAA

---

## 16. Go-to-Market Strategy (Brief)

### 16.1 Beta Launch (Phase 1)
- **Audience:** 10-20 stroke survivors and caregivers
- **Recruitment:** Personal network, local support groups, Reddit/Facebook groups
- **Approach:** White-glove onboarding, weekly feedback calls
- **Goal:** Validate product-market fit

### 16.2 Public Launch (Phase 2)
- **Channels:**
  - Content marketing (SEO blog posts on stroke recovery)
  - Partnerships with stroke support organizations
  - Therapist referrals
  - Social media (TikTok/Instagram for younger survivors, Facebook for older)
  - Paid ads (Google, Facebook) targeting caregivers
- **Pricing:** Freemium model
  - Free: Basic Lilly chat, limited exercises
  - Premium: $9.99/month - Full exercise library, unlimited Lilly, caregiver coordination
  - Premium Plus: $19.99/month - Advanced analytics, telehealth ready, priority support

### 16.3 Enterprise Expansion (Phase 3)
- Hospital/clinic licensing: $5,000-20,000/year
- Insurance partnerships: Per-member-per-month fees
- Outcomes-based contracts

---

## 17. Team & Resources Needed

### Current Resources (MVP)
- **Founder/Developer (Zack):** Full-stack development, product design
- **Contractors:**
  - UI/UX designer (20-40 hours)
  - Physical therapist for exercise content (10-20 hours)
  - Healthcare attorney for HIPAA review (5-10 hours)

### Phase 2 Needs
- Mobile developer (React Native) or contractor
- Content creator (exercise videos) - ongoing
- Customer support (part-time)
- Beta user coordinator

### Phase 3 Needs
- Full-time engineers (2-3)
- Product manager
- Sales/partnerships lead
- Customer success team
- Clinical advisor (PT/OT/SLP)

---

## 18. Budget Estimate (Phase 1)

**Development (Weeks 1-6):**
- Zack's time: Sweat equity
- UI/UX designer: $2,000-4,000
- Therapist consultation: $500-1,000
- Healthcare attorney: $1,000-2,000

**Infrastructure (Monthly):**
- Supabase: $25/month (Pro tier)
- Vercel: $20/month (Pro tier)
- Anthropic API: $100-500/month (depends on usage)
- Domain + misc: $50/month

**Total Phase 1:** $5,000-10,000 + 6 weeks full-time work

---

## 19. Immediate Next Steps (Week 1)

### Pre-Development Checklist
- [ ] **Domain & Branding**
  - [x] Purchase neurobloom.com (or similar) *(already done)*
  - [ ] Design logo and app icon
  - [ ] Write tagline and App Store description
  
- [ ] **Legal & Compliance**
  - [ ] Consult healthcare attorney on HIPAA requirements
  - [ ] Draft privacy policy and terms of service for iOS
  - [ ] Create consent forms for user data
  - [ ] Register Apple Developer account ($99/year)

- [ ] **Content Preparation**
  - [ ] Compile Lilly's knowledge base (stroke recovery content)
  - [ ] Identify 15-20 exercises to include in MVP
  - [ ] Source or film exercise videos (or find existing content to license)

- [ ] **Infrastructure Setup**
  - [ ] Create Supabase project
  - [ ] Set up Supabase tables and RLS policies
  - [ ] Get Anthropic API key
  - [ ] Set up Sentry account for iOS
  - [ ] Set up PostHog for analytics

- [ ] **Development Environment**
  - [ ] Install Xcode 16+ on Mac
  - [ ] Set up XcodeBuildMCP for Claude Code
  - [ ] Configure GitHub repository
  - [ ] Set up TestFlight for beta distribution

- [ ] **Beta User Recruitment**
  - [ ] Identify 10-20 potential beta users
  - [ ] Create screening survey
  - [ ] Draft outreach messages
  - [ ] Prepare TestFlight invitation flow

---

### Week 1 Development Tasks (iOS Focus)

**Days 1-2: Xcode Project Setup & Architecture**
- [ ] Create new Xcode project (SwiftUI, iOS 17+)
- [ ] Set up folder structure (Models, Views, ViewModels, Services)
- [ ] Configure Swift Package Manager dependencies
- [ ] Set up Supabase Swift client
- [ ] Create basic tab navigation structure
- [ ] Set up XcodeBuildMCP integration for Claude Code

**Days 3-4: Authentication & Onboarding**
- [ ] Build login/signup screens with large touch targets
- [ ] Implement Supabase Auth integration
- [ ] Create onboarding wizard flow (SwiftUI)
- [ ] Design and build accessible onboarding screens
- [ ] Add biometric authentication option (FaceID/TouchID)

**Day 5: Database & Data Models**
- [ ] Create Swift models (User, Exercise, DailyLog, Message)
- [ ] Set up SwiftData for local persistence
- [ ] Configure Supabase database schema
- [ ] Test data sync (local → Supabase)

**Days 6-7: Basic UI & Navigation**
- [ ] Build tab bar with Home, Exercises, Lilly, Progress
- [ ] Create home dashboard with quick actions
- [ ] Implement navigation between screens
- [ ] Add accessibility labels to all UI elements
- [ ] Test with VoiceOver enabled

**Weekend: Testing & Iteration**
- [ ] Run app in iOS Simulator (different devices)
- [ ] Test accessibility features
- [ ] Fix any crashes or layout issues
- [ ] Prepare for Week 2 (Lilly integration)

---

## 20. Appendix

### A. Glossary of Stroke Terms

**Aphasia:** Language disorder affecting ability to communicate (speak, understand, read, write)

**Hemiparesis:** Weakness on one side of the body

**Hemiplegia:** Paralysis on one side of the body

**Hemorrhagic Stroke:** Stroke caused by bleeding in the brain

**Ischemic Stroke:** Stroke caused by blocked blood flow to brain (most common, 87%)

**Neuroplasticity:** Brain's ability to reorganize and form new neural connections

**Dysphagia:** Difficulty swallowing

**Dysarthria:** Slurred or slow speech due to muscle weakness

**Neglect:** Lack of awareness of one side of body or space

**TIA (Transient Ischemic Attack):** "Mini-stroke" with temporary symptoms

---

### B. Competitive Analysis Summary

| Competitor | Focus | Strengths | Weaknesses | Price |
|------------|-------|-----------|------------|-------|
| Constant Therapy | Cognitive/Speech | Evidence-based, large library | No physical therapy, no AI companion, expensive | $200-400/year |
| Lingraphica | Speech (AAC) | Hardware + software, insurance covered | Very expensive, speech-only, requires device | $4K-7K one-time |
| Neofect | Physical (gamification) | Fun, engaging, sensor feedback | Physical only, expensive, requires hardware | $299-399 one-time |
| MindMaze | VR Rehab | Cutting-edge, clinical setting | Expensive, not home-based, requires VR setup | Enterprise only |
| Stroke Companion | Holistic tracking | Free, simple | Basic, no exercises, no AI | Free |

**NeuroBloom's Advantage:** Only platform addressing Mind + Body + Soul with AI companion, at accessible price point.

---

### C. User Research Sources

- Katie's lived experience (primary inspiration)
- Interviews with 5 stroke survivors
- Interviews with 3 caregivers
- Stroke support group observations
- Medical journal research (100+ papers reviewed)
- Competitor app reviews analysis
- Therapist consultations

---

### D. References & Clinical Sources

1. American Stroke Association - Stroke Recovery Guidelines
2. National Institute of Health - Stroke Rehabilitation Evidence
3. Lancet Neurology - Post-stroke depression prevalence
4. Stroke journal - Home exercise adherence studies
5. Archives of Physical Medicine - Neuroplasticity research
6. Caregiver burden studies (Zarit Burden Interview)

*(Full bibliography to be compiled during knowledge base creation)*

---

## Document Version History

**Version 1.0** (Nov 26, 2024)
- Initial PRD created with React Native mobile-first strategy

**Version 2.0** (Nov 27, 2024 - Morning)
- Pivoted to web-first MVP strategy
- Updated tech stack to Next.js + Supabase
- Simplified Phase 1 scope for 6-week timeline
- Added detailed web-specific implementation notes

**Version 3.0** (Nov 27, 2024 - Afternoon)
- **STRATEGIC PIVOT:** Changed to iOS-first native app strategy
- Updated tech stack to Swift + SwiftUI + Supabase
- Revised development timeline to 8 weeks for iOS MVP
- Added iOS-specific accessibility features and requirements
- Included iOS design mockups reference
- Updated Phase 2 to web companion app (not mobile)
- Added XcodeBuildMCP integration for Claude Code development
- Comprehensive iOS technical architecture and database schema

---

**END OF PRD**

*This document is a living document and will be updated as we learn from users and iterate on the product.*
