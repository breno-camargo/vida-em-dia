# Entrega da etapa 6

Etapa 6 aprovada pelo usuário em 14/10/2026, após todos os testes de homologação passarem. Versão 0.6.0 preparada para produção.

Cardio com estimativas, ajuste das kcal e histórico; passos e calorias com modo de total do relógio para evitar dupla contagem; metas por tipo de dia, feriados e descanso; gráficos e resumo semanal; cardio nas fichas; ícones por grupo/atividade; busto nas medidas e seletores por casas numéricas.

Publicação no terminal autenticado do usuário, na branch main:

```cmd
git push origin main
git push origin v0.6.0
npx vercel --prod
git switch test
git push origin test
```

Validação final: TypeScript, lint, 48 testes e build. Publicação remota pendente dos comandos acima.

Próxima etapa: 7, backup JSON/CSV e proteção no iOS. Saúde/Mi Fitness nativo permanece como evolução futura; chat alimentar planejado para 9 após estrutura de conta/servidor da etapa 8.
