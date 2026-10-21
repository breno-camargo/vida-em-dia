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

### Projetos Supabase — pendência explícita

| Origem | Evidência | Ambiente |
| --- | --- | --- |
| `https://ofzixbpliejnaiyuspti.supabase.co` e `wss://ofzixbpliejnaiyuspti.supabase.co` | URL pública extraída do bundle local; uso na CSP autorizado explicitamente pelo usuário nesta rodada | **NÃO CONFIRMADO: staging ou produção** |
| Eventual segundo projeto em Production/Preview | Nenhuma segunda URL pública confirmada | **NÃO VERIFICÁVEL nesta rodada** |

O usuário confirmou: prosseguir com essa origem e deixar a identificação dos ambientes como pendência antes do enforcement. Não usamos wildcard `*.supabase.co`, não inventamos segunda origem e não lemos .env.local, chaves ou valores de secrets. `.vercel/project.json` identifica somente o projeto Vercel vida-em-dia, sem provar a configuração das variáveis por ambiente. A orientação de separar projetos em supabase/CONFIGURAR.md é recomendação, não evidência de configuração real.

Metadados de deployments no GitHub mostram ambientes distintos: Production em 14/10/2026 (deployment 7071627158) e Preview em 15/10/2026 (7080513432). Isso **não comprova** quais projetos Supabase usam nem a configuração atual da Vercel. Antes do enforcement, conferir VITE_SUPABASE_URL em Preview e Production no painel, informar apenas as URLs públicas e atualizar connect-src com HTTPS/WSS de ambas se forem diferentes. Acrescentar img-src somente quando a renderização realmente usar Storage remoto.

### Homologação dos headers e migração futura

1. Publicar somente em ambiente de homologação mediante autorização separada. Vite dev/preview e um build local **não aplicam** automaticamente headers de vercel.json. Conferir respostas reais na Vercel, não apenas o arquivo.
2. DevTools → Network, com cache desabilitado e recarga completa: conferir os headers do documento, rota reescrita, `/sw.js`, manifest e assets. Confirmar `/sw.js` com `Cache-Control: no-cache`, X-Frame-Options DENY, HSTS exato e ausência de `Content-Security-Policy` enforced. Service worker antigo pode servir resposta em cache: conferir também com Bypass for network em Application → Service Workers; repetir depois com o SW ativo.
3. Console: filtrar Content Security Policy/Report-Only. Registrar diretiva e origem necessárias, sem copiar dados pessoais, tokens ou URLs assinadas completas. A mensagem de que frame-ancestors é ignorado em Report-Only pode aparecer; a proteção efetiva nesta fase é X-Frame-Options. Não ignorar avisos de parsing de diretivas.
4. Exercitar login/recuperação/sync/Storage, navegação, gráficos, fotos e miniaturas, backup/importação, exportação de cards, copiar/compartilhar, áudio e wake lock, atualização do SW, PWA/offline, Chrome e Safari/iPhone. Testar tentativa de iframe a partir de outra origem: deve ser recusada por X-Frame-Options.
5. Não foi criado coletor report-uri/report-to: violações devem ser examinadas no DevTools. Não enviar relatórios a terceiros por padrão; podem revelar URLs e contexto de navegação. Caso se adote coletor próprio, definir minimização, acesso e retenção antes.
6. **Somente após confirmar ambientes e homologar os fluxos sem violações necessárias**, fazer commit separado trocando o nome do header para Content-Security-Policy, mantendo fontes mínimas e X-Frame-Options. Se surgir script inline, remover/externalizar ou usar hash SHA-256 exato do conteúdo; nunca acrescentar unsafe-inline a script-src. Se for necessário style element, avaliar hash/externalização, sem ampliar unsafe-inline geral.
7. Confirmar domínio antes de discutir includeSubDomains/preload. Nada disso foi habilitado nesta rodada. Report-Only não deve ser descrito como bloqueio de XSS ou de conexões; serve para observar a política candidata.

Fontes: [CSP Report-Only](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy-Report-Only), [style-src-attr](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/style-src-attr), [Permissions-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy).

## Etapa 2 — CI

Preparação: instalação limpa isolada de HEAD, sem .env.local, em diretório temporário. `npm.cmd ci --ignore-scripts --no-audit` passou no Windows, seguido de tipos, lint, 255 testes e build. Não executou scripts de instalação. Houve aviso de depreciação de glob transitivo; nenhuma atualização global de dependências foi feita.

**Esse teste local NÃO comprova Ubuntu:** bindings opcionais por plataforma e ferramentas podem se comportar de forma diferente. A validação real será o workflow na branch `test`, após push autorizado pelo usuário em outra rodada. Se falhar por script necessário, identificar a causa mínima; não liberar todos os postinstalls sem análise.

Configuração de workflow/Dependabot e resultado final desta etapa serão registrados no segundo commit.

## Configurações fora do código — responsabilidade no GitHub

- Habilitar secret scanning e push protection conforme disponibilidade do plano/repositório; verificar cobertura e tratamento de exceções. Não foram alterados remotamente nesta tarefa.
- Configurar ruleset/proteção para main e test: PR obrigatório, revisão obrigatória (idealmente pessoa distinta), checks obrigatórios, impedir force push/exclusão e revisar bypass de administradores/automação. Não aprovar o próprio PR automaticamente.
- Tornar o check de validação obrigatório após confirmar o nome e sua execução real; exigir nova revisão quando houver mudanças posteriores à aprovação, conforme a política da equipe.
- Habilitar Dependency graph, Dependabot alerts/security updates e revisar permissões das Actions e política de Actions permitidas. Cooldown de version updates não substitui tratamento urgente de alertas de segurança.
- Confirmar a branch padrão: Dependabot lê sua configuração a partir dela. Arquivo apenas local ou apenas na branch test pode ainda não ativar a automação. Esta tarefa não autoriza merge para ativá-la.
