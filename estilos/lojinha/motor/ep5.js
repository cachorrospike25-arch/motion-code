// Episódio 5: Você aceitou a encomenda (usa lib.js). Continua o ep. 2: caixa R$ 126, encomenda de 100 × R$ 9 = R$ 900, custo R$ 500.
// Solução: sinal de 50% (R$ 450) → caixa 576 → compra R$ 500 → sobram 76 → entrega → +R$ 450 → caixa R$ 526; lucro da encomenda R$ 400.

const PEGS = []; for (let r = 0; r < 2; r++) for (let i = 0; i < 5; i++) PEGS.push([598 + i * 62, 640 + r * 150]);
let VISOR = () => "0,00";
let EV_SINO = () => 0;
let EXEC_A, EXEC_B, FORN_CH;

function montarEp() {
  const g = F("gancho"), pr = F("problema"), id = F("ideia"), si = F("sinal"), co = F("compra"), en = F("entrega"), re = F("resultado"), fi = F("final"), fm = F("fim");
  EXEC_A = [[0, 760, 1560], [co + .1, 760, 1560], [co + 1.3, 140, 1470]];
  EXEC_B = [[en + 1.9, 140, 1470], [en + 3.0, 760, 1560], [fm + 20, 760, 1560]];
  FORN_CH = [[co - .1, 140, 1470], [co + 1.1, 420, 1570], [co + 3.2, 420, 1570], [co + 4.3, 140, 1470]];
  HUD = {
    din: contador([[0, 126], [si + 1.2, 576], [co + 1.6, 76], [en + 3.5, 526]], 126), est: contador([[0, 0], [co + 1.7, 100], [en + 2.3, 0]], 0),
    ven: contador([[si + 1.2, 450], [en + 3.5, 0]], 0), luc: contador([[0, 76], [re + 1.3, 476]], 76),
    chips: [[si + 1.2, 0, "+R$ 450", "#38c172"], [co + 1.6, 0, "−R$ 500", "#e3342f"], [co + 1.7, 1, "+100", "#f0a020"], [en + 3.5, 0, "+R$ 450", "#38c172"], [re + 1.3, 3, "+R$ 400", "#38c172"]],
    rot: ["DINHEIRO", "ESTOQUE", "A RECEBER", "LUCRO TOTAL"], pulso: re + 1.3, dia: { txt: "PEDIDO", fim: fi - .6 },
  };
  EV = {
    sino: [co - .3, co + 1.1, co + 3.2, en + 1.8, en + 2.9],
    caixa: [si + 1.2, en + 3.5], cedulas: [si + .5, si + .65, si + .8, en + 3.1, en + 3.25, en + 3.4],
    clique: [palavra("final", "segunda")?.t0 ?? fi + 2.5, palavra("final", "online")?.t0 ?? fi + 3.5],
    pop: [], carimbo: [g + .35, en + 2.4, re + .5], placa: [], grilos: [], feno: [],
    whoosh: [g + .1, pr - .1, id - .1, si - .1, co - .2, en - .1, re - .1, fi - .1, fm - .1],
    festa: [re + .2], pulo: [re + .3, re + 1.0], brilho: [id + .3], multidao: [], trombone: [pr + 1.7], alarme: [],
    tiquetaque: [fi + .2, TEMPO.total - 2.4], fim: [TEMPO.total - 2.4], tranco: [g + .4, en + 2.4],
    secoes: { neg: .2, ven: si, son: fi + .1, quieto: [[pr + .3, id + .4]], festas: [[re + .1, 1.0], [en + 3.5, .6]] },
  };
  EV_SINO = (t) => { let k = 0; for (const a of EV.sino) if (t >= a) k = Math.max(k, 1 - (t - a) / 1.2); return Math.max(0, k); };
}
window.eventos = () => EV;

function cameraEp(t) {
  const g = F("gancho"), pr = F("problema"), id = F("ideia"), si = F("sinal"), co = F("compra"), en = F("entrega"), re = F("resultado"), fi = F("final");
  const ch = [[0, 1.45, 780, 1200], [g + 2.4, 1.35, 830, 1230], [pr + .3, 1.3, 800, 1240], [id + .4, 1.6, 930, 1180], [si, 1.4, 830, 1230], [co, 1.15, 560, 1250], [co + 2.5, 1.2, 500, 1300], [en, 1.1, 560, 1250], [en + 3.0, 1.4, 800, 1240], [re, 1.1, 640, 1100], [fi + .2, 1.0, 540, 1000]];
  let i = 0; while (i < ch.length - 1 && ch[i + 1][0] <= t) i++;
  const a = ch[i], b = ch[Math.min(i + 1, ch.length - 1)]; const k = b === a ? 0 : ease(lin(t, a[0], b[0]));
  let z = lerp(a[1], b[1], k), x = lerp(a[2], b[2], k), y = lerp(a[3], b[3], k);
  z *= 1 + Math.sin(t * .7) * .006; x += Math.sin(t * .5) * 4; y += Math.cos(t * .43) * 3;
  const mx = W / (2 * z), my = H / (2 * z); x = cl(x, mx, W - mx); y = cl(y, my, H - my);
  let sh = 0; for (const q of EV.tranco) sh += Math.max(0, 1 - (t - q) / .3) * (t >= q ? 1 : 0);
  return { z, x: x + Math.sin(t * 90) * 10 * sh, y: y + Math.cos(t * 77) * 8 * sh };
}
function notasVoando(t, de, a0, a1, destino) {
  for (let i = 0; i < 5; i++) { const a = a0 + i * .13, k = lin(t, a, a + .5); if (k <= 0 || k >= 1) continue; cedula(lerp(de.x, destino[0], k), lerp(de.y, destino[1], k) - Math.sin(k * Math.PI) * 150, 50, k * 5, .9); }
}
function interiorEp(t) {
  const c = ctx, g = F("gancho"), pr = F("problema"), id = F("ideia"), si = F("sinal"), co = F("compra"), en = F("entrega"), re = F("resultado"), fi = F("final");
  ruaJanela(t); c.drawImage(FUNDO, 0, 0);
  let ab = 0; const abre = (a) => { ab = Math.max(ab, Math.sin(cl((t - a) / 1.1) * Math.PI)); };
  abre(co - .4); abre(co + .8); abre(co + 2.9); abre(en + 1.6); abre(en + 2.7);
  porta(t, ab, 1); relogio(t, 7 * ease(lin(t, en, en + 3.8))); lampada(t, 1); planta(t, 1);
  // pilha de caixas (as 100 peças) no chão
  const kp = (i) => eob(lin(t, co + 1.5 + i * .18, co + 1.8 + i * .18)) * (1 - ease(lin(t, en + 2.0 + i * .12, en + 2.4 + i * .12)));
  [[340, 1655, 0], [510, 1655, 1], [425, 1550, 2], [250, 1560, 3]].forEach(([x, y, i]) => { const k = kp(i); if (k > .02) caixaPrem(x, y, .9 * k, 0); });
  // protagonista atrás do balcão
  const eh = t < g + 1.2 ? "euforico" : t < id ? "preocupado" : t < id + .4 ? "pensativo" : t < si ? "euforico" : t < en ? "feliz" : t < en + 3.3 ? "determinado" : "euforico";
  const ocupado = t > en && t < en + 3.3, festa = t > re && t < re + 2.6;
  const pu = festa ? Math.abs(Math.sin((t - re) * 5.5)) * 110 : 0;
  figura(EU, { x: 975, y: 1300, dir: -1, expr: eh, pulo: pu, bE: t < g + 1.2 ? 2.6 : (t > id + .4 && t < id + 1.5) ? 2.7 : ocupado ? 1.4 + Math.sin(t * 11) * .5 : festa ? 2.7 : .2, bD: ocupado ? 1.4 + Math.cos(t * 11) * .5 : festa ? 2.7 : .2, olhar: [-1, 0] });
  lampadaIdeia(975, 790, lin(t, id + .3, id + .55) * (1 - lin(t, id + 1.6, id + 1.9)));
  balcao(); const gav = Math.max(Math.sin(cl((t - (si + 1.0)) / .8) * Math.PI), Math.sin(cl((t - (en + 3.3)) / .8) * Math.PI)); caixaRegistradora(t, Math.max(0, gav));
  // o cliente de terno
  const noA = t < co + 1.35, noB = t > en + 1.85;
  if (noA || noB) {
    const m = mover(t, noA ? EXEC_A : EXEC_B, 1), parado = m.passo == null;
    const paga = (t > si + .4 && t < si + 1.3) || (t > en + 3.0 && t < en + 3.9);
    const fala = (t > pr + .3 && t < pr + 1.6) || (t > id + 1.7 && t < id + 2.7);
    const mm = figura(EXEC, { x: m.x, y: m.y, s: EXEC.s, passo: m.passo, dir: m.dir, expr: paga ? "rindo" : t < id + 1.6 ? "determinado" : "feliz", bD: paga ? 1.6 : 1.0, bE: .15, fala: fala ? Math.abs(Math.sin(t * 12)) : 0, olhar: [1, 0] });
    pasta(mm.d.x + 6, mm.d.y + 20, -.1);
    if (t > si + .4 && t < si + 1.6) notasVoando(t, mm.d, si + .5, 0, [842, 1040]);
    if (t > en + 3.0 && t < en + 4.2) notasVoando(t, mm.d, en + 3.1, 0, [842, 1040]);
    balao(m.x + 40, m.y - 600, "Prazo: 3 dias!", lin(t, pr + .4, pr + .7) * (1 - lin(t, pr + 1.7, pr + 1.9)), { rabo: [-1, 1], tam: 38 });
    balao(m.x + 40, m.y - 600, "50%? Hmm...", lin(t, id + .6, id + .9) * (1 - lin(t, id + 1.5, id + 1.7)), { rabo: [-1, 1], tam: 38 });
    balao(m.x + 40, m.y - 600, "Fechado!", lin(t, id + 1.9, id + 2.2) * (1 - lin(t, si + .3, si + .5)), { rabo: [-1, 1], tam: 40 });
  }
  // fornecedor entrega as caixas
  if (t > co - .15 && t < co + 4.4) {
    const m = mover(t, FORN_CH, 1), entregando = t < co + 1.6 || t > co + 3.1; const levaCaixa = t < co + 1.5;
    if (levaCaixa) { carrinho(m.x + 90, m.y); caixaPrem(m.x + 100, m.y - 60, .9, 0); caixaPrem(m.x + 100, m.y - 175, .9, 0); }
    const mm = figura(FORN, { x: m.x, y: m.y, passo: m.passo, dir: m.dir, expr: "feliz", bD: levaCaixa ? .6 : (t > co + 1.7 && t < co + 3.0 ? 1.0 : .15), bE: .15, olhar: [m.dir, 0] });
    if (t > co + 1.7 && t < co + 3.0) notasVoando(t, { x: 640, y: 1240 }, co + 1.8, 0, [mm.d.x, mm.d.y]);
    balao(m.x + 40, m.y - 560, "Pronto, 100 peças!", lin(t, co + 1.5, co + 1.8) * (1 - lin(t, co + 2.7, co + 2.9)), { rabo: [-1, 1], tam: 36 });
  }
  // cartões
  const stamp = lin(t, g + .35, g + .65) * (1 - lin(t, g + 2.4, g + 2.7));
  if (stamp > 0) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.translate(540, 640); c.rotate(-.07); const s = (stamp < 1 ? 1.8 - .8 * eout(stamp) : 1) * (1 + .03 * Math.sin(t * 14)); c.scale(s, s); forma(P.rr(-400, -100, 800, 200, 36), "#38c172", 8); texto("ACEITOU!", 0, 4, { tam: 124, cor: "#fff", lw: 14 }); c.restore(); c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = stamp; texto("A VOTAÇÃO DECIDIU", 540, 800, { tam: 44, cor: "#ffd23f", lw: 10 }); c.restore(); }
  const kb = lin(t, pr + .2, pr + .5) * (1 - lin(t, id - .1, id + .2));
  cartao(540, 520, 740, 400, kb, (c, w, h) => {
    texto("ENCOMENDA: 100 PEÇAS", 0, -h / 2 + 44, { tam: 38, cor: "#ff5a5f", borda: null });
    const bw = 560, x0 = -bw / 2, k1 = eob(lin(t, pr + .5, pr + 1.0)), k2 = eob(lin(t, pr + 1.0, pr + 1.4)), k3 = eob(lin(t, pr + 1.5, pr + 1.9));
    texto("CUSTO R$ 500", x0, -78, { tam: 34, cor: OL, borda: null, al: "left" }); forma(P.rr(x0, -52, bw * k1, 46, 14), "#e3342f", 5);
    texto("SEU CAIXA R$ 126", x0, 18, { tam: 34, cor: OL, borda: null, al: "left" }); forma(P.rr(x0, 44, Math.max(14, bw * 126 / 500 * k2), 46, 14), "#38c172", 5);
    c.save(); c.globalAlpha = Math.min(1, k3); c.translate(0, 138); c.scale(.9 + .1 * k3, .9 + .1 * k3); forma(P.rr(-230, -34, 460, 68, 34), "#ffd23f", 5); texto("FALTAM R$ 374", 0, 3, { tam: 46, cor: OL, borda: null }); c.restore();
  });
  const ks = lin(t, id + 1.2, id + 1.5) * (1 - lin(t, si + 1.4, si + 1.7));
  cartao(540, 520, 740, 400, ks, (c, w, h) => {
    texto("SINAL DE 50%", 0, -h / 2 + 44, { tam: 42, cor: "#ff5a5f", borda: null });
    c.save(); c.translate(-210, 20); c.beginPath(); c.arc(0, 0, 100, 0, Math.PI * 2); c.fillStyle = "#e9e1cf"; c.fill(); c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 100, -Math.PI / 2, Math.PI / 2); c.closePath(); c.fillStyle = "#ffcf3a"; c.fill(); c.lineWidth = 6; c.strokeStyle = OL; c.beginPath(); c.arc(0, 0, 100, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.moveTo(0, -100); c.lineTo(0, 100); c.stroke(); texto("50%", 40, 4, { tam: 46, cor: OL, borda: null }); c.restore();
    texto("R$ 450 AGORA", 150, -22, { tam: 46, cor: "#2f8f3f", borda: null }); texto("R$ 450 NA ENTREGA", 150, 48, { tam: 38, cor: OL, borda: null });
  });
  // calendário e embalagem
  [["1 DIA", en + .2], ["2 DIAS", en + 1.2], ["3 DIAS", en + 2.2]].forEach(([txt, a], i) => {
    const k = lin(t, a, a + .3) * (1 - lin(t, a + .85, a + 1.0)); if (k <= 0) return;
    cartao(540, 520, 520, 230, k, (c, w, h) => { forma(P.rr(-w / 2, -h / 2, w, 62, 34), "#e3342f", 0); c.fillStyle = "#e3342f"; c.fillRect(-w / 2, -h / 2 + 30, w, 32); for (const x of [-150, 150]) forma(P.rr(x - 8, -h / 2 - 14, 16, 36, 8), "#8c8f96", 4); texto(txt, 0, 34, { tam: 92, cor: OL, borda: null }); }, "#fffaf0");
  });
  const ke = lin(t, en + 2.3, en + 2.6) * (1 - lin(t, en + 3.4, en + 3.6));
  if (ke > 0) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.translate(540, 620); c.rotate(-.07); const s = ke < 1 ? 1.8 - .8 * eout(ke) : 1; c.scale(s, s); forma(P.rr(-400, -90, 800, 180, 34), "#38c172", 8); texto("ENTREGUE!", 0, 4, { tam: 112, cor: "#fff", lw: 13 }); c.restore(); }
  confete(t, re + .2, 2);
}
function resultadoEp(t) {
  const re = F("resultado"), fi = F("final"), k = lin(t, re + .1, re + .45) * (1 - lin(t, fi - .4, fi - .1)); if (k <= 0) return;
  const tV = palavra("resultado", "vendeu")?.t0 ?? re, tL = palavra("resultado", "lucro")?.t0 ?? re + 2.2;
  cartao(540, 640, 820, 560, k, (c, w, h) => {
    texto("RESULTADO DA ENCOMENDA", 0, -h / 2 + 46, { tam: 38, cor: "#ff5a5f", borda: null });
    const a = eob(lin(t, tV, tV + .35)), b = eob(lin(t, tV + .6, tV + .95)), d = eob(lin(t, tL - .1, tL + .3)), e = eob(lin(t, tL + .8, tL + 1.2));
    c.save(); c.globalAlpha = Math.min(1, a); texto("VENDEU R$ 900", 0, -140, { tam: 52, cor: "#2f8f3f", borda: null }); c.restore();
    c.save(); c.globalAlpha = Math.min(1, b); texto("GASTOU R$ 500", 0, -76, { tam: 52, cor: "#e3342f", borda: null }); c.restore();
    c.fillStyle = "rgba(43,26,16,.2)"; c.fillRect(-w / 2 + 60, -34, w - 120, 5);
    c.save(); c.translate(0, 30); c.scale(Math.max(.001, d), Math.max(.001, d)); forma(P.rr(-330, -46, 660, 92, 46), "#38c172", 5); texto("LUCRO: R$ 400", 0, 4, { tam: 58, cor: "#fff", lw: 9 }); c.restore();
    c.save(); c.globalAlpha = Math.min(1, Math.max(0, e)); texto("LUCRO TOTAL: R$ 76 + R$ 400 = R$ 476", 0, 118, { tam: 32, cor: OL, borda: null }); c.restore();
    c.save(); c.translate(0, 196); c.scale(Math.max(.001, e), Math.max(.001, e)); forma(P.rr(-330, -42, 660, 84, 24), "#ffd23f", 5); texto("DICA: PEÇA SINAL ANTES", 0, 3, { tam: 46, cor: OL, borda: null }); c.restore();
  });
}
function decisaoEp(t) {
  const c = ctx, fi = F("final"), fm = F("fim"), k = lin(t, fi + .05, fi + .4);
  if (k > 0 && t < fm + .5) {
    const sai = 1 - lin(t, fm, fm + .5);
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = `rgba(20,16,40,${.62 * k * sai})`; c.fillRect(0, 0, W, H);
    c.translate(540, 920); const s = eob(k); c.scale(s, s); c.globalAlpha = sai;
    forma(P.rr(-460, -420, 920, 800, 44), "#1e2a4a", 7); forma(P.rr(-460, -432, 920, 800, 44), "#2b3a66", 7);
    forma(P.rr(-330, -472, 660, 84, 42), "#ff5a5f", 6); texto("VOCÊ TEM R$ 526", 0, -430, { tam: 48, cor: "#fff", lw: 8 });
    texto("O QUE FAZER AGORA?", 0, -330, { tam: 56, cor: "#ffd23f", lw: 10 });
    const t1 = palavra("final", "segunda")?.t0 ?? fi + 1.8, t2 = palavra("final", "online")?.t0 ?? fi + 3.4;
    const bt = (y, cor, txt, sub, ativo, ic) => { const p = ativo ? 1 + .05 * Math.sin(t * 12) : 1; c.save(); c.translate(0, y); c.scale(p, p); forma(P.rr(-380, -72, 760, 168, 40), shade(cor, -.35), 6); forma(P.rr(-380, -84, 760, 168, 40), cor, 6); c.fillStyle = "rgba(255,255,255,.18)"; c.fill(P.rr(-366, -76, 732, 64, 32)); c.save(); c.translate(-290, 0); ic(); c.restore(); texto(txt, 50, -14, { tam: 56, cor: "#fff", lw: 9 }); texto(sub, 50, 44, { tam: 30, fonte: "Fredoka", peso: 700, cor: "#fff", borda: null }); c.restore(); };
    bt(-150, "#38c172", "2ª LOJA", "mais espaço, mais clientes", t > t1 - .1 && t < t2 - .1, () => { forma(P.rr(-42, -26, 84, 56, 6), "#ffd9a0", 5); forma(P.poly([[-50, -26], [0, -52], [50, -26]]), "#e3342f", 5); forma(P.rr(-12, 4, 24, 26, 3), "#8a5a3b", 4); });
    bt(70, "#3b82f6", "LOJA ONLINE", "vende o dia inteiro", t > t2 - .1, () => { forma(P.rr(-40, -34, 80, 56, 8), "#fff", 5); forma(P.rr(-32, -26, 64, 40, 3), "#7fd0ff", 3); forma(P.rr(-18, 26, 36, 8, 3), "#fff", 3); });
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
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = lin(t, fm + .5, fm + .8); texto("COMENTA: 2ª LOJA OU ONLINE?", 540, 1000, { tam: 56, cor: "#ffd23f", lw: 12 }); c.restore();
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
  hud(t); resultadoEp(t); decisaoEp(t); desenhaLegenda(t);
}
