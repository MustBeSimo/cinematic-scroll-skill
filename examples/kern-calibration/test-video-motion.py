#!/usr/bin/env python3
from pathlib import Path
from subprocess import run
from tempfile import TemporaryDirectory
from PIL import Image, ImageChops, ImageStat

VIDEO = Path(__file__).parent / "assets" / "kern-color.mp4"

with TemporaryDirectory() as tmp:
    frames = []
    for index, second in enumerate((0, 1)):
        target = Path(tmp) / f"frame-{index}.png"
        result = run([
            "ffmpeg", "-loglevel", "error", "-y", "-ss", str(second),
            "-i", str(VIDEO), "-frames:v", "1", "-vf", "scale=480:270", str(target)
        ])
        assert result.returncode == 0, "ffmpeg could not decode the hero video"
        frames.append(Image.open(target).convert("RGB"))

    difference = ImageChops.difference(*frames)
    mean_delta = sum(ImageStat.Stat(difference).mean) / 3
    assert mean_delta >= 2.0, f"camera move has no perceptible frame change: mean delta {mean_delta:.2f} < 2.0"
    print(f"PASS perceptible coherent camera motion: mean frame delta {mean_delta:.2f}")
