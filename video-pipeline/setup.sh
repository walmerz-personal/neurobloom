#!/usr/bin/env bash
# One-time environment setup for the exercise video pipeline.
set -euo pipefail
cd "$(dirname "$0")"

sudo DEBIAN_FRONTEND=noninteractive apt-get update -qq
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
    blender ffmpeg libegl1 libgl1-mesa-dri fonts-inter

pip3 install --quiet piper-tts pillow

# Piper voice. huggingface.co may be blocked by network policy; the GitHub
# release mirror hosts the same model.
if [ ! -f voices/en-us-lessac-medium.onnx ]; then
    mkdir -p voices
    curl -sL -o voices/lessac.tar.gz \
        "https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-en-us-lessac-medium.tar.gz"
    tar xzf voices/lessac.tar.gz -C voices
    rm voices/lessac.tar.gz
fi

echo "Setup complete. Smoke test:"
blender -b --factory-startup --python-expr "
import bpy
bpy.context.scene.render.engine = 'BLENDER_WORKBENCH'
bpy.context.scene.render.filepath = '/tmp/pipeline_smoke.png'
bpy.ops.render.render(write_still=True)
print('RENDER_SMOKE_OK')
" 2>/dev/null | grep RENDER_SMOKE_OK
