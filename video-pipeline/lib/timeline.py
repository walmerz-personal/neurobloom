"""Timeline compiler: expands a per-exercise JSON spec into one canonical,
absolute-time event list consumed by BOTH the Blender render stage and the
ffmpeg compose stage, so motion, text overlays, and narration can never drift.

Pure stdlib — must import cleanly inside Blender's bundled Python and the
system Python.
"""

import json


def _as_list(value):
    return value if isinstance(value, list) else [value]


def _narration_for_rep(narration, rep_index):
    """narration may be a string (spoken every rep) or a list of per-rep
    strings (clamped to the last entry for later reps)."""
    if narration is None:
        return None
    if isinstance(narration, list):
        if not narration:
            return None
        return narration[min(rep_index, len(narration) - 1)]
    return narration


def compile_spec(spec):
    """Returns a dict:
      duration        float seconds
      motion_keys     [(t, pose_name)] — full-pose keyframes for Blender
      pills           [{start, end, text}] — bottom instruction pill
      title           {start, end, text, subtitle}
      reps            [{start, end, current, total}] — rep counter
      countdowns      [{start, end, n}] — hold countdown digits
      narration       [{t, text}]
      side_label      str | None
    """
    t = 0.0
    motion_keys = [(0.0, "rest")]
    pill_starts = []   # (t, text); ends resolved afterwards
    title = None
    reps = []
    countdowns = []
    narration = []
    pose_current = "rest"

    def key(at, pose):
        motion_keys.append((round(at, 3), pose))

    def narrate(at, text):
        if text:
            narration.append({"t": round(at, 3), "text": text})

    def transition(at, dur, pose):
        nonlocal pose_current
        if pose and pose != pose_current:
            ramp = min(1.5, dur / 2.0)
            key(at, pose_current)
            key(at + ramp, pose)
            pose_current = pose
        key(at + dur, pose_current)

    for phase in spec["phases"]:
        ptype = phase["type"]
        if ptype == "title":
            dur = phase["dur"]
            title = {
                "start": t,
                "end": t + dur,
                "text": phase.get("text", spec["title"]),
                "subtitle": phase.get("subtitle", ""),
            }
            narrate(t + 0.4, phase.get("narration"))
            key(t + dur, pose_current)
            t += dur
        elif ptype in ("setup", "outro"):
            dur = phase["dur"]
            if phase.get("text"):
                pill_starts.append((t, phase["text"]))
            narrate(t + 0.2, phase.get("narration"))
            transition(t, dur, phase.get("pose"))
            t += dur
        elif ptype == "reps":
            count = phase["count"]
            display_total = phase.get("displayTotal", count)
            for rep in range(count):
                rep_start = t
                for item in phase["cycle"]:
                    if "move" in item:
                        dur = item["dur"]
                        if item.get("text"):
                            pill_starts.append((t, item["text"]))
                        narrate(t, _narration_for_rep(item.get("narration"), rep))
                        key(t, pose_current)
                        key(t + dur, item["move"])
                        pose_current = item["move"]
                        t += dur
                    elif "hold" in item:
                        hold = item["hold"]
                        if item.get("text"):
                            pill_starts.append((t, item["text"]))
                        narrate(t, _narration_for_rep(item.get("narration"), rep))
                        if item.get("countdown"):
                            for sec in range(int(hold)):
                                countdowns.append({
                                    "start": round(t + sec, 3),
                                    "end": round(t + sec + 1, 3),
                                    "n": int(hold) - sec,
                                })
                        t += hold
                    elif "rest" in item:
                        t += item["rest"]
                reps.append({
                    "start": round(rep_start, 3),
                    "end": round(t, 3),
                    "current": rep + 1,
                    "total": display_total,
                })
        else:
            raise ValueError("Unknown phase type: %s" % ptype)

    duration = round(t, 3)

    # Resolve pill end times: each pill runs until the next pill (or video end).
    pills = []
    for i, (start, text) in enumerate(pill_starts):
        end = pill_starts[i + 1][0] if i + 1 < len(pill_starts) else duration
        pills.append({"start": round(start, 3), "end": round(end, 3), "text": text})

    # Dedupe consecutive identical motion keys.
    deduped = []
    for k in sorted(motion_keys, key=lambda x: x[0]):
        if not deduped or deduped[-1] != k:
            deduped.append(k)

    return {
        "duration": duration,
        "motion_keys": deduped,
        "pills": pills,
        "title": title,
        "reps": reps,
        "countdowns": countdowns,
        "narration": narration,
        "side_label": spec.get("sideLabel"),
    }


def load_spec(path):
    with open(path) as f:
        return json.load(f)
