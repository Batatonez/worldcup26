(function () {
  const WC = window.WC;
  const T = {};
  WC.teams.forEach((t) => (T[t.c] = t));

  const grid = document.getElementById("teamGrid");
  Object.keys(WC.groups).sort().forEach((L) => {
    const box = document.createElement("div");
    box.className = "grp";
    box.innerHTML = `<div class="group-label">Grupo ${L}</div>`;
    grid.appendChild(box);
    WC.groups[L].forEach((c) => {
      const t = T[c];
      const a = document.createElement("a");
      a.className = "team";
      a.href = "album.html#" + c;
      a.innerHTML = `<img src="img/flags/${t.iso}.svg" alt="" loading="lazy">${t.pt}<small>${c}</small>`;
      box.appendChild(a);
    });
  });

  const marks = { silver: "Prata", gold: "Ouro", us: "EUA", ch: "Suíça" };
  const pg = document.getElementById("prodGrid");
  function paint() {
    pg.innerHTML = "";
    window.STORE.products.forEach((p) => {
      const n = Cart.productQty(p.id);
      const el = document.createElement("article");
      el.className = "prod tone-" + p.tone;
      el.innerHTML =
        `<div class="art" aria-hidden="true"><b>26</b><i>${marks[p.tone]}</i></div>` +
        `<div class="body"><h3>${p.title}</h3><p>${p.desc}</p>` +
        `<div class="row"><strong>${window.brl(p.price)}</strong>` +
        `<button class="btn${n ? " dark" : ""}" type="button">${n ? "No carrinho" : "Adicionar"}</button></div></div>`;
      el.querySelector("button").addEventListener("click", () => {
        if (Cart.productQty(p.id)) { location.href = "carrinho.html"; return; }
        Cart.setProduct(p.id, 1);
        window.toast(`${p.title} adicionado ao carrinho`);
      });
      pg.appendChild(el);
    });
  }
  paint();
  document.addEventListener("cart:change", paint);
})();
