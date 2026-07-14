#!/usr/bin/env python3
"""Generate the KERN hero as a REAL image-to-video via fal.ai (LTX-Video), then
ping-pong it into a seamless ~15s loop and split it into the colour + monochrome
pair the two-video hero needs.

Unlike render-mechanism.py (a camera move over a single still), this produces
genuine motion: the exposed gears, escapement and tourbillon actually move and
the camera cranes over the movement, because a video model animates the plate
frame by frame. A ~7.7s clip played forward then reversed gives a perfectly
seamless ~15s loop with no crossfade.

Notes on model choice: LTX-Video *dev* with expand_prompt OFF and a strong
anti-watermark negative stays stable; the *distilled* model drifts and
hallucinates a watermark over long durations. Kling i2v is an alternative that
holds shape well but caps at 5/10s.

Usage:
    export FAL_KEY=<id:secret>
    python3 generate-i2v.py

Requires: Pillow, ffmpeg, and network access to fal.ai. Costs a few cents/clip.
"""
import base64, io, json, os, subprocess, tempfile, time, urllib.request, urllib.error
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
SOURCE = HERE / "kern-calibration-unit.png"
COLOR = HERE / "kern-color.mp4"
MONO = HERE / "kern-mono.mp4"
POSTER = HERE / "kern-poster.jpg"

FAL_KEY = os.environ.get("FAL_KEY")
assert FAL_KEY, "set FAL_KEY=<id:secret> in the environment"
AUTH = {"Authorization": "Key " + FAL_KEY, "Content-Type": "application/json"}

PROMPT = ("Static locked-off macro shot of a floating skeleton watch movement. Only the exposed brass "
          "gears, escapement wheel and central tourbillon cage rotate slowly and precisely on their own "
          "axes. The outer case, framing and grey studio background stay completely still. Photorealistic, "
          "polished metal, soft studio light, shallow depth of field. The object keeps its exact shape.")
NEG = ("text, letters, words, watermark, signature, getty, shutterstock, logo, caption, blurry, low quality, "
       "distortion, warping, morphing, melting, shape change, extra objects, hands, people, clock hands, "
       "fast motion, jitter, shaking, camera shake, background change")
MODELS = ["fal-ai/ltx-video-13b-dev/image-to-video",
          "fal-ai/ltxv-13b-098-distilled/image-to-video",
          "fal-ai/ltx-video-13b-distilled/image-to-video"]
PAYLOADS = [{"num_frames": 185, "frame_rate": 24}, {"num_frames": 161, "frame_rate": 24}, {"num_frames": 121, "frame_rate": 24}]


def call(url, body=None):
    data = json.dumps(body).encode() if body is not None else None
    return json.load(urllib.request.urlopen(
        urllib.request.Request(url, data=data, headers=AUTH, method="POST" if body else "GET"), timeout=90))


def generate(raw_path):
    img = Image.open(SOURCE).convert("RGB"); img.thumbnail((1280, 1280))
    buf = io.BytesIO(); img.save(buf, "JPEG", quality=92)
    image_url = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()
    sub = None
    for model in MODELS:
        for extra in PAYLOADS:
            body = {"prompt": PROMPT, "negative_prompt": NEG, "image_url": image_url,
                    "resolution": "720p", "expand_prompt": False, **extra}
            try:
                print("submit", model, extra)
                sub = call("https://queue.fal.run/" + model, body); break
            except urllib.error.HTTPError as e:
                print(" ", model, "->", e.code, e.read().decode()[:150])
        if sub:
            break
    assert sub, "no LTX model accepted the request"
    deadline = time.time() + 540
    while time.time() < deadline:
        st = call(sub["status_url"])
        if st.get("status") == "COMPLETED":
            break
        if st.get("status") in ("FAILED", "ERROR"):
            raise SystemExit("fal generation failed: " + json.dumps(st)[:300])
        time.sleep(6)
    else:
        raise SystemExit("timed out waiting for fal")
    res = call(sub["response_url"])
    url = (res.get("video") or {}).get("url") or (res.get("videos") or [{}])[0].get("url")
    assert url, "no video url: " + json.dumps(res)[:300]
    urllib.request.urlretrieve(url, raw_path)
    print("generated ->", raw_path)


def ff(args):
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *args], check=True)


def boomerang_and_encode(raw_path):
    # Ping-pong: forward then reversed → perfectly seamless loop (both ends match), ~2x duration.
    fc = ("[0:v]scale=1920:1080:flags=lanczos,fps=24[b];[b]split[f][r];[r]reverse[rv];"
          "[f][rv]concat=n=2:v=1[cat];[cat]cas=0.3,gradfun=1.0:16,format=yuv420p[outv]")
    ff(["-i", raw_path, "-filter_complex", fc, "-map", "[outv]",
        "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-movflags", "+faststart", str(COLOR)])
    ff(["-i", str(COLOR), "-vf", "hue=s=0,eq=contrast=1.05:brightness=-0.01,format=yuv420p",
        "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-movflags", "+faststart", "-an", str(MONO)])
    ff(["-i", str(MONO), "-frames:v", "1", "-q:v", "4", str(POSTER)])
    print("wrote", COLOR.name, MONO.name, POSTER.name)


if __name__ == "__main__":
    with tempfile.TemporaryDirectory() as tmp:
        raw = str(Path(tmp) / "ltx-raw.mp4")
        generate(raw)
        boomerang_and_encode(raw)
