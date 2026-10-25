# A03 — treino livre para ficha — 18/10/2026

Corrigido localmente. planejamentoDoTreino centraliza a transformação usada em ModoTreino: ignora itens/séries excluídos e séries de outra sessão; preserva ordem e descanso; cardio recebe planejamento interno 1, mas iniciarTreino continua sem gerar séries de força para cardio. Força usa mínimo 1 e máximo 20. Texto antes de Salvar explica o limite e que as séries da sessão original não são alteradas. Criar ficha e vincular treino agora usam a mesma transação.

Arquivos: src/dados/planejamentoTreino.ts, respectivo teste, src/telas/ModoTreino.tsx e revisao/auditoria.test.ts (C04 convertido em regressão). Nenhuma migração, exclusão de dados ou alteração remota.

Validação: 12 testes direcionados passaram, incluindo iniciar uma sessão pela ficha de cardio sem gerar séries; lint e build passaram. Na execução completa, os outros 195 testes passaram; C04 falhou por um argumento incorreto no próprio teste, corrigido e reexecutado com sucesso na suíte direcionada. Conferência de cliques no aparelho pendente. Etapa 8 não aprovada/publicada.

A05 separado para encaminhamento manual ao Gemini em revisao/TAREFA-GEMINI-A05.md. Nenhuma execução do Gemini iniciada automaticamente.
