> Nota atual em 26/10/2026: documento historico. Recursos publicados e proxima sequencia estao em [../docs/PLANO.md](../docs/PLANO.md) e [../docs/TESTES-CONFIABILIDADE.md](../docs/TESTES-CONFIABILIDADE.md). Agua e alimentacao ja foram publicadas. Produção usa o banco anteriormente aprovado pelo usuario; nao tratar a previa como isolamento de banco. Um Supabase separado para carga ainda precisa ser criado. As restricoes de publicacao e configuracoes abaixo pertencem as datas registradas e nao substituem o estado atual.

# Configurar a etapa 8 no Supabase

Para preparar o segundo projeto de produção, seguir [RUNBOOK-PRODUCAO.md](../revisao/RUNBOOK-PRODUCAO.md). Este guia histórico é de staging e não autoriza aplicação remota. O runtime atual exige o secret EXPECTED_PROJECT_REF por projeto; o antigo STAGING_PROJECT_REF não é utilizado.

Use primeiro o projeto novo do Vida em Dia para TESTES. O selo `main / PRODUCTION` do Supabase identifica a branch do banco; não significa que o app publicado já esteja conectado. Não aplicar SQL a um banco com dados de produção sem revisar antes.

## 1. Criar o banco

Abra `supabase/migrations/202610140001_conta_sincronizacao.sql`, copie todo o conteúdo, cole no SQL Editor e clique Run uma vez. O script cria 17 tabelas com RLS, índices, função de envio e bucket privado de fotos. Os dados dos registros ficam em `dados` (JSONB), mantendo IDs e datas em colunas indexadas. As 16 tabelas de dados sincronizam nesta etapa; a tabela/bucket de fotos ficam preparados para a etapa 11. Não apaga dados existentes; se houver tabelas com esses nomes, a transação falha e deve ser revisada, sem repetir parcialmente.

## 2. Criar a conta pessoal

Authentication → Users → Add user → Create new user. Informe seu e-mail e uma senha, mantendo a confirmação automática para essa conta criada pelo administrador. Guarde a senha; não envie no chat.

Para cadastrar pelo app, ative `Allow new users to sign up` em Authentication → Sign In / Providers e mantenha a confirmação de e-mail ativada.

### E-mail de confirmação do cadastro

Em Authentication → Emails → Confirm signup, use o assunto `Confirme sua conta — Vida em Dia`. Copie o conteúdo completo de `supabase/confirmar-cadastro.html` para Source e salve. Preserve `{{ .Token }}` e `{{ .ConfirmationURL }}` exatamente como estão. O modelo oferece código para digitar no app e botão alternativo de confirmação. A alteração local não atualiza o Supabase: a aplicação no painel é manual. Se o painel exigir SMTP próprio, configure-o mantendo as credenciais somente no Supabase.

## 3. Recuperação de senha dentro do app

O painel deste projeto exige SMTP próprio para editar modelos (aviso "Set up custom SMTP to edit templates"). Configure o provedor em Authentication → Emails → Set up SMTP antes de editar o modelo. As credenciais SMTP ficam apenas no Supabase; não colocar no app ou no Git. Login e sincronização podem ser testados antes, mas recuperação por código depende desta configuração e da entrega real do e-mail.

Depois, em Authentication → Emails → Reset Password, use um código no lugar do link:

Abra `supabase/templates/recuperar-senha.html` e copie o conteúdo completo para Source. No Subject, use `Seu código de recuperação — Vida em Dia`. O modelo usa tabelas e estilos inline para e-mail; mantenha `{{ .Token }}` exatamente como no arquivo.

O app solicita a recuperação por e-mail, verifica o código como `recovery` e pede uma nova senha, sem abrir link no Safari. Testar entrega real do e-mail; o provedor padrão do Supabase tem limites de envio/destinatários. Se necessário, configurar SMTP próprio, sem colocar credenciais no app.

## 4. Variáveis por ambiente

O `.env.local` configura apenas o desenvolvimento local e fica fora do Git. `.env.example` contém somente nomes vazios.

Na Vercel → projeto Vida em Dia → Settings → Environment Variables:

- `VITE_SUPABASE_URL`: URL do projeto de teste.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: chave pública publishable do projeto de teste.

Aplique inicialmente ao ambiente Preview/branch `test`. Faça novo deploy após configurar. Nunca usar secret/service_role. Para produção, configurar um projeto separado (ou discutir explicitamente o compartilhamento) e aplicar a migração após aprovação, com as variáveis Production correspondentes. Não misturar contas e dados de homologação com produção.

## 5. Homologação

1. Sem login e offline: registrar treino/medida; todos os fluxos locais continuam funcionando.
2. Entrar com e-mail/senha; fechar e reabrir o app instalado, verificando sessão persistente.
3. Fazer backup com fotos, confirmar mesclagem e sincronizar; conferir fichas, séries, medidas e cardio nas tabelas do Supabase (coluna `dados`).
4. Novo navegador/aparelho: entrar na mesma conta, confirmar conexão e baixar os dados sem duplicar o catálogo padrão. Fotos não são baixadas nesta etapa; restaurar por JSON com fotos se necessário.
5. Após um sync, editar offline e sincronizar ao voltar à internet. Interromper um envio e repetir, sem duplicações por ID.
6. Alterar o mesmo registro nos dois aparelhos e sincronizar: vence `atualizado_em` mais recente. Relógios dos aparelhos devem estar corretos; empate preserva o servidor.
7. Remover e desfazer um registro; conferir propagação do tombstone e da restauração.
8. Ativar automático: conferir ao abrir, voltar ao primeiro plano, reconectar e finalizar treino. Desativado: somente envio manual.
9. Esqueci minha senha: receber código, digitar no mesmo app e escolher nova senha; testar código errado/expirado.
10. Sair: mantém dados locais, mas para de sincronizar. Login de outra conta não pode enviar esses dados.
11. Conferir estado offline/erro/última sincronização e lembrete de backup. Falha não atualiza a data do último sync.
12. Antes de liberar produção: testar RLS com duas contas de teste e sem sessão; cada uma vê somente seus dados. Cadastro público deve permanecer fechado.
13. Em armazenamento isolado já vinculado, restaurar JSON por Substituir neste aparelho. Confirmar que o vínculo permanece e o envio fica pausado após reabrir. Revisar retomada e confirmar mesclagem apenas depois de ler que dados remotos ausentes do backup podem voltar. Não há exclusão da nuvem por essa restauração.
14. Em dois aparelhos de teste, criar atividade/medida no mesmo dia com IDs diferentes; conferir Revisar registros, escolher deste aparelho ou da conta e verificar um único registro ativo. Os valores recusados ficam como exclusão lógica no JSON. A tabela conflitante aguarda a decisão, enquanto as outras podem avançar; último sync não avança integralmente com pendências de revisão.
15. Alterar local/remoto durante a revisão e confirmar recusa da decisão antiga. Interromper o envio após a escolha e retomar sem duplicar a data. Conferir também duas abas com Web Locks; navegador sem essa proteção recusa sincronização/importação antes da escrita.

As correções de 16/10 acrescentam a versão 2 do IndexedDB de sincronização, com diagnósticos de conflito e pausa de restauração. A migração é local e preserva vínculo/fila/recibos existentes; não exige reaplicar SQL no Supabase. [Detalhes, evidências e limites](../revisao/CORRECOES.md).

A fila e os recibos usam um segundo IndexedDB, versionado separadamente (`vida-em-dia-sincronizacao`). O banco principal e backups antigos continuam compatíveis. Ao sincronizar, a fila é reconstruída a partir dos dados locais, portanto uma gravação local permanece recuperável mesmo se o app fechar antes de enfileirar. Envio em lotes de 100; leitura paginada de 200 por ID, completa em cada ciclo para não perder registros atrasados por relógio/cursor. Configurações de sync automático, último backup e último sync são do aparelho. Dados com IDs distintos na mesma data exigem revisão em vez de exclusão automática. Biblioteca já usada em dois aparelhos independentes pode conter exercícios com nomes iguais e IDs distintos; a mesclagem não os trata como o mesmo exercício.

Sair não apaga o armazenamento local. Este app é para um aparelho pessoal, não há troca de perfis com armazenamento compartilhado nesta etapa.

Fontes: [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [recuperação de senha](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail), [verificar código](https://supabase.com/docs/reference/javascript/auth-verifyotp).

## Remetente dedicado do Vida em Dia

Ao criar o e-mail exclusivo do app, atualizar Sender email e Username para esse novo endereço. Se for Gmail, gerar a senha de app conectado à NOVA conta, com verificação em duas etapas ativada, e substituir Password no SMTP. Nome do remetente: Vida em Dia. Não reutilizar a senha de app da conta pessoal. Salvar e testar uma única recuperação com um código novo; nunca colocar senha SMTP no repositório ou enviar no chat.
## Cadastro pelo app — implementado localmente em 18/10/2026

O app agora oferece Criar conta (e-mail, senha de ao menos 8 caracteres e confirmação). Usa signUp com senha e aguarda confirmação por e-mail quando habilitada no projeto. Se a configuração remota devolver sessão imediata, o app reconhece a sessão sem vincular os dados automaticamente. O vínculo e a mesclagem continuam dependendo de confirmação explícita do usuário.

Antes da homologação real, conferir no projeto Supabase que novos cadastros por e-mail estão permitidos, confirmação de e-mail está habilitada e o serviço de envio/SMTP está funcionando. Estas configurações remotas não foram alteradas pelo Codex. Não desabilitar a confirmação só para contornar problemas de envio.

O template de confirmação pronto para revisão está em `supabase/confirmar-cadastro.html`. Aplicá-lo manualmente ao e-mail de confirmação de cadastro permite digitar `{{ .Token }}` dentro do app (verifyOtp com type email). O template também inclui `{{ .ConfirmationURL }}`: após confirmar pelo link, voltar ao app e entrar com e-mail/senha. Como detectSessionInUrl está desligado, não se deve prometer login automático ao abrir o link. O template de recuperação de senha é independente e não deve ser substituído pelo de cadastro.

Para homologação, usar a conta de teste autorizada pelo usuário, teste@example.com, em perfil/janela sem os dados da conta principal. Senha deve ser definida pelo usuário no app, sem enviar no chat. Não cadastrar automaticamente, não apagar dados da conta principal e não mesclar seu armazenamento com a conta de teste.

Fontes: https://supabase.com/docs/reference/javascript/auth-signup e https://supabase.com/docs/guides/auth/auth-email-templates . Envio real, confirmação, reenvio e recuperação ainda precisam de homologação no projeto configurado.
