# Revisão Codex — protótipo de cards

## Terceira entrega — 18/10/2026

Status: ajustes técnicos e de espaçamento aceitos; protótipo pronto para aprovação visual do usuário. Não integrado ao app.

Codex abriu os PNGs atualizados de adesivo preto, Editorial cardio e Foto com fundo sintético limpo. Rótulos do adesivo agora têm intervalos visíveis; QUILÔMETROS foi afastado dos descendentes; evidência Foto não duplica métricas da prancha. drawFoto sem foto chama drawEditorial. Script de verificação movido para revisao/prototipo-cards/verificar-prototipo.mjs. Sintaxe JavaScript, lint e build passaram.

Documentação do Gemini ainda desatualizada: comando e descrição citam revisao/verificar-prototipo.mjs, que não existe mais; comando correto é node revisao/prototipo-cards/verificar-prototipo.mjs. Tabela alpha também mantém dimensões/contagens antigas anteriores ao recorte. Não usar esses números como evidência da versão atual. Novos PNGs transparentes foram novamente decodificados independentemente pelo Codex (IDAT/filtros/alpha), confirmando fundo transparente e tinta; foto sem imagem e Editorial comparados binariamente. Registro resumido no retorno ao usuário.

Limites: inspeção de arquivos de evidência e código, sem nova sessão de navegador controlada pelo Codex; colagem/clipboard no Instagram e iPhone continuam sem homologação. Aparência depende de aprovação do usuário e ainda difere da prancha conceitual em proporções e quantidade de informação. Não apresentar aceitação técnica como equivalência visual perfeita.

---

## Segunda entrega — 18/10/2026

Os cinco achados anteriores foram tratados no código: duração exata, desenho canvas compartilhado, medição das unidades, foto na prévia do adesivo e ritmo derivado. PNGs e screenshot inspecionados diretamente pelo Codex, sem executar o script de automação do navegador. Alpha dos dois adesivos verificado independentemente com leitura PNG/IDAT e desfiltragem em Node: há fundo alpha zero e pixels de tinta. Isso não homologa clipboard/Instagram.

**Status atual: correções técnicas anteriores aceitas; aprovação visual e integração pendentes.** Novos pontos confirmados nas imagens finais:

1. `exemplos/adesivo-preto-musculacao.png`: rótulos Volume total, Exercícios e Séries encostam no número anterior. `drawTipografico` usa apenas 20 px entre baseline do número e baseline do próximo rótulo, menor que a altura do rótulo. Reservar o descendente real do número, um intervalo visível e a altura do próximo rótulo; distribuir o conjunto dinamicamente em vez de prender tudo a H×0,46. Exportar com limites justos do conteúdo para o adesivo não ter uma grande área transparente vazia ao redor.

2. `exemplos/card-editorial-cardio.png`: QUILÔMETROS fica perto demais e invade a faixa visual dos descendentes de 6,07. Calcular a legenda a partir do actualBoundingBoxDescent do número, com intervalo explícito, não somente baseline/proporção fixa. Conferir novamente 00:51, 48:37 e 6,07.

3. `exemplos/card-foto-com-foto-musculacao.png`: a foto de teste é um recorte da prancha com marca, métricas e moldura já impressas, portanto a imagem final mostra tudo duplicado. Substituir a evidência por foto limpa sem textos, ou imagem sintética local simples claramente identificada como fundo de teste. Não usar o card pronto da referência como foto para aprovar composição. O problema observado é a escolha da imagem de teste; não demonstra por si só duplicação no renderizador.

4. `exemplos/card-foto-musculacao.png`: sem foto muda apenas a paleta, mantendo resultados pequenos no rodapé e enorme área marfim vazia. A tarefa pede oferecer Editorial sem foto; reutilizar drawEditorial nesse caso, para realmente mudar a composição.

O script `revisao/verificar-prototipo.mjs` foi criado fora dos caminhos delimitados da tarefa. Em próxima entrega, mantê-lo em revisao/prototipo-cards/ e atualizar referências. Nenhuma mudança foi feita no app nesta revisão. Não é necessário integrar para corrigir esses pontos.

Encaminhar estes ajustes delimitados ao Gemini, regenerar PNGs/screenshots e atualizar o relatório. Depois submeter a aparência ao usuário; não declarar aprovação estética apenas com alpha ou testes passando.

---

18/10/2026. Status: devolvido para ajustes; não aprovado para integração.

Inspecionados relatório e HTML/JS. Nenhum arquivo do app foi alterado nesta revisão. A ferramenta não encontrou navegadores conectados, portanto não foi possível inspecionar visualmente a aba que o usuário tem aberta. Verificações visuais descritas pelo Gemini são declarações da entrega, não verificações independentes do Codex. Não há screenshots anexados.

## Achados

1. **Tempo perde segundos em Foto e Editorial.** `index.html:802`, `:854`, `:1209`, `:1310`: duracaoMin substitui duracaoLabel para sessões acima de um minuto. O cenário 48:37 vira 48 min; 12:09 vira 12 min. Contraria a decisão obrigatória MM:SS. Confirmado executando o script isoladamente em Node/VM com DOM mínimo: buildFoto(musculacao), buildEditorial(musculacao) e buildFoto(poucos-dados) não contêm os respectivos tempos exatos. Não foi teste de navegador.

2. **Prévia e PNG são composições diferentes.** CSS `.hero-number` em `:461` usa clamp dependente da viewport; exportação `:1321` usa fonte W×0,24 em posições fixas de H×0,35. Divisor, apoio e dimensões não são derivados da mesma composição. O relatório reconhece duas implementações, mas aprovação do HTML não aprova o PNG. Usar uma única renderização para prévia/ampliação/exportação, por exemplo canvas exibido com escala CSS. Confirmar todos os cenários com os arquivos finais.

3. **Unidades posicionadas sem medir o número na fonte correta.** `:1354` mede o volume depois de trocar para fonte pequena e descarta numW; o kg é centralizado em W/2 + 20 + W×0,09×0,1, dentro da região central ocupada pelo número, em vez de ficar depois de sua largura. O bloco Foto em `:1222` também descarta mainW e aproxima pela quantidade de caracteres. Corrigir usando medidas reais e alinhamento de grupo número/unidade; validar visualmente 4.250 kg e 6,07 km no PNG.

4. **Foto carregada não aparece na prévia tipográfica.** `buildTipografico` em `:755` não usa userPhoto; seu fundo é sempre o xadrez CSS. Apenas buildFoto inclui a imagem. Contraria o objetivo de conferir contraste do adesivo sobre a foto e a declaração de que a foto pode servir de prévia dele. Aplicar foto como fundo externo da prévia, sem pintá-la na exportação transparente.

5. **Ritmo do cenário foi copiado em vez de derivado.** `:701` fixa 7'23"/km. Para 44:47 e 6,07 km, são aproximadamente 442,67 segundos/km; arredondamento ao segundo mais próximo produz 07:23, enquanto truncamento produz 07:22. Derivar explicitamente de duração/distância com convenção declarada, evitando divergência se o cenário mudar. Não é bloqueio visual, mas atende à tarefa e elimina dado redundante.

## Retorno ao Gemini

Corrigir somente `revisao/prototipo-cards/` e atualizar `revisao/GEMINI-PROTOTIPO-CARDS.md`. Não integrar em src/. Prioridade: tempo exato, renderização única e unidades. Manter a direção visual da referência aprovada, sem redesenhar a identidade ou retornar às proporções do app rejeitadas.

Conferir os quatro cenários, versões com/sem foto, claro/escuro e PNGs exportados. Se houver navegador disponível, salvar capturas reais e ao menos uma composição final de cada modelo. Verificar alpha do PNG transparente, sem considerar inspeção de código como prova. Registrar limitações honestamente. Depois devolver para revisão e aprovação visual do usuário.
