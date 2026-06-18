#!/usr/bin/env bash
# Build one exercise video end-to-end:  ./make_video.sh a1
# Renders frames (Blender headless), then composites overlays + narration
# (ffmpeg + piper) into output/<id>.mp4 (+ output/<id>_mirror.mp4 when the
# spec sets "mirror": true), plus poster JPGs.
set -euo pipefail
cd "$(dirname "$0")"

ID="${1:?usage: ./make_video.sh <exercise-id>}"
FPS="${FPS:-24}"
SPEC=$(ls exercises/${ID}_*.json exercises/${ID}.json 2>/dev/null | head -1)
[ -n "$SPEC" ] || { echo "No spec found for '$ID' in exercises/"; exit 1; }

FRAMES="work/$ID/frames"

if [ ! -f "$FRAMES/0001.png" ] || [ "${FORCE_RENDER:-}" = "1" ]; then
    echo "== Rendering frames ($SPEC) =="
    blender -b --factory-startup -P render_exercise.py -- \
        --spec "$SPEC" --frames-dir "$FRAMES" --fps "$FPS" 2>&1 \
        | grep -E "FRAMES_OK|TIMELINE_DURATION|Error" || true
fi

echo "== Compositing =="
python3 compose/compose.py --spec "$SPEC" --frames "$FRAMES" --out "output/$ID.mp4" --fps "$FPS"

if grep -q '"mirror": *true' "$SPEC"; then
    echo "== Compositing mirror variant =="
    python3 compose/compose.py --spec "$SPEC" --frames "$FRAMES" \
        --out "output/${ID}_mirror.mp4" --fps "$FPS" --mirror
fi

echo "== Done =="
ls -la output/ | grep "$ID"
