# APP-01 — isolamento local — 21/10/2026

## Inspeção antes da implementação

Executada pelo usuário no Console do mesmo localhost/perfil, com detecção por indexedDB.databases(), abertura nativa sem versão, abort em onupgradeneeded e transações readonly. Resultado mostrado ao Codex: null e UUID 5d38a871-5678-430f-88de-4cf1ff28731b. null não prova criação em modo visitante; indica ausência de proprietário. Não foram enviados conteúdos de registros ou tokens. Nenhuma atribuição ou migração automática realizada.

## Implementação

- Bancos vida-em-dia:<UUID> e vida-em-dia:visitante. Não usam e-mail. Fila/controle/recibos/conflitos foram incorporados ao schema de cada identidade; fotos e configurações permanecem junto aos dados. Bancos legados não são abertos na inicialização nem recebem upgrade.
- Bootstrap resolve sessão do armazenamento local, incluindo sessão expirada, antes de abrir/inicializar o espaço e renderizar App. Modo visitante persiste apenas seu banco e informa que ele é compartilhado por quem usa o perfil. Cadastro/login não copia dados do visitante.
- Mudança de sessão desmonta a raiz React, fecha a conexão e recarrega. BroadcastChannel e fallback storage avisam as outras abas para fazerem o mesmo. Operações aguardando lock e repositórios capturados são invalidados por geração; autoOpen desativado evita reabrir conexões antigas em consultas.
- Antes de cada push real, transporte exige session.user.id igual à identidade ativa e proprietários do lote compatíveis; falha antes da RPC se divergir. Autorização remota continua dependendo da sessão validada pelo servidor/RLS.
- Repositório limita listar/obter/salvar/apagar ao proprietário e recusa instância antiga. Bancos separados são a barreira principal; filtros são defesa adicional.
- Backup exporta somente tabelas de dados e proprietário atual; não exporta fila. Importação JSON explícita grava na identidade atual, substituindo o proprietário declarado no arquivo.
- Importação legada disponível em Configurações → Backup. Dexie abre banco existente dinamicamente, sem version(), autoOpen:false e allowEmptyDB:false; acesso somente por transações r. Consulta do proprietário usa where(user_id).equals(UUID). Registros alheios não são listados, contados ou importados. Opção de incluir sem dono exige seleção e confirmação expressas. Referências/fotos cujos pais não pertencem ao conjunto elegível são excluídas da seleção; não se segue referência até outra conta. Origem intacta; sem fila/vínculo/tokens legados importados.

## Validação e limites

Testes usam Dexie real com fake-indexeddb. Cobrem A → B → visitante → A com registros/fila/fotos, fechamento antes de abrir, repositório antigo, mensagens de BroadcastChannel real entre duas conexões, sessão expirada local, recusa de push divergente, legado inexistente sem criação, origem intacta sem atribuição automática, filtro de proprietário e importação explícita, backup sem fila e força de proprietário.

Cada etapa teve tipos, lint, testes e build verdes antes do commit. Verificação final: 229 testes/36 arquivos, tipos/lint/build. Reprodução controlada em memória executa o código real do repositório com proprietários sintéticos; não acessa bancos do perfil do usuário. Registros da conta principal e da esposa não foram apagados ou importados por ferramentas.

Limites: testes de abas exercitam canal e conexões reais em processo Node, não navegação E2E em duas janelas do usuário. Sem homologação visual de login/logout/legado no Safari/PWA nesta sessão. Não foi validado o estado remoto de RLS. Isolamento por banco não é criptografia contra alguém com controle do próprio perfil/DevTools. Não implementados APP-03/APP-04; nenhum merge, push ou deploy.
