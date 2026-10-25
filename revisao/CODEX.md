# Auditoria Codex — revisão do projeto existente

Data: 16/10/2026. Base local: branch `test`, HEAD `63efda1fb56b9089a355719b0a5c3aae72313a9a`.

**Estado: auditoria local e validação da entrega Gemini concluídas; revisões consolidadas em [CONSOLIDADO.md](CONSOLIDADO.md). Etapa 8 permanece em homologação e não foi continuada nem aprovada.** Este relatório não equivale à homologação de iPhone, e-mail ou serviços remotos. A análise independente abaixo foi preservada; decisões posteriores e inventário final estão no consolidado.

**Atualização após autorização do bloco 1:** A01/A02 implementados e verificados localmente; pendentes de homologação. C01/C02/C03/C07 agora são regressões do comportamento esperado. Suíte atual: **95 testes em 12 arquivos, lint e build aprovados**. A coordenação do vínculo também foi reforçada no escopo necessário à restauração. Ver [CORRECOES.md](CORRECOES.md) para semântica, arquivos e limitações; as seções seguintes preservam o diagnóstico anterior às correções.

Foram lidos `AGENTS.md`, `README.md`, `CONTINUAR-AMANHA.md`, `GEMINI.md` da raiz e `revisao/PLANO.md`. A alteração preexistente de `.gitignore` foi preservada. Nenhum segredo, `.env.local`, credencial ou token foi lido. Não houve publicação, push, merge, tag, envio de e-mail nem SQL remoto. Arquivos desta rodada: este relatório e `revisao/auditoria.test.ts`; nenhuma correção funcional foi aplicada.

## Resultado e validação

- **8 achados distintos na passagem independente:** 2 de gravidade alta, 5 média e 1 baixa. Dois testes (C01/C02) demonstram variações de um mesmo achado, consolidadas abaixo. Após validar Gemini, o inventário final tem 10 itens técnicos e 2 pendências de homologação, detalhados em CONSOLIDADO.md.
- `npm.cmd test`: **74 testes passaram em 10 arquivos** (66 anteriores + 8 reproduções de auditoria).
- `npm.cmd run lint`: passou, inclusive após acrescentar as reproduções.
- `npm.cmd run build`: passou, com TypeScript, Vite e geração de service worker; precache com 23 entradas. Executado antes de adicionar os testes, sem alterações posteriores em código de produto/configuração de build.
- `npm.cmd test -- revisao/auditoria.test.ts`: reproduções C01–C07; a execução completa também inclui C03 SQL, que usa a migração real em PGlite e confirma o erro `23505`.
- Os testes usam `fake-indexeddb` em memória e Postgres embarcado efêmero. As chamadas `banco.delete()` nesses testes não acessam o IndexedDB do navegador nem os dados reais do usuário.

**Atenção ao significado dos testes:** as novas assertions documentam o comportamento defeituoso atual. Passarem confirma a reprodução, não a correção. Quando os defeitos forem corrigidos, converter essas assertions para o comportamento esperado antes de aceitar a entrega. O TypeScript do build cobre `src`, não `revisao`; os testes de auditoria foram executados pelo Vitest e conferidos pelo ESLint.

## Achados confirmados por reprodução

### A01 — Alta — Substituir backup não substitui o estado de sincronização (C01 e C02)

Referências: `src/dados/backup.ts:52`, especialmente `:56`; `src/sincronizacao/motor.ts:68`, `:109`, `:114` e `:120`; promessa na UI em `src/componentes/BackupConfiguracoes.tsx:16`.

**Cenário 1:** sincronizar fichas A+B; importar em modo substituir um backup anterior contendo somente A; sincronizar novamente. B reaparece. **Cenário 2:** preparar backup sem uma ficha; criar a ficha; falhar o envio, deixando-a pendente; substituir pelo backup; sincronizar. A ficha ausente do arquivo é enviada e volta ao aparelho. Ambos foram reproduzidos automaticamente.

**Causa:** a substituição limpa apenas `banco.tables`. Vínculo, recibos e pendências vivem em outro Dexie. `prepararFila` percorre somente registros presentes e não remove pendências de IDs desaparecidos; o download também reinsere os registros remotos ausentes.

**Esperado:** uma restauração com semântica explícita e coerente, sem reenvio silencioso de dados removidos pela restauração. **Impacto:** desfazimento da recuperação pretendida e envio de conteúdo que o usuário julgava ter removido. Não se trata de a restauração apagar imediatamente a nuvem: hoje não há reconciliação nem aviso claro dessa consequência.

**Correção sugerida, sem implementá-la nesta rodada:** definir se substituir significa apenas restauração local temporária ou restauração que será reconciliada com a conta; coordenar importação, fila, recibos e sync sob exclusão mútua; eliminar pendências obsoletas e tratar tombstones/versões conforme a semântica escolhida. Limpar a fila isoladamente não impede a volta de B do servidor.

### A02 — Alta — Colisão por data bloqueia a sincronização sem resolução acessível para atividade (C03)

Referências: `src/dados/atividade.ts:23` e `:29`; `src/sincronizacao/motor.ts:109`–`:120`; `src/sincronizacao/transporte.ts:8`; `supabase/migrations/202610140001_conta_sincronizacao.sql:26`; `src/componentes/EditorAtividade.tsx:15`.

**Reprodução:** dois aparelhos criam offline atividades para `2026-01-01`, com IDs diferentes. O primeiro envia; o segundo falha no índice único. Repetir a sincronização falha novamente antes do download dessa tabela. O teste do motor usa transporte simulado com essa restrição; um segundo teste executa a RPC da migração real em PGlite e confirma `23505`, preservando o primeiro registro.

**Esperado:** conflito visível e caminho para escolher/mesclar o registro e retomar a fila. **Observado:** mensagem genérica de revisão; a tela de atividade permite editar valores, mantém a data bloqueada no registro existente e não oferece exclusão ou resolução de IDs. Editar valores não remove a colisão. A falha interrompe também as tabelas seguintes desse ciclo.

**Impacto:** aparelho fica sem sincronizar parte dos dados e sem recuperar o registro concorrente por esse fluxo. A mesma classe de colisão existe nos índices de medidas, água e consumo, mas não foi reproduzida separadamente; água/consumo ainda não têm fluxo implementado.

**Correção sugerida:** resolução explícita que preserve os dois conteúdos até a decisão e permita aposentar/reconciliar o ID conflitante; assegurar progresso das demais tabelas sem declarar o ciclo integralmente concluído. Não remover o índice único simplesmente.

### A03 — Média — Treino livre com cardio não pode ser salvo como ficha (C04)

Referências: `src/telas/ModoTreino.tsx:169`; `src/dados/fichas.ts:8`; `src/dados/treinos.ts:30` (cardio retorna sem criar séries).

**Reprodução:** iniciar treino livre, adicionar Esteira pela biblioteca, informar nome e usar Salvar como ficha. A transformação da UI usa a quantidade de séries do exercício, igual a zero para cardio. `salvarFicha` rejeita qualquer item com menos de uma série. O teste executa essa mesma transformação contra o repositório real e recebe “Use 1 a 20 séries”. O mesmo obstáculo ocorre com mais de 20 séries de força, alcançáveis por Série extra.

**Impacto:** impede reaproveitar treinos mistos ou somente cardio. **Esperado:** permitir planejar cardio sem séries de musculação e tratar limites de força explicitamente. **Sugestão:** alinhar o modelo de planejamento e sua validação por tipo; incluir regressão de treino misto, somente cardio e séries extras.

### A04 — Média — Validação do backup aceita dados fora do domínio e vínculos órfãos (C05)

Referências: `src/dados/backup.ts:13`, `:31`–`:49` e `:56`; validações mais restritas em `src/utilitarios/treino.ts:12`, `src/dados/medidas.ts:12` e `src/dados/cardio.ts:16`.

**Reprodução:** partir de um backup válido, acrescentar série com `treino_id`/`exercicio_id` inexistentes, carga `-10` e repetições `-5`; validar e importar em modo substituir. A importação é aceita e persiste a série inválida. O teste confirma ambos os passos.

**Causa:** números são verificados como finitos, mas sem limites de domínio ou integridade referencial. Reduções também não recebem a mesma validação usada na conclusão da série.

**Impacto:** backup editado ou corrompido pode substituir dados bons por registros que os fluxos normais recusariam, produzir métricas incorretas e deixar séries sem acesso pelos exercícios/treinos. Não foi demonstrada execução de script ou leitura entre contas; não classificar como tal.

**Sugestão:** validar domínio e referências antes de qualquer escrita, com regras compatíveis com tombstones e versões históricas; rejeitar integralmente ou oferecer recuperação explícita de registros inválidos. Preservar os testes existentes de rollback.

### A05 — Média — Sincronizar adia indefinidamente o lembrete de backup das fotos (C06)

Referências: `src/dados/backup.ts:77`–`:79`; `src/componentes/LembreteBackup.tsx:12`; `src/sincronizacao/motor.ts:8` (fotos fora do sync).

**Reprodução:** configuração criada em janeiro, nunca fez backup, sincronização em 15/10; em 16/10 o lembrete de 14 dias retorna falso. Sincronizar frequentemente mantém esse resultado mesmo havendo fotos apenas locais. Teste confirma a decisão da função; a inexistência de envio de fotos foi verificada no motor e nos testes anteriores.

**Impacto:** usuário pode perder a única cópia das fotos sem receber o lembrete periódico. **Esperado:** proteger também os dados que a sincronização não cobre. **Sugestão:** acompanhar backup completo/com fotos separadamente e não considerar sync de registros equivalente à cópia das imagens.

### A06 — Média — Primeiro vínculo não é atômico entre contas concorrentes (C07)

Referências: `src/sincronizacao/motor.ts:48`–`:52`; `src/sincronizacao/estado.ts:34`–`:38` e `:48`.

**Reprodução:** em armazenamento ainda sem dono e com registros `user_id=null`, executar `Promise.allSettled([vincular(A), vincular(B)])`. Ambas as chamadas concluem com sucesso. A checagem do vínculo e sua gravação não estão numa operação atômica. O lock de sincronização está em `sincronizar`, após o preparo/vínculo.

**Esperado:** um único vencedor; a outra conta deve receber o bloqueio de aparelho já vinculado. **Impacto confirmado:** quebra da exclusividade do primeiro vínculo. **Limite:** o teste usa concorrência das funções reais no mesmo processo; não reproduz duas abas com Supabase, troca de sessão ou envio indevido. Vazamento entre contas é um risco a investigar, não um resultado demonstrado.

**Sugestão:** serializar e revalidar toda a operação de primeira conexão, incluindo download inicial, confirmação do dono e sync, com proteção entre abas e captura estável do usuário. Cobrir também cancelamento/troca de sessão e importação concorrente.

## Achados por inspeção de código, sem reprodução em navegador

### A07 — Baixa — Maior carga no treino inclui sessões removidas do histórico

Referência: `src/telas/ModoTreino.tsx:181`–`:184`. A consulta `todas` exclui séries apagadas/aquecimento, mas não filtra o estado do treino pai. `removerTreino`, em `src/dados/historico.ts:12`, apaga logicamente só a sessão para permitir desfazer.

**Cenário verificável:** ter sessão válida de 20 kg e outra de 100 kg; remover a de 100 kg do histórico e abrir novamente o exercício num treino. A consulta do rótulo “Maior carga já registrada” ainda encontra a série de 100 kg, embora os recordes de evolução excluam a sessão. **Impacto:** referência divergente entre telas. **Sugestão:** usar o mesmo conjunto de sessões elegíveis da evolução. Conclusão sobre a consulta confirmada por leitura; interação visual ainda não executada.

### A08 — Média — Ao trocar/remover foto do card, o compartilhamento conserva o Blob anterior

Referência: `src/componentes/CardCompartilhavel.tsx:11`–`:21`.

O efeito inicia uma nova geração, mas não limpa `blob`/`url` nem marca a geração como ocupada. Seu cleanup revoga a URL anterior; o botão continua habilitado pelo Blob anterior. Se a nova foto falhar ao decodificar, o catch só registra erro e esse estado persiste.

**Cenário verificável:** gerar card com foto A, removê-la ou escolher foto B inválida e acionar Compartilhar antes de nova geração válida. Em navegador com compartilhamento nativo, o handler ainda monta o arquivo a partir do Blob de A. **Impacto potencial:** compartilhar a foto anterior apesar da remoção/troca indicada na UI; download pode apontar para URL já revogada. **Sugestão:** invalidar artefato anterior, bloquear compartilhar/baixar durante geração e após falha; testar troca rápida, remoção e erro de imagem. A cadeia de estado é identificável no código; compartilhamento nativo não foi executado.

## Cobertura, controles existentes e limitações

| Área | Revisão local e evidências | Limites / próximos testes |
| --- | --- | --- |
| Dexie, integridade, migrações | Modelos, versões 1–5, repositório, biblioteca e transações; testes de reabertura, inicialização concorrente, soft delete e migrações 1→atual, 2→atual e grupos antigos | Sem navegador com base histórica real. Testes de migração constroem parte do schema a partir do atual; falta fixture exata de cada versão distribuída e regressão dedicada da migração 5 com concluídas/pendentes |
| Biblioteca e fichas | Editores, busca, duplicação, ordenação, exclusão/desfazer, fotos e cópia do planejamento; A03 | Limites de séries extras e edição concorrente ainda precisam de cenários de UI |
| Treino e descanso | Persistência por série, carga por lado, drop set, aquecimento, descanso por timestamp, áudio, Wake Lock, resumo e troca de treino; testes existentes cobrem cálculos e andamento | Safari/iPhone: som após gesto, bloqueio de tela, retorno, fallback NoSleep, câmera/HEIC. Calorias usam tempo decorrido da sessão; não inferir tempo ativo medido |
| Histórico, evolução e card | Cálculos de carga/volume/Epley, recordes cronológicos, peso corporal, sugestão/estagnação, remoção/desfazer, canvas; A07/A08 | Sem renderização visual do card ou compartilhamento nativo. “Maior carga” usa consulta diferente da evolução |
| Medidas, cardio e atividade | Validação de datas locais, parciais, metas congeladas, pesos, fator de cardio, modos soma/total manual, velocidade/ritmo, feriados, gráficos e editores; testes existentes; A02/A03 | Estimativas não são medições de gasto. Não foi auditada validade clínica dos METs; aqui foram verificados comportamento/cálculo do software |
| Backup e recuperação | JSON com Blob/base64, CSV com escape de fórmulas, validação, mesclagem, substituição, rollback e fotos ausentes; A01/A04/A05 | Memória/armazenamento com arquivos de 250 MB e dados corrompidos em todas as tabelas não testados. Restaurar arquivo de outra conta ainda exige fluxo explícito de orientação |
| UI mobile, acessibilidade e erros | Leitura de telas/componentes e regras de layout: safe areas, dialog, labels, estados ARIA, listbox com teclado, confirmação dos seletores, mensagens, redução de movimento e alternativa textual dos gráficos | Não houve QA visual em 360/390/430 px, teste por teclado em navegador ou VoiceOver. Diálogos aninhados, foco/restauração, contraste, zoom, teclado virtual e nomes longos permanecem por homologar. Lint não certifica acessibilidade |
| PWA e offline | Manifest, registro/update, precache, chunks lazy e geração do service worker; sem cache de respostas de conta configurado no Workbox | Não reabri app em modo avião nem testei atualização com app já instalado. Build/precache não comprovam funcionamento offline em Safari |
| Conta e recuperação | Formulários, OTP, nova senha, entrada local, sessão/saída, configuração do cliente e template de e-mail lidos; A06 | Nenhum login, código, SMTP ou configuração atual remota foi consultado. Diferença do mesmo e-mail celular/PC continua pendente. Não assumir que template local já foi aplicado |
| Fila, conflitos e SQL/RLS | Motor, transporte, recibos, tombstones, paginação, LWW, assinatura estável e primeiro aparelho; testes de falha/retomada e 405 registros; SQL real em PGlite; A01/A02/A06 | RLS anterior testa leitura/escrita cruzadas, anônimo e caminho de bucket em fixture local. Isso não atesta políticas/configuração do Supabase hospedado, Storage real, Auth real ou múltiplas abas |
| Build/CI e documentação | Scripts, TS/ESLint, workflow de validação, configuração Vercel, instruções de homologação e template | Não consultados remoto/deploy atual. README contém descrições históricas superadas (p.ex. versão 3 do banco versus 5 no código); usar código/testes e não aquelas notas como prova do estado atual |

As áreas de alimentação, água, fotos de progresso e tema claro têm modelos/placeholders/planejamento, mas não foram tratadas como funcionalidades completas já entregues. A auditoria não iniciou as etapas seguintes.

## Hipóteses e verificações ainda necessárias

- Interleavings entre duas abas: `prepararFila` disparado pelo liveQuery, sync, importação, mudança de sessão e preparo do primeiro login. A06 prova somente a corrida no vínculo; não prova todas essas consequências.
- Mais de um treino ativo vindo de aparelhos distintos: a criação local é transacional, mas o protocolo sincroniza treinos por ID; falta verificar a seleção/recuperação desse estado na UI.
- Integridade em recebimento parcial: cada tabela/lote é aplicado separadamente e a validação remota é mais estreita que a do backup. Investigar fechamento/erro entre tabelas e registros malformados da própria conta. Não foi demonstrado bypass de RLS.
- Reabertura de sessão ativa migrada da versão 2: a migração cria a tabela de itens sem reconstruir o planejamento das séries antigas. A fixture existente comprova preservação das séries, mas não que elas permaneçam editáveis no fluxo atual. Reproduzir a UI com fixture histórica exata antes de classificar como achado.
- O comportamento de atualizar cardio planejado ao retomar a ficha está explicitamente coberto pelos testes atuais. Não foi classificado automaticamente como erro de snapshot; eventual mudança depende do requisito pretendido.

## Gemini e consolidação das duas revisões

O usuário avisou a conclusão e a entrega `revisao/GEMINI.md` foi lida integralmente. Seus 11 apontamentos foram avaliados: **6 confirmados, 3 parcialmente confirmados e 2 não reproduzidos, mantidos como pendências de homologação**. Matriz de decisão, duplicatas, divergências, prioridades e limitações estão em [CONSOLIDADO.md](CONSOLIDADO.md), que é a referência para a futura rodada de correções. O relatório original do Gemini foi preservado.

Reproduções novas: C08 confirma a flag de recorde indevida na primeira sessão (GEM-06 / A09); C09 confirma a carga de sessão removida na consulta do painel e demonstra preservação dos vínculos e Desfazer (GEM-02 / A07); `gemini-entrada.test.tsx` confirma a apresentação de entrada durante restauração de sessão sem formulário de senha, sem medir flash em Safari (GEM-08 / A10).

**Validação após consolidação: 77 testes passaram em 11 arquivos (8,38 s); lint passou.** Os 74 testes/build acima registram a passagem anterior. Não houve mudança de produto nesta rodada; build não repetido. Apenas documentos e testes de revisão foram alterados. As novas assertions ainda descrevem comportamentos atuais, não correções.

Não foi aceita automaticamente a cascata de exclusão recomendada pelo Gemini: o defeito demonstrado está no filtro do painel, enquanto os filhos preservados permitem Desfazer. Também não foram aceitas como comprovadas as hipóteses de dark mode no e-mail ou falha de áudio no iPhone. A resolução de restauração com nuvem exige mais que limpar fila/recibos. A01/A02 permanecem prioritários; a ordem completa está no consolidado. Nenhuma correção, publicação ou continuação da etapa 8 foi iniciada.

---

## Histórico — primeira passagem (estado anterior, superado pela auditoria acima)

Data: 16/10/2026. Branch observada: test. Alteração preexistente: .gitignore, preservada.
Estado: EM ANDAMENTO. Não representa revisão completa de todos os componentes nem aprovação da etapa 8.

## Validação inicial

- 66 testes passaram em 9 arquivos com npm.cmd test.
- npm.cmd run lint terminou sem diagnósticos.
- Build TypeScript/Vite e geração do service worker produziram os artefatos esperados.
- Nenhum serviço remoto, sessão de usuário, envio de e-mail ou aparelho iPhone foi usado nesta verificação.

## Achados por inspeção, ainda sem reprodução automatizada

### Alta: substituir backup não reconcilia exclusões com a nuvem

Em src/dados/backup.ts, importarBackup no modo substituir limpa apenas banco.tables. O vínculo/recibos permanecem em outro Dexie (filaBanco em src/sincronizacao/motor.ts). executarSync baixa novamente todos os registros remotos e receber reinsere registros inexistentes localmente. Assim, após restaurar um backup antigo sem determinado registro, a próxima sincronização pode trazer esse registro de volta. A UI promete restaurar exatamente o arquivo, mas não explica a consequência da próxima sincronização. Reproduzir com armazenamento sintético: sincronizar A+B, substituir por backup contendo só A, sincronizar e verificar retorno de B. Definir a semântica desejada antes de corrigir; não testar com dados reais.

### Alta: colisões independentes na mesma data impedem progresso

Em src/dados/atividade.ts, salvarAtividade cria ID aleatório se não houver registro local da data. Dois aparelhos offline podem criar IDs diferentes para o mesmo dia. O índice atividade_data_dono na migração SQL rejeita o segundo envio; executarSync envia antes de baixar e encerra na falha. A mensagem manda revisar registros, mas é necessário verificar um caminho real para resolver a colisão e retomar, sem perder dados. O mesmo cenário merece cobertura em medidas e outras tabelas por data. A rejeição é explícita no código; ainda falta reprodução ponta a ponta e avaliação da recuperação disponível na UI.

## Pendências da auditoria

- Reproduzir e classificar os dois cenários acima com testes sintéticos.
- Completar leitura dos componentes, cálculos, acessibilidade e fluxos mobile/offline.
- Rever concorrência de vínculo, importação, sincronização e troca de sessão entre abas.
- Executar revisão independente do Gemini e validar todos os seus achados.
- Homologação real de sincronização entre aparelhos e comparação do e-mail celular/PC permanecem pendentes conforme CONTINUAR-AMANHA.md.
