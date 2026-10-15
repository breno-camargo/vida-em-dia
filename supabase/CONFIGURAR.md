# Configurar a etapa 8 no Supabase

Use primeiro o projeto novo do Vida em Dia para TESTES. O selo `main / PRODUCTION` do Supabase identifica a branch do banco; não significa que o app publicado já esteja conectado. Não aplicar SQL a um banco com dados de produção sem revisar antes.

## 1. Criar o banco

Abra `supabase/migrations/202610140001_conta_sincronizacao.sql`, copie todo o conteúdo, cole no SQL Editor e clique Run uma vez. O script cria 17 tabelas com RLS, índices, função de envio e bucket privado de fotos. Os dados dos registros ficam em `dados` (JSONB), mantendo IDs e datas em colunas indexadas. As 16 tabelas de dados sincronizam nesta etapa; a tabela/bucket de fotos ficam preparados para a etapa 11. Não apaga dados existentes; se houver tabelas com esses nomes, a transação falha e deve ser revisada, sem repetir parcialmente.

## 2. Criar a conta pessoal

Authentication → Users → Add user → Create new user. Informe seu e-mail e uma senha, mantendo a confirmação automática para essa conta criada pelo administrador. Guarde a senha; não envie no chat.

Authentication → Sign In / Providers → desative `Allow new users to sign up` depois de criar a conta. A interface do app permite entrar, não cadastrar contas públicas.

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

A fila e os recibos usam um segundo IndexedDB, versionado separadamente (`vida-em-dia-sincronizacao`). O banco principal e backups antigos continuam compatíveis. Ao sincronizar, a fila é reconstruída a partir dos dados locais, portanto uma gravação local permanece recuperável mesmo se o app fechar antes de enfileirar. Envio em lotes de 100; leitura paginada de 200 por ID, completa em cada ciclo para não perder registros atrasados por relógio/cursor. Configurações de sync automático, último backup e último sync são do aparelho. Dados com IDs distintos na mesma data exigem revisão em vez de exclusão automática. Biblioteca já usada em dois aparelhos independentes pode conter exercícios com nomes iguais e IDs distintos; a mesclagem não os trata como o mesmo exercício.

Sair não apaga o armazenamento local. Este app é para um aparelho pessoal, não há troca de perfis com armazenamento compartilhado nesta etapa.

Fontes: [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [recuperação de senha](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail), [verificar código](https://supabase.com/docs/reference/javascript/auth-verifyotp).

## Remetente dedicado do Vida em Dia

Ao criar o e-mail exclusivo do app, atualizar Sender email e Username para esse novo endereço. Se for Gmail, gerar a senha de app conectado à NOVA conta, com verificação em duas etapas ativada, e substituir Password no SMTP. Nome do remetente: Vida em Dia. Não reutilizar a senha de app da conta pessoal. Salvar e testar uma única recuperação com um código novo; nunca colocar senha SMTP no repositório ou enviar no chat.
