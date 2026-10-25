# Trabalho com Codex e Gemini

- Codex coordena o projeto, resolve tarefas complexas e revisa todas as entregas do Gemini.
- Antes de continuar a etapa 8, concluir auditorias independentes do Codex e do Gemini sobre todo o trabalho existente e consolidar os resultados.
- Ler README.md, CONTINUAR-AMANHA.md e revisao/PLANO.md antes de trabalhar. Não tratar notas históricas como prova de estado remoto atual.
- Gemini recebe tarefas delimitadas. Toda entrega deve informar arquivos, comportamento, validação, riscos e pendências; só é aceita após revisão do Codex.
- Não trabalhar simultaneamente nos mesmos arquivos. Na auditoria inicial, Gemini apenas lê código e escreve revisao/GEMINI.md.
- Preservar alterações preexistentes, especialmente .gitignore. Não ler ou copiar segredos de .env.local, credenciais ou tokens.
- Não publicar, fazer push, merge em main, liberar v0.8.0 ou executar SQL remoto como parte desta auditoria. Etapa 8 segue em homologação.
- Testar banco apenas com dados sintéticos e armazenamento isolado. Não apagar nem substituir dados reais para testes.
- Relatar problemas reproduzíveis com arquivo/linha, impacto e evidência. Separar hipótese, achado confirmado e limitação de teste.
- Validar correções relevantes com testes de regressão. Comandos disponíveis: npm.cmd test, npm.cmd run lint, npm.cmd run build (inclui TypeScript).
- Duas extensões instaladas não significam delegação automática: informar explicitamente quando a tarefa ao Gemini precisa ser encaminhada pelo usuário.

- Para mudanças de interface, ler PADROES-INTERFACE.md e reutilizar src/estilos/controles.css. Não criar variantes locais de botões/abas para ações equivalentes. Preservar rolagem horizontal dos filtros musculares e confirmação explícita dos seletores.
