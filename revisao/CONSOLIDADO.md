> A07 aprovado em 18/10/2026 após revisão independente da entrega Gemini: filtro por pai não removido, sem cascata, com Desfazer preservado. Evidências em CODEX-A07.md. 123 testes, lint e build passaram. Tabela original abaixo é registro histórico da auditoria.

> Atualização de continuidade em 17/10/2026: este relatório preserva as conclusões da auditoria inicial. A01/A02/A06 receberam correções e regressões posteriores; A08 teve a invalidação de imagem anterior corrigida na implementação dos novos cards, ainda pendente de homologação de interação/clipboard no aparelho. Os demais itens e as limitações não devem ser considerados resolvidos pelo simples sucesso da suíte. Status de retomada e pendências atuais em `../CONTINUAR-AMANHA.md`; histórico detalhado em `CORRECOES.md`. Etapa 8 continua sem aprovação. Última validação funcional: 121 testes, lint e build.

# Revisão consolidada — Codex e Gemini

Data: 16/10/2026. Base local: `test`, HEAD `63efda1fb56b9089a355719b0a5c3aae72313a9a`.

**Validação dos 11 apontamentos do Gemini e consolidação concluídas. Bloco 1 de correções implementado localmente após autorização do usuário; etapa 8 continua em homologação, sem aprovação.**

Atualização posterior à auditoria: A01/A02 corrigidos localmente, aguardando homologação; parte da coordenação de A06 também foi reforçada. **95 testes passaram em 12 arquivos; lint e build passaram.** Comportamento da restauração, decisões, arquivos, regressões e limites estão em [CORRECOES.md](CORRECOES.md). A matriz abaixo preserva o diagnóstico e a prioridade originais; as contagens de 77 testes se referem à consolidação anterior às correções.

Fontes preservadas: [CODEX.md](CODEX.md) e [GEMINI.md](GEMINI.md). Este documento contém a decisão final sobre duplicatas, divergências, prioridades e limites de evidência. A entrega do Gemini tem 26.384 bytes e foi observada com modificação em 16/10/2026 às 15:36; seu conteúdo não foi alterado pelo Codex.

## Resultado

- Dos 11 apontamentos Gemini: **6 confirmados, 3 parcialmente confirmados e 2 não reproduzidos, mantidos como pendências de homologação**.
- Fila consolidada: **10 itens técnicos distintos**, com 2 de gravidade alta, 6 média e 2 baixa. Inclui os oito itens Codex e dois novos itens provenientes do Gemini; A08 permanece sustentado por inspeção, sem compartilhamento nativo executado.
- GEM-09 e GEM-10 ficam fora dessa contagem de defeitos: são H01/H02, riscos que exigem teste em ambiente real.
- **77 testes passaram em 11 arquivos**, incluindo 3 verificações acrescentadas nesta validação. `npm.cmd run lint` também passou.
- O build da auditoria anterior passou. Não foi repetido porque nesta rodada só mudaram documentos e testes de revisão; `src`, SQL, dependências e configuração funcional não foram alterados. Os testes de revisão não integram o escopo TypeScript de `tsconfig.app.json`.

As assertions de auditoria registram os defeitos observados. O sucesso da suíte não significa que esses defeitos estejam corrigidos. Toda futura correção deverá converter a respectiva reprodução em teste do comportamento esperado.

## Decisão por apontamento Gemini

| Gemini | Decisão | Item final / gravidade | Evidência e ajuste de escopo |
| --- | --- | --- | --- |
| GEM-01 | Confirmado | A03 / Média | C04 reproduz a transformação da UI e rejeição de zero séries em cardio. É bloqueante para Salvar como ficha nesse cenário, mas não impede os demais registros/treinos; gravidade reduzida de alta para média |
| GEM-02 | Parcialmente confirmado | A07 / Baixa | C09 confirma consulta de carga máxima incluindo treino removido. Também confirma que o pai permanece como tombstone, os filhos conservam o vínculo e Desfazer recupera a sessão. Não há prova de órfãos nem necessidade demonstrada de exclusão em cascata |
| GEM-03 | Confirmado | A01 / Alta | C02 confirma pendência descartada pela restauração sendo enviada; C01 demonstra também retorno de registro já remoto. Limpar fila/recibos isoladamente não resolve o segundo caso. Envio indesejado à própria conta não demonstra vazamento entre contas |
| GEM-04 | Confirmado | A05 / Média | C06 confirma supressão do lembrete por sync; fotos estão fora do protocolo. Mantida média por ser risco de proteção/recuperação, sem perda física reproduzida |
| GEM-05 | Parcialmente confirmado | A02 / Alta | C03 e C03 SQL confirmam colisão e erro 23505. O ciclo é por tabela: tabelas anteriores podem já ter sido enviadas/baixadas. “Nenhuma tabela é sincronizada” é incorreto; o lote conflitante e o restante do ciclo são interrompidos. Atividade não tem caminho de resolução acessível; medidas oferecem edição de data/remoção |
| GEM-06 | Confirmado | A09 / Média | C08 executa `concluirSerie` com 50 e 60 kg na primeira sessão: flags false/true; `recordesDoTreino` e histórico recalculado retornam zero conquistas. Novo achado confirmado |
| GEM-07 | Confirmado | A04 / Média | C05 confirma importação de números negativos e série órfã. Validar apenas `>=0` é insuficiente: reps/medidas/duração exigem regras próprias, limites, inteiros e referências |
| GEM-08 | Parcialmente confirmado | A10 / Baixa | Teste de renderização estática monta apresentação de entrada e “Abrindo sua sessão…” antes de restaurar usuário; formulário de senha não é exibido nesse estado. Flash perceptível e frequência no PWA/Safari não foram medidos |
| GEM-09 | Não reproduzido | H01 / Homologação | Cores base e ausência de metadados são fatos do HTML; inversão, corte e perda de legibilidade no cliente de e-mail são hipóteses sem comparação da mesma mensagem. Não aceita a classificação de vulnerabilidade comprovada |
| GEM-10 | Não reproduzido | H02 / Homologação | `tocarTom` ignora contexto não running, confirmado por leitura. A suspensão e retomada no iPhone não foram executadas. O app já preserva painel visual após zerar; não há promessa de notificações em segundo plano. Não aceito como falha física comprovada |
| GEM-11 | Confirmado | A06 / Média | C07 prova que ambos os vínculos concorrentes são aceitos. Elevação de baixa para média: a exclusividade do dono é uma proteção de dados, inclusive entre abas. Não foi demonstrado envio para conta errada |

## Inventário único e prioridades

Os IDs A01–A08 foram preservados para manter a rastreabilidade com a auditoria independente do Codex.

| ID | Gravidade | Problema / resultado esperado da futura correção | Origem / evidência |
| --- | --- | --- | --- |
| A01 | Alta | Restauração e sincronização devem ter semântica explícita, sem reenvio de pendências descartadas nem retorno silencioso que contradiga Substituir tudo | Codex + GEM-03; `backup.ts:56`, `motor.ts:68` e `:109`; C01/C02 |
| A02 | Alta | Colisão por data deve oferecer resolução preservando conteúdo e permitir retomada do ciclo | Codex + GEM-05; `atividade.ts:29`, `motor.ts:109`, SQL `:25`–`:28`; C03 e C03 SQL |
| A06 | Média | Primeiro vínculo deve ter um único vencedor, revalidando dono/sessão entre abas e operações concorrentes | Codex + GEM-11; `motor.ts:48`, `estado.ts:34`; C07 |
| A04 | Média | Importação deve rejeitar dados fora do domínio e referências inválidas antes da escrita, preservando compatibilidade histórica e tombstones | Codex + GEM-07; `backup.ts:31`; C05 |
| A05 | Média | Lembrete deve proteger fotos que a sincronização não inclui | Codex + GEM-04; `backup.ts:77`; C06 |
| A03 | Média | Salvar treino livre como ficha deve aceitar cardio e tratar corretamente limites de séries de força | Codex + GEM-01; `ModoTreino.tsx:169`, `fichas.ts:8`; C04 |
| A08 | Média | Trocar/remover foto deve invalidar o Blob anterior e bloquear compartilhar/baixar enquanto o novo artefato não estiver válido | Codex; `CardCompartilhavel.tsx:11`–`:21`; inspeção, sem execução nativa |
| A09 | Média | Flag persistida de recorde e conquista recalculada devem seguir a mesma regra, incluindo primeira sessão | GEM-06 validado; `treinos.ts:117` e `:121`, `historico.ts:18`; C08 |
| A07 | Baixa | Maior carga no painel deve excluir séries cujo treino pai está removido, preservando Desfazer | Codex + GEM-02; `ModoTreino.tsx:181`, `historico.ts:12`; C09 |
| A10 | Baixa | Abertura durante restauração de sessão pode usar apresentação neutra, evitando transição desnecessária de entrada para Hoje | GEM-08 validado parcialmente; `App.tsx:34`, `estado.ts:10`, `ContaConfiguracoes.tsx:39`; renderização estática |

Referências de código acima são relativas a `src/` e seus subdiretórios; as referências SQL são a `supabase/migrations/202610140001_conta_sincronizacao.sql`. Detalhes completos de A01–A08 permanecem em CODEX.md.

### A09 — Recorde fictício na flag persistida da primeira sessão

Na primeira sessão, concluir 50 kg × 10 e depois 60 kg × 10 deixa a segunda série com `recorde=true`, porque `anterioresSeries` também inclui a sessão ativa (`treinos.ts:117`). Porém a rotina de conquista não usa essa sessão como histórico anterior, e retorna `[]`. Após finalizar, `sessoesExercicio` também retorna zero recordes para essa referência inicial.

O teste C08 demonstra a divergência de domínio. Não foi observado troféu incorreto na tela: ela usa a rotina recalculada, não a flag persistida. O impacto comprovado é um estado persistido/sincronizável que contradiz a regra de primeira referência de `README.md:157`. A correção deverá definir a semântica única de recorde e cobrir primeira sessão, sessões subsequentes, aquecimento, peso corporal, edição e Desfazer; retirar a sessão ativa da comparação é uma candidata, não uma mudança já aceita.

### A10 — Apresentação de entrada durante restauração da sessão

O teste `gemini-entrada.test.tsx` renderiza o App real e o componente real de conta com serviços/estado sintéticos. Antes da sessão, a árvore contém “Bom ter você aqui.” e “Abrindo sua sessão…”, sem input de senha. Com usuário restaurado, contém o título de Hoje. Ele comprova a seleção das telas; não executa efeitos, `getSession`, transições temporais, autenticação real ou Safari.

É uma melhoria de apresentação de baixa prioridade, sem evidência de perda de sessão, exposição de dados ou falha de login. Não basta liberar Hoje quando `carregando=true`: qualquer ajuste futuro precisa manter uma tela neutra própria, sem mostrar prematuramente dados do aparelho.

## Divergências de correção resolvidas na revisão

1. **GEM-02: não aplicar cascata automaticamente.** A sessão removida continua existindo, com seu ID e tombstone. Filhos preservados não são órfãos apenas por terem pai apagado logicamente. O teste C09 demonstra a restauração e a divergência entre a consulta do painel (100 kg) e evolução (20 kg). A população da consulta é o defeito demonstrado. Cascata exigiria lembrar quais filhos já estavam removidos para não ressuscitá-los no Desfazer; essa alteração seria mais ampla e não foi justificada pela reprodução.
2. **GEM-03: limpar recibos/fila não basta.** Um item já confirmado na nuvem volta mesmo sem pendência anterior. Definir restauração local versus reconciliação com conta antes de implementar; não apagar o vínculo para contornar o problema.
3. **GEM-05: delimitar atomicidade.** A RPC é atômica por lote, não por todo o ciclo de tabelas. O erro pode ocorrer após envios anteriores. Não comunicar rollback global nem sucesso integral quando apenas parte progrediu.
4. **GEM-09: não alterar o template baseado só na hipótese.** O HTML já combina tabelas, estilos inline e `width:100%;max-width:460px`. A presença de `width="460"` isoladamente não demonstra corte. Textos visíveis têm cores locais; o estilo base do body isoladamente não demonstra código ilegível. A falta de metadados não comprova a causa da diferença celular/PC. Um `@media` precisa de folha de estilos, não de uma regra colocada no atributo inline.
5. **GEM-10: não prometer alarme em segundo plano.** `README.md:45` delimita que som depende do gesto/contexto e que não há notificações em segundo plano. `Descanso.tsx:28`–`:44` já mantém o painel após zerar e tenta alerta quando visível; `alerta.ts:12` exige contexto running. A proposta de manter o painel não é uma funcionalidade ausente. A retomada do áudio segue como teste físico.

## H01/H02 e demais pendências de homologação

**H01 — E-mail celular/PC:** comparar a mesma mensagem/versão em clientes e temas identificados; verificar legibilidade, largura e código, e confirmar qual HTML está aplicado no Supabase. Não atribuir a diferença a dark mode, cache ou mensagem antiga sem evidência. Nenhum e-mail foi enviado ou template remoto alterado nesta rodada.

**H02 — Áudio após bloqueio:** no iPhone físico, concluir série com som liberado, bloquear, esperar término, retornar, conferir painel e comportamento sonoro antes/depois de gesto; testar silêncio e ausência de alerta duplicado. Não há execução de hardware comprovada por nenhuma das duas entregas.

Continuam abertas as limitações da matriz de cobertura Codex: migrações com fixtures históricas exatas; base ativa antiga; cota/eviction; offline e atualização PWA real; teclado/VoiceOver/zoom; câmera; compartilhar nativo; duas abas; duas contas de teste e dois aparelhos no serviço real; edição offline/reconexão; exclusão/desfazer; LWW, retomada e configurações remotas. Não se deduz estado atual de Supabase/Vercel a partir das notas históricas.

## Evidências executadas nesta validação

- Reexecutada suíte completa: **77/77 testes, 11 arquivos, 8,38 s**, com `npm.cmd test`.
- Reexecutado `npm.cmd run lint`: sem diagnósticos.
- C08 acrescentado a `revisao/auditoria.test.ts`: confirmação de GEM-06 com funções reais de persistência e cálculo.
- C09 acrescentado ao mesmo arquivo: carga da consulta após exclusão, evolução sem sessão removida, preservação do vínculo/tombstone na nuvem simulada e restauração.
- `revisao/gemini-entrada.test.tsx`: apresentação inicial e sessão restaurada, com renderização estática React. Não é teste E2E ou homologação de dispositivo.
- C01–C07 e C03 SQL reexecutados, cobrindo as duplicatas do Gemini; nenhum teste utilizou dados reais. O SQL executado foi apenas no PGlite efêmero.
- `git diff --name-only -- src supabase package.json package-lock.json vite.config.ts` não apontou alterações funcionais. `.gitignore` preexistente preservado. Sem push, merge, deploy ou avanço de etapa.

O Gemini declara ter lido 100% dos módulos e preservado independência em relação a CODEX.md. Essas são declarações do auditor, não evidência de cobertura comportamental completa. Seus 74 testes incluem as oito reproduções Codex já disponíveis em `revisao/auditoria.test.ts`; essa execução não representa 74 cenários novos/independentes do Gemini. A consolidação usa reprodução/código para cada decisão, sem certificar retrospectivamente o processo de leitura dele.

## Próxima rodada delimitada, ainda não iniciada

Ordem proposta: A01/A02 primeiro; A06/A04 em seguida; A05/A03/A08/A09; A07/A10 depois. H01/H02 podem ser diagnosticados com evidências reais sem ampliar funcionalidades. Regressões de exclusão, backup, contas e fotos devem acompanhar as correções, preservando dados e alterações preexistentes.

Esta entrega encerra somente a validação/consolidação solicitada. Não inicia correções, não aceita automaticamente recomendações do Gemini e não autoriza publicação. A etapa 8 continua aguardando resolução dos itens pertinentes, verificação das mudanças e aprovação explícita do usuário após homologação.
> A04 corrigido localmente em 18/10/2026: validação de domínio/referências de backup antes da escrita, preservando legado e tombstones. C05 convertido em regressão, 21 testes acrescentados; suíte completa de 187 testes, lint/build passaram. Ver CORRECOES.md. Matriz abaixo permanece histórica; etapa 8 segue em homologação.
