const fs=require('fs');
const inv=JSON.parse(fs.readFileSync('revisao/INVENTARIO-VISUAL.json'));
const runtime=JSON.parse(fs.readFileSync('revisao/analise-runtime/resultados.json'));
const stats=JSON.parse(fs.readFileSync('revisao/baseline/css-metricas.json'));
const read=p=>JSON.parse(fs.readFileSync(p));
// Agrega as medições corrigidas, mantendo uma linha por combinação efetiva.
const corpus=read('revisao/analise-runtime/percurso/capturas.json'),uniqueText=new Map(),uniqueBorders=new Map(),smallTouch=new Map();
for(const screen of corpus.screens){const data=read('revisao/analise-runtime/percurso/'+screen.data);for(const row of data.rows){const full={theme:screen.theme,screen:screen.name,...row};if(row.directText&&row.textContrast!==null){const key=JSON.stringify([screen.theme,row.selector,row.color,row.effectiveBackground,row.fontSize,row.fontWeight,row.disabled,row.gradient]);if(!uniqueText.has(key))uniqueText.set(key,full)}if(row.borderContrast!==null&&row.control){const key=JSON.stringify([screen.theme,row.selector,row.borderColor,row.background,row.disabled]);if(!uniqueBorders.has(key))uniqueBorders.set(key,full)}if(row.control&&!row.disabled&&(row.width<44||row.height<44)){const key=screen.theme+'|'+row.selector+'|'+row.text;if(!smallTouch.has(key))smallTouch.set(key,full)}}}
for(const [file,map] of [['contrastes-texto',uniqueText],['contrastes-bordas',uniqueBorders],['alvos-toque',smallTouch]])fs.writeFileSync('revisao/analise-runtime/'+file+'.json',JSON.stringify([...map.values()],null,2));
const texts=read('revisao/analise-runtime/contrastes-texto.json'),borders=read('revisao/analise-runtime/contrastes-bordas.json'),touch=read('revisao/analise-runtime/alvos-toque.json');
const esc=s=>String(s??'').replaceAll('|','\\|').replaceAll('\n',' ');
const code=s=>'`'+esc(s)+'`';
const table=(heads,rows)=>'\n| '+heads.join(' | ')+' |\n| '+heads.map(()=>'---').join(' | ')+' |\n'+rows.map(r=>'| '+r.map(esc).join(' | ')+' |').join('\n')+'\n';
const evidence=r=>`${r.file}:${r.line}`;
const loc=r=>code(evidence(r));
const rgb=s=>{if(Array.isArray(s))return s.slice(0,3);if(s.startsWith('#')){let h=s.slice(1);if(h.length===3)h=[...h].map(c=>c+c).join('');return h.match(/../g).slice(0,3).map(x=>parseInt(x,16))}return s.match(/[\d.]+/g).slice(0,3).map(Number)};
const lum=s=>rgb(s).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4}).reduce((a,x,i)=>a+x*[.2126,.7152,.0722][i],0);
const ratio=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
const fmt=x=>Number(x).toFixed(2);
const color=s=>'rgb('+rgb(s).map(x=>Number(x.toFixed(3))).join(', ')+')';
const borderInside=r=>{const values=r.borderColor.match(/[\d.]+/g).map(Number),alpha=values[3]??1,bg=rgb(r.effectiveBackground);return ratio(values.slice(0,3).map((v,i)=>v*alpha+bg[i]*(1-alpha)),bg)};
const find=(file,selector,property)=>inv.colors.concat(inv.fontSizes,inv.spacing).find(x=>x.file===file&&x.selector===selector&&(!property||x.property===property));
const q=(a,b)=>fmt(ratio(a,b))+':1';
let md=`# Auditoria visual — cópia isolada — Fase 1

Data: 25/10/2026. **Somente leitura das fontes. Fase 2 não iniciada.**

## Escopo e evidências

Raiz: \`C:\\Users\\breno\\Documents\\Codex\\2026-10-05\\ol\\outputs\\vida-em-dia-novo-visual\`.
Baseline: commit \`f732e69\` — \`chore: baseline da cópia visual (Fase 0)\`.
Build passou; **278 testes em 46 arquivos passaram**. Capturas: **72**, em 390×844, 36 por tema; índice [baseline/index.html](baseline/index.html). Metadados e exceções em [baseline/README.md](baseline/README.md).

**Entrada/cadastro não têm baseline visual.** O backend permanece deliberadamente desativado pela configuração Vite. Conforme aprovação do usuário, entrada é auditada por leitura de CSS/JSX e por cálculo dos valores declarados, sem habilitar backend nem simular tela. Os valores dessa seção **não são estilos medidos em renderização**. A Fase 2 exige lote próprio **sem verificação visual**, com aprovação explícita, para qualquer regra que afete \`.conta-entrada\`, \`.formulario-conta\`, \`.campo-senha\` ou \`.ajuda-conta\`, incluindo dependências globais.

Inventário exaustivo de declarações: [INVENTARIO-VISUAL.json](INVENTARIO-VISUAL.json). Estilos computados e estados: [analise-runtime/resultados.json](analise-runtime/resultados.json). Cada achado abaixo traz arquivo, seletor, evidência, severidade e proposta; os apêndices detalham os inventários por propriedade.

### Método e limites

- PostCSS lê os sete CSS importados por \`src/main.tsx\`. Estatísticas por arquivo excluem passos de keyframes; o inventário bruto inclui também esses passos.
- Microsoft Edge headless 156.0.4314.42, perfis descartáveis, dados fictícios, rede externa bloqueada. Isso não substitui Safari/iPhone físico, teclado virtual, VoiceOver ou interface autenticada.
- Contraste: sRGB linearizado, luminância relativa, \`(Lmaior+0.05)/(Lmenor+0.05)\`; texto normal ≥4,5, grande ≥3 (24px ou 18,66px com peso ≥700), UI ≥3. Transparências compostas sobre os ancestrais. Bordas decorativas e controles desabilitados são identificados, não tratados automaticamente como violações WCAG.
- Os JSON iniciais do baseline preservam o registro original; seus números derivados em superfícies \`color(srgb …)\` não são a fonte normativa do contraste. A Fase 1 recalculou os 72 estados com parser CSS Color 4 corrigido, **sem alterar screenshots ou fontes**: [analise-runtime/percurso](analise-runtime/percurso). Tabelas de contraste usam esse recálculo. Gradientes são assinalados, sem fingir que backgroundColor sozinho representa o fundo; o destaque claro foi calculado também nos dois extremos declarados.
- Regra não exercitada e ausência de classe literal **não provam** código morto. Não se propõe remoção automática de classes dinâmicas, Recharts, telas inacessíveis ou estilos dos cards congelados.
- Capturas são de viewport e abrangem os painéis principais enumerados em \`baseline/capturas.json\`; não cobrem todas as combinações de dados, erros de rede, recuperação, lixeira com conteúdo e gráficos históricos. As tabelas cobrem todos os pares distintos extraídos dos elementos visíveis desse percurso; não se afirma cobertura universal de toda condição futura.

## 1.1 Arquitetura de tema

**T01 — média.** Arquivos: \`src/App.tsx:54\`, \`src/dados/modelos.ts:73\`, \`src/dados/configuracoes.ts:9\`; seletor/atributo: \`html[data-tema]\`. Evidência: \`document.documentElement.dataset.tema = configVisual?.tema ?? 'escuro'\`; tipo \`'escuro' | 'claro'\`, configuração inicial \`tema: 'escuro'\`. O atributo é aplicado ao elemento raiz por useLayoutEffect e persistido em Dexie; botão do cabeçalho e Configurações atualizam o mesmo registro. Proposta: documentar esse contrato e centralizar os bindings CSS, sem alterar JS.

**T02 — alta para migração.** Arquivos: \`novo-visual.css:2\`, \`controles.css\` e \`superficies.css:2\`; seletores: \`:root\`, \`[data-tema=claro]\`, \`:root[data-tema]\`. Não existe bloco explícito \`[data-tema=escuro]\`. Escuro usa defaults; claro sobrescreve em quatro arquivos. Sem atributo, os tokens continuam escuros, mas regras \`:root[data-tema]\` deixam de corresponder: o botão do destaque passa de lima para fundo escuro na medição complementar. Portanto “sem atributo = escuro” é verdadeiro para a paleta-base, **não para todo estado renderizado**. Proposta: capturar esse caso como contrato antes de normalizá-lo; corrigir diferenças só após aprovação, não como refatoração invisível.

Ordem efetiva em \`src/main.tsx:4–10\`:
1. \`index.css\`: Tailwind e CSS legado de todos os domínios.
2. \`controles.css\`: tokens e regras compartilhadas, depois sobrescritas com alta especificidade.
3. \`novo-visual.css\`: paleta, layout, componentes e remendos posteriores.
4. \`paleta-clara.css\`: 551 regras geradas, prefixadas para claro.
5. \`contraste-claro.css\`: correções adicionais, inclusive !important.
6. \`superficies.css\`: superfícies, controles pontuais e novas correções claras.
7. \`transicoes.css\`: posicionamento do main; movimentos estão no hook.

**T03 — média.** Arquivos/seletor: \`controles.css\`, \`:root\`. Evidência: \`--controle-superficie: #203123\` depois \`#263e2b\`; borda \`#3d553e\` depois \`#58764d\`; texto \`#c7ddbe\` depois \`#e5f1de\`. Proposta: uma definição final por papel/tema; preservar valores efetivos, não ressuscitar os primeiros.

**T04 — média.** Arquivo \`src/index.css:70\`; seletor \`.formulario-conta input\`; evidência \`border:1px solid var(--borda)\`. \`--borda\` nunca é definido nos CSS/JS do app. A declaração é inválida quando usada sem outra definição; regras posteriores podem mascarar a ausência. Proposta: registrar correção para Fase 3; não definir token silenciosamente porque pode criar uma borda hoje ausente.

\`--reserva-acoes\` não é erro: definido em runtime por \`src/hooks/useReservaAcoes.ts:11\`, no contêiner do treino; há fallback \`65px\` em \`superficies.css:113\`. Nenhum token definido ficou sem referência no escopo analisado. Variáveis exclusivas do claro ficam vazias no escuro, mas seus consumidores também são restritos ao claro. Valores finais de todos os tokens e definições repetidas estão no Apêndice A.

## 1.2 Cascata e especificidade

**C01 — alta.** \`controles.css:269\`, \`:root[data-tema] .app .botao-principal:not(:disabled)\`; evidência \`background:var(--controle-destaque)\`. Especificidade (0,5,0), contra (0,3,0) de \`.app .destaque .botao-principal\`. Resultado medido: botão e card escuros ambos \`rgb(188, 236, 134)\`. Proposta: na Fase 2 preservar esse resultado atual por variante explícita; só a Fase 3 poderá torná-lo escuro.

**C02 — média.** \`controles.css:69\` e \`:269\`; seletores \`.app .botao-principal:active:not(:disabled)\` e regra global acima. Evidência: pressionado declarado \`#a9d875\`, computado \`rgb(188, 236, 134)\` em ambos os temas; hover também sem diferença no principal. Proposta: eliminar conflito preservando o comportamento atual na Fase 2; redesenhar feedback na Fase 3 se aprovado.

**C03 — média.** \`index.css:119\` / \`novo-visual.css:94\`; seletores \`.editor-medidas-grupos .medida-vazia strong\` e \`.app .campo-medida strong\`; ambos (0,2,1), valores 13px e 20px. Último vence; ambos os temas medidos em 20px. Proposta: variante vazia explícita, inicialmente com 20px para manter baseline; redução só após aprovação.

O inventário encontrou **97 substituições exatas por propriedade** (mesmo seletor, importância e contexto), não uma contagem completa de toda declaração morta por seletores distintos. Apêndice B registra cada par e a propriedade. Pares de valores diferentes são também listados como conflitos dependentes da ordem. Casos mais específicos confirmados por runtime, como C01/C02, são adicionais a esse conjunto.

Há **697 regras com \`:root[data-tema…]\`**: 99 genéricas e 598 claras. Há **4 declarações !important** e **29 regras contendo :not()**; três têm duas ocorrências, inclusive filtros semânticos legítimos de input. Não tratar toda ocorrência de :not como erro. Lista completa no Apêndice C.

**C04 — média.** \`contraste-claro.css:10–11\`, seletores \`.recharts-default-tooltip\` e \`.recharts-tooltip-item\`: três !important para vencer estilo gerado/inline da biblioteca. \`index.css:12\`, \`@media(prefers-reduced-motion:reduce) *\`: quarto !important, de \`scroll-behavior:auto\`, com justificativa de acessibilidade. Proposta: preservar este último; isolar os de Recharts até lote específico com gráficos reais.

## 1.3 Cores

Inventário: **1.274 declarações com cores literais fora dos tokens**, agrupadas por componente no Apêndice D, com arquivo, linha, seletor, propriedade, valor literal e tokens com valor equivalente. Isso inclui gradientes, sombras, alpha e color-mix; não significa 1.274 cores únicas. Equivalência literal é candidata a reutilização, não prova de equivalência semântica.

**CO01 — média.** \`index.css\`, \`.lista-catalogo .miniatura-exercicio\`: \`linear-gradient(145deg,#293c24,#1a2a20)\`; \`novo-visual.css\`, \`.destaque\`: \`#bcec86\`; \`contraste-claro.css\`, \`.destaque\`: gradiente próprio. Papéis espalhados em vários arquivos. Proposta: tokens de superfície, destaque, status, borda e estado por função; nunca unificar só porque dois hex são parecidos.

Foram encontrados **881 pares** de hex com mesma opacidade e diferença máxima de 1–2 unidades por canal RGB. Exemplos: \`#304235\` / \`#304236\`, \`#e1f6cb\` / \`#e1f5cc\`. Lista completa e grafias equivalentes no Apêndice E. **Não arredondar ou fundir valores na Fase 2**: mesmo diferença pequena pode mudar pixels; aliases distintos podem preservar a semântica até decisão da Fase 3.

## 1.4 Tipografia e espaçamento

**TE01 — média.** \`novo-visual.css\`: \`.marca small\` 8px, \`.selo-previa\` 9px, \`.app .linha-data\` 10px; \`index.css\`: dezenas de legendas 10/11px. Lista integral por valor no Apêndice F. São **127 declarações em 8–11px**, além de uma declaração \`font-size:0\` usada para ocultar um rótulo. Fontes pequenas não violam WCAG por tamanho isoladamente, mas contrariam o mínimo de 12px desejado no projeto. Proposta: aliases da escala atual na Fase 2; aumento só na Fase 3.

Proposta de escala sem perda: manter tokens para todos os tamanhos efetivamente usados (8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,29,30,36,52,56px), mais os dois clamp e o zero técnico. Uma escala reduzida 12/13/14/16/18/20/24/30/52 é proposta de **redesign da Fase 3**, não migração sem diferença.

**TE02 — baixa.** Sete arquivos, propriedades \`padding/gap/border-radius/height/min-height\`: **1.177 declarações** inventariadas; agrupamento integral por propriedade/valor no Apêndice G. Tokens recomendados para 4/6/8/10/12/14/16/18/20/24px de espaçamento, raios 10/12/14/16/18/22/24px e controles 44/48px. Conservar exceções e expressões env()/calc() sem conversão durante a migração.

**TE03 — média.** \`index.css\` / \`novo-visual.css\`, \`.menu-serie\`: alvo medido 32×48px. \`superficies.css\`, \`.alca-painel\`: 388×26px. A alça tem alternativa Fechar de 44px e também responde ao teclado, mas fica abaixo da meta de toque de 44×44. Checkbox 22×22 dentro de label acionável e input 1×1 visualmente oculto **não são automaticamente alvos efetivos pequenos**. Medições brutas e exceções no Apêndice H. Proposta: aumentar áreas acionáveis apenas na Fase 3 e comparar novamente a geometria.

## 1.5 Código morto e divergência CSS vs JSX

**M01 — média.** Inventário de classes: 36 nomes CSS sem ocorrência literal correspondente nas fontes JS/JSX, listados no Apêndice I. Há falsos positivos conhecidos: classes Recharts são geradas pela biblioteca e \`preview-adesivo-escura\` é composição dinâmica; classes antigas de adesivos podem pertencer a layouts congelados. Proposta: nenhum delete baseado só nessa lista; cruzar JSX dinâmico, rotas e evidência de uso por tema.

Classes JSX sem regra própria e fragmentos de template estão separados no mesmo apêndice. \`amostra-\` e \`preview-adesivo-\` são fragmentos, não classes finais. \`instalado\`, \`nao-instalado\`, \`rolar\`, \`digitar\` e \`peso\` podem ser marcadores sem estilo exclusivo; isso não é, isoladamente, defeito.

**M02 — média.** \`GraficoCarga.tsx:4\` / \`GraficoAtividade.tsx:5\`: objetos \`tick\` com fill e fontSize 9/10; \`contentStyle\` com background e border; apresentação SVG com stroke fixo. Um único atributo JSX \`style={{}}\` direto foi encontrado: \`RevisarDuplicatas.tsx:35\`, \`whiteSpace:'pre-line'\`, sem cor/borda/tamanho. Objetos e atributos visuais completos no Apêndice J. Proposta: manter JSX intacto conforme escopo; tratar estilos gerados por biblioteca em lote CSS próprio, sem prometer tokenização completa de cores declaradas em JS.

**M03 — baixa para refatoração, comportamento a preservar.** \`useTransicaoSuave.ts:11–24\`: Web Animations, opacidade 0.72→1 e deslocamento ±20px em 260ms; internas 0.85→1 em 220ms. Verifica reduced-motion e cancela ao mudar a preferência e no cleanup. \`Painel.tsx:6–28\`: translateY direto durante arrasto e overflow do body; gesto acompanha o dedo, não animação automática. \`Rolagem.tsx:21/45\`: posicionamento via requestAnimationFrame e smooth condicionado à preferência. \`ModoTreino.tsx:138\`: scrollIntoView condicionado. \`useReservaAcoes.ts:11\`: custom property dinâmica e ResizeObserver. Esses efeitos não devem ser movidos ou “otimizados” como parte de CSS sem autorização de lógica.

Renderizadores \`renderCardAprovado.ts\` e \`imagensCardAprovado.ts\`, Tipográfico/Foto/Editorial e seus contratos ficam congelados. Hashes preservados; inventariar cores não autoriza alterar exports nem previews.

## 1.6 Acessibilidade visual

### Contraste efetivo após cascata

Foram extraídas **303 combinações distintas de texto/fundo** com texto real e **67 combinações de borda/fundo de controles**, nos 72 estados. Nas amostras de texto em fundo sólido, nenhum texto habilitado medido ficou abaixo do limite aplicável. Isso não inclui entrada autenticada nem todos os gráficos/dados. Resultados completos no Apêndice K e JSON de origem; gradientes e isenções são marcados.

Tabela dos principais limites/estados (medidos, não declarações escolhidas manualmente):
`;
const mainPairs=[];
for(const [theme,t]of Object.entries(runtime.themes)){const s=t.samples;for(const [label,a,b,goal]of [
 ['Input: texto × fundo',s.input.color,s.input.background,4.5],['Input: placeholder composto × fundo',color(s.input.placeholder.paintedRgb),s.input.background,4.5],['Input: borda × campo',s.input.border,s.input.background,3],['Input: borda × painel',s.input.border,t.tokens['--visual-painel'],3],['Nav: pill ativo × barra',s.navActive.background,s.nav.background,3],['Segmented: ativo × trilho',s.segmentActive.background,s.segmentRail.background,3],['Segmented: texto ativo',s.segmentActive.color,s.segmentActive.background,4.5],['Status: ponto × página',s.status.background,t.tokens['--visual-fundo'],3],['Checkbox catálogo: borda × card',s.listCheck.border,t.tokens['--visual-painel'],3],['Checkbox selecionado: preenchimento × card',s.listCheckSelected.background,t.tokens['--visual-painel'],3],['Aviso visitante: texto × fundo',s.visitor.color,s.visitor.background,4.5],['Adicionar desabilitado: texto × fundo',s.addDisabled.color,s.addDisabled.background,'isento'],['Erro: texto × fundo',s.error.color,s.error.background,4.5]
 ])mainPairs.push([theme,label,a,b,q(a,b),goal,typeof goal==='number'?(ratio(a,b)>=goal?'passa':'abaixo da meta'):'não exigir AA']);}
md+=table(['Tema','Par','Cor efetiva','Fundo efetivo','Razão','Meta','Resultado'],mainPairs);
md+=`
O preenchimento do checkbox claro selecionado tem baixo contraste com o card, mas há borda e número como indicadores alternativos; a baixa razão do preenchimento isolado não basta para afirmar falha WCAG do controle inteiro. O contraste 1,00 do botão no destaque escuro é **fundo do botão × card**, não texto × botão: o texto continua legível.

O destaque claro tem gradiente \`#c9eb8f\`→\`#aedb72\`; texto principal \`#1b3615\`: ${q('#1b3615','#c9eb8f')} / ${q('#1b3615','#aedb72')}; texto de apoio \`#28431e\`: ${q('#28431e','#c9eb8f')} / ${q('#28431e','#aedb72')}. Estes cálculos são pelos extremos declarados; não substituem amostragem de cada pixel do gradiente/sombra/antialiasing.

### Entrada/cadastro: cálculo somente por CSS, sem baseline visual

Premissas explícitas de cascata: app usa os tokens do tema; o seletor global de input com dois :not() vence as declarações de cor/fundo de input da entrada; a regra específica da entrada mantém a espessura de borda 1px. Placeholders de conta usam \`#7f9285\`; no claro, a regra mais específica de \`paleta-clara.css:1271\` mantém \`var(--visual-suave)\` (\`#475d40\`), apesar de \`contraste-claro.css:2\` declarar \`#596c55\`. Rótulos de entrada têm \`#d3dfd6\` no legado; regra gerada clara usa a paleta clara. Não houve montagem de JSX ou backend para confirmar.
`;
md+=table(['Tema','Par hipotético do fluxo de entrada','Valores CSS usados','Razão','Verificação'],[
['escuro','Texto input', '#edf3ed / #101c15',q('#edf3ed','#101c15'),'somente CSS'],['escuro','Placeholder conta','#7f9285 / #101c15',q('#7f9285','#101c15'),'somente CSS'],['escuro','Borda input / campo','#304536 / #101c15',q('#304536','#101c15'),'somente CSS'],['escuro','Label entrada / painel','#d3dfd6 / #17271d',q('#d3dfd6','#17271d'),'somente CSS'],['claro','Label entrada / painel','#20371f / #f8f7ee',q('#20371f','#f8f7ee'),'somente CSS'],['claro','Ajuda / painel','#475d40 / #f8f7ee',q('#475d40','#f8f7ee'),'somente CSS'],['escuro','Ajuda / painel','#8fa698 / #17271d',q('#8fa698','#17271d'),'somente CSS'],['claro','Texto input','#20371f / #e5eddc',q('#20371f','#e5eddc'),'somente CSS'],['claro','Placeholder conta','#475d40 / #e5eddc',q('#475d40','#e5eddc'),'somente CSS'],['claro','Borda input / campo','#6f8560 / #e5eddc',q('#6f8560','#e5eddc'),'somente CSS']]);
md+=`
**AC01 — alta.** \`novo-visual.css:91\`, \`.app input:not([type=checkbox]):not([type=radio])\`: borda escura abaixo de 3 contra campo e painel. Proposta: trocar por papel de borda de campo na Fase 3; não nesta reorganização.

### Estados

`;
md+=table(['Componente','hover','active','focus-visible','disabled','selected','erro'],[
['Principal/Salvar/Adicionar','sem diferença medida','declarado, mas sobrescrito','2px visível, medido','tratamento próprio, medido','não se aplica','mensagem de formulário separada'],
['Secundário','há borda hover declarada; conflita com contrato global','há cor pressionada declarada; prioridade requer revisão','regra compartilhada','regra compartilhada','não se aplica','não se aplica'],
['Segmented','sem tratamento exclusivo universal','herda regras locais/gerais; não contrato único','regra compartilhada','sem contrato específico universal','aria-pressed/aria-selected com cores próprias','não se aplica'],
['Navegação inferior','sem contrato exclusivo','sem contrato exclusivo','global de botão','não é estado oferecido no fluxo','aria-current com pill','não se aplica'],
['Catálogo','sem contrato exclusivo','sem contrato exclusivo','global de botão','opacity genérica quando ocupado','aria-pressed + marcador','mensagem separada'],
['Campos','sem contrato exclusivo','não se aplica','global input-com-unidade ou foco nativo','herança/opacidade conforme formulário','não se aplica','p.erro; borda inválida não tem contrato único'],
['Entrada/cadastro','somente inspeção','somente inspeção','regras gerais, não medido','ocupado/controlado por JSX','mostrar senha aria-pressed','mensagem erro JSX, não medido']]);
md+=`
Ausência de hover próprio não é falha automática WCAG nem obrigação de adicionar um estado sem função. As lacunas relevantes são feedback perdido, foco com contraste insuficiente em contextos específicos e ausência de um contrato previsível. Apêndice L contém os estados computados de Salvar; o foco de teclado foi exercitado por Tab/Shift+Tab.

### Preferências, áreas seguras e fonte a 200%

- \`prefers-reduced-motion\`: presente no CSS legado, controles e novo visual; hook principal verifica e acompanha mudanças. Gráficos declarados com \`isAnimationActive={false}\`. Nenhuma mudança nesses efeitos autorizada.
- \`prefers-color-scheme\`: **não encontrado** nos CSS/JS do app. Tema é escolhido pela configuração, não pelo sistema. Adotar automaticamente a preferência do sistema mudaria o comportamento atual; depende de decisão explícita. Em Fase 2, manter escuro como fallback.
- Safe area: \`env(safe-area-inset-top)\` no app/entrada, \`env(safe-area-inset-bottom)\` em navegação, modais e rodapés. Lista de declarações e media queries no Apêndice M. Edge desktop emula viewport, não o notch nem as barras do Safari; não há homologação física dessas áreas.
- **AC02 — média.** \`novo-visual.css\`, \`.app .navegacao button\`, e cabeçalho: aproximação de aumento de fonte por elemento em 200% gerou rótulos adjacentes visualmente sobrepostos na navegação e cabeçalho muito mais alto. Evidência: [claro-fonte-200-aproximacao.png](analise-runtime/claro-fonte-200-aproximacao.png) / [escuro](analise-runtime/escuro-fonte-200-aproximacao.png). Não houve overflow horizontal próprio dos botões detectado, mas isso não impede texto de um botão invadir o seguinte. **Não é teste de zoom nativo do Safari**. Proposta: revisar reflow/limites de texto na Fase 3 e validar zoom nativo em aparelho.

## 1.7 Inconsistências entre temas e telas

**I01 — média.** \`novo-visual.css\` / \`contraste-claro.css\`, \`.destaque .botao-principal\`: claro tem botão escuro em gradiente; escuro tem botão lima no card lima. Resultado não simétrico causado pela cascata, não por variante documentada. Proposta: explicitar ambas as aparências vigentes na migração; decisão visual separada.

**I02 — baixa.** \`superficies.css\` / \`novo-visual.css\`, \`.marca small\`, \`.selo-previa\`, \`.linha-data\`: claro tem 12px por correção recente, escuro mantém 8/9/10px. Proposta: preservar os dois tamanhos por tema na Fase 2; eventual unificação mínima 12px depende da Fase 3.

**I03 — média.** \`novo-visual.css:91\` / \`superficies.css:135\`, inputs: escuro usa borda de superfície, claro usa borda de controle. Campos numéricos \`.campo-medida\` usam a borda de campo nos dois temas; inputs digitáveis não seguem esse contrato no escuro. Proposta: mapear os papéis distintos atuais primeiro e corrigir apenas com aprovação.

**I04 — média.** \`index.css\`, \`.selecionar-exercicio[aria-pressed=true]\`, e \`novo-visual.css\`, \`.app :is(.item-catalogo,.selecionar-exercicio)\`: fundo selecionado legado perde para painel da cópia; o marcador permanece como indicador. Proposta: variante explícita preservando seleção pelo marcador; não reintroduzir fundo legado por acidente.

**I05 — baixa.** \`index.css\`, \`.lembrete-medidas button\`, versus \`controles.css\`, \`.botao-principal\`: funções semelhantes usam contratos diferentes; o primeiro não tem a classe compartilhada. Como JSX não pode mudar, a Fase 2 deve preservar seletor e medidas próprios via CSS; padronização de aparência fica para Fase 3.

## 1.8 Tamanho e desempenho

`;
md+=table(['Arquivo','Bytes','Gzip isolado','Regras','Seletores'],stats.map(s=>[s.file,s.bytes,s.gzip,s.rules,s.selectors]));
md+=`
Total de fontes: **208.865 bytes**, **2.047 regras**, **2.137 seletores**. Bundle final: valores exatos em \`baseline/validacao.json\`; Vite informa 198,59 kB / gzip 33,65 kB. A soma de gzip por arquivo não equivale ao gzip do bundle. \`paleta-clara.css\` representa 58.993 bytes / 551 regras, muitas derivadas de cores legadas que os contratos posteriores já substituem.

**P01 — média.** Os estilos são importados pelo entrypoint; o CSS de configuração, conta e telas secundárias não acompanha a divisão lazy de JS. Proposta: separar responsabilidades primeiro, sem introduzir carregamento condicional nesta fase. Divisão lazy muda FOUC/ordem e precisa de lote próprio e comparação visual.

**P02 — baixa.** A cobertura CDP do baseline retornou lista vazia com os estilos inline injetados pelo Vite; não se inventou percentual de cobertura. Varredura CSSOM complementar de presença de seletores encontrou 305 entradas correspondentes no escuro e 441 no claro, num mapa de 2.008 entradas únicas por seletor/stylesheet. Não equivalem a regras que vencem a cascata nem cobrem todos os caminhos. Bytes de regras não observadas são apenas candidatos, não economia comprovada. Dados completos em \`resultados.json\`, \`themes.*.cssUsage\`.

Sugestão de divisão: tokens; base/layout; cabeçalho; navegação; controles; formulários; painéis; catálogo; fichas/treino; medidas; cardio; configurações/privacidade; conta isolada; integração Recharts; estilos congelados isolados. Sem carregar/descarregar dinamicamente agora.

## 1.9 Problemas já conhecidos — confirmação no estado atual

`;
md+=table(['Item','Estado','Arquivo / seletor / evidência','Severidade','Proposta'],[
['a','confirmado','controles.css:269 vence novo-visual.css; .destaque .botao-principal: fundo #bcec86 sobre card #bcec86 = 1,00:1; texto separado passa','média','Preservar na Fase 2; corrigir contraste de superfícies só na Fase 3'],
['b','confirmado nos dois temas','index.css:119 .medida-vazia strong 13px perde para novo-visual.css:94 .app .campo-medida strong 20px','média','Variante explícita, sem redução não aprovada'],
['c','confirmado no escuro','novo-visual.css:91 input: #304536 / #101c15 = 1,69; contra #17271d = 1,51','alta','Fase 3: usar papel --superficie-campo-borda; conferir os dois lados'],
['d','confirmado no escuro','novo-visual.css .navegacao button[aria-current=page]: #253c23 / #17271d = 1,30','média','Preservar na Fase 2; estado mais distinto na Fase 3'],
['e','sobreposição confirmada; bloqueio final não reproduzido','index.css:104 .confirmar-catalogo sticky, z-index:3; lista padding-bottom:0; dois itens atrás da barra no viewport intermediário; último item ficou acima da barra ao rolar ao final','média','Fase 3: reserva/fluxo da barra e opacidade, sem mexer em lógica de catálogo'],
['f','corrigido nos componentes principais; não repetir diagnóstico antigo','superficies.css:118+; status claro 4,41:1 contra página, segmented ativo/trilho 6,25, borda input/campo 3,36 e painel 3,76. Checkbox preserva borda própria e seleção por número','baixa / histórico','Manter os valores atuais e auditar exceções específicas; não reaplicar correção antiga indiscriminadamente'],
['g','confirmado','Apêndice F: 127 declarações de 8–11px, mais zero técnico; gráficos em JSX também 9/10px','média','Não alterar escala na Fase 2; definir correções depois'],
['h','confirmado','EditorFicha.tsx:26 disabled={salvando}; EditorMedida.tsx:28 disabled={ocupado}; formulários vazios mostram Salvar habilitado; validação ocorre ao enviar','baixa / fora de escopo','Somente registrar: lógica não será alterada']]);
md+=`
## Etapas propostas — aguardam aprovação

Nenhuma etapa abaixo foi executada. Cada lote exige commit descritivo, sem push, comparação 390×844 nos dois temas, mesmas fixtures/data e **diff de pixels**; diferenças fora de áreas dinâmicas previamente enumeradas interrompem o lote. Não usar tolerância para esconder mudança de cor/espessura/fonte. Hoje o baseline estático permite comparação determinística; relógio, IDs e dados devem permanecer controlados.

`;
md+=table(['Lote','Conteúdo','Risco','Critério / dependência'],[
['2.1','Mapa semântico e tokens novos com aliases de compatibilidade; paletas explícitas claro/escuro; escala fiel aos valores atuais','médio','Não mudar hex, medidas, default ou política de sistema; referências antigas podem permanecer até seu consumidor migrar'],
['2.2','Extrair cabeçalho, navegação e destaque, preservando inclusive discrepâncias atuais','médio','Capturas idênticas; não corrigir pill nem botão lima nesta fase'],
['2.3','Extrair catálogo/fichas e seus estados, mantendo geometria da barra e da seleção','médio','Capturas com/sem seleção e rolagem; sem padronização de padding aprovada só implicitamente'],
['2.4','Extrair controles, painéis, treino e medidas, em sublotes separados','alto','Regra global só migra quando todos os consumidores estiverem cobertos; preservar campos vazios em 20px'],
['2.Conta','Conta/entrada/cadastro e dependências globais — SEM VERIFICAÇÃO VISUAL','alto','Exige aprovação explícita própria; preservar valores, ordem, especificidade e condições. Mover bloco sem mudança de contexto pode preservar valores por construção, mas não se certifica renderização sem baseline'],
['2.5','Consolidar ordem de carregamento e, se seguro, introduzir @layer; remover só declarações comprovadamente substituídas','alto','CSS não layerizado vence CSS em layer. Não introduzir layers por componente mantendo remendos globais não layerizados. Preservar ordem relativa do Tailwind e da integração Recharts; avaliar diff do bundle/capturas'],
['2.6','Limpeza final de candidatos comprovados, documentação e medição de peso','médio','Nenhuma remoção só por ausência em screenshot; revalidar build/testes e hashes congelados'],
['3','Correções visuais/AA, fontes, áreas de toque e lógica visual aprovada por item','variável','Fora desta execução; cada mudança visível depende da aprovação do usuário. Lógica Salvar continua fora de escopo']]);
md+=`
### Ajustes à arquitetura-alvo proposta

1. Manter escala de compatibilidade completa antes de propor uma escala menor. Consolidar 8/9/10/11px para 12px mudaria baseline.
2. Não interpretar “simétrico” como cores iguais ou mesma estratégia estética: tokens de ambos os temas devem descrever seus resultados atuais, inclusive defeitos. Tokens exclusivos de tema recebem bindings explícitos quando seus consumidores migrarem, sem mudar o tema sem atributo.
3. Não ativar prefers-color-scheme automaticamente: app hoje escolhe tema em configuração. Essa mudança de política requer decisão da Fase 3.
4. Introduzir @layer só depois de mapear o CSS legado/Tailwind e verificar um corte controlado de prioridade. Dividir arquivos preservando a ordem é menos arriscado que layerizar em partes, com metade das regras ainda não layerizadas.
5. Conta fica em lote bloqueado próprio. Até sua aprovação, contratos globais que a afetem mantêm compatibilidade; definir token ausente --borda pode mudar o visual e não é limpeza neutra. A migração por simples deslocamento textual pode conservar os valores **se** mantiver todas as relações de ordem, especificidade, herança e layer; rebaixar especificidade não tem essa garantia.

---

## Apêndice A — tokens: todas as definições e valores efetivos

`;
md+=table(['Arquivo:linha','Seletor','Token','Valor declarado','Condição'],inv.tokens.map(r=>[evidence(r),code(r.selector),code(r.token),code(r.value),r.conditions.join(' / ')]));
md+=table(['Token','Escuro efetivo no html','Claro efetivo no html'],[...new Set(inv.tokens.map(x=>x.token))].map(n=>[code(n),code(runtime.themes.escuro.tokens[n]||'(não definido no tema)'),code(runtime.themes.claro.tokens[n]||'(não definido no tema)')]));
md+='\nOs valores de --visual-margem acima são de 390px; em min-width:600px muda para 20px. --reserva-acoes é local ao contêiner do treino e não ao html.\n';
md+='\n## Apêndice B — declarações substituídas e conflitos exatos\n';
md+=table(['Arquivo anterior','Seletor','Propriedade','Valor anterior','Arquivo posterior','Valor posterior','Dependência de ordem'],inv.deadExact.map(x=>[evidence(x.previous),code(x.previous.selector),x.previous.property,code(x.previous.value),evidence(x.next),code(x.next.value),x.previous.value===x.next.value?'duplicação idêntica':'valores diferentes']));
md+='\n## Apêndice C — especificidade elevada, :not e !important\n';
md+=table(['Arquivo:linha','Seletor','Condição'],inv.artificial.map(r=>[evidence(r),code(r.selector),r.conditions.join(' / ')]));
md+=table(['Arquivo:linha','Seletor com :not()','Ocorrências'],inv.notChains.map(r=>[evidence(r),code(r.selector),r.count]));
md+=table(['Arquivo:linha','Seletor','Propriedade','Valor','Condição'],inv.important.map(r=>[evidence(r),code(r.selector),r.property,code(r.value),r.conditions.join(' / ')]));
md+='\n## Apêndice D — todas as declarações de cor literal, por componente\n';
for(const group of [...new Set(inv.colors.map(x=>x.component))]){md+='\n### '+group+'\n';md+=table(['Arquivo:linha','Seletor','Propriedade','Valor literal','Token de valor equivalente','Condição'],inv.colors.filter(x=>x.component===group).map(r=>{const aliases=[...new Set(inv.tokens.filter(t=>t.value===r.value||((r.value.match(/#[\da-f]{3,8}\b/gi)||[]).includes(t.value))).map(t=>t.token))];return[evidence(r),code(r.selector),r.property,code(r.value),aliases.join(', ')||'não encontrado; avaliar papel próprio',r.conditions.join(' / ')]}));}
md+='\n## Apêndice E — grafias equivalentes e quase-duplicatas\n';md+=table(['Valor normalizado','Grafias literais'],inv.sameColorSpellings.map(x=>[x.value,x.names.join(', ')]));md+=table(['Cor A','Cor B','Máxima diferença de canal RGB'],inv.nearColors.map(x=>[x.a,x.b,x.maxChannelDelta]));
md+='\n## Apêndice F — todos os font-size, agrupados por valor\n';for(const value of [...new Set(inv.fontSizes.map(x=>x.value))]){const rows=inv.fontSizes.filter(x=>x.value===value);md+='\n### '+code(value)+' — '+rows.length+' ocorrências\n';md+=table(['Arquivo:linha','Seletor','Condição'],rows.map(r=>[evidence(r),code(r.selector),r.conditions.join(' / ')]));}
md+='\n## Apêndice G — espaçamentos, raios e alturas, por propriedade/valor\n';const groups=new Map();for(const r of inv.spacing){const k=r.property+' | '+r.value;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r)}md+=table(['Propriedade','Valor','Ocorrências','Arquivos:linhas / seletores'],[...groups].map(([k,rs])=>[rs[0].property,code(rs[0].value),rs.length,rs.map(r=>evidence(r)+' '+code(r.selector)).join('<br>')]));
md+='\n## Apêndice H — geometria de alvos abaixo de 44×44\n';md+=table(['Tema','Tela','Elemento','Texto','Largura','Altura','Interpretação'],touch.map(r=>[r.theme,r.screen,code(r.selector),r.text,fmt(r.width),fmt(r.height),r.tag==='INPUT'?'conferir label acionável; não condenar input isolado':r.selector.includes('alca')?'alternativa Fechar disponível; meta de toque não atingida':'alvo estreito; propor Fase 3']));
md+='\n## Apêndice I — classes e candidatos de uso\n\n### CSS sem ocorrência literal nas fontes JS/JSX\n';md+=inv.cssWithoutLiteralUse.map(c=>'- '+code(c)).join('\n');md+='\n\n### JSX sem classe exata no CSS\n';md+=inv.jsxWithoutCss.map(c=>'- '+code(c)).join('\n');md+='\n\nListas completas das classes de ambos os lados em INVENTARIO-VISUAL.json. Nenhuma dessas classes foi removida.\n';
md+='\n## Apêndice J — inline e atributos visuais no JSX\n';md+=table(['Arquivo:linha','Atributo','Valor'],inv.inline.map(r=>[evidence(r),'style',code(r.value)]).concat(inv.visualObjects.map(r=>[evidence(r),r.attribute,code(r.value)]),inv.visualJsx.map(r=>[evidence(r),r.attribute,code(r.value)])));
md+='\n## Apêndice K — todos os pares medidos de texto e borda\n\n### Texto\n';md+=table(['Tema','Tela','Seletor / texto','Cor','Fundo composto','Tamanho / peso','Razão','Meta / ressalva'],texts.map(r=>[r.theme,r.screen,code(r.selector)+' / '+r.text,r.color,color(r.effectiveBackground),r.fontSize+' / '+r.fontWeight,fmt(r.textContrast),r.disabled?'desabilitado: isento':r.gradient?'gradiente: razão de fundo plano não certifica pintura':String(r.threshold)]));
md+='\n### Borda de controles\n\nTabela descritiva: borda decorativa, transparente ou pertencente a controle desabilitado não constitui reprovação automática. Valores contra o lado externo estão na medição; lado interno é calculado sobre o fundo composto do próprio elemento.\n';md+=table(['Tema','Tela','Seletor / controle','Borda','Espessura','Fundo interno','Razão fora','Razão dentro','Estado'],borders.map(r=>[r.theme,r.screen,code(r.selector)+' / '+r.text,r.borderColor,r.borderWidth,color(r.effectiveBackground),fmt(r.borderContrast),fmt(borderInside(r)),r.disabled?'desabilitado':r.gradient?'gradiente: verificar pintura':'habilitado']));
md+='\n## Apêndice L — estados computados do botão Salvar\n';md+=table(['Tema','Estado','Fundo','Texto','Borda','Outline'],Object.entries(runtime.themes).flatMap(([theme,t])=>Object.entries(t.states.save).map(([state,s])=>[theme,state,s.background,s.color,s.border,s.outline])));
md+='\n## Apêndice M — media queries, safe area e efeitos CSS\n';md+=table(['Arquivo:linha','Consulta'],inv.media.map(r=>[evidence(r),r.query]));
md+=table(['Arquivo:linha','Seletor','Propriedade','Valor','Condição'],inv.effects.map(r=>[evidence(r),code(r.selector),r.property,code(r.value),r.conditions.join(' / ')]));
const safe=[];for(const file of stats.map(s=>s.file)){const root=require('postcss').parse(fs.readFileSync(file,'utf8'));root.walkDecls(d=>{if(/env\(safe-area-inset/.test(d.value))safe.push([file+':'+d.source.start.line,code(d.parent.selector),d.prop,code(d.value)])})}md+=table(['Arquivo:linha','Seletor','Propriedade','Valor safe-area'],safe);
md+='\n## Integridade e estado final\n\nFontes, testes, JSX, lógica, renderizadores congelados e src/ do original não foram alterados nesta fase. O manifesto de verificação final em analise-runtime/integridade.json registra os hashes. Os únicos arquivos novos da Fase 1 estão em revisao/. A Fase 0 acrescentou apenas proteções no .gitignore e artefatos do baseline antes de seu commit. Sem push, deploy ou Fase 2.\n';
fs.writeFileSync('revisao/AUDITORIA-VISUAL.md',md);
console.log(JSON.stringify({report:'revisao/AUDITORIA-VISUAL.md',bytes:Buffer.byteLength(md),textPairs:texts.length,borderPairs:borders.length},null,2));
