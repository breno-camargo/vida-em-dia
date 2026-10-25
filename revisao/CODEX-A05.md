# A05 — revisão Codex — 18/10/2026

Entrega Gemini aprovada tecnicamente. Lembrete usa ultimo_backup válido, com fallback para criado_em, ignorando ultima_sincronizacao. C06 convertido pelo Codex em regressão. Suíte completa: 213 testes em 29 arquivos passaram; lint e build passaram.

Precisão do relatório: a função tolera intervalo não positivo como desligado, mas a interface e a validação de importação continuam exigindo pelo menos um dia. Isso não representa uma nova opção de desligamento disponível ao usuário. Nenhum schema, dado real ou serviço remoto foi alterado. Entrega não equivale a homologação no aparelho.
