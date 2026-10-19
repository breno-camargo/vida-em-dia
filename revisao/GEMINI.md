# Auditoria Independente do Projeto Vida em Dia

**Auditor:** Gemini  
**Data:** 16/10/2026  
**Status da Etapa 8:** Em homologação (NÃO APROVADA)  
**Objetivo:** Auditoria técnica independente de todo o projeto implementado (Etapas 1 a 8), sem alteração de código ou continuidade funcional.  
**Restrição observada:** `revisao/CODEX.md` não foi lido ou consultado durante toda a auditoria.

---

## 1. Escopo e Cobertura Avaliada

A auditoria cobriu 100% dos módulos do código-fonte e migrações implementadas até a etapa 8:

| Módulo / Domínio | Arquivos Auditados | Cobertura de Verificação |
| :--- | :--- | :--- |
| **1. Dados e Migrações Dexie** | `src/dados/banco.ts`, `modelos.ts`, `repositorio.ts`, `configuracoes.ts` | Versões 1 a 5 de schema, integridade de exclusão lógica, índices e tabelas. |
| **2. Treino e Fichas** | `src/dados/biblioteca.ts`, `fichas.ts`, `treinos.ts`, `pesoCorporal.ts`, `ModoTreino.tsx`, `Treino.tsx`, `Serie.tsx`, `Descanso.tsx` | Biblioteca de 64 exercícios, fichas, séries, modos de carga, timer e áudio. |
| **3. Histórico e Evolução** | `src/dados/historico.ts`, `src/utilitarios/evolucao.ts`, `Evolucao.tsx`, `cardTreino.ts`, `CardCompartilhavel.tsx` | Cálculos de 1RM, volume, estagnação, sugestão de carga, geração de card vertical. |
| **4. Medidas e Peso** | `src/dados/medidas.ts`, `src/telas/Medidas.tsx`, `EditorMedida.tsx`, `ResumoMedidas.tsx` | Registros parciais, precisão de 0,1, comparação neutra, lembrete semanal. |
| **5. Cardio e Atividade Diária** | `src/dados/cardio.ts`, `atividade.ts`, `Cardio.tsx`, `AtividadeHoje.tsx`, `ResumoCardioDia.tsx` | 8 tipos, fórmulas MET, modos soma vs manual, feriados (Computus) e metas. |
| **6. Backup e Proteção** | `src/dados/backup.ts`, `BackupConfiguracoes.tsx`, `LembreteBackup.tsx` | Envelope JSON de 17 tabelas, Blobs em base64, CSV sanitizado e lembrete. |
| **7. Interface Mobile e Acessibilidade** | `src/componentes/Rolagem.tsx`, `Painel.tsx`, `Navegacao.tsx`, `index.css`, `App.tsx` | Seletores de rolagem, modais com gesto, safe areas, ARIA e contraste. |
| **8. PWA e Offline** | `vite.config.ts`, `index.html`, `AvisosPwa.tsx`, `useTelaLigada.ts`, `useAmbiente.ts` | Service worker (Workbox), precache de 23 assets, Screen Wake Lock e NoSleep. |
| **9. Autenticação e Sincronização** | `src/sincronizacao/cliente.ts`, `estado.ts`, `motor.ts`, `transporte.ts`, `ContaConfiguracoes.tsx` | Auth Supabase, banco Dexie de fila (`vida-em-dia-sincronizacao`), LWW e conflitos. |
| **10. SQL, RLS e RPC** | `supabase/migrations/202610140001_conta_sincronizacao.sql`, `recuperar-senha.html` | 17 tabelas Postgres com RLS por dono, RPC idempotente e bucket de fotos. |
| **11. Testes Automatizados** | 10 arquivos de teste (74 testes no Vitest: PGlite + fake-indexeddb) | Execução completa com 100% de sucesso (8,36s). |

---

## 2. Sumário Executivo

O projeto apresenta uma base arquitetural sólida, destacando-se pelo princípio *local-first* rigoroso, persistência estruturada com Dexie/IndexedDB, isolamento elegante de fila e recibos em banco dedicado, e uma camada SQL robusta com RLS em todas as tabelas no Supabase.

Entretanto, esta auditoria identificou **11 apontamentos técnicos**, divididos entre defeitos confirmados, inconsistências de domínio e riscos de homologação real. Destacam-se:
1. **Defeito funcional bloqueante:** Treinos livres que possuem exercícios de cardio não conseguem ser salvos como ficha ("Salvar como ficha") devido a uma validação de séries mínimas incompatível com cardio.
2. **Defeito de integridade em exclusão:** Exclusão lógica de treinos (`removerTreino`) não propaga soft-delete às séries correspondentes em `series_treino`, gerando métricas históricas zumbis em `ModoTreino` e envio de registros órfãos ao Supabase.
3. **Descompasso de estado entre bancos na restauração:** Restaurar backup em modo "Substituir tudo" não limpa o banco de fila (`filaBanco`), fazendo com que alterações descartadas localmente continuem sendo enviadas à nuvem.
4. **Falso alívio de backup:** Lembrete de backup é suprimido pela sincronização na nuvem, deixando fotos locais desprotegidas contra perda física do aparelho.
5. **Divergência de regra de recordes:** Primeira sessão de um exercício grava indevidamente `recorde: true` na segunda série no banco, mas a interface não dispara o card de conquista.

---

## 3. Relatório Detalhado de Problemas e Achados

### [GEM-01] Treino livre com cardio falha ao ser salvo como ficha permanente
* **Gravidade:** Alta
* **Arquivo e Linha:** `src/telas/ModoTreino.tsx:167-171` e `src/dados/fichas.ts:8`
* **Cenário Reproduzível:**
  1. Inicie um treino livre (`iniciarTreino()`).
  2. Adicione um exercício de cardio (ex.: "Esteira").
  3. No painel recolhível "Salvar como ficha", preencha o nome e clique em "Salvar ficha".
* **Esperado:** A ficha deve ser criada e persistida com o exercício de cardio, respeitando a regra de que fichas podem conter cardio sem criar séries de musculação.
* **Observado:** `ModoTreino.tsx` mapeia `series_planejadas: series.filter(s => s.exercicio_id === item.exercicio_id).length`. Como cardio não possui séries na tabela `series_treino`, o valor resultante é `0`. A função `salvarFicha` valida `item.series_planejadas < 1` e lança: `Error('Use 1 a 20 séries e descanso entre 0 e 1800 segundos.')`. O salvamento é rejeitado.
* **Impacto:** O usuário fica impossibilitado de reutilizar planejamentos livres que incluam cardio.
* **Correção Sugerida:** No mapeamento em `ModoTreino.tsx`, atribuir um valor padrão (ex.: `ex?.tipo === 'cardio' ? 1 : Math.max(1, contagem)`) ou ajustar a validação em `salvarFicha` para permitir `series_planejadas: 0` quando o exercício for do tipo cardio.

---

### [GEM-02] Exclusão de treino não propaga soft-delete para séries, contaminando métricas e gerando dados zumbis
* **Gravidade:** Alta
* **Arquivo e Linha:** `src/dados/historico.ts:12-15` e `src/telas/ModoTreino.tsx:181`
* **Cenário Reproduzível:**
  1. Finalize um treino onde realizou supino com 100 kg.
  2. Na aba Evolução, remova o treino do histórico ("Remover do histórico").
  3. Inicie um novo treino contendo supino e abra o card do exercício.
* **Esperado:** O treino excluído e suas séries não devem influenciar a métrica "Maior carga já registrada", nem devem permanecer como registros ativos na sincronização remota.
* **Observado:** `removerTreino` executa apenas `tabela('treinos').update(id, { apagado_em: agora })`. Os registros vinculados em `series_treino` e `treino_exercicios` permanecem com `apagado_em: null`. Em `ModoTreino.tsx:181`, o componente `Desempenho` consulta `series_treino` sem verificar se o treino pai foi apagado:
  ```ts
  const todas = await tabela('series_treino').where('exercicio_id').equals(exercicioId).filter(s => Boolean(s.concluida_em) && !s.apagado_em && s.tipo !== 'aquecimento').toArray()
  ```
  Assim, a carga de 100 kg do treino excluído continua sendo exibida como recorde histórico. Além disso, a sincronização remota envia essas séries com `apagado_em: null`, deixando-as ativas no Supabase.
* **Impacto:** Métricas históricas inconsistentes após exclusão e poluição de registros órfãos no banco de produção.
* **Correção Sugerida:** Em `removerTreino`, atualizar dentro de uma mesma transação Dexie o campo `apagado_em` em `treinos`, `treino_exercicios` e `series_treino` (e tratar a restauração simétrica em `restaurarTreino`, espelhando o padrão já adotado em `fichas.ts:apagarFicha`).

---

### [GEM-03] Modo "Substituir tudo" no backup não limpa a fila de sincronização (`filaBanco`)
* **Gravidade:** Alta
* **Arquivo e Linha:** `src/dados/backup.ts:56` e `src/sincronizacao/motor.ts:12-16`
* **Cenário Reproduzível:**
  1. Usuário cria uma ficha ou treino localmente enquanto desconectado (um item pendente é gerado em `filaBanco.pendencias`).
  2. Em seguida, o usuário restaura um backup JSON anterior no modo "Substituir tudo".
  3. O usuário clica em "Sincronizar agora".
* **Esperado:** Como o banco local foi completamente substituído pelo backup, a fila de pendências locais prévia deve ser descartada para não enviar alterações que o usuário optou por sobrescrever.
* **Observado:** `importarBackup` limpa apenas as tabelas do banco principal `banco.tables` (`vida-em-dia`). O banco secundário `filaBanco` (`vida-em-dia-sincronizacao`) mantém intactas as tabelas `pendencias` e `recibos`. Na sincronização subsequente, a pendência anterior é enviada à nuvem, restaurando remotamente registros que haviam sido apagados pela substituição do backup.
* **Impacto:** Vazamento de dados locais descartados para a nuvem após restauração de backup integral.
* **Correção Sugerida:** Ao executar `importarBackup(..., 'substituir')`, limpar explicitamente as tabelas `pendencias` e `recibos` de `filaBanco`, permitindo que `prepararFila` reconstrua a fila estritamente a partir do estado novo importado.

---

### [GEM-04] Lembrete de backup de dados é silenciado pela sincronização na nuvem, deixando fotos desprotegidas
* **Gravidade:** Média-Alta
* **Arquivo e Linha:** `src/dados/backup.ts:77-80`
* **Cenário Reproduzível:**
  1. O usuário cadastra fotos de máquinas e equipamentos.
  2. O usuário sincroniza seus dados com a nuvem regularmente via Supabase.
  3. Passam-se meses sem que o usuário exporte um arquivo JSON de backup.
* **Esperado:** O app deve lembrar o usuário de gerar um backup externo com fotos, visto que a sincronização de fotos com o Supabase está explicitamente adiada para a etapa 11 e fotos existem apenas no aparelho.
* **Observado:** A função `lembreteBackup` considera:
  ```ts
  const datas = [config.ultimo_backup, config.ultima_sincronizacao, config.criado_em].map(...)
  return agora - Math.max(...datas) >= dias * 86400000
  ```
  Como `ultima_sincronizacao` é atualizada a cada sincronização bem-sucedida, o lembrete de backup NUNCA é disparado enquanto o usuário estiver sincronizando. O usuário presume que seus dados estão 100% seguros na nuvem, mas caso o iPhone seja perdido ou Safari limpe o IndexedDB, todas as imagens anexadas serão perdidas sem recuperação.
* **Impacto:** Risco de perda irreversível de mídias/fotos do usuário sem aviso prévio.
* **Correção Sugerida:** Não usar `ultima_sincronizacao` como supressor do lembrete de backup se houver registros na tabela `fotos`, ou criar um lembrete específico de fotos enquanto a etapa 11 não for implementada.

---

### [GEM-05] Conflito de IDs distintos na mesma data trava a sincronização sem interface de mediação
* **Gravidade:** Alta
* **Arquivo e Linha:** `src/sincronizacao/transporte.ts:7`, `src/sincronizacao/motor.ts:95-97` e `supabase/migrations/202610140001_conta_sincronizacao.sql:25-28`
* **Cenário Reproduzível:**
  1. Aparelho A grava peso ou atividade para `2026-10-15` (ID `uuid-1`) e sincroniza com sucesso.
  2. Aparelho B grava peso ou atividade para `2026-10-15` offline (ID `uuid-2`).
  3. Aparelho B tenta sincronizar ao reconectar.
* **Esperado:** O usuário deve ser informado de forma assistida sobre a duplicidade de data e conseguir resolver o conflito diretamente na interface (escolhendo qual registro manter).
* **Observado:** No Postgres, o índice parcial único (ex.: `medida_data_dono`) rejeita o lote com erro `23505`. O RPC `vida_em_dia_enviar` falha em bloco e nenhuma tabela é sincronizada. Como o envio falha antes da fase de download, o Aparelho B não recebe os dados do Aparelho A, e a sincronização fica paralisada indefinidamente exibindo a mensagem: *"Há registros diferentes para a mesma data na conta. Faça backup e revise os registros antes de tentar novamente."*
* **Impacto:** Bloqueio contínuo do motor de sincronização em cenários de uso em múltiplos aparelhos.
* **Correção Sugerida:** Implementar uma rotina de diagnóstico na UI de sincronização que identifique o registro conflitante por data e ofereça ao usuário a opção de mesclar os campos, alterar a data ou descartar um dos registros.

---

### [GEM-06] Inconsistência no cálculo de recorde na 1ª sessão (Falso recorde em `concluirSerie` vs `recordesDoTreino`)
* **Gravidade:** Média
* **Arquivo e Linha:** `src/dados/treinos.ts:117-121` e `src/dados/historico.ts:18-24`
* **Cenário Reproduzível:**
  1. Inicie um exercício novo sem histórico prévio.
  2. Conclua a Série 1 com 50 kg × 10 reps (não marca recorde).
  3. Conclua a Série 2 com 60 kg × 10 reps.
* **Esperado:** Conforme `README.md:157`, a primeira sessão de um exercício estabelece a referência e não deve marcar recordes fictícios.
* **Observado:** Em `concluirSerie`, a busca inclui séries do próprio treino ativo:
  `(anteriores.some(t => t.id === s.treino_id) || s.treino_id === treino.id)`
  Ao concluir a Série 2, a Série 1 já está em `anterioresSeries`. Como 60 kg > 50 kg, a Série 2 é persistida no banco com `recorde: true`. Em contrapartida, a função `recordesDoTreino` (usada para exibir o alerta com o ícone de troféu) filtra `t.id !== treinoId`, retornando `[]`. Cria-se um estado híbrido onde a série possui a flag `recorde = true` gravada no banco, mas a tela não exibiu aviso.
* **Impacto:** Inconsistência de domínio e divergência com a especificação funcional.
* **Correção Sugerida:** Remover `|| s.treino_id === treino.id` da consulta em `concluirSerie` para avaliar recordes estritamente contra sessões finalizadas anteriores.

---

### [GEM-07] Validador de backup ignora valores negativos e integridade referencial
* **Gravidade:** Média
* **Arquivo e Linha:** `src/dados/backup.ts:35-36`
* **Cenário Reproduzível:**
  1. Alterar manualmente um arquivo JSON inserindo repetições negativas (`-5`), carga negativa (`-50 kg`) ou duração de cardio negativa (`-30 min`).
  2. Importar o arquivo em Configurações -> Backup.
* **Esperado:** O validador estrutural `validarBackup` deve rejeitar números negativos para grandezas estritamente positivas.
* **Observado:** A função `validarLinha` apenas checa `typeof r[campo] !== 'number' || !Number.isFinite(r[campo])`. Não há verificação de piso (`>= 0`). O arquivo inválido é aceito e gravado no banco, corrompendo métricas de volume e gráficos.
* **Impacto:** Vulnerabilidade de integridade do banco contra dados corrompidos ou maliciosos em importações.
* **Correção Sugerida:** Adicionar regras de limites mínimos (`v >= 0`) na validação de campos numéricos de treinos, séries, cardio e medidas.

---

### [GEM-08] Flash visual da tela de login durante recuperação de sessão no carregamento do PWA
* **Gravidade:** Baixa-Média
* **Arquivo e Linha:** `src/App.tsx:34` e `src/sincronizacao/estado.ts:9-10`
* **Cenário Reproduzível:**
  1. Com o app autenticado, feche e abra o PWA instalado no Safari/iPhone.
* **Esperado:** O app deve carregar diretamente a aba principal ou exibir um estado de splash neutro enquanto valida o token no `localStorage`.
* **Observado:** O estado inicial é `usuario: null` e `carregando: true`. A expressão em `App.tsx`:
  `const entrada = !!supabase && !conta.visitante && (!conta.usuario || conta.recuperando)`
  resulta em `true` imediatamente. A tela de login é montada exibindo o texto *"Abrindo sua sessão…"*, para logo em seguida (quando `getSession()` retorna) desmontar e exibir a aba "Hoje".
* **Impacto:** Experiência visual instável (flash of unauthenticated content) em cada abertura do app instalado.
* **Correção Sugerida:** Condicionar a exibição da tela de entrada a `!conta.carregando`. Enquanto `carregando` for verdadeiro, exibir tela de splash neutra da marca Vida em Dia.

---

### [GEM-09] Vulnerabilidade de renderização do e-mail de recuperação em clientes mobile com Dark Mode
* **Gravidade:** Média
* **Arquivo e Linha:** `supabase/templates/recuperar-senha.html:8`
* **Cenário Reproduzível:**
  1. Solicitar recuperação de senha pelo app.
  2. Visualizar o e-mail no aplicativo Gmail ou Apple Mail no iOS configurado em modo escuro.
* **Esperado:** Legibilidade preservada, com texto e código verde destacados e legíveis em qualquer tema do sistema.
* **Observado:** A tag `<body>` define `background-color:#eef2ed; color:#edf1ed;`. O texto base padrão é branco contra um fundo claro, dependendo exclusivamente dos estilos dos elementos filhos. Em clientes de e-mail mobile com conversão automática de Dark Mode (como o app do Gmail), o motor inverte o `bgcolor` das tabelas de forma não linear, podendo ocasionar quebras de contraste no card escuro interno (`#19271e`) ou corte de largura da tabela de 460px. Além disso, faltam as meta tags `<meta name="color-scheme" content="light dark">` e `<meta name="supported-color-schemes" content="light dark">`.
* **Impacto:** Dificuldade de leitura do código de verificação no aparelho principal do usuário (iPhone).
* **Correção Sugerida:** Adicionar as meta tags recomendadas para templates de e-mail responsivos, ajustar o `color` global do body para uma cor de alto contraste e aplicar regras inline de `@media (prefers-color-scheme: dark)`.

---

### [GEM-10] Bloqueio de tela no iOS suspende o `AudioContext` no descanso entre séries
* **Gravidade:** Baixa-Média
* **Arquivo e Linha:** `src/utilitarios/alerta.ts:12` e `src/componentes/Descanso.tsx:28-34`
* **Cenário Reproduzível:**
  1. Inicie o descanso de uma série no iPhone.
  2. Bloqueie a tela do aparelho pelo botão lateral antes do término.
  3. Aguarde o tempo esgotar e desbloqueie a tela.
* **Esperado:** O alarme sonoro deve tocar ao término do tempo para chamar o usuário de volta ao treino.
* **Observado:** No Safari do iOS, bloquear o aparelho coloca o `AudioContext` no estado `interrupted` ou `suspended`. Em `alerta.ts:12`, `tocarTom` verifica:
  ```ts
  if (!audio || audio.state !== 'running') return
  ```
  Ao religar a tela, `visibilitychange` detecta que o descanso zerou e chama `tocarAlerta()`, mas como o áudio está em estado suspenso, a reprodução é ignorada silenciosamente sem que um novo gesto de toque tenha ocorrido para reativar o contexto.
* **Impacto:** O alarme sonoro de descanso não toca após o bloqueio de tela no iPhone, funcionando apenas se o usuário mantiver o app aberto e com tela ligada (via Wake Lock).
* **Correção Sugerida:** Na retomada da visibilidade com descanso zerado, exibir vibração e manter o painel visual ativo até toque do usuário, aproveitando o primeiro toque na tela para retomar o áudio com `audio.resume()`.

---

### [GEM-11] Possibilidade de concorrência não transacional na função `vincular`
* **Gravidade:** Baixa
* **Arquivo e Linha:** `src/sincronizacao/motor.ts:48-53`
* **Cenário Reproduzível:**
  Duas chamadas assíncronas paralelas `Promise.allSettled([vincular(usuarioA), vincular(usuarioB)])` em um ambiente com base compartilhada.
* **Esperado:** A primeira operação vincula a conta e a segunda é rejeitada.
* **Observado:** A verificação `await vinculoLocal()` e a inserção `await controle.put()` não ocorrem em uma transação atômica do Dexie. Ambas podem ler `anterior = undefined` antes de uma delas persistir.
* **Impacto:** Praticamente nulo em operação normal (a UI não executa logins simultâneos em paralelo), mas passível de falha em testes de concorrência.
* **Correção Sugerida:** Executar a leitura e a escrita dentro de `filaBanco.transaction('rw', controle, async () => { ... })`.

---

## 4. Avaliação por Área de Arquitetura

### 4.1 Persistência Dexie, Migrações e Integridade
* **Positivo:** O versionamento do Dexie (versões 1 a 5) respeita rigorosamente a preservação de dados antigos. O uso de `crypto.randomUUID()` para IDs locais e campos de controle (`criado_em`, `atualizado_em`, `apagado_em`) é consistente em todas as 17 tabelas.
* **Atenção:** As relações no IndexedDB não contam com chaves estrangeiras nativas do motor do navegador. Por isso, a lógica de soft-delete em cascata precisa ser garantida explicitamente pelo repositório (como foi feito em `fichas.ts`, mas omitido em `historico.ts:removerTreino`).

### 4.2 Treino, Séries, Fichas e Biblioteca
* **Positivo:** Separação clara entre ficha (planejamento) e treino diário (cópia desacoplada). Cálculo de carga por lado e barra funciona perfeitamente. Séries de peso corporal não somam cargas artificiais.
* **Atenção:** A impossibilidade de salvar treino livre com cardio como ficha (Item GEM-01) é o principal defeito de uso do modo treino.

### 4.3 Histórico, Evolução e Cálculos
* **Positivo:** A fórmula de Epley (\(1RM = peso \times (1 + reps / 30)\)) é bem aplicada. Drop sets somam reduções no volume total. Gráficos do Recharts em `EvolucaoExercicio` e `GraficoCarga` utilizam lazy loading, aliviando o bundle inicial.
* **Atenção:** A detecção de recordes na primeira sessão de um exercício precisa de alinhamento de regra (Item GEM-06).

### 4.4 Medidas e Peso
* **Positivo:** Validação de 0 a 400 kg e 0 a 300 cm com precisão decimal. Campos não preenchidos não viram zero nos cálculos. Comparação com diferença neutra (sem julgamento de valor) está em total conformidade com os requisitos. Lembrete semanal com início na segunda-feira funciona conforme esperado.

### 4.5 Cardio, Atividade e Metas
* **Positivo:** Os cálculos MET usam valores padrão da literatura (Compendium of Physical Activities) e são ativados somente na ausência de calorias informadas e com peso disponível. Os dois modos (`soma` e `total_manual`) evitam duplicar calorias do relógio. Cálculo de Páscoa e Paixão de Cristo pelo algoritmo Computus implementado com precisão.

### 4.6 Backup JSON/CSV e Recuperação
* **Positivo:** O envelope JSON com schema, versão e verificação de integridade atômica protege o banco contra corrupção em importações que falham no meio. CSV escapa fórmulas (`=`, `+`, `-`, `@`, `\t`) contra CSV Injection.
* **Atenção:** A falta de limpeza do banco de sincronização na substituição de backup (Item GEM-03) e a falta de checagem de números negativos (Item GEM-07) merecem correção prioritária.

### 4.7 UI Mobile e Acessibilidade
* **Positivo:** Componente unificado `Rolagem` implementa navegação por teclado (`role="listbox"`, `aria-activedescendant`), alinhando-se à diretriz de não usar selects nativos discrepantes. Modal `Painel` implementa gesto tátil natural de arrastar para baixo para fechar (`onPointerDown/Move/Up`).

### 4.8 PWA, Offline e Service Worker
* **Positivo:** `vite-plugin-pwa` configurado com Workbox e precache de 23 assets locais (~1.167 KiB). `navigateFallback: '/index.html'` garante funcionamento offline de todas as rotas e abas.
* **Atenção:** Screen Wake Lock tem fallback para `NoSleep.js`, mas em iOS o bloqueio manual suspende o Web Audio API (Item GEM-10).

### 4.9 Autenticação, Conta e Sincronização (Etapa 8)
* **Positivo:** Sincronização *local-first*: escritas locais nunca dependem da rede. Uso de transações com LWW atômico (`excluded.atualizado_em > destino.atualizado_em`). Aparelho sem dados prévios baixa o catálogo existente sem duplicar exercícios padrão.
* **Atenção:** Conflito de IDs distintos na mesma data trava o fluxo em lote (Item GEM-05). Flash visual de login precisa ser suavizado (Item GEM-08).

### 4.10 Banco Remoto, SQL, RLS e Storage
* **Positivo:** Script `202610140001_conta_sincronizacao.sql` aplica RLS em todas as 17 tabelas com políticas exclusivas para `authenticated` e checagem de `auth.uid() = user_id`. Bucket de fotos privado (`public = false`) com políticas que restringem pastas ao UID do usuário.

---

## 5. Limitações de Teste e Lacunas entre Ambientes

Os testes automatizados cobrem com alta precisão a lógica de negócio, mas há diferenças inerentes entre a simulação local e a homologação física:

1. **IndexedDB Real vs Fake-IndexedDB:** `fake-indexeddb` executa em memória no Node.js. Não simula restrições de cota de armazenamento do iOS Safari, política de descarte por inatividade (eviction após 7 dias sem uso no Safari) nem limites de persistência do `navigator.storage.persist()`.
2. **PostgreSQL Real vs PGlite:** O teste de segurança roda no Postgres WebAssembly embarcado (PGlite). Embora valide sintaxe SQL, triggers, funções PL/pgSQL e regras de RLS, ele não reproduz latência de rede, timeouts de transação, rate limits de API REST do Supabase nem limites de envio SMTP.
3. **Hardware / Safari iOS:**
   - Comportamento de áudio em background e tela bloqueada (Web Audio API).
   - Comportamento do teclado virtual ao abrir campos em modais inferiores.
   - Gestos de swipe e barra de navegação inferior do iPhone (Home indicator).
   - Renderização de fontes do sistema e quebra de linha em telas de 360, 390 e 430 px.
4. **Entrega de E-mail:** A entrega real do código de recuperação depende da configuração SMTP no painel do Supabase e do comportamento de renderização do cliente de e-mail mobile do usuário.

---

## 6. Parecer Conclusivo e Recomendações

1. **A Etapa 8 NÃO deve ser aprovada nem integrada em `main` no estado atual.** As pendências identificadas (especialmente GEM-01, GEM-02, GEM-03, GEM-05 e GEM-08) devem ser saneadas antes de qualquer liberação de versão v0.8.0.
2. **Ordem recomendada de resolução com o Codex:**
   - **Prioridade 1:** Corrigir o impedimento de salvar treino livre com cardio como ficha (`GEM-01`).
   - **Prioridade 2:** Implementar cascade soft-delete em `removerTreino` para evitar contaminação de dados (`GEM-02`).
   - **Prioridade 3:** Limpar `filaBanco` ao executar `importarBackup('substituir')` (`GEM-03`).
   - **Prioridade 4:** Alinhar o cálculo de recordes da primeira sessão em `concluirSerie` (`GEM-06`).
   - **Prioridade 5:** Tratar o flash da tela de autenticação no carregamento inicial (`GEM-08`).
   - **Prioridade 6:** Refinar o template de e-mail `recuperar-senha.html` para dark mode e reaplicar no painel do Supabase (`GEM-09`).
3. **Homologação em aparelho físico:** Após as correções do Codex, o usuário deve conduzir o checklist de validação no iPhone físico e confirmar explicitamente o funcionamento do e-mail e da sincronização antes de marcar a etapa 8 como concluída.
