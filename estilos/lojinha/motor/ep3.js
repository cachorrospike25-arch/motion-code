// Episódio 3: Seu melhor amigo pediu fiado (usa lib.js). Vídeo independente, curto, feito para comentar e marcar amigo.
// Caixa R$ 40, estoque 10 chaveiros (R$ 100 em mercadoria). O amigo leva tudo fiado: estoque 0, A RECEBER R$ 100, lucro R$ 0.

const PEGS = []; for (let r = 0; r < 2; r++) for (let i = 0; i < 5; i++) PEGS.push([598 + i * 62, 640 + r * 150]);
let VISOR = () => "0,00";
let EV_SINO = () => 0;
const N = 10;
const AMIGO = { pele: "#e0b08b", cabelo: "bone", corBone: "#ffd23f", corCabelo: "#2b1a12", camisa: "#ff4f9a", calca: "#2d6a4f", sapato: "#ffd23f", seed: 41, larg: 1.05 };
const AMIGO_FERIAS = { ...AMIGO, escuros: true, camisa: "#35e0c0" };
let VIS1, VIS2, JANELA_T0, TOMA;

function caderno(x, y, ang = 0, s = 1) {
  const c = ctx; c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s);
  forma(P.rr(-30, -40, 60, 80, 6), "#ffd23f", 5);
  c.fillStyle = "#fff"; c.fillRect(-22, -30, 44, 62); c.strokeStyle = "rgba(60,90,200,.5)"; c.lineWidth = 2; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-20, -18 + i * 12); c.lineTo(20, -18 + i * 12); c.stroke(); }
  c.fillStyle = "#555"; for (let i = 0; i < 4; i++) c.fill(P.el(-30, -28 + i * 18, 4, 4));
  c.restore();
}
function montarEp() {
  const g = F("gancho"), pe = F("pedido"), ca = F("caderninho"), se = F("semanas"), co = F("cobranca"), fi = F("final"), fm = F("fim");
  VIS1 = [[0, 140, 1470], [1.0, 760, 1560], [ca + .5, 760, 1560], [ca + 1.8, 140, 1470]];
  VIS2 = [[co - .4, 140, 1470], [co + .8, 760, 1560], [fm + 20, 760, 1560]];
  JANELA_T0 = se + 2.7;
  TOMA = PEGS.map((_, i) => pe + .55 + i * .15);
  const est = [[0, N], [TOMA[N - 1] + .35, 0]];
  HUD = {
    din: contador([[0, 40]], 0), est: contador(est, 0), ven: contador([[ca + 2.0, 100]], 0), luc: contador([[0, 0]], 0),
    chips: [[TOMA[N - 1] + .35, 1, "−10", "#e3342f"], [ca + 2.0, 2, "+R$ 100", "#f0a020"]],
    rot: ["DINHEIRO", "ESTOQUE", "A RECEBER", "LUCRO"], pulso: -99,
    dia: { txt: (t) => t < se + .9 ? "DIA 7" : t < se + 2.2 ? "DIA 14" : "DIA 30", fim: fi - .6 },
  };
  EV = {
    sino: [-.1, ca + .4, co - .5],
    caixa: [], cedulas: [],
    clique: [ca + .9, ca + 1.7, fi + 1.0, fi + 2.1],
    pop: TOMA,
    carimbo: [ca + 2.0, co + 2.3],
    placa: [],
    grilos: [se + .3, co - .5],
    feno: [se + 1.1],
    whoosh: [g + .1, pe, ca + 1.9, se, se + 2.6, co - .6, fi, fm - .1],
    festa: [], pulo: [], brilho: [], multidao: [],
    trombone: [se + 3.6, co + 2.4],
    tiquetaque: [fi + .2, TEMPO.total - 2.4],
    fim: [TEMPO.total - 2.4],
    tranco: [ca + 2.0, co + 2.3],
    secoes: { neg: .2, ven: pe, son: fi + .1, quieto: [[se + .1, co - .2]], festas: [] },
  };
  EV_SINO = (t) => { let k = 0; for (const a of EV.sino) if (t >= a) k = Math.max(k, 1 - (t - a) / 1.2); return Math.max(0, k); };
}
window.eventos = () => EV;

function cameraEp(t) {
  const g = F("gancho"), pe = F("pedido"), ca = F("caderninho"), se = F("semanas"), co = F("cobranca"), fi = F("final");
  const ch = [
    [0, 1.45, 780, 1200], [g + 2.0, 1.35, 830, 1220], [pe + .3, 1.2, 700, 1140], [pe + 2.0, 1.4, 830, 1230], [ca + .2, 1.6, 930, 1180], [ca + 2.4, 1.1, 640, 1060],
    [se + .2, 1.05, 560, 1050], [se + 2.4, 1.5, 420, 1030], [se + 4.2, 1.2, 640, 1150], [co + .8, 1.5, 830, 1250], [fi + .2, 1.0, 540, 1000],
  ];
  let i = 0; while (i < ch.length - 1 && ch[i + 1][0] <= t) i++;
  const a = ch[i], b = ch[Math.min(i + 1, ch.length - 1)]; const k = b === a ? 0 : ease(lin(t, a[0], b[0]));
  let z = lerp(a[1], b[1], k), x = lerp(a[2], b[2], k), y = lerp(a[3], b[3], k);
  z *= 1 + Math.sin(t * .7) * .006; x += Math.sin(t * .5) * 4; y += Math.cos(t * .43) * 3;
  const mx = W / (2 * z), my = H / (2 * z); x = cl(x, mx, W - mx); y = cl(y, my, H - my);
  let sh = 0; for (const a of EV.tranco) sh += Math.max(0, 1 - (t - a) / .3) * (t >= a ? 1 : 0);
  return { z, x: x + Math.sin(t * 90) * 10 * sh, y: y + Math.cos(t * 77) * 8 * sh };
}
function janelaAmigo(t) { // o amigo passa lá fora, de óculos escuros, com os chaveiros na mochila
  const k = lin(t, JANELA_T0, JANELA_T0 + 1.7); if (k <= 0 || k >= 1) return;
  const c = ctx; c.save(); c.beginPath(); c.rect(282, 572, 236, 420); c.clip();
  const x = lerp(560, 230, k), passo = k * 22;
  const m = figura(AMIGO_FERIAS, { x, y: 975, s: .4, passo, dir: -1, expr: "rindo", bE: 1.9 + Math.sin(t * 9) * .3, bD: .3 });
  for (let i = 0; i < 5; i++) chaveiro(x + 22 + i * 6, 975 - 150 + Math.sin(t * 10 + i) * 4, i, Math.sin(t * 9 + i) * .4, .3);
  c.restore();
}
function interiorEp(t) {
  const c = ctx, g = F("gancho"), pe = F("pedido"), ca = F("caderninho"), se = F("semanas"), co = F("cobranca"), fi = F("final");
  ruaJanela(t); janelaAmigo(t); c.drawImage(FUNDO, 0, 0);
  let ab = 0; const abre = (a) => { ab = Math.max(ab, Math.sin(cl((t - a) / 1.1) * Math.PI)); };
  abre(-.3); abre(ca - .1); abre(co - .9);
  porta(t, ab, 1);
  relogio(t, 6 * ease(lin(t, se, co - .5)));
  lampada(t, 1); planta(t, 1);
  teia(t, ease(lin(t, se + .3, se + 1.4)));
  // chaveiros no expositor até o amigo pegar
  PEGS.forEach(([x, y], i) => { if (t >= TOMA[i]) return; const sw = Math.sin(t * 1.5 + i) * .03; chaveiro(x, y + 4, i, sw, 1); });
  // protagonista atrás do balcão
  const dentro1 = t < ca + 1.9, vis2 = t > co - .45;
  const eu = t < pe ? "surpreso" : t < pe + 1.4 ? "pensativo" : t < ca ? "preocupado" : t < se ? "determinado" : t < JANELA_T0 + 1.5 ? (t > JANELA_T0 - .3 ? "surpreso" : "preocupado") : t < co + .8 ? "preocupado" : t < co + 2.2 ? "determinado" : "determinado";
  const tre = t > co + 2.3 && t < co + 3.6 ? Math.sin(t * 50) * .02 : 0;
  const escreve = t >= ca - .1 && t < ca + 2.4, cobra = t > co + .8 && t < co + 3.8;
  const olhaJ = t > se + 2.2 && t < JANELA_T0 + 1.8;
  const mp = figura(EU, { x: 975, y: 1300, dir: -1, expr: eu, bD: escreve || cobra ? 1.8 + Math.sin(t * 9) * (escreve ? .15 : .05) : .2, bE: .2, olhar: olhaJ ? [-1, .1] : [-1, 0], inc: tre * 6, sq: tre });
  if (escreve || cobra) caderno(mp.d.x - 6, mp.d.y - 30, -.15, .9);
  balcao(); caixaRegistradora(t, 0);
  // o amigo (primeira e segunda visita)
  const visita = (ch) => {
    const m = mover(t, ch, 1), parado = m.passo == null, olhaDentro = true;
    const pegando = t > pe + .4 && t < TOMA[N - 1] + .4, jura = t > TOMA[N - 1] + .2 && t < ca + .5;
    const segura = t > TOMA[N - 1] + .3;
    const mm = figura(AMIGO, { x: m.x, y: m.y, passo: m.passo, dir: m.dir, expr: pegando ? "feliz" : jura ? "rindo" : "feliz", bD: pegando ? 2.5 : jura ? 1.6 : segura ? .6 : .2, bE: jura ? 1.2 : .2, olhar: [1, 0], inc: jura ? Math.sin(t * 6) * .06 : 0, fala: jura ? Math.abs(Math.sin(t * 12)) : 0 });
    return { m, mm, segura };
  };
  let amigo = null;
  if (t < ca + 1.95) { amigo = visita(VIS1); if (amigo.segura) for (let i = 0; i < N; i++) chaveiro(amigo.mm.d.x + (i - 4.5) * 9, amigo.mm.d.y - 14 + Math.sin(t * 9 + i) * 3, i, Math.sin(t * 8 + i) * .3, .6); }
  else if (vis2) { amigo = visita(VIS2); amigo.segura = false; }
  // chaveiros voando do expositor até a mão do amigo
  if (t < ca) { const mmaos = mover(t, VIS1, 1); PEGS.forEach(([x, y], i) => { const k = lin(t, TOMA[i], TOMA[i] + .35); if (k <= 0 || k >= 1) return; chaveiro(lerp(x, 760, k), lerp(y, 1300, k) - Math.sin(k * Math.PI) * 140, i, k * 7, .9 * (1 - k * .3)); }); }
  // balões
  balao(830, 1010, "Pago semana que vem, juro!", lin(t, pe + 1.8, pe + 2.1) * (1 - lin(t, ca - .2, ca)), { rabo: [-1, 1], tam: 36 });
  balao(980, 800, "R$ 100?!", lin(t, pe + 1.6, pe + 1.9) * (1 - lin(t, pe + 2.6, pe + 2.8)), { tam: 40, rabo: [1, 1] });
  balao(830, 1010, "Semana que vem eu pago!", lin(t, co + 1.7, co + 2.0) * (1 - lin(t, co + 3.4, co + 3.6)), { rabo: [-1, 1], tam: 36 });
  balao(870, 790, "Cadê os R$ 100?", lin(t, co + 1.0, co + 1.3) * (1 - lin(t, co + 1.9, co + 2.1)), { tam: 38, rabo: [1, 1] });
  if (t > se + 3.4 && t < se + 4.4) balao(940, 790, "...", lin(t, se + 3.4, se + 3.6) * (1 - lin(t, se + 4.2, se + 4.4)));
  feno(t, se + 1.1, se + 3.1);
  // cartão da cobrança (caderninho)
  const kc = Math.max(lin(t, ca + .8, ca + 1.1) * (1 - lin(t, ca + 3.0, ca + 3.3)), lin(t, co + 2.0, co + 2.3) * (1 - lin(t, co + 3.9, co + 4.2)));
  const segunda = t > co;
  cartao(540, 440, 700, 280, kc, (c, w, h) => {
    texto("CADERNINHO DA LOJA", 0, -h / 2 + 38, { tam: 38, cor: "#ff5a5f", borda: null });
    c.fillStyle = "rgba(43,26,16,.2)"; c.fillRect(-w / 2 + 50, -66, w - 100, 4);
    texto("AMIGO", -150, -14, { tam: 58, cor: OL, borda: null }); texto("R$ 100", 160, -14, { tam: 62, cor: "#e3342f", borda: null });
    const e = eob(lin(t, segunda ? co + 2.25 : ca + 2.0, segunda ? co + 2.5 : ca + 2.25));
    c.save(); c.translate(0, 66); c.rotate(-.08); c.scale(Math.max(.001, e * (e < 1 ? 1.4 - .4 * e : 1)), Math.max(.001, e * (e < 1 ? 1.4 - .4 * e : 1)));
    c.lineWidth = 8; c.strokeStyle = "#e3342f"; c.strokeRect(-230, -40, 460, 80); texto(segunda ? "SEMANA QUE VEM" : "A RECEBER", 0, 4, { tam: segunda ? 54 : 64, cor: "#e3342f", borda: "#fff", lw: 6 }); c.restore();
  });
  // calendário: o tempo passando
  [["7 DIAS", se + .15], ["14 DIAS", se + 1.35], ["30 DIAS", se + 2.55]].forEach(([txt, a], i) => {
    const k = lin(t, a, a + .3) * (1 - lin(t, a + 1.05, a + 1.2)); if (k <= 0) return;
    cartao(540, 520 + i * 6, 540, 240, k, (c, w, h) => { forma(P.rr(-w / 2, -h / 2, w, 62, 34), "#e3342f", 0); c.fillStyle = "#e3342f"; c.fillRect(-w / 2, -h / 2 + 30, w, 32); for (const x of [-150, 150]) forma(P.rr(x - 8, -h / 2 - 14, 16, 36, 8), "#8c8f96", 4); texto(txt, 0, 36, { tam: 96, cor: OL, borda: null }); }, "#fffaf0");
  });
}
function ganchoEp(t) { // título que prende nos primeiros segundos
  const k = lin(t, .05, .3) * (1 - lin(t, 1.6, 1.9)); if (k <= 0) return;
  const c = ctx; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.translate(540, 700); c.rotate(-.07); const s = eob(Math.min(1, k * 1.5)) * (1 + .03 * Math.sin(t * 14)); c.scale(s, s); c.globalAlpha = Math.min(1, k * 3);
  forma(P.rr(-410, -110, 820, 220, 36), "#e3342f", 8); texto("PEDIU FIADO?!", 0, 6, { tam: 130, cor: "#fff", lw: 14 }); c.restore();
}
function decisaoEp(t) {
  const c = ctx, fi = F("final"), fm = F("fim"), k = lin(t, fi + .05, fi + .4);
  if (k > 0 && t < fm + .5) {
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = `rgba(20,16,40,${.62 * k * (1 - lin(t, fm, fm + .5))})`; c.fillRect(0, 0, W, H);
    const s = eob(k); c.translate(540, 920); c.scale(s, s); c.globalAlpha = 1 - lin(t, fm, fm + .5);
    forma(P.rr(-460, -420, 920, 800, 44), "#1e2a4a", 7); forma(P.rr(-460, -432, 920, 800, 44), "#2b3a66", 7);
    forma(P.rr(-300, -472, 600, 84, 42), "#ff5a5f", 6); texto("FIADO PARA AMIGO?", 0, -430, { tam: 48, cor: "#fff", lw: 8 });
    const tp = palavra("final", "pode")?.t0 ?? fi + 1.5, tn = palavra("final", "nunca")?.t0 ?? fi + 2.5, tm = palavra("final", "marca")?.t0 ?? fi + 3.2;
    const bt = (y, cor, txt, sub, ativo, ic) => { const p = ativo ? 1 + .05 * Math.sin(t * 12) : 1; c.save(); c.translate(0, y); c.scale(p, p); forma(P.rr(-380, -72, 760, 168, 40), shade(cor, -.35), 6); forma(P.rr(-380, -84, 760, 168, 40), cor, 6); c.fillStyle = "rgba(255,255,255,.18)"; c.fill(P.rr(-366, -76, 732, 64, 32)); c.save(); c.translate(-290, 0); ic(); c.restore(); texto(txt, 50, -14, { tam: 66, cor: "#fff", lw: 10 }); texto(sub, 50, 44, { tam: 30, fonte: "Fredoka", peso: 700, cor: "#fff", borda: null }); c.restore(); };
    bt(-250, "#38c172", "PODE", "amigo é amigo", t > tp - .1 && t < tn - .1, () => { const p = new Path2D(); p.moveTo(0, 26); p.bezierCurveTo(-52, -8, -26, -50, 0, -24); p.bezierCurveTo(26, -50, 52, -8, 0, 26); forma(p, "#ff5a8a", 5); });
    bt(-30, "#e3342f", "NUNCA", "dinheiro é dinheiro", t > tn - .1 && t < tm - .1, () => { const pts = []; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + Math.PI / 8; pts.push([Math.cos(a) * 40, Math.sin(a) * 40]); } forma(P.poly(pts), "#fff", 5); c.fillStyle = "#e3342f"; c.fillRect(-24, -7, 48, 14); });
    const cy = t < tn - .3 ? -250 : lerp(-250, -30, ease(lin(t, tn - .4, tn))), cx = 300 + Math.cos(t * 4) * 8; if (t > tp - .5) { c.save(); c.translate(cx, cy + 20 + Math.sin(t * 5) * 6); c.rotate(-.3); forma(P.poly([[0, 0], [0, 70], [18, 54], [30, 82], [44, 76], [32, 48], [56, 46]]), "#fff", 5); c.restore(); }
    const km = eob(lin(t, tm, tm + .3));
    if (km > 0) { c.save(); c.translate(0, 235); c.scale(km, km); forma(P.rr(-390, -74, 780, 148, 40), "#ffd23f", 6); texto("MARCA O AMIGO", 0, -24, { tam: 56, cor: OL, borda: null }); texto("QUE TE DEVE", 0, 34, { tam: 56, cor: OL, borda: null }); c.restore(); }
    c.restore();
  }
  const kf = lin(t, fm + .1, fm + .45);
  if (kf > 0) {
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = `rgba(20,16,40,${.55 * kf})`; c.fillRect(0, 0, W, H);
    c.translate(540, 760); const pu = 1 + .04 * Math.sin(t * 8), sc = eob(kf) * pu; c.scale(sc, sc);
    forma(P.rr(-390, -34, 780, 108, 54), "#8a1f3a", 6); forma(P.rr(-390, -46, 780, 108, 54), "#ff3b6b", 6);
    forma(P.el(-318, 8, 34, 34), "#fff", 5); texto("+", -318, 10, { tam: 54, cor: "#ff3b6b", borda: null });
    texto("SEGUE O PERFIL", 30, -8, { tam: 52, cor: "#fff", lw: 9 }); texto("@fora_do_roteiroai", 30, 34, { tam: 30, fonte: "Fredoka", peso: 700, cor: "#ffe3ea", borda: null });
    c.restore();
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = lin(t, fm + .5, fm + .8); texto("COMENTA: PODE OU NUNCA?", 540, 1000, { tam: 62, cor: "#ffd23f", lw: 12 }); c.restore();
  }
}
async function iniciarEp(tempo) {
  TEMPO = tempo; [W, H] = TAM[tempo.formato || "9:16"];
  for (const a of tempo.atos) ATO[a.cena] = a;
  const cv = document.getElementById("c"); cv.width = W; cv.height = H; ctx = cv.getContext("2d");
  await Promise.all(["48px Lilita", "600 48px Fredoka", "700 48px Fredoka"].map((f) => document.fonts.load(f)));
  legendas(); montarEp(); FUNDO = fazerFundo();
}
function quadroEp(t) {
  T = t; const c = ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H);
  aplicaCam(cameraEp(t)); interiorEp(t);
  c.setTransform(1, 0, 0, 1, 0, 0);
  const g = c.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * .75); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(40,10,30,.35)"); c.fillStyle = g; c.fillRect(0, 0, W, H);
  hud(t); ganchoEp(t); decisaoEp(t); desenhaLegenda(t);
}
