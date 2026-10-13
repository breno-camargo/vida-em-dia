# Entrega da etapa 5

Etapa 5 aprovada pelo usuário em 12/10/2026, após o checklist de homologação. Versão 0.5.0 preparada para produção.

Peso e medidas em seletores de rolagem; registros parciais por data, edição e remoção reversível; comparação antes/depois; resumo de todas as medidas e gráfico recolhido com escolha por rolagem; lembrete semanal dentro do app, padrão sábado; cálculo de calorias dos próximos treinos com o último peso cadastrado e o tempo real.

Para publicar no terminal autenticado do usuário, na branch main:

```cmd
git push origin main
git push origin v0.5.0
npx vercel --prod
git switch test
git push origin test
```

Próxima etapa: 6, cardio e atividade diária. Fotos de progresso ficam para a etapa 11; meta de peso e IMC para a etapa 12. Chat alimentar planejado para a etapa 9, com servidor/conta da etapa 8. Integração Saúde/Redmi Watch 5 Lite permanece como evolução futura separada.

Validação final: TypeScript, lint, 35 testes e build. Publicação remota pendente dos comandos acima.
