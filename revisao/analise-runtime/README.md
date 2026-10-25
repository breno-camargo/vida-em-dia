# Evidências da Fase 1

Somente perfis descartáveis e dados fictícios. Nenhum arquivo de `src/` foi modificado.

- `resultados.json`: tokens computados no html, amostras dos componentes, estados de Salvar, geometria da barra e correspondência de seletores CSSOM. O mapa CSSOM registra presença, não vencedor da cascata nem cobertura universal.
- `percurso/*.json`: repetição do percurso do baseline, sem regravar screenshots, com composição de `color(srgb ...)` corrigida. O JSON inicial do baseline não é a fonte de contraste para essas superfícies. Os links PNG desse percurso apontam para as imagens imutáveis da Fase 0.
- `contrastes-texto.json`: 303 combinações distintas com texto real. Não conta nomes acessíveis de inputs invisíveis como texto pintado.
- `contrastes-bordas.json`: 67 combinações de bordas de controles. Transparência e borda decorativa exigem interpretação; não é uma lista automática de falhas WCAG.
- `alvos-toque.json`: dimensões brutas abaixo de 44×44; conferir labels acionáveis e alternativas.
- `*-fonte-200-aproximacao.png`: duplicação temporária de cada font-size computado no perfil descartável. **Não equivale ao zoom nativo do Safari.**
- `integridade.json`: comparação SHA-256 de todos os arquivos de `src/` da cópia e do original contra o início da Fase 0; inclui testes e renderizadores congelados.

## Reprodução dos inventários

Servidor da cópia em `http://127.0.0.1:5180`. Executar da raiz da cópia:

```powershell
node revisao/auditar-visual.cjs
node revisao/auditar-runtime.cjs
node revisao/auditar-percurso.cjs
node revisao/gerar-auditoria-visual.cjs
```

Esses comandos gravam apenas artefatos em `revisao/`. Não executam login, comunicação com backend ou alterações em fontes/testes. O relatório exige os inventários anteriores; o gerador agrega automaticamente as medições de texto, borda e toque do percurso corrigido.

O checksum final foi calculado antes do commit da Fase 1; os scripts de medição não recalculam automaticamente o manifesto de integridade para evitar substituir uma evidência de preservação por outra silenciosamente.
