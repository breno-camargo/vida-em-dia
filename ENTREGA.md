# Entrega da etapa 4

Etapa 4 aprovada pelo usuário em 06/10/2026, após todos os itens do checklist passarem e reteste do painel do card. Versão 0.4.0 preparada para produção.

Histórico, busca, remoção e desfazer; evolução e gráficos; recordes de carga, volume, força estimada e repetições em peso corporal; card com foto opcional, download e compartilhamento; treino livre nomeável; seletores de rolagem e melhorias visuais.

Publicação no terminal autenticado do usuário, na branch main:

```cmd
git push origin main
git push origin v0.4.0
npx vercel --prod
git switch test
git push origin test
```

Próxima etapa: 5, medidas corporais. Tutorial de primeiro acesso planejado para 13, com vínculo por conta dependendo da autenticação da etapa 8.
