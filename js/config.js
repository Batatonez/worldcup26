/* Configuração da loja. Preços em reais. */
window.STORE = {
  name: "figurinhas26copa",
  // Preencha para aparecer nas páginas legais e no checkout. Vazio = "em breve".
  contactEmail: "",
  contactWhatsapp: "",

  prices: {
    intro: 15,      // 00 e FWC1–FWC8
    history: 3,     // FWC9–FWC19 (brilhantes da história)
    badge: 3,       // escudos brilhantes (n.º 1 de cada seleção)
    photo: 1,       // foto do time (n.º 13)
    player: 1,      // jogadores
    coke: 10,       // Coca-Cola
  },
  // Exceções por código
  special: {
    FWC9: 15,       // 00 e FWC1–FWC9 custam R$ 15
    ARG17: 10,      // Lionel Messi
    POR15: 10,      // Cristiano Ronaldo
  },

  products: [
    { id: "album-prata", title: "Álbum prata completo", desc: "Álbum de capa prata com a coleção completa.", price: 700, tone: "silver" },
    { id: "album-ouro", title: "Álbum ouro completo", desc: "Álbum de capa dourada com a coleção completa.", price: 750, tone: "gold" },
    { id: "set-eua", title: "Coleção americana completa", desc: "Set completo da edição americana.", price: 4000, tone: "us" },
    { id: "set-suica", title: "Coleção suíça completa", desc: "Set completo da edição suíça.", price: 5000, tone: "ch" },
  ],
};

window.priceOf = function (sticker) {
  const s = window.STORE;
  if (sticker.c in s.special) return s.special[sticker.c];
  return s.prices[sticker.k];
};

window.brl = function (v) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};
