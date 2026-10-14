"""Baixa as imagens das 980 figurinhas (finalsticker.com, fallback FanLink) para img/s/<CODE>.webp. Requer Pillow."""
import json, sys, os, time, io, urllib.request
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = os.path.join(ROOT, "tools", "source", "finalsticker-fwc26-standard.json")
outdir = os.path.join(ROOT, "img", "s")
os.makedirs(outdir, exist_ok=True)
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
rows = [r for r in json.load(open(src)) if not r['extra']]
def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()
def fanlink(code):
    import re
    m = re.match(r'([A-Z]+)(\d+)$', code)
    c = f"{m.group(1)}{int(m.group(2)):02d}" if m else code
    return f"https://pub-24930f19e0c3402fa466727b45e82627.r2.dev/sticker-catalog/panini2026-by-code/{c}.webp?v=6"
ok = fail = 0
def work(r):
    global ok, fail
    code = r['code']
    out = os.path.join(outdir, f"{code}.webp")
    if os.path.exists(out): ok += 1; return
    urls = []
    if r['img']: urls.append("https://www.finalsticker.com" + r['img'])
    urls.append(fanlink(code))
    for u in urls:
        try:
            data = fetch(u)
            im = Image.open(io.BytesIO(data)).convert("RGB")
            if im.width > 320:
                im = im.resize((320, round(im.height * 320 / im.width)), Image.LANCZOS)
            im.save(out, "WEBP", quality=82, method=6)
            ok += 1
            break
        except Exception as e:
            print("ERR", code, u, e, flush=True)
    else:
        fail += 1
    time.sleep(0.05)
from concurrent.futures import ThreadPoolExecutor
with ThreadPoolExecutor(4) as ex: list(ex.map(work, rows))
print("done ok", ok, "fail", fail, flush=True)
