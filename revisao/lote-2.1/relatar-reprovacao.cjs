const fs=require('fs'),path=require('path'),zlib=require('zlib');const root=path.resolve(__dirname,'../..');
const read=f=>JSON.parse(fs.readFileSync(path.join(__dirname,f))),plan=read('mapeamento-bordas.json'),before=read('antes/resultado.json'),after=read('depois/resultado.json'),reversion=read('reversao-verificada.json'),proposed=read('tokens-propostos.json'),computed=read('depois/novos-tokens-computados.json');
const esc=s=>String(s??'').replaceAll('|','\\|').replaceAll('\n',' '),table=(heads,rows)=>'\n| '+heads.join(' | ')+' |\n| '+heads.map(()=>'---').join(' | ')+' |\n'+rows.map(r=>'| '+r.map(esc).join(' | ')+' |').join('\n')+'\n';
const rootBefore=theme=>JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(__dirname,'antes',theme+'-hoje-normal.json.gz')))).rows.find(r=>r.key==='html:nth-child(1)').style;
const resolve=(raw,theme)=>raw.startsWith('var(')?rootBefore(theme)[raw.slice(4,-1)]?.trim():raw;
let bugs=`# Bugs preservados — Lote 2.1 reprovado e revertido

**Nenhuma correção aplicada.** O gate interrompeu a tentativa no primeiro estado normal do pós-lote. Todos os arquivos-fonte foram restaurados byte a byte; os comentários CSS inseridos durante a tentativa também foram revertidos. Este documento mantém o catálogo e o texto dos comentários exigidos para uma futura tentativa, que precisa de nova autorização. Não se reaplicaram comentários isoladamente depois da falha.

C01/C02/C03 mantêm os identificadores da auditoria. C04 continua reservado ao achado de !important na auditoria; os bugs adicionais usam C05–C10.

`;
const entries=[
['C01','1.9(a)','src/estilos/controles.css:269; src/estilos/novo-visual.css:63','.destaque .botao-principal / :root[data-tema] .app .botao-principal:not(:disabled)','Botão escuro recebe #bcec86 sobre destaque #bcec86; razão de superfícies 1,00. Texto permanece legível.'],
['C02','C02 da auditoria','src/estilos/controles.css:69/269','.app .botao-principal:active:not(:disabled)','A cor pressionada declarada #a9d875 perde para a regra global; comportamento preservado.'],
['C03','1.9(b)','src/index.css:119; src/estilos/novo-visual.css:94','.editor-medidas-grupos .medida-vazia strong / .app .campo-medida strong','Adicionar permanece 20px por ordem de carregamento, não 13px.'],
['C05','1.9(c)','src/estilos/novo-visual.css:91','.app input:not([type=checkbox]):not([type=radio])','Borda escura --visual-borda: 1,69:1 contra campo, 1,51:1 contra painel. Não trocada por --superficie-campo-borda.'],
['C06','1.9(d)','src/estilos/novo-visual.css:51','.app .navegacao button[aria-current=page]','Pill escuro #253c23 contra barra #17271d: 1,30:1.'],
['C07','1.9(e)','src/index.css:104','.confirmar-catalogo','Sobrepõe itens durante rolagem, com z-index:3 e lista sem padding-bottom. Bloqueio do último item não foi reproduzido na auditoria.'],
['C08','1.9(g)','src/estilos/novo-visual.css:41; inventário da auditoria','.marca small e demais seletores abaixo de 12px','127 declarações em 8–11px preservadas; zero técnico de ocultação não deve ser elevado indiscriminadamente.'],
['C09','1.9(h)','src/componentes/EditorFicha.tsx:26; src/componentes/EditorMedida.tsx:28','.salvar-cabecalho; disabled={salvando}/disabled={ocupado}','Salvar habilitado com formulário vazio é lógica fora do escopo; nenhum componente ou regra de negócio alterado.'],
['C10','Condição adicional de 2.1','src/estilos/paleta-clara.css; src/estilos/contraste-claro.css; src/estilos/controles.css','--borda-controle-legada-claro / --controle-borda','Unificação #7c8d76 → #6f8560 pendente para a Fase 3. Não fundir cores nem redirecionar --controle-borda. O token novo da tentativa foi removido pela reversão.']
];
bugs+=table(['ID','Referência','Arquivo:linha do baseline','Seletor/token','Comportamento preservado'],entries);
bugs+='\nComentários planejados e usados na tentativa, agora revertidos:\n\n```css\n'+entries.map(([id])=>'/* BUG-'+id+': manter até Fase 3 */').join('\n')+'\n```\n';
bugs+='\n## Item 1.9(f): correções existentes do claro preservadas\n\nStatus e segmented principais já estavam corrigidos. Não se reintroduziu o diagnóstico antigo. As bordas legadas remanescentes não foram unificadas com #6f8560.\n';
bugs+='\n## Duas regras globais mantidas literais por exclusão\n\nAmbas atingem Conta/sync e cards congelados. Seus valores não foram tokenizados na tentativa. O comentário abaixo foi inserido antes de cada regra e revertido junto com todo o lote, por exigência do gate. As regras atuais continuam idênticas ao baseline.\n';
bugs+=table(['Arquivo:linha do baseline e atual após reversão','Seletor','Propriedade','Valor','Motivo'],plan.records.filter(r=>r.global).map(r=>[r.file+':'+r.originalLine,r.selector,r.property,r.originalValue,r.reason]));
bugs+='\n```css\n/* SEM-BASELINE: literal #7c8d76 mantido; tokenizar após aprovação do lote Conta */\n```\n';
bugs+='\n## Fechamento das 171 ocorrências do Apêndice D\n\nContagem **da tentativa revertida**, por declaração, excluindo comentários e a definição do token novo:\n';
const byFile={};for(const r of plan.records){byFile[r.file]??={tokenizadas:0,'literais-por-exclusao':0,'literais-conta-sync':0};byFile[r.file][r.category]+=r.count}
bugs+=table(['Arquivo','Tokenizadas na tentativa','Literais por exclusão','Literais Conta/sync/conflito/revisão','Total original'],Object.entries(byFile).map(([f,c])=>[f,c.tokenizadas,c['literais-por-exclusao'],c['literais-conta-sync'],Object.values(c).reduce((a,b)=>a+b,0)]));
bugs+='\n**138 + 12 + 21 = 171**. As 12 por exclusão são **2 globais + 10 de cards congelados**. Após reversão, o estado efetivo é **0 tokenizadas e 171 literais originais**; nenhum token novo ficou no app.\n';
bugs+='\n### Todas as ocorrências preservadas por exclusão\n';bugs+=table(['Arquivo:linha','Seletor','Propriedade','Valor literal','Categoria','Motivo'],plan.records.filter(r=>r.category!=='tokenizadas').map(r=>[r.file+':'+r.originalLine,r.selector,r.property,r.originalValue,r.category,r.reason]));
fs.writeFileSync(path.join(root,'revisao/BUGS-PRESERVADOS.md'),bugs);
let report=`# Relatório do Lote 2.1 — REPROVADO E REVERTIDO

Data: 25/10/2026. **A execução parou na primeira falha, sem nova tentativa e sem avançar para outro lote.**

## Resultado do gate

- Referência ampliada, antes de alterar o CSS: **72/72 imagens com pixel diff = 0** contra a Fase 0; **${before.states.length} estados individuais** registrados, com confirmação dos pseudoestados via CDP.
- Todos os estilos CSS computados dos elementos visíveis, dos pseudo-elementos presentes e dos tokens existentes foram registrados. Cada estado foi forçado em um único controle por vez: hover, active, focus-visible e disabled. Os estados armazenam deltas completos contra a referência normal; comparar referência + delta cobre todas as propriedades medidas, sem reduzir a lista a cores/tamanhos selecionados.
- Pós-lote: **escuro/Hoje teve pixel diff = 0, mas diff de estilos computados diferente de zero**. O gate encerrou antes das outras 71 capturas e antes da matriz pós-lote. Portanto **não há aprovação 72/72 nem da matriz pós-lote**.
- O diagnóstico salvo mostra nomes adicionais fora da lista dos 124 tokens propostos: \`--ease-in-out\`, \`--ease-out\` e \`--tw-outline-style\`. Os cinco primeiros elementos divergentes registraram essas adições. O arquivo de diagnóstico limita a amostra a cinco elementos; não se afirma contagem exaustiva de todas as divergências.
- Valores observados: \`cubic-bezier(0.4, 0, 0.2, 1)\`, \`cubic-bezier(0, 0, 0.2, 1)\` e \`solid\`. Os dois primeiros aparecem no tema local do Tailwind, \`node_modules/tailwindcss/theme.css:435–436\`. O motivo exato de entrarem na geração nesta recompilação ainda requer investigação. Varredura de artefatos/tooling é hipótese, não causa fechada. Eles não foram acrescentados silenciosamente à lista permitida para fazer o gate passar.
- **Reversão automática concluída.** SHA-256 confirmou os **169 arquivos de src/ da cópia e 153 de src/ do original idênticos aos manifestos da Fase 0**, sem arquivos novos de src/. \`src/estilos/tokens.css\` foi removido. Renderizadores, componentes congelados e testes preservados.
- \`npm.cmd test\`: **278 testes / 46 arquivos passaram**; execução iniciada em paralelo ao gate, 28,41s. \`npm.cmd run build\` terminou com código 0, também em paralelo à reversão; **não certifica a implementação rejeitada** porque o momento de leitura das fontes pode ter ocorrido durante/depois da restauração. Os artefatos dist/ são ignorados e não foram publicados.

Evidências: [antes/resultado.json](antes/resultado.json), [depois/resultado.json](depois/resultado.json), [diagnóstico](depois/escuro-hoje-diferencas.json), [reversão e hashes](reversao-verificada.json), [build](build.txt), [testes](testes.txt).

## Arquivos

Arquivos-fonte tentados e integralmente revertidos: \`src/index.css\`, \`src/estilos/controles.css\`, \`src/estilos/novo-visual.css\`, \`src/estilos/paleta-clara.css\`, \`src/estilos/contraste-claro.css\`; o novo \`src/estilos/tokens.css\` foi removido. \`superficies.css\` não foi alterado. Nenhum arquivo de JSX, lógica ou testes foi modificado.

Ficaram apenas documentação e evidências em \`revisao/lote-2.1/\` e [BUGS-PRESERVADOS.md](../BUGS-PRESERVADOS.md). Os scripts de aplicação/reversão são tooling de revisão, não arquivos do app. O backup \`originais.json.gz\` contém exclusivamente os cinco CSS anteriores, sem variáveis de ambiente ou credenciais.

## Tokens da tentativa

**124 nomes novos propostos, 0 mantidos no app após reversão.** Nenhum token existente foi renomeado, removido ou redirecionado. A camada nova apontava para os tokens anteriores, não o inverso; escalas usavam somente literais já presentes. Os blocos eram \`:root, :root[data-tema="escuro"]\` e \`:root[data-tema="claro"]\`, sem @layer. A maior especificidade do bloco claro em relação ao fallback :root evita depender da ordem desses dois blocos novos; a cascata legada não foi reorganizada.

**Escuro medido abaixo refere-se à tentativa rejeitada**, não ao estado atual restaurado. **Claro não foi medido no pós-lote**, pois o gate parou antes. A coluna Claro previsto resolve aliases sobre os tokens da referência clara anterior; não é apresentada como comprovação de estilos do lote.
`;
report+=table(['Nome novo','Declaração escuro','Declaração claro','Escuro computado na tentativa','Claro previsto por alias/literal — NÃO MEDIDO'],proposed.map(t=>[t.name,t.dark,t.light,computed.escuro[t.name]??'não medido',resolve(t.light,'claro')??'não resolvido']));
report+='\nA lista literal está em [tokens-propostos.json](tokens-propostos.json); o CSS da proposta em [tokens-propostos.css](tokens-propostos.css). Nenhum desses dois arquivos é importado pelo aplicativo restaurado.\n';
report+='\n## Mapeamento #7c8d76\n';report+=table(['Arquivo','Tokenizadas na tentativa','Literais por exclusão','Literais Conta/sync','Total'],Object.entries(byFile).map(([f,c])=>[f,c.tokenizadas,c['literais-por-exclusao'],c['literais-conta-sync'],Object.values(c).reduce((a,b)=>a+b,0)]));
report+='\n**138 + 12 + 21 = 171** ocorrências do Apêndice D. As exclusões discriminadas e os comentários solicitados estão em BUGS-PRESERVADOS.md. A unificação #7c8d76 → #6f8560 segue pendente para a Fase 3. Após reversão: **0 substituições persistidas**. Nenhuma das 97 declarações foi removida.\n';
report+='\n## Riscos e pendências\n\n1. A geração de CSS do Tailwind pode introduzir custom properties adicionais sem diferença imediata de pixels. A camada de geração precisa ser investigada antes de autorizar nova tentativa; não se alterou configuração de fontes, pipeline, allowlist ou baseline para contornar a falha.\n2. Conta/entrada/cadastro, sync, conflito e revisão continuam sem baseline completo e fora da migração. As duas regras globais e todos os seletores protegidos foram mantidos literais na tentativa e byte a byte originais após reversão.\n3. Sem comparação pós-lote completa, nenhum ganho de previsibilidade, acessibilidade ou desempenho foi certificado. Os bugs continuam preservados.\n4. A reversão dos arquivos-fonte foi verificada por hashes; não foi executado outro percurso visual após ela, respeitando a condição de parar. O CSS gerado e os caches de ferramentas não são equivalentes à prova de igualdade das fontes.\n\n**Aguardar decisão do usuário. Não reaplicar o lote nem executar outro lote automaticamente.**\n';
fs.writeFileSync(path.join(__dirname,'RELATORIO.md'),report);
fs.writeFileSync(path.join(__dirname,'resumo-final.json'),JSON.stringify({status:'reprovado-e-revertido',beforeScreens:before.normal.length,beforeStates:before.states.length,postScreens:after.normal.length,pixelDiffFirst:after.normal[0]?.pixelDiff,styleDiffFirst:after.normal[0]?.styleDiff,postStateMatrixCompleted:false,newTokensProposed:proposed.length,newTokensPersisted:0,totalsAttempt:plan.totals,reversionPassed:reversion.reverted,buildCompleted:true,buildCertifiesAttempt:false,testsPassed:278,testsFiles:46},null,2));
console.log(JSON.stringify({report:'revisao/lote-2.1/RELATORIO.md',bugs:'revisao/BUGS-PRESERVADOS.md',reverted:reversion.reverted,phase:'parado'}));
