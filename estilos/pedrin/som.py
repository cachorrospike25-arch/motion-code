"""Som do PEDRIN: trilha que acompanha a história + efeitos presos aos eventos do motor.

Uso (de dentro de estilos/pedrin): python3 som.py episodios/<slug> [--sem-voz]
Lê tempo.json e eventos.json (gravado pelo capturar.mjs). Se existir audio/narracao.wav, mixa a voz e abaixa a trilha embaixo dela.
Grava audio/trilha.wav, audio/efeitos.wav e audio/mix.wav (48 kHz, estéreo, -14 LUFS).
Seções: rua (violão e batida leve) → clube (energia) → treinador (tensão, batimento) → pergunta (crescendo esperançoso) → fim.
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
DUR = tempo["total"] + 0.5
N = int(DUR * SR)
t = np.arange(N) / SR
rng = np.random.default_rng(11)
audio = pasta / "audio"
audio.mkdir(exist_ok=True)
S = ev["secoes"]
T_CLUBE, T_TREIN, T_PERG = S["clube"], S["treinador"], S["pergunta"]


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


def reverb(x, seg=1.8, mix=.25):
    n = int(seg * SR)
    ir = filtro(rng.normal(0, 1, n) * np.exp(-np.arange(n) / SR * 3.5), hi=6500)
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


def pluck(f, d=1.4, g=1.0):  # violão: harmônicos que decaem (síntese aditiva, rápida)
    n = int(d * SR)
    tt = np.arange(n) / SR
    out = sum(np.sin(2 * np.pi * f * k * tt + k) * np.exp(-tt * (1.3 + k * .9)) / k ** 1.1 for k in range(1, 9))
    return out * np.minimum(1, tt / .004) * g


def pad(fs, d, g=1.0):
    n = int(d * SR)
    tt = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * (1 + k * .002) * tt + k) for f in fs for k in (-1, 1))
    return s * np.minimum(1, tt / .6) * np.minimum(1, (d - tt) / .8) * g / len(fs)


def bumbo(g=1.0):
    n = int(.4 * SR)
    tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * np.cumsum(55 + 100 * np.exp(-tt * 40)) / SR) * np.exp(-tt * 10) + filtro(rng.normal(0, 1, n), hi=1200) * np.exp(-tt * 45) * .4) * g


def caixa(g=1.0):
    n = int(.22 * SR)
    tt = np.arange(n) / SR
    return (filtro(rng.normal(0, 1, n), lo=1500, hi=7000) * np.exp(-tt * 22) + np.sin(2 * np.pi * 190 * tt) * np.exp(-tt * 30) * .5) * g


def chimbal(g=1.0):
    n = int(.06 * SR)
    return filtro(rng.normal(0, 1, n), lo=7000, hi=12000) * np.exp(-np.arange(n) / SR * 80) * g


# ---------------- trilha ----------------
BPM = 100
B = 60 / BPM
PROG = [([48, 55, 64], 40), ([45, 52, 60], 33), ([41, 48, 57], 29), ([43, 50, 59], 31)]  # Dó, Lá m, Fá, Sol (arpejo, baixo)
musica = np.zeros(N)
nivel = np.zeros(N)
for a, b, v in ((0, T_CLUBE, .55), (T_CLUBE, T_TREIN, .85), (T_TREIN, T_PERG, .5), (T_PERG, DUR, 1.0)):
    nivel[(t >= a) & (t < b)] = v
nivel = np.convolve(nivel, np.ones(int(.8 * SR)) / int(.8 * SR), mode="same")

x = 0.0
k = 0
while x < DUR - .2:
    acorde, baixo = PROG[int(x // (4 * B)) % 4]
    passo = k % 8
    sec = 0 if x < T_CLUBE else 1 if x < T_TREIN else 2 if x < T_PERG else 3
    if sec == 2:  # tensão: pedal grave e notas esparsas
        if passo == 0:
            soma(musica, x, pad([hz(36), hz(43), hz(48)], 4 * B, .5))
    else:
        nota = acorde[[0, 1, 2, 1, 2, 1, 0, 1][passo]] + 12
        soma(musica, x, pluck(hz(nota), 1.1, .45 if sec == 0 else .35))
        if passo in (0, 4):
            soma(musica, x, pluck(hz(baixo - 12), 1.3, .6))
        if sec >= 1 and passo % 2 == 0:
            soma(musica, x, bumbo(.5 if passo in (0, 4) else .0))
        if sec >= 1 and passo in (2, 6):
            soma(musica, x, caixa(.35))
        if sec >= 1:
            soma(musica, x, chimbal(.05))
        if sec == 3 and passo == 0:
            soma(musica, x, pad([hz(m + 12) for m in acorde], 4 * B, .7))
        if sec == 0 and passo in (0, 4):
            soma(musica, x, bumbo(.18))
    x += B / 2
    k += 1
musica = reverb(musica, 1.6, .22) * nivel
# crescendo final: subida e acorde
n = int(2.2 * SR)
tt = np.arange(n) / SR
sub = filtro(rng.normal(0, 1, n), lo=400, hi=5000) * (tt / 2.2) ** 2
soma(musica, T_PERG + (ATO["pergunta"]["t1"] - ATO["pergunta"]["t0"]) - 2.4, sub, .35)
soma(musica, ATO["fim"]["t0"], pad([hz(48), hz(60), hz(64), hz(67), hz(72)], 3.4, .9))
musica *= np.minimum(1, t / .5) * np.minimum(1, (DUR - t) / 1.2)

# ---------------- efeitos ----------------
efx = np.zeros(N)
amb = filtro(rng.normal(0, 1, N), lo=150, hi=1400) * .006  # ambiente nunca é zero
amb[t >= T_CLUBE] += filtro(rng.normal(0, 1, int((N - (t < T_CLUBE).sum()))), lo=300, hi=2500) * .012 * (1 + .3 * np.sin(np.arange(int(N - (t < T_CLUBE).sum())) / SR * 1.7))
efx += amb


def chute(g=1.0):
    n = int(.35 * SR)
    tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * np.cumsum(120 + 80 * np.exp(-tt * 50)) / SR) * np.exp(-tt * 18) + filtro(rng.normal(0, 1, n), hi=2500) * np.exp(-tt * 40) * .6) * g


def toque(g=1.0):
    n = int(.12 * SR)
    tt = np.arange(n) / SR
    return np.sin(2 * np.pi * 180 * tt) * np.exp(-tt * 45) * g * .6


def swish(g=1.0):
    n = int(.6 * SR)
    tt = np.arange(n) / SR
    return filtro(rng.normal(0, 1, n), lo=2000, hi=9000) * (np.exp(-tt * 6) * (1 - np.exp(-tt * 60))) * g


def torcida(d=2.4, g=1.0):
    n = int(d * SR)
    tt = np.arange(n) / SR
    return filtro(rng.normal(0, 1, n), lo=300, hi=3500) * (1 + .4 * np.sin(2 * np.pi * 6 * tt)) * np.minimum(1, tt / .3) * np.exp(-tt * .9) * g


def vibra(d=1.2, g=1.0):
    n = int(d * SR)
    tt = np.arange(n) / SR
    return np.sign(np.sin(2 * np.pi * 150 * tt)) * (np.sin(2 * np.pi * 14 * tt) > 0) * .4 * np.minimum(1, (d - tt) / .1) * g


def ding(g=1.0):
    n = int(.8 * SR)
    tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * 1318 * tt) + .6 * np.sin(2 * np.pi * 1760 * tt) * np.exp(-tt * 3)) * np.exp(-tt * 6) * g


def whoosh(d=.35, g=1.0):
    n = int(d * SR)
    tt = np.arange(n) / SR
    r = rng.normal(0, 1, n)
    partes = [filtro(r[i * n // 5:(i + 1) * n // 5], lo=300 + i * 500, hi=1500 + i * 1500) for i in range(5)]
    return np.concatenate(partes) * np.sin(np.pi * tt / d) ** 2 * g


def apito(g=1.0):
    n = int(.7 * SR)
    tt = np.arange(n) / SR
    f = 3100 + 120 * np.sin(2 * np.pi * 28 * tt)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, tt / .02) * np.minimum(1, (.7 - tt) / .08) * g * .5


def coracao(a, b, g=1.0):
    x = a
    while x < b:
        for off, v in ((0, 1.0), (.2, .7)):
            n = int(.22 * SR)
            tt = np.arange(n) / SR
            soma(efx, x + off, np.sin(2 * np.pi * 52 * tt) * np.exp(-tt * 22) * v * g)
        x += .95 - .25 * (x - a) / max(.1, b - a)


def tropeco(g=1.0):
    n = int(.9 * SR)
    tt = np.arange(n) / SR
    f = 900 * np.exp(-tt * 2.2) + 150
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 1.6) * .5
    s[int(.55 * SR):int(.55 * SR) + int(.18 * SR)] += np.sin(2 * np.pi * 70 * tt[:int(.18 * SR)]) * np.exp(-tt[:int(.18 * SR)] * 18)
    return s * g


def bip(f, d=.1, g=1.0):
    n = int(d * SR)
    tt = np.arange(n) / SR
    return np.sin(2 * np.pi * f * tt) * np.exp(-tt * 25) * g


for a in ev["chute"]:
    soma(efx, a, chute(), .9)
for a in ev["toque"]:
    soma(efx, a, toque(), .5)
for a in ev["gol"]:
    soma(efx, a, swish(), .5)
    soma(efx, a + .1, torcida(1.8, .8), .25)
for a in ev["celular"]:
    soma(efx, a, vibra(.28), .25)
for a in ev["msg"]:
    soma(efx, a, ding(), .3)
for a in ev["pulo"]:
    soma(efx, a, toque(), .6)
for a in ev["torcida"]:
    soma(efx, a, torcida(3.5, .6), .25)
for a in ev["whoosh"]:
    soma(efx, a - .12, whoosh(.3), .22)
for a in ev["tropeco"]:
    soma(efx, a, tropeco(), .35)
for a in ev["apito"]:
    soma(efx, a, apito(), .35)
for a in ev["tatica"]:
    soma(efx, a, bip(880, .12), .3)
    soma(efx, a + .12, bip(1320, .16), .3)
for a in ev["seguir"]:
    soma(efx, a, bip(1568, .1), .3)
    soma(efx, a + .08, bip(2093, .14), .3)
coracao(ev["coracao"][0], ev["coracao"][1] - 1.0, .5)

# ---------------- mixagem ----------------
def grava(nome, x):
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-ac", "2", str(audio / nome)], input=x.astype(np.float32).tobytes(), check=True)


musica /= np.abs(musica).max() + 1e-9
efx /= np.abs(efx).max() + 1e-9
grava("trilha.wav", musica * .8)
grava("efeitos.wav", efx * .8)
voz = np.zeros(N)
com_voz = "--sem-voz" not in sys.argv and (audio / "narracao.wav").exists()
if com_voz:
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(audio / "narracao.wav"), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    vv = np.frombuffer(raw, np.float32)
    voz[:min(N, len(vv))] = vv[:N]
env = np.convolve(np.abs(voz), np.ones(int(.25 * SR)) / int(.25 * SR), mode="same")
duck = 1 - .5 * np.clip(env / (env.max() * .25), 0, 1) if com_voz and env.max() > .01 else np.ones(N)
duck = np.convolve(duck, np.ones(int(.25 * SR)) / int(.25 * SR), mode="same")
mix = voz + musica * (.30 if com_voz else .5) * duck + efx * .9
grava("mix_mono.wav", mix)
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(audio / "mix_mono.wav"), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", str(SR), "-ac", "2", str(audio / "mix.wav")], check=True)
(audio / "mix_mono.wav").unlink()
print(f"ok: {DUR:.1f}s {'com' if com_voz else 'sem'} narração")
