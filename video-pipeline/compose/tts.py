"""Pluggable TTS: synthesize(text, wav_path).

Default provider is piper (offline, free, natural enough for calm clinical
narration; --length-scale 1.15 slows pacing for stroke survivors). Swap
providers by setting TTS_PROVIDER=elevenlabs|openai and implementing the
matching _synth_* function — the rest of the pipeline only re-runs the
compose stage, no re-render needed."""

import os
import subprocess

PIPELINE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOICE_MODEL = os.environ.get(
    "PIPER_VOICE", os.path.join(PIPELINE_DIR, "voices", "en-us-lessac-medium.onnx"))
LENGTH_SCALE = os.environ.get("PIPER_LENGTH_SCALE", "1.15")


def _synth_piper(text, wav_path):
    subprocess.run(
        ["piper", "-m", VOICE_MODEL, "-f", wav_path,
         "--length-scale", LENGTH_SCALE, "--sentence-silence", "0.35"],
        input=text.encode(), check=True, capture_output=True)


def synthesize(text, wav_path):
    provider = os.environ.get("TTS_PROVIDER", "piper")
    if provider == "piper":
        _synth_piper(text, wav_path)
    else:
        raise NotImplementedError(
            f"TTS_PROVIDER={provider} not implemented yet; add _synth_{provider}() here.")
    return wav_path
