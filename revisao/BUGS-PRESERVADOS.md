# Bugs preservados — Lote 2.1 reprovado e revertido

**Nenhuma correção aplicada.** O gate interrompeu a tentativa no primeiro estado normal do pós-lote. Todos os arquivos-fonte foram restaurados byte a byte; os comentários CSS inseridos durante a tentativa também foram revertidos. Este documento mantém o catálogo e o texto dos comentários exigidos para uma futura tentativa, que precisa de nova autorização. Não se reaplicaram comentários isoladamente depois da falha.

C01/C02/C03 mantêm os identificadores da auditoria. C04 continua reservado ao achado de !important na auditoria; os bugs adicionais usam C05–C10.


| ID | Referência | Arquivo:linha do baseline | Seletor/token | Comportamento preservado |
| --- | --- | --- | --- | --- |
| C01 | 1.9(a) | src/estilos/controles.css:269; src/estilos/novo-visual.css:63 | .destaque .botao-principal / :root[data-tema] .app .botao-principal:not(:disabled) | Botão escuro recebe #bcec86 sobre destaque #bcec86; razão de superfícies 1,00. Texto permanece legível. |
| C02 | C02 da auditoria | src/estilos/controles.css:69/269 | .app .botao-principal:active:not(:disabled) | A cor pressionada declarada #a9d875 perde para a regra global; comportamento preservado. |
| C03 | 1.9(b) | src/index.css:119; src/estilos/novo-visual.css:94 | .editor-medidas-grupos .medida-vazia strong / .app .campo-medida strong | Adicionar permanece 20px por ordem de carregamento, não 13px. |
| C05 | 1.9(c) | src/estilos/novo-visual.css:91 | .app input:not([type=checkbox]):not([type=radio]) | Borda escura --visual-borda: 1,69:1 contra campo, 1,51:1 contra painel. Não trocada por --superficie-campo-borda. |
| C06 | 1.9(d) | src/estilos/novo-visual.css:51 | .app .navegacao button[aria-current=page] | Pill escuro #253c23 contra barra #17271d: 1,30:1. |
| C07 | 1.9(e) | src/index.css:104 | .confirmar-catalogo | Sobrepõe itens durante rolagem, com z-index:3 e lista sem padding-bottom. Bloqueio do último item não foi reproduzido na auditoria. |
| C08 | 1.9(g) | src/estilos/novo-visual.css:41; inventário da auditoria | .marca small e demais seletores abaixo de 12px | 127 declarações em 8–11px preservadas; zero técnico de ocultação não deve ser elevado indiscriminadamente. |
| C09 | 1.9(h) | src/componentes/EditorFicha.tsx:26; src/componentes/EditorMedida.tsx:28 | .salvar-cabecalho; disabled={salvando}/disabled={ocupado} | Salvar habilitado com formulário vazio é lógica fora do escopo; nenhum componente ou regra de negócio alterado. |
| C10 | Condição adicional de 2.1 | src/estilos/paleta-clara.css; src/estilos/contraste-claro.css; src/estilos/controles.css | --borda-controle-legada-claro / --controle-borda | Unificação #7c8d76 → #6f8560 pendente para a Fase 3. Não fundir cores nem redirecionar --controle-borda. O token novo da tentativa foi removido pela reversão. |

Comentários planejados e usados na tentativa, agora revertidos:

```css
/* BUG-C01: manter até Fase 3 */
/* BUG-C02: manter até Fase 3 */
/* BUG-C03: manter até Fase 3 */
/* BUG-C05: manter até Fase 3 */
/* BUG-C06: manter até Fase 3 */
/* BUG-C07: manter até Fase 3 */
/* BUG-C08: manter até Fase 3 */
/* BUG-C09: manter até Fase 3 */
/* BUG-C10: manter até Fase 3 */
```

## Item 1.9(f): correções existentes do claro preservadas

Status e segmented principais já estavam corrigidos. Não se reintroduziu o diagnóstico antigo. As bordas legadas remanescentes não foram unificadas com #6f8560.

## Duas regras globais mantidas literais por exclusão

Ambas atingem Conta/sync e cards congelados. Seus valores não foram tokenizados na tentativa. O comentário abaixo foi inserido antes de cada regra e revertido junto com todo o lote, por exigência do gate. As regras atuais continuam idênticas ao baseline.

| Arquivo:linha do baseline e atual após reversão | Seletor | Propriedade | Valor | Motivo |
| --- | --- | --- | --- | --- |
| src/estilos/paleta-clara.css:242 | :root[data-tema=claro] .app button:focus-visible, :root[data-tema=claro] .app a:focus-visible | outline | 3px solid #7c8d76 | Global de foco: atinge Conta/sync e cards congelados |
| src/estilos/contraste-claro.css:3 | :root[data-tema=claro] .app :is(input,select,textarea) | border-color | #7c8d76 | Global de campos: atinge Conta/sync e cards congelados |

```css
/* SEM-BASELINE: literal #7c8d76 mantido; tokenizar após aprovação do lote Conta */
```

## Fechamento das 171 ocorrências do Apêndice D

Contagem **da tentativa revertida**, por declaração, excluindo comentários e a definição do token novo:

| Arquivo | Tokenizadas na tentativa | Literais por exclusão | Literais Conta/sync/conflito/revisão | Total original |
| --- | --- | --- | --- | --- |
| src/estilos/paleta-clara.css | 137 | 11 | 21 | 169 |
| src/estilos/contraste-claro.css | 1 | 1 | 0 | 2 |

**138 + 12 + 21 = 171**. As 12 por exclusão são **2 globais + 10 de cards congelados**. Após reversão, o estado efetivo é **0 tokenizadas e 171 literais originais**; nenhum token novo ficou no app.

### Todas as ocorrências preservadas por exclusão

| Arquivo:linha | Seletor | Propriedade | Valor literal | Categoria | Motivo |
| --- | --- | --- | --- | --- | --- |
| src/estilos/paleta-clara.css:10 | :root[data-tema=claro] .app .registro-em-revisao | border-bottom | 1px solid #7c8d76 | literais-conta-sync | Conta/entrada/cadastro/sync/conflito/revisão sem baseline; regra intacta |
| src/estilos/paleta-clara.css:19 | :root[data-tema=claro] .app .opcao-registro-sync | border | 1px solid #7c8d76 | literais-conta-sync | Conta/entrada/cadastro/sync/conflito/revisão sem baseline; regra intacta |
| src/estilos/paleta-clara.css:24 | :root[data-tema=claro] .app .opcao-registro-sync[aria-pressed=true] | border | 2px solid #7c8d76 | literais-conta-sync | Conta/entrada/cadastro/sync/conflito/revisão sem baseline; regra intacta |
| src/estilos/paleta-clara.css:31 | :root[data-tema=claro] .app .marca-escolha-sync | border | 1px solid #7c8d76 | literais-conta-sync | Conta/entrada/cadastro/sync/conflito/revisão sem baseline; regra intacta |
| src/estilos/paleta-clara.css:34 | :root[data-tema=claro] .app .opcao-registro-sync[aria-pressed=true] .marca-escolha-sync | border-color | #7c8d76 | literais-conta-sync | Conta/entrada/cadastro/sync/conflito/revisão sem baseline; regra intacta |
| src/estilos/paleta-clara.css:47 | :root[data-tema=claro] .app .data-versao-sync | border-top | 1px solid #7c8d76 | literais-conta-sync | Conta/entrada/cadastro/sync/conflito/revisão sem baseline; regra intacta |
| src/estilos/paleta-clara.css:61 | :root[data-tema=claro] .app .linha-detalhes-sync | border-bottom | 1px solid #7c8d76 | literais-conta-sync | Conta/entrada/cadastro/sync/conflito/revisão sem baseline; regra intacta |
| src/estilos/paleta-clara.css:74 | :root[data-tema=claro] .app .registro-em-revisao>.confirmar-registro-sync:disabled | border | 1px solid #7c8d76 | literais-conta-sync | Conta/entrada/cadastro/sync/conflito/revisão sem baseline; regra intacta |
| src/estilos/paleta-clara.css:192 | :root[data-tema=claro] .app .estado-sync>.acao-sincronizar | border | 1px solid #7c8d76 | literais-conta-sync | Conta/entrada/cadastro/sync/conflito/revisão sem baseline; regra intacta |
| src/estilos/paleta-clara.css:197 | :root[data-tema=claro] .app .estado-sync>.acao-sincronizar:disabled | border-color | #7c8d76 | literais-conta-sync | Conta/entrada/cadastro/sync/conflito/revisão sem baseline; regra intacta |
| src/estilos/paleta-clara.css:219 | :root[data-tema=claro] .app .interruptor-sync | border | 1px solid #7c8d76 | literais-conta-sync | Conta/entrada/cadastro/sync/conflito/revisão sem baseline; regra intacta |
| src/estilos/paleta-clara.css:223 | :root[data-tema=claro] .app .opcao-sync-automatica>input:checked+.interruptor-sync | border-color | #7c8d76 | literais-conta-sync | Conta/entrada/cadastro/sync/conflito/revisão sem baseline; regra intacta |
| src/estilos/paleta-clara.css:229 | :root[data-tema=claro] .app .opcao-sync-automatica>input:focus-visible+.interruptor-sync | outline | 3px solid #7c8d76 | literais-conta-sync | Conta/entrada/cadastro/sync/conflito/revisão sem baseline; regra intacta |
| src/estilos/paleta-clara.css:232 | :root[data-tema=claro] .app .revisao-sync | border | 1px solid #7c8d76 | literais-conta-sync | Conta/entrada/cadastro/sync/conflito/revisão sem baseline; regra intacta |
| src/estilos/paleta-clara.css:235 | :root[data-tema=claro] .app .comparacao-sync>section | border | 1px solid #7c8d76 | literais-conta-sync | Conta/entrada/cadastro/sync/conflito/revisão sem baseline; regra intacta |
| src/estilos/paleta-clara.css:242 | :root[data-tema=claro] .app button:focus-visible, :root[data-tema=claro] .app a:focus-visible | outline | 3px solid #7c8d76 | literais-por-exclusao | Global de foco: atinge Conta/sync e cards congelados |
| src/estilos/paleta-clara.css:878 | :root[data-tema=claro] .app .foto-card | border | 1px solid #7c8d76 | literais-por-exclusao | Card/preview/compartilhamento congelado |
| src/estilos/paleta-clara.css:883 | :root[data-tema=claro] .app .foto-card:focus-within | outline | 2px solid #7c8d76 | literais-por-exclusao | Card/preview/compartilhamento congelado |
| src/estilos/paleta-clara.css:898 | :root[data-tema=claro] .app .remover-foto-card | border-color | #7c8d76 | literais-por-exclusao | Card/preview/compartilhamento congelado |
| src/estilos/paleta-clara.css:1268 | :root[data-tema=claro] .app .conta-entrada .formulario-conta input | border | 1px solid #7c8d76 | literais-conta-sync | Conta/entrada/cadastro/sync/conflito/revisão sem baseline; regra intacta |
| src/estilos/paleta-clara.css:1275 | :root[data-tema=claro] .app .formulario-conta input:focus-visible | outline | 2px solid #7c8d76 | literais-conta-sync | Conta/entrada/cadastro/sync/conflito/revisão sem baseline; regra intacta |
| src/estilos/paleta-clara.css:1339 | :root[data-tema=claro] .app .conta-rodape | border-top | 1px solid #7c8d76 | literais-conta-sync | Conta/entrada/cadastro/sync/conflito/revisão sem baseline; regra intacta |
| src/estilos/paleta-clara.css:1361 | :root[data-tema=claro] .app .conteudo-config .ajuda-conta | border-top | 1px solid #7c8d76 | literais-conta-sync | Conta/entrada/cadastro/sync/conflito/revisão sem baseline; regra intacta |
| src/estilos/paleta-clara.css:1686 | :root[data-tema=claro] .app .modelos-card>button | border | 1px solid #7c8d76 | literais-por-exclusao | Card/preview/compartilhamento congelado |
| src/estilos/paleta-clara.css:1690 | :root[data-tema=claro] .app .modelos-card>button[aria-pressed=true] | border-color | #7c8d76 | literais-por-exclusao | Card/preview/compartilhamento congelado |
| src/estilos/paleta-clara.css:1703 | :root[data-tema=claro] .app .opcoes-adesivo>button | border | 1px solid #7c8d76 | literais-por-exclusao | Card/preview/compartilhamento congelado |
| src/estilos/paleta-clara.css:1708 | :root[data-tema=claro] .app .opcoes-adesivo>button[aria-pressed=true] | border-color | #7c8d76 | literais-por-exclusao | Card/preview/compartilhamento congelado |
| src/estilos/paleta-clara.css:1714 | :root[data-tema=claro] .app .area-preview-card | border | 1px solid #7c8d76 | literais-por-exclusao | Card/preview/compartilhamento congelado |
| src/estilos/paleta-clara.css:1737 | :root[data-tema=claro] .app .texto-compartilhar>textarea | border | 1px solid #7c8d76 | literais-por-exclusao | Card/preview/compartilhamento congelado |
| src/estilos/paleta-clara.css:1858 | :root[data-tema=claro] .app .aviso-confirmacao-conta | border | 1px solid #7c8d76 | literais-conta-sync | Conta/entrada/cadastro/sync/conflito/revisão sem baseline; regra intacta |
| src/estilos/paleta-clara.css:1859 | :root[data-tema=claro] .app .aviso-confirmacao-conta | border-left | 4px solid #7c8d76 | literais-conta-sync | Conta/entrada/cadastro/sync/conflito/revisão sem baseline; regra intacta |
| src/estilos/paleta-clara.css:1872 | :root[data-tema=claro] .app .campos-adesivo | border | 1px solid #7c8d76 | literais-por-exclusao | Card/preview/compartilhamento congelado |
| src/estilos/contraste-claro.css:3 | :root[data-tema=claro] .app :is(input,select,textarea) | border-color | #7c8d76 | literais-por-exclusao | Global de campos: atinge Conta/sync e cards congelados |
