"""Pose resolution: context base poses + per-exercise overrides.

A "pose" maps bone name -> [x, y, z] Euler rotation in DEGREES (bone-local,
XYZ order). Every named pose in a spec is resolved to the FULL joint set
(context base, then the spec's "rest", then the named pose's overrides) so
every motion keyframe keys every joint deterministically.

Pure stdlib — imported inside Blender.
"""

BONES = [
    "pelvis", "spine", "neck", "head",
    "shoulder.L", "upper_arm.L", "forearm.L", "hand.L",
    "shoulder.R", "upper_arm.R", "forearm.R", "hand.R",
    "thigh.L", "shin.L", "foot.L",
    "thigh.R", "shin.R", "foot.R",
]

# Base posture per exercise context. Values tuned against rendered stills.
CONTEXT_BASE = {
    "seated": {
        # Legs bent to sit on a chair: thighs forward, shins down.
        "thigh.L": [-85, 0, -4],
        "thigh.R": [-85, 0, 4],
        "shin.L": [80, 0, 0],
        "shin.R": [80, 0, 0],
        # Arms relaxed at the sides, tiny outward bend so they clear the torso.
        "upper_arm.L": [0, 0, -6],
        "upper_arm.R": [0, 0, 6],
        "forearm.L": [4, 0, 0],
        "forearm.R": [4, 0, 0],
    },
    "standing": {},
}

# How far the armature object is dropped so the pelvis lands on the chair
# seat (chair seat top is at SEAT_HEIGHT in props.py).
CONTEXT_ROOT_OFFSET = {
    "seated": -0.47,
    "standing": 0.0,
}


def resolve_poses(spec):
    """Returns {pose_name: {bone: [x,y,z] degrees}} with every bone present."""
    context = spec.get("context", "standing")
    base = {b: [0.0, 0.0, 0.0] for b in BONES}
    for bone, eul in CONTEXT_BASE.get(context, {}).items():
        base[bone] = list(eul)

    spec_poses = spec.get("poses", {})
    rest = dict(base)
    for bone, eul in spec_poses.get("rest", {}).items():
        rest[bone] = list(eul)

    resolved = {"rest": rest}
    for name, overrides in spec_poses.items():
        if name == "rest":
            continue
        pose = dict(rest)
        for bone, eul in overrides.items():
            pose[bone] = list(eul)
        resolved[name] = pose
    return resolved
