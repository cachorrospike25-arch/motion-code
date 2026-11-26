// PEDRIN · episódio 1 (O COMEÇO DE UM SONHO): futebol em 3D (three.js, Chromium headless). Tudo é função de t.
// Contrato do estúdio: window.iniciar(tempo), window.quadro(t), window.eventos(), window.info().
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const W = 1080, H = 1920;
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lin = (t, a, b) => cl((t - a) / (b - a));
const sm = (x) => x * x * (3 - 2 * x);
const eio = (x) => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const eout = (x) => 1 - (1 - x) * (1 - x) * (1 - x);
const eob = (x) => { if (x <= 0) return 0; if (x >= 1) return 1; const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const mix = (a, b, k) => a + (b - a) * k;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

let TEMPO, ATO = {}, renderer, scene, camera, out, ctx, sol, hemi, EV;
const A0 = (id) => ATO[id].t0, A1 = (id) => ATO[id].t1, F0 = (id) => ATO[id].fala.t0, F1 = (id) => ATO[id].fala.t1;

// ---------- texturas ----------
function ctex(w, h, draw, rep = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h, rng(w * 7 + h));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
const TX = {};
function texturas() {
  TX.terra = ctex(512, 512, (g, w, h, r) => {
    g.fillStyle = '#9a7650'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { const x = r() * w, y = r() * h, rr = 30 + r() * 90, gr = g.createRadialGradient(x, y, 0, x, y, rr); const c = r() < .5 ? '110,80,50' : '190,155,110'; gr.addColorStop(0, `rgba(${c},.35)`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
    for (let i = 0; i < 5000; i++) { g.fillStyle = ['#7d5c3b', '#b79a72', '#6d4f33', '#c8ad85'][Math.floor(r() * 4)]; g.globalAlpha = .6; g.fillRect(r() * w, r() * h, 1 + r() * 2.4, 1 + r() * 2.4); } g.globalAlpha = 1;
    for (let i = 0; i < 90; i++) { g.strokeStyle = '#4d7a30'; g.globalAlpha = .7; g.lineWidth = 1.4; const x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - .5) * 6, y - 5 - r() * 8); g.stroke(); } g.globalAlpha = 1;
  });
  TX.grama = ctex(1024, 1024, (g, w, h, r) => {
    for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#3f8a2f' : '#4b9a37'; g.fillRect(0, i * h / 8, w, h / 8); }
    for (let i = 0; i < 26000; i++) { g.fillStyle = ['#2f7425', '#56a63d', '#3a8030', '#63b247'][Math.floor(r() * 4)]; g.globalAlpha = .55; g.fillRect(r() * w, r() * h, 1.5, 3 + r() * 4); } g.globalAlpha = 1;
  });
  TX.tijolo = ctex(512, 512, (g, w, h, r) => {
    g.fillStyle = '#a14e36'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 32) for (let x = (y / 32 % 2) * 32; x < w + 64; x += 64) { g.fillStyle = `rgb(${150 + r() * 40},${70 + r() * 25},${50 + r() * 20})`; g.fillRect(x + 2, y + 2, 60, 28); }
    for (let i = 0; i < 1500; i++) { g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(r() * w, r() * h, 2, 2); }
  });
  TX.reboco = ctex(256, 256, (g, w, h, r) => { g.fillStyle = '#e8dcc6'; g.fillRect(0, 0, w, h); for (let i = 0; i < 2500; i++) { g.fillStyle = r() < .5 ? 'rgba(120,100,80,.12)' : 'rgba(255,255,255,.15)'; g.fillRect(r() * w, r() * h, 2, 2); } });
  TX.bola = ctex(512, 256, (g, w, h) => {
    g.fillStyle = '#f4f4f0'; g.fillRect(0, 0, w, h); g.fillStyle = '#1a1a1a';
    for (let i = 0; i < 6; i++) for (const y of [h * .3, h * .7]) { const x = (i + (y > h / 2 ? .5 : 0)) * w / 6 + 30; g.beginPath(); for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + k * 2 * Math.PI / 5; g.lineTo(x + Math.cos(a) * 24, y + Math.sin(a) * 24); } g.fill(); }
  }, false);
  TX.meia = ctex(256, 128, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#e8788a' : '#3a56a8'; g.fillRect(i * w / 8, 0, w / 8, h); } g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 3; for (let y = 10; y < h; y += 14) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } }, false);
  TX.ceuA = ctex(8, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3d6fb8'); gr.addColorStop(.45, '#f0b27a'); gr.addColorStop(.62, '#ffd7a0'); gr.addColorStop(1, '#f6e6c8'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, false);
  TX.ceuB = ctex(8, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#4f93d8'); gr.addColorStop(.55, '#a9d2f0'); gr.addColorStop(1, '#eaf4fb'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, false);
  TX.torcida = ctex(512, 128, (g, w, h, r) => { g.fillStyle = '#3a4350'; g.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { g.fillStyle = ['#e9c46a', '#e76f51', '#2a9d8f', '#f4f1de', '#264653', '#c1121f'][Math.floor(r() * 6)]; g.fillRect(r() * w, r() * h, 4, 5); } }, false);
}

// ---------- humano articulado ----------
function humano(o = {}) {
  const mk = (c, rough = .75, met = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: rough, metalness: met });
  const pele = mk(o.pele || '#a8704a', .6), camisa = mk(o.camisa || '#f2c100', .82), calcao = mk(o.calcao || '#1f4fa8', .82), meiao = mk(o.meiao || '#f2f2ee', .88);
  const manga = o.mangaLonga ? mk(o.mangaLonga, .85) : camisa, calca = o.calca ? mk(o.calca, .85) : null, cab = mk(o.cabelo || '#15110f', .85), preto = mk('#161616', .5, .1), branco = mk('#f4f4f0', .5);
  const bota = mk(o.bota || '#1b1b1b', .45, .15);
  const R = new THREE.Group(), q = new THREE.Group(); R.add(q);
  const add = (p, g, m, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) => { const me = new THREE.Mesh(g, m); me.position.set(x, y, z); me.scale.set(sx, sy, sz); me.castShadow = true; me.receiveShadow = true; p.add(me); return me; };
  const limb = (r, len) => { const g = new THREE.CapsuleGeometry(r, len, 4, 10); g.translate(0, -(len / 2 + r), 0); return g; };
  add(q, new THREE.SphereGeometry(.15, 14, 10), calca || calcao, 0, 0, 0, 1.12, .82, .86);
  const tr = new THREE.Group(); tr.position.y = .05; q.add(tr);
  add(tr, new THREE.CapsuleGeometry(.155, .27, 4, 14), o.jaqueta ? mk(o.jaqueta, .85) : camisa, 0, .3, 0, 1.2, 1, .78);
  add(tr, new THREE.CapsuleGeometry(.055, .06, 4, 8), pele, 0, .625, 0);
  const cb = new THREE.Group(); cb.position.set(0, .655, 0); tr.add(cb);
  add(cb, new THREE.SphereGeometry(.118, 22, 18), pele, 0, .12, 0, .9, 1.12, 1.0);
  if (!o.careca) { const hr = add(cb, new THREE.SphereGeometry(.125, 24, 14, 0, Math.PI * 2, 0, Math.PI * .47), cab, 0, .137, -.016, .94, 1.12, 1.05); hr.rotation.x = -.3; for (const sd of [-1, 1]) add(cb, new THREE.BoxGeometry(.018, .06, .03), cab, sd * .1, .125, .035); }
  for (const s of [-1, 1]) {
    add(cb, new THREE.SphereGeometry(.026, 10, 8), branco, s * .042, .14, .096).scale.set(1, .85, .6);
    add(cb, new THREE.SphereGeometry(.014, 8, 6), preto, s * .042, .14, .108);
    const sb = add(cb, new THREE.BoxGeometry(.05, .01, .01), cab, s * .045, .183, .1); sb.rotation.z = s * -.12;
    add(cb, new THREE.SphereGeometry(.028, 8, 6), pele, s * .105, .115, 0, .5, 1, .8);
  }
  add(cb, new THREE.SphereGeometry(.02, 8, 6), pele, 0, .105, .115, 1, 1.2, 1);
  const boca = add(cb, new THREE.BoxGeometry(.05, .012, .01), mk('#3a1414', .6), 0, .062, .104);
  if (o.oculos) { for (const s of [-1, 1]) { const a = add(cb, new THREE.TorusGeometry(.03, .004, 6, 14), preto, s * .042, .14, .112); } }
  const braco = (s) => {
    const sh = new THREE.Group(); sh.position.set(s * .23, .5, 0); tr.add(sh);
    add(sh, new THREE.SphereGeometry(.062, 12, 10), manga); add(sh, limb(.054, .22), manga);
    const co = new THREE.Group(); co.position.y = -.3; sh.add(co);
    add(co, limb(.046, .21), o.mangaLonga ? manga : pele); const mao = add(co, new THREE.SphereGeometry(.05, 10, 8), pele, 0, -.3, 0, .8, 1.3, .55); add(co, new THREE.SphereGeometry(.02, 8, 6), pele, s * -.035, -.28, .03);
    return { sh, co, mao };
  };
  const perna = (s) => {
    const qd = new THREE.Group(); qd.position.set(s * .095, -.02, 0); q.add(qd);
    add(qd, limb(.088, .3), calca || pele); if (!calca) add(qd, limb(.094, .16), calcao, 0, .01);
    const jo = new THREE.Group(); jo.position.y = -.46; qd.add(jo);
    add(jo, limb(.062, .3), calca || pele); if (!calca) var sock = add(jo, limb(.066, .2), meiao, 0, -.1);
    const pe = new THREE.Group(); pe.position.y = -.43; jo.add(pe);
    add(pe, new RoundedBoxGeometry(.1, .075, .26, 2, .03), pele, 0, -.03, .06);
    const bt = new THREE.Group(); pe.add(bt); add(bt, new RoundedBoxGeometry(.112, .09, .32, 3, .04), bota, 0, -.03, .08); add(bt, new THREE.SphereGeometry(.052, 12, 10), bota, 0, -.035, .2, 1, .8, 1.1);
    add(bt, new RoundedBoxGeometry(.115, .016, .33, 2, .008), mk('#e8e8e8'), 0, -.082, .08); add(bt, new THREE.BoxGeometry(.05, .012, .1), mk('#d63a3a'), 0, .014, .1); bt.visible = !!o.chuteira;
    return { qd, jo, pe, bt, sock };
  };
  const H_ = { R, q, tr, cb, boca, bL: braco(-1), bR: braco(1), lL: perna(-1), lR: perna(1) };
  if (o.escala) R.scale.setScalar(o.escala);
  return H_;
}
// pose: y, pitch(inclina o corpo todo), yaw, lean(tronco), twist, hx, hy (cabeça), aL/aR: [ombro x, ombro z, cotovelo], lL/lR: [coxa x, joelho], boca
function aplicar(h, p) {
  h.q.position.y = .915 + (p.y || 0); h.q.rotation.set(p.pitch || 0, p.yaw || 0, p.roll || 0);
  h.tr.rotation.set(p.lean || 0, p.twist || 0, 0); h.cb.rotation.set(p.hx || 0, p.hy || 0, p.hz || 0);
  const br = (b, a) => { a = a || [0, 0, 0]; b.sh.rotation.set(a[0], 0, a[1]); b.co.rotation.x = -(a[2] || 0); };
  br(h.bL, p.aL); br(h.bR, p.aR);
  const pr = (l, a) => { a = a || [0, 0]; l.qd.rotation.x = -a[0]; l.jo.rotation.x = a[1]; l.pe.rotation.x = -(a[2] || 0); };
  pr(h.lL, p.lL); pr(h.lR, p.lR);
  h.boca.scale.set(1 + (p.sorriso || 0) * .5, .4 + (p.boca || 0) * 4, 1);
}
const PAR = { y: 0 };
function poseParado(t, s = 0) { const b = Math.sin(t * 2.2 + s) * .004; return { y: b, lean: .02 + b, hx: Math.sin(t * .8 + s) * .03, hy: Math.sin(t * .6 + s) * .05, aL: [Math.sin(t * 1.5) * .04, .08, .1], aR: [-Math.sin(t * 1.5) * .04, -.08, .1], lL: [0, 0], lR: [0, 0] }; }
function poseAndar(ph, a = .55, lean = .06, braco = .5) {
  const s = Math.sin(ph), c = Math.cos(ph);
  return { y: -Math.abs(c) * .02 * (a / .55), lean, hy: 0, twist: s * .12, aL: [-s * braco, .07, .35], aR: [s * braco, -.07, .35], lL: [s * a, Math.max(0, c) * a * 1.4 + Math.max(0, -s) * .1], lR: [-s * a, Math.max(0, -c) * a * 1.4 + Math.max(0, s) * .1] };
}
function poseCorrer(ph) { const p = poseAndar(ph, .95, .22, .95); p.y = -Math.abs(Math.cos(ph)) * .05 - .03; p.aL[2] = p.aR[2] = 1.3; return p; }
function poseChute(k) { // k: 0 (preparo) → .5 (impacto) → 1 (finaliza)
  const arma = sm(lin(k, 0, .45)), bate = sm(lin(k, .4, .55)), volta = sm(lin(k, .6, 1));
  const coxa = mix(mix(.0, -.9, arma), mix(-.9, 1.25, bate), bate) * (1 - volta) + .55 * volta * 0;
  return { y: -.02, lean: mix(.1, .25, bate) * (1 - volta), twist: mix(0, -.35, bate), aL: [mix(.3, .9, bate), .35, .4], aR: [mix(-.3, -.8, bate), -.3, .4], lL: [mix(.1, -.15, bate), .3], lR: [coxa, mix(.1, 1.2, arma) * (1 - bate * .85)] };
}
function poseToque(t) { const k = Math.sin(t * 3); return { y: -.01, lean: .15, hx: .25, aL: [.15, .25, .4], aR: [-.15, -.25, .4], lL: [.05, .15], lR: [k > 0 ? -.35 * k : 0, k > 0 ? .5 * k : 0] }; }
function poseComemora(t, k) { const s = Math.abs(Math.sin(t * 7)); return { y: s * .22 * k, lean: -.05, hx: -.15, aL: [-2.6, .5, .1], aR: [-2.6, -.5, .1], lL: [-.25 * s, .5 * s], lR: [.15, .35 * s], boca: .12, sorriso: 1 }; }

// ---------- bola e objetos ----------
let BOLA, BOLA_MEIA, BOLA_COURO, CHINELOS = [], CEL, CEL_TEX, PEDRIN, TREINADOR, GRUPO_A, GRUPO_B, EXTRAS = [], MOCHILA, SUOR = [];
function bolaMesh(tipo) {
  const m = tipo === 'meia' ? new THREE.MeshStandardMaterial({ map: TX.meia, roughness: .95 }) : new THREE.MeshStandardMaterial({ map: TX.bola, roughness: .45 });
  const b = new THREE.Mesh(new THREE.SphereGeometry(tipo === 'meia' ? .095 : .11, 24, 18), m); b.castShadow = true; return b;
}
function chinelo(cor) {
  const g = new THREE.Group(); const sola = new THREE.Mesh(new RoundedBoxGeometry(.11, .3, .03, 2, .012), new THREE.MeshStandardMaterial({ color: cor, roughness: .8 })); sola.position.y = .15; sola.castShadow = true; g.add(sola);
  const tira = new THREE.Mesh(new THREE.TorusGeometry(.045, .01, 6, 14, Math.PI), new THREE.MeshStandardMaterial({ color: '#f4f4f4' })); tira.position.set(0, .2, .02); g.add(tira); return g;
}
function celular() {
  CEL_TEX = ctex(256, 512, () => { }, false); const g = new THREE.Group();
  const corpo = new THREE.Mesh(new RoundedBoxGeometry(.075, .155, .009, 3, .008), new THREE.MeshStandardMaterial({ color: '#15171c', roughness: .3, metalness: .6 })); corpo.castShadow = true; g.add(corpo);
  const tela = new THREE.Mesh(new THREE.PlaneGeometry(.068, .146), new THREE.MeshBasicMaterial({ map: CEL_TEX })); tela.position.z = .0052; g.add(tela); return g;
}
function telaCelular(t) {
  const c = CEL_TEX.image, g = c.getContext('2d'), w = 256, h = 512; const ch = A0('chamado'), ce = A0('celular');
  g.fillStyle = '#0b141a'; g.fillRect(0, 0, w, h); g.fillStyle = '#1f2c34'; g.fillRect(0, 0, w, 52); g.fillStyle = '#25d366'; g.beginPath(); g.arc(30, 28, 16, 0, 7); g.fill();
  g.fillStyle = '#fff'; g.font = '700 17px Inter'; g.fillText('Olheiro Aurora FC', 54, 26); g.fillStyle = '#8696a0'; g.font = '13px Inter'; g.fillText('online', 54, 44);
  g.fillStyle = '#0b141a'; const bolha = (y, txt, cor, x0, w0, hh) => { g.fillStyle = cor; g.beginPath(); g.roundRect(x0, y, w0, hh, 10); g.fill(); g.fillStyle = '#e9edef'; g.font = '14px Inter'; txt.forEach((l, i) => g.fillText(l, x0 + 10, y + 22 + i * 18)); };
  const tp = lin(t, ce + 1.0, ce + 1.2) + 0 * 1;
  const fr = ['Oi Pedrin! Vimos seu video', 'jogando. Quer fazer uma', 'avaliacao no Aurora FC?'], fr2 = ['PENEIRA: sabado, 8h', 'no CT do Aurora FC.', 'Traga documento e', 'chuteira. Topa?'];
  bolha(70, fr, '#202c33', 14, 200, 76);
  const k2 = lin(t, ch + .1, ch + .6); if (k2 > 0) bolha(158, fr2.slice(0, 1 + Math.floor(k2 * 3.99)), '#202c33', 14, 220, 100);
  const k3 = lin(t, ch + 2.0, ch + 2.3); if (k3 > 0) { g.fillStyle = '#005c4b'; g.beginPath(); g.roundRect(120, 290, 122, 40, 10); g.fill(); g.fillStyle = '#e9edef'; g.font = '700 18px Inter'; g.fillText('TOPO!!!', 140, 316); }
  g.fillStyle = '#1f2c34'; g.fillRect(0, h - 60, w, 60); CEL_TEX.needsUpdate = true;
}

// ---------- cenas ----------
function cenaA() { // rua de terra no fim da tarde
  const g = new THREE.Group();
  const chao = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ map: TX.terra, roughness: 1 })); chao.rotation.x = -Math.PI / 2; chao.position.z = -12; chao.receiveShadow = true; TX.terra.repeat.set(16, 16); g.add(chao);
  const parede = new THREE.Mesh(new THREE.BoxGeometry(22, 2.4, .3), new THREE.MeshStandardMaterial({ map: TX.tijolo, roughness: .95 })); parede.position.set(0, 1.2, -15); parede.castShadow = parede.receiveShadow = true; TX.tijolo.repeat.set(5, 1); g.add(parede);
  const faixa = new THREE.Mesh(new THREE.BoxGeometry(22, .35, .32), new THREE.MeshStandardMaterial({ color: '#e9c46a', roughness: .8 })); faixa.position.set(0, 1.5, -15); g.add(faixa);
  const casas = [[-9.5, 4.2, -13, 5, 4.4], [-7.4, 3.2, -9, 4, 3.4], [9.6, 5.2, -11, 5, 5.2], [8, 3.4, -5, 4.2, 3.6], [-8.5, 3.6, -3, 3.6, 3.8], [-12, 5, -8, 5, 5]];
  const r = rng(5); casas.forEach(([x, h, z, w, d], i) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ map: TX.reboco, color: ['#e6c9a8', '#d9a89a', '#b5cfd8', '#e9d9a0', '#c9b6d8'][i % 5], roughness: .9 })); m.position.set(x, h / 2, z); m.castShadow = m.receiveShadow = true; g.add(m);
    for (let k = 0; k < 2; k++) { const j = new THREE.Mesh(new THREE.BoxGeometry(.8, 1, .05), new THREE.MeshStandardMaterial({ color: '#2a3340', emissive: '#ffb86b', emissiveIntensity: r() < .5 ? .5 : 0, roughness: .3 })); j.position.set(x + (k - .5) * w * .5, h * .55, z + d / 2 + .03 * (x < 0 ? 1 : 1)); g.add(j); }
    const laje = new THREE.Mesh(new THREE.BoxGeometry(w + .3, .2, d + .3), new THREE.MeshStandardMaterial({ color: '#8a8780', roughness: .9 })); laje.position.set(x, h + .1, z); laje.castShadow = true; g.add(laje);
  });
  const poste = new THREE.Mesh(new THREE.CylinderGeometry(.07, .09, 6.5, 8), new THREE.MeshStandardMaterial({ color: '#4a4a4a', roughness: .7 })); poste.position.set(5.5, 3.25, -9); poste.castShadow = true; g.add(poste);
  const caixa = new THREE.Mesh(new RoundedBoxGeometry(.55, .4, .45, 3, .03), new THREE.MeshStandardMaterial({ color: '#8a5a33', roughness: .9 })); caixa.position.set(-2.4, .2, -.8); caixa.castShadow = true; g.add(caixa);
  CHINELOS = [chinelo('#2f9e5c'), chinelo('#d94f6b')]; CHINELOS[0].position.set(-1.45, 0, -9); CHINELOS[1].position.set(1.45, 0, -9); CHINELOS.forEach((c) => g.add(c));
  const pedras = new THREE.Mesh(new THREE.DodecahedronGeometry(.12, 0), new THREE.MeshStandardMaterial({ color: '#8d8579', roughness: 1 })); pedras.position.set(1.9, .08, -2); g.add(pedras);
  return g;
}
function cenaB() { // centro de treinamento do Aurora FC, manhã
  const g = new THREE.Group();
  const grama = new THREE.Mesh(new THREE.PlaneGeometry(90, 110), new THREE.MeshStandardMaterial({ map: TX.grama, roughness: .95 })); grama.rotation.x = -Math.PI / 2; grama.position.z = -20; grama.receiveShadow = true; TX.grama.repeat.set(5, 8); g.add(grama);
  const lm = new THREE.MeshBasicMaterial({ color: '#f4f6f0' }), linha = (x, z, w, d) => { const l = new THREE.Mesh(new THREE.PlaneGeometry(w, d), lm); l.rotation.x = -Math.PI / 2; l.position.set(x, .012, z); g.add(l); };
  linha(0, -45, 40, .14); linha(-20, -22, .14, 46); linha(20, -22, .14, 46); linha(0, 1, 40, .14); linha(0, -22, 40, .14);
  const cc = new THREE.Mesh(new THREE.RingGeometry(5.5, 5.64, 64), lm); cc.rotation.x = -Math.PI / 2; cc.position.set(0, .013, -22); g.add(cc);
  linha(0, -39.5, 20, .14); linha(-10, -42, .14, 5.5); linha(10, -42, .14, 5.5);
  const trave = (x) => { const m = new THREE.MeshStandardMaterial({ color: '#fafafa', roughness: .4 }); const a = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 2.44, 10), m); a.position.set(x, 1.22, -45); a.castShadow = true; g.add(a); return a; };
  trave(-3.66); trave(3.66); const tr = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 7.32, 10), new THREE.MeshStandardMaterial({ color: '#fafafa' })); tr.rotation.z = Math.PI / 2; tr.position.set(0, 2.44, -45); g.add(tr);
  const rede = new THREE.Mesh(new THREE.BoxGeometry(7.32, 2.44, 2), new THREE.MeshBasicMaterial({ color: '#ffffff', wireframe: true, transparent: true, opacity: .25 })); rede.position.set(0, 1.22, -46); g.add(rede);
  const arq = new THREE.Mesh(new THREE.BoxGeometry(60, 9, 8), new THREE.MeshStandardMaterial({ map: TX.torcida, roughness: .9 })); arq.position.set(40, 4.5, -22); arq.rotation.z = -.35; arq.rotation.y = -Math.PI / 2 * 0 ; arq.scale.set(1, 1, 1); g.add(arq);
  const arq2 = new THREE.Mesh(new THREE.PlaneGeometry(70, 10), new THREE.MeshStandardMaterial({ map: TX.torcida, roughness: .9, side: THREE.DoubleSide })); arq2.position.set(-26, 4.2, -22); arq2.rotation.y = Math.PI / 2; arq2.rotation.x = .35; g.add(arq2); g.remove(arq);
  for (const [x, z] of [[-27, 6], [-27, -50], [27, 6], [27, -50]]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(.18, .28, 20, 8), new THREE.MeshStandardMaterial({ color: '#9aa0a6', roughness: .5, metalness: .6 })); t.position.set(x, 10, z); t.castShadow = true; g.add(t); const l = new THREE.Mesh(new THREE.BoxGeometry(4, 1.6, .5), new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#fff6d8', emissiveIntensity: .8 })); l.position.set(x, 20.3, z); l.lookAt(0, 8, -22); g.add(l); }
  const r = rng(12); for (let i = 0; i < 40; i++) { const t = new THREE.Group(); const tr = new THREE.Mesh(new THREE.CylinderGeometry(.25, .35, 3, 6), new THREE.MeshStandardMaterial({ color: '#5a4330' })); tr.position.y = 1.5; t.add(tr); const c = new THREE.Mesh(new THREE.IcosahedronGeometry(2.2 + r() * 1.2, 1), new THREE.MeshStandardMaterial({ color: ['#2f6b2a', '#3a7d32', '#285a24'][i % 3], roughness: .9, flatShading: true })); c.position.y = 4.4; c.castShadow = true; t.add(c); t.position.set(-60 + r() * 120, 0, -70 - r() * 18); g.add(t); }
  const cones = new THREE.InstancedMesh(new THREE.ConeGeometry(.16, .32, 10), new THREE.MeshStandardMaterial({ color: '#ff7a1a', roughness: .6 }), 8);
  for (let i = 0; i < 8; i++) { const m = new THREE.Matrix4().setPosition(-4 + i * 1.2, .16, -4); cones.setMatrixAt(i, m); } cones.castShadow = true; g.add(cones);
  // garotos esperando a avaliação (coletes numerados)
  const cores = ['#ff6b35', '#2ec4b6', '#e71d36', '#ffd23f', '#3a86ff'];
  for (let i = 0; i < 14; i++) {
    const h = humano({ pele: ['#e0ac84', '#8d5a3b', '#c68b63', '#f1c9a5', '#6b4329'][i % 5], camisa: cores[i % 5], calcao: ['#1d2a44', '#111', '#fff'][i % 3], cabelo: ['#15110f', '#4a2c1a', '#8a6a3a', '#15110f'][i % 4], chuteira: true, escala: .95 + (i % 4) * .04 });
    const x = -9 + (i % 7) * 2.9 + (r() - .5), z = -8 - Math.floor(i / 7) * 3 + (r() - .5);
    h.R.position.set(x, 0, z); h.R.rotation.y = Math.PI * (.85 + r() * .3); aplicar(h, { ...poseParado(i), y: -.38, lL: [1.35, 1.4], lR: [1.35, 1.4], lean: .25, aL: [.5, .1, .8], aR: [.5, -.1, .8], pitch: 0 }); h.R.userData.i = i; g.add(h.R); EXTRAS.push(h);
  }
  return g;
}

// ---------- câmera (cortes rápidos) ----------
function tomadas() {
  const D = (a) => A1(a) - A0(a);
  const T = (a, off0, off1, p0, l0, p1, l1, fov0 = 35, fov1 = fov0, trem = 0) => ({ t0: A0(a) + off0, t1: A0(a) + off1, p0: V(...p0), l0: V(...l0), p1: V(...(p1 || p0)), l1: V(...(l1 || l0)), f0: fov0, f1: fov1, trem, anc: false });
  const R = (...x) => ({ ...T(...x), anc: true }); // relativa ao Pedrin: acompanha o personagem
  return [
    R('gancho', 0, 1.5, [1.5, .32, 2.7], [0, .22, .2], [1.2, .4, 2.3], [0, .22, .1], 32),
    R('gancho', 1.5, 3.9, [4.6, 1.3, 1.8], [0, 1.0, -2.0], [4.2, 1.4, 1.4], [0, 1.0, -2.4], 34),
    R('gancho', 3.9, D('gancho'), [.4, 1.38, 2.6], [0, 1.45, 0], [.1, 1.4, 1.95], [0, 1.45, 0], 33),
    R('treino', 0, 1.5, [1.3, 1.15, 3.4], [0, 1.0, 0], [1.0, 1.15, 3.0], [0, 1.0, 0], 36),
    R('treino', 1.5, 2.7, [1.7, 1.1, 2.5], [0, .85, 0], [1.4, 1.1, 2.1], [0, .85, 0], 32),
    R('treino', 2.7, D('treino'), [1.9, 1.3, 3.2], [0, .8, -3.4], [1.5, 1.25, 2.6], [0, .8, -4.2], 38),
    T('celular', 0, 1.35, [-2.05, .62, .1], [-2.4, .42, -.8], [-2.2, .6, -.1], [-2.4, .43, -.8], 30, 28, .006),
    R('celular', 1.35, D('celular'), [.9, 1.5, 1.9], [0, 1.4, 0], [.7, 1.5, 1.6], [0, 1.4, 0], 32),
    R('chamado', 0, 2.4, [.12, 1.52, 1.5], [.1, 1.4, .3], [.14, 1.46, 1.05], [.12, 1.36, .3], 30, 26),
    R('chamado', 2.4, D('chamado'), [.8, .6, 3.2], [0, 1.0, 0], [1.0, 1.3, 2.4], [0, 1.1, 0], 38, 38, .004),
    T('clube', 0, 2.1, [-34, 19, 22], [-6, 0, -14], [-19, 7, 20], [-9, 1, 0], 38, 40),
    R('clube', 2.1, 3.6, [1.0, 1.3, -2.9], [0, 1.3, 0], [.8, 1.35, -2.4], [0, 1.3, 0], 34),
    R('clube', 3.6, D('clube'), [.2, .85, -2.6], [0, 1.9, 0], [.1, .9, -2.3], [0, 2.1, 0], 38, 36),
    R('chuteira', 0, 1.7, [1.0, .3, 1.7], [0, .16, .2], [.8, .28, 1.4], [0, .14, .25], 30),
    R('chuteira', 1.7, D('chuteira'), [2.2, 1.2, 3.4], [0, .9, 0], [2.0, 1.2, 3.0], [0, .9, 0], 38, 36, .008),
    R('treinador', 0, 1.8, [-1.3, 1.62, 1.5], [1.8, 1.55, -.7], [-1.1, 1.6, 1.3], [1.8, 1.55, -.7], 34),
    R('treinador', 1.8, 3.2, [3.4, 1.62, -2.1], [0, 1.55, 0], [3.2, 1.62, -1.8], [0, 1.55, 0], 30),
    R('treinador', 3.2, 5.3, [.7, 1.66, .55], [1.8, 1.68, -.7], [.8, 1.67, .4], [1.8, 1.68, -.7], 28, 25),
    R('treinador', 5.3, D('treinador'), [1.1, 1.55, 1.5], [0, 1.52, 0], [.5, 1.55, .85], [0, 1.52, 0], 34, 26, .004),
    R('pergunta', 0, 4.0, [0, 1.52, 2.25], [0, 1.5, 0], [0, 1.52, 2.0], [0, 1.5, 0], 30, 29),
    R('pergunta', 4.0, 8.6, [.5, 1.45, 2.3], [0, 1.45, 0], [-.5, 1.48, 2.1], [0, 1.45, 0], 31, 30),
    R('pergunta', 8.6, D('pergunta'), [0, 1.5, 2.1], [0, 1.5, 0], [0, 1.52, 1.85], [0, 1.5, 0], 29, 28),
    R('fim', 0, D('fim'), [0, 1.45, 2.8], [0, 1.4, 0], [0, 1.4, 2.4], [0, 1.4, 0], 36, 34),
  ];
}
let CORTES;
function camAplica(t) {
  const c = CORTES.find((x) => t >= x.t0 && t < x.t1) || CORTES[CORTES.length - 1], k = sm(lin(t, c.t0, c.t1));
  camera.position.lerpVectors(c.p0, c.p1, k); const l = new THREE.Vector3().lerpVectors(c.l0, c.l1, k);
  if (c.anc) { const b = PEDRIN.R.position; camera.position.add(b); l.add(b); }
  if (c.trem) { camera.position.x += Math.sin(t * 61) * c.trem; camera.position.y += Math.cos(t * 53) * c.trem; }
  camera.fov = mix(c.f0, c.f1, k); camera.updateProjectionMatrix(); camera.lookAt(l); return c;
}

// ---------- coreografia ----------
function falando(t) { // quem fala agora: 'p' (Pedrin), 't' (treinador) ou null; amplitude de boca
  const f = (id) => [F0(id), F1(id)];
  const noP = ['gancho', 'treino', 'celular', 'chamado', 'clube', 'chuteira', 'pergunta', 'fim'];
  for (const id of noP) { const [a, b] = f(id); if (t >= a && t < b) return 'p'; }
  const [a, b] = f('treinador'); if (t >= a && t < b) { const k = (t - a) / (b - a); return k > 6 / 24 && k < 19 / 24 ? 't' : 'p'; }
  return null;
}
const SOL_A = { c: '#ffb066', i: 3.4, h: '#ffd9b0', hi: .9 }, SOL_B = { c: '#fff2dc', i: 3.8, h: '#cfe6ff', hi: 1.2 };
function coreografia(t) {
  const tc = A0('clube'), emA = t < tc;
  GRUPO_A.visible = emA; GRUPO_B.visible = !emA;
  const L = emA ? SOL_A : SOL_B; sol.color.set(L.c); sol.intensity = L.i; hemi.color.set(L.h); hemi.intensity = L.hi;
  sol.position.set(...(emA ? [7, 5.8, 4.5] : [-14, 17, 12])); sol.target.position.set(...(emA ? [0, 0, -3] : [-10, 0, 0]));
  scene.background = null; SKY_A.visible = emA; SKY_B.visible = !emA; scene.fog.color.set(emA ? '#f2cba0' : '#cfe3f3'); scene.fog.near = emA ? 14 : 60; scene.fog.far = emA ? 60 : 200;
  const p = PEDRIN, tr = TREINADOR; const quem = falando(t), fa = quem && Math.abs(Math.sin(t * 15)) ;
  const mp = quem === 'p' ? fa * .2 : 0, mt = quem === 't' ? fa * .2 : 0;
  BOLA.visible = emA; PEDRIN.R.visible = true; TREINADOR.R.visible = !emA && t >= A0('treinador') - 1.2; CEL.visible = emA && t < A0('chamado') + 4.6; MOCHILA.visible = !emA;
  p.bL.sh.visible = true; const bota = !emA; p.lL.sock.visible = p.lR.sock.visible = bota; [p.lL, p.lR].forEach((l) => { l.bt.visible = bota; l.bt.scale.setScalar(bota ? 1.28 : 1); });
  BOLA.material = BOLA_MEIA.material; SUOR.forEach((s) => (s.visible = false));
  let pose = poseParado(t), pos = [0, 0, .5], ry = Math.PI, ball = [0, .095, .1];
  const U = (id) => t - A0(id);
  if (t < A0('treino')) { // gancho
    const u = U('gancho');
    if (u < 1.5) { pose = poseToque(u); pos = [0, 0, .45]; ry = -.55; const k = Math.sin(u * 3); ball = [.18 + (k > 0 ? .12 * k : 0), .095 + Math.max(0, k) * .25, .18 - Math.max(0, k) * .1]; }
    else if (u < 3.9) { // drible até o gol em câmera lenta no chute
      const v = u - 1.5, lento = v < 1.0 ? v : 1.0 + (v - 1.0) * .45, z = mix(1.2, -6.2, sm(cl(lento / 1.4)));
      const chuta = cl((v - 1.25) / .5); pos = [Math.sin(v * 2.4) * .35, 0, z]; ry = Math.PI; ball = [pos[0] + Math.sin(v * 5) * .08, .095, z - .55];
      if (v < 1.3) { pose = poseCorrer(v * 9.5); const b = Math.abs(Math.sin(v * 9.5)); ball = [pos[0] + Math.sin(v * 5) * .06, .095 + b * .1, z - .6 - (1 - b) * .1]; } else { pose = poseChute(chuta); pose.y += 0; }
      if (v > 1.5) { const q = lin(v, 1.5, 2.3); ball = [mix(pos[0] + .1, 1.0, sm(q)), .095 + Math.sin(q * Math.PI) * .6, mix(z - .55, -9.1, q)]; if (q > .9) CHINELOS[1].rotation.set(0, 0, mix(0, -1.45, lin(q, .9, 1)) * 0 + 0); }
    } else { pose = { ...poseParado(t), sorriso: 1, boca: mp }; pos = [0, 0, 1.0]; ry = .12; ball = [.55, .095, 1.0]; pose.aR = [-.5, -.3, .6]; }
  } else if (t < A0('celular')) { // treino
    const u = U('treino');
    if (u < 1.5) { pose = poseCorrer(u * 10); pos = [Math.sin(u * 2) * .4, 0, mix(-3.5, .6, sm(u / 1.5))]; ry = .1; ball = [pos[0] + .1, .095, pos[2] + .6 * 0 + .5]; }
    else if (u < 2.7) { const v = u - 1.5; pose = poseToque(v * 1.4); pos = [0, 0, .4]; ry = -.35; const k = Math.sin(v * 8.4); ball = [.1, .35 + Math.abs(k) * .8, .35]; }
    else { const v = u - 2.7, c = cl(v / 1.0); pose = poseChute(c); pos = [0, 0, -4]; ry = Math.PI; ball = [pos[0], .095, pos[2] - .5]; if (v > .5) { const q = lin(v, .5, 1.1); ball = [mix(.1, -1.5, q), .095 + Math.sin(q * Math.PI) * .45, mix(-4.5, -9.0, q)]; if (q > .85) CHINELOS[0].rotation.z = .0; } }
  } else if (t < A0('chamado')) { // celular
    const u = U('celular'); pos = u < 1.35 ? [2.2, 0, 2.6] : [-2.4, 0, -.2]; ry = 0; pose = poseParado(t, 1); ball = [.2, .095, 1.5];
    if (u > 1.35) { pose.aR = [-1.25, -.15, 1.6]; pose.hx = .2; }
  } else if (t < A0('clube')) { // chamado
    const u = U('chamado'); pos = [-2.4, 0, -.2]; ry = 0; pose = poseParado(t, 1); pose.aR = [-1.25, -.15, 1.6]; pose.hx = .2; ball = [.2, .095, 1.5];
    if (u > 2.4) { const v = u - 2.4, k = cl(v / .6); pos = [0, 0, .6]; ry = 0; pose = poseComemora(t, 1); pose.boca = mp; pose.y += Math.max(0, Math.sin(v * 7)) * .1 * k; ball = [.7, .095, .7]; }
  } else { // clube: Pedrin de chuteira emprestada
    const u = (id) => U(id);
    if (t < A0('chuteira')) { const v = u('clube'); const ph = v * 5.2; pos = [-10 - Math.min(0, 0), 0, mix(12.5, 2.2, sm(cl(v / 3.6)))]; ry = Math.PI; pose = v < 3.6 ? poseAndar(ph, .45, .04, .35) : poseParado(t); if (v >= 2.1) { pose.hx = -.35; } if (v >= 3.6) { pose.hx = -.4; pose.aL = [.1, .1, .1]; } }
    else if (t < A0('treinador')) { const v = u('chuteira'); pos = [-10, 0, 2.2]; ry = 0; pose = poseParado(t); if (v < 1.7) { pose.lR = [-.5, .9]; pose.lean = .2; pose.hx = .45; } else { const w = v - 1.7; pose = { ...poseAndar(w * 5, .35, .15, .3), pitch: Math.sin(w * 5) * .0 }; pose.lean = .15 + Math.sin(Math.min(w, 1.2) * 3) * .3; pose.aL = [-1.6 * Math.sin(w * 4), .8, .5]; pose.aR = [-1.6 * Math.sin(w * 4 + 2), -.8, .5]; pose.pitch = -.18 * Math.sin(Math.min(w * 3, Math.PI)); pos = [-10 + w * .35, 0, 2.2 - w * .1]; pose.hx = .25; } }
    else if (t < A0('pergunta')) { const v = u('treinador'); pos = [-10, 0, 2.0]; ry = 1.94; pose = poseParado(t); pose.boca = mp; if (v > 14 / 24 * (A1('treinador') - A0('treinador'))) { pose.hx = .12; pose.aL = [-.2, .15, .3]; pose.aR = [-.2, -.15, .3]; pose.y = -Math.abs(Math.sin(t * 9)) * .004; SUOR.forEach((s, i) => { s.visible = true; }); } }
    else { pos = [-10, 0, 2.0]; ry = 0; pose = poseParado(t); pose.boca = mp; const v = u('pergunta'); pose.sorriso = 1; pose.aL = [-.5 + Math.sin(t * 2.2) * .3, .3, 1.0]; pose.aR = [-.5 + Math.sin(t * 2.2 + 1) * .3, -.3, 1.0]; if (t >= A0('fim')) { pose.aR = [-2.7, -.3, .3 + Math.sin(t * 9) * .25]; pose.aL = [.1, .1, .1]; } }
  }
  p.R.position.set(...pos); p.R.rotation.y = ry; aplicar(p, { ...pose, boca: (pose.boca ?? mp), sorriso: pose.sorriso });
  BOLA.position.set(...ball); BOLA.rotation.x = t * 3; BOLA.rotation.z = t * 2;
  // mochila
  const mb = new THREE.Vector3(); MOCHILA.position.set(pos[0], .97, pos[2]); MOCHILA.rotation.y = ry; MOCHILA.position.add(new THREE.Vector3(0, 0, 0)); MOCHILA.position.add(V(Math.sin(ry), 0, Math.cos(ry)).multiplyScalar(-.17));
  // treinador
  if (!emA) { const v = t - A0('treinador'), k = sm(lin(v, -1.2, .1));
    tr.R.position.set(mix(-4.6, -8.2, k), 0, mix(3.4, 1.3, k)); tr.R.rotation.y = v < .1 ? mix(-1.9, -1.2, k) : -1.2;
    const gesto = quem === 't' ? Math.sin(t * 3.1) * .25 : 0, anda = v < .1 ? poseAndar(t * 5, .4, .05, .4) : poseParado(t + 3);
    aplicar(tr, { ...anda, boca: mt, aL: v < .1 ? anda.aL : [-.8 + gesto, .2, 1.3], aR: v < .1 ? anda.aR : [-1.0, -.3, 1.4 + gesto], hy: quem === 't' ? Math.sin(t * 1.3) * .12 : 0 }); }
  // gotas de suor
  SUOR.forEach((s, i) => { const v = (t * .9 + i * .33) % 1; s.position.set(pos[0] + Math.sin(ry) * .11 + Math.cos(ry) * (i - 1) * .12, 1.72 - v * .3, pos[2] + Math.cos(ry) * .11 - Math.sin(ry) * (i - 1) * .12); s.scale.setScalar(1 - v * .4); });
  // celular no chão (vibra) ou na mão
  if (emA) { const lying = t < A0('celular') + 1.35;
    if (lying) { CEL.position.set(-2.4, .465, -.8); CEL.rotation.set(-Math.PI / 2 + .1, 0, Math.sin(t * 90) * (t >= A0('celular') ? .03 : 0)); }
    else { CEL.position.set(pos[0] + .2, 1.3, pos[2] + .32); CEL.rotation.set(-.15, 0, 0); } }
  telaCelular(t);
}

// ---------- legenda e telas ----------
let LEG = [], TXTCTX;
function legendas() {
  LEG = [];
  for (const a of TEMPO.atos) {
    if (!a.fala) continue; const ws = a.fala.texto.split(/\s+/), pesos = ws.map((w) => w.replace(/[^\wÀ-ú]/g, '').length + 2 + (/[.,:?!…]$/.test(w) ? 3 : 0)), tot = pesos.reduce((x, y) => x + y, 0); let acc = 0;
    const pal = ws.map((w, i) => { const t0 = a.fala.t0 + (a.fala.t1 - a.fala.t0) * acc / tot; acc += pesos[i]; return { w, t0, t1: a.fala.t0 + (a.fala.t1 - a.fala.t0) * acc / tot }; });
    let b = []; const fecha = () => { if (b.length) LEG.push(b); b = []; };
    pal.forEach((p) => { const s = b.map((x) => x.w).join(' '); if (b.length >= 3 || (s + ' ' + p.w).length > 17) fecha(); b.push(p); if (/[.,:?!…]$/.test(p.w)) fecha(); }); fecha();
  }
}
function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function legenda(t) {
  const b = LEG.find((x) => t >= x[0].t0 - .05 && t < x[x.length - 1].t1 + .25); if (!b) return; const g = ctx; g.save(); g.font = '900 72px Inter'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  const esp = g.measureText(' ').width + 14, ws = b.map((p) => g.measureText(p.w.toUpperCase()).width), tot = ws.reduce((a, c) => a + c, 0) + esp * (ws.length - 1); let x = W / 2 - tot / 2; const y = 1480;
  g.globalAlpha = sm(lin(t, b[0].t0 - .05, b[0].t0 + .1));
  b.forEach((p, i) => { const ativo = t >= p.t0 && t < p.t1 + .05, pop = ativo ? 1 + .09 * (1 - lin(t, p.t0, p.t0 + .15)) : 1; g.save(); g.translate(x + ws[i] / 2, y); g.scale(pop, pop); g.strokeStyle = 'rgba(0,0,0,.92)'; g.lineWidth = 16; g.strokeText(p.w.toUpperCase(), -ws[i] / 2, 0); g.fillStyle = ativo ? '#ffd23a' : '#fff'; g.fillText(p.w.toUpperCase(), -ws[i] / 2, 0); g.restore(); x += ws[i] + esp; });
  g.restore();
}
function titulo(t) {
  const k = lin(t, .05, .35) * (1 - lin(t, 2.3, 2.8)); if (k <= 0) return; const g = ctx; g.save(); g.globalAlpha = sm(k); g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 24;
  g.translate(W / 2, 560); const s = 1 + (1 - sm(lin(t, .05, .6))) * .3; g.scale(s, s);
  g.font = '800 34px Inter'; g.fillStyle = '#ffd23a'; g.fillText('E P I S Ó D I O   1', 0, -118); g.font = '900 188px Inter'; g.fillStyle = '#fff'; g.fillText('PEDRIN', 0, 0); g.font = '800 46px Inter'; g.fillStyle = '#ffd23a'; g.fillText('O COMEÇO DE UM SONHO', 0, 112); g.restore();
}
function lowerThird(t) {
  const a = A0('chamado') + 2.3, b = A0('chuteira') - .6; const k = lin(t, a, a + .4) * (1 - lin(t, A0('clube') - .3, A0('clube') + .1)) + lin(t, A0('clube') + .3, A0('clube') + .7) * (1 - lin(t, b, b + .4)); if (k <= 0) return; const g = ctx; g.save(); g.globalAlpha = Math.min(1, k); g.translate(0, (1 - Math.min(1, k)) * 40);
  rr(g, 60, 360, 640, 118, 22); g.fillStyle = 'rgba(10,14,22,.78)'; g.fill(); rr(g, 60, 360, 12, 118, 6); g.fillStyle = '#ffd23a'; g.fill();
  g.fillStyle = '#ffd23a'; g.font = '800 28px Inter'; g.fillText('AVALIAÇÃO · AURORA FC', 96, 398); g.fillStyle = '#fff'; g.font = '900 44px Inter'; g.fillText('SÁBADO · 8H DA MANHÃ', 96, 446); g.restore();
}
function quadroTatico(t) {
  const a = F0('pergunta') + (F1('pergunta') - F0('pergunta')) * .38, k = lin(t, a, a + .5) * (1 - lin(t, A0('fim') - .2, A0('fim') + .2)); if (k <= 0) return; const g = ctx; g.save(); g.globalAlpha = sm(k); g.translate(540, 520); const s = eob(Math.min(1, k)); g.scale(s, s);
  rr(g, -420, -250, 840, 520, 34); g.fillStyle = 'rgba(8,16,12,.86)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 3; g.stroke();
  g.textAlign = 'center'; g.fillStyle = '#ffd23a'; g.font = '900 38px Inter'; g.fillText('EM QUAL POSIÇÃO O PEDRIN JOGA?', 0, -205);
  // campo visto de cima (ataque para o topo)
  g.fillStyle = '#2f7d32'; rr(g, -330, -160, 300, 400, 12); g.fill(); g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 3; g.strokeRect(-318, -150, 276, 380); g.beginPath(); g.moveTo(-318, 40); g.lineTo(-42, 40); g.stroke(); g.beginPath(); g.arc(-180, 40, 40, 0, 7); g.stroke(); g.strokeRect(-250, -150, 140, 56);
  const t1 = F0('pergunta') + (F1('pergunta') - F0('pergunta')) * .52, t2 = F0('pergunta') + (F1('pergunta') - F0('pergunta')) * .62, t3 = F0('pergunta') + (F1('pergunta') - F0('pergunta')) * .7;
  const zona = (i, x, y, tt) => { const on = t >= tt && t < tt + 1.4; g.save(); g.globalAlpha = on ? .85 : .4; g.fillStyle = ['#e63946', '#3a86ff', '#ffd23a'][i]; g.beginPath(); g.arc(x, y, 38, 0, 7); g.fill(); g.restore(); g.fillStyle = '#fff'; g.font = '900 40px Inter'; g.fillText(String(i + 1), x, y + 14); };
  zona(0, -66, -70, t1); zona(1, -294, -70, t2); zona(2, -180, -112, t3);
  const op = [['1', 'PONTA DIREITA', '#e63946', t1], ['2', 'PONTA ESQUERDA', '#3a86ff', t2], ['3', 'CENTROAVANTE', '#ffd23a', t3]];
  op.forEach(([n, nome, cor, tt], i) => { const on = t >= tt && t < tt + 1.4, y = -120 + i * 120; g.save(); g.translate(150, y); const p = on ? 1.06 : 1; g.scale(p, p); rr(g, -150, -42, 300, 84, 22); g.fillStyle = on ? cor : 'rgba(255,255,255,.1)'; g.fill(); g.strokeStyle = cor; g.lineWidth = 4; g.stroke(); g.fillStyle = on && i === 2 ? '#111' : '#fff'; g.font = '900 30px Inter'; g.textAlign = 'center'; g.fillText(`${n} · ${nome}`, 0, 11); g.restore(); });
  g.restore();
  const kc = lin(t, a + 1.5, a + 2.0) * (1 - lin(t, A0('fim') - .2, A0('fim') + .2)); if (kc > 0) { g.save(); g.globalAlpha = kc; g.textAlign = 'center'; g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 16; g.font = '900 58px Inter'; g.fillStyle = '#fff'; g.fillText('COMENTA 1, 2 OU 3', 540, 880); g.font = '800 38px Inter'; g.fillStyle = '#ffd23a'; g.fillText('A DECISÃO É SUA!', 540, 940); g.restore(); }
}
function fimCartao(t) {
  const k = lin(t, A0('fim') + .15, A0('fim') + .5); if (k <= 0) return; const g = ctx; g.save(); g.translate(540, 760); const pu = 1 + .04 * Math.sin(t * 8), sc = eob(k) * pu; g.scale(sc, sc);
  rr(g, -390, -34, 780, 108, 54); g.fillStyle = '#8a1f3a'; g.fill(); rr(g, -390, -46, 780, 108, 54); g.fillStyle = '#ff3b6b'; g.fill(); g.strokeStyle = '#2b0d16'; g.lineWidth = 6; g.stroke();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(-318, 8, 34, 0, 7); g.fill(); g.fillStyle = '#ff3b6b'; g.font = '900 54px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('+', -318, 10);
  g.fillStyle = '#fff'; g.font = '900 52px Inter'; g.fillText('SEGUE O PERFIL', 30, -8); g.fillStyle = '#ffe3ea'; g.font = '700 30px Inter'; g.fillText('@fora_do_roteiroai', 30, 34); g.restore();
}
function postFx(t) {
  const g = ctx; const grad = g.createRadialGradient(W / 2, H * .45, H * .3, W / 2, H * .45, H * .75); grad.addColorStop(0, 'rgba(0,0,0,0)'); grad.addColorStop(1, 'rgba(0,0,0,.42)'); g.fillStyle = grad; g.fillRect(0, 0, W, H);
  for (const c of CORTES) { const d = Math.abs(t - c.t0); if (d < .08 && c.t0 > 0.2) { g.fillStyle = `rgba(255,255,255,${.35 * (1 - d / .08)})`; g.fillRect(0, 0, W, H); } }
  g.save(); g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; const ox = Math.floor(Math.random() * 256), oy = Math.floor(Math.random() * 256); g.translate(-ox, -oy); g.fillStyle = g.createPattern(GRAO.image, "repeat"); g.fillRect(0, 0, W + 256, H + 256); g.restore();
}
let GRAO, SKY_A, SKY_B;

window.eventos = () => EV;
window.iniciar = async (tempo) => {
  TEMPO = tempo; for (const a of tempo.atos) ATO[a.cena] = a;
  await document.fonts.load('900 40px Inter'); await document.fonts.load('800 40px Inter'); await document.fonts.load('700 40px Inter');
  out = document.getElementById('c'); ctx = out.getContext('2d');
  renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  scene = new THREE.Scene(); scene.fog = new THREE.Fog(0xffffff, 20, 90); const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .35;
  camera = new THREE.PerspectiveCamera(35, W / H, .05, 600);
  hemi = new THREE.HemisphereLight(0xffffff, 0x6b5a45, 1); scene.add(hemi);
  sol = new THREE.DirectionalLight(0xffffff, 3); sol.castShadow = true; scene.add(sol, sol.target); sol.shadow.mapSize.set(2048, 2048); const sc = sol.shadow.camera; sc.left = -14; sc.right = 14; sc.top = 14; sc.bottom = -14; sc.near = 1; sc.far = 80; sol.shadow.bias = -.0004; sol.shadow.normalBias = .03;
  texturas(); GRAO = ctex(256, 256, (g, w, h, r) => { const id = g.createImageData(w, h); for (let i = 0; i < id.data.length; i += 4) { const v = 128 + (r() - .5) * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } g.putImageData(id, 0, 0); }, false);
  const dome = (tx) => { const m = new THREE.Mesh(new THREE.SphereGeometry(300, 24, 16), new THREE.MeshBasicMaterial({ map: tx, side: THREE.BackSide, fog: false })); scene.add(m); return m; }; SKY_A = dome(TX.ceuA); SKY_B = dome(TX.ceuB);
  GRUPO_A = cenaA(); GRUPO_B = cenaB(); scene.add(GRUPO_A, GRUPO_B);
  PEDRIN = humano({ pele: '#a8704a', camisa: '#f2c100', calcao: '#1f4fa8', cabelo: '#15110f', colarinho: '#1f4fa8', chuteira: true }); scene.add(PEDRIN.R);
  TREINADOR = humano({ pele: '#d9a47a', camisa: '#1d3557', jaqueta: '#1d3557', mangaLonga: '#1d3557', calca: '#22303f', cabelo: '#9a9a9a', careca: true, oculos: true, escala: 1.04, chuteira: true, colarinho: '#e63946' }); scene.add(TREINADOR.R);
  const prancheta = new THREE.Mesh(new THREE.BoxGeometry(.22, .3, .015), new THREE.MeshStandardMaterial({ color: '#d9c9a3', roughness: .8 })); prancheta.position.set(0, -.3, .05); prancheta.rotation.x = -.2; TREINADOR.bL.co.add(prancheta);
  BOLA_MEIA = bolaMesh('meia'); BOLA = bolaMesh('meia'); scene.add(BOLA); CEL = celular(); scene.add(CEL);
  MOCHILA = new THREE.Mesh(new RoundedBoxGeometry(.3, .38, .16, 3, .04), new THREE.MeshStandardMaterial({ color: '#2a5d9f', roughness: .8 })); MOCHILA.castShadow = true; scene.add(MOCHILA);
  for (let i = 0; i < 3; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(.014, 8, 6), new THREE.MeshStandardMaterial({ color: '#cfe8ff', roughness: .1, transparent: true, opacity: .85 })); s.scale.set(1, 1.5, 1); scene.add(s); SUOR.push(s); }
  legendas(); CORTES = tomadas();
  const bolaT = A0('gancho') + 1.5 + 1.25 + .6;
  EV = { chute: [A0('gancho') + 1.5 + 1.25 + .15, A0('treino') + 2.7 + .5], toque: [0.4, 0.85, 1.3, A0('treino') + 1.7, A0('treino') + 2.1, A0('treino') + 2.5], gol: [A0('gancho') + 1.5 + 2.3, A0('treino') + 3.6], celular: [A0('celular'), A0('celular') + .3, A0('celular') + .6, A0('celular') + .9], msg: [A0('chamado') + .1, A0('chamado') + 2.0], vibra: [A0('celular') + 1.3], pulo: [A0('chamado') + 2.5, A0('chamado') + 3.0, A0('chamado') + 3.5], torcida: [A0('clube') + 1.0], whoosh: CORTES.map((c) => c.t0).filter((x) => x > .3), tropeco: [A0('chuteira') + 3.0], apito: [A0('treinador') + .2], coracao: [A0('treinador') + (A1('treinador') - A0('treinador')) * .72, A1('treinador')], seguir: [A0('fim') + .15], fim: [TEMPO.total - 2.2], tatica: [F0('pergunta') + (F1('pergunta') - F0('pergunta')) * .38], secoes: { clube: A0('clube'), treinador: A0('treinador'), pergunta: A0('pergunta') } };
  window.PRONTO = true;
};
window.quadro = (t) => {
  coreografia(t); camAplica(t); renderer.render(scene, camera);
  ctx.drawImage(renderer.domElement, 0, 0, W, H); postFx(t); titulo(t); lowerThird(t); quadroTatico(t); fimCartao(t); legenda(t);
};
window.info = () => ({ calls: renderer.info.render.calls, tris: renderer.info.render.triangles });
