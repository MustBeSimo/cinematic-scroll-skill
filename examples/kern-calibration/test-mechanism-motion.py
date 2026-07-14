#!/usr/bin/env python3
"""Assert the hero moves as ONE coherent shot, not an isolated moving centre.

The failure this guards against: a frozen plate with only a small central region
composited-and-rotated on top, which reads as pasted on. So we require the outer
housing/background annulus to move perceptibly too (the whole frame drifts under
the camera), and we require the loop to close seamlessly.
"""
from pathlib import Path
from subprocess import run
from tempfile import TemporaryDirectory
from PIL import Image, ImageChops, ImageStat, ImageDraw

VIDEO = Path(__file__).parent / "assets" / "kern-color.mp4"


def grab(video, n, tmp):
    target = Path(tmp) / f"frame-{n}.png"
    result = run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(video),
                  "-vf", f"select='eq(n,{n})',scale=480:270", "-vsync", "0", "-frames:v", "1", str(target)])
    assert result.returncode == 0, "ffmpeg could not decode the hero video"
    return Image.open(target).convert("RGB")


def frame_count(video):
    out = run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_frames",
               "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", str(video)],
              capture_output=True, text=True)
    return int(out.stdout.strip())


with TemporaryDirectory() as tmp:
    last = frame_count(VIDEO) - 1
    f0, f30, f_last = grab(VIDEO, 0, tmp), grab(VIDEO, 30, tmp), grab(VIDEO, last, tmp)

    diff = ImageChops.difference(f0, f30)
    w, h = diff.size
    cx, cy = w * 0.5, h * 0.51
    outer = Image.new("L", diff.size, 0)
    draw = ImageDraw.Draw(outer)
    draw.ellipse((cx - h * .47, cy - h * .47, cx + h * .47, cy + h * .47), fill=255)
    draw.ellipse((cx - h * .30, cy - h * .30, cx + h * .30, cy + h * .30), fill=0)
    center = Image.new("L", diff.size, 0)
    ImageDraw.Draw(center).ellipse((cx - h * .16, cy - h * .16, cx + h * .16, cy + h * .16), fill=255)

    outer_delta = sum(ImageStat.Stat(diff, outer).mean) / 3
    center_delta = sum(ImageStat.Stat(diff, center).mean) / 3
    seam_delta = sum(ImageStat.Stat(ImageChops.difference(f0, f_last)).mean) / 3

    # The whole frame must move — the housing is NOT allowed to sit frozen while only the centre moves.
    assert outer_delta > 3.0, f"only the centre moves — housing/background is static (outer delta {outer_delta:.2f})"
    assert center_delta > 3.0, f"mechanism is not visibly moving: centre delta {center_delta:.2f}"
    # A pasted-on spinning centre shows up as centre motion wildly exceeding the coherent frame drift.
    assert center_delta < outer_delta * 6.0, f"centre motion ({center_delta:.2f}) dwarfs the frame ({outer_delta:.2f}) — looks composited"
    # One sine cycle → the last frame should land back on the first.
    assert seam_delta < 3.0, f"loop is not seamless: first/last frame delta {seam_delta:.2f}"
    print(f"PASS coherent camera move — outer {outer_delta:.2f}, centre {center_delta:.2f}, seam {seam_delta:.2f}")
