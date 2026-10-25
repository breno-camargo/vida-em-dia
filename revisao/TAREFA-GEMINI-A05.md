# Gemini — corrigir somente A05: lembrete de backup

Leia AGENTS.md, README.md, PADROES-INTERFACE.md e revisao/CODEX.md (A05/C06). Codex trabalha em A03; não altere fichas.ts, treinos.ts, ModoTreino.tsx ou revisao/auditoria.test.ts.

Corrija lembreteBackup em src/dados/backup.ts: sincronização não equivale a backup com fotos e não deve reiniciar o prazo. Use ultimo_backup válido, ou criado_em quando não houver backup válido. Preserve desligamento/configuração de dias e os fluxos de exportação/restauração. Não sincronizar fotos nem mudar banco/schema. Adicione regressões em arquivo de testes separado: sync recente com backup antigo; sem backup; backup recente; datas inválidas com fallback; prazo exato.

Valide testes direcionados, lint e build. Use apenas dados sintéticos. Não leia segredos, não altere nuvem, não faça commit/push/deploy. Não modifique documentos compartilhados de retomada durante o trabalho do Codex.

Entregue revisao/GEMINI-A05.md com arquivos, comportamento, resultados e limitações. A entrega depende de revisão do Codex. Não declare homologação real ou etapa 8 aprovada.
