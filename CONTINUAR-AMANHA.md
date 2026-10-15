# Retomada — trabalho de 14/10/2026

## PRIMEIRO ASSUNTO AMANHÃ: e-mail no celular diferente do PC

Breno pediu explicitamente para salvar: o e-mail de recuperação recebido no celular ficou diferente do recebido no computador. Comparar a MESMA versão/mensagem nos dois aparelhos, confirmar aplicativo de e-mail, modo claro/escuro, largura, quebra de linhas, cores e código. Pedir as imagens correspondentes na retomada. Não concluir que seja cache, mensagem antiga ou erro do usuário sem evidência. Ajustar o HTML conforme o problema observado. Não reenviar códigos repetidamente só para conferir aparência; respeitar limites e usar Preview/arquivo de teste para as primeiras comparações.

Arquivo atual: `supabase/templates/recuperar-senha.html`. Última versão local: fundo externo claro, card verde escuro, título “Recupere seu acesso”, bloco escuro e números verdes maiores. A imagem mais recente recebida pelo usuário ainda mostrava a primeira versão personalizada, com fundo externo escuro e bloco verde claro. É necessário confirmar qual HTML ficou salvo/aplicado no Supabase; não assumir que a última versão já está em envio. O template usa {{ .Token }} uma única vez; não salvar códigos reais no arquivo.

## Estado das etapas

- Etapa 7 aprovada hoje, v0.7.0 preparada e publicada pelo usuário. GitHub main em fbeba3ddf6aeb8bf959fafb4a5e0bcf102eb6ad3, tag v0.7.0 existente.
- Etapa 8 implementada, em homologação, AINDA NÃO APROVADA. Não liberar versão 0.8.0, merge em main ou produção antes da aprovação.
- Branch de trabalho: etapa-8-conta-sincronizacao. Mudanças integradas em test a cada ajuste. Deixar test para continuidade do usuário.
- Existe mudança prévia e alheia em .gitignore; foi preservada e nunca incluída nos commits.

## O que fizemos hoje

1. Conta Supabase: e-mail/senha, sessão persistente, recuperação por código dentro do app e nova senha. Sem links mágicos.
2. Login passou a aparecer na abertura. Sessão existente entra direto; Continuar sem conta mantém uso local/offline. Recuperação não fecha a tela de nova senha ao validar o código.
3. SQL em supabase/migrations/202610140001_conta_sincronizacao.sql: 17 tabelas com RLS por dono, índices, RPC com LWW e bucket privado. Usuário aplicou no projeto novo do Vida em Dia e recebeu Success, no rows returned. NÃO reaplicar esse SQL de criação no mesmo banco.
4. Conta do usuário criada manualmente em Authentication → Users. Orientado a fechar cadastro público; falta confirmar explicitamente que o switch foi salvo.
5. URL/chave pública do Supabase em .env.local ignorado pelo Git; Vercel Preview recebeu VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY. Nunca gravar senha SMTP, senha de conta ou chave secret/service_role em arquivos ou pedir no chat.
6. Sincronização: 16 tabelas de dados, fila e recibos em Dexie separado, reenvio idempotente, envio em lotes 100, leitura completa em páginas 200, soft delete, conflitos por atualizado_em. Primeiro aparelho sem registros pessoais baixa a conta sem duplicar catálogo inicial. Outro usuário não pode enviar dados vinculados à conta anterior.
7. Botão manual em Hoje/Configurações; automático opcional ao abrir, retornar ao primeiro plano, reconectar e finalizar treino. Fotos continuam no JSON com fotos; sincronização das imagens na etapa 11.
8. Entrada refinada: sem data/card pesado/títulos duplicados; campos claros, mostrar/ocultar senha, links discretos. Mensagens específicas para offline, falha de envio e limite de pedidos.
9. Cards de movimento alinhados: slots iguais, unidade kcal com espaçamento correto, números tabulares, barra de progresso estilizada Safari/Chrome e espaço reservado quando não há meta.
10. Configurações em seções recolhidas, uma aberta por vez; atalhos de Hoje abrem conta/backup diretamente. Carregamento sob demanda com cache offline.
11. Conta compacta, sem e-mail repetido e sem textos extensos. A última mudança coloca Sair da conta no FINAL da lista, fora das seções, e alinha margens/botão de conexão.
12. E-mail personalizado com identidade verde e assunto “Seu código de recuperação — Vida em Dia”; depois refinado novamente (ver prioridade acima). Alterar arquivo local ou publicar Vercel NÃO altera template do Supabase: copiar HTML completo em Authentication → Emails → Reset password → Source e salvar.

## SMTP, recuperação e limites

- Supabase exigiu SMTP próprio para editar templates; configuramos Gmail com senha de app (Google com 2 etapas). Remetente e Username precisam ser o Gmail que gerou a senha.
- Erro real identificado nos Auth Logs: 535 5.7.8 Username and Password not accepted. Resolvido pelo usuário ao gerar e salvar uma nova senha de app.
- Logs posteriores mostraram /recover 200, /verify 200, PUT /user 200 e login /token 200. Fluxo real de recuperação/login funcionou. Isso NÃO comprova homologação da sincronização dos registros.
- Depois houve over_email_send_rate_limit. Há dois controles: Emails → SMTP Settings → Minimum interval per user e Authentication → Rate Limits → e-mails por hora do projeto.
- Tela mostrou 30 e-mails/h e intervalo SMTP 60 s. Sugerimos 60 e-mails/h para testes e, por último, 30 s de intervalo; NÃO houve confirmação de que esses valores foram salvos. Não afirmar valor atual sem conferir.
- Usuário quer criar e-mail dedicado do Vida em Dia, substituindo o Gmail pessoal como remetente. Ainda NÃO confirmou criação/troca. Quando criar, trocar Sender email, Username e gerar senha de app na NOVA conta. Não alterar contas/senhas dos usuários do app por isso.
- Breno quer amigos usando o software. Combinado começar por contas criadas manualmente, mantendo cadastro público fechado e dados separados por RLS. Cada pessoa usa seu aparelho; troca de perfis no mesmo armazenamento ainda é bloqueada para proteger dados.

## Validação já feita

- 66 testes passaram, incluindo Postgres embarcado (PGlite) executando SQL/RLS entre duas contas, bloqueio anônimo e caminho privado de fotos; fila após falha, LWW, exclusões, paginação e aparelho novo.
- Últimos ajustes de interface passaram lint e build (que inclui TypeScript). Não afirmar que houve verificação visual automatizada/iPhone; usuário valida por screenshots.
- Template HTML verificado estruturalmente, um Token e tabelas equilibradas, sem scripts ou imagens externas. A diferença celular/PC é pendência real.

## Publicação e o que falta

Checagem remota em 14/10: branch da etapa no GitHub ainda em 2fe18a17be036e014a6781475b1705a2e9ebe514 e test em 68fa85ce033979bc5890fc172ff05cef2295794f. Os ajustes posteriores de conta/saída e o último refinamento de e-mail estavam só locais. Não presumir que o deploy atual já contém tudo. Publicação por CMD do usuário, pois autenticação da ferramenta não esteve disponível; evitar repetir tentativas de credenciais.

```cmd
cd /d C:\Users\breno\Documents\Codex\2026-10-05\ol\outputs\vida-em-dia
git switch test
git push origin etapa-8-conta-sincronizacao
git push origin test
npx vercel
```

Não usar --prod nesta homologação. As prévias têm proteção de login da Vercel e não foram inspecionadas por HTTP sem autenticação. Cada URL/endereço tem dados locais separados: preservar backups, não apagar dados para testar.

Depois do e-mail: aplicar/publicar últimos ajustes, homologar sincronização manual e automática entre dois aparelhos, edição offline e reconexão, exclusão/desfazer, conflitos, sessão, sair, isolamento entre duas contas. Checklist completo em supabase/CONFIGURAR.md. Só então pedir/aplicar aprovação da etapa 8. Etapa 9 (alimentação/chat IA) ainda não iniciada.
