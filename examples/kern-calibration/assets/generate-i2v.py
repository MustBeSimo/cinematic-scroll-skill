#!/usr/bin/env python3
"""Generate the KERN hero as a REAL image-to-video via fal.ai (Kling i2v), then
turn it into a seamless-looping colour + monochrome pair for the two-video hero.

Unlike render-mechanism.py (a camera move over a single still), this produces
genuine motion: the exposed gears, escapement and tourbillon actually rotate and
the camera orbits, because a video model animates the plate frame by frame.

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

PROMPT = ("Cinematic macro product shot of a floating skeleton watch movement. The exposed "
          "brass gears, escapement wheel and central tourbillon cage rotate slowly, smoothly and "
          "precisely on their axes. Very slow, subtle cinematic camera push-in and gentle orbit. "
          "Soft studio lighting, polished metallic reflections, shallow depth of field, "
          "photorealistic, ultra detailed. The watch stays centered and floating.")
NEG = ("text, watermark, logo, blurry, low quality, distortion, warping, melting, extra objects, "
       "hands, people, clock hands, fast motion, shaking")
MODELS = [
    "fal-ai/kling-video/v2.1/master/image-to-video",
    "fal-ai/kling-video/v1.6/pro/image-to-video",
    "fal-ai/wan/v2.2-a14b/image-to-video",
]


def _req(url, body=None):
    data = json.dumps(body).encode() if body is not None else None
    method = "POST" if body is not None else "GET"
    return json.load(urllib.request.urlopen(
        urllib.request.Request(url, data=data, headers=AUTH, method=method), timeout=90))


def generate(raw_path):
    img = Image.open(SOURCE).convert("RGB")
    img.thumbnail((1280, 1280))
    buf = io.BytesIO(); img.save(buf, "JPEG", quality=92)
    image_url = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()
    body = {"prompt": PROMPT, "negative_prompt": NEG, "image_url": image_url,
            "duration": "5", "aspect_ratio": "16:9", "cfg_scale": 0.5}

    sub = None
    for model in MODELS:
        try:
            print("submitting to", model)
            sub = _req("https://queue.fal.run/" + model, body)
            break
        except urllib.error.HTTPError as e:
            print(" ", model, "->", e.code, e.read().decode()[:160])
    assert sub, "no model accepted the request"

    deadline = time.time() + 520
    while time.time() < deadline:
        st = _req(sub["status_url"])
        if st.get("status") == "COMPLETED":
            break
        if st.get("status") in ("FAILED", "ERROR"):
            raise SystemExit("fal generation failed: " + json.dumps(st)[:300])
        time.sleep(6)
    else:
        raise SystemExit("timed out waiting for fal")

    result = _req(sub["response_url"])
    url = (result.get("video") or {}).get("url") or (result.get("videos") or [{}])[0].get("url")
    assert url, "no video url: " + json.dumps(result)[:300]
    urllib.request.urlretrieve(url, raw_path)
    print("generated ->", raw_path)


def ff(args):
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *args], check=True)


def loop_and_encode(raw_path):
    dur = float(subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=duration",
         "-of", "csv=p=0", raw_path], capture_output=True, text=True).stdout.strip())
    T, body_end = 0.6, dur - 0.6
    scl = "fps=30,scale=1920:1080:flags=lanczos"
    # Seamless loop: crossfade the clip's tail into its head, then play the middle.
    fc = (f"[0:v]split=3[a][b][c];"
          f"[a]trim=start=0:end={T},setpts=PTS-STARTPTS,{scl}[head];"
          f"[b]trim=start={body_end},setpts=PTS-STARTPTS,{scl}[tail];"
          f"[c]trim=start={T}:end={body_end},setpts=PTS-STARTPTS,{scl}[body];"
          f"[tail][head]xfade=transition=fade:duration={T}:offset=0[xf];"
          f"[xf][body]concat=n=2:v=1[j];[j]cas=0.28,gradfun=1.0:16,format=yuv420p[outv]")
    ff(["-i", raw_path, "-filter_complex", fc, "-map", "[outv]",
        "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-movflags", "+faststart", str(COLOR)])
    ff(["-i", str(COLOR), "-vf", "hue=s=0,eq=contrast=1.05:brightness=-0.01,format=yuv420p",
        "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-movflags", "+faststart", "-an", str(MONO)])
    ff(["-i", str(MONO), "-frames:v", "1", "-q:v", "4", str(POSTER)])
    print("wrote", COLOR.name, MONO.name, POSTER.name)


if __name__ == "__main__":
    with tempfile.TemporaryDirectory() as tmp:
        raw = str(Path(tmp) / "fal-raw.mp4")
        generate(raw)
        loop_and_encode(raw)
