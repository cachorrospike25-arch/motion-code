// Lojinha — biblioteca: formas, personagens, elenco, objetos, interface e legendas. Os episódios (ep1.js, ep2.js) montam a história.
// Usa o núcleo 2D (base.js: W, H, ctx, TEMPO, rng, ease, seg, lerp, tela, tw). Tudo é função de t.

// Lojinha: simulador de vida e negócios em 2D, personagens caricatos, interface de jogo.
// Usa o núcleo 2D (base.js: W, H, ctx, TEMPO, rng, ease, seg, lerp, tela, tw). Contrato: iniciar(tempo) e quadro(t).
// Tudo é função de t: dá para tirar qualquer quadro fora de ordem.

const OL = "#2b1a10"; // contorno
let T = 0; // tempo do quadro (piscar, respirar)
let ATO = {}, LEG = [], EV = null, FUNDO, RUA;
const F = (id) => ATO[id].fala.t0, Fe = (id) => ATO[id].fala.t1, A = (id) => ATO[id].t0, Ae = (id) => ATO[id].t1;
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lin = (t, a, b) => cl((t - a) / (b - a));
const eob = (x) => { if (x <= 0) return 0; if (x >= 1) return 1; const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const eout = (x) => 1 - Math.pow(1 - cl(x), 3);
const elast = (x) => { if (x <= 0) return 0; if (x >= 1) return 1; return Math.pow(2, -10 * x) * Math.sin((x * 10 - .75) * 2.094) + 1; };
const pulse = (t, a, d = .35) => { const k = lin(t, a, a + d); return k > 0 && k < 1 ? Math.sin(k * Math.PI) : 0; };

// ---------- formas ----------
const P = {
  rr(x, y, w, h, r) { const p = new Path2D(); p.roundRect(x, y, w, h, r); return p; },
  el(x, y, rx, ry, rot = 0) { const p = new Path2D(); p.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot, 0, Math.PI * 2); return p; },
  poly(pts) { const p = new Path2D(); pts.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)); p.closePath(); return p; },
};
function forma(p, cor, lw = 6) { const c = ctx; c.fillStyle = cor; c.fill(p); if (lw) { c.lineWidth = lw; c.strokeStyle = OL; c.lineJoin = "round"; c.stroke(p); } }
function crescente(p, dx, dy, cor) { // sombra (ou brilho) em meia-lua dentro da forma
  const c = ctx; c.save(); c.clip(p); const q = new Path2D(); q.rect(-9999, -9999, 19999, 19999);
  q.addPath(p, new DOMMatrix().translate(dx, dy)); c.fillStyle = cor; c.fill(q, "evenodd"); c.restore();
}
function texto(s, x, y, { tam = 48, fonte = "Lilita", cor = "#fff", borda = OL, lw = 10, al = "center", base = "middle", peso = "" } = {}) {
  const c = ctx; c.font = `${peso} ${tam}px ${fonte}`.trim(); c.textAlign = al; c.textBaseline = base; c.lineJoin = "round";
  if (borda) { c.strokeStyle = borda; c.lineWidth = lw; c.strokeText(s, x, y); }
  c.fillStyle = cor; c.fillText(s, x, y);
}
const reais = (v) => "R$ " + Math.round(v).toLocaleString("pt-BR");

// ---------- personagem ----------
// L = aparência, Q = pose. Devolve a posição das mãos no mundo (para segurar coisas).
function figura(L, Q) {
  const c = ctx, s = Q.s || 1, w = L.larg || 1, dir = Q.dir || 1, sd = L.seed || 1;
  const inv = c.getTransform().inverse();
  const andar = Q.passo != null;
  const bob = (andar ? -Math.abs(Math.sin(Q.passo)) * 10 : Math.sin(T * 2.4 + sd) * 2.5);
  c.save(); c.translate(Q.x, Q.y - (Q.pulo || 0)); c.scale(s * (1 + (Q.sq || 0)), s * (1 - (Q.sq || 0)));
  // sombra no chão
  c.save(); c.globalAlpha = .22 / (1 + (Q.pulo || 0) / 80); c.fillStyle = "#3a1d10"; c.fill(P.el(0, (Q.pulo || 0) / s + 4, 70 * w, 14)); c.restore();
  // pernas
  const pa = andar ? Math.sin(Q.passo) * .5 : 0;
  for (const lado of [-1, 1]) {
    c.save(); c.translate(lado * 24 * w, -116 + bob); c.rotate(lado === -1 ? pa : -pa);
    forma(P.rr(-17, -6, 34, 116, 15), L.calca || "#2f4a7a");
    forma(P.el(dir * 12, 112, 30, 16), L.sapato || "#f4f4f4", 5);
    c.restore();
  }
  // braço de trás do corpo? Não: visão de frente, os dois braços por cima do tronco
  const tronco = P.rr(-62 * w, -270 + bob, 124 * w, 166, 48);
  forma(tronco, L.camisa);
  crescente(tronco, -14, -8, "rgba(60,20,40,.22)");
  crescente(tronco, 10, 10, "rgba(255,255,255,.14)");
  if (L.barriga) { const b = P.el(0, -170 + bob, 66 * w, 62); forma(b, L.camisa, 5); crescente(b, -12, -8, "rgba(60,20,40,.2)"); }
  if (L.avental) { const a = P.rr(-46 * w, -205 + bob, 92 * w, 110, 18); forma(a, L.avental, 5); c.fillStyle = "rgba(0,0,0,.08)"; c.fill(P.rr(-20, -170 + bob, 40, 28, 6)); }
  if (L.capuz) { c.lineWidth = 5; c.strokeStyle = OL; c.beginPath(); c.moveTo(-40 * w, -262 + bob); c.quadraticCurveTo(0, -222 + bob, 40 * w, -262 + bob); c.stroke(); c.fillStyle = "#fff"; c.fillRect(-14, -248 + bob, 4, 34); c.fillRect(10, -248 + bob, 4, 30); forma(P.rr(-40, -170 + bob, 80, 40, 14), "rgba(0,0,0,.12)", 4); }
  if (L.terno) {
    forma(P.poly([[-16, -268 + bob], [16, -268 + bob], [0, -200 + bob]]), "#fff", 4);
    forma(P.poly([[-7, -258 + bob], [7, -258 + bob], [10, -190 + bob], [0, -175 + bob], [-10, -190 + bob]]), L.gravata || "#d63c3c", 4);
  }
  if (L.gravata && !L.terno) forma(P.poly([[-7, -262 + bob], [7, -262 + bob], [10, -200 + bob], [0, -186 + bob], [-10, -200 + bob]]), L.gravata, 4);
  // braços
  const maos = {};
  const braco = (lado, ang, nome) => {
    c.save(); c.translate(lado * 58 * w, -250 + bob); c.rotate(-lado * ang);
    forma(P.rr(-16, -6, 32, 104, 16), L.manga || L.camisa, 5);
    forma(P.el(0, 106, 20, 20), L.pele, 5);
    const m = inv.transformPoint(c.getTransform().transformPoint(new DOMPoint(0, 106))); maos[nome] = { x: m.x, y: m.y };
    c.restore();
  };
  braco(-1, Q.bE ?? .12, "e"); braco(1, Q.bD ?? .12, "d");
  // cabeça
  c.save(); c.translate(0, -352 + bob); c.rotate(Q.inc || 0); if (Q.cs) c.scale(1 + Q.cs, 1 - Q.cs);
  forma(P.rr(-20, 60, 40, 40, 10), L.pele, 0);
  const fx = dir * 16 + (Q.vira || 0) * 22;
  forma(P.el(-86, 10, 20, 24), L.pele, 5); forma(P.el(86, 10, 20, 24), L.pele, 5);
  if (L.cabelo === "rabo") forma(P.el(-dir * 92, 30, 30, 52, dir * .3), L.corCabelo, 5);
  if (L.cabelo === "longo") forma(P.rr(-98, -40, 196, 150, 60), L.corCabelo, 5);
  const cab = P.el(0, 0, 92, 88);
  forma(cab, L.pele); crescente(cab, -16, -8, "rgba(90,30,20,.18)"); crescente(cab, 10, 8, "rgba(255,240,220,.18)");
  cabelo(L, fx);
  // rosto
  const ex = Q.expr || "neutro";
  const pisc = ((T + sd * 1.7) % 3.4) < .11 && ex !== "euforico";
  const ol = Q.olhar || [0, 0];
  for (const lado of [-1, 1]) {
    const ox = fx + lado * 28, oy = -6;
    if (ex === "euforico" || ex === "rindo") { c.lineWidth = 7; c.strokeStyle = OL; c.lineCap = "round"; c.beginPath(); c.moveTo(ox - 15, oy + 6); c.quadraticCurveTo(ox, oy - 16, ox + 15, oy + 6); c.stroke(); continue; }
    const big = ex === "surpreso" ? 1.2 : 1;
    const ry = (pisc ? 3 : 25) * big;
    forma(P.el(ox, oy, 20 * big, ry), "#fff", 5);
    if (!pisc) {
      const pr = ex === "surpreso" ? 8 : 11;
      c.fillStyle = OL; c.fill(P.el(ox + ol[0] * 8, oy + ol[1] * 9 + 3, pr, pr * 1.1));
      c.fillStyle = "#fff"; c.fill(P.el(ox + ol[0] * 8 + 4, oy + ol[1] * 9 - 2, 3.5, 3.5));
      if (ex === "sonhador" || ex === "pensativo") { c.save(); c.clip(P.el(ox, oy, 21, 26)); c.fillStyle = L.pele; c.fillRect(ox - 25, oy - 30, 50, ex === "sonhador" ? 22 : 16); c.restore(); c.lineWidth = 5; c.beginPath(); c.moveTo(ox - 20, oy - (ex === "sonhador" ? 8 : 14)); c.lineTo(ox + 20, oy - (ex === "sonhador" ? 8 : 14)); c.stroke(); }
    }
    if (L.oculos) { c.lineWidth = 5; c.strokeStyle = OL; c.stroke(P.el(ox, oy, 27, 27)); }
    if (L.escuros) forma(P.rr(ox - 26, oy - 16, 52, 32, 12), "#1b1b24", 4);
  }
  if (L.oculos) { c.beginPath(); c.moveTo(fx - 2, -6); c.lineTo(fx + 2, -6); c.stroke(); }
  // sobrancelhas
  const sb = { feliz: [.15, -4], euforico: [.25, -12], surpreso: [0, -20], preocupado: [-.45, -4], pensativo: [.3, 0], neutro: [0, 0], sonhador: [.2, -6], determinado: [.4, 6], rindo: [.2, -8] }[ex] || [0, 0];
  c.lineCap = "round"; c.lineWidth = 9; c.strokeStyle = L.sobrancelha || L.corCabelo || OL;
  for (const lado of [-1, 1]) { const bx = fx + lado * 28, by = -42 + sb[1]; const a = sb[0] * lado; c.beginPath(); c.moveTo(bx - 14 * Math.cos(a), by + 14 * Math.sin(a) * -1 * lado * lado); c.lineTo(bx + 14 * Math.cos(a), by - 14 * Math.sin(a)); c.stroke(); }
  // nariz e bochechas
  forma(P.el(fx + dir * 5, 22, 14, 11), shade(L.pele, -.12), 4);
  c.globalAlpha = .3; c.fillStyle = "#ff6f7d"; c.fill(P.el(fx - 50, 34, 16, 9)); c.fill(P.el(fx + 50, 34, 16, 9)); c.globalAlpha = 1;
  if (L.bigode) forma(P.poly([[fx - 40, 44], [fx - 10, 34], [fx, 40], [fx + 10, 34], [fx + 40, 44], [fx + 24, 52], [fx, 46], [fx - 24, 52]]), L.corCabelo, 4);
  if (L.barba) { c.save(); c.clip(cab); forma(P.el(0, 70, 88, 46), L.corCabelo, 5); c.restore(); }
  boca(ex, fx, Q.fala || 0);
  c.restore();
  c.restore();
  return maos;
}
function cabelo(L, fx) {
  const c = ctx, cor = L.corCabelo || "#2b1a12";
  if (L.cabelo === "cacheado") {
    const p = new Path2D(); const r = rng(5);
    for (let i = 0; i < 13; i++) { const a = Math.PI * (1.05 + i / 12 * .9); const rr = 26 + r() * 10; p.ellipse(Math.cos(a) * 80, Math.sin(a) * 74 - 8, rr, rr, 0, 0, 7); p.closePath(); }
    for (let i = 0; i < 5; i++) { p.ellipse(-50 + i * 25, -86 + (i % 2) * 8, 30, 28, 0, 0, 7); p.closePath(); }
    c.lineWidth = 12; c.strokeStyle = OL; c.stroke(p); c.fillStyle = cor; c.fill(p);
    c.fillStyle = "rgba(255,255,255,.12)"; c.fill(P.el(-30, -88, 22, 10));
  } else if (L.cabelo === "bone") {
    forma(P.poly([[-92, -10], [-80, -70], [-30, -100], [30, -100], [80, -70], [92, -10]]), L.corBone || "#d94a3a");
    forma(P.el(fx * 3 + 40 * Math.sign(fx || 1), -14, 70, 18), shade(L.corBone || "#d94a3a", -.15), 5);
    forma(P.el(0, -98, 10, 7), "#fff", 4);
  } else if (L.cabelo === "coque") {
    forma(P.el(0, -122, 40, 34), cor); forma(P.poly([[-92, 0], [-84, -60], [-40, -92], [40, -92], [84, -60], [92, 0], [60, -40], [0, -60], [-60, -40]]), cor);
  } else if (L.cabelo === "careca") {
    c.fillStyle = "rgba(255,255,255,.35)"; c.fill(P.el(-24, -60, 26, 12, -.4));
    forma(P.poly([[-92, 20], [-90, -20], [-76, -10], [-80, 30]]), L.corCabelo || "#ddd", 4); forma(P.poly([[92, 20], [90, -20], [76, -10], [80, 30]]), L.corCabelo || "#ddd", 4);
  } else if (L.cabelo === "espetado") {
    const pts = [[-92, -10]]; for (let i = 0; i <= 8; i++) { const x = -88 + i * 22; pts.push([x - 6, -70 - (i % 2 ? 10 : 0)]); pts.push([x + 4, -128 - (i % 3) * 12]); } pts.push([92, -10], [60, -50], [0, -62], [-60, -50]);
    forma(P.poly(pts), cor);
  } else if (L.cabelo === "liso" || L.cabelo === "rabo" || L.cabelo === "longo") {
    forma(P.poly([[-96, 10], [-92, -50], [-50, -96], [40, -98], [90, -56], [96, 10], [70, -30], [20, -40], [fx - 10, -10], [-40, -46], [-70, -20]]), cor);
  } else if (L.cabelo === "topete") {
    forma(P.poly([[-92, -14], [-84, -66], [-40, -100], [30, -118], [90, -80], [96, -20], [60, -60], [0, -62], [-50, -50]]), cor);
  }
  if (L.fone) { c.lineWidth = 12; c.strokeStyle = L.fone; c.beginPath(); c.arc(0, -10, 100, Math.PI * 1.08, Math.PI * 1.92); c.stroke(); c.lineWidth = 5; c.strokeStyle = OL; c.stroke(); forma(P.rr(-112, -20, 30, 56, 12), L.fone); forma(P.rr(82, -20, 30, 56, 12), L.fone); }
}
function boca(ex, fx, fala) {
  const c = ctx, x = fx + 4, y = 50;
  const aberta = (largura, prof) => {
    const p = new Path2D(); p.moveTo(x - largura, y - 4); p.quadraticCurveTo(x, y + prof * 1.9, x + largura, y - 4); p.closePath();
    forma(p, "#7a2230", 5); c.save(); c.clip(p); c.fillStyle = "#fff"; c.fillRect(x - largura, y - 8, largura * 2, 10); c.fillStyle = "#ff8a8a"; c.fill(P.el(x, y + prof, largura * .55, prof * .45)); c.restore(); c.lineWidth = 5; c.strokeStyle = OL; c.stroke(p);
  };
  c.lineCap = "round"; c.strokeStyle = OL; c.lineWidth = 7;
  if (ex === "feliz" || ex === "rindo") aberta(32, 18 + fala * 8);
  else if (ex === "euforico") aberta(42, 30);
  else if (ex === "surpreso") forma(P.el(x, y + 6, 15, 20), "#7a2230", 5);
  else if (ex === "preocupado") { c.beginPath(); c.moveTo(x - 26, y + 8); c.bezierCurveTo(x - 12, y - 4, x + 4, y + 16, x + 24, y + 2); c.stroke(); }
  else if (ex === "pensativo") { c.beginPath(); c.moveTo(x - 8, y + 6); c.lineTo(x + 22, y); c.stroke(); }
  else if (ex === "determinado") { c.beginPath(); c.moveTo(x - 22, y + 4); c.quadraticCurveTo(x + 4, y + 12, x + 26, y - 6); c.stroke(); }
  else { c.beginPath(); c.moveTo(x - 22, y); c.quadraticCurveTo(x, y + 16, x + 22, y); c.stroke(); }
}
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = (v) => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k);
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

// ---------- elenco ----------
const EU = { pele: "#b9784f", cabelo: "cacheado", corCabelo: "#2b1a12", camisa: "#ff7a2f", calca: "#2f4a7a", sapato: "#f4f4f4", capuz: true, seed: 1 };
const EU_TERNO = { ...EU, camisa: "#2a3550", calca: "#2a3550", terno: true, gravata: "#ffcf3a", escuros: true, capuz: false, sapato: "#1b1b1b" };
const FORN = { pele: "#e0a879", cabelo: "bone", corBone: "#d94a3a", corCabelo: "#4a2c1a", bigode: true, camisa: "#3b6fb6", avental: "#ead7b0", barriga: true, larg: 1.25, calca: "#4a3b2e", sapato: "#3a2a20", seed: 4 };
const CLIENTES = [
  { pele: "#f1c9a5", cabelo: "rabo", corCabelo: "#c0562f", camisa: "#7c5cd6", calca: "#2d2d44", seed: 2, s: .95 },
  { pele: "#8d5a3b", cabelo: "careca", corCabelo: "#ddd", camisa: "#2fa36b", calca: "#3a3a3a", oculos: true, seed: 3, larg: 1.15 },
  { pele: "#e0b08b", cabelo: "bone", corBone: "#2b7bd6", camisa: "#ffd23f", calca: "#3d4a5c", fone: "#ff4f6d", seed: 5, s: .9 },
  { pele: "#6b4329", cabelo: "coque", corCabelo: "#1b1410", camisa: "#ff6fa8", calca: "#4b3a6b", seed: 6 },
  { pele: "#f1c9a5", cabelo: "topete", corCabelo: "#e7c35a", camisa: "#e8e2d6", calca: "#24324a", gravata: "#d63c3c", seed: 7 },
  { pele: "#c68b63", cabelo: "espetado", corCabelo: "#2b2b2b", camisa: "#35c4d8", calca: "#2b2b2b", seed: 8, s: .72 },
  { pele: "#a8714d", cabelo: "liso", corCabelo: "#2b1a12", camisa: "#e2533a", calca: "#2f4a7a", barba: true, larg: 1.2, seed: 9 },
  { pele: "#f1c9a5", cabelo: "coque", corCabelo: "#d9d4cc", camisa: "#9ec8ff", calca: "#6b5a45", oculos: true, seed: 10, s: .92 },
  { pele: "#8d5a3b", cabelo: "longo", corCabelo: "#3b2216", camisa: "#ffb43a", calca: "#2f6a4f", seed: 11 },
  { pele: "#e0b08b", cabelo: "espetado", corCabelo: "#7a3b1a", camisa: "#5bd66b", calca: "#3d4a5c", seed: 12, s: .7 },
];
const FALAS_CLI = { 0: "Que fofo!", 3: "Vou levar!", 6: "Tem de estrela?", 9: "O último é meu!" };

// ---------- movimento por chaves ----------
// chaves: [[t, x, y], ...]; devolve {x, y, passo, dir}
function mover(t, ch, dir0 = 1) {
  if (t <= ch[0][0]) return { x: ch[0][1], y: ch[0][2], passo: null, dir: dir0 };
  let dist = 0, dir = dir0;
  for (let i = 0; i < ch.length - 1; i++) {
    const [ta, xa, ya] = ch[i], [tb, xb, yb] = ch[i + 1];
    const L = Math.hypot(xb - xa, yb - ya);
    if (xb !== xa) dir = Math.sign(xb - xa);
    if (t < tb) {
      const k = (t - ta) / (tb - ta); const ke = k; // velocidade constante (o passo acompanha)
      return { x: lerp(xa, xb, ke), y: lerp(ya, yb, ke), passo: L > 2 ? (dist + L * ke) * .045 : null, dir };
    }
    dist += L;
  }
  const u = ch[ch.length - 1]; return { x: u[1], y: u[2], passo: null, dir };
}

// ---------- chaveiros ----------
const CORES_CH = ["#ffcf3a", "#ff4f6d", "#4fc3ff", "#7be36b", "#c47bff", "#ff9a3a", "#ffcf3a", "#ff6fa8", "#35e0c0", "#ff4f4f"];
function chaveiro(x, y, i, ang = 0, s = 1) {
  const c = ctx; c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s);
  c.lineWidth = 4; c.strokeStyle = "#8c8f96"; c.beginPath(); c.arc(0, 8, 9, 0, 7); c.stroke();
  c.beginPath(); c.moveTo(0, 17); c.lineTo(0, 32); c.stroke();
  const cor = CORES_CH[i % 10]; const k = i % 5;
  c.translate(0, 52);
  if (k === 0) { const pts = []; for (let j = 0; j < 10; j++) { const a = -Math.PI / 2 + j * Math.PI / 5, r = j % 2 ? 10 : 22; pts.push([Math.cos(a) * r, Math.sin(a) * r]); } forma(P.poly(pts), cor, 4); }
  else if (k === 1) { const p = new Path2D(); p.moveTo(0, 18); p.bezierCurveTo(-30, -4, -14, -26, 0, -10); p.bezierCurveTo(14, -26, 30, -4, 0, 18); forma(p, cor, 4); }
  else if (k === 2) { forma(P.el(0, 0, 20, 20), cor, 4); c.fillStyle = OL; c.fill(P.el(-6, -4, 3, 4)); c.fill(P.el(6, -4, 3, 4)); c.lineWidth = 3; c.beginPath(); c.arc(0, 2, 9, .3, Math.PI - .3); c.stroke(); }
  else if (k === 3) forma(P.poly([[0, -22], [18, 0], [0, 22], [-18, 0]]), cor, 4);
  else { forma(P.poly([[-18, 8], [-20, -14], [-8, -2], [0, -20], [8, -2], [20, -14], [18, 8]]), cor, 4); }
  c.fillStyle = "rgba(255,255,255,.5)"; c.fill(P.el(-6, -8, 5, 3));
  c.restore();
}

// ---------- cédulas ----------
function cedula(x, y, valor, ang = 0, s = 1) {
  const c = ctx; c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s);
  const cor = valor === 50 ? "#e09a4a" : valor === 10 ? "#e46a6a" : valor === 5 ? "#9b7be0" : "#6cc3a0";
  forma(P.rr(-70, -36, 140, 72, 10), cor, 5);
  c.strokeStyle = "rgba(0,0,0,.2)"; c.lineWidth = 3; c.strokeRect(-60, -27, 120, 54);
  c.fillStyle = "rgba(255,255,255,.35)"; c.fill(P.el(-26, 0, 20, 20));
  texto(String(valor), 34, 2, { tam: 34, cor: "#fff", lw: 6 });
  c.restore();
}
function moeda(x, y, ang = 0, s = 1) { const c = ctx; c.save(); c.translate(x, y); c.scale(Math.cos(ang) * s, s); forma(P.el(0, 0, 18, 18), "#ffcc33", 4); texto("$", 0, 1, { tam: 20, cor: "#b8860b", borda: null }); c.restore(); }

// ---------- balões ----------
function balao(x, y, txt, k, { tam = 44, rabo = [0, 1], cor = "#fff", corTxt = OL, pensa = false } = {}) {
  if (k <= 0) return;
  const c = ctx; c.save(); c.translate(x, y); const s = eob(Math.min(1, k * 3)); c.scale(s, s);
  c.font = `${tam}px Lilita`; const w = c.measureText(txt).width + 56, h = tam + 40;
  if (pensa) { forma(P.el(rabo[0] * 30, h / 2 + 30, 14, 12), cor, 5); forma(P.el(rabo[0] * 52, h / 2 + 62, 9, 8), cor, 4); }
  const p = P.rr(-w / 2, -h / 2, w, h, pensa ? h / 2 : 26);
  if (!pensa) { const r = new Path2D(); r.moveTo(rabo[0] * 20 - 16, h / 2 - 4); r.lineTo(rabo[0] * 60, h / 2 + 34); r.lineTo(rabo[0] * 20 + 16, h / 2 - 4); r.closePath(); forma(r, cor, 5); }
  forma(p, cor, 5); if (!pensa) { c.fillStyle = cor; c.fillRect(rabo[0] * 20 - 13, h / 2 - 10, 26, 10); }
  texto(txt, 0, 3, { tam, cor: corTxt, borda: null });
  c.restore();
}

// ---------- cenário: loja por dentro ----------
const CHAO = 1290;
function fazerFundo() {
  const g = tela(W, H), c = g.getContext("2d"); const salva = ctx; ctx = c;
  // parede com papel listrado
  c.fillStyle = "#f7d9a8"; c.fillRect(0, 0, W, CHAO);
  for (let x = 0; x < W; x += 60) { c.fillStyle = "rgba(230,170,100,.35)"; c.fillRect(x, 0, 24, CHAO); }
  for (let x = 30; x < W; x += 120) for (let y = 40; y < CHAO; y += 120) { c.fillStyle = "rgba(255,255,255,.35)"; c.fill(P.el(x, y, 6, 6)); }
  const gr = c.createLinearGradient(0, 0, 0, CHAO); gr.addColorStop(0, "rgba(90,40,20,.25)"); gr.addColorStop(.3, "rgba(90,40,20,0)"); c.fillStyle = gr; c.fillRect(0, 0, W, CHAO);
  // rodapé
  forma(P.rr(-10, CHAO - 50, W + 20, 56, 0), "#8a5a3b", 6);
  // chão em perspectiva (xadrez)
  const vx = 540, vy = -400; const linhas = [CHAO, 1350, 1425, 1515, 1625, 1760, 1925];
  for (let r = 0; r < linhas.length - 1; r++) for (let k = -9; k <= 9; k++) {
    const y0 = linhas[r], y1 = linhas[r + 1];
    const xAt = (kk, y) => vx + (kk * 150) * (y - vy) / (CHAO - vy);
    const q = P.poly([[xAt(k, y0), y0], [xAt(k + 1, y0), y0], [xAt(k + 1, y1), y1], [xAt(k, y1), y1]]);
    c.fillStyle = (r + k) % 2 ? "#2fb8a6" : "#f6efe0"; c.fill(q);
  }
  const sh = c.createLinearGradient(0, CHAO, 0, H); sh.addColorStop(0, "rgba(40,20,10,.28)"); sh.addColorStop(.4, "rgba(40,20,10,0)"); c.fillStyle = sh; c.fillRect(0, CHAO, W, H - CHAO);
  c.lineWidth = 6; c.strokeStyle = OL; c.beginPath(); c.moveTo(0, CHAO + 6); c.lineTo(W, CHAO + 6); c.stroke();
  // moldura da janela (o vidro fica vazado para a rua aparecer)
  forma(P.rr(262, 552, 276, 460, 14), "#8a5a3b", 6);
  c.clearRect(282, 572, 236, 420);
  c.fillStyle = "#8a5a3b"; c.fillRect(395, 572, 10, 420); c.fillRect(282, 775, 236, 10);
  c.lineWidth = 6; c.strokeStyle = OL; c.strokeRect(282, 572, 236, 420);
  forma(P.rr(250, 1000, 300, 28, 8), "#a8714d", 6);
  // batente da porta
  forma(P.rr(28, 610, 224, CHAO - 600, 12), "#7a4a2e", 6);
  // faixa "MINHA LOJINHA"
  ctx = c; c.save(); c.translate(720, 470); c.rotate(-.03); forma(P.rr(-200, -42, 400, 84, 16), "#ff5a5f", 6); texto("MINHA LOJINHA", 0, 4, { tam: 50, cor: "#fff7d6", lw: 8 }); c.restore();
  // prateleiras vazias à direita
  for (const y of [470, 640]) { forma(P.rr(900, y, 200, 22, 6), "#a8714d", 5); c.fillStyle = "rgba(0,0,0,.12)"; c.fillRect(905, y + 22, 190, 14); }
  // quadro de pinos (expositor)
  forma(P.rr(560, 560, 320, 360, 18), "#d9b27c", 6);
  c.fillStyle = "rgba(90,50,20,.35)"; for (let x = 580; x < 870; x += 31) for (let y = 585; y < 905; y += 31) c.fill(P.el(x, y, 4, 4));
  for (const [x, y] of PEGS) forma(P.rr(x - 5, y - 6, 10, 22, 4), "#8c8f96", 4);
  ctx = salva; return g;
}
function balcao() {
  const bt = P.rr(740, 1130, 420, 300, 10); forma(bt, "#c9783c", 6); crescente(bt, -20, 0, "rgba(60,20,10,.15)");
  for (let x = 770; x < 1080; x += 104) forma(P.rr(x, 1170, 84, 230, 10), "#b8692f", 5);
  forma(P.rr(722, 1106, 420, 36, 10), "#e39a52", 6);
}
function caixaRegistradora(t, abre) {
  const c = ctx; c.save(); c.translate(842, 1110); c.scale(.85, .85);
  forma(P.rr(-60, -10 + abre * 0, 120, 26, 6), "#2a8f84", 5); // gaveta
  c.translate(0, -0); if (abre > 0) forma(P.rr(-56, 10, 112, 18 + abre * 28, 5), "#e0e0e0", 5);
  const corpo = P.poly([[-90, 0], [90, 0], [74, -110], [-74, -110]]); forma(corpo, "#2bb3a3"); crescente(corpo, -12, 0, "rgba(0,0,0,.15)");
  forma(P.rr(-60, -160, 120, 56, 10), "#2bb3a3");
  forma(P.rr(-48, -150, 96, 36, 6), "#173b36", 4);
  texto(VISOR(t), 0, -131, { tam: 26, fonte: "Lilita", cor: "#7dffb0", borda: null });
  for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) forma(P.rr(-62 + k * 32, -92 + r * 28, 26, 20, 6), "#fff4dc", 3);
  c.restore();
}

// ---------- rua vista pela janela ----------
function ruaJanela(t) {
  const c = ctx; c.save(); c.beginPath(); c.rect(282, 572, 236, 420); c.clip();
  const g = c.createLinearGradient(0, 572, 0, 992); g.addColorStop(0, "#8fd3ff"); g.addColorStop(1, "#d8f1ff"); c.fillStyle = g; c.fillRect(282, 572, 236, 420);
  // a loja grande do outro lado, já ali na janela
  forma(P.rr(300, 640, 200, 230, 6), "#ffe7c2", 5); forma(P.rr(300, 640, 200, 40, 6), "#e94b4b", 5); texto("MEGALOJA", 400, 661, { tam: 24, cor: "#fff", lw: 5 });
  for (let i = 0; i < 3; i++) forma(P.rr(312 + i * 62, 700, 52, 70, 4), "#7fd0ff", 4);
  forma(P.rr(282, 870, 236, 40, 0), "#c9c2b5", 0); c.fillStyle = "#6b6f78"; c.fillRect(282, 905, 236, 90);
  c.fillStyle = "#f7d24a"; for (let x = 282 - (t * 60 % 50); x < 520; x += 50) c.fillRect(x, 948, 26, 6);
  // carro passando de tempos em tempos
  for (let k = 0; k < 6; k++) {
    const ph = (t * .32 + k * .37) % 2.2; const x = 220 + ph * 260; const y = 930 + (k % 2) * 30;
    if (x < 260 || x > 560) continue; const cor = ["#ff5a5f", "#4fc3ff", "#ffcf3a", "#7be36b"][k % 4];
    forma(P.rr(x - 44, y - 30, 88, 30, 10), cor, 4); forma(P.rr(x - 26, y - 50, 52, 24, 8), "#bfe9ff", 4); forma(P.el(x - 24, y, 10, 10), "#333", 3); forma(P.el(x + 24, y, 10, 10), "#333", 3);
  }
  // reflexo no vidro
  c.globalAlpha = .25; c.fillStyle = "#fff"; c.beginPath(); c.moveTo(300, 990); c.lineTo(380, 572); c.lineTo(420, 572); c.lineTo(340, 990); c.fill(); c.globalAlpha = 1;
  c.restore();
}

// ---------- porta, placa, sino ----------
function porta(t, abre, placaK) {
  const c = ctx;
  // vão (rua lá fora)
  c.fillStyle = "#bfe7ff"; c.fillRect(42, 624, 196, CHAO - 624);
  c.fillStyle = "#c9c2b5"; c.fillRect(42, 1140, 196, CHAO - 1140);
  const w = 196 * (1 - abre * .82);
  const pd = P.rr(42, 624, w, CHAO - 630, 6); forma(pd, "#c9783c", 6); crescente(pd, -14, 0, "rgba(60,20,10,.15)");
  if (w > 60) { forma(P.rr(42 + w * .14, 660, w * .72, 300, 8), "#bfe7ff", 5); c.globalAlpha = .3; c.fillStyle = "#fff"; c.fillRect(42 + w * .2, 680, 14, 260); c.globalAlpha = 1; }
  forma(P.el(42 + w * .85, 980, 12, 12), "#ffcf3a", 4);
  // placa pendurada que vira de FECHADO para ABERTO
  if (w > 120) {
    const cx = 42 + w / 2, cy = 800; const sx = Math.cos(placaK * Math.PI);
    c.lineWidth = 4; c.strokeStyle = OL; c.beginPath(); c.moveTo(cx - 40, 700); c.lineTo(cx, 680); c.lineTo(cx + 40, 700); c.stroke();
    c.save(); c.translate(cx, cy - 70); c.scale(Math.max(.04, Math.abs(sx)), 1);
    const ab = placaK > .5; forma(P.rr(-80, 0, 160, 66, 12), ab ? "#38c172" : "#e3342f", 5); texto(ab ? "ABERTO" : "FECHADO", 0, 35, { tam: 32, cor: "#fff", lw: 6 });
    c.restore();
  }
  // sino
  const bal = Math.sin(t * 22) * EV_SINO(t) * .6;
  c.save(); c.translate(140, 612); c.rotate(bal); forma(P.poly([[-22, 0], [22, 0], [16, -30], [0, -40], [-16, -30]]), "#ffcf3a", 5); forma(P.el(0, 4, 7, 7), "#b8860b", 3); c.restore();
}

// ---------- teia e aranha ----------
function teia(t, k) {
  if (k <= 0) return; const c = ctx; c.save(); c.globalAlpha = k * .85; c.strokeStyle = "#fff"; c.lineWidth = 2.5;
  const ox = 0, oy = 336;
  for (let a = 0; a <= 6; a++) { const ang = a / 6 * Math.PI / 2; c.beginPath(); c.moveTo(ox, oy); c.lineTo(ox + Math.cos(ang) * 230, oy + Math.sin(ang) * 230); c.stroke(); }
  for (let r = 40; r < 230; r += 38) { c.beginPath(); for (let a = 0; a <= 6; a++) { const ang = a / 6 * Math.PI / 2; const x = ox + Math.cos(ang) * r, y = oy + Math.sin(ang) * r; a ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
  const fy = 470 + Math.sin(t * 1.8) * 30; c.beginPath(); c.moveTo(150, 380); c.lineTo(150, fy); c.stroke();
  c.globalAlpha = k; forma(P.el(150, fy + 14, 16, 14), "#2b1a10", 0);
  c.strokeStyle = "#2b1a10"; c.lineWidth = 3; for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(150, fy + 10 + i * 5); c.lineTo(150 + s * 26, fy + i * 10 - 4 + Math.sin(t * 6 + i) * 3); c.stroke(); }
  c.fillStyle = "#fff"; c.fill(P.el(145, fy + 10, 3, 3)); c.fill(P.el(155, fy + 10, 3, 3));
  c.restore();
}
function feno(t, a, b) { // bola de feno rolando pela loja vazia
  const k = lin(t, a, b); if (k <= 0 || k >= 1) return; const c = ctx;
  const x = -100 + k * 1300, y = 1640 - Math.abs(Math.sin(k * Math.PI * 4)) * 90;
  c.save(); c.translate(x, y); c.rotate(k * 14); c.strokeStyle = "#b9894b"; c.lineWidth = 5; const r = rng(3);
  for (let i = 0; i < 16; i++) { c.beginPath(); c.arc((r() - .5) * 30, (r() - .5) * 30, 20 + r() * 26, r() * 6, r() * 6 + 3); c.stroke(); }
  c.restore();
}

// ---------- planta, relógio, lâmpada ----------
function planta(t, viva) {
  const c = ctx; c.save(); c.translate(560, 1300); c.scale(1.15, 1.15);
  forma(P.poly([[-34, 0], [34, 0], [26, -60], [-26, -60]]), "#d9643a", 5);
  const caida = 1 - viva;
  for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * .45 + caida * (i - 2 >= 0 ? 1 : -1) * 1.0 + Math.sin(t * 2 + i) * .04; c.save(); c.translate(0, -60); c.rotate(a + Math.PI / 2); forma(P.el(0, -52, 16, 46), viva > .5 ? "#3fbf5f" : "#9aa54a", 4); c.restore(); }
  if (viva > .5) { const s = eob((viva - .5) * 2); c.save(); c.translate(0, -150); c.scale(s, s); for (let i = 0; i < 5; i++) { c.save(); c.rotate(i * 1.256); forma(P.el(0, -16, 10, 16), "#ff6fa8", 3); c.restore(); } forma(P.el(0, 0, 10, 10), "#ffcf3a", 3); c.restore(); }
  c.restore();
}
function relogio(t, giro) {
  const c = ctx; c.save(); c.translate(400, 430); forma(P.el(0, 0, 58, 58), "#fff7e6"); c.lineWidth = 6; c.strokeStyle = OL;
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; c.lineWidth = 4; c.beginPath(); c.moveTo(Math.cos(a) * 44, Math.sin(a) * 44); c.lineTo(Math.cos(a) * 52, Math.sin(a) * 52); c.stroke(); }
  const h = 9 + t / 60 + giro / 12, m = t + giro;
  c.lineWidth = 7; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.sin(h / 12 * 6.283) * 26, -Math.cos(h / 12 * 6.283) * 26); c.stroke();
  c.lineWidth = 5; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.sin(m * 6.283) * 40, -Math.cos(m * 6.283) * 40); c.stroke();
  forma(P.el(0, 0, 6, 6), OL, 0); c.restore();
}
function lampada(t, brilho) {
  const c = ctx; const a = Math.sin(t * 1.3) * .05; c.save(); c.translate(560, 0); c.rotate(a);
  c.lineWidth = 4; c.strokeStyle = OL; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 340); c.stroke();
  forma(P.poly([[-60, 400], [60, 400], [30, 340], [-30, 340]]), "#2fb8a6", 5);
  forma(P.el(0, 404, 20, 14), brilho > .5 ? "#fff6c8" : "#ddd", 4);
  if (brilho > 0) { c.globalCompositeOperation = "lighter"; const g = c.createRadialGradient(0, 420, 0, 0, 420, 420); g.addColorStop(0, `rgba(255,230,150,${.25 * brilho})`); g.addColorStop(1, "rgba(255,230,150,0)"); c.fillStyle = g; c.fillRect(-420, 0, 840, 840); }
  c.restore();
}

// ---------- caixa de papelão ----------
function caixaPapelao(x, y, s, cheia) {
  const c = ctx; c.save(); c.translate(x, y); c.scale(s, s);
  const b = P.rr(-80, -110, 160, 110, 6); forma(b, "#c98d4f"); crescente(b, -14, 0, "rgba(60,20,10,.15)");
  forma(P.poly([[-80, -110], [-40, -140], [40, -140], [80, -110]]), "#d9a066", 5);
  texto("CHAVEIROS", 0, -56, { tam: 24, cor: "#6b3e1a", borda: null });
  for (let i = 0; i < cheia; i++) chaveiro(-60 + (i % 5) * 30, -176 + Math.floor(i / 5) * 18, i, (i % 3 - 1) * .3, .6);
  c.restore();
}
function carrinho(x, y) { const c = ctx; c.save(); c.translate(x, y); c.lineWidth = 9; c.strokeStyle = "#555"; c.lineCap = "round"; c.beginPath(); c.moveTo(-70, -230); c.lineTo(-90, 0); c.lineTo(80, 0); c.stroke(); forma(P.el(-80, 6, 22, 22), "#333", 5); c.restore(); }

// ---------- interface de jogo ----------
let HUD;
function contador(lista, v0) { // lista: [t, valor] — o número sobe de uma vez com um tranco
  return (t) => { let v = v0, ult = -9; for (const [a, b] of lista) if (t >= a) { v = b; ult = a; } return { v, k: lin(t, ult, ult + .45) }; };
}
const ICONE = {
  dinheiro(c) { forma(P.rr(-26, -16, 52, 32, 6), "#5bd66b", 4); forma(P.el(0, 0, 9, 9), "#2f8f3f", 3); },
  estoque(c) { forma(P.rr(-22, -18, 44, 36, 4), "#d9a066", 4); c.lineWidth = 3; c.beginPath(); c.moveTo(-22, -6); c.lineTo(22, -6); c.stroke(); },
  vendas(c) { forma(P.poly([[-24, -6], [-6, -24], [24, -24], [24, 6], [6, 24]]), "#ffcf3a", 4); forma(P.el(12, -12, 5, 5), "#fff", 3); },
  lucro(c) { c.lineWidth = 7; c.lineCap = "round"; c.lineJoin = "round"; c.strokeStyle = OL; c.beginPath(); c.moveTo(-22, 16); c.lineTo(-6, 0); c.lineTo(6, 10); c.lineTo(24, -16); c.stroke(); c.strokeStyle = "#5bd66b"; c.lineWidth = 4; c.stroke(); },
};
function hud(t) {
  const c = ctx; const ent = eob(lin(t, .15, .6)); if (ent <= 0) return;
  c.save(); c.translate(0, (1 - ent) * -260);
  const R = HUD.rot || ["DINHEIRO", "ESTOQUE", "VENDAS", "LUCRO"];
  const itens = [[R[0], "dinheiro", HUD.din, true, "#5bd66b"], [R[1], "estoque", HUD.est, false, "#ffcf3a"], [R[2], "vendas", HUD.ven, true, "#4fc3ff"], [R[3], "lucro", HUD.luc, true, "#5bd66b"]];
  itens.forEach(([rot, ic, f, rs, cor], i) => {
    const x = 34 + i * 256, y = 150; const { v, k } = f(t);
    const bump = k > 0 && k < 1 ? Math.sin(k * Math.PI) * .12 : 0;
    const destaque = i === 3 ? pulse(t, HUD.pulso, 1.4) : 0;
    c.save(); c.translate(x + 120, y + 66); c.scale(1 + bump + destaque * .1, 1 + bump + destaque * .1); c.translate(-120, -66);
    forma(P.rr(0, 10, 240, 120, 26), "#1e2a4a", 6);
    forma(P.rr(0, 0, 240, 120, 26), destaque > 0 ? "#2e4a2e" : "#2b3a66", 6);
    c.fillStyle = "rgba(255,255,255,.08)"; c.fill(P.rr(8, 6, 224, 44, 20));
    c.save(); c.translate(40, 40); ICONE[ic](c); c.restore();
    texto(rot, 146, 38, { tam: rot.length > 9 ? 21 : 26, fonte: "Fredoka", peso: 700, cor: "#b9c6ff", borda: null });
    texto(rs ? reais(v) : String(v), 120, 88, { tam: 44, cor: k > 0 && k < .8 ? cor : "#fff", lw: 8 });
    c.restore();
  });
  // pílulas de variação
  for (const [a, i, txt, cor] of HUD.chips) {
    const k = lin(t, a, a + 1.4); if (k <= 0 || k >= 1) continue;
    const x = 34 + i * 256 + 120, y = 300 + eout(k) * 26; c.save(); c.globalAlpha = 1 - lin(k, .7, 1); c.translate(x, y); c.scale(eob(Math.min(1, k * 5)), eob(Math.min(1, k * 5)));
    c.font = "40px Lilita"; const w = c.measureText(txt).width + 36; forma(P.rr(-w / 2, -30, w, 60, 30), cor, 5); texto(txt, 0, 3, { tam: 40, cor: "#fff", lw: 7 }); c.restore();
  }
  c.restore();
  // DIA 1
  const kd = lin(t, .4, .9) * (1 - lin(t, HUD.dia.fim, HUD.dia.fim + .4));
  if (kd > 0) { c.save(); c.globalAlpha = kd; forma(P.rr(34, 330, 150, 56, 28), "#ff5a5f", 5); texto(HUD.dia.txt, 109, 360, { tam: 36, cor: "#fff", lw: 6 }); c.restore(); }
}
function cartao(cx, cy, w, h, k, desenho, cor = "#fff8ea") {
  if (k <= 0) return; const c = ctx; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.translate(cx, cy); const s = eob(Math.min(1, k)); c.scale(s, s); c.rotate((1 - s) * -.1);
  forma(P.rr(-w / 2, -h / 2 + 12, w, h, 34), "#1e2a4a", 6); forma(P.rr(-w / 2, -h / 2, w, h, 34), cor, 6); desenho(c, w, h); c.restore();
}

// ---------- legendas ----------
function legendas() {
  LEG = [];
  for (const a of TEMPO.atos) {
    if (!a.fala) continue;
    const ws = a.fala.texto.split(/\s+/); const pesos = ws.map((w) => w.replace(/[^\wÀ-ú$]/g, "").length + 2 + (/[.,:?!…]$/.test(w) ? 3 : 0));
    const tot = pesos.reduce((x, y) => x + y, 0); let acc = 0;
    const pal = ws.map((w, i) => { const t0 = a.fala.t0 + (a.fala.t1 - a.fala.t0) * acc / tot; acc += pesos[i]; return { w, t0, t1: a.fala.t0 + (a.fala.t1 - a.fala.t0) * acc / tot, cena: a.cena }; });
    let b = []; const fecha = () => { if (b.length) LEG.push(b); b = []; };
    pal.forEach((p) => { const s = b.map((x) => x.w).join(" "); if (b.length >= 3 || (s + " " + p.w).length > 18) fecha(); b.push(p); if (/[.,:?!…]$/.test(p.w)) fecha(); });
    fecha();
  }
}
const palavra = (cena, w) => LEG.flat().find((p) => p.cena === cena && p.w.toLowerCase().startsWith(w));
function desenhaLegenda(t) {
  const b = LEG.find((x) => t >= x[0].t0 - .05 && t < x[x.length - 1].t1 + .2); if (!b) return;
  const c = ctx; c.save(); c.font = "70px Lilita"; const esp = 34;
  const ws = b.map((p) => c.measureText(p.w.toUpperCase()).width); const tot = ws.reduce((x, y) => x + y, 0) + esp * (ws.length - 1);
  let x = W / 2 - tot / 2; const y = 1640;
  const ap = eob(lin(t, b[0].t0 - .05, b[0].t0 + .15));
  b.forEach((p, i) => {
    const s = p.w.toUpperCase(); const ativo = t >= p.t0 && t < p.t1 + .05; const pop = ativo ? 1 + .1 * (1 - lin(t, p.t0, p.t0 + .16)) : 1;
    c.save(); c.translate(x + ws[i] / 2, y + 6); c.scale(pop * ap, pop * ap);
    texto(s, 0, 8, { tam: 70, cor: "#1e2a4a", borda: "#1e2a4a", lw: 18 });
    texto(s, 0, 0, { tam: 70, cor: ativo ? "#ffd23f" : "#fff", borda: OL, lw: 14 });
    c.restore(); x += ws[i] + esp;
  });
  c.restore();
}

function aplicaCam(cam) { ctx.setTransform(cam.z, 0, 0, cam.z, W / 2 - cam.x * cam.z, H / 2 - cam.y * cam.z); }

// ---------- efeitos de cena ----------
function confete(t, a, lado = 0) {
  const k = t - a; if (k < 0 || k > 3.5) return; const c = ctx; const r = rng(Math.round(a * 100));
  const cores = ["#ff5a5f", "#ffd23f", "#4fc3ff", "#5bd66b", "#c47bff", "#ff9a3a"];
  for (let i = 0; i < 90; i++) {
    const ox = lado === 2 ? r() * W : 960, oy = lado === 2 ? -40 : 1000;
    const vx = lado === 2 ? (r() - .5) * 200 : (r() - .5) * 1400, vy = lado === 2 ? 200 + r() * 300 : -700 - r() * 900;
    const x = ox + vx * k + Math.sin(k * 5 + i) * 30, y = oy + vy * k + 900 * k * k * (lado === 2 ? .3 : 1);
    c.save(); c.translate(x, y); c.rotate(k * (4 + r() * 8)); c.scale(1, Math.cos(k * 9 + i)); c.fillStyle = cores[i % 6]; c.fillRect(-9, -5, 18, 10); c.restore();
  }
}
function chuvaDinheiro(t, a) {
  const k = t - a; if (k < 0 || k > 4) return; const r = rng(9);
  for (let i = 0; i < 14; i++) { const d = r() * 1.2; const kk = k - d; if (kk < 0) continue; const x = 80 + r() * 920 + Math.sin(kk * 3 + i) * 50, y = 300 + kk * 420; cedula(x, y, [5, 10, 50][i % 3], Math.sin(kk * 4 + i) * .6, .8); }
}

function iris(t, a, b, cx, cy) { // fecha em a, abre em b
  const fecha = lin(t, a - .45, a), abre = lin(t, b, b + .5);
  if (fecha <= 0 || abre >= 1) return;
  const r = t < b ? (1 - ease(fecha)) * 1400 : ease(abre) * 1400;
  const c = ctx; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); const p = new Path2D(); p.rect(0, 0, W, H); p.ellipse(cx, cy, Math.max(.1, r), Math.max(.1, r), 0, 0, 7); c.fillStyle = "#1e1433"; c.fill(p, "evenodd"); c.restore();
}

