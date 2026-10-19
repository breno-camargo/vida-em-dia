# Correção A07 — Consulta de maior carga em ModoTreino

Data: 18/10/2026  
Status: Implementado e validado localmente  
Escopo: Correção estrita do apontamento **A07** (GEM-02), preservando Desfazer e sem exclusão em cascata.

---

## 1. Descrição do Problema e Causa Raiz

No painel de cada exercício no treino em andamento (`src/telas/ModoTreino.tsx`, componente `Desempenho`), o texto *"Maior carga já registrada"* exibia o valor máximo encontrado em `series_treino` para o exercício.

A consulta anterior fazia:
```tsx
const todas = await tabela('series_treino')
  .where('exercicio_id')
  .equals(exercicioId)
  .filter(s => Boolean(s.concluida_em) && !s.apagado_em && s.tipo !== 'aquecimento')
  .toArray()
return { ultimas, melhor: Math.max(0, ...todas.map(s => s.peso_total)) }
```

A remoção de um treino no histórico (`removerTreino` em `src/dados/historico.ts`) realiza exclusão lógica apenas na tabela `treinos` (`apagado_em = agora`). As séries filhas em `series_treino` permanecem com `apagado_em = null`, exatamente para que a ação de "Desfazer" (`restaurarTreino`) consiga reativar a sessão completa sem perda de dados ou necessidade de rastreador de estado em cascata.

Como a consulta do `Desempenho` não conferia o estado do treino pai (`treino.apagado_em`), as séries de treinos apagados continuavam entrando no cálculo da maior carga, divergindo do restante do aplicativo (como `sessoesExercicio` e `EvolucaoExercicio.tsx`).

---

## 2. Decisão Arquitetural e Implementação

Conforme acordado na consolidação técnica (`revisao/CONSOLIDADO.md`, item 1 de Divergências de correção resolvidas):
- **Não aplicar exclusão em cascata:** as séries preservam seu vínculo e `apagado_em = null`.
- **Filtrar a consulta pelo estado do treino pai:** a busca de séries válidas considera apenas treinos cujo `apagado_em` seja nulo/falso.

### Detalhes da alteração:

1. **`src/dados/treinos.ts`**:
   Adicionada e exportada a função `maiorCarga(exercicio_id)`:
   ```ts
   export async function maiorCarga(exercicio_id: string) {
     const treinos = await tabela('treinos').filter(t => !t.apagado_em).toArray()
     const treinosAtivos = new Set(treinos.map(t => t.id))
     const todas = await tabela('series_treino')
       .where('exercicio_id')
       .equals(exercicio_id)
       .filter(s => Boolean(s.concluida_em) && !s.apagado_em && s.tipo !== 'aquecimento' && treinosAtivos.has(s.treino_id))
       .toArray()
     return Math.max(0, ...todas.map(s => s.peso_total))
   }
   ```
   - O `Set` garante checagem $O(1)$ por série.
   - Desconsidera treinos excluídos logicamente (`t.apagado_em`).
   - Mantém suporte tanto para treinos finalizados anteriores quanto para treinos ativos em andamento (`!t.apagado_em`).
   - Mantém as regras de negócio existentes: ignora aquecimentos (`s.tipo !== 'aquecimento'`), séries não concluídas (`Boolean(s.concluida_em)`) e séries apagadas individualmente (`!s.apagado_em`).

2. **`src/telas/ModoTreino.tsx`**:
   O componente `Desempenho` agora utiliza `maiorCarga`:
   ```tsx
   function Desempenho({ exercicioId, semPeso }: { exercicioId: string; semPeso: boolean }) {
     const dados = useLiveQuery(async () => {
       const ultimas = await ultimasSeries(exercicioId)
       const melhor = await maiorCarga(exercicioId)
       return { ultimas, melhor }
     }, [exercicioId])
     return <div className="ultimo-desempenho">...</div>
   }
   ```
   - Como `maiorCarga` e `ultimasSeries` consultam `treinos` e `series_treino` sob o contexto de `useLiveQuery`, a reatividade do Dexie monitora ambas as tabelas.

3. **Preservação integral do Desfazer**:
   - Quando o usuário clica em "Desfazer" após remover um treino, `restaurarTreino(id)` redefine `treinos.apagado_em = null`.
   - Automaticamente, o ID do treino volta ao conjunto de treinos ativos na consulta reativa e suas séries reaparecem no cálculo da maior carga registrada, sem necessidade de lógica adicional.

---

## 3. Arquivos Alterados

| Arquivo | Modificação |
| --- | --- |
| `src/dados/treinos.ts` | Criação e exportação de `maiorCarga(exercicio_id)` filtrando por treinos ativos. |
| `src/telas/ModoTreino.tsx` | Importação e consumo de `maiorCarga` no hook `useLiveQuery` de `Desempenho`. |
| `src/dados/treinos.test.ts` | Adicionados 2 testes de unidade/regressão para `maiorCarga`, remoção e Desfazer. |
| `revisao/auditoria.test.ts` | Atualizado teste `C09` de reprodução de defeito para teste de regressão do comportamento esperado. |

---

## 4. Testes e Validação

Foram executados com sucesso os seguintes comandos na base local:

1. **`npm.cmd test`**:
   - **123 testes passaram em 17 arquivos** (de 121 anteriores; +2 testes de regressão adicionados).
   - Teste `src/dados/treinos.test.ts`:
     - `consulta de maior carga ignora séries de treinos removidos e restaura no desfazer (A07)`: cria treino 1 com 80 kg e treino 2 com 40 kg; remove treino 1 -> consulta resulta em 40 kg; restaura treino 1 -> consulta resulta em 80 kg.
     - `maior carga desconsidera aquecimento, séries pendentes e séries apagadas`: série aquecimento com 100 kg ignorada; série normal de 60 kg considerada; série normal apagada resulta em 0 kg.
   - Teste `revisao/auditoria.test.ts` (caso C09):
     - Confirma que `await maiorCarga(ex.id)` retorna 20 kg após a exclusão do treino de 100 kg, e retorna 100 kg após `restaurarTreino`.
2. **`npm.cmd run lint`**:
   - Execução do ESLint sem erros nem alertas.
3. **`npm.cmd run build`**:
   - Compilação TypeScript (`tsc -b`) e bundling Vite concluídos sem falhas.

---

## 5. Limitações e Pendências

- **Escopo restrito a A07**: nenhum outro item pendente (A03, A04, A05, A08, A09, A10, H01, H02) foi alterado.
- **Ambiente de testes**: validação executada via suite automatizada com Fake-IndexedDB e PGlite; homologação em tela física mobile durante treino real permanece dependente de conferência visual do usuário.
- **Cascata intencionalmente não aplicada**: registros em `series_treino` permanecem íntegros no banco IndexedDB e Supabase (tombstone apenas no pai `treinos`), respeitando a diretriz de segurança de dados e capacidade de restauração.
- **Controle de versão**: nenhum commit, push, tag ou deploy foi realizado. As alterações preexistentes em `.gitignore` continuam intocadas.
