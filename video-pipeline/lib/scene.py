"""Scene setup: floor/backdrop, camera presets, Workbench render settings.

Look: flat-shaded studio lighting with black object outlines on a warm,
high-contrast backdrop — matches the app's flat illustration style and
renders fast on CPU."""

import bpy
from mathutils import Vector

FLOOR_COLOR = (0.93, 0.89, 0.83, 1)     # warm light floor
WALL_COLOR = (0.94, 0.96, 0.99, 1)      # very light blue wall (app card tones)

# name -> (camera location, look-at target, focal length mm)
CAMERA_PRESETS = {
    "seated_three_quarter": ((1.55, -2.85, 1.05), (0.02, 0.05, 0.66), 40),
    "standing_three_quarter": ((1.7, -2.9, 1.35), (0.0, 0.0, 0.95), 50),
    "front_head_shoulders": ((0.0, -1.5, 1.05), (0.0, 0.0, 1.05), 65),
}


def _plane(name, location, rotation, size, color):
    bpy.ops.mesh.primitive_plane_add(size=size, location=location, rotation=rotation)
    obj = bpy.context.active_object
    obj.name = name
    obj.color = color
    return obj


def build_set():
    _plane("floor", (0, 0, 0), (0, 0, 0), 30, FLOOR_COLOR)
    _plane("wall", (0, 2.1, 5), (1.5708, 0, 0), 30, WALL_COLOR)


def add_camera(preset):
    loc, target, lens = CAMERA_PRESETS[preset]
    cam_data = bpy.data.cameras.new("Camera")
    cam_data.lens = lens
    cam = bpy.data.objects.new("Camera", cam_data)
    bpy.context.collection.objects.link(cam)
    cam.location = loc
    direction = Vector(target) - Vector(loc)
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.camera = cam
    return cam


def configure_render(width=1280, height=720, fps=24):
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.fps = fps
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"

    shading = scene.display.shading
    shading.light = "STUDIO"
    shading.color_type = "OBJECT"
    shading.show_object_outline = True
    shading.object_outline_color = (0.13, 0.15, 0.19)
    shading.show_shadows = True
    shading.shadow_intensity = 0.25
    shading.show_cavity = False
    scene.display.render_aa = "16"
    scene.view_settings.view_transform = "Standard"
