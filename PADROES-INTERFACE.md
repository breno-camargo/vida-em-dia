# Padrões de interface — Vida em Dia

Definidos em 18/10/2026 por solicitação do usuário. Aplicar em entregas de Codex e Gemini.

## Fonte compartilhada

`src/estilos/controles.css`, importado após index.css em main.tsx. As variáveis --controle-* centralizam cor, tamanho, raio e tipografia. Componentes/telas devem reutilizar `.botao-principal` e `.botao-secundario`. Não criar outra cor, raio ou tamanho local para a mesma função. Ao alterar o padrão, editar este arquivo e conferir os consumidores.

## Botões

- Principal: criar, registrar, salvar, confirmar, iniciar ou continuar a ação central. Verde claro, texto escuro, altura mínima 48 px, raio 12 px, fonte 13 px/600, espaçamento interno 12×16 px e 8 px entre ícone/texto. Ações equivalentes Nova ficha/Registrar usam o mesmo estilo.
- Secundário: ações de apoio e acesso alternativo, fundo verde escuro, borda e texto claro; mesmas dimensões/tipografia. Na ficha ativa, Continuar secundário complementa a ação principal de retomada no topo.
- Destrutivo: sem verde de confirmação; tom discreto avermelhado e descrição inequívoca. Preservar os tratamentos existentes de Remover, Cancelar treino e Sair; não converter em principal ao aplicar classes.
- Ícone isolado: alvos de pelo menos 44 px, com rótulo acessível. Fechar e menus seguem esse padrão.
- Desabilitado: cor atenuada e sem aparência acionável; foco de teclado visível nos controles habilitados.
- Largura depende do contexto: cadastro no cabeçalho é compacto; ações de formulário/cards podem ocupar a linha. A hierarquia visual e altura permanecem iguais. Botões com seta final indicam continuidade; ícone inicial identifica a ação.

## Troca de conteúdo

Navegação inferior: troca direta de página, sem fade parcial ou deslize; título e conteúdo mudam juntos. Retorno ao topo após a atualização do DOM, antes da pintura, com rolagem instantânea. Tocar na página já ativa não reinicia o conteúdo. Apenas cores do botão de navegação transitam em 120 ms, respeitando redução de movimento. Abas internas mantêm seu efeito curto de opacidade.

Treino/Exercícios/Cardio, Resumo/Evolução/Histórico, filtros Todos/Por músculo/Cardio, carga/volume e Rolar/Digitar compartilham barra segmentada. Fundo verde escuro, contorno discreto, raio externo 16 px, selecionado verde claro com texto escuro, altura mínima de item 44 px, fonte 12 px/600. Usar estado semântico existente (aria-pressed ou aria-selected) e rótulos claros. Nenhum conteúdo é salvo apenas por trocar de aba/modo.

Filtros de grupos musculares continuam em faixa horizontal com espaço entre botões e barra de rolagem, conforme preferência explícita do usuário. Navegação principal inferior mantém seu tratamento próprio, por função e posição diferentes das barras de conteúdo.

## Interruptores binários e seletores

Configurações ligado/desligado usam o mesmo interruptor de trilha 44×26 px, com alvo do rótulo de pelo menos 48 px e nome acessível. Não usar esse controle para trocar páginas.

Seletores numéricos mantêm Rolar/Digitar e confirmação explícita. Campos opcionais oferecem ausência separada de zero; Salvar do formulário continua necessário. Peso: kg/g (3 casas); medidas em cm (até 2 casas, com duas rodas decimais); cardio duração min/seg; distância km/metros com dígitos; demais campos conforme domínio existente. O padrão de aparência não pode reduzir precisão ou alterar cálculos/dados.

## Verificação em novas entregas

Conferir consistência com uma tela existente, foco/disabled, toque mobile e textos longos. A existência de lint/build verdes não substitui conferência visual no aparelho. Evitar acrescentar mais uma regra local em index.css para corrigir aparência já coberta pelo padrão compartilhado.
## Movimento e transições

Abas e conteúdo: aparição por opacidade de 120 ms, sem translate/deslize lateral, escala ou animação de altura. Estados dos controles mudam por cor em 120 ms. Painéis e backdrop aparecem em 160 ms. TransicaoConteudo anima apenas quando a chave da navegação muda, cancela uma animação anterior e não usa key para remontar filhos. Formulários/foco não devem ser reiniciados só para criar efeito. A preferência prefers-reduced-motion remove esses efeitos e o deslocamento suave dos seletores. Gestos de arrastar painel e rolar números continuam acompanhando diretamente a interação; indicadores de espera/sync mantêm suas regras próprias de redução de movimento.
