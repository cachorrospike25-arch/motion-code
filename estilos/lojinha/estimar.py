"""Gera o tempo.json sem voz, estimando a duração das falas (~2,75 palavras por segundo).
Uso (de dentro de estilos/lojinha): python3 estimar.py episodios/<slug>
Serve para renderizar o vídeo quando a voz não está disponível; com a voz, o narrar.py do núcleo gera o tempo.json de verdade."""
import json, sys
from pathlib import Path
pasta = Path(sys.argv[1])
r = json.loads((pasta / "roteiro.json").read_text())
t, atos = 0.0, []
for a in r["atos"]:
    n = a.get("narracao"); fala = None
    if n:
        t0 = t + n.get("em", .4); t1 = t0 + len(n["texto"].split()) / 2.75
        fala = dict(t0=round(t0, 3), t1=round(t1, 3), texto=n["texto"])
    dura = max(a["dura"], (fala["t1"] - t + r.get("respiro", .3)) if fala else 0)
    atos.append(dict(cena=a["cena"], entrada=None, t0=round(t, 3), t1=round(t + dura, 3), fala=fala)); t += dura
out = dict(fps=r.get("fps", 30), formato=r.get("formato", "9:16"), atos=atos, total=round(t, 3), **({"episodio": r["episodio"]} if "episodio" in r else {}))
(pasta / "tempo.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
print(f"{t:.1f} s"); [print(f"  {a['cena']:11} {a['t0']:6.2f} {a['t1']:6.2f}  fala {a['fala']['t0']:.2f}-{a['fala']['t1']:.2f}" if a['fala'] else f"  {a['cena']:11} {a['t0']:6.2f} {a['t1']:6.2f}") for a in atos]
