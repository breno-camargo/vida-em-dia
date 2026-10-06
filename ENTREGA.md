# Entrega da ETAPA 3

ETAPAS 1 e 2 aprovadas (v0.1.0 e v0.2.0). ETAPA 3 desenvolvida na branch etapa-3-modo-treino e preparada para homologação em test. main continua com a etapa 2.

Inclui iniciar/continuar treino, séries planejadas pela última sessão, carga total/por lado, aquecimento/normal/falha/drop set, RPE opcional, descanso por término, som e alerta visual, tela ligada, ajustes só no dia, treino livre que vira ficha e resumo. Histórico, recordes e progressão pertencem à etapa 4; cadastro de cardio à etapa 6.

## Enviar e publicar homologação

O terminal desta sessão não consegue acessar o gerenciador de credenciais do Windows. Use seu terminal autenticado, na ordem:

```bat
cd /d "C:\Users\breno\Documents\Codex\2026-10-05\ol\outputs\vida-em-dia"
git log --format="%h %s" -10
git push -u origin etapa-3-modo-treino
git push origin test
npx vercel
```

A Vercel acompanha main em produção. Não use --prod na homologação. Abra o link marcado como Preview e envie para conferência. Se os pushes já dispararem um preview automático de test, pode usar o endereço mostrado no painel Vercel. O merge local integra a etapa em test; após o merge as branches não têm diferença restante para um PR dessa entrega.

## Testar no iPhone instalado

1. Inicie a ficha: séries e exercícios devem vir planejados.
2. Teste 30 kg por lado + 20 kg de barra: total 80 kg.
3. Conclua, ajuste descanso, bloqueie por 20 s e volte: o tempo deve estar correto.
4. Confira áudio após o primeiro toque, silêncio e alerta visual. A última série não inicia descanso.
5. Teste aquecimento (fora do volume), falha, drop set com reduções e RPE.
6. Edite/desfaça uma conclusão, copie a anterior e acrescente série extra.
7. Feche e reabra: Continuar treino deve preservar séries e descanso.
8. Adicione/remova/reordene exercícios do dia e confirme que a ficha original não mudou.
9. Abra a ajuda/fotos e volte sem perder o andamento; use Manter tela ligada.
10. Finalize, confira resumo e estimativa editável e inicie outra sessão para conferir o último desempenho.
11. Faça treino livre e salve o planejamento como ficha.

Typecheck, lint, testes e build precisam passar antes de integrar. Os testes cobrem persistência, inicialização da biblioteca, fichas, migrações das versões 1/2, carga por lado, volume com drop sets, aquecimento, preenchimento pela última sessão e cálculo do descanso por timestamp.

A conferência física no iPhone ainda é necessária para áudio, Wake Lock, alternativa NoSleep, câmera e interação. O aviso visual permanece mesmo sem som. Não há notificações em segundo plano.

## Aprovação

Aguarde aprovação explícita da etapa inteira. Depois, atualize README e CHANGELOG, integre test em main com --no-ff, crie v0.3.0, envie main e a tag e atualize test com main. Nenhuma versão da etapa 3 foi criada agora.
