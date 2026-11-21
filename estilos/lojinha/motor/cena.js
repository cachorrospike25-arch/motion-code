// Lojinha: simulador de vida e negócios em 2D. Contrato do estúdio: iniciar(tempo) e quadro(t) no canvas #c.
// O episódio é escolhido por tempo.episodio (padrão 1): carrega ep<N>.js, que usa a biblioteca lib.js.
async function iniciar(tempo) {
  const n = tempo.episodio || 1;
  await new Promise((ok, erro) => { const s = document.createElement("script"); s.src = `ep${n}.js`; s.onload = ok; s.onerror = () => erro(new Error("ep" + n + ".js")); document.head.appendChild(s); });
  return iniciarEp(tempo);
}
function quadro(t) { return quadroEp(t); }
