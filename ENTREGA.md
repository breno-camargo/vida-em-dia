# Entrega da ETAPA 4 para homologação

ETAPAS 1 a 3 aprovadas. Main continua em v0.3.0. Etapa 4 implementada em etapa-4-historico-evolucao e integrada em test para conferência; aguarda aprovação do usuário.

## Publicar o preview

No terminal autenticado, dentro do projeto:

```bat
git push -u origin etapa-4-historico-evolucao
git push origin test
npx vercel
```

Abra o endereço marcado como Preview. Não use --prod nesta homologação.

## Conferir no iPhone

1. Abra Evolução: treinos antigos concluídos devem aparecer. Busque por ficha, exercício e data.
2. Abra um treino e confira séries, cargas totais e volume. Remova e use Desfazer.
3. Em Por exercício ou Ajuda > Evolução, confira gráficos, recordes e a seta de comparação. Aquecimentos não devem contar.
4. Conclua outra sessão com maior carga: confira Novo recorde e os novos dados no histórico.
5. Configure o alvo de reps no editor. Atinja o alvo em todas as séries normais e confira a sugestão de progressão.
6. Gere o card do último treino ou pelo histórico. Teste sem foto, com foto, Baixar imagem e Compartilhar no iPhone. A imagem deve mostrar dados reais.
7. Abra o preview uma vez, desligue a internet e confira histórico, gráficos e geração do card offline.

Typecheck, lint, 25 testes e build passaram. Os cálculos, migração, recordes, aquecimentos, persistência e remoção/restauração têm testes automáticos. Áudio confirmado pelo usuário na etapa 3. Compartilhamento nativo e aparência ainda precisam de teste no iPhone.

A aprovação da etapa inteira é necessária antes de integrar test em main e criar v0.4.0. Cardio, medidas, sincronização, backup e super séries permanecem nas etapas previstas.
