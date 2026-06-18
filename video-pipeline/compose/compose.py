"""Compose stage: rendered frames + overlays + narration -> final MP4 + poster.

Usage:
  python3 compose/compose.py --spec exercises/a1_shoulder_shrugs.json \
      --frames work/a1/frames --out output/a1.mp4 [--fps 24] [--mirror]

Mirroring (affected-side variants) flips the FRAMES ONLY — overlays and
narration are applied after the flip so text never appears reversed."""

import argparse
import hashlib
import json
import os
import subprocess
import sys

COMPOSE_DIR = os.path.dirname(os.path.abspath(__file__))
PIPELINE_DIR = os.path.dirname(COMPOSE_DIR)
sys.path.insert(0, PIPELINE_DIR)
sys.path.insert(0, COMPOSE_DIR)

import overlays  # noqa: E402
import tts  # noqa: E402
from lib import timeline  # noqa: E402


def ffprobe_duration(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", path], capture_output=True, text=True, check=True)
    return float(out.stdout.strip())


def build_overlay_events(tl, work_dir):
    """Returns [(png_path, start, end, fade)] — one entry per timed event;
    identical artwork is generated once and reused."""
    ov_dir = os.path.join(work_dir, "overlays")
    os.makedirs(ov_dir, exist_ok=True)
    cache = {}
    events = []

    def png_for(kind, maker, *args):
        key = (kind,) + args
        if key not in cache:
            digest = hashlib.md5(repr(key).encode()).hexdigest()[:10]
            path = os.path.join(ov_dir, f"{kind}_{digest}.png")
            maker(*args, path)
            cache[key] = path
        return cache[key]

    t = tl["title"]
    if t:
        events.append((png_for("title", overlays.title_card, t["text"], t["subtitle"]),
                       t["start"], t["end"], True))
    for p in tl["pills"]:
        events.append((png_for("pill", overlays.instruction_pill, p["text"]),
                       p["start"], p["end"], False))
    for r in tl["reps"]:
        events.append((png_for("rep", overlays.rep_counter, r["current"], r["total"]),
                       r["start"], r["end"], False))
    for c in tl["countdowns"]:
        events.append((png_for("count", overlays.countdown, c["n"]),
                       c["start"], c["end"], False))
    if tl["side_label"]:
        events.append((png_for("side", overlays.side_label, tl["side_label"]),
                       0, tl["duration"], False))
    return events


def build_narration(tl, work_dir):
    """Synthesizes each narration line; warns when a clip overruns the gap
    before the next line. Returns [(wav_path, start_time)]."""
    wav_dir = os.path.join(work_dir, "narration")
    os.makedirs(wav_dir, exist_ok=True)
    clips = []
    events = tl["narration"]
    for i, ev in enumerate(events):
        wav = os.path.join(wav_dir, f"n{i:02d}.wav")
        tts.synthesize(ev["text"], wav)
        dur = ffprobe_duration(wav)
        gap_end = events[i + 1]["t"] if i + 1 < len(events) else tl["duration"]
        if ev["t"] + dur > gap_end + 0.25:
            print(f"WARN narration overruns by {ev['t'] + dur - gap_end:.2f}s: "
                  f"t={ev['t']} '{ev['text'][:50]}'")
        clips.append((wav, ev["t"]))
    return clips


def compose(spec_path, frames_dir, out_path, fps, mirror):
    spec = timeline.load_spec(spec_path)
    tl = timeline.compile_spec(spec)
    work_dir = os.path.join(PIPELINE_DIR, "work", spec["id"])
    duration = tl["duration"]

    ov_events = build_overlay_events(tl, work_dir)
    narration = build_narration(tl, work_dir)

    cmd = ["ffmpeg", "-y", "-loglevel", "error",
           "-framerate", str(fps), "-i", os.path.join(frames_dir, "%04d.png")]
    for png, _, _, _ in ov_events:
        cmd += ["-loop", "1", "-framerate", str(fps), "-i", png]
    cmd += ["-f", "lavfi", "-t", str(duration), "-i", "anullsrc=r=44100:cl=stereo"]
    for wav, _ in narration:
        cmd += ["-i", wav]

    n_ov = len(ov_events)
    silent_idx = 1 + n_ov
    filters = []
    cur = "[0:v]hflip[base]" if mirror else None
    if cur:
        filters.append(cur)
        cur = "[base]"
    else:
        cur = "[0:v]"
    for i, (_, start, end, fade) in enumerate(ov_events):
        src = f"[{1 + i}:v]"
        if fade:
            faded = f"[f{i}]"
            filters.append(
                f"{src}format=rgba,fade=t=in:st={start}:d=0.5:alpha=1,"
                f"fade=t=out:st={max(start, end - 0.5)}:d=0.5:alpha=1{faded}")
            src = faded
        nxt = f"[v{i}]"
        # Half-open interval [start, end): avoids a 1-frame overlap between
        # adjacent pills / countdown digits at phase boundaries.
        filters.append(f"{cur}{src}overlay=0:0:enable='gte(t,{start})*lt(t,{end})'{nxt}")
        cur = nxt

    amix_inputs = [f"[{silent_idx}:a]"]
    for j, (_, start) in enumerate(narration):
        delay_ms = int(round(start * 1000))
        lbl = f"[a{j}]"
        filters.append(
            f"[{silent_idx + 1 + j}:a]aresample=44100,adelay={delay_ms}|{delay_ms}{lbl}")
        amix_inputs.append(lbl)
    filters.append(
        "".join(amix_inputs)
        + f"amix=inputs={len(amix_inputs)}:duration=first:normalize=0[aout]")

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    cmd += ["-filter_complex", ";".join(filters),
            "-map", cur, "-map", "[aout]",
            "-c:v", "libx264", "-preset", "medium", "-crf", "21",
            "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k",
            "-t", str(duration), "-movflags", "+faststart", out_path]
    subprocess.run(cmd, check=True)

    poster = os.path.splitext(out_path)[0] + "_poster.jpg"
    poster_t = tl["title"]["end"] + 1.0 if tl["title"] else 1.0
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", str(poster_t),
                    "-i", out_path, "-frames:v", "1", "-q:v", "3", poster],
                   check=True)
    print(f"COMPOSE_OK {out_path} duration={ffprobe_duration(out_path):.2f}s "
          f"(timeline {duration}s) poster={poster}")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--spec", required=True)
    p.add_argument("--frames", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--fps", type=int, default=24)
    p.add_argument("--mirror", action="store_true")
    a = p.parse_args()
    compose(a.spec, a.frames, a.out, a.fps, a.mirror)
