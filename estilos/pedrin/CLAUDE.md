# PEDRIN (série)

Série de Reels, TikTok e Shorts com a carreira de um jogador de futebol, **decidida pelos seguidores**. Animação 3D em código (three.js no Chromium headless, sem Blender), vertical 9:16, 40 a 60 s por episódio, narração em primeira pessoa (o próprio Pedrin, voz masculina jovem brasileira), legenda palavra por palavra, trilha e efeitos em código. Nasceu do pedido de 26/11/2026.

## Regras da série (valem para todo episódio)

1. **Todo episódio termina com uma decisão** para os seguidores (comentários ou enquete), dita pelo Pedrin olhando para a câmera.
2. **A escolha vencedora muda o episódio seguinte.** Nunca inventar resultado: só produzir o próximo depois da contagem real dos comentários (registrar em `serie.json`, campo `episodios[n].resultado`).
3. **Continuidade:** cada episódio começa onde o anterior terminou. Pedrin, voz, roupas e tom ficam iguais. Estado da carreira em `serie.json` (`estado`): clube, posição, número, dinheiro, o que está pendente.
4. **Todo episódio fecha pedindo para seguir o perfil** (cartão rosa SEGUE O PERFIL).
5. Clube e jogadores são **fictícios** (Aurora FC); sem marcas nem clubes reais.
6. Estrutura: gancho que prende → acontecimento principal → desenvolvimento → situação inesperada → decisão.

## Visual

- Pedrin (17 anos, ~1,72 m): pele morena, cabelo preto curto, camisa amarela, calção azul. **Descalço, bola de meia e chinelos de trave** na rua; chuteira emprestada (dois números maior) no clube. A camisa **ainda não tem número** (o número será votado).
- **3D cartoon (decidido em 26/11/2026, depois que o primeiro visual "realista" ficou com cara de manequim):** humano articulado com cabeça grande, olhos expressivos, mãos e pés arredondados, sombreado toon (3 tons) e contorno escuro; poses em código (andar, correr, chutar, tocar a bola, comemorar, falar). Cenário com texturas e luz de fim de tarde na rua e manhã clara no clube. Não é fotorrealista.
- Câmeras **relativas ao Pedrin** (`R(...)` em `tomadas()`), cortes rápidos com flash branco, tremido leve nos planos de tensão.
- Telas na imagem: título, lower third, celular (WhatsApp), quadro tático com as três posições, convite para comentar.

## Comandos

```
cd estilos/pedrin
python3 ../lojinha/estimar.py episodios/<slug>             # tempo.json estimado (sem voz); com voz, usar o narrar.py do núcleo
node capturar.mjs episodios/<slug> saida.mp4 --de 0 --ate 25     # renderiza um trecho mudo (duas metades em paralelo)
node capturar.mjs episodios/<slug> --still 2,10,30 /tmp/q        # quadros soltos
python3 som.py episodios/<slug> [--sem-voz]                       # trilha, efeitos e mix
```

## Episódios

| Nº | Título | Decisão | Estado |
|---|---|---|---|
| 001 | O COMEÇO DE UM SONHO | posição: ponta direita, ponta esquerda ou centroavante | renderizado em 26/11/2026, sem narração (voz do Fish recusada, 401); aguardando publicação e votação |
