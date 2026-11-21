// Império: simulação 3D de um terreno que vira um centro comercial (three.js no Chrome headless).
// Contrato do estúdio: window.iniciar(tempo) e window.quadro(t) desenham no canvas #c.
// Tudo é função pura de t: o mesmo t dá sempre o mesmo quadro (dá para renderizar fora de ordem).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const W = 1080, H = 1920;
const V3 = THREE.Vector3;

// ---------- utilidades ----------
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lin = (t, a, b) => cl((t - a) / (b - a));
const sm = x => x * x * (3 - 2 * x);
const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const eout = x => 1 - (1 - x) * (1 - x);
const ein = x => x * x;
const eob = x => { const c1 = 1.70158, c3 = c1 + 1; return x <= 0 ? 0 : 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const mix = (a, b, k) => a + (b - a) * k;
const EASE = { lin: x => x, out: eout, in: ein, io: sm, eio };
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const R = rng(7);
const pick = (a, r = R) => a[Math.floor(r() * a.length)];

// ---------- linha do tempo (vem do tempo.json) ----------
let TEMPO, ATO = {};
const F = id => ATO[id].fala.t0, Fe = id => ATO[id].fala.t1, A = id => ATO[id].t0, Ae = id => ATO[id].t1;

// ---------- texturas em código ----------
function ctex(size, draw) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); draw(g, size, rng(size + draw.toString().length));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}
function pontos(g, s, r, n, cores, rmin, rmax, alpha = 1) {
  g.globalAlpha = alpha;
  for (let i = 0; i < n; i++) { g.fillStyle = pick(cores, r); g.beginPath(); g.arc(r() * s, r() * s, rmin + r() * (rmax - rmin), 0, 7); g.fill(); }
  g.globalAlpha = 1;
}
function manchas(g, s, r, n, cor, rmax, alpha) {
  for (let i = 0; i < n; i++) {
    const x = r() * s, y = r() * s, rr = rmax * (.3 + r() * .7);
    for (const [dx, dy] of [[0, 0], [s, 0], [-s, 0], [0, s], [0, -s]]) {
      const gr = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, rr);
      gr.addColorStop(0, cor.replace('A', alpha)); gr.addColorStop(1, cor.replace('A', 0));
      g.fillStyle = gr; g.fillRect(x + dx - rr, y + dy - rr, rr * 2, rr * 2);
    }
  }
}
const TX = {};
function texturas() {
  TX.grama = ctex(512, (g, s, r) => {
    g.fillStyle = '#5b7a34'; g.fillRect(0, 0, s, s);
    manchas(g, s, r, 30, 'rgba(40,70,25,A)', 120, .35); manchas(g, s, r, 20, 'rgba(140,150,70,A)', 100, .25);
    for (let i = 0; i < 9000; i++) { g.strokeStyle = pick(['#4a6b2a', '#6d8c3e', '#7f9a48', '#3f5f25', '#88a050'], r); g.globalAlpha = .55; const x = r() * s, y = r() * s; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - .5) * 3, y - 2 - r() * 4); g.stroke(); }
    g.globalAlpha = 1;
  });
  TX.terra = ctex(512, (g, s, r) => {
    g.fillStyle = '#8d6d4c'; g.fillRect(0, 0, s, s);
    manchas(g, s, r, 26, 'rgba(95,68,45,A)', 110, .45); manchas(g, s, r, 18, 'rgba(170,140,100,A)', 90, .3);
    pontos(g, s, r, 2600, ['#6f5238', '#a8865f', '#7b5d40', '#b9997a', '#5d4430'], .6, 2.2, .7);
    manchas(g, s, r, 8, 'rgba(110,120,60,A)', 60, .35);
  });
  TX.asfalto = ctex(512, (g, s, r) => {
    g.fillStyle = '#3d4043'; g.fillRect(0, 0, s, s);
    manchas(g, s, r, 22, 'rgba(25,27,30,A)', 120, .35); manchas(g, s, r, 12, 'rgba(90,92,95,A)', 90, .18);
    pontos(g, s, r, 9000, ['#2c2e31', '#55585c', '#4a4d50', '#6a6c6f'], .4, 1.2, .6);
    g.strokeStyle = 'rgba(20,20,22,.5)'; g.lineWidth = 1.2;
    for (let i = 0; i < 5; i++) { let x = r() * s, y = r() * s; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 8; k++) { x += (r() - .5) * 30; y += (r() - .5) * 30; g.lineTo(x, y); } g.stroke(); }
  });
  TX.concreto = ctex(512, (g, s, r) => {
    g.fillStyle = '#c3beb4'; g.fillRect(0, 0, s, s);
    manchas(g, s, r, 20, 'rgba(150,145,135,A)', 110, .35); manchas(g, s, r, 10, 'rgba(225,222,215,A)', 90, .3);
    pontos(g, s, r, 4000, ['#aaa59b', '#d4d0c8', '#9d988e'], .4, 1.1, .5);
    g.strokeStyle = 'rgba(90,85,78,.55)'; g.lineWidth = 2;
    for (let k = 0; k <= 2; k++) { g.beginPath(); g.moveTo(0, k * s / 2); g.lineTo(s, k * s / 2); g.stroke(); g.beginPath(); g.moveTo(k * s / 2, 0); g.lineTo(k * s / 2, s); g.stroke(); }
  });
  TX.calcada = ctex(512, (g, s, r) => {
    g.fillStyle = '#d2cbbd'; g.fillRect(0, 0, s, s);
    pontos(g, s, r, 3000, ['#bdb6a8', '#e0dacd', '#c7c0b2'], .4, 1, .5);
    manchas(g, s, r, 12, 'rgba(150,140,125,A)', 80, .25);
    g.strokeStyle = 'rgba(110,100,90,.6)'; g.lineWidth = 2;
    for (let k = 0; k <= 4; k++) { g.beginPath(); g.moveTo(0, k * s / 4); g.lineTo(s, k * s / 4); g.stroke(); g.beginPath(); g.moveTo(k * s / 4, 0); g.lineTo(k * s / 4, s); g.stroke(); }
  });
  TX.reboco = ctex(256, (g, s, r) => {
    g.fillStyle = '#f2f0ec'; g.fillRect(0, 0, s, s);
    manchas(g, s, r, 14, 'rgba(200,196,188,A)', 60, .35);
    pontos(g, s, r, 1800, ['#e2dfd9', '#fbfaf8', '#d6d2cb'], .4, 1, .6);
  });
  TX.cascalho = ctex(256, (g, s, r) => {
    g.fillStyle = '#9b9893'; g.fillRect(0, 0, s, s);
    pontos(g, s, r, 5000, ['#85827d', '#b5b2ac', '#77746f', '#a9a59f'], .5, 1.4, .8);
    manchas(g, s, r, 8, 'rgba(70,68,64,A)', 50, .25);
  });
  TX.telha = ctex(256, (g, s, r) => {
    g.fillStyle = '#a4523a'; g.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 16) { g.fillStyle = 'rgba(60,20,10,.35)'; g.fillRect(0, y, s, 3); for (let x = (y / 16 % 2) * 12; x < s; x += 24) { g.fillStyle = `rgba(${150 + r() * 40},${70 + r() * 20},${45 + r() * 15},.5)`; g.fillRect(x, y + 3, 22, 12); } }
  });
  TX.trelica = ctex(128, (g, s) => {
    g.clearRect(0, 0, s, s); g.strokeStyle = '#e7b416'; g.lineWidth = 10;
    g.strokeRect(5, 5, s - 10, s - 10); g.beginPath(); g.moveTo(0, 0); g.lineTo(s, s); g.stroke();
  });
  TX.brilho = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,240,200,1)'); gr.addColorStop(.25, 'rgba(255,200,120,.55)'); gr.addColorStop(1, 'rgba(255,170,80,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
}
function textoTex(linhas, { w = 1024, h = 256, fundo = null, cor = '#fff', fonte = '800 150px Inter', borda = null } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  if (fundo) { g.fillStyle = fundo; g.fillRect(0, 0, w, h); }
  g.font = fonte; g.fillStyle = cor; g.textAlign = 'center'; g.textBaseline = 'middle';
  const ls = [].concat(linhas);
  ls.forEach((l, i) => { const y = h * (i + .5) / ls.length + 6; if (borda) { g.strokeStyle = borda; g.lineWidth = 14; g.lineJoin = 'round'; g.strokeText(l, w / 2, y); } g.fillText(l, w / 2, y); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

// ---------- geometria ----------
function uvBox(g, w, h, d, t) {
  const uv = g.attributes.uv; const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * dims[f][0] / t, uv.getY(k) * dims[f][1] / t); }
}
// caixa com origem configurável: oy 'base' (y de 0 a h), ox/oz: 'c', 'min' (cresce para +), 'max' (cresce para -)
function bx(w, h, d, mat, pos = [0, 0, 0], o = {}) {
  const g = new THREE.BoxGeometry(w, h, d);
  if (o.tile) uvBox(g, w, h, d, o.tile);
  g.translate(o.ox === 'min' ? w / 2 : o.ox === 'max' ? -w / 2 : 0, o.oy === 'c' ? 0 : h / 2, o.oz === 'min' ? d / 2 : o.oz === 'max' ? -d / 2 : 0);
  const m = new THREE.Mesh(g, mat); m.position.set(...pos);
  m.castShadow = o.sombra !== false; m.receiveShadow = true; return m;
}
function chao(x0, x1, z0, z1, y, mat, tile, o = {}) {
  const w = x1 - x0, d = z1 - z0;
  const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2);
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / tile + x0 / tile, uv.getY(i) * d / tile - z1 / tile);
  let px = (x0 + x1) / 2, pz = (z0 + z1) / 2;
  if (o.cresce === '-x') { g.translate(-w / 2, 0, 0); px = x1; }
  if (o.cresce === '+x') { g.translate(w / 2, 0, 0); px = x0; }
  if (o.cresce === '-z') { g.translate(0, 0, -d / 2); pz = z1; }
  if (o.cresce === '+z') { g.translate(0, 0, d / 2); pz = z0; }
  const m = new THREE.Mesh(g, mat); m.position.set(px, y, pz); m.receiveShadow = true; return m;
}
function cor(geo, hex) {
  const c = new THREE.Color(hex); const n = geo.attributes.position.count; const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(a, 3)); if (geo.index) return geo.toNonIndexed(); return geo;
}
function peca(geo, hex, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  geo.rotateX(rx); geo.rotateY(ry); geo.rotateZ(rz); geo.translate(x, y, z);
  const g = geo.index ? geo.toNonIndexed() : geo; g.deleteAttribute('uv'); return cor(g, hex);
}
const juntar = gs => mergeGeometries(gs.map(g => { const n = g.index ? g.toNonIndexed() : g; if (n.attributes.uv) n.deleteAttribute('uv'); return n; }));

// ---------- materiais ----------
const MAT = {};
const NOITE = { vidros: [], placas: [], postes: [], brilhos: [], farois: null, lanternas: null };
function materiais() {
  const S = (p) => new THREE.MeshStandardMaterial(p);
  MAT.grama = S({ map: TX.grama, roughness: .95, vertexColors: true });
  MAT.terra = S({ map: TX.terra, roughness: 1 });
  MAT.asfalto = S({ map: TX.asfalto, roughness: .9 });
  MAT.concreto = S({ map: TX.concreto, roughness: .85 });
  MAT.calcada = S({ map: TX.calcada, roughness: .9 });
  MAT.meiofio = S({ color: '#d8d4cc', roughness: .8 });
  MAT.faixa = S({ color: '#f1f1ec', roughness: .7 });
  MAT.amarela = S({ color: '#e8b423', roughness: .7 });
  MAT.tronco = S({ color: '#5a4330', roughness: 1 });
  MAT.copa = S({ vertexColors: true, roughness: .9, flatShading: true });
  MAT.vc = S({ vertexColors: true, roughness: .55, metalness: .1 });
  MAT.vcFosco = S({ vertexColors: true, roughness: .9 });
  MAT.vidroCarro = S({ color: '#1b2430', roughness: .12, metalness: .6 });
  MAT.pneu = S({ color: '#1a1a1a', roughness: .9 });
  MAT.metal = S({ color: '#8e949a', roughness: .45, metalness: .7 });
  MAT.amareloMaq = S({ color: '#e9a81c', roughness: .5, metalness: .2 });
  MAT.trelica = S({ map: TX.trelica, transparent: false, alphaTest: .5, side: THREE.DoubleSide, roughness: .5, metalness: .3 });
  MAT.telha = S({ map: TX.telha, roughness: .85 });
  MAT.cascalho = S({ map: TX.cascalho, roughness: 1 });
  MAT.giz = S({ color: '#f4f1e8', roughness: 1, emissive: '#ffffff', emissiveIntensity: .15 });
  MAT.estaca = S({ color: '#d9c27a', roughness: .8 });
  MAT.fita = S({ color: '#ff5a1f', roughness: .6 });
  MAT.farol = new THREE.MeshStandardMaterial({ color: '#fffbe8', emissive: '#fff3c4', emissiveIntensity: .2 });
  MAT.lanterna = new THREE.MeshStandardMaterial({ color: '#7a0f0f', emissive: '#ff2a1a', emissiveIntensity: .2 });
  MAT.poste = S({ color: '#3c4147', roughness: .5, metalness: .6 });
  MAT.lampada = new THREE.MeshStandardMaterial({ color: '#dddddd', emissive: '#ffd9a0', emissiveIntensity: 0 });
  MAT.madeira = S({ color: '#b08455', roughness: .8 });
  MAT.tijolo = S({ color: '#a4553a', roughness: .9 });
  MAT.lona = S({ color: '#2f6fb0', roughness: .8 });
  NOITE.farois = MAT.farol; NOITE.lanternas = MAT.lanterna; NOITE.postes.push(MAT.lampada);
}

// ---------- mundo ----------
let renderer, scene, camera, sol, hemi, out, ctx;
const DIN = []; // objetos animados: {atualiza(t)}

function chaoGeral() {
  // grama com variação de cor em escala grande (quebra a repetição da textura)
  const g = new THREE.PlaneGeometry(900, 900, 150, 150); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, uv = g.attributes.uv, c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    const n = .5 + .25 * Math.sin(x * .021 + Math.sin(z * .013) * 2) + .25 * Math.sin(z * .027 + Math.cos(x * .017) * 1.7);
    const k = .78 + .3 * n; c[i * 3] = k * (1 + .12 * (n - .5)); c[i * 3 + 1] = k; c[i * 3 + 2] = k * .92;
    uv.setXY(i, x / 9, -z / 9);
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  const m = new THREE.Mesh(g, MAT.grama); m.receiveShadow = true; scene.add(m);

  // terreno do empreendimento e o vizinho vazio (o da pergunta final)
  scene.add(chao(-32, 32, -34, 30, .02, MAT.terra, 9));
  scene.add(chao(-72, -38, -34, 22, .02, MAT.terra, 9));

  // ruas: frente (corre em x) e lateral (corre em z, termina na frente)
  scene.add(chao(-450, 450, 33, 43, .04, MAT.asfalto, 6));
  scene.add(chao(36, 46, -450, 33, .035, MAT.asfalto, 6));
  scene.add(chao(-450, 450, 30, 33, .09, MAT.calcada, 4));
  scene.add(chao(-450, 450, 43, 46, .09, MAT.calcada, 4));
  scene.add(chao(32, 36, -450, 30, .09, MAT.calcada, 4));
  scene.add(chao(46, 50, -450, 43, .09, MAT.calcada, 4));
  for (const [x0, x1, z0, z1] of [[-450, 450, 32.85, 33], [-450, 450, 43, 43.15], [35.85, 36, -450, 33], [46, 46.15, -450, 43]])
    scene.add(chao(x0, x1, z0, z1, .1, MAT.meiofio, 1));
  // faixas
  const tr = [];
  for (let x = -450; x < 450; x += 7) if (x + 3.5 < 34 || x > 48) tr.push(peca(new THREE.BoxGeometry(3.5, .02, .18), '#f2f0e8', x + 1.75, .06, 38));
  for (let z = -450; z < 30; z += 7) tr.push(peca(new THREE.BoxGeometry(.18, .02, 3.5), '#f2f0e8', 41, .055, z + 1.75));
  for (let i = 0; i < 8; i++) tr.push(peca(new THREE.BoxGeometry(.8, .02, 6.5), '#f2f0e8', 30 - i * 1.6, .06, 38)); // faixa de pedestre
  const fx = new THREE.Mesh(mergeGeometries(tr), MAT.vcFosco); fx.receiveShadow = true; scene.add(fx);

  // limites do terreno: estacas e fita
  const est = [], cantos = [[-32, -34], [32, -34], [32, 30], [-32, 30]];
  for (let i = 0; i < 4; i++) {
    const [a, b] = [cantos[i], cantos[(i + 1) % 4]]; const L = Math.hypot(b[0] - a[0], b[1] - a[1]); const n = Math.round(L / 8);
    for (let k = 0; k < n; k++) est.push(peca(new THREE.BoxGeometry(.14, 1.1, .14), '#c9a96a', mix(a[0], b[0], k / n), .55, mix(a[1], b[1], k / n)));
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    est.push(peca(new THREE.BoxGeometry(L, .06, .04), '#ff6a2a', 0, 0, 0, 0, -ang).translate((a[0] + b[0]) / 2, .95, (a[1] + b[1]) / 2));
  }
  const ms = new THREE.Mesh(mergeGeometries(est), MAT.vcFosco); ms.castShadow = true; scene.add(ms);
  const limite = { atualiza(t) { ms.visible = t < F('expansao') + 1.5; ms.position.y = -1.2 * sm(lin(t, F('expansao'), F('expansao') + 1.5)); } };
  DIN.push(limite);
  // vizinho vazio também com estacas (aparece desde o início, é a pergunta final)
  const ev = [];
  for (const [x, z] of [[-72, -34], [-38, -34], [-38, 22], [-72, 22], [-55, -34], [-55, 22], [-72, -6], [-38, -6]]) ev.push(peca(new THREE.BoxGeometry(.14, 1.1, .14), '#c9a96a', x, .55, z));
  const mv = new THREE.Mesh(mergeGeometries(ev), MAT.vcFosco); mv.castShadow = true; scene.add(mv);
}

// ---------- árvore ----------
function arvore(x, z, s = 1, r = R) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const tronco = new THREE.Mesh(new THREE.CylinderGeometry(.14 * s, .22 * s, 2.4 * s, 6).translate(0, 1.2 * s, 0), MAT.tronco);
  tronco.castShadow = true; g.add(tronco);
  const cs = [], verdes = ['#3f6b2a', '#4c7a31', '#355e24', '#5b8a3a', '#2f5420'];
  for (let i = 0; i < 4; i++) {
    const rr = (1.3 + r() * .7) * s; const geo = new THREE.IcosahedronGeometry(rr, 1);
    const pos = geo.attributes.position; for (let k = 0; k < pos.count; k++) pos.setXYZ(k, pos.getX(k) * (1 + (r() - .5) * .18), pos.getY(k) * (.85 + (r() - .5) * .15), pos.getZ(k) * (1 + (r() - .5) * .18));
    cs.push(peca(geo, pick(verdes, r), (r() - .5) * 1.6 * s, (2.9 + r() * 1.2) * s, (r() - .5) * 1.6 * s));
  }
  const copa = new THREE.Mesh(mergeGeometries(cs), MAT.copa); copa.castShadow = true; copa.receiveShadow = true; g.add(copa);
  g.rotation.y = r() * 6; scene.add(g); return g;
}

// ---------- casas vizinhas (contexto, iguais o vídeo inteiro) ----------
function casa(x, z, w, d, h, rot, r) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot;
  const parede = new THREE.MeshStandardMaterial({ map: TX.reboco, color: pick(['#efe6d6', '#e9dcc7', '#dfe3e6', '#f1e3c8', '#e6d3c3', '#d8e0d2'], r), roughness: .9 });
  g.add(bx(w, h, d, parede, [0, 0, 0], { tile: 3 }));
  const tel = new THREE.Shape(); tel.moveTo(-w / 2 - .5, 0); tel.lineTo(w / 2 + .5, 0); tel.lineTo(0, h * .55); tel.closePath();
  const tg = new THREE.ExtrudeGeometry(tel, { depth: d + 1, bevelEnabled: false }); tg.translate(0, h, -d / 2 - .5);
  const tm = new THREE.Mesh(tg, MAT.telha); tm.castShadow = tm.receiveShadow = true; g.add(tm);
  // janelas escuras na frente
  const jan = [];
  for (let k = -1; k <= 1; k += 2) jan.push(peca(new THREE.BoxGeometry(1.1, 1.1, .06), '#2a3440', k * w / 4, h * .55, d / 2 + .02));
  jan.push(peca(new THREE.BoxGeometry(.9, 2, .06), '#5b4632', 0, 1, d / 2 + .02));
  const jm = new THREE.Mesh(mergeGeometries(jan), MAT.vc); g.add(jm);
  const vidro = new THREE.MeshStandardMaterial({ color: '#000', emissive: '#ffc77a', emissiveIntensity: 0 });
  const jl = new THREE.Mesh(new THREE.BoxGeometry(1, 1, .04).translate(-w / 4, h * .55, d / 2 + .06), vidro); g.add(jl);
  NOITE.vidros.push({ m: vidro, base: 0, noite: r() < .7 ? 1.6 : 0 });
  scene.add(g);
}
function vizinhanca() {
  const r = rng(11);
  for (let x = -160; x < 160; x += 13 + r() * 6) { if (Math.abs(x - 41) < 9) continue; casa(x, 56 + r() * 4, 8 + r() * 3, 8 + r() * 3, 3 + r() * 1.5, 0, r); }
  for (let z = -150; z < 25; z += 13 + r() * 6) casa(60 + r() * 4, z, 8 + r() * 3, 8 + r() * 3, 3 + r() * 1.5, -Math.PI / 2, r);
  for (let x = -150; x < 30; x += 14 + r() * 8) { if (x > -78 && x < 34) continue; casa(x, 10 + r() * 15, 8 + r() * 3, 8 + r() * 3, 3 + r() * 1.5, 0, r); }
  // galpões ao fundo
  for (let x = -90; x < 30; x += 26) { const gm = new THREE.MeshStandardMaterial({ map: TX.reboco, color: '#c9ced2', roughness: .8 }); scene.add(bx(20, 6, 14, gm, [x, 0, -50 - r() * 6], { tile: 4 })); }
  // árvores espalhadas fora dos lotes e ruas
  for (let i = 0; i < 160; i++) {
    const x = (r() - .5) * 360, z = (r() - .5) * 360;
    const nosLotes = (x > -76 && x < 52 && z > -38 && z < 50) || (Math.abs(z - 38) < 9) || (Math.abs(x - 41) < 10 && z < 46);
    if (!nosLotes) arvore(x, z, .9 + r() * .5, r);
  }
}

// ---------- prédio que se constrói ----------
// o corpo sobe por um plano de corte; andaime monta de baixo para cima e desmonta de cima para baixo
const PREDIOS = [];
function predio(o) {
  const w = o.x1 - o.x0, d = o.z1 - o.z0, cx = (o.x0 + o.x1) / 2, cz = (o.z0 + o.z1) / 2, h = o.h, nA = o.andares || 1, hf = h / nA;
  const g = new THREE.Group(); g.position.set(cx, 0, cz); scene.add(g);
  const corte = new THREE.Plane(new V3(0, -1, 0), 0), corteA = new THREE.Plane(new V3(0, -1, 0), 0);
  const M = p => { const m = new THREE.MeshStandardMaterial(p); m.clippingPlanes = [corte]; m.side = THREE.DoubleSide; return m; };
  const mParede = M({ map: TX.reboco, color: o.cor, roughness: .85 });
  const mFaixa = M({ color: o.faixa, roughness: .6, metalness: .1 });
  const mVidro = M({ color: '#26394a', roughness: .08, metalness: .85, emissive: '#ffd59a', emissiveIntensity: .05 });
  const mCaixilho = M({ color: '#2c3136', roughness: .4, metalness: .7 });
  const mLaje = M({ map: TX.concreto, roughness: .8 });
  NOITE.vidros.push({ m: mVidro, base: .05, noite: 1.15 });
  const corpo = new THREE.Group(); g.add(corpo);
  const e = .3;
  corpo.add(bx(w, h + .9, e, mParede, [0, 0, -d / 2 + e / 2], { tile: 3 }));
  corpo.add(bx(e, h + .9, d, mParede, [-w / 2 + e / 2, 0, 0], { tile: 3 }));
  corpo.add(bx(e, h + .9, d, mParede, [w / 2 - e / 2, 0, 0], { tile: 3 }));
  for (let a = 0; a < nA; a++) {
    const y0 = a * hf;
    if (a === 0) {
      corpo.add(bx(w, .35, e, mFaixa, [0, 0, d / 2 - e / 2]));
      corpo.add(bx(w - .2, hf - 1.6, .12, mVidro, [0, .35, d / 2 - .1], { sombra: false }));
      corpo.add(bx(w, 1.25, e + .1, mFaixa, [0, hf - 1.25, d / 2 - e / 2 + .05]));
      for (let x = -w / 2 + .1; x <= w / 2; x += w / Math.max(2, Math.round(w / 2.6))) corpo.add(bx(.12, hf - 1.6, .2, mCaixilho, [x, .35, d / 2 - .05]));
      // porta
      corpo.add(bx(2.4, 2.5, .16, mCaixilho, [o.porta - cx, .35, d / 2 + .02]));
    } else {
      corpo.add(bx(w, 1.0, e + .1, mFaixa, [0, y0, d / 2 - e / 2 + .05]));
      corpo.add(bx(w - .2, hf - 1.3, .12, mVidro, [0, y0 + 1.0, d / 2 - .1], { sombra: false }));
      for (let x = -w / 2 + .1; x <= w / 2; x += 2.2) corpo.add(bx(.1, hf - 1.3, .18, mCaixilho, [x, y0 + 1.0, d / 2 - .05]));
      corpo.add(bx(w, .3, e + .1, mLaje, [0, y0 + hf - .3, d / 2 - e / 2 + .05]));
      // fita de janelas nas laterais
      for (const s of [-1, 1]) corpo.add(bx(.1, 1.5, d - 2, mVidro, [s * (w / 2 + .02), y0 + 1.2, 0], { sombra: false }));
    }
  }
  // platibanda da frente
  corpo.add(bx(w, .9, e, mParede, [0, h, d / 2 - e / 2], { tile: 3 }));
  corpo.traverse(m => { if (m.isMesh) m.castShadow = true; });

  // laje de piso
  const laje = bx(w + 1.2, .3, d + 1.2, MAT.concreto, [o.x0 - .6, 0, cz], { ox: 'min', tile: 4 }); scene.add(laje);
  // marcação no chão (linhas de giz) e escavação
  const giz = [];
  const gz = [[w + 1.2, .08, .25, 0, -d / 2 - .6], [w + 1.2, .08, .25, 0, d / 2 + .6], [.25, .08, d + 1.2, -w / 2 - .6, 0], [.25, .08, d + 1.2, w / 2 + .6, 0]];
  gz.forEach(([a, b, c, x, z]) => { const m = bx(a, b, c, MAT.giz, [cx + x, .03, cz + z], { sombra: false }); scene.add(m); giz.push(m); });
  // pilares
  const pilares = [];
  for (let x = -w / 2 + .3; x <= w / 2; x += Math.max(4, w / Math.round(w / 5))) for (const z of [-d / 2 + .3, d / 2 - .3]) {
    const p = bx(.45, h, .45, MAT.concreto, [cx + x, .3, cz + z]); scene.add(p); pilares.push(p);
  }
  // teto
  const teto = bx(w - .4, .35, d - .4, MAT.cascalho, [o.x0 + .2, h - .05, cz], { ox: 'min', tile: 3 }); scene.add(teto);
  const extras = [];
  const r = rng(Math.round(cx * 13 + cz * 7 + 99));
  const nAr = Math.max(2, Math.round(w * d / 90));
  for (let i = 0; i < nAr; i++) {
    const u = bx(1.6, 1, 1.2, MAT.metal, [cx + (r() - .5) * (w - 4), h + .3, cz + (r() - .5) * (d - 4)]); u.rotation.y = r() < .5 ? 0 : Math.PI / 2; scene.add(u); extras.push(u);
  }
  // toldo e placa
  let toldo = null;
  if (o.toldo) {
    const tm = new THREE.MeshStandardMaterial({ color: o.toldo, roughness: .7 });
    toldo = bx(w * .78, .14, 1.8, tm, [cx, hf - 1.55, o.z1], { oz: 'min' }); toldo.rotation.x = .2; scene.add(toldo);
  }
  let placa = null;
  if (o.placa) {
    const tex = textoTex(o.placa, { fundo: o.placaFundo || null, cor: o.placaCor || '#ffffff', fonte: o.placaFonte || '800 140px Inter', w: 1024, h: o.placaH || 256 });
    const pm = new THREE.MeshStandardMaterial({ map: tex, transparent: !o.placaFundo, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: .15, roughness: .5 });
    NOITE.placas.push(pm);
    const pw = o.placaW || Math.min(w * .6, 9), ph = pw * (o.placaH || 256) / 1024;
    placa = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), pm); placa.position.set(o.placaX ?? cx, o.placaY ?? (hf - .62), o.z1 + .27); scene.add(placa);
  }
  // andaime
  const and = [];
  const off = 1.1, H2 = h + 1.5;
  const per = [[-w / 2 - off, -d / 2 - off], [w / 2 + off, -d / 2 - off], [w / 2 + off, d / 2 + off], [-w / 2 - off, d / 2 + off]];
  for (let i = 0; i < 4; i++) {
    const [a, b] = [per[i], per[(i + 1) % 4]]; const L = Math.hypot(b[0] - a[0], b[1] - a[1]); const n = Math.ceil(L / 2.5);
    for (let k = 0; k < n; k++) { const x = mix(a[0], b[0], k / n), z = mix(a[1], b[1], k / n); and.push(peca(new THREE.CylinderGeometry(.05, .05, H2, 4), '#9aa0a6', x, H2 / 2, z)); }
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    for (let y = 2; y <= H2; y += 2) {
      and.push(peca(new THREE.BoxGeometry(L, .06, .06), '#9aa0a6', 0, 0, 0, 0, -ang).translate((a[0] + b[0]) / 2, y, (a[1] + b[1]) / 2));
      const nx = -(b[1] - a[1]) / L, nz = (b[0] - a[0]) / L;
      and.push(peca(new THREE.BoxGeometry(L, .05, .5), '#a97c4c', 0, 0, 0, 0, -ang).translate((a[0] + b[0]) / 2 - nx * .3, y + .05, (a[1] + b[1]) / 2 - nz * .3));
    }
  }
  const mAnd = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .6, metalness: .3, clippingPlanes: [corteA] });
  const andaime = new THREE.Mesh(mergeGeometries(and), mAnd); andaime.position.set(cx, 0, cz); andaime.castShadow = true; scene.add(andaime);
  // pilhas de material
  const pilhas = [];
  for (let i = 0; i < 3; i++) {
    const px = cx + (i - 1) * Math.min(6, w / 3), pz = o.z1 + 4 + r() * 1.5;
    const pg = new THREE.Group(); pg.position.set(px + (o.pilhaDx || 0), 0, pz + (o.pilhaDz || 0));
    pg.add(bx(1.2, .15, 1.2, MAT.madeira)); pg.add(bx(1.1, .8, 1.1, i === 1 ? MAT.concreto : MAT.tijolo, [0, .15, 0], { tile: 1 }));
    scene.add(pg); pilhas.push(pg);
  }
  const P = { o, g, corte, corteA, laje, giz, pilares, teto, extras, toldo, placa, andaime, pilhas, h, w, d, cx, cz };
  // t0 = marcação, t1 = começa a obra, t2 = pronto
  P.atualiza = t => {
    const p = lin(t, o.t1, o.t2);
    const marc = lin(t, o.t0, o.t0 + 1.2);
    giz.forEach((m, i) => { const k = sm(lin(marc, i * .2, i * .2 + .4)); m.visible = k > 0 && p < .2; m.scale.set(i < 2 ? k : 1, 1, i < 2 ? 1 : k); });
    const kl = eio(lin(p, .02, .14)); laje.visible = kl > 0; laje.scale.set(kl, 1, 1);
    pilares.forEach((m, i) => { const k = eout(lin(p, .12 + i / pilares.length * .14, .22 + i / pilares.length * .14)); m.visible = k > 0; m.scale.y = Math.max(.001, k); });
    const kc = eio(lin(p, .24, .72)); corte.constant = .3 + kc * (h + 1.2); g.visible = kc > 0;
    const ka = lin(p, .18, .7), kd = lin(p, .84, .96);
    corteA.constant = kd > 0 ? H2 * (1 - eio(kd)) : Math.min(H2, ka * (H2 + 2)); andaime.visible = ka > 0 && kd < 1;
    const kt = eio(lin(p, .7, .8)); teto.visible = kt > 0; teto.scale.set(kt, 1, 1);
    extras.forEach((m, i) => { const k = eob(lin(p, .8 + i * .02, .88 + i * .02)); m.visible = k > 0; m.scale.setScalar(Math.max(.001, k)); });
    if (toldo) { const k = eob(lin(p, .86, .94)); toldo.visible = k > 0; toldo.scale.set(1, 1, Math.max(.001, k)); }
    if (placa) { const k = eob(lin(p, .9, 1)); placa.visible = k > 0; placa.scale.setScalar(Math.max(.001, k)); }
    pilhas.forEach((m, i) => { const k = sm(lin(t, o.t1 - .5 + i * .2, o.t1 + .3 + i * .2)) * (1 - sm(lin(p, .82 + i * .03, .9 + i * .03))); m.visible = k > .01; m.scale.set(1, Math.max(.01, k), 1); });
  };
  PREDIOS.push(P); DIN.push(P); return P;
}

// ---------- carros e máquinas ----------
const PALETA = ['#f2f2f0', '#c9ccd1', '#9ba0a6', '#2b2e33', '#1d2a44', '#7d1f22', '#e9e6df', '#4b5563', '#33506e', '#a8a29a', '#5a1a1a', '#ffffff'];
function modeloCarro(tipo, corHex) {
  const g = new THREE.Group();
  const corpo = [], vidro = [], rodas = [], farol = [], lant = [];
  const D = { sedan: [4.5, 1.8, .72, 2.3, .62], suv: [4.6, 1.9, .95, 2.7, .7], hatch: [3.9, 1.75, .75, 2.2, .65], pickup: [5.2, 1.9, .9, 2.0, .7] }[tipo] || [4.5, 1.8, .72, 2.3, .62];
  const [L, Wd, hc, lc, hcab] = D;
  const b = new RoundedBoxGeometry(Wd, hc, L, 2, .18); corpo.push(peca(b, corHex, 0, .32 + hc / 2, 0));
  const cab = new RoundedBoxGeometry(Wd * .9, hcab, lc, 2, .14);
  vidro.push(peca(cab, '#ffffff', 0, .32 + hc + hcab / 2 - .04, tipo === 'pickup' ? .5 : -.15));
  corpo.push(peca(new RoundedBoxGeometry(Wd * .86, .08, lc * .82, 1, .03), corHex, 0, .32 + hc + hcab - .04, tipo === 'pickup' ? .5 : -.15));
  if (tipo === 'pickup') corpo.push(peca(new THREE.BoxGeometry(Wd * .9, .1, 1.7), '#222', 0, .32 + hc + .02, -1.5));
  for (const [x, z] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) rodas.push(peca(new THREE.CylinderGeometry(.34, .34, .26, 12), '#151515', x * (Wd / 2 - .08), .34, z * (L / 2 - .85), 0, 0, Math.PI / 2));
  for (const x of [-1, 1]) { farol.push(peca(new THREE.BoxGeometry(.38, .14, .06), '#fff', x * (Wd / 2 - .3), .32 + hc * .7, L / 2 + .01)); lant.push(peca(new THREE.BoxGeometry(.38, .14, .06), '#fff', x * (Wd / 2 - .3), .32 + hc * .72, -L / 2 - .01)); }
  const mc = new THREE.Mesh(mergeGeometries(corpo), MAT.vc); mc.castShadow = true; g.add(mc);
  const mv = new THREE.Mesh(mergeGeometries(vidro), MAT.vidroCarro); mv.castShadow = true; g.add(mv);
  g.add(new THREE.Mesh(mergeGeometries(rodas), MAT.pneu));
  g.add(new THREE.Mesh(mergeGeometries(farol), MAT.farol)); g.add(new THREE.Mesh(mergeGeometries(lant), MAT.lanterna));
  scene.add(g); return g;
}
function modeloVan(corHex = '#f4f4f2') {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(peca(new RoundedBoxGeometry(2, 2.1, 5.2, 2, .2), corHex, 0, .4 + 1.05, 0), MAT.vc));
  g.add(new THREE.Mesh(peca(new THREE.BoxGeometry(1.8, .7, .1), '#fff', 0, 1.9, 2.56), MAT.vidroCarro));
  const rd = []; for (const [x, z] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) rd.push(peca(new THREE.CylinderGeometry(.36, .36, .26, 12), '#111', x * .92, .36, z * 1.7, 0, 0, Math.PI / 2));
  g.add(new THREE.Mesh(mergeGeometries(rd), MAT.pneu));
  g.add(new THREE.Mesh(peca(new THREE.BoxGeometry(2.02, .25, 3.2), '#ff7a1a', 0, 1.3, -.6), MAT.vc));
  g.traverse(m => { if (m.isMesh) m.castShadow = true; }); scene.add(g); return g;
}
function modeloCaminhao(tipo) {
  const g = new THREE.Group(); const p = [];
  p.push(peca(new RoundedBoxGeometry(2.4, 2.2, 2.2, 2, .2), tipo === 'betoneira' ? '#f2f2f0' : '#e4e7ea', 0, .6 + 1.1, 2.9));
  p.push(peca(new THREE.BoxGeometry(2.3, .35, 7.6), '#2d3136', 0, .75, -.2));
  if (tipo === 'bau') p.push(peca(new THREE.BoxGeometry(2.5, 2.8, 5.4), '#f4f4f2', 0, 1.0 + 1.4, -1.2));
  g.add(new THREE.Mesh(mergeGeometries(p), MAT.vc));
  g.add(new THREE.Mesh(peca(new THREE.BoxGeometry(2.1, .8, .1), '#fff', 0, 2.25, 4.01), MAT.vidroCarro));
  const rd = []; for (const [x, z] of [[-1, 2.7], [1, 2.7], [-1, -1.4], [1, -1.4], [-1, -2.6], [1, -2.6]]) rd.push(peca(new THREE.CylinderGeometry(.5, .5, .4, 12), '#111', x * 1.05, .5, z, 0, 0, Math.PI / 2));
  g.add(new THREE.Mesh(mergeGeometries(rd), MAT.pneu));
  let tambor = null;
  if (tipo === 'betoneira') {
    tambor = new THREE.Group(); tambor.position.set(0, 2.3, -1.3); tambor.rotation.x = -.25;
    const tb = new THREE.Mesh(new THREE.CylinderGeometry(.9, 1.3, 4.2, 14, 1).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#e05a1f', roughness: .5, metalness: .2 }));
    const fx = new THREE.Mesh(new THREE.TorusGeometry(1.1, .08, 4, 14).rotateY(Math.PI / 2).rotateZ(Math.PI / 2), MAT.metal);
    tambor.add(tb, fx); g.add(tambor);
  }
  g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); scene.add(g);
  return { g, tambor };
}
function modeloEscavadeira() {
  const g = new THREE.Group();
  const est = []; for (const x of [-1, 1]) est.push(peca(new RoundedBoxGeometry(.7, .8, 3.8, 2, .3), '#2a2a2a', x * 1.05, .4, 0));
  g.add(new THREE.Mesh(mergeGeometries(est), MAT.vc));
  const giro = new THREE.Group(); giro.position.y = .85; g.add(giro);
  giro.add(new THREE.Mesh(new RoundedBoxGeometry(2.5, 1.1, 3, 2, .15).translate(0, .55, -.4), MAT.amareloMaq));
  giro.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1.2, 1.2).translate(-.65, 1.7, .55), MAT.vidroCarro));
  const lanca = new THREE.Group(); lanca.position.set(.4, 1.0, .9); giro.add(lanca);
  lanca.add(new THREE.Mesh(new THREE.BoxGeometry(.4, .45, 3.6).translate(0, 0, 1.8), MAT.amareloMaq));
  const braco = new THREE.Group(); braco.position.set(0, 0, 3.5); lanca.add(braco);
  braco.add(new THREE.Mesh(new THREE.BoxGeometry(.32, .35, 2.4).translate(0, 0, 1.2), MAT.amareloMaq));
  const cacamba = new THREE.Mesh(new THREE.BoxGeometry(.9, .6, .6).translate(0, -.2, 2.5), new THREE.MeshStandardMaterial({ color: '#3a3a3a', roughness: .6, metalness: .5 }));
  braco.add(cacamba);
  g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); scene.add(g);
  return { g, giro, lanca, braco };
}
function modeloGrua(x, z, hMastro, lanca) {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  const mastro = new THREE.Mesh(new THREE.BoxGeometry(1.6, hMastro, 1.6).translate(0, hMastro / 2, 0), MAT.trelica); mastro.castShadow = true;
  const ug = new THREE.BoxGeometry(1.6, hMastro, 1.6); const uv = ug.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i), uv.getY(i) * hMastro / 1.6);
  mastro.geometry = ug.translate(0, hMastro / 2, 0);
  g.add(mastro);
  const topo = new THREE.Group(); topo.position.y = hMastro; g.add(topo);
  const jg = new THREE.BoxGeometry(1.2, 1.2, lanca); const ju = jg.attributes.uv; for (let i = 0; i < ju.count; i++) ju.setXY(i, ju.getX(i) * lanca / 1.2, ju.getY(i));
  const jib = new THREE.Mesh(jg.translate(0, .6, lanca / 2 - 6), MAT.trelica); jib.castShadow = true; topo.add(jib);
  topo.add(new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.8, 2.6).translate(0, .9, -7), new THREE.MeshStandardMaterial({ color: '#7d8288', roughness: .7 })));
  topo.add(new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 1.6).translate(1.4, -.2, .6), MAT.amareloMaq));
  const cabo = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 1, 4).translate(0, -.5, 0), MAT.poste); topo.add(cabo);
  const carga = new THREE.Mesh(new THREE.BoxGeometry(.6, .5, 5), MAT.metal); carga.castShadow = true; topo.add(carga);
  topo.traverse(m => { if (m.isMesh) m.castShadow = true; });
  return { g, mastro, topo, cabo, carga, hMastro, lanca };
}

// ---------- pessoas ----------
function modeloPessoa(c) {
  const g = new THREE.Group();
  const corpo = [peca(new RoundedBoxGeometry(.46, .6, .26, 1, .08), c.camisa, 0, 1.12, 0), peca(new THREE.SphereGeometry(.12, 10, 8), c.pele, 0, 1.56, 0)];
  if (c.capacete) corpo.push(peca(new THREE.SphereGeometry(.14, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), c.capacete, 0, 1.6, 0));
  else corpo.push(peca(new THREE.SphereGeometry(.125, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2.2), c.cabelo, 0, 1.6, -.01));
  if (c.faixa) corpo.push(peca(new THREE.BoxGeometry(.47, .06, .27), '#e8e8e8', 0, 1.05, 0));
  const tronco = new THREE.Mesh(mergeGeometries(corpo), MAT.vcFosco); tronco.castShadow = true; g.add(tronco);
  const perna = x => { const m = new THREE.Mesh(peca(new THREE.BoxGeometry(.17, .82, .19), c.calca, 0, -.41, 0), MAT.vcFosco); m.position.set(x, .84, 0); m.castShadow = true; g.add(m); return m; };
  const braco = x => { const m = new THREE.Mesh(peca(new THREE.BoxGeometry(.12, .6, .14), c.camisa, 0, -.3, 0), MAT.vcFosco); m.position.set(x, 1.4, 0); m.castShadow = true; g.add(m); return m; };
  const P = { g, pe: [perna(-.11), perna(.11)], br: [braco(-.3), braco(.3)] };
  if (c.caixa) { const cx = new THREE.Mesh(new THREE.BoxGeometry(.5, .4, .4).translate(0, 1.15, .35), new THREE.MeshStandardMaterial({ color: '#b98a55', roughness: .9 })); cx.castShadow = true; g.add(cx); P.caixa = cx; }
  scene.add(g); return P;
}
function poseAndar(P, fase, mov) {
  const a = mov ? Math.sin(fase) * .6 : 0;
  P.pe[0].rotation.x = a; P.pe[1].rotation.x = -a;
  if (P.carregando) { P.br[0].rotation.x = P.br[1].rotation.x = -1.2; }
  else { P.br[0].rotation.x = -a * .8; P.br[1].rotation.x = a * .8; }
  P.g.position.y = mov ? Math.abs(Math.cos(fase)) * .05 : 0;
}
function poseTrabalho(P, t, k) {
  const a = Math.sin(t * 7 + k) ; P.pe[0].rotation.x = P.pe[1].rotation.x = 0;
  P.br[1].rotation.x = -1.4 + a * .7; P.br[0].rotation.x = -.5 + Math.sin(t * 3 + k) * .2; P.g.position.y = 0;
}
const PELES = ['#8d5a3b', '#c68b63', '#e0b08b', '#6b4329', '#f1c9a5', '#a8714d'];
const CABELOS = ['#1d1510', '#3b2618', '#5a3b22', '#111111', '#7a5a35', '#bfa47a'];
const ROUPAS = ['#2f4f7f', '#b83b3b', '#e7e2d6', '#2d6a4f', '#3a3a3a', '#d9a441', '#7b4b8a', '#5c7fa3', '#c45f2a', '#ffffff'];
const CALCAS = ['#24324a', '#2b2b2b', '#5b5b5b', '#3d4a5c', '#6b5a45', '#1f2a3a'];

// ---------- rotas e agentes ----------
function rota(pts) { const c = new THREE.CatmullRomCurve3(pts.map(p => new V3(p[0], 0, p[1])), false, 'centripetal', .5); return { c, L: c.getLength() }; }
// plano: lista de trechos contíguos {r: rota, t0, t1, ease, re} ou {para:true, t0, t1}
function pose(plano, t) {
  for (let i = 0; i < plano.length; i++) {
    const s = plano[i]; if (t < s.t0 || t > s.t1) continue;
    if (s.para) { const ant = plano[i - 1] || plano[i + 1]; const fim = ant === plano[i - 1]; const u = fim ? 1 : 0; const p = ant.r.c.getPointAt(u), tg = ant.r.c.getTangentAt(u); return { x: p.x, z: p.z, ang: Math.atan2(tg.x, tg.z) + (ant.re ? Math.PI : 0), mov: false, dist: 0 }; }
    const u = EASE[s.ease || 'lin'](lin(t, s.t0, s.t1)); const p = s.r.c.getPointAt(u), tg = s.r.c.getTangentAt(u);
    return { x: p.x, z: p.z, ang: Math.atan2(tg.x, tg.z) + (s.re ? Math.PI : 0), mov: true, dist: u * s.r.L };
  }
  return null;
}
const AGENTES = [];
function agenteVeiculo(obj, plano, extra) {
  const A_ = { obj, plano, atualiza(t) { const p = pose(plano, t); obj.visible = !!p; if (!p) return; obj.position.set(p.x, 0, p.z); obj.rotation.y = p.ang; extra && extra(t, p); } };
  AGENTES.push(A_); DIN.push(A_); return A_;
}
function agentePessoa(P, plano, trabalho) {
  const A_ = { P, plano, atualiza(t) {
    const p = pose(plano, t); P.g.visible = !!p; if (!p) return;
    P.g.position.x = p.x; P.g.position.z = p.z; P.g.rotation.y = p.ang;
    if (!p.mov && trabalho && trabalho(t)) poseTrabalho(P, t, P.g.id);
    else poseAndar(P, p.dist * 3.2 + (p.mov ? 0 : 0), p.mov);
  } };
  AGENTES.push(A_); DIN.push(A_); return A_;
}
// trecho com duração a partir da velocidade
const VEL_RUA = 13;
function tr(pts, t0, v, ease = 'lin', re = false) {
  const r = rota(pts); const fator = ease === 'out' || ease === 'in' ? 2 : ease === 'io' ? 1.5 : 1;
  return { r, t0, t1: t0 + fator * r.L / v, ease, re };
}
function chegar(rua, lote, tFim, vRua, vLote) {
  const b = tr(lote, 0, vLote, 'out'); const db = b.t1 - b.t0; b.t1 = tFim; b.t0 = tFim - db;
  const a = tr(rua, 0, vRua); const da = a.t1 - a.t0; a.t1 = b.t0; a.t0 = a.t1 - da; return [a, b];
}
function partir(lote, rua, tIni, vLote, vRua) { const c = tr(lote, tIni, vLote, 'in'); return [c, tr(rua, c.t1, vRua)]; }
const parado = (ch, sa) => ({ para: true, t0: ch[ch.length - 1].t1, t1: sa[0].t0 });
function encadear(lista) { // ajusta t0 de cada trecho para começar quando o anterior acaba
  let t = lista[0].t0;
  for (const s of lista) { const d = s.t1 - s.t0; s.t0 = t; s.t1 = t + d; t = s.t1; }
  return lista;
}

// ---------- vagas e clientes ----------
const VAGAS = [];
function criarVagas() {
  for (let i = 0; i < 14; i++) { const x = -28.5 + i * 3; VAGAS.push({ x, fila: 'A', z: 8.3, desde: Math.abs(x) <= 4.6 ? 'fase1' : 'fase2', uso: [] }); }
  for (let i = 0; i < 13; i++) { const x = -28.5 + i * 3; VAGAS.push({ x, fila: 'B', z: 19.7, desde: 'fase2', uso: [] }); }
}
function vagaLivre(t0, t1, fase, r) {
  const ok = VAGAS.filter(v => (fase === 'fase1' ? v.desde === 'fase1' : true) && v.uso.every(([a, b]) => t1 < a - .8 || t0 > b + .8));
  if (!ok.length) return null; const v = pick(ok, r); v.uso.push([t0, t1]); return v;
}
// lojas: porta (x, z) e caminho até ela
const LOJAS = {};
const SAIDAS = []; // horários em que um carro entra na rua (para espaçar)
function cliente(tChega, permanece, fase, r, popups) {
  // carro: vem da direita pela faixa de perto (z=35.5, sentido -x), entra pela pista de entrada x=21.5
  const ruaIn = [[190, 35.5], [30, 35.5]];
  const tRua = (190 - 30) / VEL_RUA;
  const v = vagaLivre(tChega - 2, tChega + permanece + 6, fase, r); if (!v) return;
  const lojasFase = fase === 'fase1' ? ['l1'] : fase === 'fase2' ? ['l1', 'l2', 'l1'] : ['l1', 'l2', 'rw', 'anc', 'anc', 'rw'];
  const loja = LOJAS[pick(lojasFase, r)];
  const entrada = v.fila === 'A'
    ? [[30, 35.5], [24, 35], [21.5, 31], [21.5, 20], [19, 13.4], [v.x + 4.5, 13], [v.x + 1.4, 12.2], [v.x, 10.4], [v.x, v.z]]
    : [[30, 35.5], [24, 35], [21.5, 31], [21.5, 20], [19, 13.4], [v.x + 4.5, 13.2], [v.x + 1.5, 14.6], [v.x + .2, 16.8], [v.x, v.z]];
  const a = tr(ruaIn, 0, VEL_RUA), b = tr(entrada, 0, VEL_RUA * .9, 'out');
  const durB = b.t1 - b.t0; const tParou = tChega; b.t0 = tParou - durB; b.t1 = tParou; a.t1 = b.t0; a.t0 = a.t1 - tRua;
  let tSai = tParou + permanece;
  // espaça as saídas na rua
  for (const s of SAIDAS) if (Math.abs(s - tSai) < 1.6) tSai = s + 1.6;
  const re = v.fila === 'A' ? [[v.x, v.z], [v.x, 11.2], [v.x - 1.4, 14.2], [v.x - 3.8, 15]] : [[v.x, v.z], [v.x, 17.2], [v.x - 1.4, 15.4], [v.x - 3.8, 15]];
  const c = tr(re, tSai, 3, 'io', true);
  const saida = [[v.x - 3.8, 15], [16, 15], [18.5, 18], [18.5, 30], [16, 34.6], [8, 35.5], [-30, 35.5]];
  const d = tr(saida, c.t1, VEL_RUA * .9, 'in');
  const e = tr([[-30, 35.5], [-200, 35.5]], d.t1, VEL_RUA);
  SAIDAS.push(d.t1);
  const carro = modeloCarro(pick(['sedan', 'suv', 'hatch', 'sedan', 'hatch', 'pickup'], r), pick(PALETA, r));
  agenteVeiculo(carro, [a, b, { para: true, t0: tParou, t1: c.t0 }, c, d, e]);
  // pessoa: sai do carro, vai até a loja, entra; volta antes do carro sair
  const lado = v.x + 1.35, pz = v.z + (v.fila === 'A' ? .4 : -.4);
  const caminho = [[lado, pz]];
  if (v.fila === 'B') caminho.push([lado, 14.2]);
  caminho.push([lado, 6.2], [loja.x + (r() - .5) * 1.2, 5.6], ...loja.dentro);
  const pc = { camisa: pick(ROUPAS, r), calca: pick(CALCAS, r), pele: pick(PELES, r), cabelo: pick(CABELOS, r) };
  const P = modeloPessoa(pc);
  const ida = tr(caminho, tParou + .7, 2.2, 'lin');
  const volta = tr([...caminho].reverse(), 0, 2.2, 'lin');
  const dv = volta.t1 - volta.t0; volta.t1 = c.t0 - .5; volta.t0 = volta.t1 - dv;
  if (volta.t0 < ida.t1 + .5) { volta.t0 = ida.t1 + .5; volta.t1 = volta.t0 + dv; }
  agentePessoa(P, [ida]);
  const P2 = modeloPessoa(pc); agentePessoa(P2, [volta]);
  if (ida.t1 > F('abre')) popups.push({ t: ida.t1, x: loja.x, y: 6, z: loja.z, v: Math.round(25 + r() * 120) });
}

// ---------- fases ----------
const POPUPS = [];
let GRUA, LOJA1, LOJA2, RW, ANC;
const POSTES = [];
function montar() {
  const tObra1 = F('obra') - .2, tPronta1 = F('abre') + .4;
  LOJAS.l1 = { x: 0, z: 4.1, dentro: [[0, 4.6], [0, 3.2]] };
  LOJAS.l2 = { x: -14, z: 4.1, dentro: [[-14, 4.6], [-14, 3.2]] };
  LOJAS.rw = { x: 22, z: 4.1, dentro: [[22, 4.6], [22, 3.2]] };
  LOJAS.anc = { x: 10, z: -15.6, dentro: [[10, 4.8], [10, -14.6], [10, -16.4]] };

  // fase 1: pequena loja + estacionamento de 4 vagas
  LOJA1 = predio({ x0: -6, x1: 6, z0: -6, z1: 4, h: 4.8, cor: '#f3efe7', faixa: '#1f4e79', toldo: '#c8432b', placa: 'EMPÓRIO', placaFundo: '#1f4e79', porta: 0, t0: F('investe') + .3, t1: tObra1, t2: tPronta1 });
  const asf1 = [chao(-8, 23, 6, 17, .05, MAT.asfalto, 6, { cresce: '+x' }), chao(17, 23, 17, 30, .05, MAT.asfalto, 6, { cresce: '-z' })];
  const calc1 = chao(-8, 8, 4, 6, .1, MAT.calcada, 4, { cresce: '+x' });
  const guia = chao(17, 23, 30, 33, .095, MAT.asfalto, 6);
  [...asf1, calc1, guia].forEach(m => scene.add(m));
  const linhas1 = [];
  for (const x of [-6, -3, 0, 3, 6]) { const m = bx(.14, .02, 5, MAT.faixa, [x, .06, 8.5], { sombra: false }); scene.add(m); linhas1.push(m); }
  DIN.push({ atualiza(t) {
    const k = eio(lin(t, tPronta1 - 2.6, tPronta1 - 1.4)); asf1[0].visible = k > 0; asf1[0].scale.x = Math.max(.001, k);
    const k2 = eio(lin(t, tPronta1 - 1.9, tPronta1 - .9)); asf1[1].visible = guia.visible = k2 > 0; asf1[1].scale.z = Math.max(.001, k2);
    const k3 = eio(lin(t, tPronta1 - 2.2, tPronta1 - 1.2)); calc1.visible = k3 > 0; calc1.scale.x = Math.max(.001, k3);
    linhas1.forEach((m, i) => { const kk = sm(lin(t, tPronta1 - 1 + i * .12, tPronta1 - .7 + i * .12)); m.visible = kk > 0; m.scale.z = Math.max(.001, kk); });
  } });

  // máquinas e operários da fase 1
  obraEquipe({ site: [0, -1], t1: F('obra') - .4, t2: tPronta1 - .4, nOper: 5, escav: [11, -3], beton: [-12, 9], seed: 3, raio: [8, 7] });

  // fase 2: expansão
  const tE1 = F('expansao') + .3, tE2 = F('lucro2') + .9;
  LOJA2 = predio({ x0: -20, x1: -8, z0: -6, z1: 4, h: 4.8, cor: '#eee8dc', faixa: '#2d6a4f', toldo: '#2d6a4f', placa: 'FARMÁCIA', placaFundo: '#2d6a4f', porta: -14, t0: tE1 - .6, t1: tE1, t2: tE2 - .6 });
  const asf2 = [chao(-31, -8, 6, 23, .05, MAT.asfalto, 6, { cresce: '-x' }), chao(-8, 23, 17, 23, .052, MAT.asfalto, 6, { cresce: '-x' })];
  const calc2 = chao(-31, -8, 4, 6, .1, MAT.calcada, 4, { cresce: '-x' });
  [...asf2, calc2].forEach(m => scene.add(m));
  const linhas2 = [];
  for (let i = 0; i <= 14; i++) { const x = -30 + i * 3; if (Math.abs(x) > 6.1) { const m = bx(.14, .02, 5, MAT.faixa, [x, .06, 8.5], { sombra: false }); scene.add(m); linhas2.push(m); } }
  for (let i = 0; i <= 13; i++) { const x = -30 + i * 3; const m = bx(.14, .02, 5, MAT.faixa, [x, .06, 19.5], { sombra: false }); scene.add(m); linhas2.push(m); }
  DIN.push({ atualiza(t) {
    const k = eio(lin(t, tE1 + .4, tE1 + 2.0)); asf2[0].visible = k > 0; asf2[0].scale.x = Math.max(.001, k); calc2.visible = k > 0; calc2.scale.x = Math.max(.001, k);
    const k2 = eio(lin(t, tE1 + 1.0, tE1 + 2.4)); asf2[1].visible = k2 > 0; asf2[1].scale.x = Math.max(.001, k2);
    linhas2.forEach((m, i) => { const kk = sm(lin(t, tE1 + 2.2 + i * .07, tE1 + 2.5 + i * .07)); m.visible = kk > 0; m.scale.z = Math.max(.001, kk); });
  } });
  // árvores e postes da expansão
  const r2 = rng(21);
  const arvs = [];
  for (let x = -29; x <= 14; x += 5.4) arvs.push(arvore(x, 26.5, 1, r2));
  for (let z = -2; z <= 22; z += 6) arvs.push(arvore(-34.5, z, 1.05, r2));
  arvs.forEach((g, i) => { const t0 = tE1 + 1.4 + i * .18; DIN.push({ atualiza(t) { const k = eob(lin(t, t0, t0 + .9)); g.visible = k > 0; g.scale.setScalar(Math.max(.001, k)); } }); });
  const canteiro = chao(-31, 16, 24, 29, .07, MAT.grama, 6, { cresce: '-x' }); canteiro.material = new THREE.MeshStandardMaterial({ map: TX.grama, color: '#7fa04a', roughness: .95 }); scene.add(canteiro);
  const meio = bx(47, .25, .3, MAT.meiofio, [-31, 0, 23.85], { ox: 'min' }); scene.add(meio);
  DIN.push({ atualiza(t) { const k = eio(lin(t, tE1 + .8, tE1 + 2.2)); canteiro.visible = meio.visible = k > 0; canteiro.scale.x = Math.max(.001, k); meio.scale.x = Math.max(.001, k); } });
  const pp = [[-27, 14], [-15, 14], [-3, 14], [9, 14], [-21, 24.3], [-3, 24.3], [13, 24.3], [24, 12], [24, 24]];
  pp.forEach(([x, z], i) => { const p = poste(x, z); const t0 = tE1 + 1.8 + i * .15; DIN.push({ atualiza(t) { const k = eout(lin(t, t0, t0 + .7)); p.visible = k > 0; p.scale.set(1, Math.max(.001, k), 1); } }); });
  obraEquipe({ site: [-14, -1], t1: tE1 - .6, t2: tE2 - .9, nOper: 5, escav: [-24, 6], beton: null, seed: 5, raio: [8, 7] });

  // fase 3: centro comercial
  const tS1 = F('salto') + .2, tS2 = F('movimento') + 2.6;
  ANC = predio({ x0: -30, x1: 30, z0: -32, z1: -16, h: 10, andares: 2, cor: '#ebe6dc', faixa: '#22303c', placa: 'SUPERMERCADO', placaFundo: '#b8322a', placaW: 16, placaY: 3.8, porta: 10, t0: tS1 - .3, t1: tS1, t2: tS2 - 1.0 });
  RW = predio({ x0: 14, x1: 30, z0: -12, z1: 4, h: 9, andares: 2, cor: '#f1ede5', faixa: '#5b4b8a', toldo: '#5b4b8a', placa: 'CAFÉ & CIA', placaFundo: '#5b4b8a', porta: 22, t0: tS1 + .2, t1: tS1 + .6, t2: tS2 - .2 });
  // letreiro do complexo no alto da fachada do supermercado
  const tl = textoTex('IMPÉRIO', { cor: '#ffd27a', fonte: '900 190px Inter', w: 1024, h: 256 });
  const lm = new THREE.MeshStandardMaterial({ map: tl, transparent: true, emissive: '#ffcf70', emissiveMap: tl, emissiveIntensity: .3 });
  NOITE.placas.push(lm);
  const letreiro = new THREE.Mesh(new THREE.PlaneGeometry(22, 5.5), lm); letreiro.position.set(0, 12.6, -15.7); scene.add(letreiro);
  DIN.push({ atualiza(t) { const k = eob(lin(t, tS2 - .6, tS2 + .3)); letreiro.visible = k > 0; letreiro.scale.setScalar(Math.max(.001, k)); } });
  // praça entre as lojas e o supermercado
  const praca = chao(6, 14, -16, 4, .1, MAT.concreto, 3, { cresce: '-z' }); scene.add(praca);
  const fundoServ = chao(-30, 14, -16, -6, .06, MAT.concreto, 4, { cresce: '+x' }); scene.add(fundoServ);
  DIN.push({ atualiza(t) { const k = eio(lin(t, tS1 + 1.5, tS1 + 3)); praca.visible = k > 0; praca.scale.z = Math.max(.001, k); const k2 = eio(lin(t, tS1 + 2, tS1 + 3.4)); fundoServ.visible = k2 > 0; fundoServ.scale.x = Math.max(.001, k2); } });
  const r3 = rng(33);
  const arv3 = [[7.6, 1], [12.4, -3], [7.6, -7], [12.4, -11], [33.8, -2], [33.8, 8], [33.8, 18], [-24, -9], [-8, -9]].map(([x, z]) => arvore(x, z, .9, r3));
  arv3.forEach((g, i) => { const t0 = tS2 - 1.6 + i * .15; DIN.push({ atualiza(t) { const k = eob(lin(t, t0, t0 + .8)); g.visible = k > 0; g.scale.setScalar(Math.max(.001, k)); } }); });
  [[10, -5], [10, 2], [28, -14.3], [-28, -14.3]].forEach(([x, z], i) => { const p = poste(x, z); const t0 = tS2 - 1.2 + i * .15; DIN.push({ atualiza(t) { const k = eout(lin(t, t0, t0 + .7)); p.visible = k > 0; p.scale.set(1, Math.max(.001, k), 1); } }); });
  // totem na esquina
  const tt = textoTex(['CENTRO', 'COMERCIAL', 'IMPÉRIO'], { w: 512, h: 1024, fundo: '#1c2530', cor: '#ffd27a', fonte: '800 92px Inter' });
  const totM = new THREE.MeshStandardMaterial({ map: tt, emissive: '#ffffff', emissiveMap: tt, emissiveIntensity: .2, roughness: .5 }); NOITE.placas.push(totM);
  const totem = new THREE.Group(); totem.position.set(27, 0, 27.5);
  const tg = new THREE.Mesh(new THREE.BoxGeometry(3, 7, .8).translate(0, 3.5, 0), [MAT.poste, MAT.poste, MAT.poste, MAT.poste, totM, totM]); tg.castShadow = true; totem.add(tg); totem.rotation.y = .5; scene.add(totem);
  DIN.push({ atualiza(t) { const k = eob(lin(t, tS2 - .2, tS2 + .7)); totem.visible = k > 0; totem.scale.set(1, Math.max(.001, k), 1); } });
  // grua
  GRUA = modeloGrua(2, -10, 24, 34);
  DIN.push({ atualiza(t) {
    const sobe = eio(lin(t, tS1 - .4, tS1 + 1.2)), desce = eio(lin(t, tS2 - .9, tS2 + .4));
    const k = sobe * (1 - desce); GRUA.g.visible = k > .001; GRUA.g.scale.set(1, Math.max(.001, k), 1);
    GRUA.topo.rotation.y = -.6 + Math.sin((t - tS1) * .55) * 1.25;
    const pos = 10 + 10 * (.5 + .5 * Math.sin((t - tS1) * .9)); const desc = 6 + 8 * (.5 + .5 * Math.sin((t - tS1) * 1.3 + 1));
    GRUA.cabo.position.set(0, 0, pos); GRUA.cabo.scale.y = desc; GRUA.carga.position.set(0, -desc - .3, pos);
  } });
  obraEquipe({ site: [0, -24], t1: tS1 - 1.2, t2: tS2 - 1.3, nOper: 8, escav: [-18, -12], beton: [24, 14], seed: 9, raio: [26, 7] });
  obraEquipe({ site: [22, -4], t1: tS1 - .6, t2: tS2 - .6, nOper: 4, escav: null, beton: null, seed: 13, raio: [8, 8], van: [33.8, 10] });

  // clientes
  const rc = rng(77);
  let t = F('abre') - .3;
  const fimFase1 = tE2;
  while (t < fimFase1) { cliente(t, 3.6 + rc() * 2.5, 'fase1', rc, POPUPS); t += 1.5 + rc() * 1.1; }
  while (t < tS2) { cliente(t, 4 + rc() * 4, 'fase2', rc, POPUPS); t += .55 + rc() * .45; }
  while (t < TEMPO.total + 8) { cliente(t, 5 + rc() * 6, 'fase3', rc, POPUPS); t += .32 + rc() * .25; }

  // funcionários da fase 3: reposição na doca e carrinhos na praça
  funcionarios(tS2 - .5);
  // tráfego de passagem e pedestres na calçada (o vídeo inteiro)
  trafego(); pedestres();
}
function poste(x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  g.add(bx(.18, 7, .18, MAT.poste, [0, 0, 0]));
  g.add(bx(1.6, .12, .14, MAT.poste, [0, 6.9, 0], { ox: 'min' }));
  const lamp = bx(.7, .18, .4, MAT.lampada, [1.3, 6.75, 0], { sombra: false }); g.add(lamp);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TX.brilho, color: '#ffd9a0', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  sp.position.set(1.4, 6.6, 0); sp.scale.set(6, 6, 1); g.add(sp); NOITE.brilhos.push(sp);
  const poca = new THREE.Mesh(new THREE.CircleGeometry(5, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: TX.brilho, color: '#ffcf8a', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  poca.position.set(1.4, .12, 0); g.add(poca); NOITE.brilhos.push(poca);
  POSTES.push(g); return g;
}
function obraEquipe(o) {
  const r = rng(o.seed);
  const [sx, sz] = o.site;
  // van dos operários: chega pela rua, para na calçada; os operários descem e vão aos postos
  const vanPos = o.van || [sx + 4 + r() * 4, 28.2];
  const van = modeloVan();
  const [vx, vz] = vanPos;
  let ch, sa;
  if (o.van) {
    ch = chegar([[38.5, -200], [38.5, 0]], [[38.5, 0], [35.6, 8], [33.8, 12], [33.8, 14]], o.t1 - .2, VEL_RUA, 10);
    sa = partir([[33.8, 14], [34.4, 26], [33, 33], [28, 35.5]], [[28, 35.5], [-200, 35.5]], o.t2 + 1.8, 10, VEL_RUA);
  } else {
    ch = chegar([[200, 35.5], [vx + 14, 35.5]], [[vx + 14, 35.5], [vx + 5, 33.6], [vx + 1, 30.5], [vx, vz]], o.t1 - .2, VEL_RUA, 10);
    sa = partir([[vx, vz], [vx - 1, 30.5], [vx - 5, 34.4], [vx - 14, 35.5]], [[vx - 14, 35.5], [-200, 35.5]], o.t2 + 1.8, 10, VEL_RUA);
  }
  agenteVeiculo(van, [...ch, parado(ch, sa), ...sa]);
  for (let i = 0; i < o.nOper; i++) {
    const P = modeloPessoa({ camisa: '#ff7a1a', calca: '#2a3550', pele: pick(PELES, r), capacete: i % 3 === 0 ? '#ffffff' : '#ffd21a', faixa: true });
    const ang = (i / o.nOper) * Math.PI * 2 + r() * .4;
    const px = sx + Math.cos(ang) * o.raio[0] * (.9 + r() * .2), pz = sz + Math.sin(ang) * o.raio[1] * (.9 + r() * .3);
    const fora = [vanPos[0] + (r() - .5) * 2, vanPos[1] - 1.5];
    const ida = tr([fora, [(fora[0] + px) / 2 + (r() - .5) * 3, (fora[1] + pz) / 2], [px, pz]], o.t1 + .2 + i * .25, 4.2);
    const volta = tr([[px, pz], [(fora[0] + px) / 2, (fora[1] + pz) / 2 + 1], fora], 0, 4.2);
    const dvv = volta.t1 - volta.t0; volta.t1 = o.t2 + 1.5 - i * .1; volta.t0 = volta.t1 - dvv;
    const a = agentePessoa(P, [ida, { para: true, t0: ida.t1, t1: volta.t0 }, volta], () => true);
    if (volta.t0 < ida.t1) { ida.t1 = volta.t0; }
  }
  if (o.escav) {
    const E = modeloEscavadeira();
    const [ex, ez] = o.escav;
    const ch = chegar([[-200, 40.5], [ex - 16, 40.5]], [[ex - 16, 40.5], [ex - 6, 38.5], [ex, 31], [ex, ez + 6], [ex, ez]], o.t1 + 1.6, 14, 20);
    const sa = partir([[ex, ez], [ex, ez + 6], [ex, 31], [ex + 6, 38.5], [ex + 16, 40.5]], [[ex + 16, 40.5], [200, 40.5]], o.t2 - .6, 9, 12);
    agenteVeiculo(E.g, [...ch, parado(ch, sa), ...sa], (t, p) => {
      const k = p.mov ? 0 : 1;
      E.giro.rotation.y = k * (Math.sin(t * 1.6) * .9 - .6);
      E.lanca.rotation.x = -.35 + k * Math.sin(t * 3.2) * .25;
      E.braco.rotation.x = .9 + k * Math.sin(t * 3.2 + 1) * .35;
    });
  }
  if (o.beton) {
    const B = modeloCaminhao('betoneira');
    const [bx_, bz] = o.beton;
    const ch = chegar([[200, 35.5], [bx_ + 14, 35.5]], [[bx_ + 14, 35.5], [bx_ + 4, 34], [bx_, 30], [bx_, bz + 5], [bx_, bz]], o.t1 + 1.8, VEL_RUA, 20);
    const sa = partir([[bx_, bz], [bx_, bz + 5], [bx_, 31], [bx_ - 4, 34.5], [bx_ - 14, 35.5]], [[bx_ - 14, 35.5], [-200, 35.5]], o.t1 + (o.t2 - o.t1) * .55, 10, VEL_RUA);
    agenteVeiculo(B.g, [...ch, parado(ch, sa), ...sa], t => { B.tambor.rotation.z = t * 2.4; });
  }
}
function funcionarios(t0) {
  const r = rng(55);
  // caminhão baú na doca lateral do supermercado
  const C = modeloCaminhao('bau');
  const ch = chegar([[38.5, -220], [38.5, -40]], [[38.5, -40], [37.5, -31], [34.6, -26], [34, -22]], t0 + 1, VEL_RUA, 9);
  agenteVeiculo(C.g, [...ch, { para: true, t0: ch[1].t1, t1: TEMPO.total + 20 }]);
  for (let i = 0; i < 3; i++) {
    const P = modeloPessoa({ camisa: '#b8322a', calca: '#22252b', pele: pick(PELES, r), cabelo: pick(CABELOS, r), caixa: true });
    P.carregando = true;
    const plano = []; let t = t0 + 1.6 + i * 1.1;
    while (t < TEMPO.total + 2) {
      const a = tr([[34, -26.3], [32, -25.2], [30.6, -24 + (i - 1) * .7]], t, 1.8); plano.push(a);
      const b = tr([[30.6, -24 + (i - 1) * .7], [32, -25.2], [34, -26.3]], a.t1 + .4, 1.8); plano.push({ para: true, t0: a.t1, t1: b.t0 }); plano.push(b);
      t = b.t1 + .5; plano.push({ para: true, t0: b.t1, t1: t });
    }
    agentePessoa(P, plano);
  }
  // equipe circulando na praça e na frente das lojas (uniforme vinho)
  for (let i = 0; i < 6; i++) {
    const P = modeloPessoa({ camisa: '#7b1e2b', calca: '#22252b', pele: pick(PELES, r), cabelo: pick(CABELOS, r) });
    const pts = i < 3 ? [[8.5 + r() * 3, 3], [8.5 + r() * 3, -13], [10, -14.8]] : [[-28 + i * 8, 5.2], [-18 + i * 8, 5.2], [-10 + i * 8, 5.2]];
    const plano = []; let t = t0 + r() * 2;
    while (t < TEMPO.total + 2) {
      const a = tr(pts, t, 1.6); const b = tr([...pts].reverse(), a.t1 + 1.2, 1.6);
      plano.push(a, { para: true, t0: a.t1, t1: b.t0 }, b); t = b.t1 + 1.2; plano.push({ para: true, t0: b.t1, t1: t });
    }
    agentePessoa(P, plano);
  }
}
function trafego() {
  const r = rng(91);
  // faixa de longe (z=40.5, sentido +x): fluxo contínuo; aumenta com o tempo
  let t = -20;
  while (t < TEMPO.total + 5) {
    const c = modeloCarro(pick(['sedan', 'suv', 'hatch', 'pickup'], r), pick(PALETA, r));
    const a = tr([[-220, 40.5], [220, 40.5]], t, VEL_RUA + 1);
    agenteVeiculo(c, [a]);
    const dens = t < F('expansao') ? 3.4 : t < F('salto') ? 2.4 : 1.5;
    t += dens * (.6 + r() * .8);
  }
  // faixa de perto (z=35.5, sentido -x): poucos carros de passagem, sem cruzar com os clientes
  t = -18;
  while (t < TEMPO.total + 5) {
    const conflito = SAIDAS.some(s => Math.abs((t + (190 - 16) / VEL_RUA) - s) < 2.5);
    if (!conflito) { const c = modeloCarro(pick(['sedan', 'suv', 'hatch'], r), pick(PALETA, r)); agenteVeiculo(c, [tr([[190, 35.5], [-220, 35.5]], t, VEL_RUA)]); }
    t += 7 + r() * 6;
  }
}
function pedestres() {
  const r = rng(61);
  for (let i = 0; i < 16; i++) {
    const P = modeloPessoa({ camisa: pick(ROUPAS, r), calca: pick(CALCAS, r), pele: pick(PELES, r), cabelo: pick(CABELOS, r) });
    const z = 31 + r() * 1.6 + (i % 2 ? 13 : 0); const dir = r() < .5 ? 1 : -1;
    const t0 = -40 + r() * (TEMPO.total + 40);
    agentePessoa(P, [tr([[-80 * dir, z], [80 * dir, z]], t0, 1.5)]);
  }
}

// ---------- popups de venda (+R$) ----------
const POOL = [];
const TEX_POP = {};
function popTex(v) {
  if (TEX_POP[v]) return TEX_POP[v];
  return TEX_POP[v] = textoTex('+R$ ' + v, { w: 512, h: 160, cor: '#5bf08f', fonte: '800 104px Inter', borda: 'rgba(10,30,15,.85)' });
}
function popups(t) {
  const ativos = POPUPS.filter(p => t >= p.t && t < p.t + 1.6);
  while (POOL.length < ativos.length) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false })); s.renderOrder = 10; scene.add(s); POOL.push(s); }
  POOL.forEach((s, i) => {
    const p = ativos[i]; s.visible = !!p; if (!p) return;
    const k = lin(t, p.t, p.t + 1.6);
    s.material.map = popTex(p.v); s.material.opacity = Math.min(1, k * 6) * (1 - sm(lin(k, .6, 1)));
    s.position.set(p.x, p.y + 4.5 * eout(k), p.z + 1); const sc = 3.6 * (.8 + .2 * eob(Math.min(1, k * 4))); s.scale.set(sc, sc * 160 / 512, 1);
  });
}

// ---------- luz, céu e câmera ----------
const DIA = { fundo: new THREE.Color('#b9cfe3'), sol: new THREE.Color('#fff2dc'), solI: 3.1, ceu: new THREE.Color('#d4e4f4'), terra: new THREE.Color('#7b6a4f'), hemiI: 1.05, env: .45, exp: 1.0 };
const ANOITE = { fundo: new THREE.Color('#2d3352'), sol: new THREE.Color('#ff8f52'), solI: .9, ceu: new THREE.Color('#4d5b8c'), terra: new THREE.Color('#2b2230'), hemiI: .55, env: .12, exp: 1.12 };
function kNoite(t) { return sm(lin(t, F('patrimonio') - .4, F('comecou') + .2)); }
function luz(t) {
  const k = kNoite(t);
  scene.background.copy(DIA.fundo).lerp(ANOITE.fundo, k); scene.fog.color.copy(scene.background);
  sol.color.copy(DIA.sol).lerp(ANOITE.sol, k); sol.intensity = mix(DIA.solI, ANOITE.solI, k);
  hemi.color.copy(DIA.ceu).lerp(ANOITE.ceu, k); hemi.groundColor.copy(DIA.terra).lerp(ANOITE.terra, k); hemi.intensity = mix(DIA.hemiI, ANOITE.hemiI, k);
  scene.environmentIntensity = mix(DIA.env, ANOITE.env, k); renderer.toneMappingExposure = mix(DIA.exp, ANOITE.exp, k);
  // o sol anda devagar o vídeo todo e desce no fim (sombras compridas)
  const az = mix(.95, 1.6, lin(t, 0, TEMPO.total)) + k * .35, el = mix(1.0, .9, lin(t, 0, F('patrimonio'))) - k * .62;
  sol.position.set(Math.cos(az) * Math.cos(el) * 150, Math.sin(el) * 150, Math.sin(az) * Math.cos(el) * 150 - 40);
  sol.target.position.set(0, 0, 0);
  const ln = sm(lin(k, .35, .9));
  NOITE.vidros.forEach(v => v.m.emissiveIntensity = mix(v.base, v.noite, ln));
  NOITE.placas.forEach(m => m.emissiveIntensity = mix(.18, 1.25, ln));
  NOITE.postes.forEach(m => m.emissiveIntensity = ln * 3);
  NOITE.brilhos.forEach(s => s.material.opacity = ln * (s.isSprite ? .85 : .5));
  MAT.farol.emissiveIntensity = mix(.2, 4, ln); MAT.lanterna.emissiveIntensity = mix(.2, 3, ln);
}
// câmera: mesma perspectiva aérea o tempo todo, só se afasta conforme o empreendimento cresce
function chaves() {
  return [
    [0, 128, 40, 47, 1, 0],
    [F('investe'), 132, 41, 47, 0, 0],
    [F('abre'), 138, 42, 46, 0, 2],
    [F('reinveste'), 146, 43, 46, -2, 2],
    [F('expansao') + .5, 172, 44, 47, -5, 3],
    [F('salto') + .3, 212, 45, 49, -1, -2],
    [F('movimento') + 2, 228, 47, 50, 0, -3],
    [F('patrimonio') + 1.5, 242, 52, 51, 0, -3],
    [A('comecou'), 248, 54, 52, 0, -3],
    [Ae('comecou'), 248, 54, 52, 0, -3],
    [Ae('cta') + 1, 262, 50, 55, -62, -16],
  ];
}
let CH;
function interp(t, j) {
  const k = CH; if (t <= k[0][0]) return k[0][j]; if (t >= k[k.length - 1][0]) return k[k.length - 1][j];
  let i = 0; while (k[i + 1][0] < t) i++;
  const [a, b] = [k[i], k[i + 1]]; const u = (t - a[0]) / (b[0] - a[0]);
  // Hermite com tangentes de Catmull (movimento contínuo, sem parar em cada chave)
  const p = k[i - 1] || a, n = k[i + 2] || b;
  const m0 = (b[j] - p[j]) / Math.max(.001, b[0] - p[0]) * (b[0] - a[0]) * (k[i - 1] ? 1 : 0);
  const m1 = (n[j] - a[j]) / Math.max(.001, n[0] - a[0]) * (b[0] - a[0]) * (k[i + 2] ? 1 : 0);
  const u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * a[j] + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * b[j] + (u3 - u2) * m1;
}
function cam(t) {
  const d = interp(t, 1), az = interp(t, 2) * Math.PI / 180, el = interp(t, 3) * Math.PI / 180, tx = interp(t, 4), tz = interp(t, 5);
  const ty = 0;
  camera.position.set(tx + Math.sin(az) * Math.cos(el) * d, ty + Math.sin(el) * d, tz + Math.cos(az) * Math.cos(el) * d);
  camera.lookAt(tx, ty, tz);
}

// ---------- interface (HUD) ----------
const fmt = v => 'R$ ' + Math.round(v).toLocaleString('pt-BR');
function rampa(v0, lista) { return t => { let v = v0; for (const [a, b, alvo, e] of lista) { if (t >= b) v = alvo; else if (t > a) { v = mix(v, alvo, (EASE[e || 'io'])(lin(t, a, b))); break; } else break; } return v; }; }
let CAIXA, PATR, LUCRO, MES, CHIPS, CALLOUTS, LEG;
function financas() {
  CAIXA = rampa(10000, [[F('investe') + .9, F('investe') + 1.8, 2000], [F('lucro') + 1.6, F('lucro') + 2.6, 4500], [F('reinveste') + .3, F('expansao') - .1, 29500, 'lin'], [F('expansao') + 1.0, F('expansao') + 1.8, 4500], [F('lucro2') + 1.2, F('salto') - .2, 220500, 'lin'], [F('salto') + 1.4, F('salto') + 2.2, 20500], [F('movimento') + .3, F('patrimonio') + 2.2, 980500, 'eio']]);
  PATR = rampa(10000, [[F('lucro') + 1.6, F('lucro') + 2.6, 12500], [F('reinveste') + .3, F('expansao') - .1, 37500, 'lin'], [F('lucro2') + 1.2, F('salto') - .2, 253500, 'lin'], [F('movimento') + .3, F('patrimonio') + 2.2, 1213500, 'eio']]);
  LUCRO = rampa(0, [[F('lucro') + 1.6, F('lucro') + 2.6, 2500], [F('lucro2') + .5, F('lucro2') + 1.5, 9000], [F('movimento') + .3, F('movimento') + 1.3, 40000]]);
  MES = rampa(0, [[F('investe') + .9, F('abre'), 1, 'lin'], [F('abre'), F('lucro') + 1.6, 2, 'lin'], [F('reinveste') + .3, F('expansao') - .1, 12, 'lin'], [F('lucro2') + 1.2, F('salto') - .2, 36, 'lin'], [F('movimento') + .3, F('patrimonio') + 2.2, 60, 'eio']]);
  CHIPS = [
    [F('investe') + .9, 0, '−R$ 8.000', '#ff6b5e'], [F('lucro') + 1.6, 0, '+R$ 2.500', '#5bf08f'], [F('lucro') + 1.6, 1, '+R$ 2.500/mês', '#5bf08f'],
    [F('expansao') + 1.0, 0, '−R$ 25.000', '#ff6b5e'], [F('lucro2') + .5, 1, '+R$ 6.500/mês', '#5bf08f'],
    [F('salto') + 1.4, 0, '−R$ 200.000', '#ff6b5e'], [F('movimento') + .3, 1, '+R$ 31.000/mês', '#5bf08f'],
  ];
  CALLOUTS = [
    { t0: F('comeco') - .2, t1: A('investe') + .1, rot: 'CAPITAL INICIAL', val: 'R$ 10.000' },
    { t0: F('investe') + .3, t1: F('obra') + 1.0, rot: 'INVESTIMENTO', val: 'R$ 8.000', cor: '#ff8a7a', sub: 'uma pequena loja' },
    { t0: F('lucro') + 1.2, t1: Ae('lucro') + .2, rot: 'LUCRO', val: 'R$ 2.500', cor: '#5bf08f', sub: 'no primeiro mês' },
    { t0: F('expansao') + .6, t1: F('expansao') + 3.4, rot: 'EXPANSÃO', val: 'R$ 25.000', cor: '#ff8a7a', sub: 'pago com o caixa' },
    { t0: F('salto') + 1.0, t1: F('salto') + 3.6, rot: 'CENTRO COMERCIAL', val: 'R$ 200.000', cor: '#ff8a7a', sub: 'ano 3' },
    { t0: F('patrimonio') + 1.6, t1: Ae('patrimonio') + .1, rot: 'PATRIMÔNIO', val: 'R$ 1.213.500', cor: '#ffd27a', sub: 'em 5 anos' },
  ];
  LEG = [];
  for (const a of TEMPO.atos) {
    if (!a.fala) continue;
    const ws = a.fala.texto.split(/\s+/); const pesos = ws.map(w => w.length + 2); const tot = pesos.reduce((x, y) => x + y, 0);
    let acc = 0; const pal = ws.map((w, i) => { const t0 = a.fala.t0 + (a.fala.t1 - a.fala.t0) * acc / tot; acc += pesos[i]; return { w, t0, t1: a.fala.t0 + (a.fala.t1 - a.fala.t0) * acc / tot }; });
    let bloco = [];
    const fecha = () => { if (bloco.length) LEG.push(bloco); bloco = []; };
    pal.forEach(p => { const txt = bloco.map(b => b.w).join(' '); if (bloco.length >= 3 || (txt + ' ' + p.w).length > 19) fecha(); bloco.push(p); if (/[.,:?!]$/.test(p.w)) fecha(); });
    fecha();
  }
}
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function textoTab(g, s, x, y, align) { // dígitos com largura fixa (o número não treme enquanto conta)
  const dw = g.measureText('0').width; let w = 0; for (const ch of s) w += /\d/.test(ch) ? dw : g.measureText(ch).width;
  let cx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x; const al = g.textAlign; g.textAlign = 'center';
  for (const ch of s) { const cw = /\d/.test(ch) ? dw : g.measureText(ch).width; g.fillText(ch, cx + cw / 2, y); cx += cw; }
  g.textAlign = al; return w;
}
function hud(t) {
  const g = ctx;
  const ent = sm(lin(t, .5, 1.3));
  if (ent > 0) {
    g.save(); g.globalAlpha = ent; g.translate(0, (1 - ent) * -30);
    // mês
    const mes = MES(t); const m = Math.floor(mes + 1e-6);
    g.font = '700 28px Inter'; g.textBaseline = 'middle';
    rr(g, 60, 150, 960, 192, 34); g.fillStyle = 'rgba(12,16,22,.66)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#9fb0c3'; g.textAlign = 'left'; g.fillText('SIMULAÇÃO', 96, 190);
    g.textAlign = 'right'; g.fillStyle = '#e8eef5'; textoTab(g, m === 0 ? 'INÍCIO' : `MÊS ${m}`, 984, 190, 'right');
    // barra de 60 meses
    rr(g, 290, 184, 520, 10, 5); g.fillStyle = 'rgba(255,255,255,.12)'; g.fill();
    rr(g, 290, 184, Math.max(10, 520 * mes / 60), 10, 5); g.fillStyle = '#ffd27a'; g.fill();
    const cols = [['CAIXA', CAIXA(t)], ['LUCRO / MÊS', LUCRO(t)], ['PATRIMÔNIO', PATR(t)]];
    cols.forEach(([rot, v], i) => {
      const cx = 60 + 160 + i * 320;
      g.textAlign = 'center'; g.font = '600 24px Inter'; g.fillStyle = '#9fb0c3'; g.fillText(rot, cx, 240);
      g.font = '800 41px Inter';
      // pisca na cor da variação
      const ch = CHIPS.filter(c => c[1] === i && t >= c[0] && t < c[0] + 1.8).pop();
      g.fillStyle = ch ? ch[3] : '#ffffff';
      if (i === 1 && v === 0) { g.fillStyle = '#6b7a8c'; g.fillText('—', cx, 292); }
      else textoTab(g, fmt(v), cx, 292, 'center');
    });
    // chips de variação
    CHIPS.forEach(([t0, i, txt, c]) => {
      const k = lin(t, t0, t0 + 2.2); if (k <= 0 || k >= 1) return;
      const a = Math.min(1, k * 8) * (1 - sm(lin(k, .7, 1)));
      const cx = 60 + 160 + i * 320; g.globalAlpha = ent * a; g.font = '800 30px Inter';
      const w = g.measureText(txt).width + 36; const y = 372 + eout(Math.min(1, k * 3)) * 10;
      rr(g, cx - w / 2, y - 24, w, 48, 24); g.fillStyle = 'rgba(12,16,22,.72)'; g.fill();
      g.fillStyle = c; g.textAlign = 'center'; g.fillText(txt, cx, y + 1);
    });
    g.restore();
  }
  // título de abertura
  const ti = lin(t, .1, .7) * (1 - lin(t, 2.6, 3.2));
  if (ti > 0) {
    g.save(); g.globalAlpha = sm(ti); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 24;
    g.font = '600 30px Inter'; g.fillStyle = '#ffd27a'; g.fillText('S I M U L A Ç Ã O', W / 2, 470);
    g.font = '900 96px Inter'; g.fillStyle = '#fff'; g.fillText('DO ZERO', W / 2, 560); g.fillText('AO IMPÉRIO', W / 2, 660);
    g.restore();
  }
  // destaques no centro
  for (const c of CALLOUTS) {
    const k = lin(t, c.t0, c.t1); if (k <= 0 || k >= 1) continue;
    const dur = c.t1 - c.t0; const a = sm(Math.min(1, (t - c.t0) / .35)) * (1 - sm(lin(t, c.t1 - .4, c.t1)));
    const s = .85 + .15 * eob(Math.min(1, (t - c.t0) / .45));
    const y0 = c === CALLOUTS[0] ? 820 : 520;
    g.save(); g.globalAlpha = a; g.translate(W / 2, y0); g.scale(s, s);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '900 104px Inter'; const vw = Math.max(g.measureText(c.val).width, 360) + 90;
    rr(g, -vw / 2, -96, vw, c.sub ? 236 : 196, 30); g.fillStyle = 'rgba(12,16,22,.7)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = 2; g.stroke();
    g.font = '700 32px Inter'; g.fillStyle = '#c9d4e0'; g.fillText(c.rot, 0, -52);
    g.font = '900 104px Inter'; g.fillStyle = c.cor || '#ffd27a'; textoTab(g, c.val, 0, 26, 'center');
    if (c.sub) { g.font = '600 30px Inter'; g.fillStyle = '#9fb0c3'; g.fillText(c.sub, 0, 104); }
    g.restore();
  }
  // comparação antes x hoje
  const wx = WIPE(t);
  if (wx > 1 && wx < W - 1) {
    g.save(); g.fillStyle = '#fff'; g.shadowColor = 'rgba(255,220,150,.9)'; g.shadowBlur = 20; g.fillRect(wx - 3, 0, 6, H); g.restore();
    const kl = sm(lin(t, F('comecou') - .1, F('comecou') + .6)) * (1 - sm(lin(t, Ae('comecou') - .7, Ae('comecou') - .3)));
    g.save(); g.globalAlpha = kl; g.textBaseline = 'middle';
    const tag = (x, al, a, b, c) => { g.textAlign = al; g.font = '800 34px Inter'; g.fillStyle = '#fff'; g.shadowColor = 'rgba(0,0,0,.7)'; g.shadowBlur = 14; g.fillText(a, x, 470); g.font = '900 52px Inter'; g.fillStyle = c; g.fillText(b, x, 526); };
    tag(wx - 34, 'right', 'ANTES', 'R$ 10.000', '#ffffff'); tag(wx + 34, 'left', 'HOJE', 'R$ 1,2 MI', '#ffd27a');
    g.restore();
  }
  // frase final
  const kf = sm(lin(t, F('comecou') + .2, F('comecou') + .8)) * (1 - sm(lin(t, Ae('comecou') - .5, Ae('comecou'))));
  if (kf > 0) {
    g.save(); g.globalAlpha = kf; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = 'rgba(0,0,0,.75)'; g.shadowBlur = 26;
    g.font = '800 54px Inter'; g.fillStyle = '#fff'; g.fillText('TUDO COMEÇOU COM', W / 2, 1040);
    g.font = '900 150px Inter'; g.fillStyle = '#ffd27a'; g.fillText('R$ 10.000', W / 2, 1150); g.restore();
  }
  const kc = sm(lin(t, F('cta') - .1, F('cta') + .5));
  if (kc > 0) {
    const s = .9 + .1 * eob(lin(t, F('cta') - .1, F('cta') + .5));
    g.save(); g.globalAlpha = kc; g.translate(W / 2, 560); g.scale(s, s); g.textAlign = 'center'; g.textBaseline = 'middle';
    rr(g, -470, -150, 940, 300, 34); g.fillStyle = 'rgba(12,16,22,.72)'; g.fill(); g.strokeStyle = 'rgba(255,210,122,.55)'; g.lineWidth = 3; g.stroke();
    g.font = '800 46px Inter'; g.fillStyle = '#c9d4e0'; g.fillText('O QUE DEVEMOS', 0, -70);
    g.font = '900 86px Inter'; g.fillStyle = '#fff'; g.fillText('CONSTRUIR', 0, 10); g.fillStyle = '#ffd27a'; g.fillText('AGORA?', 0, 92);
    g.restore();
    const kb = sm(lin(t, F('cta') + 1.6, F('cta') + 2.2));
    if (kb > 0) { g.save(); g.globalAlpha = kb; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '800 40px Inter'; const txt = 'COMENTA AQUI ↓'; const w = g.measureText(txt).width + 64; rr(g, W / 2 - w / 2, 780 - 36, w, 72, 36); g.fillStyle = '#ffd27a'; g.fill(); g.fillStyle = '#141414'; g.fillText(txt, W / 2, 782); g.restore(); }
  }
  // legenda sincronizada
  const bloco = LEG.find(b => t >= b[0].t0 - .05 && t < b[b.length - 1].t1 + .25);
  if (bloco) {
    g.save(); g.textAlign = 'left'; g.textBaseline = 'middle'; g.font = '900 66px Inter'; g.lineJoin = 'round';
    const esp = g.measureText(' ').width + 16; const ws = bloco.map(b => g.measureText(b.w.toUpperCase()).width); const tot = ws.reduce((a, b) => a + b, 0) + esp * (ws.length - 1);
    let x = W / 2 - tot / 2; const y = 1400;
    const ap = sm(lin(t, bloco[0].t0 - .05, bloco[0].t0 + .12)); g.globalAlpha = ap;
    bloco.forEach((b, i) => {
      const s = b.w.toUpperCase(); const ativo = t >= b.t0 && t < b.t1 + .05;
      const pop = ativo ? 1 + .08 * (1 - lin(t, b.t0, b.t0 + .15)) : 1;
      g.save(); g.translate(x + ws[i] / 2, y); g.scale(pop, pop);
      g.strokeStyle = 'rgba(0,0,0,.92)'; g.lineWidth = 14; g.strokeText(s, -ws[i] / 2, 0);
      g.fillStyle = ativo ? '#ffd27a' : '#ffffff'; g.fillText(s, -ws[i] / 2, 0); g.restore();
      x += ws[i] + esp;
    });
    g.restore();
  }
}
let WIPE = () => W;
let GRAO, VINHETA;
function post() {
  ctx.drawImage(VINHETA, 0, 0);
  ctx.save(); ctx.globalAlpha = .06; ctx.globalCompositeOperation = 'overlay';
  const ox = Math.floor(Math.random() * 256), oy = Math.floor(Math.random() * 256);
  ctx.translate(-ox, -oy); ctx.fillStyle = ctx.createPattern(GRAO, 'repeat'); ctx.fillRect(0, 0, W + 256, H + 256); ctx.restore();
}

// ---------- marcação do vizinho (pergunta final) ----------
let MARCA;
function marcaVizinho() {
  const pts = [[-72, -34], [-38, -34], [-38, 22], [-72, 22], [-72, -34]].map(([x, z]) => new V3(x, .3, z));
  const geo = new THREE.BufferGeometry();
  const segs = []; for (let i = 0; i < 4; i++) { const a = pts[i], b = pts[i + 1]; const L = a.distanceTo(b); const n = Math.floor(L / 2); for (let k = 0; k < n; k += 1) { if (k % 2) continue; segs.push(a.clone().lerp(b, k / n)); segs.push(a.clone().lerp(b, (k + 1) / n)); } }
  geo.setFromPoints(segs);
  const borda = []; for (let i = 0; i < 4; i++) { const a = pts[i], b = pts[i + 1]; const L = a.distanceTo(b); const n = Math.floor(L / 2.4); for (let k = 0; k < n; k += 2) { const p = a.clone().lerp(b, (k + .5) / n); const dir = b.clone().sub(a).normalize(); borda.push(peca(new THREE.BoxGeometry(Math.abs(dir.x) * 2.2 + .5, .12, Math.abs(dir.z) * 2.2 + .5), '#ffd27a', p.x, .2, p.z)); } }
  const mm = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, depthWrite: false });
  const b = new THREE.Mesh(mergeGeometries(borda), mm); scene.add(b);
  const area = new THREE.Mesh(new THREE.PlaneGeometry(34, 56).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffd27a', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  area.position.set(-55, .25, -6); scene.add(area);
  const q = new THREE.Sprite(new THREE.SpriteMaterial({ map: textoTex('?', { w: 256, h: 256, cor: '#ffd27a', fonte: '900 230px Inter', borda: 'rgba(0,0,0,.6)' }), transparent: true, opacity: 0, depthTest: false }));
  q.position.set(-55, 9, -6); scene.add(q);
  MARCA = { b, area, q };
}
function marca(t) {
  const k = sm(lin(t, F('cta') + .4, F('cta') + 1.2));
  const pul = .5 + .5 * Math.sin(t * 5);
  MARCA.b.material.opacity = k; MARCA.area.material.opacity = k * (.08 + .08 * pul);
  MARCA.q.material.opacity = k; const s = 9 + pul * 1.2; MARCA.q.scale.set(s, s, 1); MARCA.q.position.y = 5 + Math.sin(t * 2.2) * .8;
}

// ---------- estado de um instante ----------
function aplicar(t) { for (const d of DIN) d.atualiza(t); luz(t); popups(t); marca(t); }

window.iniciar = async (tempo) => {
  TEMPO = tempo; for (const a of tempo.atos) ATO[a.cena] = a;
  await document.fonts.load('800 40px Inter'); await document.fonts.load('900 40px Inter'); await document.fonts.load('600 40px Inter');
  out = document.getElementById('c'); ctx = out.getContext('2d');
  renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.localClippingEnabled = true;
  scene = new THREE.Scene(); scene.background = new THREE.Color(); scene.fog = new THREE.Fog(0xffffff, 420, 1100);
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture;
  camera = new THREE.PerspectiveCamera(30, W / H, 5, 2500);
  hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1); scene.add(hemi);
  sol = new THREE.DirectionalLight(0xffffff, 3); sol.castShadow = true; scene.add(sol); scene.add(sol.target);
  sol.shadow.mapSize.set(4096, 4096); const sc = sol.shadow.camera; sc.left = -95; sc.right = 95; sc.top = 95; sc.bottom = -95; sc.near = 10; sc.far = 400;
  sol.shadow.bias = -.0004; sol.shadow.normalBias = .04; sol.shadow.radius = 3;
  texturas(); materiais();
  chaoGeral(); vizinhanca(); criarVagas(); montar(); marcaVizinho(); financas();
  CH = chaves();
  WIPE = t => { const a = F('comecou') - .25; const ida = eio(lin(t, a, a + 1.1)); const volta = eio(lin(t, Ae('comecou') - .9, Ae('comecou') - .1)); return W - (W / 2) * ida - (W / 2) * volta; };
  // grão e vinheta prontos
  GRAO = document.createElement('canvas'); GRAO.width = GRAO.height = 256; { const g = GRAO.getContext('2d'); const id = g.createImageData(256, 256); const r = rng(5); for (let i = 0; i < id.data.length; i += 4) { const v = 128 + (r() - .5) * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } g.putImageData(id, 0, 0); }
  VINHETA = document.createElement('canvas'); VINHETA.width = W; VINHETA.height = H; { const g = VINHETA.getContext('2d'); const gr = g.createRadialGradient(W / 2, H * .5, H * .28, W / 2, H * .5, H * .72); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.42)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); const g2 = g.createLinearGradient(0, 0, 0, 520); g2.addColorStop(0, 'rgba(0,0,0,.35)'); g2.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = g2; g.fillRect(0, 0, W, 520); }
  window.PRONTO = true;
};

window.quadro = (t) => {
  cam(t);
  aplicar(t);
  renderer.setScissorTest(false); renderer.render(scene, camera);
  const wx = WIPE(t);
  if (wx > 1 && wx < W - 1) { // lado esquerdo: o mesmo terreno no primeiro segundo, mesma câmera
    aplicar(.2); renderer.setScissorTest(true); renderer.setScissor(0, 0, Math.round(wx), H); renderer.setViewport(0, 0, W, H);
    renderer.render(scene, camera); renderer.setScissorTest(false); aplicar(t);
  }
  ctx.drawImage(renderer.domElement, 0, 0, W, H);
  post(); hud(t);
};
window.eventos = () => ({
  popups: POPUPS.map(p => p.t),
  callouts: CALLOUTS.map(c => c.t0).concat([F('comecou') + .2, F('cta') - .1]),
  chips: CHIPS.filter(c => c[1] === 0).map(c => [c[0], c[2].startsWith('+') ? 1 : -1]),
  obras: PREDIOS.map(p => [p.o.t1, p.o.t2]),
  wipe: [F('comecou') - .25, Ae('comecou') - .9],
  botao: F('cta') + 1.6,
});
window.info = () => ({ agentes: AGENTES.length, calls: renderer.info.render.calls, tris: renderer.info.render.triangles });
