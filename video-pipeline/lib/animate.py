"""Applies compiled timeline motion keys to the mannequin armature."""

import math

import bpy


def apply_motion(arm_obj, timeline, resolved_poses, fps):
    """Keys every bone of the resolved pose at every motion key time.
    Default Bezier interpolation gives the slow ease-in/ease-out required
    for stroke-survivor pacing (no snapping)."""
    for t, pose_name in timeline["motion_keys"]:
        frame = 1 + round(t * fps)
        pose = resolved_poses[pose_name]
        for bone_name, eul_deg in pose.items():
            pb = arm_obj.pose.bones[bone_name]
            pb.rotation_euler = [math.radians(a) for a in eul_deg]
            pb.keyframe_insert(data_path="rotation_euler", frame=frame)

    if arm_obj.animation_data and arm_obj.animation_data.action:
        for fcurve in arm_obj.animation_data.action.fcurves:
            for kp in fcurve.keyframe_points:
                kp.interpolation = "BEZIER"
                kp.handle_left_type = "AUTO_CLAMPED"
                kp.handle_right_type = "AUTO_CLAMPED"

    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = 1 + round(timeline["duration"] * fps) - 1
