# Lojinha

Simulador de vida e negócios em 2D: personagens caricatos (cabeção, olhos grandes, expressões exageradas), cenário de desenho com contorno grosso e sombra em meia-lua, interface de jogo com DINHEIRO, ESTOQUE, VENDAS e LUCRO. Narração em segunda pessoa ("você"), legenda palavra por palavra, trilha de desenho animado e efeitos presos a cada ação (caixa registradora, sino da porta, cédulas, clientes). Série: cada episódio termina numa decisão que puxa o próximo. Nasceu do pedido "Você abriu uma loja com apenas R$ 50" (21/11/2026); o vídeo de referência citado no pedido não chegou à sessão, então o visual saiu do texto do pedido.

## Decisões

- **Formato:** 9:16 (1080×1920, 30 fps). 1:1 e 16:9 não testados (cenário e interface compostos para vertical).
- **Motor:** Canvas 2D sobre o `nucleo/2d` (`base.js` + `capturar.mjs`), tudo função de t. `motor/cena.js`: `figura(L, Q)` desenha qualquer personagem a partir da aparência (`L`: pele, cabelo `cacheado|bone|coque|careca|espetado|liso|rabo|longo|topete`, roupa, óculos, bigode, barba, fone, avental, terno) e da pose (`Q`: posição, escala, direção, expressão `feliz|euforico|rindo|surpreso|preocupado|pensativo|sonhador|determinado|neutro`, olhar, braços, passo, pulo); devolve as mãos no mundo para segurar coisas. `mover(t, chaves)` anda com passo automático. Cerca de 0,1 s por quadro (vídeo de 58 s em ~3 min).
- **Mesmo personagem:** o protagonista é `EU` (moletom laranja, cabelo cacheado); `EU_TERNO` é ele no sonho.
- **Finanças:** os números da interface vêm de `montar()` (cada venda soma R$ 5 em dinheiro e vendas, R$ 2 em lucro, tira 1 do estoque). O resumo vai no campo `financas` do roteiro.
- **Fontes:** Lilita One (títulos, números, legenda) e Fredoka (rótulos), do `npm` (`@fontsource`).
- **Voz:** `narrador` do `nucleo/vozes.json` via `nucleo/2d/narrar.py`; `voz_texto` quando a grafia falada difere da legenda ("R$ 50" → "cinquenta reais").
- **Som:** `som.py` (trilha por trecho, não loop; efeitos do `eventos.json`; trilha abaixa embaixo da voz; -14 LUFS; tom de sala para nunca ter silêncio digital). Sem narração, a trilha sobe um pouco.

## Roteiro

`episodios/<NNN-slug>/roteiro.json` no formato do `narrar.py`. O 001 amarra o motor aos ids `gancho, vazia, fornecedor, compra, vitrine, clientes, vendas, esgotou, resultado, olha, final, fim`. Episódio novo com outra história: novo `montar()` e novas funções de cena (o elenco, os objetos e a interface se reaproveitam).

## Comandos

```
cd estilos/lojinha
./fazer.sh episodios/001-loja-com-50-reais            # com voz do Fish
./fazer.sh episodios/001-loja-com-50-reais --sem-voz  # usa o tempo.json que já existe
node ../../nucleo/2d/capturar.mjs motor/pagina.html episodios/001-loja-com-50-reais --still 2,15,30 /tmp/q
```

## Episódios

| Nº | Título | Estado |
|---|---|---|
| 001 | Você abriu uma loja com apenas R$ 50 (10 chaveiros a R$ 3, vendidos a R$ 5: caixa R$ 70, lucro bruto R$ 20; gancho: reinvestir ou guardar?) | entregue sem narração em 9:16 (58,4 s), com falas e tempos; voz do Fish deu 401 |
