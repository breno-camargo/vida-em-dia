> Registro histórico da auditoria de 16/10/2026. Planejamento atual: [docs/PLANO.md](../docs/PLANO.md).

# Revisão antes de retomar a etapa 8

Solicitada em 16/10/2026. Escopo: todo o trabalho existente, não apenas sincronização.

## Fluxo

1. Codex revisa implementação e validações existentes; registra evidências em CODEX.md.
2. Gemini faz auditoria independente conforme GEMINI.md; entrega GEMINI.md nesta pasta.
3. Codex verifica cada achado do Gemini, reproduz problemas relevantes e consolida duplicatas, prioridades e divergências.
4. Codex resolve itens complexos e distribui correções delimitadas ao Gemini; revisa todas as mudanças antes de aceitar.
5. Após correções e verificações, apresentar pendências de homologação em aparelhos/serviços reais. Não considerar etapa 8 aprovada sem aprovação do usuário.

## Cobertura exigida de ambos

- Persistência Dexie, migrações, integridade e exclusão/desfazer.
- Biblioteca, fichas, séries, descanso, histórico e evolução.
- Medidas, cardio, atividade e cálculos.
- Backup JSON/CSV e recuperação de dados.
- UI mobile, acessibilidade, tratamento de erros, PWA e offline.
- Conta, recuperação, vínculo local, fila, conflitos e isolamento SQL/RLS.
- Testes e lacunas entre ambiente simulado e real.

## Encaminhamento ao Gemini

No painel do Antigravity do VS Code, com esta pasta aberta, enviar:

> Leia AGENTS.md, GEMINI.md e revisao/PLANO.md. Execute agora sua auditoria independente de todo o projeto já implementado, sem corrigir código nem continuar a etapa 8. Escreva o relatório em revisao/GEMINI.md com evidências, gravidade, arquivo/linha, reprodução e cobertura. Não leia revisao/CODEX.md antes de concluir sua análise. Codex revisará sua entrega.

Não há conexão automática Codex–Gemini configurada nesta sessão. O encaminhamento acima precisa ser feito pelo usuário; não marcar a revisão do Gemini como iniciada ou concluída sem evidência.
