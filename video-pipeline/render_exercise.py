"""Blender headless entry point.

Usage:
  blender -b --factory-startup -P render_exercise.py -- \
      --spec exercises/a1_shoulder_shrugs.json \
      [--frames-dir work/a1/frames]      render full animation frames
      [--stills 0,5,14 --stills-dir d]   render stills at times (fast iteration)
      [--fps 24] [--width 1280] [--height 720]
"""

import argparse
import os
import sys

import bpy

PIPELINE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, PIPELINE_DIR)

from lib import animate, character, poses, props, scene, timeline  # noqa: E402


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--spec", required=True)
    p.add_argument("--frames-dir")
    p.add_argument("--stills")
    p.add_argument("--stills-dir")
    p.add_argument("--fps", type=int, default=24)
    p.add_argument("--width", type=int, default=1280)
    p.add_argument("--height", type=int, default=720)
    return p.parse_args(argv)


def clear_default_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def main():
    args = parse_args()
    spec = timeline.load_spec(args.spec)
    tl = timeline.compile_spec(spec)
    resolved = poses.resolve_poses(spec)
    context = spec.get("context", "standing")

    clear_default_scene()
    scene.build_set()
    props.add_context_props(context)
    arm = character.build_character(spec.get("character", "A"))
    arm.location.z += poses.CONTEXT_ROOT_OFFSET.get(context, 0.0)
    scene.add_camera(spec.get("camera", "standing_three_quarter"))
    scene.configure_render(args.width, args.height, args.fps)
    animate.apply_motion(arm, tl, resolved, args.fps)

    bscene = bpy.context.scene
    if args.stills:
        stills_dir = args.stills_dir or os.path.join(PIPELINE_DIR, "work", spec["id"], "stills")
        os.makedirs(stills_dir, exist_ok=True)
        for t in [float(x) for x in args.stills.split(",")]:
            bscene.frame_set(1 + round(t * args.fps))
            bscene.render.filepath = os.path.join(stills_dir, "t_%05.1f.png" % t)
            bpy.ops.render.render(write_still=True)
            print("STILL_OK", bscene.render.filepath)
    if args.frames_dir:
        os.makedirs(args.frames_dir, exist_ok=True)
        bscene.render.filepath = os.path.join(args.frames_dir, "")
        bpy.ops.render.render(animation=True)
        print("FRAMES_OK", args.frames_dir, "frames:", bscene.frame_end)
    print("TIMELINE_DURATION", tl["duration"])


if __name__ == "__main__":
    main()
