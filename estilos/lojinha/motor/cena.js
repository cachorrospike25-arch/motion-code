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
const PEGS = []; for (let r = 0; r < 2; r++) for (let i = 0; i < 5; i++) PEGS.push([598 + i * 62, 640 + r * 150]);
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
let VISOR = () => "0,00";

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
let EV_SINO = () => 0;

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
  const itens = [["DINHEIRO", "dinheiro", HUD.din, true, "#5bd66b"], ["ESTOQUE", "estoque", HUD.est, false, "#ffcf3a"], ["VENDAS", "vendas", HUD.ven, true, "#4fc3ff"], ["LUCRO", "lucro", HUD.luc, true, "#5bd66b"]];
  itens.forEach(([rot, ic, f, rs, cor], i) => {
    const x = 34 + i * 256, y = 150; const { v, k } = f(t);
    const bump = k > 0 && k < 1 ? Math.sin(k * Math.PI) * .12 : 0;
    const destaque = rot === "LUCRO" ? pulse(t, F("resultado") + 2.2, 1.4) : 0;
    c.save(); c.translate(x + 120, y + 66); c.scale(1 + bump + destaque * .1, 1 + bump + destaque * .1); c.translate(-120, -66);
    forma(P.rr(0, 10, 240, 120, 26), "#1e2a4a", 6);
    forma(P.rr(0, 0, 240, 120, 26), destaque > 0 ? "#2e4a2e" : "#2b3a66", 6);
    c.fillStyle = "rgba(255,255,255,.08)"; c.fill(P.rr(8, 6, 224, 44, 20));
    c.save(); c.translate(40, 40); ICONE[ic](c); c.restore();
    texto(rot, 140, 38, { tam: 26, fonte: "Fredoka", peso: 700, cor: "#b9c6ff", borda: null });
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
  const kd = lin(t, .4, .9) * (1 - lin(t, F("olha") - .6, F("olha") - .2));
  if (kd > 0) { c.save(); c.globalAlpha = kd; forma(P.rr(34, 330, 150, 56, 28), "#ff5a5f", 5); texto("DIA 1", 109, 360, { tam: 36, cor: "#fff", lw: 6 }); c.restore(); }
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
function aplicaCam(cam) { ctx.setTransform(cam.z, 0, 0, cam.z, W / 2 - cam.x * cam.z, H / 2 - cam.y * cam.z); }

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
  HUD = { din: contador(din, 0), est: contador(est, 0), ven: contador(ven, 0), luc: contador(luc, 0), chips };
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
function iris(t, a, b, cx, cy) { // fecha em a, abre em b
  const fecha = lin(t, a - .45, a), abre = lin(t, b, b + .5);
  if (fecha <= 0 || abre >= 1) return;
  const r = t < b ? (1 - ease(fecha)) * 1400 : ease(abre) * 1400;
  const c = ctx; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); const p = new Path2D(); p.rect(0, 0, W, H); p.ellipse(cx, cy, Math.max(.1, r), Math.max(.1, r), 0, 0, 7); c.fillStyle = "#1e1433"; c.fill(p, "evenodd"); c.restore();
}

// ---------- contrato do estúdio ----------
async function iniciar(tempo) {
  TEMPO = tempo; [W, H] = TAM[tempo.formato || "9:16"];
  for (const a of tempo.atos) ATO[a.cena] = a;
  const cv = document.getElementById("c"); cv.width = W; cv.height = H; ctx = cv.getContext("2d");
  await Promise.all(["48px Lilita", "600 48px Fredoka", "700 48px Fredoka"].map((f) => document.fonts.load(f)));
  legendas(); montar(); FUNDO = fazerFundo(); RUA = fazerRua();
}
function quadro(t) {
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
