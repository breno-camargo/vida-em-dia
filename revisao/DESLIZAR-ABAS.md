# Navegação por deslize — 24/10/2026

Implementada somente na cópia. Deslizar à esquerda avança e à direita volta na sequência Hoje → Treino → Comida → Medidas → Evolução. A barra inferior usa a mesma sequência centralizada. Não há volta circular nos extremos.

O gesto usa um dedo, deslocamento horizontal mínimo adaptado à largura (64–96px), predominância horizontal e duração de até 800ms. Rolagem vertical não é bloqueada. As bordas de 24px ficam reservadas à navegação nativa do navegador. Não foi imposto touch-action pan-y ao main, para não quebrar as faixas horizontais.

Não navega em configurações, com modal aberto, com campo em edição, sobre seletores/rodas, barras de abas, faixas de modelos/músculos, gráficos ou qualquer ancestral rolável horizontalmente. Gestos cancelados e multitoque são ignorados. Um deslize sobre botão não deve gerar clique; um novo toque libera imediatamente a próxima ação, sem espera artificial.

O gesto chama a mesma navegação da barra. Treinos continuam persistidos; ao voltar, a sessão pode ser retomada pelo botão Continuar treino. Não foi criada montagem permanente das páginas nem alteradas regras de salvamento. Transição existente de 120ms e preferência de movimento reduzido preservadas.

## Verificação

- Três testes de limiar, direção, sequência, extremos e gestos inválidos adicionados; suíte completa passou com 278 testes em 46 arquivos.
- `node revisao/conferir-deslize-abas.cjs [origem]`: toque emulado real via CDP, com e sem movimento reduzido; sequência completa nos dois sentidos; limites, gesto curto, vertical, bordas, cancelamento/multitoque; prevenção de clique acidental e toque seguinte; configurações, filtros horizontais, campo editado, modal/rodas; sessão com série concluída preservada.
- Fluxo também passou em `http://192.168.0.14:5181`, sem exigir APIs de contexto seguro.
- Tipos, lint e build passaram.

Limite: validação com Chromium e emulação de toque; testar a sensação do gesto no iPhone físico conectado ao servidor Wi-Fi. Nenhuma alteração no projeto ativo e nenhuma publicação.
