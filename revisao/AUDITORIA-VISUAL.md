# Auditoria visual — cópia isolada — Fase 1

Data: 25/10/2026. **Somente leitura das fontes. Fase 2 não iniciada.**

## Escopo e evidências

Raiz: `C:\Users\breno\Documents\Codex\2026-10-05\ol\outputs\vida-em-dia-novo-visual`.
Baseline: commit `f732e69` — `chore: baseline da cópia visual (Fase 0)`.
Build passou; **278 testes em 46 arquivos passaram**. Capturas: **72**, em 390×844, 36 por tema; índice [baseline/index.html](baseline/index.html). Metadados e exceções em [baseline/README.md](baseline/README.md).

**Entrada/cadastro não têm baseline visual.** O backend permanece deliberadamente desativado pela configuração Vite. Conforme aprovação do usuário, entrada é auditada por leitura de CSS/JSX e por cálculo dos valores declarados, sem habilitar backend nem simular tela. Os valores dessa seção **não são estilos medidos em renderização**. A Fase 2 exige lote próprio **sem verificação visual**, com aprovação explícita, para qualquer regra que afete `.conta-entrada`, `.formulario-conta`, `.campo-senha` ou `.ajuda-conta`, incluindo dependências globais.

Inventário exaustivo de declarações: [INVENTARIO-VISUAL.json](INVENTARIO-VISUAL.json). Estilos computados e estados: [analise-runtime/resultados.json](analise-runtime/resultados.json). Cada achado abaixo traz arquivo, seletor, evidência, severidade e proposta; os apêndices detalham os inventários por propriedade.

### Método e limites

- PostCSS lê os sete CSS importados por `src/main.tsx`. Estatísticas por arquivo excluem passos de keyframes; o inventário bruto inclui também esses passos.
- Microsoft Edge headless 156.0.4314.42, perfis descartáveis, dados fictícios, rede externa bloqueada. Isso não substitui Safari/iPhone físico, teclado virtual, VoiceOver ou interface autenticada.
- Contraste: sRGB linearizado, luminância relativa, `(Lmaior+0.05)/(Lmenor+0.05)`; texto normal ≥4,5, grande ≥3 (24px ou 18,66px com peso ≥700), UI ≥3. Transparências compostas sobre os ancestrais. Bordas decorativas e controles desabilitados são identificados, não tratados automaticamente como violações WCAG.
- Os JSON iniciais do baseline preservam o registro original; seus números derivados em superfícies `color(srgb …)` não são a fonte normativa do contraste. A Fase 1 recalculou os 72 estados com parser CSS Color 4 corrigido, **sem alterar screenshots ou fontes**: [analise-runtime/percurso](analise-runtime/percurso). Tabelas de contraste usam esse recálculo. Gradientes são assinalados, sem fingir que backgroundColor sozinho representa o fundo; o destaque claro foi calculado também nos dois extremos declarados.
- Regra não exercitada e ausência de classe literal **não provam** código morto. Não se propõe remoção automática de classes dinâmicas, Recharts, telas inacessíveis ou estilos dos cards congelados.
- Capturas são de viewport e abrangem os painéis principais enumerados em `baseline/capturas.json`; não cobrem todas as combinações de dados, erros de rede, recuperação, lixeira com conteúdo e gráficos históricos. As tabelas cobrem todos os pares distintos extraídos dos elementos visíveis desse percurso; não se afirma cobertura universal de toda condição futura.

## 1.1 Arquitetura de tema

**T01 — média.** Arquivos: `src/App.tsx:54`, `src/dados/modelos.ts:73`, `src/dados/configuracoes.ts:9`; seletor/atributo: `html[data-tema]`. Evidência: `document.documentElement.dataset.tema = configVisual?.tema ?? 'escuro'`; tipo `'escuro' | 'claro'`, configuração inicial `tema: 'escuro'`. O atributo é aplicado ao elemento raiz por useLayoutEffect e persistido em Dexie; botão do cabeçalho e Configurações atualizam o mesmo registro. Proposta: documentar esse contrato e centralizar os bindings CSS, sem alterar JS.

**T02 — alta para migração.** Arquivos: `novo-visual.css:2`, `controles.css` e `superficies.css:2`; seletores: `:root`, `[data-tema=claro]`, `:root[data-tema]`. Não existe bloco explícito `[data-tema=escuro]`. Escuro usa defaults; claro sobrescreve em quatro arquivos. Sem atributo, os tokens continuam escuros, mas regras `:root[data-tema]` deixam de corresponder: o botão do destaque passa de lima para fundo escuro na medição complementar. Portanto “sem atributo = escuro” é verdadeiro para a paleta-base, **não para todo estado renderizado**. Proposta: capturar esse caso como contrato antes de normalizá-lo; corrigir diferenças só após aprovação, não como refatoração invisível.

Ordem efetiva em `src/main.tsx:4–10`:
1. `index.css`: Tailwind e CSS legado de todos os domínios.
2. `controles.css`: tokens e regras compartilhadas, depois sobrescritas com alta especificidade.
3. `novo-visual.css`: paleta, layout, componentes e remendos posteriores.
4. `paleta-clara.css`: 551 regras geradas, prefixadas para claro.
5. `contraste-claro.css`: correções adicionais, inclusive !important.
6. `superficies.css`: superfícies, controles pontuais e novas correções claras.
7. `transicoes.css`: posicionamento do main; movimentos estão no hook.

**T03 — média.** Arquivos/seletor: `controles.css`, `:root`. Evidência: `--controle-superficie: #203123` depois `#263e2b`; borda `#3d553e` depois `#58764d`; texto `#c7ddbe` depois `#e5f1de`. Proposta: uma definição final por papel/tema; preservar valores efetivos, não ressuscitar os primeiros.

**T04 — média.** Arquivo `src/index.css:70`; seletor `.formulario-conta input`; evidência `border:1px solid var(--borda)`. `--borda` nunca é definido nos CSS/JS do app. A declaração é inválida quando usada sem outra definição; regras posteriores podem mascarar a ausência. Proposta: registrar correção para Fase 3; não definir token silenciosamente porque pode criar uma borda hoje ausente.

`--reserva-acoes` não é erro: definido em runtime por `src/hooks/useReservaAcoes.ts:11`, no contêiner do treino; há fallback `65px` em `superficies.css:113`. Nenhum token definido ficou sem referência no escopo analisado. Variáveis exclusivas do claro ficam vazias no escuro, mas seus consumidores também são restritos ao claro. Valores finais de todos os tokens e definições repetidas estão no Apêndice A.

## 1.2 Cascata e especificidade

**C01 — alta.** `controles.css:269`, `:root[data-tema] .app .botao-principal:not(:disabled)`; evidência `background:var(--controle-destaque)`. Especificidade (0,5,0), contra (0,3,0) de `.app .destaque .botao-principal`. Resultado medido: botão e card escuros ambos `rgb(188, 236, 134)`. Proposta: na Fase 2 preservar esse resultado atual por variante explícita; só a Fase 3 poderá torná-lo escuro.

**C02 — média.** `controles.css:69` e `:269`; seletores `.app .botao-principal:active:not(:disabled)` e regra global acima. Evidência: pressionado declarado `#a9d875`, computado `rgb(188, 236, 134)` em ambos os temas; hover também sem diferença no principal. Proposta: eliminar conflito preservando o comportamento atual na Fase 2; redesenhar feedback na Fase 3 se aprovado.

**C03 — média.** `index.css:119` / `novo-visual.css:94`; seletores `.editor-medidas-grupos .medida-vazia strong` e `.app .campo-medida strong`; ambos (0,2,1), valores 13px e 20px. Último vence; ambos os temas medidos em 20px. Proposta: variante vazia explícita, inicialmente com 20px para manter baseline; redução só após aprovação.

O inventário encontrou **97 substituições exatas por propriedade** (mesmo seletor, importância e contexto), não uma contagem completa de toda declaração morta por seletores distintos. Apêndice B registra cada par e a propriedade. Pares de valores diferentes são também listados como conflitos dependentes da ordem. Casos mais específicos confirmados por runtime, como C01/C02, são adicionais a esse conjunto.

Há **697 regras com `:root[data-tema…]`**: 99 genéricas e 598 claras. Há **4 declarações !important** e **29 regras contendo :not()**; três têm duas ocorrências, inclusive filtros semânticos legítimos de input. Não tratar toda ocorrência de :not como erro. Lista completa no Apêndice C.

**C04 — média.** `contraste-claro.css:10–11`, seletores `.recharts-default-tooltip` e `.recharts-tooltip-item`: três !important para vencer estilo gerado/inline da biblioteca. `index.css:12`, `@media(prefers-reduced-motion:reduce) *`: quarto !important, de `scroll-behavior:auto`, com justificativa de acessibilidade. Proposta: preservar este último; isolar os de Recharts até lote específico com gráficos reais.

## 1.3 Cores

Inventário: **1.274 declarações com cores literais fora dos tokens**, agrupadas por componente no Apêndice D, com arquivo, linha, seletor, propriedade, valor literal e tokens com valor equivalente. Isso inclui gradientes, sombras, alpha e color-mix; não significa 1.274 cores únicas. Equivalência literal é candidata a reutilização, não prova de equivalência semântica.

**CO01 — média.** `index.css`, `.lista-catalogo .miniatura-exercicio`: `linear-gradient(145deg,#293c24,#1a2a20)`; `novo-visual.css`, `.destaque`: `#bcec86`; `contraste-claro.css`, `.destaque`: gradiente próprio. Papéis espalhados em vários arquivos. Proposta: tokens de superfície, destaque, status, borda e estado por função; nunca unificar só porque dois hex são parecidos.

Foram encontrados **881 pares** de hex com mesma opacidade e diferença máxima de 1–2 unidades por canal RGB. Exemplos: `#304235` / `#304236`, `#e1f6cb` / `#e1f5cc`. Lista completa e grafias equivalentes no Apêndice E. **Não arredondar ou fundir valores na Fase 2**: mesmo diferença pequena pode mudar pixels; aliases distintos podem preservar a semântica até decisão da Fase 3.

## 1.4 Tipografia e espaçamento

**TE01 — média.** `novo-visual.css`: `.marca small` 8px, `.selo-previa` 9px, `.app .linha-data` 10px; `index.css`: dezenas de legendas 10/11px. Lista integral por valor no Apêndice F. São **127 declarações em 8–11px**, além de uma declaração `font-size:0` usada para ocultar um rótulo. Fontes pequenas não violam WCAG por tamanho isoladamente, mas contrariam o mínimo de 12px desejado no projeto. Proposta: aliases da escala atual na Fase 2; aumento só na Fase 3.

Proposta de escala sem perda: manter tokens para todos os tamanhos efetivamente usados (8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,29,30,36,52,56px), mais os dois clamp e o zero técnico. Uma escala reduzida 12/13/14/16/18/20/24/30/52 é proposta de **redesign da Fase 3**, não migração sem diferença.

**TE02 — baixa.** Sete arquivos, propriedades `padding/gap/border-radius/height/min-height`: **1.177 declarações** inventariadas; agrupamento integral por propriedade/valor no Apêndice G. Tokens recomendados para 4/6/8/10/12/14/16/18/20/24px de espaçamento, raios 10/12/14/16/18/22/24px e controles 44/48px. Conservar exceções e expressões env()/calc() sem conversão durante a migração.

**TE03 — média.** `index.css` / `novo-visual.css`, `.menu-serie`: alvo medido 32×48px. `superficies.css`, `.alca-painel`: 388×26px. A alça tem alternativa Fechar de 44px e também responde ao teclado, mas fica abaixo da meta de toque de 44×44. Checkbox 22×22 dentro de label acionável e input 1×1 visualmente oculto **não são automaticamente alvos efetivos pequenos**. Medições brutas e exceções no Apêndice H. Proposta: aumentar áreas acionáveis apenas na Fase 3 e comparar novamente a geometria.

## 1.5 Código morto e divergência CSS vs JSX

**M01 — média.** Inventário de classes: 36 nomes CSS sem ocorrência literal correspondente nas fontes JS/JSX, listados no Apêndice I. Há falsos positivos conhecidos: classes Recharts são geradas pela biblioteca e `preview-adesivo-escura` é composição dinâmica; classes antigas de adesivos podem pertencer a layouts congelados. Proposta: nenhum delete baseado só nessa lista; cruzar JSX dinâmico, rotas e evidência de uso por tema.

Classes JSX sem regra própria e fragmentos de template estão separados no mesmo apêndice. `amostra-` e `preview-adesivo-` são fragmentos, não classes finais. `instalado`, `nao-instalado`, `rolar`, `digitar` e `peso` podem ser marcadores sem estilo exclusivo; isso não é, isoladamente, defeito.

**M02 — média.** `GraficoCarga.tsx:4` / `GraficoAtividade.tsx:5`: objetos `tick` com fill e fontSize 9/10; `contentStyle` com background e border; apresentação SVG com stroke fixo. Um único atributo JSX `style={{}}` direto foi encontrado: `RevisarDuplicatas.tsx:35`, `whiteSpace:'pre-line'`, sem cor/borda/tamanho. Objetos e atributos visuais completos no Apêndice J. Proposta: manter JSX intacto conforme escopo; tratar estilos gerados por biblioteca em lote CSS próprio, sem prometer tokenização completa de cores declaradas em JS.

**M03 — baixa para refatoração, comportamento a preservar.** `useTransicaoSuave.ts:11–24`: Web Animations, opacidade 0.72→1 e deslocamento ±20px em 260ms; internas 0.85→1 em 220ms. Verifica reduced-motion e cancela ao mudar a preferência e no cleanup. `Painel.tsx:6–28`: translateY direto durante arrasto e overflow do body; gesto acompanha o dedo, não animação automática. `Rolagem.tsx:21/45`: posicionamento via requestAnimationFrame e smooth condicionado à preferência. `ModoTreino.tsx:138`: scrollIntoView condicionado. `useReservaAcoes.ts:11`: custom property dinâmica e ResizeObserver. Esses efeitos não devem ser movidos ou “otimizados” como parte de CSS sem autorização de lógica.

Renderizadores `renderCardAprovado.ts` e `imagensCardAprovado.ts`, Tipográfico/Foto/Editorial e seus contratos ficam congelados. Hashes preservados; inventariar cores não autoriza alterar exports nem previews.

## 1.6 Acessibilidade visual

### Contraste efetivo após cascata

Foram extraídas **303 combinações distintas de texto/fundo** com texto real e **67 combinações de borda/fundo de controles**, nos 72 estados. Nas amostras de texto em fundo sólido, nenhum texto habilitado medido ficou abaixo do limite aplicável. Isso não inclui entrada autenticada nem todos os gráficos/dados. Resultados completos no Apêndice K e JSON de origem; gradientes e isenções são marcados.

Tabela dos principais limites/estados (medidos, não declarações escolhidas manualmente):

| Tema | Par | Cor efetiva | Fundo efetivo | Razão | Meta | Resultado |
| --- | --- | --- | --- | --- | --- | --- |
| escuro | Input: texto × fundo | rgb(237, 243, 237) | rgb(16, 28, 21) | 15.55:1 | 4.5 | passa |
| escuro | Input: placeholder composto × fundo | rgb(127, 136, 129) | rgb(16, 28, 21) | 4.79:1 | 4.5 | passa |
| escuro | Input: borda × campo | rgb(48, 69, 54) | rgb(16, 28, 21) | 1.69:1 | 3 | abaixo da meta |
| escuro | Input: borda × painel | rgb(48, 69, 54) | #17271d | 1.51:1 | 3 | abaixo da meta |
| escuro | Nav: pill ativo × barra | rgb(37, 60, 35) | rgb(23, 39, 29) | 1.30:1 | 3 | abaixo da meta |
| escuro | Segmented: ativo × trilho | rgb(188, 236, 134) | rgb(16, 28, 21) | 12.91:1 | 3 | passa |
| escuro | Segmented: texto ativo | rgb(25, 45, 24) | rgb(188, 236, 134) | 10.83:1 | 4.5 | passa |
| escuro | Status: ponto × página | rgb(188, 236, 134) | #0f1913 | 13.25:1 | 3 | passa |
| escuro | Checkbox catálogo: borda × card | rgb(104, 129, 111) | #17271d | 3.69:1 | 3 | passa |
| escuro | Checkbox selecionado: preenchimento × card | rgb(188, 236, 134) | #17271d | 11.52:1 | 3 | passa |
| escuro | Aviso visitante: texto × fundo | rgb(173, 193, 176) | rgb(37, 60, 35) | 6.31:1 | 4.5 | passa |
| escuro | Adicionar desabilitado: texto × fundo | rgb(143, 163, 148) | rgb(41, 59, 46) | 4.45:1 | isento | não exigir AA |
| escuro | Erro: texto × fundo | rgb(255, 215, 199) | rgb(71, 40, 34) | 9.91:1 | 4.5 | passa |
| claro | Input: texto × fundo | rgb(32, 55, 31) | rgb(229, 237, 220) | 10.74:1 | 4.5 | passa |
| claro | Input: placeholder composto × fundo | rgb(89, 108, 85) | rgb(229, 237, 220) | 4.72:1 | 4.5 | passa |
| claro | Input: borda × campo | rgb(111, 133, 96) | rgb(229, 237, 220) | 3.36:1 | 3 | passa |
| claro | Input: borda × painel | rgb(111, 133, 96) | #f8f7ee | 3.76:1 | 3 | passa |
| claro | Nav: pill ativo × barra | rgb(49, 91, 36) | rgb(220, 231, 207) | 6.17:1 | 3 | passa |
| claro | Segmented: ativo × trilho | rgb(49, 91, 36) | rgb(220, 233, 205) | 6.25:1 | 3 | passa |
| claro | Segmented: texto ativo | rgb(248, 247, 238) | rgb(49, 91, 36) | 7.36:1 | 4.5 | passa |
| claro | Status: ponto × página | rgb(47, 122, 36) | #e7ebdd | 4.41:1 | 3 | passa |
| claro | Checkbox catálogo: borda × card | rgb(124, 141, 118) | #f8f7ee | 3.29:1 | 3 | passa |
| claro | Checkbox selecionado: preenchimento × card | rgb(188, 236, 134) | #f8f7ee | 1.26:1 | 3 | abaixo da meta |
| claro | Aviso visitante: texto × fundo | rgb(65, 85, 53) | rgb(219, 231, 201) | 6.32:1 | 4.5 | passa |
| claro | Adicionar desabilitado: texto × fundo | rgb(71, 93, 64) | rgb(214, 231, 193) | 5.52:1 | isento | não exigir AA |
| claro | Erro: texto × fundo | rgb(150, 62, 50) | rgb(255, 240, 234) | 6.24:1 | 4.5 | passa |

O preenchimento do checkbox claro selecionado tem baixo contraste com o card, mas há borda e número como indicadores alternativos; a baixa razão do preenchimento isolado não basta para afirmar falha WCAG do controle inteiro. O contraste 1,00 do botão no destaque escuro é **fundo do botão × card**, não texto × botão: o texto continua legível.

O destaque claro tem gradiente `#c9eb8f`→`#aedb72`; texto principal `#1b3615`: 9.94:1 / 8.31:1; texto de apoio `#28431e`: 8.25:1 / 6.89:1. Estes cálculos são pelos extremos declarados; não substituem amostragem de cada pixel do gradiente/sombra/antialiasing.

### Entrada/cadastro: cálculo somente por CSS, sem baseline visual

Premissas explícitas de cascata: app usa os tokens do tema; o seletor global de input com dois :not() vence as declarações de cor/fundo de input da entrada; a regra específica da entrada mantém a espessura de borda 1px. Placeholders de conta usam `#7f9285`; no claro, a regra mais específica de `paleta-clara.css:1271` mantém `var(--visual-suave)` (`#475d40`), apesar de `contraste-claro.css:2` declarar `#596c55`. Rótulos de entrada têm `#d3dfd6` no legado; regra gerada clara usa a paleta clara. Não houve montagem de JSX ou backend para confirmar.

| Tema | Par hipotético do fluxo de entrada | Valores CSS usados | Razão | Verificação |
| --- | --- | --- | --- | --- |
| escuro | Texto input | #edf3ed / #101c15 | 15.55:1 | somente CSS |
| escuro | Placeholder conta | #7f9285 / #101c15 | 5.30:1 | somente CSS |
| escuro | Borda input / campo | #304536 / #101c15 | 1.69:1 | somente CSS |
| escuro | Label entrada / painel | #d3dfd6 / #17271d | 11.38:1 | somente CSS |
| claro | Label entrada / painel | #20371f / #f8f7ee | 12.00:1 | somente CSS |
| claro | Ajuda / painel | #475d40 / #f8f7ee | 6.72:1 | somente CSS |
| escuro | Ajuda / painel | #8fa698 / #17271d | 6.01:1 | somente CSS |
| claro | Texto input | #20371f / #e5eddc | 10.74:1 | somente CSS |
| claro | Placeholder conta | #475d40 / #e5eddc | 6.01:1 | somente CSS |
| claro | Borda input / campo | #6f8560 / #e5eddc | 3.36:1 | somente CSS |

**AC01 — alta.** `novo-visual.css:91`, `.app input:not([type=checkbox]):not([type=radio])`: borda escura abaixo de 3 contra campo e painel. Proposta: trocar por papel de borda de campo na Fase 3; não nesta reorganização.

### Estados


| Componente | hover | active | focus-visible | disabled | selected | erro |
| --- | --- | --- | --- | --- | --- | --- |
| Principal/Salvar/Adicionar | sem diferença medida | declarado, mas sobrescrito | 2px visível, medido | tratamento próprio, medido | não se aplica | mensagem de formulário separada |
| Secundário | há borda hover declarada; conflita com contrato global | há cor pressionada declarada; prioridade requer revisão | regra compartilhada | regra compartilhada | não se aplica | não se aplica |
| Segmented | sem tratamento exclusivo universal | herda regras locais/gerais; não contrato único | regra compartilhada | sem contrato específico universal | aria-pressed/aria-selected com cores próprias | não se aplica |
| Navegação inferior | sem contrato exclusivo | sem contrato exclusivo | global de botão | não é estado oferecido no fluxo | aria-current com pill | não se aplica |
| Catálogo | sem contrato exclusivo | sem contrato exclusivo | global de botão | opacity genérica quando ocupado | aria-pressed + marcador | mensagem separada |
| Campos | sem contrato exclusivo | não se aplica | global input-com-unidade ou foco nativo | herança/opacidade conforme formulário | não se aplica | p.erro; borda inválida não tem contrato único |
| Entrada/cadastro | somente inspeção | somente inspeção | regras gerais, não medido | ocupado/controlado por JSX | mostrar senha aria-pressed | mensagem erro JSX, não medido |

Ausência de hover próprio não é falha automática WCAG nem obrigação de adicionar um estado sem função. As lacunas relevantes são feedback perdido, foco com contraste insuficiente em contextos específicos e ausência de um contrato previsível. Apêndice L contém os estados computados de Salvar; o foco de teclado foi exercitado por Tab/Shift+Tab.

### Preferências, áreas seguras e fonte a 200%

- `prefers-reduced-motion`: presente no CSS legado, controles e novo visual; hook principal verifica e acompanha mudanças. Gráficos declarados com `isAnimationActive={false}`. Nenhuma mudança nesses efeitos autorizada.
- `prefers-color-scheme`: **não encontrado** nos CSS/JS do app. Tema é escolhido pela configuração, não pelo sistema. Adotar automaticamente a preferência do sistema mudaria o comportamento atual; depende de decisão explícita. Em Fase 2, manter escuro como fallback.
- Safe area: `env(safe-area-inset-top)` no app/entrada, `env(safe-area-inset-bottom)` em navegação, modais e rodapés. Lista de declarações e media queries no Apêndice M. Edge desktop emula viewport, não o notch nem as barras do Safari; não há homologação física dessas áreas.
- **AC02 — média.** `novo-visual.css`, `.app .navegacao button`, e cabeçalho: aproximação de aumento de fonte por elemento em 200% gerou rótulos adjacentes visualmente sobrepostos na navegação e cabeçalho muito mais alto. Evidência: [claro-fonte-200-aproximacao.png](analise-runtime/claro-fonte-200-aproximacao.png) / [escuro](analise-runtime/escuro-fonte-200-aproximacao.png). Não houve overflow horizontal próprio dos botões detectado, mas isso não impede texto de um botão invadir o seguinte. **Não é teste de zoom nativo do Safari**. Proposta: revisar reflow/limites de texto na Fase 3 e validar zoom nativo em aparelho.

## 1.7 Inconsistências entre temas e telas

**I01 — média.** `novo-visual.css` / `contraste-claro.css`, `.destaque .botao-principal`: claro tem botão escuro em gradiente; escuro tem botão lima no card lima. Resultado não simétrico causado pela cascata, não por variante documentada. Proposta: explicitar ambas as aparências vigentes na migração; decisão visual separada.

**I02 — baixa.** `superficies.css` / `novo-visual.css`, `.marca small`, `.selo-previa`, `.linha-data`: claro tem 12px por correção recente, escuro mantém 8/9/10px. Proposta: preservar os dois tamanhos por tema na Fase 2; eventual unificação mínima 12px depende da Fase 3.

**I03 — média.** `novo-visual.css:91` / `superficies.css:135`, inputs: escuro usa borda de superfície, claro usa borda de controle. Campos numéricos `.campo-medida` usam a borda de campo nos dois temas; inputs digitáveis não seguem esse contrato no escuro. Proposta: mapear os papéis distintos atuais primeiro e corrigir apenas com aprovação.

**I04 — média.** `index.css`, `.selecionar-exercicio[aria-pressed=true]`, e `novo-visual.css`, `.app :is(.item-catalogo,.selecionar-exercicio)`: fundo selecionado legado perde para painel da cópia; o marcador permanece como indicador. Proposta: variante explícita preservando seleção pelo marcador; não reintroduzir fundo legado por acidente.

**I05 — baixa.** `index.css`, `.lembrete-medidas button`, versus `controles.css`, `.botao-principal`: funções semelhantes usam contratos diferentes; o primeiro não tem a classe compartilhada. Como JSX não pode mudar, a Fase 2 deve preservar seletor e medidas próprios via CSS; padronização de aparência fica para Fase 3.

## 1.8 Tamanho e desempenho


| Arquivo | Bytes | Gzip isolado | Regras | Seletores |
| --- | --- | --- | --- | --- |
| src/index.css | 91500 | 18210 | 1020 | 1059 |
| src/estilos/controles.css | 20162 | 4480 | 153 | 169 |
| src/estilos/novo-visual.css | 21879 | 4812 | 197 | 210 |
| src/estilos/paleta-clara.css | 58993 | 5502 | 551 | 569 |
| src/estilos/contraste-claro.css | 3854 | 1065 | 37 | 40 |
| src/estilos/superficies.css | 12344 | 2861 | 88 | 89 |
| src/estilos/transicoes.css | 133 | 134 | 1 | 1 |

Total de fontes: **208.865 bytes**, **2.047 regras**, **2.137 seletores**. Bundle final: valores exatos em `baseline/validacao.json`; Vite informa 198,59 kB / gzip 33,65 kB. A soma de gzip por arquivo não equivale ao gzip do bundle. `paleta-clara.css` representa 58.993 bytes / 551 regras, muitas derivadas de cores legadas que os contratos posteriores já substituem.

**P01 — média.** Os estilos são importados pelo entrypoint; o CSS de configuração, conta e telas secundárias não acompanha a divisão lazy de JS. Proposta: separar responsabilidades primeiro, sem introduzir carregamento condicional nesta fase. Divisão lazy muda FOUC/ordem e precisa de lote próprio e comparação visual.

**P02 — baixa.** A cobertura CDP do baseline retornou lista vazia com os estilos inline injetados pelo Vite; não se inventou percentual de cobertura. Varredura CSSOM complementar de presença de seletores encontrou 305 entradas correspondentes no escuro e 441 no claro, num mapa de 2.008 entradas únicas por seletor/stylesheet. Não equivalem a regras que vencem a cascata nem cobrem todos os caminhos. Bytes de regras não observadas são apenas candidatos, não economia comprovada. Dados completos em `resultados.json`, `themes.*.cssUsage`.

Sugestão de divisão: tokens; base/layout; cabeçalho; navegação; controles; formulários; painéis; catálogo; fichas/treino; medidas; cardio; configurações/privacidade; conta isolada; integração Recharts; estilos congelados isolados. Sem carregar/descarregar dinamicamente agora.

## 1.9 Problemas já conhecidos — confirmação no estado atual


| Item | Estado | Arquivo / seletor / evidência | Severidade | Proposta |
| --- | --- | --- | --- | --- |
| a | confirmado | controles.css:269 vence novo-visual.css; .destaque .botao-principal: fundo #bcec86 sobre card #bcec86 = 1,00:1; texto separado passa | média | Preservar na Fase 2; corrigir contraste de superfícies só na Fase 3 |
| b | confirmado nos dois temas | index.css:119 .medida-vazia strong 13px perde para novo-visual.css:94 .app .campo-medida strong 20px | média | Variante explícita, sem redução não aprovada |
| c | confirmado no escuro | novo-visual.css:91 input: #304536 / #101c15 = 1,69; contra #17271d = 1,51 | alta | Fase 3: usar papel --superficie-campo-borda; conferir os dois lados |
| d | confirmado no escuro | novo-visual.css .navegacao button[aria-current=page]: #253c23 / #17271d = 1,30 | média | Preservar na Fase 2; estado mais distinto na Fase 3 |
| e | sobreposição confirmada; bloqueio final não reproduzido | index.css:104 .confirmar-catalogo sticky, z-index:3; lista padding-bottom:0; dois itens atrás da barra no viewport intermediário; último item ficou acima da barra ao rolar ao final | média | Fase 3: reserva/fluxo da barra e opacidade, sem mexer em lógica de catálogo |
| f | corrigido nos componentes principais; não repetir diagnóstico antigo | superficies.css:118+; status claro 4,41:1 contra página, segmented ativo/trilho 6,25, borda input/campo 3,36 e painel 3,76. Checkbox preserva borda própria e seleção por número | baixa / histórico | Manter os valores atuais e auditar exceções específicas; não reaplicar correção antiga indiscriminadamente |
| g | confirmado | Apêndice F: 127 declarações de 8–11px, mais zero técnico; gráficos em JSX também 9/10px | média | Não alterar escala na Fase 2; definir correções depois |
| h | confirmado | EditorFicha.tsx:26 disabled={salvando}; EditorMedida.tsx:28 disabled={ocupado}; formulários vazios mostram Salvar habilitado; validação ocorre ao enviar | baixa / fora de escopo | Somente registrar: lógica não será alterada |

## Etapas propostas — aguardam aprovação

Nenhuma etapa abaixo foi executada. Cada lote exige commit descritivo, sem push, comparação 390×844 nos dois temas, mesmas fixtures/data e **diff de pixels**; diferenças fora de áreas dinâmicas previamente enumeradas interrompem o lote. Não usar tolerância para esconder mudança de cor/espessura/fonte. Hoje o baseline estático permite comparação determinística; relógio, IDs e dados devem permanecer controlados.


| Lote | Conteúdo | Risco | Critério / dependência |
| --- | --- | --- | --- |
| 2.1 | Mapa semântico e tokens novos com aliases de compatibilidade; paletas explícitas claro/escuro; escala fiel aos valores atuais | médio | Não mudar hex, medidas, default ou política de sistema; referências antigas podem permanecer até seu consumidor migrar |
| 2.2 | Extrair cabeçalho, navegação e destaque, preservando inclusive discrepâncias atuais | médio | Capturas idênticas; não corrigir pill nem botão lima nesta fase |
| 2.3 | Extrair catálogo/fichas e seus estados, mantendo geometria da barra e da seleção | médio | Capturas com/sem seleção e rolagem; sem padronização de padding aprovada só implicitamente |
| 2.4 | Extrair controles, painéis, treino e medidas, em sublotes separados | alto | Regra global só migra quando todos os consumidores estiverem cobertos; preservar campos vazios em 20px |
| 2.Conta | Conta/entrada/cadastro e dependências globais — SEM VERIFICAÇÃO VISUAL | alto | Exige aprovação explícita própria; preservar valores, ordem, especificidade e condições. Mover bloco sem mudança de contexto pode preservar valores por construção, mas não se certifica renderização sem baseline |
| 2.5 | Consolidar ordem de carregamento e, se seguro, introduzir @layer; remover só declarações comprovadamente substituídas | alto | CSS não layerizado vence CSS em layer. Não introduzir layers por componente mantendo remendos globais não layerizados. Preservar ordem relativa do Tailwind e da integração Recharts; avaliar diff do bundle/capturas |
| 2.6 | Limpeza final de candidatos comprovados, documentação e medição de peso | médio | Nenhuma remoção só por ausência em screenshot; revalidar build/testes e hashes congelados |
| 3 | Correções visuais/AA, fontes, áreas de toque e lógica visual aprovada por item | variável | Fora desta execução; cada mudança visível depende da aprovação do usuário. Lógica Salvar continua fora de escopo |

### Ajustes à arquitetura-alvo proposta

1. Manter escala de compatibilidade completa antes de propor uma escala menor. Consolidar 8/9/10/11px para 12px mudaria baseline.
2. Não interpretar “simétrico” como cores iguais ou mesma estratégia estética: tokens de ambos os temas devem descrever seus resultados atuais, inclusive defeitos. Tokens exclusivos de tema recebem bindings explícitos quando seus consumidores migrarem, sem mudar o tema sem atributo.
3. Não ativar prefers-color-scheme automaticamente: app hoje escolhe tema em configuração. Essa mudança de política requer decisão da Fase 3.
4. Introduzir @layer só depois de mapear o CSS legado/Tailwind e verificar um corte controlado de prioridade. Dividir arquivos preservando a ordem é menos arriscado que layerizar em partes, com metade das regras ainda não layerizadas.
5. Conta fica em lote bloqueado próprio. Até sua aprovação, contratos globais que a afetem mantêm compatibilidade; definir token ausente --borda pode mudar o visual e não é limpeza neutra. A migração por simples deslocamento textual pode conservar os valores **se** mantiver todas as relações de ordem, especificidade, herança e layer; rebaixar especificidade não tem essa garantia.

---

## Apêndice A — tokens: todas as definições e valores efetivos


| Arquivo:linha | Seletor | Token | Valor declarado | Condição |
| --- | --- | --- | --- | --- |
| src/estilos/controles.css:24 | `:root` | `--controle-altura` | `48px` |  |
| src/estilos/controles.css:24 | `:root` | `--controle-raio` | `12px` |  |
| src/estilos/controles.css:24 | `:root` | `--controle-fonte` | `13px` |  |
| src/estilos/controles.css:24 | `:root` | `--controle-destaque` | `#bcec86` |  |
| src/estilos/controles.css:24 | `:root` | `--controle-texto-escuro` | `#192d18` |  |
| src/estilos/controles.css:24 | `:root` | `--controle-superficie` | `#203123` |  |
| src/estilos/controles.css:24 | `:root` | `--controle-borda` | `#3d553e` |  |
| src/estilos/controles.css:24 | `:root` | `--controle-texto` | `#c7ddbe` |  |
| src/estilos/controles.css:144 | `:root` | `--movimento-curto` | `160ms` |  |
| src/estilos/controles.css:144 | `:root` | `--movimento-painel` | `220ms` |  |
| src/estilos/controles.css:245 | `:root` | `--controle-superficie` | `#263e2b` |  |
| src/estilos/controles.css:245 | `:root` | `--controle-borda` | `#58764d` |  |
| src/estilos/controles.css:245 | `:root` | `--controle-texto` | `#e5f1de` |  |
| src/estilos/controles.css:250 | `[data-tema=claro]` | `--controle-destaque` | `#bcec86` |  |
| src/estilos/controles.css:250 | `[data-tema=claro]` | `--controle-texto-escuro` | `#193017` |  |
| src/estilos/controles.css:250 | `[data-tema=claro]` | `--controle-superficie` | `#dce9cd` |  |
| src/estilos/controles.css:250 | `[data-tema=claro]` | `--controle-borda` | `#6f8560` |  |
| src/estilos/controles.css:250 | `[data-tema=claro]` | `--controle-ativo-fundo` | `var(--visual-acento)` |  |
| src/estilos/controles.css:250 | `[data-tema=claro]` | `--controle-ativo-texto` | `#f8f7ee` |  |
| src/estilos/controles.css:250 | `[data-tema=claro]` | `--controle-texto` | `#28431e` |  |
| src/estilos/novo-visual.css:2 | `:root` | `--visual-fundo` | `#0f1913` |  |
| src/estilos/novo-visual.css:2 | `:root` | `--visual-painel` | `#17271d` |  |
| src/estilos/novo-visual.css:2 | `:root` | `--visual-rebaixo` | `#101c15` |  |
| src/estilos/novo-visual.css:2 | `:root` | `--visual-borda` | `#304536` |  |
| src/estilos/novo-visual.css:2 | `:root` | `--visual-texto` | `#edf3ed` |  |
| src/estilos/novo-visual.css:2 | `:root` | `--visual-suave` | `#adc1b0` |  |
| src/estilos/novo-visual.css:2 | `:root` | `--visual-acento` | `#bcec86` |  |
| src/estilos/novo-visual.css:2 | `:root` | `--visual-acento-fundo` | `#253c23` |  |
| src/estilos/novo-visual.css:2 | `:root` | `--visual-margem` | `0px` |  |
| src/estilos/novo-visual.css:14 | `[data-tema=claro]` | `--visual-fundo` | `#e7ebdd` |  |
| src/estilos/novo-visual.css:14 | `[data-tema=claro]` | `--visual-painel` | `#f8f7ee` |  |
| src/estilos/novo-visual.css:14 | `[data-tema=claro]` | `--visual-rebaixo` | `#e5eddc` |  |
| src/estilos/novo-visual.css:14 | `[data-tema=claro]` | `--visual-borda` | `#b6c6a5` |  |
| src/estilos/novo-visual.css:14 | `[data-tema=claro]` | `--visual-texto` | `#20371f` |  |
| src/estilos/novo-visual.css:14 | `[data-tema=claro]` | `--visual-suave` | `#475d40` |  |
| src/estilos/novo-visual.css:14 | `[data-tema=claro]` | `--visual-acento` | `#315b24` |  |
| src/estilos/novo-visual.css:14 | `[data-tema=claro]` | `--visual-acento-fundo` | `#d6e7c1` |  |
| src/estilos/novo-visual.css:14 | `[data-tema=claro]` | `--status-ponto` | `#2f7a24` |  |
| src/estilos/novo-visual.css:14 | `[data-tema=claro]` | `--aviso-fundo` | `#dbe7c9` |  |
| src/estilos/novo-visual.css:14 | `[data-tema=claro]` | `--aviso-texto` | `#415535` |  |
| src/estilos/novo-visual.css:14 | `[data-tema=claro]` | `--aviso-borda` | `#b1c695` |  |
| src/estilos/novo-visual.css:169 | `:root` | `--visual-margem` | `20px` | @media (min-width:600px) |
| src/estilos/superficies.css:2 | `:root` | `--superficie-raio` | `18px` |  |
| src/estilos/superficies.css:2 | `:root` | `--campo-raio` | `12px` |  |
| src/estilos/superficies.css:2 | `:root` | `--superficie-sombra` | `none` |  |
| src/estilos/superficies.css:2 | `:root` | `--superficie-campo-borda` | `#58764d` |  |
| src/estilos/superficies.css:2 | `:root` | `--superficie-topo` | `var(--visual-painel)` |  |
| src/estilos/superficies.css:9 | `:root[data-tema=claro]` | `--superficie-sombra` | `0 3px 12px #29401c08` |  |
| src/estilos/superficies.css:9 | `:root[data-tema=claro]` | `--superficie-campo-borda` | `#6f8560` |  |
| src/estilos/superficies.css:9 | `:root[data-tema=claro]` | `--superficie-topo` | `#dce7cf` |  |

| Token | Escuro efetivo no html | Claro efetivo no html |
| --- | --- | --- |
| `--controle-altura` | `48px` | `48px` |
| `--controle-raio` | `12px` | `12px` |
| `--controle-fonte` | `13px` | `13px` |
| `--controle-destaque` | `#bcec86` | `#bcec86` |
| `--controle-texto-escuro` | `#192d18` | `#193017` |
| `--controle-superficie` | `#263e2b` | `#dce9cd` |
| `--controle-borda` | `#58764d` | `#6f8560` |
| `--controle-texto` | `#e5f1de` | `#28431e` |
| `--movimento-curto` | `160ms` | `160ms` |
| `--movimento-painel` | `220ms` | `220ms` |
| `--controle-ativo-fundo` | `(não definido no tema)` | `#315b24` |
| `--controle-ativo-texto` | `(não definido no tema)` | `#f8f7ee` |
| `--visual-fundo` | `#0f1913` | `#e7ebdd` |
| `--visual-painel` | `#17271d` | `#f8f7ee` |
| `--visual-rebaixo` | `#101c15` | `#e5eddc` |
| `--visual-borda` | `#304536` | `#b6c6a5` |
| `--visual-texto` | `#edf3ed` | `#20371f` |
| `--visual-suave` | `#adc1b0` | `#475d40` |
| `--visual-acento` | `#bcec86` | `#315b24` |
| `--visual-acento-fundo` | `#253c23` | `#d6e7c1` |
| `--visual-margem` | `0px` | `0px` |
| `--status-ponto` | `(não definido no tema)` | `#2f7a24` |
| `--aviso-fundo` | `(não definido no tema)` | `#dbe7c9` |
| `--aviso-texto` | `(não definido no tema)` | `#415535` |
| `--aviso-borda` | `(não definido no tema)` | `#b1c695` |
| `--superficie-raio` | `18px` | `18px` |
| `--campo-raio` | `12px` | `12px` |
| `--superficie-sombra` | `none` | `0 3px 12px #29401c08` |
| `--superficie-campo-borda` | `#58764d` | `#6f8560` |
| `--superficie-topo` | `#17271d` | `#dce7cf` |

Os valores de --visual-margem acima são de 390px; em min-width:600px muda para 20px. --reserva-acoes é local ao contêiner do treino e não ao html.

## Apêndice B — declarações substituídas e conflitos exatos

| Arquivo anterior | Seletor | Propriedade | Valor anterior | Arquivo posterior | Valor posterior | Dependência de ordem |
| --- | --- | --- | --- | --- | --- | --- |
| src/index.css:12 | `.aviso-pwa` | bottom | `calc(90px + env(safe-area-inset-bottom))` | src/index.css:13 | `auto` | valores diferentes |
| src/index.css:14 | `.painel-modal` | border-radius | `22px 22px 0 0` | src/index.css:19 | `28px 28px 0 0` | valores diferentes |
| src/index.css:14 | `.painel-modal` | background | `#131c17` | src/index.css:19 | `#14221b` | valores diferentes |
| src/index.css:14 | `.painel-modal>.topo-painel>header` | background | `#131c17` | src/index.css:19 | `#14221b` | valores diferentes |
| src/index.css:14 | `.painel-modal>.topo-painel>header` | padding | `12px 18px` | src/index.css:19 | `10px 20px` | valores diferentes |
| src/index.css:12 | `.botao-principal` | background | `#1b301e` | src/index.css:22 | `#bcec86` | valores diferentes |
| src/index.css:12 | `.botao-principal` | color | `#e8f5dd` | src/index.css:22 | `#172d16` | valores diferentes |
| src/index.css:12 | `.botao-principal` | font-weight | `600` | src/index.css:22 | `650` | valores diferentes |
| src/index.css:19 | `.painel-modal::before` | display | `block` | src/index.css:27 | `none` | valores diferentes |
| src/index.css:27 | `.alca-painel` | height | `32px` | src/index.css:33 | `44px` | valores diferentes |
| src/index.css:27 | `.alca-painel` | min-height | `32px` | src/index.css:33 | `44px` | valores diferentes |
| src/index.css:27 | `.painel-modal:not(.painel-centralizado)>.topo-painel>header` | top | `32px` | src/index.css:33 | `44px` | valores diferentes |
| src/index.css:27 | `.alca-painel:focus-visible` | outline | `2px solid #bcec86` | src/index.css:33 | `none` | valores diferentes |
| src/index.css:16 | `.cabecalho-series,.linha-serie` | grid-template-columns | `36px minmax(0,1fr) minmax(0,1.2fr) 72px` | src/index.css:38 | `48px minmax(0,1fr) minmax(0,1fr) 72px` | valores diferentes |
| src/index.css:16 | `.cabecalho-series,.linha-serie` | gap | `6px` | src/index.css:38 | `8px` | valores diferentes |
| src/index.css:19 | `.valor-serie` | border-radius | `0` | src/index.css:38 | `10px` | valores diferentes |
| src/index.css:19 | `.valor-serie` | background | `transparent` | src/index.css:38 | `#14221a` | valores diferentes |
| src/index.css:19 | `.tipo-serie` | min-width | `48px` | src/index.css:38 | `48px` | duplicação idêntica |
| src/index.css:35 | `.preview-card` | max-width | `270px` | src/index.css:38 | `300px` | valores diferentes |
| src/index.css:14 | `.abas-treino` | display | `flex` | src/index.css:45 | `grid` | valores diferentes |
| src/index.css:14 | `.abas-treino` | gap | `8px` | src/index.css:45 | `4px` | valores diferentes |
| src/index.css:14 | `.abas-treino` | margin-bottom | `20px` | src/index.css:45 | `24px` | valores diferentes |
| src/index.css:14 | `.abas-treino button` | min-height | `48px` | src/index.css:45 | `46px` | valores diferentes |
| src/index.css:14 | `.abas-treino button` | border-radius | `12px` | src/index.css:45 | `11px` | valores diferentes |
| src/index.css:14 | `.abas-treino button` | background | `#19221c` | src/index.css:45 | `transparent` | valores diferentes |
| src/index.css:14 | `.abas-treino button` | color | `#adb8ae` | src/index.css:45 | `#98ad9e` | valores diferentes |
| src/index.css:14 | `.abas-treino button` | font-size | `13px` | src/index.css:45 | `13px` | duplicação idêntica |
| src/index.css:14 | `.abas-treino button[aria-pressed=true]` | background | `#24321f` | src/index.css:45 | `#2b4026` | valores diferentes |
| src/index.css:14 | `.abas-treino button[aria-pressed=true]` | color | `#bcec86` | src/index.css:45 | `#d2f5ae` | valores diferentes |
| src/index.css:38 | `.cabecalho-series,.linha-serie` | grid-template-columns | `48px minmax(0,1fr) minmax(0,1fr) 72px` | src/index.css:46 | `44px minmax(0,1fr) minmax(0,1fr) 64px 32px` | valores diferentes |
| src/index.css:38 | `.cabecalho-series,.linha-serie` | gap | `8px` | src/index.css:46 | `6px` | valores diferentes |
| src/index.css:15 | `.ultimo-desempenho` | display | `block` | src/index.css:47 | `block` | duplicação idêntica |
| src/index.css:15 | `.ultimo-desempenho` | color | `#95a499` | src/index.css:47 | `#a5b9aa` | valores diferentes |
| src/index.css:15 | `.ultimo-desempenho` | line-height | `1.7` | src/index.css:47 | `1.7` | duplicação idêntica |
| src/index.css:33 | `.painel-modal:not(.painel-centralizado)>.topo-painel>header` | top | `44px` | src/index.css:48 | `auto` | valores diferentes |
| src/index.css:19 | `.treino-livre` | border | `1px dashed #3d523a` | src/index.css:52 | `1px solid #3c513b` | valores diferentes |
| src/index.css:19 | `.treino-livre` | background | `transparent` | src/index.css:52 | `#18271d` | valores diferentes |
| src/index.css:19 | `.treino-livre` | border-radius | `18px` | src/index.css:52 | `18px` | duplicação idêntica |
| src/index.css:19 | `.treino-livre` | gap | `14px` | src/index.css:52 | `12px` | valores diferentes |
| src/index.css:19 | `.treino-livre` | padding | `14px 18px` | src/index.css:52 | `16px` | valores diferentes |
| src/index.css:19 | `.treino-livre` | min-height | `76px` | src/index.css:52 | `80px` | valores diferentes |
| src/index.css:19 | `.treino-livre small` | color | `#95a499` | src/index.css:52 | `#a2b5a7` | valores diferentes |
| src/index.css:35 | `.aviso-recorde` | padding | `16px` | src/index.css:55 | `14px` | valores diferentes |
| src/index.css:35 | `.aviso-recorde` | background | `#293e23` | src/index.css:55 | `#19271e` | valores diferentes |
| src/index.css:35 | `.aviso-recorde` | border | `1px solid #bcec86` | src/index.css:55 | `1px solid #354b38` | valores diferentes |
| src/index.css:35 | `.aviso-recorde` | border-radius | `16px` | src/index.css:55 | `14px` | valores diferentes |
| src/index.css:35 | `.aviso-recorde` | color | `#bcec86` | src/index.css:55 | `#d4e5ce` | valores diferentes |
| src/index.css:35 | `.aviso-recorde p` | margin | `8px 0` | src/index.css:55 | `5px 0 0` | valores diferentes |
| src/index.css:35 | `.aviso-recorde p` | font-size | `13px` | src/index.css:55 | `12px` | valores diferentes |
| src/index.css:74 | `.secao-config.expandida>h2` | margin-bottom | `14px` | src/index.css:76 | `0` | valores diferentes |
| src/index.css:74 | `.conteudo-config:not([hidden])` | padding | `4px 16px 20px` | src/index.css:76 | `18px 16px 20px` | valores diferentes |
| src/index.css:74 | `.secao-config>h2>button` | align-items | `center` | src/index.css:76 | `center` | duplicação idêntica |
| src/index.css:49 | `.sessao-exercicio>summary>span>small` | color | `#9fb3a4` | src/index.css:122 | `#9bb2a2` | valores diferentes |
| src/index.css:71 | `.conta-entrada .formulario-conta` | gap | `18px` | src/estilos/controles.css:170 | `20px` | valores diferentes |
| src/index.css:11 | `:root` | color-scheme | `dark` | src/estilos/novo-visual.css:2 | `dark` | duplicação idêntica |
| src/index.css:12 | `.app` | max-width | `480px` | src/estilos/novo-visual.css:32 | `480px` | duplicação idêntica |
| src/index.css:12 | `.app` | min-height | `100dvh` | src/estilos/novo-visual.css:32 | `0` | valores diferentes |
| src/index.css:12 | `.app` | margin | `auto` | src/estilos/novo-visual.css:32 | `0 auto` | valores diferentes |
| src/index.css:12 | `.app` | background | `#101714` | src/estilos/novo-visual.css:32 | `var(--visual-fundo)` | valores diferentes |
| src/index.css:12 | `.marca small` | font-size | `8px` | src/estilos/novo-visual.css:41 | `8px` | duplicação idêntica |
| src/index.css:12 | `.marca small` | letter-spacing | `2px` | src/estilos/novo-visual.css:41 | `2px` | duplicação idêntica |
| src/index.css:12 | `.marca small` | color | `#95a399` | src/estilos/novo-visual.css:41 | `var(--visual-suave)` | valores diferentes |
| src/estilos/controles.css:214 | `.app .aviso-modo-visitante` | margin | `0 0 20px` | src/estilos/novo-visual.css:48 | `0 0 22px` | valores diferentes |
| src/estilos/controles.css:214 | `.app .aviso-modo-visitante` | line-height | `1.75` | src/estilos/novo-visual.css:48 | `1.7` | valores diferentes |
| src/estilos/novo-visual.css:143 | `.app .secao-config > h2 > button` | min-height | `76px` | src/estilos/novo-visual.css:204 | `68px` | valores diferentes |
| src/estilos/novo-visual.css:147 | `.app .conteudo-config:not([hidden])` | padding | `4px 16px 20px` | src/estilos/novo-visual.css:205 | `12px 16px 24px` | valores diferentes |
| src/estilos/paleta-clara.css:399 | `:root[data-tema=claro] .app .painel-modal` | background | `var(--visual-rebaixo)` | src/estilos/paleta-clara.css:559 | `var(--visual-rebaixo)` | duplicação idêntica |
| src/estilos/paleta-clara.css:407 | `:root[data-tema=claro] .app .painel-modal>.topo-painel>header` | background | `var(--visual-rebaixo)` | src/estilos/paleta-clara.css:563 | `var(--visual-rebaixo)` | duplicação idêntica |
| src/estilos/paleta-clara.css:269 | `:root[data-tema=claro] .app .botao-principal` | color | `var(--visual-texto)` | src/estilos/paleta-clara.css:680 | `#28431e` | valores diferentes |
| src/estilos/paleta-clara.css:605 | `:root[data-tema=claro] .app .valor-serie` | background | `transparent` | src/estilos/paleta-clara.css:873 | `var(--visual-rebaixo)` | valores diferentes |
| src/estilos/paleta-clara.css:381 | `:root[data-tema=claro] .app .abas-treino button` | background | `var(--visual-rebaixo)` | src/estilos/paleta-clara.css:918 | `transparent` | valores diferentes |
| src/estilos/paleta-clara.css:381 | `:root[data-tema=claro] .app .abas-treino button` | color | `var(--visual-texto)` | src/estilos/paleta-clara.css:918 | `var(--visual-suave)` | valores diferentes |
| src/estilos/paleta-clara.css:385 | `:root[data-tema=claro] .app .abas-treino button[aria-pressed=true]` | background | `var(--visual-rebaixo)` | src/estilos/paleta-clara.css:922 | `var(--visual-acento-fundo)` | valores diferentes |
| src/estilos/paleta-clara.css:385 | `:root[data-tema=claro] .app .abas-treino button[aria-pressed=true]` | color | `var(--visual-texto)` | src/estilos/paleta-clara.css:922 | `var(--visual-texto)` | duplicação idêntica |
| src/estilos/paleta-clara.css:441 | `:root[data-tema=claro] .app .ultimo-desempenho` | color | `var(--visual-suave)` | src/estilos/paleta-clara.css:944 | `var(--visual-suave)` | duplicação idêntica |
| src/estilos/paleta-clara.css:664 | `:root[data-tema=claro] .app .treino-livre` | border | `1px dashed #7c8d76` | src/estilos/paleta-clara.css:982 | `1px solid #7c8d76` | valores diferentes |
| src/estilos/paleta-clara.css:664 | `:root[data-tema=claro] .app .treino-livre` | background | `transparent` | src/estilos/paleta-clara.css:982 | `var(--visual-rebaixo)` | valores diferentes |
| src/estilos/paleta-clara.css:669 | `:root[data-tema=claro] .app .treino-livre small` | color | `var(--visual-suave)` | src/estilos/paleta-clara.css:992 | `var(--visual-suave)` | duplicação idêntica |
| src/estilos/paleta-clara.css:845 | `:root[data-tema=claro] .app .aviso-recorde` | background | `var(--visual-acento-fundo)` | src/estilos/paleta-clara.css:1018 | `var(--visual-rebaixo)` | valores diferentes |
| src/estilos/paleta-clara.css:845 | `:root[data-tema=claro] .app .aviso-recorde` | border | `1px solid #7c8d76` | src/estilos/paleta-clara.css:1018 | `1px solid #7c8d76` | duplicação idêntica |
| src/estilos/paleta-clara.css:845 | `:root[data-tema=claro] .app .aviso-recorde` | color | `var(--visual-texto)` | src/estilos/paleta-clara.css:1018 | `var(--visual-texto)` | duplicação idêntica |
| src/estilos/paleta-clara.css:961 | `:root[data-tema=claro] .app .sessao-exercicio>summary>span>small` | color | `var(--visual-suave)` | src/estilos/paleta-clara.css:1657 | `var(--visual-suave)` | duplicação idêntica |
| src/estilos/paleta-clara.css:312 | `:root[data-tema=claro] .app .navegacao button` | background | `transparent` | src/estilos/contraste-claro.css:18 | `transparent` | duplicação idêntica |
| src/estilos/paleta-clara.css:312 | `:root[data-tema=claro] .app .navegacao button` | color | `var(--visual-suave)` | src/estilos/contraste-claro.css:18 | `#50644e` | valores diferentes |
| src/estilos/paleta-clara.css:244 | `:root[data-tema=claro] .app` | background | `var(--visual-rebaixo)` | src/estilos/contraste-claro.css:25 | `var(--visual-fundo)` | valores diferentes |
| src/estilos/contraste-claro.css:19 | `:root[data-tema=claro] .app .navegacao button[aria-current=page]` | background | `#e7f1dd` | src/estilos/contraste-claro.css:28 | `#315b24` | valores diferentes |
| src/estilos/contraste-claro.css:19 | `:root[data-tema=claro] .app .navegacao button[aria-current=page]` | color | `#355f26` | src/estilos/contraste-claro.css:28 | `#fff` | valores diferentes |
| src/estilos/paleta-clara.css:1315 | `:root[data-tema=claro] .app .secao-config` | background | `var(--visual-rebaixo)` | src/estilos/contraste-claro.css:31 | `transparent` | valores diferentes |
| src/estilos/paleta-clara.css:1319 | `:root[data-tema=claro] .app .icone-config` | background | `var(--visual-acento-fundo)` | src/estilos/contraste-claro.css:32 | `#d6e7c1` | valores diferentes |
| src/estilos/paleta-clara.css:1319 | `:root[data-tema=claro] .app .icone-config` | color | `var(--visual-texto)` | src/estilos/contraste-claro.css:32 | `#315b24` | valores diferentes |
| src/estilos/paleta-clara.css:559 | `:root[data-tema=claro] .app .painel-modal` | background | `var(--visual-rebaixo)` | src/estilos/contraste-claro.css:38 | `var(--visual-painel)` | valores diferentes |
| src/estilos/paleta-clara.css:1660 | `:root[data-tema=claro] .app .ultimo-concluido.ultimo-treino-atalho` | background | `transparent` | src/estilos/contraste-claro.css:41 | `transparent` | duplicação idêntica |
| src/estilos/paleta-clara.css:1660 | `:root[data-tema=claro] .app .ultimo-concluido.ultimo-treino-atalho` | border | `0` | src/estilos/contraste-claro.css:41 | `0` | duplicação idêntica |
| src/estilos/paleta-clara.css:1660 | `:root[data-tema=claro] .app .ultimo-concluido.ultimo-treino-atalho` | border-bottom | `1px solid #7c8d76` | src/estilos/contraste-claro.css:41 | `1px solid var(--visual-borda)` | valores diferentes |
| src/estilos/controles.css:295 | `:root[data-tema] .app .treino-em-andamento .ferramentas-exercicio > .botao-descanso` | min-height | `48px` | src/estilos/superficies.css:116 | `44px` | valores diferentes |
| src/estilos/contraste-claro.css:37 | `:root[data-tema=claro] .app .aviso-modo-visitante` | background | `#dbe7c9` | src/estilos/superficies.css:138 | `var(--aviso-fundo)` | valores diferentes |
| src/estilos/contraste-claro.css:37 | `:root[data-tema=claro] .app .aviso-modo-visitante` | color | `#415535` | src/estilos/superficies.css:138 | `var(--aviso-texto)` | valores diferentes |

## Apêndice C — especificidade elevada, :not e !important

| Arquivo:linha | Seletor | Condição |
| --- | --- | --- |
| src/estilos/controles.css:265 | `:root[data-tema=claro] .app .botao-principal:not(:disabled)` |  |
| src/estilos/controles.css:268 | `:root[data-tema] .app :is(.botao-principal,.botao-secundario,.botao-destrutivo):not(:disabled)` |  |
| src/estilos/controles.css:269 | `:root[data-tema] .app .botao-principal:not(:disabled)` |  |
| src/estilos/controles.css:270 | `:root[data-tema] .app .botao-secundario:not(:disabled):not(.excluir-historico)` |  |
| src/estilos/controles.css:271 | `:root[data-tema] .app :is(.abas-treino,.abas-medidas,.abas-catalogo,.alternador-seletor)` |  |
| src/estilos/controles.css:272 | `:root[data-tema] .app :is(.abas-treino,.abas-medidas,.abas-catalogo,.alternador-seletor) > button` |  |
| src/estilos/controles.css:273 | `:root[data-tema] .app :is(.abas-treino,.abas-medidas,.abas-catalogo,.alternador-seletor) > button:is([aria-pressed=true],[aria-selected=true])` |  |
| src/estilos/controles.css:276 | `:root[data-tema] .app .treino-em-andamento .andamento-treino .manter-tela:not(:disabled)` |  |
| src/estilos/controles.css:283 | `:root[data-tema] .app .manter-tela > svg` |  |
| src/estilos/controles.css:284 | `:root[data-tema] .app .manter-tela > span` |  |
| src/estilos/controles.css:285 | `:root[data-tema] .app .manter-tela::after` |  |
| src/estilos/controles.css:288 | `:root[data-tema] .app .seletor-valores .aplicar-proximas` |  |
| src/estilos/controles.css:289 | `:root[data-tema] .app .seletor-valores .aplicar-proximas:has(input:checked)` |  |
| src/estilos/controles.css:290 | `:root[data-tema] .app .seletor-valores .aplicar-proximas input` |  |
| src/estilos/controles.css:291 | `:root[data-tema] .app .seletor-valores .aplicar-proximas span` |  |
| src/estilos/controles.css:292 | `:root[data-tema] .app .seletor-valores .aplicar-proximas strong` |  |
| src/estilos/controles.css:293 | `:root[data-tema] .app .seletor-valores .aplicar-proximas small` |  |
| src/estilos/controles.css:294 | `:root[data-tema] .app .seletor-valores .aplicar-proximas:has(input:focus-visible)` |  |
| src/estilos/controles.css:295 | `:root[data-tema] .app .treino-em-andamento .ferramentas-exercicio > .botao-descanso` |  |
| src/estilos/controles.css:296 | `:root[data-tema] .app .treino-em-andamento .ferramentas-exercicio > .botao-descanso strong` |  |
| src/estilos/controles.css:297 | `:root[data-tema] .app .treino-em-andamento .ferramentas-exercicio > .botao-descanso > span` |  |
| src/estilos/controles.css:298 | `:root[data-tema] .app .botao-descanso > span::after` |  |
| src/estilos/paleta-clara.css:2 | `:root[data-tema=claro] .app .introducao-comparacao-sync>p` |  |
| src/estilos/paleta-clara.css:5 | `:root[data-tema=claro] .app .introducao-comparacao-sync>button` |  |
| src/estilos/paleta-clara.css:9 | `:root[data-tema=claro] .app .registro-em-revisao` |  |
| src/estilos/paleta-clara.css:12 | `:root[data-tema=claro] .app .registro-em-revisao>header>span` |  |
| src/estilos/paleta-clara.css:15 | `:root[data-tema=claro] .app .registro-em-revisao>header>strong` |  |
| src/estilos/paleta-clara.css:18 | `:root[data-tema=claro] .app .opcao-registro-sync` |  |
| src/estilos/paleta-clara.css:23 | `:root[data-tema=claro] .app .opcao-registro-sync[aria-pressed=true]` |  |
| src/estilos/paleta-clara.css:27 | `:root[data-tema=claro] .app .origem-registro-sync` |  |
| src/estilos/paleta-clara.css:30 | `:root[data-tema=claro] .app .marca-escolha-sync` |  |
| src/estilos/paleta-clara.css:33 | `:root[data-tema=claro] .app .opcao-registro-sync[aria-pressed=true] .marca-escolha-sync` |  |
| src/estilos/paleta-clara.css:37 | `:root[data-tema=claro] .app .opcao-registro-sync[aria-pressed=true] .origem-registro-sync` |  |
| src/estilos/paleta-clara.css:40 | `:root[data-tema=claro] .app .valor-comparado-sync>strong` |  |
| src/estilos/paleta-clara.css:43 | `:root[data-tema=claro] .app .valor-comparado-sync>span` |  |
| src/estilos/paleta-clara.css:46 | `:root[data-tema=claro] .app .data-versao-sync` |  |
| src/estilos/paleta-clara.css:50 | `:root[data-tema=claro] .app .data-versao-sync>time` |  |
| src/estilos/paleta-clara.css:53 | `:root[data-tema=claro] .app .detalhes-comparacao-sync` |  |
| src/estilos/paleta-clara.css:56 | `:root[data-tema=claro] .app .cabecalho-detalhes-sync` |  |
| src/estilos/paleta-clara.css:60 | `:root[data-tema=claro] .app .linha-detalhes-sync` |  |
| src/estilos/paleta-clara.css:63 | `:root[data-tema=claro] .app .linha-detalhes-sync>span` |  |
| src/estilos/paleta-clara.css:66 | `:root[data-tema=claro] .app .linha-detalhes-sync>strong` |  |
| src/estilos/paleta-clara.css:69 | `:root[data-tema=claro] .app .registro-em-revisao>.confirmar-registro-sync` |  |
| src/estilos/paleta-clara.css:72 | `:root[data-tema=claro] .app .registro-em-revisao>.confirmar-registro-sync:disabled` |  |
| src/estilos/paleta-clara.css:77 | `:root[data-tema=claro] .app .revisao-comparacao>.nota-escolha-sync` |  |
| src/estilos/paleta-clara.css:80 | `:root[data-tema=claro] .app .icone-aviso-conflito` |  |
| src/estilos/paleta-clara.css:84 | `:root[data-tema=claro] .app .aviso-conflito-popup>h3` |  |
| src/estilos/paleta-clara.css:87 | `:root[data-tema=claro] .app .aviso-conflito-popup>p` |  |
| src/estilos/paleta-clara.css:90 | `:root[data-tema=claro] .app .aviso-conflito-popup>.botao-principal` |  |
| src/estilos/paleta-clara.css:93 | `:root[data-tema=claro] .app .aviso-conflito-popup>.andamento-aviso-conflito` |  |
| src/estilos/paleta-clara.css:96 | `:root[data-tema=claro] .app .aviso-data-atividade` |  |
| src/estilos/paleta-clara.css:100 | `:root[data-tema=claro] .app .aviso-data-atividade>p` |  |
| src/estilos/paleta-clara.css:103 | `:root[data-tema=claro] .app .concluir-backup` |  |
| src/estilos/paleta-clara.css:107 | `:root[data-tema=claro] .app .concluir-backup:active` |  |
| src/estilos/paleta-clara.css:110 | `:root[data-tema=claro] .app .concluir-backup:disabled` |  |
| src/estilos/paleta-clara.css:115 | `:root[data-tema=claro] .app .backup-config .introducao-backup` |  |
| src/estilos/paleta-clara.css:118 | `:root[data-tema=claro] .app .backup-config .preparar-backup` |  |
| src/estilos/paleta-clara.css:121 | `:root[data-tema=claro] .app .backup-config .preparar-backup.backup-gerado` |  |
| src/estilos/paleta-clara.css:126 | `:root[data-tema=claro] .app .backup-config .backup-pronto` |  |
| src/estilos/paleta-clara.css:130 | `:root[data-tema=claro] .app .icone-arquivo-backup` |  |
| src/estilos/paleta-clara.css:134 | `:root[data-tema=claro] .app .cabecalho-arquivo-backup strong` |  |
| src/estilos/paleta-clara.css:137 | `:root[data-tema=claro] .app .cabecalho-arquivo-backup>div>span` |  |
| src/estilos/paleta-clara.css:140 | `:root[data-tema=claro] .app .backup-config .backup-pronto>.nome-arquivo-backup` |  |
| src/estilos/paleta-clara.css:143 | `:root[data-tema=claro] .app .acoes-arquivo-backup>a` |  |
| src/estilos/paleta-clara.css:146 | `:root[data-tema=claro] .app .acoes-arquivo-backup>button` |  |
| src/estilos/paleta-clara.css:150 | `:root[data-tema=claro] .app .nota-salvamento-backup` |  |
| src/estilos/paleta-clara.css:153 | `:root[data-tema=claro] .app .backup-config .nota-salvamento-backup>p` |  |
| src/estilos/paleta-clara.css:156 | `:root[data-tema=claro] .app .acoes-backup-secundarias>button, :root[data-tema=claro] .app .backup-config .acoes-backup-secundarias>label` |  |
| src/estilos/paleta-clara.css:161 | `:root[data-tema=claro] .app .acoes-backup-secundarias>button+button, :root[data-tema=claro] .app .acoes-backup-secundarias>label+button` |  |
| src/estilos/paleta-clara.css:165 | `:root[data-tema=claro] .app .acoes-backup-secundarias strong` |  |
| src/estilos/paleta-clara.css:168 | `:root[data-tema=claro] .app .backup-config .acoes-backup-secundarias small` |  |
| src/estilos/paleta-clara.css:171 | `:root[data-tema=claro] .app .acao-backup-importar:focus-within` |  |
| src/estilos/paleta-clara.css:174 | `:root[data-tema=claro] .app .lembrete-backup-opcao` |  |
| src/estilos/paleta-clara.css:178 | `:root[data-tema=claro] .app .lembrete-backup-opcao>strong` |  |
| src/estilos/paleta-clara.css:181 | `:root[data-tema=claro] .app .conclusao-revisao>span` |  |
| src/estilos/paleta-clara.css:185 | `:root[data-tema=claro] .app .conclusao-revisao>h3` |  |
| src/estilos/paleta-clara.css:188 | `:root[data-tema=claro] .app .conclusao-revisao>p` |  |
| src/estilos/paleta-clara.css:191 | `:root[data-tema=claro] .app .estado-sync>.acao-sincronizar` |  |
| src/estilos/paleta-clara.css:195 | `:root[data-tema=claro] .app .estado-sync>.acao-sincronizar:disabled` |  |
| src/estilos/paleta-clara.css:200 | `:root[data-tema=claro] .app .estado-sync>.detalhes-sync` |  |
| src/estilos/paleta-clara.css:203 | `:root[data-tema=claro] .app .detalhes-sync>time` |  |
| src/estilos/paleta-clara.css:206 | `:root[data-tema=claro] .app .detalhes-sync>.pendencias-sync` |  |
| src/estilos/paleta-clara.css:209 | `:root[data-tema=claro] .app .conta .estado-sync>.mensagem-sync` |  |
| src/estilos/paleta-clara.css:212 | `:root[data-tema=claro] .app .texto-sync-automatica>strong` |  |
| src/estilos/paleta-clara.css:215 | `:root[data-tema=claro] .app .texto-sync-automatica>span` |  |
| src/estilos/paleta-clara.css:218 | `:root[data-tema=claro] .app .interruptor-sync` |  |
| src/estilos/paleta-clara.css:222 | `:root[data-tema=claro] .app .opcao-sync-automatica>input:checked+.interruptor-sync` |  |
| src/estilos/paleta-clara.css:225 | `:root[data-tema=claro] .app .opcao-sync-automatica>input:checked+.interruptor-sync::after` |  |
| src/estilos/paleta-clara.css:228 | `:root[data-tema=claro] .app .opcao-sync-automatica>input:focus-visible+.interruptor-sync` |  |
| src/estilos/paleta-clara.css:231 | `:root[data-tema=claro] .app .revisao-sync` |  |
| src/estilos/paleta-clara.css:234 | `:root[data-tema=claro] .app .comparacao-sync>section` |  |
| src/estilos/paleta-clara.css:237 | `:root[data-tema=claro] .app .comparacao-sync h4` |  |
| src/estilos/paleta-clara.css:240 | `:root[data-tema=claro] .app button:focus-visible, :root[data-tema=claro] .app a:focus-visible` |  |
| src/estilos/paleta-clara.css:244 | `:root[data-tema=claro] .app` |  |
| src/estilos/paleta-clara.css:247 | `:root[data-tema=claro] .app .cabecalho` |  |
| src/estilos/paleta-clara.css:250 | `:root[data-tema=claro] .app .marca>span` |  |
| src/estilos/paleta-clara.css:253 | `:root[data-tema=claro] .app .marca small` |  |
| src/estilos/paleta-clara.css:256 | `:root[data-tema=claro] .app .botao-icone` |  |
| src/estilos/paleta-clara.css:260 | `:root[data-tema=claro] .app .linha-data` |  |
| src/estilos/paleta-clara.css:263 | `:root[data-tema=claro] .app .destaque` |  |
| src/estilos/paleta-clara.css:266 | `:root[data-tema=claro] .app .destaque p` |  |
| src/estilos/paleta-clara.css:269 | `:root[data-tema=claro] .app .botao-principal` |  |
| src/estilos/paleta-clara.css:273 | `:root[data-tema=claro] .app .titulo-secao>span` |  |
| src/estilos/paleta-clara.css:276 | `:root[data-tema=claro] .app .cartao` |  |
| src/estilos/paleta-clara.css:280 | `:root[data-tema=claro] .app .cartao>span` |  |
| src/estilos/paleta-clara.css:283 | `:root[data-tema=claro] .app .cartao strong small` |  |
| src/estilos/paleta-clara.css:286 | `:root[data-tema=claro] .app .cartao>small` |  |
| src/estilos/paleta-clara.css:289 | `:root[data-tema=claro] .app .verde` |  |
| src/estilos/paleta-clara.css:292 | `:root[data-tema=claro] .app .amarelo` |  |
| src/estilos/paleta-clara.css:295 | `:root[data-tema=claro] .app .laranja` |  |
| src/estilos/paleta-clara.css:298 | `:root[data-tema=claro] .app .azul` |  |
| src/estilos/paleta-clara.css:301 | `:root[data-tema=claro] .app .nota p` |  |
| src/estilos/paleta-clara.css:304 | `:root[data-tema=claro] .app .botao-secundario` |  |
| src/estilos/paleta-clara.css:308 | `:root[data-tema=claro] .app .navegacao` |  |
| src/estilos/paleta-clara.css:312 | `:root[data-tema=claro] .app .navegacao button` |  |
| src/estilos/paleta-clara.css:316 | `:root[data-tema=claro] .app .navegacao button[aria-current]` |  |
| src/estilos/paleta-clara.css:320 | `:root[data-tema=claro] .app .instalacao` |  |
| src/estilos/paleta-clara.css:325 | `:root[data-tema=claro] .app .instalacao p` |  |
| src/estilos/paleta-clara.css:328 | `:root[data-tema=claro] .app .instalacao small` |  |
| src/estilos/paleta-clara.css:331 | `:root[data-tema=claro] .app .icone-vazio` |  |
| src/estilos/paleta-clara.css:335 | `:root[data-tema=claro] .app .vazio>.etiqueta` |  |
| src/estilos/paleta-clara.css:338 | `:root[data-tema=claro] .app .vazio p` |  |
| src/estilos/paleta-clara.css:341 | `:root[data-tema=claro] .app .selo` |  |
| src/estilos/paleta-clara.css:345 | `:root[data-tema=claro] .app .painel` |  |
| src/estilos/paleta-clara.css:349 | `:root[data-tema=claro] .app .painel p` |  |
| src/estilos/paleta-clara.css:352 | `:root[data-tema=claro] .app .painel dl>div` |  |
| src/estilos/paleta-clara.css:355 | `:root[data-tema=claro] .app .painel dt` |  |
| src/estilos/paleta-clara.css:358 | `:root[data-tema=claro] .app .painel dd` |  |
| src/estilos/paleta-clara.css:361 | `:root[data-tema=claro] .app .painel small` |  |
| src/estilos/paleta-clara.css:364 | `:root[data-tema=claro] .app .aviso-pwa` |  |
| src/estilos/paleta-clara.css:368 | `:root[data-tema=claro] .app .aviso-pwa button` |  |
| src/estilos/paleta-clara.css:371 | `:root[data-tema=claro] .app .erro` |  |
| src/estilos/paleta-clara.css:376 | `:root[data-tema=claro] .app` | @media (min-width:600px) |
| src/estilos/paleta-clara.css:381 | `:root[data-tema=claro] .app .abas-treino button` |  |
| src/estilos/paleta-clara.css:385 | `:root[data-tema=claro] .app .abas-treino button[aria-pressed=true]` |  |
| src/estilos/paleta-clara.css:389 | `:root[data-tema=claro] .app .formulario label` |  |
| src/estilos/paleta-clara.css:392 | `:root[data-tema=claro] .app .formulario input, :root[data-tema=claro] .app .formulario select, :root[data-tema=claro] .app .formulario textarea` |  |
| src/estilos/paleta-clara.css:399 | `:root[data-tema=claro] .app .painel-modal` |  |
| src/estilos/paleta-clara.css:404 | `:root[data-tema=claro] .app .painel-modal::backdrop` |  |
| src/estilos/paleta-clara.css:407 | `:root[data-tema=claro] .app .painel-modal>.topo-painel>header` |  |
| src/estilos/paleta-clara.css:411 | `:root[data-tema=claro] .app .acoes button, :root[data-tema=claro] .app .seletor-exercicios button` |  |
| src/estilos/paleta-clara.css:416 | `:root[data-tema=claro] .app .abrir-ficha small` |  |
| src/estilos/paleta-clara.css:419 | `:root[data-tema=claro] .app .item-ficha` |  |
| src/estilos/paleta-clara.css:422 | `:root[data-tema=claro] .app .fotos-maquina img` |  |
| src/estilos/paleta-clara.css:425 | `:root[data-tema=claro] .app .anexar` |  |
| src/estilos/paleta-clara.css:428 | `:root[data-tema=claro] .app .ajuda-texto p` |  |
| src/estilos/paleta-clara.css:431 | `:root[data-tema=claro] .app .desfazer` |  |
| src/estilos/paleta-clara.css:434 | `:root[data-tema=claro] .app .desfazer button` |  |
| src/estilos/paleta-clara.css:438 | `:root[data-tema=claro] .app .exercicio-treino` |  |
| src/estilos/paleta-clara.css:441 | `:root[data-tema=claro] .app .ultimo-desempenho` |  |
| src/estilos/paleta-clara.css:444 | `:root[data-tema=claro] .app .nota-fixa` |  |
| src/estilos/paleta-clara.css:447 | `:root[data-tema=claro] .app .serie` |  |
| src/estilos/paleta-clara.css:450 | `:root[data-tema=claro] .app .serie.concluida` |  |
| src/estilos/paleta-clara.css:453 | `:root[data-tema=claro] .app .serie.proxima-serie` |  |
| src/estilos/paleta-clara.css:456 | `:root[data-tema=claro] .app .ajuste-numero button` |  |
| src/estilos/paleta-clara.css:460 | `:root[data-tema=claro] .app .reducao` |  |
| src/estilos/paleta-clara.css:463 | `:root[data-tema=claro] .app .descanso` |  |
| src/estilos/paleta-clara.css:467 | `:root[data-tema=claro] .app .descanso>span` |  |
| src/estilos/paleta-clara.css:471 | `:root[data-tema=claro] .app .descanso.terminou` | @media (prefers-reduced-motion:reduce) |
| src/estilos/paleta-clara.css:475 | `:root[data-tema=claro] .app .exercicio-recolhivel` |  |
| src/estilos/paleta-clara.css:478 | `:root[data-tema=claro] .app .cabecalho-exercicio:focus-visible` |  |
| src/estilos/paleta-clara.css:481 | `:root[data-tema=claro] .app .miniatura-exercicio` |  |
| src/estilos/paleta-clara.css:485 | `:root[data-tema=claro] .app .resumo-exercicio small` |  |
| src/estilos/paleta-clara.css:488 | `:root[data-tema=claro] .app .seta-exercicio` |  |
| src/estilos/paleta-clara.css:491 | `:root[data-tema=claro] .app .exercicio-recolhivel[open]>.cabecalho-exercicio` |  |
| src/estilos/paleta-clara.css:494 | `:root[data-tema=claro] .app .conteudo-exercicio` |  |
| src/estilos/paleta-clara.css:497 | `:root[data-tema=claro] .app .cabecalho-series` |  |
| src/estilos/paleta-clara.css:500 | `:root[data-tema=claro] .app .serie-compacta` |  |
| src/estilos/paleta-clara.css:504 | `:root[data-tema=claro] .app .serie-compacta.proxima-serie` |  |
| src/estilos/paleta-clara.css:507 | `:root[data-tema=claro] .app .linha-serie input` |  |
| src/estilos/paleta-clara.css:512 | `:root[data-tema=claro] .app .concluir-compacto` |  |
| src/estilos/paleta-clara.css:515 | `:root[data-tema=claro] .app .concluida .concluir-compacto` |  |
| src/estilos/paleta-clara.css:519 | `:root[data-tema=claro] .app .opcoes-serie>summary` |  |
| src/estilos/paleta-clara.css:522 | `:root[data-tema=claro] .app .carga-por-lado` |  |
| src/estilos/paleta-clara.css:525 | `:root[data-tema=claro] .app .serie-compacta.concluida` |  |
| src/estilos/paleta-clara.css:528 | `:root[data-tema=claro] .app .capa-exercicio` |  |
| src/estilos/paleta-clara.css:532 | `:root[data-tema=claro] .app .abas-detalhe` |  |
| src/estilos/paleta-clara.css:536 | `:root[data-tema=claro] .app .abas-detalhe button` |  |
| src/estilos/paleta-clara.css:540 | `:root[data-tema=claro] .app .abas-detalhe button[aria-pressed=true]` |  |
| src/estilos/paleta-clara.css:544 | `:root[data-tema=claro] .app .passos-exercicio` |  |
| src/estilos/paleta-clara.css:547 | `:root[data-tema=claro] .app .passos-exercicio li` |  |
| src/estilos/paleta-clara.css:550 | `:root[data-tema=claro] .app .passos-exercicio li::marker` |  |
| src/estilos/paleta-clara.css:553 | `:root[data-tema=claro] .app .miniatura-exercicio:focus-visible` |  |
| src/estilos/paleta-clara.css:556 | `:root[data-tema=claro] .app .painel-modal::before` |  |
| src/estilos/paleta-clara.css:559 | `:root[data-tema=claro] .app .painel-modal` |  |
| src/estilos/paleta-clara.css:563 | `:root[data-tema=claro] .app .painel-modal>.topo-painel>header` |  |
| src/estilos/paleta-clara.css:566 | `:root[data-tema=claro] .app .subtitulo-seletor` |  |
| src/estilos/paleta-clara.css:569 | `:root[data-tema=claro] .app .coluna-roda>span` |  |
| src/estilos/paleta-clara.css:572 | `:root[data-tema=claro] .app .faixa-roda` |  |
| src/estilos/paleta-clara.css:575 | `:root[data-tema=claro] .app .roda>button` |  |
| src/estilos/paleta-clara.css:579 | `:root[data-tema=claro] .app .valor-escolhido` |  |
| src/estilos/paleta-clara.css:582 | `:root[data-tema=claro] .app .aplicar-proximas` |  |
| src/estilos/paleta-clara.css:586 | `:root[data-tema=claro] .app .aplicar-proximas input` |  |
| src/estilos/paleta-clara.css:589 | `:root[data-tema=claro] .app .tipo-serie` |  |
| src/estilos/paleta-clara.css:593 | `:root[data-tema=claro] .app .tipo-serie.aquecimento` |  |
| src/estilos/paleta-clara.css:597 | `:root[data-tema=claro] .app .tipo-serie.dropset` |  |
| src/estilos/paleta-clara.css:601 | `:root[data-tema=claro] .app .tipo-serie.falha` |  |
| src/estilos/paleta-clara.css:605 | `:root[data-tema=claro] .app .valor-serie` |  |
| src/estilos/paleta-clara.css:610 | `:root[data-tema=claro] .app .lista-tipos>button` |  |
| src/estilos/paleta-clara.css:614 | `:root[data-tema=claro] .app .lista-tipos small` |  |
| src/estilos/paleta-clara.css:617 | `:root[data-tema=claro] .app .lista-tipos>button.selecionado` |  |
| src/estilos/paleta-clara.css:620 | `:root[data-tema=claro] .app .lista-tipos>button.remover-serie` |  |
| src/estilos/paleta-clara.css:623 | `:root[data-tema=claro] .app .botao-descanso` |  |
| src/estilos/paleta-clara.css:627 | `:root[data-tema=claro] .app .botao-descanso strong` |  |
| src/estilos/paleta-clara.css:630 | `:root[data-tema=claro] .app .retomar-treino` |  |
| src/estilos/paleta-clara.css:634 | `:root[data-tema=claro] .app .retomar-treino button` |  |
| src/estilos/paleta-clara.css:638 | `:root[data-tema=claro] .app .barra-fichas` |  |
| src/estilos/paleta-clara.css:641 | `:root[data-tema=claro] .app .barra-fichas button` |  |
| src/estilos/paleta-clara.css:645 | `:root[data-tema=claro] .app .ficha-nova` |  |
| src/estilos/paleta-clara.css:649 | `:root[data-tema=claro] .app .icone-ficha` |  |
| src/estilos/paleta-clara.css:653 | `:root[data-tema=claro] .app .menu-ficha>summary` |  |
| src/estilos/paleta-clara.css:657 | `:root[data-tema=claro] .app .menu-ficha .acoes` |  |
| src/estilos/paleta-clara.css:661 | `:root[data-tema=claro] .app .iniciar-ficha` |  |
| src/estilos/paleta-clara.css:664 | `:root[data-tema=claro] .app .treino-livre` |  |
| src/estilos/paleta-clara.css:669 | `:root[data-tema=claro] .app .treino-livre small` |  |
| src/estilos/paleta-clara.css:672 | `:root[data-tema=claro] .app .grupo-exercicios` |  |
| src/estilos/paleta-clara.css:676 | `:root[data-tema=claro] .app .grupo-exercicios>summary small` |  |
| src/estilos/paleta-clara.css:680 | `:root[data-tema=claro] .app .botao-principal` |  |
| src/estilos/paleta-clara.css:684 | `:root[data-tema=claro] .app .botao-principal:disabled` |  |
| src/estilos/paleta-clara.css:689 | `:root[data-tema=claro] .app .botao-principal:focus-visible` |  |
| src/estilos/paleta-clara.css:692 | `:root[data-tema=claro] .app .alca-painel` |  |
| src/estilos/paleta-clara.css:695 | `:root[data-tema=claro] .app .alca-painel>span` |  |
| src/estilos/paleta-clara.css:698 | `:root[data-tema=claro] .app .alca-painel:focus-visible` |  |
| src/estilos/paleta-clara.css:701 | `:root[data-tema=claro] .app .acao-treino` |  |
| src/estilos/paleta-clara.css:705 | `:root[data-tema=claro] .app .icone-acao` |  |
| src/estilos/paleta-clara.css:709 | `:root[data-tema=claro] .app .acao-treino summary small` |  |
| src/estilos/paleta-clara.css:712 | `:root[data-tema=claro] .app .seta-acao` |  |
| src/estilos/paleta-clara.css:715 | `:root[data-tema=claro] .app .observacao-treino .opcional` |  |
| src/estilos/paleta-clara.css:718 | `:root[data-tema=claro] .app .descanso-popup>strong` |  |
| src/estilos/paleta-clara.css:721 | `:root[data-tema=claro] .app .descanso-popup>p` |  |
| src/estilos/paleta-clara.css:724 | `:root[data-tema=claro] .app .ajustes-descanso button` |  |
| src/estilos/paleta-clara.css:728 | `:root[data-tema=claro] .app .filtro-musculos button` |  |
| src/estilos/paleta-clara.css:733 | `:root[data-tema=claro] .app .filtro-musculos button[aria-pressed=true]` |  |
| src/estilos/paleta-clara.css:737 | `:root[data-tema=claro] .app .biblioteca-cabecalho p` |  |
| src/estilos/paleta-clara.css:740 | `:root[data-tema=claro] .app .biblioteca-cartao .acoes button:last-child` |  |
| src/estilos/paleta-clara.css:744 | `:root[data-tema=claro] .app .secao-editor` |  |
| src/estilos/paleta-clara.css:748 | `:root[data-tema=claro] .app .secao-editor legend` |  |
| src/estilos/paleta-clara.css:751 | `:root[data-tema=claro] .app .rotulo-editor` |  |
| src/estilos/paleta-clara.css:754 | `:root[data-tema=claro] .app .escolhas-editor button` |  |
| src/estilos/paleta-clara.css:759 | `:root[data-tema=claro] .app .escolhas-editor button[aria-pressed=true]` |  |
| src/estilos/paleta-clara.css:763 | `:root[data-tema=claro] .app .explicacao-editor` |  |
| src/estilos/paleta-clara.css:766 | `:root[data-tema=claro] .app .grupo-personalizado` |  |
| src/estilos/paleta-clara.css:769 | `:root[data-tema=claro] .app .resumo-titulo .etiqueta` |  |
| src/estilos/paleta-clara.css:772 | `:root[data-tema=claro] .app .resumo-titulo p` |  |
| src/estilos/paleta-clara.css:775 | `:root[data-tema=claro] .app .metricas-resumo>div` |  |
| src/estilos/paleta-clara.css:779 | `:root[data-tema=claro] .app .metricas-resumo span` |  |
| src/estilos/paleta-clara.css:782 | `:root[data-tema=claro] .app .metricas-resumo strong` |  |
| src/estilos/paleta-clara.css:785 | `:root[data-tema=claro] .app .metricas-resumo strong small` |  |
| src/estilos/paleta-clara.css:788 | `:root[data-tema=claro] .app .nota-resumo` |  |
| src/estilos/paleta-clara.css:791 | `:root[data-tema=claro] .app .comparacao-resumo` |  |
| src/estilos/paleta-clara.css:794 | `:root[data-tema=claro] .app .calorias-resumo` |  |
| src/estilos/paleta-clara.css:798 | `:root[data-tema=claro] .app .calorias-resumo>span` |  |
| src/estilos/paleta-clara.css:801 | `:root[data-tema=claro] .app .calorias-resumo>strong` |  |
| src/estilos/paleta-clara.css:804 | `:root[data-tema=claro] .app .calorias-resumo>small` |  |
| src/estilos/paleta-clara.css:807 | `:root[data-tema=claro] .app .acoes-resumo-fixas` |  |
| src/estilos/paleta-clara.css:811 | `:root[data-tema=claro] .app .historico-series` |  |
| src/estilos/paleta-clara.css:814 | `:root[data-tema=claro] .app .progressao` |  |
| src/estilos/paleta-clara.css:817 | `:root[data-tema=claro] .app .progressao.subiu` |  |
| src/estilos/paleta-clara.css:820 | `:root[data-tema=claro] .app .progressao.caiu` |  |
| src/estilos/paleta-clara.css:823 | `:root[data-tema=claro] .app .progressao.igual` |  |
| src/estilos/paleta-clara.css:826 | `:root[data-tema=claro] .app .sugestao-carga` |  |
| src/estilos/paleta-clara.css:830 | `:root[data-tema=claro] .app .tabela-grafico` |  |
| src/estilos/paleta-clara.css:833 | `:root[data-tema=claro] .app .exercicio-historico` |  |
| src/estilos/paleta-clara.css:838 | `:root[data-tema=claro] .app .exercicio-historico small` |  |
| src/estilos/paleta-clara.css:841 | `:root[data-tema=claro] .app .excluir-historico` |  |
| src/estilos/paleta-clara.css:845 | `:root[data-tema=claro] .app .aviso-recorde` |  |
| src/estilos/paleta-clara.css:850 | `:root[data-tema=claro] .app .aviso-recorde button` |  |
| src/estilos/paleta-clara.css:853 | `:root[data-tema=claro] .app .ultimo-concluido` |  |
| src/estilos/paleta-clara.css:857 | `:root[data-tema=claro] .app .ultimo-concluido>span` |  |
| src/estilos/paleta-clara.css:860 | `:root[data-tema=claro] .app .aviso-remocao` |  |
| src/estilos/paleta-clara.css:864 | `:root[data-tema=claro] .app .aviso-remocao>span` |  |
| src/estilos/paleta-clara.css:867 | `:root[data-tema=claro] .app .aviso-remocao>button` |  |
| src/estilos/paleta-clara.css:870 | `:root[data-tema=claro] .app .busca-historico>small` |  |
| src/estilos/paleta-clara.css:873 | `:root[data-tema=claro] .app .valor-serie` |  |
| src/estilos/paleta-clara.css:877 | `:root[data-tema=claro] .app .foto-card` |  |
| src/estilos/paleta-clara.css:882 | `:root[data-tema=claro] .app .foto-card:focus-within` |  |
| src/estilos/paleta-clara.css:885 | `:root[data-tema=claro] .app .aviso-offline` |  |
| src/estilos/paleta-clara.css:889 | `:root[data-tema=claro] .app .icone-aviso-offline` |  |
| src/estilos/paleta-clara.css:893 | `:root[data-tema=claro] .app .aviso-offline p` |  |
| src/estilos/paleta-clara.css:896 | `:root[data-tema=claro] .app .remover-foto-card` |  |
| src/estilos/paleta-clara.css:900 | `:root[data-tema=claro] .app .finalizar-acoes .continuar-depois` |  |
| src/estilos/paleta-clara.css:905 | `:root[data-tema=claro] .app .finalizar-acoes .continuar-depois svg` |  |
| src/estilos/paleta-clara.css:908 | `:root[data-tema=claro] .app .finalizar-acoes .continuar-depois:active` |  |
| src/estilos/paleta-clara.css:911 | `:root[data-tema=claro] .app .topo-painel` |  |
| src/estilos/paleta-clara.css:914 | `:root[data-tema=claro] .app .abas-treino` |  |
| src/estilos/paleta-clara.css:918 | `:root[data-tema=claro] .app .abas-treino button` |  |
| src/estilos/paleta-clara.css:922 | `:root[data-tema=claro] .app .abas-treino button[aria-pressed=true]` |  |
| src/estilos/paleta-clara.css:927 | `:root[data-tema=claro] .app .abas-treino button:focus-visible` |  |
| src/estilos/paleta-clara.css:930 | `:root[data-tema=claro] .app .abas-treino button:active` |  |
| src/estilos/paleta-clara.css:933 | `:root[data-tema=claro] .app .linha-serie>.menu-serie` |  |
| src/estilos/paleta-clara.css:937 | `:root[data-tema=claro] .app .menu-serie[aria-expanded=true]` |  |
| src/estilos/paleta-clara.css:941 | `:root[data-tema=claro] .app .opcoes-serie>.formulario` |  |
| src/estilos/paleta-clara.css:944 | `:root[data-tema=claro] .app .ultimo-desempenho` |  |
| src/estilos/paleta-clara.css:948 | `:root[data-tema=claro] .app .ultimo-desempenho>span` |  |
| src/estilos/paleta-clara.css:951 | `:root[data-tema=claro] .app .ultimo-desempenho small` |  |
| src/estilos/paleta-clara.css:954 | `:root[data-tema=claro] .app .linha-historico-serie` |  |
| src/estilos/paleta-clara.css:957 | `:root[data-tema=claro] .app .linha-historico-serie>span:first-child` |  |
| src/estilos/paleta-clara.css:961 | `:root[data-tema=claro] .app .sessao-exercicio>summary>span>small` |  |
| src/estilos/paleta-clara.css:965 | `:root[data-tema=claro] .app .painel-modal>.topo-painel>header>.botao-icone` |  |
| src/estilos/paleta-clara.css:969 | `:root[data-tema=claro] .app .painel-modal>.topo-painel>header>.botao-icone:active` |  |
| src/estilos/paleta-clara.css:973 | `:root[data-tema=claro] .app .ultimo-concluido>.botao-secundario` |  |
| src/estilos/paleta-clara.css:978 | `:root[data-tema=claro] .app .barra-fichas>button` |  |
| src/estilos/paleta-clara.css:982 | `:root[data-tema=claro] .app .treino-livre` |  |
| src/estilos/paleta-clara.css:986 | `:root[data-tema=claro] .app .treino-livre>svg:first-child` |  |
| src/estilos/paleta-clara.css:989 | `:root[data-tema=claro] .app .treino-livre>span` |  |
| src/estilos/paleta-clara.css:992 | `:root[data-tema=claro] .app .treino-livre small` |  |
| src/estilos/paleta-clara.css:995 | `:root[data-tema=claro] .app .treino-livre:active, :root[data-tema=claro] .app .barra-fichas>button:active, :root[data-tema=claro] .app .ultimo-concluido>.botao-secundario:active` |  |
| src/estilos/paleta-clara.css:1000 | `:root[data-tema=claro] .app .andamento-treino>small` |  |
| src/estilos/paleta-clara.css:1003 | `:root[data-tema=claro] .app .andamento-treino>.manter-tela` |  |
| src/estilos/paleta-clara.css:1008 | `:root[data-tema=claro] .app .manter-tela svg` |  |
| src/estilos/paleta-clara.css:1011 | `:root[data-tema=claro] .app .acao-treino .salvar-planejamento` |  |
| src/estilos/paleta-clara.css:1015 | `:root[data-tema=claro] .app .metricas-resumo .explicacao-volume` |  |
| src/estilos/paleta-clara.css:1018 | `:root[data-tema=claro] .app .aviso-recorde` |  |
| src/estilos/paleta-clara.css:1023 | `:root[data-tema=claro] .app .aviso-recorde>.icone-recorde` |  |
| src/estilos/paleta-clara.css:1026 | `:root[data-tema=claro] .app .aviso-recorde p` |  |
| src/estilos/paleta-clara.css:1029 | `:root[data-tema=claro] .app .aviso-recorde>button` |  |
| src/estilos/paleta-clara.css:1033 | `:root[data-tema=claro] .app .aviso-recorde>button:active` |  |
| src/estilos/paleta-clara.css:1036 | `:root[data-tema=claro] .app .exercicio-historico-recolhivel>summary svg` |  |
| src/estilos/paleta-clara.css:1039 | `:root[data-tema=claro] .app .guia-esforco` |  |
| src/estilos/paleta-clara.css:1044 | `:root[data-tema=claro] .app .guia-esforco strong` |  |
| src/estilos/paleta-clara.css:1047 | `:root[data-tema=claro] .app .titulo-andamento>button` |  |
| src/estilos/paleta-clara.css:1051 | `:root[data-tema=claro] .app .painel-modal>.topo-painel` |  |
| src/estilos/paleta-clara.css:1054 | `:root[data-tema=claro] .app .topo-medidas p` |  |
| src/estilos/paleta-clara.css:1057 | `:root[data-tema=claro] .app .nova-medida` |  |
| src/estilos/paleta-clara.css:1060 | `:root[data-tema=claro] .app .vazio-medidas>svg` |  |
| src/estilos/paleta-clara.css:1063 | `:root[data-tema=claro] .app .data-medida` |  |
| src/estilos/paleta-clara.css:1068 | `:root[data-tema=claro] .app .data-medida strong` |  |
| src/estilos/paleta-clara.css:1071 | `:root[data-tema=claro] .app .campo-medida` |  |
| src/estilos/paleta-clara.css:1075 | `:root[data-tema=claro] .app .campo-medida>span` |  |
| src/estilos/paleta-clara.css:1078 | `:root[data-tema=claro] .app .campo-medida strong` |  |
| src/estilos/paleta-clara.css:1081 | `:root[data-tema=claro] .app .registro-medida` |  |
| src/estilos/paleta-clara.css:1085 | `:root[data-tema=claro] .app .registro-medida>summary small` |  |
| src/estilos/paleta-clara.css:1088 | `:root[data-tema=claro] .app .registro-medida>summary svg` |  |
| src/estilos/paleta-clara.css:1091 | `:root[data-tema=claro] .app .registro-medida dl>div` |  |
| src/estilos/paleta-clara.css:1094 | `:root[data-tema=claro] .app .registro-medida dt` |  |
| src/estilos/paleta-clara.css:1097 | `:root[data-tema=claro] .app .registro-medida dd` |  |
| src/estilos/paleta-clara.css:1100 | `:root[data-tema=claro] .app .acoes-medida>button` |  |
| src/estilos/paleta-clara.css:1105 | `:root[data-tema=claro] .app .acoes-medida>button+button` |  |
| src/estilos/paleta-clara.css:1110 | `:root[data-tema=claro] .app .escolher-comparacao` |  |
| src/estilos/paleta-clara.css:1114 | `:root[data-tema=claro] .app .escolher-comparacao span` |  |
| src/estilos/paleta-clara.css:1117 | `:root[data-tema=claro] .app .escolher-comparacao strong` |  |
| src/estilos/paleta-clara.css:1120 | `:root[data-tema=claro] .app .tabela-comparacao` |  |
| src/estilos/paleta-clara.css:1124 | `:root[data-tema=claro] .app .tabela-comparacao>div` |  |
| src/estilos/paleta-clara.css:1127 | `:root[data-tema=claro] .app .tabela-comparacao small` |  |
| src/estilos/paleta-clara.css:1130 | `:root[data-tema=claro] .app .tabela-comparacao strong` |  |
| src/estilos/paleta-clara.css:1133 | `:root[data-tema=claro] .app .cabecalho-comparacao` |  |
| src/estilos/paleta-clara.css:1137 | `:root[data-tema=claro] .app .lembrete-medidas` |  |
| src/estilos/paleta-clara.css:1141 | `:root[data-tema=claro] .app .lembrete-medidas>svg` |  |
| src/estilos/paleta-clara.css:1144 | `:root[data-tema=claro] .app .lembrete-medidas p` |  |
| src/estilos/paleta-clara.css:1147 | `:root[data-tema=claro] .app .lembrete-medidas button` |  |
| src/estilos/paleta-clara.css:1150 | `:root[data-tema=claro] .app .peso-resumo-medidas` |  |
| src/estilos/paleta-clara.css:1154 | `:root[data-tema=claro] .app .peso-resumo-medidas span` |  |
| src/estilos/paleta-clara.css:1157 | `:root[data-tema=claro] .app .peso-resumo-medidas strong small` |  |
| src/estilos/paleta-clara.css:1160 | `:root[data-tema=claro] .app .peso-resumo-medidas>p` |  |
| src/estilos/paleta-clara.css:1163 | `:root[data-tema=claro] .app .grade-resumo-medidas>div` |  |
| src/estilos/paleta-clara.css:1167 | `:root[data-tema=claro] .app .grade-resumo-medidas>div>span` |  |
| src/estilos/paleta-clara.css:1170 | `:root[data-tema=claro] .app .grade-resumo-medidas strong` |  |
| src/estilos/paleta-clara.css:1173 | `:root[data-tema=claro] .app .grade-resumo-medidas strong small` |  |
| src/estilos/paleta-clara.css:1176 | `:root[data-tema=claro] .app .grade-resumo-medidas p` |  |
| src/estilos/paleta-clara.css:1179 | `:root[data-tema=claro] .app .grafico-medidas-recolhivel` |  |
| src/estilos/paleta-clara.css:1183 | `:root[data-tema=claro] .app .grafico-medidas-recolhivel>summary` |  |
| src/estilos/paleta-clara.css:1186 | `:root[data-tema=claro] .app .grafico-medidas-recolhivel>summary small` |  |
| src/estilos/paleta-clara.css:1189 | `:root[data-tema=claro] .app .grafico-medidas-recolhivel>summary>svg` |  |
| src/estilos/paleta-clara.css:1192 | `:root[data-tema=claro] .app .acoes-cardio button` |  |
| src/estilos/paleta-clara.css:1195 | `:root[data-tema=claro] .app .acoes-cardio button+button` |  |
| src/estilos/paleta-clara.css:1200 | `:root[data-tema=claro] .app .opcionais-cardio>summary` |  |
| src/estilos/paleta-clara.css:1203 | `:root[data-tema=claro] .app .detalhe-cardio>p` |  |
| src/estilos/paleta-clara.css:1206 | `:root[data-tema=claro] .app .detalhe-cardio>.verde` |  |
| src/estilos/paleta-clara.css:1209 | `:root[data-tema=claro] .app .link-atividade` |  |
| src/estilos/paleta-clara.css:1213 | `:root[data-tema=claro] .app .atividade-hoje progress, :root[data-tema=claro] .app .tela-cardio progress` |  |
| src/estilos/paleta-clara.css:1218 | `:root[data-tema=claro] .app .atividade-hoje .data-medida small` |  |
| src/estilos/paleta-clara.css:1221 | `:root[data-tema=claro] .app .cardio-do-dia>div>strong` |  |
| src/estilos/paleta-clara.css:1224 | `:root[data-tema=claro] .app .linha-feriado` |  |
| src/estilos/paleta-clara.css:1228 | `:root[data-tema=claro] .app .linha-feriado>button` |  |
| src/estilos/paleta-clara.css:1232 | `:root[data-tema=claro] .app .linha-feriado small` |  |
| src/estilos/paleta-clara.css:1235 | `:root[data-tema=claro] .app .linha-feriado>button+button` |  |
| src/estilos/paleta-clara.css:1238 | `:root[data-tema=claro] .app .incluir-fotos` |  |
| src/estilos/paleta-clara.css:1241 | `:root[data-tema=claro] .app .incluir-fotos input` |  |
| src/estilos/paleta-clara.css:1244 | `:root[data-tema=claro] .app .arquivo-backup` |  |
| src/estilos/paleta-clara.css:1248 | `:root[data-tema=claro] .app .arquivo-backup>small` |  |
| src/estilos/paleta-clara.css:1251 | `:root[data-tema=claro] .app .formulario-conta input` |  |
| src/estilos/paleta-clara.css:1254 | `:root[data-tema=claro] .app .marca-entrada>span` |  |
| src/estilos/paleta-clara.css:1257 | `:root[data-tema=claro] .app .marca-entrada small` |  |
| src/estilos/paleta-clara.css:1260 | `:root[data-tema=claro] .app .apresentacao-entrada p` |  |
| src/estilos/paleta-clara.css:1263 | `:root[data-tema=claro] .app .conta-entrada .formulario-conta label, :root[data-tema=claro] .app .campo-senha>label` |  |
| src/estilos/paleta-clara.css:1267 | `:root[data-tema=claro] .app .conta-entrada .formulario-conta input` |  |
| src/estilos/paleta-clara.css:1271 | `:root[data-tema=claro] .app .formulario-conta input::placeholder` |  |
| src/estilos/paleta-clara.css:1274 | `:root[data-tema=claro] .app .formulario-conta input:focus-visible` |  |
| src/estilos/paleta-clara.css:1277 | `:root[data-tema=claro] .app .campo-senha>div button` |  |
| src/estilos/paleta-clara.css:1281 | `:root[data-tema=claro] .app .link-conta` |  |
| src/estilos/paleta-clara.css:1285 | `:root[data-tema=claro] .app .link-conta:hover` |  |
| src/estilos/paleta-clara.css:1288 | `:root[data-tema=claro] .app .conta-entrada .recuperar-senha` |  |
| src/estilos/paleta-clara.css:1291 | `:root[data-tema=claro] .app .alternativa-entrada>span` |  |
| src/estilos/paleta-clara.css:1294 | `:root[data-tema=claro] .app .alternativa-entrada>span::before, :root[data-tema=claro] .app .alternativa-entrada>span::after` |  |
| src/estilos/paleta-clara.css:1298 | `:root[data-tema=claro] .app .alternativa-entrada p` |  |
| src/estilos/paleta-clara.css:1301 | `:root[data-tema=claro] .app .entrada-conta .conta-entrada p[role=status]` |  |
| src/estilos/paleta-clara.css:1304 | `:root[data-tema=claro] .app .atividade-hoje .cartoes-movimento progress` |  |
| src/estilos/paleta-clara.css:1309 | `:root[data-tema=claro] .app .cartoes-movimento progress::-webkit-progress-bar` |  |
| src/estilos/paleta-clara.css:1312 | `:root[data-tema=claro] .app .atividade-hoje>.data-medida+.nota-resumo` |  |
| src/estilos/paleta-clara.css:1315 | `:root[data-tema=claro] .app .secao-config` |  |
| src/estilos/paleta-clara.css:1319 | `:root[data-tema=claro] .app .icone-config` |  |
| src/estilos/paleta-clara.css:1323 | `:root[data-tema=claro] .app .texto-config>strong` |  |
| src/estilos/paleta-clara.css:1326 | `:root[data-tema=claro] .app .texto-config>small` |  |
| src/estilos/paleta-clara.css:1329 | `:root[data-tema=claro] .app .seta-config` |  |
| src/estilos/paleta-clara.css:1332 | `:root[data-tema=claro] .app .secao-config.expandida>h2` |  |
| src/estilos/paleta-clara.css:1335 | `:root[data-tema=claro] .app .conta .conta-vinculo>p` |  |
| src/estilos/paleta-clara.css:1338 | `:root[data-tema=claro] .app .conta-rodape` |  |
| src/estilos/paleta-clara.css:1341 | `:root[data-tema=claro] .app .sair-conta` |  |
| src/estilos/paleta-clara.css:1345 | `:root[data-tema=claro] .app .sair-conta:hover` |  |
| src/estilos/paleta-clara.css:1348 | `:root[data-tema=claro] .app .conta .conta-rodape>p` |  |
| src/estilos/paleta-clara.css:1351 | `:root[data-tema=claro] .app .ajuda-conta` |  |
| src/estilos/paleta-clara.css:1354 | `:root[data-tema=claro] .app .ajuda-conta>summary` |  |
| src/estilos/paleta-clara.css:1357 | `:root[data-tema=claro] .app .conta .ajuda-conta>p` |  |
| src/estilos/paleta-clara.css:1360 | `:root[data-tema=claro] .app .conteudo-config .ajuda-conta` |  |
| src/estilos/paleta-clara.css:1363 | `:root[data-tema=claro] .app .saida-config` |  |
| src/estilos/paleta-clara.css:1366 | `:root[data-tema=claro] .app .saida-config>.sair-conta` |  |
| src/estilos/paleta-clara.css:1371 | `:root[data-tema=claro] .app .saida-config>.sair-conta:hover` |  |
| src/estilos/paleta-clara.css:1374 | `:root[data-tema=claro] .app .saida-config>p:not(.erro)` |  |
| src/estilos/paleta-clara.css:1377 | `:root[data-tema=claro] .app .treino-em-andamento .andamento-treino` |  |
| src/estilos/paleta-clara.css:1381 | `:root[data-tema=claro] .app .treino-em-andamento .progresso-sessao` |  |
| src/estilos/paleta-clara.css:1384 | `:root[data-tema=claro] .app .progresso-sessao>strong` |  |
| src/estilos/paleta-clara.css:1387 | `:root[data-tema=claro] .app .progresso-sessao>strong>small` |  |
| src/estilos/paleta-clara.css:1390 | `:root[data-tema=claro] .app .barra-sessao` |  |
| src/estilos/paleta-clara.css:1395 | `:root[data-tema=claro] .app .barra-sessao::-webkit-progress-bar` |  |
| src/estilos/paleta-clara.css:1398 | `:root[data-tema=claro] .app .treino-em-andamento .andamento-treino .manter-tela` |  |
| src/estilos/paleta-clara.css:1403 | `:root[data-tema=claro] .app .treino-em-andamento .exercicio-recolhivel` |  |
| src/estilos/paleta-clara.css:1407 | `:root[data-tema=claro] .app .treino-em-andamento .exercicio-recolhivel[open]>.cabecalho-exercicio` |  |
| src/estilos/paleta-clara.css:1410 | `:root[data-tema=claro] .app .treino-em-andamento .miniatura-exercicio` |  |
| src/estilos/paleta-clara.css:1413 | `:root[data-tema=claro] .app .treino-em-andamento .resumo-exercicio small:last-child` |  |
| src/estilos/paleta-clara.css:1416 | `:root[data-tema=claro] .app .treino-em-andamento .conteudo-exercicio` |  |
| src/estilos/paleta-clara.css:1419 | `:root[data-tema=claro] .app .treino-em-andamento .ajuda-no-treino` |  |
| src/estilos/paleta-clara.css:1423 | `:root[data-tema=claro] .app .treino-em-andamento .conteudo-exercicio>.botao-descanso` |  |
| src/estilos/paleta-clara.css:1427 | `:root[data-tema=claro] .app .treino-em-andamento .conteudo-exercicio>.botao-descanso>span::after` |  |
| src/estilos/paleta-clara.css:1430 | `:root[data-tema=claro] .app .treino-em-andamento .cabecalho-series` |  |
| src/estilos/paleta-clara.css:1433 | `:root[data-tema=claro] .app .treino-em-andamento .serie-compacta` |  |
| src/estilos/paleta-clara.css:1436 | `:root[data-tema=claro] .app .treino-em-andamento .serie-compacta.proxima-serie` |  |
| src/estilos/paleta-clara.css:1440 | `:root[data-tema=claro] .app .treino-em-andamento .valor-serie` |  |
| src/estilos/paleta-clara.css:1444 | `:root[data-tema=claro] .app .treino-em-andamento .serie-compacta.concluida` |  |
| src/estilos/paleta-clara.css:1447 | `:root[data-tema=claro] .app .treino-em-andamento .concluida .valor-serie` |  |
| src/estilos/paleta-clara.css:1451 | `:root[data-tema=claro] .app .treino-em-andamento .conteudo-exercicio>.ultimo-desempenho` |  |
| src/estilos/paleta-clara.css:1455 | `:root[data-tema=claro] .app .treino-em-andamento>.cancelar-sessao` |  |
| src/estilos/paleta-clara.css:1459 | `:root[data-tema=claro] .app .treino-em-andamento>.cancelar-sessao:hover` |  |
| src/estilos/paleta-clara.css:1462 | `:root[data-tema=claro] .app .troca-treino-dialogo>button:last-of-type` |  |
| src/estilos/paleta-clara.css:1467 | `:root[data-tema=claro] .app .abas-catalogo` |  |
| src/estilos/paleta-clara.css:1471 | `:root[data-tema=claro] .app .abas-catalogo>button` |  |
| src/estilos/paleta-clara.css:1475 | `:root[data-tema=claro] .app .abas-catalogo>button[aria-pressed=true]` |  |
| src/estilos/paleta-clara.css:1478 | `:root[data-tema=claro] .app .musculos-catalogo>button` |  |
| src/estilos/paleta-clara.css:1483 | `:root[data-tema=claro] .app .musculos-catalogo>button[aria-pressed=true]` |  |
| src/estilos/paleta-clara.css:1488 | `:root[data-tema=claro] .app .musculos-catalogo::-webkit-scrollbar-track` |  |
| src/estilos/paleta-clara.css:1491 | `:root[data-tema=claro] .app .musculos-catalogo::-webkit-scrollbar-thumb` |  |
| src/estilos/paleta-clara.css:1494 | `:root[data-tema=claro] .app .contagem-catalogo` |  |
| src/estilos/paleta-clara.css:1497 | `:root[data-tema=claro] .app .contagem-catalogo>span:first-child` |  |
| src/estilos/paleta-clara.css:1500 | `:root[data-tema=claro] .app .item-catalogo` |  |
| src/estilos/paleta-clara.css:1503 | `:root[data-tema=claro] .app .nome-catalogo>strong` |  |
| src/estilos/paleta-clara.css:1506 | `:root[data-tema=claro] .app .nome-catalogo>small` |  |
| src/estilos/paleta-clara.css:1509 | `:root[data-tema=claro] .app .lista-catalogo .miniatura-exercicio` |  |
| src/estilos/paleta-clara.css:1514 | `:root[data-tema=claro] .app .item-catalogo>.menu-ficha>summary` |  |
| src/estilos/paleta-clara.css:1517 | `:root[data-tema=claro] .app .item-catalogo:hover` |  |
| src/estilos/paleta-clara.css:1520 | `:root[data-tema=claro] .app .selecionar-exercicio` |  |
| src/estilos/paleta-clara.css:1523 | `:root[data-tema=claro] .app .selecionar-exercicio[aria-pressed=true]` |  |
| src/estilos/paleta-clara.css:1527 | `:root[data-tema=claro] .app .marcador-catalogo` |  |
| src/estilos/paleta-clara.css:1531 | `:root[data-tema=claro] .app .selecionar-exercicio[aria-pressed=true] .marcador-catalogo` |  |
| src/estilos/paleta-clara.css:1535 | `:root[data-tema=claro] .app .vazio-catalogo` |  |
| src/estilos/paleta-clara.css:1538 | `:root[data-tema=claro] .app .confirmar-catalogo` |  |
| src/estilos/paleta-clara.css:1542 | `:root[data-tema=claro] .app .confirmar-catalogo>span` |  |
| src/estilos/paleta-clara.css:1545 | `:root[data-tema=claro] .app .ampliar-catalogo` |  |
| src/estilos/paleta-clara.css:1549 | `:root[data-tema=claro] .app .ampliar-catalogo strong` |  |
| src/estilos/paleta-clara.css:1552 | `:root[data-tema=claro] .app .ampliar-catalogo p` |  |
| src/estilos/paleta-clara.css:1555 | `:root[data-tema=claro] .app .ampliar-catalogo>button` |  |
| src/estilos/paleta-clara.css:1559 | `:root[data-tema=claro] .app .retomar-treino.retomar-compacto` |  |
| src/estilos/paleta-clara.css:1564 | `:root[data-tema=claro] .app .retomar-identidade` |  |
| src/estilos/paleta-clara.css:1567 | `:root[data-tema=claro] .app .retomar-identidade>small` |  |
| src/estilos/paleta-clara.css:1570 | `:root[data-tema=claro] .app .retomar-progresso>p` |  |
| src/estilos/paleta-clara.css:1573 | `:root[data-tema=claro] .app .retomar-progresso>p>span` |  |
| src/estilos/paleta-clara.css:1576 | `:root[data-tema=claro] .app .retomar-treino.retomar-compacto>button` |  |
| src/estilos/paleta-clara.css:1579 | `:root[data-tema=claro] .app .ficha-nova.ficha-em-andamento` |  |
| src/estilos/paleta-clara.css:1582 | `:root[data-tema=claro] .app .ficha-em-andamento .abrir-ficha small` |  |
| src/estilos/paleta-clara.css:1585 | `:root[data-tema=claro] .app .ficha-em-andamento .iniciar-ficha` |  |
| src/estilos/paleta-clara.css:1590 | `:root[data-tema=claro] .app .abas-medidas` |  |
| src/estilos/paleta-clara.css:1594 | `:root[data-tema=claro] .app .abas-medidas>button` |  |
| src/estilos/paleta-clara.css:1598 | `:root[data-tema=claro] .app .abas-medidas>button[aria-pressed=true]` |  |
| src/estilos/paleta-clara.css:1601 | `:root[data-tema=claro] .app .par-resumo-medida` |  |
| src/estilos/paleta-clara.css:1605 | `:root[data-tema=claro] .app .par-resumo-medida h3` |  |
| src/estilos/paleta-clara.css:1608 | `:root[data-tema=claro] .app .par-resumo-medida>header>span` |  |
| src/estilos/paleta-clara.css:1611 | `:root[data-tema=claro] .app .par-resumo-medida>dl>div+div` |  |
| src/estilos/paleta-clara.css:1614 | `:root[data-tema=claro] .app .par-resumo-medida dt` |  |
| src/estilos/paleta-clara.css:1617 | `:root[data-tema=claro] .app .par-resumo-medida dd` |  |
| src/estilos/paleta-clara.css:1620 | `:root[data-tema=claro] .app .par-resumo-medida dd>small` |  |
| src/estilos/paleta-clara.css:1623 | `:root[data-tema=claro] .app .par-resumo-medida dl p` |  |
| src/estilos/paleta-clara.css:1626 | `:root[data-tema=claro] .app .evolucao-medidas` |  |
| src/estilos/paleta-clara.css:1630 | `:root[data-tema=claro] .app .evolucao-medidas>header>svg` |  |
| src/estilos/paleta-clara.css:1633 | `:root[data-tema=claro] .app .evolucao-medidas header p` |  |
| src/estilos/paleta-clara.css:1636 | `:root[data-tema=claro] .app .tela-medidas .tabela-comparacao strong` |  |
| src/estilos/paleta-clara.css:1639 | `:root[data-tema=claro] .app .editor-medidas-grupos .campo-medida small` |  |
| src/estilos/paleta-clara.css:1642 | `:root[data-tema=claro] .app .editor-medidas-grupos .medida-vazia strong` |  |
| src/estilos/paleta-clara.css:1645 | `:root[data-tema=claro] .app .par-editor-medidas>legend` |  |
| src/estilos/paleta-clara.css:1648 | `:root[data-tema=claro] .app .aviso-desfazer>span>small` |  |
| src/estilos/paleta-clara.css:1651 | `:root[data-tema=claro] .app .historico-cartao>small` |  |
| src/estilos/paleta-clara.css:1654 | `:root[data-tema=claro] .app .historico-cartao>small>span` |  |
| src/estilos/paleta-clara.css:1657 | `:root[data-tema=claro] .app .sessao-exercicio>summary>span>small` |  |
| src/estilos/paleta-clara.css:1660 | `:root[data-tema=claro] .app .ultimo-concluido.ultimo-treino-atalho` |  |
| src/estilos/paleta-clara.css:1665 | `:root[data-tema=claro] .app .ultimo-treino-atalho>.icone-ultimo-treino` |  |
| src/estilos/paleta-clara.css:1670 | `:root[data-tema=claro] .app .texto-ultimo-treino>small` |  |
| src/estilos/paleta-clara.css:1673 | `:root[data-tema=claro] .app .texto-ultimo-treino>strong` |  |
| src/estilos/paleta-clara.css:1676 | `:root[data-tema=claro] .app .ultimo-treino-atalho>.acao-ultimo-treino` |  |
| src/estilos/paleta-clara.css:1679 | `:root[data-tema=claro] .app .ultimo-treino-atalho:hover .acao-ultimo-treino` |  |
| src/estilos/paleta-clara.css:1682 | `:root[data-tema=claro] .app .ultimo-concluido.ultimo-treino-atalho:active` |  |
| src/estilos/paleta-clara.css:1685 | `:root[data-tema=claro] .app .modelos-card>button` |  |
| src/estilos/paleta-clara.css:1689 | `:root[data-tema=claro] .app .modelos-card>button[aria-pressed=true]` |  |
| src/estilos/paleta-clara.css:1693 | `:root[data-tema=claro] .app .modelos-card strong` |  |
| src/estilos/paleta-clara.css:1696 | `:root[data-tema=claro] .app .modelos-card small` |  |
| src/estilos/paleta-clara.css:1699 | `:root[data-tema=claro] .app .opcoes-adesivo>span` |  |
| src/estilos/paleta-clara.css:1702 | `:root[data-tema=claro] .app .opcoes-adesivo>button` |  |
| src/estilos/paleta-clara.css:1707 | `:root[data-tema=claro] .app .opcoes-adesivo>button[aria-pressed=true]` |  |
| src/estilos/paleta-clara.css:1712 | `:root[data-tema=claro] .app .area-preview-card` |  |
| src/estilos/paleta-clara.css:1716 | `:root[data-tema=claro] .app .area-preview-card.preview-transparente` |  |
| src/estilos/paleta-clara.css:1719 | `:root[data-tema=claro] .app .area-preview-card>p` |  |
| src/estilos/paleta-clara.css:1722 | `:root[data-tema=claro] .app .criador-card>.remover-foto-card` |  |
| src/estilos/paleta-clara.css:1726 | `:root[data-tema=claro] .app .dica-story` |  |
| src/estilos/paleta-clara.css:1729 | `:root[data-tema=claro] .app .aviso-card` |  |
| src/estilos/paleta-clara.css:1733 | `:root[data-tema=claro] .app .texto-compartilhar` |  |
| src/estilos/paleta-clara.css:1736 | `:root[data-tema=claro] .app .texto-compartilhar>textarea` |  |
| src/estilos/paleta-clara.css:1741 | `:root[data-tema=claro] .app .alternador-seletor` |  |
| src/estilos/paleta-clara.css:1745 | `:root[data-tema=claro] .app .opcao-seletor` |  |
| src/estilos/paleta-clara.css:1749 | `:root[data-tema=claro] .app .opcao-seletor.selecionada` |  |
| src/estilos/paleta-clara.css:1752 | `:root[data-tema=claro] .app .botao-atalho-numero` |  |
| src/estilos/paleta-clara.css:1757 | `:root[data-tema=claro] .app .botao-atalho-numero:active` |  |
| src/estilos/paleta-clara.css:1761 | `:root[data-tema=claro] .app .input-com-unidade input` |  |
| src/estilos/paleta-clara.css:1766 | `:root[data-tema=claro] .app .input-com-unidade input:focus-visible` |  |
| src/estilos/paleta-clara.css:1769 | `:root[data-tema=claro] .app .unidade-input` |  |
| src/estilos/paleta-clara.css:1772 | `:root[data-tema=claro] .app .formulario-cardio .opcionais-cardio` |  |
| src/estilos/paleta-clara.css:1775 | `:root[data-tema=claro] .app .formulario-cardio .opcionais-cardio>summary` |  |
| src/estilos/paleta-clara.css:1778 | `:root[data-tema=claro] .app .grupo-campos-cardio>legend` |  |
| src/estilos/paleta-clara.css:1781 | `:root[data-tema=claro] .app .digitar-duracao>label` |  |
| src/estilos/paleta-clara.css:1784 | `:root[data-tema=claro] .app .digitar-duracao input` |  |
| src/estilos/paleta-clara.css:1789 | `:root[data-tema=claro] .app .botao-destrutivo` |  |
| src/estilos/paleta-clara.css:1794 | `:root[data-tema=claro] .app .botao-destrutivo:focus-visible` |  |
| src/estilos/paleta-clara.css:1797 | `:root[data-tema=claro] .app .privacidade-alerta` |  |
| src/estilos/paleta-clara.css:1801 | `:root[data-tema=claro] .app .privacidade-alerta > strong` |  |
| src/estilos/paleta-clara.css:1804 | `:root[data-tema=claro] .app .privacidade-alerta > p` |  |
| src/estilos/paleta-clara.css:1807 | `:root[data-tema=claro] .app .botao-destrutivo:hover` |  |
| src/estilos/paleta-clara.css:1810 | `:root[data-tema=claro] .app .confirmacao-app > p` |  |
| src/estilos/paleta-clara.css:1813 | `:root[data-tema=claro] .app .aviso-backup` |  |
| src/estilos/paleta-clara.css:1817 | `:root[data-tema=claro] .app .aviso-backup-titulo > svg` |  |
| src/estilos/paleta-clara.css:1820 | `:root[data-tema=claro] .app .aviso-backup > p` |  |
| src/estilos/paleta-clara.css:1823 | `:root[data-tema=claro] .app .formulario .opcao-copia-exercicio > input` |  |
| src/estilos/paleta-clara.css:1826 | `:root[data-tema=claro] .app .botao-secundario:active:not(:disabled)` |  |
| src/estilos/paleta-clara.css:1829 | `:root[data-tema=claro] .app .botao-principal:disabled, :root[data-tema=claro] .app .botao-secundario:disabled` |  |
| src/estilos/paleta-clara.css:1835 | `:root[data-tema=claro] .app .botao-secundario.excluir-historico` |  |
| src/estilos/paleta-clara.css:1840 | `:root[data-tema=claro] .app .abas-treino, :root[data-tema=claro] .app .abas-medidas, :root[data-tema=claro] .app .abas-catalogo, :root[data-tema=claro] .app .alternador-seletor` |  |
| src/estilos/paleta-clara.css:1847 | `:root[data-tema=claro] .app .abas-treino > button, :root[data-tema=claro] .app .abas-medidas > button, :root[data-tema=claro] .app .abas-catalogo > button, :root[data-tema=claro] .app .alternador-seletor > button` |  |
| src/estilos/paleta-clara.css:1854 | `:root[data-tema=claro] .app :is(.botao-principal, .botao-secundario, .abas-treino > button, .abas-medidas > button, .abas-catalogo > button, .alternador-seletor > button):focus-visible` |  |
| src/estilos/paleta-clara.css:1857 | `:root[data-tema=claro] .app .aviso-confirmacao-conta` |  |
| src/estilos/paleta-clara.css:1862 | `:root[data-tema=claro] .app .aviso-confirmacao-conta > strong` |  |
| src/estilos/paleta-clara.css:1865 | `:root[data-tema=claro] .app .conta .aviso-confirmacao-conta > p` |  |
| src/estilos/paleta-clara.css:1868 | `:root[data-tema=claro] .app .aviso-confirmacao-conta b` |  |
| src/estilos/paleta-clara.css:1871 | `:root[data-tema=claro] .app .campos-adesivo` |  |
| src/estilos/paleta-clara.css:1874 | `:root[data-tema=claro] .app .campos-adesivo legend` |  |
| src/estilos/paleta-clara.css:1877 | `:root[data-tema=claro] .app .criador-card > .preview-story` |  |
| src/estilos/paleta-clara.css:1880 | `:root[data-tema=claro] .app .privacidade-grupo` |  |
| src/estilos/paleta-clara.css:1883 | `:root[data-tema=claro] .app .privacidade-grupo > summary` |  |
| src/estilos/paleta-clara.css:1886 | `:root[data-tema=claro] .app .privacidade-grupo summary small` |  |
| src/estilos/paleta-clara.css:1889 | `:root[data-tema=claro] .app .privacidade-contagem` |  |
| src/estilos/paleta-clara.css:1893 | `:root[data-tema=claro] .app .privacidade-dados .privacidade-grupo > h3` |  |
| src/estilos/paleta-clara.css:1896 | `:root[data-tema=claro] .app .backup-protecao` |  |
| src/estilos/paleta-clara.css:1900 | `:root[data-tema=claro] .app .backup-protecao > svg` |  |
| src/estilos/paleta-clara.css:1903 | `:root[data-tema=claro] .app .backup-protecao strong` |  |
| src/estilos/paleta-clara.css:1906 | `:root[data-tema=claro] .app .backup-config .backup-protecao p` |  |
| src/estilos/paleta-clara.css:1909 | `:root[data-tema=claro] .app .backup-config .opcao-fotos-backup` |  |
| src/estilos/paleta-clara.css:1912 | `:root[data-tema=claro] .app .backup-outros-formatos` |  |
| src/estilos/paleta-clara.css:1915 | `:root[data-tema=claro] .app .backup-outros-formatos > summary` |  |
| src/estilos/paleta-clara.css:1918 | `:root[data-tema=claro] .app .botao-secundario:hover:not(:disabled)` |  |
| src/estilos/paleta-clara.css:1921 | `:root[data-tema=claro] .app .treino-em-andamento .conteudo-exercicio > .acoes > button:last-child` |  |
| src/estilos/contraste-claro.css:2 | `:root[data-tema=claro] .app :is(input,textarea)::placeholder` |  |
| src/estilos/contraste-claro.css:3 | `:root[data-tema=claro] .app :is(input,select,textarea)` |  |
| src/estilos/contraste-claro.css:4 | `:root[data-tema=claro] .app :focus-visible` |  |
| src/estilos/contraste-claro.css:5 | `:root[data-tema=claro] .app .recharts-cartesian-axis-tick-value` |  |
| src/estilos/contraste-claro.css:6 | `:root[data-tema=claro] .app .recharts-cartesian-grid line` |  |
| src/estilos/contraste-claro.css:7 | `:root[data-tema=claro] .app .recharts-line-curve` |  |
| src/estilos/contraste-claro.css:8 | `:root[data-tema=claro] .app .recharts-line-curve[stroke-dasharray]` |  |
| src/estilos/contraste-claro.css:9 | `:root[data-tema=claro] .app .recharts-dot` |  |
| src/estilos/contraste-claro.css:10 | `:root[data-tema=claro] .app .recharts-default-tooltip` |  |
| src/estilos/contraste-claro.css:11 | `:root[data-tema=claro] .app .recharts-tooltip-item` |  |
| src/estilos/contraste-claro.css:12 | `:root[data-tema=claro] .app progress` |  |
| src/estilos/contraste-claro.css:13 | `:root[data-tema=claro] .app progress::-webkit-progress-value` |  |
| src/estilos/contraste-claro.css:14 | `:root[data-tema=claro] .app progress::-moz-progress-bar` |  |
| src/estilos/contraste-claro.css:15 | `:root[data-tema=claro] .app .item-ficha .acoes > button:last-child, :root[data-tema=claro] .app .tela-cardio .acoes-medida > button:last-child` |  |
| src/estilos/contraste-claro.css:17 | `:root[data-tema=claro] .app .coluna-roda .faixa-roda` |  |
| src/estilos/contraste-claro.css:18 | `:root[data-tema=claro] .app .navegacao button` |  |
| src/estilos/contraste-claro.css:19 | `:root[data-tema=claro] .app .navegacao button[aria-current=page]` |  |
| src/estilos/contraste-claro.css:20 | `:root[data-tema=claro] .app .navegacao button :is(svg,span)` |  |
| src/estilos/contraste-claro.css:21 | `:root[data-tema=claro] .app .destaque .botao-principal` |  |
| src/estilos/contraste-claro.css:22 | `:root[data-tema=claro] .app .destaque .botao-principal :is(svg,span)` |  |
| src/estilos/contraste-claro.css:25 | `:root[data-tema=claro] .app` |  |
| src/estilos/contraste-claro.css:26 | `:root[data-tema=claro] .app > .cabecalho` |  |
| src/estilos/contraste-claro.css:27 | `:root[data-tema=claro] .app > .navegacao` |  |
| src/estilos/contraste-claro.css:28 | `:root[data-tema=claro] .app .navegacao button[aria-current=page]` |  |
| src/estilos/contraste-claro.css:29 | `:root[data-tema=claro] .app :is(.painel,.cartao,.peso-resumo-medidas,.par-resumo-medida)` |  |
| src/estilos/contraste-claro.css:30 | `:root[data-tema=claro] .app .config-lista` |  |
| src/estilos/contraste-claro.css:31 | `:root[data-tema=claro] .app .secao-config` |  |
| src/estilos/contraste-claro.css:32 | `:root[data-tema=claro] .app .icone-config` |  |
| src/estilos/contraste-claro.css:33 | `:root[data-tema=claro] .app .destaque` |  |
| src/estilos/contraste-claro.css:34 | `:root[data-tema=claro] .app .cartao .verde` |  |
| src/estilos/contraste-claro.css:35 | `:root[data-tema=claro] .app .cartao .laranja` |  |
| src/estilos/contraste-claro.css:36 | `:root[data-tema=claro] .app .cartao .azul` |  |
| src/estilos/contraste-claro.css:37 | `:root[data-tema=claro] .app .aviso-modo-visitante` |  |
| src/estilos/contraste-claro.css:38 | `:root[data-tema=claro] .app .painel-modal` |  |
| src/estilos/contraste-claro.css:39 | `:root[data-tema=claro] .app .painel-modal > .topo-painel, :root[data-tema=claro] .app .painel-modal > .topo-painel > header` |  |
| src/estilos/contraste-claro.css:41 | `:root[data-tema=claro] .app .ultimo-concluido.ultimo-treino-atalho` |  |
| src/estilos/contraste-claro.css:42 | `:root[data-tema=claro] .app .grade-resumo-medidas > div, :root[data-tema=claro] .app .par-resumo-medida` |  |
| src/estilos/superficies.css:9 | `:root[data-tema=claro]` |  |
| src/estilos/superficies.css:14 | `:root[data-tema] .app :is(.painel,.cartao,.painel.ficha-cartao,.registro-medida,.historico-cartao,.config-lista,.peso-resumo-medidas,.par-resumo-medida,.evolucao-medidas,.privacidade-recolhida,.grade-resumo-medidas > div)` |  |
| src/estilos/superficies.css:21 | `:root[data-tema] .app :is(.grade-resumo-medidas > div,.par-resumo-medida,.peso-resumo-medidas)` |  |
| src/estilos/superficies.css:22 | `:root[data-tema] .app :is(.grade-resumo-medidas,.pares-resumo-medidas,.historico-medidas)` |  |
| src/estilos/superficies.css:23 | `:root[data-tema] .app :is(.grade-resumo-medidas strong,.par-resumo-medida dd)` |  |
| src/estilos/superficies.css:24 | `:root[data-tema] .app :is(.grade-resumo-medidas p,.grade-resumo-medidas span,.par-resumo-medida dt,.par-resumo-medida dl p,.par-resumo-medida > header > span)` |  |
| src/estilos/superficies.css:25 | `:root[data-tema] .app .par-resumo-medida h3` |  |
| src/estilos/superficies.css:26 | `:root[data-tema] .app :is(.par-resumo-medida dd small,.grade-resumo-medidas strong small)` |  |
| src/estilos/superficies.css:27 | `:root[data-tema] .app :is(.metricas-resumo > div,.campo-medida,.data-medida,.calorias-resumo,.arquivo-backup)` |  |
| src/estilos/superficies.css:34 | `:root[data-tema] .app :is(.formulario,.confirmacao-app,.editor-medidas-grupos)` |  |
| src/estilos/superficies.css:35 | `:root[data-tema] .app .tela-medidas` |  |
| src/estilos/superficies.css:36 | `:root[data-tema] .app .tela-medidas > :is(.topo-medidas,.painel,.peso-resumo-medidas,.abas-medidas)` |  |
| src/estilos/superficies.css:37 | `:root[data-tema] .app .formulario label` |  |
| src/estilos/superficies.css:38 | `:root[data-tema] .app .painel-modal > .topo-painel, :root[data-tema] .app .painel-modal > .topo-painel > header` |  |
| src/estilos/superficies.css:40 | `:root[data-tema] .app .painel-modal > .conteudo-modal` |  |
| src/estilos/superficies.css:41 | `:root[data-tema] .app .painel-modal > .topo-painel h2` |  |
| src/estilos/superficies.css:42 | `:root[data-tema] .app .painel-modal > .topo-painel > .alca-painel` |  |
| src/estilos/superficies.css:43 | `:root[data-tema] .app .painel-modal > .topo-painel > .alca-painel > span` |  |
| src/estilos/superficies.css:44 | `:root[data-tema] .app .painel-modal > .topo-painel > .alca-painel:focus` |  |
| src/estilos/superficies.css:45 | `:root[data-tema] .app .painel-modal > .topo-painel > .alca-painel:focus-visible > span` |  |
| src/estilos/superficies.css:47 | `:root[data-tema] .app .config-lista .secao-config` |  |
| src/estilos/superficies.css:48 | `:root[data-tema] .app .config-lista .secao-config + .secao-config` |  |
| src/estilos/superficies.css:49 | `:root[data-tema] .app .conteudo-config > .painel` |  |
| src/estilos/superficies.css:50 | `:root[data-tema] .app .ultimo-concluido.ultimo-treino-atalho` |  |
| src/estilos/superficies.css:51 | `:root[data-tema] .app .conteudo-config:not([hidden])` |  |
| src/estilos/superficies.css:52 | `:root[data-tema] .app .conteudo-config > .painel > .nota-resumo + .abas-treino` |  |
| src/estilos/superficies.css:53 | `:root[data-tema] .app .privacidade-recolhida` |  |
| src/estilos/superficies.css:54 | `:root[data-tema] .app .privacidade-recolhida > summary` |  |
| src/estilos/superficies.css:55 | `:root[data-tema] .app .privacidade-recolhida > .painel.privacidade-dados` |  |
| src/estilos/superficies.css:59 | `:root[data-tema] .app .privacidade-dados > h2` |  |
| src/estilos/superficies.css:60 | `:root[data-tema] .app .privacidade-dados > .nota-resumo` |  |
| src/estilos/superficies.css:61 | `:root[data-tema] .app .privacidade-dados > .privacidade-grupo` |  |
| src/estilos/superficies.css:65 | `:root[data-tema] .app .privacidade-grupo.formulario` |  |
| src/estilos/superficies.css:66 | `:root[data-tema] .app .privacidade-grupo > summary` |  |
| src/estilos/superficies.css:67 | `:root[data-tema] .app .privacidade-grupo > summary small` |  |
| src/estilos/superficies.css:68 | `:root[data-tema] .app details.privacidade-grupo[open] > summary` |  |
| src/estilos/superficies.css:69 | `:root[data-tema] .app .privacidade-grupo > .formulario` |  |
| src/estilos/superficies.css:70 | `:root[data-tema] .app .privacidade-grupo > p` |  |
| src/estilos/superficies.css:71 | `:root[data-tema] .app details.privacidade-grupo > summary` |  |
| src/estilos/superficies.css:72 | `:root[data-tema] .app details.privacidade-grupo > summary::-webkit-details-marker` |  |
| src/estilos/superficies.css:73 | `:root[data-tema] .app details.privacidade-grupo > summary::before` |  |
| src/estilos/superficies.css:74 | `:root[data-tema] .app details.privacidade-grupo[open] > summary::before` |  |
| src/estilos/superficies.css:75 | `:root[data-tema] .app .privacidade-grupo > summary > span:first-child` |  |
| src/estilos/superficies.css:76 | `:root[data-tema] .app .privacidade-contagem` |  |
| src/estilos/superficies.css:77 | `:root[data-tema] .app .mais-exercicios` |  |
| src/estilos/superficies.css:78 | `:root[data-tema] .app .mais-exercicios .mais-catalogo` |  |
| src/estilos/superficies.css:79 | `:root[data-tema] .app .privacidade-recolhida > summary` |  |
| src/estilos/superficies.css:80 | `:root[data-tema] .app .privacidade-recolhida > summary::-webkit-details-marker` |  |
| src/estilos/superficies.css:81 | `:root[data-tema] .app .privacidade-recolhida > summary .icone-config` |  |
| src/estilos/superficies.css:82 | `:root[data-tema] .app .privacidade-recolhida > summary .texto-config` |  |
| src/estilos/superficies.css:83 | `:root[data-tema] .app .privacidade-recolhida > summary .texto-config :is(strong,small)` |  |
| src/estilos/superficies.css:84 | `:root[data-tema] .app .privacidade-recolhida > summary .seta-config` |  |
| src/estilos/superficies.css:85 | `:root[data-tema] .app .privacidade-recolhida[open] > summary .seta-config` |  |
| src/estilos/superficies.css:88 | `:root[data-tema] .app .resumo-treino-compacto .andamento-treino` |  |
| src/estilos/superficies.css:89 | `:root[data-tema] .app .resumo-treino-compacto .titulo-andamento` |  |
| src/estilos/superficies.css:90 | `:root[data-tema] .app .resumo-treino-compacto .titulo-andamento h2` |  |
| src/estilos/superficies.css:91 | `:root[data-tema] .app .resumo-treino-compacto .progresso-sessao` |  |
| src/estilos/superficies.css:92 | `:root[data-tema] .app .resumo-treino-compacto .progresso-sessao > span` |  |
| src/estilos/superficies.css:93 | `:root[data-tema] .app .resumo-treino-compacto .progresso-sessao > strong` |  |
| src/estilos/superficies.css:94 | `:root[data-tema] .app .resumo-treino-compacto .andamento-treino > :is(.barra-sessao,.manter-tela)` |  |
| src/estilos/superficies.css:95 | `:root[data-tema] .app .descanso.descanso-popup` |  |
| src/estilos/superficies.css:96 | `:root[data-tema] .app .descanso-popup > strong` |  |
| src/estilos/superficies.css:97 | `:root[data-tema] .app .descanso-popup > p` |  |
| src/estilos/superficies.css:98 | `:root[data-tema] .app .descanso-popup > button` |  |
| src/estilos/superficies.css:101 | `:root[data-tema] .app .criador-card > .area-preview-card` |  |
| src/estilos/superficies.css:102 | `:root[data-tema] .app .criador-card > .area-preview-card.preview-aprovada` |  |
| src/estilos/superficies.css:103 | `:root[data-tema] .app .criador-card > .area-preview-card.preview-adesivo-escura` |  |
| src/estilos/superficies.css:104 | `:root[data-tema] .app .criador-card > .area-preview-card.com-foto` |  |
| src/estilos/superficies.css:105 | `:root[data-tema] .app .criador-card > .area-preview-card > .preview-card` |  |
| src/estilos/superficies.css:106 | `:root[data-tema] .app .acoes-foto-card` |  |
| src/estilos/superficies.css:107 | `:root[data-tema] .app .acoes-foto-card.sem-foto` |  |
| src/estilos/superficies.css:108 | `:root[data-tema] .app .acoes-foto-card > :is(label,button)` |  |
| src/estilos/superficies.css:111 | `:root[data-tema] .app .resumo-treino` |  |
| src/estilos/superficies.css:112 | `:root[data-tema] .app .tela-evolucao > .conteudo-alternado` |  |
| src/estilos/superficies.css:113 | `:root[data-tema] .app .treino-em-andamento` |  |
| src/estilos/superficies.css:114 | `:root[data-tema] .app .treino-em-andamento > .cancelar-sessao` |  |
| src/estilos/superficies.css:115 | `:root[data-tema] .app .ferramentas-exercicio` |  |
| src/estilos/superficies.css:116 | `:root[data-tema] .app .treino-em-andamento .ferramentas-exercicio > .botao-descanso` |  |
| src/estilos/superficies.css:117 | `:root[data-tema] .app .treino-em-andamento .ferramentas-exercicio > .ajuda-no-treino` |  |
| src/estilos/superficies.css:120 | `:root[data-tema=claro] .app :is(.estado-rede i.online,.sinal-treino)` |  |
| src/estilos/superficies.css:123 | `:root[data-tema=claro] .app :is(.abas-treino,.abas-medidas,.abas-catalogo,.alternador-seletor)` |  |
| src/estilos/superficies.css:127 | `:root[data-tema=claro] .app :is(.abas-treino,.abas-medidas,.abas-catalogo,.alternador-seletor) > button:is([aria-pressed=true],[aria-selected=true])` |  |
| src/estilos/superficies.css:132 | `:root[data-tema=claro] .app :is(.retomar-treino.retomar-compacto,.metricas-resumo > div,.calorias-resumo,.arquivo-backup)` |  |
| src/estilos/superficies.css:135 | `:root[data-tema=claro] .app :is(input:not([type=checkbox]):not([type=radio]),select,textarea,.campo-medida,.data-medida,.botao-icone)` |  |
| src/estilos/superficies.css:138 | `:root[data-tema=claro] .app .aviso-modo-visitante` |  |
| src/estilos/superficies.css:144 | `:root[data-tema=claro] .app :is(.marca small,.selo-previa,.linha-data,.estado-rede,.cartao > span,.cartao small,.abrir-ficha small,.resumo-exercicio small,.retomar-identidade span,.retomar-identidade small,.texto-config small,.aviso-modo-visitante,.grade-resumo-medidas p,.grade-resumo-medidas span,.par-resumo-medida dt,.par-resumo-medida dl p,.par-resumo-medida > header > span)` |  |
| src/estilos/superficies.css:147 | `:root[data-tema=claro] .app .marca small` |  |

| Arquivo:linha | Seletor com :not() | Ocorrências |
| --- | --- | --- |
| src/index.css:27 | `.painel-modal:not(.painel-centralizado)>.topo-painel>header` | 1 |
| src/index.css:33 | `.painel-modal:not(.painel-centralizado)>.topo-painel>header` | 1 |
| src/index.css:33 | `.alca-painel:focus:not(:focus-visible)` | 1 |
| src/index.css:48 | `.painel-modal:not(.painel-centralizado)>.topo-painel>header` | 1 |
| src/index.css:60 | `.painel-modal:not(.painel-centralizado)>.topo-painel` | 1 |
| src/index.css:61 | `.tabela-comparacao>div>span:not(:first-child),.tabela-comparacao strong` | 1 |
| src/index.css:73 | `.cartoes-movimento>.cartao>span:not(.espaco-progresso)` | 1 |
| src/index.css:74 | `.conteudo-config:not([hidden])` | 1 |
| src/index.css:76 | `.conteudo-config:not([hidden])` | 1 |
| src/index.css:76 | `.saida-config>p:not(.erro)` | 1 |
| src/estilos/controles.css:62 | `.app .botao-principal:active:not(:disabled)` | 1 |
| src/estilos/controles.css:71 | `.app .botao-secundario:active:not(:disabled)` | 1 |
| src/estilos/controles.css:210 | `:is(.resumo-todas-medidas, .evolucao-medidas, .historico-medidas, .comparacao-medidas, .rodas-numero, .rodas-medida, .campo-digitar-numero, .digitar-duracao, .conteudo-config:not([hidden]))` | 1 |
| src/estilos/controles.css:241 | `.painel-modal[open], .painel-modal[open]::backdrop,   :is(.resumo-todas-medidas, .evolucao-medidas, .historico-medidas, .comparacao-medidas, .rodas-numero, .rodas-medida, .campo-digitar-numero, .digitar-duracao, .conteudo-config:not([hidden]))` | 1 |
| src/estilos/controles.css:259 | `.app .botao-secundario:hover:not(:disabled)` | 1 |
| src/estilos/controles.css:260 | `.app .concluir-compacto:not(:disabled)` | 1 |
| src/estilos/controles.css:265 | `:root[data-tema=claro] .app .botao-principal:not(:disabled)` | 1 |
| src/estilos/controles.css:268 | `:root[data-tema] .app :is(.botao-principal,.botao-secundario,.botao-destrutivo):not(:disabled)` | 1 |
| src/estilos/controles.css:269 | `:root[data-tema] .app .botao-principal:not(:disabled)` | 1 |
| src/estilos/controles.css:270 | `:root[data-tema] .app .botao-secundario:not(:disabled):not(.excluir-historico)` | 2 |
| src/estilos/controles.css:276 | `:root[data-tema] .app .treino-em-andamento .andamento-treino .manter-tela:not(:disabled)` | 1 |
| src/estilos/novo-visual.css:91 | `.app input:not([type=checkbox]):not([type=radio]),.app textarea,.app select` | 2 |
| src/estilos/novo-visual.css:147 | `.app .conteudo-config:not([hidden])` | 1 |
| src/estilos/novo-visual.css:205 | `.app .conteudo-config:not([hidden])` | 1 |
| src/estilos/paleta-clara.css:1374 | `:root[data-tema=claro] .app .saida-config>p:not(.erro)` | 1 |
| src/estilos/paleta-clara.css:1826 | `:root[data-tema=claro] .app .botao-secundario:active:not(:disabled)` | 1 |
| src/estilos/paleta-clara.css:1918 | `:root[data-tema=claro] .app .botao-secundario:hover:not(:disabled)` | 1 |
| src/estilos/superficies.css:51 | `:root[data-tema] .app .conteudo-config:not([hidden])` | 1 |
| src/estilos/superficies.css:135 | `:root[data-tema=claro] .app :is(input:not([type=checkbox]):not([type=radio]),select,textarea,.campo-medida,.data-medida,.botao-icone)` | 2 |

| Arquivo:linha | Seletor | Propriedade | Valor | Condição |
| --- | --- | --- | --- | --- |
| src/index.css:12 | `*` | scroll-behavior | `auto` | @media (prefers-reduced-motion:reduce) |
| src/estilos/contraste-claro.css:10 | `:root[data-tema=claro] .app .recharts-default-tooltip` | background | `#fff` |  |
| src/estilos/contraste-claro.css:10 | `:root[data-tema=claro] .app .recharts-default-tooltip` | border-color | `#7c8d76` |  |
| src/estilos/contraste-claro.css:11 | `:root[data-tema=claro] .app .recharts-tooltip-item` | color | `#28431e` |  |

## Apêndice D — todas as declarações de cor literal, por componente

### conta

| Arquivo:linha | Seletor | Propriedade | Valor literal | Token de valor equivalente | Condição |
| --- | --- | --- | --- | --- | --- |
| src/index.css:2 | `.introducao-comparacao-sync>p` | color | `#a9bcae` | não encontrado; avaliar papel próprio |  |
| src/index.css:2 | `.introducao-comparacao-sync>button` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:2 | `.introducao-comparacao-sync>button` | color | `#a9c69c` | não encontrado; avaliar papel próprio |  |
| src/index.css:2 | `.opcao-registro-sync` | border | `1px solid #3b4d40` | não encontrado; avaliar papel próprio |  |
| src/index.css:2 | `.opcao-registro-sync` | background | `#19271e` | não encontrado; avaliar papel próprio |  |
| src/index.css:2 | `.opcao-registro-sync` | color | `#dce8df` | não encontrado; avaliar papel próprio |  |
| src/index.css:2 | `.opcao-registro-sync[aria-pressed=true]` | border | `2px solid #bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:2 | `.opcao-registro-sync[aria-pressed=true]` | background | `#273d25` | não encontrado; avaliar papel próprio |  |
| src/index.css:2 | `.origem-registro-sync` | color | `#a7bda9` | não encontrado; avaliar papel próprio |  |
| src/index.css:2 | `.marca-escolha-sync` | border | `1px solid #5a6c5c` | não encontrado; avaliar papel próprio |  |
| src/index.css:2 | `.opcao-registro-sync[aria-pressed=true] .marca-escolha-sync` | background | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:2 | `.opcao-registro-sync[aria-pressed=true] .marca-escolha-sync` | border-color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:2 | `.opcao-registro-sync[aria-pressed=true] .marca-escolha-sync` | color | `#21321b` | não encontrado; avaliar papel próprio |  |
| src/index.css:2 | `.opcao-registro-sync[aria-pressed=true] .origem-registro-sync` | color | `#d2ecbd` | não encontrado; avaliar papel próprio |  |
| src/index.css:2 | `.valor-comparado-sync>strong` | color | `#edf4ee` | não encontrado; avaliar papel próprio |  |
| src/index.css:2 | `.valor-comparado-sync>span` | color | `#97ad9c` | não encontrado; avaliar papel próprio |  |
| src/index.css:2 | `.data-versao-sync` | border-top | `1px solid #344a38` | não encontrado; avaliar papel próprio |  |
| src/index.css:2 | `.data-versao-sync` | color | `#8fa698` | não encontrado; avaliar papel próprio |  |
| src/index.css:2 | `.data-versao-sync>time` | color | `#b0c3b5` | não encontrado; avaliar papel próprio |  |
| src/index.css:2 | `.detalhes-comparacao-sync` | color | `#9db2a2` | não encontrado; avaliar papel próprio |  |
| src/index.css:2 | `.cabecalho-detalhes-sync` | background | `#1c2b20` | não encontrado; avaliar papel próprio |  |
| src/index.css:2 | `.cabecalho-detalhes-sync` | color | `#bdd2b9` | não encontrado; avaliar papel próprio |  |
| src/index.css:2 | `.linha-detalhes-sync` | border-bottom | `1px solid #2d4132` | não encontrado; avaliar papel próprio |  |
| src/index.css:2 | `.linha-detalhes-sync>span` | color | `#91a897` | não encontrado; avaliar papel próprio |  |
| src/index.css:2 | `.linha-detalhes-sync>strong` | color | `#dce8df` | não encontrado; avaliar papel próprio |  |
| src/index.css:2 | `.registro-em-revisao>.confirmar-registro-sync` | background | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:2 | `.registro-em-revisao>.confirmar-registro-sync` | color | `#20321c` | não encontrado; avaliar papel próprio |  |
| src/index.css:2 | `.registro-em-revisao>.confirmar-registro-sync:disabled` | background | `#25372a` | não encontrado; avaliar papel próprio |  |
| src/index.css:2 | `.registro-em-revisao>.confirmar-registro-sync:disabled` | border | `1px solid #3a5140` | não encontrado; avaliar papel próprio |  |
| src/index.css:2 | `.registro-em-revisao>.confirmar-registro-sync:disabled` | color | `#8da293` | não encontrado; avaliar papel próprio |  |
| src/index.css:2 | `.revisao-comparacao>.nota-escolha-sync` | color | `#8fa698` | não encontrado; avaliar papel próprio |  |
| src/index.css:9 | `.estado-sync>.acao-sincronizar` | border | `1px solid #bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:9 | `.estado-sync>.acao-sincronizar` | background | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:9 | `.estado-sync>.acao-sincronizar` | color | `#182b18` | não encontrado; avaliar papel próprio |  |
| src/index.css:9 | `.estado-sync>.acao-sincronizar:disabled` | background | `#233629` | não encontrado; avaliar papel próprio |  |
| src/index.css:9 | `.estado-sync>.acao-sincronizar:disabled` | border-color | `#3c5141` | não encontrado; avaliar papel próprio |  |
| src/index.css:9 | `.estado-sync>.acao-sincronizar:disabled` | color | `#bbd0bf` | não encontrado; avaliar papel próprio |  |
| src/index.css:9 | `.estado-sync>.detalhes-sync` | color | `#8fa698` | não encontrado; avaliar papel próprio |  |
| src/index.css:9 | `.detalhes-sync>time` | color | `#c0d0c4` | não encontrado; avaliar papel próprio |  |
| src/index.css:9 | `.detalhes-sync>.pendencias-sync` | color | `#d6c78e` | não encontrado; avaliar papel próprio |  |
| src/index.css:9 | `.conta .estado-sync>.mensagem-sync` | color | `#9fb6a6` | não encontrado; avaliar papel próprio |  |
| src/index.css:9 | `.texto-sync-automatica>strong` | color | `#dce8df` | não encontrado; avaliar papel próprio |  |
| src/index.css:9 | `.texto-sync-automatica>span` | color | `#8fa698` | não encontrado; avaliar papel próprio |  |
| src/index.css:9 | `.interruptor-sync` | border | `1px solid #516258` | não encontrado; avaliar papel próprio |  |
| src/index.css:9 | `.interruptor-sync` | background | `#2b3930` | não encontrado; avaliar papel próprio |  |
| src/index.css:9 | `.interruptor-sync::after` | background | `#a6b8ac` | não encontrado; avaliar papel próprio |  |
| src/index.css:9 | `.opcao-sync-automatica>input:checked+.interruptor-sync` | background | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:9 | `.opcao-sync-automatica>input:checked+.interruptor-sync` | border-color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:9 | `.opcao-sync-automatica>input:checked+.interruptor-sync::after` | background | `#21391e` | não encontrado; avaliar papel próprio |  |
| src/index.css:9 | `.opcao-sync-automatica>input:focus-visible+.interruptor-sync` | outline | `3px solid #bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:10 | `.revisao-sync` | border | `1px solid #4d6740` | não encontrado; avaliar papel próprio |  |
| src/index.css:10 | `.comparacao-sync>section` | border | `1px solid #354232` | não encontrado; avaliar papel próprio |  |
| src/index.css:10 | `.comparacao-sync h4` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:70 | `.formulario-conta input` | background | `#0e1712` | não encontrado; avaliar papel próprio |  |
| src/index.css:71 | `.conta-entrada .formulario-conta label,.campo-senha>label` | color | `#d3dfd6` | não encontrado; avaliar papel próprio |  |
| src/index.css:71 | `.conta-entrada .formulario-conta input` | border | `1px solid #36493c` | não encontrado; avaliar papel próprio |  |
| src/index.css:71 | `.conta-entrada .formulario-conta input` | background | `#15221a` | não encontrado; avaliar papel próprio |  |
| src/index.css:71 | `.formulario-conta input::placeholder` | color | `#7f9285` | não encontrado; avaliar papel próprio |  |
| src/index.css:71 | `.formulario-conta input:focus-visible` | outline | `2px solid #bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:71 | `.campo-senha>div button` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:71 | `.campo-senha>div button` | color | `#a2b4a7` | não encontrado; avaliar papel próprio |  |
| src/index.css:71 | `.link-conta` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:71 | `.link-conta` | color | `#b6c9bb` | não encontrado; avaliar papel próprio |  |
| src/index.css:71 | `.link-conta:hover` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:71 | `.conta-entrada .recuperar-senha` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:71 | `.entrada-conta .conta-entrada p[role=status]` | color | `#a2b5a8` | não encontrado; avaliar papel próprio |  |
| src/index.css:75 | `.conta .conta-vinculo>p` | color | `#b2c4b8` | não encontrado; avaliar papel próprio |  |
| src/index.css:75 | `.conta-rodape` | border-top | `1px solid #2e4033` | não encontrado; avaliar papel próprio |  |
| src/index.css:75 | `.sair-conta` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:75 | `.sair-conta` | color | `#b7c9bd` | não encontrado; avaliar papel próprio |  |
| src/index.css:75 | `.sair-conta:hover` | background | `#223428` | não encontrado; avaliar papel próprio |  |
| src/index.css:75 | `.conta .conta-rodape>p` | color | `#8fa698` | não encontrado; avaliar papel próprio |  |
| src/index.css:75 | `.ajuda-conta` | color | `#8fa698` | não encontrado; avaliar papel próprio |  |
| src/index.css:75 | `.ajuda-conta>summary` | color | `#a9beb0` | não encontrado; avaliar papel próprio |  |
| src/index.css:75 | `.conta .ajuda-conta>p` | color | `#8fa698` | não encontrado; avaliar papel próprio |  |
| src/index.css:76 | `.conteudo-config .ajuda-conta` | border-top | `1px solid #2e4033` | não encontrado; avaliar papel próprio |  |
| src/index.css:76 | `.saida-config>.sair-conta` | border | `1px solid #60473e` | não encontrado; avaliar papel próprio |  |
| src/index.css:76 | `.saida-config>.sair-conta` | background | `#241e1a` | não encontrado; avaliar papel próprio |  |
| src/index.css:76 | `.saida-config>.sair-conta` | color | `#edb6a7` | não encontrado; avaliar papel próprio |  |
| src/index.css:76 | `.saida-config>.sair-conta:hover` | background | `#30231e` | não encontrado; avaliar papel próprio |  |
| src/index.css:101 | `.contagem-catalogo` | color | `#91a999` | não encontrado; avaliar papel próprio |  |
| src/index.css:101 | `.contagem-catalogo>span:first-child` | color | `#becfc2` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:156 | `.perfil-opcional-cadastro > summary::after` | border-right | `1.5px solid currentColor` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:156 | `.perfil-opcional-cadastro > summary::after` | border-bottom | `1.5px solid currentColor` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:162 | `.aviso-confirmacao-conta` | border | `1px solid #708e50` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:162 | `.aviso-confirmacao-conta` | border-left | `4px solid #bcec86` | --controle-destaque, --visual-acento |  |
| src/estilos/controles.css:162 | `.aviso-confirmacao-conta` | background | `#1c2c1c` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:163 | `.aviso-confirmacao-conta > strong` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/estilos/controles.css:164 | `.conta .aviso-confirmacao-conta > p` | color | `#c5d4c4` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:165 | `.aviso-confirmacao-conta b` | color | `#edf1ed` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:222 | `.privacidade-contagem` | background | `#293d2b` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:222 | `.privacidade-contagem` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/estilos/paleta-clara.css:5 | `:root[data-tema=claro] .app .introducao-comparacao-sync>button` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:18 | `:root[data-tema=claro] .app .opcao-registro-sync` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:23 | `:root[data-tema=claro] .app .opcao-registro-sync[aria-pressed=true]` | border | `2px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:30 | `:root[data-tema=claro] .app .marca-escolha-sync` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:33 | `:root[data-tema=claro] .app .opcao-registro-sync[aria-pressed=true] .marca-escolha-sync` | border-color | `#7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:33 | `:root[data-tema=claro] .app .opcao-registro-sync[aria-pressed=true] .marca-escolha-sync` | color | `#28431e` | --controle-texto |  |
| src/estilos/paleta-clara.css:46 | `:root[data-tema=claro] .app .data-versao-sync` | border-top | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:60 | `:root[data-tema=claro] .app .linha-detalhes-sync` | border-bottom | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:69 | `:root[data-tema=claro] .app .registro-em-revisao>.confirmar-registro-sync` | color | `#28431e` | --controle-texto |  |
| src/estilos/paleta-clara.css:72 | `:root[data-tema=claro] .app .registro-em-revisao>.confirmar-registro-sync:disabled` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:191 | `:root[data-tema=claro] .app .estado-sync>.acao-sincronizar` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:191 | `:root[data-tema=claro] .app .estado-sync>.acao-sincronizar` | color | `#28431e` | --controle-texto |  |
| src/estilos/paleta-clara.css:195 | `:root[data-tema=claro] .app .estado-sync>.acao-sincronizar:disabled` | border-color | `#7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:218 | `:root[data-tema=claro] .app .interruptor-sync` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:222 | `:root[data-tema=claro] .app .opcao-sync-automatica>input:checked+.interruptor-sync` | border-color | `#7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:228 | `:root[data-tema=claro] .app .opcao-sync-automatica>input:focus-visible+.interruptor-sync` | outline | `3px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:231 | `:root[data-tema=claro] .app .revisao-sync` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:234 | `:root[data-tema=claro] .app .comparacao-sync>section` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1267 | `:root[data-tema=claro] .app .conta-entrada .formulario-conta input` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1274 | `:root[data-tema=claro] .app .formulario-conta input:focus-visible` | outline | `2px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1277 | `:root[data-tema=claro] .app .campo-senha>div button` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1281 | `:root[data-tema=claro] .app .link-conta` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1338 | `:root[data-tema=claro] .app .conta-rodape` | border-top | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1341 | `:root[data-tema=claro] .app .sair-conta` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1360 | `:root[data-tema=claro] .app .conteudo-config .ajuda-conta` | border-top | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1366 | `:root[data-tema=claro] .app .saida-config>.sair-conta` | border | `1px solid #a76a5b` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1366 | `:root[data-tema=claro] .app .saida-config>.sair-conta` | background | `#fff0ea` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1366 | `:root[data-tema=claro] .app .saida-config>.sair-conta` | color | `#963e32` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1371 | `:root[data-tema=claro] .app .saida-config>.sair-conta:hover` | background | `#fff0ea` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1857 | `:root[data-tema=claro] .app .aviso-confirmacao-conta` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1857 | `:root[data-tema=claro] .app .aviso-confirmacao-conta` | border-left | `4px solid #7c8d76` | não encontrado; avaliar papel próprio |  |

### outros

| Arquivo:linha | Seletor | Propriedade | Valor literal | Token de valor equivalente | Condição |
| --- | --- | --- | --- | --- | --- |
| src/index.css:2 | `.registro-em-revisao` | border-bottom | `1px solid #304235` | não encontrado; avaliar papel próprio |  |
| src/index.css:2 | `.registro-em-revisao>header>span` | color | `#8fa698` | não encontrado; avaliar papel próprio |  |
| src/index.css:2 | `.registro-em-revisao>header>strong` | color | `#e1ece2` | não encontrado; avaliar papel próprio |  |
| src/index.css:3 | `.icone-aviso-conflito` | background | `#353e26` | não encontrado; avaliar papel próprio |  |
| src/index.css:3 | `.icone-aviso-conflito` | color | `#dfd69a` | não encontrado; avaliar papel próprio |  |
| src/index.css:3 | `.aviso-conflito-popup>h3` | color | `#edf4ee` | não encontrado; avaliar papel próprio |  |
| src/index.css:3 | `.aviso-conflito-popup>p` | color | `#a9bcae` | não encontrado; avaliar papel próprio |  |
| src/index.css:3 | `.aviso-conflito-popup>.andamento-aviso-conflito` | color | `#8fa698` | não encontrado; avaliar papel próprio |  |
| src/index.css:4 | `.aviso-data-atividade` | border | `1px solid #536643` | não encontrado; avaliar papel próprio |  |
| src/index.css:4 | `.aviso-data-atividade` | background | `#24301f` | não encontrado; avaliar papel próprio |  |
| src/index.css:4 | `.aviso-data-atividade>p` | color | `#c2d2b9` | não encontrado; avaliar papel próprio |  |
| src/index.css:8 | `.conclusao-revisao>span` | background | `#293e23` | não encontrado; avaliar papel próprio |  |
| src/index.css:8 | `.conclusao-revisao>span` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:8 | `.conclusao-revisao>h3` | color | `#edf4ee` | não encontrado; avaliar papel próprio |  |
| src/index.css:8 | `.conclusao-revisao>p` | color | `#a4b8aa` | não encontrado; avaliar papel próprio |  |
| src/index.css:11 | `:root` | color | `#edf1ed` | não encontrado; avaliar papel próprio |  |
| src/index.css:11 | `:root` | background | `#101714` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.app` | background | `#101714` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.linha-data` | color | `#9ba99f` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.estado-rede i,.ponto` | background | `#abb3ac` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.estado-rede i.online` | background | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:12 | `.titulo-secao>span` | color | `#97a599` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.cartao` | border | `1px solid #2a352e` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.cartao` | background | `#19221c` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.cartao>span` | color | `#adb8ae` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.cartao strong small` | color | `#9ba79c` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.cartao>small` | color | `#829086` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.verde` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:12 | `.amarelo` | color | `#e8cf82` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.laranja` | color | `#e8b38e` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.azul` | color | `#99c4d8` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.ponto` | background | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:12 | `.nota p` | color | `#95a499` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.icone-vazio` | background | `#23311f` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.icone-vazio` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:12 | `.vazio>.etiqueta` | color | `#92a888` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.vazio p` | color | `#9cab9f` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.selo` | border | `1px solid #354232` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.selo` | color | `#b1c1a8` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.aviso-pwa` | background | `#273922` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.aviso-pwa` | border | `1px solid #bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:12 | `.aviso-pwa` | box-shadow | `0 8px 30px #0008` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.erro` | background | `#472822` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.erro` | color | `#ffd7c7` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `body` | background | `#0b110e` | não encontrado; avaliar papel próprio | @media (min-width:600px) |
| src/index.css:12 | `.app` | border-left | `1px solid #25302a` | não encontrado; avaliar papel próprio | @media (min-width:600px) |
| src/index.css:12 | `.app` | border-right | `1px solid #25302a` | não encontrado; avaliar papel próprio | @media (min-width:600px) |
| src/index.css:14 | `.fotos-maquina img` | background | `#101714` | não encontrado; avaliar papel próprio |  |
| src/index.css:14 | `.anexar` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:14 | `.ajuda-texto p` | color | `#adb8ae` | não encontrado; avaliar papel próprio |  |
| src/index.css:14 | `.desfazer` | background | `#24321f` | não encontrado; avaliar papel próprio |  |
| src/index.css:15 | `.ultimo-desempenho` | color | `#95a499` | não encontrado; avaliar papel próprio |  |
| src/index.css:15 | `.nota-fixa` | color | `#d8e6d2` | não encontrado; avaliar papel próprio |  |
| src/index.css:15 | `.reducao` | border-bottom | `1px solid #334036` | não encontrado; avaliar papel próprio |  |
| src/index.css:15 | `50%` | background | `#46632f` | não encontrado; avaliar papel próprio | @keyframes aviso-descanso |
| src/index.css:16 | `.concluir-compacto` | background | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:16 | `.concluir-compacto` | color | `#182b18` | não encontrado; avaliar papel próprio |  |
| src/index.css:16 | `.concluida .concluir-compacto` | background | `#24321f` | não encontrado; avaliar papel próprio |  |
| src/index.css:16 | `.concluida .concluir-compacto` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:16 | `.carga-por-lado` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:19 | `.subtitulo-seletor` | color | `#93a399` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.coluna-roda>span` | color | `#8fa296` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.faixa-roda` | background | `#293d30` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.roda` | mask-image | `linear-gradient(transparent,#000 35%,#000 65%,transparent)` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.roda` | -webkit-mask-image | `linear-gradient(transparent,#000 35%,#000 65%,transparent)` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.valor-escolhido` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:19 | `.aplicar-proximas` | border-top | `1px solid #31483a` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.aplicar-proximas` | color | `#bac9bf` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.lista-tipos small` | color | `#95a499` | não encontrado; avaliar papel próprio |  |
| src/index.css:28 | `.icone-acao` | background | `#293c24` | não encontrado; avaliar papel próprio |  |
| src/index.css:28 | `.icone-acao` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:28 | `.seta-acao` | color | `#a2b4a6` | não encontrado; avaliar papel próprio |  |
| src/index.css:31 | `.secao-editor` | border | `1px solid #314437` | não encontrado; avaliar papel próprio |  |
| src/index.css:31 | `.secao-editor` | background | `#17231b` | não encontrado; avaliar papel próprio |  |
| src/index.css:31 | `.secao-editor legend` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:31 | `.rotulo-editor` | color | `#c6d3c0` | não encontrado; avaliar papel próprio |  |
| src/index.css:31 | `.explicacao-editor` | color | `#95a99b` | não encontrado; avaliar papel próprio |  |
| src/index.css:31 | `.grupo-personalizado` | color | `#9fb3a4` | não encontrado; avaliar papel próprio |  |
| src/index.css:33 | `.resumo-titulo .etiqueta` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:33 | `.resumo-titulo p` | color | `#a7b9ac` | não encontrado; avaliar papel próprio |  |
| src/index.css:33 | `.metricas-resumo>div` | border | `1px solid #314536` | não encontrado; avaliar papel próprio |  |
| src/index.css:33 | `.metricas-resumo>div` | background | `#1a291e` | não encontrado; avaliar papel próprio |  |
| src/index.css:33 | `.metricas-resumo span` | color | `#a5b8ab` | não encontrado; avaliar papel próprio |  |
| src/index.css:33 | `.metricas-resumo strong` | color | `#edf4ee` | não encontrado; avaliar papel próprio |  |
| src/index.css:33 | `.metricas-resumo strong small` | color | `#9eb5a4` | não encontrado; avaliar papel próprio |  |
| src/index.css:33 | `.nota-resumo` | color | `#8fa496` | não encontrado; avaliar papel próprio |  |
| src/index.css:33 | `.comparacao-resumo` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:33 | `.calorias-resumo` | background | `#18241c` | não encontrado; avaliar papel próprio |  |
| src/index.css:33 | `.calorias-resumo` | border | `1px solid #2f4034` | não encontrado; avaliar papel próprio |  |
| src/index.css:33 | `.calorias-resumo>span` | color | `#b6c6bb` | não encontrado; avaliar papel próprio |  |
| src/index.css:33 | `.calorias-resumo>strong` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:33 | `.calorias-resumo>small` | color | `#91a699` | não encontrado; avaliar papel próprio |  |
| src/index.css:34 | `.acoes-resumo-fixas` | background | `#101714` | não encontrado; avaliar papel próprio |  |
| src/index.css:34 | `.acoes-resumo-fixas` | border-top | `1px solid #304335` | não encontrado; avaliar papel próprio |  |
| src/index.css:34 | `.acoes-resumo-fixas` | box-shadow | `0 -8px 24px #0002` | não encontrado; avaliar papel próprio |  |
| src/index.css:35 | `.progressao` | background | `#1d2a21` | não encontrado; avaliar papel próprio |  |
| src/index.css:35 | `.progressao.subiu` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:35 | `.progressao.caiu` | color | `#f3aaa0` | não encontrado; avaliar papel próprio |  |
| src/index.css:35 | `.progressao.igual` | color | `#a4aea8` | não encontrado; avaliar papel próprio |  |
| src/index.css:35 | `.sugestao-carga` | border | `1px solid #405739` | não encontrado; avaliar papel próprio |  |
| src/index.css:35 | `.sugestao-carga` | color | `#c2d8b8` | não encontrado; avaliar papel próprio |  |
| src/index.css:35 | `.tabela-grafico` | color | `#aabeaf` | não encontrado; avaliar papel próprio |  |
| src/index.css:35 | `.excluir-historico` | color | `#eeaaa1` | não encontrado; avaliar papel próprio |  |
| src/index.css:35 | `.excluir-historico` | border-color | `#68483f` | não encontrado; avaliar papel próprio |  |
| src/index.css:35 | `.aviso-recorde` | background | `#293e23` | não encontrado; avaliar papel próprio |  |
| src/index.css:35 | `.aviso-recorde` | border | `1px solid #bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:35 | `.aviso-recorde` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:35 | `.ultimo-concluido` | background | `#1b2a1f` | não encontrado; avaliar papel próprio |  |
| src/index.css:35 | `.ultimo-concluido` | border | `1px solid #354d39` | não encontrado; avaliar papel próprio |  |
| src/index.css:35 | `.ultimo-concluido>span` | color | `#9ab29f` | não encontrado; avaliar papel próprio |  |
| src/index.css:36 | `.aviso-remocao` | border | `1px solid #3c5637` | não encontrado; avaliar papel próprio |  |
| src/index.css:36 | `.aviso-remocao` | background | `#20301f` | não encontrado; avaliar papel próprio |  |
| src/index.css:36 | `.aviso-remocao>span` | color | `#bdcebb` | não encontrado; avaliar papel próprio |  |
| src/index.css:37 | `.busca-historico>small` | color | `#98ae9f` | não encontrado; avaliar papel próprio |  |
| src/index.css:38 | `.preview-card` | box-shadow | `0 12px 32px #0004` | não encontrado; avaliar papel próprio |  |
| src/index.css:38 | `.foto-card` | border | `1px solid #40543f` | não encontrado; avaliar papel próprio |  |
| src/index.css:38 | `.foto-card` | background | `#213024` | não encontrado; avaliar papel próprio |  |
| src/index.css:38 | `.foto-card` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:38 | `.foto-card:focus-within` | outline | `2px solid #bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:39 | `.aviso-offline` | background | `#1b2a20` | não encontrado; avaliar papel próprio |  |
| src/index.css:39 | `.aviso-offline` | border-color | `#40573b` | não encontrado; avaliar papel próprio |  |
| src/index.css:39 | `.icone-aviso-offline` | background | `#2d4126` | não encontrado; avaliar papel próprio |  |
| src/index.css:39 | `.icone-aviso-offline` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:39 | `.aviso-offline p` | color | `#dce8dc` | não encontrado; avaliar papel próprio |  |
| src/index.css:40 | `.remover-foto-card` | color | `#b7c7bd` | não encontrado; avaliar papel próprio |  |
| src/index.css:40 | `.remover-foto-card` | border-color | `#354b3b` | não encontrado; avaliar papel próprio |  |
| src/index.css:41 | `.finalizar-acoes .continuar-depois` | background | `#19271f` | não encontrado; avaliar papel próprio |  |
| src/index.css:41 | `.finalizar-acoes .continuar-depois` | border | `1px solid #3c5342` | não encontrado; avaliar papel próprio |  |
| src/index.css:41 | `.finalizar-acoes .continuar-depois` | color | `#cad9cd` | não encontrado; avaliar papel próprio |  |
| src/index.css:41 | `.finalizar-acoes .continuar-depois svg` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:41 | `.finalizar-acoes .continuar-depois:active` | background | `#25372a` | não encontrado; avaliar papel próprio |  |
| src/index.css:47 | `.ultimo-desempenho` | background | `#142119` | não encontrado; avaliar papel próprio |  |
| src/index.css:47 | `.ultimo-desempenho` | color | `#a5b9aa` | não encontrado; avaliar papel próprio |  |
| src/index.css:47 | `.ultimo-desempenho>span` | color | `#d2dfd4` | não encontrado; avaliar papel próprio |  |
| src/index.css:47 | `.ultimo-desempenho small` | color | `#94aa9a` | não encontrado; avaliar papel próprio |  |
| src/index.css:53 | `.manter-tela svg` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:54 | `.metricas-resumo .explicacao-volume` | color | `#98ae9f` | não encontrado; avaliar papel próprio |  |
| src/index.css:55 | `.aviso-recorde` | background | `#19271e` | não encontrado; avaliar papel próprio |  |
| src/index.css:55 | `.aviso-recorde` | border | `1px solid #354b38` | não encontrado; avaliar papel próprio |  |
| src/index.css:55 | `.aviso-recorde` | color | `#d4e5ce` | não encontrado; avaliar papel próprio |  |
| src/index.css:55 | `.aviso-recorde>.icone-recorde` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:55 | `.aviso-recorde p` | color | `#9fb5a4` | não encontrado; avaliar papel próprio |  |
| src/index.css:58 | `.guia-esforco` | color | `#a8bdae` | não encontrado; avaliar papel próprio |  |
| src/index.css:58 | `.guia-esforco` | background | `#1c2d22` | não encontrado; avaliar papel próprio |  |
| src/index.css:58 | `.guia-esforco` | border | `1px solid #334b39` | não encontrado; avaliar papel próprio |  |
| src/index.css:58 | `.guia-esforco strong` | color | `#cce8bc` | não encontrado; avaliar papel próprio |  |
| src/index.css:61 | `.escolher-comparacao` | border | `1px solid #3c543e` | não encontrado; avaliar papel próprio |  |
| src/index.css:61 | `.escolher-comparacao` | background | `#213326` | não encontrado; avaliar papel próprio |  |
| src/index.css:61 | `.escolher-comparacao span` | color | `#9db5a5` | não encontrado; avaliar papel próprio |  |
| src/index.css:61 | `.escolher-comparacao strong` | color | `#d0e7c3` | não encontrado; avaliar papel próprio |  |
| src/index.css:61 | `.tabela-comparacao` | border | `1px solid #344b39` | não encontrado; avaliar papel próprio |  |
| src/index.css:61 | `.tabela-comparacao` | background | `#1a291f` | não encontrado; avaliar papel próprio |  |
| src/index.css:61 | `.tabela-comparacao>div` | border-bottom | `1px solid #304536` | --visual-borda |  |
| src/index.css:61 | `.tabela-comparacao small` | color | `#8ba493` | não encontrado; avaliar papel próprio |  |
| src/index.css:61 | `.tabela-comparacao strong` | color | `#c8e4b6` | não encontrado; avaliar papel próprio |  |
| src/index.css:63 | `.opcionais-cardio>summary` | color | `#bdd5b5` | não encontrado; avaliar papel próprio |  |
| src/index.css:63 | `.detalhe-cardio>p` | color | `#a9bdaf` | não encontrado; avaliar papel próprio |  |
| src/index.css:63 | `.detalhe-cardio>.verde` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:63 | `.link-atividade` | background | `#213426` | não encontrado; avaliar papel próprio |  |
| src/index.css:63 | `.link-atividade` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:63 | `.atividade-hoje progress,.tela-cardio progress` | accent-color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:63 | `.cardio-do-dia>div>strong` | color | `#c9dec2` | não encontrado; avaliar papel próprio |  |
| src/index.css:63 | `.linha-feriado` | border | `1px solid #344b39` | não encontrado; avaliar papel próprio |  |
| src/index.css:63 | `.linha-feriado` | background | `#192b20` | não encontrado; avaliar papel próprio |  |
| src/index.css:63 | `.linha-feriado small` | color | `#94ae9b` | não encontrado; avaliar papel próprio |  |
| src/index.css:68 | `.incluir-fotos` | color | `#b8cebc` | não encontrado; avaliar papel próprio |  |
| src/index.css:71 | `.apresentacao-entrada p` | color | `#9eafa3` | não encontrado; avaliar papel próprio |  |
| src/index.css:71 | `.alternativa-entrada>span` | color | `#728578` | não encontrado; avaliar papel próprio |  |
| src/index.css:71 | `.alternativa-entrada>span::before,.alternativa-entrada>span::after` | background | `#29392f` | não encontrado; avaliar papel próprio |  |
| src/index.css:71 | `.alternativa-entrada p` | color | `#84998c` | não encontrado; avaliar papel próprio |  |
| src/index.css:73 | `.atividade-hoje .cartoes-movimento progress` | background | `#304536` | --visual-borda |  |
| src/index.css:73 | `.atividade-hoje .cartoes-movimento progress` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:73 | `.cartoes-movimento progress::-webkit-progress-bar` | background | `#304536` | --visual-borda |  |
| src/index.css:73 | `.cartoes-movimento progress::-webkit-progress-value` | background | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:73 | `.cartoes-movimento progress::-moz-progress-bar` | background | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:73 | `.atividade-hoje .link-atividade` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:82 | `.progresso-sessao>strong` | color | `#c2ef91` | não encontrado; avaliar papel próprio |  |
| src/index.css:82 | `.progresso-sessao>strong>small` | color | `#afc1b3` | não encontrado; avaliar papel próprio |  |
| src/index.css:83 | `.barra-sessao` | background | `#324637` | não encontrado; avaliar papel próprio |  |
| src/index.css:83 | `.barra-sessao` | accent-color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:83 | `.barra-sessao::-webkit-progress-bar` | background | `#324637` | não encontrado; avaliar papel próprio |  |
| src/index.css:83 | `.barra-sessao::-webkit-progress-value` | background | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:83 | `.barra-sessao::-moz-progress-bar` | background | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:111 | `.retomar-identidade` | color | `#c2e598` | não encontrado; avaliar papel próprio |  |
| src/index.css:111 | `.retomar-identidade>small` | color | `#9fb69f` | não encontrado; avaliar papel próprio |  |
| src/index.css:112 | `.retomar-progresso>p` | color | `#b8cdb9` | não encontrado; avaliar papel próprio |  |
| src/index.css:112 | `.retomar-progresso>p>span` | color | `#98b59f` | não encontrado; avaliar papel próprio |  |
| src/index.css:121 | `.aviso-desfazer>span>small` | color | `#9bb49f` | não encontrado; avaliar papel próprio |  |
| src/index.css:121 | `.historico-cartao>small` | color | `#b8d397` | não encontrado; avaliar papel próprio |  |
| src/index.css:121 | `.historico-cartao>small>span` | color | `#9ab09f` | não encontrado; avaliar papel próprio |  |
| src/index.css:125 | `.modelos-card` | scrollbar-color | `#58754b #17251d` | não encontrado; avaliar papel próprio |  |
| src/index.css:125 | `.modelos-card strong` | color | `#dcebdc` | não encontrado; avaliar papel próprio |  |
| src/index.css:125 | `.modelos-card small` | color | `#a5bda9` | não encontrado; avaliar papel próprio |  |
| src/index.css:125 | `.amostra-card` | background | `linear-gradient(135deg,#4b693d,#14271b)` | não encontrado; avaliar papel próprio |  |
| src/index.css:125 | `.amostra-card` | border | `1px solid #718b63` | não encontrado; avaliar papel próprio |  |
| src/index.css:125 | `.amostra-card>span` | background | `#c1e89a` | não encontrado; avaliar papel próprio |  |
| src/index.css:125 | `.amostra-foto` | background | `linear-gradient(155deg,#90a281 0%,#526644 45%,#16271c 80%)` | não encontrado; avaliar papel próprio |  |
| src/index.css:125 | `.amostra-minimalista` | background | `#edf2e7` | não encontrado; avaliar papel próprio |  |
| src/index.css:125 | `.amostra-minimalista>span` | background | `#315b28` | não encontrado; avaliar papel próprio |  |
| src/index.css:125 | `.amostra-adesivo` | background | `repeating-conic-gradient(#657261 0 25%,#4c5949 0 50%) 0/10px 10px` | não encontrado; avaliar papel próprio |  |
| src/index.css:125 | `.amostra-adesivo>span` | background | `#fff` | não encontrado; avaliar papel próprio |  |
| src/index.css:126 | `.opcoes-adesivo>span` | color | `#a8bdad` | não encontrado; avaliar papel próprio |  |
| src/index.css:127 | `.area-preview-card` | background | `#0d1711` | não encontrado; avaliar papel próprio |  |
| src/index.css:127 | `.area-preview-card` | border | `1px solid #2f4434` | não encontrado; avaliar papel próprio |  |
| src/index.css:127 | `.area-preview-card>.preview-card` | box-shadow | `0 8px 24px #0004` | não encontrado; avaliar papel próprio |  |
| src/index.css:127 | `.area-preview-card.preview-transparente` | background | `repeating-conic-gradient(#758071 0 25%,#5c6958 0 50%) 0/22px 22px` | não encontrado; avaliar papel próprio |  |
| src/index.css:127 | `.area-preview-card>p` | color | `#b4c9b7` | não encontrado; avaliar papel próprio |  |
| src/index.css:127 | `.criador-card>.remover-foto-card` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:127 | `.criador-card>.remover-foto-card` | color | `#c7b3a5` | não encontrado; avaliar papel próprio |  |
| src/index.css:127 | `.dica-story` | color | `#a6bfac` | não encontrado; avaliar papel próprio |  |
| src/index.css:127 | `.aviso-card` | color | `#c0e39e` | não encontrado; avaliar papel próprio |  |
| src/index.css:127 | `.aviso-card` | background | `#243622` | não encontrado; avaliar papel próprio |  |
| src/index.css:127 | `.texto-compartilhar` | color | `#a9c0ae` | não encontrado; avaliar papel próprio |  |
| src/index.css:132 | `.opcao-seletor` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:132 | `.opcao-seletor` | color | `#9eb5a6` | não encontrado; avaliar papel próprio |  |
| src/index.css:133 | `.opcao-seletor.selecionada` | background | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:133 | `.opcao-seletor.selecionada` | color | `#192d18` | --controle-texto-escuro |  |
| src/index.css:133 | `.opcao-seletor.selecionada` | box-shadow | `0 2px 8px #0002` | não encontrado; avaliar papel próprio |  |
| src/index.css:143 | `.grupo-campos-cardio>legend` | color | `#a6bfad` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:14 | `.confirmacao-app > p` | color | `#bacabd` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:174 | `.criador-card > .area-preview-card.preview-aprovada` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:180 | `.criador-card .amostra-minimalista` | background | `#f1eee4` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:180 | `.criador-card .amostra-minimalista` | border-color | `#d9d8cc` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:181 | `.criador-card .amostra-minimalista > span:first-child` | background | `#14241b` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:182 | `.criador-card .amostra-adesivo` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:185 | `.campos-adesivo` | border | `1px solid #344c3a` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:186 | `.campos-adesivo legend` | color | `#adc2b0` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:189 | `.criador-card > .preview-story` | background | `radial-gradient(ellipse at 20% 30%, #607a6b, transparent 60%), linear-gradient(145deg, #293e32, #111b16 70%)` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:190 | `.criador-card > .preview-story.texto-escura` | background | `linear-gradient(145deg, #e0e6dc, #a9b8a5)` | não encontrado; avaliar papel próprio |  |
| src/estilos/novo-visual.css:30 | `body` | background | `#242b26` | não encontrado; avaliar papel próprio |  |
| src/estilos/novo-visual.css:45 | `.app > main#conteudo` | scrollbar-color | `var(--visual-borda) transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/novo-visual.css:70 | `.app progress` | accent-color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/estilos/novo-visual.css:72 | `.app progress::-webkit-progress-value` | background | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/estilos/novo-visual.css:73 | `.app progress::-moz-progress-bar` | background | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/estilos/novo-visual.css:107 | `.app .coluna-roda` | border | `1px solid color-mix(in srgb,var(--visual-borda) 45%,transparent)` | não encontrado; avaliar papel próprio |  |
| src/estilos/novo-visual.css:107 | `.app .coluna-roda` | background | `color-mix(in srgb,var(--visual-rebaixo) 65%,var(--visual-painel))` | não encontrado; avaliar papel próprio |  |
| src/estilos/novo-visual.css:129 | `.app .cancelar-sessao` | color | `#edb6a7` | não encontrado; avaliar papel próprio |  |
| src/estilos/novo-visual.css:130 | `.app .acoes-resumo-fixas` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/novo-visual.css:170 | `.app` | box-shadow | `0 20px 70px #0003` | não encontrado; avaliar papel próprio | @media (min-width:600px) |
| src/estilos/paleta-clara.css:9 | `:root[data-tema=claro] .app .registro-em-revisao` | border-bottom | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:96 | `:root[data-tema=claro] .app .aviso-data-atividade` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:276 | `:root[data-tema=claro] .app .cartao` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:295 | `:root[data-tema=claro] .app .laranja` | color | `#963e32` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:341 | `:root[data-tema=claro] .app .selo` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:364 | `:root[data-tema=claro] .app .aviso-pwa` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:371 | `:root[data-tema=claro] .app .erro` | background | `#fff0ea` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:371 | `:root[data-tema=claro] .app .erro` | color | `#963e32` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:376 | `:root[data-tema=claro] .app` | border-left | `1px solid #7c8d76` | não encontrado; avaliar papel próprio | @media (min-width:600px) |
| src/estilos/paleta-clara.css:376 | `:root[data-tema=claro] .app` | border-right | `1px solid #7c8d76` | não encontrado; avaliar papel próprio | @media (min-width:600px) |
| src/estilos/paleta-clara.css:460 | `:root[data-tema=claro] .app .reducao` | border-bottom | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:512 | `:root[data-tema=claro] .app .concluir-compacto` | color | `#28431e` | --controle-texto |  |
| src/estilos/paleta-clara.css:582 | `:root[data-tema=claro] .app .aplicar-proximas` | border-top | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:744 | `:root[data-tema=claro] .app .secao-editor` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:775 | `:root[data-tema=claro] .app .metricas-resumo>div` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:794 | `:root[data-tema=claro] .app .calorias-resumo` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:807 | `:root[data-tema=claro] .app .acoes-resumo-fixas` | border-top | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:820 | `:root[data-tema=claro] .app .progressao.caiu` | color | `#963e32` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:826 | `:root[data-tema=claro] .app .sugestao-carga` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:841 | `:root[data-tema=claro] .app .excluir-historico` | color | `#963e32` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:841 | `:root[data-tema=claro] .app .excluir-historico` | border-color | `#a76a5b` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:845 | `:root[data-tema=claro] .app .aviso-recorde` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:853 | `:root[data-tema=claro] .app .ultimo-concluido` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:860 | `:root[data-tema=claro] .app .aviso-remocao` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:877 | `:root[data-tema=claro] .app .foto-card` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:882 | `:root[data-tema=claro] .app .foto-card:focus-within` | outline | `2px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:885 | `:root[data-tema=claro] .app .aviso-offline` | border-color | `#7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:896 | `:root[data-tema=claro] .app .remover-foto-card` | border-color | `#7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:900 | `:root[data-tema=claro] .app .finalizar-acoes .continuar-depois` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1018 | `:root[data-tema=claro] .app .aviso-recorde` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1039 | `:root[data-tema=claro] .app .guia-esforco` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1110 | `:root[data-tema=claro] .app .escolher-comparacao` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1120 | `:root[data-tema=claro] .app .tabela-comparacao` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1124 | `:root[data-tema=claro] .app .tabela-comparacao>div` | border-bottom | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1224 | `:root[data-tema=claro] .app .linha-feriado` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1712 | `:root[data-tema=claro] .app .area-preview-card` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1716 | `:root[data-tema=claro] .app .area-preview-card.preview-transparente` | background | `repeating-conic-gradient(var(--visual-acento-fundo) 0 25%,var(--visual-acento-fundo) 0 50%) 0/22px 22px` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1722 | `:root[data-tema=claro] .app .criador-card>.remover-foto-card` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1745 | `:root[data-tema=claro] .app .opcao-seletor` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1749 | `:root[data-tema=claro] .app .opcao-seletor.selecionada` | color | `#28431e` | --controle-texto |  |
| src/estilos/paleta-clara.css:1871 | `:root[data-tema=claro] .app .campos-adesivo` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1877 | `:root[data-tema=claro] .app .criador-card > .preview-story` | background | `radial-gradient(ellipse at 20% 30%, var(--visual-acento-fundo), transparent 60%), linear-gradient(145deg, var(--visual-acento-fundo), var(--visual-rebaixo) 70%)` | não encontrado; avaliar papel próprio |  |
| src/estilos/contraste-claro.css:4 | `:root[data-tema=claro] .app :focus-visible` | outline-color | `#355f26` | não encontrado; avaliar papel próprio |  |
| src/estilos/contraste-claro.css:5 | `:root[data-tema=claro] .app .recharts-cartesian-axis-tick-value` | fill | `#50644e` | não encontrado; avaliar papel próprio |  |
| src/estilos/contraste-claro.css:6 | `:root[data-tema=claro] .app .recharts-cartesian-grid line` | stroke | `#ccd8c6` | não encontrado; avaliar papel próprio |  |
| src/estilos/contraste-claro.css:7 | `:root[data-tema=claro] .app .recharts-line-curve` | stroke | `#355f26` | não encontrado; avaliar papel próprio |  |
| src/estilos/contraste-claro.css:8 | `:root[data-tema=claro] .app .recharts-line-curve[stroke-dasharray]` | stroke | `#596c55` | não encontrado; avaliar papel próprio |  |
| src/estilos/contraste-claro.css:9 | `:root[data-tema=claro] .app .recharts-dot` | fill | `#355f26` | não encontrado; avaliar papel próprio |  |
| src/estilos/contraste-claro.css:9 | `:root[data-tema=claro] .app .recharts-dot` | stroke | `#fff` | não encontrado; avaliar papel próprio |  |
| src/estilos/contraste-claro.css:10 | `:root[data-tema=claro] .app .recharts-default-tooltip` | background | `#fff` | não encontrado; avaliar papel próprio |  |
| src/estilos/contraste-claro.css:10 | `:root[data-tema=claro] .app .recharts-default-tooltip` | border-color | `#7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/contraste-claro.css:10 | `:root[data-tema=claro] .app .recharts-default-tooltip` | color | `#1a2c1c` | não encontrado; avaliar papel próprio |  |
| src/estilos/contraste-claro.css:11 | `:root[data-tema=claro] .app .recharts-tooltip-item` | color | `#28431e` | --controle-texto |  |
| src/estilos/contraste-claro.css:12 | `:root[data-tema=claro] .app progress` | accent-color | `#355f26` | não encontrado; avaliar papel próprio |  |
| src/estilos/contraste-claro.css:13 | `:root[data-tema=claro] .app progress::-webkit-progress-value` | background | `#355f26` | não encontrado; avaliar papel próprio |  |
| src/estilos/contraste-claro.css:14 | `:root[data-tema=claro] .app progress::-moz-progress-bar` | background | `#355f26` | não encontrado; avaliar papel próprio |  |
| src/estilos/contraste-claro.css:17 | `:root[data-tema=claro] .app .coluna-roda .faixa-roda` | background | `#d5e7c8` | não encontrado; avaliar papel próprio |  |
| src/estilos/contraste-claro.css:34 | `:root[data-tema=claro] .app .cartao .verde` | color | `#346329` | não encontrado; avaliar papel próprio |  |
| src/estilos/contraste-claro.css:35 | `:root[data-tema=claro] .app .cartao .laranja` | color | `#9a4827` | não encontrado; avaliar papel próprio |  |
| src/estilos/contraste-claro.css:36 | `:root[data-tema=claro] .app .cartao .azul` | color | `#246778` | não encontrado; avaliar papel próprio |  |
| src/estilos/contraste-claro.css:37 | `:root[data-tema=claro] .app .aviso-modo-visitante` | background | `#dbe7c9` | --aviso-fundo |  |
| src/estilos/contraste-claro.css:37 | `:root[data-tema=claro] .app .aviso-modo-visitante` | color | `#415535` | --aviso-texto |  |
| src/estilos/contraste-claro.css:37 | `:root[data-tema=claro] .app .aviso-modo-visitante` | border-color | `#b1c695` | --aviso-borda |  |
| src/estilos/superficies.css:102 | `:root[data-tema] .app .criador-card > .area-preview-card.preview-aprovada` | background | `repeating-conic-gradient(#354438 0 25%,#46574a 0 50%) 0 / 20px 20px` | não encontrado; avaliar papel próprio |  |
| src/estilos/superficies.css:103 | `:root[data-tema] .app .criador-card > .area-preview-card.preview-adesivo-escura` | background | `repeating-conic-gradient(#e0e5da 0 25%,#c6d0bd 0 50%) 0 / 20px 20px` | não encontrado; avaliar papel próprio |  |

### controles

| Arquivo:linha | Seletor | Propriedade | Valor literal | Token de valor equivalente | Condição |
| --- | --- | --- | --- | --- | --- |
| src/index.css:3 | `.aviso-conflito-popup>.botao-principal` | background | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:3 | `.aviso-conflito-popup>.botao-principal` | color | `#20321c` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `button:focus-visible,a:focus-visible` | outline | `3px solid #bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:12 | `.botao-icone` | background | `#1c2720` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.botao-icone` | color | `#bcc8bd` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.botao-principal` | background | `#1b301e` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.botao-principal` | color | `#e8f5dd` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.botao-secundario` | border | `1px solid #334036` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.botao-secundario` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.aviso-pwa button` | background | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:12 | `.aviso-pwa button` | color | `#172d16` | não encontrado; avaliar papel próprio |  |
| src/index.css:14 | `.desfazer button` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:14 | `.desfazer button` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:15 | `.ajuste-numero button` | background | `#24321f` | não encontrado; avaliar papel próprio |  |
| src/index.css:15 | `.ajuste-numero button` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:19 | `.roda>button` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.roda>button` | color | `#e2ebe5` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.lista-tipos>button` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.lista-tipos>button` | border-bottom | `1px solid #31483a` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.lista-tipos>button.selecionado` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:22 | `.botao-principal` | background | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:22 | `.botao-principal` | color | `#172d16` | não encontrado; avaliar papel próprio |  |
| src/index.css:22 | `.botao-principal` | border | `1px solid #bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:22 | `.botao-principal` | box-shadow | `0 3px 14px #bcec8615` | não encontrado; avaliar papel próprio |  |
| src/index.css:22 | `.botao-principal:active` | background | `#a4d36e` | não encontrado; avaliar papel próprio |  |
| src/index.css:22 | `.botao-principal:disabled` | background | `#314333` | não encontrado; avaliar papel próprio |  |
| src/index.css:22 | `.botao-principal:disabled` | color | `#92a38f` | não encontrado; avaliar papel próprio |  |
| src/index.css:22 | `.botao-principal:disabled` | border-color | `#314333` | não encontrado; avaliar papel próprio |  |
| src/index.css:22 | `.botao-principal:focus-visible` | outline | `3px solid #edfbdc` | não encontrado; avaliar papel próprio |  |
| src/index.css:30 | `.filtro-musculos button` | border | `1px solid #344637` | não encontrado; avaliar papel próprio |  |
| src/index.css:30 | `.filtro-musculos button` | background | `#19261d` | não encontrado; avaliar papel próprio |  |
| src/index.css:30 | `.filtro-musculos button` | color | `#adbfaf` | não encontrado; avaliar papel próprio |  |
| src/index.css:30 | `.filtro-musculos button[aria-pressed=true]` | background | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:30 | `.filtro-musculos button[aria-pressed=true]` | border-color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:30 | `.filtro-musculos button[aria-pressed=true]` | color | `#172d16` | não encontrado; avaliar papel próprio |  |
| src/index.css:30 | `.biblioteca-cartao .acoes button:last-child` | background | `#332421` | não encontrado; avaliar papel próprio |  |
| src/index.css:30 | `.biblioteca-cartao .acoes button:last-child` | color | `#ecaaa0` | não encontrado; avaliar papel próprio |  |
| src/index.css:31 | `.escolhas-editor button` | background | `#223327` | não encontrado; avaliar papel próprio |  |
| src/index.css:31 | `.escolhas-editor button` | border | `1px solid #384d3c` | não encontrado; avaliar papel próprio |  |
| src/index.css:31 | `.escolhas-editor button` | color | `#aebeae` | não encontrado; avaliar papel próprio |  |
| src/index.css:31 | `.escolhas-editor button[aria-pressed=true]` | background | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:31 | `.escolhas-editor button[aria-pressed=true]` | border-color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:31 | `.escolhas-editor button[aria-pressed=true]` | color | `#172d16` | não encontrado; avaliar papel próprio |  |
| src/index.css:35 | `.aviso-recorde button` | background | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:35 | `.aviso-recorde button` | color | `#172d16` | não encontrado; avaliar papel próprio |  |
| src/index.css:36 | `.aviso-remocao>button` | background | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:36 | `.aviso-remocao>button` | color | `#172d16` | não encontrado; avaliar papel próprio |  |
| src/index.css:39 | `.aviso-offline button` | box-shadow | `0 3px 10px #0002` | não encontrado; avaliar papel próprio |  |
| src/index.css:39 | `.aviso-offline button:active` | background | `#a9da73` | não encontrado; avaliar papel próprio |  |
| src/index.css:52 | `.ultimo-concluido>.botao-secundario` | border-color | `#48623e` | não encontrado; avaliar papel próprio |  |
| src/index.css:52 | `.ultimo-concluido>.botao-secundario` | background | `#2a3e25` | não encontrado; avaliar papel próprio |  |
| src/index.css:52 | `.ultimo-concluido>.botao-secundario` | color | `#ceeab7` | não encontrado; avaliar papel próprio |  |
| src/index.css:55 | `.aviso-recorde>button` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:55 | `.aviso-recorde>button` | color | `#91a897` | não encontrado; avaliar papel próprio |  |
| src/index.css:55 | `.aviso-recorde>button:active` | background | `#2c3e2e` | não encontrado; avaliar papel próprio |  |
| src/index.css:59 | `.titulo-andamento>button` | background | `#263c29` | não encontrado; avaliar papel próprio |  |
| src/index.css:59 | `.titulo-andamento>button` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:63 | `.acoes-cardio button` | background | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:63 | `.acoes-cardio button` | color | `#1d331c` | não encontrado; avaliar papel próprio |  |
| src/index.css:63 | `.acoes-cardio button+button` | background | `#223728` | não encontrado; avaliar papel próprio |  |
| src/index.css:63 | `.acoes-cardio button+button` | color | `#c1ddb4` | não encontrado; avaliar papel próprio |  |
| src/index.css:63 | `.acoes-cardio button+button` | border | `1px solid #3d563c` | não encontrado; avaliar papel próprio |  |
| src/index.css:63 | `.linha-feriado>button` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:63 | `.linha-feriado>button` | color | `#c8dcca` | não encontrado; avaliar papel próprio |  |
| src/index.css:63 | `.linha-feriado>button+button` | color | `#d9aaa0` | não encontrado; avaliar papel próprio |  |
| src/index.css:125 | `.modelos-card>button` | border | `1px solid #3b5040` | não encontrado; avaliar papel próprio |  |
| src/index.css:125 | `.modelos-card>button` | background | `#1b2b20` | não encontrado; avaliar papel próprio |  |
| src/index.css:125 | `.modelos-card>button[aria-pressed=true]` | border-color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:125 | `.modelos-card>button[aria-pressed=true]` | background | `#293e24` | não encontrado; avaliar papel próprio |  |
| src/index.css:125 | `.modelos-card>button[aria-pressed=true]` | box-shadow | `inset 0 0 0 1px #bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:126 | `.opcoes-adesivo>button` | border | `1px solid #3c5540` | não encontrado; avaliar papel próprio |  |
| src/index.css:126 | `.opcoes-adesivo>button` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:126 | `.opcoes-adesivo>button` | color | `#b4cbb8` | não encontrado; avaliar papel próprio |  |
| src/index.css:126 | `.opcoes-adesivo>button[aria-pressed=true]` | border-color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:126 | `.opcoes-adesivo>button[aria-pressed=true]` | background | `#2d4227` | não encontrado; avaliar papel próprio |  |
| src/index.css:126 | `.opcoes-adesivo>button[aria-pressed=true]` | color | `#d3efb8` | não encontrado; avaliar papel próprio |  |
| src/index.css:135 | `.botao-atalho-numero` | border | `1px solid #354c3c` | não encontrado; avaliar papel próprio |  |
| src/index.css:135 | `.botao-atalho-numero` | background | `#1d2f23` | não encontrado; avaliar papel próprio |  |
| src/index.css:135 | `.botao-atalho-numero` | color | `#c9dec2` | não encontrado; avaliar papel próprio |  |
| src/index.css:136 | `.botao-atalho-numero:active` | background | `#293e26` | não encontrado; avaliar papel próprio |  |
| src/index.css:136 | `.botao-atalho-numero:active` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/estilos/controles.css:2 | `.app .botao-destrutivo` | border | `1px solid #60473e` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:2 | `.app .botao-destrutivo` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:2 | `.app .botao-destrutivo` | color | `#edb6a7` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:3 | `.app .botao-destrutivo:focus-visible` | outline | `2px solid #edb6a7` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:11 | `.botao-destrutivo:hover` | background | `#30231e` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:62 | `.app .botao-principal:active:not(:disabled)` | background | `#a9d875` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:71 | `.app .botao-secundario:active:not(:disabled)` | background | `#2c422c` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:72 | `.app .botao-principal:disabled, .app .botao-secundario:disabled` | background | `#293b2e` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:72 | `.app .botao-principal:disabled, .app .botao-secundario:disabled` | color | `#8fa394` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:72 | `.app .botao-principal:disabled, .app .botao-secundario:disabled` | border-color | `#374c3d` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:81 | `.app .botao-secundario.excluir-historico` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:81 | `.app .botao-secundario.excluir-historico` | color | `#edb6a7` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:81 | `.app .botao-secundario.excluir-historico` | border-color | `#60473e` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:259 | `.app .botao-secundario:hover:not(:disabled)` | border-color | `#94b678` | não encontrado; avaliar papel próprio |  |
| src/estilos/novo-visual.css:165 | `[data-tema=claro] .app .botao-destrutivo` | color | `#973e31` | não encontrado; avaliar papel próprio |  |
| src/estilos/novo-visual.css:165 | `[data-tema=claro] .app .botao-destrutivo` | border-color | `#c7978b` | não encontrado; avaliar papel próprio |  |
| src/estilos/novo-visual.css:165 | `[data-tema=claro] .app .botao-destrutivo` | background | `#fff7f4` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:90 | `:root[data-tema=claro] .app .aviso-conflito-popup>.botao-principal` | color | `#28431e` | --controle-texto |  |
| src/estilos/paleta-clara.css:240 | `:root[data-tema=claro] .app button:focus-visible, :root[data-tema=claro] .app a:focus-visible` | outline | `3px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:304 | `:root[data-tema=claro] .app .botao-secundario` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:304 | `:root[data-tema=claro] .app .botao-secundario` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:368 | `:root[data-tema=claro] .app .aviso-pwa button` | color | `#28431e` | --controle-texto |  |
| src/estilos/paleta-clara.css:434 | `:root[data-tema=claro] .app .desfazer button` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:575 | `:root[data-tema=claro] .app .roda>button` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:610 | `:root[data-tema=claro] .app .lista-tipos>button` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:610 | `:root[data-tema=claro] .app .lista-tipos>button` | border-bottom | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:680 | `:root[data-tema=claro] .app .botao-principal` | color | `#28431e` | --controle-texto |  |
| src/estilos/paleta-clara.css:680 | `:root[data-tema=claro] .app .botao-principal` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:684 | `:root[data-tema=claro] .app .botao-principal:disabled` | border-color | `#7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:689 | `:root[data-tema=claro] .app .botao-principal:focus-visible` | outline | `3px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:728 | `:root[data-tema=claro] .app .filtro-musculos button` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:733 | `:root[data-tema=claro] .app .filtro-musculos button[aria-pressed=true]` | border-color | `#7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:733 | `:root[data-tema=claro] .app .filtro-musculos button[aria-pressed=true]` | color | `#28431e` | --controle-texto |  |
| src/estilos/paleta-clara.css:740 | `:root[data-tema=claro] .app .biblioteca-cartao .acoes button:last-child` | background | `#fff0ea` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:740 | `:root[data-tema=claro] .app .biblioteca-cartao .acoes button:last-child` | color | `#963e32` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:754 | `:root[data-tema=claro] .app .escolhas-editor button` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:759 | `:root[data-tema=claro] .app .escolhas-editor button[aria-pressed=true]` | border-color | `#7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:759 | `:root[data-tema=claro] .app .escolhas-editor button[aria-pressed=true]` | color | `#28431e` | --controle-texto |  |
| src/estilos/paleta-clara.css:850 | `:root[data-tema=claro] .app .aviso-recorde button` | color | `#28431e` | --controle-texto |  |
| src/estilos/paleta-clara.css:867 | `:root[data-tema=claro] .app .aviso-remocao>button` | color | `#28431e` | --controle-texto |  |
| src/estilos/paleta-clara.css:973 | `:root[data-tema=claro] .app .ultimo-concluido>.botao-secundario` | border-color | `#7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1029 | `:root[data-tema=claro] .app .aviso-recorde>button` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1192 | `:root[data-tema=claro] .app .acoes-cardio button` | color | `#28431e` | --controle-texto |  |
| src/estilos/paleta-clara.css:1195 | `:root[data-tema=claro] .app .acoes-cardio button+button` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1228 | `:root[data-tema=claro] .app .linha-feriado>button` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1235 | `:root[data-tema=claro] .app .linha-feriado>button+button` | color | `#963e32` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1685 | `:root[data-tema=claro] .app .modelos-card>button` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1689 | `:root[data-tema=claro] .app .modelos-card>button[aria-pressed=true]` | border-color | `#7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1702 | `:root[data-tema=claro] .app .opcoes-adesivo>button` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1702 | `:root[data-tema=claro] .app .opcoes-adesivo>button` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1707 | `:root[data-tema=claro] .app .opcoes-adesivo>button[aria-pressed=true]` | border-color | `#7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1752 | `:root[data-tema=claro] .app .botao-atalho-numero` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1789 | `:root[data-tema=claro] .app .botao-destrutivo` | border | `1px solid #a76a5b` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1789 | `:root[data-tema=claro] .app .botao-destrutivo` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1789 | `:root[data-tema=claro] .app .botao-destrutivo` | color | `#963e32` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1794 | `:root[data-tema=claro] .app .botao-destrutivo:focus-visible` | outline | `2px solid #a76a5b` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1807 | `:root[data-tema=claro] .app .botao-destrutivo:hover` | background | `#fff0ea` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1829 | `:root[data-tema=claro] .app .botao-principal:disabled, :root[data-tema=claro] .app .botao-secundario:disabled` | border-color | `#7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1835 | `:root[data-tema=claro] .app .botao-secundario.excluir-historico` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1835 | `:root[data-tema=claro] .app .botao-secundario.excluir-historico` | color | `#963e32` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1835 | `:root[data-tema=claro] .app .botao-secundario.excluir-historico` | border-color | `#a76a5b` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1918 | `:root[data-tema=claro] .app .botao-secundario:hover:not(:disabled)` | border-color | `#7c8d76` | não encontrado; avaliar papel próprio |  |

### configuracoes

| Arquivo:linha | Seletor | Propriedade | Valor literal | Token de valor equivalente | Condição |
| --- | --- | --- | --- | --- | --- |
| src/index.css:6 | `.concluir-backup` | border | `1px solid #bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:6 | `.concluir-backup` | background | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:6 | `.concluir-backup` | color | `#182b18` | não encontrado; avaliar papel próprio |  |
| src/index.css:6 | `.concluir-backup:active` | background | `#a9da73` | não encontrado; avaliar papel próprio |  |
| src/index.css:6 | `.concluir-backup:active` | border-color | `#a9da73` | não encontrado; avaliar papel próprio |  |
| src/index.css:6 | `.concluir-backup:disabled` | background | `#354b2d` | não encontrado; avaliar papel próprio |  |
| src/index.css:6 | `.concluir-backup:disabled` | border-color | `#4a6340` | não encontrado; avaliar papel próprio |  |
| src/index.css:6 | `.concluir-backup:disabled` | color | `#c0d3b4` | não encontrado; avaliar papel próprio |  |
| src/index.css:7 | `.backup-config .introducao-backup` | color | `#a4b8aa` | não encontrado; avaliar papel próprio |  |
| src/index.css:7 | `.backup-config .preparar-backup` | background | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:7 | `.backup-config .preparar-backup` | color | `#182b18` | não encontrado; avaliar papel próprio |  |
| src/index.css:7 | `.backup-config .preparar-backup.backup-gerado` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:7 | `.backup-config .preparar-backup.backup-gerado` | color | `#b9cec0` | não encontrado; avaliar papel próprio |  |
| src/index.css:7 | `.backup-config .preparar-backup.backup-gerado` | border | `1px solid #3a5040` | não encontrado; avaliar papel próprio |  |
| src/index.css:7 | `.backup-config .backup-pronto` | background | `#1b2b20` | não encontrado; avaliar papel próprio |  |
| src/index.css:7 | `.backup-config .backup-pronto` | border-color | `#49663e` | não encontrado; avaliar papel próprio |  |
| src/index.css:7 | `.icone-arquivo-backup` | background | `#2a4025` | não encontrado; avaliar papel próprio |  |
| src/index.css:7 | `.icone-arquivo-backup` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:7 | `.cabecalho-arquivo-backup strong` | color | `#e5f0e5` | não encontrado; avaliar papel próprio |  |
| src/index.css:7 | `.cabecalho-arquivo-backup>div>span` | color | `#a5bba9` | não encontrado; avaliar papel próprio |  |
| src/index.css:7 | `.backup-config .backup-pronto>.nome-arquivo-backup` | color | `#8fa698` | não encontrado; avaliar papel próprio |  |
| src/index.css:7 | `.acoes-arquivo-backup>a` | background | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:7 | `.acoes-arquivo-backup>a` | color | `#182b18` | não encontrado; avaliar papel próprio |  |
| src/index.css:7 | `.acoes-arquivo-backup>button` | color | `#c6d8c9` | não encontrado; avaliar papel próprio |  |
| src/index.css:7 | `.acoes-arquivo-backup>button` | border-color | `#49604c` | não encontrado; avaliar papel próprio |  |
| src/index.css:7 | `.nota-salvamento-backup` | color | `#8fa698` | não encontrado; avaliar papel próprio |  |
| src/index.css:7 | `.backup-config .nota-salvamento-backup>p` | color | `#98ad9e` | não encontrado; avaliar papel próprio |  |
| src/index.css:7 | `.acoes-backup-secundarias` | border-block | `1px solid #304235` | não encontrado; avaliar papel próprio |  |
| src/index.css:7 | `.acoes-backup-secundarias>button,.backup-config .acoes-backup-secundarias>label` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:7 | `.acoes-backup-secundarias>button,.backup-config .acoes-backup-secundarias>label` | color | `#a6c29e` | não encontrado; avaliar papel próprio |  |
| src/index.css:7 | `.acoes-backup-secundarias>button+button,.acoes-backup-secundarias>label+button` | border-top | `1px solid #304235` | não encontrado; avaliar papel próprio |  |
| src/index.css:7 | `.acoes-backup-secundarias strong` | color | `#dce8df` | não encontrado; avaliar papel próprio |  |
| src/index.css:7 | `.backup-config .acoes-backup-secundarias small` | color | `#8fa698` | não encontrado; avaliar papel próprio |  |
| src/index.css:7 | `.acao-backup-importar:focus-within` | outline | `2px solid #bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:7 | `.lembrete-backup-opcao` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:7 | `.lembrete-backup-opcao` | color | `#8fa698` | não encontrado; avaliar papel próprio |  |
| src/index.css:7 | `.lembrete-backup-opcao>strong` | color | `#c4d7c6` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.instalacao` | border | `1px solid #35442f` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.instalacao` | background | `#1b271c` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.instalacao` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:12 | `.instalacao p` | color | `#c6d3c0` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.instalacao small` | color | `#95a88c` | não encontrado; avaliar papel próprio |  |
| src/index.css:13 | `.instalacao` | box-shadow | `0 10px 35px #0005` | não encontrado; avaliar papel próprio |  |
| src/index.css:68 | `.arquivo-backup` | border | `1px solid #3c553b` | não encontrado; avaliar papel próprio |  |
| src/index.css:68 | `.arquivo-backup` | background | `#1d3022` | não encontrado; avaliar papel próprio |  |
| src/index.css:68 | `.arquivo-backup>small` | color | `#98b39e` | não encontrado; avaliar papel próprio |  |
| src/index.css:74 | `.secao-config` | background | `#19251d` | não encontrado; avaliar papel próprio |  |
| src/index.css:74 | `.secao-config` | border | `1px solid #2e4033` | não encontrado; avaliar papel próprio |  |
| src/index.css:74 | `.secao-config>h2>button` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:74 | `.icone-config` | background | `#253923` | não encontrado; avaliar papel próprio |  |
| src/index.css:74 | `.icone-config` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:74 | `.texto-config>strong` | color | `#edf1ed` | não encontrado; avaliar papel próprio |  |
| src/index.css:74 | `.texto-config>small` | color | `#9eb2a4` | não encontrado; avaliar papel próprio |  |
| src/index.css:74 | `.seta-config` | color | `#9eb2a4` | não encontrado; avaliar papel próprio |  |
| src/index.css:74 | `.conteudo-config>.painel` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:74 | `.secao-config.expandida>h2` | border-bottom | `1px solid #2e4033` | não encontrado; avaliar papel próprio |  |
| src/index.css:76 | `.saida-config` | border-top | `1px solid #2b3c30` | não encontrado; avaliar papel próprio |  |
| src/index.css:76 | `.saida-config>p:not(.erro)` | color | `#8fa698` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:7 | `.privacidade-alerta` | border | `1px solid #60473e` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:7 | `.privacidade-alerta` | background | `#241e1a` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:8 | `.privacidade-alerta > strong` | color | `#edb6a7` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:9 | `.privacidade-alerta > p` | color | `#bacabd` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:16 | `.aviso-backup` | border | `1px solid #3a5039` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:16 | `.aviso-backup` | background | `#19271d` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:18 | `.aviso-backup-titulo > svg` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/estilos/controles.css:20 | `.aviso-backup > p` | color | `#a9bcae` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:218 | `.privacidade-grupo` | border-top | `1px solid #304235` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:219 | `.privacidade-grupo > summary` | color | `#dce8df` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:221 | `.privacidade-grupo summary small` | color | `#8fa698` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:223 | `.privacidade-dados .privacidade-grupo > h3` | color | `#dce8df` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:227 | `.backup-protecao` | border | `1px solid #3a5040` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:227 | `.backup-protecao` | background | `#203225` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:228 | `.backup-protecao > svg` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/estilos/controles.css:229 | `.backup-protecao strong` | color | `#e5f0e5` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:230 | `.backup-config .backup-protecao p` | color | `#a4b8aa` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:231 | `.backup-config .opcao-fotos-backup` | border-bottom | `1px solid #304235` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:232 | `.backup-outros-formatos` | border-top | `1px solid #304235` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:233 | `.backup-outros-formatos > summary` | color | `#b9cec0` | não encontrado; avaliar papel próprio |  |
| src/estilos/novo-visual.css:166 | `[data-tema=claro] .app .privacidade-alerta` | background | `#fff2e9` | não encontrado; avaliar papel próprio |  |
| src/estilos/novo-visual.css:166 | `[data-tema=claro] .app .privacidade-alerta` | color | `#6d3b2c` | não encontrado; avaliar papel próprio |  |
| src/estilos/novo-visual.css:166 | `[data-tema=claro] .app .privacidade-alerta` | border-color | `#c7978b` | não encontrado; avaliar papel próprio |  |
| src/estilos/novo-visual.css:167 | `[data-tema=claro] .app .privacidade-alerta :is(p,strong)` | color | `#6d3b2c` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:103 | `:root[data-tema=claro] .app .concluir-backup` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:103 | `:root[data-tema=claro] .app .concluir-backup` | color | `#28431e` | --controle-texto |  |
| src/estilos/paleta-clara.css:107 | `:root[data-tema=claro] .app .concluir-backup:active` | border-color | `#7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:110 | `:root[data-tema=claro] .app .concluir-backup:disabled` | border-color | `#7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:118 | `:root[data-tema=claro] .app .backup-config .preparar-backup` | color | `#28431e` | --controle-texto |  |
| src/estilos/paleta-clara.css:121 | `:root[data-tema=claro] .app .backup-config .preparar-backup.backup-gerado` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:121 | `:root[data-tema=claro] .app .backup-config .preparar-backup.backup-gerado` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:126 | `:root[data-tema=claro] .app .backup-config .backup-pronto` | border-color | `#7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:143 | `:root[data-tema=claro] .app .acoes-arquivo-backup>a` | color | `#28431e` | --controle-texto |  |
| src/estilos/paleta-clara.css:146 | `:root[data-tema=claro] .app .acoes-arquivo-backup>button` | border-color | `#7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:156 | `:root[data-tema=claro] .app .acoes-backup-secundarias>button, :root[data-tema=claro] .app .backup-config .acoes-backup-secundarias>label` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:161 | `:root[data-tema=claro] .app .acoes-backup-secundarias>button+button, :root[data-tema=claro] .app .acoes-backup-secundarias>label+button` | border-top | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:171 | `:root[data-tema=claro] .app .acao-backup-importar:focus-within` | outline | `2px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:174 | `:root[data-tema=claro] .app .lembrete-backup-opcao` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:320 | `:root[data-tema=claro] .app .instalacao` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1244 | `:root[data-tema=claro] .app .arquivo-backup` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1315 | `:root[data-tema=claro] .app .secao-config` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1332 | `:root[data-tema=claro] .app .secao-config.expandida>h2` | border-bottom | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1363 | `:root[data-tema=claro] .app .saida-config` | border-top | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1797 | `:root[data-tema=claro] .app .privacidade-alerta` | border | `1px solid #a76a5b` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1797 | `:root[data-tema=claro] .app .privacidade-alerta` | background | `#fff0ea` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1801 | `:root[data-tema=claro] .app .privacidade-alerta > strong` | color | `#963e32` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1813 | `:root[data-tema=claro] .app .aviso-backup` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1880 | `:root[data-tema=claro] .app .privacidade-grupo` | border-top | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1896 | `:root[data-tema=claro] .app .backup-protecao` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1909 | `:root[data-tema=claro] .app .backup-config .opcao-fotos-backup` | border-bottom | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1912 | `:root[data-tema=claro] .app .backup-outros-formatos` | border-top | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/contraste-claro.css:31 | `:root[data-tema=claro] .app .secao-config` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/contraste-claro.css:32 | `:root[data-tema=claro] .app .icone-config` | background | `#d6e7c1` | --visual-acento-fundo |  |
| src/estilos/contraste-claro.css:32 | `:root[data-tema=claro] .app .icone-config` | color | `#315b24` | --visual-acento |  |
| src/estilos/superficies.css:47 | `:root[data-tema] .app .config-lista .secao-config` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/superficies.css:49 | `:root[data-tema] .app .conteudo-config > .painel` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/superficies.css:55 | `:root[data-tema] .app .privacidade-recolhida > .painel.privacidade-dados` | background | `transparent` | não encontrado; avaliar papel próprio |  |

### cabecalho

| Arquivo:linha | Seletor | Propriedade | Valor literal | Token de valor equivalente | Condição |
| --- | --- | --- | --- | --- | --- |
| src/index.css:12 | `.cabecalho` | border-bottom | `1px solid #25302a` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.marca>span` | background | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:12 | `.marca>span` | color | `#1b2b17` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.marca small` | color | `#95a399` | não encontrado; avaliar papel próprio |  |
| src/index.css:30 | `.biblioteca-cabecalho p` | color | `#99ad9e` | não encontrado; avaliar papel próprio |  |
| src/index.css:61 | `.cabecalho-comparacao` | color | `#9db4a4` | não encontrado; avaliar papel próprio |  |
| src/index.css:61 | `.cabecalho-comparacao` | background | `#233728` | não encontrado; avaliar papel próprio |  |
| src/index.css:71 | `.marca-entrada>span` | background | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:71 | `.marca-entrada>span` | color | `#1b2b17` | não encontrado; avaliar papel próprio |  |
| src/index.css:71 | `.marca-entrada small` | color | `#93a399` | não encontrado; avaliar papel próprio |  |
| src/estilos/novo-visual.css:39 | `.marca > span` | background | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/estilos/novo-visual.css:39 | `.marca > span` | color | `#233b1d` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:247 | `:root[data-tema=claro] .app .cabecalho` | border-bottom | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:250 | `:root[data-tema=claro] .app .marca>span` | color | `#28431e` | --controle-texto |  |
| src/estilos/paleta-clara.css:1254 | `:root[data-tema=claro] .app .marca-entrada>span` | color | `#28431e` | --controle-texto |  |
| src/estilos/contraste-claro.css:26 | `:root[data-tema=claro] .app > .cabecalho` | background | `#dce7cf` | --superficie-topo |  |
| src/estilos/contraste-claro.css:26 | `:root[data-tema=claro] .app > .cabecalho` | border-bottom-color | `#adbf9b` | não encontrado; avaliar papel próprio |  |

### destaque

| Arquivo:linha | Seletor | Propriedade | Valor literal | Token de valor equivalente | Condição |
| --- | --- | --- | --- | --- | --- |
| src/index.css:12 | `.destaque` | background | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:12 | `.destaque` | color | `#182b18` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.destaque p` | color | `#31482b` | não encontrado; avaliar papel próprio |  |
| src/estilos/novo-visual.css:59 | `.app .destaque` | background | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/estilos/novo-visual.css:59 | `.app .destaque` | color | `#1b3615` | não encontrado; avaliar papel próprio |  |
| src/estilos/novo-visual.css:60 | `.app .destaque h2` | color | `#1b3615` | não encontrado; avaliar papel próprio |  |
| src/estilos/novo-visual.css:61 | `.app .destaque p` | color | `#294323` | não encontrado; avaliar papel próprio |  |
| src/estilos/novo-visual.css:62 | `.app .destaque .etiqueta` | color | `#294323` | não encontrado; avaliar papel próprio |  |
| src/estilos/novo-visual.css:63 | `.app .destaque .botao-principal` | background | `#213e18` | não encontrado; avaliar papel próprio |  |
| src/estilos/novo-visual.css:63 | `.app .destaque .botao-principal` | border-color | `#213e18` | não encontrado; avaliar papel próprio |  |
| src/estilos/novo-visual.css:63 | `.app .destaque .botao-principal` | color | `#e1f5cc` | não encontrado; avaliar papel próprio |  |
| src/estilos/novo-visual.css:64 | `.app .destaque .decoracao` | color | `#294323` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:263 | `:root[data-tema=claro] .app .destaque` | color | `#28431e` | --controle-texto |  |
| src/estilos/paleta-clara.css:266 | `:root[data-tema=claro] .app .destaque p` | color | `#28431e` | --controle-texto |  |
| src/estilos/contraste-claro.css:21 | `:root[data-tema=claro] .app .destaque .botao-principal` | background | `#213e18` | não encontrado; avaliar papel próprio |  |
| src/estilos/contraste-claro.css:21 | `:root[data-tema=claro] .app .destaque .botao-principal` | color | `#fff` | não encontrado; avaliar papel próprio |  |
| src/estilos/contraste-claro.css:21 | `:root[data-tema=claro] .app .destaque .botao-principal` | border-color | `#213e18` | não encontrado; avaliar papel próprio |  |
| src/estilos/contraste-claro.css:33 | `:root[data-tema=claro] .app .destaque` | background | `linear-gradient(125deg,#c9eb8f,#aedb72)` | não encontrado; avaliar papel próprio |  |
| src/estilos/contraste-claro.css:33 | `:root[data-tema=claro] .app .destaque` | border | `1px solid #a6ca75` | não encontrado; avaliar papel próprio |  |
| src/estilos/contraste-claro.css:33 | `:root[data-tema=claro] .app .destaque` | box-shadow | `0 6px 18px #45632412` | não encontrado; avaliar papel próprio |  |

### navegacao

| Arquivo:linha | Seletor | Propriedade | Valor literal | Token de valor equivalente | Condição |
| --- | --- | --- | --- | --- | --- |
| src/index.css:12 | `.navegacao` | border-top | `1px solid #2c372f` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.navegacao` | background | `#131c17` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.navegacao button` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.navegacao button` | color | `#849389` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.navegacao button[aria-current]` | background | `#24321f` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.navegacao button[aria-current]` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:18 | `.abas-detalhe` | background | `#1c2720` | não encontrado; avaliar papel próprio |  |
| src/index.css:18 | `.abas-detalhe` | border | `1px solid #334036` | não encontrado; avaliar papel próprio |  |
| src/index.css:18 | `.abas-detalhe button` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:18 | `.abas-detalhe button` | color | `#adb8ae` | não encontrado; avaliar papel próprio |  |
| src/index.css:18 | `.abas-detalhe button[aria-pressed=true]` | background | `#24321f` | não encontrado; avaliar papel próprio |  |
| src/index.css:18 | `.abas-detalhe button[aria-pressed=true]` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:131 | `.alternador-seletor` | background | `#17251d` | não encontrado; avaliar papel próprio |  |
| src/index.css:131 | `.alternador-seletor` | border | `1px solid #304435` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:308 | `:root[data-tema=claro] .app .navegacao` | border-top | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:312 | `:root[data-tema=claro] .app .navegacao button` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:532 | `:root[data-tema=claro] .app .abas-detalhe` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:536 | `:root[data-tema=claro] .app .abas-detalhe button` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1741 | `:root[data-tema=claro] .app .alternador-seletor` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/contraste-claro.css:18 | `:root[data-tema=claro] .app .navegacao button` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/contraste-claro.css:18 | `:root[data-tema=claro] .app .navegacao button` | color | `#50644e` | não encontrado; avaliar papel próprio |  |
| src/estilos/contraste-claro.css:19 | `:root[data-tema=claro] .app .navegacao button[aria-current=page]` | background | `#e7f1dd` | não encontrado; avaliar papel próprio |  |
| src/estilos/contraste-claro.css:19 | `:root[data-tema=claro] .app .navegacao button[aria-current=page]` | color | `#355f26` | não encontrado; avaliar papel próprio |  |
| src/estilos/contraste-claro.css:27 | `:root[data-tema=claro] .app > .navegacao` | background | `#dce7cf` | --superficie-topo |  |
| src/estilos/contraste-claro.css:27 | `:root[data-tema=claro] .app > .navegacao` | border-top-color | `#adbf9b` | não encontrado; avaliar papel próprio |  |
| src/estilos/contraste-claro.css:28 | `:root[data-tema=claro] .app .navegacao button[aria-current=page]` | background | `#315b24` | --visual-acento |  |
| src/estilos/contraste-claro.css:28 | `:root[data-tema=claro] .app .navegacao button[aria-current=page]` | color | `#fff` | não encontrado; avaliar papel próprio |  |

### modais

| Arquivo:linha | Seletor | Propriedade | Valor literal | Token de valor equivalente | Condição |
| --- | --- | --- | --- | --- | --- |
| src/index.css:12 | `.painel` | background | `#19221c` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.painel` | border | `1px solid #2a352e` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.painel p` | color | `#a4b1a6` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.painel dl>div` | border-bottom | `1px solid #2a352e` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.painel dt` | color | `#a4b1a6` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.painel dd` | color | `#d8e6d2` | não encontrado; avaliar papel próprio |  |
| src/index.css:12 | `.painel small` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:14 | `.painel-modal` | border | `1px solid #354232` | não encontrado; avaliar papel próprio |  |
| src/index.css:14 | `.painel-modal` | background | `#131c17` | não encontrado; avaliar papel próprio |  |
| src/index.css:14 | `.painel-modal` | color | `#edf1ed` | não encontrado; avaliar papel próprio |  |
| src/index.css:14 | `.painel-modal::backdrop` | background | `#000a` | não encontrado; avaliar papel próprio |  |
| src/index.css:14 | `.painel-modal>.topo-painel>header` | background | `#131c17` | não encontrado; avaliar papel próprio |  |
| src/index.css:14 | `.painel-modal>.topo-painel>header` | border-bottom | `1px solid #354232` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.painel-modal::before` | background | `#3b4b41` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.painel-modal` | background | `#14221b` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.painel-modal` | border-color | `#31483a` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.painel-modal>.topo-painel>header` | background | `#14221b` | não encontrado; avaliar papel próprio |  |
| src/index.css:24 | `.painel-modal.painel-centralizado` | box-shadow | `0 24px 80px #0009` | não encontrado; avaliar papel próprio |  |
| src/index.css:27 | `.alca-painel` | background | `#14221b` | não encontrado; avaliar papel próprio |  |
| src/index.css:27 | `.alca-painel>span` | background | `#607267` | não encontrado; avaliar papel próprio |  |
| src/index.css:27 | `.alca-painel:focus-visible` | outline | `2px solid #bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:33 | `.alca-painel:focus-visible>span` | background | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:33 | `.alca-painel:focus-visible>span` | box-shadow | `0 0 0 3px #bcec8630` | não encontrado; avaliar papel próprio |  |
| src/index.css:43 | `.topo-painel` | background | `#14221b` | não encontrado; avaliar papel próprio |  |
| src/index.css:50 | `.painel-modal>.topo-painel>header>.botao-icone` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:50 | `.painel-modal>.topo-painel>header>.botao-icone` | color | `#8fa698` | não encontrado; avaliar papel próprio |  |
| src/index.css:50 | `.painel-modal>.topo-painel>header>.botao-icone:active` | background | `#25392c` | não encontrado; avaliar papel próprio |  |
| src/index.css:50 | `.painel-modal>.topo-painel>header>.botao-icone:active` | color | `#d9e9dc` | não encontrado; avaliar papel próprio |  |
| src/index.css:60 | `.painel-modal>.topo-painel` | background | `#14221b` | não encontrado; avaliar papel próprio |  |
| src/estilos/novo-visual.css:99 | `.app .painel-modal` | box-shadow | `0 -10px 70px #0005` | não encontrado; avaliar papel próprio |  |
| src/estilos/novo-visual.css:101 | `.app .painel-modal::backdrop` | background | `#0009` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:345 | `:root[data-tema=claro] .app .painel` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:352 | `:root[data-tema=claro] .app .painel dl>div` | border-bottom | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:399 | `:root[data-tema=claro] .app .painel-modal` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:407 | `:root[data-tema=claro] .app .painel-modal>.topo-painel>header` | border-bottom | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:559 | `:root[data-tema=claro] .app .painel-modal` | border-color | `#7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:698 | `:root[data-tema=claro] .app .alca-painel:focus-visible` | outline | `2px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:965 | `:root[data-tema=claro] .app .painel-modal>.topo-painel>header>.botao-icone` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/contraste-claro.css:39 | `:root[data-tema=claro] .app .painel-modal > .topo-painel, :root[data-tema=claro] .app .painel-modal > .topo-painel > header` | background | `#dce7cf` | --superficie-topo |  |

### treino

| Arquivo:linha | Seletor | Propriedade | Valor literal | Token de valor equivalente | Condição |
| --- | --- | --- | --- | --- | --- |
| src/index.css:14 | `.abas-treino button` | background | `#19221c` | não encontrado; avaliar papel próprio |  |
| src/index.css:14 | `.abas-treino button` | color | `#adb8ae` | não encontrado; avaliar papel próprio |  |
| src/index.css:14 | `.abas-treino button[aria-pressed=true]` | background | `#24321f` | não encontrado; avaliar papel próprio |  |
| src/index.css:14 | `.abas-treino button[aria-pressed=true]` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:14 | `.abrir-ficha` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:14 | `.abrir-ficha small` | color | `#95a499` | não encontrado; avaliar papel próprio |  |
| src/index.css:14 | `.item-ficha` | border | `1px solid #354232` | não encontrado; avaliar papel próprio |  |
| src/index.css:15 | `.serie` | border | `1px solid #334036` | não encontrado; avaliar papel próprio |  |
| src/index.css:15 | `.serie.concluida` | background | `#1b271c` | não encontrado; avaliar papel próprio |  |
| src/index.css:15 | `.serie.proxima-serie` | border | `2px solid #bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:15 | `.descanso` | background | `#24321f` | não encontrado; avaliar papel próprio |  |
| src/index.css:15 | `.descanso` | border | `1px solid #bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:15 | `.descanso` | box-shadow | `0 6px 24px #0006` | não encontrado; avaliar papel próprio |  |
| src/index.css:15 | `.descanso>span` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:15 | `.descanso.terminou` | outline | `3px solid #bcec86` | --controle-destaque, --visual-acento | @media (prefers-reduced-motion:reduce) |
| src/index.css:16 | `.cabecalho-series` | color | `#95a499` | não encontrado; avaliar papel próprio |  |
| src/index.css:16 | `.serie-compacta` | background | `#1c2720` | não encontrado; avaliar papel próprio |  |
| src/index.css:16 | `.serie-compacta.proxima-serie` | border | `1px solid #bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:16 | `.linha-serie input` | border | `1px solid #334036` | não encontrado; avaliar papel próprio |  |
| src/index.css:16 | `.linha-serie input` | background | `#101714` | não encontrado; avaliar papel próprio |  |
| src/index.css:16 | `.linha-serie input` | color | `#edf1ed` | não encontrado; avaliar papel próprio |  |
| src/index.css:16 | `.opcoes-serie>summary` | color | `#95a499` | não encontrado; avaliar papel próprio |  |
| src/index.css:16 | `.serie-compacta.concluida` | background | `#192b1b` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.tipo-serie` | background | `#293d30` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.tipo-serie` | color | `#dbe9df` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.tipo-serie.aquecimento` | background | `#443f22` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.tipo-serie.aquecimento` | color | `#e8cf82` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.tipo-serie.dropset` | background | `#47322a` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.tipo-serie.dropset` | color | `#edb395` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.tipo-serie.falha` | background | `#442b34` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.tipo-serie.falha` | color | `#efa7b8` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.valor-serie` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.valor-serie` | color | `#edf1ed` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.valor-serie` | border-bottom | `2px dashed #536858` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.lista-tipos>button.remover-serie` | color | `#efa7a7` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.botao-descanso` | background | `#223428` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.botao-descanso` | color | `#a9bfaf` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.botao-descanso strong` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:19 | `.retomar-treino` | background | `linear-gradient(135deg,#bcec86,#91be60)` | --controle-destaque, --visual-acento |  |
| src/index.css:19 | `.retomar-treino` | color | `#182b18` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.retomar-treino button` | background | `#1c331c` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.retomar-treino button` | color | `#f0f7e9` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.barra-fichas` | color | `#95a499` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.barra-fichas button` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.barra-fichas button` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:19 | `.ficha-nova` | background | `linear-gradient(145deg,#1d2a20,#17201b)` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.ficha-nova` | border-color | `#2e4031` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.icone-ficha` | background | `#2a3d25` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.icone-ficha` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:19 | `.menu-ficha>summary` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.menu-ficha>summary` | color | `#b1c1a8` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.menu-ficha .acoes` | background | `#213026` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.menu-ficha .acoes` | border | `1px solid #4a5c45` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.menu-ficha .acoes` | box-shadow | `0 10px 35px #0008` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.menu-ficha .acoes button` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.iniciar-ficha` | background | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:19 | `.iniciar-ficha` | color | `#182b18` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.treino-livre` | border | `1px dashed #3d523a` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.treino-livre` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.treino-livre` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:19 | `.treino-livre small` | color | `#95a499` | não encontrado; avaliar papel próprio |  |
| src/index.css:28 | `.acao-treino` | border | `1px solid #344537` | não encontrado; avaliar papel próprio |  |
| src/index.css:28 | `.acao-treino` | background | `#18241c` | não encontrado; avaliar papel próprio |  |
| src/index.css:28 | `.acao-treino summary small` | color | `#96aa9b` | não encontrado; avaliar papel próprio |  |
| src/index.css:28 | `.observacao-treino .opcional` | color | `#91a397` | não encontrado; avaliar papel próprio |  |
| src/index.css:29 | `.descanso.descanso-popup` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:29 | `.descanso-popup>strong` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:29 | `.descanso-popup>p` | color | `#acbdb0` | não encontrado; avaliar papel próprio |  |
| src/index.css:29 | `.ajustes-descanso button` | background | `#293d30` | não encontrado; avaliar papel próprio |  |
| src/index.css:29 | `.ajustes-descanso button` | color | `#e4eee6` | não encontrado; avaliar papel próprio |  |
| src/index.css:35 | `.historico-series` | color | `#b5c6ba` | não encontrado; avaliar papel próprio |  |
| src/index.css:38 | `.valor-serie` | border | `1px solid #3a5040` | não encontrado; avaliar papel próprio |  |
| src/index.css:38 | `.valor-serie` | background | `#14221a` | não encontrado; avaliar papel próprio |  |
| src/index.css:45 | `.abas-treino` | border | `1px solid #304236` | não encontrado; avaliar papel próprio |  |
| src/index.css:45 | `.abas-treino` | background | `#142019` | não encontrado; avaliar papel próprio |  |
| src/index.css:45 | `.abas-treino button` | border | `1px solid transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:45 | `.abas-treino button` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:45 | `.abas-treino button` | color | `#98ad9e` | não encontrado; avaliar papel próprio |  |
| src/index.css:45 | `.abas-treino button[aria-pressed=true]` | background | `#2b4026` | não encontrado; avaliar papel próprio |  |
| src/index.css:45 | `.abas-treino button[aria-pressed=true]` | border-color | `#4d6740` | não encontrado; avaliar papel próprio |  |
| src/index.css:45 | `.abas-treino button[aria-pressed=true]` | color | `#d2f5ae` | não encontrado; avaliar papel próprio |  |
| src/index.css:45 | `.abas-treino button[aria-pressed=true]` | box-shadow | `0 2px 6px #0003` | não encontrado; avaliar papel próprio |  |
| src/index.css:45 | `.abas-treino button:focus-visible` | outline | `2px solid #bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:45 | `.abas-treino button:active` | background | `#233629` | não encontrado; avaliar papel próprio |  |
| src/index.css:46 | `.linha-serie>.menu-serie` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:46 | `.linha-serie>.menu-serie` | color | `#8fa596` | não encontrado; avaliar papel próprio |  |
| src/index.css:46 | `.menu-serie[aria-expanded=true]` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:46 | `.menu-serie[aria-expanded=true]` | background | `#2b3d2f` | não encontrado; avaliar papel próprio |  |
| src/index.css:46 | `.opcoes-serie>.formulario` | border-top | `1px solid #344b39` | não encontrado; avaliar papel próprio |  |
| src/index.css:47 | `.linha-historico-serie` | border-top | `1px solid #2d4133` | não encontrado; avaliar papel próprio |  |
| src/index.css:47 | `.linha-historico-serie>span:first-child` | background | `#293c2b` | não encontrado; avaliar papel próprio |  |
| src/index.css:47 | `.linha-historico-serie>span:first-child` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:52 | `.barra-fichas>button` | border | `1px solid #3d5637` | não encontrado; avaliar papel próprio |  |
| src/index.css:52 | `.barra-fichas>button` | background | `#20321e` | não encontrado; avaliar papel próprio |  |
| src/index.css:52 | `.treino-livre` | border | `1px solid #3c513b` | não encontrado; avaliar papel próprio |  |
| src/index.css:52 | `.treino-livre` | background | `#18271d` | não encontrado; avaliar papel próprio |  |
| src/index.css:52 | `.treino-livre>svg:first-child` | background | `#2d4126` | não encontrado; avaliar papel próprio |  |
| src/index.css:52 | `.treino-livre>span` | color | `#d3eac4` | não encontrado; avaliar papel próprio |  |
| src/index.css:52 | `.treino-livre small` | color | `#a2b5a7` | não encontrado; avaliar papel próprio |  |
| src/index.css:52 | `.treino-livre:active,.barra-fichas>button:active,.ultimo-concluido>.botao-secundario:active` | background | `#30472a` | não encontrado; avaliar papel próprio |  |
| src/index.css:53 | `.andamento-treino>small` | color | `#94ad9a` | não encontrado; avaliar papel próprio |  |
| src/index.css:53 | `.andamento-treino>.manter-tela` | background | `#203326` | não encontrado; avaliar papel próprio |  |
| src/index.css:53 | `.andamento-treino>.manter-tela` | border-color | `#3f5743` | não encontrado; avaliar papel próprio |  |
| src/index.css:53 | `.andamento-treino>.manter-tela` | color | `#c1d7c4` | não encontrado; avaliar papel próprio |  |
| src/index.css:53 | `.acao-treino .salvar-planejamento` | background | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:53 | `.acao-treino .salvar-planejamento` | color | `#19301b` | não encontrado; avaliar papel próprio |  |
| src/index.css:53 | `.acao-treino .salvar-planejamento` | border-color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:79 | `.treino-em-andamento .andamento-treino` | border | `1px solid #334735` | não encontrado; avaliar papel próprio |  |
| src/index.css:79 | `.treino-em-andamento .andamento-treino` | background | `linear-gradient(125deg,#203322,#15231b)` | não encontrado; avaliar papel próprio |  |
| src/index.css:81 | `.treino-em-andamento .progresso-sessao` | color | `#afc1b3` | não encontrado; avaliar papel próprio |  |
| src/index.css:84 | `.treino-em-andamento .andamento-treino .manter-tela` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:84 | `.treino-em-andamento .andamento-treino .manter-tela` | color | `#adc3b2` | não encontrado; avaliar papel próprio |  |
| src/index.css:88 | `.treino-em-andamento .ajuda-no-treino` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:88 | `.treino-em-andamento .ajuda-no-treino` | color | `#b8cbbb` | não encontrado; avaliar papel próprio |  |
| src/index.css:90 | `.treino-em-andamento .cabecalho-series` | color | `#9eb3a5` | não encontrado; avaliar papel próprio |  |
| src/index.css:91 | `.treino-em-andamento .serie-compacta` | background | `#1b2a20` | não encontrado; avaliar papel próprio |  |
| src/index.css:91 | `.treino-em-andamento .serie-compacta.proxima-serie` | background | `#233822` | não encontrado; avaliar papel próprio |  |
| src/index.css:91 | `.treino-em-andamento .serie-compacta.proxima-serie` | border-color | `#98c874` | não encontrado; avaliar papel próprio |  |
| src/index.css:91 | `.treino-em-andamento .serie-compacta.proxima-serie` | box-shadow | `inset 3px 0 #bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:91 | `.treino-em-andamento .valor-serie` | background | `#14231a` | não encontrado; avaliar papel próprio |  |
| src/index.css:91 | `.treino-em-andamento .valor-serie` | border-color | `#3b5141` | não encontrado; avaliar papel próprio |  |
| src/index.css:91 | `.treino-em-andamento .serie-compacta.concluida` | background | `#17261b` | não encontrado; avaliar papel próprio |  |
| src/index.css:91 | `.treino-em-andamento .concluida .valor-serie` | border-color | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:91 | `.treino-em-andamento .concluida .valor-serie` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:91 | `.treino-em-andamento .concluida .valor-serie` | color | `#a1b69f` | não encontrado; avaliar papel próprio |  |
| src/index.css:94 | `.treino-em-andamento>.cancelar-sessao` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:94 | `.treino-em-andamento>.cancelar-sessao` | color | `#dda99b` | não encontrado; avaliar papel próprio |  |
| src/index.css:94 | `.treino-em-andamento>.cancelar-sessao:hover` | background | `#30231e` | não encontrado; avaliar papel próprio |  |
| src/index.css:96 | `.troca-treino-dialogo>button:last-of-type` | color | `#edb6a7` | não encontrado; avaliar papel próprio |  |
| src/index.css:96 | `.troca-treino-dialogo>button:last-of-type` | border | `1px solid #60473e` | não encontrado; avaliar papel próprio |  |
| src/index.css:96 | `.troca-treino-dialogo>button:last-of-type` | background | `#241e1a` | não encontrado; avaliar papel próprio |  |
| src/index.css:110 | `.retomar-treino.retomar-compacto` | background | `linear-gradient(130deg,#263b23,#19291d)` | não encontrado; avaliar papel próprio |  |
| src/index.css:110 | `.retomar-treino.retomar-compacto` | color | `#e8f0e7` | não encontrado; avaliar papel próprio |  |
| src/index.css:110 | `.retomar-treino.retomar-compacto` | border | `1px solid #49623c` | não encontrado; avaliar papel próprio |  |
| src/index.css:111 | `.sinal-treino` | background | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:113 | `.retomar-treino.retomar-compacto>button` | background | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:113 | `.retomar-treino.retomar-compacto>button` | color | `#1a2d18` | não encontrado; avaliar papel próprio |  |
| src/index.css:114 | `.ficha-nova.ficha-em-andamento` | border-color | `#49623c` | não encontrado; avaliar papel próprio |  |
| src/index.css:114 | `.ficha-em-andamento .abrir-ficha small` | color | `#c0db9e` | não encontrado; avaliar papel próprio |  |
| src/index.css:114 | `.ficha-em-andamento .iniciar-ficha` | background | `#263c25` | não encontrado; avaliar papel próprio |  |
| src/index.css:114 | `.ficha-em-andamento .iniciar-ficha` | color | `#c8e8aa` | não encontrado; avaliar papel próprio |  |
| src/index.css:114 | `.ficha-em-andamento .iniciar-ficha` | border | `1px solid #526d43` | não encontrado; avaliar papel próprio |  |
| src/index.css:123 | `.ultimo-concluido.ultimo-treino-atalho` | border-bottom | `1px solid #2b3e30` | não encontrado; avaliar papel próprio |  |
| src/index.css:123 | `.ultimo-concluido.ultimo-treino-atalho` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:123 | `.ultimo-treino-atalho>.icone-ultimo-treino` | border | `1px solid #354b38` | não encontrado; avaliar papel próprio |  |
| src/index.css:123 | `.ultimo-treino-atalho>.icone-ultimo-treino` | background | `#20331f` | não encontrado; avaliar papel próprio |  |
| src/index.css:123 | `.ultimo-treino-atalho>.icone-ultimo-treino` | color | `#bad697` | não encontrado; avaliar papel próprio |  |
| src/index.css:123 | `.texto-ultimo-treino>small` | color | `#92ab9a` | não encontrado; avaliar papel próprio |  |
| src/index.css:123 | `.texto-ultimo-treino>strong` | color | `#dce8df` | não encontrado; avaliar papel próprio |  |
| src/index.css:123 | `.ultimo-treino-atalho>.acao-ultimo-treino` | color | `#c0df9e` | não encontrado; avaliar papel próprio |  |
| src/index.css:123 | `.ultimo-treino-atalho:hover .acao-ultimo-treino` | color | `#dcf5b9` | não encontrado; avaliar papel próprio |  |
| src/index.css:123 | `.ultimo-concluido.ultimo-treino-atalho:active` | background | `#19291d` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:276 | `:root[data-tema] .app .treino-em-andamento .andamento-treino .manter-tela:not(:disabled)` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/novo-visual.css:121 | `.app :is(.tipo-serie,.valor-serie,.menu-serie)` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/novo-visual.css:123 | `.app .proxima-serie` | border-color | `#8dae70` | não encontrado; avaliar papel próprio |  |
| src/estilos/novo-visual.css:181 | `.app .item-ficha .acoes > button:last-child` | color | `#edb6a7` | não encontrado; avaliar papel próprio |  |
| src/estilos/novo-visual.css:181 | `.app .item-ficha .acoes > button:last-child` | border-color | `#60473e` | não encontrado; avaliar papel próprio |  |
| src/estilos/novo-visual.css:181 | `.app .item-ficha .acoes > button:last-child` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:419 | `:root[data-tema=claro] .app .item-ficha` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:447 | `:root[data-tema=claro] .app .serie` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:453 | `:root[data-tema=claro] .app .serie.proxima-serie` | border | `2px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:463 | `:root[data-tema=claro] .app .descanso` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:471 | `:root[data-tema=claro] .app .descanso.terminou` | outline | `3px solid #7c8d76` | não encontrado; avaliar papel próprio | @media (prefers-reduced-motion:reduce) |
| src/estilos/paleta-clara.css:504 | `:root[data-tema=claro] .app .serie-compacta.proxima-serie` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:507 | `:root[data-tema=claro] .app .linha-serie input` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:597 | `:root[data-tema=claro] .app .tipo-serie.dropset` | background | `#fff0ea` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:597 | `:root[data-tema=claro] .app .tipo-serie.dropset` | color | `#963e32` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:601 | `:root[data-tema=claro] .app .tipo-serie.falha` | background | `#fff0ea` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:601 | `:root[data-tema=claro] .app .tipo-serie.falha` | color | `#963e32` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:605 | `:root[data-tema=claro] .app .valor-serie` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:605 | `:root[data-tema=claro] .app .valor-serie` | border-bottom | `2px dashed #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:620 | `:root[data-tema=claro] .app .lista-tipos>button.remover-serie` | color | `#963e32` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:630 | `:root[data-tema=claro] .app .retomar-treino` | background | `linear-gradient(135deg,#bcec86,var(--visual-acento-fundo))` | --controle-destaque, --visual-acento |  |
| src/estilos/paleta-clara.css:630 | `:root[data-tema=claro] .app .retomar-treino` | color | `#28431e` | --controle-texto |  |
| src/estilos/paleta-clara.css:641 | `:root[data-tema=claro] .app .barra-fichas button` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:645 | `:root[data-tema=claro] .app .ficha-nova` | background | `linear-gradient(145deg,var(--visual-rebaixo),var(--visual-rebaixo))` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:645 | `:root[data-tema=claro] .app .ficha-nova` | border-color | `#7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:653 | `:root[data-tema=claro] .app .menu-ficha>summary` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:657 | `:root[data-tema=claro] .app .menu-ficha .acoes` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:661 | `:root[data-tema=claro] .app .iniciar-ficha` | color | `#28431e` | --controle-texto |  |
| src/estilos/paleta-clara.css:664 | `:root[data-tema=claro] .app .treino-livre` | border | `1px dashed #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:664 | `:root[data-tema=claro] .app .treino-livre` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:701 | `:root[data-tema=claro] .app .acao-treino` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:873 | `:root[data-tema=claro] .app .valor-serie` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:914 | `:root[data-tema=claro] .app .abas-treino` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:918 | `:root[data-tema=claro] .app .abas-treino button` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:922 | `:root[data-tema=claro] .app .abas-treino button[aria-pressed=true]` | border-color | `#7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:927 | `:root[data-tema=claro] .app .abas-treino button:focus-visible` | outline | `2px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:933 | `:root[data-tema=claro] .app .linha-serie>.menu-serie` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:941 | `:root[data-tema=claro] .app .opcoes-serie>.formulario` | border-top | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:954 | `:root[data-tema=claro] .app .linha-historico-serie` | border-top | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:978 | `:root[data-tema=claro] .app .barra-fichas>button` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:982 | `:root[data-tema=claro] .app .treino-livre` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1003 | `:root[data-tema=claro] .app .andamento-treino>.manter-tela` | border-color | `#7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1011 | `:root[data-tema=claro] .app .acao-treino .salvar-planejamento` | color | `#28431e` | --controle-texto |  |
| src/estilos/paleta-clara.css:1011 | `:root[data-tema=claro] .app .acao-treino .salvar-planejamento` | border-color | `#7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1377 | `:root[data-tema=claro] .app .treino-em-andamento .andamento-treino` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1377 | `:root[data-tema=claro] .app .treino-em-andamento .andamento-treino` | background | `linear-gradient(125deg,var(--visual-rebaixo),var(--visual-rebaixo))` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1398 | `:root[data-tema=claro] .app .treino-em-andamento .andamento-treino .manter-tela` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1419 | `:root[data-tema=claro] .app .treino-em-andamento .ajuda-no-treino` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1436 | `:root[data-tema=claro] .app .treino-em-andamento .serie-compacta.proxima-serie` | border-color | `#7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1440 | `:root[data-tema=claro] .app .treino-em-andamento .valor-serie` | border-color | `#7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1447 | `:root[data-tema=claro] .app .treino-em-andamento .concluida .valor-serie` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1455 | `:root[data-tema=claro] .app .treino-em-andamento>.cancelar-sessao` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1455 | `:root[data-tema=claro] .app .treino-em-andamento>.cancelar-sessao` | color | `#963e32` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1459 | `:root[data-tema=claro] .app .treino-em-andamento>.cancelar-sessao:hover` | background | `#fff0ea` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1462 | `:root[data-tema=claro] .app .troca-treino-dialogo>button:last-of-type` | color | `#963e32` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1462 | `:root[data-tema=claro] .app .troca-treino-dialogo>button:last-of-type` | border | `1px solid #a76a5b` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1462 | `:root[data-tema=claro] .app .troca-treino-dialogo>button:last-of-type` | background | `#fff0ea` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1559 | `:root[data-tema=claro] .app .retomar-treino.retomar-compacto` | background | `linear-gradient(130deg,var(--visual-acento-fundo),var(--visual-rebaixo))` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1559 | `:root[data-tema=claro] .app .retomar-treino.retomar-compacto` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1576 | `:root[data-tema=claro] .app .retomar-treino.retomar-compacto>button` | color | `#28431e` | --controle-texto |  |
| src/estilos/paleta-clara.css:1579 | `:root[data-tema=claro] .app .ficha-nova.ficha-em-andamento` | border-color | `#7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1585 | `:root[data-tema=claro] .app .ficha-em-andamento .iniciar-ficha` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1660 | `:root[data-tema=claro] .app .ultimo-concluido.ultimo-treino-atalho` | border-bottom | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1660 | `:root[data-tema=claro] .app .ultimo-concluido.ultimo-treino-atalho` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1665 | `:root[data-tema=claro] .app .ultimo-treino-atalho>.icone-ultimo-treino` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/contraste-claro.css:41 | `:root[data-tema=claro] .app .ultimo-concluido.ultimo-treino-atalho` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/superficies.css:50 | `:root[data-tema] .app .ultimo-concluido.ultimo-treino-atalho` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/superficies.css:95 | `:root[data-tema] .app .descanso.descanso-popup` | background | `transparent` | não encontrado; avaliar papel próprio |  |

### formularios

| Arquivo:linha | Seletor | Propriedade | Valor literal | Token de valor equivalente | Condição |
| --- | --- | --- | --- | --- | --- |
| src/index.css:14 | `.formulario label` | color | `#c6d3c0` | não encontrado; avaliar papel próprio |  |
| src/index.css:14 | `.formulario input,.formulario select,.formulario textarea` | border | `1px solid #354232` | não encontrado; avaliar papel próprio |  |
| src/index.css:14 | `.formulario input,.formulario select,.formulario textarea` | background | `#101714` | não encontrado; avaliar papel próprio |  |
| src/index.css:14 | `.formulario input,.formulario select,.formulario textarea` | color | `#edf1ed` | não encontrado; avaliar papel próprio |  |
| src/index.css:19 | `.aplicar-proximas input` | accent-color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:68 | `.incluir-fotos input` | accent-color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:127 | `.texto-compartilhar>textarea` | border | `1px solid #3d5540` | não encontrado; avaliar papel próprio |  |
| src/index.css:127 | `.texto-compartilhar>textarea` | background | `#101c14` | não encontrado; avaliar papel próprio |  |
| src/index.css:127 | `.texto-compartilhar>textarea` | color | `#d6e7d8` | não encontrado; avaliar papel próprio |  |
| src/index.css:139 | `.input-com-unidade input` | border | `1px solid #36493c` | não encontrado; avaliar papel próprio |  |
| src/index.css:139 | `.input-com-unidade input` | background | `#15221a` | não encontrado; avaliar papel próprio |  |
| src/index.css:139 | `.input-com-unidade input` | color | `#edf1ed` | não encontrado; avaliar papel próprio |  |
| src/index.css:140 | `.input-com-unidade input:focus-visible` | outline | `2px solid #bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:141 | `.unidade-input` | color | `#8fa296` | não encontrado; avaliar papel próprio |  |
| src/index.css:143 | `.formulario-cardio .opcionais-cardio` | border-top | `1px solid #304637` | não encontrado; avaliar papel próprio |  |
| src/index.css:143 | `.formulario-cardio .opcionais-cardio>summary` | color | `#b9cfbb` | não encontrado; avaliar papel próprio |  |
| src/index.css:144 | `.digitar-duracao>label` | color | `#a8c0af` | não encontrado; avaliar papel próprio |  |
| src/index.css:144 | `.digitar-duracao input` | border | `1px solid #3c5541` | não encontrado; avaliar papel próprio |  |
| src/index.css:144 | `.digitar-duracao input` | background | `#17281d` | não encontrado; avaliar papel próprio |  |
| src/index.css:144 | `.digitar-duracao input` | color | `#d9e9dc` | não encontrado; avaliar papel próprio |  |
| src/estilos/novo-visual.css:193 | `.app .aplicar-proximas input` | accent-color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/estilos/paleta-clara.css:392 | `:root[data-tema=claro] .app .formulario input, :root[data-tema=claro] .app .formulario select, :root[data-tema=claro] .app .formulario textarea` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1736 | `:root[data-tema=claro] .app .texto-compartilhar>textarea` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1761 | `:root[data-tema=claro] .app .input-com-unidade input` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1766 | `:root[data-tema=claro] .app .input-com-unidade input:focus-visible` | outline | `2px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1772 | `:root[data-tema=claro] .app .formulario-cardio .opcionais-cardio` | border-top | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1784 | `:root[data-tema=claro] .app .digitar-duracao input` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/contraste-claro.css:2 | `:root[data-tema=claro] .app :is(input,textarea)::placeholder` | color | `#596c55` | não encontrado; avaliar papel próprio |  |
| src/estilos/contraste-claro.css:3 | `:root[data-tema=claro] .app :is(input,select,textarea)` | border-color | `#7c8d76` | não encontrado; avaliar papel próprio |  |

### catalogo

| Arquivo:linha | Seletor | Propriedade | Valor literal | Token de valor equivalente | Condição |
| --- | --- | --- | --- | --- | --- |
| src/index.css:14 | `.acoes button,.seletor-exercicios button` | background | `#24321f` | não encontrado; avaliar papel próprio |  |
| src/index.css:14 | `.acoes button,.seletor-exercicios button` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:15 | `.exercicio-treino` | border | `1px solid #354232` | não encontrado; avaliar papel próprio |  |
| src/index.css:16 | `.exercicio-recolhivel` | background | `#151f18` | não encontrado; avaliar papel próprio |  |
| src/index.css:16 | `.cabecalho-exercicio:focus-visible` | outline | `3px solid #bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:16 | `.miniatura-exercicio` | background | `#24321f` | não encontrado; avaliar papel próprio |  |
| src/index.css:16 | `.miniatura-exercicio` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:16 | `.resumo-exercicio small` | color | `#95a499` | não encontrado; avaliar papel próprio |  |
| src/index.css:16 | `.seta-exercicio` | color | `#95a499` | não encontrado; avaliar papel próprio |  |
| src/index.css:16 | `.exercicio-recolhivel[open]>.cabecalho-exercicio` | background | `#1b271c` | não encontrado; avaliar papel próprio |  |
| src/index.css:16 | `.conteudo-exercicio` | border-top | `1px solid #334036` | não encontrado; avaliar papel próprio |  |
| src/index.css:18 | `.capa-exercicio` | background | `#19221c` | não encontrado; avaliar papel próprio |  |
| src/index.css:18 | `.capa-exercicio` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:18 | `.passos-exercicio` | color | `#adb8ae` | não encontrado; avaliar papel próprio |  |
| src/index.css:18 | `.passos-exercicio li` | border-bottom | `1px solid #334036` | não encontrado; avaliar papel próprio |  |
| src/index.css:18 | `.passos-exercicio li::marker` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:18 | `.miniatura-exercicio:focus-visible` | outline | `3px solid #bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:21 | `.grupo-exercicios` | border | `1px solid #354232` | não encontrado; avaliar papel próprio |  |
| src/index.css:21 | `.grupo-exercicios` | background | `#18221b` | não encontrado; avaliar papel próprio |  |
| src/index.css:21 | `.grupo-exercicios>summary small` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:21 | `.grupo-exercicios>summary small` | background | `#24321f` | não encontrado; avaliar papel próprio |  |
| src/index.css:35 | `.exercicio-historico` | border | `1px solid #354635` | não encontrado; avaliar papel próprio |  |
| src/index.css:35 | `.exercicio-historico` | background | `#1b281f` | não encontrado; avaliar papel próprio |  |
| src/index.css:35 | `.exercicio-historico` | color | `#ecf2ed` | não encontrado; avaliar papel próprio |  |
| src/index.css:35 | `.exercicio-historico small` | color | `#93aa99` | não encontrado; avaliar papel próprio |  |
| src/index.css:49 | `.sessao-exercicio>summary>span>small` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:49 | `.sessao-exercicio>summary>span>small` | color | `#9fb3a4` | não encontrado; avaliar papel próprio |  |
| src/index.css:56 | `.exercicio-historico-recolhivel>summary svg` | color | `#91a795` | não encontrado; avaliar papel próprio |  |
| src/index.css:85 | `.treino-em-andamento .exercicio-recolhivel` | border-color | `#304435` | não encontrado; avaliar papel próprio |  |
| src/index.css:85 | `.treino-em-andamento .exercicio-recolhivel` | background | `#131f18` | não encontrado; avaliar papel próprio |  |
| src/index.css:85 | `.treino-em-andamento .exercicio-recolhivel` | box-shadow | `0 5px 18px #00000012` | não encontrado; avaliar papel próprio |  |
| src/index.css:86 | `.treino-em-andamento .exercicio-recolhivel[open]>.cabecalho-exercicio` | background | `#192a1d` | não encontrado; avaliar papel próprio |  |
| src/index.css:87 | `.treino-em-andamento .miniatura-exercicio` | background | `#283d26` | não encontrado; avaliar papel próprio |  |
| src/index.css:87 | `.treino-em-andamento .resumo-exercicio small:last-child` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:88 | `.treino-em-andamento .conteudo-exercicio` | border-color | `#2d4032` | não encontrado; avaliar papel próprio |  |
| src/index.css:89 | `.treino-em-andamento .conteudo-exercicio>.botao-descanso` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:89 | `.treino-em-andamento .conteudo-exercicio>.botao-descanso` | color | `#9db2a4` | não encontrado; avaliar papel próprio |  |
| src/index.css:89 | `.treino-em-andamento .conteudo-exercicio>.botao-descanso>span::after` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:92 | `.treino-em-andamento .conteudo-exercicio>.ultimo-desempenho` | border-top | `1px solid #2d4032` | não encontrado; avaliar papel próprio |  |
| src/index.css:92 | `.treino-em-andamento .conteudo-exercicio>.ultimo-desempenho` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:99 | `.abas-catalogo` | background | `#17251d` | não encontrado; avaliar papel próprio |  |
| src/index.css:99 | `.abas-catalogo` | border | `1px solid #304435` | não encontrado; avaliar papel próprio |  |
| src/index.css:99 | `.abas-catalogo>button` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:99 | `.abas-catalogo>button` | color | `#9eb5a6` | não encontrado; avaliar papel próprio |  |
| src/index.css:99 | `.abas-catalogo>button[aria-pressed=true]` | background | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:99 | `.abas-catalogo>button[aria-pressed=true]` | color | `#192d18` | --controle-texto-escuro |  |
| src/index.css:99 | `.abas-catalogo>button[aria-pressed=true]` | box-shadow | `0 2px 8px #0002` | não encontrado; avaliar papel próprio |  |
| src/index.css:100 | `.musculos-catalogo` | scrollbar-color | `#58754b #17251d` | não encontrado; avaliar papel próprio |  |
| src/index.css:100 | `.musculos-catalogo>button` | border | `1px solid #354c3c` | não encontrado; avaliar papel próprio |  |
| src/index.css:100 | `.musculos-catalogo>button` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:100 | `.musculos-catalogo>button` | color | `#afc4b6` | não encontrado; avaliar papel próprio |  |
| src/index.css:100 | `.musculos-catalogo>button[aria-pressed=true]` | background | `#293e26` | não encontrado; avaliar papel próprio |  |
| src/index.css:100 | `.musculos-catalogo>button[aria-pressed=true]` | color | `#c7ef9c` | não encontrado; avaliar papel próprio |  |
| src/index.css:100 | `.musculos-catalogo>button[aria-pressed=true]` | border-color | `#84aa63` | não encontrado; avaliar papel próprio |  |
| src/index.css:100 | `.musculos-catalogo::-webkit-scrollbar-track` | background | `#17251d` | não encontrado; avaliar papel próprio |  |
| src/index.css:100 | `.musculos-catalogo::-webkit-scrollbar-thumb` | background | `#58754b` | não encontrado; avaliar papel próprio |  |
| src/index.css:102 | `.item-catalogo` | border-bottom | `1px solid #293c30` | não encontrado; avaliar papel próprio |  |
| src/index.css:102 | `.abrir-exercicio-catalogo,.selecionar-exercicio` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:102 | `.nome-catalogo>strong` | color | `#e6eee7` | não encontrado; avaliar papel próprio |  |
| src/index.css:102 | `.nome-catalogo>small` | color | `#94ac9c` | não encontrado; avaliar papel próprio |  |
| src/index.css:102 | `.lista-catalogo .miniatura-exercicio` | border | `1px solid #3a5038` | não encontrado; avaliar papel próprio |  |
| src/index.css:102 | `.lista-catalogo .miniatura-exercicio` | background | `linear-gradient(145deg,#293c24,#1a2a20)` | não encontrado; avaliar papel próprio |  |
| src/index.css:102 | `.lista-catalogo .miniatura-exercicio` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:102 | `.item-catalogo>.menu-ficha>summary` | color | `#95ad9c` | não encontrado; avaliar papel próprio |  |
| src/index.css:102 | `.item-catalogo:hover` | background | `#19281d` | não encontrado; avaliar papel próprio |  |
| src/index.css:103 | `.selecionar-exercicio` | border | `1px solid transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:103 | `.selecionar-exercicio` | border-bottom-color | `#293c30` | não encontrado; avaliar papel próprio |  |
| src/index.css:103 | `.selecionar-exercicio[aria-pressed=true]` | background | `#233821` | não encontrado; avaliar papel próprio |  |
| src/index.css:103 | `.selecionar-exercicio[aria-pressed=true]` | border-color | `#749d59` | não encontrado; avaliar papel próprio |  |
| src/index.css:103 | `.marcador-catalogo` | border | `1px solid #68816f` | não encontrado; avaliar papel próprio |  |
| src/index.css:103 | `.marcador-catalogo` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:103 | `.selecionar-exercicio[aria-pressed=true] .marcador-catalogo` | background | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:103 | `.selecionar-exercicio[aria-pressed=true] .marcador-catalogo` | color | `#1a2e19` | não encontrado; avaliar papel próprio |  |
| src/index.css:103 | `.selecionar-exercicio[aria-pressed=true] .marcador-catalogo` | border-color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:103 | `.vazio-catalogo` | color | `#9bb2a3` | não encontrado; avaliar papel próprio |  |
| src/index.css:104 | `.confirmar-catalogo` | background | `#14221bf5` | não encontrado; avaliar papel próprio |  |
| src/index.css:104 | `.confirmar-catalogo` | border | `1px solid #3b533e` | não encontrado; avaliar papel próprio |  |
| src/index.css:104 | `.confirmar-catalogo` | box-shadow | `0 -8px 24px #0002` | não encontrado; avaliar papel próprio |  |
| src/index.css:104 | `.confirmar-catalogo>span` | color | `#a9c0af` | não encontrado; avaliar papel próprio |  |
| src/index.css:105 | `.ampliar-catalogo` | border | `1px solid #364d38` | não encontrado; avaliar papel próprio |  |
| src/index.css:105 | `.ampliar-catalogo` | background | `#1a2a1d` | não encontrado; avaliar papel próprio |  |
| src/index.css:105 | `.ampliar-catalogo strong` | color | `#c5dda9` | não encontrado; avaliar papel próprio |  |
| src/index.css:105 | `.ampliar-catalogo p` | color | `#a7bcad` | não encontrado; avaliar papel próprio |  |
| src/index.css:105 | `.ampliar-catalogo>button` | background | `#2a4027` | não encontrado; avaliar papel próprio |  |
| src/index.css:105 | `.ampliar-catalogo>button` | color | `#c8ed9e` | não encontrado; avaliar papel próprio |  |
| src/index.css:122 | `.sessao-exercicio>summary>span>small` | color | `#9bb2a2` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:23 | `.formulario .opcao-copia-exercicio > input` | accent-color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/estilos/controles.css:88 | `.app .abas-treino, .app .abas-medidas, .app .abas-catalogo, .app .alternador-seletor` | border | `1px solid #304435` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:88 | `.app .abas-treino, .app .abas-medidas, .app .abas-catalogo, .app .alternador-seletor` | background | `#17251d` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:99 | `.app .abas-treino > button, .app .abas-medidas > button, .app .abas-catalogo > button, .app .alternador-seletor > button` | border | `1px solid transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:99 | `.app .abas-treino > button, .app .abas-medidas > button, .app .abas-catalogo > button, .app .alternador-seletor > button` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:99 | `.app .abas-treino > button, .app .abas-medidas > button, .app .abas-catalogo > button, .app .alternador-seletor > button` | color | `#a4bcad` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:127 | `.app :is(.botao-principal, .botao-secundario, .abas-treino > button, .abas-medidas > button, .abas-catalogo > button, .alternador-seletor > button):focus-visible` | outline | `2px solid #e1f6cb` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:263 | `.app .treino-em-andamento .conteudo-exercicio > .acoes > button:last-child` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:263 | `.app .treino-em-andamento .conteudo-exercicio > .acoes > button:last-child` | border-color | `#795247` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:263 | `.app .treino-em-andamento .conteudo-exercicio > .acoes > button:last-child` | color | `#edb6a7` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:264 | `[data-tema=claro] .app .treino-em-andamento .conteudo-exercicio > .acoes > button:last-child` | border-color | `#c7978b` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:264 | `[data-tema=claro] .app .treino-em-andamento .conteudo-exercicio > .acoes > button:last-child` | color | `#973e31` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:272 | `:root[data-tema] .app :is(.abas-treino,.abas-medidas,.abas-catalogo,.alternador-seletor) > button` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/controles.css:272 | `:root[data-tema] .app :is(.abas-treino,.abas-medidas,.abas-catalogo,.alternador-seletor) > button` | border-color | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/novo-visual.css:117 | `.app .exercicio-finalizado` | border-color | `#87af63` | não encontrado; avaliar papel próprio |  |
| src/estilos/novo-visual.css:117 | `.app .exercicio-finalizado` | box-shadow | `inset 0 3px 0 #bcec86` | --controle-destaque, --visual-acento |  |
| src/estilos/paleta-clara.css:438 | `:root[data-tema=claro] .app .exercicio-treino` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:478 | `:root[data-tema=claro] .app .cabecalho-exercicio:focus-visible` | outline | `3px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:494 | `:root[data-tema=claro] .app .conteudo-exercicio` | border-top | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:547 | `:root[data-tema=claro] .app .passos-exercicio li` | border-bottom | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:553 | `:root[data-tema=claro] .app .miniatura-exercicio:focus-visible` | outline | `3px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:672 | `:root[data-tema=claro] .app .grupo-exercicios` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:833 | `:root[data-tema=claro] .app .exercicio-historico` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:961 | `:root[data-tema=claro] .app .sessao-exercicio>summary>span>small` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1403 | `:root[data-tema=claro] .app .treino-em-andamento .exercicio-recolhivel` | border-color | `#7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1416 | `:root[data-tema=claro] .app .treino-em-andamento .conteudo-exercicio` | border-color | `#7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1423 | `:root[data-tema=claro] .app .treino-em-andamento .conteudo-exercicio>.botao-descanso` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1451 | `:root[data-tema=claro] .app .treino-em-andamento .conteudo-exercicio>.ultimo-desempenho` | border-top | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1451 | `:root[data-tema=claro] .app .treino-em-andamento .conteudo-exercicio>.ultimo-desempenho` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1467 | `:root[data-tema=claro] .app .abas-catalogo` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1471 | `:root[data-tema=claro] .app .abas-catalogo>button` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1475 | `:root[data-tema=claro] .app .abas-catalogo>button[aria-pressed=true]` | color | `#28431e` | --controle-texto |  |
| src/estilos/paleta-clara.css:1478 | `:root[data-tema=claro] .app .musculos-catalogo>button` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1478 | `:root[data-tema=claro] .app .musculos-catalogo>button` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1483 | `:root[data-tema=claro] .app .musculos-catalogo>button[aria-pressed=true]` | border-color | `#7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1500 | `:root[data-tema=claro] .app .item-catalogo` | border-bottom | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1509 | `:root[data-tema=claro] .app .lista-catalogo .miniatura-exercicio` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1509 | `:root[data-tema=claro] .app .lista-catalogo .miniatura-exercicio` | background | `linear-gradient(145deg,var(--visual-acento-fundo),var(--visual-rebaixo))` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1520 | `:root[data-tema=claro] .app .selecionar-exercicio` | border-bottom-color | `#7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1523 | `:root[data-tema=claro] .app .selecionar-exercicio[aria-pressed=true]` | border-color | `#7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1527 | `:root[data-tema=claro] .app .marcador-catalogo` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1531 | `:root[data-tema=claro] .app .selecionar-exercicio[aria-pressed=true] .marcador-catalogo` | color | `#28431e` | --controle-texto |  |
| src/estilos/paleta-clara.css:1531 | `:root[data-tema=claro] .app .selecionar-exercicio[aria-pressed=true] .marcador-catalogo` | border-color | `#7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1538 | `:root[data-tema=claro] .app .confirmar-catalogo` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1545 | `:root[data-tema=claro] .app .ampliar-catalogo` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1840 | `:root[data-tema=claro] .app .abas-treino, :root[data-tema=claro] .app .abas-medidas, :root[data-tema=claro] .app .abas-catalogo, :root[data-tema=claro] .app .alternador-seletor` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1847 | `:root[data-tema=claro] .app .abas-treino > button, :root[data-tema=claro] .app .abas-medidas > button, :root[data-tema=claro] .app .abas-catalogo > button, :root[data-tema=claro] .app .alternador-seletor > button` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1854 | `:root[data-tema=claro] .app :is(.botao-principal, .botao-secundario, .abas-treino > button, .abas-medidas > button, .abas-catalogo > button, .alternador-seletor > button):focus-visible` | outline | `2px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1921 | `:root[data-tema=claro] .app .treino-em-andamento .conteudo-exercicio > .acoes > button:last-child` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1921 | `:root[data-tema=claro] .app .treino-em-andamento .conteudo-exercicio > .acoes > button:last-child` | border-color | `#a76a5b` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1921 | `:root[data-tema=claro] .app .treino-em-andamento .conteudo-exercicio > .acoes > button:last-child` | color | `#963e32` | não encontrado; avaliar papel próprio |  |

### medidas

| Arquivo:linha | Seletor | Propriedade | Valor literal | Token de valor equivalente | Condição |
| --- | --- | --- | --- | --- | --- |
| src/index.css:61 | `.topo-medidas p` | color | `#9fb5a6` | não encontrado; avaliar papel próprio |  |
| src/index.css:61 | `.nova-medida` | background | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:61 | `.nova-medida` | color | `#193119` | não encontrado; avaliar papel próprio |  |
| src/index.css:61 | `.vazio-medidas>svg` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:61 | `.data-medida` | border | `1px solid #3b533d` | não encontrado; avaliar papel próprio |  |
| src/index.css:61 | `.data-medida` | background | `#203025` | não encontrado; avaliar papel próprio |  |
| src/index.css:61 | `.data-medida` | color | `#aabeae` | não encontrado; avaliar papel próprio |  |
| src/index.css:61 | `.data-medida strong` | color | `#d3e8c7` | não encontrado; avaliar papel próprio |  |
| src/index.css:61 | `.campo-medida` | background | `#1f3025` | não encontrado; avaliar papel próprio |  |
| src/index.css:61 | `.campo-medida` | border | `1px solid #344b3a` | não encontrado; avaliar papel próprio |  |
| src/index.css:61 | `.campo-medida>span` | color | `#9db3a3` | não encontrado; avaliar papel próprio |  |
| src/index.css:61 | `.campo-medida strong` | color | `#d5ebc9` | não encontrado; avaliar papel próprio |  |
| src/index.css:61 | `.registro-medida` | border | `1px solid #344b39` | não encontrado; avaliar papel próprio |  |
| src/index.css:61 | `.registro-medida` | background | `#19271e` | não encontrado; avaliar papel próprio |  |
| src/index.css:61 | `.registro-medida>summary small` | color | `#9db4a4` | não encontrado; avaliar papel próprio |  |
| src/index.css:61 | `.registro-medida>summary svg` | color | `#94ad9b` | não encontrado; avaliar papel próprio |  |
| src/index.css:61 | `.registro-medida dl>div` | border-top | `1px solid #314737` | não encontrado; avaliar papel próprio |  |
| src/index.css:61 | `.registro-medida dt` | color | `#a4b9ac` | não encontrado; avaliar papel próprio |  |
| src/index.css:61 | `.registro-medida dd` | color | `#d4e4d7` | não encontrado; avaliar papel próprio |  |
| src/index.css:61 | `.acoes-medida>button` | border | `1px solid #3d533d` | não encontrado; avaliar papel próprio |  |
| src/index.css:61 | `.acoes-medida>button` | background | `#253a26` | não encontrado; avaliar papel próprio |  |
| src/index.css:61 | `.acoes-medida>button` | color | `#c6e2b7` | não encontrado; avaliar papel próprio |  |
| src/index.css:61 | `.acoes-medida>button+button` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:61 | `.acoes-medida>button+button` | color | `#d9aaa3` | não encontrado; avaliar papel próprio |  |
| src/index.css:61 | `.acoes-medida>button+button` | border-color | `#63483f` | não encontrado; avaliar papel próprio |  |
| src/index.css:61 | `.lembrete-medidas` | border | `1px solid #49633d` | não encontrado; avaliar papel próprio |  |
| src/index.css:61 | `.lembrete-medidas` | background | `#24361f` | não encontrado; avaliar papel próprio |  |
| src/index.css:61 | `.lembrete-medidas>svg` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:61 | `.lembrete-medidas p` | color | `#abc0a5` | não encontrado; avaliar papel próprio |  |
| src/index.css:61 | `.lembrete-medidas button` | background | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:61 | `.lembrete-medidas button` | color | `#213519` | não encontrado; avaliar papel próprio |  |
| src/index.css:62 | `.peso-resumo-medidas` | border | `1px solid #344b39` | não encontrado; avaliar papel próprio |  |
| src/index.css:62 | `.peso-resumo-medidas` | background | `#1c2d22` | não encontrado; avaliar papel próprio |  |
| src/index.css:62 | `.peso-resumo-medidas span` | color | `#a3bba9` | não encontrado; avaliar papel próprio |  |
| src/index.css:62 | `.peso-resumo-medidas strong small` | color | `#a8bfae` | não encontrado; avaliar papel próprio |  |
| src/index.css:62 | `.peso-resumo-medidas>p` | color | `#9db4a4` | não encontrado; avaliar papel próprio |  |
| src/index.css:62 | `.grade-resumo-medidas>div` | border | `1px solid #304737` | não encontrado; avaliar papel próprio |  |
| src/index.css:62 | `.grade-resumo-medidas>div` | background | `#19281f` | não encontrado; avaliar papel próprio |  |
| src/index.css:62 | `.grade-resumo-medidas>div>span` | color | `#9eb6a5` | não encontrado; avaliar papel próprio |  |
| src/index.css:62 | `.grade-resumo-medidas strong` | color | `#d9e9dc` | não encontrado; avaliar papel próprio |  |
| src/index.css:62 | `.grade-resumo-medidas strong small` | color | `#98b29f` | não encontrado; avaliar papel próprio |  |
| src/index.css:62 | `.grade-resumo-medidas p` | color | `#8da996` | não encontrado; avaliar papel próprio |  |
| src/index.css:62 | `.grafico-medidas-recolhivel` | border | `1px solid #354d3b` | não encontrado; avaliar papel próprio |  |
| src/index.css:62 | `.grafico-medidas-recolhivel` | background | `#18271e` | não encontrado; avaliar papel próprio |  |
| src/index.css:62 | `.grafico-medidas-recolhivel>summary` | color | `#caddc5` | não encontrado; avaliar papel próprio |  |
| src/index.css:62 | `.grafico-medidas-recolhivel>summary small` | color | `#94ad9c` | não encontrado; avaliar papel próprio |  |
| src/index.css:62 | `.grafico-medidas-recolhivel>summary>svg` | color | `#9bb78e` | não encontrado; avaliar papel próprio |  |
| src/index.css:63 | `.atividade-hoje .data-medida small` | color | `#a5bfae` | não encontrado; avaliar papel próprio |  |
| src/index.css:73 | `.atividade-hoje>.data-medida+.nota-resumo` | color | `#84998c` | não encontrado; avaliar papel próprio |  |
| src/index.css:116 | `.abas-medidas` | border | `1px solid #304536` | --visual-borda |  |
| src/index.css:116 | `.abas-medidas` | background | `#15231b` | não encontrado; avaliar papel próprio |  |
| src/index.css:116 | `.abas-medidas>button` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/index.css:116 | `.abas-medidas>button` | color | `#a7beb0` | não encontrado; avaliar papel próprio |  |
| src/index.css:116 | `.abas-medidas>button[aria-pressed=true]` | background | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:116 | `.abas-medidas>button[aria-pressed=true]` | color | `#1b301a` | não encontrado; avaliar papel próprio |  |
| src/index.css:117 | `.par-resumo-medida` | border | `1px solid #304737` | não encontrado; avaliar papel próprio |  |
| src/index.css:117 | `.par-resumo-medida` | background | `#19281f` | não encontrado; avaliar papel próprio |  |
| src/index.css:117 | `.par-resumo-medida h3` | color | `#c8dacb` | não encontrado; avaliar papel próprio |  |
| src/index.css:117 | `.par-resumo-medida>header>span` | color | `#94ae9d` | não encontrado; avaliar papel próprio |  |
| src/index.css:117 | `.par-resumo-medida>dl>div+div` | border-left | `1px solid #344a3a` | não encontrado; avaliar papel próprio |  |
| src/index.css:117 | `.par-resumo-medida dt` | color | `#9bb3a3` | não encontrado; avaliar papel próprio |  |
| src/index.css:117 | `.par-resumo-medida dd` | color | `#d9e9dc` | não encontrado; avaliar papel próprio |  |
| src/index.css:117 | `.par-resumo-medida dd>small` | color | `#98b29f` | não encontrado; avaliar papel próprio |  |
| src/index.css:117 | `.par-resumo-medida dl p` | color | `#91ab9a` | não encontrado; avaliar papel próprio |  |
| src/index.css:118 | `.evolucao-medidas` | border | `1px solid #344b39` | não encontrado; avaliar papel próprio |  |
| src/index.css:118 | `.evolucao-medidas` | background | `#17261d` | não encontrado; avaliar papel próprio |  |
| src/index.css:118 | `.evolucao-medidas>header>svg` | color | `#bcec86` | --controle-destaque, --visual-acento |  |
| src/index.css:118 | `.evolucao-medidas header p` | color | `#9cb5a3` | não encontrado; avaliar papel próprio |  |
| src/index.css:118 | `.tela-medidas .tabela-comparacao strong` | color | `#d9e1df` | não encontrado; avaliar papel próprio |  |
| src/index.css:119 | `.editor-medidas-grupos .campo-medida small` | color | `#91a99a` | não encontrado; avaliar papel próprio |  |
| src/index.css:119 | `.editor-medidas-grupos .medida-vazia strong` | color | `#9db6a6` | não encontrado; avaliar papel próprio |  |
| src/index.css:119 | `.par-editor-medidas>legend` | color | `#c2d6c7` | não encontrado; avaliar papel próprio |  |
| src/estilos/novo-visual.css:190 | `.app .tela-cardio .acoes-medida > button:last-child` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/novo-visual.css:190 | `.app .tela-cardio .acoes-medida > button:last-child` | border-color | `#60473e` | não encontrado; avaliar papel próprio |  |
| src/estilos/novo-visual.css:190 | `.app .tela-cardio .acoes-medida > button:last-child` | color | `#edb6a7` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1057 | `:root[data-tema=claro] .app .nova-medida` | color | `#28431e` | --controle-texto |  |
| src/estilos/paleta-clara.css:1063 | `:root[data-tema=claro] .app .data-medida` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1071 | `:root[data-tema=claro] .app .campo-medida` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1081 | `:root[data-tema=claro] .app .registro-medida` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1091 | `:root[data-tema=claro] .app .registro-medida dl>div` | border-top | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1100 | `:root[data-tema=claro] .app .acoes-medida>button` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1105 | `:root[data-tema=claro] .app .acoes-medida>button+button` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1105 | `:root[data-tema=claro] .app .acoes-medida>button+button` | color | `#963e32` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1105 | `:root[data-tema=claro] .app .acoes-medida>button+button` | border-color | `#a76a5b` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1137 | `:root[data-tema=claro] .app .lembrete-medidas` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1147 | `:root[data-tema=claro] .app .lembrete-medidas button` | color | `#28431e` | --controle-texto |  |
| src/estilos/paleta-clara.css:1150 | `:root[data-tema=claro] .app .peso-resumo-medidas` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1163 | `:root[data-tema=claro] .app .grade-resumo-medidas>div` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1179 | `:root[data-tema=claro] .app .grafico-medidas-recolhivel` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1590 | `:root[data-tema=claro] .app .abas-medidas` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1594 | `:root[data-tema=claro] .app .abas-medidas>button` | background | `transparent` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1598 | `:root[data-tema=claro] .app .abas-medidas>button[aria-pressed=true]` | color | `#28431e` | --controle-texto |  |
| src/estilos/paleta-clara.css:1601 | `:root[data-tema=claro] .app .par-resumo-medida` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1611 | `:root[data-tema=claro] .app .par-resumo-medida>dl>div+div` | border-left | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/paleta-clara.css:1626 | `:root[data-tema=claro] .app .evolucao-medidas` | border | `1px solid #7c8d76` | não encontrado; avaliar papel próprio |  |
| src/estilos/contraste-claro.css:15 | `:root[data-tema=claro] .app .item-ficha .acoes > button:last-child, :root[data-tema=claro] .app .tela-cardio .acoes-medida > button:last-child` | color | `#963e32` | não encontrado; avaliar papel próprio |  |
| src/estilos/contraste-claro.css:15 | `:root[data-tema=claro] .app .item-ficha .acoes > button:last-child, :root[data-tema=claro] .app .tela-cardio .acoes-medida > button:last-child` | border-color | `#a76a5b` | não encontrado; avaliar papel próprio |  |
| src/estilos/contraste-claro.css:29 | `:root[data-tema=claro] .app :is(.painel,.cartao,.peso-resumo-medidas,.par-resumo-medida)` | border-color | `#b6c6a5` | --visual-borda |  |
| src/estilos/contraste-claro.css:29 | `:root[data-tema=claro] .app :is(.painel,.cartao,.peso-resumo-medidas,.par-resumo-medida)` | box-shadow | `0 3px 12px #29401c08` | --superficie-sombra |  |
| src/estilos/contraste-claro.css:42 | `:root[data-tema=claro] .app .grade-resumo-medidas > div, :root[data-tema=claro] .app .par-resumo-medida` | box-shadow | `0 3px 12px #29401c08` | --superficie-sombra |  |

## Apêndice E — grafias equivalentes e quase-duplicatas

| Valor normalizado | Grafias literais |
| --- | --- |


| Cor A | Cor B | Máxima diferença de canal RGB |
| --- | --- | --- |
| #a9bcaeff | #aabeafff | 2 |
| #a9bcaeff | #a8bdaeff | 1 |
| #a9bcaeff | #aabeaeff | 2 |
| #a9bcaeff | #a9bdafff | 1 |
| #a9bcaeff | #a9beb0ff | 2 |
| #a9bcaeff | #a7bcadff | 2 |
| #a9bcaeff | #a7beb0ff | 2 |
| #a9bcaeff | #a8bdadff | 1 |
| #304235ff | #314333ff | 2 |
| #304235ff | #314437ff | 2 |
| #304235ff | #2f4034ff | 2 |
| #304235ff | #304335ff | 1 |
| #304235ff | #304236ff | 1 |
| #304235ff | #2e4033ff | 2 |
| #304235ff | #304435ff | 2 |
| #304235ff | #2f4434ff | 2 |
| #8fa698ff | #91a897ff | 2 |
| #8fa698ff | #8fa496ff | 2 |
| #8fa698ff | #91a699ff | 2 |
| #8fa698ff | #8fa596ff | 2 |
| #3b4d40ff | #3b4b41ff | 2 |
| #19271eff | #1b271cff | 2 |
| #19271eff | #19261dff | 1 |
| #19271eff | #1a291eff | 2 |
| #19271eff | #1b281fff | 2 |
| #19271eff | #19271fff | 1 |
| #19271eff | #18271dff | 1 |
| #19271eff | #1a291fff | 2 |
| #19271eff | #19281fff | 1 |
| #19271eff | #18271eff | 1 |
| #19271eff | #19251dff | 2 |
| #19271eff | #17251dff | 2 |
| #19271eff | #19281dff | 1 |
| #19271eff | #19291dff | 2 |
| #19271eff | #17261dff | 2 |
| #19271eff | #17281dff | 2 |
| #19271eff | #19271dff | 1 |
| #dce8dfff | #dbe9dfff | 1 |
| #273d25ff | #293e23ff | 2 |
| #273d25ff | #293c24ff | 2 |
| #273d25ff | #283d26ff | 1 |
| #273d25ff | #293e26ff | 2 |
| #273d25ff | #263b23ff | 2 |
| #273d25ff | #263c25ff | 1 |
| #273d25ff | #293e24ff | 2 |
| #a7bda9ff | #a5bba9ff | 2 |
| #a7bda9ff | #a5bda9ff | 2 |
| #21321bff | #20321cff | 1 |
| #edf4eeff | #ecf2edff | 2 |
| #97ad9cff | #98ad9eff | 2 |
| #97ad9cff | #99ad9eff | 2 |
| #97ad9cff | #95ad9cff | 2 |
| #344a38ff | #344b39ff | 1 |
| #344a38ff | #354b38ff | 1 |
| #344a38ff | #334b39ff | 1 |
| #344a38ff | #344b3aff | 2 |
| #344a38ff | #344a3aff | 2 |
| #344a38ff | #344c3aff | 2 |
| #b0c3b5ff | #afc1b3ff | 2 |
| #b0c3b5ff | #afc4b6ff | 1 |
| #9db2a2ff | #9fb3a4ff | 2 |
| #9db2a2ff | #9db3a3ff | 1 |
| #9db2a2ff | #9db4a4ff | 2 |
| #9db2a2ff | #9eb2a4ff | 2 |
| #9db2a2ff | #9db2a4ff | 2 |
| #9db2a2ff | #9bb2a3ff | 2 |
| #9db2a2ff | #9bb3a3ff | 2 |
| #9db2a2ff | #9bb2a2ff | 2 |
| #1c2b20ff | #1b2b20ff | 1 |
| #1c2b20ff | #1d2a20ff | 1 |
| #1c2b20ff | #1a291eff | 2 |
| #1c2b20ff | #1d2a21ff | 1 |
| #1c2b20ff | #1b2a1fff | 1 |
| #1c2b20ff | #1b2a20ff | 1 |
| #1c2b20ff | #1c2d22ff | 2 |
| #1c2b20ff | #1a291fff | 2 |
| #1c2b20ff | #1a2a20ff | 2 |
| #2d4132ff | #2e4031ff | 1 |
| #2d4132ff | #2f4034ff | 2 |
| #2d4132ff | #2d4133ff | 1 |
| #2d4132ff | #2e4033ff | 1 |
| #2d4132ff | #2d4032ff | 1 |
| #91a897ff | #91a699ff | 2 |
| #91a897ff | #93aa99ff | 2 |
| #91a897ff | #91a795ff | 2 |
| #91a897ff | #91a999ff | 2 |
| #20321cff | #20321eff | 2 |
| #25372aff | #233629ff | 2 |
| #25372aff | #25392cff | 2 |
| #25372aff | #233728ff | 2 |
| #3a5140ff | #3a5040ff | 1 |
| #3a5140ff | #3c5141ff | 2 |
| #3a5140ff | #3c5342ff | 2 |
| #3a5140ff | #3b5141ff | 1 |
| #3a5140ff | #3b533eff | 2 |
| #3a5140ff | #3b5040ff | 1 |
| #8da293ff | #8ba493ff | 2 |
| #8da293ff | #8fa394ff | 2 |
| #536643ff | #526644ff | 1 |
| #24301fff | #24321fff | 2 |
| #24301fff | #23311fff | 1 |
| #182b18ff | #172d16ff | 2 |
| #182b18ff | #192d18ff | 2 |
| #182b18ff | #1a2d18ff | 2 |
| #a9da73ff | #a9d875ff | 2 |
| #4a6340ff | #48623eff | 2 |
| #a4b8aaff | #a6b8acff | 2 |
| #a4b8aaff | #a5b8abff | 1 |
| #a4b8aaff | #a5b9aaff | 1 |
| #a4b8aaff | #a4b9acff | 2 |
| #b9cec0ff | #bbd0bfff | 2 |
| #3a5040ff | #3c5141ff | 2 |
| #3a5040ff | #3b5141ff | 1 |
| #3a5040ff | #3b5040ff | 1 |
| #1b2b20ff | #1d2a20ff | 2 |
| #1b2b20ff | #1a291eff | 2 |
| #1b2b20ff | #1d2a21ff | 2 |
| #1b2b20ff | #1b2a1fff | 1 |
| #1b2b20ff | #1b2a20ff | 1 |
| #1b2b20ff | #1c2d22ff | 2 |
| #1b2b20ff | #1a291fff | 2 |
| #1b2b20ff | #192b20ff | 2 |
| #1b2b20ff | #1a2a20ff | 1 |
| #2a4025ff | #293e23ff | 2 |
| #2a4025ff | #2b4026ff | 1 |
| #2a4025ff | #2a3e25ff | 2 |
| #2a4025ff | #293e26ff | 2 |
| #2a4025ff | #2a4027ff | 2 |
| #2a4025ff | #293e24ff | 2 |
| #e5f0e5ff | #e4eee6ff | 2 |
| #e5f0e5ff | #e6eee7ff | 2 |
| #a5bba9ff | #a5b9aaff | 2 |
| #a5bba9ff | #a3bba9ff | 2 |
| #a5bba9ff | #a5bda9ff | 2 |
| #c6d8c9ff | #c8dacbff | 2 |
| #98ad9eff | #99ad9eff | 1 |
| #98ad9eff | #98ae9fff | 1 |
| #c4d7c6ff | #c2d6c7ff | 2 |
| #293e23ff | #2a3d25ff | 2 |
| #293e23ff | #293c24ff | 2 |
| #293e23ff | #2a3e25ff | 2 |
| #293e23ff | #293e24ff | 1 |
| #233629ff | #223428ff | 2 |
| #233629ff | #233728ff | 1 |
| #233629ff | #223728ff | 1 |
| #3c5141ff | #3c5342ff | 2 |
| #3c5141ff | #3b5141ff | 1 |
| #3c5141ff | #3b5040ff | 1 |
| #c0d0c4ff | #becfc2ff | 2 |
| #9fb6a6ff | #9eb5a4ff | 2 |
| #9fb6a6ff | #9fb5a4ff | 2 |
| #9fb6a6ff | #9fb5a6ff | 1 |
| #9fb6a6ff | #9db4a4ff | 2 |
| #9fb6a6ff | #9db5a5ff | 2 |
| #9fb6a6ff | #9eb6a5ff | 1 |
| #9fb6a6ff | #9eb5a6ff | 1 |
| #9fb6a6ff | #9db6a6ff | 2 |
| #2b3930ff | #2c372fff | 2 |
| #2b3930ff | #29392fff | 2 |
| #2b3930ff | #293b2eff | 2 |
| #a6b8acff | #a7b9acff | 1 |
| #a6b8acff | #a5b8abff | 1 |
| #a6b8acff | #a5b9aaff | 2 |
| #a6b8acff | #a4b9acff | 2 |
| #21391eff | #233b1dff | 2 |
| #edf1edff | #ecf2edff | 1 |
| #101714ff | #0e1712ff | 2 |
| #1b2b17ff | #192d18ff | 2 |
| #1b2b17ff | #1a2d18ff | 2 |
| #95a399ff | #97a599ff | 2 |
| #95a399ff | #95a499ff | 1 |
| #95a399ff | #93a399ff | 2 |
| #1c2720ff | #1a291eff | 2 |
| #1c2720ff | #1b281fff | 1 |
| #1c2720ff | #1a291fff | 2 |
| #bcc8bdff | #bac9bfff | 2 |
| #bcc8bdff | #bacabdff | 2 |
| #9ba99fff | #9cab9fff | 2 |
| #31482bff | #30472aff | 1 |
| #97a599ff | #95a499ff | 2 |
| #2a352eff | #2c372fff | 2 |
| #19221cff | #17201bff | 2 |
| #19221cff | #18221bff | 1 |
| #19221cff | #18241cff | 2 |
| #19221cff | #17231bff | 2 |
| #95a499ff | #93a399ff | 2 |
| #131c17ff | #111b16ff | 2 |
| #24321fff | #23311fff | 1 |
| #1b271cff | #19261dff | 2 |
| #1b271cff | #1a291eff | 2 |
| #1b271cff | #19251dff | 2 |
| #1b271cff | #19281dff | 2 |
| #1b271cff | #19291dff | 2 |
| #1b271cff | #19271dff | 2 |
| #273922ff | #253923ff | 2 |
| #273922ff | #263b23ff | 2 |
| #172d16ff | #192d18ff | 2 |
| #151f18ff | #142019ff | 1 |
| #151f18ff | #142119ff | 2 |
| #151f18ff | #131f18ff | 2 |
| #192b1bff | #192a1dff | 2 |
| #192b1bff | #1a2a1dff | 2 |
| #192b1bff | #19291dff | 2 |
| #192b1bff | #1a2c1cff | 1 |
| #14221bff | #14221aff | 1 |
| #14221bff | #142019ff | 2 |
| #14221bff | #142119ff | 2 |
| #14221bff | #15221aff | 1 |
| #14221bff | #15231bff | 1 |
| #14221bff | #14231aff | 1 |
| #14221bff | #14241bff | 2 |
| #93a399ff | #91a397ff | 2 |
| #8fa296ff | #91a397ff | 2 |
| #8fa296ff | #8fa496ff | 2 |
| #8fa296ff | #8fa394ff | 2 |
| #293d30ff | #2b3d2fff | 2 |
| #293d30ff | #2b3c30ff | 2 |
| #293d30ff | #293c30ff | 1 |
| #293d30ff | #2b3e30ff | 2 |
| #293d30ff | #293b2eff | 2 |
| #293d30ff | #293e32ff | 2 |
| #bac9bfff | #bacabdff | 2 |
| #223428ff | #223327ff | 1 |
| #223428ff | #203326ff | 2 |
| #223428ff | #213326ff | 2 |
| #223428ff | #213426ff | 2 |
| #a9bfafff | #aabeafff | 1 |
| #a9bfafff | #a8bdaeff | 2 |
| #a9bfafff | #aabeaeff | 1 |
| #a9bfafff | #a8bfaeff | 1 |
| #a9bfafff | #a9bdafff | 2 |
| #a9bfafff | #a9beb0ff | 1 |
| #a9bfafff | #a9c0afff | 1 |
| #a9bfafff | #a7beb0ff | 2 |
| #a9bfafff | #a8bdadff | 2 |
| #a9bfafff | #a9c0aeff | 1 |
| #a9bfafff | #a8c0afff | 1 |
| #1c331cff | #1d331cff | 1 |
| #1d2a20ff | #1d2a21ff | 1 |
| #1d2a20ff | #1b281fff | 2 |
| #1d2a20ff | #1b2a1fff | 2 |
| #1d2a20ff | #1b2a20ff | 2 |
| #17201bff | #18221bff | 2 |
| #17201bff | #15221aff | 2 |
| #2e4031ff | #2d4133ff | 2 |
| #2e4031ff | #2e4033ff | 2 |
| #2e4031ff | #2d4032ff | 1 |
| #2a3d25ff | #293c24ff | 1 |
| #2a3d25ff | #2a3e25ff | 1 |
| #2a3d25ff | #283d26ff | 2 |
| #2a3d25ff | #293e26ff | 1 |
| #2a3d25ff | #293e24ff | 1 |
| #213026ff | #213024ff | 2 |
| #213026ff | #203025ff | 1 |
| #213026ff | #1f3025ff | 2 |
| #213026ff | #203225ff | 2 |
| #3d523aff | #3c513bff | 1 |
| #18221bff | #18241cff | 2 |
| #18221bff | #17231bff | 1 |
| #314333ff | #304335ff | 2 |
| #314333ff | #304435ff | 2 |
| #314333ff | #2f4434ff | 2 |
| #344537ff | #344637ff | 1 |
| #344537ff | #354635ff | 2 |
| #344537ff | #334735ff | 2 |
| #344537ff | #324637ff | 2 |
| #344537ff | #354438ff | 1 |
| #18241cff | #19261dff | 2 |
| #18241cff | #17231bff | 1 |
| #18241cff | #19251dff | 1 |
| #18241cff | #17261bff | 2 |
| #18241cff | #17251dff | 1 |
| #18241cff | #17261dff | 2 |
| #293c24ff | #2a3e25ff | 2 |
| #293c24ff | #283d26ff | 2 |
| #293c24ff | #293e26ff | 2 |
| #293c24ff | #293e24ff | 2 |
| #96aa9bff | #95a99bff | 1 |
| #96aa9bff | #94aa9aff | 2 |
| #96aa9bff | #94ac9cff | 2 |
| #a2b4a6ff | #a2b5a7ff | 1 |
| #a2b4a6ff | #a2b4a7ff | 1 |
| #a2b4a6ff | #a2b5a8ff | 2 |
| #91a397ff | #8fa496ff | 2 |
| #91a397ff | #8fa596ff | 2 |
| #acbdb0ff | #adbfafff | 2 |
| #acbdb0ff | #aebeaeff | 2 |
| #acbdb0ff | #aabeafff | 2 |
| #acbdb0ff | #aabeaeff | 2 |
| #e4eee6ff | #e6eee7ff | 2 |
| #344637ff | #354635ff | 2 |
| #344637ff | #334735ff | 2 |
| #344637ff | #324637ff | 2 |
| #344637ff | #354438ff | 2 |
| #19261dff | #1b281fff | 2 |
| #19261dff | #19271fff | 2 |
| #19261dff | #18271dff | 1 |
| #19261dff | #19281fff | 2 |
| #19261dff | #18271eff | 1 |
| #19261dff | #19251dff | 1 |
| #19261dff | #17261bff | 2 |
| #19261dff | #17251dff | 2 |
| #19261dff | #19281dff | 2 |
| #19261dff | #17261dff | 2 |
| #19261dff | #17281dff | 2 |
| #19261dff | #19271dff | 1 |
| #adbfafff | #aebeaeff | 1 |
| #99ad9eff | #98ae9fff | 1 |
| #ecaaa0ff | #eeaaa1ff | 2 |
| #314437ff | #314536ff | 1 |
| #314437ff | #304335ff | 2 |
| #314437ff | #304236ff | 2 |
| #314437ff | #304536ff | 1 |
| #314437ff | #324637ff | 2 |
| #314437ff | #304435ff | 2 |
| #314437ff | #304637ff | 2 |
| #17231bff | #15221aff | 2 |
| #17231bff | #19251dff | 2 |
| #17231bff | #15231bff | 2 |
| #17231bff | #17251dff | 2 |
| #223327ff | #203326ff | 2 |
| #223327ff | #213326ff | 1 |
| #223327ff | #213426ff | 1 |
| #223327ff | #203225ff | 2 |
| #384d3cff | #374c3dff | 1 |
| #95a99bff | #93aa99ff | 2 |
| #95a99bff | #94aa9aff | 1 |
| #9fb3a4ff | #9eb5a4ff | 2 |
| #9fb3a4ff | #9fb5a4ff | 2 |
| #9fb3a4ff | #9fb5a6ff | 2 |
| #9fb3a4ff | #9db3a3ff | 2 |
| #9fb3a4ff | #9db4a4ff | 2 |
| #9fb3a4ff | #9db5a5ff | 2 |
| #9fb3a4ff | #9eb2a4ff | 1 |
| #9fb3a4ff | #9db2a4ff | 2 |
| #9fb3a4ff | #9eb3a5ff | 1 |
| #9fb3a4ff | #9eb5a6ff | 2 |
| #a7b9acff | #a5b8abff | 2 |
| #a7b9acff | #a5b9aaff | 2 |
| #314536ff | #304335ff | 2 |
| #314536ff | #314737ff | 2 |
| #314536ff | #304536ff | 1 |
| #314536ff | #304737ff | 2 |
| #314536ff | #334735ff | 2 |
| #314536ff | #324637ff | 1 |
| #314536ff | #304435ff | 1 |
| #314536ff | #2f4434ff | 2 |
| #314536ff | #304637ff | 1 |
| #1a291eff | #1b281fff | 1 |
| #1a291eff | #1b2a1fff | 1 |
| #1a291eff | #1b2a20ff | 2 |
| #1a291eff | #19271fff | 2 |
| #1a291eff | #18271dff | 2 |
| #1a291eff | #1a291fff | 1 |
| #1a291eff | #19281fff | 1 |
| #1a291eff | #18271eff | 2 |
| #1a291eff | #192b20ff | 2 |
| #1a291eff | #192a1dff | 1 |
| #1a291eff | #1a2a20ff | 2 |
| #1a291eff | #19281dff | 1 |
| #1a291eff | #1a2a1dff | 1 |
| #1a291eff | #19291dff | 1 |
| #1a291eff | #19271dff | 2 |
| #a5b8abff | #a5b9aaff | 1 |
| #a5b8abff | #a4b9acff | 1 |
| #9eb5a4ff | #9fb5a4ff | 1 |
| #9eb5a4ff | #9fb5a6ff | 2 |
| #9eb5a4ff | #9db3a3ff | 2 |
| #9eb5a4ff | #9db4a4ff | 1 |
| #9eb5a4ff | #9db5a5ff | 1 |
| #9eb5a4ff | #9eb6a5ff | 1 |
| #9eb5a4ff | #9eb3a5ff | 2 |
| #9eb5a4ff | #9eb5a6ff | 2 |
| #9eb5a4ff | #9cb5a3ff | 2 |
| #9eb5a4ff | #9db6a6ff | 2 |
| #8fa496ff | #8fa596ff | 1 |
| #8fa496ff | #8fa394ff | 2 |
| #2f4034ff | #304236ff | 2 |
| #2f4034ff | #2d4133ff | 2 |
| #2f4034ff | #2e4033ff | 1 |
| #2f4034ff | #2d4032ff | 2 |
| #b6c6bbff | #b5c6baff | 1 |
| #b6c6bbff | #b7c7bdff | 2 |
| #304335ff | #304236ff | 1 |
| #304335ff | #304536ff | 2 |
| #304335ff | #304435ff | 1 |
| #304335ff | #2f4434ff | 1 |
| #1d2a21ff | #1b281fff | 2 |
| #1d2a21ff | #1b2a1fff | 2 |
| #1d2a21ff | #1b2a20ff | 2 |
| #405739ff | #40573bff | 2 |
| #aabeafff | #a8bdaeff | 2 |
| #aabeafff | #aabeaeff | 1 |
| #aabeafff | #a8bfaeff | 2 |
| #aabeafff | #a9bdafff | 1 |
| #aabeafff | #a9beb0ff | 1 |
| #aabeafff | #a9c0afff | 2 |
| #aabeafff | #a8bdadff | 2 |
| #aabeafff | #a9c0aeff | 2 |
| #aabeafff | #a8c0afff | 2 |
| #354635ff | #334735ff | 2 |
| #1b281fff | #1b2a1fff | 2 |
| #1b281fff | #1b2a20ff | 2 |
| #1b281fff | #19271fff | 2 |
| #1b281fff | #1a291fff | 1 |
| #1b281fff | #19281fff | 2 |
| #1b281fff | #192a1dff | 2 |
| #1b281fff | #1a2a20ff | 2 |
| #1b281fff | #19281dff | 2 |
| #1b281fff | #1a2a1dff | 2 |
| #1b281fff | #19291dff | 2 |
| #1b281fff | #19271dff | 2 |
| #93aa99ff | #94aa9aff | 1 |
| #93aa99ff | #91a999ff | 2 |
| #93aa99ff | #91ab9aff | 2 |
| #93aa99ff | #91a99aff | 2 |
| #93aa99ff | #92ab9aff | 1 |
| #1b2a1fff | #1b2a20ff | 1 |
| #1b2a1fff | #1a291fff | 1 |
| #1b2a1fff | #19281fff | 2 |
| #1b2a1fff | #192b20ff | 2 |
| #1b2a1fff | #192a1dff | 2 |
| #1b2a1fff | #1a2a20ff | 1 |
| #1b2a1fff | #19281dff | 2 |
| #1b2a1fff | #1a2a1dff | 2 |
| #1b2a1fff | #19291dff | 2 |
| #354d39ff | #354b3bff | 2 |
| #354d39ff | #344b39ff | 2 |
| #354d39ff | #354b38ff | 2 |
| #354d39ff | #334b39ff | 2 |
| #354d39ff | #344b3aff | 2 |
| #354d39ff | #354d3bff | 2 |
| #354d39ff | #364d38ff | 1 |
| #354d39ff | #344c3aff | 1 |
| #9ab29fff | #98b29fff | 2 |
| #9ab29fff | #98b39eff | 2 |
| #9ab29fff | #9bb49fff | 2 |
| #9ab29fff | #9ab09fff | 2 |
| #3c5637ff | #3d5637ff | 1 |
| #20301fff | #20321eff | 2 |
| #98ae9fff | #9ab09fff | 2 |
| #14221aff | #142019ff | 2 |
| #14221aff | #142119ff | 1 |
| #14221aff | #15221aff | 1 |
| #14221aff | #15231bff | 1 |
| #14221aff | #14231aff | 1 |
| #14221aff | #14241bff | 2 |
| #213024ff | #203025ff | 1 |
| #213024ff | #1f3025ff | 2 |
| #213024ff | #203225ff | 2 |
| #1b2a20ff | #1a291fff | 1 |
| #1b2a20ff | #19281fff | 2 |
| #1b2a20ff | #192b20ff | 2 |
| #1b2a20ff | #1a2a20ff | 1 |
| #2d4126ff | #2b4026ff | 2 |
| #2d4126ff | #2d4227ff | 1 |
| #b7c7bdff | #b6c9bbff | 2 |
| #b7c7bdff | #b7c9bdff | 2 |
| #354b3bff | #344b39ff | 2 |
| #354b3bff | #334b39ff | 2 |
| #354b3bff | #344b3aff | 1 |
| #354b3bff | #354d3bff | 2 |
| #354b3bff | #36493cff | 2 |
| #354b3bff | #354c3cff | 1 |
| #354b3bff | #344a3aff | 1 |
| #354b3bff | #374c3dff | 2 |
| #354b3bff | #344c3aff | 1 |
| #19271fff | #18271dff | 2 |
| #19271fff | #1a291fff | 2 |
| #19271fff | #19281fff | 1 |
| #19271fff | #18271eff | 1 |
| #19271fff | #19251dff | 2 |
| #19271fff | #17251dff | 2 |
| #19271fff | #19281dff | 2 |
| #19271fff | #19291dff | 2 |
| #19271fff | #17261dff | 2 |
| #19271fff | #17281dff | 2 |
| #19271fff | #19271dff | 2 |
| #3c5342ff | #3b5141ff | 2 |
| #3c5342ff | #3c5540ff | 2 |
| #3c5342ff | #3d5540ff | 2 |
| #3c5342ff | #3c5541ff | 2 |
| #cad9cdff | #c8dacbff | 2 |
| #304236ff | #304435ff | 2 |
| #304236ff | #2f4434ff | 2 |
| #142019ff | #142119ff | 1 |
| #142019ff | #15221aff | 2 |
| #142019ff | #131f18ff | 1 |
| #2b4026ff | #2a3e25ff | 2 |
| #2b4026ff | #293e26ff | 2 |
| #2b4026ff | #2a4027ff | 1 |
| #2b4026ff | #293e24ff | 2 |
| #2b4026ff | #2d4227ff | 2 |
| #8fa596ff | #91a795ff | 2 |
| #8fa596ff | #8fa394ff | 2 |
| #2b3d2fff | #2c3e2eff | 1 |
| #2b3d2fff | #2b3c30ff | 1 |
| #2b3d2fff | #293c30ff | 2 |
| #2b3d2fff | #2b3e30ff | 1 |
| #2b3d2fff | #293b2eff | 2 |
| #344b39ff | #354b38ff | 1 |
| #344b39ff | #334b39ff | 1 |
| #344b39ff | #344b3aff | 1 |
| #344b39ff | #354d3bff | 2 |
| #344b39ff | #364d38ff | 2 |
| #344b39ff | #344a3aff | 1 |
| #344b39ff | #344c3aff | 1 |
| #142119ff | #15221aff | 1 |
| #142119ff | #15231bff | 2 |
| #142119ff | #131f18ff | 2 |
| #142119ff | #14231aff | 2 |
| #a5b9aaff | #a4b9acff | 2 |
| #a5b9aaff | #a3bba9ff | 2 |
| #d2dfd4ff | #d3dfd6ff | 2 |
| #94aa9aff | #94ac9cff | 2 |
| #94aa9aff | #92ab9aff | 2 |
| #2d4133ff | #2e4033ff | 1 |
| #2d4133ff | #2d4032ff | 1 |
| #293c2bff | #293d2bff | 1 |
| #48623eff | #49633dff | 1 |
| #48623eff | #49623cff | 2 |
| #2a3e25ff | #283d26ff | 2 |
| #2a3e25ff | #293e26ff | 1 |
| #2a3e25ff | #2a4027ff | 2 |
| #2a3e25ff | #293e24ff | 1 |
| #20321eff | #20331fff | 1 |
| #3c513bff | #3b533dff | 2 |
| #3c513bff | #3d533dff | 2 |
| #3c513bff | #3a5039ff | 2 |
| #18271dff | #1a291fff | 2 |
| #18271dff | #19281fff | 2 |
| #18271dff | #18271eff | 1 |
| #18271dff | #19251dff | 2 |
| #18271dff | #17261bff | 2 |
| #18271dff | #17251dff | 2 |
| #18271dff | #19281dff | 1 |
| #18271dff | #19291dff | 2 |
| #18271dff | #17261dff | 1 |
| #18271dff | #16271cff | 2 |
| #18271dff | #17281dff | 1 |
| #18271dff | #19271dff | 1 |
| #a2b5a7ff | #a2b4a7ff | 1 |
| #a2b5a7ff | #a2b5a8ff | 1 |
| #94ad9aff | #94ad9bff | 1 |
| #94ad9aff | #94ad9cff | 2 |
| #94ad9aff | #94ae9bff | 1 |
| #94ad9aff | #94ac9cff | 2 |
| #94ad9aff | #95ad9cff | 2 |
| #94ad9aff | #92ab9aff | 2 |
| #203326ff | #213326ff | 1 |
| #203326ff | #213426ff | 1 |
| #203326ff | #203225ff | 1 |
| #19301bff | #193119ff | 2 |
| #19301bff | #1a2e19ff | 2 |
| #19301bff | #1b301aff | 2 |
| #354b38ff | #334b39ff | 2 |
| #354b38ff | #344b3aff | 2 |
| #354b38ff | #364d38ff | 2 |
| #354b38ff | #344a3aff | 2 |
| #354b38ff | #344c3aff | 2 |
| #9fb5a4ff | #9fb5a6ff | 2 |
| #9fb5a4ff | #9db3a3ff | 2 |
| #9fb5a4ff | #9db4a4ff | 2 |
| #9fb5a4ff | #9db5a5ff | 2 |
| #9fb5a4ff | #9eb6a5ff | 1 |
| #9fb5a4ff | #9eb3a5ff | 2 |
| #9fb5a4ff | #9eb5a6ff | 2 |
| #9fb5a4ff | #9db6a6ff | 2 |
| #2c3e2eff | #2b3c30ff | 2 |
| #2c3e2eff | #2b3e30ff | 2 |
| #a8bdaeff | #aabeaeff | 2 |
| #a8bdaeff | #a8bfaeff | 2 |
| #a8bdaeff | #a9bdafff | 1 |
| #a8bdaeff | #a9beb0ff | 2 |
| #a8bdaeff | #a7bcadff | 1 |
| #a8bdaeff | #a7beb0ff | 2 |
| #a8bdaeff | #a8bdadff | 1 |
| #a8bdaeff | #a6bfacff | 2 |
| #a8bdaeff | #a6bfadff | 2 |
| #1c2d22ff | #1d2f23ff | 2 |
| #334b39ff | #344b3aff | 1 |
| #334b39ff | #354d3bff | 2 |
| #334b39ff | #344a3aff | 1 |
| #334b39ff | #344c3aff | 1 |
| #9fb5a6ff | #9db4a4ff | 2 |
| #9fb5a6ff | #9db5a5ff | 2 |
| #9fb5a6ff | #9eb6a5ff | 1 |
| #9fb5a6ff | #9eb3a5ff | 2 |
| #9fb5a6ff | #9eb5a6ff | 1 |
| #9fb5a6ff | #9db6a6ff | 2 |
| #193119ff | #1b301aff | 2 |
| #3b533dff | #3d533dff | 2 |
| #3b533dff | #3c543eff | 1 |
| #3b533dff | #3c553bff | 2 |
| #3b533dff | #3b533eff | 1 |
| #203025ff | #1f3025ff | 1 |
| #203025ff | #203225ff | 2 |
| #aabeaeff | #a8bfaeff | 2 |
| #aabeaeff | #a9bdafff | 1 |
| #aabeaeff | #a9beb0ff | 2 |
| #aabeaeff | #a9c0afff | 2 |
| #aabeaeff | #a8bdadff | 2 |
| #aabeaeff | #a9c0aeff | 2 |
| #aabeaeff | #a8c0afff | 2 |
| #d3e8c7ff | #d5e7c8ff | 2 |
| #1f3025ff | #1d2f23ff | 2 |
| #1f3025ff | #203225ff | 2 |
| #344b3aff | #354d3bff | 2 |
| #344b3aff | #36493cff | 2 |
| #344b3aff | #354c3cff | 2 |
| #344b3aff | #364d38ff | 2 |
| #344b3aff | #344a3aff | 1 |
| #344b3aff | #344c3aff | 1 |
| #9db3a3ff | #9db4a4ff | 1 |
| #9db3a3ff | #9db5a5ff | 2 |
| #9db3a3ff | #9eb2a4ff | 1 |
| #9db3a3ff | #9db2a4ff | 1 |
| #9db3a3ff | #9eb3a5ff | 2 |
| #9db3a3ff | #9bb2a3ff | 2 |
| #9db3a3ff | #9bb3a3ff | 2 |
| #9db3a3ff | #9cb5a3ff | 2 |
| #9db3a3ff | #9bb2a2ff | 2 |
| #9db4a4ff | #9db5a5ff | 1 |
| #9db4a4ff | #9eb6a5ff | 2 |
| #9db4a4ff | #9eb2a4ff | 2 |
| #9db4a4ff | #9db2a4ff | 2 |
| #9db4a4ff | #9eb3a5ff | 1 |
| #9db4a4ff | #9eb5a6ff | 2 |
| #9db4a4ff | #9bb2a3ff | 2 |
| #9db4a4ff | #9bb3a3ff | 2 |
| #9db4a4ff | #9cb5a3ff | 1 |
| #9db4a4ff | #9db6a6ff | 2 |
| #9db4a4ff | #9bb2a2ff | 2 |
| #94ad9bff | #94ad9cff | 1 |
| #94ad9bff | #94ae9bff | 1 |
| #94ad9bff | #94ac9cff | 1 |
| #94ad9bff | #95ad9cff | 1 |
| #94ad9bff | #94ae9dff | 2 |
| #94ad9bff | #92ab9aff | 2 |
| #314737ff | #304536ff | 2 |
| #314737ff | #304737ff | 1 |
| #314737ff | #334735ff | 2 |
| #314737ff | #324637ff | 1 |
| #314737ff | #304637ff | 1 |
| #3d533dff | #3c543eff | 1 |
| #3d533dff | #3c553bff | 2 |
| #3d533dff | #3b533eff | 2 |
| #253a26ff | #263c25ff | 2 |
| #c6e2b7ff | #c8e4b6ff | 2 |
| #3c543eff | #3d563cff | 2 |
| #3c543eff | #3b533eff | 1 |
| #3c543eff | #3c5540ff | 2 |
| #3c543eff | #3d5540ff | 2 |
| #213326ff | #213426ff | 1 |
| #213326ff | #203225ff | 1 |
| #9db5a5ff | #9eb6a5ff | 1 |
| #9db5a5ff | #9eb3a5ff | 2 |
| #9db5a5ff | #9eb5a6ff | 1 |
| #9db5a5ff | #9bb3a3ff | 2 |
| #9db5a5ff | #9cb5a3ff | 2 |
| #9db5a5ff | #9db6a6ff | 1 |
| #1a291fff | #19281fff | 1 |
| #1a291fff | #18271eff | 2 |
| #1a291fff | #192b20ff | 2 |
| #1a291fff | #192a1dff | 2 |
| #1a291fff | #1a2a20ff | 1 |
| #1a291fff | #19281dff | 2 |
| #1a291fff | #1a2a1dff | 2 |
| #1a291fff | #19291dff | 2 |
| #1a291fff | #19271dff | 2 |
| #304536ff | #304737ff | 2 |
| #304536ff | #324637ff | 2 |
| #304536ff | #304435ff | 1 |
| #304536ff | #2f4434ff | 2 |
| #304536ff | #304637ff | 1 |
| #233728ff | #223728ff | 1 |
| #49633dff | #49623cff | 1 |
| #24361fff | #233821ff | 2 |
| #a3bba9ff | #a5bda9ff | 2 |
| #a8bfaeff | #a9bdafff | 2 |
| #a8bfaeff | #a9beb0ff | 2 |
| #a8bfaeff | #a9c0afff | 1 |
| #a8bfaeff | #a7beb0ff | 2 |
| #a8bfaeff | #a8bdadff | 2 |
| #a8bfaeff | #a6bfacff | 2 |
| #a8bfaeff | #a9c0aeff | 1 |
| #a8bfaeff | #a6bfadff | 2 |
| #a8bfaeff | #a8c0afff | 1 |
| #304737ff | #324637ff | 2 |
| #304737ff | #304637ff | 1 |
| #19281fff | #18271eff | 1 |
| #19281fff | #192a1dff | 2 |
| #19281fff | #1a2a20ff | 2 |
| #19281fff | #19281dff | 2 |
| #19281fff | #1a2a1dff | 2 |
| #19281fff | #19291dff | 2 |
| #19281fff | #17261dff | 2 |
| #19281fff | #17281dff | 2 |
| #19281fff | #19271dff | 2 |
| #9eb6a5ff | #9eb5a6ff | 1 |
| #9eb6a5ff | #9cb5a3ff | 2 |
| #9eb6a5ff | #9db6a6ff | 1 |
| #98b29fff | #98b39eff | 1 |
| #98b29fff | #9ab09fff | 2 |
| #354d3bff | #354c3cff | 1 |
| #354d3bff | #374c3dff | 2 |
| #354d3bff | #344c3aff | 1 |
| #18271eff | #19251dff | 2 |
| #18271eff | #17251dff | 2 |
| #18271eff | #19281dff | 1 |
| #18271eff | #19291dff | 2 |
| #18271eff | #17261dff | 1 |
| #18271eff | #16271cff | 2 |
| #18271eff | #17281dff | 1 |
| #18271eff | #19271dff | 1 |
| #94ad9cff | #94ae9bff | 1 |
| #94ad9cff | #94ac9cff | 1 |
| #94ad9cff | #95ad9cff | 1 |
| #94ad9cff | #94ae9dff | 1 |
| #94ad9cff | #92ab9aff | 2 |
| #3d563cff | #3c553bff | 1 |
| #a9bdafff | #a9beb0ff | 1 |
| #a9bdafff | #a7bcadff | 2 |
| #a9bdafff | #a7beb0ff | 2 |
| #a9bdafff | #a8bdadff | 2 |
| #213426ff | #203225ff | 2 |
| #a5bfaeff | #a7beb0ff | 2 |
| #a5bfaeff | #a6bfacff | 2 |
| #a5bfaeff | #a6bfadff | 1 |
| #192b20ff | #1a2a20ff | 1 |
| #c8dccaff | #c8dacbff | 2 |
| #94ae9bff | #94ac9cff | 2 |
| #94ae9bff | #95ad9cff | 1 |
| #94ae9bff | #94ae9dff | 2 |
| #b8cebcff | #b9cfbbff | 1 |
| #1d3022ff | #1d2f23ff | 1 |
| #98b39eff | #98b59fff | 2 |
| #0e1712ff | #0d1711ff | 1 |
| #36493cff | #344a3aff | 2 |
| #15221aff | #15231bff | 1 |
| #15221aff | #14231aff | 1 |
| #15221aff | #14241bff | 2 |
| #a2b4a7ff | #a2b5a8ff | 1 |
| #b6c9bbff | #b7c9bdff | 2 |
| #b6c9bbff | #b8cbbbff | 2 |
| #29392fff | #293b2eff | 2 |
| #19251dff | #17261bff | 2 |
| #19251dff | #17251dff | 2 |
| #19251dff | #17261dff | 2 |
| #19251dff | #19271dff | 2 |
| #2e4033ff | #2d4032ff | 1 |
| #253923ff | #233822ff | 2 |
| #253923ff | #233821ff | 2 |
| #253923ff | #263b23ff | 2 |
| #9eb2a4ff | #9db2a4ff | 1 |
| #9eb2a4ff | #9eb3a5ff | 1 |
| #b7c9bdff | #b8cbbbff | 2 |
| #a9beb0ff | #a9c0afff | 2 |
| #a9beb0ff | #a7beb0ff | 2 |
| #a9beb0ff | #a9c0aeff | 2 |
| #a9beb0ff | #a8c0afff | 2 |
| #2b3c30ff | #293c30ff | 2 |
| #2b3c30ff | #2b3e30ff | 2 |
| #2b3c30ff | #293b2eff | 2 |
| #2b3c30ff | #293e32ff | 2 |
| #334735ff | #324637ff | 2 |
| #15231bff | #14231aff | 1 |
| #15231bff | #17251dff | 2 |
| #15231bff | #14241bff | 1 |
| #afc1b3ff | #adc3b2ff | 2 |
| #324637ff | #304435ff | 2 |
| #324637ff | #304637ff | 2 |
| #adc3b2ff | #adc2b0ff | 2 |
| #304435ff | #2f4434ff | 1 |
| #304435ff | #304637ff | 2 |
| #192a1dff | #19281dff | 2 |
| #192a1dff | #1a2a1dff | 1 |
| #192a1dff | #19291dff | 1 |
| #192a1dff | #17281dff | 2 |
| #192a1dff | #1a2c1cff | 2 |
| #283d26ff | #293e26ff | 1 |
| #283d26ff | #263c25ff | 2 |
| #283d26ff | #293e24ff | 2 |
| #2d4032ff | #2b3e30ff | 2 |
| #b8cbbbff | #b8cdb9ff | 2 |
| #b8cbbbff | #bacabdff | 2 |
| #9db2a4ff | #9eb3a5ff | 1 |
| #9db2a4ff | #9bb2a3ff | 2 |
| #9db2a4ff | #9bb3a3ff | 2 |
| #9db2a4ff | #9bb2a2ff | 2 |
| #9eb3a5ff | #9eb5a6ff | 2 |
| #9eb3a5ff | #9cb5a3ff | 2 |
| #233822ff | #233821ff | 1 |
| #233822ff | #243622ff | 2 |
| #14231aff | #14241bff | 1 |
| #3b5141ff | #3b5040ff | 1 |
| #17261bff | #17251dff | 2 |
| #17261bff | #19281dff | 2 |
| #17261bff | #17261dff | 2 |
| #17261bff | #16271cff | 1 |
| #17261bff | #17281dff | 2 |
| #17261bff | #19271dff | 2 |
| #a1b69fff | #9fb69fff | 2 |
| #17251dff | #17261dff | 1 |
| #17251dff | #16271cff | 2 |
| #17251dff | #19271dff | 2 |
| #9eb5a6ff | #9db6a6ff | 1 |
| #192d18ff | #1a2e19ff | 1 |
| #192d18ff | #1a2d18ff | 1 |
| #354c3cff | #344a3aff | 2 |
| #354c3cff | #374c3dff | 2 |
| #354c3cff | #344c3aff | 2 |
| #293e26ff | #2a4027ff | 2 |
| #293e26ff | #293e24ff | 2 |
| #c7ef9cff | #c8ed9eff | 2 |
| #91a999ff | #91ab9aff | 2 |
| #91a999ff | #91a99aff | 1 |
| #91a999ff | #92ab9aff | 2 |
| #293c30ff | #2b3e30ff | 2 |
| #293c30ff | #293b2eff | 2 |
| #293c30ff | #293e32ff | 2 |
| #e6eee7ff | #e8f0e7ff | 2 |
| #94ac9cff | #95ad9cff | 1 |
| #94ac9cff | #94ae9dff | 2 |
| #94ac9cff | #92ab9aff | 2 |
| #3a5038ff | #3a5039ff | 1 |
| #95ad9cff | #94ae9dff | 1 |
| #19281dff | #1a2a1dff | 2 |
| #19281dff | #19291dff | 1 |
| #19281dff | #17261dff | 2 |
| #19281dff | #17281dff | 2 |
| #19281dff | #19271dff | 1 |
| #233821ff | #243622ff | 2 |
| #1a2e19ff | #1a2d18ff | 1 |
| #1a2e19ff | #1b301aff | 2 |
| #9bb2a3ff | #9bb3a3ff | 1 |
| #9bb2a3ff | #9bb2a2ff | 1 |
| #3b533eff | #3c5540ff | 2 |
| #3b533eff | #3d5540ff | 2 |
| #a9c0afff | #a7beb0ff | 2 |
| #a9c0afff | #a9c0aeff | 1 |
| #a9c0afff | #a8c0afff | 1 |
| #364d38ff | #344c3aff | 2 |
| #1a2a1dff | #19291dff | 1 |
| #1a2a1dff | #1c2c1cff | 2 |
| #1a2a1dff | #1a2c1cff | 2 |
| #a7bcadff | #a8bdadff | 1 |
| #263b23ff | #263c25ff | 2 |
| #19291dff | #17281dff | 2 |
| #19291dff | #19271dff | 2 |
| #b8cdb9ff | #b9cfbbff | 2 |
| #a7beb0ff | #a9c0aeff | 2 |
| #a7beb0ff | #a8c0afff | 2 |
| #344a3aff | #344c3aff | 2 |
| #9bb3a3ff | #9cb5a3ff | 2 |
| #9bb3a3ff | #9bb2a2ff | 1 |
| #91ab9aff | #91a99aff | 2 |
| #91ab9aff | #92ab9aff | 1 |
| #17261dff | #16271cff | 1 |
| #17261dff | #17281dff | 2 |
| #17261dff | #19271dff | 2 |
| #91a99aff | #92ab9aff | 2 |
| #2b3e30ff | #293e32ff | 2 |
| #14271bff | #16271cff | 2 |
| #16271cff | #17281dff | 1 |
| #a8bdadff | #a6bfacff | 2 |
| #a8bdadff | #a6bfadff | 2 |
| #3c5540ff | #3d5540ff | 1 |
| #3c5540ff | #3c5541ff | 1 |
| #b4cbb8ff | #b4c9b7ff | 2 |
| #a6bfacff | #a6bfadff | 1 |
| #a9c0aeff | #a8c0afff | 1 |
| #3d5540ff | #3c5541ff | 1 |
| #101c14ff | #111b16ff | 2 |
| #a6bfadff | #a8c0afff | 2 |
| #17281dff | #19271dff | 2 |
| #e1f6cbff | #e1f5ccff | 1 |
| #1c2c1cff | #1a2c1cff | 2 |
| #e0e6dcff | #e0e5daff | 2 |
| #973e31ff | #963e32ff | 1 |
| #fff2e9ff | #fff0eaff | 2 |

## Apêndice F — todos os font-size, agrupados por valor

### `12px` — 109 ocorrências

| Arquivo:linha | Seletor | Condição |
| --- | --- | --- |
| src/index.css:2 | `.introducao-comparacao-sync>p` |  |
| src/index.css:2 | `.linha-detalhes-sync>strong` |  |
| src/index.css:4 | `.aviso-data-atividade>p` |  |
| src/index.css:4 | `.aviso-data-atividade>.incluir-fotos` |  |
| src/index.css:7 | `.backup-config .introducao-backup` |  |
| src/index.css:7 | `.acoes-arquivo-backup>a,.acoes-arquivo-backup>button` |  |
| src/index.css:7 | `.lembrete-backup-opcao>strong` |  |
| src/index.css:9 | `.conta .estado-sync>.mensagem-sync` |  |
| src/index.css:10 | `.comparacao-sync dl>div` |  |
| src/index.css:12 | `small` |  |
| src/index.css:12 | `.destaque p` |  |
| src/index.css:12 | `.botao-principal` |  |
| src/index.css:12 | `.nota h3,.instalacao h3` |  |
| src/index.css:12 | `.botao-secundario` |  |
| src/index.css:12 | `.painel p` |  |
| src/index.css:12 | `.aviso-pwa button` |  |
| src/index.css:14 | `.acoes button,.seletor-exercicios button` |  |
| src/index.css:14 | `.desfazer` |  |
| src/index.css:15 | `.descanso>span` |  |
| src/index.css:19 | `.subtitulo-seletor` |  |
| src/index.css:19 | `.aplicar-proximas` |  |
| src/index.css:19 | `.botao-descanso` |  |
| src/index.css:19 | `.barra-fichas` |  |
| src/index.css:19 | `.barra-fichas button` |  |
| src/index.css:21 | `.grupo-exercicios>summary small` |  |
| src/index.css:30 | `.filtro-musculos button` |  |
| src/index.css:30 | `.biblioteca-cartao .acoes button` |  |
| src/index.css:31 | `.grupo-personalizado` |  |
| src/index.css:33 | `.comparacao-resumo` |  |
| src/index.css:35 | `.sugestao-carga` |  |
| src/index.css:35 | `.tabela-grafico` |  |
| src/index.css:36 | `.aviso-remocao>span` |  |
| src/index.css:36 | `.aviso-remocao>button` |  |
| src/index.css:39 | `.aviso-offline p` |  |
| src/index.css:39 | `.aviso-offline button` |  |
| src/index.css:47 | `.ultimo-desempenho` |  |
| src/index.css:47 | `.linha-historico-serie>span:first-child` |  |
| src/index.css:49 | `.sessao-exercicio>summary>span>small` |  |
| src/index.css:53 | `.andamento-treino>.manter-tela` |  |
| src/index.css:55 | `.aviso-recorde p` |  |
| src/index.css:58 | `.guia-esforco` |  |
| src/index.css:59 | `.titulo-andamento>button` |  |
| src/index.css:61 | `.topo-medidas p` |  |
| src/index.css:61 | `.campo-medida>span` |  |
| src/index.css:61 | `.registro-medida>summary small` |  |
| src/index.css:61 | `.registro-medida dl>div` |  |
| src/index.css:61 | `.acoes-medida>button` |  |
| src/index.css:61 | `.escolher-comparacao span` |  |
| src/index.css:61 | `.lembrete-medidas p` |  |
| src/index.css:61 | `.lembrete-medidas button` |  |
| src/index.css:62 | `.peso-resumo-medidas span` |  |
| src/index.css:62 | `.grade-resumo-medidas>div>span` |  |
| src/index.css:62 | `.grade-resumo-medidas strong small` |  |
| src/index.css:63 | `.acoes-cardio button` |  |
| src/index.css:63 | `.detalhe-cardio>p` |  |
| src/index.css:63 | `.config-atividade .data-medida>strong` |  |
| src/index.css:63 | `.linha-feriado>button` |  |
| src/index.css:71 | `.alternativa-entrada>span` |  |
| src/index.css:71 | `.alternativa-entrada p` |  |
| src/index.css:73 | `.atividade-hoje .link-atividade` |  |
| src/index.css:75 | `.sair-conta` |  |
| src/index.css:81 | `.treino-em-andamento .progresso-sessao` |  |
| src/index.css:82 | `.progresso-sessao>strong>small` |  |
| src/index.css:88 | `.treino-em-andamento .ajuda-no-treino` |  |
| src/index.css:94 | `.treino-em-andamento>.cancelar-sessao` |  |
| src/index.css:100 | `.musculos-catalogo>button` |  |
| src/index.css:103 | `.marcador-catalogo` |  |
| src/index.css:104 | `.confirmar-catalogo>.botao-principal` |  |
| src/index.css:105 | `.ampliar-catalogo>button` |  |
| src/index.css:107 | `.mais-catalogo` |  |
| src/index.css:112 | `.retomar-progresso>p` |  |
| src/index.css:116 | `.abas-medidas>button` |  |
| src/index.css:117 | `.par-resumo-medida dd>small` |  |
| src/index.css:121 | `.tela-evolucao .historico-cartao>p` |  |
| src/index.css:125 | `.modelos-card strong` |  |
| src/index.css:126 | `.opcoes-adesivo>span` |  |
| src/index.css:126 | `.opcoes-adesivo>button` |  |
| src/index.css:127 | `.area-preview-card>p` |  |
| src/index.css:127 | `.criador-card>.remover-foto-card` |  |
| src/index.css:127 | `.dica-story` |  |
| src/index.css:127 | `.aviso-card` |  |
| src/index.css:127 | `.acoes-criador-card>button,.acoes-criador-card>a` |  |
| src/index.css:127 | `.texto-compartilhar` |  |
| src/index.css:142 | `.resumo-semanal-cardio .metricas-resumo strong>small` |  |
| src/index.css:143 | `.grupo-campos-cardio>legend` |  |
| src/index.css:144 | `.digitar-duracao>label` |  |
| src/estilos/controles.css:9 | `.privacidade-alerta > p` |  |
| src/estilos/controles.css:10 | `.confirmacao-privacidade .opcao-copia-exercicio` |  |
| src/estilos/controles.css:20 | `.aviso-backup > p` |  |
| src/estilos/controles.css:99 | `.app .abas-treino > button, .app .abas-medidas > button, .app .abas-catalogo > button, .app .alternador-seletor > button` |  |
| src/estilos/controles.css:178 | `.criador-card .modelos-card strong` |  |
| src/estilos/controles.css:186 | `.campos-adesivo legend` |  |
| src/estilos/controles.css:187 | `.campos-adesivo label` |  |
| src/estilos/controles.css:222 | `.privacidade-contagem` |  |
| src/estilos/controles.css:230 | `.backup-config .backup-protecao p` |  |
| src/estilos/controles.css:233 | `.backup-outros-formatos > summary` |  |
| src/estilos/controles.css:262 | `.app .treino-em-andamento .conteudo-exercicio > .acoes > button` |  |
| src/estilos/controles.css:272 | `:root[data-tema] .app :is(.abas-treino,.abas-medidas,.abas-catalogo,.alternador-seletor) > button` |  |
| src/estilos/controles.css:276 | `:root[data-tema] .app .treino-em-andamento .andamento-treino .manter-tela:not(:disabled)` |  |
| src/estilos/novo-visual.css:57 | `.app .nota-resumo` |  |
| src/estilos/novo-visual.css:84 | `.app .paginacao-fichas` |  |
| src/estilos/novo-visual.css:90 | `.app .formulario > label` |  |
| src/estilos/novo-visual.css:127 | `.app .finalizar-acoes > button` |  |
| src/estilos/novo-visual.css:180 | `.app .item-ficha .acoes > button` |  |
| src/estilos/novo-visual.css:186 | `.app .tela-cardio .detalhe-cardio > p` |  |
| src/estilos/novo-visual.css:192 | `.app .aplicar-proximas` |  |
| src/estilos/novo-visual.css:222 | `.app .progresso-sessao > strong > small` |  |
| src/estilos/superficies.css:26 | `:root[data-tema] .app :is(.par-resumo-medida dd small,.grade-resumo-medidas strong small)` |  |
| src/estilos/superficies.css:144 | `:root[data-tema=claro] .app :is(.marca small,.selo-previa,.linha-data,.estado-rede,.cartao > span,.cartao small,.abrir-ficha small,.resumo-exercicio small,.retomar-identidade span,.retomar-identidade small,.texto-config small,.aviso-modo-visitante,.grade-resumo-medidas p,.grade-resumo-medidas span,.par-resumo-medida dt,.par-resumo-medida dl p,.par-resumo-medida > header > span)` |  |

### `11px` — 87 ocorrências

| Arquivo:linha | Seletor | Condição |
| --- | --- | --- |
| src/index.css:2 | `.introducao-comparacao-sync>button` |  |
| src/index.css:2 | `.registro-em-revisao>header>span` |  |
| src/index.css:2 | `.origem-registro-sync` |  |
| src/index.css:2 | `.detalhes-comparacao-sync` |  |
| src/index.css:3 | `.aviso-conflito-popup>.andamento-aviso-conflito` |  |
| src/index.css:7 | `.cabecalho-arquivo-backup>div>span` |  |
| src/index.css:7 | `.backup-config .nota-salvamento-backup>p` |  |
| src/index.css:7 | `.backup-config .acoes-backup-secundarias small` |  |
| src/index.css:7 | `.lembrete-backup-opcao>span` |  |
| src/index.css:9 | `.estado-sync>.detalhes-sync` |  |
| src/index.css:9 | `.detalhes-sync>time` |  |
| src/index.css:9 | `.detalhes-sync>.pendencias-sync` |  |
| src/index.css:9 | `.texto-sync-automatica>span` |  |
| src/index.css:12 | `.linha-data` |  |
| src/index.css:12 | `.titulo-secao>span` |  |
| src/index.css:12 | `.cartao>span` |  |
| src/index.css:12 | `.nota p` |  |
| src/index.css:12 | `.instalacao p` |  |
| src/index.css:12 | `.selo` |  |
| src/index.css:12 | `.painel dl>div` |  |
| src/index.css:16 | `.resumo-exercicio small` |  |
| src/index.css:16 | `.concluir-compacto` |  |
| src/index.css:16 | `.opcoes-serie>summary` |  |
| src/index.css:19 | `.lista-tipos small` |  |
| src/index.css:19 | `.botao-descanso>span` |  |
| src/index.css:19 | `.treino-livre small` |  |
| src/index.css:28 | `.acao-treino summary small` |  |
| src/index.css:28 | `.observacao-treino .opcional` |  |
| src/index.css:30 | `.biblioteca-cabecalho p` |  |
| src/index.css:31 | `.explicacao-editor` |  |
| src/index.css:33 | `.metricas-resumo span` |  |
| src/index.css:33 | `.nota-resumo` |  |
| src/index.css:33 | `.calorias-resumo>small` |  |
| src/index.css:35 | `.exercicio-historico small` |  |
| src/index.css:35 | `.ultimo-concluido>span` |  |
| src/index.css:37 | `.busca-historico>small` |  |
| src/index.css:54 | `.sessao-exercicio>summary>small` |  |
| src/index.css:61 | `.tabela-comparacao>div` |  |
| src/index.css:62 | `.peso-resumo-medidas>p` |  |
| src/index.css:62 | `.grafico-medidas-recolhivel>summary small` |  |
| src/index.css:63 | `.abas-treino.tres-abas button` |  |
| src/index.css:63 | `.link-atividade` |  |
| src/index.css:63 | `.atividade-hoje .data-medida small` |  |
| src/index.css:63 | `.linha-feriado>button+button` |  |
| src/index.css:65 | `.cabecalho-cardio-planejado p` |  |
| src/index.css:68 | `.arquivo-backup>small` |  |
| src/index.css:73 | `.cartoes-movimento>.cartao>span:not(.espaco-progresso)` |  |
| src/index.css:73 | `.cartoes-movimento>.cartao>.valor-movimento>small` |  |
| src/index.css:74 | `.texto-config>small` |  |
| src/index.css:75 | `.conta .conta-rodape>p` |  |
| src/index.css:75 | `.ajuda-conta` |  |
| src/index.css:75 | `.conta .ajuda-conta>p` |  |
| src/index.css:76 | `.saida-config>p:not(.erro)` |  |
| src/index.css:84 | `.treino-em-andamento .andamento-treino .manter-tela` |  |
| src/index.css:92 | `.treino-em-andamento .conteudo-exercicio>.ultimo-desempenho` |  |
| src/index.css:101 | `.contagem-catalogo` |  |
| src/index.css:102 | `.nome-catalogo>small` |  |
| src/index.css:104 | `.confirmar-catalogo>span` |  |
| src/index.css:105 | `.ampliar-catalogo p` |  |
| src/index.css:111 | `.retomar-identidade` |  |
| src/index.css:111 | `.retomar-identidade>small` |  |
| src/index.css:112 | `.retomar-progresso>p>span` |  |
| src/index.css:117 | `.par-resumo-medida dt` |  |
| src/index.css:118 | `.evolucao-medidas header p` |  |
| src/index.css:119 | `.editor-medidas-grupos .campo-medida small` |  |
| src/index.css:121 | `.historico-cartao>small` |  |
| src/index.css:122 | `.evolucao-exercicio .metricas-resumo span` |  |
| src/index.css:123 | `.ultimo-treino-atalho>.acao-ultimo-treino` |  |
| src/index.css:142 | `.resumo-semanal-cardio .metricas-resumo span` |  |
| src/index.css:143 | `.formulario-cardio>.nota-resumo` |  |
| src/estilos/controles.css:221 | `.privacidade-grupo summary small` |  |
| src/estilos/controles.css:293 | `:root[data-tema] .app .seletor-valores .aplicar-proximas small` |  |
| src/estilos/controles.css:295 | `:root[data-tema] .app .treino-em-andamento .ferramentas-exercicio > .botao-descanso` |  |
| src/estilos/novo-visual.css:48 | `.app .aviso-modo-visitante` |  |
| src/estilos/novo-visual.css:67 | `.app .cartao > span` |  |
| src/estilos/novo-visual.css:69 | `.app .cartao small` |  |
| src/estilos/novo-visual.css:79 | `.app .abrir-ficha small` |  |
| src/estilos/novo-visual.css:88 | `.app .nome-catalogo small` |  |
| src/estilos/novo-visual.css:93 | `.app .campo-medida > span` |  |
| src/estilos/novo-visual.css:106 | `.app .conteudo-modal .formulario > small` |  |
| src/estilos/novo-visual.css:115 | `.app .resumo-exercicio small` |  |
| src/estilos/novo-visual.css:118 | `.app .exercicio-finalizado .resumo-exercicio::after` |  |
| src/estilos/novo-visual.css:122 | `.app .concluir-compacto` |  |
| src/estilos/novo-visual.css:146 | `.app .texto-config small` |  |
| src/estilos/novo-visual.css:225 | `.app .treino-em-andamento .ultimo-desempenho` |  |
| src/estilos/superficies.css:24 | `:root[data-tema] .app :is(.grade-resumo-medidas p,.grade-resumo-medidas span,.par-resumo-medida dt,.par-resumo-medida dl p,.par-resumo-medida > header > span)` |  |
| src/estilos/superficies.css:76 | `:root[data-tema] .app .privacidade-contagem` |  |

### `19px` — 3 ocorrências

| Arquivo:linha | Seletor | Condição |
| --- | --- | --- |
| src/index.css:2 | `.registro-em-revisao>header>strong` |  |
| src/index.css:14 | `.painel-modal h2` |  |
| src/index.css:91 | `.treino-em-andamento .valor-serie` |  |

### `clamp(19px,5.8vw,25px)` — 1 ocorrências

| Arquivo:linha | Seletor | Condição |
| --- | --- | --- |
| src/index.css:2 | `.valor-comparado-sync>strong` |  |

### `10px` — 31 ocorrências

| Arquivo:linha | Seletor | Condição |
| --- | --- | --- |
| src/index.css:2 | `.valor-comparado-sync>span` |  |
| src/index.css:2 | `.data-versao-sync>time` |  |
| src/index.css:2 | `.cabecalho-detalhes-sync` |  |
| src/index.css:2 | `.linha-detalhes-sync>span` |  |
| src/index.css:2 | `.revisao-comparacao>.nota-escolha-sync` |  |
| src/index.css:7 | `.backup-config .backup-pronto>.nome-arquivo-backup` |  |
| src/index.css:7 | `.nota-salvamento-backup` |  |
| src/index.css:12 | `.cartao>small` |  |
| src/index.css:12 | `.navegacao button` |  |
| src/index.css:12 | `.instalacao small` |  |
| src/index.css:12 | `.painel small` |  |
| src/index.css:16 | `.cabecalho-series` |  |
| src/index.css:16 | `.carga-por-lado` |  |
| src/index.css:18 | `.abas-detalhe button` |  |
| src/index.css:19 | `.coluna-roda>span` |  |
| src/index.css:19 | `.topo-ficha .abrir-ficha small` |  |
| src/index.css:54 | `.metricas-resumo .explicacao-volume` |  |
| src/index.css:61 | `.tabela-comparacao small` |  |
| src/index.css:62 | `.grade-resumo-medidas p` |  |
| src/index.css:73 | `.cartoes-movimento>.cartao>small` |  |
| src/index.css:73 | `.atividade-hoje>.data-medida+.nota-resumo` |  |
| src/index.css:117 | `.par-resumo-medida>header>span` |  |
| src/index.css:117 | `.par-resumo-medida dl p` |  |
| src/index.css:121 | `.aviso-desfazer>span>small` |  |
| src/index.css:123 | `.texto-ultimo-treino>small` |  |
| src/index.css:125 | `.modelos-card small` |  |
| src/estilos/controles.css:141 | `.centesimos-medida .coluna-roda > span` |  |
| src/estilos/controles.css:179 | `.criador-card .modelos-card small` |  |
| src/estilos/novo-visual.css:47 | `.app .linha-data` |  |
| src/estilos/novo-visual.css:51 | `.app .navegacao button` |  |
| src/estilos/novo-visual.css:139 | `.app .config-bloco > h2` |  |

### `9px` — 4 ocorrências

| Arquivo:linha | Seletor | Condição |
| --- | --- | --- |
| src/index.css:2 | `.data-versao-sync` |  |
| src/index.css:12 | `.etiqueta` |  |
| src/estilos/novo-visual.css:43 | `.selo-previa` |  |
| src/estilos/novo-visual.css:62 | `.app .destaque .etiqueta` |  |

### `13px` — 81 ocorrências

| Arquivo:linha | Seletor | Condição |
| --- | --- | --- |
| src/index.css:2 | `.registro-em-revisao>.confirmar-registro-sync` |  |
| src/index.css:3 | `.aviso-conflito-popup>p` |  |
| src/index.css:3 | `.aviso-conflito-popup>.botao-principal` |  |
| src/index.css:7 | `.backup-config .preparar-backup` |  |
| src/index.css:7 | `.acoes-backup-secundarias strong` |  |
| src/index.css:8 | `.conclusao-revisao>p` |  |
| src/index.css:9 | `.estado-sync>.acao-sincronizar` |  |
| src/index.css:9 | `.texto-sync-automatica>strong` |  |
| src/index.css:10 | `.comparacao-sync h4` |  |
| src/index.css:12 | `.vazio p` |  |
| src/index.css:12 | `.aviso-pwa` |  |
| src/index.css:12 | `.erro` |  |
| src/index.css:14 | `.abas-treino button` |  |
| src/index.css:14 | `.formulario label` |  |
| src/index.css:14 | `.anexar` |  |
| src/index.css:14 | `.ajuda-texto p` |  |
| src/index.css:15 | `.nota-fixa` |  |
| src/index.css:15 | `.serie.concluida` |  |
| src/index.css:15 | `.serie details summary,details.painel>summary` |  |
| src/index.css:19 | `.retomar-treino button` |  |
| src/index.css:19 | `.iniciar-ficha` |  |
| src/index.css:25 | `.salvar-cabecalho` |  |
| src/index.css:28 | `.finalizar-acoes>button` |  |
| src/index.css:29 | `.descanso-popup>p` |  |
| src/index.css:31 | `.rotulo-editor` |  |
| src/index.css:31 | `.escolhas-editor button` |  |
| src/index.css:33 | `.metricas-resumo strong small` |  |
| src/index.css:33 | `.calorias-resumo>span` |  |
| src/index.css:35 | `.historico-series` |  |
| src/index.css:35 | `.progressao` |  |
| src/index.css:35 | `.aviso-recorde p` |  |
| src/index.css:40 | `.remover-foto-card` |  |
| src/index.css:41 | `.finalizar-acoes .continuar-depois` |  |
| src/index.css:45 | `.abas-treino button` |  |
| src/index.css:52 | `.ultimo-concluido>.botao-secundario` |  |
| src/index.css:53 | `.acao-treino .salvar-planejamento` |  |
| src/index.css:55 | `.aviso-recorde strong` |  |
| src/index.css:61 | `.nova-medida` |  |
| src/index.css:61 | `.data-medida` |  |
| src/index.css:61 | `.data-medida strong` |  |
| src/index.css:61 | `.escolher-comparacao strong` |  |
| src/index.css:63 | `.opcionais-cardio>summary` |  |
| src/index.css:63 | `.opcionais-cardio>label` |  |
| src/index.css:63 | `.cardio-do-dia>div>strong` |  |
| src/index.css:68 | `.incluir-fotos` |  |
| src/index.css:71 | `.conta-entrada .formulario-conta label,.campo-senha>label` |  |
| src/index.css:71 | `.link-conta` |  |
| src/index.css:71 | `.conta-entrada .erro` |  |
| src/index.css:71 | `.entrada-conta .conta-entrada p[role=status]` |  |
| src/index.css:74 | `.conteudo-config>.painel>h3` |  |
| src/index.css:75 | `.conta .conta-vinculo>p` |  |
| src/index.css:75 | `.conta-vinculo>.botao-principal` |  |
| src/index.css:76 | `.saida-config>.sair-conta` |  |
| src/index.css:96 | `.troca-treino-dialogo>.subtitulo-seletor` |  |
| src/index.css:96 | `.troca-treino-dialogo>button` |  |
| src/index.css:99 | `.abas-catalogo>button` |  |
| src/index.css:103 | `.vazio-catalogo` |  |
| src/index.css:105 | `.ampliar-catalogo strong` |  |
| src/index.css:113 | `.retomar-treino.retomar-compacto>button` |  |
| src/index.css:117 | `.par-resumo-medida h3` |  |
| src/index.css:119 | `.editor-medidas-grupos .medida-vazia strong` |  |
| src/index.css:119 | `.par-editor-medidas>legend` |  |
| src/index.css:127 | `.texto-compartilhar>textarea` |  |
| src/index.css:132 | `.opcao-seletor` |  |
| src/index.css:135 | `.botao-atalho-numero` |  |
| src/index.css:141 | `.unidade-input` |  |
| src/index.css:143 | `.formulario-cardio .opcionais-cardio>summary` |  |
| src/estilos/controles.css:8 | `.privacidade-alerta > strong` |  |
| src/estilos/controles.css:154 | `.perfil-opcional-cadastro > summary` |  |
| src/estilos/controles.css:164 | `.conta .aviso-confirmacao-conta > p` |  |
| src/estilos/controles.css:219 | `.privacidade-grupo > summary` |  |
| src/estilos/controles.css:223 | `.privacidade-dados .privacidade-grupo > h3` |  |
| src/estilos/controles.css:229 | `.backup-protecao strong` |  |
| src/estilos/controles.css:292 | `:root[data-tema] .app .seletor-valores .aplicar-proximas strong` |  |
| src/estilos/controles.css:296 | `:root[data-tema] .app .treino-em-andamento .ferramentas-exercicio > .botao-descanso strong` |  |
| src/estilos/novo-visual.css:61 | `.app .destaque p` |  |
| src/estilos/novo-visual.css:87 | `.app .nome-catalogo strong` |  |
| src/estilos/novo-visual.css:145 | `.app .texto-config strong` |  |
| src/estilos/novo-visual.css:149 | `.app .privacidade-recolhida > summary` |  |
| src/estilos/superficies.css:25 | `:root[data-tema] .app .par-resumo-medida h3` |  |
| src/estilos/superficies.css:97 | `:root[data-tema] .app .descanso-popup > p` |  |

### `20px` — 13 ocorrências

| Arquivo:linha | Seletor | Condição |
| --- | --- | --- |
| src/index.css:3 | `.aviso-conflito-popup>h3` |  |
| src/index.css:12 | `.marca` |  |
| src/index.css:14 | `.abrir-ficha` |  |
| src/index.css:15 | `.exercicio-treino>h2` |  |
| src/index.css:15 | `.descanso.terminou strong` |  |
| src/index.css:19 | `.painel-modal>.topo-painel>header h2` |  |
| src/index.css:121 | `.tela-evolucao .historico-cartao h2` |  |
| src/estilos/controles.css:285 | `:root[data-tema] .app .manter-tela::after` |  |
| src/estilos/novo-visual.css:40 | `.marca > div` |  |
| src/estilos/novo-visual.css:94 | `.app .campo-medida strong` |  |
| src/estilos/novo-visual.css:111 | `.app .valor-escolhido` |  |
| src/estilos/novo-visual.css:219 | `.app .andamento-treino .titulo-andamento h2` |  |
| src/estilos/superficies.css:73 | `:root[data-tema] .app details.privacidade-grupo > summary::before` |  |

### `14px` — 30 ocorrências

| Arquivo:linha | Seletor | Condição |
| --- | --- | --- |
| src/index.css:6 | `.concluir-backup` |  |
| src/index.css:12 | `.titulo-secao h2` |  |
| src/index.css:14 | `.item-ficha h3` |  |
| src/index.css:14 | `.ajuda-texto h3` |  |
| src/index.css:15 | `.serie h3` |  |
| src/index.css:18 | `.passos-exercicio` |  |
| src/index.css:19 | `.lista-tipos>button.remover-serie` |  |
| src/index.css:21 | `.grupo-exercicios .seletor-exercicios button` |  |
| src/index.css:28 | `.acao-treino>summary>span:nth-child(2)` |  |
| src/index.css:31 | `.secao-editor legend` |  |
| src/index.css:33 | `.resumo-titulo p` |  |
| src/index.css:35 | `.exercicio-historico` |  |
| src/index.css:38 | `.foto-card` |  |
| src/index.css:57 | `details.painel.exercicio-historico-recolhivel>summary` |  |
| src/index.css:61 | `.registro-medida>summary` |  |
| src/index.css:61 | `.lembrete-medidas h2` |  |
| src/index.css:62 | `.peso-resumo-medidas strong small` |  |
| src/index.css:62 | `.grafico-medidas-recolhivel>summary` |  |
| src/index.css:68 | `.arquivo-backup>strong` |  |
| src/index.css:71 | `.apresentacao-entrada p` |  |
| src/index.css:74 | `.secao-config>h2` |  |
| src/index.css:74 | `.texto-config>strong` |  |
| src/index.css:106 | `.nome-catalogo>strong` | @media (max-width:360px) |
| src/estilos/controles.css:14 | `.confirmacao-app > p` |  |
| src/estilos/controles.css:19 | `.aviso-backup-titulo > h2` |  |
| src/estilos/novo-visual.css:32 | `.app` |  |
| src/estilos/novo-visual.css:56 | `.app h3` |  |
| src/estilos/novo-visual.css:78 | `.app .abrir-ficha` |  |
| src/estilos/novo-visual.css:114 | `.app .resumo-exercicio strong` |  |
| src/estilos/novo-visual.css:177 | `.app .item-ficha .conteudo-exercicio > .botao-descanso strong` |  |

### `15px` — 16 ocorrências

| Arquivo:linha | Seletor | Condição |
| --- | --- | --- |
| src/index.css:7 | `.cabecalho-arquivo-backup strong` |  |
| src/index.css:10 | `.conflito-sync h3` |  |
| src/index.css:19 | `.lista-tipos strong` |  |
| src/index.css:19 | `.botao-descanso strong` |  |
| src/index.css:19 | `.treino-livre>span` |  |
| src/index.css:30 | `.biblioteca-cabecalho h2` |  |
| src/index.css:56 | `.exercicio-historico-recolhivel>summary` |  |
| src/index.css:61 | `.campo-medida strong` |  |
| src/index.css:62 | `.resumo-todas-medidas>h2` |  |
| src/index.css:71 | `.conta-entrada .formulario-conta .botao-principal` |  |
| src/index.css:93 | `.treino-em-andamento .resumo-exercicio strong` | @media (max-width:360px) |
| src/index.css:102 | `.nome-catalogo>strong` |  |
| src/index.css:118 | `.evolucao-medidas h2` |  |
| src/index.css:122 | `.evolucao-exercicio>h3` |  |
| src/index.css:123 | `.texto-ultimo-treino>strong` |  |
| src/index.css:142 | `.resumo-semanal-cardio>h2` |  |

### `18px` — 9 ocorrências

| Arquivo:linha | Seletor | Condição |
| --- | --- | --- |
| src/index.css:8 | `.conclusao-revisao>h3` |  |
| src/index.css:12 | `.cartao strong` |  |
| src/index.css:24 | `.painel-centralizado>.topo-painel>header h2` |  |
| src/index.css:50 | `.painel-modal>.topo-painel>header>.botao-icone` |  |
| src/estilos/controles.css:163 | `.aviso-confirmacao-conta > strong` |  |
| src/estilos/novo-visual.css:104 | `.app .topo-painel h2` |  |
| src/estilos/novo-visual.css:173 | `.marca > div` | @media (max-width:374px) |
| src/estilos/novo-visual.css:221 | `.app .progresso-sessao > strong` |  |
| src/estilos/superficies.css:90 | `:root[data-tema] .app .resumo-treino-compacto .titulo-andamento h2` |  |

### `16px` — 15 ocorrências

| Arquivo:linha | Seletor | Condição |
| --- | --- | --- |
| src/index.css:12 | `button,input,select,textarea` |  |
| src/index.css:12 | `.painel h2` |  |
| src/index.css:14 | `.formulario input,.formulario select,.formulario textarea` |  |
| src/index.css:14 | `.anexar input` |  |
| src/index.css:16 | `.resumo-exercicio strong` |  |
| src/index.css:16 | `.linha-serie strong,.linha-serie>span` |  |
| src/index.css:16 | `.linha-serie input` |  |
| src/index.css:29 | `.ajustes-descanso button` |  |
| src/index.css:33 | `.calorias-resumo>strong` |  |
| src/index.css:65 | `.cabecalho-cardio-planejado h2` |  |
| src/index.css:71 | `.conta-entrada .formulario-conta input` |  |
| src/index.css:89 | `.treino-em-andamento .conteudo-exercicio>.botao-descanso>span::after` |  |
| src/index.css:143 | `.formulario-cardio .campo-medida>strong` |  |
| src/estilos/novo-visual.css:55 | `.app h2` |  |
| src/estilos/novo-visual.css:91 | `.app input:not([type=checkbox]):not([type=radio]),.app textarea,.app select` |  |

### `8px` — 5 ocorrências

| Arquivo:linha | Seletor | Condição |
| --- | --- | --- |
| src/index.css:12 | `.marca small` |  |
| src/index.css:67 | `.casas-numero .coluna-roda>span` |  |
| src/index.css:71 | `.marca-entrada small` |  |
| src/estilos/novo-visual.css:41 | `.marca small` |  |
| src/estilos/novo-visual.css:108 | `.app .coluna-roda > span` |  |

### `23px` — 2 ocorrências

| Arquivo:linha | Seletor | Condição |
| --- | --- | --- |
| src/index.css:12 | `h1` |  |
| src/index.css:80 | `.treino-em-andamento .titulo-andamento h2` |  |

### `29px` — 1 ocorrências

| Arquivo:linha | Seletor | Condição |
| --- | --- | --- |
| src/index.css:12 | `.destaque h2` |  |

### `25px` — 6 ocorrências

| Arquivo:linha | Seletor | Condição |
| --- | --- | --- |
| src/index.css:12 | `.vazio h2` |  |
| src/index.css:18 | `.titulo-detalhe h2` |  |
| src/index.css:33 | `.resumo-titulo h2` |  |
| src/index.css:142 | `.resumo-semanal-cardio .metricas-resumo strong` |  |
| src/estilos/novo-visual.css:46 | `.app > main > h1` |  |
| src/estilos/novo-visual.css:68 | `.app .cartao > strong` |  |

### `22px` — 5 ocorrências

| Arquivo:linha | Seletor | Condição |
| --- | --- | --- |
| src/index.css:15 | `.ajuste-numero button` |  |
| src/index.css:19 | `.topo-ficha .abrir-ficha` |  |
| src/index.css:62 | `.grade-resumo-medidas strong` |  |
| src/index.css:82 | `.progresso-sessao>strong` |  |
| src/index.css:112 | `.retomar-treino.retomar-compacto h2` |  |

### `36px` — 1 ocorrências

| Arquivo:linha | Seletor | Condição |
| --- | --- | --- |
| src/index.css:15 | `.descanso strong` |  |

### `26px` — 4 ocorrências

| Arquivo:linha | Seletor | Condição |
| --- | --- | --- |
| src/index.css:19 | `.roda>button` |  |
| src/index.css:19 | `.retomar-treino h2` |  |
| src/index.css:33 | `.metricas-resumo strong` |  |
| src/index.css:144 | `.digitar-duracao input` |  |

### `17px` — 7 ocorrências

| Arquivo:linha | Seletor | Condição |
| --- | --- | --- |
| src/index.css:19 | `.valor-escolhido` |  |
| src/index.css:19 | `.tipo-serie` |  |
| src/index.css:35 | `.ultimo-concluido>strong` |  |
| src/index.css:64 | `.rolagem-opcoes .roda>button` |  |
| src/index.css:87 | `.treino-em-andamento .resumo-exercicio strong` |  |
| src/estilos/novo-visual.css:196 | `.app .painel-modal > .topo-painel > header h2` |  |
| src/estilos/superficies.css:93 | `:root[data-tema] .app .resumo-treino-compacto .progresso-sessao > strong` |  |

### `21px` — 3 ocorrências

| Arquivo:linha | Seletor | Condição |
| --- | --- | --- |
| src/index.css:19 | `.valor-serie` |  |
| src/index.css:71 | `.marca-entrada` |  |
| src/index.css:119 | `.editor-medidas-grupos .campo-medida strong` |  |

### `56px` — 1 ocorrências

| Arquivo:linha | Seletor | Condição |
| --- | --- | --- |
| src/index.css:29 | `.descanso-popup>strong` |  |

### `30px` — 3 ocorrências

| Arquivo:linha | Seletor | Condição |
| --- | --- | --- |
| src/index.css:62 | `.peso-resumo-medidas strong` |  |
| src/index.css:71 | `.entrada-conta .apresentacao-entrada h1` |  |
| src/estilos/novo-visual.css:60 | `.app .destaque h2` |  |

### `24px` — 5 ocorrências

| Arquivo:linha | Seletor | Condição |
| --- | --- | --- |
| src/index.css:67 | `.casas-numero .roda>button` |  |
| src/index.css:117 | `.par-resumo-medida dd` |  |
| src/index.css:139 | `.input-com-unidade input` |  |
| src/estilos/novo-visual.css:97 | `.app .titulo-detalhe h2` |  |
| src/estilos/superficies.css:23 | `:root[data-tema] .app :is(.grade-resumo-medidas strong,.par-resumo-medida dd)` |  |

### `clamp(22px,6vw,28px)` — 1 ocorrências

| Arquivo:linha | Seletor | Condição |
| --- | --- | --- |
| src/index.css:73 | `.cartoes-movimento>.cartao>.valor-movimento` |  |

### `0` — 1 ocorrências

| Arquivo:linha | Seletor | Condição |
| --- | --- | --- |
| src/index.css:89 | `.treino-em-andamento .conteudo-exercicio>.botao-descanso>span` |  |

### `27px` — 1 ocorrências

| Arquivo:linha | Seletor | Condição |
| --- | --- | --- |
| src/index.css:122 | `.evolucao-exercicio .metricas-resumo strong` |  |

### `var(--controle-fonte)` — 3 ocorrências

| Arquivo:linha | Seletor | Condição |
| --- | --- | --- |
| src/estilos/controles.css:2 | `.app .botao-destrutivo` |  |
| src/estilos/controles.css:35 | `.app .botao-principal, .app .botao-secundario` |  |
| src/estilos/controles.css:268 | `:root[data-tema] .app :is(.botao-principal,.botao-secundario,.botao-destrutivo):not(:disabled)` |  |

### `52px` — 1 ocorrências

| Arquivo:linha | Seletor | Condição |
| --- | --- | --- |
| src/estilos/superficies.css:96 | `:root[data-tema] .app .descanso-popup > strong` |  |

## Apêndice G — espaçamentos, raios e alturas, por propriedade/valor

| Propriedade | Valor | Ocorrências | Arquivos:linhas / seletores |
| --- | --- | --- | --- |
| gap | `16px` | 25 | src/index.css:2 `.revisao-comparacao`<br>src/index.css:2 `.registro-em-revisao`<br>src/index.css:2 `.opcao-registro-sync`<br>src/index.css:7 `.backup-config .opcao-fotos-backup`<br>src/index.css:9 `.conta .opcao-sync-automatica`<br>src/index.css:10 `.conflito-sync`<br>src/index.css:10 `.comparacao-sync`<br>src/index.css:14 `.formulario`<br>src/index.css:14 `.fotos-maquina`<br>src/index.css:19 `.lista-tipos>button`<br>src/index.css:35 `.evolucao-exercicio`<br>src/index.css:47 `.detalhe-historico`<br>src/index.css:61 `.comparacao-medidas`<br>src/index.css:62 `.peso-resumo-medidas`<br>src/index.css:63 `.tela-cardio`<br>src/index.css:71 `.conta-entrada`<br>src/index.css:75 `.conta-sessao`<br>src/index.css:75 `.conta-vinculo`<br>src/index.css:76 `.conteudo-config .conta-vinculo`<br>src/index.css:125 `.criador-card`<br>src/estilos/controles.css:4 `.confirmacao-privacidade`<br>src/estilos/controles.css:216 `.privacidade-dados`<br>src/estilos/novo-visual.css:158 `.app .opcao-sync-automatica`<br>src/estilos/superficies.css:65 `:root[data-tema] .app .privacidade-grupo.formulario`<br>src/estilos/superficies.css:95 `:root[data-tema] .app .descanso.descanso-popup` |
| gap | `10px` | 43 | src/index.css:2 `.introducao-comparacao-sync`<br>src/index.css:2 `.opcoes-registro-sync`<br>src/index.css:2 `.detalhes-comparacao-sync>summary`<br>src/index.css:4 `.aviso-data-atividade`<br>src/index.css:9 `.estado-sync>.acao-sincronizar`<br>src/index.css:12 `.marca`<br>src/index.css:14 `.painel-modal>.topo-painel>header`<br>src/index.css:14 `.anexar`<br>src/index.css:14 `.desfazer`<br>src/index.css:19 `.iniciar-ficha`<br>src/index.css:21 `.lista-grupos-exercicios`<br>src/index.css:21 `.grupo-exercicios .seletor-exercicios button`<br>src/index.css:28 `.observacao-treino label`<br>src/index.css:33 `.metricas-resumo`<br>src/index.css:35 `.ultimo-concluido`<br>src/index.css:41 `.finalizar-acoes .continuar-depois`<br>src/index.css:51 `.historico-cartao .acoes`<br>src/index.css:52 `.ultimo-concluido>.botao-secundario`<br>src/index.css:53 `.andamento-treino>.manter-tela`<br>src/index.css:61 `.data-medida`<br>src/index.css:61 `.campos-medidas`<br>src/index.css:61 `.acoes-medida`<br>src/index.css:61 `.lembrete-medidas button`<br>src/index.css:62 `.grade-resumo-medidas`<br>src/index.css:63 `.acoes-cardio`<br>src/index.css:63 `.rodas-numero.dupla-roda`<br>src/index.css:63 `.linha-feriado`<br>src/index.css:68 `.incluir-fotos`<br>src/index.css:74 `.configuracoes-grupos`<br>src/index.css:104 `.confirmar-catalogo`<br>src/index.css:106 `.abrir-exercicio-catalogo,.selecionar-exercicio`<br>src/index.css:112 `.retomar-progresso`<br>src/index.css:117 `.pares-resumo-medidas`<br>src/index.css:118 `.evolucao-medidas>header`<br>src/index.css:122 `.evolucao-exercicio .metricas-resumo`<br>src/index.css:127 `.acoes-criador-card`<br>src/index.css:130 `.cabecalho-seletor-numero`<br>src/index.css:142 `.resumo-semanal-cardio>.metricas-resumo`<br>src/estilos/controles.css:17 `.aviso-backup-titulo`<br>src/estilos/controles.css:227 `.backup-protecao`<br>src/estilos/controles.css:276 `:root[data-tema] .app .treino-em-andamento .andamento-treino .manter-tela:not(:disabled)`<br>src/estilos/novo-visual.css:66 `.app .cartao`<br>src/estilos/novo-visual.css:227 `.app .treino-em-andamento .conteudo-exercicio > .acoes` |
| gap | `6px` | 22 | src/index.css:2 `.introducao-comparacao-sync>button`<br>src/index.css:12 `.navegacao button`<br>src/index.css:14 `.formulario label`<br>src/index.css:14 `.acoes`<br>src/index.css:14 `.seletor-exercicios`<br>src/index.css:15 `.ajuste-numero`<br>src/index.css:16 `.cabecalho-series,.linha-serie`<br>src/index.css:19 `.barra-fichas button`<br>src/index.css:39 `.aviso-offline button`<br>src/index.css:46 `.cabecalho-series,.linha-serie`<br>src/index.css:49 `.sessao-exercicio>summary>span`<br>src/index.css:59 `.titulo-andamento>button`<br>src/index.css:61 `.nova-medida`<br>src/index.css:61 `.tabela-comparacao>div`<br>src/index.css:63 `.opcionais-cardio>label`<br>src/index.css:63 `.link-atividade`<br>src/index.css:73 `.cartoes-movimento>.cartao>.valor-movimento`<br>src/index.css:102 `.item-catalogo`<br>src/estilos/controles.css:295 `:root[data-tema] .app .treino-em-andamento .ferramentas-exercicio > .botao-descanso`<br>src/estilos/novo-visual.css:120 `.app .serie-compacta .linha-serie`<br>src/estilos/novo-visual.css:173 `.acoes-cabecalho`<br>src/estilos/novo-visual.css:176 `.app .item-ficha .conteudo-exercicio > .botao-descanso` |
| min-height | `44px` | 38 | src/index.css:2 `.introducao-comparacao-sync>button`<br>src/index.css:2 `.detalhes-comparacao-sync>summary`<br>src/index.css:3 `.aviso-conflito-popup>.link-conta`<br>src/index.css:25 `.salvar-cabecalho`<br>src/index.css:30 `.filtro-musculos button`<br>src/index.css:30 `.biblioteca-cartao .acoes button`<br>src/index.css:33 `.alca-painel`<br>src/index.css:39 `.aviso-offline button`<br>src/index.css:46 `.linha-serie>.tipo-serie`<br>src/index.css:52 `.barra-fichas>button`<br>src/index.css:55 `.aviso-recorde>button`<br>src/index.css:59 `.titulo-andamento>button`<br>src/index.css:71 `.link-conta`<br>src/index.css:73 `.atividade-hoje .link-atividade`<br>src/index.css:75 `.sair-conta`<br>src/index.css:84 `.treino-em-andamento .andamento-treino .manter-tela`<br>src/index.css:99 `.abas-catalogo>button`<br>src/index.css:100 `.musculos-catalogo>button`<br>src/index.css:105 `.ampliar-catalogo>button`<br>src/index.css:116 `.abas-medidas>button`<br>src/index.css:126 `.opcoes-adesivo>button`<br>src/index.css:127 `.criador-card>.remover-foto-card`<br>src/index.css:132 `.opcao-seletor`<br>src/index.css:135 `.botao-atalho-numero`<br>src/estilos/controles.css:99 `.app .abas-treino > button, .app .abas-medidas > button, .app .abas-catalogo > button, .app .alternador-seletor > button`<br>src/estilos/controles.css:167 `.entrada-conta > .marca-entrada`<br>src/estilos/controles.css:187 `.campos-adesivo label`<br>src/estilos/controles.css:219 `.privacidade-grupo > summary`<br>src/estilos/controles.css:262 `.app .treino-em-andamento .conteudo-exercicio > .acoes > button`<br>src/estilos/controles.css:272 `:root[data-tema] .app :is(.abas-treino,.abas-medidas,.abas-catalogo,.alternador-seletor) > button`<br>src/estilos/novo-visual.css:44 `.app .botao-icone`<br>src/estilos/novo-visual.css:81 `.app .menu-ficha summary`<br>src/estilos/novo-visual.css:83 `.app .menu-ficha > .acoes button`<br>src/estilos/novo-visual.css:121 `.app :is(.tipo-serie,.valor-serie,.menu-serie)`<br>src/estilos/novo-visual.css:122 `.app .concluir-compacto`<br>src/estilos/novo-visual.css:180 `.app .item-ficha .acoes > button`<br>src/estilos/superficies.css:66 `:root[data-tema] .app .privacidade-grupo > summary`<br>src/estilos/superficies.css:116 `:root[data-tema] .app .treino-em-andamento .ferramentas-exercicio > .botao-descanso` |
| padding | `8px 0 8px 8px` | 1 | src/index.css:2 `.introducao-comparacao-sync>button` |
| padding-bottom | `20px` | 1 | src/index.css:2 `.registro-em-revisao` |
| gap | `4px` | 12 | src/index.css:2 `.registro-em-revisao>header`<br>src/index.css:7 `.cabecalho-arquivo-backup>div`<br>src/index.css:7 `.acoes-backup-secundarias>button>span,.acoes-backup-secundarias>label>span`<br>src/index.css:45 `.abas-treino`<br>src/index.css:99 `.abas-catalogo`<br>src/index.css:116 `.abas-medidas`<br>src/index.css:131 `.alternador-seletor`<br>src/estilos/controles.css:88 `.app .abas-treino, .app .abas-medidas, .app .abas-catalogo, .app .alternador-seletor`<br>src/estilos/controles.css:271 `:root[data-tema] .app :is(.abas-treino,.abas-medidas,.abas-catalogo,.alternador-seletor)`<br>src/estilos/controles.css:291 `:root[data-tema] .app .seletor-valores .aplicar-proximas span`<br>src/estilos/novo-visual.css:51 `.app .navegacao button`<br>src/estilos/novo-visual.css:221 `.app .progresso-sessao > strong` |
| padding | `14px 11px` | 1 | src/index.css:2 `.opcao-registro-sync` |
| border-radius | `15px` | 6 | src/index.css:2 `.opcao-registro-sync`<br>src/index.css:12 `.instalacao`<br>src/index.css:15 `.descanso`<br>src/index.css:71 `.marca-entrada>span`<br>src/index.css:116 `.abas-medidas`<br>src/index.css:117 `.par-resumo-medida` |
| padding | `13px 10px` | 1 | src/index.css:2 `.opcao-registro-sync[aria-pressed=true]` |
| gap | `5px` | 6 | src/index.css:2 `.origem-registro-sync`<br>src/index.css:2 `.valor-comparado-sync`<br>src/index.css:9 `.texto-sync-automatica`<br>src/index.css:12 `.estado-rede`<br>src/index.css:74 `.texto-config`<br>src/index.css:123 `.ultimo-treino-atalho>.texto-ultimo-treino` |
| height | `16px` | 1 | src/index.css:2 `.marca-escolha-sync` |
| border-radius | `50%` | 7 | src/index.css:2 `.marca-escolha-sync`<br>src/index.css:8 `.conclusao-revisao>span`<br>src/index.css:9 `.interruptor-sync::after`<br>src/index.css:12 `.botao-icone`<br>src/index.css:12 `.estado-rede i,.ponto`<br>src/index.css:19 `.tipo-serie`<br>src/index.css:111 `.sinal-treino` |
| gap | `3px` | 3 | src/index.css:2 `.data-versao-sync`<br>src/index.css:18 `.abas-detalhe`<br>src/index.css:125 `.amostra-card` |
| padding-top | `10px` | 2 | src/index.css:2 `.data-versao-sync`<br>src/index.css:75 `.conta-rodape` |
| padding | `8px` | 5 | src/index.css:2 `.cabecalho-detalhes-sync`<br>src/index.css:16 `.serie-compacta`<br>src/index.css:19 `.menu-ficha .acoes`<br>src/index.css:30 `.biblioteca-cartao .acoes button`<br>src/index.css:52 `.treino-livre>svg:first-child` |
| border-radius | `8px` | 18 | src/index.css:2 `.cabecalho-detalhes-sync`<br>src/index.css:7 `.acao-backup-importar:focus-within`<br>src/index.css:16 `.linha-serie input`<br>src/index.css:46 `.linha-serie>.menu-serie`<br>src/index.css:47 `.linha-historico-serie>span:first-child`<br>src/index.css:55 `.aviso-recorde>button`<br>src/index.css:63 `.atividade-hoje progress,.tela-cardio progress`<br>src/index.css:73 `.atividade-hoje .cartoes-movimento progress,.espaco-progresso`<br>src/index.css:73 `.cartoes-movimento progress::-webkit-progress-bar`<br>src/index.css:73 `.cartoes-movimento progress::-webkit-progress-value`<br>src/index.css:73 `.cartoes-movimento progress::-moz-progress-bar`<br>src/index.css:83 `.barra-sessao`<br>src/index.css:83 `.barra-sessao::-webkit-progress-value`<br>src/index.css:83 `.barra-sessao::-moz-progress-bar`<br>src/index.css:100 `.musculos-catalogo::-webkit-scrollbar-track`<br>src/index.css:100 `.musculos-catalogo::-webkit-scrollbar-thumb`<br>src/index.css:127 `.area-preview-card>.preview-card`<br>src/estilos/superficies.css:76 `:root[data-tema] .app .privacidade-contagem` |
| gap | `6px 12px` | 2 | src/index.css:2 `.linha-detalhes-sync`<br>src/index.css:9 `.estado-sync>.detalhes-sync` |
| padding | `10px 4px` | 2 | src/index.css:2 `.linha-detalhes-sync`<br>src/index.css:63 `.abas-treino.tres-abas button` |
| min-height | `48px` | 63 | src/index.css:2 `.registro-em-revisao>.confirmar-registro-sync`<br>src/index.css:6 `.concluir-backup`<br>src/index.css:7 `.backup-config .preparar-backup`<br>src/index.css:7 `.lembrete-backup-opcao`<br>src/index.css:12 `.botao-principal`<br>src/index.css:12 `.botao-secundario`<br>src/index.css:12 `.aviso-pwa button`<br>src/index.css:14 `.abas-treino button`<br>src/index.css:14 `.formulario input,.formulario select,.formulario textarea`<br>src/index.css:14 `.acoes button,.seletor-exercicios button`<br>src/index.css:14 `.anexar input`<br>src/index.css:14 `.desfazer button`<br>src/index.css:15 `.ajuste-numero button`<br>src/index.css:15 `.serie details summary,details.painel>summary`<br>src/index.css:16 `.linha-serie input`<br>src/index.css:16 `.concluir-compacto`<br>src/index.css:16 `.opcoes-serie>summary`<br>src/index.css:18 `.abas-detalhe button`<br>src/index.css:19 `.roda>button`<br>src/index.css:19 `.tipo-serie`<br>src/index.css:19 `.valor-serie`<br>src/index.css:19 `.botao-descanso`<br>src/index.css:19 `.retomar-treino button`<br>src/index.css:19 `.barra-fichas button`<br>src/index.css:19 `.iniciar-ficha`<br>src/index.css:29 `.ajustes-descanso button`<br>src/index.css:31 `.escolhas-editor button`<br>src/index.css:34 `.acoes-resumo-fixas .botao-principal`<br>src/index.css:35 `.tabela-grafico summary`<br>src/index.css:35 `.aviso-recorde button`<br>src/index.css:36 `.aviso-remocao>button`<br>src/index.css:38 `.linha-serie>button`<br>src/index.css:38 `.foto-card`<br>src/index.css:41 `.finalizar-acoes .continuar-depois`<br>src/index.css:61 `.nova-medida`<br>src/index.css:61 `.data-medida`<br>src/index.css:61 `.acoes-medida>button`<br>src/index.css:61 `.lembrete-medidas button`<br>src/index.css:63 `.acoes-cardio button`<br>src/index.css:63 `.opcionais-cardio>summary`<br>src/index.css:63 `.link-atividade`<br>src/index.css:63 `.linha-feriado>button`<br>src/index.css:68 `.incluir-fotos`<br>src/index.css:70 `.formulario-conta input`<br>src/index.css:75 `.conta-vinculo>.botao-principal`<br>src/index.css:76 `.conteudo-config .conta-vinculo>.botao-principal`<br>src/index.css:88 `.treino-em-andamento .ajuda-no-treino`<br>src/index.css:94 `.treino-em-andamento>.cancelar-sessao`<br>src/index.css:96 `.troca-treino-dialogo>button`<br>src/index.css:102 `.item-catalogo>.menu-ficha>summary`<br>src/index.css:107 `.mais-catalogo`<br>src/index.css:127 `.acoes-criador-card>button,.acoes-criador-card>a`<br>src/index.css:142 `.acao-cardio-unica>button`<br>src/estilos/controles.css:22 `.formulario .opcao-copia-exercicio`<br>src/estilos/controles.css:133 `.app .opcao-sync-automatica`<br>src/estilos/controles.css:233 `.backup-outros-formatos > summary`<br>src/estilos/controles.css:276 `:root[data-tema] .app .treino-em-andamento .andamento-treino .manter-tela:not(:disabled)`<br>src/estilos/controles.css:295 `:root[data-tema] .app .treino-em-andamento .ferramentas-exercicio > .botao-descanso`<br>src/estilos/novo-visual.css:51 `.app .navegacao button`<br>src/estilos/novo-visual.css:155 `.app .backup-outros-formatos > summary`<br>src/estilos/novo-visual.css:176 `.app .item-ficha .conteudo-exercicio > .botao-descanso`<br>src/estilos/novo-visual.css:189 `.app .tela-cardio .acoes-medida > button`<br>src/estilos/superficies.css:117 `:root[data-tema] .app .treino-em-andamento .ferramentas-exercicio > .ajuda-no-treino` |
| gap | `14px` | 11 | src/index.css:3 `.aviso-conflito-popup`<br>src/index.css:19 `.treino-livre`<br>src/index.css:30 `.biblioteca-cabecalho`<br>src/index.css:33 `.resumo-treino`<br>src/index.css:63 `.atividade-hoje`<br>src/index.css:70 `.formulario-conta,.estado-sync,.conta`<br>src/index.css:71 `.alternativa-entrada>span`<br>src/index.css:71 `.conta-entrada .formulario-conta`<br>src/index.css:102 `.abrir-exercicio-catalogo,.selecionar-exercicio`<br>src/index.css:117 `.par-resumo-medida>dl`<br>src/estilos/controles.css:288 `:root[data-tema] .app .seletor-valores .aplicar-proximas` |
| padding | `8px 0` | 5 | src/index.css:3 `.aviso-conflito-popup`<br>src/index.css:31 `.grupo-personalizado>summary`<br>src/index.css:75 `.ajuda-conta>summary`<br>src/estilos/controles.css:10 `.confirmacao-privacidade .opcao-copia-exercicio`<br>src/estilos/superficies.css:96 `:root[data-tema] .app .descanso-popup > strong` |
| height | `62px` | 1 | src/index.css:3 `.icone-aviso-conflito` |
| border-radius | `18px` | 16 | src/index.css:3 `.icone-aviso-conflito`<br>src/index.css:19 `.treino-livre`<br>src/index.css:39 `.aviso-offline`<br>src/index.css:52 `.treino-livre`<br>src/index.css:61 `.lembrete-medidas`<br>src/index.css:62 `.peso-resumo-medidas`<br>src/index.css:118 `.evolucao-medidas`<br>src/index.css:121 `.tela-evolucao .historico-cartao`<br>src/index.css:127 `.area-preview-card`<br>src/index.css:142 `.resumo-semanal-cardio`<br>src/estilos/controles.css:16 `.aviso-backup`<br>src/estilos/novo-visual.css:53 `.app :is(.painel,.cartao,.secao-config,.registro-medida,.exercicio-treino,.item-ficha,.retomar-treino,.treino-livre,.ampliar-catalogo,.peso-resumo-medidas,.par-resumo-medida)`<br>src/estilos/novo-visual.css:98 `.app .capa-exercicio`<br>src/estilos/novo-visual.css:107 `.app .coluna-roda`<br>src/estilos/novo-visual.css:140 `.app .config-lista`<br>src/estilos/novo-visual.css:148 `.app .privacidade-recolhida` |
| gap | `12px` | 91 | src/index.css:3 `.aviso-conflito-popup>.botao-principal`<br>src/index.css:7 `.backup-config .backup-pronto`<br>src/index.css:7 `.cabecalho-arquivo-backup`<br>src/index.css:7 `.acoes-backup-secundarias>button,.backup-config .acoes-backup-secundarias>label`<br>src/index.css:8 `.conclusao-revisao`<br>src/index.css:10 `.revisao-sync`<br>src/index.css:12 `.botao-principal`<br>src/index.css:12 `.grade-cartoes`<br>src/index.css:12 `.nota`<br>src/index.css:12 `.instalacao`<br>src/index.css:12 `.painel dl>div`<br>src/index.css:14 `.dupla`<br>src/index.css:15 `.reducao`<br>src/index.css:16 `.cabecalho-exercicio`<br>src/index.css:19 `.aplicar-proximas`<br>src/index.css:19 `.botao-descanso`<br>src/index.css:19 `.topo-ficha`<br>src/index.css:21 `.grupo-exercicios>summary`<br>src/index.css:28 `.acao-treino>summary`<br>src/index.css:28 `.finalizar-acoes`<br>src/index.css:29 `.ajustes-descanso`<br>src/index.css:32 `.biblioteca-grupos`<br>src/index.css:36 `.aviso-remocao`<br>src/index.css:39 `.aviso-offline`<br>src/index.css:47 `.linha-historico-serie`<br>src/index.css:52 `.barra-fichas`<br>src/index.css:52 `.treino-livre`<br>src/index.css:53 `.andamento-treino`<br>src/index.css:55 `.aviso-recorde`<br>src/index.css:56 `.exercicio-historico-recolhivel>summary`<br>src/index.css:57 `details.painel.exercicio-historico-recolhivel>summary`<br>src/index.css:59 `.titulo-andamento`<br>src/index.css:61 `.topo-medidas`<br>src/index.css:61 `.vazio-medidas`<br>src/index.css:61 `.rodas-medida`<br>src/index.css:61 `.historico-medidas`<br>src/index.css:61 `.registro-medida>summary`<br>src/index.css:61 `.registro-medida dl>div`<br>src/index.css:61 `.lembrete-medidas`<br>src/index.css:62 `.grafico-medidas-recolhivel>summary`<br>src/index.css:63 `.cardio-do-dia`<br>src/index.css:63 `.config-atividade .data-medida`<br>src/index.css:65 `.cabecalho-cardio-planejado`<br>src/index.css:68 `.arquivo-backup`<br>src/index.css:73 `.atividade-hoje .cartoes-movimento`<br>src/index.css:74 `.secao-config>h2>button`<br>src/index.css:74 `.conteudo-config .painel dl>div`<br>src/index.css:81 `.treino-em-andamento .progresso-sessao`<br>src/index.css:86 `.treino-em-andamento .cabecalho-exercicio`<br>src/index.css:96 `.troca-treino-dialogo`<br>src/index.css:99 `.filtros-catalogo`<br>src/index.css:101 `.contagem-catalogo`<br>src/index.css:105 `.ampliar-catalogo`<br>src/index.css:117 `.par-resumo-medida>header`<br>src/index.css:121 `.historico-cartao>small`<br>src/index.css:122 `.evolucao-exercicio .sessao-exercicio>summary`<br>src/index.css:123 `.ultimo-concluido.ultimo-treino-atalho`<br>src/index.css:144 `.digitar-duracao`<br>src/estilos/controles.css:13 `.confirmacao-app`<br>src/estilos/controles.css:16 `.aviso-backup`<br>src/estilos/controles.css:22 `.formulario .opcao-copia-exercicio`<br>src/estilos/controles.css:154 `.perfil-opcional-cadastro > summary`<br>src/estilos/controles.css:159 `.perfil-inicial-cadastro`<br>src/estilos/controles.css:162 `.aviso-confirmacao-conta`<br>src/estilos/controles.css:225 `.privacidade-dados .privacidade-grupo.formulario`<br>src/estilos/novo-visual.css:58 `.app :is(.titulo-secao,.topo-medidas,.barra-fichas)`<br>src/estilos/novo-visual.css:65 `.app .grade-cartoes`<br>src/estilos/novo-visual.css:76 `.app .topo-ficha`<br>src/estilos/novo-visual.css:84 `.app .paginacao-fichas`<br>src/estilos/novo-visual.css:85 `.app :is(.lista-catalogo,.historico-medidas)`<br>src/estilos/novo-visual.css:95 `.app :is(.data-medida,.botao-descanso)`<br>src/estilos/novo-visual.css:103 `.app .topo-painel header`<br>src/estilos/novo-visual.css:113 `.app .cabecalho-exercicio`<br>src/estilos/novo-visual.css:126 `.app .finalizar-acoes`<br>src/estilos/novo-visual.css:130 `.app .acoes-resumo-fixas`<br>src/estilos/novo-visual.css:131 `.app :is(.metricas-resumo,.grade-resumo-medidas,.campos-medidas)`<br>src/estilos/novo-visual.css:143 `.app .secao-config > h2 > button`<br>src/estilos/novo-visual.css:156 `.app .backup-formatos-acoes`<br>src/estilos/novo-visual.css:175 `.app .item-ficha .conteudo-exercicio`<br>src/estilos/novo-visual.css:185 `.app .tela-cardio .detalhe-cardio`<br>src/estilos/novo-visual.css:188 `.app .tela-cardio .acoes-medida`<br>src/estilos/novo-visual.css:192 `.app .aplicar-proximas`<br>src/estilos/novo-visual.css:195 `.app .painel-modal > .topo-painel > header`<br>src/estilos/novo-visual.css:218 `.app .treino-em-andamento .andamento-treino`<br>src/estilos/novo-visual.css:220 `.app .treino-em-andamento .progresso-sessao`<br>src/estilos/superficies.css:22 `:root[data-tema] .app :is(.grade-resumo-medidas,.pares-resumo-medidas,.historico-medidas)`<br>src/estilos/superficies.css:71 `:root[data-tema] .app details.privacidade-grupo > summary`<br>src/estilos/superficies.css:77 `:root[data-tema] .app .mais-exercicios`<br>src/estilos/superficies.css:79 `:root[data-tema] .app .privacidade-recolhida > summary`<br>src/estilos/superficies.css:106 `:root[data-tema] .app .acoes-foto-card`<br>src/estilos/superficies.css:115 `:root[data-tema] .app .ferramentas-exercicio` |
| min-height | `50px` | 3 | src/index.css:3 `.aviso-conflito-popup>.botao-principal`<br>src/index.css:9 `.estado-sync>.acao-sincronizar`<br>src/index.css:76 `.saida-config>.sair-conta` |
| padding | `8px 16px` | 3 | src/index.css:3 `.aviso-conflito-popup>.link-conta`<br>src/index.css:35 `.aviso-recorde button`<br>src/index.css:126 `.opcoes-adesivo>button` |
| padding | `14px` | 15 | src/index.css:4 `.aviso-data-atividade`<br>src/index.css:10 `.revisao-sync`<br>src/index.css:14 `.item-ficha`<br>src/index.css:15 `.serie`<br>src/index.css:15 `.descanso`<br>src/index.css:39 `.aviso-offline`<br>src/index.css:55 `.aviso-recorde`<br>src/index.css:58 `.guia-esforco`<br>src/index.css:61 `.escolher-comparacao`<br>src/estilos/controles.css:7 `.privacidade-alerta`<br>src/estilos/controles.css:227 `.backup-protecao`<br>src/estilos/controles.css:288 `:root[data-tema] .app .seletor-valores .aplicar-proximas`<br>src/estilos/novo-visual.css:92 `.app .campo-medida`<br>src/estilos/novo-visual.css:124 `.app .ultimo-desempenho`<br>src/estilos/novo-visual.css:154 `.app .backup-protecao` |
| border-radius | `12px` | 64 | src/index.css:4 `.aviso-data-atividade`<br>src/index.css:6 `.concluir-backup`<br>src/index.css:7 `.icone-arquivo-backup`<br>src/index.css:10 `.revisao-sync`<br>src/index.css:10 `.comparacao-sync>section`<br>src/index.css:12 `.botao-principal`<br>src/index.css:12 `.botao-secundario`<br>src/index.css:12 `.navegacao button`<br>src/index.css:12 `.erro`<br>src/index.css:14 `.abas-treino button`<br>src/index.css:14 `.item-ficha`<br>src/index.css:14 `.fotos-maquina img`<br>src/index.css:14 `.desfazer`<br>src/index.css:15 `.serie`<br>src/index.css:16 `.miniatura-exercicio`<br>src/index.css:16 `.serie-compacta`<br>src/index.css:18 `.abas-detalhe button`<br>src/index.css:19 `.faixa-roda`<br>src/index.css:19 `.botao-descanso`<br>src/index.css:19 `.retomar-treino button`<br>src/index.css:19 `.iniciar-ficha`<br>src/index.css:25 `.salvar-cabecalho`<br>src/index.css:28 `.icone-acao`<br>src/index.css:29 `.ajustes-descanso button`<br>src/index.css:31 `.escolhas-editor button`<br>src/index.css:34 `.acoes-resumo-fixas .botao-principal`<br>src/index.css:35 `.progressao`<br>src/index.css:38 `.foto-card`<br>src/index.css:39 `.icone-aviso-offline`<br>src/index.css:39 `.aviso-offline button`<br>src/index.css:47 `.ultimo-desempenho`<br>src/index.css:52 `.ultimo-concluido>.botao-secundario`<br>src/index.css:52 `.barra-fichas>button`<br>src/index.css:58 `.guia-esforco`<br>src/index.css:61 `.nova-medida`<br>src/index.css:61 `.data-medida`<br>src/index.css:61 `.campo-medida`<br>src/index.css:61 `.acoes-medida>button`<br>src/index.css:61 `.escolher-comparacao`<br>src/index.css:61 `.lembrete-medidas button`<br>src/index.css:63 `.acoes-cardio button`<br>src/index.css:63 `.linha-feriado`<br>src/index.css:70 `.formulario-conta input`<br>src/index.css:74 `.icone-config`<br>src/index.css:91 `.treino-em-andamento .serie-compacta`<br>src/index.css:94 `.treino-em-andamento>.cancelar-sessao`<br>src/index.css:96 `.troca-treino-dialogo>button`<br>src/index.css:102 `.abrir-exercicio-catalogo,.selecionar-exercicio`<br>src/index.css:123 `.ultimo-treino-atalho>.icone-ultimo-treino`<br>src/index.css:127 `.acoes-criador-card>button,.acoes-criador-card>a`<br>src/index.css:127 `.texto-compartilhar>textarea`<br>src/index.css:135 `.botao-atalho-numero`<br>src/index.css:144 `.digitar-duracao input`<br>src/estilos/controles.css:7 `.privacidade-alerta`<br>src/estilos/controles.css:222 `.privacidade-contagem`<br>src/estilos/controles.css:227 `.backup-protecao`<br>src/estilos/novo-visual.css:48 `.app .aviso-modo-visitante`<br>src/estilos/novo-visual.css:51 `.app .navegacao button`<br>src/estilos/novo-visual.css:91 `.app input:not([type=checkbox]):not([type=radio]),.app textarea,.app select`<br>src/estilos/novo-visual.css:109 `.app .coluna-roda .faixa-roda`<br>src/estilos/novo-visual.css:119 `.app .serie-compacta`<br>src/estilos/novo-visual.css:124 `.app .ultimo-desempenho`<br>src/estilos/novo-visual.css:186 `.app .tela-cardio .detalhe-cardio > p`<br>src/estilos/novo-visual.css:189 `.app .tela-cardio .acoes-medida > button` |
| min-height | `20px` | 1 | src/index.css:4 `.aviso-data-atividade .incluir-fotos>input` |
| height | `20px` | 1 | src/index.css:4 `.aviso-data-atividade .incluir-fotos>input` |
| padding | `0` | 24 | src/index.css:4 `.aviso-data-atividade .incluir-fotos>input`<br>src/index.css:7 `.backup-config .opcao-fotos-backup>input`<br>src/index.css:14 `.painel-modal`<br>src/index.css:16 `.exercicio-recolhivel`<br>src/index.css:17 `.item-ficha.exercicio-recolhivel`<br>src/index.css:21 `.sr-only`<br>src/index.css:29 `.descanso.descanso-popup`<br>src/index.css:46 `.linha-serie>.menu-serie`<br>src/index.css:48 `.painel-modal>.topo-painel>.alca-painel`<br>src/index.css:49 `.sessao-exercicio>summary>span>small`<br>src/index.css:55 `.aviso-recorde>button`<br>src/index.css:56 `.exercicio-historico-recolhivel`<br>src/index.css:71 `.entrada-conta .conteudo-entrada`<br>src/index.css:73 `.atividade-hoje>.nota-resumo`<br>src/index.css:74 `.conteudo-config>.painel`<br>src/index.css:119 `.par-editor-medidas`<br>src/index.css:119 `.par-editor-medidas>legend`<br>src/index.css:143 `.grupo-campos-cardio`<br>src/index.css:143 `.grupo-campos-cardio>legend`<br>src/estilos/controles.css:174 `.criador-card > .area-preview-card.preview-aprovada`<br>src/estilos/novo-visual.css:44 `.app .botao-icone`<br>src/estilos/novo-visual.css:102 `.app .topo-painel`<br>src/estilos/novo-visual.css:183 `.app .tela-cardio .registro-medida`<br>src/estilos/superficies.css:95 `:root[data-tema] .app .descanso.descanso-popup` |
| padding | `12px 16px` | 8 | src/index.css:6 `.concluir-backup`<br>src/index.css:9 `.estado-sync>.acao-sincronizar`<br>src/index.css:21 `.grupo-exercicios>summary`<br>src/index.css:38 `.foto-card`<br>src/index.css:76 `.conteudo-config .conta-vinculo>.botao-principal`<br>src/index.css:96 `.troca-treino-dialogo>button`<br>src/estilos/controles.css:2 `.app .botao-destrutivo`<br>src/estilos/controles.css:35 `.app .botao-principal, .app .botao-secundario` |
| min-height | `64px` | 6 | src/index.css:7 `.backup-config .opcao-fotos-backup`<br>src/index.css:9 `.conta .opcao-sync-automatica`<br>src/index.css:19 `.lista-tipos>button.remover-serie`<br>src/index.css:56 `.exercicio-historico-recolhivel>summary`<br>src/index.css:57 `details.painel.exercicio-historico-recolhivel>summary`<br>src/estilos/novo-visual.css:149 `.app .privacidade-recolhida > summary` |
| min-height | `0` | 7 | src/index.css:7 `.backup-config .opcao-fotos-backup>input`<br>src/index.css:60 `.painel-modal>.conteudo-modal`<br>src/estilos/novo-visual.css:29 `html,body,#root`<br>src/estilos/novo-visual.css:32 `.app`<br>src/estilos/novo-visual.css:45 `.app > main#conteudo`<br>src/estilos/novo-visual.css:105 `.app .conteudo-modal`<br>src/estilos/superficies.css:112 `:root[data-tema] .app .tela-evolucao > .conteudo-alternado` |
| height | `1px` | 6 | src/index.css:7 `.backup-config .opcao-fotos-backup>input`<br>src/index.css:7 `.acao-backup-importar>input`<br>src/index.css:9 `.opcao-sync-automatica>input`<br>src/index.css:21 `.sr-only`<br>src/index.css:38 `.foto-card input`<br>src/index.css:71 `.alternativa-entrada>span::before,.alternativa-entrada>span::after` |
| gap | `9px` | 3 | src/index.css:7 `.backup-config .preparar-backup`<br>src/index.css:7 `.lembrete-backup-opcao`<br>src/index.css:73 `.cartoes-movimento>.cartao` |
| padding | `16px` | 29 | src/index.css:7 `.backup-config .backup-pronto`<br>src/index.css:12 `.instalacao`<br>src/index.css:12 `.erro`<br>src/index.css:30 `.biblioteca-cartao`<br>src/index.css:33 `.calorias-resumo`<br>src/index.css:35 `.sugestao-carga`<br>src/index.css:35 `.exercicio-historico`<br>src/index.css:35 `.aviso-recorde`<br>src/index.css:35 `.ultimo-concluido`<br>src/index.css:52 `.treino-livre`<br>src/index.css:61 `.registro-medida>summary`<br>src/index.css:61 `.acoes-medida`<br>src/index.css:62 `.grafico-medidas-recolhivel>summary`<br>src/index.css:68 `.arquivo-backup`<br>src/index.css:74 `.secao-config>h2>button`<br>src/index.css:86 `.treino-em-andamento .cabecalho-exercicio`<br>src/index.css:105 `.ampliar-catalogo`<br>src/index.css:117 `.par-resumo-medida`<br>src/index.css:118 `.evolucao-medidas`<br>src/index.css:127 `.area-preview-card`<br>src/index.css:142 `.resumo-semanal-cardio`<br>src/estilos/novo-visual.css:75 `.app .ficha-nova`<br>src/estilos/novo-visual.css:113 `.app .cabecalho-exercicio`<br>src/estilos/novo-visual.css:132 `.app .metricas-resumo > div`<br>src/estilos/novo-visual.css:184 `.app .tela-cardio .registro-medida > summary`<br>src/estilos/novo-visual.css:185 `.app .tela-cardio .detalhe-cardio`<br>src/estilos/superficies.css:21 `:root[data-tema] .app :is(.grade-resumo-medidas > div,.par-resumo-medida,.peso-resumo-medidas)`<br>src/estilos/superficies.css:61 `:root[data-tema] .app .privacidade-dados > .privacidade-grupo`<br>src/estilos/superficies.css:101 `:root[data-tema] .app .criador-card > .area-preview-card` |
| height | `46px` | 2 | src/index.css:7 `.icone-arquivo-backup`<br>src/index.css:125 `.amostra-card` |
| gap | `8px` | 51 | src/index.css:7 `.acoes-arquivo-backup`<br>src/index.css:12 `.linha-data`<br>src/index.css:14 `.abas-treino`<br>src/index.css:19 `.rodas-valores`<br>src/index.css:30 `.filtro-musculos`<br>src/index.css:30 `.biblioteca-cartao .acoes`<br>src/index.css:31 `.escolhas-editor`<br>src/index.css:33 `.calorias-resumo`<br>src/index.css:34 `.acoes-resumo-fixas`<br>src/index.css:37 `.busca-historico`<br>src/index.css:38 `.cabecalho-series,.linha-serie`<br>src/index.css:38 `.conteudo-exercicio>.acoes`<br>src/index.css:39 `.aviso-offline`<br>src/index.css:53 `.acao-treino .salvar-planejamento`<br>src/index.css:61 `.rodas-data`<br>src/index.css:61 `.campo-medida`<br>src/index.css:61 `.acoes-medida>button`<br>src/index.css:61 `.escolher-comparacao`<br>src/index.css:63 `.acoes-cardio button`<br>src/index.css:67 `.rodas-numero.casas-numero`<br>src/index.css:70 `.formulario-conta label`<br>src/index.css:71 `.campo-senha`<br>src/index.css:75 `.sair-conta`<br>src/index.css:76 `.saida-config`<br>src/index.css:84 `.treino-em-andamento .andamento-treino .manter-tela`<br>src/index.css:93 `.treino-em-andamento .cabecalho-exercicio`<br>src/index.css:100 `.musculos-catalogo`<br>src/index.css:103 `.selecao-catalogo>.lista-catalogo`<br>src/index.css:119 `.editor-medidas-grupos .campo-medida>span`<br>src/index.css:121 `.historico-cartao>.acoes`<br>src/index.css:125 `.modelos-card`<br>src/index.css:126 `.opcoes-adesivo`<br>src/index.css:127 `.criador-card .foto-card`<br>src/index.css:127 `.texto-compartilhar`<br>src/index.css:134 `.atalhos-numero`<br>src/index.css:137 `.campo-digitar-numero`<br>src/index.css:143 `.formulario-cardio .opcionais-cardio>label`<br>src/index.css:144 `.digitar-duracao>label`<br>src/estilos/controles.css:2 `.app .botao-destrutivo`<br>src/estilos/controles.css:35 `.app .botao-principal, .app .botao-secundario`<br>src/estilos/controles.css:140 `.rodas-numero.centesimos-medida`<br>src/estilos/controles.css:151 `.layouts-adesivo`<br>src/estilos/controles.css:176 `.criador-card > .modelos-card`<br>src/estilos/controles.css:187 `.campos-adesivo label`<br>src/estilos/controles.css:234 `.backup-formatos-acoes`<br>src/estilos/controles.css:235 `.backup-formatos-acoes > button`<br>src/estilos/controles.css:268 `:root[data-tema] .app :is(.botao-principal,.botao-secundario,.botao-destrutivo):not(:disabled)`<br>src/estilos/novo-visual.css:42 `.acoes-cabecalho`<br>src/estilos/novo-visual.css:90 `.app .formulario > label`<br>src/estilos/novo-visual.css:179 `.app .item-ficha .conteudo-exercicio > .acoes`<br>src/estilos/superficies.css:37 `:root[data-tema] .app .formulario label` |
| gap | `7px` | 8 | src/index.css:7 `.acoes-arquivo-backup>a,.acoes-arquivo-backup>button`<br>src/index.css:52 `.barra-fichas>button`<br>src/index.css:88 `.treino-em-andamento .ajuda-no-treino`<br>src/index.css:89 `.treino-em-andamento .conteudo-exercicio>.botao-descanso`<br>src/index.css:111 `.retomar-identidade`<br>src/index.css:123 `.ultimo-treino-atalho>.acao-ultimo-treino`<br>src/index.css:125 `.modelos-card>button`<br>src/index.css:127 `.acoes-criador-card>button,.acoes-criador-card>a` |
| min-height | `46px` | 5 | src/index.css:7 `.acoes-arquivo-backup>a,.acoes-arquivo-backup>button`<br>src/index.css:45 `.abas-treino button`<br>src/index.css:52 `.ultimo-concluido>.botao-secundario`<br>src/index.css:104 `.confirmar-catalogo>.botao-principal`<br>src/index.css:113 `.retomar-treino.retomar-compacto>button` |
| padding | `10px 8px` | 4 | src/index.css:7 `.acoes-arquivo-backup>a,.acoes-arquivo-backup>button`<br>src/index.css:45 `.abas-treino button`<br>src/index.css:71 `.link-conta`<br>src/index.css:127 `.acoes-criador-card>button,.acoes-criador-card>a` |
| border-radius | `11px` | 8 | src/index.css:7 `.acoes-arquivo-backup>a,.acoes-arquivo-backup>button`<br>src/index.css:45 `.abas-treino button`<br>src/index.css:52 `.treino-livre>svg:first-child`<br>src/index.css:99 `.abas-catalogo>button`<br>src/index.css:113 `.retomar-treino.retomar-compacto>button`<br>src/estilos/controles.css:99 `.app .abas-treino > button, .app .abas-medidas > button, .app .abas-catalogo > button, .app .alternador-seletor > button`<br>src/estilos/controles.css:272 `:root[data-tema] .app :is(.abas-treino,.abas-medidas,.abas-catalogo,.alternador-seletor) > button`<br>src/estilos/novo-visual.css:77 `.app .icone-ficha` |
| min-height | `36px` | 3 | src/index.css:7 `.nota-salvamento-backup>summary`<br>src/index.css:75 `.ajuda-conta>summary`<br>src/estilos/controles.css:203 `.tela-evolucao .busca-historico > small` |
| min-height | `68px` | 3 | src/index.css:7 `.acoes-backup-secundarias>button,.backup-config .acoes-backup-secundarias>label`<br>src/estilos/novo-visual.css:204 `.app .secao-config > h2 > button`<br>src/estilos/superficies.css:79 `:root[data-tema] .app .privacidade-recolhida > summary` |
| padding | `12px 0` | 6 | src/index.css:7 `.acoes-backup-secundarias>button,.backup-config .acoes-backup-secundarias>label`<br>src/index.css:12 `.painel dl>div`<br>src/index.css:15 `.reducao`<br>src/index.css:63 `.opcionais-cardio>summary`<br>src/estilos/novo-visual.css:158 `.app .opcao-sync-automatica`<br>src/estilos/novo-visual.css:225 `.app .treino-em-andamento .ultimo-desempenho` |
| padding | `4px 0` | 2 | src/index.css:7 `.lembrete-backup-opcao`<br>src/estilos/superficies.css:66 `:root[data-tema] .app .privacidade-grupo > summary` |
| padding | `16px 8px 8px` | 2 | src/index.css:8 `.conclusao-revisao`<br>src/index.css:16 `.cabecalho-series` |
| height | `60px` | 1 | src/index.css:8 `.conclusao-revisao>span` |
| border-radius | `13px` | 9 | src/index.css:9 `.estado-sync>.acao-sincronizar`<br>src/index.css:12 `.marca>span`<br>src/index.css:71 `.conta-entrada .formulario-conta input`<br>src/index.css:71 `.conta-entrada .formulario-conta .botao-principal`<br>src/index.css:76 `.saida-config>.sair-conta`<br>src/index.css:139 `.input-com-unidade input`<br>src/index.css:142 `.resumo-semanal-cardio .metricas-resumo>div`<br>src/estilos/novo-visual.css:39 `.marca > span`<br>src/estilos/novo-visual.css:95 `.app :is(.data-medida,.botao-descanso)` |
| padding | `0 2px` | 3 | src/index.css:9 `.estado-sync>.detalhes-sync`<br>src/index.css:9 `.conta .estado-sync>.mensagem-sync`<br>src/index.css:37 `.busca-historico>small` |
| height | `26px` | 3 | src/index.css:9 `.interruptor-sync`<br>src/estilos/controles.css:134 `.app .interruptor-sync`<br>src/estilos/novo-visual.css:197 `.app .painel-modal > .topo-painel > .alca-painel` |
| border-radius | `20px` | 10 | src/index.css:9 `.interruptor-sync`<br>src/index.css:12 `.selo`<br>src/index.css:21 `.grupo-exercicios>summary small`<br>src/index.css:79 `.treino-em-andamento .andamento-treino`<br>src/index.css:85 `.treino-em-andamento .exercicio-recolhivel`<br>src/index.css:110 `.retomar-treino.retomar-compacto`<br>src/estilos/novo-visual.css:70 `.app progress`<br>src/estilos/novo-visual.css:71 `.app progress::-webkit-progress-bar`<br>src/estilos/novo-visual.css:72 `.app progress::-webkit-progress-value`<br>src/estilos/novo-visual.css:73 `.app progress::-moz-progress-bar` |
| height | `18px` | 4 | src/index.css:9 `.interruptor-sync::after`<br>src/estilos/controles.css:23 `.formulario .opcao-copia-exercicio > input`<br>src/estilos/controles.css:188 `.campos-adesivo input`<br>src/estilos/novo-visual.css:193 `.app .aplicar-proximas input` |
| padding | `12px` | 15 | src/index.css:10 `.comparacao-sync>section`<br>src/index.css:14 `.formulario input,.formulario select,.formulario textarea`<br>src/index.css:35 `.progressao`<br>src/index.css:47 `.ultimo-desempenho`<br>src/index.css:61 `.data-medida`<br>src/index.css:63 `.linha-feriado`<br>src/index.css:70 `.formulario-conta input`<br>src/index.css:93 `.treino-em-andamento .cabecalho-exercicio`<br>src/index.css:127 `.aviso-card`<br>src/index.css:127 `.texto-compartilhar>textarea`<br>src/index.css:143 `.formulario-cardio .campo-medida`<br>src/estilos/novo-visual.css:86 `.app :is(.item-catalogo,.selecionar-exercicio)`<br>src/estilos/novo-visual.css:186 `.app .tela-cardio .detalhe-cardio > p`<br>src/estilos/novo-visual.css:216 `.app .rolagem-opcoes .coluna-roda`<br>src/estilos/superficies.css:104 `:root[data-tema] .app .criador-card > .area-preview-card.com-foto` |
| min-height | `100dvh` | 2 | src/index.css:12 `.app`<br>src/index.css:71 `.entrada-conta` |
| padding-top | `env(safe-area-inset-top)` | 1 | src/index.css:12 `.app` |
| padding | `24px 22px 22px` | 1 | src/index.css:12 `.cabecalho` |
| height | `40px` | 4 | src/index.css:12 `.marca>span`<br>src/index.css:28 `.icone-acao`<br>src/index.css:39 `.icone-aviso-offline`<br>src/estilos/novo-visual.css:39 `.marca > span` |
| height | `48px` | 6 | src/index.css:12 `.botao-icone`<br>src/index.css:19 `.faixa-roda`<br>src/index.css:19 `.roda>button`<br>src/index.css:19 `.menu-ficha>summary`<br>src/index.css:38 `.linha-serie>button`<br>src/index.css:46 `.linha-serie>.menu-serie` |
| padding | `25px 22px calc(99px + env(safe-area-inset-bottom))` | 1 | src/index.css:12 `main` |
| height | `6px` | 4 | src/index.css:12 `.estado-rede i,.ponto`<br>src/index.css:63 `.atividade-hoje progress,.tela-cardio progress`<br>src/index.css:73 `.atividade-hoje .cartoes-movimento progress,.espaco-progresso`<br>src/index.css:111 `.sinal-treino` |
| padding | `25px 22px` | 1 | src/index.css:12 `.destaque` |
| border-radius | `22px` | 3 | src/index.css:12 `.destaque`<br>src/index.css:19 `.ficha-nova`<br>src/estilos/novo-visual.css:100 `.app .painel-centralizado` |
| padding | `0 16px` | 5 | src/index.css:12 `.botao-principal`<br>src/index.css:61 `.registro-medida dl`<br>src/index.css:63 `.detalhe-cardio`<br>src/estilos/novo-visual.css:148 `.app .privacidade-recolhida`<br>src/estilos/superficies.css:53 `:root[data-tema] .app .privacidade-recolhida` |
| padding | `19px 16px` | 1 | src/index.css:12 `.cartao` |
| border-radius | `17px` | 5 | src/index.css:12 `.cartao`<br>src/index.css:12 `.painel`<br>src/index.css:15 `.exercicio-treino`<br>src/index.css:18 `.capa-exercicio`<br>src/index.css:74 `.secao-config` |
| min-height | `162px` | 1 | src/index.css:12 `.cartao` |
| height | `22px` | 5 | src/index.css:12 `.cartao svg`<br>src/index.css:19 `.aplicar-proximas input`<br>src/index.css:68 `.incluir-fotos input`<br>src/index.css:73 `.cartoes-movimento>.cartao>svg`<br>src/estilos/controles.css:290 `:root[data-tema] .app .seletor-valores .aplicar-proximas input` |
| padding | `20px 4px` | 1 | src/index.css:12 `.nota` |
| padding | `10px 10px calc(10px + env(safe-area-inset-bottom))` | 1 | src/index.css:12 `.navegacao` |
| min-height | `54px` | 4 | src/index.css:12 `.navegacao button`<br>src/index.css:71 `.conta-entrada .formulario-conta input`<br>src/index.css:139 `.input-com-unidade input`<br>src/estilos/controles.css:154 `.perfil-opcional-cadastro > summary` |
| padding | `45px 12px 55px` | 1 | src/index.css:12 `.vazio` |
| height | `76px` | 1 | src/index.css:12 `.icone-vazio` |
| border-radius | `24px` | 7 | src/index.css:12 `.icone-vazio`<br>src/index.css:24 `.painel-modal.painel-centralizado`<br>src/index.css:30 `.filtro-musculos button`<br>src/index.css:100 `.musculos-catalogo>button`<br>src/estilos/novo-visual.css:59 `.app .destaque`<br>src/estilos/novo-visual.css:170 `.app`<br>src/estilos/novo-visual.css:171 `.app .painel-modal` |
| padding | `8px 14px` | 2 | src/index.css:12 `.selo`<br>src/index.css:75 `.sair-conta` |
| padding | `20px` | 4 | src/index.css:12 `.painel`<br>src/index.css:19 `.ficha-nova`<br>src/index.css:62 `.peso-resumo-medidas`<br>src/estilos/controles.css:162 `.aviso-confirmacao-conta` |
| padding | `14px 18px` | 2 | src/index.css:12 `.aviso-pwa`<br>src/index.css:19 `.treino-livre` |
| border-radius | `14px` | 29 | src/index.css:12 `.aviso-pwa`<br>src/index.css:19 `.icone-ficha`<br>src/index.css:19 `.menu-ficha .acoes`<br>src/index.css:21 `.grupo-exercicios`<br>src/index.css:28 `.finalizar-acoes>button`<br>src/index.css:33 `.calorias-resumo`<br>src/index.css:35 `.sugestao-carga`<br>src/index.css:35 `.exercicio-historico`<br>src/index.css:36 `.aviso-remocao`<br>src/index.css:41 `.finalizar-acoes .continuar-depois`<br>src/index.css:55 `.aviso-recorde`<br>src/index.css:61 `.tabela-comparacao`<br>src/index.css:62 `.grade-resumo-medidas>div`<br>src/index.css:68 `.arquivo-backup`<br>src/index.css:87 `.treino-em-andamento .miniatura-exercicio`<br>src/index.css:104 `.confirmar-catalogo`<br>src/index.css:125 `.modelos-card>button`<br>src/index.css:131 `.alternador-seletor`<br>src/estilos/controles.css:152 `.perfil-opcional-cadastro`<br>src/estilos/controles.css:162 `.aviso-confirmacao-conta`<br>src/estilos/controles.css:185 `.campos-adesivo`<br>src/estilos/novo-visual.css:44 `.app .botao-icone`<br>src/estilos/novo-visual.css:86 `.app :is(.item-catalogo,.selecionar-exercicio)`<br>src/estilos/novo-visual.css:92 `.app .campo-medida`<br>src/estilos/novo-visual.css:132 `.app .metricas-resumo > div`<br>src/estilos/novo-visual.css:135 `.app .grade-resumo-medidas > div`<br>src/estilos/novo-visual.css:154 `.app .backup-protecao`<br>src/estilos/novo-visual.css:216 `.app .rolagem-opcoes .coluna-roda`<br>src/estilos/superficies.css:61 `:root[data-tema] .app .privacidade-dados > .privacidade-grupo` |
| border-radius | `9px` | 4 | src/index.css:12 `.aviso-pwa button`<br>src/index.css:15 `.ajuste-numero button`<br>src/index.css:16 `.concluir-compacto`<br>src/estilos/controles.css:283 `:root[data-tema] .app .manter-tela > svg` |
| padding | `0 15px` | 1 | src/index.css:12 `.aviso-pwa button` |
| border-radius | `10px` | 19 | src/index.css:14 `.formulario input,.formulario select,.formulario textarea`<br>src/index.css:14 `.acoes button,.seletor-exercicios button`<br>src/index.css:30 `.biblioteca-cartao .acoes button`<br>src/index.css:35 `.aviso-recorde button`<br>src/index.css:36 `.aviso-remocao>button`<br>src/index.css:38 `.valor-serie`<br>src/index.css:59 `.titulo-andamento>button`<br>src/index.css:63 `.link-atividade`<br>src/index.css:71 `.campo-senha>div button`<br>src/index.css:75 `.sair-conta`<br>src/index.css:104 `.confirmar-catalogo>.botao-principal`<br>src/index.css:105 `.ampliar-catalogo>button`<br>src/index.css:116 `.abas-medidas>button`<br>src/index.css:126 `.opcoes-adesivo>button`<br>src/index.css:127 `.aviso-card`<br>src/index.css:132 `.opcao-seletor`<br>src/estilos/novo-visual.css:122 `.app .concluir-compacto`<br>src/estilos/novo-visual.css:144 `.app .icone-config`<br>src/estilos/novo-visual.css:180 `.app .item-ficha .acoes > button` |
| border-radius | `22px 22px 0 0` | 1 | src/index.css:14 `.painel-modal` |
| padding | `12px 18px` | 1 | src/index.css:14 `.painel-modal>.topo-painel>header` |
| padding | `20px 20px calc(24px + env(safe-area-inset-bottom))` | 1 | src/index.css:14 `.conteudo-modal` |
| padding | `10px 12px` | 8 | src/index.css:14 `.acoes button,.seletor-exercicios button`<br>src/index.css:53 `.andamento-treino>.manter-tela`<br>src/index.css:63 `.acoes-cardio button`<br>src/index.css:104 `.confirmar-catalogo`<br>src/index.css:105 `.ampliar-catalogo>button`<br>src/index.css:135 `.botao-atalho-numero`<br>src/estilos/controles.css:262 `.app .treino-em-andamento .conteudo-exercicio > .acoes > button`<br>src/estilos/novo-visual.css:176 `.app .item-ficha .conteudo-exercicio > .botao-descanso` |
| min-height | `60px` | 3 | src/index.css:14 `.abrir-ficha`<br>src/estilos/novo-visual.css:191 `.app .registro-medida > summary`<br>src/estilos/novo-visual.css:195 `.app .painel-modal > .topo-painel > header` |
| padding | `18px 0` | 2 | src/index.css:14 `.anexar`<br>src/index.css:19 `.aplicar-proximas` |
| padding | `8px 12px` | 3 | src/index.css:14 `.desfazer`<br>src/index.css:52 `.barra-fichas>button`<br>src/estilos/controles.css:185 `.campos-adesivo` |
| padding | `10px` | 3 | src/index.css:14 `.desfazer button`<br>src/estilos/novo-visual.css:127 `.app .finalizar-acoes > button`<br>src/estilos/novo-visual.css:180 `.app .item-ficha .acoes > button` |
| padding | `18px 12px` | 1 | src/index.css:15 `.exercicio-treino` |
| padding | `10px 0` | 3 | src/index.css:15 `.serie details summary,details.painel>summary`<br>src/index.css:47 `.linha-historico-serie`<br>src/index.css:61 `.registro-medida dl>div` |
| padding | `16px 12px` | 1 | src/index.css:16 `.cabecalho-exercicio` |
| min-height | `88px` | 1 | src/index.css:16 `.cabecalho-exercicio` |
| height | `64px` | 2 | src/index.css:16 `.miniatura-exercicio`<br>src/index.css:102 `.lista-catalogo .miniatura-exercicio` |
| height | `100%` | 3 | src/index.css:16 `.miniatura-exercicio img`<br>src/estilos/controles.css:191 `.preview-story > .foto-preview-story`<br>src/estilos/novo-visual.css:29 `html,body,#root` |
| padding | `0 12px 16px` | 2 | src/index.css:16 `.conteudo-exercicio`<br>src/index.css:88 `.treino-em-andamento .conteudo-exercicio` |
| padding | `7px` | 1 | src/index.css:16 `.serie-compacta.proxima-serie` |
| padding | `4px` | 4 | src/index.css:16 `.linha-serie input`<br>src/index.css:16 `.concluir-compacto`<br>src/index.css:18 `.abas-detalhe`<br>src/index.css:131 `.alternador-seletor` |
| padding | `14px 4px` | 2 | src/index.css:16 `.opcoes-serie>summary`<br>src/index.css:123 `.ultimo-concluido.ultimo-treino-atalho` |
| padding | `8px 2px 4px` | 1 | src/index.css:16 `.opcoes-serie .formulario` |
| padding | `8px 4px 0` | 1 | src/index.css:16 `.carga-por-lado` |
| padding-top | `14px` | 1 | src/index.css:17 `.item-ficha.exercicio-recolhivel .conteudo-exercicio` |
| min-height | `180px` | 2 | src/index.css:18 `.capa-exercicio`<br>src/index.css:127 `.area-preview-card` |
| border-radius | `16px` | 19 | src/index.css:18 `.abas-detalhe`<br>src/index.css:28 `.acao-treino`<br>src/index.css:31 `.secao-editor`<br>src/index.css:33 `.metricas-resumo>div`<br>src/index.css:35 `.preview-card`<br>src/index.css:35 `.aviso-recorde`<br>src/index.css:35 `.ultimo-concluido`<br>src/index.css:45 `.abas-treino`<br>src/index.css:61 `.registro-medida`<br>src/index.css:62 `.grafico-medidas-recolhivel`<br>src/index.css:74 `.secao-config>h2>button:focus-visible`<br>src/index.css:99 `.abas-catalogo`<br>src/index.css:102 `.lista-catalogo .miniatura-exercicio`<br>src/index.css:105 `.ampliar-catalogo`<br>src/index.css:122 `.evolucao-exercicio .metricas-resumo>div`<br>src/index.css:122 `.evolucao-exercicio .sessao-exercicio`<br>src/estilos/controles.css:88 `.app .abas-treino, .app .abas-medidas, .app .abas-catalogo, .app .alternador-seletor`<br>src/estilos/controles.css:271 `:root[data-tema] .app :is(.abas-treino,.abas-medidas,.abas-catalogo,.alternador-seletor)`<br>src/estilos/superficies.css:101 `:root[data-tema] .app .criador-card > .area-preview-card` |
| padding | `5px 2px` | 1 | src/index.css:18 `.abas-detalhe button` |
| padding-left | `24px` | 1 | src/index.css:18 `.passos-exercicio` |
| padding | `16px 0 16px 8px` | 1 | src/index.css:18 `.passos-exercicio li` |
| height | `5px` | 5 | src/index.css:19 `.painel-modal::before`<br>src/index.css:27 `.alca-painel>span`<br>src/index.css:83 `.barra-sessao`<br>src/index.css:100 `.musculos-catalogo::-webkit-scrollbar`<br>src/estilos/novo-visual.css:223 `.app .andamento-treino .barra-sessao` |
| border-radius | `6px` | 2 | src/index.css:19 `.painel-modal::before`<br>src/index.css:27 `.alca-painel>span` |
| border-radius | `28px 28px 0 0` | 2 | src/index.css:19 `.painel-modal`<br>src/index.css:27 `.alca-painel` |
| padding | `10px 20px` | 1 | src/index.css:19 `.painel-modal>.topo-painel>header` |
| height | `240px` | 2 | src/index.css:19 `.janela-roda`<br>src/index.css:19 `.roda` |
| padding | `96px 0` | 1 | src/index.css:19 `.roda` |
| border-radius | `0` | 17 | src/index.css:19 `.valor-serie`<br>src/index.css:43 `.topo-painel>.alca-painel`<br>src/index.css:49 `.sessao-exercicio>summary>span>small`<br>src/index.css:74 `.conteudo-config>.painel`<br>src/index.css:92 `.treino-em-andamento .conteudo-exercicio>.ultimo-desempenho`<br>src/index.css:123 `.ultimo-concluido.ultimo-treino-atalho`<br>src/index.css:127 `.preview-transparente>.preview-card`<br>src/estilos/controles.css:175 `.criador-card > .area-preview-card > .preview-card`<br>src/estilos/controles.css:192 `.criador-card > .preview-story > .preview-card`<br>src/estilos/novo-visual.css:141 `.app .config-lista .secao-config`<br>src/estilos/novo-visual.css:225 `.app .treino-em-andamento .ultimo-desempenho`<br>src/estilos/contraste-claro.css:41 `:root[data-tema=claro] .app .ultimo-concluido.ultimo-treino-atalho`<br>src/estilos/superficies.css:47 `:root[data-tema] .app .config-lista .secao-config`<br>src/estilos/superficies.css:50 `:root[data-tema] .app .ultimo-concluido.ultimo-treino-atalho`<br>src/estilos/superficies.css:55 `:root[data-tema] .app .privacidade-recolhida > .painel.privacidade-dados`<br>src/estilos/superficies.css:95 `:root[data-tema] .app .descanso.descanso-popup`<br>src/estilos/superficies.css:105 `:root[data-tema] .app .criador-card > .area-preview-card > .preview-card` |
| padding | `0 4px` | 2 | src/index.css:19 `.valor-serie`<br>src/index.css:38 `.linha-serie>button` |
| gap | `0` | 3 | src/index.css:19 `.lista-tipos`<br>src/index.css:76 `.conteudo-config>.conta`<br>src/index.css:102 `.lista-catalogo` |
| min-height | `90px` | 2 | src/index.css:19 `.lista-tipos>button`<br>src/index.css:31 `.editor-exercicio textarea` |
| padding | `16px 4px` | 1 | src/index.css:19 `.lista-tipos>button` |
| padding | `12px 14px` | 3 | src/index.css:19 `.botao-descanso`<br>src/index.css:19 `.iniciar-ficha`<br>src/estilos/novo-visual.css:48 `.app .aviso-modo-visitante` |
| border-radius | `23px` | 1 | src/index.css:19 `.retomar-treino` |
| padding | `22px` | 1 | src/index.css:19 `.retomar-treino` |
| padding | `12px 15px` | 1 | src/index.css:19 `.retomar-treino button` |
| height | `56px` | 2 | src/index.css:19 `.icone-ficha`<br>src/index.css:106 `.lista-catalogo .miniatura-exercicio` |
| min-height | `76px` | 7 | src/index.css:19 `.treino-livre`<br>src/index.css:28 `.acao-treino>summary`<br>src/index.css:143 `.formulario-cardio .basicos-cardio>.campo-medida:first-child`<br>src/index.css:143 `.formulario-cardio .campo-medida`<br>src/estilos/novo-visual.css:38 `.app > .cabecalho`<br>src/estilos/novo-visual.css:143 `.app .secao-config > h2 > button`<br>src/estilos/novo-visual.css:184 `.app .tela-cardio .registro-medida > summary` |
| min-height | `56px` | 2 | src/index.css:21 `.grupo-exercicios>summary`<br>src/index.css:144 `.digitar-duracao input` |
| padding | `4px 9px` | 1 | src/index.css:21 `.grupo-exercicios>summary small` |
| padding | `0 10px 10px` | 2 | src/index.css:21 `.grupo-exercicios .seletor-exercicios`<br>src/index.css:32 `.conteudo-grupo-biblioteca` |
| padding | `18px 20px` | 3 | src/index.css:24 `.painel-centralizado>.topo-painel>header`<br>src/index.css:56 `.exercicio-historico-recolhivel>summary`<br>src/index.css:110 `.retomar-treino.retomar-compacto` |
| padding | `20px 20px 24px` | 1 | src/index.css:24 `.painel-centralizado .conteudo-modal` |
| padding | `10px 16px` | 2 | src/index.css:25 `.salvar-cabecalho`<br>src/index.css:104 `.confirmar-catalogo>.botao-principal` |
| height | `44px` | 7 | src/index.css:26 `.painel-modal>.topo-painel>header .salvar-cabecalho`<br>src/index.css:33 `.alca-painel`<br>src/index.css:46 `.linha-serie>.tipo-serie`<br>src/index.css:50 `.painel-modal>.topo-painel>header>.botao-icone`<br>src/index.css:71 `.marca-entrada>span`<br>src/index.css:71 `.campo-senha>div button`<br>src/estilos/novo-visual.css:44 `.app .botao-icone` |
| height | `32px` | 1 | src/index.css:27 `.alca-painel` |
| min-height | `32px` | 1 | src/index.css:27 `.alca-painel` |
| padding | `14px 16px` | 5 | src/index.css:28 `.acao-treino>summary`<br>src/index.css:71 `.conta-entrada .formulario-conta input`<br>src/estilos/novo-visual.css:38 `.app > .cabecalho`<br>src/estilos/novo-visual.css:126 `.app .finalizar-acoes`<br>src/estilos/superficies.css:88 `:root[data-tema] .app .resumo-treino-compacto .andamento-treino` |
| padding | `4px 16px 16px` | 1 | src/index.css:28 `.acao-treino>.formulario` |
| min-height | `100px` | 1 | src/index.css:28 `.observacao-treino textarea` |
| min-height | `52px` | 2 | src/index.css:28 `.finalizar-acoes>button`<br>src/index.css:71 `.conta-entrada .formulario-conta .botao-principal` |
| padding | `10px 14px` | 6 | src/index.css:30 `.filtro-musculos button`<br>src/index.css:36 `.aviso-remocao`<br>src/index.css:36 `.aviso-remocao>button`<br>src/index.css:52 `.ultimo-concluido>.botao-secundario`<br>src/index.css:61 `.nova-medida`<br>src/index.css:61 `.lembrete-medidas button` |
| gap | `18px` | 5 | src/index.css:31 `.secao-editor`<br>src/index.css:71 `.conta-entrada .formulario-conta`<br>src/index.css:76 `.conteudo-config .conta-sessao`<br>src/index.css:118 `.evolucao-medidas`<br>src/index.css:119 `.editor-medidas-grupos` |
| padding | `18px 14px` | 3 | src/index.css:31 `.secao-editor`<br>src/index.css:33 `.metricas-resumo>div`<br>src/estilos/novo-visual.css:66 `.app .cartao` |
| padding | `0 8px` | 1 | src/index.css:31 `.secao-editor legend` |
| padding-bottom | `146px` | 1 | src/index.css:34 `.resumo-treino` |
| padding | `12px 20px` | 1 | src/index.css:34 `.acoes-resumo-fixas` |
| min-height | `40px` | 2 | src/index.css:34 `.acoes-resumo-fixas .botao-secundario`<br>src/estilos/novo-visual.css:224 `.app .treino-em-andamento .andamento-treino .manter-tela` |
| height | `220px` | 1 | src/index.css:35 `.grafico-evolucao` |
| padding | `0 16px 16px` | 2 | src/index.css:35 `.historico-series`<br>src/estilos/novo-visual.css:188 `.app .tela-cardio .acoes-medida` |
| min-height | `72px` | 3 | src/index.css:35 `.exercicio-historico`<br>src/index.css:61 `.escolher-comparacao`<br>src/estilos/controles.css:288 `:root[data-tema] .app .seletor-valores .aplicar-proximas` |
| padding | `24px` | 1 | src/index.css:36 `.historico-vazio` |
| padding | `0 14px` | 2 | src/index.css:39 `.aviso-offline button`<br>src/estilos/controles.css:152 `.perfil-opcional-cadastro` |
| height | `36px` | 3 | src/index.css:39 `.icone-aviso-offline`<br>src/index.css:52 `.treino-livre>svg:first-child`<br>src/estilos/novo-visual.css:77 `.app .icone-ficha` |
| padding | `0 10px` | 1 | src/index.css:39 `.aviso-offline button` |
| padding | `5px` | 6 | src/index.css:45 `.abas-treino`<br>src/index.css:99 `.abas-catalogo`<br>src/index.css:116 `.abas-medidas`<br>src/index.css:125 `.amostra-card`<br>src/estilos/controles.css:88 `.app .abas-treino, .app .abas-medidas, .app .abas-catalogo, .app .alternador-seletor`<br>src/estilos/controles.css:271 `:root[data-tema] .app :is(.abas-treino,.abas-medidas,.abas-catalogo,.alternador-seletor)` |
| padding-top | `16px` | 3 | src/index.css:46 `.opcoes-serie>.formulario`<br>src/estilos/controles.css:218 `.privacidade-grupo`<br>src/estilos/novo-visual.css:192 `.app .aplicar-proximas` |
| padding | `4px 0 8px` | 1 | src/index.css:47 `.detalhe-historico>.nota-resumo` |
| height | `28px` | 3 | src/index.css:47 `.linha-historico-serie>span:first-child`<br>src/index.css:102 `.lista-catalogo .miniatura-exercicio svg`<br>src/estilos/controles.css:181 `.criador-card .amostra-minimalista > span:first-child` |
| min-height | `80px` | 1 | src/index.css:52 `.treino-livre` |
| padding | `0 20px 14px` | 1 | src/index.css:56 `.exercicio-historico-recolhivel>div` |
| padding | `16px 20px` | 1 | src/index.css:57 `details.painel.exercicio-historico-recolhivel>summary` |
| padding | `8px 10px` | 4 | src/index.css:59 `.titulo-andamento>button`<br>src/index.css:63 `.link-atividade`<br>src/estilos/controles.css:276 `:root[data-tema] .app .treino-em-andamento .andamento-treino .manter-tela:not(:disabled)`<br>src/estilos/controles.css:295 `:root[data-tema] .app .treino-em-andamento .ferramentas-exercicio > .botao-descanso` |
| border-radius | `27px 27px 0 0` | 1 | src/index.css:60 `.painel-modal:not(.painel-centralizado)>.topo-painel` |
| height | `fit-content` | 1 | src/index.css:60 `.painel-modal.painel-centralizado[open]` |
| gap | `20px` | 6 | src/index.css:61 `.tela-medidas`<br>src/estilos/controles.css:170 `.conta-entrada .formulario-conta`<br>src/estilos/novo-visual.css:89 `.app :is(.formulario,.confirmacao-app,.editor-medidas-grupos)`<br>src/estilos/superficies.css:34 `:root[data-tema] .app :is(.formulario,.confirmacao-app,.editor-medidas-grupos)`<br>src/estilos/superficies.css:35 `:root[data-tema] .app .tela-medidas`<br>src/estilos/superficies.css:55 `:root[data-tema] .app .privacidade-recolhida > .painel.privacidade-dados` |
| min-height | `82px` | 2 | src/index.css:61 `.campo-medida`<br>src/index.css:74 `.secao-config>h2>button` |
| padding | `14px 12px` | 2 | src/index.css:61 `.campo-medida`<br>src/index.css:62 `.grade-resumo-medidas>div` |
| min-height | `70px` | 2 | src/index.css:61 `.registro-medida>summary`<br>src/index.css:62 `.grafico-medidas-recolhivel>summary` |
| padding | `12px 10px` | 2 | src/index.css:61 `.tabela-comparacao>div`<br>src/index.css:125 `.modelos-card>button` |
| padding | `18px` | 7 | src/index.css:61 `.lembrete-medidas`<br>src/index.css:79 `.treino-em-andamento .andamento-treino`<br>src/index.css:121 `.tela-evolucao .historico-cartao`<br>src/estilos/controles.css:16 `.aviso-backup`<br>src/estilos/novo-visual.css:54 `.app .painel`<br>src/estilos/novo-visual.css:206 `.app .conteudo-config > .painel`<br>src/estilos/novo-visual.css:218 `.app .treino-em-andamento .andamento-treino` |
| padding | `0 14px 14px` | 2 | src/index.css:62 `.conteudo-grafico-medidas`<br>src/estilos/novo-visual.css:116 `.app .conteudo-exercicio` |
| padding | `14px 0 0` | 1 | src/index.css:63 `.cardio-planejado .acoes-medida` |
| padding | `4px 8px` | 2 | src/index.css:64 `.rolagem-opcoes .roda>button`<br>src/estilos/superficies.css:76 `:root[data-tema] .app .privacidade-contagem` |
| padding | `env(safe-area-inset-top) 28px env(safe-area-inset-bottom)` | 1 | src/index.css:71 `.entrada-conta` |
| gap | `11px` | 1 | src/index.css:71 `.marca-entrada` |
| padding | `36px 0 0` | 1 | src/index.css:71 `.marca-entrada` |
| padding-block | `42px 32px` | 1 | src/index.css:71 `.entrada-conta .conteudo-entrada` |
| padding-right | `56px` | 2 | src/index.css:71 `.campo-senha>div input`<br>src/index.css:72 `.formulario-conta .campo-senha>div input` |
| padding-top | `22px` | 1 | src/index.css:71 `.marca-entrada` |
| padding-block | `28px 20px` | 1 | src/index.css:71 `.entrada-conta .conteudo-entrada` |
| min-height | `190px` | 1 | src/index.css:73 `.cartoes-movimento>.cartao` |
| padding | `18px 15px 16px` | 1 | src/index.css:73 `.cartoes-movimento>.cartao` |
| padding | `8px 0 8px 12px` | 1 | src/index.css:73 `.atividade-hoje .link-atividade` |
| height | `38px` | 1 | src/index.css:74 `.icone-config` |
| padding | `4px 16px 20px` | 2 | src/index.css:74 `.conteudo-config:not([hidden])`<br>src/estilos/novo-visual.css:147 `.app .conteudo-config:not([hidden])` |
| gap | `2px` | 1 | src/index.css:75 `.conta-rodape` |
| padding | `18px 16px 20px` | 1 | src/index.css:76 `.conteudo-config:not([hidden])` |
| padding-top | `6px` | 1 | src/index.css:76 `.conteudo-config .ajuda-conta` |
| padding | `18px 0 4px` | 1 | src/index.css:76 `.saida-config` |
| padding | `8px 0 0` | 2 | src/index.css:84 `.treino-em-andamento .andamento-treino .manter-tela`<br>src/estilos/novo-visual.css:224 `.app .treino-em-andamento .andamento-treino .manter-tela` |
| min-height | `96px` | 1 | src/index.css:86 `.treino-em-andamento .cabecalho-exercicio` |
| height | `52px` | 1 | src/index.css:87 `.treino-em-andamento .miniatura-exercicio` |
| padding | `0 5px` | 1 | src/index.css:88 `.treino-em-andamento .ajuda-no-treino` |
| padding | `8px 2px` | 1 | src/index.css:89 `.treino-em-andamento .conteudo-exercicio>.botao-descanso` |
| padding-top | `4px` | 3 | src/index.css:90 `.treino-em-andamento .cabecalho-series`<br>src/index.css:143 `.formulario-cardio .opcionais-cardio`<br>src/estilos/controles.css:232 `.backup-outros-formatos` |
| padding-bottom | `10px` | 1 | src/index.css:90 `.treino-em-andamento .cabecalho-series` |
| padding | `12px 2px 0` | 1 | src/index.css:92 `.treino-em-andamento .conteudo-exercicio>.ultimo-desempenho` |
| padding-left | `8px` | 1 | src/index.css:93 `.treino-em-andamento .conteudo-exercicio` |
| padding-right | `8px` | 1 | src/index.css:93 `.treino-em-andamento .conteudo-exercicio` |
| padding | `4px 3px 18px` | 1 | src/index.css:100 `.musculos-catalogo` |
| padding | `9px 15px` | 1 | src/index.css:100 `.musculos-catalogo>button` |
| padding | `5px 0` | 1 | src/index.css:102 `.item-catalogo` |
| min-height | `94px` | 1 | src/index.css:102 `.abrir-exercicio-catalogo,.selecionar-exercicio` |
| padding | `12px 4px` | 1 | src/index.css:102 `.abrir-exercicio-catalogo,.selecionar-exercicio` |
| padding | `12px 8px` | 2 | src/index.css:103 `.selecionar-exercicio`<br>src/estilos/controles.css:64 `.app .historico-cartao > .acoes > button` |
| height | `24px` | 1 | src/index.css:103 `.marcador-catalogo` |
| border-radius | `7px` | 1 | src/index.css:103 `.marcador-catalogo` |
| padding | `24px 12px` | 1 | src/index.css:103 `.vazio-catalogo` |
| height | `4px` | 1 | src/index.css:112 `.retomar-progresso>.barra-sessao` |
| padding | `11px 14px` | 1 | src/index.css:113 `.retomar-treino.retomar-compacto>button` |
| padding | `9px 4px` | 1 | src/index.css:116 `.abas-medidas>button` |
| padding-left | `16px` | 1 | src/index.css:117 `.par-resumo-medida>dl>div+div` |
| min-height | `78px` | 2 | src/index.css:119 `.editor-medidas-grupos .campo-peso`<br>src/index.css:123 `.ultimo-concluido.ultimo-treino-atalho` |
| padding | `16px 14px` | 2 | src/index.css:122 `.evolucao-exercicio .metricas-resumo>div`<br>src/estilos/novo-visual.css:143 `.app .secao-config > h2 > button` |
| height | `42px` | 1 | src/index.css:123 `.ultimo-treino-atalho>.icone-ultimo-treino` |
| padding | `10px 0 10px 6px` | 1 | src/index.css:123 `.ultimo-treino-atalho>.acao-ultimo-treino` |
| padding | `3px 3px 14px` | 1 | src/index.css:125 `.modelos-card` |
| min-height | `124px` | 1 | src/index.css:125 `.modelos-card>button` |
| border-radius | `5px` | 1 | src/index.css:125 `.amostra-card` |
| height | `3px` | 1 | src/index.css:125 `.amostra-card>span` |
| border-radius | `2px` | 1 | src/index.css:125 `.amostra-card>span` |
| min-height | `150px` | 1 | src/index.css:127 `.texto-compartilhar>textarea` |
| padding | `10px 0 6px` | 1 | src/index.css:137 `.campo-digitar-numero` |
| padding | `12px 64px 12px 16px` | 1 | src/index.css:139 `.input-com-unidade input` |
| padding | `13px 12px` | 1 | src/index.css:142 `.resumo-semanal-cardio .metricas-resumo>div` |
| padding | `14px 0` | 2 | src/index.css:143 `.formulario-cardio .opcionais-cardio>summary`<br>src/estilos/superficies.css:79 `:root[data-tema] .app .privacidade-recolhida > summary` |
| min-height | `var(--controle-altura)` | 4 | src/estilos/controles.css:2 `.app .botao-destrutivo`<br>src/estilos/controles.css:35 `.app .botao-principal, .app .botao-secundario`<br>src/estilos/controles.css:64 `.app .historico-cartao > .acoes > button`<br>src/estilos/controles.css:268 `:root[data-tema] .app :is(.botao-principal,.botao-secundario,.botao-destrutivo):not(:disabled)` |
| border-radius | `var(--controle-raio)` | 6 | src/estilos/controles.css:2 `.app .botao-destrutivo`<br>src/estilos/controles.css:35 `.app .botao-principal, .app .botao-secundario`<br>src/estilos/controles.css:268 `:root[data-tema] .app :is(.botao-principal,.botao-secundario,.botao-destrutivo):not(:disabled)`<br>src/estilos/controles.css:276 `:root[data-tema] .app .treino-em-andamento .andamento-treino .manter-tela:not(:disabled)`<br>src/estilos/controles.css:288 `:root[data-tema] .app .seletor-valores .aplicar-proximas`<br>src/estilos/controles.css:295 `:root[data-tema] .app .treino-em-andamento .ferramentas-exercicio > .botao-descanso` |
| min-height | `18px` | 1 | src/estilos/controles.css:23 `.formulario .opcao-copia-exercicio > input` |
| padding | `10px 6px` | 2 | src/estilos/controles.css:99 `.app .abas-treino > button, .app .abas-medidas > button, .app .abas-catalogo > button, .app .alternador-seletor > button`<br>src/estilos/controles.css:177 `.criador-card .modelos-card > button` |
| padding-bottom | `14px` | 1 | src/estilos/controles.css:153 `.perfil-opcional-cadastro[open]` |
| height | `8px` | 1 | src/estilos/controles.css:156 `.perfil-opcional-cadastro > summary::after` |
| padding-top | `max(28px, env(safe-area-inset-top))` | 1 | src/estilos/controles.css:166 `.app.entrada-conta` |
| padding-bottom | `max(24px, env(safe-area-inset-bottom))` | 1 | src/estilos/controles.css:166 `.app.entrada-conta` |
| padding-top | `0` | 1 | src/estilos/controles.css:167 `.entrada-conta > .marca-entrada` |
| padding-block | `40px 16px` | 1 | src/estilos/controles.css:169 `.entrada-conta > .conteudo-entrada` |
| gap | `4px 16px` | 1 | src/estilos/controles.css:185 `.campos-adesivo` |
| padding | `0 6px` | 1 | src/estilos/controles.css:186 `.campos-adesivo legend` |
| padding | `24px 16px` | 1 | src/estilos/controles.css:189 `.criador-card > .preview-story` |
| padding-bottom | `56px` | 1 | src/estilos/controles.css:194 `.criador-card > .preview-story.layout-faixa` |
| min-height | `240px` | 1 | src/estilos/controles.css:202 `.tela-evolucao > .conteudo-alternado` |
| padding | `2px 9px` | 1 | src/estilos/controles.css:222 `.privacidade-contagem` |
| padding-block | `8px` | 1 | src/estilos/controles.css:231 `.backup-config .opcao-fotos-backup` |
| height | `30px` | 1 | src/estilos/controles.css:283 `:root[data-tema] .app .manter-tela > svg` |
| padding | `6px` | 1 | src/estilos/controles.css:283 `:root[data-tema] .app .manter-tela > svg` |
| height | `auto` | 4 | src/estilos/novo-visual.css:32 `.app`<br>src/estilos/novo-visual.css:50 `.app > .navegacao`<br>src/estilos/superficies.css:76 `:root[data-tema] .app .privacidade-contagem`<br>src/estilos/superficies.css:105 `:root[data-tema] .app .criador-card > .area-preview-card > .preview-card` |
| padding | `env(safe-area-inset-top) 0 0` | 1 | src/estilos/novo-visual.css:32 `.app` |
| padding | `18px 16px 28px` | 1 | src/estilos/novo-visual.css:45 `.app > main#conteudo` |
| min-height | `calc(72px + env(safe-area-inset-bottom))` | 1 | src/estilos/novo-visual.css:50 `.app > .navegacao` |
| padding | `8px 10px calc(8px + env(safe-area-inset-bottom))` | 1 | src/estilos/novo-visual.css:50 `.app > .navegacao` |
| padding | `28px 22px 24px` | 1 | src/estilos/novo-visual.css:59 `.app .destaque` |
| height | `7px` | 1 | src/estilos/novo-visual.css:70 `.app progress` |
| min-height | `84px` | 1 | src/estilos/novo-visual.css:92 `.app .campo-medida` |
| min-height | `58px` | 1 | src/estilos/novo-visual.css:95 `.app :is(.data-medida,.botao-descanso)` |
| border-radius | `24px 24px 0 0` | 1 | src/estilos/novo-visual.css:99 `.app .painel-modal` |
| padding | `20px 18px max(22px,env(safe-area-inset-bottom))` | 1 | src/estilos/novo-visual.css:105 `.app .conteudo-modal` |
| padding-top | `12px` | 5 | src/estilos/novo-visual.css:107 `.app .coluna-roda`<br>src/estilos/novo-visual.css:156 `.app .backup-formatos-acoes`<br>src/estilos/novo-visual.css:179 `.app .item-ficha .conteudo-exercicio > .acoes`<br>src/estilos/novo-visual.css:198 `.app .painel-centralizado > .topo-painel > header`<br>src/estilos/novo-visual.css:227 `.app .treino-em-andamento .conteudo-exercicio > .acoes` |
| padding-bottom | `100px` | 1 | src/estilos/novo-visual.css:128 `.app .treino-em-andamento` |
| padding | `16px 0 0` | 1 | src/estilos/novo-visual.css:130 `.app .acoes-resumo-fixas` |
| height | `34px` | 1 | src/estilos/novo-visual.css:144 `.app .icone-config` |
| padding | `0 0 20px` | 1 | src/estilos/novo-visual.css:150 `.app .privacidade-recolhida > .painel` |
| padding-block | `18px` | 2 | src/estilos/novo-visual.css:151 `.app .privacidade-grupo`<br>src/estilos/superficies.css:54 `:root[data-tema] .app .privacidade-recolhida > summary` |
| padding-inline | `14px` | 1 | src/estilos/novo-visual.css:173 `.app .conteudo-modal` |
| padding | `4px 14px 16px` | 1 | src/estilos/novo-visual.css:175 `.app .item-ficha .conteudo-exercicio` |
| padding | `8px 18px 12px` | 1 | src/estilos/novo-visual.css:195 `.app .painel-modal > .topo-painel > header` |
| min-height | `26px` | 1 | src/estilos/novo-visual.css:197 `.app .painel-modal > .topo-painel > .alca-painel` |
| padding-top | `24px` | 1 | src/estilos/novo-visual.css:199 `.app .painel-modal > .conteudo-modal` |
| gap | `24px` | 1 | src/estilos/novo-visual.css:203 `.app .confirmacao-app` |
| padding-block | `14px` | 1 | src/estilos/novo-visual.css:204 `.app .secao-config > h2 > button` |
| padding | `12px 16px 24px` | 1 | src/estilos/novo-visual.css:205 `.app .conteudo-config:not([hidden])` |
| height | `144px` | 1 | src/estilos/novo-visual.css:213 `.app .rolagem-opcoes .janela-roda,.app .rolagem-opcoes .roda` |
| padding-block | `48px` | 1 | src/estilos/novo-visual.css:214 `.app .rolagem-opcoes .roda` |
| border-radius | `var(--superficie-raio)` | 1 | src/estilos/superficies.css:14 `:root[data-tema] .app :is(.painel,.cartao,.painel.ficha-cartao,.registro-medida,.historico-cartao,.config-lista,.peso-resumo-medidas,.par-resumo-medida,.evolucao-medidas,.privacidade-recolhida,.grade-resumo-medidas > div)` |
| border-radius | `var(--campo-raio)` | 1 | src/estilos/superficies.css:27 `:root[data-tema] .app :is(.metricas-resumo > div,.campo-medida,.data-medida,.calorias-resumo,.arquivo-backup)` |
| padding | `4px 0 0` | 1 | src/estilos/superficies.css:49 `:root[data-tema] .app .conteudo-config > .painel` |
| padding | `20px 16px 24px` | 1 | src/estilos/superficies.css:51 `:root[data-tema] .app .conteudo-config:not([hidden])` |
| padding | `12px 0 24px` | 1 | src/estilos/superficies.css:55 `:root[data-tema] .app .privacidade-recolhida > .painel.privacidade-dados` |
| padding | `20px 0` | 1 | src/estilos/superficies.css:77 `:root[data-tema] .app .mais-exercicios` |
| gap | `10px 12px` | 1 | src/estilos/superficies.css:88 `:root[data-tema] .app .resumo-treino-compacto .andamento-treino` |
| min-height | `160px` | 1 | src/estilos/superficies.css:101 `:root[data-tema] .app .criador-card > .area-preview-card` |
| padding-bottom | `0` | 1 | src/estilos/superficies.css:111 `:root[data-tema] .app .resumo-treino` |
| padding-bottom | `var(--reserva-acoes, 65px)` | 1 | src/estilos/superficies.css:113 `:root[data-tema] .app .treino-em-andamento` |
| padding-top | `8px` | 1 | src/estilos/superficies.css:115 `:root[data-tema] .app .ferramentas-exercicio` |
| padding-block | `6px` | 1 | src/estilos/superficies.css:116 `:root[data-tema] .app .treino-em-andamento .ferramentas-exercicio > .botao-descanso` |
| padding | `8px 4px` | 1 | src/estilos/superficies.css:117 `:root[data-tema] .app .treino-em-andamento .ferramentas-exercicio > .ajuda-no-treino` |

## Apêndice H — geometria de alvos abaixo de 44×44

| Tema | Tela | Elemento | Texto | Largura | Altura | Interpretação |
| --- | --- | --- | --- | --- | --- | --- |
| escuro | registrar-medidas | `button.alca-painel` | Arraste para baixo para fechar o painel | 388.00 | 26.00 | alternativa Fechar disponível; meta de toque não atingida |
| escuro | treino-ativo | `button.menu-serie` | Opções da série 1 | 32.00 | 48.00 | alvo estreito; propor Fase 3 |
| escuro | treino-ativo | `button.menu-serie` | Opções da série 2 | 32.00 | 48.00 | alvo estreito; propor Fase 3 |
| escuro | treino-ativo | `button.menu-serie` | Opções da série 3 | 32.00 | 48.00 | alvo estreito; propor Fase 3 |
| escuro | seletor-valores-serie | `input` |  | 22.00 | 22.00 | conferir label acionável; não condenar input isolado |
| escuro | config-backup | `input` | Incluir fotos no backup | 1.00 | 1.00 | conferir label acionável; não condenar input isolado |
| claro | registrar-medidas | `button.alca-painel` | Arraste para baixo para fechar o painel | 388.00 | 26.00 | alternativa Fechar disponível; meta de toque não atingida |
| claro | treino-ativo | `button.menu-serie` | Opções da série 1 | 32.00 | 48.00 | alvo estreito; propor Fase 3 |
| claro | treino-ativo | `button.menu-serie` | Opções da série 2 | 32.00 | 48.00 | alvo estreito; propor Fase 3 |
| claro | treino-ativo | `button.menu-serie` | Opções da série 3 | 32.00 | 48.00 | alvo estreito; propor Fase 3 |
| claro | seletor-valores-serie | `input` |  | 22.00 | 22.00 | conferir label acionável; não condenar input isolado |
| claro | config-backup | `input` | Incluir fotos no backup | 1.00 | 1.00 | conferir label acionável; não condenar input isolado |

## Apêndice I — classes e candidatos de uso

### CSS sem ocorrência literal nas fontes JS/JSX
- `ajuste-numero`
- `amostra-adesivo`
- `amostra-foto`
- `amostra-minimalista`
- `biblioteca-cabecalho`
- `biblioteca-cartao`
- `biblioteca-grupos`
- `campos-adesivo`
- `comparacao-sync`
- `conflito-sync`
- `conta-rodape`
- `conteudo-grafico-medidas`
- `conteudo-grupo-biblioteca`
- `exercicio-cartao`
- `foto-preview-story`
- `grafico-carga`
- `grafico-medidas`
- `grafico-medidas-recolhivel`
- `instalacao`
- `layout-coluna`
- `layout-faixa`
- `layouts-adesivo`
- `lista-grupos-exercicios`
- `observacao-treino`
- `preview-adesivo-escura`
- `preview-story`
- `preview-transparente`
- `recharts-cartesian-axis-tick-value`
- `recharts-cartesian-grid`
- `recharts-default-tooltip`
- `recharts-dot`
- `recharts-line-curve`
- `recharts-tooltip-item`
- `rolagem`
- `seletor-exercicios`
- `texto-escura`

### JSX sem classe exata no CSS
- `amostra-`
- `digitar`
- `instalado`
- `nao-instalado`
- `peso`
- `preview-adesivo-`
- `rolar`

Listas completas das classes de ambos os lados em INVENTARIO-VISUAL.json. Nenhuma dessas classes foi removida.

## Apêndice J — inline e atributos visuais no JSX

| Arquivo:linha | Atributo | Valor |
| --- | --- | --- |
| src/componentes/RevisarDuplicatas.tsx:35 | style | `{{whiteSpace:'pre-line'}}` |
| src/componentes/GraficoCarga.tsx:4 | margin | `{{ top: 12, right: 12, bottom: 4, left: 0 }}` |
| src/componentes/GraficoCarga.tsx:4 | tick | `{{ fill: '#96ad9c', fontSize: 10 }}` |
| src/componentes/GraficoCarga.tsx:4 | tick | `{{ fill: '#96ad9c', fontSize: 10 }}` |
| src/componentes/GraficoCarga.tsx:4 | contentStyle | `{{ background: '#17251c', border: '1px solid #506745', borderRadius: 12 }}` |
| src/componentes/GraficoAtividade.tsx:5 | tick | `{{fill:'#96ad9c',fontSize:9}}` |
| src/componentes/GraficoAtividade.tsx:5 | tick | `{{fill:'#96ad9c',fontSize:10}}` |
| src/componentes/GraficoAtividade.tsx:5 | contentStyle | `{{background:'#17251c',border:'1px solid #506745'}}` |
| src/App.tsx:66 | size | `{25}` |
| src/App.tsx:66 | strokeWidth | `{1.7}` |
| src/App.tsx:72 | size | `{25}` |
| src/App.tsx:72 | strokeWidth | `{1.7}` |
| src/App.tsx:82 | size | `{22}` |
| src/App.tsx:83 | size | `{20}` |
| src/App.tsx:83 | size | `{20}` |
| src/App.tsx:83 | size | `{22}` |
| src/componentes/AjudaExercicio.tsx:32 | size | `{60}` |
| src/componentes/AtividadeHoje.tsx:28 | size | `{16}` |
| src/componentes/AtividadeHoje.tsx:28 | size | `{16}` |
| src/componentes/AvisosPwa.tsx:16 | size | `{20}` |
| src/componentes/AvisosPwa.tsx:20 | size | `{16}` |
| src/componentes/BackupConfiguracoes.tsx:34 | size | `{20}` |
| src/componentes/BackupConfiguracoes.tsx:39 | size | `{18}` |
| src/componentes/BackupConfiguracoes.tsx:41 | size | `{24}` |
| src/componentes/BackupConfiguracoes.tsx:43 | size | `{17}` |
| src/componentes/BackupConfiguracoes.tsx:43 | size | `{17}` |
| src/componentes/BackupConfiguracoes.tsx:49 | size | `{19}` |
| src/componentes/BackupConfiguracoes.tsx:49 | size | `{17}` |
| src/componentes/BackupConfiguracoes.tsx:51 | size | `{17}` |
| src/componentes/BackupConfiguracoes.tsx:52 | size | `{18}` |
| src/componentes/BackupConfiguracoes.tsx:52 | size | `{16}` |
| src/componentes/CardCompartilhavel.tsx:47 | size | `{18}` |
| src/componentes/CardCompartilhavel.tsx:58 | size | `{17}` |
| src/componentes/CardCompartilhavel.tsx:68 | size | `{17}` |
| src/componentes/CardCompartilhavel.tsx:69 | size | `{17}` |
| src/componentes/CardCompartilhavel.tsx:76 | size | `{17}` |
| src/componentes/ContaConfiguracoes.tsx:77 | size | `{19}` |
| src/componentes/ContaConfiguracoes.tsx:77 | size | `{19}` |
| src/componentes/ContaConfiguracoes.tsx:108 | size | `{18}` |
| src/componentes/ContaConfiguracoes.tsx:120 | size | `{18}` |
| src/componentes/ContaConfiguracoes.tsx:120 | size | `{19}` |
| src/componentes/EditorFicha.tsx:33 | size | `{20}` |
| src/componentes/EditorMedida.tsx:28 | size | `{18}` |
| src/componentes/EditorMedida.tsx:28 | size | `{16}` |
| src/componentes/EstadoVazio.tsx:5 | size | `{34}` |
| src/componentes/GraficoAtividade.tsx:5 | width | `"100%"` |
| src/componentes/GraficoAtividade.tsx:5 | height | `{220}` |
| src/componentes/GraficoAtividade.tsx:5 | stroke | `"#304235"` |
| src/componentes/GraficoAtividade.tsx:5 | width | `{48}` |
| src/componentes/GraficoAtividade.tsx:5 | stroke | `"#bcec86"` |
| src/componentes/GraficoAtividade.tsx:5 | strokeWidth | `{3}` |
| src/componentes/GraficoAtividade.tsx:5 | stroke | `"#8a9f90"` |
| src/componentes/GraficoCarga.tsx:4 | width | `"100%"` |
| src/componentes/GraficoCarga.tsx:4 | height | `{220}` |
| src/componentes/GraficoCarga.tsx:4 | stroke | `"#304235"` |
| src/componentes/GraficoCarga.tsx:4 | width | `{48}` |
| src/componentes/GraficoCarga.tsx:4 | stroke | `"#bcec86"` |
| src/componentes/GraficoCarga.tsx:4 | strokeWidth | `{3}` |
| src/componentes/LembreteBackup.tsx:11 | size | `{22}` |
| src/componentes/LembreteMedidas.tsx:11 | size | `{22}` |
| src/componentes/LembreteMedidas.tsx:11 | size | `{16}` |
| src/componentes/ListaExercicios.tsx:16 | size | `{18}` |
| src/componentes/Navegacao.tsx:8 | size | `{22}` |
| src/componentes/ResumoMedidas.tsx:26 | size | `{20}` |
| src/componentes/ResumoMedidas.tsx:26 | size | `{16}` |
| src/componentes/RevisaoSincronizacao.tsx:24 | size | `{16}` |
| src/componentes/RevisaoSincronizacao.tsx:24 | size | `{17}` |
| src/componentes/RevisaoSincronizacao.tsx:24 | size | `{12}` |
| src/componentes/RevisaoSincronizacao.tsx:30 | size | `{16}` |
| src/componentes/RevisaoSincronizacao.tsx:51 | size | `{28}` |
| src/componentes/RevisaoSincronizacao.tsx:51 | size | `{18}` |
| src/componentes/RevisaoSincronizacao.tsx:53 | size | `{14}` |
| src/componentes/RevisaoSincronizacao.tsx:53 | size | `{28}` |
| src/componentes/SelecionarDescanso.tsx:11 | size | `{16}` |
| src/componentes/Serie.tsx:40 | size | `{18}` |
| src/telas/Cardio.tsx:30 | size | `{18}` |
| src/telas/Cardio.tsx:30 | size | `{18}` |
| src/telas/Cardio.tsx:30 | size | `{16}` |
| src/telas/Cardio.tsx:30 | size | `{16}` |
| src/telas/Cardio.tsx:30 | size | `{16}` |
| src/telas/Configuracoes.tsx:19 | size | `{20}` |
| src/telas/Configuracoes.tsx:20 | size | `{20}` |
| src/telas/Configuracoes.tsx:21 | size | `{20}` |
| src/telas/Configuracoes.tsx:22 | size | `{20}` |
| src/telas/Configuracoes.tsx:23 | size | `{20}` |
| src/telas/Configuracoes.tsx:24 | size | `{20}` |
| src/telas/Configuracoes.tsx:30 | size | `{20}` |
| src/telas/Configuracoes.tsx:31 | size | `{20}` |
| src/telas/Configuracoes.tsx:42 | size | `{18}` |
| src/telas/Configuracoes.tsx:46 | size | `{20}` |
| src/telas/Configuracoes.tsx:46 | size | `{18}` |
| src/telas/Evolucao.tsx:45 | size | `{16}` |
| src/telas/Evolucao.tsx:45 | size | `{16}` |
| src/telas/Evolucao.tsx:48 | size | `{18}` |
| src/telas/Hoje.tsx:11 | size | `{19}` |
| src/telas/Hoje.tsx:12 | size | `{120}` |
| src/telas/Medidas.tsx:28 | size | `{18}` |
| src/telas/Medidas.tsx:29 | size | `{28}` |
| src/telas/Medidas.tsx:32 | size | `{18}` |
| src/telas/Medidas.tsx:32 | size | `{16}` |
| src/telas/Medidas.tsx:32 | size | `{16}` |
| src/telas/ModoTreino.tsx:96 | size | `{16}` |
| src/telas/ModoTreino.tsx:96 | size | `{18}` |
| src/telas/ModoTreino.tsx:98 | size | `{20}` |
| src/telas/ModoTreino.tsx:98 | size | `{16}` |
| src/telas/ModoTreino.tsx:111 | size | `{20}` |
| src/telas/ModoTreino.tsx:115 | size | `{16}` |
| src/telas/ModoTreino.tsx:176 | size | `{20}` |
| src/telas/ModoTreino.tsx:176 | size | `{18}` |
| src/telas/ModoTreino.tsx:177 | size | `{20}` |
| src/telas/ModoTreino.tsx:177 | size | `{18}` |
| src/telas/ModoTreino.tsx:178 | size | `{20}` |
| src/telas/ModoTreino.tsx:178 | size | `{18}` |
| src/telas/ModoTreino.tsx:184 | size | `{16}` |
| src/telas/ModoTreino.tsx:185 | size | `{18}` |
| src/telas/Treino.tsx:108 | size | `{18}` |
| src/telas/Treino.tsx:113 | size | `{19}` |
| src/telas/Treino.tsx:115 | size | `{16}` |
| src/telas/Treino.tsx:120 | size | `{18}` |
| src/telas/Treino.tsx:122 | size | `{24}` |
| src/telas/Treino.tsx:122 | size | `{22}` |
| src/telas/Treino.tsx:127 | size | `{16}` |
| src/telas/Treino.tsx:127 | size | `{18}` |
| src/telas/Treino.tsx:129 | size | `{20}` |
| src/telas/Treino.tsx:129 | size | `{20}` |
| src/telas/Treino.tsx:129 | size | `{18}` |
| src/telas/Treino.tsx:135 | size | `{16}` |
| src/telas/Treino.tsx:140 | size | `{22}` |

## Apêndice K — todos os pares medidos de texto e borda

### Texto

| Tema | Tela | Seletor / texto | Cor | Fundo composto | Tamanho / peso | Razão | Meta / ressalva |
| --- | --- | --- | --- | --- | --- | --- | --- |
| escuro | hoje | `div` / Vida em Dia | rgb(237, 243, 237) | rgb(15, 25, 19) | 20px / 700 | 15.95 | 3 |
| escuro | hoje | `small` / UM ESPAÇO PARA VOCÊ | rgb(173, 193, 176) | rgb(15, 25, 19) | 8px / 700 | 9.44 | 4.5 |
| escuro | hoje | `span.selo-previa` / Prévia | rgb(173, 193, 176) | rgb(15, 25, 19) | 9px / 400 | 9.44 | 4.5 |
| escuro | hoje | `span` / domingo, 25 de outubro | rgb(173, 193, 176) | rgb(15, 25, 19) | 10px / 400 | 9.44 | 4.5 |
| escuro | hoje | `span.estado-rede` / Online | rgb(173, 193, 176) | rgb(15, 25, 19) | 10px / 400 | 9.44 | 4.5 |
| escuro | hoje | `h1` / Olá, vamos cuidar de você? | rgb(237, 243, 237) | rgb(15, 25, 19) | 25px / 700 | 15.95 | 3 |
| escuro | hoje | `p.nota-resumo.aviso-modo-visitante` / Modo visitante: estes registros ficam visíveis a quem usar este perfil do navegador. Eles não são tr | rgb(173, 193, 176) | rgb(37, 60, 35) | 12px / 400 | 6.31 | 4.5 |
| escuro | hoje | `h2` / Hora de registrar suas medidas | rgb(237, 243, 237) | rgb(36, 54, 31) | 16px / 650 | 11.49 | 4.5 |
| escuro | hoje | `p` / Você ainda não registrou nesta semana. | rgb(171, 192, 165) | rgb(36, 54, 31) | 12px / 400 | 6.67 | 4.5 |
| escuro | hoje | `button` / Registrar agora | rgb(33, 53, 25) | rgb(188, 236, 134) | 12px / 600 | 9.75 | 4.5 |
| escuro | hoje | `span.etiqueta` / SEU RITMO. SUA EVOLUÇÃO. | rgb(41, 67, 35) | rgb(188, 236, 134) | 9px / 700 | 8.06 | 4.5 |
| escuro | hoje | `h2` / Um dia de cada vez. | rgb(27, 54, 21) | rgb(188, 236, 134) | 30px / 650 | 9.77 | 3 |
| escuro | hoje | `p` / Seu cuidado começa aqui. Vamos construir uma rotina que faz sentido para você. | rgb(41, 67, 35) | rgb(188, 236, 134) | 13px / 400 | 8.06 | 4.5 |
| escuro | hoje | `button.botao-principal` / Conhecer meu espaço | rgb(25, 45, 24) | rgb(188, 236, 134) | 13px / 600 | 10.83 | 4.5 |
| escuro | hoje | `h2` / Seu dia, em equilíbrio | rgb(237, 243, 237) | rgb(15, 25, 19) | 16px / 650 | 15.95 | 4.5 |
| escuro | hoje | `span` / Hoje | rgb(151, 165, 153) | rgb(15, 25, 19) | 11px / 400 | 6.98 | 4.5 |
| escuro | hoje | `span` / Hoje | rgb(188, 236, 134) | rgb(37, 60, 35) | 10px / 400 | 8.85 | 4.5 |
| escuro | hoje | `span` / Treino | rgb(173, 193, 176) | rgb(23, 39, 29) | 10px / 400 | 8.21 | 4.5 |
| escuro | comida | `span.etiqueta` / UM PASSO DE CADA VEZ | rgb(146, 168, 136) | rgb(15, 25, 19) | 9px / 700 | 7.00 | 4.5 |
| escuro | comida | `p` / Um diário rápido para acompanhar suas refeições, sem complicar a rotina. | rgb(156, 171, 159) | rgb(15, 25, 19) | 13px / 400 | 7.48 | 4.5 |
| escuro | comida | `span.selo` / Disponível na etapa  9 | rgb(177, 193, 168) | rgb(15, 25, 19) | 11px / 400 | 9.47 | 4.5 |
| escuro | medidas-vazia | `p` / Carregando medidas… | rgb(237, 243, 237) | rgb(15, 25, 19) | 14px / 400 | 15.95 | 4.5 |
| escuro | registrar-medidas | `h2` / Registrar medidas | rgb(237, 243, 237) | rgb(23, 39, 29) | 17px / 650 | 13.87 | 4.5 |
| escuro | registrar-medidas | `button.botao-principal.salvar-cabecalho` / Salvar | rgb(25, 45, 24) | rgb(188, 236, 134) | 13px / 600 | 10.83 | 4.5 |
| escuro | registrar-medidas | `button.botao-icone` / ✕ | rgb(143, 166, 152) | rgb(23, 39, 29) | 18px / 400 | 6.01 | 4.5 |
| escuro | registrar-medidas | `p.nota-resumo` / Preencha só o que você mediu. Peso em kg, com precisão de gramas; demais medidas em cm, com até duas | rgb(173, 193, 176) | rgb(23, 39, 29) | 12px / 400 | 8.21 | 4.5 |
| escuro | registrar-medidas | `button.data-medida` / Data | rgb(237, 243, 237) | rgb(16, 28, 21) | 13px / 400 | 15.55 | 4.5 |
| escuro | registrar-medidas | `strong` / 25/10/2026 | rgb(237, 243, 237) | rgb(16, 28, 21) | 13px / 700 | 15.55 | 4.5 |
| escuro | registrar-medidas | `span` / Peso | rgb(173, 193, 176) | rgb(16, 28, 21) | 11px / 400 | 9.20 | 4.5 |
| escuro | registrar-medidas | `small` / kg | rgb(145, 169, 154) | rgb(16, 28, 21) | 11px / 400 | 6.96 | 4.5 |
| escuro | registrar-medidas | `strong` / Adicionar | rgb(157, 182, 166) | rgb(16, 28, 21) | 20px / 400 | 8.07 | 4.5 |
| escuro | registrar-medidas | `legend` / Bíceps | rgb(194, 214, 199) | rgb(23, 39, 29) | 13px / 600 | 10.22 | 4.5 |
| escuro | medida-peso-rolar | `button.opcao-seletor.selecionada` / Rolar | rgb(25, 45, 24) | rgb(188, 236, 134) | 12px / 600 | 10.83 | 4.5 |
| escuro | medida-peso-rolar | `button.opcao-seletor` / Digitar | rgb(173, 193, 176) | rgb(16, 28, 21) | 12px / 600 | 9.20 | 4.5 |
| escuro | medida-peso-rolar | `span` / KG | rgb(173, 193, 176) | rgb(18.45, 31.85, 23.8) | 8px / 650 | 8.86 | 4.5 |
| escuro | medida-peso-rolar | `button` / 61 | rgb(226, 235, 229) | rgb(18.45, 31.85, 23.8) | 24px / 600 | 13.86 | 3 |
| escuro | medida-peso-rolar | `p.valor-escolhido` / 70,000   kg | rgb(237, 243, 237) | rgb(23, 39, 29) | 20px / 600 | 13.87 | 4.5 |
| escuro | medida-peso-rolar | `p.nota-resumo.dica-duracao` / Quilogramas e gramas. Exemplo: 77,830 kg ou 77 kg + 830 g. | rgb(173, 193, 176) | rgb(23, 39, 29) | 12px / 400 | 8.21 | 4.5 |
| escuro | medida-peso-rolar | `button.botao-principal.largura-total` / Confirmar valor | rgb(25, 45, 24) | rgb(188, 236, 134) | 13px / 600 | 10.83 | 4.5 |
| escuro | medida-peso-rolar | `button.botao-secundario` / Deixar sem informar | rgb(229, 241, 222) | rgb(38, 62, 43) | 13px / 600 | 9.95 | 4.5 |
| escuro | medida-peso-digitar | `span.sr-only` / Peso  em  kg | rgb(237, 243, 237) | rgb(23, 39, 29) | 14px / 400 | 13.87 | 4.5 |
| escuro | medida-peso-digitar | `span.unidade-input` / kg | rgb(143, 162, 150) | rgb(23, 39, 29) | 13px / 600 | 5.78 | 4.5 |
| escuro | seletor-data | `p.subtitulo-seletor` / Escolha a data. | rgb(147, 163, 153) | rgb(23, 39, 29) | 12px / 400 | 5.91 | 4.5 |
| escuro | seletor-data | `button` / 12 | rgb(226, 235, 229) | rgb(18.45, 31.85, 23.8) | 26px / 600 | 13.86 | 3 |
| escuro | treino-fichas-vazia | `button` / Minhas fichas | rgb(25, 45, 24) | rgb(188, 236, 134) | 12px / 600 | 10.83 | 4.5 |
| escuro | treino-fichas-vazia | `button` / Exercícios ( 488 ) | rgb(173, 193, 176) | rgb(16, 28, 21) | 12px / 600 | 9.20 | 4.5 |
| escuro | treino-fichas-vazia | `span` / 0   fichas  de treino | rgb(149, 164, 153) | rgb(15, 25, 19) | 12px / 400 | 6.89 | 4.5 |
| escuro | treino-fichas-vazia | `h2` / Sua primeira ficha | rgb(237, 243, 237) | rgb(23, 39, 29) | 16px / 650 | 13.87 | 4.5 |
| escuro | treino-fichas-vazia | `p` / Organize os exercícios, as séries planejadas e o descanso ou inicie um treino livre. | rgb(164, 177, 166) | rgb(23, 39, 29) | 12px / 400 | 7.01 | 4.5 |
| escuro | treino-fichas-vazia | `span` / Treino livre | rgb(211, 234, 196) | rgb(23, 39, 29) | 15px / 600 | 12.15 | 4.5 |
| escuro | treino-fichas-vazia | `small` / Monte seu treino do dia | rgb(162, 181, 167) | rgb(23, 39, 29) | 11px / 400 | 7.22 | 4.5 |
| escuro | nova-ficha-sem-selecao | `label` / Nome da ficha | rgb(173, 193, 176) | rgb(23, 39, 29) | 12px / 400 | 8.21 | 4.5 |
| escuro | nova-ficha-sem-selecao | `span` / 488  exercícios | rgb(190, 207, 194) | rgb(23, 39, 29) | 11px / 400 | 9.59 | 4.5 |
| escuro | nova-ficha-sem-selecao | `span` / Ordem alfabética | rgb(145, 169, 153) | rgb(23, 39, 29) | 11px / 400 | 6.20 | 4.5 |
| escuro | nova-ficha-sem-selecao | `strong` / Abdominal bicicleta | rgb(237, 243, 237) | rgb(23, 39, 29) | 13px / 600 | 13.87 | 4.5 |
| escuro | nova-ficha-sem-selecao | `small` / Abdômen | rgb(173, 193, 176) | rgb(23, 39, 29) | 11px / 400 | 8.21 | 4.5 |
| escuro | nova-ficha-sem-selecao | `span` / Selecione os exercícios da ficha | rgb(169, 192, 175) | rgb(20.12, 34.2, 27.08) | 11px / 400 | 8.49 | 4.5 |
| escuro | nova-ficha-sem-selecao | `button.botao-principal` / Adicionar | rgb(143, 163, 148) | rgb(41, 59, 46) | 13px / 600 | 4.45 | desabilitado: isento |
| escuro | nova-ficha-com-selecao | `span.marcador-catalogo` / 1 | rgb(26, 46, 25) | rgb(188, 236, 134) | 12px / 650 | 10.69 | 4.5 |
| escuro | nova-ficha-com-item | `strong` / 1 .  Abdominal bicicleta | rgb(237, 243, 237) | rgb(23, 39, 29) | 14px / 600 | 13.87 | 4.5 |
| escuro | nova-ficha-com-item | `button.botao-descanso` / Séries | rgb(173, 193, 176) | rgb(16, 28, 21) | 12px / 400 | 9.20 | 4.5 |
| escuro | nova-ficha-com-item | `strong` / 3 | rgb(237, 243, 237) | rgb(16, 28, 21) | 14px / 700 | 15.55 | 4.5 |
| escuro | nova-ficha-com-item | `button` / Subir | rgb(229, 241, 222) | rgb(38, 62, 43) | 12px / 400 | 3.35 | desabilitado: isento |
| escuro | nova-ficha-com-item | `button` / Retirar | rgb(237, 182, 167) | rgb(23, 39, 29) | 12px / 400 | 8.81 | 4.5 |
| escuro | nova-ficha-item-expandido | `strong` / 1 .  Abdominal bicicleta | rgb(237, 243, 237) | rgb(27, 39, 28) | 14px / 600 | 13.77 | 4.5 |
| escuro | nova-ficha-item-expandido | `small` / 3 séries · 90 s de descanso | rgb(173, 193, 176) | rgb(27, 39, 28) | 11px / 400 | 8.15 | 4.5 |
| escuro | treino-fichas | `button.abrir-ficha` / Ficha de referência | rgb(237, 243, 237) | rgb(23, 39, 29) | 14px / 600 | 13.87 | 4.5 |
| escuro | treino-fichas | `button` / Subir | rgb(237, 243, 237) | rgb(23, 39, 29) | 12px / 400 | 5.18 | desabilitado: isento |
| escuro | treino-fichas | `button` / Duplicar | rgb(237, 243, 237) | rgb(23, 39, 29) | 12px / 400 | 13.87 | 4.5 |
| escuro | treino-fichas | `button.iniciar-ficha.botao-principal` / Iniciar treino | rgb(25, 45, 24) | rgb(188, 236, 134) | 13px / 600 | 10.83 | 4.5 |
| escuro | treino-exercicios | `label` / Buscar exercício | rgb(173, 193, 176) | rgb(15, 25, 19) | 12px / 400 | 9.44 | 4.5 |
| escuro | treino-exercicios | `strong` / Mais opções para sua ficha | rgb(197, 221, 169) | rgb(23, 39, 29) | 13px / 700 | 10.63 | 4.5 |
| escuro | treino-exercicios | `p` / Inclua as variações do catálogo sem substituir seus exercícios. | rgb(167, 188, 173) | rgb(23, 39, 29) | 11px / 400 | 7.77 | 4.5 |
| escuro | treino-exercicios | `button` / Ampliar catálogo | rgb(200, 237, 158) | rgb(42, 64, 39) | 12px / 400 | 8.63 | 4.5 |
| escuro | treino-exercicios | `span` / 488  exercícios | rgb(190, 207, 194) | rgb(15, 25, 19) | 11px / 400 | 11.03 | 4.5 |
| escuro | treino-exercicios | `span` / Ordem alfabética | rgb(145, 169, 153) | rgb(15, 25, 19) | 11px / 400 | 7.13 | 4.5 |
| escuro | detalhe-exercicio | `span.selo` / Abdômen | rgb(177, 193, 168) | rgb(23, 39, 29) | 11px / 400 | 8.23 | 4.5 |
| escuro | detalhe-exercicio | `h2` / Abdominal bicicleta | rgb(237, 243, 237) | rgb(23, 39, 29) | 24px / 650 | 13.87 | 3 |
| escuro | detalhe-exercicio | `button` / Músculos | rgb(188, 236, 134) | rgb(36, 50, 31) | 10px / 400 | 9.98 | 4.5 |
| escuro | detalhe-exercicio | `button` / Instruções | rgb(173, 184, 174) | rgb(28, 39, 32) | 10px / 400 | 7.53 | 4.5 |
| escuro | detalhe-exercicio | `h3` / Músculos trabalhados | rgb(237, 243, 237) | rgb(23, 39, 29) | 14px / 600 | 13.87 | 4.5 |
| escuro | detalhe-exercicio | `p` / Abdômen | rgb(173, 184, 174) | rgb(23, 39, 29) | 13px / 400 | 7.62 | 4.5 |
| escuro | detalhe-exercicio | `button.botao-secundario.editar-detalhe` / Editar detalhes do exercício | rgb(229, 241, 222) | rgb(38, 62, 43) | 13px / 600 | 9.95 | 4.5 |
| escuro | treino-cardio | `strong` / 0 min | rgb(237, 243, 237) | rgb(16, 28, 21) | 25px / 700 | 15.55 | 3 |
| escuro | treino-cardio | `small` / kcal | rgb(158, 181, 164) | rgb(16, 28, 21) | 12px / 400 | 8.01 | 4.5 |
| escuro | registrar-cardio | `strong` / Adicionar | rgb(213, 235, 201) | rgb(16, 28, 21) | 20px / 700 | 13.81 | 3 |
| escuro | registrar-cardio | `summary` / Mais detalhes (opcional) | rgb(185, 207, 187) | rgb(23, 39, 29) | 13px / 600 | 9.45 | 4.5 |
| escuro | registrar-cardio | `legend` / Detalhes da modalidade | rgb(166, 191, 173) | rgb(23, 39, 29) | 12px / 600 | 7.94 | 4.5 |
| escuro | treino-ativo | `h2` / Ficha de referência | rgb(237, 243, 237) | rgb(23, 39, 29) | 18px / 650 | 13.87 | 4.5 |
| escuro | treino-ativo | `strong` / 0 | rgb(194, 239, 145) | rgb(23, 39, 29) | 17px / 700 | 11.94 | 4.5 |
| escuro | treino-ativo | `small` / /  3  séries | rgb(175, 193, 179) | rgb(23, 39, 29) | 12px / 400 | 8.26 | 4.5 |
| escuro | treino-ativo | `span` / Toque para manter a tela ligada | rgb(229, 241, 222) | rgb(23, 39, 29) | 12px / 500 | 13.37 | 4.5 |
| escuro | treino-ativo | `small` / 0 / 3  concluídas  · Próximo exercício | rgb(188, 236, 134) | rgb(23, 39, 29) | 11px / 400 | 11.52 | 4.5 |
| escuro | treino-ativo | `button.botao-descanso` / Descanso | rgb(229, 241, 222) | rgb(38, 62, 43) | 11px / 400 | 9.95 | 4.5 |
| escuro | treino-ativo | `strong` / 90  s | rgb(229, 241, 222) | rgb(38, 62, 43) | 13px / 700 | 9.95 | 4.5 |
| escuro | treino-ativo | `button.ajuda-no-treino` / Como fazer | rgb(184, 203, 187) | rgb(23, 39, 29) | 12px / 400 | 9.15 | 4.5 |
| escuro | treino-ativo | `span` / SÉRIE | rgb(158, 179, 165) | rgb(23, 39, 29) | 10px / 400 | 7.03 | 4.5 |
| escuro | treino-ativo | `button.tipo-serie.normal` / 1 | rgb(237, 243, 237) | rgb(35, 56, 34) | 17px / 600 | 11.23 | 4.5 |
| escuro | treino-ativo | `button.valor-serie` / 10 | rgb(237, 243, 237) | rgb(35, 56, 34) | 19px / 600 | 11.23 | 4.5 |
| escuro | treino-ativo | `button.concluir-compacto` / Concluir | rgb(25, 45, 24) | rgb(188, 236, 134) | 11px / 650 | 10.83 | 4.5 |
| escuro | treino-ativo | `button.tipo-serie.normal` / 2 | rgb(237, 243, 237) | rgb(16, 28, 21) | 17px / 600 | 15.55 | 4.5 |
| escuro | treino-ativo | `button.valor-serie` / 10 | rgb(237, 243, 237) | rgb(16, 28, 21) | 19px / 600 | 15.55 | 4.5 |
| escuro | treino-ativo | `span` / Adicionar exercício | rgb(237, 243, 237) | rgb(24, 36, 28) | 14px / 600 | 14.25 | 4.5 |
| escuro | treino-ativo | `small` / Somente neste treino | rgb(150, 170, 155) | rgb(24, 36, 28) | 11px / 400 | 6.51 | 4.5 |
| escuro | treino-ativo | `label` / Buscar | rgb(173, 193, 176) | rgb(24, 36, 28) | 12px / 400 | 8.43 | 4.5 |
| escuro | treino-ativo | `span` / Continuar depois | rgb(229, 241, 222) | rgb(38, 62, 43) | 13px / 600 | 9.95 | 4.5 |
| escuro | treino-ativo | `button.cancelar-sessao` / Cancelar treino | rgb(237, 182, 167) | rgb(15, 25, 19) | 12px / 400 | 10.14 | 4.5 |
| escuro | treino-exercicio-expandido | `strong` / Abdominal bicicleta | rgb(237, 243, 237) | rgb(25, 42, 29) | 14px / 600 | 13.41 | 4.5 |
| escuro | treino-exercicio-expandido | `small` / 3  séries ·  10  reps ·  Peso corporal | rgb(173, 193, 176) | rgb(25, 42, 29) | 11px / 400 | 7.94 | 4.5 |
| escuro | treino-exercicio-expandido | `small` / 0 / 3  concluídas  · Próximo exercício | rgb(188, 236, 134) | rgb(25, 42, 29) | 11px / 400 | 11.14 | 4.5 |
| escuro | seletor-valores-serie | `strong` / Aplicar às próximas séries | rgb(237, 243, 237) | rgb(37, 60, 35) | 13px / 600 | 10.66 | 4.5 |
| escuro | seletor-valores-serie | `small` / Somente às que ainda não foram concluídas. | rgb(173, 193, 176) | rgb(37, 60, 35) | 11px / 400 | 6.31 | 4.5 |
| escuro | timer-descanso | `strong` / 1:30 | rgb(188, 236, 134) | rgb(23, 39, 29) | 52px / 700 | 11.52 | 3 |
| escuro | timer-descanso | `p` / Recupere o fôlego. Ao terminar, esta janela fecha automaticamente. | rgb(173, 193, 176) | rgb(23, 39, 29) | 13px / 400 | 8.21 | 4.5 |
| escuro | resumo-treino | `span.etiqueta` / SEU TREINO | rgb(188, 236, 134) | rgb(15, 25, 19) | 9px / 700 | 13.25 | 4.5 |
| escuro | resumo-treino | `p` / Ficha de referência | rgb(167, 185, 172) | rgb(15, 25, 19) | 14px / 400 | 8.71 | 4.5 |
| escuro | resumo-treino | `strong` / 0 | rgb(237, 243, 237) | rgb(16, 28, 21) | 26px / 700 | 15.55 | 3 |
| escuro | resumo-treino | `small` / min | rgb(158, 181, 164) | rgb(16, 28, 21) | 13px / 400 | 8.01 | 4.5 |
| escuro | resumo-treino | `p.nota-resumo` / O volume considera as séries concluídas, sem aquecimentos. | rgb(173, 193, 176) | rgb(15, 25, 19) | 12px / 400 | 9.44 | 4.5 |
| escuro | resumo-treino | `span` / Calorias da musculação | rgb(182, 198, 187) | rgb(16, 28, 21) | 13px / 400 | 9.83 | 4.5 |
| escuro | resumo-treino | `strong` / — | rgb(188, 236, 134) | rgb(16, 28, 21) | 16px / 700 | 12.91 | 4.5 |
| escuro | resumo-treino | `small` / Cadastre seu peso na aba Medidas para estimar as calorias. | rgb(145, 166, 153) | rgb(16, 28, 21) | 11px / 400 | 6.77 | 4.5 |
| escuro | treino-em-andamento | `span` / Em andamento | rgb(194, 229, 152) | rgb(23, 39, 29) | 11px / 600 | 11.12 | 4.5 |
| escuro | treino-em-andamento | `small` / 25/10 | rgb(159, 182, 159) | rgb(23, 39, 29) | 11px / 400 | 7.19 | 4.5 |
| escuro | treino-em-andamento | `h2` / Ficha de referência | rgb(237, 243, 237) | rgb(23, 39, 29) | 22px / 650 | 13.87 | 4.5 |
| escuro | treino-em-andamento | `p` / 1 de 3 séries concluídas | rgb(184, 205, 185) | rgb(23, 39, 29) | 12px / 400 | 9.28 | 4.5 |
| escuro | treino-em-andamento | `button.iniciar-ficha.botao-secundario` / Continuar treino | rgb(229, 241, 222) | rgb(38, 62, 43) | 13px / 600 | 9.95 | 4.5 |
| escuro | config-conta | `h2` / SEU PERFIL | rgb(173, 193, 176) | rgb(15, 25, 19) | 10px / 550 | 9.44 | 4.5 |
| escuro | config-backup | `p.introducao-backup` / Guarde uma cópia fora do app para recuperar seus dados quando precisar. | rgb(164, 184, 170) | rgb(23, 39, 29) | 12px / 400 | 7.45 | 4.5 |
| escuro | config-backup | `strong` / Protegido por senha | rgb(229, 240, 229) | rgb(37, 60, 35) | 13px / 700 | 10.25 | 4.5 |
| escuro | config-backup | `p` / Sem a senha, o backup não pode ser recuperado. | rgb(164, 184, 170) | rgb(37, 60, 35) | 12px / 400 | 5.73 | 4.5 |
| escuro | config-backup | `small` / Mínimo de 12 caracteres. | rgb(188, 236, 134) | rgb(23, 39, 29) | 10px / 400 | 11.52 | 4.5 |
| escuro | config-backup | `strong` / Incluir fotos | rgb(220, 232, 223) | rgb(23, 39, 29) | 13px / 550 | 12.39 | 4.5 |
| escuro | config-backup | `span` / Guarda também as imagens deste aparelho. | rgb(143, 166, 152) | rgb(23, 39, 29) | 11px / 400 | 6.01 | 4.5 |
| escuro | config-atividade | `strong` / Somar atividades | rgb(237, 243, 237) | rgb(16, 28, 21) | 12px / 700 | 15.55 | 4.5 |
| escuro | config-atividade | `span` / Passos · dias úteis | rgb(237, 243, 237) | rgb(16, 28, 21) | 13px / 400 | 15.55 | 4.5 |
| escuro | config-aparelho | `dt` / App instalado | rgb(164, 177, 166) | rgb(23, 39, 29) | 11px / 400 | 7.01 | 4.5 |
| escuro | config-aparelho | `dd` / Não | rgb(216, 230, 210) | rgb(23, 39, 29) | 11px / 400 | 12.03 | 4.5 |
| escuro | config-sobre | `h3` / Em breve | rgb(237, 243, 237) | rgb(23, 39, 29) | 13px / 400 | 13.87 | 4.5 |
| escuro | privacidade | `span` / Itens removidos | rgb(220, 232, 223) | rgb(16, 28, 21) | 13px / 400 | 13.89 | 4.5 |
| escuro | privacidade | `small` / Revisar e eliminar definitivamente | rgb(173, 193, 176) | rgb(16, 28, 21) | 11px / 400 | 9.20 | 4.5 |
| escuro | privacidade | `span.privacidade-contagem` / 0 itens | rgb(188, 236, 134) | rgb(37, 60, 35) | 11px / 400 | 8.85 | 4.5 |
| escuro | privacidade | `p.nota-resumo` / Remover permite Desfazer. Eliminar apaga o conteúdo e as fotos, sem volta. Após  30  dias, o conteúd | rgb(173, 193, 176) | rgb(16, 28, 21) | 12px / 400 | 9.20 | 4.5 |
| escuro | privacidade | `p` / Nenhum item removido aguardando eliminação. | rgb(173, 193, 176) | rgb(16, 28, 21) | 12px / 400 | 9.20 | 4.5 |
| escuro | privacidade | `h3` / Limpar este aparelho | rgb(220, 232, 223) | rgb(16, 28, 21) | 13px / 400 | 13.89 | 4.5 |
| escuro | privacidade | `summary` / Dados antigos deste navegador | rgb(220, 232, 223) | rgb(16, 28, 21) | 13px / 400 | 13.89 | 4.5 |
| escuro | privacidade | `button.botao-destrutivo.largura-total` / Apagar dados antigos | rgb(237, 182, 167) | rgb(16, 28, 21) | 13px / 600 | 9.88 | 4.5 |
| escuro | medidas-preenchida | `p` / Peso e medidas, no seu ritmo. | rgb(159, 181, 166) | rgb(15, 25, 19) | 12px / 400 | 8.24 | 4.5 |
| escuro | medidas-preenchida | `button.nova-medida.botao-principal` / Registrar | rgb(25, 45, 24) | rgb(188, 236, 134) | 13px / 600 | 10.83 | 4.5 |
| escuro | medidas-preenchida | `span` / Último peso | rgb(163, 187, 169) | rgb(23, 39, 29) | 12px / 400 | 7.62 | 4.5 |
| escuro | medidas-preenchida | `strong` / 72,500 | rgb(237, 243, 237) | rgb(23, 39, 29) | 30px / 600 | 13.87 | 3 |
| escuro | medidas-preenchida | `small` / kg | rgb(168, 191, 174) | rgb(23, 39, 29) | 14px / 400 | 7.98 | 4.5 |
| escuro | medidas-preenchida | `p` / 24/10/2026 | rgb(157, 180, 164) | rgb(23, 39, 29) | 11px / 400 | 7.07 | 4.5 |
| escuro | medidas-preenchida | `span` / Busto | rgb(173, 193, 176) | rgb(23, 39, 29) | 11px / 400 | 8.21 | 4.5 |
| escuro | medidas-preenchida | `strong` / — | rgb(237, 243, 237) | rgb(23, 39, 29) | 24px / 650 | 13.87 | 3 |
| escuro | medidas-preenchida | `p` / Não informada | rgb(173, 193, 176) | rgb(23, 39, 29) | 11px / 400 | 8.21 | 4.5 |
| escuro | medidas-preenchida | `small` / cm | rgb(173, 193, 176) | rgb(23, 39, 29) | 12px / 400 | 8.21 | 4.5 |
| escuro | evolucao-preenchida | `small` / Busque por ficha, exercício ou data (dia/mês/ano). | rgb(152, 174, 159) | rgb(15, 25, 19) | 11px / 400 | 7.61 | 4.5 |
| escuro | evolucao-preenchida | `small` / 24/10/2026 | rgb(184, 211, 151) | rgb(23, 39, 29) | 11px / 400 | 9.52 | 4.5 |
| escuro | evolucao-preenchida | `span` / 09:00 | rgb(154, 176, 159) | rgb(23, 39, 29) | 11px / 400 | 6.76 | 4.5 |
| escuro | evolucao-preenchida | `h2` / Treino de referência | rgb(237, 243, 237) | rgb(23, 39, 29) | 20px / 650 | 13.87 | 4.5 |
| claro | hoje | `div` / Vida em Dia | rgb(32, 55, 31) | rgb(220, 231, 207) | 20px / 700 | 10.06 | 3 |
| claro | hoje | `small` / UM ESPAÇO PARA VOCÊ | rgb(71, 93, 64) | rgb(220, 231, 207) | 12px / 700 | 5.63 | 4.5 |
| claro | hoje | `span.selo-previa` / Prévia | rgb(71, 93, 64) | rgb(220, 231, 207) | 12px / 400 | 5.63 | 4.5 |
| claro | hoje | `span` / domingo, 25 de outubro | rgb(71, 93, 64) | rgb(231, 235, 221) | 12px / 400 | 5.96 | 4.5 |
| claro | hoje | `span.estado-rede` / Online | rgb(71, 93, 64) | rgb(231, 235, 221) | 12px / 400 | 5.96 | 4.5 |
| claro | hoje | `h1` / Olá, vamos cuidar de você? | rgb(32, 55, 31) | rgb(231, 235, 221) | 25px / 700 | 10.64 | 3 |
| claro | hoje | `p.nota-resumo.aviso-modo-visitante` / Modo visitante: estes registros ficam visíveis a quem usar este perfil do navegador. Eles não são tr | rgb(65, 85, 53) | rgb(219, 231, 201) | 12px / 400 | 6.32 | 4.5 |
| claro | hoje | `h2` / Hora de registrar suas medidas | rgb(32, 55, 31) | rgb(229, 237, 220) | 16px / 650 | 10.74 | 4.5 |
| claro | hoje | `p` / Você ainda não registrou nesta semana. | rgb(32, 55, 31) | rgb(229, 237, 220) | 12px / 400 | 10.74 | 4.5 |
| claro | hoje | `button` / Registrar agora | rgb(40, 67, 30) | rgb(188, 236, 134) | 12px / 600 | 8.10 | 4.5 |
| claro | hoje | `span.etiqueta` / SEU RITMO. SUA EVOLUÇÃO. | rgb(41, 67, 35) | rgb(231, 235, 221) | 9px / 700 | 9.02 | gradiente: razão de fundo plano não certifica pintura |
| claro | hoje | `h2` / Um dia de cada vez. | rgb(27, 54, 21) | rgb(231, 235, 221) | 30px / 650 | 10.93 | gradiente: razão de fundo plano não certifica pintura |
| claro | hoje | `p` / Seu cuidado começa aqui. Vamos construir uma rotina que faz sentido para você. | rgb(40, 67, 30) | rgb(231, 235, 221) | 13px / 400 | 9.06 | gradiente: razão de fundo plano não certifica pintura |
| claro | hoje | `button.botao-principal` / Conhecer meu espaço | rgb(255, 255, 255) | rgb(33, 62, 24) | 13px / 600 | 11.89 | 4.5 |
| claro | hoje | `h2` / Seu dia, em equilíbrio | rgb(32, 55, 31) | rgb(231, 235, 221) | 16px / 650 | 10.64 | 4.5 |
| claro | hoje | `span` / Hoje | rgb(71, 93, 64) | rgb(231, 235, 221) | 11px / 400 | 5.96 | 4.5 |
| claro | hoje | `span` / Hoje | rgb(255, 255, 255) | rgb(49, 91, 36) | 10px / 400 | 7.92 | 4.5 |
| claro | hoje | `span` / Treino | rgb(80, 100, 78) | rgb(220, 231, 207) | 10px / 400 | 5.00 | 4.5 |
| claro | comida | `span.etiqueta` / UM PASSO DE CADA VEZ | rgb(71, 93, 64) | rgb(231, 235, 221) | 9px / 700 | 5.96 | 4.5 |
| claro | comida | `p` / Um diário rápido para acompanhar suas refeições, sem complicar a rotina. | rgb(71, 93, 64) | rgb(231, 235, 221) | 13px / 400 | 5.96 | 4.5 |
| claro | comida | `span.selo` / Disponível na etapa  9 | rgb(32, 55, 31) | rgb(231, 235, 221) | 11px / 400 | 10.64 | 4.5 |
| claro | medidas-vazia | `p` / Carregando medidas… | rgb(32, 55, 31) | rgb(231, 235, 221) | 14px / 400 | 10.64 | 4.5 |
| claro | registrar-medidas | `h2` / Registrar medidas | rgb(32, 55, 31) | rgb(220, 231, 207) | 17px / 650 | 10.06 | 4.5 |
| claro | registrar-medidas | `button.botao-principal.salvar-cabecalho` / Salvar | rgb(25, 48, 23) | rgb(188, 236, 134) | 13px / 600 | 10.48 | 4.5 |
| claro | registrar-medidas | `button.botao-icone` / ✕ | rgb(71, 93, 64) | rgb(220, 231, 207) | 18px / 400 | 5.63 | 4.5 |
| claro | registrar-medidas | `p.nota-resumo` / Preencha só o que você mediu. Peso em kg, com precisão de gramas; demais medidas em cm, com até duas | rgb(71, 93, 64) | rgb(248, 247, 238) | 12px / 400 | 6.72 | 4.5 |
| claro | registrar-medidas | `button.data-medida` / Data | rgb(32, 55, 31) | rgb(229, 237, 220) | 13px / 400 | 10.74 | 4.5 |
| claro | registrar-medidas | `strong` / 25/10/2026 | rgb(32, 55, 31) | rgb(229, 237, 220) | 13px / 700 | 10.74 | 4.5 |
| claro | registrar-medidas | `span` / Peso | rgb(71, 93, 64) | rgb(229, 237, 220) | 11px / 400 | 6.01 | 4.5 |
| claro | registrar-medidas | `small` / kg | rgb(71, 93, 64) | rgb(229, 237, 220) | 11px / 400 | 6.01 | 4.5 |
| claro | registrar-medidas | `strong` / Adicionar | rgb(71, 93, 64) | rgb(229, 237, 220) | 20px / 400 | 6.01 | 4.5 |
| claro | registrar-medidas | `legend` / Bíceps | rgb(32, 55, 31) | rgb(248, 247, 238) | 13px / 600 | 12.00 | 4.5 |
| claro | medida-peso-rolar | `button.opcao-seletor.selecionada` / Rolar | rgb(248, 247, 238) | rgb(49, 91, 36) | 12px / 600 | 7.36 | 4.5 |
| claro | medida-peso-rolar | `button.opcao-seletor` / Digitar | rgb(71, 93, 64) | rgb(220, 233, 205) | 12px / 600 | 5.70 | 4.5 |
| claro | medida-peso-rolar | `span` / KG | rgb(71, 93, 64) | rgb(235.65, 240.5, 226.3) | 8px / 650 | 6.25 | 4.5 |
| claro | medida-peso-rolar | `button` / 61 | rgb(32, 55, 31) | rgb(235.65, 240.5, 226.3) | 24px / 600 | 11.17 | 3 |
| claro | medida-peso-rolar | `p.valor-escolhido` / 70,000   kg | rgb(32, 55, 31) | rgb(248, 247, 238) | 20px / 600 | 12.00 | 4.5 |
| claro | medida-peso-rolar | `p.nota-resumo.dica-duracao` / Quilogramas e gramas. Exemplo: 77,830 kg ou 77 kg + 830 g. | rgb(71, 93, 64) | rgb(248, 247, 238) | 12px / 400 | 6.72 | 4.5 |
| claro | medida-peso-rolar | `button.botao-principal.largura-total` / Confirmar valor | rgb(25, 48, 23) | rgb(188, 236, 134) | 13px / 600 | 10.48 | 4.5 |
| claro | medida-peso-rolar | `button.botao-secundario` / Deixar sem informar | rgb(40, 67, 30) | rgb(220, 233, 205) | 13px / 600 | 8.67 | 4.5 |
| claro | medida-peso-digitar | `span.sr-only` / Peso  em  kg | rgb(71, 93, 64) | rgb(229, 237, 220) | 14px / 400 | 6.01 | 4.5 |
| claro | medida-peso-digitar | `span.unidade-input` / kg | rgb(71, 93, 64) | rgb(229, 237, 220) | 13px / 600 | 6.01 | 4.5 |
| claro | seletor-data | `p.subtitulo-seletor` / Escolha a data. | rgb(71, 93, 64) | rgb(248, 247, 238) | 12px / 400 | 6.72 | 4.5 |
| claro | seletor-data | `button` / 12 | rgb(32, 55, 31) | rgb(235.65, 240.5, 226.3) | 26px / 600 | 11.17 | 3 |
| claro | treino-fichas-vazia | `button` / Minhas fichas | rgb(248, 247, 238) | rgb(49, 91, 36) | 12px / 600 | 7.36 | 4.5 |
| claro | treino-fichas-vazia | `button` / Exercícios ( 488 ) | rgb(71, 93, 64) | rgb(220, 233, 205) | 12px / 600 | 5.70 | 4.5 |
| claro | treino-fichas-vazia | `button.botao-principal` / Nova ficha | rgb(25, 48, 23) | rgb(188, 236, 134) | 13px / 600 | 10.48 | 4.5 |
| claro | treino-fichas-vazia | `h2` / Sua primeira ficha | rgb(32, 55, 31) | rgb(248, 247, 238) | 16px / 650 | 12.00 | 4.5 |
| claro | treino-fichas-vazia | `p` / Organize os exercícios, as séries planejadas e o descanso ou inicie um treino livre. | rgb(71, 93, 64) | rgb(248, 247, 238) | 12px / 400 | 6.72 | 4.5 |
| claro | treino-fichas-vazia | `span` / Treino livre | rgb(32, 55, 31) | rgb(229, 237, 220) | 15px / 600 | 10.74 | 4.5 |
| claro | nova-ficha-sem-selecao | `label` / Nome da ficha | rgb(32, 55, 31) | rgb(248, 247, 238) | 12px / 400 | 12.00 | 4.5 |
| claro | nova-ficha-sem-selecao | `span` / 488  exercícios | rgb(32, 55, 31) | rgb(248, 247, 238) | 11px / 400 | 12.00 | 4.5 |
| claro | nova-ficha-sem-selecao | `span` / Ordem alfabética | rgb(71, 93, 64) | rgb(248, 247, 238) | 11px / 400 | 6.72 | 4.5 |
| claro | nova-ficha-sem-selecao | `strong` / Abdominal bicicleta | rgb(32, 55, 31) | rgb(248, 247, 238) | 13px / 600 | 12.00 | 4.5 |
| claro | nova-ficha-sem-selecao | `small` / Abdômen | rgb(71, 93, 64) | rgb(248, 247, 238) | 11px / 400 | 6.72 | 4.5 |
| claro | nova-ficha-sem-selecao | `span.sr-only` / Selecionar exercício | rgb(32, 55, 31) | rgb(248, 247, 238) | 14px / 400 | 12.00 | 4.5 |
| claro | nova-ficha-sem-selecao | `span` / Selecione os exercícios da ficha | rgb(32, 55, 31) | rgb(229, 237, 220) | 11px / 400 | 10.74 | 4.5 |
| claro | nova-ficha-sem-selecao | `button.botao-principal` / Adicionar | rgb(71, 93, 64) | rgb(214, 231, 193) | 13px / 600 | 5.52 | desabilitado: isento |
| claro | nova-ficha-com-selecao | `strong` / Abdominal bicicleta | rgb(32, 55, 31) | rgb(229, 237, 220) | 13px / 600 | 10.74 | 4.5 |
| claro | nova-ficha-com-selecao | `span.marcador-catalogo` / 1 | rgb(40, 67, 30) | rgb(188, 236, 134) | 12px / 650 | 8.10 | 4.5 |
| claro | nova-ficha-com-selecao | `span.sr-only` / Remover da seleção | rgb(32, 55, 31) | rgb(229, 237, 220) | 14px / 400 | 10.74 | 4.5 |
| claro | nova-ficha-com-item | `strong` / 1 .  Abdominal bicicleta | rgb(32, 55, 31) | rgb(229, 237, 220) | 14px / 600 | 10.74 | 4.5 |
| claro | nova-ficha-com-item | `small` / 3 séries · 90 s de descanso | rgb(71, 93, 64) | rgb(229, 237, 220) | 12px / 400 | 6.01 | 4.5 |
| claro | nova-ficha-com-item | `button.botao-descanso` / Séries | rgb(32, 55, 31) | rgb(214, 231, 193) | 12px / 400 | 9.87 | 4.5 |
| claro | nova-ficha-com-item | `strong` / 3 | rgb(32, 55, 31) | rgb(214, 231, 193) | 14px / 700 | 9.87 | 4.5 |
| claro | nova-ficha-com-item | `button` / Subir | rgb(32, 55, 31) | rgb(229, 237, 220) | 12px / 400 | 2.44 | desabilitado: isento |
| claro | nova-ficha-com-item | `button` / Retirar | rgb(150, 62, 50) | rgb(229, 237, 220) | 12px / 400 | 5.76 | 4.5 |
| claro | treino-fichas | `button.abrir-ficha` / Ficha de referência | rgb(32, 55, 31) | rgb(248, 247, 238) | 14px / 600 | 12.00 | 4.5 |
| claro | treino-fichas | `small` / 1  exercícios ·  seu planejamento | rgb(71, 93, 64) | rgb(248, 247, 238) | 12px / 400 | 6.72 | 4.5 |
| claro | treino-fichas | `button` / Duplicar | rgb(32, 55, 31) | rgb(229, 237, 220) | 12px / 400 | 10.74 | 4.5 |
| claro | treino-fichas | `button.iniciar-ficha.botao-principal` / Iniciar treino | rgb(25, 48, 23) | rgb(188, 236, 134) | 13px / 600 | 10.48 | 4.5 |
| claro | treino-exercicios | `label` / Buscar exercício | rgb(32, 55, 31) | rgb(231, 235, 221) | 12px / 400 | 10.64 | 4.5 |
| claro | treino-exercicios | `p` / Inclua as variações do catálogo sem substituir seus exercícios. | rgb(32, 55, 31) | rgb(229, 237, 220) | 11px / 400 | 10.74 | 4.5 |
| claro | treino-exercicios | `button` / Ampliar catálogo | rgb(32, 55, 31) | rgb(214, 231, 193) | 12px / 400 | 9.87 | 4.5 |
| claro | treino-exercicios | `span` / 488  exercícios | rgb(32, 55, 31) | rgb(231, 235, 221) | 11px / 400 | 10.64 | 4.5 |
| claro | detalhe-exercicio | `span.selo` / Abdômen | rgb(32, 55, 31) | rgb(248, 247, 238) | 11px / 400 | 12.00 | 4.5 |
| claro | detalhe-exercicio | `h2` / Abdominal bicicleta | rgb(32, 55, 31) | rgb(248, 247, 238) | 24px / 650 | 12.00 | 3 |
| claro | detalhe-exercicio | `button` / Músculos | rgb(32, 55, 31) | rgb(229, 237, 220) | 10px / 400 | 10.74 | 4.5 |
| claro | detalhe-exercicio | `h3` / Músculos trabalhados | rgb(32, 55, 31) | rgb(248, 247, 238) | 14px / 600 | 12.00 | 4.5 |
| claro | detalhe-exercicio | `p` / Abdômen | rgb(32, 55, 31) | rgb(248, 247, 238) | 13px / 400 | 12.00 | 4.5 |
| claro | detalhe-exercicio | `button.botao-secundario.editar-detalhe` / Editar detalhes do exercício | rgb(40, 67, 30) | rgb(220, 233, 205) | 13px / 600 | 8.67 | 4.5 |
| claro | treino-cardio | `strong` / 0 min | rgb(32, 55, 31) | rgb(229, 237, 220) | 25px / 700 | 10.74 | 3 |
| claro | registrar-cardio | `strong` / Adicionar | rgb(32, 55, 31) | rgb(229, 237, 220) | 20px / 700 | 10.74 | 3 |
| claro | registrar-cardio | `summary` / Mais detalhes (opcional) | rgb(32, 55, 31) | rgb(229, 237, 220) | 13px / 600 | 10.74 | 4.5 |
| claro | registrar-cardio | `legend` / Detalhes da modalidade | rgb(32, 55, 31) | rgb(229, 237, 220) | 12px / 600 | 10.74 | 4.5 |
| claro | treino-ativo | `h2` / Ficha de referência | rgb(32, 55, 31) | rgb(248, 247, 238) | 18px / 650 | 12.00 | 4.5 |
| claro | treino-ativo | `strong` / 0 | rgb(49, 91, 36) | rgb(248, 247, 238) | 17px / 700 | 7.36 | 4.5 |
| claro | treino-ativo | `small` / /  3  séries | rgb(32, 55, 31) | rgb(248, 247, 238) | 12px / 400 | 12.00 | 4.5 |
| claro | treino-ativo | `span` / Toque para manter a tela ligada | rgb(40, 67, 30) | rgb(248, 247, 238) | 12px / 500 | 10.22 | 4.5 |
| claro | treino-ativo | `small` / 0 / 3  concluídas  · Próximo exercício | rgb(32, 55, 31) | rgb(229, 237, 220) | 12px / 400 | 10.74 | 4.5 |
| claro | treino-ativo | `button.botao-descanso` / Descanso | rgb(40, 67, 30) | rgb(220, 233, 205) | 11px / 400 | 8.67 | 4.5 |
| claro | treino-ativo | `strong` / 90  s | rgb(40, 67, 30) | rgb(220, 233, 205) | 13px / 700 | 8.67 | 4.5 |
| claro | treino-ativo | `button.ajuda-no-treino` / Como fazer | rgb(32, 55, 31) | rgb(229, 237, 220) | 12px / 400 | 10.74 | 4.5 |
| claro | treino-ativo | `span` / SÉRIE | rgb(71, 93, 64) | rgb(229, 237, 220) | 10px / 400 | 6.01 | 4.5 |
| claro | treino-ativo | `button.tipo-serie.normal` / 1 | rgb(32, 55, 31) | rgb(214, 231, 193) | 17px / 600 | 9.87 | 4.5 |
| claro | treino-ativo | `button.valor-serie` / 10 | rgb(32, 55, 31) | rgb(229, 237, 220) | 19px / 600 | 10.74 | 4.5 |
| claro | treino-ativo | `button.concluir-compacto` / Concluir | rgb(40, 67, 30) | rgb(188, 236, 134) | 11px / 650 | 8.10 | 4.5 |
| claro | treino-ativo | `span` / Adicionar exercício | rgb(32, 55, 31) | rgb(229, 237, 220) | 14px / 600 | 10.74 | 4.5 |
| claro | treino-ativo | `label` / Buscar | rgb(32, 55, 31) | rgb(229, 237, 220) | 12px / 400 | 10.74 | 4.5 |
| claro | treino-ativo | `span` / Continuar depois | rgb(40, 67, 30) | rgb(220, 233, 205) | 13px / 600 | 8.67 | 4.5 |
| claro | treino-ativo | `button.cancelar-sessao` / Cancelar treino | rgb(150, 62, 50) | rgb(231, 235, 221) | 12px / 400 | 5.71 | 4.5 |
| claro | seletor-valores-serie | `strong` / Aplicar às próximas séries | rgb(32, 55, 31) | rgb(214, 231, 193) | 13px / 600 | 9.87 | 4.5 |
| claro | seletor-valores-serie | `small` / Somente às que ainda não foram concluídas. | rgb(71, 93, 64) | rgb(214, 231, 193) | 11px / 400 | 5.52 | 4.5 |
| claro | timer-descanso | `strong` / 1:30 | rgb(49, 91, 36) | rgb(248, 247, 238) | 52px / 700 | 7.36 | 3 |
| claro | timer-descanso | `p` / Recupere o fôlego. Ao terminar, esta janela fecha automaticamente. | rgb(71, 93, 64) | rgb(248, 247, 238) | 13px / 400 | 6.72 | 4.5 |
| claro | resumo-treino | `span.etiqueta` / SEU TREINO | rgb(32, 55, 31) | rgb(231, 235, 221) | 9px / 700 | 10.64 | 4.5 |
| claro | resumo-treino | `p` / Ficha de referência | rgb(71, 93, 64) | rgb(231, 235, 221) | 14px / 400 | 5.96 | 4.5 |
| claro | resumo-treino | `strong` / 0 | rgb(32, 55, 31) | rgb(229, 237, 220) | 26px / 700 | 10.74 | 3 |
| claro | resumo-treino | `small` / min | rgb(71, 93, 64) | rgb(229, 237, 220) | 13px / 400 | 6.01 | 4.5 |
| claro | resumo-treino | `p.nota-resumo` / O volume considera as séries concluídas, sem aquecimentos. | rgb(71, 93, 64) | rgb(231, 235, 221) | 12px / 400 | 5.96 | 4.5 |
| claro | resumo-treino | `span` / Calorias da musculação | rgb(32, 55, 31) | rgb(229, 237, 220) | 13px / 400 | 10.74 | 4.5 |
| claro | resumo-treino | `strong` / — | rgb(32, 55, 31) | rgb(229, 237, 220) | 16px / 700 | 10.74 | 4.5 |
| claro | treino-em-andamento | `span` / Em andamento | rgb(32, 55, 31) | rgb(231, 235, 221) | 12px / 600 | 10.64 | gradiente: razão de fundo plano não certifica pintura |
| claro | treino-em-andamento | `small` / 25/10 | rgb(71, 93, 64) | rgb(231, 235, 221) | 12px / 400 | 5.96 | gradiente: razão de fundo plano não certifica pintura |
| claro | treino-em-andamento | `h2` / Ficha de referência | rgb(32, 55, 31) | rgb(231, 235, 221) | 22px / 650 | 10.64 | gradiente: razão de fundo plano não certifica pintura |
| claro | treino-em-andamento | `p` / 1 de 3 séries concluídas | rgb(32, 55, 31) | rgb(231, 235, 221) | 12px / 400 | 10.64 | gradiente: razão de fundo plano não certifica pintura |
| claro | treino-em-andamento | `button.botao-principal` / Continuar treino | rgb(40, 67, 30) | rgb(188, 236, 134) | 13px / 600 | 8.10 | 4.5 |
| claro | treino-em-andamento | `button.iniciar-ficha.botao-secundario` / Continuar treino | rgb(40, 67, 30) | rgb(220, 233, 205) | 13px / 600 | 8.67 | 4.5 |
| claro | config-conta | `h2` / SEU PERFIL | rgb(71, 93, 64) | rgb(231, 235, 221) | 10px / 550 | 5.96 | 4.5 |
| claro | config-backup | `p.introducao-backup` / Guarde uma cópia fora do app para recuperar seus dados quando precisar. | rgb(71, 93, 64) | rgb(248, 247, 238) | 12px / 400 | 6.72 | 4.5 |
| claro | config-backup | `p` / Sem a senha, o backup não pode ser recuperado. | rgb(71, 93, 64) | rgb(229, 237, 220) | 12px / 400 | 6.01 | 4.5 |
| claro | config-backup | `small` / Mínimo de 12 caracteres. | rgb(32, 55, 31) | rgb(248, 247, 238) | 10px / 400 | 12.00 | 4.5 |
| claro | config-backup | `strong` / Incluir fotos | rgb(32, 55, 31) | rgb(248, 247, 238) | 13px / 550 | 12.00 | 4.5 |
| claro | config-atividade | `strong` / Somar atividades | rgb(32, 55, 31) | rgb(229, 237, 220) | 12px / 700 | 10.74 | 4.5 |
| claro | config-aparelho | `dt` / App instalado | rgb(71, 93, 64) | rgb(248, 247, 238) | 11px / 400 | 6.72 | 4.5 |
| claro | config-aparelho | `dd` / Não | rgb(32, 55, 31) | rgb(248, 247, 238) | 11px / 400 | 12.00 | 4.5 |
| claro | config-sobre | `h3` / Em breve | rgb(32, 55, 31) | rgb(248, 247, 238) | 13px / 400 | 12.00 | 4.5 |
| claro | privacidade | `span.privacidade-contagem` / 0 itens | rgb(49, 91, 36) | rgb(214, 231, 193) | 11px / 400 | 6.05 | 4.5 |
| claro | privacidade | `p.nota-resumo` / Remover permite Desfazer. Eliminar apaga o conteúdo e as fotos, sem volta. Após  30  dias, o conteúd | rgb(71, 93, 64) | rgb(229, 237, 220) | 12px / 400 | 6.01 | 4.5 |
| claro | privacidade | `h3` / Limpar este aparelho | rgb(32, 55, 31) | rgb(229, 237, 220) | 13px / 400 | 10.74 | 4.5 |
| claro | privacidade | `summary` / Dados antigos deste navegador | rgb(32, 55, 31) | rgb(229, 237, 220) | 13px / 400 | 10.74 | 4.5 |
| claro | privacidade | `button.botao-destrutivo.largura-total` / Apagar dados antigos | rgb(150, 62, 50) | rgb(229, 237, 220) | 13px / 600 | 5.76 | 4.5 |
| claro | medidas-preenchida | `p` / Peso e medidas, no seu ritmo. | rgb(71, 93, 64) | rgb(231, 235, 221) | 12px / 400 | 5.96 | 4.5 |
| claro | medidas-preenchida | `button.nova-medida.botao-principal` / Registrar | rgb(25, 48, 23) | rgb(188, 236, 134) | 13px / 600 | 10.48 | 4.5 |
| claro | medidas-preenchida | `span` / Último peso | rgb(71, 93, 64) | rgb(248, 247, 238) | 12px / 400 | 6.72 | 4.5 |
| claro | medidas-preenchida | `strong` / 72,500 | rgb(32, 55, 31) | rgb(248, 247, 238) | 30px / 600 | 12.00 | 3 |
| claro | medidas-preenchida | `small` / kg | rgb(32, 55, 31) | rgb(248, 247, 238) | 14px / 400 | 12.00 | 4.5 |
| claro | medidas-preenchida | `p` / 24/10/2026 | rgb(71, 93, 64) | rgb(248, 247, 238) | 11px / 400 | 6.72 | 4.5 |
| claro | medidas-preenchida | `strong` / — | rgb(32, 55, 31) | rgb(248, 247, 238) | 24px / 650 | 12.00 | 3 |
| claro | evolucao-preenchida | `small` / Busque por ficha, exercício ou data (dia/mês/ano). | rgb(71, 93, 64) | rgb(231, 235, 221) | 11px / 400 | 5.96 | 4.5 |
| claro | evolucao-preenchida | `small` / 24/10/2026 | rgb(32, 55, 31) | rgb(248, 247, 238) | 11px / 400 | 12.00 | 4.5 |
| claro | evolucao-preenchida | `h2` / Treino de referência | rgb(32, 55, 31) | rgb(248, 247, 238) | 20px / 650 | 12.00 | 4.5 |

### Borda de controles

Tabela descritiva: borda decorativa, transparente ou pertencente a controle desabilitado não constitui reprovação automática. Valores contra o lado externo estão na medição; lado interno é calculado sobre o fundo composto do próprio elemento.

| Tema | Tela | Seletor / controle | Borda | Espessura | Fundo interno | Razão fora | Razão dentro | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| escuro | hoje | `button.botao-icone` / Usar tema claro | rgb(48, 69, 54) | 1px | rgb(23, 39, 29) | 1.74 | 1.51 | habilitado |
| escuro | hoje | `button.botao-principal` / Conhecer meu espaço | rgb(188, 236, 134) | 1px | rgb(188, 236, 134) | 1.00 | 1.00 | habilitado |
| escuro | hoje | `button.cartao` / Treino e cardioVamos começarSeu próximo movimento | rgb(48, 69, 54) | 1px | rgb(23, 39, 29) | 1.74 | 1.51 | habilitado |
| escuro | registrar-medidas | `button.botao-principal.salvar-cabecalho` / Salvar | rgb(188, 236, 134) | 1px | rgb(188, 236, 134) | 11.52 | 1.00 | habilitado |
| escuro | registrar-medidas | `button.botao-icone` / ✕ | rgb(48, 69, 54) | 1px | rgb(23, 39, 29) | 1.51 | 1.51 | habilitado |
| escuro | registrar-medidas | `button.data-medida` / Data | rgb(88, 118, 77) | 1px | rgb(16, 28, 21) | 3.06 | 3.43 | habilitado |
| escuro | registrar-medidas | `button.campo-medida.medida-vazia.campo-peso` / Peso, adicionar em kg | rgb(88, 118, 77) | 1px | rgb(16, 28, 21) | 3.06 | 3.43 | habilitado |
| escuro | registrar-medidas | `button.campo-medida.medida-vazia` / Busto, adicionar em cm | rgb(88, 118, 77) | 1px | rgb(16, 28, 21) | 3.06 | 3.43 | habilitado |
| escuro | medida-peso-rolar | `button.opcao-seletor.selecionada` / Rolar | rgb(188, 236, 134) | 1px | rgb(188, 236, 134) | 12.91 | 1.00 | habilitado |
| escuro | medida-peso-rolar | `button.opcao-seletor` / Digitar | rgba(0, 0, 0, 0) | 1px | rgb(16, 28, 21) | 1.00 | 1.00 | habilitado |
| escuro | medida-peso-rolar | `button.botao-principal.largura-total` / Confirmar valor | rgb(188, 236, 134) | 1px | rgb(188, 236, 134) | 11.52 | 1.00 | habilitado |
| escuro | medida-peso-rolar | `button.botao-secundario` / Deixar sem informar | rgb(88, 118, 77) | 1px | rgb(38, 62, 43) | 3.06 | 2.28 | habilitado |
| escuro | medida-peso-digitar | `input` /  | rgb(48, 69, 54) | 1px | rgb(16, 28, 21) | 1.51 | 1.69 | habilitado |
| escuro | treino-fichas-vazia | `button` / Minhas fichas | rgb(188, 236, 134) | 1px | rgb(188, 236, 134) | 12.91 | 1.00 | habilitado |
| escuro | treino-fichas-vazia | `button` / Exercícios ( 488 ) | rgba(0, 0, 0, 0) | 1px | rgb(16, 28, 21) | 1.00 | 1.00 | habilitado |
| escuro | treino-fichas-vazia | `button.treino-livre` / Treino livreMonte seu treino do dia | rgb(48, 69, 54) | 1px | rgb(23, 39, 29) | 1.74 | 1.51 | habilitado |
| escuro | nova-ficha-sem-selecao | `button.selecionar-exercicio` / Abdominal bicicletaAbdômenSelecionar exercício | rgb(48, 69, 54) | 1px | rgb(23, 39, 29) | 1.51 | 1.51 | habilitado |
| escuro | nova-ficha-sem-selecao | `button.botao-principal` / Adicionar | rgb(55, 76, 61) | 1px | rgb(41, 59, 46) | 1.77 | 1.29 | desabilitado |
| escuro | nova-ficha-com-item | `button` / Subir | rgb(88, 118, 77) | 1px | rgb(38, 62, 43) | 3.06 | 2.28 | desabilitado |
| escuro | nova-ficha-com-item | `button` / Retirar | rgb(96, 71, 62) | 1px | rgb(23, 39, 29) | 1.84 | 1.84 | habilitado |
| escuro | treino-fichas | `button.iniciar-ficha.botao-principal` / Iniciar treino | rgb(188, 236, 134) | 1px | rgb(188, 236, 134) | 11.52 | 1.00 | habilitado |
| escuro | detalhe-exercicio | `button.botao-secundario.editar-detalhe` / Editar detalhes do exercício | rgb(88, 118, 77) | 1px | rgb(38, 62, 43) | 3.06 | 2.28 | habilitado |
| escuro | registrar-cardio | `button.campo-medida` / Duração *Adicionar | rgb(88, 118, 77) | 1px | rgb(16, 28, 21) | 3.06 | 3.43 | habilitado |
| escuro | treino-ativo | `button.botao-secundario.manter-tela` / Toque para manter a tela ligada | rgb(88, 118, 77) | 1px | rgb(23, 39, 29) | 3.06 | 3.06 | habilitado |
| escuro | treino-ativo | `button.botao-descanso` / Descanso | rgb(88, 118, 77) | 1px | rgb(38, 62, 43) | 3.06 | 2.28 | habilitado |
| escuro | treino-ativo | `button.valor-serie` / 10 | rgb(59, 81, 65) | 1px | rgb(35, 56, 34) | 1.47 | 1.47 | habilitado |
| escuro | treino-ativo | `button.concluir-compacto` / Concluir | rgb(188, 236, 134) | 1px | rgb(188, 236, 134) | 9.32 | 1.00 | habilitado |
| escuro | treino-ativo | `textarea` /  | rgb(48, 69, 54) | 1px | rgb(16, 28, 21) | 1.55 | 1.69 | habilitado |
| escuro | treino-ativo | `button.botao-secundario.continuar-depois` / Continuar depois | rgb(88, 118, 77) | 1px | rgb(38, 62, 43) | 3.52 | 2.28 | habilitado |
| escuro | treino-em-andamento | `button.iniciar-ficha.botao-secundario` / Continuar treino | rgb(88, 118, 77) | 1px | rgb(38, 62, 43) | 3.06 | 2.28 | habilitado |
| escuro | privacidade | `button.botao-destrutivo.largura-total` / Apagar dados antigos | rgb(96, 71, 62) | 1px | rgb(16, 28, 21) | 2.06 | 2.06 | habilitado |
| escuro | medidas-preenchida | `button.nova-medida.botao-principal` / Registrar | rgb(188, 236, 134) | 1px | rgb(188, 236, 134) | 13.25 | 1.00 | habilitado |
| claro | hoje | `button.botao-icone` / Usar tema escuro | rgb(111, 133, 96) | 1px | rgb(229, 237, 220) | 3.15 | 3.36 | habilitado |
| claro | hoje | `button.botao-principal` / Conhecer meu espaço | rgb(33, 62, 24) | 1px | rgb(33, 62, 24) | 9.81 | 1.00 | habilitado |
| claro | hoje | `button.cartao` / Treino e cardioVamos começarSeu próximo movimento | rgb(182, 198, 165) | 1px | rgb(248, 247, 238) | 1.49 | 1.68 | habilitado |
| claro | registrar-medidas | `button.botao-principal.salvar-cabecalho` / Salvar | rgb(188, 236, 134) | 1px | rgb(188, 236, 134) | 1.06 | 1.00 | habilitado |
| claro | registrar-medidas | `button.botao-icone` / ✕ | rgb(111, 133, 96) | 1px | rgb(220, 231, 207) | 3.15 | 3.15 | habilitado |
| claro | registrar-medidas | `button.data-medida` / Data | rgb(111, 133, 96) | 1px | rgb(229, 237, 220) | 3.76 | 3.36 | habilitado |
| claro | registrar-medidas | `button.campo-medida.medida-vazia.campo-peso` / Peso, adicionar em kg | rgb(111, 133, 96) | 1px | rgb(229, 237, 220) | 3.76 | 3.36 | habilitado |
| claro | registrar-medidas | `button.campo-medida.medida-vazia` / Busto, adicionar em cm | rgb(111, 133, 96) | 1px | rgb(229, 237, 220) | 3.76 | 3.36 | habilitado |
| claro | medida-peso-rolar | `button.opcao-seletor.selecionada` / Rolar | rgb(49, 91, 36) | 1px | rgb(49, 91, 36) | 6.25 | 1.00 | habilitado |
| claro | medida-peso-rolar | `button.opcao-seletor` / Digitar | rgba(0, 0, 0, 0) | 1px | rgb(220, 233, 205) | 1.00 | 1.00 | habilitado |
| claro | medida-peso-rolar | `button.botao-principal.largura-total` / Confirmar valor | rgb(188, 236, 134) | 1px | rgb(188, 236, 134) | 1.26 | 1.00 | habilitado |
| claro | medida-peso-rolar | `button.botao-secundario` / Deixar sem informar | rgb(111, 133, 96) | 1px | rgb(220, 233, 205) | 3.76 | 3.19 | habilitado |
| claro | medida-peso-digitar | `input` /  | rgb(111, 133, 96) | 1px | rgb(229, 237, 220) | 3.36 | 3.36 | habilitado |
| claro | treino-fichas-vazia | `button` / Minhas fichas | rgb(49, 91, 36) | 1px | rgb(49, 91, 36) | 6.25 | 1.00 | habilitado |
| claro | treino-fichas-vazia | `button` / Exercícios ( 488 ) | rgba(0, 0, 0, 0) | 1px | rgb(220, 233, 205) | 1.00 | 1.00 | habilitado |
| claro | treino-fichas-vazia | `button.botao-principal` / Nova ficha | rgb(188, 236, 134) | 1px | rgb(188, 236, 134) | 1.12 | 1.00 | habilitado |
| claro | treino-fichas-vazia | `button.treino-livre` / Treino livreMonte seu treino do dia | rgb(124, 141, 118) | 1px | rgb(229, 237, 220) | 2.92 | 2.95 | habilitado |
| claro | nova-ficha-sem-selecao | `button.selecionar-exercicio` / Abdominal bicicletaAbdômenSelecionar exercício | rgb(182, 198, 165) | 1px | rgb(248, 247, 238) | 1.68 | 1.68 | habilitado |
| claro | nova-ficha-sem-selecao | `button.botao-principal` / Adicionar | rgb(124, 141, 118) | 1px | rgb(214, 231, 193) | 2.95 | 2.71 | desabilitado |
| claro | nova-ficha-com-selecao | `button.selecionar-exercicio` / Abdominal bicicletaAbdômen1Remover da seleção | rgb(124, 141, 118) | 1px | rgb(229, 237, 220) | 3.29 | 2.95 | habilitado |
| claro | nova-ficha-com-item | `button` / Subir | rgb(111, 133, 96) | 1px | rgb(229, 237, 220) | 3.36 | 3.36 | desabilitado |
| claro | nova-ficha-com-item | `button` / Retirar | rgb(167, 106, 91) | 1px | rgb(229, 237, 220) | 3.60 | 3.60 | habilitado |
| claro | treino-fichas | `button.iniciar-ficha.botao-principal` / Iniciar treino | rgb(188, 236, 134) | 1px | rgb(188, 236, 134) | 1.26 | 1.00 | habilitado |
| claro | detalhe-exercicio | `button.botao-secundario.editar-detalhe` / Editar detalhes do exercício | rgb(111, 133, 96) | 1px | rgb(220, 233, 205) | 3.76 | 3.19 | habilitado |
| claro | registrar-cardio | `button.campo-medida` / Duração *Adicionar | rgb(111, 133, 96) | 1px | rgb(229, 237, 220) | 3.76 | 3.36 | habilitado |
| claro | treino-ativo | `button.botao-secundario.manter-tela` / Toque para manter a tela ligada | rgb(111, 133, 96) | 1px | rgb(248, 247, 238) | 3.76 | 3.76 | habilitado |
| claro | treino-ativo | `button.botao-descanso` / Descanso | rgb(111, 133, 96) | 1px | rgb(220, 233, 205) | 3.36 | 3.19 | habilitado |
| claro | treino-ativo | `button.valor-serie` / 10 | rgb(124, 141, 118) | 1px | rgb(229, 237, 220) | 2.95 | 2.95 | habilitado |
| claro | treino-ativo | `button.concluir-compacto` / Concluir | rgb(188, 236, 134) | 1px | rgb(188, 236, 134) | 1.13 | 1.00 | habilitado |
| claro | treino-ativo | `button.botao-secundario` / Registrar cardio neste treino | rgb(124, 141, 118) | 1px | rgb(220, 233, 205) | 2.92 | 2.80 | habilitado |
| claro | treino-ativo | `textarea` /  | rgb(111, 133, 96) | 1px | rgb(229, 237, 220) | 3.36 | 3.36 | habilitado |
| claro | treino-ativo | `button.botao-secundario.continuar-depois` / Continuar depois | rgb(111, 133, 96) | 1px | rgb(220, 233, 205) | 3.33 | 3.19 | habilitado |
| claro | treino-em-andamento | `button.iniciar-ficha.botao-secundario` / Continuar treino | rgb(111, 133, 96) | 1px | rgb(220, 233, 205) | 3.76 | 3.19 | habilitado |
| claro | privacidade | `button.botao-destrutivo.largura-total` / Apagar dados antigos | rgb(167, 106, 91) | 1px | rgb(229, 237, 220) | 3.60 | 3.60 | habilitado |
| claro | medidas-preenchida | `button.nova-medida.botao-principal` / Registrar | rgb(188, 236, 134) | 1px | rgb(188, 236, 134) | 1.12 | 1.00 | habilitado |

## Apêndice L — estados computados do botão Salvar

| Tema | Estado | Fundo | Texto | Borda | Outline |
| --- | --- | --- | --- | --- | --- |
| escuro | normal | rgb(188, 236, 134) | rgb(25, 45, 24) | rgb(188, 236, 134) | rgb(25, 45, 24) none 3px |
| escuro | hover | rgb(188, 236, 134) | rgb(25, 45, 24) | rgb(188, 236, 134) | rgb(25, 45, 24) none 3px |
| escuro | focus | rgb(188, 236, 134) | rgb(25, 45, 24) | rgb(188, 236, 134) | rgb(25, 45, 24) none 3px |
| escuro | focusVisible | rgb(188, 236, 134) | rgb(25, 45, 24) | rgb(188, 236, 134) | rgb(225, 246, 203) solid 2px |
| escuro | active | rgb(188, 236, 134) | rgb(25, 45, 24) | rgb(188, 236, 134) | rgb(225, 246, 203) solid 2px |
| claro | normal | rgb(188, 236, 134) | rgb(25, 48, 23) | rgb(188, 236, 134) | rgb(25, 48, 23) none 3px |
| claro | hover | rgb(188, 236, 134) | rgb(25, 48, 23) | rgb(188, 236, 134) | rgb(25, 48, 23) none 3px |
| claro | focus | rgb(188, 236, 134) | rgb(25, 48, 23) | rgb(188, 236, 134) | rgb(25, 48, 23) none 3px |
| claro | focusVisible | rgb(188, 236, 134) | rgb(25, 48, 23) | rgb(188, 236, 134) | rgb(124, 141, 118) solid 2px |
| claro | active | rgb(188, 236, 134) | rgb(25, 48, 23) | rgb(188, 236, 134) | rgb(124, 141, 118) solid 2px |

## Apêndice M — media queries, safe area e efeitos CSS

| Arquivo:linha | Consulta |
| --- | --- |
| src/index.css:2 | (prefers-reduced-motion:reduce) |
| src/index.css:5 | (prefers-reduced-motion:reduce) |
| src/index.css:9 | (prefers-reduced-motion:reduce) |
| src/index.css:10 | (min-width:420px) |
| src/index.css:12 | (min-width:600px) |
| src/index.css:12 | (prefers-reduced-motion:reduce) |
| src/index.css:15 | (prefers-reduced-motion:reduce) |
| src/index.css:16 | (prefers-reduced-motion:reduce) |
| src/index.css:39 | (max-width:359px) |
| src/index.css:71 | (max-height:720px) |
| src/index.css:93 | (max-width:360px) |
| src/index.css:106 | (max-width:360px) |
| src/estilos/controles.css:199 | (prefers-reduced-motion: reduce) |
| src/estilos/controles.css:237 | (prefers-reduced-motion: reduce) |
| src/estilos/novo-visual.css:168 | (min-width:600px) |
| src/estilos/novo-visual.css:173 | (max-width:374px) |
| src/estilos/novo-visual.css:174 | (prefers-reduced-motion:reduce) |
| src/estilos/paleta-clara.css:375 | (min-width:600px) |
| src/estilos/paleta-clara.css:470 | (prefers-reduced-motion:reduce) |

| Arquivo:linha | Seletor | Propriedade | Valor | Condição |
| --- | --- | --- | --- | --- |
| src/index.css:2 | `.opcao-registro-sync` | transition | `background .15s,border-color .15s` |  |
| src/index.css:2 | `.registro-em-revisao>.confirmar-registro-sync:disabled` | opacity | `1` |  |
| src/index.css:2 | `.opcao-registro-sync` | transition | `none` | @media (prefers-reduced-motion:reduce) |
| src/index.css:5 | `.pontos-espera>span` | opacity | `1` |  |
| src/index.css:5 | `.pontos-espera>span:nth-child(2)` | animation | `segundo-ponto 1.2s steps(1,end) infinite` |  |
| src/index.css:5 | `.pontos-espera>span:nth-child(3)` | animation | `terceiro-ponto 1.2s steps(1,end) infinite` |  |
| src/index.css:5 | `0%,32%` | opacity | `0` | @keyframes segundo-ponto |
| src/index.css:5 | `33%,100%` | opacity | `1` | @keyframes segundo-ponto |
| src/index.css:5 | `0%,65%` | opacity | `0` | @keyframes terceiro-ponto |
| src/index.css:5 | `66%,100%` | opacity | `1` | @keyframes terceiro-ponto |
| src/index.css:5 | `.pontos-espera>span:nth-child(2),.pontos-espera>span:nth-child(3)` | animation | `none` | @media (prefers-reduced-motion:reduce) |
| src/index.css:5 | `.pontos-espera>span:nth-child(2),.pontos-espera>span:nth-child(3)` | opacity | `1` | @media (prefers-reduced-motion:reduce) |
| src/index.css:7 | `.acao-backup-importar>input` | opacity | `0` |  |
| src/index.css:7 | `.acao-backup-importar.desabilitada` | opacity | `.5` |  |
| src/index.css:9 | `.estado-sync>.acao-sincronizar:disabled` | opacity | `1` |  |
| src/index.css:9 | `.opcao-sync-automatica>input` | opacity | `0` |  |
| src/index.css:9 | `.interruptor-sync` | transition | `background .15s,border-color .15s` |  |
| src/index.css:9 | `.interruptor-sync::after` | transition | `transform .15s` |  |
| src/index.css:9 | `.opcao-sync-automatica>input:disabled+.interruptor-sync` | opacity | `.5` |  |
| src/index.css:9 | `.icone-sincronizando` | animation | `girar-sync 1.1s linear infinite` |  |
| src/index.css:9 | `.icone-sincronizando` | animation | `none` | @media (prefers-reduced-motion:reduce) |
| src/index.css:9 | `.interruptor-sync,.interruptor-sync::after` | transition | `none` | @media (prefers-reduced-motion:reduce) |
| src/index.css:12 | `button:disabled` | opacity | `.55` |  |
| src/index.css:12 | `.decoracao` | opacity | `.14` |  |
| src/index.css:15 | `.descanso.terminou` | animation | `aviso-descanso .7s ease-in-out 6` |  |
| src/index.css:15 | `.descanso.terminou` | animation | `none` | @media (prefers-reduced-motion:reduce) |
| src/index.css:16 | `.seta-exercicio` | transition | `transform .15s` |  |
| src/index.css:16 | `.seta-exercicio` | transition | `none` | @media (prefers-reduced-motion:reduce) |
| src/index.css:38 | `.foto-card input` | opacity | `0` |  |
| src/index.css:71 | `.formulario-conta input::placeholder` | opacity | `1` |  |
| src/index.css:74 | `.seta-config` | transition | `transform .15s` |  |
| src/estilos/controles.css:12 | `.botao-destrutivo:disabled` | opacity | `.5` |  |
| src/estilos/controles.css:72 | `.app .botao-principal:disabled, .app .botao-secundario:disabled` | opacity | `1` |  |
| src/estilos/controles.css:145 | `.app :is(.abas-treino, .abas-medidas, .abas-catalogo, .alternador-seletor) > button` | transition | `background-color var(--movimento-curto) ease-out, color var(--movimento-curto) ease-out, border-color var(--movimento-curto) ease-out` |  |
| src/estilos/controles.css:195 | `.app .navegacao button` | transition | `background-color var(--movimento-curto) ease-out, color var(--movimento-curto) ease-out` |  |
| src/estilos/controles.css:200 | `.app .navegacao button` | transition | `none` | @media (prefers-reduced-motion: reduce) |
| src/estilos/controles.css:205 | `.app :is(.botao-principal, .botao-secundario, .botao-atalho-numero)` | transition | `background-color var(--movimento-curto) ease-out, color var(--movimento-curto) ease-out, border-color var(--movimento-curto) ease-out` |  |
| src/estilos/controles.css:208 | `.painel-modal[open]` | animation | `aparecer-controle var(--movimento-painel) ease-out` |  |
| src/estilos/controles.css:209 | `.painel-modal[open]::backdrop` | animation | `aparecer-controle var(--movimento-painel) ease-out` |  |
| src/estilos/controles.css:210 | `:is(.resumo-todas-medidas, .evolucao-medidas, .historico-medidas, .comparacao-medidas, .rodas-numero, .rodas-medida, .campo-digitar-numero, .digitar-duracao, .conteudo-config:not([hidden]))` | animation | `aparecer-controle var(--movimento-curto) ease-out` |  |
| src/estilos/controles.css:213 | `.app :is(.seta-config, .seta-exercicio)` | transition | `transform var(--movimento-curto) ease-out` |  |
| src/estilos/controles.css:236 | `from` | opacity | `.92` | @keyframes aparecer-controle |
| src/estilos/controles.css:236 | `to` | opacity | `1` | @keyframes aparecer-controle |
| src/estilos/controles.css:238 | `.app :is(.abas-treino, .abas-medidas, .abas-catalogo, .alternador-seletor) > button,   .app :is(.botao-principal, .botao-secundario, .botao-atalho-numero, .seta-config, .seta-exercicio, .interruptor-sync),   .app .interruptor-sync::after` | transition | `none` | @media (prefers-reduced-motion: reduce) |
| src/estilos/controles.css:241 | `.painel-modal[open], .painel-modal[open]::backdrop,   :is(.resumo-todas-medidas, .evolucao-medidas, .historico-medidas, .comparacao-medidas, .rodas-numero, .rodas-medida, .campo-digitar-numero, .digitar-duracao, .conteudo-config:not([hidden]))` | animation | `none` | @media (prefers-reduced-motion: reduce) |
| src/estilos/novo-visual.css:64 | `.app .destaque .decoracao` | opacity | `.14` |  |
| src/estilos/novo-visual.css:101 | `.app .painel-modal::backdrop` | backdrop-filter | `blur(5px)` |  |
| src/estilos/novo-visual.css:107 | `.app .coluna-roda` | border | `1px solid color-mix(in srgb,var(--visual-borda) 45%,transparent)` |  |
| src/estilos/novo-visual.css:107 | `.app .coluna-roda` | background | `color-mix(in srgb,var(--visual-rebaixo) 65%,var(--visual-painel))` |  |
| src/estilos/novo-visual.css:182 | `.app .item-ficha .acoes > button:disabled` | opacity | `.45` |  |
| src/estilos/contraste-claro.css:2 | `:root[data-tema=claro] .app :is(input,textarea)::placeholder` | opacity | `1` |  |
| src/estilos/contraste-claro.css:18 | `:root[data-tema=claro] .app .navegacao button` | opacity | `1` |  |
| src/estilos/superficies.css:43 | `:root[data-tema] .app .painel-modal > .topo-painel > .alca-painel > span` | opacity | `.6` |  |
| src/estilos/superficies.css:45 | `:root[data-tema] .app .painel-modal > .topo-painel > .alca-painel:focus-visible > span` | opacity | `1` |  |

| Arquivo:linha | Seletor | Propriedade | Valor safe-area |
| --- | --- | --- | --- |
| src/index.css:12 | `.app` | padding-top | `env(safe-area-inset-top)` |
| src/index.css:12 | `main` | padding | `25px 22px calc(99px + env(safe-area-inset-bottom))` |
| src/index.css:12 | `.navegacao` | padding | `10px 10px calc(10px + env(safe-area-inset-bottom))` |
| src/index.css:12 | `.aviso-pwa` | bottom | `calc(90px + env(safe-area-inset-bottom))` |
| src/index.css:13 | `.instalacao` | bottom | `calc(86px + env(safe-area-inset-bottom))` |
| src/index.css:13 | `.aviso-pwa` | top | `calc(12px + env(safe-area-inset-top))` |
| src/index.css:14 | `.conteudo-modal` | padding | `20px 20px calc(24px + env(safe-area-inset-bottom))` |
| src/index.css:34 | `.acoes-resumo-fixas` | bottom | `calc(85px + env(safe-area-inset-bottom))` |
| src/index.css:71 | `.entrada-conta` | padding | `env(safe-area-inset-top) 28px env(safe-area-inset-bottom)` |
| src/estilos/controles.css:166 | `.app.entrada-conta` | padding-top | `max(28px, env(safe-area-inset-top))` |
| src/estilos/controles.css:166 | `.app.entrada-conta` | padding-bottom | `max(24px, env(safe-area-inset-bottom))` |
| src/estilos/novo-visual.css:34 | `.app` | padding | `env(safe-area-inset-top) 0 0` |
| src/estilos/novo-visual.css:50 | `.app > .navegacao` | min-height | `calc(72px + env(safe-area-inset-bottom))` |
| src/estilos/novo-visual.css:50 | `.app > .navegacao` | padding | `8px 10px calc(8px + env(safe-area-inset-bottom))` |
| src/estilos/novo-visual.css:105 | `.app .conteudo-modal` | padding | `20px 18px max(22px,env(safe-area-inset-bottom))` |
| src/estilos/novo-visual.css:126 | `.app .finalizar-acoes` | bottom | `calc(72px + env(safe-area-inset-bottom) + var(--visual-margem))` |

## Integridade e estado final

Fontes, testes, JSX, lógica, renderizadores congelados e src/ do original não foram alterados nesta fase. O manifesto de verificação final em analise-runtime/integridade.json registra os hashes. Os únicos arquivos novos da Fase 1 estão em revisao/. A Fase 0 acrescentou apenas proteções no .gitignore e artefatos do baseline antes de seu commit. Sem push, deploy ou Fase 2.
