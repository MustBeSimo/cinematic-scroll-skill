# hero blankness: std-dev of pixel luminance in the top viewport shot; < 6 ≈ flat/blank
import sys; from PIL import Image, ImageStat
for p in sys.argv[1:]:
    im=Image.open(p).convert("L"); s=ImageStat.Stat(im).stddev[0]; print(f"  {p.split('/')[-1]:28s} stddev={s:5.1f} {'BLANK?' if s<6 else ''}")
