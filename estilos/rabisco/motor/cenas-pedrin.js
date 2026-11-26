// Rabisco · 002 Pedrin: o menino que sonha em ser jogador. Usa as peças de cenas.js (F, L, ob, rr, arco, chao, CH, VIS, COR) e circulo de cena.js.
const PELE = COR.bege, CABELO = "#2b2622", PRETO = "#2b2622";

function pedrin(x, y, s, pose = "parado") { // desenhado a partir dos pés (x, y); altura ~300 · s
  const p = (px, py) => [x + px * s, y + py * s];
  const f = [];
  const perna = (a, b, c) => L([p(...a), p(...b), p(...c)], { larg: 13 });
  if (pose === "chuta") { f.push(perna([-18, -74], [-20, -36], [-20, -4]), perna([18, -74], [62, -44], [112, -52])); }
  else if (pose === "festa") { f.push(perna([-16, -74], [-40, -36], [-54, -4]), perna([16, -74], [40, -36], [54, -4])); }
  else f.push(F(rr(x - 32 * s, y - 76 * s, 26 * s, 72 * s, 8 * s), PELE), F(rr(x + 6 * s, y - 76 * s, 26 * s, 72 * s, 8 * s), PELE));
  const bracos = pose === "festa" ? [[[-34, -195], [-72, -240], [-84, -292]], [[34, -195], [72, -240], [84, -292]]]
    : pose === "abraca" ? [[[-34, -192], [-30, -140], [-4, -128]], [[34, -192], [30, -140], [4, -128]]]
    : pose === "chuta" ? [[[-34, -195], [-84, -176], [-112, -196]], [[34, -195], [80, -168], [104, -140]]]
    : [[[-34, -195], [-54, -150], [-56, -108]], [[34, -195], [54, -150], [56, -108]]];
  bracos.forEach((b) => f.push(L(b.map((q) => p(...q)), { larg: 13 })));
  f.push(F(rr(x - 36 * s, y - 120 * s, 72 * s, 46 * s, 8 * s), COR.azul)); // calção
  f.push(F(rr(x - 36 * s, y - 210 * s, 72 * s, 96 * s, 16 * s), COR.amarelo)); // camisa
  f.push(F(circulo(...p(0, -258), 42 * s, 20), PELE)); // cabeça
  f.push(F(arco(...p(0, -262), 46 * s, 185, 355, 12).concat(arco(...p(0, -262), 30 * s, 355, 185, 8)), CABELO));
  f.push(L([p(-14, -258), p(-14, -250)], { larg: 7 }), L([p(14, -258), p(14, -250)], { larg: 7 }));
  f.push(L(arco(...p(0, -246), 16 * s, 25, 155, 6), { larg: 6 }));
  return f;
}
function bola(x, y, r, tipo = "couro") {
  if (tipo === "meia") return [F(circulo(x, y, r, 22), COR.rosa), L(arco(x, y, r * 0.6, 200, 340, 8), { larg: 5 }), L(arco(x, y, r * 0.6, 20, 160, 8), { larg: 5 }), L([[x - r * 0.9, y - r * 0.1], [x + r * 0.9, y + r * 0.1]], { larg: 5, tinta: COR.azul })];
  const v = (g, k) => [x + Math.cos(rad(g)) * r * k, y + Math.sin(rad(g)) * r * k];
  return [F(circulo(x, y, r, 24), COR.tela), F([0, 1, 2, 3, 4].map((i) => v(-90 + i * 72, 0.38)), PRETO), ...[0, 1, 2, 3, 4].map((i) => L([v(-90 + i * 72, 0.38), v(-90 + i * 72, 0.95)], { larg: 4 }))];
}
function chinelo(x, y, cor) { return [F(rr(x, y - 110, 54, 110, 24), cor), L(arco(x + 27, y - 70, 18, 190, 350, 8), { larg: 6 }), L([[x + 27, y - 92], [x + 27, y - 70]], { larg: 6 })]; }
function pessoa(x, y, s, camisa) { // o vizinho
  const p = (px, py) => [x + px * s, y + py * s];
  return [F(rr(x - 28 * s, y - 80 * s, 24 * s, 76 * s, 8 * s), COR.azul), F(rr(x + 4 * s, y - 80 * s, 24 * s, 76 * s, 8 * s), COR.azul),
    L([p(30, -200), p(90, -180), p(150, -190)], { larg: 13 }), L([p(-30, -200), p(-50, -150), p(-50, -110)], { larg: 13 }),
    F(rr(x - 38 * s, y - 220 * s, 76 * s, 146 * s, 16 * s), camisa), F(circulo(...p(0, -262), 40 * s, 20), COR.rosa),
    F(arco(...p(0, -270), 42 * s, 190, 350, 10), "#8a8a84"), L([p(-13, -262), p(-13, -254)], { larg: 7 }), L([p(13, -262), p(13, -254)], { larg: 7 }), L(arco(...p(0, -250), 14 * s, 30, 150, 6), { larg: 6 })];
}
const nuvem = (cx, cy, k = 1) => [circulo(cx - 60 * k, cy + 10 * k, 50 * k, 14), circulo(cx, cy - 20 * k, 62 * k, 14), circulo(cx + 70 * k, cy + 6 * k, 52 * k, 14), circulo(cx + 10 * k, cy + 30 * k, 48 * k, 14)].map((c) => F(c, null));
function estrela(x, y, r, o = {}) { return [L([[x - r, y], [x + r, y]], { larg: 5, ...o }), L([[x, y - r], [x, y + r]], { larg: 5, ...o })]; }

Object.assign(CENAS, {
  pedrinApresenta(r, a) {
    return { fundo: "papel", objetos: [
      ob(chao(780, ...CH()), { em: 0, dura: 0.5 }),
      ob(pedrin(470, 780, 1.45, "parado"), { em: 0.2, dura: 1.5, guia: true }),
      ob(bola(700, 745, 36, "meia"), { em: 1.5, dura: 0.6 }),
    ], faisca: [[0, 840, 640, 0, 1], [2.0, 840, 640, 0, 1], [2.4, 840, 640, 1, 1]] };
  },
  pedrinSonho(r, a) {
    return { fundo: "papel", objetos: [
      ob(chao(780, ...CH()), { em: -10, dura: 0.5 }),
      ob(pedrin(330, 780, 1.3, "parado"), { em: -10 }),
      ob([F(circulo(520, 450, 12, 10), null), F(circulo(570, 400, 18, 10), null), F(circulo(630, 340, 26, 12), null)], { em: 0.4, dura: 0.7 }),
      ob(nuvem(730, 220, 1.5), { em: 0.9, dura: 1.0 }),
      ob([...pedrin(730, 330, 0.62, "festa"), F(arco(730, 330, 150, 180, 360, 16), null)], { em: 1.7, dura: 1.0 }),
      ob([...estrela(900, 130, 18), ...estrela(560, 130, 14)], { em: 2.4, dura: 0.5 }),
    ], faisca: [[0, 520, 700, 0, 1], [2.2, 520, 700, 0, 1], [2.6, 520, 700, 1, 1]] };
  },
  pedrinSemNada(r, a) {
    const chuteira = (x, y) => [F([[x, y], [x + 120, y], [x + 120, y - 56], [x + 80, y - 92], [x + 30, y - 92], [x, y - 70]], COR.vermelho), L([[x, y + 12], [x + 120, y + 12]], { larg: 8 })];
    const campo = (x, y) => [F(rr(x, y, 260, 150, 10), COR.verde), L([[x + 130, y], [x + 130, y + 150]], { larg: 5 }), F(circulo(x + 130, y + 75, 26, 14), null)];
    const xis = (x, y, s) => [L([[x - s, y - s], [x + s, y + s]], { larg: 14, tinta: COR.vermelho }), L([[x + s, y - s], [x - s, y + s]], { larg: 14, tinta: COR.vermelho })];
    return { fundo: "papel", objetos: [
      ob(chao(780, ...CH()), { em: 0, dura: 0.5 }),
      ob(pedrin(500, 780, 1.35, "parado"), { em: 0.1, dura: 1.0 }),
      ob(chuteira(240, 420), { em: 0.9, dura: 0.7 }), ob(xis(300, 380, 90), { em: 1.6, dura: 0.5 }),
      ob(campo(560, 300), { em: 2.0, dura: 0.7 }), ob(xis(690, 375, 110), { em: 2.7, dura: 0.5 }),
    ], faisca: [[0, 800, 700, 0, 0.6], [3.0, 800, 700, 0, 0.6]] };
  },
  pedrinTrave(r, a) {
    return { fundo: "papel", objetos: [
      ob(chao(780, ...CH()), { em: 0, dura: 0.5 }),
      ob(chinelo(800, 780, COR.verde), { em: 0.3, dura: 0.7 }), ob(chinelo(910, 780, COR.rosa), { em: 0.6, dura: 0.7 }),
      ob(pedrin(300, 780, 1.3, "chuta"), { em: 0.4, dura: 1.2, guia: true }),
      ob(bola(480, 745, 34, "meia"), { em: 1.5, dura: 0.5, move: [[0, 0, 0], [1.6, 0, 0], [2.4, 300, -40], [3.0, 320, 0]] }),
    ], faisca: [[0, 700, 520, 0, 1], [3.0, 700, 520, 1, 1]] };
  },
  pedrinChuva(r, a) {
    const fim = a.t1 - a.t0, objetos = [ob(chao(780, ...CH()), { em: -10, dura: 0.5 }), ob(pedrin(420, 780, 1.3, "chuta"), { em: 0.6, dura: 0.8, vibra: 2 }),
      ob(bola(600, 745, 34, "meia"), { em: 0.9, dura: 0.5, move: [[0, 0, 0], [1.0, 0, 0], [1.8, 130, -50], [2.6, 150, 0], [3.2, 0, 0]] }), ob(nuvem(500, 150, 1.6), { em: 1.2, dura: 0.8 })];
    for (let k = 0; k < 46; k++) { const x = VIS.x0 + r() * (VIS.x1 - VIS.x0), y = 200 + r() * 520, em = 1.3 + r() * (fim - 2.2); objetos.push(ob([L([[x, y], [x - 16, y + 44]], { larg: 4, tinta: COR.celeste })], { em, dura: 0.25, ate: em + 0.55 })); }
    return { fundo: "noite", objetos, faisca: [[0, 760, 560, 0, 1], [fim, 760, 560, 0, 1]] };
  },
  pedrinVizinho(r, a) {
    return { fundo: "papel", objetos: [
      ob(chao(780, ...CH()), { em: 0, dura: 0.5 }),
      ob(pessoa(230, 780, 1.35, COR.verde), { em: 0.3, dura: 1.1 }),
      ob(bola(500, 600, 44), { em: 1.6, dura: 0.7, move: [[0, 0, 0], [1.4, 0, 0], [2.2, 90, 30]] }),
      ob(pedrin(740, 780, 1.35, "parado"), { em: 2.0, dura: 0.9 }),
    ], faisca: [[0, 500, 400, 0, 1], [3.0, 500, 400, 1, 1]] };
  },
  pedrinAbraco(r, a) {
    return { fundo: "papel", objetos: [
      ob(chao(800, ...CH()), { em: 0, dura: 0.5 }),
      ob(pedrin(500, 800, 1.7, "abraca"), { em: 0.2, dura: 1.3, guia: true }),
      ob(bola(500, 800 - 128 * 1.7, 50), { em: 1.2, dura: 0.7 }),
      ob([...estrela(250, 330, 22), ...estrela(780, 300, 18), ...estrela(700, 500, 14), ...estrela(300, 520, 14)], { em: 1.8, dura: 0.6 }),
    ], faisca: [[0, 850, 420, 0, 1], [1.6, 850, 420, 1, 1.2]] };
  },
  pedrinDuvida(r, a) {
    const hz = 470;
    return { fundo: "papel", objetos: [
      ob([L([[160, 900], [470, hz]]), L([[840, 900], [530, hz]]), L([[470, hz], [530, hz]])], { em: 0, dura: 1.0 }),
      ob([F(arco(500, 250, 130, 180, 360, 16), COR.celeste), F(rr(370, 250, 260, 120, 8), COR.celeste), L([[500, 120], [500, 250]], { larg: 4 }), ...[410, 470, 530, 590].map((x) => L([[x, 255], [x, 360]], { larg: 4 }))], { z: 1.5, em: 1.0, dura: 0.9 }),
      ob([...pedrin(500, 840, 0.95, "parado"), ...bola(550, 818, 20)], { em: 1.8, dura: 0.8, move: [[0, 0, 0], [1.0, 0, 0], [3.4, 6, -150]] }),
    ], faisca: [[0, 800, 560, 0, 1], [3.2, 800, 560, 0, 1]], cam: [[0, 0, 0, 1], [4, 0, -40, 1.08]] };
  },
  pedrinJogador(r, a) {
    const hz = 640, objetos = [
      ob([F(circulo(500, hz, 150, 30), COR.amarelo), ...[200, 225, 250, 270, 290, 315, 340].map((g) => L([[500 + Math.cos(rad(g)) * 190, hz + Math.sin(rad(g)) * 190], [500 + Math.cos(rad(g)) * 250, hz + Math.sin(rad(g)) * 250]]))], { em: 1.3, dura: 1.3 }),
      ob([F([[VIS.x0 - 60, hz], [VIS.x1 + 60, hz], [VIS.x1 + 60, VIS.y1 + 60], [VIS.x0 - 60, VIS.y1 + 60]], "#efe6cc")], { em: 1.0, dura: 0.5 }),
      ob([...pedrin(500, hz + 150, 1.5, "festa"), ...bola(640, hz + 120, 34)], { em: 2.1, dura: 1.0 }),
      ob([...estrela(250, 330, 20), ...estrela(790, 300, 16), ...estrela(700, 160, 14), ...estrela(320, 180, 12)], { em: 3.0, dura: 0.5 }),
    ];
    return { fundo: "ceu", objetos, faisca: [[0, 880, hz + 100, 0, 1], [2.6, 880, hz + 100, 0, 1], [3.0, 880, hz + 100, 1, 1.2]] };
  },
  pedrinFim(r, a) {
    return { fundo: "papel", objetos: [
      ob(chao(800, ...CH()), { em: 0, dura: 0.5 }),
      ob(pedrin(300, 800, 1.2, "festa"), { em: 0.2, dura: 1.0 }),
      ob([F([[520, 520], [760, 450], [660, 560], [620, 640], [600, 570]], COR.azul), L([[600, 570], [760, 450]], { larg: 5 }), L([[620, 640], [660, 560]], { larg: 5 })], { em: 1.4, dura: 0.9 }),
      ob([...[0, 1, 2, 3, 4, 5].map((k) => L([[470 - k * 34, 640 + k * 4], [450 - k * 34, 640 + k * 4]], { larg: 5, tinta: COR.guia }))], { em: 2.1, dura: 0.5 }),
      ob([F(circulo(830, 640, 56, 20), COR.rosa), L([[830, 610], [830, 670]], { larg: 9 }), L([[800, 640], [860, 640]], { larg: 9 })], { em: 2.4, dura: 0.7 }),
    ], faisca: [[0, 880, 400, 0, 1], [2.2, 880, 400, 1, 1.2]] };
  },
});
