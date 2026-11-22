# Lojinha

Simulador de vida e negócios em 2D: personagens caricatos (cabeção, olhos grandes, expressões exageradas), cenário de desenho com contorno grosso e sombra em meia-lua, interface de jogo com DINHEIRO, ESTOQUE, VENDAS e LUCRO. Narração em segunda pessoa ("você"), legenda palavra por palavra, trilha de desenho animado e efeitos presos a cada ação (caixa registradora, sino da porta, cédulas, clientes). Série: cada episódio termina numa decisão que puxa o próximo. Nasceu do pedido "Você abriu uma loja com apenas R$ 50" (21/11/2026); o vídeo de referência citado no pedido não chegou à sessão, então o visual saiu do texto do pedido.

## Decisões

- **Formato:** 9:16 (1080×1920, 30 fps). 1:1 e 16:9 não testados (cenário e interface compostos para vertical).
- **Motor:** Canvas 2D sobre o `nucleo/2d` (`base.js` + `capturar.mjs`), tudo função de t. `motor/lib.js` (biblioteca) + `motor/ep<N>.js` (um por episódio, escolhido por `episodio` no roteiro; `motor/cena.js` só carrega o certo). `figura(L, Q)` desenha qualquer personagem a partir da aparência (`L`: pele, cabelo `cacheado|bone|coque|careca|espetado|liso|rabo|longo|topete`, roupa, óculos, bigode, barba, fone, avental, terno) e da pose (`Q`: posição, escala, direção, expressão `feliz|euforico|rindo|surpreso|preocupado|pensativo|sonhador|determinado|neutro`, olhar, braços, passo, pulo); devolve as mãos no mundo para segurar coisas. `mover(t, chaves)` anda com passo automático. Cerca de 0,1 s por quadro (vídeo de 58 s em ~3 min).
- **Mesmo personagem:** o protagonista é `EU` (moletom laranja, cabelo cacheado); `EU_TERNO` é ele no sonho.
- **Finanças:** os números da interface vêm do `montar` de cada episódio (ep. 1: cada venda soma R$ 5 em dinheiro e vendas, R$ 2 em lucro, tira 1 do estoque; ep. 2: R$ 9 e R$ 4, com o lucro total acumulado do ep. 1). O resumo vai no campo `financas` do roteiro.
- **Fontes:** Lilita One (títulos, números, legenda) e Fredoka (rótulos), do `npm` (`@fontsource`).
- **Voz:** `narrador` do `nucleo/vozes.json` via `nucleo/2d/narrar.py`; `voz_texto` quando a grafia falada difere da legenda ("R$ 50" → "cinquenta reais").
- **Som:** `som.py` (trilha por trecho, não loop; efeitos do `eventos.json`; trilha abaixa embaixo da voz; -14 LUFS; tom de sala para nunca ter silêncio digital). Sem narração, a trilha sobe um pouco.

- **Pedir para seguir:** todo episódio termina com a fala "Segue o perfil para ver o episódio N" e um cartão rosa SEGUE O PERFIL com o @ da conta (a partir do 002; o 001, já publicado, não tem). Também na legenda do post.

## Roteiro

`episodios/<NNN-slug>/roteiro.json` no formato do `narrar.py`. O 001 amarra o motor aos ids `gancho, vazia, fornecedor, compra, vitrine, clientes, vendas, esgotou, resultado, olha, final, fim`. Episódio novo: criar `motor/ep<N>.js` (montar, câmera, interior, cartões, decisão), pôr `"episodio": N` no roteiro e, no `eventos()`, as chaves de som mais `secoes` (onde a música muda; `quieto` = trecho sem bateria). O elenco, os objetos, a interface e a legenda vêm da `lib.js`. Sem voz: `python3 estimar.py episodios/<slug>` gera o `tempo.json` estimado.

## Comandos

```
cd estilos/lojinha
./fazer.sh episodios/001-loja-com-50-reais            # com voz do Fish (ep. 2: episodios/002-reinvestiu-tudo)
./fazer.sh episodios/001-loja-com-50-reais --sem-voz  # usa o tempo.json que já existe
node ../../nucleo/2d/capturar.mjs motor/pagina.html episodios/001-loja-com-50-reais --still 2,15,30 /tmp/q
```

## Episódios

| Nº | Título | Estado |
|---|---|---|
| 001 | Você abriu uma loja com apenas R$ 50 (10 chaveiros a R$ 3, vendidos a R$ 5: caixa R$ 70, lucro bruto R$ 20; gancho: reinvestir ou guardar?) | entregue sem narração em 9:16 (58,4 s), com falas e tempos; voz do Fish deu 401 |
| 002 | Você reinvestiu tudo (R$ 70 → 14 chaveiros premium a R$ 5 → vendidos a R$ 9: R$ 126, lucro do dia R$ 56; edição limitada salva as vendas; gancho: encomenda de 100 por R$ 900 com custo R$ 500 e só R$ 126 no caixa: aceitar ou continuar pequeno?) | entregue sem narração em 9:16 (56,8 s), com falas, tempos e pedido para seguir |
| 003 | Seu melhor amigo pediu fiado (vídeo independente de ~30 s para comentar e marcar amigo: fiado de R$ 100, estoque zera, ele some e enrola; pergunta PODE × NUNCA; escolhido a partir da análise do perfil) | entregue sem narração em 9:16 (29,7 s), com falas, tempos e pedido para seguir |
| 004 | Quem levou os R$ 20? (mistério interativo de ~25 s: 4 suspeitos, câmera de segurança com boné e tênis amarelo, comentar o número; culpado = suspeito 3, revelação no vídeo seguinte; feito para gerar comentário, replay e seguidor) | entregue sem narração em 9:16 (24,7 s), com falas, tempos e gabarito; falta o vídeo da revelação |
| 005 | Você aceitou a encomenda (continua o 002 depois do primeiro voto real, "Aceita": faltam R$ 374 → pede sinal de 50% (R$ 450) → compra R$ 500 → entrega e recebe mais R$ 450 → caixa R$ 526, lucro da encomenda R$ 400; gancho: 2ª loja × loja online) | entregue sem narração em 9:16 (41,6 s), com falas, tempos e pedido para seguir |
