#!/usr/bin/env python3
from pathlib import Path
from subprocess import run
from tempfile import TemporaryDirectory
from PIL import Image, ImageChops, ImageStat, ImageDraw

VIDEO = Path(__file__).parent / "assets" / "kern-color.mp4"

with TemporaryDirectory() as tmp:
    frames = []
    for index, second in enumerate((0, 1)):
        target = Path(tmp) / f"frame-{index}.png"
        result = run(["ffmpeg", "-loglevel", "error", "-y", "-ss", str(second), "-i", str(VIDEO), "-frames:v", "1", "-vf", "scale=480:270", str(target)])
        assert result.returncode == 0, "ffmpeg could not decode the hero video"
        frames.append(Image.open(target).convert("RGB"))

    diff = ImageChops.difference(*frames)
    w, h = diff.size
    housing = Image.new("L", diff.size, 0)
    draw = ImageDraw.Draw(housing)
    cx, cy = w * 0.5, h * 0.51
    draw.ellipse((cx-h*.43, cy-h*.43, cx+h*.43, cy+h*.43), fill=255)
    draw.ellipse((cx-h*.20, cy-h*.20, cx+h*.20, cy+h*.20), fill=0)
    mechanism = Image.new("L", diff.size, 0)
    ImageDraw.Draw(mechanism).ellipse((cx-h*.18, cy-h*.18, cx+h*.18, cy+h*.18), fill=255)

    housing_delta = sum(ImageStat.Stat(diff, housing).mean) / 3
    mechanism_delta = sum(ImageStat.Stat(diff, mechanism).mean) / 3
    assert housing_delta < 2.0, f"camera/housing is shaking: static annulus delta {housing_delta:.2f}"
    assert mechanism_delta > 3.0, f"mechanism is not visibly moving: center delta {mechanism_delta:.2f}"
    print(f"PASS stable housing {housing_delta:.2f}; dynamic mechanism {mechanism_delta:.2f}")
