#!/usr/bin/env bash
# Lojinha: narração -> desenho quadro a quadro -> trilha e efeitos presos aos eventos -> entrega em prontos/lojinha/<slug>/
# Uso (de dentro de estilos/lojinha): ./fazer.sh episodios/<slug> [--sem-voz]
set -euo pipefail
cd "$(dirname "$0")"
EP="${1%/}"; SLUG="$(basename "$EP")"
[ -d node_modules/@fontsource ] || npm install --silent
[ -d ../../nucleo/2d/node_modules ] || (cd ../../nucleo/2d && npm install --silent)
[[ " $* " == *" --sem-voz "* ]] || python3 ../../nucleo/2d/narrar.py "$EP"
node ../../nucleo/2d/capturar.mjs motor/pagina.html "$EP"
python3 som.py "$EP"
SAI="../../prontos/lojinha/$SLUG"; mkdir -p "$SAI"
NOME="$SLUG"; [ -f "$EP/audio/narracao.wav" ] || NOME="$SLUG-sem-narracao"
ffmpeg -loglevel error -y -i "$EP/$SLUG.mp4" -i "$EP/audio/mix.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "$SAI/$NOME.mp4"
cp "$EP/audio/trilha.wav" "$SAI/${SLUG%%-*}-trilha.wav"; cp "$EP/audio/efeitos.wav" "$SAI/${SLUG%%-*}-efeitos.wav"; cp "$EP/roteiro.json" "$SAI/"
[ -f "$EP/audio/narracao.wav" ] && cp "$EP/audio/narracao.wav" "$SAI/${SLUG%%-*}-narracao.wav"
echo "pronto: $SAI/$NOME.mp4"
