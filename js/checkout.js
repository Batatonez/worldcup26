(function () {
  const WC = window.WC;
  const teamColor = {};
  WC.teams.forEach((t) => (teamColor[t.c] = t.c1));
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------- itens ---------- */
  function ink(hex) {
    const n = parseInt(hex.slice(1), 16);
    const y = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
    return y > 0.62 ? "#111" : "#fff";
  }
  function chipColor(line) {
    if (line.type === "product") return "#1d1d1f";
    if (/^CC/.test(line.code)) return "#b00a12";
    if (/^(FWC|00)/.test(line.code)) return "#0d2340";
    return teamColor[line.code.replace(/\d+$/, "")] || "#1d1d1f";
  }
  function subtitle(line) {
    if (line.type === "product") return "Coleção completa";
    const st = Cart.sticker(line.code);
    const team = WC.teams.find((t) => line.code.replace(/\d+$/, "") === t.c);
    const what = team ? team.pt : st.k === "coke" ? "Coca-Cola · " + st.t : "Abertura e história";
    return `${what} · ${window.brl(line.unit)} cada`;
  }

  function paint() {
    const lines = Cart.lines();
    $("empty").hidden = lines.length > 0;
    $("filled").hidden = lines.length === 0;
    const ul = $("lines");
    ul.innerHTML = "";
    lines.forEach((l) => {
      const li = document.createElement("li");
      li.className = "line";
      const label = l.type === "product" ? "26" : l.code;
      li.innerHTML =
        `<span class="code" style="--c:${chipColor(l)};color:${ink(chipColor(l))}">${esc(label)}</span>` +
        `<span class="t"><b>${esc(l.title)}</b><small>${esc(subtitle(l))}</small></span>` +
        `<span class="qty"><button type="button" data-d="-1" aria-label="Diminuir">−</button><span>${l.qty}</span><button type="button" data-d="1" aria-label="Aumentar">+</button></span>` +
        `<span class="sum">${window.brl(l.qty * l.unit)}</span>`;
      li.querySelectorAll(".qty button").forEach((b) =>
        b.addEventListener("click", () => {
          const n = l.qty + +b.dataset.d;
          if (l.type === "product") Cart.setProduct(l.id, n); else Cart.setQty(l.id, n);
        })
      );
      ul.appendChild(li);
    });
    $("subtotal").textContent = window.brl(Cart.total());
  }
  document.addEventListener("cart:change", paint);
  $("clear").addEventListener("click", () => { if (confirm("Remover todos os itens do carrinho?")) Cart.clear(); });

  /* ---------- máscaras ---------- */
  const digits = (s) => s.replace(/\D/g, "");
  function mask(el, fn) { el.addEventListener("input", () => { el.value = fn(digits(el.value)); }); }
  mask($("cpf"), (d) => d.slice(0, 11).replace(/^(\d{3})(\d)/, "$1.$2").replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2"));
  mask($("cep"), (d) => d.slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2"));
  mask($("tel"), (d) => {
    d = d.slice(0, 11);
    if (d.length <= 2) return d.length ? "(" + d : "";
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  });

  const UFS = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");
  UFS.forEach((u) => { const o = document.createElement("option"); o.value = o.textContent = u; $("uf").appendChild(o); });

  /* ---------- validação ---------- */
  function cpfValido(v) {
    const d = digits(v);
    if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
    for (let t = 9; t < 11; t++) {
      let s = 0;
      for (let i = 0; i < t; i++) s += +d[i] * (t + 1 - i);
      if (((s * 10) % 11) % 10 !== +d[t]) return false;
    }
    return true;
  }
  const rules = {
    nome: (v) => {
      const parts = v.trim().split(/\s+/).filter((p) => p.replace(/[^\p{L}]/gu, "").length >= 2);
      if (!v.trim()) return "Informe seu nome completo.";
      if (parts.length < 2) return "Informe nome e sobrenome.";
      if (/\d/.test(v)) return "O nome não pode ter números.";
      return "";
    },
    cpf: (v) => (!digits(v) ? "Informe seu CPF." : cpfValido(v) ? "" : "CPF inválido. Confira os números."),
    tel: (v) => { const d = digits(v); return d.length === 10 || d.length === 11 ? "" : "Informe o celular com DDD."; },
    email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Informe um e-mail válido."),
    cep: (v) => (digits(v).length === 8 ? "" : "Informe um CEP com 8 dígitos."),
    rua: (v) => (v.trim() ? "" : "Informe o endereço."),
    numero: (v) => (v.trim() ? "" : "Informe o número (ou S/N)."),
    bairro: (v) => (v.trim() ? "" : "Informe o bairro."),
    cidade: (v) => (v.trim() ? "" : "Informe a cidade."),
    uf: (v) => (v ? "" : "Escolha o estado."),
  };
  function setErr(name, msg) {
    const p = document.querySelector(`.err[data-for="${name}"]`);
    if (p) p.textContent = msg;
    const el = $(name);
    if (el) {
      el.closest(".field") && el.closest(".field").classList.toggle("bad", !!msg);
      el.setAttribute("aria-invalid", msg ? "true" : "false");
    }
  }
  Object.keys(rules).forEach((name) => {
    $(name).addEventListener("blur", () => { if ($(name).value) setErr(name, rules[name]($(name).value)); });
    $(name).addEventListener("input", () => { if ($(name).getAttribute("aria-invalid") === "true") setErr(name, rules[name]($(name).value)); });
  });

  /* ---------- CEP (ViaCEP) ---------- */
  let lastCep = "";
  $("cep").addEventListener("input", async () => {
    const d = digits($("cep").value);
    if (d.length !== 8 || d === lastCep) return;
    lastCep = d;
    const st = $("cepStatus");
    st.textContent = "Buscando endereço…";
    try {
      const r = await fetch(`https://viacep.com.br/ws/${d}/json/`);
      const j = await r.json();
      if (j.erro) { st.textContent = ""; setErr("cep", "CEP não encontrado. Confira ou preencha o endereço."); return; }
      setErr("cep", "");
      if (j.logradouro) $("rua").value = j.logradouro;
      if (j.bairro) $("bairro").value = j.bairro;
      if (j.localidade) $("cidade").value = j.localidade;
      if (j.uf) $("uf").value = j.uf;
      ["rua", "bairro", "cidade", "uf"].forEach((n) => $(n).value && setErr(n, ""));
      st.textContent = `${j.localidade} · ${j.uf}`;
      ($("rua").value ? $("numero") : $("rua")).focus();
    } catch (e) {
      st.textContent = "Não foi possível buscar o CEP. Preencha o endereço.";
    }
  });

  /* ---------- envio ---------- */
  $("checkout").addEventListener("submit", (e) => {
    e.preventDefault();
    let first = null;
    Object.keys(rules).forEach((name) => {
      const msg = rules[name]($(name).value);
      setErr(name, msg);
      if (msg && !first) first = $(name);
    });
    const entrega = document.querySelector('input[name="entrega"]:checked');
    document.querySelector('.err[data-for="entrega"]').textContent = entrega ? "" : "Escolha a forma de entrega.";
    if (!entrega && !first) first = document.querySelector('input[name="entrega"]');
    const ok = $("aceite").checked;
    document.querySelector('.err[data-for="aceite"]').textContent = ok ? "" : "É preciso aceitar os termos para continuar.";
    if (!ok && !first) first = $("aceite");
    if (first) { first.focus(); return; }

    const data = {};
    ["nome", "cpf", "tel", "email", "cep", "rua", "numero", "compl", "bairro", "cidade", "uf"].forEach((n) => (data[n] = $(n).value.trim()));
    data.entrega = entrega.value;
    showSummary(data);
  });

  function orderId() {
    const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let s = "";
    const r = crypto.getRandomValues(new Uint8Array(6));
    r.forEach((n) => (s += a[n % a.length]));
    return "F26-" + s;
  }

  function showSummary(d) {
    const lines = Cart.lines();
    const id = orderId();
    const total = Cart.total();
    const textLines = lines.map((l) => `${l.qty}x ${l.type === "sticker" ? l.code + " " : ""}${l.title} — ${window.brl(l.qty * l.unit)}`);
    const text =
      `Pedido ${id}\n\n${textLines.join("\n")}\n\nSubtotal: ${window.brl(total)} (frete à parte)\nEntrega: ${d.entrega}\n\n` +
      `${d.nome}\nCPF ${d.cpf}\n${d.tel} · ${d.email}\n${d.rua}, ${d.numero}${d.compl ? " — " + d.compl : ""}\n${d.bairro} · ${d.cidade}/${d.uf} · CEP ${d.cep}`;
    try { localStorage.setItem("fig26.lastOrder", JSON.stringify({ id, at: new Date().toISOString(), lines, total, cliente: d })); } catch (e) {}

    const wa = (window.STORE.contactWhatsapp || "").replace(/\D/g, "");
    $("summary").innerHTML =
      `<h2>Número do pedido</h2><p class="order-id">${id}</p>` +
      `<h2>Itens</h2><table>${lines.map((l) => `<tr><td>${l.qty}× ${l.type === "sticker" ? esc(l.code) + " · " : ""}${esc(l.title)}</td><td>${window.brl(l.qty * l.unit)}</td></tr>`).join("")}` +
      `<tr class="total"><td>Subtotal</td><td>${window.brl(total)}</td></tr><tr><td>Frete (${esc(d.entrega)})</td><td>à parte</td></tr></table>` +
      `<h2>Entrega</h2><p>${esc(d.nome)} · CPF ${esc(d.cpf)}</p><p>${esc(d.tel)} · ${esc(d.email)}</p>` +
      `<p>${esc(d.rua)}, ${esc(d.numero)}${d.compl ? " — " + esc(d.compl) : ""}</p><p>${esc(d.bairro)} · ${esc(d.cidade)}/${esc(d.uf)} · CEP ${esc(d.cep)}</p>` +
      `<h2>Próximo passo</h2><p>O pagamento on-line ainda não está disponível. ${wa ? "Envie este resumo pelo WhatsApp para combinar pagamento e frete." : "Copie este resumo e guarde o número do pedido para combinar pagamento e frete."}</p>` +
      `<div class="actions">${wa ? `<a class="btn" target="_blank" rel="noopener" href="https://wa.me/${wa}?text=${encodeURIComponent(text)}">Enviar pelo WhatsApp</a>` : ""}` +
      `<button class="btn ${wa ? "ghost" : ""}" type="button" id="copy">Copiar resumo</button><button class="btn ghost" type="button" id="back">Voltar e editar</button></div>`;
    $("view-cart").hidden = true;
    $("view-done").hidden = false;
    window.scrollTo(0, 0);
    $("copy").addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(text); window.toast("Resumo copiado"); }
      catch (e) { window.prompt("Copie o resumo:", text); }
    });
    $("back").addEventListener("click", () => { $("view-done").hidden = true; $("view-cart").hidden = false; });
  }

  paint();
})();
