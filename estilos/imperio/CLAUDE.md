# Império

Simulação 3D de construção e gestão: um terreno vazio vira um empreendimento, sempre no mesmo terreno e na mesma câmera aérea. Interface mínima com caixa, lucro por mês e patrimônio; narrador de documentário; legenda palavra por palavra; trilha cinematográfica em código que cresce com o negócio. Nasceu do pedido "Do zero ao império" (21/11/2026), para Reels, TikTok e Shorts.

## Decisões

- **Formato:** 9:16 (1080×1920, 30 fps). 1:1 e 16:9 ainda não testados (a câmera e o HUD foram compostos para vertical).
- **Motor:** three.js 0.170 no Chromium headless (WebGL por software, SwiftShader), sem Blender. `motor/cena.js` monta o mundo e `quadro(t)` é função pura de t. Cerca de 1,3 s por quadro (≈40 min para 55 s).
- **Visual:** realista de simulador, não brinquedo: texturas procedurais (grama, terra, asfalto, concreto, calçada, reboco, cascalho), sombra suave do sol, tone mapping ACES, ambiente refletido (RoomEnvironment), neblina, vinheta e grão. Pessoas e carros em proporção real, nada cartunesco.
- **Construção sempre animada:** marcação de giz → laje que se espalha → pilares → paredes subindo por plano de corte → andaime que monta de baixo para cima e desmonta de cima para baixo → teto → equipamentos do telhado → toldo → letreiro. Asfalto, faixas, árvores e postes também crescem. Máquinas e operários chegam pela rua e vão embora.
- **Vida:** clientes chegam de carro pela faixa certa (mão brasileira), estacionam em vagas livres, caminham até a loja e voltam; "+R$" sobe na porta a cada venda; tráfego e pedestres o vídeo todo; funcionários na doca e na praça na fase final.
- **Luz:** dia o vídeo inteiro e entardecer no patrimônio final: vitrines, letreiros, postes e faróis acendem.
- **Comparação:** no "tudo começou com" a tela divide: o lado esquerdo é o mesmo quadro renderizado no t=0,2 (mesma câmera), com uma cortina que vai e volta.
- **Finanças coerentes:** patrimônio = caixa + custo das obras (sem valorização). As rampas ficam em `financas()` do `cena.js`; o resumo vai no campo `financas` do roteiro.
- **Voz:** `narrador` do `nucleo/vozes.json` (via `nucleo/2d/narrar.py`).
- **Som:** `som.py` (trilha que segue a linha do tempo, não loop; efeitos lidos do `eventos.json` que o `capturar.mjs` grava; voz por cima com a trilha abaixando embaixo da fala; -14 LUFS).

## Roteiro

`episodios/<NNN-slug>/roteiro.json` no formato do `narrar.py` (atos com `cena`, `dura`, `narracao`). O motor amarra tudo aos ids das cenas: `comeco, investe, obra, abre, lucro, reinveste, expansao, lucro2, salto, movimento, patrimonio, comecou, cta`. Mudar a história de verdade (outro tipo de negócio, outros valores) é mexer em `montar()`, `financas()` e nos textos do HUD.

## Comandos

```
cd estilos/imperio
./fazer.sh episodios/001-do-zero-ao-imperio
node capturar.mjs episodios/001-do-zero-ao-imperio --still 2,14,30,50 /tmp/q   # quadros soltos
node capturar.mjs episodios/001-do-zero-ao-imperio teste.mp4 --de 20 --ate 26  # trecho mudo
```

## Episódios

| Nº | Título | Estado |
|---|---|---|
| 001 | Do zero ao império (loja → expansão → centro comercial, R$ 10.000 → R$ 1.213.500) | em produção |
