// Episódio 2: Você reinvestiu tudo (usa lib.js). R$ 70 → 14 chaveiros premium a R$ 5 → vendidos a R$ 9 → R$ 126.
// Gancho: encomenda de 100 chaveiros (R$ 900, custo R$ 500) com R$ 126 no caixa.

const PEGS = []; for (let r = 0; r < 2; r++) for (let i = 0; i < 7; i++) PEGS.push([592 + i * 46, 640 + r * 150]);
let VISOR = () => "0,00";
let EV_SINO = () => 0;
let PROT, FORN_CH, VENDAS = [], NB = [], EXEC_CH;
const N = 14, PRECO = 9, CUSTO = 5;
const EXEC = { pele: "#e0b08b", cabelo: "careca", corCabelo: "#b8b8c0", camisa: "#e8e8ee", calca: "#2a3550", sapato: "#1b1b1b", terno: true, gravata: "#d63c3c", oculos: true, larg: 1.1, seed: 14, s: 1.05 };
const NAO_COMPRAM = [
  { ...CLIENTES[1], camisa: "#e2533a", oculos: false, seed: 21 },
  { ...CLIENTES[3], camisa: "#35c4d8", seed: 22 },
  { ...CLIENTES[6], camisa: "#7c5cd6", barba: false, seed: 23 },
];
const clienteDe = (k) => k < 10 ? CLIENTES[k] : { ...CLIENTES[k - 10], camisa: ["#ff8f3a", "#3fbf5f", "#c45f2a", "#4fc3ff"][k - 10], seed: 30 + k };

// ---------- chaveiro premium ----------
function chaveiroPremium(x, y, i, ang = 0, s = 1) {
  const c = ctx; c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s);
  c.lineWidth = 4; c.strokeStyle = "#9aa3b0"; c.beginPath(); c.arc(0, 8, 9, 0, 7); c.stroke();
  c.beginPath(); c.moveTo(0, 17); c.lineTo(0, 32); c.stroke();
  c.translate(0, 54);
  const ouro = i % 3 !== 1, cor = ouro ? "#ffcf3a" : "#d6dde8", k = i % 4; let p;
  if (k === 0) { const pts = []; for (let j = 0; j < 10; j++) { const a = -Math.PI / 2 + j * Math.PI / 5, r = j % 2 ? 11 : 25; pts.push([Math.cos(a) * r, Math.sin(a) * r]); } p = P.poly(pts); }
  else if (k === 1) p = P.poly([[0, -24], [19, -8], [12, 20], [-12, 20], [-19, -8]]);
  else if (k === 2) { p = new Path2D(); p.moveTo(0, 22); p.bezierCurveTo(-34, -2, -16, -28, 0, -10); p.bezierCurveTo(16, -28, 34, -2, 0, 22); }
  else p = P.poly([[-20, 16], [-22, -14], [-10, -2], [0, -22], [10, -2], [22, -14], [20, 16]]);
  forma(p, cor, 4); crescente(p, -5, -5, ouro ? "rgba(150,90,0,.35)" : "rgba(60,80,120,.3)");
  c.fillStyle = "rgba(255,255,255,.75)"; c.fill(P.el(-7, -8, 5, 3, -.5));
  if (k === 1) { c.strokeStyle = "rgba(120,80,0,.45)"; c.lineWidth = 2; c.beginPath(); c.moveTo(-19, -8); c.lineTo(19, -8); c.moveTo(0, -24); c.lineTo(-6, -8); c.lineTo(0, 20); c.moveTo(0, -24); c.lineTo(6, -8); c.lineTo(0, 20); c.stroke(); }
  if (k === 3) { for (const px of [-12, 0, 12]) { c.fillStyle = ["#ff4f6d", "#4fc3ff", "#7be36b"][(px + 12) / 12]; c.fill(P.el(px, 6, 4, 4)); } }
  const sp = Math.pow(Math.max(0, Math.sin(T * 3 + i * 1.7)), 6);
  if (sp > .05) { c.globalAlpha = sp; c.fillStyle = "#fff"; c.fill(P.poly([[0, -16 * sp - 4], [3, -3], [14 * sp + 4, 0], [3, 3], [0, 16 * sp + 4], [-3, 3], [-14 * sp - 4, 0], [-3, -3]])); c.globalAlpha = 1; }
  c.restore();
}
function caixaPrem(x, y, s, n) {
  const c = ctx; c.save(); c.translate(x, y); c.scale(s, s);
  const b = P.rr(-80, -110, 160, 110, 6); forma(b, "#2a3550"); crescente(b, -14, 0, "rgba(0,0,0,.25)");
  forma(P.poly([[-80, -110], [-40, -140], [40, -140], [80, -110]]), "#3a4770", 5);
  texto("PREMIUM", 0, -56, { tam: 30, cor: "#ffd23f", borda: null });
  for (let i = 0; i < n; i++) chaveiroPremium(-70 + (i % 7) * 23, -178 + Math.floor(i / 7) * 14, i, (i % 3 - 1) * .3, .5);
  c.restore();
}
function lampadaIdeia(x, y, k) {
  if (k <= 0) return; const c = ctx; c.save(); c.translate(x, y); const s = eob(Math.min(1, k * 2.5)); c.scale(s, s);
  c.globalCompositeOperation = "lighter"; const g = c.createRadialGradient(0, 0, 0, 0, 0, 170); g.addColorStop(0, "rgba(255,230,120,.6)"); g.addColorStop(1, "rgba(255,230,120,0)"); c.fillStyle = g; c.fillRect(-170, -170, 340, 340); c.globalCompositeOperation = "source-over";
  c.lineWidth = 8; c.strokeStyle = "#ffd23f"; c.lineCap = "round";
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + T * .9; c.beginPath(); c.moveTo(Math.cos(a) * 68, Math.sin(a) * 68); c.lineTo(Math.cos(a) * 96, Math.sin(a) * 96); c.stroke(); }
  forma(P.el(0, -6, 42, 44), "#fff3a0"); forma(P.rr(-20, 34, 40, 28, 7), "#b8b8c0");
  c.lineWidth = 4; c.strokeStyle = "#e09a1a"; c.beginPath(); c.moveTo(-10, 30); c.lineTo(-10, 4); c.lineTo(0, 16); c.lineTo(10, 4); c.lineTo(10, 30); c.stroke();
  c.fillStyle = "rgba(255,255,255,.7)"; c.fill(P.el(-17, -20, 8, 12, -.5));
  c.restore();
}
function pasta(x, y, ang = 0) { const c = ctx; c.save(); c.translate(x, y); c.rotate(ang); forma(P.rr(-34, -24, 68, 50, 8), "#8a5a3b"); forma(P.rr(-12, -34, 24, 14, 5), "#6b3e1a", 4); forma(P.rr(-5, -4, 10, 10, 2), "#ffd23f", 3); c.restore(); }

// ---------- linha do tempo ----------
function montarEp() {
  const g = F("gancho"), fo = F("fornecedor"), co = F("compra"), vi = F("vitrine"), vz = F("vazio"), id = F("ideia"), ve = F("vendas"), es = F("esgotou"), re = F("resultado"), en = F("encomenda"), fi = F("final");
  PROT = [[0, 560, 1560], [fo - .8, 560, 1560], [fo - .2, 660, 1560], [vz, 660, 1560]];
  FORN_CH = [[fo - .6, 140, 1470], [fo + .9, 380, 1570], [co + 2.9, 380, 1570], [co + 3.2, 370, 1570], [co + 4.5, 140, 1470]];
  // clientes que olham o preço e vão embora
  NB = [0, 1, 2].map((i) => { const a = vz + .35 + i * 1.0; return { i, L: NAO_COMPRAM[i], tEnt: a, ch: [[a, 140, 1470], [a + 1.0, 540 + i * 170, 1560 + i * 55], [a + 2.0, 540 + i * 170, 1560 + i * 55], [a + 2.9, 140, 1470]], sai: a + 2.9, tOlha: a + 1.1 }; });
  // 14 vendas: a primeira com calma, depois acelerando
  const p0 = ve + .2, p1 = es - .15; VENDAS = [];
  for (let k = 0; k < N; k++) {
    const u = k === 0 ? 0 : .1 + .9 * Math.pow(k / (N - 1), .9), tp = lerp(p0, p1, u), rap = k === 0 ? 1 : .6;
    const lane = 1560 + (k % 3) * 40, [px] = PEGS[k]; const d1 = 1.05 * rap, d2 = .7 * rap, pega = .3 * rap, d3 = 1.0 * rap, tEnt = tp - d2 - pega - d1;
    VENDAS.push({ k, tp, tEnt, tPega: tEnt + d1, ch: [[tEnt, 140, 1470], [tEnt + d1, px + 10, lane], [tEnt + d1 + pega, px + 10, lane], [tp, 700, lane + 20], [tp + .35 * rap, 700, lane + 20], [tp + .35 * rap + d3, 140, 1470]], sai: tp + .35 * rap + d3 });
  }
  EXEC_CH = [[en - .2, 140, 1470], [en + 1.4, 600, 1590], [fi + 20, 600, 1590]];
  // interface
  const din = [[0, 70], [co + 1.9, 0]], est = [[co + 2.1, N]], ven = [], luc = [];
  const chips = [[co + 1.9, 0, "−R$ 70", "#e3342f"], [co + 2.1, 1, "+14", "#f0a020"]];
  VENDAS.forEach((v, i) => { din.push([v.tp + .15, PRECO * (i + 1)]); est.push([v.tp + .15, N - 1 - i]); ven.push([v.tp + .15, PRECO * (i + 1)]); luc.push([v.tp + .15, 20 + (PRECO - CUSTO) * (i + 1)]); if (i % 4 === 0 || i === N - 1) chips.push([v.tp + .15, 0, "+R$ 9", "#38c172"]); });
  chips.push([re + 1.5, 3, "+R$ 56", "#38c172"]);
  HUD = { din: contador(din, 70), est: contador(est, 0), ven: contador(ven, 0), luc: contador(luc, 20), chips, rot: ["DINHEIRO", "ESTOQUE", "VENDAS HOJE", "LUCRO TOTAL"], dia: { txt: "DIA 2", fim: fi - .6 }, pulso: re + 2.2 };
  VISOR = (t) => { const v = VENDAS.filter((x) => t >= x.tp + .15).length; return v ? (v * PRECO).toFixed(2).replace(".", ",") : "0,00"; };
  const m = palavra("final", "mas");
  EV = {
    sino: [fo - .7, co + 4.3, ...NB.map((n) => n.tEnt - .1), ...NB.map((n) => n.sai - .5), ...VENDAS.map((v) => v.tEnt - .1), en - .3],
    caixa: VENDAS.map((v) => v.tp + .15),
    cedulas: [co + 1.25, co + 1.4, co + 1.55],
    clique: [co + 1.0, palavra("final", "aceitar")?.t0 ?? fi + 3, palavra("final", "continuar")?.t0 ?? fi + 4.5],
    pop: PEGS.map((_, i) => vi + .5 + i * .17),
    carimbo: [vi + 3.0, id + 1.5, es + .05],
    placa: [vz + .1],
    grilos: [vz + .5, id],
    feno: [vz + 1.9],
    whoosh: [fo + 1.0, co, vz - .3, en - .6, fi + 3.0],
    festa: [es + .2, re + .1],
    pulo: [es + .25, re + .4, re + 1.1],
    brilho: [id + .3],
    multidao: [ve - 1.5, es + .3],
    tiquetaque: [m?.t0 ?? fi + 3.2, TEMPO.total - 2.4],
    fim: [TEMPO.total - 2.4],
    tranco: [co + 1.6, es + .05, re + .3],
    secoes: { neg: fo - .3, ven: id + 1.6, fes: es, son: en - .1, quieto: [[vz + .1, id + 1.6]] },
  };
  EV_SINO = (t) => { let k = 0; for (const a of EV.sino) if (t >= a) k = Math.max(k, 1 - (t - a) / 1.2); return Math.max(0, k); };
}
window.eventos = () => EV;

// ---------- câmera ----------
function cameraEp(t) {
  const g = F("gancho"), fo = F("fornecedor"), co = F("compra"), vi = F("vitrine"), vz = F("vazio"), id = F("ideia"), es = F("esgotou"), re = F("resultado"), en = F("encomenda"), fi = F("final");
  const ch = [
    [0, 1.85, 560, 1190], [g + 2.2, 1.7, 580, 1190], [fo + .2, 1.12, 470, 1130], [co + 2.4, 1.25, 500, 1150], [vi + .3, 1.05, 600, 1050], [vz - .1, 1.12, 590, 1090],
    [id + .3, 1.3, 860, 1040], [id + 2.6, 1.1, 640, 1060], [es + .3, 1.0, 540, 1000], [es + 1.4, 1.2, 760, 1000], [re + 2.0, 1.15, 700, 1010],
    [en - .2, 1.1, 560, 1100], [en + 1.8, 1.2, 620, 1190], [fi + .5, 1.0, 540, 1000],
  ];
  let i = 0; while (i < ch.length - 1 && ch[i + 1][0] <= t) i++;
  const a = ch[i], b = ch[Math.min(i + 1, ch.length - 1)]; const k = b === a ? 0 : ease(lin(t, a[0], b[0]));
  let z = lerp(a[1], b[1], k), x = lerp(a[2], b[2], k), y = lerp(a[3], b[3], k);
  z *= 1 + Math.sin(t * .7) * .006; x += Math.sin(t * .5) * 4; y += Math.cos(t * .43) * 3;
  const mx = W / (2 * z), my = H / (2 * z); x = cl(x, mx, W - mx); y = cl(y, my, H - my);
  let sh = 0; for (const a of EV.tranco) sh += Math.max(0, 1 - (t - a) / .3) * (t >= a ? 1 : 0);
  return { z, x: x + Math.sin(t * 90) * 10 * sh, y: y + Math.cos(t * 77) * 8 * sh };
}

// ---------- loja por dentro ----------
function interiorEp(t) {
  const c = ctx, g = F("gancho"), fo = F("fornecedor"), co = F("compra"), vi = F("vitrine"), vz = F("vazio"), id = F("ideia"), ve = F("vendas"), es = F("esgotou"), re = F("resultado"), en = F("encomenda"), fi = F("final");
  ruaJanela(t); c.drawImage(FUNDO, 0, 0);
  let ab = 0; const abre = (a) => { ab = Math.max(ab, Math.sin(cl((t - a) / 1.1) * Math.PI)); };
  abre(fo - .9); abre(co + 3.9); NB.forEach((n) => { abre(n.tEnt - .3); abre(n.sai - .7); }); VENDAS.forEach((v) => { abre(v.tEnt - .3); abre(v.sai - .7); }); abre(en - .5);
  porta(t, ab, ease(lin(t, vz + .05, vz + .4)));
  relogio(t, 8 * ease(lin(t, vz + .2, vz + 3.6)) + 2 * ease(lin(t, ve, es)));
  lampada(t, 1); planta(t, 1);
  // chaveiros premium no expositor
  PEGS.forEach(([x, y], i) => {
    const tc = vi + .5 + i * .17, k = lin(t, tc - .35, tc), v = VENDAS[i]; if (v && t > v.tPega) return; if (k <= 0) return;
    if (k < 1) { chaveiroPremium(lerp(470, x, k), lerp(1480, y, k) - Math.sin(k * Math.PI) * 220, i, k * 8, .78); return; }
    const sw = Math.sin((t - tc) * 9) * Math.exp(-(t - tc) * 2.5) * .5 + Math.sin(t * 1.5 + i) * .03; chaveiroPremium(x, y + 4, i, sw, .78);
  });
  const kp = lin(t, vi + 3.0, vi + 3.25);
  if (kp > 0) { c.save(); c.translate(900, 610); c.rotate(.12); const s = kp < 1 ? 2.2 - 1.2 * eout(kp) : 1; c.scale(s, s); forma(P.rr(-60, -36, 120, 72, 14), "#ff5a5f", 5); texto("R$ 9", 0, 3, { tam: 40, cor: "#fff", lw: 7 }); c.restore(); }
  // placa EDIÇÃO LIMITADA + contador RESTAM
  const ks = lin(t, id + 1.5, id + 1.75);
  if (ks > 0) { c.save(); c.translate(720, 548); c.rotate(-.04); const s = ks < 1 ? 2.4 - 1.4 * eout(ks) : 1; c.scale(s, s); forma(P.rr(-196, -42, 392, 84, 14), "#e3342f", 6); texto("EDIÇÃO LIMITADA", 0, -8, { tam: 42, cor: "#fff", lw: 7 }); texto("SÓ 14 PEÇAS", 0, 26, { tam: 26, fonte: "Fredoka", peso: 700, cor: "#ffe9a8", borda: null }); c.restore(); }
  const rest = N - VENDAS.filter((v) => t >= v.tPega).length;
  if (ks > 0 && t < es + .6) { c.save(); c.translate(860, 930); const pulso = VENDAS.some((v) => t >= v.tPega && t < v.tPega + .2) ? 1.15 : 1; c.scale(pulso, pulso); forma(P.rr(-90, -26, 180, 52, 26), "#1e2a4a", 5); texto("RESTAM", -36, 0, { tam: 24, fonte: "Fredoka", peso: 700, cor: "#b9c6ff", borda: null }); texto(String(rest), 52, 2, { tam: 40, cor: rest <= 3 ? "#ff6b5e" : "#ffd23f", lw: 6 }); c.restore(); }
  // fornecedor, carrinho e caixa
  const saiu = co + 4.5;
  if (t > fo - .6 && t < saiu) {
    const m = mover(t, FORN_CH, 1), dir = t > co + 2.9 ? -1 : 1, segurando = t < co + 2.6;
    if (segurando) { carrinho(m.x + 90, m.y); caixaPrem(m.x + 100, m.y - 60, .9, N); }
    const fala = t > fo + .4 && t < co - .2;
    figura(FORN, { x: m.x, y: m.y, passo: m.passo, dir, expr: fala ? "feliz" : t > co + 1.5 ? "rindo" : "feliz", bD: segurando ? .6 : t > co + 1.2 && t < co + 2.2 ? 1.0 : .15, bE: t > co + 2.9 && t < co + 3.5 ? 2.6 + Math.sin(t * 14) * .3 : .15, fala: fala ? Math.abs(Math.sin(t * 13)) : 0 });
    balao(m.x + 40, m.y - 560, "PREMIUM! R$ 5 cada", lin(t, fo + .2, fo + .45) * (1 - lin(t, fo + 1.2, fo + 1.4)), { rabo: [-1, 1] });
  }
  if (t >= co + 2.6) caixaPrem(470, 1640, .9, Math.max(0, N - Math.floor(lin(t, vi + .45, vi + .7 + (N - 1) * .17) * N + 1e-6)));
  // cartão da oferta
  const ko = lin(t, fo + 1.5, fo + 1.9) * (1 - lin(t, co + 1.3, co + 1.6)), clic = pulse(t, co + 1.0, .25);
  cartao(540, 600, 640, 330, ko, (c, w, h) => {
    texto("NOVIDADE: PREMIUM", 0, -h / 2 + 46, { tam: 36, cor: "#ff5a5f", borda: null });
    for (let i = 0; i < 5; i++) chaveiroPremium(-150 + i * 75, -h / 2 + 64, i, (i - 2) * .1, .85);
    texto("14 × R$ 5", 0, 24, { tam: 64, cor: OL, borda: null });
    c.save(); c.translate(0, 110); c.scale(1 - clic * .08, 1 - clic * .08); forma(P.rr(-230, -36, 460, 76, 38), clic > 0 ? "#2a9d5a" : "#38c172", 5); texto("COMPRAR TUDO: R$ 70", 0, 4, { tam: 36, cor: "#fff", lw: 7 }); c.restore();
  });
  const km = lin(t, vi + 3.4, vi + 3.7) * (1 - lin(t, vz - .5, vz - .2));
  cartao(540, 520, 620, 200, km, (c) => { texto("COMPRA R$ 5", -155, -40, { tam: 40, cor: "#e3342f", borda: null }); texto("VENDE R$ 9", 155, -40, { tam: 40, cor: "#38c172", borda: null }); texto("+R$ 4 POR CHAVEIRO", 0, 40, { tam: 50, cor: OL, borda: null }); });
  // quem fica atrás do balcão
  const atras = t >= vz, pm = mover(t, PROT, 1);
  const comemora = t >= es && t < re + 3.2;
  if (atras) {
    const pagando = VENDAS.find((v) => t > v.tp - .2 && t < v.tp + .5);
    const pu = comemora ? Math.abs(Math.sin((t - es) * 5.5)) * (t < re + 2.6 ? 120 : 30) : 0;
    const eh = t > en - .3 ? "surpreso" : t >= id && t < id + 1.5 ? (t < id + .35 ? "surpreso" : "euforico") : t < id ? "preocupado" : comemora ? "euforico" : pagando ? "rindo" : "feliz";
    const expr = eh === "rindo" ? "rindo" : eh;
    figura(EU, { x: 975, y: 1300, dir: -1, expr, pulo: pu, bE: comemora ? 2.7 + Math.sin(t * 11) * .2 : (t >= id && t < id + 1.4 ? 2.7 : pagando ? 1.3 : .2), bD: comemora ? 2.7 + Math.cos(t * 11) * .2 : .2, olhar: t < id ? [-1, .3] : [-1, 0], sq: comemora ? -Math.sin((t - es) * 11) * .04 : 0 });
    lampadaIdeia(975, 790, lin(t, id + .2, id + .5) * (1 - lin(t, id + 1.5, id + 1.8)));
  }
  balcao(); caixaRegistradora(t, Math.max(0, ...VENDAS.map((v) => Math.sin(cl((t - v.tp) / .5) * Math.PI))));
  if (!atras) {
    let expr = "determinado", bE = .15, bD = .15, olhar = [0, 0], dir = pm.dir, item = null;
    if (t < fo - .8) { expr = t < g + 1.6 ? "determinado" : "euforico"; bD = 2.6 + Math.sin(t * 6) * .08; item = "dinheiro"; dir = 1; }
    else if (t < co) { expr = t < fo + .8 ? "surpreso" : "feliz"; olhar = [-1, 0]; dir = -1; }
    else if (t < co + 2.4) { expr = t < co + 1.1 ? "pensativo" : "preocupado"; olhar = t < co + 1.1 ? [.6, -1] : [-1, 0]; bE = t > co + 1.1 && t < co + 1.7 ? 1.4 : .15; dir = -1; }
    else if (t < vi) { expr = "preocupado"; olhar = [-.2, .5]; dir = -1; }
    else { expr = "determinado"; const k = t - vi; if (k > .3 && k < 3.2) { bE = 2.4 + Math.sin(t * 12) * .25; bD = 2.4 + Math.cos(t * 12) * .25; olhar = [0, -1]; } dir = pm.dir; }
    const maos = figura(EU, { x: pm.x, y: pm.y, passo: pm.passo, dir, expr, bE, bD, olhar });
    if (item) { [[50, -.35], [10, -.1], [10, .15]].forEach(([v, a], i) => cedula(maos.d.x + i * 10, maos.d.y - 34 - i * 8, v, a + Math.sin(t * 6) * .04, 1.0)); }
    if (t < fo - .8) balao(pm.x - 70, pm.y - 640, "Tudo!", lin(t, g + 1.3, g + 1.6) * (1 - lin(t, fo - 1.0, fo - .8)));
    balao(pm.x + 30, pm.y - 610, "70 ÷ 5 = 14", lin(t, co + .1, co + .4) * (1 - lin(t, co + 1.1, co + 1.3)), { pensa: true, rabo: [1, 1] });
    balao(pm.x + 10, pm.y - 600, "E agora?", lin(t, co + 2.5, co + 2.8) * (1 - lin(t, vi - .1, vi + .2)));
  }
  // cédulas para o fornecedor
  [0, 1, 2].forEach((i) => { const a = co + 1.25 + i * .15, k = lin(t, a, a + .55); if (k <= 0 || k >= 1) return; cedula(lerp(650, 420, k), lerp(1240, 1180, k) - Math.sin(k * Math.PI) * 160, [50, 10, 10][i], k * 6, .9); });
  // quem olha o preço e vai embora
  for (const n of NB) {
    if (!(t > n.tEnt - .05 && t < n.sai)) continue; const m = mover(t, n.ch, 1); const olha = t > n.tOlha - .3 && t < n.tOlha + .9;
    figura(n.L, { x: m.x, y: m.y, s: (n.L.s || 1), passo: m.passo, dir: t > n.tOlha + .8 ? -1 : m.dir, expr: olha ? "surpreso" : t > n.tOlha + .8 ? "preocupado" : "feliz", olhar: [1, -.5], bE: olha ? 1.0 : .15, inc: olha ? .1 : 0 });
    balao(m.x, m.y - 590, ["R$ 9?!", "Tá caro!", "Volto depois..."][n.i], lin(t, n.tOlha, n.tOlha + .2) * (1 - lin(t, n.tOlha + .8, n.tOlha + 1.0)), { tam: 40 });
  }
  feno(t, vz + 1.9, vz + 3.9);
  // clientes da fila
  const ordem = VENDAS.filter((v) => t > v.tEnt - .05 && t < v.sai).sort((a, b) => a.ch[1][2] - b.ch[1][2]);
  for (const v of ordem) {
    const L = clienteDe(v.k), m = mover(t, v.ch, 1), entra = lin(t, v.tEnt - .05, v.tEnt + .35), sai = 1 - lin(t, v.sai - .35, v.sai), s = (L.s || 1) * lerp(.82, 1, Math.min(entra, sai));
    const pega = t > v.tPega - .15 && t < v.tPega + .2, paga = t > v.tp - .1 && t < v.tp + .3, comItem = t > v.tPega;
    const maos = figura(L, { x: m.x, y: m.y, s, passo: m.passo, dir: m.dir, expr: comItem ? "rindo" : "feliz", bD: pega ? 2.6 : paga ? 1.5 : comItem ? .5 : .15, olhar: pega ? [0, -1] : [m.dir, 0] });
    if (comItem) chaveiroPremium(maos.d.x, maos.d.y - 30, v.k, Math.sin(t * 8) * .3, .7);
    if (paga) { const q = lin(t, v.tp - .1, v.tp + .2); moeda(lerp(maos.d.x, 842, q), lerp(maos.d.y, 1000, q) - Math.sin(q * Math.PI) * 80, t * 12, 1.2); }
    if (v.k === 0 || v.k === 5 || v.k === 10) balao(m.x, m.y - 590 * s, ["Edição limitada?!", "Eu quero!", "O último!"][v.k / 5], lin(t, v.tPega - .1, v.tPega + .15) * (1 - lin(t, v.tp - .1, v.tp + .1)), { tam: 38 });
    const kk = lin(t, v.tp + .15, v.tp + 1.1);
    if (kk > 0 && kk < 1) { c.save(); c.globalAlpha = 1 - lin(kk, .6, 1); texto("+R$ 9", 842, 900 - eout(kk) * 120, { tam: 56, cor: "#5bd66b", lw: 10 }); c.restore(); }
  }
  // o homem de terno
  if (t > en - .25) {
    const m = mover(t, EXEC_CH, 1), fala = t > en + 1.5 && t < en + 3.2;
    const maos = figura(EXEC, { x: m.x, y: m.y, s: EXEC.s, passo: m.passo, dir: m.dir, expr: fala ? "feliz" : "determinado", bD: 1.0, bE: .15, fala: fala ? Math.abs(Math.sin(t * 12)) : 0, olhar: [1, 0] });
    pasta(maos.d.x + 6, maos.d.y + 20, -.1);
    balao(m.x + 40, m.y - 600, "Quero 100!", lin(t, en + 1.6, en + 1.9) * (1 - lin(t, en + 3.3, en + 3.5)), { rabo: [-1, 1] });
  }
  // ESGOTADO e festa
  const ke = lin(t, es + .05, es + .3);
  if (ke > 0 && t < re - .1) { c.save(); c.translate(720, 740); c.rotate(-.18); const s = ke < 1 ? 2.4 - 1.4 * eout(ke) : 1; c.scale(s, s); c.globalAlpha = Math.min(1, ke * 3); c.lineWidth = 10; c.strokeStyle = "#e3342f"; c.strokeRect(-200, -60, 400, 120); texto("ESGOTADO!", 0, 6, { tam: 82, cor: "#e3342f", borda: "#fff", lw: 8 }); c.restore(); }
  balao(980, 760, "ESGOTOU DE NOVO!", lin(t, es + .4, es + .7) * (1 - lin(t, re - .2, re)), { rabo: [1, 1], cor: "#ffd23f", tam: 38 });
  confete(t, es + .05); confete(t, re + .2, 2); chuvaDinheiro(t, re + .3);
  const kv = lin(t, VENDAS[1].tEnt, VENDAS[1].tEnt + .3) * (1 - lin(t, es - .1, es + .2));
  if (kv > 0) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = kv; forma(P.rr(W - 210, 330, 176, 64, 32), "#ffd23f", 5); texto("⏩ x4", W - 122, 364, { tam: 40, cor: OL, borda: null }); c.restore(); }
}
function resultadoEp(t) {
  const re = F("resultado"), en = F("encomenda"), k = lin(t, re + .1, re + .45) * (1 - lin(t, en - .5, en - .15)); if (k <= 0) return;
  const tI = palavra("resultado", "investiu")?.t0 ?? re, tL = palavra("resultado", "lucro")?.t0 ?? re + 2.5;
  cartao(540, 640, 820, 520, k, (c, w, h) => {
    texto("RESULTADO DO DIA 2", 0, -h / 2 + 48, { tam: 40, cor: "#ff5a5f", borda: null });
    const a = eob(lin(t, tI, tI + .35)), b = eob(lin(t, tI + .6, tI + .95)), d = eob(lin(t, tL - .2, tL + .2)), e = eob(lin(t, tL + .5, tL + .9));
    c.save(); c.globalAlpha = Math.min(1, a); texto("INVESTIU R$ 70", 0, -110, { tam: 46, cor: "#e3342f", borda: null }); c.restore();
    c.save(); c.translate(0, -44); c.scale(b, b); texto("VENDEU 14 × R$ 9 = R$ 126", 0, 0, { tam: 46, cor: "#2f8f3f", borda: null }); c.restore();
    c.fillStyle = "rgba(43,26,16,.2)"; c.fillRect(-w / 2 + 50, 4, w - 100, 5);
    c.save(); c.translate(0, 98); c.scale(Math.max(.001, e), Math.max(.001, e)); forma(P.rr(-310, -50, 620, 100, 50), "#38c172", 5); texto("LUCRO DO DIA: R$ 56", 0, 4, { tam: 54, cor: "#fff", lw: 8 }); c.restore();
    c.save(); c.globalAlpha = Math.min(1, Math.max(0, e)); texto("LUCRO TOTAL: R$ 20 + R$ 56 = R$ 76", 0, 186, { tam: 36, cor: OL, borda: null }); c.restore();
  });
}
function encomendaEp(t) {
  const en = F("encomenda"), fi = F("final"), m = palavra("final", "mas")?.t0 ?? fi + 3.2;
  const k = lin(t, en + 1.5, en + 1.85) * (1 - lin(t, m - .3, m)); if (k <= 0) return;
  const kp = eob(lin(t, en + 3.0, en + 3.4));
  cartao(540, 540, 760, 400, k, (c, w, h) => {
    texto("ENCOMENDA DE EMPRESA", 0, -h / 2 + 46, { tam: 38, cor: "#ff5a5f", borda: null });
    texto("100 × R$ 9", 0, -30, { tam: 76, cor: OL, borda: null });
    c.save(); c.translate(0, 84); c.scale(Math.max(.001, kp), Math.max(.001, kp)); forma(P.rr(-250, -46, 500, 92, 46), "#38c172", 5); texto("= R$ 900", 0, 4, { tam: 62, cor: "#fff", lw: 9 }); c.restore();
  });
}
function decisaoEp(t) {
  const c = ctx, fi = F("final"), tm = palavra("final", "mas")?.t0 ?? fi + 3.2, k = lin(t, tm - .1, tm + .4);
  if (k > 0) {
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = `rgba(20,16,40,${.6 * k})`; c.fillRect(0, 0, W, H);
    const s = eob(k); c.translate(540, 960); c.scale(s, s);
    forma(P.rr(-460, -440, 920, 880, 44), "#1e2a4a", 7); forma(P.rr(-460, -452, 920, 880, 44), "#2b3a66", 7);
    forma(P.rr(-180, -490, 360, 76, 38), "#ff5a5f", 6); texto("DECISÃO", 0, -450, { tam: 50, cor: "#fff", lw: 8 });
    const k1 = eob(lin(t, tm + .1, tm + .4)), k2 = eob(lin(t, tm + .9, tm + 1.2)), k3 = eob(lin(t, tm + 1.7, tm + 2.0));
    c.save(); c.globalAlpha = Math.min(1, k1); texto("CUSTO DA ENCOMENDA: R$ 500", 0, -350, { tam: 44, cor: "#fff", lw: 8 }); c.restore();
    c.save(); c.globalAlpha = Math.min(1, k2); texto("VOCÊ TEM: R$ 126", 0, -290, { tam: 50, cor: "#ffd23f", lw: 9 }); c.restore();
    c.save(); c.translate(0, -222); c.scale(Math.max(.001, k3), Math.max(.001, k3)); forma(P.rr(-240, -34, 480, 68, 34), "#e3342f", 5); texto("FALTAM R$ 374", 0, 3, { tam: 44, cor: "#fff", lw: 8 }); c.restore();
    const ta = palavra("final", "aceitar")?.t0 ?? tm + 1, tc = palavra("final", "continuar")?.t0 ?? tm + 2.5;
    const bt = (y, cor, txt, sub, i, ic) => {
      const ativo = (i === 0 && t > ta - .1 && t < tc - .1) || (i === 1 && t > tc - .1), p = ativo ? 1 + .05 * Math.sin(t * 10) : 1;
      c.save(); c.translate(0, y); c.scale(p, p); forma(P.rr(-380, -72, 760, 168, 40), shade(cor, -.35), 6); forma(P.rr(-380, -84, 760, 168, 40), cor, 6);
      c.fillStyle = "rgba(255,255,255,.18)"; c.fill(P.rr(-366, -76, 732, 64, 32)); c.save(); c.translate(-290, 0); ic(); c.restore();
      texto(txt, 50, -14, { tam: 50, cor: "#fff", lw: 9 }); texto(sub, 50, 40, { tam: 30, fonte: "Fredoka", peso: 700, cor: "#fff", borda: null }); c.restore();
    };
    bt(-50, "#38c172", "ACEITAR A ENCOMENDA", "arrisca tudo por R$ 900", 0, () => { pasta(0, 0, 0); });
    bt(170, "#3b82f6", "CONTINUAR PEQUENO", "sem risco, lucro menor", 1, () => { forma(P.el(0, 0, 54, 44), "#ff8fb1", 5); forma(P.el(44, -4, 16, 14), "#ff8fb1", 4); c.fillStyle = OL; c.fill(P.el(16, -12, 5, 5)); c.fillRect(-12, -46, 30, 8); });
    const cy = lerp(-50, 170, ease(lin(t, tc - .4, tc))) + Math.sin(t * 5) * 6, cx = 300 + Math.cos(t * 4) * 8;
    if (t > ta - .4) { c.save(); c.translate(cx, cy + 20); c.rotate(-.3); forma(P.poly([[0, 0], [0, 70], [18, 54], [30, 82], [44, 76], [32, 48], [56, 46]]), "#fff", 5); c.restore(); }
    c.restore();
  }
  const ke = lin(t, TEMPO.total - 2.5, TEMPO.total - 2.0);
  if (ke > 0) {
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.translate(540, 1560); c.scale(eob(ke), eob(ke)); c.rotate(-.04);
    forma(P.rr(-330, -60, 660, 120, 30), "#ffd23f", 7); texto("EPISÓDIO 3 EM BREVE", 0, 4, { tam: 54, cor: OL, borda: null }); c.restore();
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = lin(t, TEMPO.total - 2.0, TEMPO.total - 1.6); texto("COMENTA: ACEITAR OU CONTINUAR?", 540, 1700, { tam: 46, cor: "#fff", lw: 10 }); c.restore();
  }
}
function cortina(t) { // corte entre a vitrine pronta e a loja aberta
  const vz = F("vazio"), a = lin(t, vz - .3, vz), b = lin(t, vz, vz + .3); if (a <= 0 || b >= 1) return;
  const c = ctx; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); const x = t < vz ? W * (1 - ease(a)) : -W * ease(b);
  c.fillStyle = "#ff5a5f"; c.fillRect(x, 0, W, H); c.fillStyle = "#ffd23f"; c.fillRect(x, 0, 36, H); c.fillRect(x + W - 36, 0, 36, H);
  texto("ABRINDO...", x + W / 2, H / 2, { tam: 110, cor: "#fff", lw: 16 }); c.restore();
}

// ---------- contrato ----------
async function iniciarEp(tempo) {
  TEMPO = tempo; [W, H] = TAM[tempo.formato || "9:16"];
  for (const a of tempo.atos) ATO[a.cena] = a;
  const cv = document.getElementById("c"); cv.width = W; cv.height = H; ctx = cv.getContext("2d");
  await Promise.all(["48px Lilita", "600 48px Fredoka", "700 48px Fredoka"].map((f) => document.fonts.load(f)));
  legendas(); montarEp(); FUNDO = fazerFundo();
}
function quadroEp(t) {
  T = t; const c = ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H);
  aplicaCam(cameraEp(t)); interiorEp(t); resultadoEp(t);
  c.setTransform(1, 0, 0, 1, 0, 0);
  const g = c.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * .75); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(40,10,30,.35)"); c.fillStyle = g; c.fillRect(0, 0, W, H);
  cortina(t); hud(t); encomendaEp(t); decisaoEp(t); desenhaLegenda(t);
}
