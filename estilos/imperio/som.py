"""Som do Império: trilha cinematográfica que segue a história + efeitos presos aos eventos da tela + mixagem.

Uso: python3 som.py episodios/<slug> [--sem-voz]
Lê tempo.json (falas), eventos.json (gravado pelo capturar.mjs) e audio/narracao.wav.
Grava audio/trilha.wav, audio/efeitos.wav e audio/mix.wav (48 kHz, estéreo, -14 LUFS).
A trilha não é loop: cresce com o empreendimento (Ré menor: Rém, Si♭, Fá, Dó), bate no salto e resolve em Ré maior no fim.
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
DUR = tempo["total"] + 0.6
N = int(DUR * SR)
t = np.arange(N) / SR
rng = np.random.default_rng(4)


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


def reverb(x, seg=2.6, mix=0.35):
    n = int(seg * SR)
    ir = rng.normal(0, 1, n) * np.exp(-np.arange(n) / SR * 3.2)
    ir = filtro(ir, hi=6000)
    ir /= np.sqrt((ir ** 2).sum())
    m = len(x) + n
    w = np.fft.irfft(np.fft.rfft(x, m) * np.fft.rfft(ir, m), m)[: len(x)]
    return x * (1 - mix) + w * mix * 3


def curva(pontos):
    """intensidade ao longo do tempo: [(t, valor), ...] interpolado"""
    xs, ys = zip(*pontos)
    return np.interp(t, xs, ys)


def por(a, sinal):
    i = int(a * SR)
    if i >= N:
        return
    m = min(len(sinal), N - i)
    return i, m


def soma(buf, a, sinal, g=1.0):
    if a < 0:
        sinal = sinal[int(-a * SR):]
        a = 0
    r = por(a, sinal)
    if r:
        i, m = r
        buf[i:i + m] += sinal[:m] * g


# ---------------- trilha ----------------
BPM = 96
BAR = 4 * 60 / BPM
ACORDES = [(50, [62, 65, 69]), (46, [62, 65, 70]), (41, [60, 65, 69]), (48, [60, 64, 67])]  # Rém, Si♭, Fá, Dó (baixo, notas)
FIM = (50, [62, 66, 69])  # Ré maior: a resolução

I = curva([(0, .35), (F("investe"), .45), (F("abre"), .5), (F("expansao"), .62), (F("salto") - .1, .78), (F("salto") + .2, 1.0),
           (F("patrimonio"), .9), (F("comecou"), .85), (F("cta"), .6), (DUR, .45)])
t_fim = F("comecou")


def acorde_em(x):
    if x >= t_fim:
        return FIM
    return ACORDES[int(x // BAR) % 4]


def tom(f, dur, harm=6, det=0.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    s = np.zeros(n)
    for k in range(1, harm + 1):
        for d in (-det, det) if det else (0,):
            s += np.sin(2 * np.pi * f * k * (1 + d) * tt + rng.uniform(0, 6)) / k ** 1.3
    return s


pad = np.zeros(N)
baixo = np.zeros(N)
osti = np.zeros(N)
bateria = np.zeros(N)

# pad e baixo: um bloco por compasso (ou a partir da resolução), com ataque e soltura que se cruzam
marcas = list(np.arange(0, t_fim, BAR)) + [t_fim]
for i, a in enumerate(marcas):
    b = marcas[i + 1] if i + 1 < len(marcas) else DUR
    raiz, notas = acorde_em(a + 0.01)
    dur = b - a + 1.2
    env = np.minimum(1, np.arange(int(dur * SR)) / SR / .6) * np.minimum(1, (dur - np.arange(int(dur * SR)) / SR) / 1.0)
    s = sum(tom(hz(m - 12), dur, 7, .0025) for m in notas) + 0.6 * sum(tom(hz(m), dur, 4, .003) for m in notas[1:])
    soma(pad, a, s * env * .05)
    bs = tom(hz(raiz - 12), dur, 4) * env
    soma(baixo, a, bs * .16)

# ostinato dedilhado em colcheias a partir do primeiro investimento
passo = 60 / BPM / 2
k = 0
x = F("investe") - 0.2
x = np.ceil(x / passo) * passo
while x < DUR - .5:
    raiz, notas = acorde_em(x)
    seq = [notas[0] + 12, notas[1] + 12, notas[2] + 12, notas[1] + 12, notas[0] + 24, notas[2] + 12, notas[1] + 12, notas[2]]
    m = seq[k % 8]
    d = .5
    n = int(d * SR)
    tt = np.arange(n) / SR
    s = (np.sin(2 * np.pi * hz(m) * tt) + .35 * np.sin(4 * np.pi * hz(m) * tt) + .12 * np.sin(6 * np.pi * hz(m) * tt)) * np.exp(-tt * 7)
    acento = 1.0 if k % 2 == 0 else .7
    soma(osti, x, s * .06 * acento)
    k += 1
    x += passo


def tambor(g=1.0, grave=58):
    n = int(1.2 * SR)
    tt = np.arange(n) / SR
    f = grave + 70 * np.exp(-tt * 30)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 5)
    ruido = filtro(rng.normal(0, 1, n), hi=900) * np.exp(-tt * 28) * .5
    return (s + ruido) * g


def chimbal(g=1.0):
    n = int(.08 * SR)
    tt = np.arange(n) / SR
    return filtro(rng.normal(0, 1, n), lo=6000, hi=11000) * np.exp(-tt * 70) * g


bt = 60 / BPM
x = np.ceil(F("expansao") / BAR) * BAR
while x < t_fim - .1:
    forte = x >= F("salto")
    for b in range(4):
        y = x + b * bt
        if y >= t_fim - .1:
            break
        if b in (0, 2) or forte:
            soma(bateria, y, tambor(.5 if b in (0, 2) else .28))
        if forte:
            for h in range(2):
                soma(bateria, y + h * bt / 2, chimbal(.018 if h else .03))
        if forte and b == 3:
            soma(bateria, y + bt / 2, tambor(.22, 80))
    x += BAR


def impacto(g=1.0):
    n = int(3.5 * SR)
    tt = np.arange(n) / SR
    sub = np.sin(2 * np.pi * np.cumsum(40 + 50 * np.exp(-tt * 6)) / SR) * np.exp(-tt * 1.4)
    ruido = filtro(rng.normal(0, 1, n), hi=2500) * np.exp(-tt * 3.5) * .5
    return (sub + ruido) * g


def subida(dur, g=1.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    r = rng.normal(0, 1, n)
    partes = []
    for i in range(8):  # varredura em blocos: o filtro abre aos poucos
        a, b = i * n // 8, (i + 1) * n // 8
        partes.append(filtro(r[a:b], lo=300 + i * 600, hi=1200 + i * 1500))
    s = np.concatenate(partes) * (tt / dur) ** 2
    return s * g


for alvo in (F("salto"), F("comecou")):
    soma(bateria, alvo - 2.2, subida(2.2, .25))
    soma(bateria, alvo, impacto(.75))

trilha = reverb(pad + osti, 2.8, .4) + baixo + reverb(bateria, 1.6, .25)
trilha *= I
fade = np.minimum(1, t / 1.0) * np.minimum(1, (DUR - t) / 1.5)
trilha *= fade

# ---------------- efeitos ----------------
efx = np.zeros(N)
# ambiente de cidade: rumor grave constante (nunca silêncio)
efx += filtro(np.cumsum(rng.normal(0, 1, N)) * .002, lo=40, hi=500) * .5


def sino(f, d=.7, g=1.0):
    n = int(d * SR)
    tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * tt) + .5 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt * 6)) * np.exp(-tt * 5) * g


def sopro(d=.45, g=1.0):
    n = int(d * SR)
    tt = np.arange(n) / SR
    env = np.sin(np.pi * tt / d) ** 2
    return filtro(rng.normal(0, 1, n), lo=500, hi=4000) * env * g


def batida(g=1.0):
    n = int(.6 * SR)
    tt = np.arange(n) / SR
    return np.sin(2 * np.pi * np.cumsum(55 + 40 * np.exp(-tt * 25)) / SR) * np.exp(-tt * 8) * g


def clique(g=1.0, f=2600):
    n = int(.05 * SR)
    tt = np.arange(n) / SR
    return np.sin(2 * np.pi * f * tt) * np.exp(-tt * 120) * g


for a in ev["callouts"]:
    soma(efx, a - .12, sopro(.5, .08))
for a, sinal in ev["chips"]:
    if sinal > 0:  # caixa registradora: dois sinos rápidos
        soma(efx, a, sino(1568, .9, .12))
        soma(efx, a + .09, sino(2093, 1.0, .12))
    else:
        soma(efx, a, batida(.35))
        soma(efx, a, clique(.08, 1200))
for a in ev["popups"]:
    soma(efx, a, sino(2637, .25, .025))
for a, b in ev["obras"]:  # obra: estalos metálicos espalhados e um ronco de máquina
    x = a
    while x < b:
        soma(efx, x, clique(.05 + rng.random() * .05, 1800 + rng.random() * 2500))
        x += .18 + rng.random() * .35
    n = int((b - a) * SR)
    tt = np.arange(n) / SR
    ronco = filtro(rng.normal(0, 1, n), lo=60, hi=260) * (1 + .3 * np.sin(2 * np.pi * 9 * tt))
    env = np.minimum(1, tt / .8) * np.minimum(1, (b - a - tt) / .8)
    soma(efx, a, ronco * env * .05)
soma(efx, ev["wipe"][0], sopro(1.1, .14))
soma(efx, ev["botao"], clique(.18, 1500))
soma(efx, ev["botao"] + .05, clique(.12, 2400))

# ---------------- mixagem ----------------
audio = pasta / "audio"


def grava(nome, x, canais=1):
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", str(canais), "-i", "-", str(audio / nome)],
                   input=x.astype(np.float32).tobytes(), check=True)


grava("trilha.wav", trilha / max(1e-6, np.abs(trilha).max()) * .8)
grava("efeitos.wav", efx / max(1e-6, np.abs(efx).max()) * .8)

sem_voz = "--sem-voz" in sys.argv or not (audio / "narracao.wav").exists()
voz = np.zeros(1, np.float32) if sem_voz else np.frombuffer(subprocess.run(
    ["ffmpeg", "-loglevel", "error", "-i", str(audio / "narracao.wav"), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
    capture_output=True, check=True).stdout, np.float32)
v = np.zeros(N)
v[:min(N, len(voz))] = voz[:N]
# abaixa a trilha embaixo da fala (envelope suavizado)
env = np.abs(v)
janela = int(.25 * SR)
env = np.convolve(env, np.ones(janela) / janela, mode="same")
duck = 1 - .45 * np.clip(env / (env.max() * .25), 0, 1) if env.max() > .01 else np.ones(N)
duck = np.convolve(duck, np.ones(janela) / janela, mode="same")
mix = v * 1.0 + trilha / np.abs(trilha).max() * .30 * duck + efx * 1.0
# estéreo leve: trilha com reverb diferente em cada lado não vale o custo; espalha só os efeitos
grava("mix_mono.wav", mix)
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(audio / "mix_mono.wav"), "-af",
                "loudnorm=I=-14:TP=-1.5:LRA=11,aformat=channel_layouts=stereo", "-ar", str(SR), str(audio / "mix.wav")], check=True)
print(f"ok: {DUR:.1f}s")
