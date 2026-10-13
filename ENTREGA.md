# Etapa 6 — pronta para homologação

Etapas 1 a 5 aprovadas; produção v0.5.0 verificada. Etapa 6 implementada na branch etapa-6-cardio-atividade e integrada em test. Produção permanece inalterada até aprovação.

Publicar a prévia no terminal autenticado:

```cmd
git push origin etapa-6-cardio-atividade
git push origin test
npx vercel
```

Checklist:

- Treino → Cardio → Esteira: salvar duração e distância, conferir velocidade/ritmo; testar kcal informadas e peso para estimativas sem kcal.
- Tipo/data por rolagem; campos opcionais, frequência cardíaca e nota; fechar seletores sem confirmar preserva valores. Fechar o formulário sem Salvar não grava.
- Vincular cardio a um treino da mesma data e conferir o resumo de cardio do dia/treino. Ficha só de cardio inicia sem séries de força.
- Histórico de cardio: filtro por tipo, edição, excluir/desfazer; conferir recordes de distância/duração/ritmo entre sessões do mesmo tipo.
- Ajuste de cardio: registrar 200 kcal e configurar 80%; original segue 200 e soma usa 160.
- Hoje: registrar passos e kcal manualmente. No modo soma, conferir treino + cardio ajustado + extra. No modo total do relógio, somente o número manual, sem dupla contagem.
- Metas úteis e fins de semana/feriados; ajustar metas depois de registrar e conferir que dias anteriores preservam as aplicadas.
- Feriados/descanso: editar, adicionar e remover; testar atalho em Hoje. Datas futuras permitidas na lista de feriados; registros de atividade/cardio só até hoje.
- Histórico da atividade: editar data antiga, gráficos 7/30 dias, metas por dia e dias que atingiram metas na semana.
- Meta semanal de cardio, resumo de sessões, km, minutos e kcal. Sem peso nem kcal, estimativa indisponível e totais parciais sinalizados.
- Offline no iPhone: registrar, editar, consultar gráficos/históricos e testar gestos/rolagem dos painéis.

44 testes, TypeScript, lint e build. Saúde/Mi Fitness nativo permanece futuro; chat alimentar planejado para 9. Próxima etapa após aprovação: 7, backup.
