# Lote 2.1 — tentativa interrompida

**REPROVADO E REVERTIDO. Não reaplicar sem nova autorização.**

Leia [RELATORIO.md](RELATORIO.md) e [../BUGS-PRESERVADOS.md](../BUGS-PRESERVADOS.md).

## Evidências

- `antes/`: 72 imagens comparadas exatamente por pixels RGBA com a Fase 0; referências completas de propriedades computadas em JSON gzip; 4.936 estados individuais forçados via CDP, em ambos os temas.
- `depois/`: somente a primeira tela do pós-lote. Pixels iguais; estilos diferentes. A execução foi encerrada antes da matriz pós-lote e das outras 71 capturas.
- `depois/novos-tokens-computados.json`: valores efetivamente lidos apenas no escuro, na tentativa rejeitada. Não existe medição pós-lote clara.
- `tokens-propostos.*`: proposta descartada de 124 tokens. Não é importada pelo aplicativo.
- `mapeamento-bordas.json`: classificação das 171 ocorrências originais; 138 elegíveis, 21 Conta/sync, 12 exclusões (2 globais e 10 cards congelados).
- `originais.json.gz`: bytes dos cinco CSS anteriores, usados na reversão; sem segredos.
- `aplicacao.json`: hashes da tentativa, não do estado atual.
- `reversao-verificada.json`: prova de restauração de todas as fontes da cópia e do original.
- `resumo-final.json`: status agregado da reprovação.

## Tooling preservado para revisão

`gate.cjs` reaproveita o percurso da Fase 0 em memória. Ele mede propriedades CSS normais, tokens anteriores e pseudo-elementos presentes; só admite os nomes novos enumerados na proposta. Em cada estado, apenas um controle é forçado e todos os elementos visíveis são medidos. O delta é calculado contra a referência normal completa, não contra uma lista reduzida de propriedades. A comparação PNG usa RGBA exato, sem tolerância.

`preparar-tokens.cjs`, `aplicar.cjs` e `validar-estatico.cjs` são ferramentas da tentativa. O último não foi executado como aprovação pós-lote, pois o gate já havia falhado e `tokens.css` foi removido. O catálogo de regras protegidas também é conferido antes de qualquer gravação pelo script de aplicação.

**Não executar novamente os modos antes/depois sobre estas pastas:** isso sobrescreveria evidências. Uma eventual tentativa futura deve usar referências e saídas separadas, após decidir como investigar a geração adicional de CSS pelo Tailwind. Não se autorizou mudança de pipeline, baseline, lista de exceções ou tolerância neste lote.

Nenhum lote seguinte foi iniciado. Nenhum arquivo-fonte do aplicativo ficou alterado.
