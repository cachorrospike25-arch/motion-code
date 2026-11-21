#!/usr/bin/env bash
# Império: narração -> captura 3D -> trilha e efeitos -> vídeo final em prontos/imperio/<slug>/
# Uso (de dentro de estilos/imperio): ./fazer.sh episodios/<slug>
set -euo pipefail
EP="${1%/}"; SLUG="$(basename "$EP")"
[ -d node_modules/three ] || npm install --silent
python3 ../../nucleo/2d/narrar.py "$EP"
node capturar.mjs "$EP" "$EP/audio/video.mp4"
python3 som.py "$EP"
SAI="../../prontos/imperio/$SLUG"; mkdir -p "$SAI"
ffmpeg -loglevel error -y -i "$EP/audio/video.mp4" -i "$EP/audio/mix.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart "$SAI/$SLUG.mp4"
cp "$EP/audio/narracao.wav" "$SAI/$SLUG-voz.wav"; cp "$EP/audio/trilha.wav" "$SAI/$SLUG-trilha.wav"; cp "$EP/roteiro.json" "$SAI/"
echo "pronto: $SAI/$SLUG.mp4"
