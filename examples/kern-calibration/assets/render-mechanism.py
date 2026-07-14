#!/usr/bin/env python3
"""Render the KERN hero as a locked-camera mechanical loop.

The outer housing and background remain pixel-stable. Only circular internal
subassemblies rotate/oscillate; the monochrome master is derived from the exact
colour encode so both website layers remain frame-matched.
"""
from pathlib import Path
from subprocess import Popen, run, PIPE
from math import sin, tau
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

HERE = Path(__file__).resolve().parent
SOURCE = HERE / "kern-calibration-unit.png"
COLOR = HERE / "kern-color.mp4"
MONO = HERE / "kern-mono.mp4"
WIDTH, HEIGHT, FPS, FRAMES = 1920, 1080, 30, 350
DURATION = FRAMES / FPS

base = Image.open(SOURCE).convert("RGB").resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
base = ImageEnhance.Contrast(base).enhance(1.035)
base = ImageEnhance.Color(base).enhance(1.06)

# center-x, center-y and radius are normalized to the output frame.
parts = [
    # Tourbillon-like inner carrier: one calm revolution per seamless loop.
    {"name": "carrier", "x": .505, "y": .515, "r": .112, "cycles": 1.0, "phase": 0},
    # Visible pinions counter-rotate at integer loop ratios.
    {"name": "upper-pinion", "x": .548, "y": .455, "r": .034, "cycles": -7.0, "phase": 8},
    {"name": "lower-pinion", "x": .458, "y": .555, "r": .031, "cycles": 10.0, "phase": -5},
    # Central gold escapement receives continuous rotation plus a tick oscillation.
    {"name": "escapement", "x": .505, "y": .515, "r": .052, "cycles": 4.0, "phase": 0, "tick": 14},
]

prepared = []
for part in parts:
    cx, cy = int(part["x"] * WIDTH), int(part["y"] * HEIGHT)
    radius = int(part["r"] * HEIGHT)
    pad = int(radius * 1.18)
    box = (cx - pad, cy - pad, cx + pad, cy + pad)
    patch = base.crop(box)
    mask = Image.new("L", patch.size, 0)
    d = ImageDraw.Draw(mask)
    feather = max(5, int(radius * .10))
    d.ellipse((pad-radius+feather, pad-radius+feather, pad+radius-feather, pad+radius-feather), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(feather))
    prepared.append((part, box, patch, mask))

cmd = [
    "ffmpeg", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
    "-s", f"{WIDTH}x{HEIGHT}", "-r", str(FPS), "-i", "-", "-an", "-c:v", "libx264",
    "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(COLOR),
]
encoder = Popen(cmd, stdin=PIPE)
assert encoder.stdin is not None
stream = encoder.stdin

for frame_index in range(FRAMES):
    progress = frame_index / FRAMES
    frame = base.copy()
    for part, box, patch, mask in prepared:
        angle = part["phase"] + 360 * part["cycles"] * progress
        if part.get("tick"):
            angle += 8.5 * sin(tau * part["tick"] * progress)
        rotated = patch.rotate(angle, resample=Image.Resampling.BICUBIC, expand=False)
        rotated_mask = mask.rotate(angle, resample=Image.Resampling.BICUBIC, expand=False)
        frame.paste(rotated, box[:2], rotated_mask)

    # Energy is dynamic, not camera movement: coil and emitter breathe in place.
    glow = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    coil_pulse = .5 + .5 * sin(tau * 6 * progress)
    emit_pulse = .5 + .5 * sin(tau * 8 * progress + 1.2)
    for x, y, radius, color, strength in [
        (.36, .35, .052, (224, 148, 66), coil_pulse),
        (.69, .57, .046, (0, 230, 210), emit_pulse),
    ]:
        cx, cy, rr = int(x*WIDTH), int(y*HEIGHT), int(radius*HEIGHT)
        gd.ellipse((cx-rr, cy-rr, cx+rr, cy+rr), fill=(*color, int(16 + strength*24)))
    glow = glow.filter(ImageFilter.GaussianBlur(26))
    frame = Image.alpha_composite(frame.convert("RGBA"), glow).convert("RGB")
    stream.write(frame.tobytes())

stream.close()
if encoder.wait() != 0:
    raise SystemExit("colour encode failed")

result = run([
    "ffmpeg", "-loglevel", "error", "-y", "-i", str(COLOR),
    "-vf", "hue=s=0,eq=contrast=1.12:brightness=-0.015,format=yuv420p",
    "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-movflags", "+faststart", "-an", str(MONO),
])
if result.returncode:
    raise SystemExit("monochrome encode failed")

print(f"rendered {FRAMES} frames / {DURATION:.3f}s -> {COLOR.name}, {MONO.name}")
