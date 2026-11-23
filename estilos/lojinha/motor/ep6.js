// Episódio 6: Você abriu a loja online (usa lib.js). Votação do ep. 5: loja online 3 × 0.
// Caixa 526 → site R$ 100 + 30 chaveiros R$ 150 → 276. 1º pedido R$ 12 − 5 − 10 (frete) = −3. Preço R$ 22 com frete: +7 por pedido.
// Semana: 25 pedidos, vendeu R$ 540, gastou R$ 475, lucro R$ 65; caixa R$ 566. Gancho: anúncio de R$ 200 ou vídeos de graça.

const PEGS = []; for (let r = 0; r < 2; r++) for (let i = 0; i < 5; i++) PEGS.push([598 + i * 62, 640 + r * 150]);
let VISOR = () => "0,00";
let EV_SINO = () => 0;

function montarEp() {
  const g = F("gancho"), si = F("silencio"), id = F("ideia"), pe = F("pedido"), fr = F("frete"), co = F("conserto"), se = F("semana"), fi = F("final"), fm = F("fim");
  HUD = {
    din: contador([[0, 526], [g + 1.2, 426], [g + 2.2, 276], [pe + 1.2, 288], [fr + 1.5, 278], [se + 1.0, 566]], 526),
    est: contador([[0, 0], [g + 2.2, 30], [pe + 1.2, 29], [se + 1.0, 5]], 0),
    ven: contador([[0, 0], [id + 1.6, 12], [id + 2.0, 37], [id + 2.4, 64], [id + 2.8, 118], [se + .8, 380]], 0),
    luc: contador([[0, 0], [pe + 1.2, 1], [se + 1.0, 25]], 0),
    chips: [[g + 1.2, 0, "−R$ 100", "#e3342f"], [g + 2.2, 0, "−R$ 150", "#e3342f"], [g + 2.2, 1, "+30", "#f0a020"], [pe + 1.2, 0, "+R$ 12", "#38c172"], [fr + 1.5, 0, "−R$ 10", "#e3342f"], [se + 1.0, 0, "+R$ 288", "#38c172"], [se + 1.0, 3, "+24", "#38c172"]],
    rot: ["DINHEIRO", "ESTOQUE", "VISITAS", "PEDIDOS"], moeda: [true, false, false, false], pulso: se + 1.0, dia: { txt: "ONLINE", fim: fi - .6 },
  };
  EV = {
    sino: [], caixa: [pe + 1.2, se + 1.0], cedulas: [],
    clique: [g + .3, g + .45, g + .6, g + .75, palavra("final", "anúncio")?.t0 ?? fi + 2, palavra("final", "vídeos")?.t0 ?? fi + 3.5],
    pop: [id + 1.6, id + 2.0, id + 2.4, id + 2.8], carimbo: [g + 2.0, id + 1.0, fr + 2.4, co + 1.8, se + 1.6],
    placa: [], grilos: [si + .3, id - .1], feno: [si + 1.0],
    whoosh: [g + .1, si - .1, id - .1, pe - .1, fr - .1, co - .1, se - .1, fi - .1, fm - .1],
    festa: [se + .2], pulo: [se + .3, se + 1.0], brilho: [id + .3], multidao: [], trombone: [si + 2.6, fr + 2.5], alarme: [],
    tiquetaque: [fi + .2, TEMPO.total - 2.4], fim: [TEMPO.total - 2.4], tranco: [fr + 2.4, pe + 1.2],
    secoes: { neg: .2, ven: pe, son: fi + .1, quieto: [[si, id + .3]], festas: [[se + .1, 1.0]] },
  };
  EV_SINO = () => 0;
}
window.eventos = () => EV;

function cameraEp(t) {
  const g = F("gancho"), si = F("silencio"), id = F("ideia"), pe = F("pedido"), co = F("conserto"), se = F("semana"), fi = F("final");
  const ch = [[0, 1.5, 900, 1200], [g + 3.0, 1.4, 900, 1220], [si, 1.3, 860, 1240], [id + .3, 1.6, 930, 1180], [pe, 1.4, 900, 1230], [co, 1.3, 860, 1240], [se, 1.2, 800, 1200], [fi + .2, 1.0, 540, 1000]];
  let i = 0; while (i < ch.length - 1 && ch[i + 1][0] <= t) i++;
  const a = ch[i], b = ch[Math.min(i + 1, ch.length - 1)]; const k = b === a ? 0 : ease(lin(t, a[0], b[0]));
  let z = lerp(a[1], b[1], k), x = lerp(a[2], b[2], k), y = lerp(a[3], b[3], k);
  z *= 1 + Math.sin(t * .7) * .006; x += Math.sin(t * .5) * 4; y += Math.cos(t * .43) * 3;
  const mx = W / (2 * z), my = H / (2 * z); x = cl(x, mx, W - mx); y = cl(y, my, H - my);
  let sh = 0; for (const q of EV.tranco) sh += Math.max(0, 1 - (t - q) / .3) * (t >= q ? 1 : 0);
  return { z, x: x + Math.sin(t * 90) * 10 * sh, y: y + Math.cos(t * 77) * 8 * sh };
}
function notebook(x, y, s = 1) { // notebook em cima do balcão
  const c = ctx; c.save(); c.translate(x, y); c.scale(s, s);
  forma(P.rr(-70, -86, 140, 90, 8), "#2b3340", 5); c.fillStyle = "#7fd0ff"; c.fillRect(-60, -78, 120, 74);
  c.fillStyle = "#fff"; c.fillRect(-52, -70, 104, 10); for (let i = 0; i < 3; i++) { c.fillStyle = ["#ffcf3a", "#ff6fa8", "#7be36b"][i]; c.fillRect(-52 + i * 36, -52, 30, 30); }
  forma(P.rr(-84, 0, 168, 14, 6), "#8c8f96", 5); c.restore();
}
function celular(x, y, ang, grava) {
  const c = ctx; c.save(); c.translate(x, y); c.rotate(ang); forma(P.rr(-26, -46, 52, 92, 9), "#1b1f26", 5); c.fillStyle = "#7fd0ff"; c.fillRect(-20, -38, 40, 70);
  if (grava) { if (Math.floor(T * 2) % 2 === 0) { c.fillStyle = "#e3342f"; c.beginPath(); c.arc(-12, -28, 5, 0, 7); c.fill(); } chaveiroPremium(0, -26, 1, 0, .4); }
  c.restore();
}
function interiorEp(t) {
  const c = ctx, g = F("gancho"), si = F("silencio"), id = F("ideia"), pe = F("pedido"), fr = F("frete"), co = F("conserto"), se = F("semana"), fi = F("final");
  ruaJanela(t); c.drawImage(FUNDO, 0, 0);
  porta(t, 0, 1); relogio(t, 7 * ease(lin(t, si, id))); lampada(t, 1); planta(t, 1);
  teia(t, ease(lin(t, si + .3, si + 1.3)) * (1 - ease(lin(t, id, id + .5))));
  feno(t, si + 1.0, si + 3.0);
  const digita = t > g + .2 && t < g + 2.0, festa = t > se && t < se + 2.6, filma = t > id + .4 && t < id + 2.2;
  const eh = t < g + 1.8 ? (digita ? "determinado" : "feliz") : t < si + .2 ? "euforico" : t < id ? "preocupado" : t < id + .3 ? "pensativo" : t < pe ? "euforico" : t < pe + 1.4 ? "surpreso" : t < fr + 1.6 ? "euforico" : t < fr + 4 ? "preocupado" : t < co + 1.6 ? "pensativo" : t < se ? "euforico" : festa ? "euforico" : "pensativo";
  const pu = festa ? Math.abs(Math.sin((t - se) * 5.5)) * 110 : (t > pe + 1.1 && t < pe + 2.0) ? Math.abs(Math.sin((t - pe - 1.1) * 7)) * 80 : 0;
  const mp = figura(EU, { x: 975, y: 1300, dir: -1, expr: eh, pulo: pu, bE: digita ? 1.0 + Math.sin(t * 16) * .35 : filma ? 2.3 : festa ? 2.7 : .2, bD: digita ? 1.0 + Math.cos(t * 16) * .35 : festa ? 2.7 : .2, olhar: [-1, 0] });
  if (filma) celular(mp.e.x - 6, mp.e.y - 40, .2, true);
  lampadaIdeia(975, 790, lin(t, id + .2, id + .5) * (1 - lin(t, id + 1.5, id + 1.8)));
  balcao(); notebook(1075, 1110, .8); caixaRegistradora(t, 0);
  balao(900, 790, "...", lin(t, si + 2.0, si + 2.2) * (1 - lin(t, si + 3.4, si + 3.6)), { tam: 44, rabo: [1, 1] });
  balao(900, 790, "Primeiro pedido!", lin(t, pe + 1.4, pe + 1.7) * (1 - lin(t, pe + 2.9, pe + 3.1)), { tam: 38, rabo: [1, 1] });
  balao(900, 790, "Esqueci o frete!", lin(t, fr + .2, fr + .5) * (1 - lin(t, fr + 1.4, fr + 1.6)), { tam: 38, rabo: [1, 1] });
  balao(900, 790, "Agora sim!", lin(t, co + 2.9, co + 3.2) * (1 - lin(t, co + 4.0, co + 4.2)), { tam: 40, rabo: [1, 1] });
  confete(t, se + .2, 2);
}
function telaLoja(t) { // o site da loja, em tela cheia no alto
  const g = F("gancho"), si = F("silencio"), id = F("ideia"), pe = F("pedido"), fr = F("frete"), co = F("conserto"), se = F("semana");
  const k = lin(t, g + .35, g + .7) * (1 - lin(t, fr - .05, fr + .2)); if (k <= 0) return;
  const c = ctx, vis = HUD.ven(t).v, preco = "R$ 12"; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.translate(450, 570); const s = eob(Math.min(1, k)); c.scale(s, s);
  const w = 760, h = 470; forma(P.rr(-w / 2, -h / 2 + 12, w, h, 26), "#1e2a4a", 6); forma(P.rr(-w / 2, -h / 2, w, h, 26), "#f4f1ea", 6);
  c.fillStyle = "#d9d4c7"; c.save(); c.beginPath(); c.roundRect(-w / 2 + 3, -h / 2 + 3, w - 6, 58, [22, 22, 0, 0]); c.clip(); c.fillRect(-w / 2, -h / 2, w, 62); c.restore();
  for (let i = 0; i < 3; i++) { c.fillStyle = ["#ff5f57", "#febc2e", "#28c840"][i]; c.beginPath(); c.arc(-w / 2 + 34 + i * 28, -h / 2 + 32, 9, 0, 7); c.fill(); }
  forma(P.rr(-190, -h / 2 + 12, 520, 38, 19), "#fff", 3); texto("minhalojinha.com.br", 70, -h / 2 + 32, { tam: 24, fonte: "Fredoka", peso: 700, cor: "#555", borda: null });
  const prog = lin(t, g + .6, g + 2.0);
  if (prog < 1) { texto("PUBLICANDO O SITE...", 0, -40, { tam: 54, cor: OL, borda: null }); forma(P.rr(-300, 20, 600, 46, 23), "#e0dccf", 5); forma(P.rr(-300, 20, Math.max(20, 600 * prog), 46, 23), "#38c172", 4); }
  else {
    forma(P.rr(-w / 2 + 24, -h / 2 + 80, w - 48, 70, 14), "#ff5a5f", 5); texto("MINHA LOJINHA", -80, -h / 2 + 116, { tam: 46, cor: "#fff", lw: 8 });
    const ng = eob(lin(t, g + 2.0, g + 2.3)); if (ng > 0) { c.save(); c.translate(w / 2 - 170, -h / 2 + 116); c.scale(ng, ng); forma(P.rr(-110, -26, 220, 52, 26), "#38c172", 4); texto("NO AR!", 0, 3, { tam: 36, cor: "#fff", lw: 6 }); c.restore(); }
    for (let i = 0; i < 6; i++) { const x = -w / 2 + 130 + (i % 3) * 170, y = -10 + Math.floor(i / 3) * 140; chaveiroPremium(x, y - 50, i, 0, .8); texto(t > co + 1.7 && t > co ? "R$ 22" : preco, x, y + 78, { tam: 28, cor: t > co + 1.7 ? "#e3342f" : OL, borda: null }); }
    forma(P.rr(w / 2 - 205, -h / 2 + 170, 180, 214, 18), "#fff3d1", 5);
    texto("VISITAS", w / 2 - 115, -h / 2 + 206, { tam: 26, fonte: "Fredoka", peso: 700, cor: "#8a6a1f", borda: null }); texto(String(vis), w / 2 - 115, -h / 2 + 276, { tam: vis > 99 ? 76 : 96, cor: vis === 0 ? "#e3342f" : "#2f8f3f", borda: null });
    const sp = lin(t, id + 1.6, id + 3.0); if (sp > 0 && sp < 1.4 || (t > id + 1.6 && t < pe)) texto("▲", w / 2 - 115, -h / 2 + 340, { tam: 40, cor: "#38c172", borda: null });
  }
  // notificação de pedido
  const kn = lin(t, pe + .9, pe + 1.2) * (1 - lin(t, pe + 2.6, pe + 2.9));
  if (kn > 0) { c.save(); c.translate(0, -h / 2 - 20 + eob(kn) * 60); forma(P.rr(-280, -34, 560, 84, 24), "#38c172", 6); forma(P.el(-236, 8, 24, 24), "#fff", 4); texto("!", -236, 10, { tam: 36, cor: "#38c172", borda: null }); texto("NOVO PEDIDO! R$ 12", 30, 8, { tam: 40, cor: "#fff", lw: 7 }); c.restore(); }
  c.restore();
}
function cartaoFrete(t) {
  const fr = F("frete"), co = F("conserto"), k = lin(t, fr + .2, fr + .5) * (1 - lin(t, co - .25, co + .0)); if (k <= 0) return;
  cartao(450, 570, 720, 560, k, (c, w, h) => {
    texto("PRIMEIRO PEDIDO", 0, -h / 2 + 46, { tam: 40, cor: "#ff5a5f", borda: null });
    const L = [["VENDA", "+R$ 12", "#2f8f3f", fr + .5], ["CHAVEIRO", "−R$ 5", OL, fr + 1.2], ["FRETE", "−R$ 10", "#e3342f", fr + 1.9]];
    L.forEach(([a, b, cor, ta], i) => { const e = eob(lin(t, ta, ta + .3)); c.save(); c.globalAlpha = Math.min(1, e); texto(a, -w / 2 + 70, -120 + i * 76, { tam: 50, cor: OL, borda: null, al: "left" }); texto(b, w / 2 - 70, -120 + i * 76, { tam: 56, cor, borda: null, al: "right" }); c.restore(); });
    c.fillStyle = "rgba(43,26,16,.25)"; c.fillRect(-w / 2 + 60, 110, w - 120, 5);
    const e = eob(lin(t, fr + 2.5, fr + 2.9)); c.save(); c.translate(0, 190); c.scale(Math.max(.001, e), Math.max(.001, e)); forma(P.rr(-300, -50, 600, 100, 50), "#e3342f", 5); texto("PREJUÍZO: R$ 3", 0, 4, { tam: 62, cor: "#fff", lw: 9 }); c.restore();
  });
}
function cartaoPreco(t) {
  const co = F("conserto"), se = F("semana"), k = lin(t, co + .2, co + .5) * (1 - lin(t, se - .25, se)); if (k <= 0) return;
  cartao(450, 570, 720, 560, k, (c, w, h) => {
    texto("NOVO PREÇO", 0, -h / 2 + 46, { tam: 42, cor: "#ff5a5f", borda: null });
    const a = eob(lin(t, co + .5, co + .8)), b = eob(lin(t, co + 1.5, co + 1.9)), d = eob(lin(t, co + 3.0, co + 3.4));
    c.save(); c.globalAlpha = Math.min(1, a); texto("R$ 12", -150, -80, { tam: 96, cor: "#999", borda: null }); c.lineWidth = 10; c.strokeStyle = "#e3342f"; c.beginPath(); c.moveTo(-250, -50); c.lineTo(-50, -110); c.stroke(); c.restore();
    c.save(); c.translate(130, -80); c.scale(Math.max(.001, b), Math.max(.001, b)); texto("R$ 22", 0, 0, { tam: 110, cor: "#2f8f3f", borda: null }); c.restore();
    c.save(); c.globalAlpha = Math.min(1, b); forma(P.rr(-150, -10, 300, 54, 27), "#ffd23f", 4); texto("FRETE INCLUSO", 0, 3, { tam: 32, cor: OL, borda: null }); c.restore();
    c.save(); c.translate(0, 150); c.scale(Math.max(.001, d), Math.max(.001, d)); texto("22 − 5 − 10", 0, -52, { tam: 46, cor: OL, borda: null }); forma(P.rr(-290, -16, 580, 90, 45), "#38c172", 5); texto("= +R$ 7 POR PEDIDO", 0, 29, { tam: 52, cor: "#fff", lw: 8 }); c.restore();
  });
}
function cartaoSemana(t) {
  const se = F("semana"), fi = F("final"), k = lin(t, se + .2, se + .5) * (1 - lin(t, fi - .4, fi - .1)); if (k <= 0) return;
  const tL = palavra("semana", "lucro")?.t0 ?? se + 3;
  cartao(450, 600, 760, 640, k, (c, w, h) => {
    texto("SEMANA 1", 0, -h / 2 + 46, { tam: 40, cor: "#ff5a5f", borda: null });
    const a = eob(lin(t, se + .5, se + .85)), b = eob(lin(t, se + 1.2, se + 1.55)), d = eob(lin(t, tL - .1, tL + .3)), e = eob(lin(t, tL + .7, tL + 1.1));
    c.save(); c.globalAlpha = Math.min(1, a); texto("25 PEDIDOS", 0, -170, { tam: 86, cor: OL, borda: null }); c.restore();
    c.save(); c.globalAlpha = Math.min(1, b); texto("VENDEU R$ 540", 0, -80, { tam: 52, cor: "#2f8f3f", borda: null }); texto("GASTOU R$ 475", 0, -18, { tam: 52, cor: "#e3342f", borda: null }); texto("site 100 + chaveiros 125 + fretes 250", 0, 32, { tam: 26, fonte: "Fredoka", peso: 700, cor: "#777", borda: null }); c.restore();
    c.save(); c.translate(0, 126); c.scale(Math.max(.001, d), Math.max(.001, d)); forma(P.rr(-310, -50, 620, 100, 50), "#38c172", 5); texto("LUCRO: R$ 65", 0, 4, { tam: 64, cor: "#fff", lw: 9 }); c.restore();
    c.save(); c.translate(0, 236); c.scale(Math.max(.001, e), Math.max(.001, e)); forma(P.rr(-330, -42, 660, 84, 24), "#ffd23f", 5); texto("DICA: ENTRE O FRETE NO PREÇO", 0, 3, { tam: 36, cor: OL, borda: null }); c.restore();
  });
}
function decisaoEp(t) {
  const c = ctx, fi = F("final"), fm = F("fim"), k = lin(t, fi + .05, fi + .4);
  if (k > 0 && t < fm + .5) {
    const sai = 1 - lin(t, fm, fm + .5);
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = `rgba(20,16,40,${.62 * k * sai})`; c.fillRect(0, 0, W, H);
    c.translate(540, 920); const s = eob(k); c.scale(s, s); c.globalAlpha = sai;
    forma(P.rr(-460, -420, 920, 800, 44), "#1e2a4a", 7); forma(P.rr(-460, -432, 920, 800, 44), "#2b3a66", 7);
    forma(P.rr(-330, -472, 660, 84, 42), "#ff5a5f", 6); texto("VOCÊ TEM R$ 566", 0, -430, { tam: 48, cor: "#fff", lw: 8 });
    texto("COMO FAZER VENDER MAIS?", 0, -330, { tam: 50, cor: "#ffd23f", lw: 10 });
    const t1 = palavra("final", "anúncio")?.t0 ?? fi + 2.0, t2 = palavra("final", "vídeos")?.t0 ?? fi + 3.4;
    const bt = (y, cor, txt, sub, ativo, ic) => { const p = ativo ? 1 + .05 * Math.sin(t * 12) : 1; c.save(); c.translate(0, y); c.scale(p, p); forma(P.rr(-380, -72, 760, 168, 40), shade(cor, -.35), 6); forma(P.rr(-380, -84, 760, 168, 40), cor, 6); c.fillStyle = "rgba(255,255,255,.18)"; c.fill(P.rr(-366, -76, 732, 64, 32)); c.save(); c.translate(-290, 0); ic(); c.restore(); texto(txt, 50, -14, { tam: 52, cor: "#fff", lw: 9 }); texto(sub, 50, 44, { tam: 30, fonte: "Fredoka", peso: 700, cor: "#fff", borda: null }); c.restore(); };
    bt(-150, "#e3342f", "ANÚNCIO PAGO", "R$ 200 e muita gente vendo", t > t1 - .1 && t < t2 - .1, () => { forma(P.poly([[-40, -10], [36, -44], [36, 44], [-40, 10]]), "#fff", 5); forma(P.rr(-52, -12, 24, 24, 4), "#ffd23f", 4); });
    bt(70, "#7c5cd6", "VÍDEOS DE GRAÇA", "devagar, mas sem gastar", t > t2 - .1, () => { forma(P.rr(-40, -32, 80, 58, 10), "#1b1f26", 5); forma(P.poly([[-10, -16], [20, -3], [-10, 10]]), "#fff", 3); });
    const cy = t < t2 - .3 ? -150 : lerp(-150, 70, ease(lin(t, t2 - .4, t2))), cx = 300 + Math.cos(t * 4) * 8; if (t > t1 - .5) { c.save(); c.translate(cx, cy + 20 + Math.sin(t * 5) * 6); c.rotate(-.3); forma(P.poly([[0, 0], [0, 70], [18, 54], [30, 82], [44, 76], [32, 48], [56, 46]]), "#fff", 5); c.restore(); }
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
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = lin(t, fm + .5, fm + .8); texto("COMENTA: ANÚNCIO OU VÍDEOS?", 540, 1000, { tam: 54, cor: "#ffd23f", lw: 12 }); c.restore();
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
  telaLoja(t); cartaoFrete(t); cartaoPreco(t); cartaoSemana(t); hud(t); decisaoEp(t); desenhaLegenda(t);
}
