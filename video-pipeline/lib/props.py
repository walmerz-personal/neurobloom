"""Props built from Blender primitives. Colors are per-object (Workbench
OBJECT color mode)."""

import bpy

SEAT_TOP = 0.375  # chair seat surface height; poses.CONTEXT_ROOT_OFFSET matches

WOOD = (0.55, 0.40, 0.28, 1)
WOOD_DARK = (0.45, 0.32, 0.22, 1)


def _box(name, center, dims, color):
    bpy.ops.mesh.primitive_cube_add(size=1, location=center)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = dims
    obj.color = color
    return obj


def _cylinder(name, center, radius, depth, color):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=20, radius=radius, depth=depth, location=center)
    obj = bpy.context.active_object
    obj.name = name
    obj.color = color
    return obj


def add_chair():
    """Sturdy chair with backrest (illustration spec: seated exercises always
    show a supportive chair). Seat centered slightly behind the character."""
    seat_c = 0.06
    _box("chair_seat", (0, seat_c, SEAT_TOP - 0.025), (0.48, 0.46, 0.05), WOOD)
    _box("chair_back", (0, seat_c + 0.21, 0.66), (0.46, 0.045, 0.52), WOOD)
    for x in (-0.20, 0.20):
        for y in (seat_c - 0.19, seat_c + 0.19):
            _cylinder(f"chair_leg_{x:+.2f}_{y:+.2f}", (x, y, (SEAT_TOP - 0.05) / 2),
                      0.022, SEAT_TOP - 0.05, WOOD_DARK)


def add_context_props(context):
    if context == "seated":
        add_chair()
