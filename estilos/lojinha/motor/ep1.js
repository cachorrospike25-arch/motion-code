// Episódio 1: Você abriu uma loja com apenas R$ 50 (usa lib.js).
const PEGS = []; for (let r = 0; r < 2; r++) for (let i = 0; i < 5; i++) PEGS.push([598 + i * 62, 640 + r * 150]);
let VISOR = () => "0,00";
let EV_SINO = () => 0;

// ---------- câmera ----------
function camera(t) {
  // [t, zoom, cx, cy]
  const ch = [
    [0, 1.85, 560, 1180], [F("gancho") + 2.2, 1.7, 560, 1190], [F("vazia") + .2, 1.0, 540, 980], [F("fornecedor"), 1.0, 540, 980],
    [F("fornecedor") + 1.2, 1.28, 470, 1150], [F("compra") + 2.4, 1.25, 500, 1150], [F("vitrine") + .2, 1.05, 600, 1050], [F("vitrine") + 3.4, 1.12, 660, 1000],
    [F("clientes") + .6, 1.08, 620, 1030], [F("clientes") + 1.1, 1.45, 330, 1160], [F("clientes") + 2.4, 1.45, 330, 1160], [F("clientes") + 3.2, 1.0, 540, 1000],
    [F("esgotou") + .3, 1.0, 540, 1000], [F("esgotou") + 1.4, 1.2, 760, 1000], [F("resultado") + 2.0, 1.15, 700, 1010], [F("olha") - .4, 1.3, 930, 1000],
  ];
  let i = 0; while (i < ch.length - 1 && ch[i + 1][0] <= t) i++;
  const a = ch[i], b = ch[Math.min(i + 1, ch.length - 1)];
  const k = b === a ? 0 : ease(lin(t, a[0], b[0]));
  let z = lerp(a[1], b[1], k), x = lerp(a[2], b[2], k), y = lerp(a[3], b[3], k);
  // respiração e trancos
  z *= 1 + Math.sin(t * .7) * .006; x += Math.sin(t * .5) * 4; y += Math.cos(t * .43) * 3;
  const mx = W / (2 * z), my = H / (2 * z); x = cl(x, mx, W - mx); y = cl(y, my, H - my); // nunca mostra além da borda do cenário
  let sh = 0; for (const a of EV.tranco) sh += Math.max(0, 1 - (t - a) / .3) * (t >= a ? 1 : 0);
  x += Math.sin(t * 90) * 10 * sh; y += Math.cos(t * 77) * 8 * sh;
  return { z, x, y };
}

// ---------- linha do tempo da cena ----------
let PROT, FORN_CH, VENDAS = [];
function montar() {
  const fo = F("fornecedor"), co = F("compra"), vi = F("vitrine"), cli = F("clientes");
  // protagonista
  PROT = [
    [0, 560, 1560], [F("vazia") + 2.6, 560, 1560], [F("vazia") + 3.4, 660, 1560], [vi - .4, 660, 1560], [vi + .5, 720, 1570],
    [cli + .3, 720, 1570], [cli + 1.0, 1000, 1570],
  ];
  FORN_CH = [[fo - .6, 140, 1470], [fo + .9, 380, 1570], [co + 2.9, 380, 1570], [co + 3.2, 370, 1570], [vi + .2, 140, 1470]];
  // vendas: 10 pagamentos, o primeiro com calma, depois acelerando (tempo passando)
  const p0 = cli + 3.3, p1 = F("esgotou") - .1;
  VENDAS = [];
  for (let k = 0; k < 10; k++) {
    const u = k === 0 ? 0 : .12 + .88 * Math.pow(k / 9, .92);
    const tp = lerp(p0, p1, u);
    const rapido = k === 0 ? 1 : .6;
    const lane = 1560 + (k % 3) * 40;
    const [px] = PEGS[k];
    const d1 = 1.05 * rapido, d2 = .7 * rapido, pega = .3 * rapido, d3 = 1.0 * rapido;
    const tEnt = tp - d2 - pega - d1;
    VENDAS.push({ k, tp, tEnt, tPega: tEnt + d1, ch: [[tEnt, 140, 1470], [tEnt + d1, px + 10, lane], [tEnt + d1 + pega, px + 10, lane], [tp, 700, lane + 20], [tp + .35 * rapido, 700, lane + 20], [tp + .35 * rapido + d3, 140, 1470]], sai: tp + .35 * rapido + d3 });
  }
  // números da interface
  const din = [[F("gancho") + .1, 50], [co + 1.6, 20]], est = [[co + 1.9, 10]], ven = [], luc = [];
  const chips = [[co + 1.6, 0, "−R$ 30", "#e3342f"], [co + 1.9, 1, "+10", "#f0a020"]];
  VENDAS.forEach((v, i) => { din.push([v.tp + .15, 20 + 5 * (i + 1)]); est.push([v.tp + .15, 9 - i]); ven.push([v.tp + .15, 5 * (i + 1)]); luc.push([v.tp + .15, 2 * (i + 1)]); if (i % 3 === 0 || i === 9) chips.push([v.tp + .15, 0, "+R$ 5", "#38c172"]); });
  HUD = { din: contador(din, 0), est: contador(est, 0), ven: contador(ven, 0), luc: contador(luc, 0), chips, dia: { txt: "DIA 1", fim: F("olha") - .6 }, pulso: F("resultado") + 2.2 };
  VISOR = (t) => { const v = VENDAS.filter((x) => t >= x.tp + .15).length; return v ? (v * 5).toFixed(2).replace(".", ",") : "0,00"; };
  // sons e trancos (lidos pelo som.py)
  const notas = VENDAS.map((v) => v.tp + .15);
  EV = {
    sino: [fo - .7, vi + .1, ...VENDAS.map((v) => v.tEnt - .1)],
    caixa: notas,
    cedulas: [co + 1.25, co + 1.4, co + 1.55],
    clique: [co + 1.0, palavra("final", "reinvestir")?.t0 ?? 0, palavra("final", "guardar")?.t0 ?? 0],
    pop: PEGS.map((_, i) => vi + .7 + i * .24),
    carimbo: [vi + 3.2, F("esgotou") + .05],
    placa: [cli + .2],
    grilos: [F("vazia") + .4, F("vazia") + 3.4],
    feno: [F("vazia") + .9],
    whoosh: [F("fornecedor") + 1.0, co, F("resultado") + .3, F("olha") - .5, F("final") + 3.0],
    festa: [F("esgotou") + .2, F("resultado") + .1],
    pulo: [F("esgotou") + .25, F("resultado") + .4, F("resultado") + 1.1],
    brilho: [F("olha") + 2.6, F("olha") + 3.0],
    multidao: [cli + 1.4, F("esgotou") + .3],
    tiquetaque: [palavra("final", "mas")?.t0 ?? F("final") + 3, TEMPO.total - 2.4],
    fim: [TEMPO.total - 2.4],
    tranco: [co + 1.6, F("esgotou") + .05, F("resultado") + .3],
  };
  EV_SINO = (t) => { let k = 0; for (const a of EV.sino) if (t >= a) k = Math.max(k, 1 - (t - a) / 1.2); return Math.max(0, k); };
}
window.eventos = () => EV;

// ---------- quadro: loja por dentro ----------
function interior(t) {
  const c = ctx; const fo = F("fornecedor"), co = F("compra"), vi = F("vitrine"), cli = F("clientes"), es = F("esgotou"), re = F("resultado");
  ruaJanela(t);
  c.drawImage(FUNDO, 0, 0);
  // porta aberta quando alguém entra/sai
  let ab = 0; const abre = (a) => { ab = Math.max(ab, Math.sin(cl((t - a) / 1.1) * Math.PI)); };
  abre(fo - .9); abre(vi - .1); VENDAS.forEach((v) => { abre(v.tEnt - .3); abre(v.sai - .7); });
  porta(t, ab, ease(lin(t, cli + .2, cli + .6)));
  relogio(t, VENDAS.length ? 8 * ease(lin(t, VENDAS[1].tp - .5, es)) : 0);
  lampada(t, lin(t, re - .5, re) * 0 + 1);
  teia(t, 1);
  planta(t, ease(lin(t, re + .3, re + 1.2)));
  // chaveiros no expositor (pendurados um a um; somem quando alguém pega)
  PEGS.forEach(([x, y], i) => {
    const tc = vi + .7 + i * .24; const k = lin(t, tc - .35, tc);
    const v = VENDAS[i]; if (v && t > v.tPega) return;
    if (k <= 0) return;
    const bx = 470, by = 1480;
    if (k < 1) { const xx = lerp(bx, x, k), yy = lerp(by, y, k) - Math.sin(k * Math.PI) * 220; chaveiro(xx, yy, i, k * 8, .9); return; }
    const sw = Math.sin((t - tc) * 9) * Math.exp(-(t - tc) * 2.5) * .5 + Math.sin(t * 1.5 + i) * .03;
    chaveiro(x, y + 4, i, sw);
  });
  // etiqueta de preço R$ 5 (carimbada)
  const kp = lin(t, vi + 3.0, vi + 3.25);
  if (kp > 0) { c.save(); c.translate(820, 600); c.rotate(.12); const s = kp < 1 ? 2.2 - 1.2 * eout(kp) : 1; c.scale(s, s); forma(P.rr(-60, -36, 120, 72, 14), "#ff5a5f", 5); texto("R$ 5", 0, 3, { tam: 40, cor: "#fff", lw: 7 }); c.restore(); }
  // caixa registradora (gaveta abre a cada venda)
  let gav = 0; for (const v of VENDAS) gav = Math.max(gav, Math.sin(cl((t - v.tp) / .5) * Math.PI));
  // protagonista: atrás do balcão depois que a loja abre
  const atras = t >= cli + 1.15;
  // fornecedor + carrinho + caixa
  const caixaNoChao = t >= co + 2.6;
  if (t > fo - .6 && t < vi + .2) {
    const m = mover(t, FORN_CH, 1); const dir = t > co + 2.9 ? -1 : 1;
    const segurando = t < co + 2.6;
    if (segurando) { carrinho(m.x + 90, m.y); caixaPapelao(m.x + 100, m.y - 60, .9, t < vi ? 10 : 0); }
    const fala = t > fo + .4 && t < co - .2;
    const mm = figura(FORN, { x: m.x, y: m.y, passo: m.passo, dir, expr: fala ? "feliz" : t > co + 1.5 ? "rindo" : "feliz", bD: segurando ? .6 : t > co + 1.2 && t < co + 2.2 ? 1.0 : .15, bE: t > co + 2.9 && t < co + 3.5 ? 2.6 + Math.sin(t * 14) * .3 : .15, fala: fala ? Math.abs(Math.sin(t * 13)) : 0 });
    balao(m.x + 40, m.y - 560, "10 por R$ 3 cada!", lin(t, fo + .2, fo + .45) * (1 - lin(t, fo + 1.0, fo + 1.15)), { rabo: [-1, 1] });
  }
  if (caixaNoChao) caixaPapelao(470, 1640, .9, Math.max(0, 10 - Math.floor(lin(t, vi + .45, vi + .7 + 9 * .24) * 10 + 1e-6)));
  // oferta: cartão de compra
  const ko = lin(t, fo + 1.1, fo + 1.5) * (1 - lin(t, co + 1.3, co + 1.6));
  const clicK = pulse(t, co + 1.0, .25);
  cartao(540, 600, 640, 330, ko * 1.0, (c, w, h) => {
    texto("OFERTA DO FORNECEDOR", 0, -h / 2 + 46, { tam: 34, cor: "#ff5a5f", borda: null });
    for (let i = 0; i < 5; i++) chaveiro(-150 + i * 75, -h / 2 + 64, i, (i - 2) * .1, .9);
    texto("10 × R$ 3", 0, 24, { tam: 64, cor: OL, borda: null });
    c.save(); c.translate(0, 110); c.scale(1 - clicK * .08, 1 - clicK * .08); forma(P.rr(-220, -36, 440, 76, 38), clicK > 0 ? "#2a9d5a" : "#38c172", 5); texto("COMPRAR TUDO: R$ 30", 0, 4, { tam: 38, cor: "#fff", lw: 7 }); c.restore();
  });
  // margem: compra 3, vende 5
  const km = lin(t, vi + 3.4, vi + 3.7) * (1 - lin(t, cli + .1, cli + .4));
  cartao(540, 520, 600, 200, km, (c, w, h) => {
    texto("COMPRA R$ 3", -150, -40, { tam: 40, cor: "#e3342f", borda: null }); texto("VENDE R$ 5", 150, -40, { tam: 40, cor: "#38c172", borda: null });
    texto("+R$ 2 POR CHAVEIRO", 0, 40, { tam: 52, cor: OL, borda: null });
  });
  // clientes (atrás do balcão ficam o protagonista e o balcão; clientes na frente)
  const pm = mover(t, PROT, 1);
  if (atras) {
    const pagando = VENDAS.find((v) => t > v.tp - .2 && t < v.tp + .5);
    const comemora = t > es;
    const pu = comemora ? Math.abs(Math.sin((t - es) * 5.5)) * (t < re + 2.6 ? 120 : 30) : 0;
    const expr = comemora ? "euforico" : pagando ? "rindo" : "feliz";
    figura(EU, { x: 975, y: 1300, dir: -1, expr, pulo: pu, bE: comemora ? 2.7 + Math.sin(t * 11) * .2 : pagando ? 1.3 : .2, bD: comemora ? 2.7 + Math.cos(t * 11) * .2 : .2, olhar: [-1, 0], sq: comemora ? -Math.sin((t - es) * 11) * .04 : 0 });
  }
  balcao();
  caixaRegistradora(t, gav);
  if (!atras) {
    let expr = "feliz", bE = .15, bD = .15, olhar = [0, 0], inc = 0, item = null, vira = 0;
    if (t < F("vazia")) { expr = t < F("gancho") + .1 ? "determinado" : "euforico"; bD = 2.6 + Math.sin(t * 6) * .08; item = "50"; }
    else if (t < fo - .8) { expr = "preocupado"; const k = t - F("vazia"); olhar = [Math.sin(k * 2.2), -.2]; inc = Math.sin(k * 2.2) * .12; vira = Math.sin(k * 2.2) * .5; if (k > 1.6 && k < 2.8) { bE = bD = 1.1; } }
    else if (t < co) { expr = t < fo + .8 ? "surpreso" : "feliz"; olhar = [-1, 0]; }
    else if (t < co + 2.4) { expr = t < co + 1.1 ? "pensativo" : "feliz"; olhar = t < co + 1.1 ? [.6, -1] : [-1, 0]; bE = t > co + 1.1 && t < co + 1.7 ? 1.4 : .15; }
    else if (t < cli) { expr = "determinado"; const k = t - vi; if (k > .5 && k < 3.2) { bE = 2.4 + Math.sin(t * 12) * .25; bD = 2.4 + Math.cos(t * 12) * .25; olhar = [0, -1]; } }
    else { expr = "feliz"; bD = t < cli + .6 ? 1.6 : .15; }
    const dir = t < fo - .8 ? 1 : t < vi - .4 ? -1 : pm.dir;
    const maos = figura(EU, { x: pm.x, y: pm.y, passo: pm.passo, dir, expr, bE, bD, olhar, inc, vira });
    if (item === "50") cedula(maos.d.x, maos.d.y - 30, 50, -.2 + Math.sin(t * 6) * .05, 1.1);
    if (t < F("vazia") + .2) balao(pm.x - 60, pm.y - 620, "Bora!", lin(t, F("gancho") + 1.2, F("gancho") + 1.5) * (1 - lin(t, F("vazia"), F("vazia") + .2)));
    balao(pm.x + 30, pm.y - 610, "10 × 3 = 30", lin(t, co + .1, co + .4) * (1 - lin(t, co + 1.1, co + 1.3)), { pensa: true, rabo: [1, 1] });
    if (t > F("vazia") + 1.6 && t < F("vazia") + 3.2) balao(pm.x + 10, pm.y - 600, "...", lin(t, F("vazia") + 1.6, F("vazia") + 1.9) * (1 - lin(t, F("vazia") + 2.9, F("vazia") + 3.2)));
  }
  // cédulas voando para o fornecedor
  [0, 1, 2].forEach((i) => {
    const a = co + 1.25 + i * .15; const k = lin(t, a, a + .55); if (k <= 0 || k >= 1) return;
    cedula(lerp(650, 420, k), lerp(1240, 1180, k) - Math.sin(k * Math.PI) * 160, 10, k * 6, .9);
  });
  // clientes
  const ordem = VENDAS.filter((v) => t > v.tEnt - .05 && t < v.sai).sort((a, b) => a.ch[1][2] - b.ch[1][2]);
  for (const v of ordem) {
    const L = CLIENTES[v.k]; const m = mover(t, v.ch, 1);
    const entra = lin(t, v.tEnt - .05, v.tEnt + .35), sai = 1 - lin(t, v.sai - .35, v.sai);
    const s = (L.s || 1) * lerp(.82, 1, Math.min(entra, sai));
    const pega = t > v.tPega - .15 && t < v.tPega + .2;
    const paga = t > v.tp - .1 && t < v.tp + .3;
    const comItem = t > v.tPega;
    const maos = figura(L, { x: m.x, y: m.y, s, passo: m.passo, dir: m.dir, expr: comItem ? "rindo" : "feliz", bD: pega ? 2.6 : paga ? 1.5 : comItem ? .5 : .15, olhar: pega ? [0, -1] : [m.dir, 0], cs: 0 });
    if (comItem) chaveiro(maos.d.x, maos.d.y - 30, v.k, Math.sin(t * 8) * .3, .85);
    if (paga) moeda(lerp(maos.d.x, 842, lin(t, v.tp - .1, v.tp + .2)), lerp(maos.d.y, 1000, lin(t, v.tp - .1, v.tp + .2)) - Math.sin(lin(t, v.tp - .1, v.tp + .2) * Math.PI) * 80, t * 12, 1.2);
    if (FALAS_CLI[v.k]) balao(m.x, m.y - 590 * s, FALAS_CLI[v.k], lin(t, v.tPega - .1, v.tPega + .15) * (1 - lin(t, v.tp - .1, v.tp + .1)), { tam: 40 });
    // +R$ 5 subindo do caixa
    const kk = lin(t, v.tp + .15, v.tp + 1.1);
    if (kk > 0 && kk < 1) { c.save(); c.globalAlpha = 1 - lin(kk, .6, 1); texto("+R$ 5", 842, 900 - eout(kk) * 120, { tam: 56, cor: "#5bd66b", lw: 10 }); c.restore(); }
  }
  feno(t, F("vazia") + .9, F("vazia") + 3.4);
  // ESGOTADO
  const ke = lin(t, es + .05, es + .3);
  if (ke > 0) { c.save(); c.translate(720, 740); c.rotate(-.18); const s = ke < 1 ? 2.4 - 1.4 * eout(ke) : 1; c.scale(s, s); c.globalAlpha = Math.min(1, ke * 3); c.lineWidth = 10; c.strokeStyle = "#e3342f"; c.strokeRect(-200, -60, 400, 120); texto("ESGOTADO!", 0, 6, { tam: 82, cor: "#e3342f", borda: "#fff", lw: 8 }); c.restore(); }
  balao(980, 760, "ESGOTOU!!", lin(t, es + .4, es + .7) * (1 - lin(t, re - .2, re)), { rabo: [1, 1], cor: "#ffd23f" });
  // confete e dinheiro chovendo
  confete(t, es + .05); confete(t, re + .2, 2);
  chuvaDinheiro(t, re + .3);
  // vendas aceleradas
  const kv = lin(t, VENDAS[1].tEnt, VENDAS[1].tEnt + .3) * (1 - lin(t, es - .1, es + .2));
  if (kv > 0) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = kv; forma(P.rr(W - 210, 330, 176, 64, 32), "#ffd23f", 5); texto("⏩ x4", W - 122, 364, { tam: 40, fonte: "Lilita", cor: OL, borda: null }); c.restore(); }
}
function resultado(t) {
  const re = F("resultado"); const k = lin(t, re + .1, re + .45) * (1 - lin(t, F("olha") - .9, F("olha") - .55)); if (k <= 0) return;
  const tSom = palavra("resultado", "somando")?.t0 ?? re, tLuc = palavra("resultado", "lucro")?.t0 ?? re + 2.5;
  cartao(540, 640, 800, 470, k, (c, w, h) => {
    texto("RESULTADO DO DIA 1", 0, -h / 2 + 48, { tam: 40, cor: "#ff5a5f", borda: null });
    const a = eob(lin(t, tSom, tSom + .35)), b = eob(lin(t, tSom + .9, tSom + 1.25)), d = eob(lin(t, tLuc - .2, tLuc + .2)), e = eob(lin(t, tLuc + .5, tLuc + .9));
    c.save(); c.globalAlpha = Math.min(1, a); texto("SOBROU R$ 20 + VENDAS R$ 50", 0, -90, { tam: 42, cor: OL, borda: null }); c.restore();
    c.save(); c.translate(0, -20); c.scale(b, b); texto("CAIXA: R$ 70", 0, 0, { tam: 64, cor: "#2f8f3f", borda: null }); c.restore();
    c.fillStyle = "rgba(43,26,16,.2)"; c.fillRect(-w / 2 + 50, 34, w - 100, 5);
    c.save(); c.globalAlpha = Math.min(1, d); texto("VENDAS R$ 50 − CUSTO R$ 30", 0, 84, { tam: 42, cor: OL, borda: null }); c.restore();
    c.save(); c.translate(0, 162); c.scale(e, e); forma(P.rr(-300, -46, 600, 92, 46), "#38c172", 5); texto("LUCRO BRUTO: R$ 20", 0, 4, { tam: 52, cor: "#fff", lw: 8 }); c.restore();
  });
}

// ---------- quadro: a rua (final) ----------
function fazerRua() {
  const g = tela(W, H), c = g.getContext("2d"); const salva = ctx; ctx = c;
  const sky = c.createLinearGradient(0, 0, 0, 1100); sky.addColorStop(0, "#6c5ce7"); sky.addColorStop(.45, "#ff7aa2"); sky.addColorStop(1, "#ffc36b"); c.fillStyle = sky; c.fillRect(0, 0, W, 1100);
  for (const [x, y, s] of [[180, 220, 1], [820, 160, .8], [520, 330, .6]]) { c.globalAlpha = .7; c.fillStyle = "#fff1f5"; c.fill(P.el(x, y, 120 * s, 34 * s)); c.fill(P.el(x + 60 * s, y - 20 * s, 70 * s, 34 * s)); c.globalAlpha = 1; }
  forma(P.el(860, 420, 90, 90), "#ffe08a", 0);
  // prédios do fundo
  const r = rng(4); for (let x = -40; x < W; x += 150) { const h = 300 + r() * 250; c.fillStyle = "#8b6fd6"; c.globalAlpha = .55; c.fillRect(x, 1060 - h, 140, h); c.globalAlpha = 1; }
  // a loja grande
  const b = P.rr(110, 360, 860, 720, 18); forma(b, "#fff1dc"); crescente(b, -26, 0, "rgba(120,60,40,.14)");
  forma(P.rr(90, 330, 900, 70, 14), "#e94b4b");
  for (let i = 0; i < 2; i++) for (let k = 0; k < 4; k++) forma(P.rr(150 + k * 205, 520 + i * 200, 170, 150, 10), "#7fd0ff", 5);
  // toldo listrado e portas
  for (let i = 0; i < 12; i++) forma(P.poly([[110 + i * 72, 880], [182 + i * 72, 880], [182 + i * 72, 920], [146 + i * 72, 940], [110 + i * 72, 920]]), i % 2 ? "#fff" : "#e94b4b", 4);
  forma(P.rr(420, 940, 240, 140, 8), "#7fd0ff", 5); c.fillStyle = OL; c.fillRect(538, 940, 5, 140);
  // calçada de lá, rua, calçada de cá
  c.fillStyle = "#d9d1c3"; c.fillRect(0, 1080, W, 50); c.fillStyle = "#5d6370"; c.fillRect(0, 1130, W, 260);
  c.fillStyle = "#f6d34a"; for (let x = 0; x < W; x += 110) c.fillRect(x, 1255, 60, 12);
  c.fillStyle = "#ead9c0"; c.fillRect(0, 1390, W, H - 1390);
  c.strokeStyle = "rgba(120,90,60,.35)"; c.lineWidth = 3; for (let y = 1450; y < H; y += 90) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); } for (let x = 0; x < W; x += 140) { c.beginPath(); c.moveTo(x, 1390); c.lineTo(x - 60, H); c.stroke(); }
  c.lineWidth = 6; c.strokeStyle = OL; c.beginPath(); c.moveTo(0, 1390); c.lineTo(W, 1390); c.stroke();
  // a lojinha, aqui na frente, à esquerda
  const f = P.rr(-40, 820, 400, 820, 16); forma(f, "#ffb86b"); crescente(f, -20, 0, "rgba(120,60,40,.16)");
  forma(P.rr(-40, 790, 420, 90, 16), "#ff5a5f"); ctx = c; texto("LOJINHA", 170, 838, { tam: 58, cor: "#fff7d6", lw: 9 });
  forma(P.rr(30, 950, 270, 300, 12), "#7fd0ff", 6); forma(P.rr(120, 1300, 170, 340, 8), "#c9783c", 6);
  forma(P.rr(140, 1360, 130, 54, 10), "#38c172", 4); texto("ABERTO", 205, 1389, { tam: 30, cor: "#fff", lw: 5 });
  ctx = salva; return g;
}
function exterior(t) {
  const c = ctx; const ol = F("olha");
  c.drawImage(RUA, 0, 0);
  // letreiro piscando e carros
  const on = (Math.floor(t * 4) % 2) ? 1 : .75;
  c.save(); c.globalAlpha = on; texto("MEGALOJA", 540, 366, { tam: 66, cor: "#fff7d6", lw: 10 }); c.restore();
  for (let i = 0; i < 9; i++) { c.fillStyle = (Math.floor(t * 6) + i) % 2 ? "#fff6a8" : "#ffd23f"; c.fill(P.el(130 + i * 102, 405, 8, 8)); }
  for (let k = 0; k < 4; k++) { const ph = ((t - ol) * .35 + k * .26) % 1.3; const dir = k % 2 ? 1 : -1; const x = dir > 0 ? -150 + ph * 1100 : 1230 - ph * 1100; const y = k % 2 ? 1230 : 1330; const cor = ["#4fc3ff", "#ffcf3a", "#7be36b", "#ff5a5f"][k];
    forma(P.rr(x - 90, y - 60, 180, 60, 18), cor, 5); forma(P.rr(x - 50, y - 100, 100, 46, 14), "#bfe9ff", 5); forma(P.el(x - 52, y, 20, 20), "#333", 4); forma(P.el(x + 52, y, 20, 20), "#333", 4); }
  // ele, olhando a loja grande
  const sonho = ease(lin(t, ol + 2.4, ol + 3.0));
  const olhaMao = t > F("final") + .4;
  const mao = figura(EU, { x: 760, y: 1780, s: 1.12, dir: -1, expr: olhaMao ? "pensativo" : sonho > .5 ? "sonhador" : "surpreso", olhar: olhaMao ? [-.4, .6] : [-.7, -1], inc: -.08, bE: olhaMao ? 1.5 : .2, bD: .2 });
  if (olhaMao) { const k = eob(lin(t, F("final") + .4, F("final") + .8)); [[50, -.3], [10, -.05], [10, .2]].forEach(([v, a], i) => cedula(mao.e.x + i * 12, mao.e.y - 30 - i * 10, v, a, .75 * k)); }
  // bolha do sonho
  const kb = lin(t, ol + 2.3, ol + 3.1) * (1 - lin(t, F("final") + 2.6, F("final") + 3.0));
  if (kb > 0) {
    c.save();
    [[720, 1350, 18], [690, 1300, 26], [650, 1250, 34]].forEach(([x, y, r], i) => { const k = eob(lin(t, ol + 2.3 + i * .12, ol + 2.6 + i * .12)); forma(P.el(x, y, r * k, r * k), "#fff", 5); });
    const kk = eob(lin(t, ol + 2.6, ol + 3.1)); c.translate(540, 900); c.scale(kk * .92, kk * .92);
    const nuvem = new Path2D(); [[-300, 0, 160], [-150, -130, 170], [60, -150, 180], [250, -60, 160], [240, 120, 150], [40, 170, 170], [-180, 150, 160]].forEach(([x, y, r]) => { nuvem.ellipse(x, y, r, r * .9, 0, 0, 7); nuvem.closePath(); });
    c.lineWidth = 14; c.strokeStyle = OL; c.stroke(nuvem); c.fillStyle = "#fff"; c.fill(nuvem);
    c.save(); c.clip(P.rr(-330, -230, 660, 450, 60));
    const g = c.createLinearGradient(0, -230, 0, 220); g.addColorStop(0, "#9be7ff"); g.addColorStop(1, "#fff2c6"); c.fillStyle = g; c.fillRect(-330, -230, 660, 450);
    // a rede de lojas que ele imagina
    for (let i = 0; i < 3; i++) { const x = -250 + i * 170, h = 120 + i * 40; forma(P.rr(x, 120 - h, 140, h, 8), ["#ffb86b", "#7fd0ff", "#c47bff"][i], 5); forma(P.rr(x - 6, 120 - h - 24, 152, 34, 8), "#ff5a5f", 4); }
    forma(P.rr(60, -140, 250, 260, 10), "#ffd23f", 6); forma(P.rr(48, -176, 274, 50, 12), "#2a3550", 5); texto("SUA REDE", 185, -150, { tam: 36, cor: "#ffd23f", lw: 6 });
    for (let i = 0; i < 2; i++) for (let k = 0; k < 3; k++) forma(P.rr(80 + k * 78, -100 + i * 90, 60, 60, 6), "#7fd0ff", 4);
    c.fillStyle = "#7bd36b"; c.fillRect(-330, 120, 660, 100);
    const brilho = Math.sin(t * 6); for (let i = 0; i < 6; i++) { const a = i * 1.05 + t; c.save(); c.translate(Math.cos(a) * 280, -80 + Math.sin(a * 1.3) * 120); c.rotate(t * 2); c.globalAlpha = .6 + .4 * brilho; texto("✦", 0, 0, { tam: 40, cor: "#ffd23f", borda: null }); c.restore(); }
    figura(EU_TERNO, { x: -60, y: 200, s: .52, dir: 1, expr: "euforico", bD: 2.6, bE: .3 });
    c.restore(); c.restore();
  }
}
// ---------- decisão (gancho do episódio 2) ----------
function decisao(t) {
  const c = ctx; const fi = F("final"); const tm = palavra("final", "mas")?.t0 ?? fi + 3.2;
  const k = lin(t, tm - .1, tm + .4); if (k <= 0) return;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = `rgba(20,16,40,${.55 * k})`; c.fillRect(0, 0, W, H);
  const s = eob(k); c.translate(540, 980); c.scale(s, s);
  forma(P.rr(-460, -420, 920, 820, 44), "#1e2a4a", 7); forma(P.rr(-460, -432, 920, 820, 44), "#2b3a66", 7);
  forma(P.rr(-180, -470, 360, 76, 38), "#ff5a5f", 6); texto("DECISÃO", 0, -430, { tam: 50, cor: "#fff", lw: 8 });
  texto("VOCÊ TEM R$ 70.", 0, -330, { tam: 52, cor: "#fff", lw: 9 });
  texto("O QUE FAZER?", 0, -262, { tam: 64, cor: "#ffd23f", lw: 10 });
  const tr = palavra("final", "reinvestir")?.t0 ?? tm + 1, tg = palavra("final", "guardar")?.t0 ?? tm + 2;
  const hov = t < tg - .1 ? 0 : 1;
  const bt = (y, cor, txt, sub, i, ic) => {
    const ativo = (i === 0 && t > tr - .1) || (i === 1 && t > tg - .1); const p = (ativo && hov === i) ? 1 + .05 * Math.sin(t * 10) : 1;
    c.save(); c.translate(0, y); c.scale(p, p);
    forma(P.rr(-380, -84 + 12, 760, 168, 40), shade(cor, -.35), 6); forma(P.rr(-380, -84, 760, 168, 40), cor, 6);
    c.fillStyle = "rgba(255,255,255,.18)"; c.fill(P.rr(-366, -76, 732, 64, 32));
    c.save(); c.translate(-290, 0); ic(); c.restore();
    texto(txt, 50, -14, { tam: 54, cor: "#fff", lw: 9 }); texto(sub, 50, 40, { tam: 30, fonte: "Fredoka", peso: 700, cor: "#fff", borda: null });
    c.restore();
  };
  bt(-60, "#38c172", "REINVESTIR TUDO", "R$ 70 em mais estoque", 0, () => { forma(P.rr(-50, -40, 100, 80, 8), "#d9a066", 5); texto("+", 0, 4, { tam: 64, cor: "#fff", lw: 8 }); });
  bt(170, "#3b82f6", "GUARDAR O DINHEIRO", "R$ 70 no cofrinho", 1, () => { forma(P.el(0, 0, 54, 44), "#ff8fb1", 5); forma(P.el(44, -4, 16, 14), "#ff8fb1", 4); c.fillStyle = OL; c.fill(P.el(16, -12, 5, 5)); c.fillRect(-12, -46, 30, 8); });
  // cursor
  const cy = lerp(-60, 170, ease(lin(t, tg - .4, tg))) + Math.sin(t * 5) * 6; const cx = 300 + Math.cos(t * 4) * 8;
  if (t > tr - .4) { c.save(); c.translate(cx, cy + 20); c.rotate(-.3); forma(P.poly([[0, 0], [0, 70], [18, 54], [30, 82], [44, 76], [32, 48], [56, 46]]), "#fff", 5); c.restore(); }
  c.restore();
  // episódio 2
  const ke = lin(t, TEMPO.total - 2.5, TEMPO.total - 2.0);
  if (ke > 0) {
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.translate(540, 1560); c.scale(eob(ke), eob(ke)); c.rotate(-.04);
    forma(P.rr(-330, -60, 660, 120, 30), "#ffd23f", 7); texto("EPISÓDIO 2 EM BREVE", 0, 4, { tam: 54, cor: OL, borda: null });
    c.restore();
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = lin(t, TEMPO.total - 2.0, TEMPO.total - 1.6); texto("COMENTA: REINVESTIR OU GUARDAR?", 540, 1700, { tam: 46, cor: "#fff", lw: 10 }); c.restore();
  }
}
// ---------- contrato do estúdio ----------
async function iniciarEp(tempo) {
  TEMPO = tempo; [W, H] = TAM[tempo.formato || "9:16"];
  for (const a of tempo.atos) ATO[a.cena] = a;
  const cv = document.getElementById("c"); cv.width = W; cv.height = H; ctx = cv.getContext("2d");
  await Promise.all(["48px Lilita", "600 48px Fredoka", "700 48px Fredoka"].map((f) => document.fonts.load(f)));
  legendas(); montar(); FUNDO = fazerFundo(); RUA = fazerRua();
}
function quadroEp(t) {
  T = t; const c = ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H);
  const troca = F("olha") - .1;
  const cam = camera(t);
  if (t < troca) { aplicaCam(cam); interior(t); resultado(t); }
  else {
    const ol = F("olha"); const k = ease(lin(t, ol + .4, ol + 2.0)) * (1 - ease(lin(t, ol + 2.2, ol + 3.2)));
    const z = 1.18 + k * .1, cy = lerp(1180, 760, k);
    aplicaCam({ z, x: 560 + Math.sin(t * .5) * 6, y: cy });
    exterior(t);
  }
  c.setTransform(1, 0, 0, 1, 0, 0);
  iris(t, troca, troca, 760, 900);
  // vinheta leve
  const g = c.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * .75); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(40,10,30,.35)"); c.fillStyle = g; c.fillRect(0, 0, W, H);
  hud(t);
  decisao(t);
  desenhaLegenda(t);
}

