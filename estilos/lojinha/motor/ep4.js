// Episódio 4: Quem levou os R$ 20? (usa lib.js). Mistério interativo: 4 suspeitos, câmera de segurança, comentar o número.
// Culpado (revelado no próximo vídeo): suspeito 3 (boné verde + tênis amarelo).

const PEGS = []; for (let r = 0; r < 2; r++) for (let i = 0; i < 5; i++) PEGS.push([598 + i * 62, 640 + r * 150]);
let VISOR = () => "0,00";
let EV_SINO = () => 0;
const AM = "#ffd23f";
const SUSP = [
  { x: 180, L: { pele: "#f1c9a5", cabelo: "bone", corBone: "#2b7bd6", corCabelo: "#4a2c1a", camisa: "#e2533a", calca: "#2f4a7a", sapato: "#f4f4f4", seed: 51 }, fala: "Não fui eu!", expr: "preocupado" },
  { x: 365, L: { pele: "#8d5a3b", cabelo: "espetado", corCabelo: "#1b1410", camisa: "#7c5cd6", calca: "#3d4a5c", sapato: AM, seed: 52 }, fala: "Eu? Jamais!", expr: "feliz" },
  { x: 550, L: { pele: "#e0b08b", cabelo: "bone", corBone: "#2fa36b", corCabelo: "#2b1a12", camisa: "#35c4d8", calca: "#2b2b2b", sapato: AM, oculos: true, seed: 53 }, fala: "Tô só olhando...", expr: "pensativo" },
  { x: 735, L: { pele: "#c68b63", cabelo: "liso", corCabelo: "#2b1a12", camisa: "#ff8f3a", calca: "#4b3a6b", sapato: "#f4f4f4", barba: true, seed: 54 }, fala: "Cheguei agora!", expr: "surpreso" },
];
const SS = .72, SY = 1580;

function montarEp() {
  const g = F("gancho"), su = F("suspeitos"), ca = F("camera"), de = F("desafio"), fm = F("fim");
  HUD = {
    din: contador([[0, 100], [g + .9, 80]], 100), est: contador([[0, 12]], 0),
    ven: contador([[su + .3, 1], [su + .85, 2], [su + 1.4, 3], [su + 1.95, 4]], 0), luc: contador([[ca + .4, 2]], 0),
    chips: [[g + .9, 0, "−R$ 20", "#e3342f"], [ca + .4, 3, "2 pistas", "#f0a020"]],
    rot: ["DINHEIRO", "ESTOQUE", "SUSPEITOS", "PISTAS"], moeda: [true, false, false, false], pulso: de + .5,
    dia: { txt: "MISTÉRIO", fim: de - .5 },
  };
  EV = {
    sino: [], caixa: [], cedulas: [],
    clique: [de + .6, de + 1.4, de + 2.2],
    pop: [0, 1, 2, 3].map((i) => su + .25 + i * .55),
    carimbo: [g + .5],
    placa: [], grilos: [ca + .3, de - .2], feno: [], whoosh: [g + .1, su - .1, ca - .1, de - .1, fm - .1],
    festa: [], pulo: [], brilho: [], multidao: [], trombone: [],
    alarme: [g + .35],
    tiquetaque: [de + .2, TEMPO.total - 2.4],
    fim: [TEMPO.total - 2.4],
    tranco: [g + .4],
    secoes: { neg: .2, ven: su, son: de + .1, quieto: [[ca, de - .2]], festas: [] },
  };
}
window.eventos = () => EV;

function cameraEp(t) {
  const g = F("gancho"), su = F("suspeitos"), ca = F("camera"), de = F("desafio");
  const ch = [[0, 1.5, 860, 1200], [g + 2.4, 1.3, 800, 1230], [su, 1.12, 560, 1250], [ca, 1.1, 560, 1250], [de + .5, 1.0, 540, 1000]];
  let i = 0; while (i < ch.length - 1 && ch[i + 1][0] <= t) i++;
  const a = ch[i], b = ch[Math.min(i + 1, ch.length - 1)]; const k = b === a ? 0 : ease(lin(t, a[0], b[0]));
  let z = lerp(a[1], b[1], k), x = lerp(a[2], b[2], k), y = lerp(a[3], b[3], k);
  z *= 1 + Math.sin(t * .7) * .006; x += Math.sin(t * .5) * 4; y += Math.cos(t * .43) * 3;
  const mx = W / (2 * z), my = H / (2 * z); x = cl(x, mx, W - mx); y = cl(y, my, H - my);
  let sh = 0; for (const q of EV.tranco) sh += Math.max(0, 1 - (t - q) / .3) * (t >= q ? 1 : 0);
  return { z, x: x + Math.sin(t * 90) * 10 * sh, y: y + Math.cos(t * 77) * 8 * sh };
}

function interiorEp(t) {
  const c = ctx, g = F("gancho"), su = F("suspeitos"), ca = F("camera"), de = F("desafio");
  ruaJanela(t); c.drawImage(FUNDO, 0, 0);
  porta(t, 0, 1); relogio(t, 0); lampada(t, 1); planta(t, 1);
  // dono da loja atrás do balcão
  const eh = t < g + 1.2 ? "surpreso" : t < su ? "preocupado" : t < ca ? "pensativo" : "determinado";
  figura(EU, { x: 975, y: 1300, dir: -1, expr: eh, bE: t < g + 2 ? 2.4 : .2, bD: .2, olhar: [-1, 0] });
  balcao();
  caixaRegistradora(t, ease(lin(t, g + .1, g + .5)) * (t < su ? 1 : 1 - ease(lin(t, su, su + .5))));
  // gaveta vazia e nota 20 voando
  const kn = lin(t, g + .4, g + 1.6); if (kn > 0 && kn < 1) cedula(842, 1060 - eout(kn) * 120, 20, Math.sin(kn * 6) * .3, .8 * (1 - kn));
  // suspeitos
  SUSP.forEach((s, i) => {
    const t0 = su + .25 + i * .55, k = lin(t, t0, t0 + .4); if (k <= 0 || t > ca) return;
    const pop = eob(k), sy = SS * pop;
    const nerv = i === 0 ? Math.sin(t * 18) * .03 : 0;
    figura(s.L, { x: s.x, y: SY, s: sy, dir: 1, expr: s.expr, olhar: [0, 0], inc: nerv + (i === 2 ? Math.sin(t * 2) * .05 : 0), bE: i === 2 ? 1.0 : .15, bD: i === 2 ? 1.0 : .15 });
    c.save(); c.translate(s.x, SY - 500 * SS - 55); c.scale(pop, pop); forma(P.el(0, 0, 40, 40), "#ffd23f", 6); texto(String(i + 1), 0, 3, { tam: 54, cor: OL, borda: null }); c.restore();
    const tb = su + 2.5 + i * .85, kb = lin(t, tb, tb + .2) * (1 - lin(t, tb + .7, tb + .85));
    balao(s.x, SY - 560 * SS - 120, s.fala, kb, { tam: 34, rabo: [0, 1] });
    if (i === 0 && t > su + 1 && t < ca) { for (const [dx, ph] of [[-50, 0], [58, 1.7]]) { const q = ((t * 1.6 + ph) % 1); c.fillStyle = "#7fd0ff"; c.globalAlpha = 1 - q; c.fill(P.el(s.x + dx, SY - 330 * SS + q * 70, 6, 10)); c.globalAlpha = 1; } }
    if (i === 1 && t > su + 1.3 && t < ca) { const q = (t * 1.2) % 1; c.globalAlpha = 1 - q; texto("♪", s.x + 70, SY - 400 * SS - q * 60, { tam: 44, cor: "#fff", lw: 6 }); c.globalAlpha = 1; }
  });
}
function cctv(t) {
  const ca = F("camera"), de = F("desafio"), k = lin(t, ca + .1, ca + .4) * (1 - lin(t, de - .3, de)); if (k <= 0) return;
  const c = ctx, X = 540, Y = 930, w = 900, h = 700; c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = `rgba(10,10,20,${.6 * k})`; c.fillRect(0, 0, W, H);
  c.translate(X, Y); const s = eob(k); c.scale(s, s); c.globalAlpha = Math.min(1, k * 2);
  forma(P.rr(-w / 2 - 16, -h / 2 - 16, w + 32, h + 32, 28), "#1b1f26", 6);
  c.save(); c.beginPath(); c.rect(-w / 2, -h / 2, w, h); c.clip();
  const bg = c.createLinearGradient(0, -h / 2, 0, h / 2); bg.addColorStop(0, "#4a5560"); bg.addColorStop(1, "#262c33"); c.fillStyle = bg; c.fillRect(-w / 2, -h / 2, w, h);
  c.fillStyle = "#2e353d"; c.fillRect(-w / 2, 120, w, h / 2 - 120); // piso
  c.fillStyle = "#59626d"; c.fillRect(150, -20, 330, 360); c.fillStyle = "#6b7580"; c.fillRect(140, -40, 350, 34); // balcão
  c.fillStyle = "#3b434c"; c.fillRect(260, -110, 110, 74); c.fillStyle = "#222"; c.fillRect(272, -100, 86, 40); // caixa
  const u = lin(t, ca + .7, ca + 5.4), x = u < .38 ? lerp(-w / 2 - 60, 20, u / .38) : u < .66 ? 20 : lerp(20, -w / 2 - 60, (u - .66) / .34);
  const anda = u < .38 || u > .66, passo = (t * 7);
  const roubando = u >= .38 && u < .66;
  const L = SUSP[2].L, esc = .82, y0 = 335;
  c.filter = "grayscale(1) brightness(.22) contrast(1.4)";
  figura({ ...L, oculos: false }, { x, y: y0, s: esc, passo: anda ? passo : undefined, dir: u > .66 ? -1 : 1, expr: "neutro", bD: roubando ? 2.5 : .3, bE: .3, olhar: [0, 0] });
  c.filter = "none";
  // o tênis amarelo é a única cor do vídeo da câmera
  const bob = anda ? -Math.abs(Math.sin(passo)) * 10 : Math.sin(t * 2.4 + 53) * 2.5, dirF = u > .66 ? -1 : 1;
  for (const lado of [-1, 1]) { const px = x + esc * (lado * 24 + dirF * 12), py = y0 + esc * (-4 + bob); c.fillStyle = AM; c.beginPath(); c.ellipse(px, py, 30 * esc, 16 * esc, 0, 0, 7); c.fill(); c.lineWidth = 3; c.strokeStyle = "#111"; c.stroke(); }
  if (roubando) { const q = lin(t, ca + .7 + .38 * 4.7, ca + .7 + .66 * 4.7); cedula(lerp(310, x + 30, q), lerp(-70, y0 - 190, q), 20, q * 2, .35 * (1 - q * .6)); }
  // ruído e linhas da câmera
  c.fillStyle = "rgba(0,0,0,.18)"; for (let yy = -h / 2; yy < h / 2; yy += 6) c.fillRect(-w / 2, yy, w, 2);
  const r = rng(Math.floor(t * 30)); c.fillStyle = "rgba(255,255,255,.05)"; for (let i = 0; i < 90; i++) c.fillRect(-w / 2 + r() * w, -h / 2 + r() * h, 40 + r() * 80, 2);
  c.restore();
  if (Math.floor(t * 2) % 2 === 0) { c.fillStyle = "#e3342f"; c.beginPath(); c.arc(-w / 2 + 40, -h / 2 + 40, 14, 0, 7); c.fill(); }
  texto("REC", -w / 2 + 72, -h / 2 + 42, { tam: 34, cor: "#fff", borda: null, al: "left" });
  texto("CÂMERA 02", w / 2 - 28, -h / 2 + 42, { tam: 34, cor: "#fff", borda: null, al: "right" });
  const seg = Math.floor((t - ca) * 3 + 14 * 60 + 32 * 60 * 0); texto(`14:32:${String(10 + Math.floor((t - ca) * 3) % 50).padStart(2, "0")}`, -w / 2 + 28, h / 2 - 36, { tam: 32, cor: "#9dffb0", borda: null, al: "left" });
  const rp = Math.floor(t * 2) % 2 === 0; if (t > ca + 5.0) { c.globalAlpha = rp ? 1 : .35; texto("↻ ASSISTE DE NOVO", w / 2 - 28, h / 2 - 36, { tam: 34, cor: "#ffd23f", borda: null, al: "right" }); }
  c.restore();
}
function desafio(t) {
  const de = F("desafio"), fm = F("fim"), k = lin(t, de + .05, de + .4); if (k <= 0) return;
  const c = ctx, saida = 1 - lin(t, fm, fm + .5); c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = `rgba(20,16,40,${.62 * k * saida})`; c.fillRect(0, 0, W, H);
  c.translate(540, 880); const s = eob(k); c.scale(s, s); c.globalAlpha = saida;
  forma(P.rr(-460, -400, 920, 760, 44), "#1e2a4a", 7); forma(P.rr(-460, -412, 920, 760, 44), "#2b3a66", 7);
  forma(P.rr(-190, -452, 380, 84, 42), "#ff5a5f", 6); texto("QUEM FOI?", 0, -410, { tam: 56, cor: "#fff", lw: 9 });
  const pos = [[-210, -190], [210, -190], [-210, 70], [210, 70]];
  const sel = Math.floor(Math.max(0, t - de - .5) / .75) % 4;
  SUSP.forEach((sp, i) => {
    const [bx, by] = pos[i], ativo = t > de + .5 && sel === i, p = ativo ? 1 + .05 * Math.sin(t * 12) : 1;
    c.save(); c.translate(bx, by); c.scale(p, p);
    forma(P.rr(-190, -110, 380, 220, 36), "#1b2547", 6); forma(P.rr(-190, -122, 380, 220, 36), ativo ? "#3d5099" : "#33437f", 6);
    c.save(); c.beginPath(); c.rect(-186, -118, 372, 212); c.clip(); figura(sp.L, { x: -80, y: 150, s: .36, dir: 1, expr: "feliz", bE: .15, bD: .15 }); c.restore();
    forma(P.el(86, -22, 52, 52), AM, 6); texto(String(i + 1), 86, -19, { tam: 74, cor: OL, borda: null });
    c.restore();
  });
  texto("COMENTA O NÚMERO DO CULPADO", 0, 330, { tam: 40, cor: "#ffd23f", lw: 8 });
  const cy = lerp(pos[sel][1], pos[sel][1], 1), cx = pos[sel][0] + 120;
  if (t > de + .5) { c.save(); c.translate(cx, cy + 30 + Math.sin(t * 5) * 5); c.rotate(-.3); forma(P.poly([[0, 0], [0, 70], [18, 54], [30, 82], [44, 76], [32, 48], [56, 46]]), "#fff", 5); c.restore(); }
  c.restore();
  const kf = lin(t, fm + .1, fm + .45);
  if (kf > 0) {
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = `rgba(20,16,40,${.55 * kf})`; c.fillRect(0, 0, W, H);
    c.translate(540, 760); const pu = 1 + .04 * Math.sin(t * 8), sc = eob(kf) * pu; c.scale(sc, sc);
    forma(P.rr(-390, -34, 780, 108, 54), "#8a1f3a", 6); forma(P.rr(-390, -46, 780, 108, 54), "#ff3b6b", 6);
    forma(P.el(-318, 8, 34, 34), "#fff", 5); texto("+", -318, 10, { tam: 54, cor: "#ff3b6b", borda: null });
    texto("SEGUE O PERFIL", 30, -8, { tam: 52, cor: "#fff", lw: 9 }); texto("@fora_do_roteiroai", 30, 34, { tam: 30, fonte: "Fredoka", peso: 700, cor: "#ffe3ea", borda: null });
    c.restore();
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = lin(t, fm + .5, fm + .8); texto("RESPOSTA AMANHÃ!", 540, 960, { tam: 70, cor: "#ffd23f", lw: 12 }); texto("COMENTA: 1, 2, 3 OU 4?", 540, 1050, { tam: 54, cor: "#fff", lw: 10 }); c.restore();
  }
}
function selo(t) { // "SUMIU DINHEIRO!" nos primeiros segundos
  const g = F("gancho"), k = lin(t, g + .45, g + .7) * (1 - lin(t, g + 2.4, g + 2.7)); if (k <= 0) return;
  const c = ctx; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.translate(540, 640); c.rotate(-.07); const s = (k < 1 ? 1.8 - .8 * eout(k) : 1) * (1 + .03 * Math.sin(t * 14)); c.scale(s, s);
  forma(P.rr(-420, -105, 840, 210, 36), "#e3342f", 8); texto("SUMIU R$ 20!", 0, 6, { tam: 124, cor: "#fff", lw: 14 }); c.restore();
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
  hud(t); selo(t); cctv(t); desafio(t); desenhaLegenda(t);
}
