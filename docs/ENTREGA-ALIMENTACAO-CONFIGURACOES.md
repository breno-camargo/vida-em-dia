# Alimentação e configurações — 28/10/2026

Entrega autorizada pelo usuário para integrar à main por pull request.

- Editor de refeição por etapas, edição conjunta com transação e detecção de alterações concorrentes.
- Catálogo e seleção com filtros Todos / Por tipo / Meus alimentos. Cadastros anteriores sem categoria aparecem em Outros.
- Referência estimada de manutenção quando não existe meta manual; opção Sedentária com fator 1,2. Apenas repouso não gera meta de manutenção automática. Metas manuais têm prioridade.
- Configurações de água com datas independentes para garrafa e meta; perfil energético preenchido protegido contra campos ausentes de outro aparelho.
- Sincronização reutiliza a consulta quando não houve envio e consulta novamente após envio.
- Reenvio de confirmação mostra retorno após solicitação aceita; isso não comprova entrega do e-mail.

## Preservação de dados

Não há alteração de esquema, versão ou nome do IndexedDB, migração SQL, limpeza de conta ou substituição de alimentos cadastrados nesta entrega. Os novos campos são opcionais. A classificação não regrava os alimentos antigos. O histórico nutricional permanece como snapshot; atualizar um cadastro não recalcula refeições anteriores.

Testes usam somente dados sintéticos e armazenamento isolado. A conta real não foi acessada nem alterada para validação. Configurações já perdidas em todos os aparelhos e na nuvem não são reconstruídas automaticamente.

Validação local: suíte completa com 338 testes em 58 arquivos; teste adicional de reabertura/preservação passou com os 13 testes de alimentação. Tipagem, lint e build passaram. O CI do pull request deve validar a árvore final.

Sincronização entre aparelhos foi simulada com transporte em memória. Conferência em iPhone/PWA real continua como limitação de homologação.

## Próxima etapa

IA adiada por decisão do usuário: foto de rótulo e áudio, com Edge Function no Supabase e Gemini, revisão antes de salvar e limite de uso por conta. Nenhuma integração ou cobrança de IA foi ativada.
