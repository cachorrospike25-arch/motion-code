"""Som da Lojinha: trilha de desenho animado que segue a história + efeitos presos aos eventos da tela + mixagem.

Uso (de dentro de estilos/lojinha): python3 som.py episodios/<slug>
Lê tempo.json, eventos.json (gravado pelo capturar.mjs do núcleo) e, se existir, audio/narracao.wav.
Grava audio/trilha.wav, audio/efeitos.wav e audio/mix.wav (48 kHz, estéreo, -14 LUFS). Sem narração, a mixagem sai só
com trilha e efeitos (a trilha não abaixa).

Trilha (Dó maior, 112 bpm, Dó / Lám / Fá / Sol), por trecho:
  começo     marimba curiosa e baixo leve
  negócio    entram palmas e chocalho (fornecedor e vitrine)
  vendas     tudo: bumbo, palma, baixo saltado, melodia (clientes até o esgotou)
  festa      acorde de metais e prato no esgotou, segue cheia até a rua
  sonho      caixinha de música e pad, sem bateria (a loja grande)
  decisão    a música some: só um zumbido grave e o tique-taque; tcham no fim
"""

import json
import subprocess
import sys
from pathlib import Path

import numpy as np

SR = 48000
pasta = Path(sys.argv[1])
tempo = json.loads((pasta / "tempo.json").read_text())
ev = json.loads((pasta / "eventos.json").read_text())
ATO = {a["cena"]: a for a in tempo["atos"]}
F = lambda i: ATO[i]["fala"]["t0"]
DUR = tempo["total"]
N = int(DUR * SR)
t = np.arange(N) / SR
rng = np.random.default_rng(3)


def hz(m):
    return 440 * 2 ** ((m - 69) / 12)


def filtro(x, lo=None, hi=None):
    spec = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    if hi:
        spec *= 1 / np.sqrt(1 + (f / hi) ** 4)
    if lo:
        spec *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1)) ** 4)
    return np.fft.irfft(spec, len(x))


def reverb(x, seg=1.6, mix=.25):
    n = int(seg * SR)
    ir = filtro(rng.normal(0, 1, n) * np.exp(-np.arange(n) / SR * 4.5), hi=7000)
    ir /= np.sqrt((ir ** 2).sum())
    m = len(x) + n
    return x * (1 - mix) + np.fft.irfft(np.fft.rfft(x, m) * np.fft.rfft(ir, m), m)[:len(x)] * mix * 2.5


def soma(buf, a, s, g=1.0):
    i = int(a * SR)
    if i < 0:
        s, i = s[-i:], 0
    if i >= len(buf):
        return
    m = min(len(s), len(buf) - i)
    buf[i:i + m] += s[:m] * g


def env_ad(n, a=.005, d=6.0):
    tt = np.arange(n) / SR
    return np.minimum(1, tt / a) * np.exp(-tt * d)


# ---------------- trechos ----------------
S = ev.get("secoes", {})  # o episódio diz onde a música muda; sem isso, vale o desenho do episódio 1
def sec(nome, padrao):  # a seção vem do episódio; o padrão só é calculado se faltar (e só existe no episódio 1)
    return S[nome] if nome in S else padrao()


T_NEG = sec("neg", lambda: F("fornecedor") - .3 if "fornecedor" in ATO else 0)
T_VEN = sec("ven", lambda: F("clientes") + 1.2 if "clientes" in ATO else 0)
T_FES = sec("fes", lambda: F("esgotou") if "esgotou" in ATO else DUR + 1)
T_SON = sec("son", lambda: F("olha") - .1 if "olha" in ATO else DUR - 6)
QUIETO = S.get("quieto", [])  # trechos sem bateria, baixo nem melodia (loja vazia)
T_DEC = ev["tiquetaque"][0]
T_FIM = ev["fim"][0]
BPM = 112
B = 60 / BPM
ACORDES = [(48, [60, 64, 67]), (45, [57, 60, 64]), (41, [57, 60, 65]), (43, [59, 62, 67])]


def acorde(x):
    return ACORDES[int(x // (4 * B)) % 4]


def marimba(f, g=1.0, d=.45):
    n = int(d * SR)
    tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * tt) + .25 * np.sin(2 * np.pi * f * 4 * tt) * np.exp(-tt * 30)) * env_ad(n, .002, 9) * g


def baixo(f, g=1.0, d=.3):
    n = int(d * SR)
    tt = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * tt) + .3 * np.sin(4 * np.pi * f * tt)
    return s * env_ad(n, .004, 7) * g


def bumbo(g=1.0):
    n = int(.35 * SR)
    tt = np.arange(n) / SR
    return np.sin(2 * np.pi * np.cumsum(50 + 110 * np.exp(-tt * 35)) / SR) * np.exp(-tt * 12) * g


def palma(g=1.0):
    n = int(.18 * SR)
    tt = np.arange(n) / SR
    r = filtro(rng.normal(0, 1, n), lo=900, hi=5000)
    e = sum(np.exp(-np.maximum(0, tt - k * .011) * 40) * (tt >= k * .011) for k in range(3))
    return r * e * g


def chocalho(g=1.0):
    n = int(.07 * SR)
    tt = np.arange(n) / SR
    return filtro(rng.normal(0, 1, n), lo=6000, hi=12000) * np.sin(np.pi * tt / .07) * g


def caixinha(f, g=1.0):
    n = int(1.4 * SR)
    tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * tt) + .4 * np.sin(2 * np.pi * f * 3.01 * tt) * np.exp(-tt * 4)) * env_ad(n, .002, 2.6) * g


def pad(fs, d, g=1.0):
    n = int(d * SR)
    tt = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * (1 + k * .003) * tt + k) for f in fs for k in (-1, 1))
    e = np.minimum(1, tt / .5) * np.minimum(1, (d - tt) / .6)
    return s * e * g / len(fs)


def metais(fs, g=1.0, d=1.2):
    n = int(d * SR)
    tt = np.arange(n) / SR
    s = sum(sum(np.sin(2 * np.pi * f * h * tt) / h for h in range(1, 9)) for f in fs)
    return filtro(s * np.minimum(1, tt / .02) * np.exp(-tt * 2.2), hi=3500) * g / len(fs)


def prato(g=1.0):
    n = int(2.2 * SR)
    tt = np.arange(n) / SR
    return filtro(rng.normal(0, 1, n), lo=4000) * np.exp(-tt * 2.2) * g


mus = np.zeros(N)
bat = np.zeros(N)
MELO = [72, 74, 76, 79, 76, 74, 72, 67, 69, 72, 74, 72, 76, 74, 72, 74]
x, k = 0.0, 0
while x < T_SON:
    raiz, notas = acorde(x)
    passo = k % 8
    quieto = any(a <= x < b for a, b in QUIETO)
    vendas = T_VEN <= x < T_SON and not quieto
    neg = x >= T_NEG and not quieto
    # marimba: arpejo em colcheias (no começo só nos tempos)
    if quieto:
        if passo % 4 == 0:
            soma(mus, x, marimba(hz(notas[1] + 12), .1, .5))
    elif passo % 2 == 0 or neg:
        n = notas[[0, 1, 2, 1][passo % 4]] + 12
        soma(mus, x, marimba(hz(n), .16 if not vendas else .13))
    if vendas and passo % 2 == 0:
        soma(mus, x, marimba(hz(MELO[(k // 2) % 16] + 12), .14, .35))
    # baixo
    if not quieto and (passo in (0, 3, 4, 6) or (not neg and passo == 0)):
        if neg or passo == 0:
            soma(mus, x, baixo(hz(raiz - 12 + (7 if passo == 6 else 0)), .5))
    # bateria
    if neg:
        soma(bat, x, chocalho(.05 if passo % 2 else .08))
    if neg and passo in (2, 6):
        soma(bat, x, palma(.22))
    if vendas:
        if passo in (0, 3, 4):
            soma(bat, x, bumbo(.6))
    x += B / 2
    k += 1

# festa: metais e prato no esgotou e no resultado
for a, g in (S["festas"] if "festas" in S else [(T_FES, 1.0), (F("resultado") + .1, .7)]):
    soma(mus, a, metais([hz(60), hz(64), hz(67), hz(72)], .6 * g, 1.4))
    soma(bat, a, prato(.25 * g))

# sonho: caixinha de música e pad (Fá / Sol / Lám / Dó), até a decisão
x = T_SON + .3
prog = [[65, 69, 72], [67, 71, 74], [69, 72, 76], [64, 67, 72]]
i = 0
while x < T_DEC:
    fs = prog[i % 4]
    d = min(2 * 60 / 90 * 2, T_DEC - x + .8)
    soma(mus, x, pad([hz(f - 12) for f in fs], d + .6, .22))
    for j, nn in enumerate([fs[0] + 12, fs[1] + 12, fs[2] + 12, fs[1] + 24]):
        if x + j * .33 < T_DEC:
            soma(mus, x + j * .33, caixinha(hz(nn), .1))
    x += d
    i += 1

# decisão: zumbido grave que cresce
n = int((T_FIM - T_DEC + .5) * SR)
tt = np.arange(n) / SR
zum = (np.sin(2 * np.pi * hz(36) * tt) + .5 * np.sin(2 * np.pi * hz(43) * tt)) * np.minimum(1, tt / 1.5) * .25
soma(mus, T_DEC, zum * np.minimum(1, (len(zum) / SR - tt) / .4))
# tcham final
soma(mus, T_FIM, metais([hz(60), hz(64), hz(67), hz(72)], .7, 2.0))
soma(bat, T_FIM, prato(.3))
soma(bat, T_FIM, bumbo(.8))

trilha = reverb(mus, 1.4, .22) + bat
trilha *= np.minimum(1, t / .4) * np.minimum(1, (DUR - t) / .8)

# ---------------- efeitos ----------------
efx = np.zeros(N)
# tom de sala: nunca silêncio digital
efx += filtro(rng.normal(0, 1, N), lo=80, hi=1500) * .004


def sino():
    return np.concatenate([caixinha(hz(88), .5)[:int(.28 * SR)], caixinha(hz(84), .5)])


def caixa_reg():
    n = int(.25 * SR)
    tt = np.arange(n) / SR
    gaveta = filtro(rng.normal(0, 1, n), lo=500, hi=4000) * np.exp(-tt * 25) * .5
    s = np.zeros(int(1.2 * SR))
    s[:n] += gaveta
    s[int(.06 * SR):] += (caixinha(hz(100), .5)[:len(s) - int(.06 * SR)] + caixinha(hz(105), .35)[:len(s) - int(.06 * SR)])
    moeda = caixinha(hz(108), .25)[:int(.3 * SR)]
    s[:len(moeda)] += moeda
    return s


def farfalhar(d=.35, g=1.0):
    n = int(d * SR)
    tt = np.arange(n) / SR
    r = filtro(rng.normal(0, 1, n), lo=2000, hi=9000) * (.5 + .5 * np.sin(2 * np.pi * 38 * tt)) * np.sin(np.pi * tt / d)
    return r * g


def clique(g=1.0):
    n = int(.04 * SR)
    tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * 1800 * tt) + np.sin(2 * np.pi * 3100 * tt)) * np.exp(-tt * 150) * g


def pop(g=1.0):
    n = int(.12 * SR)
    tt = np.arange(n) / SR
    return np.sin(2 * np.pi * np.cumsum(300 + 1400 * tt / .12) / SR) * np.exp(-tt * 30) * g


def carimbo(g=1.0):
    n = int(.4 * SR)
    tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * np.cumsum(90 + 80 * np.exp(-tt * 40)) / SR) * np.exp(-tt * 14) + filtro(rng.normal(0, 1, n), hi=2000) * np.exp(-tt * 40) * .6) * g


def whoosh(d=.45, g=1.0):
    n = int(d * SR)
    tt = np.arange(n) / SR
    r = rng.normal(0, 1, n)
    partes = [filtro(r[i * n // 6:(i + 1) * n // 6], lo=300 + i * 500, hi=1500 + i * 1200) for i in range(6)]
    return np.concatenate(partes) * np.sin(np.pi * tt / d) ** 2 * g


def boing(g=1.0):
    n = int(.5 * SR)
    tt = np.arange(n) / SR
    f = 180 + 260 * tt / .5 + 40 * np.sin(2 * np.pi * 18 * tt) * np.exp(-tt * 4)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 5) * g


def corneta(g=1.0):
    n = int(.7 * SR)
    tt = np.arange(n) / SR
    f = 520 + 140 * np.minimum(1, tt / .15)
    s = sum(np.sin(2 * np.pi * np.cumsum(f * h) / SR) / h for h in range(1, 7))
    return filtro(s * np.minimum(1, tt / .03) * np.minimum(1, (.7 - tt) / .1), hi=4000) * g


def torcida(d=1.8, g=1.0):
    n = int(d * SR)
    tt = np.arange(n) / SR
    r = filtro(rng.normal(0, 1, n), lo=400, hi=3000) * (1 + .4 * np.sin(2 * np.pi * 7 * tt))
    return r * np.minimum(1, tt / .15) * np.exp(-tt * 1.6) * g


def brilho(g=1.0):
    s = np.zeros(int(1.0 * SR))
    for j in range(6):
        soma(s, j * .07, caixinha(hz(96 + [0, 4, 7, 12, 7, 16][j]), .25)[:int(.6 * SR)])
    return s * g


def grilo(d, g=1.0):
    n = int(d * SR)
    tt = np.arange(n) / SR
    canto = (np.sin(2 * np.pi * 4300 * tt) * (np.sin(2 * np.pi * 30 * tt) > .2) * ((tt * 2.2) % 1 < .35))
    return canto * np.minimum(1, tt / .3) * np.minimum(1, (d - tt) / .3) * g


def murmurio(d, g=1.0):
    n = int(d * SR)
    tt = np.arange(n) / SR
    r = filtro(rng.normal(0, 1, n), lo=250, hi=1800)
    mod = 1 + .5 * np.sin(2 * np.pi * 2.3 * tt) * np.sin(2 * np.pi * .7 * tt)
    return r * mod * np.minimum(1, tt / .5) * np.minimum(1, (d - tt) / .6) * g


def alarme(g=1.0):
    n = int(1.0 * SR)
    tt = np.arange(n) / SR
    f = np.where((tt * 4) % 1 < .5, 880, 660)
    return np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * .35 * np.minimum(1, (1 - tt) / .1) * g


def trombone(g=1.0):
    n = int(1.3 * SR)
    tt = np.arange(n) / SR
    f = np.interp(tt, [0, .25, .5, .75, 1.3], [233, 220, 208, 196, 156]) * (1 + .02 * np.sin(2 * np.pi * 6 * tt))
    s = sum(np.sin(2 * np.pi * np.cumsum(f * h) / SR) / h for h in range(1, 7))
    return filtro(s, hi=1800) * np.minimum(1, tt / .04) * np.minimum(1, (1.3 - tt) / .15) * g


def tique(g=1.0, f=2400):
    n = int(.03 * SR)
    tt = np.arange(n) / SR
    return np.sin(2 * np.pi * f * tt) * np.exp(-tt * 200) * g


for a in ev["sino"]:
    soma(efx, a, sino(), .35)
for a in ev["caixa"]:
    soma(efx, a, caixa_reg(), .4)
for a in ev["cedulas"]:
    soma(efx, a, farfalhar(.35), .25)
for a in ev["clique"]:
    if a > 0:
        soma(efx, a, clique(), .5)
for a in ev["pop"]:
    soma(efx, a, pop(), .3)
for a in ev["carimbo"]:
    soma(efx, a, carimbo(), .6)
for a in ev["placa"]:
    soma(efx, a, whoosh(.25), .25)
    soma(efx, a + .3, clique(), .4)
if len(ev["grilos"]) == 2:
    a, b = ev["grilos"]
    soma(efx, a, grilo(b - a), .05)
for a in ev["feno"]:
    soma(efx, a, whoosh(2.2), .12)
for a in ev["whoosh"]:
    soma(efx, a - .15, whoosh(.45), .2)
for a in ev["festa"]:
    soma(efx, a, corneta(), .25)
    soma(efx, a, torcida(), .2)
for a in ev["pulo"]:
    soma(efx, a, boing(), .25)
for a in ev["brilho"]:
    soma(efx, a, brilho(), .3)
if len(ev["multidao"]) == 2 and ev["multidao"][1] - ev["multidao"][0] > .5:
    a, b = ev["multidao"]
    soma(efx, a, murmurio(b - a), .07)
a, b = ev["tiquetaque"]
x, j = a, 0
while x < b:
    soma(efx, x, tique(.35, 2600 if j % 2 else 2000))
    x += .5
    j += 1
for a in ev.get("alarme", []):
    soma(efx, a, alarme(), .3)
for a in ev.get("trombone", []):
    soma(efx, a, trombone(), .3)

# ---------------- mixagem ----------------
audio = pasta / "audio"
audio.mkdir(exist_ok=True)


def grava(nome, x):
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-ac", "2", str(audio / nome)],
                   input=x.astype(np.float32).tobytes(), check=True)


trilha /= np.abs(trilha).max()
efx /= np.abs(efx).max()
grava("trilha.wav", trilha * .8)
grava("efeitos.wav", efx * .8)

voz_wav = audio / "narracao.wav"
v = np.zeros(N)
if voz_wav.exists():
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(voz_wav), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    vv = np.frombuffer(raw, np.float32)
    v[:min(N, len(vv))] = vv[:N]
janela = int(.25 * SR)
env = np.convolve(np.abs(v), np.ones(janela) / janela, mode="same")
duck = 1 - .5 * np.clip(env / (env.max() * .25), 0, 1) if env.max() > .01 else np.ones(N)
duck = np.convolve(duck, np.ones(janela) / janela, mode="same")
mix = v + trilha * (.32 if env.max() > .01 else .45) * duck + efx * .9
grava("mix_mono.wav", mix)
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(audio / "mix_mono.wav"), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11",
                "-ar", str(SR), "-ac", "2", str(audio / "mix.wav")], check=True)
(audio / "mix_mono.wav").unlink()
print(f"ok: {DUR:.1f}s {'com' if env.max() > .01 else 'sem'} narração")
