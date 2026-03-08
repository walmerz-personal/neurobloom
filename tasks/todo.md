# NeuroBloom Tasks

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

**How to preview:** `cd my-video && npm run dev` → choose ShoulderShrugs in Remotion Studio.  
**How to re-render:** `npx remotion render ShoulderShrugs out/shoulder-shrugs.mp4`

**Next:** Phase 2 (more exercises) and Phase 3 (integrate videos into NeuroBloom app).

---

## Fix: Caregiver Names Showing as "Unknown" for Survivors

### Root Cause
The Supabase RLS policy on the `users` table allows caregivers to view survivors' profiles, but has **no policy** allowing survivors to view their linked caregivers' profiles. When the app does `caregiver:caregiver_id(id, name, email)` in the join, RLS blocks the read → name returns null → falls back to `'Unknown'`.

### Todo Items
- [x] Create SQL migration `supabase/fix-survivor-caregiver-visibility.sql` with the missing RLS policy
- [x] User applies the SQL in Supabase SQL Editor

### Review
- Added one RLS policy to the `users` table: `"Survivors can view linked caregiver profiles"`
- This allows a survivor to SELECT the `users` row of any caregiver linked to them via an accepted `care_team_links` entry
- Previously, the Supabase join `caregiver:caregiver_id(id, name, email)` in `getCareTeamLinks` was blocked by RLS, returning null and falling back to `'Unknown'`
- No app code changes required — purely a database policy fix

---

## Fix Plant/Flower Clipping in Garden

### Plan
Plants are cut off because the PlantingBox container (110px) is too short. Full-bloom plant SVGs are 98px tall and positioned to overflow ~68px above the container. React Native's ScrollView clips this overflow.

Fix: Increase container height to 185px and switch backRim/innerBox from `top`-anchored (absolute) to `bottom`-anchored so they stay attached to the box while the plant renders within the container bounds.

### Todo Items
- [x] 1. Update PlantingBox styles: container height 110→185, backRim top→bottom, innerBox top→bottom, remove plantContainer marginBottom

### Review
- Changed `container.height` from 110 → 185px to give room for the full plant graphic above the box.
- Switched `backRim` from `top: 20` → `bottom: 60` so it stays anchored just above the wooden frontBox regardless of container height.
- Switched `innerBox` from `top: 25` → `bottom: 65` (same reason), and reduced `paddingBottom` 10 → 5.
- Removed `plantContainer.marginBottom: 45` — no longer needed since the container is now tall enough to contain the plant naturally (plant occupies y≈17–115, box occupies y=115–185).
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

1. **`supabase/fix-medical-staff-role-check.sql`** (new) — SQL migration that dynamically finds and drops the existing CHECK constraint on `users.role`, then re-adds it with all 3 valid values (`survivor`, `caregiver`, `medical_staff`). **Must be run in Supabase SQL Editor.**
2. **`app/auth/signup.js:78`** — `saveUserProfile` return value is now checked for errors (logged but non-blocking since auth account already exists).
3. **`app/auth/signup.js:86`** — Replaced undefined `userData?.role` with `params.role` which was already in scope.
4. **`app/onboarding/details.js:34`** — Changed from `medicalStaffRole === 'other' ? otherRole : medicalStaffRole` to just `medicalStaffRole`, so `'other'` is passed to the DB instead of free text that violates the CHECK constraint.

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

1. **`manage-assignments.js`** — Added EXERCISES_DATA lookup + `getExerciseTitle()` helper so assignments show "Shoulder Shrugs" instead of "a1". Added SupabaseService import and wired up `handleSaveNotes` to actually persist notes via `updateAssignmentNotes`.
2. **`assign-exercises.js`** — Added optional due date (text input) and notes (multiline) fields before the save button, passed to `assignExercise()`. Added `alreadyAssigned` Set that loads existing assignments when a patient is selected; already-assigned exercises show a subtle badge and are dimmed.
3. **`exercises.js`** — Changed `assignedExercises` from ID array to Map storing full assignment details (assigner name, notes, due date). ExerciseCard now shows a green info box with "Assigned by [Name]", notes in italics, and due date.
4. **`SupabaseService.js`** — Added `updateAssignmentNotes()` method. Changed `getAssignedExercises` select to join users table for assigner name.
