# APP-03 — eliminação definitiva

Atualização posterior de preparação: o runtime passou a exigir EXPECTED_PROJECT_REF para conferir a URL injetada pelo Supabase em staging ou produção, sem default. As referências a STAGING_PROJECT_REF/guard exclusivo de staging abaixo são histórico da entrega APP-03. Para provisionamento atual, prevalece [RUNBOOK-PRODUCAO.md](RUNBOOK-PRODUCAO.md); nada foi aplicado remotamente nesta preparação.

Implementação local na branch `test`, em 21/10/2026. **Nenhuma migração aplicada remotamente, nenhum deploy, merge ou push. Produção não foi acessada.** Arquivos preparados exclusivamente para STAGING; a aplicação remota depende de revisão e autorização posteriores.

## Comportamento implementado

- `apagado_em` continua sendo remoção lógica reversível. `eliminado_em` marca a eliminação irreversível. O registro local fica apenas com `id`, `user_id`, `apagado_em` e `eliminado_em`. Não fica nome, medida, conteúdo, Blob ou miniatura no registro eliminado. O UUID é identificador pseudonimizado necessário à autorização/sincronização, não anonimização.
- A eliminação limpa snapshots correspondentes em pendências, recibos e conflitos e percorre dependentes de fichas, exercícios, treinos e medidas, incluindo fotos. A fila de envio é reconstruída apenas com o marcador. Hooks Dexie rejeitam edição/Desfazer sobre um registro eliminado.
- Backup continua isolado por identidade e com proprietário forçado. Marcadores irreversíveis locais prevalecem nos modos mesclar e substituir, mesmo diante de timestamp futuro no arquivo. A restauração também elimina dependentes vinculados aos marcadores preservados. Um banco limpo pode mostrar um backup antigo offline; ao sincronizar com a conta, os marcadores remotos prevalecem e retiram o conteúdo restaurado.
- Antes dos envios, o motor consulta eliminações remotas. Na corrida entre download e push, erro `P0002` faz baixar/aplicar o marcador e descartar a edição rejeitada. Fotos locais eliminadas também são comunicadas pela RPC, embora os Blobs continuem fora do sync normal.
- A configuração de retenção é `RETENCAO_REMOVIDOS_DIAS = 30` no cliente e `vida_em_dia_retencao_dias() = 30` no SQL. Teste verifica paridade. Ao abrir a identidade, antes de devolver o banco às telas, o cliente purga conteúdo de removidos vencidos. O legado nunca é aberto ou purgado implicitamente. A configuração principal não participa da revisão individual local; seu conteúdo é eliminado por exclusão de conta/limpeza do aparelho.
- Remoções de Storage ficam na tabela interna `remocoes_storage` da identidade. Sucesso parcial retira apenas os objetos confirmados; falhas conservam o restante e incrementam tentativas para o próximo sync. Caminhos são restritos a `<UUID>/...`. No servidor, `vida_em_dia_remocoes_storage` preserva o caminho operacional até sucesso da API. Não há `DELETE FROM storage.objects`.

## SQL versionado

`supabase/migrations/202610210001_eliminacao.sql`:

- Mantém os `NOT NULL` existentes. Acrescenta coluna `eliminado_em` e CHECK condicional de conteúdo mínimo, sem relaxar o schema inteiro. Datas técnicas externas são normalizadas para a eliminação; não preservam criação histórica no tombstone definitivo do servidor.
- Trigger BEFORE INSERT/UPDATE normaliza a primeira eliminação. BEFORE UPDATE rejeita qualquer alteração se OLD.eliminado_em já estiver preenchido, inclusive limpar o campo, alterar conteúdo ou update sem mudança. Upsert contra eliminado também dispara a rejeição, independentemente da idade do envio.
- `vida_em_dia_eliminar` é SECURITY INVOKER, usa auth.uid/RLS, é idempotente para marcador já existente e propaga a dependentes. O único molde de DML dinâmico continua na RPC de envio: allowlist literal, `%I` e valores parametrizados. As novas escolhas de tabela usam DML estático. Authenticated continua sem DELETE nas 17 tabelas de dados; DELETE administrativo é reservado a service_role.
- Controles de exclusão da conta e tentativas têm RLS ligada e nenhuma política para cliente. Limite atômico: cinco tentativas por usuário a cada quinze minutos. A exclusão em andamento bloqueia gravação/leitura pelas políticas restritivas, incluindo Storage, impedindo reintrodução durante falha parcial. As FKs das tabelas de dados para auth.users com ON DELETE CASCADE permanecem: JWT antigo não consegue inserir após excluir Auth.
- Job SQL diário às 03:17, no timezone do cron, é registrado somente se a extensão pg_cron já existir. Não instala extensão automaticamente. O SQL apaga conteúdo e enfileira objetos; bytes do Storage exigem o endpoint/API descritos abaixo.

## Edge Functions versionadas

- `excluir-conta`: valida JWT remotamente via Auth getUser, aplica limite persistente, verifica senha **agora** com cliente anon separado usando signInWithPassword, confere o mesmo UUID e encerra a sessão temporária. Só depois bloqueia a conta e executa Storage API → apagar linhas → Auth admin.deleteUser. O cliente de serviço nunca verifica a senha. A chave vem exclusivamente de secret do servidor; nenhum valor foi gravado no repositório, enviado ao app ou registrado em log.
- Etapas remotas são repetíveis e o erro informa a etapa real (`storage`, `dados` ou `auth`), sem stack/erro interno. Uma falha pode deixar parte dos dados remotos já apagada: não existe rollback de Storage/Auth. O app preserva o banco local e permite tentar novamente/exportar. Se a resposta final se perder depois da exclusão de Auth, o app conserva o banco e mostra resultado não confirmado; um JWT cujo usuário já foi apagado não é aceito para novo trabalho. Nesse caso, confirmar a conclusão administrativamente antes de usar a limpeza local explícita. Nunca assumir sucesso apenas por falha de autenticação.
- `purgar-removidos`: alternativa ao cron e worker da fila de Storage. Exige segredo de pelo menos 32 caracteres via Bearer, compara digests SHA-256 em laço de tamanho fixo sem saída antecipada, chama purga SQL e remove até 100 objetos pendentes por execução pela API. Em falha, a fila permanece para retry. Agendar externamente mesmo quando houver cron SQL para consumir a fila de objetos; sem cron, o endpoint faz ambos os trabalhos.
- CORS usa somente `APP_ORIGIN` exata, sem wildcard. O endpoint de conta exige essa origem e JWT; o agendador aceita chamadas servidor-servidor sem Origin, sempre autenticadas pelo segredo. `verify_jwt=false` no gateway é intencional: validação do JWT/segredo ocorre dentro dos handlers, incluindo chamadas com chaves publishable. Nunca publicar handler removendo essas verificações.
- `APP_ENV=staging`, hostname de `SUPABASE_URL` compatível com `STAGING_PROJECT_REF` e origem válida são obrigatórios. Configuração inválida falha antes de servir. SDK de servidor fixado em 2.117.3 no import map; `npm run typecheck` verifica também os arquivos Edge via tsconfig.edge.json. Isso não substitui executar o runtime Deno/Supabase real.

## Interface e dispositivo

Configurações → Privacidade e eliminação:

- Revisão dos removidos com ação “Eliminar definitivamente”, explicação sobre dependentes/fotos e confirmação digitada `ELIMINAR`. Os botões Remover/Desfazer existentes não foram convertidos em eliminação definitiva.
- Excluir conta exige senha atual e `EXCLUIR MINHA CONTA`, oferece exportar backup criptografado antes e só apaga o banco atual após resposta `{concluido:true}`. Falha remota não limpa o banco local.
- “Sair e apagar dados deste aparelho” exige `APAGAR APARELHO`; a fila é reconstruída/conferida ao confirmar, e pendências exigem aceite separado. Apaga apenas o banco da identidade, encerra a sessão local e avisa as outras abas pelo mecanismo existente. Visitante separado, outras contas e legado não são apagados.
- Apagar o legado exige confirmação independente `APAGAR LEGADO`. Sua existência é detectada sem criar banco. Nenhuma limpeza de legado é automática.

## Verificação local

Em cada commit lógico: tipos → lint → testes → build. Etapas anteriores passaram com 242, 245 e 249 testes. Verificação final: **255 testes em 41 arquivos**, tipos (incluindo Edge), lint e build passaram. Inclui regressão para impedir que resposta tardia da exclusão de A apague o banco de B após troca de identidade. Os pushes de eliminação também conferem novamente a identidade esperada em cada RPC.

- Dexie com IndexedDB real por fake-indexeddb, sem mocks de repositório: conteúdo/fotos/miniaturas e snapshots removidos; fila durável; falha parcial/retry de objetos; prazo exato; purga na abertura; backup antigo com timestamp futuro; dois espaços de aparelho simulados; confirmação da fila; legado separado; falha de servidor/rede preservando banco local.
- Integração Dexie + PGlite: backup anterior restaurado em banco limpo, edição pendente com timestamp futuro e eliminação remota entre consulta/envio. Postgres rejeitou o upsert; o motor descartou a edição e terminou com quatro campos, sem conteúdo nem pendência daquele registro.
- PGlite simula roles anon/authenticated/service_role e auth.uid() a partir de **request.jwt.claims**. Executa migração, RPC, CHECK, triggers, RLS, limites e FKs. **NÃO cobre Storage real, pg_cron, Auth real, JWT criptográfico do gateway, execução Deno nem duas contas reais do staging.** Testes dos handlers usam adaptadores sintéticos para falhas e etapas, sem chamadas remotas.
- PGlite fixado em **0.5.8**, publicado em **26/08/2026 18:40:08 UTC**, conforme `npm.cmd view @electric-sql/pglite@0.5.10 time --json`: a 0.5.10 instalada antes havia sido publicada em 14/10/2026, há menos de 14 dias. A versão 0.5.8 satisfaz o intervalo pedido. `npm.cmd audit` após instalação: **found 0 vulnerabilities**. Nenhum npm audit fix.
- Testes usam apenas dados sintéticos. Nenhum IndexedDB real do usuário foi limpo. Interface, teclado, foco, diálogo e fechamento de abas ainda precisam de homologação em navegador/iPhone real.

## O que depende do STAGING — não executado

Não há Supabase CLI, Docker ou Deno disponíveis neste ambiente. Não foi fornecido/conferido um identificador remoto inequívoco do staging. Não lemos .env.local nem chaves para tentar inferir esse ambiente. **Disponibilidade de pg_cron NÃO VERIFICADA.** Não confundir extensão disponível para instalar com extensão já instalada.

1. Confirmar manualmente project ref e origem do app de STAGING; conferir novamente que não é produção. Revisar a migração e aplicá-la somente após autorização separada.
2. Consultar no staging:

   ```sql
   select name, installed_version from pg_available_extensions where name='pg_cron';
   select extname, extversion from pg_extension where extname='pg_cron';
   select tablename, rowsecurity from pg_tables where schemaname='public';
   select * from pg_policies where schemaname in ('public','storage');
   select conrelid::regclass, pg_get_constraintdef(oid)
   from pg_constraint where contype='f' and confrelid='auth.users'::regclass;
   ```

3. Se pg_cron estiver instalado, verificar cron.job/cron.job_run_details e o job `vida-em-dia-purga`. Se não estiver, configurar agendador externo chamando POST do endpoint protegido; não deixar um endpoint sem agendamento. Em ambos os casos, agendar o worker de objetos e monitorar falhas/idade da fila sem conteúdo pessoal nos logs.
4. Configurar exclusivamente nos secrets das funções: APP_ENV, STAGING_PROJECT_REF, APP_ORIGIN, PURGA_SECRET e as credenciais padrão do servidor. SUPABASE_SERVICE_ROLE_KEY nunca recebe prefixo VITE_, nunca vai a arquivo versionado ou comandos com valor exposto. Desabilitar captura de payloads/headers sensíveis nos logs de infraestrutura.
5. Após autorização específica, implantar as duas funções no project ref conferido, com import map/config fornecidos. Validar Deno e runtime real antes de expor a interface de exclusão. Não executar esse procedimento em produção nesta tarefa.
6. **Teste de duas contas no staging é obrigatório:** A não lê, atualiza, elimina nem remove Storage de B; paths fora de A são recusados. Criar arquivo/foto A, testar falha de rede depois de remover parte dos objetos e repetir. Conferir bytes pela Storage API, não apenas linha em storage.objects. Testar subpastas, paginação e fila do worker.
7. A em dois aparelhos: editar offline no segundo, eliminar/purgar no primeiro e sincronizar; conferir conteúdo mínimo e fila vazia no segundo. Restaurar backup antigo em perfil limpo e sincronizar. Tentar update/upsert de timestamp antigo e futuro, e limpar eliminado_em: todos devem falhar contra marcador confirmado.
8. Conta descartável: senha errada, JWT ausente/expirado, origem errada e sexta tentativa não iniciam limpeza. Injetar falhas em Storage, dados e Auth; verificar etapa, conservação local e retry. Após sucesso, conferir remoção de Auth, cascatas, objetos e banco local. Tentar INSERT usando JWT anterior: deve falhar. Testar encerramento em duas abas e a situação de resposta final perdida sem supor sucesso.

## O que NÃO é apagado automaticamente — para a política de privacidade

| Item | Motivo/limite e verificação necessária |
| --- | --- |
| Tombstones de registros | UUID do proprietário, ID e datas mínimas permanecem enquanto a conta existir, para RLS e impedir reintrodução por aparelho/backup antigo. Não contêm conteúdo ou imagens, mas não são anônimos. Excluir Auth remove-os por cascata. |
| Caminhos na fila de Storage | Retenção operacional temporária enquanto a API não confirma a remoção; necessários para retry. Devem ser monitorados e retirados após sucesso. |
| Backups/snapshots/PITR, WAL e réplicas do provedor | UPDATE/DELETE e API de Storage não apagam retroativamente cada cópia gerida pelo provedor. Prazos, expiração, réplica e processo de restauração precisam ser verificados no contrato/plano do staging e futuramente de produção. Não inventar prazo. Restauração administrativa precisa reaplicar exclusões antes de reabrir o serviço. |
| Logs do provedor, gateway, autenticação, e-mail e infraestrutura | Não há API de expurgo desses registros nesta implementação. Confirmar conteúdo, mascaramento, acesso e retenção por serviço. O código novo não registra senha, JWT, e-mail ou chave. |
| Arquivos JSON/CSV/criptografados exportados, compartilhados ou copiados | Estão fora do controle do app (Downloads, arquivos, nuvem pessoal e terceiros). O titular deve apagá-los nas respectivas plataformas; criptografia não remove cópias. |
| Outros aparelhos offline, cache de memória e cópias externas | Eliminação de registros chega ao sincronizar. Limpeza deste aparelho afeta somente a identidade selecionada. Não há apagamento remoto garantido de dispositivo desligado, sistema operacional ou extração anterior. |
| Visitante, outras identidades e banco legado | Não são atribuídos à conta atual. Limpeza individual não pode apagar dados possivelmente pertencentes a outra pessoa. Legado tem confirmação própria. |
| Retenções legais/eventuais bloqueios jurídicos | Nenhuma política ou obrigação jurídica concreta foi verificada ou implementada por este código. Documentar somente retenções efetivamente aplicáveis, com base, prazo e acesso restrito; não usar esta tabela como afirmação de que existe obrigação de reter. |
| Resíduos físicos do navegador/disco | IndexedDB remove o conteúdo acessível ao app; não oferece garantia de sanitização forense de mídia, snapshots do SO ou backups do dispositivo. |

Este relatório descreve o comportamento implementado e limites técnicos; não declara homologação remota ou conformidade jurídica integral.
