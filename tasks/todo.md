# NeuroBloom Tasks

## Add Physical Therapy Exercises to NeuroBloom

### Plan
Add ~50 new built-in exercises from PT/OT documents, plus a new "Head & Neck" category for TMJ and cervical exercises. Update exercises data, metadata, assign-exercises list, category dropdowns, thumbnail color map, and tests.

### Todo Items
- [x] Add 50 new exercises to EXERCISES_DATA in app/(tabs)/exercises.js + add Head & Neck category
- [x] Add metadata for all 50 new exercises in constants/exerciseMetadata.js + head_neck body region
- [x] Add 50 new exercises to app/medical-staff/assign-exercises.js + Head & Neck category
- [x] Add Head & Neck to CATEGORIES in components/CustomExerciseModal.js
- [x] Add Head & Neck color to _getThumbnailColorForCategory in SupabaseService.js
- [x] Update __tests__/exerciseMetadata.test.js for new IDs and body region
- [x] Write review section in tasks/todo.md

### Review

**Summary:** Added 50 new built-in exercises (n1–n7, a4–a16, l4–l24, c4–c12) from physical therapy documents and introduced a new "Head & Neck" category. Total built-in exercises are now 62.

**Files changed (6):**

1. **`app/(tabs)/exercises.js`** — Added `'Head & Neck'` to `CATEGORIES`. Appended 50 full exercise objects to `EXERCISES_DATA` with id, category, mode, title, time, target, description, difficulty, thumbnailColor, and instructions. Head & Neck uses pink/rose colors (#FFE4E6, #FECDD3, #FDA4AF, #FB7185); Arms/Legs/Core use existing color families.

2. **`constants/exerciseMetadata.js`** — Added 50 metadata entries (targetImpairments, bodyRegion, bilateral, safeForSevere, phaseRelevance). Introduced `head_neck` body region. Added `REGION_REASONS.head_neck`: "For jaw and cervical recovery."

3. **`app/medical-staff/assign-exercises.js`** — Added same 50 exercises in compact form (id, category, mode, title, thumbnailColor, description). Added `'Head & Neck'` to `CATEGORIES`.

4. **`components/CustomExerciseModal.js`** — Added `'Head & Neck'` to `CATEGORIES` so custom exercises can be assigned to Head & Neck.

5. **`services/SupabaseService.js`** — In `_getThumbnailColorForCategory`, added `'Head & Neck': '#FFE4E6'` so custom Head & Neck exercises get the correct thumbnail color.

6. **`__tests__/exerciseMetadata.test.js`** — Updated `EXPECTED_IDS` to all 62 IDs. Added `'head_neck'` to `VALID_BODY_REGIONS`. Changed metadata count assertion from 12 to 62 and REGION_REASONS count from 4 to 5.

**Exercises skipped as duplicates:** Sit to Stand (duplicate of l3), Seated Marches (duplicate of l2), AROM Ankle DF/PF (duplicate of l1).

**Note:** The DB schema for custom exercises still has `CHECK (category IN ('Arms', 'Legs', 'Core', 'Hands'))`. To allow custom "Head & Neck" exercises to be saved, a migration would be needed to add `'Head & Neck'` to that constraint. Built-in Head & Neck exercises work everywhere; only creating/editing *custom* exercises in Head & Neck would require the migration.

---

## Personalized Exercise Recommendations

### Plan
Add a lightweight recommendation engine that uses survivor intake data (impairments, affected side, severity, recovery phase) to surface relevant exercises and present a personalized daily plan.

### Todo Items

**Phase 1: Enhanced Intake + Data Plumbing**
- [x] 1a. Add `affectedSide` and `impairmentSeverity` questions to `app/onboarding/details.js`
- [x] 1b. Pass new fields through `app/onboarding/goals.js` params
- [x] 1c. Read new fields in `app/auth/signup.js` and include in `saveUserProfile` call
- [x] 1d. Add new columns to `saveUserProfile` and `getUserProfile` in `services/SupabaseService.js`
- [x] 1e. Add affected side & severity editors to `app/profile.js`
- [x] 1f. Create DB migration `supabase/migrations/add_recommendation_fields.sql`

**Phase 2: Exercise Metadata + Recommendation Engine**
- [x] 2a. Create `constants/exerciseMetadata.js` — static metadata for all 12 exercises
- [x] 2b. Create `services/RecommendationService.js` — `getRecommendedExercises()` and `getDailyPlan()`

**Phase 3: Exercises Tab UI**
- [x] 3a. Add "Recommended for You" section above category filters in `app/(tabs)/exercises.js`
- [x] 3b. Add info bottom sheet explaining recommendations
- [x] 3c. Show "Recommended" badge on recommended exercises in the full list

**Phase 4: Home Screen Enhancement**
- [x] 4a. Update hero card in `app/(tabs)/home.js` to show daily plan exercise names
- [x] 4b. Tapping an exercise navigates to Exercises tab

**Phase 5: Bad Day Adaptation**
- [x] 5a. Check daily check-in data and show lighter plan when low energy or high pain

### Review

**10 files changed/created across 5 phases:**

**Phase 1 — Enhanced Intake + Data Plumbing:**
- `app/onboarding/details.js` — Added 2 new single-select questions (affected side with 4 options + severity with 3 options and descriptions) below the impairments section. Uses existing optionCard UI pattern. Both skippable.
- `app/onboarding/goals.js` — Passes `affectedSide` and `impairmentSeverity` through route params to signup.
- `app/auth/signup.js` — Reads new fields from params and includes them in `saveUserProfile` call.
- `services/SupabaseService.js` — Added `affected_side` and `impairment_severity` columns to the `saveUserProfile` upsert. `getUserProfile` already uses `select('*')` so no change needed there.
- `app/profile.js` — Added affected side (4 buttons) and severity (3 buttons) selectors in Recovery Journey section, using existing `roleContainer`/`roleOption` styles. Loads from profile and saves on save.
- `supabase/migrations/add_recommendation_fields.sql` — Adds 2 TEXT columns with CHECK constraints.

**Phase 2 — Recommendation Engine:**
- `constants/exerciseMetadata.js` (new) — Static metadata for all 12 exercises: targetImpairments, bodyRegion, bilateral, safeForSevere, phaseRelevance per recovery phase.
- `services/RecommendationService.js` (new) — Three pure functions: `getRecommendedExercises()` (filter + score + sort), `getDailyPlan()` (pick 4 rotating by day), `getBadDayPlan()` (pick 2 beginner-only).

**Phase 3 — Exercises Tab:**
- `app/(tabs)/exercises.js` — Added "Recommended for You" card section above the exercise list with compact exercise rows, completion checkboxes, recommendation reasons, info button, and disclaimer text. Info modal (bottom sheet) explains how recommendations work. "Recommended" badge appears in exercise cards in the full list. Exported EXERCISES_DATA for reuse.

**Phase 4 + 5 — Home Screen + Bad Day:**
- `app/(tabs)/home.js` — Hero card now shows specific exercise names from daily plan with completion status (checkmark or circle). Tapping navigates to Exercises tab. Bad day logic: if today's check-in shows energy <= 3 or pain >= 7, shows a lighter 2-exercise plan with encouraging copy.

**Key design choices:**
- All client-side, no new API calls beyond existing profile/log fetches
- Graceful degradation: no profile data = default exercise order, no recommendations section
- Medical staff assignments always show above algorithm recommendations
- No new screens — everything integrates into existing UI

---

## Exercise Instruction Videos (Remotion)

### Plan
Create animated Remotion videos using a detailed illustrated figure driven by NeuroBloom exercise instructions. Pilot with Shoulder Shrugs.

### Todo Items
- [x] 1. Create exercises data (my-video/src/data/exercises.ts)
- [x] 2. Build IllustratedFigure component with detailed body
- [x] 3. Create Shoulder Shrugs composition
- [x] 4. Register composition in Root and render

### Review

**Phase 1 pilot complete.** Created:

- **`my-video/src/data/exercises.ts`** – All 12 NeuroBloom exercises with shared structure; Shoulder Shrugs includes `phases` for animation (pose, duration, label).
- **`my-video/src/components/IllustratedFigure.tsx`** – SVG figure with torso, limbs, hands, face; shoulder shrug pose driven by Remotion `interpolate`/`spring`.
- **`my-video/src/compositions/ShoulderShrugs.tsx`** – Composition using `Series` for step-by-step flow, instruction text overlay, ~10s total.
- **`my-video/out/shoulder-shrugs.mp4`** – Rendered 1280x720 video.

**How to preview:** `cd my-video && npm run dev` -> choose ShoulderShrugs in Remotion Studio.
**How to re-render:** `npx remotion render ShoulderShrugs out/shoulder-shrugs.mp4`

**Next:** Phase 2 (more exercises) and Phase 3 (integrate videos into NeuroBloom app).

---

## Fix: Caregiver Names Showing as "Unknown" for Survivors

### Root Cause
The Supabase RLS policy on the `users` table allows caregivers to view survivors' profiles, but has **no policy** allowing survivors to view their linked caregivers' profiles. When the app does `caregiver:caregiver_id(id, name, email)` in the join, RLS blocks the read -> name returns null -> falls back to `'Unknown'`.

### Todo Items
- [x] Create SQL migration `supabase/fix-survivor-caregiver-visibility.sql` with the missing RLS policy
- [x] User applies the SQL in Supabase SQL Editor

### Review
- Added one RLS policy to the `users` table: `"Survivors can view linked caregiver profiles"`
- This allows a survivor to SELECT the `users` row of any caregiver linked to them via an accepted `care_team_links` entry
- Previously, the Supabase join `caregiver:caregiver_id(id, name, email)` in `getCareTeamLinks` was blocked by RLS, returning null and falling back to `'Unknown'`
- No app code changes required -- purely a database policy fix

---

## Fix Plant/Flower Clipping in Garden

### Plan
Plants are cut off because the PlantingBox container (110px) is too short. Full-bloom plant SVGs are 98px tall and positioned to overflow ~68px above the container. React Native's ScrollView clips this overflow.

Fix: Increase container height to 185px and switch backRim/innerBox from `top`-anchored (absolute) to `bottom`-anchored so they stay attached to the box while the plant renders within the container bounds.

### Todo Items
- [x] 1. Update PlantingBox styles: container height 110->185, backRim top->bottom, innerBox top->bottom, remove plantContainer marginBottom

### Review
- Changed `container.height` from 110 -> 185px to give room for the full plant graphic above the box.
- Switched `backRim` from `top: 20` -> `bottom: 60` so it stays anchored just above the wooden frontBox regardless of container height.
- Switched `innerBox` from `top: 25` -> `bottom: 65` (same reason), and reduced `paddingBottom` 10 -> 5.
- Removed `plantContainer.marginBottom: 45` -- no longer needed since the container is now tall enough to contain the plant naturally (plant occupies y~17-115, box occupies y=115-185).
- Only `PlantingBox.js` was touched; 4 style property changes total.

---

## Fix: Medical Staff Signup "Database error saving new user"

### Root Cause Analysis

The error "Sign Up Failed - Database error saving new user" comes from **Supabase GoTrue** wrapping a trigger failure. The `handle_new_user()` trigger fires on auth signup and INSERTs into the `users` table.

**Most likely cause:** The `users` table CHECK constraint on the live Supabase DB may not include `'medical_staff'` as a valid role. If the DB was initially created before medical staff support was added, the CHECK constraint would reject `'medical_staff'`, causing the trigger to fail.

### Additional Code Bugs Found

1. **`signup.js` line 83** - `userData` is referenced but never defined in this component. This causes a ReferenceError after successful signup.
2. **`details.js` line 34** - When medical staff selects "Other" and types custom text, the raw text is passed as `medicalStaffRole`. The DB CHECK constraint only allows specific enum values. Should pass `'other'` to the DB.
3. **`signup.js` line 78** - `saveUserProfile` errors are not checked, so failures are silently ignored.

### Fix Plan

- [x] 1. Create SQL migration to ensure `users.role` CHECK includes `'medical_staff'` on the live DB
- [x] 2. Fix `signup.js` line 83: replace undefined `userData` with `params.role`
- [x] 3. Fix `details.js` line 34: pass `'other'` as the DB value instead of free text
- [x] 4. Fix `signup.js` line 78: handle `saveUserProfile` errors properly

### Review

**4 changes across 3 files:**

1. **`supabase/fix-medical-staff-role-check.sql`** (new) -- SQL migration that dynamically finds and drops the existing CHECK constraint on `users.role`, then re-adds it with all 3 valid values (`survivor`, `caregiver`, `medical_staff`). **Must be run in Supabase SQL Editor.**
2. **`app/auth/signup.js:78`** -- `saveUserProfile` return value is now checked for errors (logged but non-blocking since auth account already exists).
3. **`app/auth/signup.js:86`** -- Replaced undefined `userData?.role` with `params.role` which was already in scope.
4. **`app/onboarding/details.js:34`** -- Changed from `medicalStaffRole === 'other' ? otherRole : medicalStaffRole` to just `medicalStaffRole`, so `'other'` is passed to the DB instead of free text that violates the CHECK constraint.

---

## Medical Staff Exercise Assignment UX Fixes

### Context
The exercise assignment feature exists end-to-end but has UX gaps that make it confusing for our users.

### Todo Items
- [x] 1. Show exercise titles (not raw IDs) in Manage Assignments (`manage-assignments.js`)
- [x] 2. Add due date and notes fields to Assign Exercises screen (`assign-exercises.js`)
- [x] 3. Show assigner name and notes on survivor's exercise cards (`exercises.js`)
- [x] 4. Show already-assigned exercises in assign screen to prevent duplicates (`assign-exercises.js`)
- [x] 5. Implement note editing in Manage Assignments + add `updateAssignmentNotes` to SupabaseService

### Review

**5 UX fixes across 3 screens and 1 service file:**

1. **`manage-assignments.js`** -- Added EXERCISES_DATA lookup + `getExerciseTitle()` helper so assignments show "Shoulder Shrugs" instead of "a1". Added SupabaseService import and wired up `handleSaveNotes` to actually persist notes via `updateAssignmentNotes`.
2. **`assign-exercises.js`** -- Added optional due date (text input) and notes (multiline) fields before the save button, passed to `assignExercise()`. Added `alreadyAssigned` Set that loads existing assignments when a patient is selected; already-assigned exercises show a subtle badge and are dimmed.
3. **`exercises.js`** -- Changed `assignedExercises` from ID array to Map storing full assignment details (assigner name, notes, due date). ExerciseCard now shows a green info box with "Assigned by [Name]", notes in italics, and due date.
4. **`SupabaseService.js`** -- Added `updateAssignmentNotes()` method. Changed `getAssignedExercises` select to join users table for assigner name.

---

## Unit Tests for Garden Components

### Plan
Write unit tests for the 4 Garden components: PlantGraphics, PlantingBox, GardenKitten, SeedBankModal.

### Todo Items
- [x] 1. Read all 4 source files and existing test patterns
- [x] 2. Create PlantGraphics.test.js
- [x] 3. Create PlantingBox.test.js
- [x] 4. Create GardenKitten.test.js
- [x] 5. Create SeedBankModal.test.js
- [ ] 6. Run tests and verify they pass

### Review
Created 4 test files in `__tests__/components/Garden/` with 45 total tests. Verify with `npx jest __tests__/components/Garden/ --no-coverage`.

---

## Set Up Jest Testing Infrastructure with jest-expo

### Plan
The project already has jest, @testing-library/react-native, and a setup file. Need to:
1. Install `jest-expo` as a devDependency
2. Switch jest.config.js preset from `react-native` to `jest-expo`
3. Add missing module mocks (expo-haptics, expo-clipboard, expo-linear-gradient, lottie-react-native, lucide-react-native, expo-font) to the setup file
4. Verify tests run

### Todo Items
- [x] 1. Install jest-expo (added to package.json — run `npm install` to fetch)
- [x] 2. Update jest.config.js to use jest-expo preset and remove manual transformIgnorePatterns
- [x] 3. Add missing module mocks to __tests__/setup.js
- [ ] 4. Verify tests run with `npx jest --passWithNoTests`

### Review

**3 files changed:**

1. **`package.json`** -- Added `jest-expo: ~54.0.4` to devDependencies. Test scripts were already present.
2. **`jest.config.js`** -- Switched preset from `react-native` to `jest-expo`. Removed manual `transformIgnorePatterns` (jest-expo handles this automatically). Kept setupFilesAfterEnv, testPathIgnorePatterns, and moduleNameMapper unchanged.
3. **`__tests__/setup.js`** -- Added 7 new module mocks at the end of the file:
   - `expo-haptics` (impactAsync, notificationAsync, selectionAsync + enums)
   - `expo-clipboard` (setStringAsync, getStringAsync, hasStringAsync)
   - `expo-linear-gradient` (LinearGradient as View)
   - `expo-font` (useFonts, isLoaded, loadAsync)
   - `expo-status-bar` (StatusBar as string)
   - `lottie-react-native` (as string mock)
   - `lucide-react-native` (Proxy returning icon name for any import)
   - `rive-react-native` (RiveView + enums)

**Note:** Run `npm install` to actually fetch the jest-expo package, then `npm test -- --passWithNoTests` to verify.

---

## Unit Tests for AuthContext

### Plan
Write comprehensive unit tests for `contexts/AuthContext.js` covering all auth flows (signIn, signUp, signOut, deleteAccount, resetPassword, updatePassword), auth state change listener, loading states, and error handling.

### Todo Items
- [x] 1. Create `__tests__/contexts/AuthContext.test.js` with full test coverage
  - Mock SupabaseService, NotificationService, KudosService, and supabase client
  - Test initial state (loading=true, no user)
  - Test signUp success and error flows
  - Test signIn success and error flows
  - Test signOut flow (clears state, calls SupabaseService)
  - Test deleteAccount flow (success, error, no user)
  - Test resetPassword and updatePassword
  - Test auth state change listener (session with user, session without user)
  - Test loading states transition

### Review
Created `__tests__/contexts/AuthContext.test.js` with 18 test cases across 8 describe blocks:
- Mocks SupabaseService (all methods), NotificationService, KudosService, and the supabase named export
- Uses `renderHook` from @testing-library/react-native with AuthProvider wrapper
- Tests signIn/signUp/signOut/deleteAccount/resetPassword/updatePassword for both success and error paths
- Tests auth state change listener updating user/userData/loading
- Tests that signOut always clears local state even on Supabase errors
- Tests deleteAccount with no logged-in user returns error

---

## Unit Tests for 7 Components

### Plan
Write unit tests for Logo, ConfettiBurst, CustomSlider, ResourceCard, ResourceDetailModal, CaregiverHomeView, and MedicalStaffHomeView. Follow existing Button.test.js pattern. Mock services and navigation.

### Todo Items
- [x] 1. Create Logo.test.js
- [x] 2. Create ConfettiBurst.test.js
- [x] 3. Create CustomSlider.test.js
- [x] 4. Create ResourceCard.test.js
- [x] 5. Create ResourceDetailModal.test.js
- [x] 6. Create CaregiverHomeView.test.js
- [x] 7. Create MedicalStaffHomeView.test.js
- [ ] 8. Run tests to verify they pass

### Review

**7 test files created with ~80 total tests:**

1. **`__tests__/components/Logo.test.js`** (5 tests) -- Renders without crashing, renders Image with resizeMode contain, applies default 40x40 styles, applies custom style overrides, handles undefined style prop.

2. **`__tests__/components/ConfettiBurst.test.js`** (8 tests) -- Returns null when trigger=false or undefined, renders particles when trigger=true, renders default 8 particles, custom particleCount, accepts onComplete callback, container has pointerEvents=none.

3. **`__tests__/components/CustomSlider.test.js`** (9 tests) -- Renders without crashing, renders with defaults, custom min/max values, custom style, custom track colors, without onValueChange, re-renders when value prop changes, step values, onLayout handler.

4. **`__tests__/components/ResourceCard.test.js`** (10 tests) -- Renders without crashing, displays title/snippet, calls onPress, handles multiple presses, long title/snippet, empty title/snippet, renders without onPress.

5. **`__tests__/components/ResourceDetailModal.test.js`** (10 tests) -- Renders visible/hidden, displays title/content, empty title/content, long content, multiline content, handles onRequestClose.

6. **`__tests__/components/CaregiverHomeView.test.js`** (17 tests) -- Mocks CareTeamService and SupabaseService. Tests Lilly tip display, Your Survivors section, empty state with Connect button, navigation to connection-options, survivor list with names/avatars/progress, onNavigateToCaregiver callback, Connect Another Survivor button, resource cards, About Me row with profile navigation, error handling for service failures, null user.

7. **`__tests__/components/MedicalStaffHomeView.test.js`** (19 tests) -- Mocks MedicalStaffService and SupabaseService. Tests Lilly tip display, Your Patients section, empty state with Connect to Patient, patient list with names/avatars/progress, onNavigateToMedicalStaff callback, Assign Exercises button, Connect Another Patient button, medical staff resource cards, About Me with profile navigation, error handling, null user.

**To verify:** Run `npx jest __tests__/components/Logo.test.js __tests__/components/ConfettiBurst.test.js __tests__/components/CustomSlider.test.js __tests__/components/ResourceCard.test.js __tests__/components/ResourceDetailModal.test.js __tests__/components/CaregiverHomeView.test.js __tests__/components/MedicalStaffHomeView.test.js --no-coverage`

---

## Unit Tests for Modal Components

### Plan
Write unit tests for 5 modal components: CustomExerciseModal, KudosSendModal, KudosReceivedModal, NudgeSendModal, NudgeReceivedModal. Follow the existing Button.test.js pattern using @testing-library/react-native, Jest, and mocked service dependencies.

### Todo Items
- [x] 1. Read all 5 source components and existing test pattern (Button.test.js)
- [x] 2. Create `__tests__/components/CustomExerciseModal.test.js`
- [x] 3. Create `__tests__/components/KudosSendModal.test.js`
- [x] 4. Create `__tests__/components/KudosReceivedModal.test.js`
- [x] 5. Create `__tests__/components/NudgeSendModal.test.js`
- [x] 6. Create `__tests__/components/NudgeReceivedModal.test.js`
- [ ] 7. Run tests to verify they pass (`npx jest __tests__/components/`)

### Review

**5 test files created:**

1. **`__tests__/components/CustomExerciseModal.test.js`** (13 tests) -- Tests rendering create vs edit mode, form validation (empty title/instructions trigger Alert), successful submission with correct data shape, error handling on save failure, form population when editing, category/difficulty/mode options, role-dependent share label text.

2. **`__tests__/components/KudosSendModal.test.js`** (11 tests) -- Mocks KudosService. Tests rendering, survivor name display, item type label/emoji/value, Cancel calls onClose, send button calls KudosService.sendKudos with correct args, success state after send, onSuccess/onClose called after timeout, error state when send fails, graceful handling of missing survivorName and itemValue.

3. **`__tests__/components/KudosReceivedModal.test.js`** (11 tests) -- Mocks KudosService. Tests null render when kudosList empty, title/caregiver name/achievement display, "more kudos" count for multiple items, Celebrate button calls onDismiss+onClose, graceful handling of missing caregiver name and item_value, works without onDismiss callback.

4. **`__tests__/components/NudgeSendModal.test.js`** (12 tests) -- Mocks NudgeService with 2 templates. Tests rendering, template display, section titles, error alert when sending without selection, template send with correct nudge data, custom message send, success/error/exception alerts, preview display, character count updates.

5. **`__tests__/components/NudgeReceivedModal.test.js`** (12 tests) -- Tests null render when empty, title/sender/message display, emoji display, singular vs plural "more nudges" text, acknowledge button calls onDismiss+onClose, graceful handling of missing sender/name/emoji, works without onDismiss.

**All tests mock service dependencies (KudosService, NudgeService) to avoid hitting Supabase. Alert.alert is spied on for validation/error tests. Follows existing patterns from Button.test.js.**

**To verify:** Run `npx jest __tests__/components/` to execute all modal tests.

---

## Unit Tests for Auth Screens

### Plan
Write unit tests for the 4 auth screens: login, signup, forgot-password, reset-password. Mock expo-router, useAuth, SupabaseService. Test rendering, form fields, validation, submit actions, error states, and navigation links.

### Todo Items
- [x] 1. Read all 4 source files and setup.js for mock patterns
- [x] 2. Create `__tests__/app/auth/login.test.js`
- [x] 3. Create `__tests__/app/auth/signup.test.js`
- [x] 4. Create `__tests__/app/auth/forgot-password.test.js`
- [x] 5. Create `__tests__/app/auth/reset-password.test.js`
- [x] 6. Run tests and verify they pass

### Review

**4 test files created with 57 total tests, all passing:**

1. **`__tests__/app/auth/login.test.js`** (15 tests) -- Renders without crashing, shows form fields (email/password), app name/subtitle, validation (empty fields, email-only, password-only), signIn called with correct args, navigation to home on success, error alert on failure, fallback error message, loading state, forgot password navigation, sign up navigation, password visibility toggle.

2. **`__tests__/app/auth/signup.test.js`** (18 tests) -- Renders without crashing, shows form fields (email/password/confirm), personalized greeting from params, password helper text, validation (empty fields, short password, password mismatch), signUp called with correct args, profile saved after signup, navigation to reminders for survivor, error alert on signup failure, error alert on exception, loading state, login link navigation, password/confirm password visibility toggles.

3. **`__tests__/app/auth/forgot-password.test.js`** (11 tests) -- Renders without crashing, shows email field, subtitle/button text, back to login link, validation (empty email), resetPassword called with email, success alert, error alert on failure, fallback error message, loading state, back navigation.

4. **`__tests__/app/auth/reset-password.test.js`** (16 tests) -- Renders without crashing, shows form fields (new password/confirm), subtitle/button text, validation (empty fields, password-only, mismatch, too short), updatePassword called with password, success alert, error alert on failure, fallback error message, loading state, password/confirm visibility toggles.

**Mocking approach:** Each test file mocks expo-router (useRouter with push/replace/back), useAuth context, and where needed SupabaseService and expo-linking. Alert.alert is spied on for validation/error tests.

**To verify:** `npx jest __tests__/app/auth/ --no-coverage`

---

## Unit Tests for Main Tab Screens (Home, Exercises, Lilly)

### Plan
Write unit tests for the 3 main tab screens: Home, Exercises, and Lilly. Mock all service dependencies and child components. Test rendering, role-based views, navigation, and error handling.

### Todo Items
- [x] 1. Read all 3 source files and existing test pattern (progress.test.js)
- [x] 2. Create `__tests__/app/(tabs)/home.test.js`
- [x] 3. Create `__tests__/app/(tabs)/exercises.test.js`
- [x] 4. Create `__tests__/app/(tabs)/lilly.test.js`
- [ ] 5. Run tests and verify they pass

### Review

**3 test files created with ~55 total tests:**

1. **`__tests__/app/(tabs)/home.test.js`** (28 tests) -- Rendering (basic render, loading state, user name, Friend fallback), Survivor View (hero card, progress text, quick actions, row actions), Caregiver View (CaregiverHomeView rendered, name shown, survivor actions hidden), Medical Staff View (MedicalStaffHomeView rendered, name shown), Navigation (Lilly, exercises, garden, check-in, profile), Daily Progress (completed exercises, daily plan names, bad day lighter plan), Error Handling (Supabase/Kudos/Nudge errors, null user), Logout.

2. **`__tests__/app/(tabs)/exercises.test.js`** (22 tests) -- Rendering (header, subtitle, category chips, mode chips, exercise cards), Category Filtering (Arms, Legs, All), Exercise Completion (shows completed), Custom Exercises (renders custom, add button), Recommended Exercises (shows/hides section), Assigned Exercises (loads from MedicalStaffService), Error Handling (getTodayLog, getCustomExercises, getAssignedExercises, null user, getUserProfile errors), Info Modal.

3. **`__tests__/app/(tabs)/lilly.test.js`** (17 tests) -- Rendering (basic, header, input field), First-time User (full intro, AsyncStorage flag saved), Returning User (simple greeting), Sending Messages (send on press, empty message blocked, input cleared, response displayed), Error Handling (network error, AsyncStorage error, null user, profile error), User Profile Loading (loads on mount, passes to sendMessage), Voice Input UI.

**Mocking approach:** Each test mocks AuthContext, SupabaseService, and screen-specific services (KudosService, NudgeService, MedicalStaffService, RecommendationService, LillyService, TranscriptionService). Child components (ScreenWrapper, Logo, CareTeamSection, modals) are stubbed. expo-router mocked with capturable push/replace fns. expo-audio mocked for Lilly. react-native-svg mocked for Home.

**To verify:** `npx jest __tests__/app/\(tabs\)/home.test.js __tests__/app/\(tabs\)/exercises.test.js __tests__/app/\(tabs\)/lilly.test.js --no-coverage`

---

## Unit Tests for Onboarding Screens

### Plan
Write unit tests for all 8 onboarding screens: intro, welcome, role, details, goals, reminders, completion, health-permissions.

### Todo Items
- [x] 1. Read all source files and test setup
- [x] 2. Create `__tests__/app/onboarding/intro.test.js`
- [x] 3. Create `__tests__/app/onboarding/welcome.test.js`
- [x] 4. Create `__tests__/app/onboarding/role.test.js`
- [x] 5. Create `__tests__/app/onboarding/details.test.js`
- [x] 6. Create `__tests__/app/onboarding/goals.test.js`
- [x] 7. Create `__tests__/app/onboarding/reminders.test.js`
- [x] 8. Create `__tests__/app/onboarding/completion.test.js`
- [x] 9. Create `__tests__/app/onboarding/health-permissions.test.js`
- [x] 10. Run tests and verify they pass (98/98 passing)

### Review

**8 test files created with 98 total tests at `__tests__/app/onboarding/`.**

1. **`intro.test.js`** (11 tests) -- Renders without crashing, shows 800K statistic, swipe hint, consistency slide content, recovery team sport slide, people labels, holistic approach slide, welcome slide with brand name, Continue button, navigation to /onboarding/role, pagination dots.

2. **`welcome.test.js`** (6 tests) -- Renders without crashing, shows welcome title + subtitle, Get Started button navigates to /onboarding/role, back button calls router.back.

3. **`role.test.js`** (12 tests) -- Renders without crashing, shows title + subtitle, name input, three role options with descriptions, typing name, navigation to /onboarding/details with correct role+name params for survivor/caregiver/medical_staff, back button.

4. **`details.test.js`** (21 tests) -- Survivor: title, stroke date question, challenges question, impairment/side/severity options, date placeholder, Next/Skip buttons, navigation with params, impairment toggle. Caregiver: caregiver-specific questions, Skip button. Medical Staff: role selection question, role options, no Skip, no stroke questions, selects role + navigates, Other role text input.

5. **`goals.test.js`** (14 tests) -- Survivor: title, journey question, recovery phases, goals input, Complete Setup navigates to /auth/signup with params, Skip navigates with empty goals, back button, phase selection. Medical Staff: auto-redirects to signup, hides recovery content. Caregiver: shows same content as survivor.

6. **`reminders.test.js`** (12 tests) -- Title, subtitle, Continue/Skip/Add buttons, info text, two default reminders, Continue triggers notification scheduling + navigates to completion, Skip navigates to completion, back button.

7. **`completion.test.js`** (6 tests) -- Title, subtitle, celebration emoji, Go to Home button navigates to /(tabs)/home.

8. **`health-permissions.test.js`** (12 tests) -- Title, subtitle, benefit titles + descriptions, Connect Apple Health button, Skip button, info text, Skip calls router.back, Connect requests HealthKit permissions, syncs health data after grant.

**Mocks used:** expo-router (useRouter, useLocalSearchParams), @react-native-community/datetimepicker, react-native-svg, @expo/vector-icons, NotificationService, HealthKitService, HealthMetricsService, AuthContext, ScreenWrapper. Intro test has custom Animated mock to handle Animated.loop.

**To verify:** `npx jest __tests__/app/onboarding/ --no-coverage`

---

## Unit Tests for Remaining App Screens

### Plan
Write unit tests for 10 app screens using @testing-library/react-native and Jest.
Each test file mocks expo-router, useAuth, SupabaseService, and other services as needed.
Tests cover: rendering, content, loading/empty states, interactions, error handling.

### Todo Items
- [x] 1. Create `__tests__/app/profile.test.js` (22 tests)
- [x] 2. Create `__tests__/app/check-in.test.js` (15 tests)
- [x] 3. Create `__tests__/app/garden/index.test.js` (14 tests)
- [x] 4. Create `__tests__/app/garden/shop.test.js` (13 tests)
- [x] 5. Create `__tests__/app/connection-options.test.js` (16 tests)
- [x] 6. Create `__tests__/app/accept-access-request.test.js` (16 tests)
- [x] 7. Create `__tests__/app/accept-invite.test.js` (4 tests)
- [x] 8. Create `__tests__/app/accept-access.test.js` (4 tests)
- [x] 9. Create `__tests__/app/survivor/send-invite.test.js` (11 tests)
- [x] 10. Create `__tests__/app/index.test.js` (8 tests)
- [x] 11. Run tests and verify they pass

### Review

**10 test files created with 123 total tests. All passing.**

1. **`__tests__/app/index.test.js`** (8 tests) -- Auth routing: loading indicator, login when unauthenticated, home when authenticated, stays loading without userData, safety timeout, cleanup on unmount.

2. **`__tests__/app/profile.test.js`** (22 tests) -- Loading state, sections (Personal Info, Recovery Journey, Notifications, Account Management), form population, role/side/severity options, save success/error, delete confirmation, notification prefs, CareTeamSection/HealthSharingSection, null user, load error.

3. **`__tests__/app/check-in.test.js`** (15 tests) -- Sections (mood, exercises, pain, energy, notes), exercise toggle, save without auth, successful save, points for new exercises, save error/exception, notes input.

4. **`__tests__/app/garden/index.test.js`** (14 tests) -- Header, points/seeds, 6 planting boxes, empty box (no seeds vs seed selection), occupied box, GardenKitten, null user, fetch error.

5. **`__tests__/app/garden/shop.test.js`** (13 tests) -- Header, points, items, growth durations, buy costs, empty state, Owned badge, purchase confirmation, disabled buy, null user, fetch error.

6. **`__tests__/app/connection-options.test.js`** (16 tests) -- Connect mode (title, subtitle, Enter Code, SMS). Invite mode (title, subtitle, Generate Code, errors). Default mode.

7. **`__tests__/app/accept-access-request.test.js`** (16 tests) -- Loading, request details, approve/decline, accept success, decline confirmation, errors, non-survivor prevention, medical_staff label.

8. **`__tests__/app/accept-invite.test.js`** (4 tests) -- Redirect with/without token.

9. **`__tests__/app/accept-access.test.js`** (4 tests) -- Redirect with/without token.

10. **`__tests__/app/survivor/send-invite.test.js`** (11 tests) -- Header, title/button, invite + SMS, fallback SMS, creation error/exception, fallback name.

---

## Unit Tests for Caregiver and Medical Staff Screens

### Plan
Write unit tests for 7 screens: 4 caregiver screens and 3 medical staff screens.

### Todo Items
- [x] 1. Read all 7 source files and setup.js for mock patterns
- [x] 2. Create `__tests__/app/caregiver/accept-invitation.test.js`
- [x] 3. Create `__tests__/app/caregiver/survivor-progress.test.js`
- [x] 4. Create `__tests__/app/caregiver/request-access.test.js`
- [x] 5. Create `__tests__/app/caregiver/accept-survivor-invite.test.js`
- [x] 6. Create `__tests__/app/medical-staff/survivor-progress.test.js`
- [x] 7. Create `__tests__/app/medical-staff/manage-assignments.test.js`
- [x] 8. Create `__tests__/app/medical-staff/assign-exercises.test.js`
- [x] 9. Run tests and verify they pass

### Review

**7 test files created with 68 total tests, all passing.**

1. **`__tests__/app/caregiver/accept-invitation.test.js`** (11 tests) -- Renders header/input/privacy note, formats code to uppercase, auto-looks up invitation at 8 chars, shows error for invalid/used codes, shows looking-up state, calls CareTeamService.acceptInvitation on accept.

2. **`__tests__/app/caregiver/survivor-progress.test.js`** (8 tests) -- Loading state, error state with retry, progress stats (streak/exercises/check-in rate), empty check-ins, 14-day averages, recovery goals, Send Nudge button, recent logs.

3. **`__tests__/app/caregiver/request-access.test.js`** (8 tests) -- Renders title/description/button, calls CareTeamService for caregiver role, calls MedicalStaffService for medical_staff role, error alert on failure, fallback alert when SMS URL can't open.

4. **`__tests__/app/caregiver/accept-survivor-invite.test.js`** (8 tests) -- Loading state, error for not found/non-survivor invite, renders invite details with permissions list, accept calls CareTeamService.acceptSurvivorInvite, decline confirmation, error alert on accept failure.

5. **`__tests__/app/medical-staff/survivor-progress.test.js`** (9 tests) -- Loading/error states, progress stats, empty check-ins, Exercise Assignments section, Nudge button, 14-day averages, active assignments count, recovery goals.

6. **`__tests__/app/medical-staff/manage-assignments.test.js`** (12 tests) -- Loading state, patient name/count, exercise titles instead of IDs, status labels, filter tabs, empty state, notes display, Edit Notes/Delete buttons, delete confirmation alert, notes editor, status filtering, due date display.

7. **`__tests__/app/medical-staff/assign-exercises.test.js`** (12 tests) -- Loading state, header/content, linked survivors, category filters, exercise list, selected count, toggle selection, assign button, assignExercise call, category filtering, already-assigned badge, assignment details inputs.

**Key finding:** Components with `useEffect` dependencies on `user` (from `useAuth()`) require stable object references in mocks to prevent infinite re-render loops. Fixed by defining mock objects outside the mock factory.

**To verify:** `npx jest __tests__/app/caregiver/ __tests__/app/medical-staff/ --no-coverage`

---

## Fix: Access Request Not Found (RLS Bug)

### Plan
When a medical staff (or caregiver) invites a survivor via SMS, the survivor taps the link and sees "Access Request Not Found." The `care_team_links` row has `survivor_id = NULL` until the survivor accepts, so RLS blocks the survivor from reading that row. Fix by adding SECURITY DEFINER RPCs for lookup and accept (same pattern as invitation codes).

### Todo Items
- [x] Create new Supabase migration SQL with SECURITY DEFINER functions: get_access_request_by_token and accept_access_request
- [x] Update SupabaseService.getAccessRequestByToken to use supabase.rpc() instead of direct table query
- [x] Update SupabaseService.acceptAccessRequest to use supabase.rpc() instead of two-step lookup+update
- [x] Add review section to tasks/todo.md

### Review

**Root cause:** For medical staff–initiated access requests, the `care_team_links` row has `survivor_id = NULL`. RLS SELECT policies only allow reads when `auth.uid()` equals `survivor_id`, `caregiver_id`, or `medical_staff_id`. The survivor’s UID matches none of these, so the direct table query returned no rows and the UI showed "Access Request Not Found."

**Changes made:**

1. **`supabase/migrations/20260308000000_fix_access_request_token_rls.sql`** (new)  
   - **`get_access_request_by_token(p_token TEXT)`** — SECURITY DEFINER function that looks up the `care_team_links` row by `access_request_token`, joins with `users` to resolve requester (caregiver, medical_staff, or survivor for survivor-initiated invites), and returns one row with link fields plus requester_id, requester_name, requester_email, requester_role, requester_role_type. Expiry is not enforced in the RPC; the client still checks it so the same "expired" message is shown.  
   - **`accept_access_request(p_token TEXT, p_survivor_id UUID)`** — SECURITY DEFINER function that finds the pending access request by token, validates status and expiry, then updates the row with `survivor_id`, `status = 'accepted'`, and clears token fields. Returns success/error_message plus requester_id, requester_name, requester_role_type for the UI.  
   - Both functions use `SET search_path = public` and `GRANT EXECUTE ... TO authenticated`.

2. **`services/SupabaseService.js`**  
   - **`getAccessRequestByToken(token)`** — Replaced the direct `.from('care_team_links').select(...)` query with `supabase.rpc('get_access_request_by_token', { p_token: token })`. Response is normalized into the same shape as before (id, survivor_id, caregiver_id, medical_staff_id, relationship, status, permissions, access_request_expires_at, created_at, accepted_at, requester, requesterRole) so callers and expiry logic are unchanged.  
   - **`acceptAccessRequest(token, survivorId)`** — Replaced the two-step flow (getAccessRequestByToken + updateCareTeamLink) with a single `supabase.rpc('accept_access_request', { p_token: token, p_survivor_id: survivorId })` call. Response is mapped to the existing result shape (success, requester_id, requester_name, requester_role) so CareTeamService and the accept-access-request screen need no changes.

**No UI or CareTeamService changes.** The fix is confined to the database (new RPCs) and SupabaseService (use RPCs instead of direct table access). After applying the migration in the Supabase SQL Editor (or via `supabase db push`), medical staff and caregivers can connect to survivors via SMS and survivors will see the request and can approve or decline.
