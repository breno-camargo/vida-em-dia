# Entrega Gemini — Correção A05: Lembrete de Backup

Data: 18/10/2026  
Status: Implementado e validado localmente com testes direcionados, lint e build. Pronto para revisão do Codex.  
Escopo: Correção estrita do apontamento **A05** (C06 / GEM-04), sem alteração de banco/schema, sem sincronizar fotos e sem alterar arquivos compartilhados ou reservados (`fichas.ts`, `treinos.ts`, `ModoTreino.tsx`, `revisao/auditoria.test.ts`).

---

## 1. Problema e Causa Raiz

Anteriormente, a função `lembreteBackup` em `src/dados/backup.ts` determinava o prazo considerando o valor mais recente entre três datas:
```ts
const datas = [config.ultimo_backup, config.ultima_sincronizacao, config.criado_em]
  .map(d => Date.parse(d ?? ''))
  .filter(Number.isFinite)
return agora - Math.max(...datas) >= Math.max(1, config.dias_lembrete_backup) * 86400000
```

### Consequência do defeito (A05 / C06):
Como a sincronização com a nuvem (`ultima_sincronizacao`) é frequente (ou automática) e **não envia nem sincroniza fotos locais** (`fotos` permanecem exclusivamente no IndexedDB deste aparelho), sincronizar dados adiava indefinidamente o lembrete de backup. O usuário podia ficar meses sem fazer backup completo contendo suas fotos e sem nunca receber o aviso de proteção periódica.

---

## 2. Comportamento Implementado

Em conformidade com as diretrizes de `revisao/TAREFA-GEMINI-A05.md`:

1. **Sincronização desvinculada do lembrete**:
   `ultima_sincronizacao` foi totalmente removida da base de cálculo. Sincronizar com o servidor não equivale a gerar uma cópia segura dos dados locais com imagens e não reinicia nem posterga o prazo do lembrete.
2. **Referência por `ultimo_backup` válido ou fallback para `criado_em`**:
   - Se `config.ultimo_backup` for fornecido e representar uma data válida (`Number.isFinite(Date.parse(config.ultimo_backup))`), esse timestamp é usado como referência base.
   - Quando não houver `ultimo_backup` válido (ausente, nulo, vazio ou com texto de data corrompido/inválido), a função recai automaticamente para `config.criado_em`.
   - Se nenhuma das duas datas for válida, a função retorna `false` com segurança, sem lançar exceções.
3. **Preservação de desligamento e configuração de dias**:
   - Se `dias_lembrete_backup <= 0`, `null`, `undefined` ou `NaN`, o lembrete é considerado desligado e retorna `false`.
   - Para valores positivos, o prazo respeita exatamente `config.dias_lembrete_backup * 86400000` ms.
4. **Precisão temporal**:
   - A condição de disparo é `(tempoAgora - baseTime) >= config.dias_lembrete_backup * 86400000`, disparando exatamente no milissegundo do vencimento do prazo.
   - Suporta `agora` como timestamp numérico, objeto `Date` ou omitido (usa `Date.now()`).
5. **Preservação total de fluxos e schema**:
   - Nenhuma alteração de schema, Dexie ou migrações.
   - Fotos permanecem no escopo de backup local e fora da sincronização remota.
   - Fluxos de `exportarBackup`, `importarBackup`, `validarBackup` e `marcarBackup` intactos.

---

## 3. Arquivos Alterados e Criados

| Arquivo | Natureza | Descrição |
| :--- | :--- | :--- |
| `src/dados/backup.ts` | Alterado | `lembreteBackup` corrigida para usar `ultimo_backup` válido, fallback para `criado_em`, suporte a desligamento (`<= 0`) e desassociação de `ultima_sincronizacao`. |
| `src/dados/backup.test.ts` | Alterado | Atualizada a asserção do teste unitário existente para confirmar que `ultimo_backup` recente adia o lembrete (`false`), enquanto `ultima_sincronizacao` recente não adia o lembrete (`true`). |
| `src/dados/lembreteBackup.test.ts` | **Novo** | Suíte separada com 6 testes de regressão cobrindo exaustivamente todos os cenários solicitados. |

### Arquivos preservados intactos (sem modificação):
- `src/dados/fichas.ts`
- `src/dados/treinos.ts`
- `src/telas/ModoTreino.tsx`
- `revisao/auditoria.test.ts` (preservado para o fluxo do Codex em A03)
- `CONTINUAR-AMANHA.md`, `revisao/PLANO.md`, `revisao/CONSOLIDADO.md`

---

## 4. Testes e Validação

### 4.1. Suíte de regressão dedicada (`src/dados/lembreteBackup.test.ts`)
Foram implementados testes cobrindo os 5 cenários obrigatórios e o desligamento:
1. **Sync recente com backup antigo**: backup de 30 dias atrás e sync de 1 hora atrás com prazo de 14 dias -> emite lembrete (`true`).
2. **Sem backup**: sem `ultimo_backup`, usa `criado_em`; dentro de 14 dias não lembra (`false`), com 14 dias lembra (`true`), e com 60 dias mesmo tendo sync recente diário continua lembrando (`true`).
3. **Backup recente**: backup recente (5 dias atrás) com criação antiga (60 dias) -> não lembra (`false`); ao atingir 14 dias após o backup -> lembra (`true`).
4. **Datas inválidas com fallback**: `ultimo_backup` corrompido recai em `criado_em` válido e calcula corretamente; datas totalmente inválidas retornam `false` com segurança.
5. **Prazo exato**: verificação no milissegundo:
   - $limite - 1\text{ ms} \rightarrow$ `false`
   - $limite\text{ exato} \rightarrow$ `true`
   - $limite + 1\text{ ms} \rightarrow$ `true`
6. **Preservação de desligamento e configuração de dias**:
   - `dias_lembrete_backup: 0` $\rightarrow$ `false` (desligado)
   - `dias_lembrete_backup: -1` $\rightarrow$ `false` (desligado)
   - `dias_lembrete_backup: 30` $\rightarrow$ respeita janela de 30 dias (29d `false`, 30d `true`)
   - `dias_lembrete_backup: 7` $\rightarrow$ respeita janela de 7 dias (6d `false`, 7d `true`)

Execução:
```powershell
npx vitest run src/dados/lembreteBackup.test.ts src/dados/backup.test.ts
```
**Resultado: 2 arquivos aprovados, 13 testes passaram (100%).**

### 4.2. Lint e Build
```powershell
npm run lint ; npm run build
```
- `eslint .`: 0 erros / 0 avisos.
- `tsc -b && vite build`: compilação TypeScript limpa, bundle Vite gerado com sucesso, PWA service worker gerado (24 entradas precache).

---

## 5. Limitações e Notas para o Codex

1. **`revisao/auditoria.test.ts` mantido intacto**:
   Conforme solicitado na tarefa (evitando conflito com o trabalho simultâneo em A03), o teste `C06` em `revisao/auditoria.test.ts:116` não foi alterado. Quando o Codex revisar e unificar a suíte, a asserção do caso C06 poderá ser convertida de reprodução para regressão:
   ```ts
   // C06 regressão: sincronização recente não suprime aviso de backup das fotos locais
   expect(lembreteBackup({ criado_em:'2026-01-01T00:00:00Z', dias_lembrete_backup:14, ultima_sincronizacao:'2026-10-15T00:00:00Z' },Date.parse('2026-10-16T00:00:00Z'))).toBe(true)
   ```
2. **Ambiente e dados**:
   - Usados exclusivamente dados sintéticos e testes em memória.
   - Nenhuma credencial ou segredo foi lido; nenhuma chamada externa, deploy ou commit/push foi realizado.
   - A etapa 8 permanece em validação/homologação e não foi aprovada nem finalizada.
