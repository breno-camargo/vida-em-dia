# Entrega da ETAPA 2

ETAPA 1 aprovada e publicada (v0.1.0). ETAPA 2 desenvolvida em etapa-2-exercicios-fichas, integrada em test após validação. main permanece com a etapa 1.

Inclui 64 exercícios, busca/filtro, cadastro e edição, fichas com séries e descanso, duplicação, reordenação, exclusão lógica com Desfazer, ajuda com fotos locais comprimidas, texto e vídeo. A execução do treino pertence à etapa 3.

## Enviar e publicar homologação

Se esta sessão não conseguir acessar as credenciais, execute no seu terminal autenticado, na ordem:

```bat
cd /d "C:\Users\breno\Documents\Codex\2026-10-05\ol\outputs\vida-em-dia"
git log --format="%h %s" -10
git push -u origin etapa-2-exercicios-fichas
git push origin test
npx vercel
```

O projeto Vercel acompanha main em produção; test e a branch da etapa geram previews. Não use --prod. Abra o link marcado como Preview e envie para conferência. O merge local já integrou a etapa em test; as branches não terão diferença restante para um PR dessa entrega.

## Testar no iPhone

Use a aba Treino: crie exercício, busque/filtro, crie ficha com dois exercícios, configure séries e descanso, reordene, duplique e confirme independência. Exclua e desfaca uma ficha ou exercício livre. Abra Como fazer, anexe fotos da câmera/galeria, edite nota, instruções e link de vídeo. Reabra offline e confira persistência das fichas, fotos e textos. Vídeos precisam de internet. O README contém mais detalhes.

Validação automatizada: npm run typecheck, npm run lint, npm test, npm run build. Sete testes verificam armazenamento, biblioteca, fichas e migração da versão 1 para 2. O cache de transformação dos testes fica dentro de node_modules para funcionar no ambiente Windows restrito.

A conferência visual no Safari e a captura de fotos precisam de teste no aparelho. Se o app instalado ainda mostrar a versão antiga, abra conectado e toque no aviso de nova versão; o endereço de produção continuará com a etapa 1 até a aprovação.

## Aprovação

Aguarde aprovação explícita da etapa inteira. Só então atualize CHANGELOG e README, integre test em main com --no-ff, crie v0.2.0, envie main e a tag e atualize test com main. Nenhuma tag da etapa 2 foi criada agora.
