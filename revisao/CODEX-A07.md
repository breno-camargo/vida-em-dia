# Revisão Codex da entrega Gemini A07 — 18/10/2026

**Decisão: aprovada para integração local.** Não foram encontrados bloqueadores no escopo A07. Sem autorização de publicação ou aprovação da etapa 8.

## Evidência revisada

- `src/dados/treinos.ts:40`: maiorCarga faz somente leitura. Consulta os pais não removidos, constrói Set de IDs e restringe séries ao exercício solicitado, concluídas, não removidas, não aquecimento e com pai válido. Inclui sessões em andamento, preservando o comportamento anterior nesse ponto; não exige fim do treino.
- `src/telas/ModoTreino.tsx:181`: Desempenho consome a função dentro de useLiveQuery. A consulta passa por treinos e series_treino, mantendo dependência reativa das duas tabelas.
- `src/dados/historico.ts:12`: remoção/restauração continuam no pai; nenhum código de exclusão em cascata foi adicionado pela entrega. Diferenciar da ação independente Cancelar treino, implementada antes desta entrega e fora deste escopo.
- `src/dados/treinos.test.ts:240`: 80 → 40 → 80 kg ao excluir/restaurar. Outro teste cobre aquecimento, pendentes, exclusão individual e treino em andamento.
- `revisao/auditoria.test.ts:132`: C09 convertido para regressão verifica o valor de 20 kg com pai de 100 kg removido, séries filhas intactas, vínculo na nuvem simulada e retorno a 100 kg após restaurar.

## Ajuste feito durante a revisão

O teste novo citava séries pendentes no título, mas originalmente concluía ambas antes da primeira asserção. Acrescentei uma carga de 250 kg numa série pendente e uma asserção de zero após concluir apenas um aquecimento de 100 kg. Isso demonstra explicitamente que nenhum desses dois casos pode alimentar a maior carga. Não alterei a implementação funcional do Gemini.

## Verificação independente

- Suíte completa antes do reforço do teste: **123 testes em 17 arquivos passaram**.
- `npm.cmd run lint` e `npm.cmd run build`: passaram.
- Após o reforço, testes direcionados de treinos e auditoria: **31 testes passaram**.
- IndexedDB sintético e nuvem simulada/PGlite efêmero; nenhum acesso/modificação em dados reais, SQL remoto ou publicação.

A reatividade foi conferida por leitura das dependências Dexie, não por teste E2E no celular. Falta a conferência visual no aparelho de remover um treino e desfazer dentro da janela de 10 segundos. Isso não bloqueia a aprovação técnica local. A consulta ainda percorre os pais e mantém Math.max com spread como antes; não foi introduzida migração, agregação persistida ou otimização fora do escopo.
