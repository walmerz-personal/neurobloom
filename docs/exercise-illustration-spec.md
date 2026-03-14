# Standardized Exercise Illustration Specification

This document is the single source of truth for generating all NeuroBloom exercise illustrations. Use it when creating or commissioning images so every illustration is visually consistent and supports diverse representation.

---

## 1. Global Style Rules

These rules apply to **every** image. No exceptions.

- **No text of any kind** in the image — no titles, step labels, step numbers, or captions. The app UI displays step and instruction text; the image must not duplicate it.
- **Clean white background** with a subtle warm gradient (light beige at bottom fading to white) and a soft beige shadow circle beneath the character's feet or chair.
- **Flat vector illustration style** — minimal, warm, approachable, like a modern medical instruction guide.
- **Soft rounded shapes**, no harsh outlines.
- **Pastel color palette** — soft blues, warm skin tones, light greys for clothing and furniture.
- **Character centered** in the frame at a consistent size (approximately 70% of image height).
- **Same camera angle** for all images within one exercise (e.g. 3/4 front view for seated; side view for lying; front/slight 3/4 for standing).
- **Image dimensions:** 1024×576 (16:9 landscape) to match the app's image container.

### 1.1 Generation prompt template (for AI image generation)

When generating images with an AI image tool, include the following in **every** prompt so outputs stay consistent and anatomically correct.

**STYLE PREFIX** (copy into every prompt):

```
Flat vector illustration style. Minimal, warm, approachable.
Soft rounded shapes, no harsh outlines. Pastel color palette.
Clean white background with subtle warm gradient and soft beige
shadow circle beneath feet/chair. No text, titles, or labels
in the image. Character centered at approximately 70% of image height.
```

**ANATOMY SAFEGUARD** (include in every prompt):

```
The person has exactly two arms and two legs. Do not generate
extra limbs, floating body parts, or anatomical errors.
```

**FURNITURE** (for seated exercises): Explicitly state "The person is sitting in a simple light grey chair with a backrest" (not a stool, not a bench, not missing).

### 1.2 Chaining (Steps 2 and 3)

To keep the same character, outfit, chair, and style across all steps of one exercise:

1. Generate **Step 1** first and approve it (see Quality Gate below).
2. For **Steps 2 and 3**, always pass the **approved Step 1 image as a reference image** (e.g. `reference_image_paths`). The generator will use it to match character and style.
3. The prompt for Step 2 and 3 should begin with: *"Same person, same outfit, same chair, same background, same illustration style as the reference image. The only change is: [describe the pose/movement difference]."* Then add the step-specific pose and any arrow direction.

Do not generate Steps 2 or 3 without using Step 1 as reference; otherwise the generator will produce a different person or style.

---

## 2. Motion Arrow Standard

Use arrows only to indicate direction of movement. Keep style consistent across all images.

- **Only on movement steps** — resting/starting positions have **no** arrows.
- **Style:** Simple, clean, straight or gently curved arrows. Medium stroke weight. Same weight across all images.
- **Color:** Light blue (#93C5FD) at approximately 70% opacity.
- **Placement:** Adjacent to the body part that is moving, not overlapping the character.
- **Direction:** Matches the movement (up for lifting, down for lowering, curved for rotation, horizontal for sliding).
- **No arrow on the final "repeat" or "relax" step** if the character is back in a resting position.

---

## 3. Character Diversity Rotation

Use a fixed set of six characters. All share the same illustration style (flat vector, pastel, same outfit) but vary in age, gender, and appearance. Rotate through them so the full library feels inclusive.

| Character | Description | Example exercises (full list in Section 5) |
|-----------|-------------|--------------------------------------------|
| **A** | Older woman (60s–70s), grey hair, light skin | a1, a7, l2, l3, l9, l15, l21, c3, c9, h2, n3, a16 |
| **B** | Middle-aged man (50s), short dark hair, medium skin | a2, a8, l4, l10, l16, l22, c1, c4, c10, h3, n4 |
| **C** | Older man (60s–70s), grey/white hair, light skin | a3, a9, l5, l11, l17, l23, c2, c5, c11, n5 |
| **D** | Middle-aged woman (40s–50s), dark hair, medium-dark skin | a4, a10, l6, l12, l18, l24, c6, c12, n6, a13 |
| **E** | Older woman (60s–70s), short grey hair, dark skin | a5, a11, l7, l13, l19, c7, h1, n7, a14 |
| **F** | Younger man (30s–40s), short brown hair, light–medium skin | a6, a12, l1, l8, l14, l20, c8, n1, n2, a15 |

**Outfit (all characters):** Light blue t-shirt, light grey pants, dark navy sneakers. This keeps focus on the exercise, not clothing.

**Partner exercises:** The second person (partner/therapist) wears a **neutral grey t-shirt** so they are clearly distinct from the patient.

---

## 4. Pose Position Standards

Use consistent framing for each exercise context:

- **Seated exercises:** Character in a simple light grey chair, slight 3/4 angle, full body visible from head to mid-shin.
- **Standing exercises:** Character standing, slight 3/4 angle, full body visible head to feet. Include support furniture (chair back, counter) when the instructions mention it.
- **Lying exercises:** Character on a light grey mat or surface, side view or 3/4 view as needed, full body visible.
- **Floor exercises:** Character seated on floor, knees bent or as specified, slight 3/4 angle, full body visible.
- **Partner exercises:** Active person (patient) and partner both clearly visible; patient in light blue shirt, partner in grey shirt.

---

## 5. Per-Exercise Step Specifications

For each exercise: ID, title, character, context, and step-by-step illustration directions. Generate 2–4 steps per exercise based on instruction complexity. Each step lists body position and whether arrows are needed.

### Arms (a1–a16)

#### a1 – Shoulder Shrugs (Character A, Seated)
- **Step 1:** Seated, feet flat, arms relaxed on lap, shoulders in neutral position. No arrows.
- **Step 2:** Shoulders raised toward ears. Two upward-pointing arrows beside both shoulders.
- **Step 3:** Shoulders lowered back to neutral, relaxed expression. Two downward-pointing arrows beside both shoulders.

#### a2 – Table Push (Character B, Seated, Partner)
- **Step 1:** Seated at table, hands interlaced or strong hand over affected hand on towel. Partner may be beside. No arrows.
- **Step 2:** Hands sliding forward on table, elbows straightening. Horizontal forward arrows near hands/forearms.
- **Step 3:** Hands sliding back to start. Horizontal backward arrows or return to step 1 pose. No arrows on return.

#### a3 – Bicep Curls (Character C, Seated)
- **Step 1:** Seated, one arm at side holding water bottle or light weight, elbow straight. No arrows.
- **Step 2:** Elbow bent, hand curling toward shoulder. One curved or straight upward arrow along forearm.
- **Step 3:** Arm lowering back down. One downward arrow along forearm.

#### a4 – PROM Shoulder External Rotation (Character D, Seated)
- **Step 1:** Seated, one hand grasping wrist of involved arm, elbow bent at side. No arrows.
- **Step 2:** Forearm moving outward away from body (external rotation). Curved or horizontal arrow indicating outward rotation.
- **Step 3:** Return to start. No arrows.

#### a5 – PROM Shoulder Flexion (Self) (Character E, Seated)
- **Step 1:** Seated, one hand grasping wrist of involved arm, arm at side. No arrows.
- **Step 2:** Arm raised upward and in front (flexion). Upward arrow along arm.
- **Step 3:** Return to start. No arrows.

#### a6 – PROM Shoulder Extension (Self) (Character F, Seated)
- **Step 1:** Seated, involved arm at side, elbow bent 90°, other hand on wrist/forearm. No arrows.
- **Step 2:** Arm moved backward (extension). Backward/horizontal arrow.
- **Step 3:** Return to start. No arrows.

#### a7 – PROM Elbow Flexion/Extension (Character A, Seated)
- **Step 1:** Seated, one hand grasping wrist, arm straight. No arrows.
- **Step 2:** Elbow bending (flexion). Curved or upward arrow at elbow/forearm.
- **Step 3:** Elbow straightening (extension). Downward or straightening arrow. Can combine in one “through range” step with one arrow each direction if preferred.

#### a8 – Shoulder Girdle Retraction (Character B, Seated)
- **Step 1:** Seated or standing, good posture, arms at sides. No arrows.
- **Step 2:** Shoulder blades squeezed together and down. Small inward/downward arrows near scapulae.
- **Step 3:** Relax. No arrows.

#### a9 – Seated Push Up (Character C, Seated)
- **Step 1:** Seated, hands on armrests or seat beside thighs. No arrows.
- **Step 2:** Pressing down through hands, body lifted slightly off seat. Downward arrows at hands or upward at torso.
- **Step 3:** Lowering back. No arrows.

#### a10 – PROM Shoulder Abduction (Partner) (Character D, Lying, Partner)
- **Step 1:** Lying on back, arm at side, elbow straight. Partner at side (grey shirt). No arrows.
- **Step 2:** Partner moving arm away from body (abduction). Upward/outward arrow along arm.
- **Step 3:** Return to side. No arrows.

#### a11 – PROM Shoulder Flexion (Partner) (Character E, Lying, Partner)
- **Step 1:** Lying on back, arm at side. Partner at side. No arrows.
- **Step 2:** Partner moving arm upward and forward. Upward arrow along arm.
- **Step 3:** Return. No arrows.

#### a12 – PROM Elbow Flex/Ext (Partner) (Character F, Lying or Seated, Partner)
- **Step 1:** Arm straight, partner’s hands at elbow and wrist. No arrows.
- **Step 2:** Partner bending elbow (flexion). Arrow at elbow/forearm.
- **Step 3:** Partner straightening elbow. Arrow or return. No arrows on relax.

#### a13 – Resistance Band Chest Press (Character D, Floor)
- **Step 1:** Seated on floor, knees bent, band behind back below shoulder blades, hands in front of shoulders, palms in. No arrows.
- **Step 2:** Pressing arms forward, palms rotating down. Forward arrows from hands/chest.
- **Step 3:** Return slowly. No arrows.

#### a14 – Resistance Band Arm Curl (Character E, Floor)
- **Step 1:** Seated on floor, knees bent, band around feet, arms extended toward legs, palms in. No arrows.
- **Step 2:** Bending elbows, hands toward shoulders, palms up. Upward arrows along forearms.
- **Step 3:** Return. No arrows.

#### a15 – Resistance Band Arm Extension (Character F, Floor)
- **Step 1:** Seated on floor, knees bent, band in both hands, arms bent 90°, elbows at shoulder height, palms down. No arrows.
- **Step 2:** Straightening arms until hands align with shoulders. Forward/downward arrows along forearms.
- **Step 3:** Return. No arrows.

#### a16 – Resistance Band Shoulder Press (Character A, Floor)
- **Step 1:** Seated on floor, knees bent, band under buttocks, hands just above shoulders, palms forward. No arrows.
- **Step 2:** Pressing arms up and back overhead, palms toward each other. Upward arrows along arms.
- **Step 3:** Return. No arrows.

---

### Legs (l1–l24)

#### l1 – Ankle Pumps (Character F, Seated or Lying)
- **Step 1:** Seated or lying, legs straight, feet neutral. No arrows.
- **Step 2:** Toes pulled up toward nose (dorsiflexion). Upward arrow at foot/ankle.
- **Step 3:** Toes pointed down (plantarflexion). Downward arrow at foot/ankle.

#### l2 – Seated Marching (Character A, Seated)
- **Step 1:** Seated upright, feet on floor. No arrows.
- **Step 2:** One knee lifted toward chest. Upward arrow at knee/thigh.
- **Step 3:** Lower that leg. Downward arrow. (Alternate leg can be implied or same frame.)

#### l3 – Sit-to-Stand (Character A, Seated then Standing)
- **Step 1:** Sitting at edge of chair, feet flat. No arrows.
- **Step 2:** Leaning forward slightly (“nose over toes”), beginning to stand. Forward/down arrow for lean or upward for rise.
- **Step 3:** Standing fully. No arrows.
- **Step 4 (optional):** Lowering back to chair. Downward arrow.

#### l4 – Seated Knee Extensions (Character B, Seated)
- **Step 1:** Seated, both feet on floor. No arrows.
- **Step 2:** One foot lifted, knee straight, leg parallel to floor. Upward arrow at lower leg/knee.
- **Step 3:** Lowering foot back. Downward arrow.

#### l5 – Seated Hip Adduction (Character C, Seated)
- **Step 1:** Seated with pillow or ball between knees. No arrows.
- **Step 2:** Knees squeezing together. Inward arrows toward midline at knees.
- **Step 3:** Relax. No arrows.

#### l6 – Side Stepping on Line (Character D, Standing)
- **Step 1:** Standing upright, hands at sides, one foot on a line. No arrows.
- **Step 2:** Stepping sideways along line. Horizontal arrow in step direction.
- **Step 3:** Return step or continue. Arrow or no arrow for return.

#### l7 – Marching with Support (Character E, Standing)
- **Step 1:** Standing at counter/chair, hands on support. No arrows.
- **Step 2:** One knee raised to waist level. Upward arrow at knee.
- **Step 3:** Lower and alternate. Downward arrow or no arrows.

#### l8 – Heel Slides (Character F, Lying)
- **Step 1:** Lying on back, legs straight. No arrows.
- **Step 2:** One heel sliding up toward buttocks, knee bending. Curved or backward arrow along leg.
- **Step 3:** Heel sliding back down, leg straightening. Forward arrow or no arrows.

#### l9 – Straight Leg Raise (Supine) (Character A, Lying)
- **Step 1:** Lying on back, legs straight. No arrows.
- **Step 2:** One leg lifted straight up off surface. Upward arrow along leg.
- **Step 3:** Lowering leg. Downward arrow.

#### l10 – Heel Raises (Character B, Standing)
- **Step 1:** Standing, holding chair/counter, feet flat. No arrows.
- **Step 2:** Rising onto toes. Upward arrows at heels/ankles.
- **Step 3:** Lowering heels. Downward arrows.

#### l11 – Standing Hamstring Curls (Character C, Standing)
- **Step 1:** Standing holding chair back, one leg weight-bearing. No arrows.
- **Step 2:** Other knee bending, heel toward buttock. Curved backward arrow at lower leg.
- **Step 3:** Lowering foot to floor. Downward arrow.

#### l12 – Prone Hamstring Curls (Character D, Lying, Partner)
- **Step 1:** Lying on stomach, partner at feet (grey shirt), hand on pelvis. No arrows.
- **Step 2:** Knee flexing, heel toward buttock. Curved arrow at lower leg.
- **Step 3:** Lowering. No arrows.

#### l13 – Hip Abduction (Supine) (Character E, Lying)
- **Step 1:** Lying on back, legs straight. No arrows.
- **Step 2:** One leg sliding out to the side. Horizontal outward arrow.
- **Step 3:** Leg sliding back to center. Inward arrow or no arrows.

#### l14 – Hip Abduction (Standing) (Character F, Standing)
- **Step 1:** Standing holding support. No arrows.
- **Step 2:** One leg lifting sideways. Outward horizontal arrow.
- **Step 3:** Leg returning. No arrows.

#### l15 – Hip Extension (Standing) (Character A, Standing)
- **Step 1:** Standing holding support. No arrows.
- **Step 2:** One leg brought slightly backward. Backward horizontal arrow.
- **Step 3:** Return. No arrows.

#### l16 – Partial Squats (Character B, Standing)
- **Step 1:** Standing, feet shoulder-width, hands on support if needed. No arrows.
- **Step 2:** Knees bending, partial squat. Downward arrows at knees or torso.
- **Step 3:** Pushing back up. Upward arrows.

#### l17 – Forward Lunges (Character C, Standing)
- **Step 1:** Standing, feet hip-width. No arrows.
- **Step 2:** One leg stepped forward, back knee lowering toward floor. Downward/forward arrows.
- **Step 3:** Push back to standing. Upward/backward or no arrows.

#### l18 – Assisted Dorsiflexion Stretch (Character D, Lying, Partner)
- **Step 1:** Lying on back, partner supporting leg, heel in partner’s hand, foot against forearm. No arrows.
- **Step 2:** Partner pulling heel up, toes toward patient. Upward arrow at foot/ankle.
- **Step 3:** Hold. No arrows.

#### l19 – Hamstring Stretch (Assisted) (Character E, Lying, Partner)
- **Step 1:** Lying on back, partner at side. No arrows.
- **Step 2:** Partner bending one leg to 90°, then pushing lower leg upward to straighten. Upward arrow on lower leg.
- **Step 3:** Hold. No arrows.

#### l20 – Retro Gait (Character F, Standing)
- **Step 1:** Standing upright. No arrows.
- **Step 2:** Walking backward, toe touching first then rolling to flat. Backward arrow at foot.
- **Step 3:** Same for next step. Arrow or no arrows.

#### l21 – Walk on Toes (Character A, Standing)
- **Step 1:** Standing tall on toes (or mid-step). Upward arrow at heels if showing lift.
- **Step 2:** Walking forward on toes. Forward arrow or no arrows.

#### l22 – Walk on Heels (Character B, Standing)
- **Step 1:** Standing tall on heels. No arrows or small upward arrow at toes.
- **Step 2:** Walking forward on heels. Forward arrow or no arrows.

#### l23 – Stair Walking (Character C, Standing)
- **Step 1:** At bottom of stairs, hand on railing. No arrows.
- **Step 2:** One foot on step, ascending. Upward arrow on step.
- **Step 3:** Alternating. Same or no arrows.

#### l24 – Gait Training with Cane (Character D, Standing, Partner optional)
- **Step 1:** Standing with cane, one leg forward, heel strike. Forward arrow at heel.
- **Step 2:** Weight shifting onto that leg, pelvis tuck, other knee bending. Arrows for weight shift or leg motion.
- **Step 3:** Midstance, cane moving forward. Forward arrow at cane or leg.

---

### Core (c1–c12)

#### c1 – Trunk Rotations (Character B, Seated)
- **Step 1:** Seated tall, feet flat, hands on thighs or one hand on opposite thigh. No arrows.
- **Step 2:** Upper body twisting to one side. Curved rotation arrow at torso.
- **Step 3:** Return to center. No arrows. (Other side can be separate step or same.)

#### c2 – Lateral Flexion (Character C, Seated)
- **Step 1:** Seated tall, arms at sides. No arrows.
- **Step 2:** Leaning to one side, hand reaching toward floor. Diagonal downward arrow on torso.
- **Step 3:** Return to upright. No arrows.

#### c3 – Seated Balance (Character A, Seated)
- **Step 1:** Seated tall (on cushion if desired). No arrows.
- **Step 2:** Weight shifting side to side. Horizontal arrow or no arrows (subtle).
- **Step 3:** Weight shifting forward/back or one foot slightly lifted. Arrow optional.

#### c4 – Bridging (Character B, Lying)
- **Step 1:** Lying on back, knees bent, feet flat. No arrows.
- **Step 2:** Hips raised off floor, bridge position. Upward arrow at hips.
- **Step 3:** Lowering. Downward arrow.

#### c5 – Bridging Crossed Leg (Character C, Lying, Partner optional)
- **Step 1:** Lying on back, one leg crossed over other (ankle on knee). No arrows.
- **Step 2:** Hips raised, bridge. Upward arrow at hips. Partner may hold knee.
- **Step 3:** Lower. No arrows.

#### c6 – Single Leg Bridge (Character D, Lying, Partner optional)
- **Step 1:** Lying on back, knees bent, one leg extended straight. No arrows.
- **Step 2:** Hips raised, pelvis level. Upward arrow at hips.
- **Step 3:** Lower. No arrows.

#### c7 – Weight Shift – Lateral (Character E, Standing)
- **Step 1:** Standing, optional support nearby. No arrows.
- **Step 2:** Weight shifting to one side. Horizontal arrow at hips/weight.
- **Step 3:** Shift to other side. Arrow or no arrows.

#### c8 – Pelvic Tilt (Standing) (Character F, Standing)
- **Step 1:** Standing, good posture. No arrows.
- **Step 2:** Low back arching slightly. Small curved arrow at lower back.
- **Step 3:** Low back flattening (posterior tilt). Opposite arrow or no arrows.

#### c9 – Sit to Stand – Thigh Support (Character A, Seated)
- **Step 1:** Scooted to front of chair, hands on thighs. No arrows.
- **Step 2:** Leaning forward, pushing through legs to stand. Upward arrow at torso/legs.
- **Step 3:** Standing. No arrows. (Optional: lowering back down.)

#### c10 – Wobble Board Balance (Character B, Standing)
- **Step 1:** Standing on wobble board, balancing. No arrows or small balance arrows.
- **Step 2:** Maintaining balance (slight tilt if showing). No arrows.

#### c11 – Weight Lift with Knee Raise (Character C, Standing)
- **Step 1:** Standing, small weight in one hand. No arrows.
- **Step 2:** Lifting weight forward while raising same-side knee. Upward arrows at arm and knee.
- **Step 3:** Lowering. No arrows.

#### c12 – Weight Transfer (Standing) (Character D, Standing)
- **Step 1:** Standing, legs apart, feet parallel. No arrows.
- **Step 2:** Weight transferred to one leg. Horizontal arrow or weight shift indication.
- **Step 3:** Weight transferred to other leg. No arrows.

---

### Hands (h1–h3)

#### h1 – Fist Clenches (Character E, Seated)
- **Step 1:** Arm resting on table, hand open, fingers relaxed. No arrows.
- **Step 2:** Hand in gentle fist. Inward arrow at fingers or no arrows.
- **Step 3:** Hand open, fingers spread. Outward arrow at fingers or no arrows.

#### h2 – Towel Scrunch (Character A, Seated)
- **Step 1:** Hand palm down on small towel on table. No arrows.
- **Step 2:** Fingers scrunching towel toward palm. Inward/curled arrows at fingers.
- **Step 3:** Releasing, straightening towel. No arrows.

#### h3 – Thumb Touch (Character B, Seated)
- **Step 1:** Hand up, relaxed. No arrows.
- **Step 2:** Thumb touching tip of index finger. Small arrow or dot at contact. No arrows acceptable (subtle).
- **Step 3:** Thumb touching middle, then ring, then pinky (one illustration or sequence). No arrows or small arrows.

---

### Head & Neck (n1–n7)

#### n1 – Tongue Clucking (Character F, Seated)
- **Step 1:** Seated, neutral face, mouth closed. No arrows. (Tongue position can be implied; no need to show inside mouth.)
- **Step 2:** Same or slight smile indicating “cluck” position. No arrows.

#### n2 – Controlled TMJ Rotation (Character F, Seated)
- **Step 1:** Seated, mouth closed, tongue on palate (implied). No arrows.
- **Step 2:** Jaw opening slowly. Small downward arrow at jaw or no arrows.
- **Step 3:** Jaw closing. No arrows.

#### n3 – Mandibular Rhythmic Stabilization (Character A, Seated)
- **Step 1:** Seated, jaw in resting position. No arrows.
- **Step 2:** Hand applying gentle resistance to jaw (opening or closing). Small arrow at hand/jaw. No arrows if too subtle.

#### n4 – Upper Cervical Distraction (Character B, Seated)
- **Step 1:** Hands in “hand-collar” position at neck/cervical spine. No arrows.
- **Step 2:** Upper cervical flexion (nodding). Small forward/down arrow at head/neck.
- **Step 3:** Return. No arrows.

#### n5 – Chin Tuck (Axial Extension) (Character C, Seated)
- **Step 1:** Seated, good posture. No arrows.
- **Step 2:** Chin drawing straight back (retraction). Backward horizontal arrow at chin.
- **Step 3:** Relax. No arrows.

#### n6 – Chin Nods (Character D, Seated)
- **Step 1:** Seated, trunk slightly flexed (leaning forward). No arrows.
- **Step 2:** Gentle chin nod (cervical retraction). Backward arrow at chin.
- **Step 3:** Return. No arrows.

#### n7 – Nasal Breathing Practice (Character E, Seated)
- **Step 1:** Seated, lips closed, teeth slightly apart, relaxed. No arrows. (Tongue on palate implied.)
- **Step 2:** Same pose, breathing (no visible change). No arrows.

---

## 6. Quality Gate

After generating each image (especially Steps 2 and 3), visually review it against this checklist before accepting or publishing:

1. **Same person as Step 1** — Hair, skin tone, clothing, and chair match the approved Step 1 image for that exercise.
2. **Correct anatomy** — Exactly two arms and two legs; no extra limbs, floating body parts, or anatomical errors.
3. **Furniture present and matching** — Seated exercises show the same light grey chair (with backrest) as Step 1; not a stool, bench, or different furniture.
4. **Flat vector pastel style** — Illustration matches the spec: minimal, soft shapes, pastel palette. Not realistic, not a gym photo, not an anatomical/muscle diagram.
5. **No embedded text** — No titles, step numbers, or labels inside the image.

If any check fails, regenerate that step (for Steps 2–3, pass the approved Step 1 image as reference again). Do not accept or ship images that fail the quality gate.

---

## 7. Reference Images

**Use as gold standard (do this):**
- `assets/exercises/shoulder_shrugs_step1_rest.png` — No text, no arrows, character centered, clean white background with warm gradient and beige shadow, full body in frame, consistent size.

**Do not do:**
- Any image that includes titles, step numbers, or captions baked into the illustration (e.g. “SHOULDER SHRUG EXERCISE” or “STEP 2: SHOULDERS RAISED”). The app supplies all text.

When generating new images, match the style of the gold-standard reference and follow this spec so all 62 exercises can be illustrated consistently and at scale.
