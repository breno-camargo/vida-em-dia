# Correção de contraste do tema claro — 23/10/2026

Aplicada somente à cópia isolada. Cores fixas dos estilos legados agora possuem correspondência clara centralizada em `src/estilos/paleta-clara.css`, gerada por `node revisao/gerar-paleta-clara.cjs`. Ao modificar cores no legado, regenerar esse arquivo. O gerador preserva seletores, dimensões, comportamento e escopo de mídia; não altera o tema escuro.

Complementos em `contraste-claro.css`: navegação, placeholders, contornos, foco, indicadores, gráficos e tooltips. Botões principais usam os tokens de `controles.css`. Renderizadores de cards exportáveis preservados.

`node revisao/auditar-contraste.cjs`: 20 estados examinados, zero falhas de contraste textual nas amostras. Inclui Hoje, Treino, catálogo, cardio, Comida, Medidas com registro fictício, editor e seletor de medidas, Evolução, editor de ficha, treino ativo, resumo e as oito seções de configurações. Critério: 4,5:1 para texto comum e 3:1 para texto grande. Relatório: `contraste-claro.json`.

A medição automatizada usa estilos computados e composição dos fundos dos ancestrais; não certifica imagens, máscaras, gráficos, interação nativa do sistema ou todos os estados possíveis. Opções fora da seleção nas rodas e botões desabilitados são excluídos da medição. Capturas e teste funcional complementam a avaliação.
