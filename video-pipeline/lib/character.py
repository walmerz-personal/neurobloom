"""Procedural stylized mannequin: armature + rigid primitive body parts.

Runs inside Blender (bpy). Body segments are capsules/spheres rigidly
parented to bones (parent_type='BONE') — no skinning, so poses can never
produce mesh artifacts. Colors use per-object color (Workbench OBJECT
color mode); the `character` letter from the spec picks a skin/hair/shirt
variant for the diversity rotation defined in docs/exercise-illustration-spec.md.
"""

import bpy
from mathutils import Matrix, Vector

# Skeleton: bone -> (head, tail, parent). Character faces -Y. Heights in meters.
SKELETON = {
    "pelvis": ((0, 0, 0.94), (0, 0, 1.04), None),
    "spine": ((0, 0, 1.04), (0, 0, 1.40), "pelvis"),
    "neck": ((0, 0, 1.40), (0, 0, 1.52), "spine"),
    "head": ((0, 0, 1.52), (0, 0, 1.70), "neck"),
    "shoulder.L": ((0.04, 0, 1.38), (0.17, 0, 1.40), "spine"),
    "upper_arm.L": ((0.17, 0, 1.40), (0.20, 0, 1.12), "shoulder.L"),
    "forearm.L": ((0.20, 0, 1.12), (0.22, 0, 0.88), "upper_arm.L"),
    "hand.L": ((0.22, 0, 0.88), (0.23, 0, 0.78), "forearm.L"),
    "thigh.L": ((0.09, 0, 0.96), (0.10, 0, 0.52), "pelvis"),
    "shin.L": ((0.10, 0, 0.52), (0.10, 0, 0.12), "thigh.L"),
    "foot.L": ((0.10, 0, 0.12), (0.10, -0.16, 0.04), "shin.L"),
}
# Mirror right side from left.
for _name in [n for n in list(SKELETON) if n.endswith(".L")]:
    h, t, p = SKELETON[_name]
    SKELETON[_name[:-2] + ".R"] = (
        (-h[0], h[1], h[2]),
        (-t[0], t[1], t[2]),
        (p[:-2] + ".R") if p and p.endswith(".L") else p,
    )

# Diversity rotation (skin / hair); shirt+pants stay on-brand across A–F.
CHARACTERS = {
    "A": {"skin": (0.85, 0.62, 0.45, 1), "hair": (0.20, 0.13, 0.08, 1)},
    "B": {"skin": (0.55, 0.36, 0.24, 1), "hair": (0.10, 0.08, 0.07, 1)},
    "C": {"skin": (0.93, 0.76, 0.62, 1), "hair": (0.55, 0.55, 0.58, 1)},
    "D": {"skin": (0.72, 0.50, 0.34, 1), "hair": (0.16, 0.12, 0.10, 1)},
    "E": {"skin": (0.96, 0.80, 0.66, 1), "hair": (0.42, 0.26, 0.13, 1)},
    "F": {"skin": (0.45, 0.29, 0.20, 1), "hair": (0.85, 0.85, 0.87, 1)},
}
PALETTE = {
    "shirt": (0.38, 0.62, 0.92, 1),    # soft brand blue
    "pants": (0.30, 0.34, 0.44, 1),    # slate
    "shoes": (0.20, 0.22, 0.27, 1),
}


def _link(obj):
    bpy.context.collection.objects.link(obj)


def _new_mesh_obj(name, mesh):
    obj = bpy.data.objects.new(name, mesh)
    _link(obj)
    return obj


def _shade_smooth(obj):
    for poly in obj.data.polygons:
        poly.use_smooth = True


def _capsule(name, p1, p2, radius, scale_y=1.0):
    """Cylinder with sphere caps from p1 to p2 (world coords)."""
    p1, p2 = Vector(p1), Vector(p2)
    direction = p2 - p1
    length = direction.length
    mid = (p1 + p2) / 2
    quat = direction.to_track_quat("Z", "Y")

    bpy.ops.mesh.primitive_cylinder_add(
        vertices=24, radius=radius, depth=length, location=(0, 0, 0))
    cyl = bpy.context.active_object
    parts = [cyl]
    for sign in (-1, 1):
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=20, ring_count=12, radius=radius,
            location=(0, 0, sign * length / 2))
        parts.append(bpy.context.active_object)
    with bpy.context.temp_override(active_object=cyl, selected_editable_objects=parts):
        bpy.ops.object.join()
    cyl.name = name
    cyl.rotation_mode = "QUATERNION"
    cyl.rotation_quaternion = quat
    cyl.location = mid
    cyl.scale = (1.0, scale_y, 1.0)
    _shade_smooth(cyl)
    return cyl


def _sphere(name, center, radius, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=24, ring_count=16, radius=radius, location=center)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    _shade_smooth(obj)
    return obj


def _box(name, center, dims):
    bpy.ops.mesh.primitive_cube_add(size=1, location=center)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = dims
    return obj


def _parent_to_bone(obj, arm_obj, bone_name):
    """Rigid bone parenting that preserves the object's world placement."""
    bone = arm_obj.data.bones[bone_name]
    obj.parent = arm_obj
    obj.parent_type = "BONE"
    obj.parent_bone = bone_name
    bone_tail_matrix = (
        arm_obj.matrix_world
        @ bone.matrix_local
        @ Matrix.Translation((0, bone.length, 0))
    )
    obj.matrix_parent_inverse = bone_tail_matrix.inverted()


def build_character(character="A"):
    """Builds armature + body. Returns the armature object."""
    colors = dict(PALETTE)
    colors.update(CHARACTERS.get(character, CHARACTERS["A"]))

    arm_data = bpy.data.armatures.new("MannequinRig")
    arm_obj = bpy.data.objects.new("Mannequin", arm_data)
    _link(arm_obj)
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode="EDIT")
    for name, (head, tail, _) in SKELETON.items():
        eb = arm_data.edit_bones.new(name)
        eb.head, eb.tail, eb.roll = head, tail, 0.0
    for name, (_, _, parent) in SKELETON.items():
        if parent:
            arm_data.edit_bones[name].parent = arm_data.edit_bones[parent]
    bpy.ops.object.mode_set(mode="OBJECT")

    # (name, builder, args, bone, color_key)
    parts = [
        ("hips", _capsule, dict(p1=(0, 0, 0.93), p2=(0, 0, 1.03), radius=0.140, scale_y=0.75), "pelvis", "pants"),
        ("torso", _capsule, dict(p1=(0, 0, 1.05), p2=(0, 0, 1.36), radius=0.135, scale_y=0.70), "spine", "shirt"),
        ("neck", _capsule, dict(p1=(0, 0, 1.38), p2=(0, 0, 1.52), radius=0.042), "neck", "skin"),
        ("head", _sphere, dict(center=(0, 0, 1.63), radius=0.105, scale=(1, 0.92, 1.16)), "head", "skin"),
        ("hair", _sphere, dict(center=(0, 0.014, 1.665), radius=0.106, scale=(1.05, 0.97, 1.08)), "head", "hair"),
    ]
    for side, sx in (("L", 1), ("R", -1)):
        parts += [
            (f"shoulder_pad.{side}", _sphere, dict(center=(sx * 0.17, 0, 1.40), radius=0.062), f"upper_arm.{side}", "shirt"),
            (f"upper_arm_geo.{side}", _capsule, dict(p1=(sx * 0.17, 0, 1.40), p2=(sx * 0.20, 0, 1.12), radius=0.047), f"upper_arm.{side}", "shirt"),
            (f"forearm_geo.{side}", _capsule, dict(p1=(sx * 0.20, 0, 1.12), p2=(sx * 0.22, 0, 0.88), radius=0.040), f"forearm.{side}", "skin"),
            (f"hand_geo.{side}", _sphere, dict(center=(sx * 0.225, 0, 0.825), radius=0.048, scale=(0.85, 0.62, 1.25)), f"hand.{side}", "skin"),
            (f"thigh_geo.{side}", _capsule, dict(p1=(sx * 0.09, 0, 0.96), p2=(sx * 0.10, 0, 0.52), radius=0.068), f"thigh.{side}", "pants"),
            (f"shin_geo.{side}", _capsule, dict(p1=(sx * 0.10, 0, 0.52), p2=(sx * 0.10, 0, 0.12), radius=0.050), f"shin.{side}", "pants"),
            (f"foot_geo.{side}", _box, dict(center=(sx * 0.10, -0.06, 0.05), dims=(0.085, 0.24, 0.075)), f"foot.{side}", "shoes"),
        ]

    for name, builder, kwargs, bone, color_key in parts:
        obj = builder(name, **kwargs)
        obj.color = colors[color_key]
        _parent_to_bone(obj, arm_obj, bone)

    # XYZ Euler pose mode on every bone (the JSON pose vocabulary).
    for pb in arm_obj.pose.bones:
        pb.rotation_mode = "XYZ"
    return arm_obj
