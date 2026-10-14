/* Carrinho salvo no navegador (localStorage). */
(function () {
  const KEY = "fig26.cart.v1";
  const byCode = {};
  (window.WC ? window.WC.stickers : []).forEach((s) => (byCode[s.c] = s));

  function load() {
    try {
      const v = JSON.parse(localStorage.getItem(KEY));
      if (v && typeof v === "object") return { s: v.s || {}, p: v.p || {} };
    } catch (e) {}
    return { s: {}, p: {} };
  }
  let state = load();

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    document.dispatchEvent(new CustomEvent("cart:change"));
    paintCount();
  }

  const Cart = {
    sticker: (code) => byCode[code],
    has: (code) => !!state.s[code],
    qty: (code) => state.s[code] || 0,
    toggle(code) {
      if (state.s[code]) delete state.s[code];
      else state.s[code] = 1;
      save();
      return !!state.s[code];
    },
    setQty(code, n) {
      n = Math.max(0, Math.min(99, n | 0));
      if (n) state.s[code] = n; else delete state.s[code];
      save();
    },
    productQty: (id) => state.p[id] || 0,
    setProduct(id, n) {
      n = Math.max(0, Math.min(9, n | 0));
      if (n) state.p[id] = n; else delete state.p[id];
      save();
    },
    clear() { state = { s: {}, p: {} }; save(); },
    lines() {
      const out = [];
      const order = window.WC ? window.WC.stickers.map((s) => s.c) : [];
      order.forEach((c, i) => {
        if (!state.s[c]) return;
        const st = byCode[c];
        out.push({ type: "sticker", id: c, title: st.n, code: c, qty: state.s[c], unit: window.priceOf(st), order: i });
      });
      window.STORE.products.forEach((p) => {
        if (state.p[p.id]) out.push({ type: "product", id: p.id, title: p.title, qty: state.p[p.id], unit: p.price });
      });
      return out;
    },
    count() {
      let n = 0;
      for (const k in state.s) n += state.s[k];
      for (const k in state.p) n += state.p[k];
      return n;
    },
    total() { return Cart.lines().reduce((t, l) => t + l.qty * l.unit, 0); },
  };
  window.Cart = Cart;

  function paintCount() {
    document.querySelectorAll(".cart-count").forEach((el) => {
      const n = Cart.count();
      el.textContent = n;
      el.dataset.n = n;
    });
  }

  // Sincroniza entre abas
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) { state = load(); document.dispatchEvent(new CustomEvent("cart:change")); paintCount(); }
  });

  let toastTimer;
  window.toast = function (msg) {
    let t = document.querySelector(".toast");
    if (!t) {
      t = document.createElement("div");
      t.className = "toast";
      t.setAttribute("role", "status");
      t.setAttribute("aria-live", "polite");
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
  };

  document.addEventListener("DOMContentLoaded", paintCount);
})();
