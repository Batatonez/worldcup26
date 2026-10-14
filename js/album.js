/* Álbum interativo: edição brasileira capa dura. */
(function () {
  const WC = window.WC;
  const IMG = window.IMG || { stickers: [], cover: false, wood: false };
  const hasImg = new Set(IMG.stickers);
  const S = {};
  WC.stickers.forEach((s) => (S[s.c] = s));
  const TEAMS = WC.teams;
  const T = {};
  TEAMS.forEach((t) => (T[t.c] = t));

  // Sequência de lados: capa, verso da capa, páginas 1–106, verso da contracapa, contracapa.
  const PAGES = 106;
  const SIDES = ["cover", "insideF"];
  for (let p = 1; p <= PAGES; p++) SIDES.push(p);
  SIDES.push("insideB", "back");
  const LAST_SPREAD = SIDES.length / 2; // 55

  const sideOfPage = (p) => p + 1;
  const spreadOfSide = (i) => Math.floor((i + 1) / 2);

  /* ---------- utilidades ---------- */
  function h(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function at(e, x, y, w, hgt) {
    e.style.left = x + "px";
    e.style.top = y + "px";
    if (w != null) e.style.width = w + "px";
    if (hgt != null) e.style.height = hgt + "px";
    return e;
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }
  function lum(hex) {
    const n = parseInt(hex.slice(1), 16);
    const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  }
  const fgOn = (hex) => (lum(hex) > 0.45 ? "#111" : "#fff");
  const flag = (iso) => `img/flags/${iso}.svg`;
  const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

  function slot(code, x, y, opt) {
    opt = opt || {};
    const st = S[code];
    const b = h("button", "slot" + (opt.wide ? " wide" : "") + (opt.big ? " big" : "") +
      (["intro", "history", "badge"].includes(st.k) ? " foil" : ""));
    b.type = "button";
    b.dataset.code = code;
    at(b, x, y);
    if (opt.tint) b.style.setProperty("--tint", opt.tint);
    const label = code === "00" ? "00" : code;
    let inner = `<span class="n26">26</span><span class="code">${esc(label)}</span><span class="nm">${esc(st.n)}</span>`;
    if (opt.langs) inner += `<span class="langs">${esc(opt.langs)}</span>`;
    inner += `<span class="pr">${window.brl(window.priceOf(st))}</span>`;
    if (hasImg.has(code)) inner += `<img class="st" src="img/s/${code}.webp" alt="" loading="lazy"><span class="tag">${esc(label)}</span>`;
    inner += `<span class="chk" aria-hidden="true">${CHECK}</span>`;
    b.innerHTML = inner;
    b.setAttribute("aria-label", `${label} ${st.n}, ${window.brl(window.priceOf(st))}`);
    b.setAttribute("aria-pressed", Cart.has(code) ? "true" : "false");
    if (Cart.has(code)) b.classList.add("on");
    return b;
  }

  function blockPoly(color, points) {
    const d = h("div", "blk");
    at(d, 0, 0, 850, 1000);
    d.style.background = color;
    d.style.clipPath = `polygon(${points})`;
    return d;
  }

  /* ---------- páginas de seleção ---------- */
  function teamLeft(t) {
    const pg = h("div", "pg");
    const fg = fgOn(t.c1);
    pg.style.background = t.c1;
    pg.style.setProperty("--fg", fg);
    const dark = `color-mix(in srgb, ${t.c1} 72%, #000)`;
    pg.appendChild(blockPoly(t.c2, "0 62%, 100% 48%, 100% 72%, 0 86%"));
    pg.appendChild(blockPoly(dark, "0 0, 54% 0, 54% 31%, 0 31%"));
    const head = at(h("div", "blk"), 50, 60, 380, 225);
    head.innerHTML =
      `<div class="we">We are</div><div class="tname" style="font-size:${t.en.length > 13 ? 50 : t.en.length > 9 ? 62 : 76}px">${esc(t.en)}</div>` +
      `<div style="display:flex;align-items:center;gap:16px;margin-top:16px"><img class="tflag" src="${flag(t.iso)}" alt="Bandeira: ${esc(t.pt)}"><div class="tconf">${esc(t.conf)}</div></div>`;
    pg.appendChild(head);
    const tint = `color-mix(in srgb, ${t.c1} 70%, #000)`;
    pg.appendChild(slot(t.c + "1", 470, 60, { tint }));
    pg.appendChild(slot(t.c + "2", 650, 60, { tint }));
    const xs = [55, 245, 435, 625];
    for (let i = 0; i < 4; i++) pg.appendChild(slot(t.c + (3 + i), xs[i], 315, { tint }));
    for (let i = 0; i < 4; i++) pg.appendChild(slot(t.c + (7 + i), xs[i], 570, { tint }));
    const band = h("div", "foot-band", "Road to FIFA World Cup 2026");
    band.style.background = dark;
    band.style.color = "#fff";
    pg.appendChild(band);
    return pg;
  }

  function teamRight(t) {
    const pg = h("div", "pg");
    pg.style.background = t.c1;
    pg.style.setProperty("--fg", fgOn(t.c1));
    pg.appendChild(blockPoly(t.c2, "0 0, 100% 0, 100% 14%, 0 30%"));
    const tint = `color-mix(in srgb, ${t.c1} 70%, #000)`;
    pg.appendChild(slot(t.c + "11", 55, 60, { tint }));
    pg.appendChild(slot(t.c + "12", 245, 60, { tint }));
    pg.appendChild(slot(t.c + "13", 435, 60, { tint, wide: true, langs: t.en === t.pt ? t.pt : `${t.pt} · ${t.en}` }));
    const xs = [55, 245, 435, 625];
    for (let i = 0; i < 4; i++) pg.appendChild(slot(t.c + (14 + i), xs[i], 315, { tint }));
    // Box do grupo
    const g = h("div", "grp-box");
    at(g, 55, 570, 170, 225);
    g.style.background = t.c2;
    g.style.color = fgOn(t.c2);
    g.innerHTML = `<h4>Group ${t.g}</h4><div class="fl">` +
      WC.groups[t.g].map((c) => `<div><img src="${flag(T[c].iso)}" alt="">${c}</div>`).join("") + "</div>";
    pg.appendChild(g);
    for (let i = 0; i < 3; i++) pg.appendChild(slot(t.c + (18 + i), xs[i + 1], 570, { tint }));
    // Jogos
    const games = h("div", "games");
    t.games.forEach((m) => {
      const d = h("div", "game");
      d.style.background = `color-mix(in srgb, ${t.c1} 62%, #000)`;
      d.style.color = "#fff";
      d.innerHTML = `<div class="d">${esc(m.d)}</div>` +
        `<div class="vs"><img src="${flag(T[m.h].iso)}" alt="">${m.h}<i>×</i>${m.a}<img src="${flag(T[m.a].iso)}" alt=""></div>` +
        `<div class="v">${esc(m.v)}</div>`;
      games.appendChild(d);
    });
    pg.appendChild(games);
    return pg;
  }

  /* ---------- páginas especiais ---------- */
  const NAVY = "#0d2340";
  function basePage(bg, polys) {
    const pg = h("div", "pg");
    pg.style.background = bg;
    pg.style.setProperty("--fg", "#fff");
    (polys || []).forEach((p) => pg.appendChild(blockPoly(p[0], p[1])));
    return pg;
  }
  function title(pg, text, sub, x, y) {
    const d = at(h("div", "blk"), x || 56, y || 50, 740);
    d.innerHTML = `<div class="ttl">${text}</div>` + (sub ? `<div class="sub" style="margin-top:8px">${sub}</div>` : "");
    pg.appendChild(d);
    return d;
  }
  const tintNavy = "rgba(255,255,255,.14)";

  function page(p) {
    if (p >= 8 && p <= 103) {
      const t = TEAMS[(p - 8) >> 1];
      return p % 2 === 0 ? teamLeft(t) : teamRight(t);
    }
    let pg;
    switch (p) {
      case 1:
        pg = basePage(NAVY, [["#16a34a", "0 0, 100% 0, 100% 18%, 0 34%"], ["#f2c200", "0 86%, 100% 70%, 100% 100%, 0 100%"]]);
        title(pg, "Official Sticker Album", "FIFA World Cup 26 · Edição brasileira", 56, 60);
        pg.appendChild(slot("00", 310, 360, { big: true, tint: tintNavy }));
        return pg;
      case 2:
        pg = basePage(NAVY, [["#1d4ed8", "0 70%, 100% 56%, 100% 100%, 0 100%"]]);
        title(pg, "Official Emblem");
        pg.appendChild(slot("FWC1", 310, 170, { big: true, tint: tintNavy }));
        pg.appendChild(slot("FWC2", 310, 490, { big: true, tint: tintNavy }));
        return pg;
      case 3:
        pg = basePage(NAVY, [["#16a34a", "0 56%, 100% 70%, 100% 100%, 0 100%"]]);
        title(pg, "Mascots · Slogan · Ball");
        pg.appendChild(slot("FWC3", 50, 330, { big: true, tint: tintNavy }));
        pg.appendChild(slot("FWC4", 310, 330, { big: true, tint: tintNavy }));
        pg.appendChild(slot("FWC5", 570, 330, { big: true, tint: tintNavy }));
        return pg;
      case 4:
      case 5: {
        pg = basePage("#7a0d1f", [["#b3122e", "0 0, 100% 0, 100% 12%, 0 26%"]]);
        title(pg, p === 4 ? "Host countries" : "Host cities", p === 4 ? "Canada · Mexico" : "USA");
        const hosts = p === 4 ? [["FWC6", "CAN", 210], ["FWC7", "MEX", 580]] : [["FWC8", "USA", 210]];
        hosts.forEach(([code, c, y]) => {
          pg.appendChild(slot(code, 56, y, { big: true, tint: "rgba(255,255,255,.16)" }));
          const list = at(h("div", "blk cities"), 330, y + 10, 480);
          const cities = WC.hosts[c];
          list.innerHTML = `<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px"><img src="${flag(T[c].iso)}" alt="" style="width:56px;height:42px"><b style="font-size:34px">${esc(T[c].en)}</b></div>` +
            `<div style="column-count:${cities.length > 4 ? 2 : 1};column-gap:24px">${cities.map(esc).join("<br>")}</div>`;
          pg.appendChild(list);
        });
        return pg;
      }
      case 6:
      case 7: {
        pg = basePage("#e9e4d8");
        pg.style.setProperty("--fg", "#111");
        const d = at(h("div", "blk ttl"), 56, 34, 740);
        d.style.color = "#111";
        d.style.fontSize = "52px";
        d.textContent = p === 6 ? "Groups A–F" : "Groups G–L";
        pg.appendChild(d);
        const letters = p === 6 ? "ABCDEF" : "GHIJKL";
        [...letters].forEach((L, i) => {
          const c = h("div", "gcard");
          at(c, i % 2 ? 450 : 50, 112 + Math.floor(i / 2) * 290);
          const t0 = T[WC.groups[L][0]];
          c.style.background = NAVY;
          c.style.color = "#fff";
          c.innerHTML = `<h4>Group ${L}</h4>` + WC.groups[L].map((code) =>
            `<div class="row"><img src="${flag(T[code].iso)}" alt="">${esc(T[code].en)}<span>${code}</span></div>`).join("");
          void t0;
          pg.appendChild(c);
        });
        return pg;
      }
      case 104:
      case 105: {
        pg = basePage("#13161b", [["#c9a227", "0 0, 100% 0, 100% 10%, 0 20%"]]);
        title(pg, p === 104 ? "FIFA World Cup History" : "Past champions", p === 104 ? "FIFA Museum" : null, 56, p === 104 ? 30 : 50);
        const codes = p === 104 ? [9, 10, 11, 12, 13, 14] : [15, 16, 17, 18, 19];
        const xs = [80, 340, 600];
        codes.forEach((n, i) => pg.appendChild(slot("FWC" + n, xs[i % 3], 250 + Math.floor(i / 3) * 330, { tint: "rgba(255,255,255,.14)" })));
        return pg;
      }
      case 106: {
        pg = basePage("#b00a12", [["#7d0710", "0 0, 100% 0, 100% 13%, 0 13%"]]);
        title(pg, "Coca-Cola", "Figurinhas extras da promoção · fora da numeração do álbum", 56, 22);
        const xs = [55, 245, 435, 625];
        for (let i = 0; i < 12; i++) pg.appendChild(slot("CC" + (i + 1), xs[i % 4], 155 + Math.floor(i / 4) * 275, { tint: "rgba(0,0,0,.22)" }));
        return pg;
      }
    }
    return basePage("#f4f1ea");
  }

  function coverFront() {
    const pg = h("div", "pg cover-art");
    if (IMG.cover) {
      pg.innerHTML = `<img class="photo" src="img/covers/br-capa-dura.webp" alt="Capa do álbum, edição brasileira capa dura">`;
    } else {
      pg.innerHTML = `<div class="blkA"></div><div class="blkB"></div><div class="blkC"></div>` +
        `<div class="ct"><b>26</b><span>Álbum de figurinhas<br>Copa do Mundo 2026</span><small>Edição brasileira · capa dura</small></div>`;
    }
    pg.appendChild(h("div", "spine", "<span>FIFA WORLD CUP 2026</span>"));
    return pg;
  }

  function buildSide(idx, extraCls) {
    const key = SIDES[idx];
    const d = h("div", "side" + (extraCls ? " " + extraCls : ""));
    if (key === "cover") { d.classList.add("cover"); d.appendChild(coverFront()); }
    else if (key === "back") { d.classList.add("cover"); d.appendChild(h("div", "pg inside", "")); d.firstChild.style.background = "#0d2340"; }
    else if (key === "insideF") { d.classList.add("cover"); d.appendChild(h("div", "pg inside", "Edição brasileira<br>capa dura")); }
    else if (key === "insideB") { d.classList.add("cover"); d.appendChild(h("div", "pg inside", "")); }
    else d.appendChild(page(key));
    d.dataset.side = idx;
    return d;
  }

  /* ---------- motor de virar página ---------- */
  const stage = document.getElementById("stage");
  const wrap = document.getElementById("bookWrap");
  const book = document.getElementById("book");
  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");
  const where = document.getElementById("where");
  if (IMG.wood) stage.classList.add("wood");

  let single = false;
  let k = 0; // dupla atual (modo livro)
  let i = 0; // lado atual (modo uma página)
  let busy = false;

  function clearDynamic() {
    book.querySelectorAll(".side, .leaf").forEach((e) => e.remove());
  }

  function shiftFor(spread) {
    if (single) return 0;
    if (spread === 0) return -425;
    if (spread === LAST_SPREAD) return 425;
    return 0;
  }

  function render() {
    clearDynamic();
    stage.classList.toggle("single", single);
    if (single) {
      book.classList.remove("closed-front", "closed-back");
      book.appendChild(buildSide(i, "only"));
    } else {
      const L = 2 * k - 1, R = 2 * k;
      if (L >= 0) book.appendChild(buildSide(L, "l"));
      if (R < SIDES.length) book.appendChild(buildSide(R, "r"));
      book.classList.toggle("closed-front", k === 0);
      book.classList.toggle("closed-back", k === LAST_SPREAD);
    }
    book.style.setProperty("--shift", shiftFor(k) + "px");
    updateUi();
  }

  function pageLabel(idx) {
    const key = SIDES[idx];
    if (key === "cover") return "Capa";
    if (key === "back") return "Contracapa";
    if (typeof key !== "number") return "Verso da capa";
    return "Página " + key;
  }

  function updateUi() {
    if (single) {
      prevBtn.disabled = i === 0;
      nextBtn.disabled = i === SIDES.length - 1;
      where.textContent = pageLabel(i);
    } else {
      prevBtn.disabled = k === 0;
      nextBtn.disabled = k === LAST_SPREAD;
      const L = 2 * k - 1, R = 2 * k;
      const keys = [SIDES[L], SIDES[R]].filter((x) => typeof x === "number");
      where.textContent = k === 0 ? "Capa" : k === LAST_SPREAD ? "Contracapa" :
        keys.length === 2 ? `Páginas ${keys[0]}–${keys[1]}` : keys.length ? `Página ${keys[0]}` : "Verso da capa";
    }
    const sel = document.getElementById("jump");
    const cur = single ? i : 2 * k;
    let best = "";
    [...sel.options].forEach((o) => { if (o.value !== "" && +o.value <= Math.max(cur, 1) + (single ? 0 : 0)) best = o.value; });
    sel.value = best;
  }

  function flip(dir) {
    if (busy) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (single) {
      const ni = i + dir;
      if (ni < 0 || ni >= SIDES.length) return;
      if (reduce) { i = ni; render(); return; }
      busy = true;
      const leaf = h("div", "leaf " + (dir > 0 ? "fwd" : "bwd"));
      const front = buildSide(dir > 0 ? i : ni);
      const back = h("div", "side back");
      leaf.append(front, back, h("div", "shade"));
      if (dir > 0) {
        book.querySelector(".side.only").replaceWith(buildSide(ni, "only"));
      }
      book.appendChild(leaf);
      leaf.addEventListener("animationend", (e) => { if (e.target === leaf) { i = ni; busy = false; render(); } });
      return;
    }
    const nk = k + dir;
    if (nk < 0 || nk > LAST_SPREAD) return;
    if (reduce) { k = nk; render(); return; }
    busy = true;
    book.classList.remove("closed-front", "closed-back");
    book.style.setProperty("--shift", shiftFor(nk) + "px");
    const leaf = h("div", "leaf " + (dir > 0 ? "fwd" : "bwd"));
    if (dir > 0) {
      leaf.append(buildSide(2 * k), buildSide(2 * k + 1, "back"), h("div", "shade"));
      const r = book.querySelector(".side.r");
      if (r) r.remove();
      if (2 * k + 2 < SIDES.length) book.appendChild(buildSide(2 * k + 2, "r"));
    } else {
      leaf.append(buildSide(2 * k - 2), buildSide(2 * k - 1, "back"), h("div", "shade"));
      const l = book.querySelector(".side.l");
      if (l) l.remove();
      if (2 * k - 3 >= 0) book.appendChild(buildSide(2 * k - 3, "l"));
    }
    book.appendChild(leaf);
    leaf.addEventListener("animationend", (e) => { if (e.target === leaf) { k = nk; busy = false; render(); } });
  }

  function gotoSide(idx) {
    if (busy) return;
    if (single) i = idx; else k = spreadOfSide(idx);
    render();
  }

  /* ---------- escala e modo ---------- */
  function fit() {
    const wasSingle = single;
    const W = stage.clientWidth, H = stage.clientHeight;
    single = W < 760;
    if (single !== wasSingle) {
      if (single) i = k === 0 ? 0 : k === LAST_SPREAD ? SIDES.length - 1 : 2 * k - 1;
      else k = spreadOfSide(i);
    }
    const bw = single ? 850 : 1700;
    const s = single ? Math.min((W - 28) / (bw + 32), (H - 24) / 1060) : Math.min((W - 150) / (bw + 32), (H - 70) / 1060);
    wrap.style.transform = `translate(${(-bw * s) / 2}px, ${(-1000 * s) / 2 - 6}px) scale(${s})`;
    const edge = (bw * s) / 2;
    if (single) {
      prevBtn.style.left = "8px"; nextBtn.style.right = "8px";
      prevBtn.style.removeProperty("right"); nextBtn.style.removeProperty("left");
    } else {
      prevBtn.style.left = `calc(50% - ${edge + 66}px)`;
      nextBtn.style.left = `calc(50% + ${edge + 14}px)`;
      nextBtn.style.removeProperty("right");
    }
    if (single !== wasSingle) render();
  }

  /* ---------- seleção de figurinhas ---------- */
  let swallowClick = false;
  book.addEventListener("click", (e) => {
    const b = e.target.closest(".slot");
    if (!b || busy || swallowClick) return;
    const code = b.dataset.code;
    const on = Cart.toggle(code);
    const st = S[code];
    window.toast(`${code} ${on ? "adicionada ao carrinho" : "removida do carrinho"} · ${window.brl(window.priceOf(st))}`);
  });
  function paintSelection() {
    book.querySelectorAll(".slot").forEach((b) => {
      const on = Cart.has(b.dataset.code);
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    const lines = Cart.lines().filter((l) => l.type === "sticker");
    const n = lines.reduce((a, l) => a + l.qty, 0);
    const tot = lines.reduce((a, l) => a + l.qty * l.unit, 0);
    document.getElementById("selCount").textContent = n === 1 ? "1 figurinha" : `${n} figurinhas`;
    document.getElementById("selTotal").textContent = window.brl(tot);
  }
  document.addEventListener("cart:change", paintSelection);

  /* ---------- controles ---------- */
  prevBtn.addEventListener("click", () => flip(-1));
  nextBtn.addEventListener("click", () => flip(1));
  document.addEventListener("keydown", (e) => {
    if (e.target.closest("input, select, textarea")) return;
    if (e.key === "ArrowRight") { flip(1); e.preventDefault(); }
    if (e.key === "ArrowLeft") { flip(-1); e.preventDefault(); }
  });
  let sx = null, sy = null;
  stage.addEventListener("pointerdown", (e) => { sx = e.clientX; sy = e.clientY; });
  stage.addEventListener("pointerup", (e) => {
    if (sx == null) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    sx = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      swallowClick = true;
      setTimeout(() => (swallowClick = false), 350);
      flip(dx < 0 ? 1 : -1);
    }
  });

  // Índice
  const sel = document.getElementById("jump");
  const add = (parent, label, p) => { const o = h("option", null, esc(label)); o.value = sideOfPage(p); parent.appendChild(o); };
  const capa = h("option", null, "Capa"); capa.value = 0; sel.appendChild(capa);
  const og0 = h("optgroup"); og0.label = "Abertura";
  add(og0, "Abertura · 00", 1); add(og0, "Emblema, mascotes e bola", 2); add(og0, "Países e cidades-sede", 4); add(og0, "Grupos", 6);
  sel.appendChild(og0);
  Object.keys(WC.groups).sort().forEach((L) => {
    const og = h("optgroup"); og.label = "Grupo " + L;
    WC.groups[L].forEach((c) => add(og, `${T[c].pt} (${c})`, 8 + 2 * TEAMS.indexOf(T[c])));
    sel.appendChild(og);
  });
  const og1 = h("optgroup"); og1.label = "Final";
  add(og1, "História da Copa", 104); add(og1, "Coca-Cola (extras)", 106);
  sel.appendChild(og1);
  sel.addEventListener("change", () => { if (sel.value !== "") gotoSide(+sel.value); });

  function fromHash() {
    const hs = decodeURIComponent(location.hash.slice(1)).toUpperCase();
    if (T[hs]) return sideOfPage(8 + 2 * TEAMS.indexOf(T[hs]));
    const m = hs.match(/^P(\d+)$/);
    if (m && +m[1] >= 1 && +m[1] <= PAGES) return sideOfPage(+m[1]);
    return null;
  }

  window.addEventListener("resize", fit);
  window.addEventListener("hashchange", () => { const s = fromHash(); if (s != null) gotoSide(s); });

  fit();
  const start = fromHash();
  if (start != null) { if (single) i = start; else k = spreadOfSide(start); }
  render();
  paintSelection();
})();
