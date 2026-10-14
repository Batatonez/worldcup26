#!/usr/bin/env python3
"""Baixa as imagens reais usadas no álbum e atualiza js/images.js.

Uso (precisa de internet aberta e Pillow: pip install pillow):
    python3 scripts/fetch_assets.py            # tudo
    python3 scripts/fetch_assets.py stickers   # só figurinhas
    python3 scripts/fetch_assets.py cover wood # só capa e madeira

- Figurinhas: finalsticker.com (atributo data-img da tabela do checklist), 320 px.
  As que faltarem lá (ex.: TUR13, NOR14) vêm do catálogo por código (dois dígitos, ex. BRA01).
- Capa dura: foto real do Lance! (IMG_1747), com a perspectiva corrigida para 850x1000.
- Madeira: wood_table_001 do Poly Haven (CC0).
Nada aqui é imagem gerada por IA.
"""
import io
import json
import os
import re
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 Safari/605.1.15"}
CHECKLIST = "https://www.finalsticker.com/alben/fifa-world-cup-2026-standard-edition"
FALLBACK = "https://pub-24930f19e0c3402fa466727b45e82627.r2.dev/sticker-catalog/panini2026-by-code/{code}.webp?v=6"
COVER = "https://lncimg.lance.com.br/cdn-cgi/image/width=1600,quality=85,format=jpeg/uploads/2026/04/IMG_1747.jpg"
# cantos da capa na foto (medidos em 1206x1432): TL, TR, BR, BL
COVER_CORNERS = [(45, 50), (1163, 59), (1171, 1377), (29, 1379)]
COVER_REF = (1206, 1432)
WOOD = "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/wood_table_001/wood_table_001_diff_2k.jpg"


def get(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def codes():
    js = open(os.path.join(ROOT, "js/data.js"), encoding="utf-8").read()
    data = json.loads(js[js.index("{"): js.rindex("}") + 1])
    return [s["c"] for s in data["stickers"]]


def norm(code):
    return re.sub(r"\s+", "", code).upper().lstrip("#")


def fetch_stickers():
    from PIL import Image
    out = os.path.join(ROOT, "img/s")
    os.makedirs(out, exist_ok=True)
    html = get(CHECKLIST).decode("utf-8", "replace")
    found = {}
    for tr in re.finditer(r"<tr\b([^>]*\bdata-sec[^>]*)>(.*?)</tr>", html, re.S):
        attrs, body = tr.group(1), tr.group(2)
        if "data-extra" in attrs:
            continue
        img = re.search(r'data-img="([^"]+)"', attrs)
        num = re.search(r'class="[^"]*c-num-b[^"]*"[^>]*>([^<]+)<', body)
        if img and num:
            url = img.group(1)
            if url.startswith("/"):
                url = "https://www.finalsticker.com" + url
            found[norm(num.group(1))] = url
    print(f"checklist: {len(found)} imagens encontradas")
    ok = []
    for code in codes():
        dest = os.path.join(out, code + ".webp")
        if os.path.exists(dest):
            ok.append(code)
            continue
        urls = []
        if code in found:
            urls.append(found[code])
        m = re.fullmatch(r"([A-Z]+)(\d+)", code)
        if m:
            urls.append(FALLBACK.format(code=f"{m.group(1)}{int(m.group(2)):02d}"))
        for u in urls:
            try:
                im = Image.open(io.BytesIO(get(u))).convert("RGB")
                im.thumbnail((320, 320 * 4 // 3))
                im.save(dest, "WEBP", quality=82)
                ok.append(code)
                break
            except Exception as e:  # noqa: BLE001
                print(f"  {code}: falhou {u} ({e})")
    print(f"figurinhas: {len(ok)} de {len(codes())}")
    return ok


def fetch_cover():
    from PIL import Image
    im = Image.open(io.BytesIO(get(COVER))).convert("RGB")
    sx, sy = im.width / COVER_REF[0], im.height / COVER_REF[1]
    src = [(x * sx, y * sy) for x, y in COVER_CORNERS]
    W, H = 850, 1000
    dst = [(0, 0), (W, 0), (W, H), (0, H)]
    coeffs = perspective_coeffs(dst, src)
    out = im.transform((W, H), Image.PERSPECTIVE, coeffs, Image.BICUBIC)
    out.save(os.path.join(ROOT, "img/covers/br-capa-dura.webp"), "WEBP", quality=86)
    print("capa: img/covers/br-capa-dura.webp")


def perspective_coeffs(dst, src):
    # resolve o sistema 8x8 que leva pontos de saída (dst) para a imagem original (src)
    A, b = [], []
    for (x, y), (u, v) in zip(dst, src):
        A.append([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.append(u)
        A.append([0, 0, 0, x, y, 1, -v * x, -v * y]); b.append(v)
    n = 8
    M = [row[:] + [b[i]] for i, row in enumerate(A)]
    for c in range(n):
        p = max(range(c, n), key=lambda r: abs(M[r][c]))
        M[c], M[p] = M[p], M[c]
        for r in range(n):
            if r != c:
                f = M[r][c] / M[c][c]
                M[r] = [a - f * bb for a, bb in zip(M[r], M[c])]
    return [M[i][n] / M[i][i] for i in range(n)]


def fetch_wood():
    from PIL import Image
    im = Image.open(io.BytesIO(get(WOOD))).convert("RGB")
    im.thumbnail((1600, 1600))
    im.save(os.path.join(ROOT, "img/wood.jpg"), "JPEG", quality=78)
    print("madeira: img/wood.jpg")


def write_manifest():
    s_dir = os.path.join(ROOT, "img/s")
    have = sorted(f[:-5] for f in os.listdir(s_dir) if f.endswith(".webp")) if os.path.isdir(s_dir) else []
    order = {c: i for i, c in enumerate(codes())}
    have = sorted((c for c in have if c in order), key=order.get)
    m = {
        "stickers": have,
        "cover": os.path.exists(os.path.join(ROOT, "img/covers/br-capa-dura.webp")),
        "wood": os.path.exists(os.path.join(ROOT, "img/wood.jpg")),
    }
    open(os.path.join(ROOT, "js/images.js"), "w").write(
        "/* Gerado por scripts/fetch_assets.py: quais imagens existem em img/. */\nwindow.IMG = "
        + json.dumps(m, separators=(",", ":")) + ";\n")
    print(f"js/images.js: {len(have)} figurinhas, capa={m['cover']}, madeira={m['wood']}")


if __name__ == "__main__":
    what = set(sys.argv[1:]) or {"stickers", "cover", "wood"}
    for name, fn in (("stickers", fetch_stickers), ("cover", fetch_cover), ("wood", fetch_wood)):
        if name in what:
            try:
                fn()
            except Exception as e:  # noqa: BLE001
                print(f"{name}: erro ({e})")
    write_manifest()
