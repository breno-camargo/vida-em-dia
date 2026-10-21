# Lote 4 — headers e CI

Branch `test`, 21/10/2026. Escopo restrito a configuração de headers/CI e documentação. Sem deploy, merge ou push. **CSP somente Report-Only; enforcement fica para homologação e commit futuro separado.** X-Frame-Options e os demais headers passam a valer efetivamente quando esta configuração for publicada.

## Etapa 1 — headers

Validação local desta etapa: tipos → lint → 255 testes em 41 arquivos → build, todos passaram. Inspeção do build final e checagem programática confirmaram script externo, Workbox local, Cache-Control preservado e ausência de header CSP enforced. Não foi realizada publicação ou homologação HTTP na Vercel.

`vercel.json` mantém os comandos, rewrites e a regra exata `/sw.js → Cache-Control: no-cache`. A nova regra global acrescenta:

- `Content-Security-Policy-Report-Only`: default/script da própria origem; conexões self e HTTPS/WSS do único projeto Supabase autorizado abaixo; imagens self/data/blob; `style-src 'self'` e exceção de atributos `style-src-attr 'unsafe-inline'`; mídia self/data/blob; worker e manifest self; objetos negados; base/form self; frame-ancestors none.
- `X-Frame-Options: DENY`, **enforced**. Não dependemos de frame-ancestors em Report-Only, onde essa diretiva não protege contra enquadramento.
- `Strict-Transport-Security: max-age=31536000`, sem preload nem includeSubDomains. Atua em HTTPS; domínio e subdomínios ainda não foram homologados para ampliar o escopo.
- `X-Content-Type-Options: nosniff` e `Referrer-Policy: strict-origin-when-cross-origin`.
- Permissions-Policy nega câmera/microfone/geolocalização, sensores de movimento, pagamento, USB/serial/HID/Bluetooth/MIDI, captura de tela, XR, fullscreen e leitura de clipboard, sem usos encontrados no código. Preserva escrita de clipboard, screen wake lock, web share e autoplay na própria origem. Vibração não é negada. Seleção de arquivo/foto continua disponível; não há getUserMedia nem captura de câmera via JS no código atual. Verificar o seletor de fotos no aparelho real.

### Evidências da inspeção

- `index.html` e `dist/index.html`: scripts externos da própria origem. Nenhum script inline encontrado. Não foi necessário hash, nonce ou unsafe-inline em script-src.
- `vite.config.ts` e `dist/sw.js`: service worker gerado pelo Workbox importa `./workbox-*.js` da própria origem. Não há CDN para scripts. Inspeção dos chunks de produção não encontrou eval/new Function ou criação de elementos style. O bundle gerado não é versionado; repetir a inspeção após mudanças de plugin/build.
- `src/componentes/RevisarDuplicatas.tsx:35` tem `style={{whiteSpace:'pre-line'}}`. Componentes de gráficos também manipulam atributos de estilo. A exceção fica em style-src-attr, sem liberar elementos `<style>` ou script inline. Navegador sem suporte a style-src-attr pode reportar violações adicionais; não tornar a política enforced antes da homologação.
- `src/componentes/AjudaExercicio.tsx:13-22` e `MiniaturaExercicio.tsx`: imagens vêm de Blob local por URL.createObjectURL. Busca por createSignedUrl/getPublicUrl não encontrou uso; caminho_storage existe no modelo e na remoção, mas não é usado para renderização remota. Portanto **não há origem Supabase em img-src agora**. Se fotos sincronizadas por URL assinada forem implementadas, acrescentar somente a origem efetivamente usada e homologar.
- YouTube é um link externo em AjudaExercicio, sem iframe no app. Não foi adicionada exceção de frame-src para YouTube.
- `src/hooks/useTelaLigada.ts`: usa Screen Wake Lock ou fallback NoSleep. A dependência NoSleep contém vídeo data:; por isso media-src permite data: e autoplay próprio não foi negado. `CardCompartilhavel` usa clipboard.write/writeText e navigator.share; `BackupConfiguracoes` também usa share. `Descanso` usa navigator.vibrate e áudio local/WebAudio.

### Projetos Supabase — confirmação do usuário

| Origem | Evidência | Ambiente |
| --- | --- | --- |
| `https://ofzixbpliejnaiyuspti.supabase.co` e `wss://ofzixbpliejnaiyuspti.supabase.co` | Usuário conferiu no painel e confirmou nesta rodada | **STAGING, usado pelo Preview da Vercel** |
| Production da Vercel, branch main | Usuário confirmou ausência de variáveis Supabase | **App sem backend** |
| Futuro projeto Supabase de produção | Será criado pelo usuário; ainda não existe | **Sem ref ou origem a adicionar agora** |

Essas informações de ambiente foram conferidas no painel pelo usuário, não por inspeção remota do agente. `connect-src` lista somente HTTPS/WSS do staging, além de self. Não usamos wildcard `*.supabase.co`, não inventamos segunda origem e não lemos .env.local, chaves ou valores de secrets. Como as fotos são exibidas por Blob local, img-src continua self/data/blob, sem origem Supabase. Permitir staging na CSP não configura um backend em Production: o cliente continua dependendo das variáveis VITE_SUPABASE_URL e da chave pública por ambiente.

**Pendência obrigatória antes do enforcement:** quando o projeto Supabase de produção for criado, acrescentar sua origem HTTPS e WSS a connect-src em vercel.json e homologar ambos os ambientes. **vercel.json é único para Preview e Production**: manter também as origens do staging enquanto Preview o utilizar. Configurar as variáveis de Production separadamente; nunca reaproveitar o backend de staging implicitamente. Se houver renderização de fotos remotas, acrescentar a img-src apenas as origens de Storage realmente utilizadas. Até essa revisão, a CSP permanece Report-Only e não há ref fictício de produção.

A busca nos arquivos versionados confirmou que o ref real do staging aparece somente em vercel.json e nesta documentação. O cliente usa variáveis de ambiente; não foi fixado ref em código, workflow, testes ou novo arquivo de configuração. A incorporação de uma URL pública no bundle por Vite é resultado da configuração de build, não uma referência fixa no fonte. Não alterar o cliente para contornar uma origem ausente da CSP.

### Homologação dos headers e migração futura

1. Publicar somente em ambiente de homologação mediante autorização separada. Vite dev/preview e um build local **não aplicam** automaticamente headers de vercel.json. Conferir respostas reais na Vercel, não apenas o arquivo.
2. DevTools → Network, com cache desabilitado e recarga completa: conferir os headers do documento, rota reescrita, `/sw.js`, manifest e assets. Confirmar `/sw.js` com `Cache-Control: no-cache`, X-Frame-Options DENY, HSTS exato e ausência de `Content-Security-Policy` enforced. Service worker antigo pode servir resposta em cache: conferir também com Bypass for network em Application → Service Workers; repetir depois com o SW ativo.
3. Console: filtrar Content Security Policy/Report-Only. Registrar diretiva e origem necessárias, sem copiar dados pessoais, tokens ou URLs assinadas completas. A mensagem de que frame-ancestors é ignorado em Report-Only pode aparecer; a proteção efetiva nesta fase é X-Frame-Options. Não ignorar avisos de parsing de diretivas.
4. Exercitar login/recuperação/sync/Storage, navegação, gráficos, fotos e miniaturas, backup/importação, exportação de cards, copiar/compartilhar, áudio e wake lock, atualização do SW, PWA/offline, Chrome e Safari/iPhone. Testar tentativa de iframe a partir de outra origem: deve ser recusada por X-Frame-Options.
5. Não foi criado coletor report-uri/report-to: violações devem ser examinadas no DevTools. Não enviar relatórios a terceiros por padrão; podem revelar URLs e contexto de navegação. Caso se adote coletor próprio, definir minimização, acesso e retenção antes.
6. **Somente após adicionar a origem HTTPS/WSS do futuro projeto de produção à política única e homologar Preview e Production sem violações necessárias**, fazer commit separado trocando o nome do header para Content-Security-Policy, mantendo fontes mínimas e X-Frame-Options. Se surgir script inline, remover/externalizar ou usar hash SHA-256 exato do conteúdo; nunca acrescentar unsafe-inline a script-src. Se for necessário style element, avaliar hash/externalização, sem ampliar unsafe-inline geral.
7. Confirmar domínio antes de discutir includeSubDomains/preload. Nada disso foi habilitado nesta rodada. Report-Only não deve ser descrito como bloqueio de XSS ou de conexões; serve para observar a política candidata.

Fontes: [CSP Report-Only](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy-Report-Only), [style-src-attr](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/style-src-attr), [Permissions-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy).

## Etapa 2 — CI

Preparação: instalação limpa isolada de HEAD, sem .env.local, em diretório temporário. `npm.cmd ci --ignore-scripts --no-audit` passou no Windows, seguido de tipos, lint, 255 testes e build. Não executou scripts de instalação. Houve aviso de depreciação de glob transitivo; nenhuma atualização global de dependências foi feita.

**Esse teste local NÃO comprova Ubuntu:** bindings opcionais por plataforma e ferramentas podem se comportar de forma diferente. A validação real será o workflow na branch `test`, após push autorizado pelo usuário em outra rodada. Se falhar por script necessário, identificar a causa mínima; não liberar todos os postinstalls sem análise.

Workflow atualizado: permissions contents: read no nível global, sem ampliação por job; checkout sem persistir credenciais; limite de quinze minutos; npm ci --ignore-scripts; npm audit --audit-level=high antes de tipos/lint/testes/build. A auditoria não usa continue-on-error. Não há pull_request_target, deploy, escrita no repositório ou nova Action de terceiros.

### Actions verificadas

| Repositório oficial | Tag exata | SHA de commit fixado |
| --- | --- | --- |
| [actions/checkout](https://github.com/actions/checkout) | v4.4.0 | `11d5960a326750d5838078e36cf38b85af677262` |
| [actions/setup-node](https://github.com/actions/setup-node) | v4.4.0 | `49933ea5288caeca8642d1e84afbd3f7d6820020` |

Verificação em 21/10/2026: git ls-remote --tags dos repositórios oficiais, pedindo refs/tags/v4, refs/tags/v4^{} e refs/tags/v4.*. Em ambos, v4 e v4.4.0 apontaram ao mesmo SHA; não houve linha ^{} porque as tags são leves. Conferência adicional na API oficial `/repos/actions/<repo>/git/ref/tags/v4.4.0` retornou `object.type: commit` com os mesmos SHAs. Portanto não são SHAs de objetos anotados de tag. Comentários no workflow registram v4.4.0. Nenhum SHA inventado e nenhuma mudança de major das Actions.

### Dependabot

`.github/dependabot.yml`: npm e github-actions na raiz; procura semanal; cooldown default-days: 7 em ambos; PRs de version updates direcionados à branch test. npm agrupa minor/patch e deixa majors para revisão separada; Actions agrupadas por ecossistema. Grupos têm applies-to: version-updates. Não há automerge nem ignore geral de atualizações.

Segundo a [referência oficial do Dependabot](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference#cooldown), cooldown só se aplica a version updates, **não a security updates**. O suporte atual inclui default-days para github-actions. Security updates continuam dependentes de estarem habilitadas no GitHub e operam na branch padrão; target-branch de version updates não redireciona essas correções para test nem configura sua política. Não foram agrupadas ou atrasadas nesta tarefa. Revisar alertas urgentes independentemente do calendário semanal.

Não modificamos package.json/package-lock nem atualizamos dependências neste lote. O PGlite continua fixado em 0.5.8; futuras propostas do bot exigem revisão, inclusive da idade mínima já combinada para esse pacote.

### Validação do segundo commit

Validação final desta etapa, em ordem: tipos (app e Edge) → lint → **255 testes em 41 arquivos** → build, todos passaram. `npm.cmd audit --audit-level=high` retornou **found 0 vulnerabilities**, exit code 0.

Os dois YAMLs foram lidos com parser YAML 1.2 (pacote yaml 2.8.2, instalado somente na cópia temporária, sem scripts e sem alterar dependências do repositório). Checagem estrutural confirmou ambos os SHAs, permissões globais somente leitura, checkout sem persistir credenciais, comando audit high, os dois ecossistemas e cooldown de sete dias nos grupos de version updates. Não equivale ao validador completo do GitHub nem à execução do runner.

O build final foi reinspecionado: script externo da própria origem e importação Workbox local; CSP continua somente Report-Only. A execução remota real do GitHub Actions/Ubuntu e a homologação HTTP/PWA na Vercel permanecem pendentes; nenhum push foi autorizado ou realizado. O parser temporário foi instalado **depois** do ensaio de instalação sem scripts/testes/build; esse ensaio usou apenas as dependências originais do lockfile.

## Configurações fora do código — responsabilidade no GitHub

- Habilitar secret scanning e push protection conforme disponibilidade do plano/repositório; verificar cobertura e tratamento de exceções. Não foram alterados remotamente nesta tarefa.
- Configurar ruleset/proteção para main e test: PR obrigatório, revisão obrigatória (idealmente pessoa distinta), checks obrigatórios, impedir force push/exclusão e revisar bypass de administradores/automação. Não aprovar o próprio PR automaticamente.
- Tornar o check de validação obrigatório após confirmar o nome e sua execução real; exigir nova revisão quando houver mudanças posteriores à aprovação, conforme a política da equipe.
- Habilitar Dependency graph, Dependabot alerts/security updates e revisar permissões das Actions e política de Actions permitidas. Cooldown de version updates não substitui tratamento urgente de alertas de segurança.
- Confirmar a branch padrão: Dependabot lê sua configuração a partir dela. Arquivo apenas local ou apenas na branch test pode ainda não ativar a automação. Esta tarefa não autoriza merge para ativá-la.
