# Runbook — segundo projeto Supabase de produção

Preparado em 21/10/2026, na branch `test`. **Nenhuma operação foi executada nos projetos remotos.** Este documento não autoriza deploy, migração, merge, abertura de cadastro ou uso de dados reais. Cada execução futura exige confirmação explícita do responsável pelo ambiente.

Estado informado pelo usuário: o projeto atual é STAGING, usado pelo Preview; Production/main está sem variáveis Supabase e publica o app sem backend. O projeto de produção ainda será criado. Não clonar dados, Auth, chaves ou buckets do staging para produção.

## 0. Decisões e condições de início

Registrar em controle operacional restrito, sem credenciais:

| Decisão | Registro necessário antes de continuar |
| --- | --- |
| Projeto/organização | Responsável, nome inequívoco de produção, plano, faturamento, limite de gastos e acessos administrativos com MFA |
| Região | Região disponível escolhida, localização principal do banco, latência e avaliação de transferência internacional |
| Recuperação | RPO/RTO, backup diário ou PITR conforme o plano, janela efetiva, monitoramento e responsável pelo ensaio de restauração |
| Endereços | Domínio HTTPS de produção e um domínio estável e exato de Preview, com controle de DNS/TLS |
| E-mail | Provedor SMTP, remetente/domínio verificado, SPF/DKIM/DMARC, suporte e limites de entrega |
| Segurança Auth | Política de senha, proteção contra senha vazada/CAPTCHA disponíveis no plano, limites e testes de abuso |
| Liberação | Quem homologa, quem aprova operações remotas e quem reabre o cadastro |

Para público no Brasil, considerar São Paulo (`sa-east-1`) entre as [regiões disponíveis](https://supabase.com/docs/guides/platform/regions), sem escolher automaticamente. Mapear também localização de operadores/suboperadores, suporte, e-mail, backups e demais tratamentos. A região principal não prova que todo o fluxo permanece no Brasil. Havendo transferência internacional, registrar destino, agentes, finalidade e mecanismo aplicável ao art. 33 antes da liberação, considerando o [regulamento e cláusulas da ANPD](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-19-de-23-de-agosto-de-2024). Essa decisão jurídica/contratual não é verificada pelo código.

### Convenção de placeholders

`<REF_PRODUCAO>`, `<REF_STAGING>`, `<DOMINIO_PRODUCAO>` e `<DOMINIO_PREVIEW_FIXO>` são marcadores, **não valores utilizáveis**. Substituir conscientemente somente ao executar/configurar o ambiente autorizado. Não inventar ref de produção. Não publicar placeholders na CSP ou no painel.

Nunca inserir chaves, JWT, senha de banco/SMTP ou segredo de agendamento em arquivo, chat, URL, argumento de comando, log ou relatório. Os exemplos abaixo contêm apenas nomes, rotas públicas e placeholders. Não usar `vercel env pull`/arquivos de secrets para este procedimento. Credenciais são configuradas em painéis/gestores de secrets, sem copiar seus valores para o repositório.

## 1. Criar o projeto e fechar o cadastro imediatamente

1. No painel Supabase, selecionar organização e criar **novo projeto**, usando as decisões da seção 0. Guardar senha administrativa exclusivamente no gestor de senhas autorizado.
2. Conferir nome/ref na barra do painel e registrar sua identidade no controle operacional. Comparar com staging: devem ser projetos distintos. Não confiar no selo da branch do banco como prova de que é o app Production.
3. Antes de ligar qualquer frontend, em Authentication → Sign In / Providers/configuração geral, **desativar Allow new users to sign up**. Manter entrada por e-mail habilitada, mas desativar anonymous sign-ins e provedores não utilizados. Não desativar o provedor de e-mail inteiro, pois as contas convidadas precisam entrar.
4. Em configuração do provedor Email, manter **Confirm Email obrigatório**. Não usar autoconfirmação administrativa como substituto do teste de convite/posse do e-mail.
5. Com cliente sem sessão, verificar que signup aberto é recusado. O texto/botão “Criar conta” no app não é controle de acesso. Não abrir signup para criar as contas de homologação.

O comportamento desses controles está descrito na [configuração geral do Auth](https://supabase.com/docs/guides/auth/general-configuration). Conferir os nomes atuais no painel antes da execução.

## 2. Inspecionar estrutura e aplicar migrações na ordem

**Portão:** conferir novamente `<REF_PRODUCAO>`, obter aprovação remota e manter cadastro fechado. Os avisos históricos “STAGING/testes” nas migrações registram a etapa anterior; não autorizam sua execução em produção. Revisar esses arquivos e sua homologação antes de aprovar qualquer aplicação nova.

Executar primeiro `supabase/verificacao/checagem_seguranca.sql` no SQL Editor do projeto selecionado. Ele contém somente SELECTs de catálogos/metadados, sem dados pessoais nem correções automáticas. Em projeto novo, ausência das tabelas/bucket do app é esperada nesse primeiro diagnóstico; não é autorização para ignorar ausências após as migrações.

### Banco realmente novo, sem tabelas/dados do app

Aplicar **cada arquivo completo, uma única vez**, conferindo sucesso da transação antes do seguinte:

1. `supabase/migrations/202610140001_conta_sincronizacao.sql` — 17 tabelas, RLS, índices, RPC, bucket privado e políticas de Storage.
2. `supabase/migrations/202610210001_eliminacao.sql` — eliminações, CHECKs condicionais, triggers, controles de conta/tentativas, RPCs, fila de objetos e purga. Se pg_cron já estiver instalado, esse arquivo agenda o job SQL descrito na seção 5.

As migrações não são scripts idempotentes de “reparar tudo”. Não executar fragmentos para contornar erro nem repetir CREATE TABLE em estruturas existentes. Não carregar seed com dados pessoais ou copiar o catálogo de Auth do staging.

### Se já houver tabelas ou dados

Parar o caminho de banco novo. Inventariar histórico de migrações e estrutura, providenciar recuperação protegida, planejar janela e preparar uma **migração de adequação revisada separadamente**, sem editar retroativamente o histórico aplicado. Não executar os arquivos acima cegamente.

Para novo CHECK/FK em tabela populada, adicionar a definição completa com `NOT VALID`, corrigir incompatibilidades de forma revisada e só depois `VALIDATE CONSTRAINT`. Exemplo **documental**, para uma tabela cuja coluna de eliminação já exista e cuja constraint ainda não exista:

```sql
ALTER TABLE public.<TABELA_REVISADA>
  ADD CONSTRAINT tombstone_minimo
  CHECK (eliminado_em IS NULL OR
    (apagado_em IS NOT NULL AND dados = jsonb_build_object(
      'id', id, 'user_id', user_id,
      'apagado_em', apagado_em, 'eliminado_em', eliminado_em))) NOT VALID;

-- Depois da revisão/correção dos dados e em execução controlada separada:
ALTER TABLE public.<TABELA_REVISADA>
  VALIDATE CONSTRAINT tombstone_minimo;
```

Não executar o exemplo com marcador. `NOT VALID` não dispensa validar as linhas antigas e já restringe novas inserções/alterações; não é modo de desativar proteção. Não se aplica da mesma forma a UNIQUE/PK: revisar seus requisitos separadamente. Se uma validação falhar, bloquear a liberação; não remover RLS, CHECK ou trigger para forçar sucesso. [Referência PostgreSQL](https://www.postgresql.org/docs/current/sql-altertable.html).

### Interpretação obrigatória da checagem

- 20 tabelas esperadas presentes e com RLS: 17 de dados + 3 controles. Tabelas extras do schema public sem RLS exigem triagem, incluindo eventual extensão; não corrigir em massa automaticamente.
- Políticas por proprietário, sem políticas permissivas adicionais que abram acesso. Resultados `TO PUBLIC`, `USING (true)` ou `WITH CHECK (true)` exigem revisão; a consulta é triagem, não prova formal de toda expressão.
- anon/authenticated sem DELETE/TRUNCATE nas tabelas public. Os controles de tentativas/exclusão da conta devem continuar inacessíveis ao cliente. Storage.objects é caso distinto: DELETE sob RLS é necessário para a API remover objetos, não para executar SQL manual.
- 17 triggers `bloquear_eliminado`, habilitados para operação normal e BEFORE UPDATE; 17 CHECKs `tombstone_minimo` presentes e validados; FKs para auth.users com cascata. Presença não substitui testar rejeição de UPDATE/upsert.
- SECURITY DEFINER esperado em public: `vida_em_dia_conta_ativa`, de escopo limitado e search_path vazio. Inventariar os demais, inclusive os da plataforma, sem remover funções nativas por aparecerem na lista. RPC de eliminação deve continuar SECURITY INVOKER.

Reexecutar o arquivo depois de cada migração e ao concluir as demais configurações. A checagem não consulta Auth settings, secrets, objetos dos usuários, comandos do cron ou logs.

## 3. Conferir bucket privado e políticas de Storage

O bucket `fotos-vida-em-dia` já é criado pela primeira migração: **não criar outro bucket público**. Conferir public=false, limite de 5 MiB e tipos JPEG/PNG/WebP. Revisar políticas SELECT/INSERT/UPDATE/DELETE por pasta inicial igual ao UUID autenticado e a restrição de conta em exclusão. Não acrescentar política pública para “fazer a imagem aparecer”.

Homologar com credenciais de cliente A/B, não com o painel administrativo nem service_role, que contornam RLS. Cada objeto fica sob `<UUID_DONO>/...`. Remover arquivos sempre pela **Storage API**, nunca por DELETE em storage.objects. Testar arquivos e subpastas, falha parcial e retry da fila de objetos.

O app atual renderiza fotos locais via Blob, não faz upload/download normal das fotos sincronizadas. A presença do bucket não muda isso. Testes do bucket devem ser feitos separadamente pela API autorizada. Se futuramente houver URL assinada, B não pode emitir uma URL para objeto de A; a URL assinada emitida legitimamente é uma capacidade temporária e não deve ir a logs/relatórios.

## 4. Configurar secrets, CORS e implantar Edge Functions

No painel de secrets do **projeto correto**, conferir somente a existência dos nomes, sem imprimir valores. Para cada ambiente, configurar sua própria identidade e origem:

| Nome | Uso e local |
| --- | --- |
| `SUPABASE_URL` | Injetada pelo Supabase no runtime do próprio projeto, sem override manual |
| `SUPABASE_ANON_KEY` | Variável gerenciada do servidor, cliente anon usado na reautenticação |
| `SUPABASE_SERVICE_ROLE_KEY` | Somente ambiente protegido/secrets do Supabase, operações administrativas da função |
| `EXPECTED_PROJECT_REF` | Secret obrigatório, deve coincidir com o ref derivado da URL injetada naquele projeto |
| `APP_ENV` | Rótulo do ambiente, aceito somente como staging ou production |
| `APP_ORIGIN` | Origem exata autorizada no CORS, sem caminho, barra final ou curinga |
| `PURGA_SECRET` | Segredo independente por ambiente, aleatório, com pelo menos 32 caracteres, também no gestor protegido do agendador |

As variáveis gerenciadas `SUPABASE_*` não devem ser recriadas com valores copiados para arquivo. Conferir a disponibilidade das variáveis legadas usadas pelo SDK atual; se a plataforma oferecer configuração diferente, parar e revisar o adapter em tarefa separada. Nunca usar chave administrativa com prefixo VITE_, no cliente, Vercel ou workflow de build. [Variáveis do runtime Supabase](https://supabase.com/docs/guides/functions/secrets).

O guard compara o ref real com EXPECTED_PROJECT_REF **antes de servir qualquer função**. Ausência/divergência recusa, sem projeto padrão e sem valores no erro. A mudança do antigo STAGING_PROJECT_REF exige configurar EXPECTED_PROJECT_REF antes de qualquer redeploy em staging. CORS vem de APP_ORIGIN, não de domínio/ref fixo no código. Produção exige origem HTTPS.

Para Preview, usar uma origem estável exata de homologação; para Production, a origem de produção. O handler aceita uma origem por projeto. Development em localhost não ganha acesso à função de exclusão do staging implicitamente: fazer esse teste pelo Preview autorizado ou por stack isolada. Não ampliar CORS de produção para localhost ou wildcard.

Depois da aprovação específica de deploy e substituição do placeholder, a ordem é:

```text
supabase functions deploy excluir-conta --project-ref <REF_PRODUCAO>
supabase functions deploy purgar-removidos --project-ref <REF_PRODUCAO>
```

Repetir separadamente para staging quando autorizado, sempre com seu ref, sem confiar em link implícito da CLI. `supabase/config.toml` usa import map fixado e verify_jwt=false: isso exige manter a validação remota do JWT dentro de excluir-conta e a verificação de segredo dentro de purgar-removidos. Não publicar versões que retirem essas verificações. A senha é conferida por signInWithPassword em cliente anon; service_role é só para as etapas administrativas.

Antes de prosseguir, testar ausência/divergência de EXPECTED_PROJECT_REF em ambiente controlado, origem errada, JWT inválido, senha errada, limite de tentativas e recuperação de falha parcial. Não registrar request bodies, e-mail, JWT, senhas ou secrets nos logs da infraestrutura.

## 5. Ativar e homologar o agendamento da purga

1. A consulta de verificação informa se pg_cron está **instalado** e se está disponível para instalar. Não instalar extensão implicitamente nem confundir os dois estados.
2. Se pg_cron já estava instalado na segunda migração, conferir pelo painel operacional o job `vida-em-dia-purga`, agendado às 03:17 no timezone efetivo do cron. Ele chama a purga SQL de conteúdo após 30 dias. Não duplicar o job.
3. Se instalar pg_cron depois, a migração anterior não agenda retroativamente. Criar o agendamento somente por procedimento posterior revisado/autorizado, ou usar a alternativa abaixo. Não reexecutar a migração inteira.
4. **Com ou sem pg_cron**, configurar um agendador servidor-servidor com POST para `https://<REF_PRODUCAO>.supabase.co/functions/v1/purgar-removidos`, usando PURGA_SECRET em Bearer a partir do gestor de secrets do agendador, nunca em query string, arquivo ou comando literal. O endpoint faz a purga SQL e consome a fila de Storage pela API. Sem cron, ele é o mecanismo completo de purga.
5. Executar periodicamente, por exemplo a cada hora, ajustando frequência/capacidade ao volume: cada chamada consome até 100 objetos. Monitorar idade da fila, sucesso/falha e backlog sem logar caminhos pessoais nem o Bearer. Habilitar retry com atraso. A comparação do segredo é feita por digests em laço de tamanho fixo; chamada sem segredo/corpo correto não pode limpar dados.
6. Testar um removido sintético de prazo vencido e outro recente, fila parcial e retry. Eliminação não é reversível. A purga local só roda quando a identidade é aberta; aparelho offline não confirma exclusão no servidor por si só.

Não colar secrets em cron.job/SQL. Se for adotada integração de cron com HTTP, a recuperação do segredo deve vir de mecanismo protegido e revisado, sem literal persistido em comando; o agendador externo é a alternativa pronta deste código.

## 6. Configurar Auth, URLs, SMTP e proteções

Manter Allow new users to sign up desligado durante toda esta seção. Configurar no painel do respectivo projeto, não em constantes do frontend:

| Ambiente/projeto | Site URL | Redirect URLs autorizadas | APP_ORIGIN do CORS |
| --- | --- | --- | --- |
| Production / novo projeto | `https://<DOMINIO_PRODUCAO>/` | Só `https://<DOMINIO_PRODUCAO>/` inicialmente | A mesma origem HTTPS, sem barra final |
| Preview / staging | `https://<DOMINIO_PREVIEW_FIXO>/` | Essa URL exata | A origem estável de Preview, sem barra final |
| Development / staging, se habilitado | Site URL do staging permanece no Preview | Acrescentar apenas `http://localhost:5173/` se esse for o endereço efetivamente usado | Não ampliar a função remota de produção para Development |

Cada célula é um template a preencher no painel. Não criar uma rota `/auth/callback` inexistente. O app atual usa a raiz e recuperação por código; detectSessionInUrl=false, portanto não pressupor auto-login por fragmento. Não adicionar domínios de Preview, localhost ou wildcard ao projeto de produção. Se houver outro redirectTo/emailRedirectTo no futuro, registrar o caminho exato, revisar a configuração e repetir o teste. [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).

Configurar SMTP próprio, domínio/remetente verificados e entrega real de convite, confirmação e recuperação. Credenciais ficam na configuração protegida do provedor/Supabase, sem arquivos locais. Aplicar os templates confirmar-cadastro.html e templates/recuperar-senha.html preservando os tokens. Conferir também o template **Invite user**, que é separado dos dois anteriores. [SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

Definir limites de envio, OTP, login/refresh e criação de usuários conforme tráfego esperado e capacidade do SMTP. Registrar os números efetivos e testar respostas de limite; não elevar tudo para contornar homologação. A função de exclusão tem ainda seu limite persistente de cinco tentativas em quinze minutos. [Rate limits](https://supabase.com/docs/guides/auth/rate-limits).

Escolher política de senha e habilitar proteção contra senhas vazadas quando o plano oferecer. A documentação consultada indica essa proteção no Pro e superiores. Uma política de pelo menos 12 caracteres pode ser definida como decisão operacional, mas a UI atual anuncia mínimo 8: **alinhar mensagens/validação do app em tarefa própria antes de abrir cadastro se o servidor exigir mais**. Testar criação, recuperação e reautenticação da exclusão com a política escolhida. [Segurança de senha](https://supabase.com/docs/guides/auth/password-security).

Avaliar CAPTCHA e disponibilidade no plano/provedor. O app atual não tem widget nem envio de captchaToken. **Não habilitar no Auth e presumir compatibilidade**: integrar, revisar CSP do provedor e testar signup/login/recuperação e reautenticação antes de abrir o cadastro. Se essa proteção for exigida para lançamento, a ausência da integração bloqueia a liberação; não adicionar uma liberação geral de scripts/iframes para contornar. [CAPTCHA](https://supabase.com/docs/guides/auth/auth-captcha). Não foi adicionada integração CAPTCHA nesta tarefa.

## 7. Criar duas contas de teste por convite, com signup fechado

1. Authentication → Users → Add user → **Invite user**: convidar duas caixas de e-mail controladas pelos responsáveis, identificadas apenas como A e B no registro de teste. Não usar Create new user com autoconfirmação, não inserir linhas em auth.users por SQL e não colocar senhas em scripts.
2. Usar o template de convite e o redirect exato daquele projeto. Cada responsável aceita o próprio convite. A criação administrativa por convite não é motivo para abrir signup ao público. Se o painel/serviço impedir o convite, interromper e revisar a configuração; não ligar signup para contornar.
3. Confirmar aceitação/validação do e-mail no painel Auth. Como o app não consome automaticamente fragmentos de sessão, não confundir chegar à tela de login com senha já configurada. Usar a recuperação por código do app para definir a senha de cada conta após aceitar o convite. Homologar essa sequência; se o convite não confirmar o usuário ou o código não funcionar, bloquear a liberação e revisar o fluxo/template, sem marcar confirmado manualmente.
4. Entrar em perfis de navegador separados e só usar dados sintéticos, nunca dados de saúde reais. Manter credenciais pessoais fora dos relatórios.

Convites administrativos usam o fluxo oficial [inviteUserByEmail](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail); este procedimento não expõe a API administrativa ao frontend.

## 8. Preparar Vercel e CSP sem misturar os projetos

| Vercel | Nomes das variáveis | Regra |
| --- | --- | --- |
| Production / main | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | Somente URL/chave pública do novo projeto de produção, depois da aprovação de ativação |
| Preview / test | Os mesmos nomes | Somente staging, preservar a separação existente |
| Development | Os mesmos nomes, se necessários | Desligado por padrão ou staging autorizado, nunca produção |

Não configurar VITE_SUPABASE_ANON_KEY em paralelo à publishable sem revisão: há fallback legado no cliente, mas a preparação usa um único nome de chave pública. Service_role, EXPECTED_PROJECT_REF, PURGA_SECRET, credenciais SMTP e senha de banco **não são variáveis Vercel deste app**. Valores VITE_ entram no bundle e não servem para secrets. `.env.example` deve continuar apenas com nomes vazios/placeholders; não criar arquivo de chaves para provisionar.

Antes do deploy de ativação do backend:

1. Atualizar **vercel.json**, único para Preview e Production, adicionando `https://<REF_PRODUCAO>.supabase.co` e `wss://<REF_PRODUCAO>.supabase.co` em connect-src, substituindo conscientemente o marcador pela origem pública real quando existir. Manter também staging para Preview. Não colocar ref fixo em runtime, cliente, testes ou workflows.
2. img-src continua self/data/blob enquanto só houver imagens locais. Se passar a usar Storage remoto/URL assinada, adicionar apenas as origens realmente necessárias por ambiente e testar. Não acrescentar wildcard de Supabase.
3. Manter CSP **Report-Only**, X-Frame-Options DENY e Cache-Control de sw.js. Publicar e exercitar primeiro no Preview/staging, sem trocar as variáveis desse ambiente para produção. Verificar os headers HTTP na Vercel e violações no DevTools; build local não prova headers.
4. Com cadastro ainda fechado e mediante autorização específica, configurar apenas as duas variáveis de Production e fazer deploy de homologação controlada no domínio de produção. Repetir o checklist A/B/anônimo nesse ambiente ainda em Report-Only. Não abrir signup por causa de um build verde.
5. Somente com ambos homologados e aprovação separada, fazer **outro commit futuro** de enforcement da CSP. Nenhum enforcement está incluído nesta preparação. Repetir os testes após essa mudança antes da abertura final.

## 9. Checklist de homologação — repetir em staging e produção

Usar [CHECKLIST-PRODUCAO.md](CHECKLIST-PRODUCAO.md), registrando ambiente, versão/commit, data, responsáveis e resultados sem credenciais ou dados pessoais. Aprovação exige todas as verificações aplicáveis concluídas; qualquer falha de isolamento, permissões ou restauração bloqueia cadastro.

## 10. Retenção — o que a eliminação não apaga

Segundo a [documentação de backups consultada em 21/10/2026](https://supabase.com/docs/guides/platform/backups), backups diários estão disponíveis em Pro/Team/Enterprise, com janelas de 7/14/até 30 dias, respectivamente. Free não oferece essa mesma garantia. PITR é add-on para planos elegíveis, com janelas de 7/14/28 dias e requisito de compute; quando ativado, substitui a rotina diária. **Registrar o plano e a janela realmente contratados no painel**, sem prometer esses prazos como configuração já aplicada. Backups do banco incluem metadados de Storage, não os bytes dos objetos.

Eliminação de uma linha/conta não expurga retroativamente backups diários, PITR/WAL, logs do provedor, arquivos exportados pelo usuário ou snapshots do aparelho. Restauração antiga de banco pode reintroduzir dados eliminados: manter o serviço fechado e reaplicar exclusões comprovadas antes de disponibilizar a restauração. A proteção do app contra backup antigo não resolve, sozinha, restauração administrativa do banco inteiro. Definir acesso, expiração e processo de restauração seguro no plano operacional. Não prometer apagar seletivamente versões do backup do provedor sem mecanismo contratual verificado.

Complementar a política de privacidade com [APP-03-ELIMINACAO.md](APP-03-ELIMINACAO.md): tombstones mínimos enquanto a conta existir, caminhos temporários de retry, logs e retenções legais efetivamente aplicáveis. Não inventar obrigação legal ou prazo de log. A remoção por Storage API não garante sanitização forense de mídia/replicação do provedor.

## 11. Rollback

**Eliminação é irreversível.** Remover um deploy, voltar código ou retirar variáveis não restaura conteúdo/objetos/conta já eliminados. Não desabilitar triggers para “desfazer” e não usar backup antigo para ressuscitar dados apagados.

Para este banco novo ainda sem usuários reais, o rollback da ativação é:

1. Manter/desativar novos cadastros no Auth e interromper a liberação. Suspender agendador/funções quando necessário por procedimento autorizado, sem executar novas eliminações para “limpar o teste”.
2. **Remover as duas variáveis Supabase de Production na Vercel** e desfazer o deploy, retornando à versão conhecida sem backend. Confirmar um novo build sem variáveis: elas são incorporadas no build; apagar a configuração não retira valores de um asset já publicado. Não alterar Preview/staging.
3. Não apontar Production para staging como fallback. Não apagar projeto, bucket ou Auth automaticamente: preservar diagnóstico e definir descarte do projeto novo separadamente com o responsável.
4. Se os dados locais das contas de teste persistirem no navegador, não atribuí-los ao visitante; usar as limpezas explícitas por identidade/legado apenas com confirmação. Sair/retirar backend não é expurgo local automático.
5. Com usuários reais, esse roteiro deixa de ser rollback de banco vazio: exigir plano de incidente/continuidade e revisão de perdas, sem tratar restauração de snapshot como reversão segura de uma eliminação.

## Registro da preparação local

Runtime e testes entregues em commit separado. Esta documentação e as consultas não executam provisionamento. A checagem SQL é testada em PGlite com roles/auth.uid sintéticos e fixture deliberadamente insegura para verificar detecção; não comprova Auth, SMTP, Storage, cron, Deno nem configuração remota real.

Grep de fontes/configurações versionadas executado sem ocorrências de ref/URL real de projeto fora de vercel.json e documentação; a busca por padrões de JWT, chaves Supabase e connection strings com senha também não retornou arquivos. Essa busca por padrões não substitui um scanner completo de segredos. URLs externas de funcionalidades (por exemplo, link do YouTube), namespaces e URLs sintéticas de testes não são credenciais/projetos provisionados. `.env.example` contém somente VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY vazios. Nenhum .env.local foi lido.

Validação local, em ordem, em 21/10/2026: `npm.cmd run typecheck` → `npm.cmd run lint` → `npm.cmd test` → `npm.cmd run build`, todos aprovados. Suíte final: **261 testes em 42 arquivos**. O commit de runtime passou separadamente na mesma sequência, com 260 testes em 42 arquivos. Nenhum deploy, aplicação SQL remota, merge ou push foi realizado; a homologação deste checklist continua pendente.
