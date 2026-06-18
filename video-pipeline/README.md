# NeuroBloom Exercise Video Pipeline

A repeatable, code-driven pipeline that produces professional, easy-to-follow
animated exercise demonstration videos for stroke survivors. A stylized 3D
mannequin performs each exercise at a slow, calm tempo, with large
high-contrast on-screen text and gentle voiceover narration.

Each exercise is described by **one JSON spec**. Motion, on-screen text, and
narration are all compiled from that single spec, so they can never drift
apart. Adding a new exercise is authoring a config file — not writing code.

## Quick start

```bash
./setup.sh                 # one-time: installs blender, ffmpeg, piper, voice model
./make_video.sh a1         # render + compose → output/a1.mp4 (+ a1_poster.jpg)
```

## How it works

```
exercises/<id>.json
        │
        ▼
 lib/timeline.py   ── compiles the spec into ONE absolute-time event list
        │                (motion keyframes, text pills, rep counter,
        │                 hold countdowns, narration cues)
        ├──────────────► render_exercise.py  (Blender headless)
        │                  lib/character.py  procedural mannequin + armature
        │                  lib/poses.py      context base poses + overrides
        │                  lib/props.py      chair / table / band
        │                  lib/scene.py      lights, camera presets, render cfg
        │                  lib/animate.py    poses → eased bone keyframes
        │                        │
        │                        ▼  work/<id>/frames/*.png
        ▼
 compose/compose.py  (ffmpeg)
        compose/overlays.py  Pillow title card / pill / rep counter / countdown
        compose/tts.py       piper narration (pluggable: TTS_PROVIDER)
                  │
                  ▼
        output/<id>.mp4  +  output/<id>_poster.jpg
        (+ output/<id>_mirror.mp4 when the spec sets "mirror": true)
```

## Authoring a new exercise

Copy `exercises/a1_shoulder_shrugs.json` and edit:

- `character`: `A`–`F` — diversity rotation (skin/hair), shirt/pants stay on-brand.
- `context`: `seated` | `standing` — picks props + base posture.
- `camera`: a preset in `lib/scene.py` (`seated_three_quarter`, …).
- `poses`: named poses, each mapping a bone to `[x, y, z]` Euler **degrees**.
  Bones are listed in `lib/poses.py` (`shoulder.L`, `upper_arm.R`, …).
  Unspecified bones inherit the context base + `rest`.
- `phases`: ordered list of
  - `title` — full-screen title card,
  - `setup` / `outro` — hold a pose with an instruction + narration,
  - `reps` — `count` demonstrated reps (`displayTotal` shown in the counter),
    each running a `cycle` of `move` / `hold` (with `countdown`) / `rest` items.
- `mirror: true` — also emit a horizontally-flipped variant for the other
  affected side (text is composited after the flip, never reversed).

### Finding the right Euler axis for a joint

Render quick stills instead of a full video:

```bash
blender -b --factory-startup -P render_exercise.py -- \
    --spec exercises/<id>.json --stills 0,5,12 --stills-dir /tmp/check
```

## Accessibility / clinical conventions (baked into the pipeline)

- Movements never faster than ~2 s; ≥2 s rest between reps; eased (no snapping).
- A static "starting position" intro before any motion.
- Only ~3 reps are demonstrated; the counter shows the true target ("of 10").
- Single fixed camera, no flashing, no mid-rep cuts.
- Large (≥44 px), high-contrast navy-on-white text, max two lines, held for the
  whole phase (no timed reading pressure).

## Rendering notes

- Renderer: Blender **Workbench** (flat studio shading + object outline) — a
  clean illustration look that renders fast on CPU (well under 1 s/frame at
  720p). EGL warnings on headless boxes are harmless; frames still render.
- Output: 1280×720 @ 24 fps, H.264 yuv420p + AAC.
- Fallback if a host has no GL context at all: run under `xvfb-run -a`, or set
  the renderer to Cycles-CPU (slower).

## Narration / TTS

Default is **piper** (offline, free) with the `en-us-lessac-medium` voice and a
slow `--length-scale`. To use a higher-end voice later, implement `_synth_*`
in `compose/tts.py` and set `TTS_PROVIDER=elevenlabs` (etc.) — only the compose
stage re-runs, no re-render.

## Hosting & app integration

- `output/` and `work/` are gitignored. For production, upload finished videos
  to Supabase Storage:

  ```bash
  # one-time bucket (Supabase SQL):
  #   insert into storage.buckets (id, name, public)
  #     values ('exercise-videos','exercise-videos',true);
  export SUPABASE_URL=https://<project>.supabase.co
  export SUPABASE_SERVICE_KEY=<service-role-key>
  python3 upload_to_supabase.py            # uploads everything in output/
  ```

- The app reads the video from `constants/exerciseVisualGuides.js`
  (`video: { source }` for a bundled asset, or `video: { source: { uri } }`
  for a Supabase URL). `components/ExerciseVisualGuide.js` shows a
  **Video / Steps** toggle and plays it with `expo-video`.

- Pilot note: `a1.mp4` is currently bundled at `assets/videos/a1.mp4` so it
  plays without the bucket. At scale, switch to remote URLs + download-on-
  first-play caching (`expo-file-system`) so videos are never bundled.

## Track B — Higgsfield (AI image-to-video) comparison

The plan is to pilot an AI-generated variant of `a1` alongside this Blender
output, driving Higgsfield from the existing `assets/exercises/shoulder_shrugs_*`
illustrations, then reuse this pipeline's compose stage (overlays + narration)
so the two candidates differ only in the character animation. The Higgsfield
MCP was not connected during the initial build; once it is, generate the clip
and run it through `compose/compose.py` with `--frames` pointed at the
extracted AI frames.
