# Homologação A/B/anônimo — cadastro ainda fechado

Executar primeiro em staging e repetir integralmente em produção, **somente após autorização de operação remota**. Este arquivo não contém resultados já aprovados. Usar somente duas contas convidadas A e B e dados sintéticos. Cliente anônimo significa chave pública sem sessão de usuário, não service_role nem usuário Auth anônimo.

Registro operacional: ambiente `<AMBIENTE>`, ref público `<REF_DO_AMBIENTE>`, commit `<COMMIT>`, domínio `<DOMINIO_EXATO>`, data `<DATA>`, responsável `<RESPONSAVEL>`, resultado e evidências sanitizadas. Não preencher no Git com credenciais, JWT, e-mails, URLs assinadas completas ou dados de saúde.

## Antes dos testes

- [ ] Projeto conferido no painel, separado do outro ambiente; signup desativado e anonymous sign-ins desligado.
- [ ] Migrações completas, checagem_seguranca.sql revisada: 20 tabelas esperadas com RLS, 17 triggers/CHECKs, constraints validadas, sem DELETE/TRUNCATE nas tabelas public para clientes.
- [ ] Revisados todos os resultados TO PUBLIC/USING true e SECURITY DEFINER; nenhuma política ampla adicional ficou sem justificativa.
- [ ] Bucket privado, políticas por pasta do proprietário e APIs administrativas fora do cliente.
- [ ] EXPECTED_PROJECT_REF obrigatório e correspondente; mensagens de erro sem ref/URL/secret; CORS da função configurado pela origem exata.
- [ ] Site URL/Redirect URLs do projeto corretas, sem wildcard em produção; SMTP próprio e confirmações habilitados.
- [ ] A e B convidadas administrativamente, aceitação de convite e definição de senha homologadas sem abrir signup.
- [ ] Perfis de navegador distintos A, B e sem sessão; excluir a conta A só ao final, após guardar evidências não sensíveis dos testes anteriores.

## Cliente sem sessão

- [ ] SELECT/INSERT/UPDATE nas tabelas do app e RPC de envio/eliminação não dão acesso ou alteração de dados de A/B.
- [ ] DELETE/TRUNCATE nas tabelas public não são autorizados. Não executar TRUNCATE real para testar: conferir privilégios/catalogação e tentativa isolada aprovada, sem dados reais.
- [ ] Bucket não tem acesso público; cliente sem sessão não lista, obtém, envia ou remove objetos privados de A/B.
- [ ] Função excluir-conta sem JWT válido recusa sem alterar dados. Endpoint de purga sem segredo ou com segredo errado recusa.
- [ ] Signup direto pela API pública é recusado enquanto fechado, mesmo que exista botão de cadastro no app. Visitante local não cria usuário Auth anônimo.

## Isolamento A e B

- [ ] A cria ficha, treino, medida, configuração e foto sintéticos; B cria registros distintos. Após sync, nenhuma conta lê, altera ou elimina dados da outra por ID conhecido, RPC ou API direta.
- [ ] Payload de A com user_id de B é recusado. Filtros do frontend não são a única barreira.
- [ ] Storage testado por API com sessão A/B, não por painel/admin: upload/lista/download/remoção somente na pasta própria, inclusive subpastas. B não emite URL assinada para objeto de A.
- [ ] No mesmo perfil: A → B → visitante → A; registros, fila, fotos e configurações não se misturam. Visitante vê só o próprio espaço. Criar conta não importa visitante implicitamente.
- [ ] Troca de identidade em outra aba fecha o banco anterior antes de voltar às telas. Resposta tardia de exclusão de A não apaga banco de B.
- [ ] Banco legado não é importado/apagado automaticamente; confirmações próprias continuam exigidas.

## Remoção, eliminação e backup

- [ ] Remover/Desfazer continua reversível antes da eliminação definitiva. Eliminar exige confirmação explícita e reduz registro a id/user_id/apagado_em/eliminado_em, sem campos pessoais, fotos ou miniaturas.
- [ ] Eliminado não aceita UPDATE, upsert antigo/futuro, remoção de eliminado_em ou Desfazer. SQL Editor administrativo não substitui a tentativa com sessão de cliente.
- [ ] Aparelho 2 com edição offline pendente: após eliminação/purga no servidor, sync descarta edição rejeitada sem recriar conteúdo e sem fila residual do registro.
- [ ] Banco limpo + backup antigo + sync termina eliminado quando o servidor já eliminou o item, mesmo com atualizado_em futuro no arquivo.
- [ ] Backup criptografado tem ida/volta, senha errada/adulteração recusadas, aviso de perda da senha e propriedade forçada para identidade atual. Removidos ficam fora por padrão.
- [ ] Removido com mais de 30 dias perde conteúdo; recente não. Purga do cliente roda na abertura, purga do servidor roda por agenda realmente verificada.
- [ ] Falha de Storage após remover parte dos objetos preserva fila; retry remove só o restante pela Storage API. Confirmar bytes removidos, não apenas metadados SQL.

## Conta, limites e falha parcial

- [ ] Origem indevida, JWT inválido e senha errada não iniciam exclusão. CORS não é usado como substituto da validação do JWT.
- [ ] Testar limite de cinco tentativas/quinze minutos; aguardar a janela antes de prosseguir com a exclusão final de A. Não desativar limite para fazer o teste passar.
- [ ] Exportar backup criptografado é oferecido antes de excluir. Interrupção em Storage, dados ou Auth informa etapa real, permite repetir e mantém banco local até sucesso confirmado.
- [ ] Ao concluir a exclusão de A: objetos, linhas e Auth de A removidos, banco local daquela identidade apagado; B intacta. JWT antigo de A não consegue inserir (FK/Auth/RLS).
- [ ] Resposta final perdida não é interpretada como sucesso automático. Confirmar no ambiente administrativo antes de limpar localmente, conforme APP-03.
- [ ] “Sair e apagar dados deste aparelho” exige aceite de fila pendente e não apaga visitante, outras contas ou legado. Legado exige confirmação independente.

## Auth, deploy e decisão de liberação

- [ ] Convite, confirmação e recuperação por código entregues pelo SMTP real; Site URL/Redirect URLs não levam ao outro ambiente. Usuário convidado não confirmado não entra por senha.
- [ ] Senha e proteção contra vazamento compatíveis com plano/UI e testadas. Se CAPTCHA for requisito de lançamento, widget/token, reautenticação da Edge e CSP compatíveis antes da abertura.
- [ ] Production usa só o novo projeto; Preview continua staging. Sem service_role no bundle, variáveis VITE_, logs ou arquivos. Sem ref real fixo no código fora de vercel.json/documentação.
- [ ] CSP única inclui origens necessárias de ambos os projetos; rodada Report-Only em Preview e em produção fechada, sem violações funcionais não resolvidas. SW/cache e PWA homologados com headers reais.
- [ ] CI remoto na branch test verde em Ubuntu, incluindo install sem scripts, audit high, tipos, lint, testes e build. Testes Windows/PGlite não são substituto.
- [ ] Plano/região/transferência internacional, backup diário ou PITR e retenções efetivas documentados, sem promessa de expurgo retroativo de backups/logs.
- [ ] Rollback ensaiado para banco novo: retirar variáveis de Production e voltar deploy sem backend, preservando staging. Não alegar reversão de eliminação.
- [ ] Aprovação explícita registrada para abertura. Só então habilitar Allow new users to sign up no projeto de produção; manter confirmação de e-mail obrigatória. Não abrir antes para contornar qualquer teste.

Enforcement da CSP requer commit/aprovação separados e repetição dos testes aplicáveis. Checklist com pendências não autoriza a abertura de cadastro.
