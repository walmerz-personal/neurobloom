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
