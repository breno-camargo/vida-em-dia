# Paridade funcional — aplicativo original e protótipos

Revisão local de 22/10/2026. Branch conferida: `test`.

## Resultado e escopo

O protótipo ainda não substitui o aplicativo original. Ele representa vários fluxos de interface, mas não preserva o mesmo modelo de dados, persistência, sincronização ou conjunto de regras. Continuar acrescentando telas sem uma matriz de paridade deixa funções importantes para trás.

**Original**, neste documento, significa `src/` neste checkout da branch `test`. Não significa a versão publicada na `main`, nem confirma configurações ou migrações aplicadas no Supabase. **Protótipo principal** significa `revisao/prototipo-repaginacao/`. O segundo estudo, `revisao/prototipo-refino-visual/`, é tratado separadamente no final.

Foi feito inventário estrutural de 205 arquivos de texto: 153 em `src/`, dos quais 40 arquivos de teste e 113 demais arquivos; também scripts dos protótipos, SQL/funções Supabase, configurações de PWA/CI/deploy e documentos principais. A relação com linhas, hashes e exports está em `INVENTARIO-PARIDADE.json`. Inventariar um arquivo não significa homologar cada comportamento dele: esta é uma comparação funcional estática, complementada pelos testes indicados abaixo, não uma nova auditoria exaustiva de segurança ou execução de todos os casos.

Não foram lidos arquivos `.env` ou credenciais, acessados bancos pessoais, realizadas chamadas remotas, alterações de funcionalidades, instalação de dependências, commit ou push nesta revisão. Os testes do protótipo atualizam suas capturas locais de demonstração.

## Onde estão as etapas

O roteiro encontrado está distribuído principalmente em `README.md`, `CHANGELOG.md`, `ENTREGA.md` e `CONTINUAR-AMANHA.md`. Não encontrei um arquivo separado de implantação funcional nas pastas do repositório e nos dois diretórios ancestrais consultados. `revisao/PLANO.md:1` é plano de auditoria; `revisao/RUNBOOK-PRODUCAO.md` é de provisionamento, não o roteiro de funcionalidades.

| Etapa | Documento de referência | Referência atual no código |
|---|---|---|
| 1 — base/PWA/offline | `CHANGELOG.md:3`, `README.md:69` | `src/App.tsx:23`, `src/componentes/AvisosPwa.tsx:5`, `vite.config.ts:4` |
| 2 — exercícios, ajuda, fotos e fichas | `README.md:13`, `CHANGELOG.md:4` | `src/componentes/AjudaExercicio.tsx:24`, `src/componentes/EditorFicha.tsx:14` |
| 3 — treino, séries e descanso | `README.md:35`, `CHANGELOG.md:5` | `src/telas/ModoTreino.tsx:29`, `src/componentes/Serie.tsx:11`, `src/componentes/Descanso.tsx:5` |
| 4 — histórico, evolução e cards | `README.md:155`, `CHANGELOG.md:6` | `src/telas/Evolucao.tsx:15`, `src/componentes/EvolucaoExercicio.tsx:8`, `src/componentes/CardCompartilhavel.tsx:12` |
| 5 — peso/medidas e lembrete | `README.md:179`, `CHANGELOG.md:7` | `src/telas/Medidas.tsx:13`, `src/componentes/ResumoMedidas.tsx:11` |
| 6 — cardio e atividade diária | `README.md:199`, `CHANGELOG.md:8` | `src/telas/Cardio.tsx:16`, `src/componentes/AtividadeHoje.tsx:13` |
| 7 — backup e proteção | `README.md:218`, `CHANGELOG.md:9` | `src/componentes/BackupConfiguracoes.tsx:12`, `src/dados/backup.ts:72` |
| 8 — conta e sincronização | `README.md:229`, `ENTREGA.md:1` | `src/componentes/ContaConfiguracoes.tsx:15`, `src/sincronizacao/estado.ts:26` |
| Correções posteriores | `revisao/APP-01-ISOLAMENTO.md`, `APP-03-ELIMINACAO.md`, `APP-04-BACKUP.md`, `LOTE-4-HEADERS-CI.md` | Implementações de identidade, eliminação, criptografia e infraestrutura também entram na paridade; não basta copiar as etapas iniciais. |

Há notas históricas incompatíveis entre si no README: por exemplo, `README.md:9` ainda anuncia chegada futura de login/backup, enquanto as seções posteriores e o código os implementam; `README.md:179` descreve precisão antiga de medidas, mas `src/dados/medidas.ts:11` usa 3 casas para peso e 2 para medidas. Para esta análise prevalece o código atual. Também prevalecem os bancos por identidade de `src/dados/banco.ts:77`, e não a antiga descrição de vínculo único da etapa 8.

## Legenda

- **Presente local**: o controle tem comportamento funcional sobre dados fictícios em memória. Não implica persistência nem equivalência integral.
- **Parcial**: existe parte do fluxo, mas faltam regras ou caminhos do original.
- **Ausente**: não encontrado nos scripts carregados pelo protótipo principal; a evidência aponta o original e o caminho simplificado correspondente.
- **Simulado**: tela, mensagem ou valores exemplificativos sem executar a operação original.
- **Novo**: novidade do protótipo, sem equivalente funcional já entregue no original.

## A. Base, dados e comportamento no celular

| ID | Função do original / evidência | Protótipo principal / evidência | Situação e diferença |
|---|---|---|---|
| A01 | Dexie, migrações e tabelas: `src/dados/banco.ts:5` | `app.js:5` mantém `estado`; `agua-codex.js:5` mantém arrays | **Ausente**: alterações e treino ativo se perdem ao recarregar. Reprodução descrita abaixo. |
| A02 | UUID e metadados por registro: `src/dados/repositorio.ts`; relações em `src/dados/modelos.ts` | `app.js:1165` usa IDs locais por data/aleatório; formatos camelCase e arrays aninhados | **Parcial**: os formatos não são intercambiáveis; identidade, timestamps e tombstones não estão uniformemente representados. |
| A03 | Banco por usuário/visitante, fechar antes de abrir: `src/dados/banco.ts:77`; coordenação `src/sincronizacao/trocaIdentidade.ts:5` | Alternâncias de demonstração em `app.js`; aviso de simulação em `funcionalidades-codex.js` | **Simulado**: não há equivalente de isolamento persistente A/B/visitante nem coordenação entre abas. |
| A04 | SW, atualização e cache offline: `vite.config.ts:4`, `src/componentes/AvisosPwa.tsx:5` | `index.html` carrega scripts estáticos; nenhuma configuração equivalente de SW nessa pasta | **Ausente**: abrir arquivo local não comprova instalação ou reabertura offline da PWA. |
| A05 | Estado real de rede/instalação/persistência: `src/hooks/useAmbiente.ts:2` | `funcionalidades-codex.js` apresenta instruções de aparelho; indicadores de exemplo em `app.js` | **Simulado**. |
| A06 | Painéis, gesto, foco e confirmação: `src/componentes/Painel.tsx:2`, `Rolagem.tsx:2` | `app.js:2439`, `correcoes-codex.js:65` e Pointer Events | **Parcial**: há implementação própria testada em desktop headless; equivalência com toque, leitores de tela e teclado físico/virtual não homologada. |
| A07 | Datas locais atualizadas: `src/utilitarios/data.ts:1`, `src/componentes/AtividadeHoje.tsx:19` | `app.js:1191`, `funcionalidades-codex.js:232`, `historico-codex.js` usam 22/10/2026; água usa data real | **Parcial**: datas de demonstração convivem com relógio real. Precisa unificar antes de usar como produto. |

## B. Biblioteca, ajuda e fichas

| ID | Original / evidência | Protótipo / evidência | Situação e diferença |
|---|---|---|---|
| B01 | Biblioteca inicial e ampliação idempotente: `src/dados/biblioteca.ts:18`, `:61` | `app.js:22` contém catálogo exemplificativo; runtime contou **12** exercícios | **Parcial**: não reproduz o catálogo original/ampliado nem proteção contra recriar exercícios removidos. |
| B02 | Busca/filtros, miniaturas e seleção: `src/componentes/FiltrosExercicios.tsx`, `ListaExercicios.tsx`, `MiniaturaExercicio.tsx` | `app.js:529` busca e filtra; ícones/miniaturas simplificados | **Parcial**: faltam grupos/experiência equivalentes e vínculo das miniaturas reais. |
| B03 | Criar/editar exercício: `src/componentes/EditorExercicio.tsx:10` | `funcionalidades-codex.js:110` | **Presente local / parcial**: há nome, grupo, equipamento, tipo, descanso, alvo, texto, vídeo e peso corporal; não é o mesmo contrato de modo de carga/barra nem de validação. |
| B04 | Ajuda em Músculos/Instruções/Equipamento/Evolução: `src/componentes/AjudaExercicio.tsx:24` | `funcionalidades-codex.js:130` monta texto corrido | **Parcial**: faltam as quatro abas, passos formatados e evolução dentro da ajuda. |
| B05 | Link real de execução e busca YouTube: `src/componentes/AjudaExercicio.tsx:31` | `funcionalidades-codex.js:133` mostra `Vídeo:` como texto | **Parcial**: cadastra link, mas não oferece a ação equivalente. Vídeo embutido solicitado agora é uma **nova evolução**, não algo já implementado no original. |
| B06 | Fotos, compressão JPEG/miniatura e Desfazer: `src/utilitarios/imagem.ts:4`, `src/componentes/AjudaExercicio.tsx:45` | `funcionalidades-codex.js:135` lê data URL em memória, até 5 MB | **Parcial**: sem compressão equivalente, Blob persistente, miniatura ou Desfazer da foto. |
| B07 | Unir duplicatas e preservar vínculos/fotos/histórico: `src/componentes/RevisarDuplicatas.tsx:8`, `src/dados/unirExercicios.ts:15` | Cadastro/remoção simples em `funcionalidades-codex.js:110` | **Ausente**. |
| B08 | Criar/editar/duplicar/reordenar/remover ficha e Desfazer: `src/dados/fichas.ts:9`, `:27`, `:32`; `src/telas/Treino.tsx:26` | `app.js:935`, `:1063`, `:1106`, `:1117`; acabamento compacta a lista | **Presente local / parcial**: controles existem; sem transação/persistência e integridade equivalentes. |
| B09 | Selecionar vários exercícios na ordem dos toques: `src/componentes/EditorFicha.tsx:35`, `ListaExercicios.tsx` | `app.js:1004` adiciona individualmente | **Ausente** a seleção múltipla com confirmação. |
| B10 | Miniatura abre ajuda no editor sem perder rascunho: `src/componentes/EditorFicha.tsx:32` | `app.js:965`, `acabamento-codex.js` reorganizam os itens | **Ausente** esse acesso à ajuda no planejamento; não basta existir “Como fazer” durante a sessão. |
| B11 | Cardio na ficha, sem séries de força: `src/componentes/EditorFicha.tsx:32`, `src/dados/treinos.ts:53` | `app.js:1160` cria séries para cada item da ficha | **Ausente / divergente**: modelo principal do treino ainda trata itens como força. |

## C. Sessão, séries, descanso e resumo

| ID | Original / evidência | Protótipo / evidência | Situação e diferença |
|---|---|---|---|
| C01 | Um treino ativo persistente e retomada: `src/dados/treinos.ts:9`, `:95` | `correcoes-codex.js:27` retoma a sessão existente | **Presente local / parcial**: só enquanto esta página permanece aberta. |
| C02 | Pré-preencher carga/reps da última sessão: `src/dados/treinos.ts:34`, `:53` | `app.js:1168` fixa 10 reps e `peso: 50` | **Ausente**; é uma das lacunas mais perceptíveis no uso diário. |
| C03 | Reps/carga e aplicar às próximas pendentes: `src/componentes/SelecionarValores.tsx:4`, `src/componentes/Serie.tsx:48` | `funcionalidades-codex.js:12` | **Presente local**, com outra apresentação e implementação. Persistência/concorrência continuam faltando. |
| C04 | Tipo, RPE, barra, carga total/por lado, peso corporal, reduções: `src/componentes/Serie.tsx:11`, `src/utilitarios/treino.ts:2` | `funcionalidades-codex.js:37`, `:8` | **Presente local / parcial**: não homologadas todas as combinações. Ao iniciar uma ficha, `app.js:1170` força total e não replica integralmente padrões do exercício. |
| C05 | Remover série com Desfazer: `src/telas/ModoTreino.tsx:137` | `funcionalidades-codex.js` remove com `splice` no seletor de tipo | **Parcial**: remoção existe, Desfazer da série não. |
| C06 | Adicionar/reordenar/remover exercício do dia sem mudar ficha: `src/telas/ModoTreino.tsx:146`, `:168` | `app.js:1330` em diante; `correcoes-codex.js` | **Presente local / parcial**: a lógica própria não cobre os mesmos relacionamentos e falhas transacionais. |
| C07 | Nomear e transformar treino livre em ficha: `src/telas/ModoTreino.tsx:168`, `src/dados/planejamentoTreino.ts` | Nome em `correcoes-codex.js:186`; não há salvar planejamento do treino como ficha nos scripts carregados | **Parcial**: nome existe; salvar como ficha não. |
| C08 | Descanso por timestamp, áudio, silêncio e ±15 s: `src/componentes/Descanso.tsx:5`, `src/utilitarios/alerta.ts:3` | `app.js:1492` decrementa contador em `setInterval`; `correcoes-codex.js:162` abre painel | **Parcial**: sem compensação do bloqueio/segundo plano ou áudio equivalente; usa +30 s. |
| C09 | Aquecimento com descanso limitado; última série não abre descanso; próximo exercício: `src/dados/treinos.ts` (`concluirSerie`), `src/telas/ModoTreino.tsx:119` | `correcoes-codex.js:178` sempre inicia descanso ao concluir | **Parcial / divergente**: recolhe exercício, mas faltam decisões de fim e avanço do original. |
| C10 | Manter tela ligada e renovação de Wake Lock: `src/hooks/useTelaLigada.ts:4`, `src/telas/ModoTreino.tsx:98` | Nenhum uso de Wake Lock/NoSleep nos scripts carregados; sessão em `correcoes-codex.js:27` | **Ausente**. Exige teste em dispositivo real mesmo após implementar. |
| C11 | Último desempenho, maior carga, recordes e avisos: `src/telas/ModoTreino.tsx:186`, `src/dados/historico.ts`, `src/utilitarios/evolucao.ts:4` | Séries e progresso em `funcionalidades-codex.js`; nenhum motor correspondente | **Ausente**. |
| C12 | Encerrar só concluídas com confirmação de pendências e convite ao completar tudo: `src/telas/ModoTreino.tsx:88`, `:178` | `funcionalidades-codex.js` finaliza a sessão diretamente | **Parcial**: faltam as confirmações/convites equivalentes. |
| C13 | Volume, duração, último peso e calorias: `src/componentes/ResumoTreino.tsx:7` | `funcionalidades-codex.js` (`abrirResumoFinalizacaoTreino`, `concluirTreinoDefinitivo`) | **Presente local / parcial**: fórmula e volume básicos existem; falta comparação de volume com última ficha e o tratamento completo de sessões só de cardio. |
| C14 | Cardio no treino e no resumo do dia: `src/componentes/CardioNoTreino.tsx:10`, `ResumoCardioDia.tsx`, `ModoTreino.tsx:166` | Editor separado com vínculo opcional em `funcionalidades-codex.js` | **Parcial**: sem planejamento/sincronização de cardio da ficha ou resumo diário equivalente. |

## D. Histórico, evolução e compartilhamento

| ID | Original / evidência | Protótipo / evidência | Situação e diferença |
|---|---|---|---|
| D01 | Histórico, detalhes de séries e observações: `src/telas/Evolucao.tsx:15` | `historico-codex.js` (`abrirModalDetalhesTreino`) | **Presente local / parcial**: dados novos têm detalhes; exemplos iniciais não; original organiza métricas só das séries realizadas. |
| D02 | Busca por ficha, exercício e data; remover com Desfazer: `src/telas/Evolucao.tsx:37` | `app.js:805` lista histórico; `historico-codex.js` abre detalhes | **Ausente** busca e remoção/restauração equivalentes do treino concluído. |
| D03 | Evolução por exercício, carga/volume, Epley/recordes e histórico: `src/componentes/EvolucaoExercicio.tsx:8`, `src/utilitarios/evolucao.ts:4` | Não encontrado equivalente nos scripts carregados; `app.js:805` só lista treinos | **Ausente**. |
| D04 | Sugestão pelo alvo e estagnação: `src/utilitarios/evolucao.ts:27`, `:31` | `funcionalidades-codex.js` permite configurar alvo de reps | **Parcial**: salvar alvo não implementa o cálculo/aviso. |
| D05 | Três modelos aprovados de PNG: `src/componentes/CardCompartilhavel.tsx:6`, `src/utilitarios/imagensCardAprovado.ts:23` | `renderer-aprovado-copia.js`, `renderer-origem.json`, `compartilhamento-codex.js:20` | **Presente local** quanto à geração/copiar/baixar/compartilhar. Renderer é cópia transpilada, não fonte compartilhada. |
| D06 | Texto alternativo, métricas reais e ciclo de vida de foto/URLs: `src/componentes/CardCompartilhavel.tsx:12`, `src/utilitarios/cardTreino.ts:9` | `compartilhamento-codex.js` monta adaptador de histórico demonstrativo | **Parcial**: falta copiar texto, descarte completo ao fechar e métricas de recordes/grupos derivadas do motor original. Compartilhamento no celular segue não homologado. Não redesenhar o card para corrigir isso. |

## E. Medidas, cardio e atividade

| ID | Original / evidência | Protótipo / evidência | Situação e diferença |
|---|---|---|---|
| E01 | Registro parcial/mesma data com confirmação de sobrescrita: `src/dados/medidas.ts:57`, `src/componentes/EditorMedida.tsx:9` | `app.js:1682`, `historico-codex.js` valida entradas | **Presente local / parcial**: sem revisão transacional contra alterações concorrentes/remoção ocorrida durante edição. |
| E02 | Último valor de CADA medida com sua data: `src/componentes/ResumoMedidas.tsx:15` | `app.js:704` mostra campos do registro mais recente | **Parcial / divergente**: completar somente cintura hoje não deve esconder o peso/busto cadastrado em outra data. Adicionar todos os campos à grade não resolveu essa regra. |
| E03 | Escolher quaisquer duas datas; gráfico de qualquer medida: `src/telas/Medidas.tsx:17`, `src/componentes/ResumoMedidas.tsx:39` | `app.js:771`, `historico-codex.js` comparam registros simplificados | **Parcial** comparação; **ausente** gráfico/seleção completos. |
| E04 | Histórico recolhido e remover/restaurar medida: `src/telas/Medidas.tsx:31` | `app.js:704` histórico oferece Editar | **Parcial**: faltam exclusão e Desfazer integrados aos dados de medidas. |
| E05 | Lembretes calculados por semana e último backup/sync: `src/componentes/LembreteMedidas.tsx:6`, `LembreteBackup.tsx:6`, `src/dados/backup.ts:125` | Preferências em `funcionalidades-codex.js`; textos exemplificativos em `app.js` | **Simulado / parcial**: escolher intervalo/dia não equivale a calcular e suprimir o aviso correto. |
| E06 | Modalidades, detalhes condicionais, duração e vínculo: `src/componentes/EditorCardio.tsx:31`, `src/dados/detalhesCardio.ts` | `funcionalidades-codex.js` (`editorCardio`, `camposCardio`) | **Presente local / parcial**: a lista e os identificadores de modalidades não são os mesmos do original. Falta equivalência de todos os limites, mudança de data/vínculo e seletores. |
| E07 | Ritmo, velocidade calculada, MET por modalidade, peso até a data e fator: `src/dados/cardio.ts:9`–`:27` | `funcionalidades-codex.js` guarda calorias informadas; `historico-codex.js` soma valores | **Ausente** o cálculo completo. O exemplo inicial contém ritmo em texto, não um motor funcionando. |
| E08 | Resumo semanal, meta, filtro e recordes por tipo: `src/telas/Cardio.tsx:25`, `src/dados/cardio.ts:37` | `funcionalidades-codex.js` (`paginaCardio`) soma todas as sessões | **Ausente**: o contador total não é um resumo semanal. |
| E09 | Registrar/editar cardio, remover e Desfazer: `src/telas/Cardio.tsx:16` | `funcionalidades-codex.js` (`paginaCardio`) | **Presente local**, com payload diferente e sem persistência. |
| E10 | Passos/calorias em dia anterior, edição e modos relógio/soma: `src/componentes/EditorAtividade.tsx:9`, `src/dados/atividade.ts:23` | `funcionalidades-codex.js:229`, `historico-codex.js` | **Presente local / parcial**: soma demonstrativa ignora o fator de cardio e usa ausências como zero em situações diferentes do original. |
| E11 | Metas fotografadas no registro; preservar ao mudar configuração; rejeitar edição concorrente: `src/dados/atividade.ts:28` | Arrays simples em `funcionalidades-codex.js`; metas atuais em `historico-codex.js` | **Ausente**: mudar as metas pode alterar retrospectivamente a apresentação. |
| E12 | Atividade 7/30 dias, gráficos e dias que atingiram meta: `src/componentes/AtividadeHoje.tsx:27`, `GraficoAtividade.tsx` | Histórico mensal paginado em `funcionalidades-codex.js` | **Parcial**: paginação é nova e útil, mas não substitui gráficos/resumo do original. |
| E13 | Feriados nacionais, edição e marcar hoje como descanso: `src/dados/atividade.ts:8`, `:16`, `:48` | `funcionalidades-codex.js` (`editorFeriados`) cadastra/remove datas | **Parcial**: sem inicialização anual nacional, edição equivalente nem atalho de descanso em Hoje. |

## F. Backup, conta, privacidade e infraestrutura

| ID | Original / evidência | Protótipo / evidência | Situação e diferença |
|---|---|---|---|
| F01 | Backup de 17 tabelas, fotos, configurações e propriedade atual: `src/dados/backup.ts:12`, `:72` | `backup-demonstracao-codex.js:4` exporta cinco coleções | **Parcial**: não exporta atividade, feriados, preferências, água ou treino ativo; formato intencionalmente incompatível com o app real. |
| F02 | AES-GCM/PBKDF2/AAD/limites: `src/dados/backupCriptografado.ts:51`, `:65` | `backup-demonstracao-codex.js:19` | **Presente local**: criptografia real, mas validador e envelope próprios. Não afirmar compatibilidade nem mesma cobertura adversarial do original. |
| F03 | Validação estrutural/relacional, mescla transacional, conflitos, tombstones e pausa durável de sync: `src/dados/backup.ts:26`, `:72`, `src/dados/validacaoBackup.ts` | `backup-demonstracao-codex.js:33`, função `revisar` | **Parcial**: cinco arrays e mescla em memória não reproduzem transação, colisões por data, atribuição de proprietário ou reconciliação com servidor. |
| F04 | CSV por tabela, escape e proteção de fórmulas: `src/dados/backup.ts:120`, `BackupConfiguracoes.tsx:56` | `backup-demonstracao-codex.js` exporta somente data/peso/cintura | **Parcial**. |
| F05 | Marcar backup ao baixar/compartilhar e lembrete real: `src/dados/backup.ts:148`, `BackupConfiguracoes.tsx:38` | Arquivo pronto em `backup-demonstracao-codex.js:34` | **Ausente** atualização persistente da data/lembrante. |
| F06 | Legado sem upgrade, filtro por dono, confirmação de sem dono: `src/dados/legado.ts:5`, `ImportarLegado.tsx:6` | Painel de privacidade só simula limpeza em `app.js:2267` | **Ausente** importação legada segura. Não testar com banco pessoal para preencher essa lacuna. |
| F07 | Entrar, cadastrar, confirmar/reenvio, recuperar e concluir perfil: `src/componentes/ContaConfiguracoes.tsx:15`, `src/sincronizacao/cadastro.ts`, `ConcluirPerfilCadastro.tsx` | `app.js:2295`, `funcionalidades-codex.js` qualifica mensagens | **Simulado**: não envia e-mail nem autentica. A forma dos passos de recuperação também difere. |
| F08 | Sync, fila, recibos, conflitos/revisão e sessão local offline: `src/sincronizacao/estado.ts:26`, `motor.ts:203`, `RevisaoSincronizacao.tsx` | Estado/mensagens exemplificativos em `app.js` | **Simulado**: nenhum transporte, fila durável ou resolução real. Fotos também não são sincronizadas integralmente pelo original nesta etapa; não contar isso como função pronta perdida. |
| F09 | Remover/Desfazer versus eliminação, tombstone e purga 30 dias: `src/dados/eliminacao.ts:8`, `:29`, `src/componentes/PrivacidadeDados.tsx` | `app.js:2113` lixeira contém exemplos/metadados separados | **Simulado**: restaurar o rótulo da lixeira não restaura os dados originais relacionados. |
| F10 | Fila durável para Storage, falha parcial e retry: `src/dados/eliminacao.ts:36`, `src/sincronizacao/transporte.ts:34` | `app.js` possui flag demonstrativa de falha | **Simulado**, sem objetos, RPC ou retry reais. |
| F11 | Apagar aparelho/legado separado; exclusão autenticada de conta: `src/dados/limpezaAparelho.ts:5`, `:13`, `:18`; `supabase/functions/excluir-conta/index.ts` | `app.js:2255`, `:2267`, `:2277` e avisos substituídos | **Simulado**. As confirmações visuais não comprovam exclusão, reautenticação ou rate limit. |
| F12 | RLS/triggers/job/runtime fechado e deploy: `supabase/migrations/202610210001_eliminacao.sql`, `supabase/functions/_shared/runtime.ts`; headers em `vercel.json`, CI em `.github/workflows` | Protótipos HTML estáticos, sem deploy equivalente próprio | **Fora da homologação visual**. Há arquivos no original, mas aplicação remota/produção não foi verificada nesta revisão. Não replicar segredos ou backend real no protótipo. |

## G. Novidades e itens que não são lacunas do original

- **Água por garrafa é nova.** O original tem `AguaDia { data; ml }` em `src/dados/modelos.ts:63` e tabela em `src/dados/banco.ts:19`, mas não uma tela de garrafas em Hoje. `agua-codex.js:5` tem a nova interação, só em memória. Ainda falta definir contrato versionado para capacidade/fracionamento por lançamento, persistência e backup. Ter uma tabela não significa ter a funcionalidade entregue.
- **Tema claro é novo em relação à interface principal do original.** `src/telas/Configuracoes.tsx:24` mostra tema Escuro; o protótipo alterna temas. `README.md:167` ainda planeja acabamento/tutorial para etapa 13. Manter esse avanço visual, sem chamá-lo de função já existente perdida.
- **Comida/chat alimentar:** `src/App.tsx:18` ainda aponta Comida para estado vazio/etapa 9. Tabelas de refeições/favoritos/combos não provam diário funcional. Não há diário completo a transportar nesta revisão. Chat e HealthKit constam como planejamento em `README.md:190`, não entrega.
- **Fotos de progresso, IMC/meta de peso, tutorial por conta e biblioteca externa de animações:** planejamento em `README.md:167`, `:185` e `src/telas/Configuracoes.tsx:30`; não encontrados como fluxos entregues na navegação atual.
- **Vídeo embutido na capa:** pedido novo. O original abre link externo ou busca do YouTube; o provedor/formato do vídeo embutido ainda não foi decidido pelo usuário.
- Teclado decimal nas medidas e paginação/compactação das fichas foram decisões aceitas para o protótipo. Não tratá-las automaticamente como regressão visual só porque o componente original usa outra apresentação. Precisão, integridade e alcance das ações precisam continuar equivalentes.

## Segundo protótipo: refino visual

`revisao/prototipo-refino-visual/index.html` e `app.js` formam outro controlador de demonstração. Ele não herda automaticamente `funcionalidades-codex.js`, `historico-codex.js`, `agua-codex.js` ou a criptografia do protótipo principal.

`treino-interativo.js:1` implementa concluir/desfazer, reps/carga, tipos, remover série, série extra e subir exercício; não implementa todo o domínio de treino. Em `app.js:403`, as ações de conta/backup/limpeza são simulações com handlers e timers. O teste `validar-treino.cjs` cobre alguns cliques, não essa equivalência.

**Não somar a cobertura das duas pastas para declarar um protótipo completo.** Escolher uma como referência visual e controlar a implementação nela; alterar a outra requer escopo explícito. O foco recomendado para a continuidade é `prototipo-repaginacao`, onde estão as ampliações recentes.

## Verificação nesta revisão

Ferramentas já instaladas: Edge headless e Playwright externo ao projeto. Sem instalação. Perfis descartáveis, arquivos locais e HTTP bloqueado; sem dados pessoais ou servidor remoto.

| Comando / reprodução | Resultado e limite |
|---|---|
| `git branch --show-current` | `test`. `git diff --stat` inicialmente vazio; arquivos de protótipos/relatórios já eram não rastreados. |
| `node revisao/prototipo-repaginacao/validar-codex.cjs` | Passou 390 e 360 px: treino/retomada em memória, seletores, descanso, temas, ficha, medidas, cardio, atividade, paginação, backup demonstrativo e geração dos cards. Sem pageerror nos percursos executados. |
| `node revisao/prototipo-repaginacao/validar-agua.cjs` | Passou 360/390 px: garrafas, meia, quantidade personalizada, Desfazer, volume histórico e dia anterior. |
| `node revisao/prototipo-refino-visual/validar-treino.cjs` | Passou 360/390 px: concluir/desfazer, carga, tipo, série extra, recolher e navegar. |
| Catálogo da página em perfil limpo | `estado.exerciciosCatalogo.length = 12`. Não representa o catálogo original ampliado. |
| Iniciar ficha, alterar primeira série para 17 reps e recarregar | Antes: treino ativo com 17 reps. Depois: nenhum treino ativo. Corrobora A01/C01; navegar entre telas sem reload não testa persistência. |
| Busca de APIs e motores ausentes nos scripts não gerados | Sem correspondência para Wake Lock/NoSleep, IndexedDB e motor de recordes; inspeção dos caminhos correspondentes sustenta as lacunas acima. Ausência de palavra isolada não foi usada como única prova. |

Não executados: suíte original completa, instalação/build/CI novo, ambiente real do Supabase, duas contas autenticadas reais, câmera física, teclado numérico/toque/áudio/Wake Lock em iPhone/Android, compartilhamento nativo e teste completo de acessibilidade. Testes existentes no original são evidência de intenção/implementação, não uma execução nova nesta revisão. Os testes de navegador do protótipo não homologam todas as regras descritas nesta matriz.

## Ordem recomendada para implementar

1. **Contrato e proteção de dados:** definir os modelos da demonstração e adaptadores para o original; decidir se a próxima etapa continuará descartável ou terá persistência isolada exclusivamente para dados fictícios. Não usar os bancos reais. Incluir atividade, preferências, feriados e água no backup demonstrativo ou avisar claramente sua exclusão. É pré-requisito para alegar completude.
2. **Treino em uso:** pré-preenchimento histórico, padrões corretos de carga, timer por horário, regras de descanso/fim, Desfazer de série, manter tela ligada, confirmação de pendências, último desempenho, recordes e salvar treino livre como ficha.
3. **Cardio integrado:** ficha/treino/resumo com cardio sem séries de força; cálculos de ritmo/velocidade/calorias/fator, resumo semanal e recordes por modalidade.
4. **Medidas e atividade:** último valor por campo/data, escolha livre de comparação, gráficos, remover/restaurar medidas, metas históricas preservadas e feriados/lembretes calculados.
5. **Biblioteca e ajuda:** catálogo completo, filtros/grupos, seleção múltipla, miniatura/ajuda durante edição, fotos e Desfazer, união de duplicatas; decidir separadamente a fonte do novo vídeo.
6. **Evolução e compartilhamento:** buscas, histórico removível, gráficos/recordes/sugestões, texto alternativo do card e dados calculados pelo mesmo motor. Preservar integralmente a composição aprovada dos PNGs.
7. **Conta, sync, privacidade e PWA:** modelar estados completos sem fingir ações remotas. Para futura integração real, reutilizar as camadas já existentes do aplicativo, com autorização própria para staging. Não reimplementar segurança do zero em scripts da demonstração.

Cada lote deve ter critérios de aceite ligados aos IDs desta matriz e teste de regressão com dados fictícios. Começar pelas regras antes de mais uma rodada de aparência.

## Direção para integração futura

O caminho recomendado é aplicar o layout aprovado aos componentes React do original, preservando repositórios, cálculos, migrações, hooks e testes. Manter indefinidamente dois motores separados de treino/backup/sincronização aumenta o risco de esquecer regras. Esta recomendação não autoriza modificar `src/`, integrar, publicar ou usar dados reais agora.

Esta revisão cria somente o relatório e o inventário estrutural; nenhuma pendência foi marcada como implementada por constar neste documento.
