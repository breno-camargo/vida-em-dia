# Etapa 8 — configuração e homologação

Etapas 1 a 7 aprovadas. Etapa 8 implementada em `etapa-8-conta-sincronizacao` e integrada em `test` para homologação; produção permanece 0.7.0.

1. Seguir `supabase/CONFIGURAR.md`: aplicar SQL no projeto NOVO de teste, criar conta pessoal e fechar cadastro público; configurar template de recuperação por código.
2. Configurar VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no Preview da Vercel (branch test). As variáveis locais já foram gravadas em .env.local, fora do Git.
3. Publicar a prévia:

```cmd
git push origin etapa-8-conta-sincronizacao
git push origin test
npx vercel
```

4. Executar o checklist de `supabase/CONFIGURAR.md` em dois aparelhos/navegadores e no app instalado do iPhone. Fotos não sincronizam nesta etapa: fazer JSON com fotos.

66 testes, TypeScript, lint e build. O SQL foi testado em Postgres embarcado; falta aplicação e teste no Supabase real, incluindo envio de e-mail. Não executar migração em banco com dados de produção sem revisão prévia.
