# Etapa 7 — aprovada

Checklist completo aprovado pelo usuário em 14/10/2026, incluindo arquivo inválido rejeitado sem alterar os dados. Versão 0.7.0 preparada para publicação.

Validação: 55 testes, TypeScript, lint e build. Backup JSON com fotos opcionais, CSV, importação atômica para mesclar ou substituir e lembrete de backup.

Publicar a partir da branch main:

```cmd
git push origin main
git push origin v0.7.0
npx vercel --prod
git switch test
git push origin test
```

Próxima etapa: 8, conta e sincronização.
