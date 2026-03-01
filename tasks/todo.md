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
