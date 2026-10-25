# Retomada da cópia visual — 23/10/2026

## Estado atual — ler primeiro

- Usuário achou a troca de abas seca. Transição refinada: entrada lateral relativa de 20px na direção da aba, opacidade 0,72→1, desaceleração de 260ms; abas internas 220ms; controles 160ms e painéis 220ms. Sem transformar o main nem movimentar rodapés fixos. Preferência de movimento reduzido preservada. Navegação continua síncrona e aceita novos gestos durante o efeito. `conferir-transicao-suave.cjs` passou no Wi-Fi (normal, reduzido, sem API); `conferir-deslize-abas.cjs` passou com e sem movimento. Procedimento final não usa View Transitions/snapshots nativos.

- Deslizar abas principais implementado: esquerda avança, direita volta, mesma ordem da barra; limites sem ciclo. `useDeslizarAbas` preserva vertical, faixas horizontais, campos, modais/seletores e gestos das bordas do navegador. Não dispara cliques ao deslizar. Treino persistido pode ser retomado ao voltar. Suíte completa: 278 testes/46 arquivos; toque emulado normal/reduzido passou em localhost e no IP Wi-Fi; tipos/lint/build passaram. Relatório `revisao/DESLIZAR-ABAS.md`; falta percepção final no iPhone físico pelo usuário.

- Wi-Fi resolvido e confirmado pelo usuário no iPhone: o servidor 5181 estava executando com a identidade offline do sandbox. Captura direcionada mostrou SYN chegando e sendo descartado em `INET: accept inspection`; eventos WFP identificaram filtro 70799, `codex_sandbox_offline_block_inbound`, por SID. Não remover/desativar esse filtro. Encerrado somente o antigo Vite 5181 após validar PID/pasta; servidor reiniciado por `exec_command` com `sandbox_permissions=require_escalated`. Novo processo não corresponde ao SID bloqueado; usuário confirmou “Agora abriu”. Em futuras sessões, iniciar o servidor LAN pela execução autorizada fora do sandbox; um HTTP 200 no próprio PC não valida acesso externo. Manter 5180 local e o projeto original separados. PktMon foi parado e seu filtro temporário removido automaticamente; evidências em `revisao/wifi-iphone.txt` e `wifi-wfp-events.xml`/`wifi-wfp-filters.xml`.

- 24/10, acesso do celular: computador em Ethernet com perfil Público e firewall BlockInbound. Criada com elevação do Windows a regra `Vida em Dia - previa WiFi 5181`: entrada TCP 5181, somente RemoteAddress LocalSubnet, interface Ethernet, perfis Público/Privado. Firewall permaneceu ligado. Resultado de criação confirmado em `revisao/firewall-wifi-status.json`; acesso a partir do celular ainda depende da tentativa do usuário. A regra pode ser desativada/removida após o teste de rede, quando solicitado; não ampliar para internet nem outras portas.

- 24/10, Wi-Fi: IP atual 192.168.0.14, prévia local 5180 e LAN 5181. Corrigida abertura em HTTP real: UUID por getRandomValues quando necessário, catálogo com mesmos IDs SHA-256 pré-calculados e purga adiada em visitante HTTP sem Web Locks. Operações protegidas não foram liberadas sem proteção; backup AES exige HTTPS. `conferir-wifi.cjs` passou criando/salvando ficha e recarregando no IP. Referência: `revisao/COMPATIBILIDADE-WIFI.md`. Reconferir IP nas próximas sessões.

### Pausa solicitada pelo usuário — 23/10/2026

- Todo o trabalho desta conversa está salvo localmente nesta cópia. Branch `visual-isolado`, sem remoto configurado; sem commit, push ou publicação nesta pausa. Não modificar o projeto irmão `vida-em-dia`.
- Usuário quer continuar refinando o protótipo/novo visual, sem avançar automaticamente para água, vídeos ou promoção do projeto ativo.
- Preferências aprovadas: manter o resumo compacto; descanso lembra o valor até nova alteração; ±15s ajustam só a pausa; prévia dos cards refinada sem mudar o PNG exportado.
- Últimos ajustes: seleção “Aplicar às próximas séries” virou cartão com área inteira clicável, título/explicação e foco de teclado; ao desmarcar por toque não mantém anel de foco. Em Privacidade há ícone de escudo, descrição, seta separada e contagem explícita (“1 item”).
- Posição final dos controles do exercício: “Como fazer” permanece à direita, enquanto Descanso ocupa horizontalmente o espaço restante no meio. O botão de descanso usa relógio (sem o antigo V) e altura reduzida de 48 para 44px. Não voltar ao arranjo dos dois controles juntos à esquerda, que o usuário rejeitou.
- Os últimos ajustes de posição passaram por tipos e `conferir-memoria-descanso.cjs`; o último ajuste apenas CSS de altura para 44px ainda precisa de nova conferência visual. Não afirmar que toda a suíte foi repetida após esse ajuste. A última suíte completa aprovada teve 270 testes em 44 arquivos; demais evidências estão nas notas abaixo.
- Próximo passo: revisar os últimos controles e preparar, quando solicitado, uma prévia HTTPS isolada da cópia para teste em celular real. O usuário está fora de casa: acesso pela mesma rede Wi-Fi não serve agora. Foi discutida publicação de teste separada, mas não executada nem autorizada como ação concreta. Não publicar nem trocar a branch test/original automaticamente.
- Testes físicos pendentes: toque/teclado, treino completo e retomada, fluidez nos dois temas/listas longas, copiar/baixar/compartilhar PNG no celular, instalação/reabertura/atualização PWA e uso offline. Conta e sincronização continuam bloqueadas na cópia e não estão homologadas por estes testes.
- Endereços locais usados: novo visual `http://127.0.0.1:5180`, aplicativo original `http://127.0.0.1:5173`; houve também preview do build em 4180 para validar offline. Reconferir servidores na retomada, sem encerrar processos ou alterar portas do original por suposição.

### Histórico das entregas desta cópia

- Reserva inferior do treino: `useReservaAcoes` mede o rodapé com ResizeObserver, desconta o padding do main e deixa só 16px entre Cancelar e as ações fixas ao fim da rolagem. Substitui reserva fixa de 100px e margem redundante. `conferir-reserva-treino.cjs` passou em 320/360/390/430px, fontes dos botões 12 e 20px. Lint e tipos passaram.

- Espaços vazios: removido padding-bottom legado de 146px do ResumoTreino e min-height de 240px do conteúdo de Evolução. Preservada reserva do treino em andamento (ações realmente fixas). `conferir-espacos-telas.cjs` passou em 360/390/430px: final do resumo com 28px até a navegação, sem sobreposição.

- Fluidez/otimização entregue: `revisao/FLUIDEZ-E-DESEMPENHO.md`. Transições discretas compartilhadas com cancelamento/movimento reduzido, Treino carregado separadamente e preparado em tempo ocioso, miniaturas próximas da área visível, listas memoizadas. Benchmark do passo Exibir todos: 896 consultas adicionais → 8, mantendo 488 exercícios; JS principal 473,31 → 335,04 kB (módulos separados, não redução de todo o PWA). Lint/tipos/build, 270 testes/44 arquivos, navegação rápida, fotos ao rolar, treino/descanso/PNG/backup e build offline passaram. Relatório de contraste atualizado: 21 estados sem falhas nas amostras. Não validado em celular físico.

- Descanso com memória aprovado e implementado: `salvarDescansoExercicio` em `src/dados/descanso.ts` grava sessão e vínculo da ficha em uma transação, sem pergunta adicional. Outra ficha/outro exercício não são alterados. Treino livre atualiza o padrão do exercício. Não recria vínculo removido nem altera histórico finalizado. Os botões ±15s afetam somente `descanso_fim`. Cinco regressões novas; suíte passou com 270 testes/44 arquivos, lint/tipos/build passaram. `revisao/conferir-memoria-descanso.cjs` validou a interface, persistência após reload e +15s sem mudança do padrão. Mudança somente na cópia.

- Prévia do card refinada sem alterar renderizadores: adesivo sem foto usa o PNG transparente sobre quadriculado claro/escuro; imagem inteira limitada por altura com object-fit contain. Foto de teste usa a composição original, botões Trocar/Remover agrupados, explicação curta. `revisao/conferir-previa-card.cjs` passou, inclusive igualdade byte a byte do PNG antes/depois de adicionar/remover foto fictícia. Tipos/lint e homologação nas três larguras passaram.

- Usuário aprovou manter o resumo compacto. Comparação anterior resolvida: manter `resumo-treino-compacto`. Refino seguinte: descanso sem sombra/moldura interna, ações espaçadas e botões ±15s seguindo o secundário compartilhado.

- Comparação pendente do usuário: pediu melhorar primeiro o botão Tela ligada (opção 2) e depois experimentar resumo compacto (opção 1). Ambas capturas em `revisao/capturas-novo-visual/resumo-opcao-2.png` e `resumo-opcao-1.png`; a compacta está ativa. Para voltar à espaçosa mantendo o botão novo, remover SOMENTE `resumo-treino-compacto` da classe da section em `ModoTreino.tsx`. Alturas medidas: 191px e 140px. `revisao/comparar-resumo-treino.cjs` reproduz as duas e verifica acionamento do botão.

- Catálogo completo: `Treino` carrega automaticamente as variações locais com `ampliarBiblioteca`, preservando a rotina idempotente existente. Instalação descartável confirmou 488 exercícios disponíveis; lista continua com 40 iniciais para desempenho, com botões explícitos Carregar mais e Exibir todos. `revisao/conferir-catalogo-completo.cjs` verifica expansão, seleção do último, salvamento/reload e ausência de duplicação. Mudança somente na cópia.

- Check-up visual posterior: contrato de superfícies em `src/estilos/superficies.css`, controles padronizados, medidas sem tons/margens divergentes e correção dos resets no gerador claro. Evidências e limites em `revisao/CHECKUP-VISUAL.md`. Nenhuma funcionalidade de água/vídeo implementada nesta sessão: usuário pediu continuar refinando o visual.

- Retomada em 23/10: confirmada nova janela do VS Code na pasta `vida-em-dia-novo-visual`; prévia reiniciada em 5180. Suíte completa repetida após os ajustes de contraste: 265 testes em 43 arquivos passaram. Auditoria de contraste repetida: 20 estados, zero falhas nas amostras. A observação abaixo sobre a suíte não repetida é histórica e foi resolvida nesta retomada.

- Trabalhar exclusivamente em `C:\Users\breno\Documents\Codex\2026-10-05\ol\outputs\vida-em-dia-novo-visual`. O diretório irmão `vida-em-dia` é o projeto ativo e deve permanecer intacto. As notas históricas abaixo foram copiadas do original e não descrevem o Git nem o ambiente desta cópia.
- Cópia com Git local na branch `visual-isolado`, sem remoto e sem commits; arquivos salvos no disco. Não publicar, fazer push, merge ou alterar produção. `ORIGEM-COPIA.json` registra a origem e hashes; última comparação registrou zero alterações nos 330 arquivos originais.
- Ambiente de visitante isolado, Supabase bloqueado no Vite, sem credenciais. Desenvolvimento em `http://127.0.0.1:5180`, preview em 4180. Se o servidor não estiver disponível, executar `npm.cmd run dev` nesta pasta. Não interferir na porta do original. Usar apenas dados fictícios.
- Visual React aplicado: cabeçalho e navegação fixos, temas persistidos, configurações agrupadas, cinco fichas por página, ações fixas do treino e indicador de exercício concluído. Cálculos, repositórios e renderizadores dos cards exportáveis preservados.
- Refinos pedidos: cabeçalhos de painéis menores; respiro entre abas e rodas; controles de séries/descanso compactos; progresso em uma linha; ações abaixo das séries reorganizadas; colunas numéricas arredondadas com fundo suave.
- Última entrega: correção abrangente do contraste claro. `src/estilos/paleta-clara.css` cobre cores fixas legadas e é gerada por `node revisao/gerar-paleta-clara.cjs`. Complementos em `contraste-claro.css`; controles compartilhados em `controles.css`. Ao alterar cores legadas, regenerar e validar. Tema escuro e imagens exportadas não foram redesenhados.
- Verificação mais recente: lint e build (inclui tipos) passaram; `node revisao/auditar-contraste.cjs` passou com 20 estados e zero falhas textuais nas amostras; `node revisao/homologar-novo-visual.cjs` passou em 360/390/430 px. Última suíte completa anterior aos refinamentos somente CSS: 265 testes em 43 arquivos. Não afirmar que a suíte completa foi repetida após a última mudança de contraste.
- Evidências e limites: `revisao/CONTRASTE-CLARO.md`, `revisao/contraste-claro.json`, `revisao/NOVO-VISUAL-REACT.md`, `revisao/capturas-novo-visual/`. A auditoria de contraste não certifica todos os estados nem aparelho físico.
- Amanhã: começar pela revisão visual do usuário no modo claro e escuro; corrigir achados concretos e então continuar a matriz `revisao/PARIDADE-APP-PROTOTIPO.md`. Água por tamanho de garrafa, vídeos por exercício e demais diferenças funcionais ainda pendentes; não prometer paridade completa. Testar aparelho físico, teclado, gestos, PWA e compartilhamento nativo em etapa própria. Não habilitar conta/sincronização real nesta cópia automaticamente.

## Histórico copiado do projeto original — 22/10/2026

Estado mais recente, prevalece sobre notas históricas abaixo:

- Complemento para amanhã: main continua sem promoção até concluir os testes de navegador. Para investigar 5173, executar `netstat -ano | findstr :5173`, identificar o processo e só então decidir seu encerramento; não reutilizar PIDs históricos nem executar comandos colados. Após liberar o arquivo, tentar `npm ci` antes de considerar apagar node_modules. Não usar --force/--legacy-peer-deps, apagar lockfile ou excluir o projeto da varredura do antivírus sem diagnóstico.
- Preview: usar navegador autenticado na Vercel com armazenamento de teste isolado. Registrar texto exato das violações Report-Only e os headers da resposta do documento do APP. Em 401/403 de manifest/sw.js, conferir URL, resposta e redirecionamento antes de atribuir à Deployment Protection; não assumir que são inofensivos ou erros do app. Fluxos remotos dependem de confirmar/aplicar as configurações de staging mediante autorização própria.
- Visibilidade: a API do GitHub retornou `private: false` para o repositório durante esta sessão. Reconfirmar amanhã e decidir com o usuário se deve ficar privado: revisao/ e o histórico estão acessíveis publicamente. Não alterar visibilidade automaticamente. Remover documentos em um novo commit não os remove do histórico. Não foi constatado segredo apenas por haver documentação pública.
- Nota anterior de retomada salva no commit local `98490ef`, sem push. CI e Preview citados abaixo correspondem a `6faed6a`, não aos commits posteriores de documentação.
- Branch `test`, commit `6faed6a`, enviado a origin/test com autorização. Main não foi alterada. Árvore estava limpa antes desta nota.
- Preparação de produção entregue: `20e3008` (runtime exige EXPECTED_PROJECT_REF, falha fechada) e `6faed6a` (runbook, SQL de leitura e checklist). Ver `revisao/RUNBOOK-PRODUCAO.md` e `revisao/CHECKLIST-PRODUCAO.md`. Nenhuma migração ou Edge Function aplicada remotamente.
- CI Ubuntu aprovado no commit enviado: instalação `npm ci --ignore-scripts`, audit com zero vulnerabilidades, tipos, lint, 261 testes em 42 arquivos e build. Evidência: https://github.com/breno-camargo/vida-em-dia/actions/runs/39719455179
- Preview publicado: https://vida-em-9babr9lwm-breno-camargos-projects.vercel.app . Perfil limpo redireciona ao login da Vercel; não foi possível carregar o app para teste funcional. Console/headers observados eram da página de login, não do app.
- Local: Node v24.18.0 / npm 11.16.0. `npm ci` falha também fora do sandbox com EPERM/unlink em `node_modules/@rolldown/binding-win32-x64-msvc/rolldown-binding.win32-x64-msvc.node`. Instalação interrompida deixou tsc/vite indisponíveis. Nenhuma tentativa de correção, remoção de node_modules ou alteração do lockfile.
- Havia servidor Vite preexistente na porta 5173, possível responsável pelo bloqueio; foi preservado. PIDs históricos 1080/6344: reconferir antes de agir. Navegadores headless criados para o teste foram encerrados.
- Próximo passo: abrir Preview autenticado na Vercel, em armazenamento de teste isolado. Conferir console e headers reais; visitante vazio (sem registros pessoais) com aviso de visibilidade; criar registro/recarregar; backup criptografado ida e volta excluindo removidos por padrão; perfil separado com legado fictício, sem importação automática. Esses fluxos permanecem NÃO TESTADOS no navegador.
- Não promover à main sem evidência de navegador e aprovação. Não desativar proteção do Preview, usar credenciais, aplicar SQL, fazer deploy de funções ou configurar produção implicitamente. Produção Supabase ainda depende do runbook e homologação A/B/anônimo; estado remoto deve ser reconfirmado.

# APP-01 implementado localmente — 21/10/2026

Ver revisao/APP-01-ISOLAMENTO.md. Bancos separados por UUID/visitante, fila incorporada por identidade, bootstrap local/offline, troca com fechamento e aviso entre abas, filtro no repositório e importação legada explícita filtrada. Legado real preservado; nada importado automaticamente. Backup JSON força proprietário da identidade atual. Visitante não migra para conta.

Verificação final: tipos, lint, 229 testes em 36 arquivos e build passaram; reprodução A → B → visitante → A retornou somente o proprietário de cada espaço, inclusive com registro estranho injetado. Sem merge/push/deploy. Homologação visual e troca em duas janelas do navegador real ainda pendentes; testes automatizados usam Dexie/fake-indexeddb e BroadcastChannel real em Node. Não confundir com garantia contra acesso via DevTools do próprio perfil. Somente APP-01 aplicado nesta sequência, sem correções dos outros achados.

---

# Retomada prioritária — encerramento em 19/10/2026

Usuário pediu parar por hoje, registrar pendências e commitar. Não continuar implementação até a retomada. Branch test; sem push, merge, deploy ou SQL remoto. Commits por mudança continuam sendo preferência explícita.

## Primeira tarefa: isolamento completo entre contas

Exigência do usuário: nenhuma conta pode ver nada de outra, incluindo fichas, treinos, fotos, medidas, alimentação e configurações. A proteção 46c7c33 é PARCIAL: impede montar telas locais para usuário autenticado sem vínculo, mas NÃO separa bancos por usuário. O IndexedDB e a fila ainda são por origem/perfil. Modo visitante continua acessando a base local do aparelho. Não declarar isolamento completo resolvido.

Planejar e implementar armazenamento por usuário e visitante separado, com isolamento da fila/controle/recibos/conflitos/fotos, troca segura de sessão e abas, desmontagem de telas/rascunhos/consultas e inicialização do catálogo/configuração em cada espaço. Preservar base legada, identificar proprietário comprovado e não atribuir dados ambíguos automaticamente. Testar A → B → visitante → A, offline/reconexão, leitura e escrita, sync, backup/restauração e fotos. Não acessar ou alterar dados reais para teste.

Esposa já usou uma conta no mesmo navegador e viu fichas. Não foi confirmado se houve mesclagem/envio para a conta dela: investigar sem apagar registros remotamente. Até isolamento completo, usar outro perfil de navegador/aparelho. Principal reservada breno.hsc75@gmail.com; conta de teste breteco@gmail.com. Nenhuma limpeza da principal autorizada.

## Outras pendências

- Duplicatas: usuário solicitou deixar uma de cada na conta de teste. Não executado por Codex (navegador indisponível). Dois grupos persistiam: Elíptico e Elevação de pernas. Lote agora mostra motivos de bloqueio; falta evidência da mensagem real. Não presumir causa. Sem alias durável, alterações antigas vindas de outro aparelho podem reintroduzir referências; homologação de união/sync pendente.
- Catálogo inicial: IDs estáveis para instalações novas (ba75606); cadastros legados preservados. União explícita e em lote disponível.
- Cardio: detalhes por modalidade (f7da915), bike sem passos, cadência/potência e piscina opcionais; conferir visual, edição, exportação/importação e sync reais.
- Confirmações nativas substituídas por Painel/useConfirmacao (769e242); conferir foco, Escape, cancelamento e painéis sobrepostos no aparelho.
- A03/A04/A05/A07/A09/A10 têm correções locais, mas testes reais de sincronização entre aparelhos/abas, isolamento, cards/clipboard Instagram, recuperação/SMTP e som após bloquear iPhone continuam pendentes. Etapa 8 não aprovada.

## Cuidado com arquivos abertos no editor

No encerramento, backup.ts e backup.test.ts tinham voltado à versão anterior ao A05. Restaurados a partir do HEAD validado, preservando cópias temporárias fora do repositório. Se editor continuar com conteúdo antigo, usar File: Revert File/reabrir, sem Overwrite. Não commitar regressão que usa ultima_sincronizacao no prazo do backup.

Validação geral anterior: 222 testes. Após proteção parcial de conta: 20 testes direcionados, lint/build passaram. No encerramento, revalidar os testes de backup restaurados. Notas históricas abaixo não substituem esta seção.

---

Atualização de 19/10/2026: revisão explícita de cópias equivalentes disponível em Treino → Exercícios → Revisar duplicatas. Fotos/histórico remapeados em transação; colisões na mesma ficha/sessão bloqueadas. Homologação entre aparelhos pendente; ver revisao/CODEX-DUPLICATAS.md. Validação: 218 testes passaram, lint/build passaram.

Atualização A10 em 18/10/2026: abertura usa estado neutro durante recuperação da sessão, sem apresentação prematura de login. Regressão estática passou; abertura fria no iPhone pendente. Ver revisao/CODEX-A10.md. Supera a pendência histórica A10 abaixo.

Atualização A09 em 18/10/2026: primeira sessão não marca recordes; histórico válido anterior passa a ser obrigatório. Ver revisao/CODEX-A09.md. Flags antigas não foram reescritas. Esta nota supera a pendência histórica A09 abaixo.

Atualização de 18/10/2026: A03 corrigido (treino livre para ficha; limite de planejamento explicado, sessão preservada). A05 entregue pelo Gemini e revisado pelo Codex: sync não reinicia lembrete de backup. Ver revisao/CODEX-A03.md e revisao/CODEX-A05.md. Validação atual: 213 testes em 29 arquivos, lint/build passaram. Etapa 8 continua em homologação; sem push/deploy. Notas históricas abaixo não substituem este estado.

> Padrão visual definido em 18/10/2026: ler PADROES-INTERFACE.md e reutilizar src/estilos/controles.css (importado após index.css). Botões equivalentes e abas/alternadores compartilham aparência. AGENTS.md atualizado para Codex e Gemini. Lint/build passaram; visual mobile pendente.

> Atualização de precisão em 18/10/2026: cardio usa duração min/seg, distância km/metros com rodas de dígitos; voltar para Rolar vazio permitido. Medidas corporais agora usam peso com gramas (3 casas) e cm com 1 casa, inclusive histórico/comparação/gráfico. Ver revisao/CORRECOES.md. Última validação: 156 testes, lint e build. Interação no celular pendente; notas anteriores de precisão foram superadas.

> Seletores de cardio entregues pelo Gemini em 18/10/2026 e aprovados com correções do Codex. Ver revisao/CODEX-SELETORES-CARDIO.md. Os avisos anteriores de tarefa aguardando entrega estão superados. Tela Cardio também recebeu as simplificações pedidas. 146 testes, lint e build passaram; digitar/rolar/saltos/Enter precisam de conferência real no celular. O relatório Gemini exagerou a cobertura de interação: testes são estáticos, sem JSDOM.

> Solicitação de 18/10/2026: melhorar todos os seletores de cardio (ex.: chegar a 120 bpm sem longa rolagem). Tarefa delimitada para Gemini em revisao/TAREFA-GEMINI-SELETORES-CARDIO.md, aguardando encaminhamento/entrega; não declarar implementação iniciada. Codex revisará antes de aceitar. Manter rolagem, acrescentar digitação opcional/atalhos e confirmação explícita, sem alterar outros consumidores involuntariamente.

> Atualização em 18/10/2026: entrega Gemini A07 revisada e aprovada pelo Codex. 123 testes, lint e build passaram; 31 testes direcionados passaram após reforço de um cenário. Ver revisao/CODEX-A07.md. O servidor local foi iniciado nesta retomada em http://localhost:5173/; conferir disponibilidade antes de reutilizar. Demais pendências abaixo continuam válidas.

# Retomada atual — encerramento da sessão em 17/10/2026

**Ler esta seção antes das notas históricas abaixo.** O usuário pediu para salvar tudo e parar por hoje. As mudanças estão gravadas nos arquivos locais; não houve commit, push, merge, deploy ou SQL remoto. A mudança preexistente de `.gitignore` continua preservada. Não ler `.env.local` nem credenciais. Etapa 8 segue em homologação, sem aprovação ou liberação da v0.8.0.

## Primeiro assunto na próxima sessão

Validar com o usuário os **novos cards pós-treino**, último pedido implementado e ainda sem retorno visual. Abrir Ver card: modelos Completo, Foto inteira, Minimalista e Adesivo transparente; testar foto, troca de modelo, texto claro/escuro, Copiar imagem/adesivo, Copiar texto, Baixar PNG e compartilhar. O adesivo é PNG 1080×820 sem fundo; demais modelos 1080×1920. O xadrez existe só na prévia. Verificar no celular se o editor de stories aceita colar a imagem e mantém transparência; oferecer arquivo PNG quando não aceitar. Não afirmar compatibilidade garantida com Instagram/Strava. Canvas/clipboard nativos não foram homologados; testes de canvas são simulados.

Troca de foto/modelo/cor invalida a imagem anterior e desabilita exportação até o resultado correto ficar pronto. Corrige a implementação de A08; ainda vale acrescentar teste de interação/concorrência da interface para mudanças rápidas e falha de geração. As fotos ficam só na memória do card.

## Trabalho salvo nesta sessão e continuidade de 16/10

- Auditorias Codex e Gemini concluídas e consolidadas em `revisao/CONSOLIDADO.md`; detalhes das mudanças posteriores em `revisao/CORRECOES.md` (entradas mais novas primeiro). O consolidado descreve o estado histórico da auditoria, não o status atualizado de todas as correções.
- A01/A02/A06 implementados com regressões: restauração local pausa sync, exclusão mútua de sync/importação/vínculo, revisão de colisões por data e proteção do primeiro vínculo. Usuário relatou que o conflito funcionou; isso não equivale a homologação completa em dois aparelhos.
- UI da conta/backup/conflitos refinada: pop-up de aviso, depois comparação, conclusão com espera animada; removido cartão inline redundante; backup com opções de download/compartilhamento e Concluído visível.
- Atividade diária: separar registrar outro dia de corrigir data. Registrar 15/10 não deve mover/apagar 16/10. Correção de data de um registro exige confirmação, preserva valores e rejeita destino ocupado. Há testes. A primeira implementação nossa moveu o registro indevidamente; foi corrigida, mas nenhum dado real anterior foi recuperado/reconstruído. Se necessário, usuário confere Histórico e backup; não inventar valores nem sobrescrever sua base.
- Descanso fecha sozinho ao zerar, com som/vibração quando disponíveis; não conclui a próxima série. Conferir som e retorno após bloquear o celular.
- Cancelar treino e Cancelar atual e iniciar outro usam exclusão lógica, incluindo séries, itens e cardio vinculado; não finalizam o cancelado no histórico. A troca é atômica se nova ficha falhar. Cancelar pede confirmação. Finalizar atual e iniciar outro permanece separado. Registros antigos não foram removidos automaticamente.
- Treino em andamento e entrada da aba Treino reorganizados: progresso real, data, ficha ativa com Continuar treino, retomada de treino livre, instruções/descanso compactos. Último treino virou atalho de uma linha para Ver card.
- Nome da ficha passa a ter primeira letra maiúscula ao salvar; nomes antigos aparecem normalizados nos painéis de sessão/resumo. Não houve migração dos títulos históricos. Treino captura título próprio, por isso editar ficha não renomeia retroativamente a sessão inteira.
- Biblioteca: lista inspirada nas capturas fornecidas pelo usuário, miniaturas próprias/ícones, busca por termos/grupo/equipamento, Todos/Por músculo/Cardio, seleção múltipla numerada respeitando ordem dos toques. Carrega 40 opções por vez; busca considera todas. Filtros musculares **devem rolar para o lado**: usuário gosta disso, pediu apenas mais espaço entre botões e scrollbar (18 px abaixo).
- Catálogo opcional com 421 nomes/variações adaptados das capturas. Para importar no aparelho: Treino → Exercícios → Ampliar catálogo. Ver 64 antes de importar é esperado. Não prometer reprodução exata dos 454 do outro app. Importação preserva edições/exclusões e usa IDs estáveis. Fotos/animações **continuam na etapa 14**, conforme decisão explícita do usuário; não antecipar.
- Duplicatas: biblioteca inicial tem IDs aleatórios por aparelho e mesclagem por ID pode duplicar nomes. Foi implementada **apenas uma projeção de cadastros equivalentes nas listas**, incluindo exclusão das cópias ao adicionar a ficha. Registros, fotos e referências não foram fundidos/apagados. Diferenças de notas/configurações continuam separadas. Origem exata das duplicatas reais não foi inspecionada. Histórico entre IDs ainda não está consolidado.
- Medidas: abas Resumo/Evolução/Histórico abaixo do peso; pares direito/esquerdo agrupados no resumo e formulário; unidades kg/cm; datas individuais preservadas quando diferentes, uma data comum quando iguais; ausências continuam como traço. Histórico mantém edição/remover/desfazer e comparação com cor neutra. Campos continuam opcionais, com rolagem e confirmação; só Salvar persiste o rascunho.
- Desfazer temporário expira em 10 segundos em histórico, medidas, cardio, fichas/exercícios, remoções no treino e foto da ajuda. Só some a ação da UI, sem exclusão física. Desfazer conclusão de série mantém comportamento próprio. Falta conferência de tempo no aparelho.
- Evolução: horário distingue sessões do mesmo dia; cards/métricas compactados; sessões menores que 60 s mostram Menos de 1 min, não 0 min; sem duração válida, Duração não informada. Não foram alteradas regras de recorde nesta melhoria.

## Pendências técnicas conhecidas

1. **A04 corrigido localmente em 18/10/2026:** validação de domínio/referências antes da importação, C05 convertido em regressão e 21 testes novos. 187 testes completos, lint/build passaram. Legado, tombstones e fotos preservados; não repetir teste manual geral já feito pelo usuário. Detalhes em revisao/CORRECOES.md.
2. **A05:** lembrete de backup pode ser suprimido por sync, mas fotos ainda não são sincronizadas.
3. **A03:** Salvar treino livre como ficha ainda pode falhar para cardio/limites de séries. Na seleção múltipla do editor, foi mantido planejamento interno de 3 séries para cumprir a validação existente; isso não corrige o fluxo independente Salvar como ficha do treino livre.
4. **A09:** flag persistida de recorde pode divergir do histórico recalculado na primeira sessão. Testes da auditoria ainda documentam o defeito; suíte verde não significa item corrigido.
5. **A07: corrigido e aprovado tecnicamente pelo Codex em 18/10/2026.** Entrega Gemini usa maiorCarga para ignorar séries de pai removido, sem cascata e preservando Desfazer. Ver revisao/CODEX-A07.md. Ainda falta conferência visual da reatividade no aparelho.
6. **A10:** apresentação inicial durante recuperação da sessão ainda pode piscar; impacto em Safari/PWA não medido.
7. **Duplicatas persistidas:** decidir abordagem explícita para consolidar conteúdo/IDs, fotos e referências entre fichas, sessões e séries. Não apagar nem mesclar só pelo nome. Projeção de UI não resolve estatísticas divididas por IDs, diferenças de fotos ou sincronização histórica.
8. Catálogo ampliado: revisar nomes/aliases e adequação dos modos de registro para mobilidade/funcional. Modelo atual continua baseado em séries/reps; não foi criado registro por duração para esses exercícios. As capturas/OCR são referência, não catálogo certificado ou instrução técnica. OCR em `revisao/REFERENCIAS-EXERCICIOS-OCR.json`.

## Homologação que falta

- Novos cards e transparência/clipboard/compartilhamento no aparelho, inclusive falha/cancelamento e troca rápida de foto/modelo.
- Visual mobile das últimas telas, teclado/zoom/VoiceOver, histórico de medidas, valores parciais/datas diferentes, timer do Desfazer e fechamento automático do descanso.
- Sync manual/automático entre dois aparelhos e duas abas, edição offline/reconexão, exclusão/desfazer, sessão/sair, isolamento entre contas, conflitos e restauração pausada/retomada, usando dados de teste. Checklist de `supabase/CONFIGURAR.md`.
- H01: comparar a mesma mensagem de recuperação de senha no celular e no PC; não supor cache/template aplicado. H02: som após bloqueio/retorno no iPhone. Notas de SMTP/URLs antigas abaixo são históricas, não prova do estado remoto atual.
- Nenhum teste deve apagar/substituir dados reais. Testes executados usaram fake IndexedDB e PGlite efêmero. Nenhuma homologação completa da etapa 8 foi concedida.

## Última validação

`npm.cmd test`: **121 testes em 17 arquivos passaram**. `npm.cmd run lint` e `npm.cmd run build` também passaram. Build inclui TypeScript. A suíte inclui reproduções de auditoria de defeitos pendentes, além de regressões de correções. Não é teste E2E de celular, clipboard ou visual do PNG. Não é necessário repetir testes só para este registro documental; repetir conforme próximas mudanças.

Código e documentos permanecem no diretório de trabalho, inclusive arquivos novos não rastreados. Nada foi commitado nesta sequência de ajustes. Não confundir salvar arquivos com publicar/backup dos dados pessoais. Continuar preservando `.gitignore` e revisar o diff antes de qualquer futuro commit autorizado.

---

# Notas históricas preservadas

# Retomada — trabalho de 14/10/2026

## PRIMEIRO ASSUNTO AMANHÃ: e-mail no celular diferente do PC

Breno pediu explicitamente para salvar: o e-mail de recuperação recebido no celular ficou diferente do recebido no computador. Comparar a MESMA versão/mensagem nos dois aparelhos, confirmar aplicativo de e-mail, modo claro/escuro, largura, quebra de linhas, cores e código. Pedir as imagens correspondentes na retomada. Não concluir que seja cache, mensagem antiga ou erro do usuário sem evidência. Ajustar o HTML conforme o problema observado. Não reenviar códigos repetidamente só para conferir aparência; respeitar limites e usar Preview/arquivo de teste para as primeiras comparações.

Arquivo atual: `supabase/templates/recuperar-senha.html`. Última versão local: fundo externo claro, card verde escuro, título “Recupere seu acesso”, bloco escuro e números verdes maiores. A imagem mais recente recebida pelo usuário ainda mostrava a primeira versão personalizada, com fundo externo escuro e bloco verde claro. É necessário confirmar qual HTML ficou salvo/aplicado no Supabase; não assumir que a última versão já está em envio. O template usa {{ .Token }} uma única vez; não salvar códigos reais no arquivo.

## Estado das etapas

- Etapa 7 aprovada hoje, v0.7.0 preparada e publicada pelo usuário. GitHub main em fbeba3ddf6aeb8bf959fafb4a5e0bcf102eb6ad3, tag v0.7.0 existente.
- Etapa 8 implementada, em homologação, AINDA NÃO APROVADA. Não liberar versão 0.8.0, merge em main ou produção antes da aprovação.
- Branch de trabalho: etapa-8-conta-sincronizacao. Mudanças integradas em test a cada ajuste. Deixar test para continuidade do usuário.
- Existe mudança prévia e alheia em .gitignore; foi preservada e nunca incluída nos commits.

## O que fizemos hoje

1. Conta Supabase: e-mail/senha, sessão persistente, recuperação por código dentro do app e nova senha. Sem links mágicos.
2. Login passou a aparecer na abertura. Sessão existente entra direto; Continuar sem conta mantém uso local/offline. Recuperação não fecha a tela de nova senha ao validar o código.
3. SQL em supabase/migrations/202610140001_conta_sincronizacao.sql: 17 tabelas com RLS por dono, índices, RPC com LWW e bucket privado. Usuário aplicou no projeto novo do Vida em Dia e recebeu Success, no rows returned. NÃO reaplicar esse SQL de criação no mesmo banco.
4. Conta do usuário criada manualmente em Authentication → Users. Orientado a fechar cadastro público; falta confirmar explicitamente que o switch foi salvo.
5. URL/chave pública do Supabase em .env.local ignorado pelo Git; Vercel Preview recebeu VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY. Nunca gravar senha SMTP, senha de conta ou chave secret/service_role em arquivos ou pedir no chat.
6. Sincronização: 16 tabelas de dados, fila e recibos em Dexie separado, reenvio idempotente, envio em lotes 100, leitura completa em páginas 200, soft delete, conflitos por atualizado_em. Primeiro aparelho sem registros pessoais baixa a conta sem duplicar catálogo inicial. Outro usuário não pode enviar dados vinculados à conta anterior.
7. Botão manual em Hoje/Configurações; automático opcional ao abrir, retornar ao primeiro plano, reconectar e finalizar treino. Fotos continuam no JSON com fotos; sincronização das imagens na etapa 11.
8. Entrada refinada: sem data/card pesado/títulos duplicados; campos claros, mostrar/ocultar senha, links discretos. Mensagens específicas para offline, falha de envio e limite de pedidos.
9. Cards de movimento alinhados: slots iguais, unidade kcal com espaçamento correto, números tabulares, barra de progresso estilizada Safari/Chrome e espaço reservado quando não há meta.
10. Configurações em seções recolhidas, uma aberta por vez; atalhos de Hoje abrem conta/backup diretamente. Carregamento sob demanda com cache offline.
11. Conta compacta, sem e-mail repetido e sem textos extensos. A última mudança coloca Sair da conta no FINAL da lista, fora das seções, e alinha margens/botão de conexão.
12. E-mail personalizado com identidade verde e assunto “Seu código de recuperação — Vida em Dia”; depois refinado novamente (ver prioridade acima). Alterar arquivo local ou publicar Vercel NÃO altera template do Supabase: copiar HTML completo em Authentication → Emails → Reset password → Source e salvar.

## SMTP, recuperação e limites

- Supabase exigiu SMTP próprio para editar templates; configuramos Gmail com senha de app (Google com 2 etapas). Remetente e Username precisam ser o Gmail que gerou a senha.
- Erro real identificado nos Auth Logs: 535 5.7.8 Username and Password not accepted. Resolvido pelo usuário ao gerar e salvar uma nova senha de app.
- Logs posteriores mostraram /recover 200, /verify 200, PUT /user 200 e login /token 200. Fluxo real de recuperação/login funcionou. Isso NÃO comprova homologação da sincronização dos registros.
- Depois houve over_email_send_rate_limit. Há dois controles: Emails → SMTP Settings → Minimum interval per user e Authentication → Rate Limits → e-mails por hora do projeto.
- Tela mostrou 30 e-mails/h e intervalo SMTP 60 s. Sugerimos 60 e-mails/h para testes e, por último, 30 s de intervalo; NÃO houve confirmação de que esses valores foram salvos. Não afirmar valor atual sem conferir.
- Usuário quer criar e-mail dedicado do Vida em Dia, substituindo o Gmail pessoal como remetente. Ainda NÃO confirmou criação/troca. Quando criar, trocar Sender email, Username e gerar senha de app na NOVA conta. Não alterar contas/senhas dos usuários do app por isso.
- Breno quer amigos usando o software. Combinado começar por contas criadas manualmente, mantendo cadastro público fechado e dados separados por RLS. Cada pessoa usa seu aparelho; troca de perfis no mesmo armazenamento ainda é bloqueada para proteger dados.

## Validação já feita

- 66 testes passaram, incluindo Postgres embarcado (PGlite) executando SQL/RLS entre duas contas, bloqueio anônimo e caminho privado de fotos; fila após falha, LWW, exclusões, paginação e aparelho novo.
- Últimos ajustes de interface passaram lint e build (que inclui TypeScript). Não afirmar que houve verificação visual automatizada/iPhone; usuário valida por screenshots.
- Template HTML verificado estruturalmente, um Token e tabelas equilibradas, sem scripts ou imagens externas. A diferença celular/PC é pendência real.

## Publicação e o que falta

Checagem remota em 14/10: branch da etapa no GitHub ainda em 2fe18a17be036e014a6781475b1705a2e9ebe514 e test em 68fa85ce033979bc5890fc172ff05cef2295794f. Os ajustes posteriores de conta/saída e o último refinamento de e-mail estavam só locais. Não presumir que o deploy atual já contém tudo. Publicação por CMD do usuário, pois autenticação da ferramenta não esteve disponível; evitar repetir tentativas de credenciais.

```cmd
cd /d C:\Users\breno\Documents\Codex\2026-10-05\ol\outputs\vida-em-dia
git switch test
git push origin etapa-8-conta-sincronizacao
git push origin test
npx vercel
```

Não usar --prod nesta homologação. As prévias têm proteção de login da Vercel e não foram inspecionadas por HTTP sem autenticação. Cada URL/endereço tem dados locais separados: preservar backups, não apagar dados para testar.

Depois do e-mail: aplicar/publicar últimos ajustes, homologar sincronização manual e automática entre dois aparelhos, edição offline e reconexão, exclusão/desfazer, conflitos, sessão, sair, isolamento entre duas contas. Checklist completo em supabase/CONFIGURAR.md. Só então pedir/aplicar aprovação da etapa 8. Etapa 9 (alimentação/chat IA) ainda não iniciada.
> Adesivos de stories atualizados em 18/10/2026: compartilhar abre Adesivo, com Coluna/Compacto/Destaque/Faixa, texto claro/escuro, seleção de métricas e foto apenas para prévia. Cardio tem Compartilhar adesivo no registro expandido. Ver revisao/CORRECOES.md. 161 testes completos e 6 testes direcionados posteriores passaram, lint/build passaram. Conferir composição visual e copiar PNG/colar no Instagram no iPhone; integração nativa ainda não homologada. Dimensões fixas antigas de adesivo foram substituídas por dimensões conforme layout/conteúdo.

> Direção visual aprovada em 18/10/2026 e implementada: Tipográfico (adesivo), Foto e Editorial (marfim/tipografia grande), para musculação e cardio. Seleção de métricas vale para os três. Coluna é o padrão do adesivo. Ver revisao/CORRECOES.md. Conferir aparência real, textos longos, fotos claras/escuras e colagem no Instagram; a prancha era proposta ilustrativa, não screenshot da implementação.

> Retomada após oscilação de energia — 18/10/2026: usuário pediu protótipo do Gemini para aprovar antes de integrar mais mudanças nos cards. Tarefa preparada em revisao/TAREFA-GEMINI-PROTOTIPO-CARDS.md e prancha aprovada copiada para revisao/prototipo-cards/referencia-aprovada.png. Encaminhamento ao Gemini é manual; não declarar iniciado/entregue. Gemini deve escrever somente o protótipo isolado e revisao/GEMINI-PROTOTIPO-CARDS.md, sem alterar src/. Codex revisa a entrega, usuário aprova o visual, depois integra. Decisão vigente: tempo MM:SS é destaque na musculação, distância no cardio quando disponível, repetições como apoio. Não há confirmação de servidor ainda ativo após a oscilação; verificar antes de reutilizar. Alterações anteriores permanecem nos arquivos locais; não foi feito commit/push nesta retomada.

> Protótipo entregue e revisado em 18/10/2026: ver revisao/CODEX-PROTOTIPO-CARDS.md. Não aprovado para integração: Foto/Editorial perdem segundos, prévia e PNG têm desenhos distintos, posicionamento de unidades precisa correção e foto não aparece sob adesivo. Retorno delimitado ao Gemini registrado no relatório; encaminhamento manual. Nenhum navegador conectado disponível ao Codex, então avaliação visual independente segue pendente. Não modificar src/ para integrar antes dos ajustes e aprovação.

> Integração aprovada e executada em 18/10/2026: usuário aprovou exatamente o protótipo Gemini. Renderizador de src/utilitarios/renderCardAprovado.ts extraído das funções originais, com teste de equivalência dos comandos de desenho em 48 combinações. CardCompartilhavel já usa Tipográfico/Foto/Editorial aprovados; adesivo exporta recortado transparente e prévia mostra story com fundo separado. Lint/build passaram; ver revisao/CORRECOES.md. Não houve commit/push/deploy. Conferir no app com dados reais e no iPhone, principalmente clipboard/Instagram. Notas anteriores de não integrar estão superadas por essa aprovação explícita.

> Cadastro implementado localmente em 18/10/2026 após autorização explícita: botão Criar conta na tela de acesso, senha/confirmar senha, confirmação por e-mail/código e reenvio. Não cria vínculo/sync automático. 197 testes, lint/build passaram; envio real/SMTP/confirmar cadastro ainda precisam de homologação. Template supabase/confirmar-cadastro.html e instruções em supabase/CONFIGURAR.md. Conta de testes escolhida: breteco@gmail.com; principal reservada: breno.hsc75@gmail.com. Nenhuma conta criada remotamente por ferramentas, nenhum dado da principal apagado. Testar cadastro em janela/perfil separado dos dados atuais; não pedir senha no chat. Próximas pendências técnicas A05/A03/A09/A10 permanecem.

> Perfil no cadastro acrescentado em 18/10/2026: nome obrigatório; altura e medidas opcionais, com seletores existentes. Dados corporais ficam em rascunho apenas na memória da aba, com aviso de perda ao fechar/atualizar. Após confirmar conta, conectar aparelho e salvar explicitamente, entram em configuração/Medidas da mesma conta, sem sobrescrever data existente. Sem dados corporais em metadados de autenticação. Ver revisao/CORRECOES.md. Validar no navegador/iPhone o fluxo completo de cadastro/confirmação/conexão/perfil.
