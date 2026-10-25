# Entrega Gemini — Protótipo Visual de Cards e Adesivos (Revisão Completa e Segunda Entrega)

Data: 18/10/2026  
Status: Ajustes da Primeira e da Segunda Entrega implementados, validados com Edge Headless via CDP e confirmados com análise binária de PNG. Pronto para revisão do Codex e validação visual do usuário.  
Escopo: Execução estrita das correções solicitadas em `revisao/CODEX-PROTOTIPO-CARDS.md`. Nenhum arquivo do app (`src/`, `package.json`, banco, configurações ou dependências) foi alterado. Todo o protótipo reside em `revisao/prototipo-cards/`.

---

## 1. Resumo dos Ajustes Realizados na Primeira Entrega

### 1.1. Tempo exato MM:SS preservado em todos os modelos (Achado 1)
- **Problema anterior**: O tempo de sessões acima de 1 minuto era convertido para `duracaoMin` (ex.: `48:37` virava `48 min`), perdendo os segundos em Foto e Editorial.
- **Correção implementada**: Todas as composições (Tipográfico, Foto e Editorial) utilizam rigorosamente o tempo exato `duracaoLabel` (`MM:SS`), inclusive em sessões completas (`48:37`), sessões curtas (`00:51`) e poucos dados (`12:09`). Em Editorial e Foto, o tempo principal exibe o valor exato sem arredondamento.

### 1.2. Renderização unificada (Pipeline Único) (Achado 2)
- **Problema anterior**: A prévia na página usava HTML/CSS (com `clamp` e posicionamento flex/grid), enquanto a exportação PNG era uma reimplementação separada em Canvas, criando divergências visuais entre o que o usuário aprovava e o que era baixado.
- **Correção implementada**: A página utiliza **uma única camada de renderização** baseada em Canvas nativo 1080×1920:
  - Os 3 cards da página inicial são elementos `<canvas>` desenhados pelas funções mestras (`drawTipografico`, `drawFoto`, `drawEditorial`), dimensionados por CSS responsivo.
  - O modal de ampliação em 9:16 reutiliza o mesmo canvas em tela cheia com a mesma função.
  - A exportação PNG (`exportPNG` / `window.gerarPNGDataURL`) invoca exatamente a mesma função mestre.
  - Não há duas implementações concorrentes. O que é exibido na tela é matematicamente idêntico ao PNG exportado.

### 1.3. Medição real de fontes e alinhamento de unidades (Achado 3)
- **Problema anterior**: A unidade `kg` e `km` era posicionada em coordenadas empíricas ou aproximadas pelo número de caracteres, sem medir a largura real do número na fonte serifada grande.
- **Correção implementada**:
  - Criada a função `drawNumberWithUnit`: mede a largura exata de `numStr` na fonte correta (`700 Georgia`), mede a largura de `unitStr` em sans-serif (`500 Segoe UI`), calcula a largura combinada do grupo `[número + espaçamento + unidade]` e centraliza o conjunto como um bloco único.
  - Em `drawFoto`, `mainNumW` e `mainUnitW` são medidos com precisão e centralizados juntos.
  - Em `drawTipografico`, a unidade é posicionada imediatamente após a largura do valor medido, mantendo o espaçamento proporcional.

### 1.4. Prévia tipográfica sobre foto real em memória (Achado 4)
- **Problema anterior**: A imagem carregada pelo usuário só aparecia no card "Foto". O card "Tipográfico" ficava sempre sobre o fundo xadrez, impedindo avaliar o contraste do adesivo sobre a foto.
- **Correção implementada**:
  - Quando o usuário adiciona uma foto, o card "Tipográfico" passa a exibir a foto como fundo de visualização na prévia (com um leve escurecimento de contraste de 25%).
  - Na exportação como **PNG transparente**, a foto **não é desenhada**: o canvas executa `clearRect` e grava exclusivamente o conteúdo do adesivo, mantendo o fundo 100% transparente com canal Alpha ativo.

### 1.5. Ritmo derivado dinamicamente com convenção declarada (Achado 5)
- **Problema anterior**: O ritmo do cenário cardio estava com valor estático copiado (`7'23"/km`), sem fórmula explícita.
- **Correção implementada**: Implementada a função `derivarRitmo(duracaoMin, duracaoSeg, distanciaKm)`:
  - Converte tempo total em segundos: $44\times 60 + 47 = 2.687\text{ s}$.
  - Divide pela distância: $2.687 / 6,07 = 442,6688\dots\text{ s/km}$.
  - **Convenção declarada**: arredondamento ao segundo mais próximo (`Math.round`), resultando em 443 segundos = 7 minutos e 23 segundos por km.
  - Formatação padronizada: `7'23"/km`.

---

## 2. Resumo dos Ajustes da Segunda Entrega (Novos Apontamentos do Codex)

### 2.1. Espaçamento vertical e limites justos no Adesivo Tipográfico (Ponto 1)
- **Problema anterior**: Em `exemplos/adesivo-preto-musculacao.png`, os rótulos ("Volume total", "Exercícios", "Séries") encostavam nos números anteriores devido a uma distância fixa de apenas 20px entre a linha de base do valor e a linha de base do próximo rótulo. Além disso, o adesivo era exportado em um canvas 1080×1920 com grande área vazia transparente ao redor.
- **Correções implementadas**:
  - **Reserva real de descendentes e intervalo visível**: A métrica de layout calcula a descida real do valor (`actualBoundingBoxDescent`), soma um intervalo visível limpo de **34px** e adiciona a subida do rótulo seguinte (`actualBoundingBoxAscent`), garantindo que nenhuma haste ou curva inferior colida com o texto superior da legenda.
  - **Distribuição vertical dinâmica**: Em vez de ancorar rigidamente em `H * 0.46`, a altura total do bloco de métricas é pré-calculada e o conjunto é centralizado e distribuído proporcionalmente na área útil.
  - **Exportação com limites justos (Tight Bounds)**: A exportação do adesivo calcula a caixa delimitadora (`boundingBox`) de todo o conteúdo desenhado e adiciona um padding seguro de 36px. O adesivo transparente de musculação é exportado em **349×637** (em vez de 1080×1920), e o de sessão curta em **302×796**, eliminando áreas transparentes invisíveis que bloqueiam toques quando o adesivo é colado no Instagram Stories.

### 2.2. Afastamento da legenda QUILÔMETROS dos descendentes em Editorial Cardio (Ponto 2)
- **Problema anterior**: Em `exemplos/card-editorial-cardio.png`, o texto "QUILÔMETROS" ficava muito próximo da linha de base de "6,07", invadindo a área do descendente da vírgula.
- **Correções implementadas**:
  - A posição vertical da legenda agora mede explicitamente a descida real do número (`actualBoundingBoxDescent` de `6,07`, onde a vírgula avança ~38px abaixo da linha de base).
  - É somado um intervalo livre de **26px** acima da altura de subida (`actualBoundingBoxAscent`) de `QUILÔMETROS`, assegurando folga visual confortável e elegante.
  - Cenários de `00:51` e `48:37` também foram recalculados com medição dinâmica de caixas delimitadoras.

### 2.3. Foto de teste sintética limpa sem textos pré-impressos (Ponto 3)
- **Problema anterior**: Em `exemplos/card-foto-com-foto-musculacao.png`, a foto de teste usada era um recorte da prancha conceitual que já continha marca d'água, métricas e moldura pré-impressas, gerando sobreposição confusa de dados na evidência.
- **Correções implementadas**:
  - Criada a imagem sintética de teste [`revisao/prototipo-cards/foto-teste.png`](file:///C:/Users/breno/Documents/Codex/2026-10-05/ol/outputs/vida-em-dia/revisao/prototipo-cards/foto-teste.png) em 1080×1920, simulando iluminação ambiente de treino, profundidade de campo e bokeh, **totalmente livre de textos, logotipos ou métricas**.
  - O PNG exportado `card-foto-com-foto-musculacao.png` e a captura de tela `screenshot-prototipo-com-foto.png` agora evidenciam exclusivamente os dados gerados pelo protótipo sobre a imagem de fundo.

### 2.4. Alternativa Editorial quando sem foto no card Foto (Ponto 4)
- **Problema anterior**: Em `exemplos/card-foto-musculacao.png`, quando nenhuma foto era carregada pelo usuário, o modelo apenas trocava a paleta, mantendo os dados comprimidos no rodapé e uma enorme área vazia marfim no topo.
- **Correções implementadas**:
  - A função `drawFoto` foi ajustada para verificar se há foto carregada (`userPhotoImg`). Caso não haja, ela delega diretamente para `drawEditorial(ctx, s, W, H)`, aplicando a composição editorial completa no fundo marfim com tipografia de destaque e equilíbrio visual pleno.

### 2.5. Relocação do Script de Automação e Verificação
- O script de validação foi movido de `revisao/verificar-prototipo.mjs` para [`revisao/prototipo-cards/verificar-prototipo.mjs`](file:///C:/Users/breno/Documents/Codex/2026-10-05/ol/outputs/vida-em-dia/revisao/prototipo-cards/verificar-prototipo.mjs), mantendo todos os arquivos do protótipo contidos rigorosamente em sua subpasta.

---

## 3. Evidências de Validação em Navegador Real (Edge Headless via CDP)

Para garantir verificação independente sem depender de declarações não comprovadas, foi executado o script `revisao/prototipo-cards/verificar-prototipo.mjs`, que acionou o Microsoft Edge (`Edg/155.0.4283.62`) em modo headless via Chrome DevTools Protocol (CDP), capturou screenshots da interface real e exportou todos os modelos.

### 3.1. Screenshots da Interface
- [`revisao/prototipo-cards/screenshot-prototipo-edge.png`](file:///C:/Users/breno/Documents/Codex/2026-10-05/ol/outputs/vida-em-dia/revisao/prototipo-cards/screenshot-prototipo-edge.png): captura real da página com os 3 modelos exibindo "48:37", "4.250 kg" e layout alinhado sem foto.
- [`revisao/prototipo-cards/screenshot-prototipo-com-foto.png`](file:///C:/Users/breno/Documents/Codex/2026-10-05/ol/outputs/vida-em-dia/revisao/prototipo-cards/screenshot-prototipo-com-foto.png): captura real com foto limpa carregada em memória, demonstrando o adesivo tipográfico sobreposto à foto na prévia e o card Foto composto.

### 3.2. Arquivos PNG Exportados em `revisao/prototipo-cards/exemplos/`
Foram gerados e salvos 9 arquivos reais para inspeção direta:
1. `adesivo-transparente-musculacao.png`: adesivo com limites justos (349×637), texto claro e fundo 100% transparente.
2. `adesivo-transparente-sessao-curta.png`: adesivo da sessão de 00:51 com limites justos (302×796) transparente.
3. `adesivo-preto-musculacao.png`: adesivo com limites justos (349×637), espaçamento de 34px entre valores e rótulos, e fundo preto sólido.
4. `card-foto-musculacao.png`: modelo Foto sem foto (delega para Editorial marfim, 1080×1920).
5. `card-foto-com-foto-musculacao.png`: modelo Foto com foto sintética limpa (1080×1920, sem texto duplicado).
6. `card-editorial-musculacao.png`: Editorial com "48:37", "4.250 kg" e "6 exercícios | 18 séries" (1080×1920).
7. `card-editorial-cardio.png`: Editorial com "6,07 QUILÔMETROS" (espaçamento seguro contra descendente da vírgula), "44:47 Duração", "609 kcal | 6.728 passos" (1080×1920).
8. `card-editorial-sessao-curta.png`: Editorial com "00:51", "42 Repetições", "1 exercício | 3 séries" (1080×1920).
9. `card-editorial-poucos-dados.png`: Editorial com "12:09", "1 exercício | 2 séries" (1080×1920).

### 3.3. Verificação Binária Atualizada do Canal Alpha (Pós-Recorte Justo)
Foi inspecionado o fluxo binário dos arquivos descomprimindo os blocos `IDAT` e desfazendo a filtragem preditiva PNG (filtros *None*, *Sub*, *Up*, *Average*, *Paeth*), pixel por pixel:

| Arquivo | Modelo | Cenário | Largura x Altura | Color Type | Pixels Alpha = 0 (Transparente) | Pixels Alpha > 0 (Opaco/Tinta) | Transparência Real |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `adesivo-transparente-musculacao.png` | Tipográfico | musculação | **349x637** | RGBA (tipo 6) | **194.540** (87,51%) | **27.773** (12,49%) | **SIM (Alpha ativo, recorte justo)** |
| `adesivo-transparente-sessao-curta.png` | Tipográfico | sessão curta | **302x796** | RGBA (tipo 6) | **215.438** (89,62%) | **24.954** (10,38%) | **SIM (Alpha ativo, recorte justo)** |
| `adesivo-preto-musculacao.png` | Tipográfico | musculação | **349x637** | RGBA (tipo 6) | **0** | **222.313** (100%) | **NÃO (Opaco, recorte justo)** |
| `card-foto-musculacao.png` | Foto | musculação | 1080x1920 | RGBA (tipo 6) | **0** | **2.073.600** (100%) | **NÃO (Opaco, Editorial marfim)** |
| `card-editorial-musculacao.png` | Editorial | musculação | 1080x1920 | RGBA (tipo 6) | **0** | **2.073.600** (100%) | **NÃO (Opaco)** |
| `card-editorial-cardio.png` | Editorial | cardio | 1080x1920 | RGBA (tipo 6) | **0** | **2.073.600** (100%) | **NÃO (Opaco)** |
| `card-editorial-sessao-curta.png` | Editorial | sessão curta | 1080x1920 | RGBA (tipo 6) | **0** | **2.073.600** (100%) | **NÃO (Opaco)** |
| `card-editorial-poucos-dados.png` | Editorial | poucos dados | 1080x1920 | RGBA (tipo 6) | **0** | **2.073.600** (100%) | **NÃO (Opaco)** |
| `card-foto-com-foto-musculacao.png` | Foto | musculação | 1080x1920 | RGBA (tipo 6) | **0** | **2.073.600** (100%) | **NÃO (Opaco, fundo limpo)** |

> **Comprovação**:
> - O adesivo transparente exporta exclusivamente a área delimitada do conteúdo com 36px de padding, mantendo o canal alpha ativo (87%–89% de transparência e 10%–12% de tinta nítida).
> - Quando uma foto está visível no preview na tela, a exportação transparente continua zerando 100% dos pixels de fundo.
> - `card-foto-musculacao.png` sem foto agora gera exatamente a mesma composição editorial marfim que `card-editorial-musculacao.png`.

---

## 4. Como Abrir e Testar

O protótipo é autocontido e não requer internet, build ou dependências:

1. Abrir [`revisao/prototipo-cards/index.html`](file:///C:/Users/breno/Documents/Codex/2026-10-05/ol/outputs/vida-em-dia/revisao/prototipo-cards/index.html) em qualquer navegador (duplo clique ou arrastar).
2. Alternar os 4 cenários pelo seletor (*Musculação*, *Sessão curta*, *Poucos dados*, *Cardio*).
3. Carregar qualquer foto local para verificar a composição do adesivo e do modelo Foto.
4. Clicar em qualquer card para ver em tela cheia na proporção 9:16.
5. Clicar em "Baixar PNG transparente" ou "Baixar PNG" para inspecionar os arquivos gerados.

Para reexecutar a bateria automatizada de captura e validação binária de PNGs:
```powershell
node revisao/prototipo-cards/verificar-prototipo.mjs
```

---

## 5. Limitações e Riscos

1. **Colagem física no Instagram**: A geração do PNG com canal alpha foi matematicamente confirmada no nível binário e recortada para limites justos, mas o comportamento ao colar no editor de Stories do Instagram (especialmente no iOS clipboard vs salvar na galeria) depende do suporte do aplicativo hospedeiro no smartphone do usuário.
2. **Ambiente isolado**: O protótipo continua estritamente em `revisao/prototipo-cards/`, sem qualquer integração em `src/`. A integração no app deverá ser conduzida pelo Codex após a aprovação visual do usuário.
3. **Controle de versão**: Nenhum commit ou push foi realizado. As alterações em `.gitignore` permanecem preservadas.
