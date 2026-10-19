# Tarefa delimitada ao Gemini — seletores numéricos de cardio

Solicitada pelo usuário em 18/10/2026. **Preparada para encaminhamento; não há execução automática no painel Gemini.** Codex revisará antes de aceitar. Não editar os arquivos desta tarefa simultaneamente com Codex.

Leia AGENTS.md, README.md, CONTINUAR-AMANHA.md e revisao/PLANO.md. Faça somente a melhoria de interação dos seletores de cardio; não continuar outras etapas, modificar sincronização/SQL, publicar ou tocar em dados reais/segredos/.gitignore.

## Problema e resultado desejado

Frequência cardíaca começa em zero, e chegar a 120 exige rolar muitas posições. Duração, distância, kcal, passos, velocidade e inclinação também são lentos. Usuário quer todos esses menus mais rápidos, preservando o visual de rolagem e confirmação explícita. Não definir valores fisiológicos presumidos nem preencher automaticamente valores ausentes.

- Manter rolagem como experiência padrão, com opção complementar Digitar para usar teclado numérico/decimal. A alternância só muda o rascunho; Confirmar é obrigatório. Não substituir por select nativo.
- Permitir saltos rápidos para ajustar o rascunho sem precisar percorrer dezenas de posições. Passos de interação sugeridos: duração ±5 min, distância ±1 km, velocidade ±1 km/h, inclinação ±1 ponto percentual, frequência ±10 bpm, kcal ±100, passos ±1000. São incrementos de navegação, não metas/recomendações. Manter precisão fina existente, inclusive décimos e passos inteiros.
- Digitar 120 nos campos de frequência deve exigir somente abrir Digitar, preencher e Confirmar. Não impor um valor inicial 120 a registros ausentes.
- Corrigir sincronia entre teclado, rodas e atalhos: todos devem mostrar o mesmo rascunho, inclusive ao alternar modos. Um valor existente deve abrir exatamente onde foi salvo.
- Diminuir espaço vazio se possível, manter alvos de toque de pelo menos 44 px, rótulos com unidade, foco/teclado sem confirmação involuntária do formulário pai.
- Não informar continua significando undefined; zero não pode substituir ausência. Duração precisa ser positiva; velocidade e frequência, se informadas, positivas. Distância/kcal/passos/inclinação continuam com regras existentes. Limites de EditorCardio e validação de salvarCardio permanecem válidos.
- Aceitar vírgula e ponto decimal somente para campos com decimal, até um dígito decimal como atualmente. Rejeitar texto vazio como confirmação, NaN, infinito, sinal negativo, notação exponencial, excesso de precisão/limite e fracionário em campo inteiro. Não truncar/corrigir silenciosamente um valor inválido. Exibir erro e preservar rascunho.
- Fechar/cancelar o seletor não aplica nada. Confirmar altera apenas o rascunho do EditorCardio; Salvar do formulário continua necessário para persistir.

## Arquivos permitidos

- src/componentes/SelecionarNumero.tsx: componente compartilhado, adicionar props opcionais para habilitar melhorias no cardio e manter os demais consumidores com o comportamento anterior por padrão.
- src/componentes/EditorCardio.tsx: configurações específicas de cada campo, mantendo dados/validações/fluxos existentes.
- src/componentes/Rolagem.tsx: somente se indispensável para sincronizar alterações programáticas, com compatibilidade explícita para consumidores existentes. Hoje inicial é capturado em useRef uma vez; apenas mudar inicial não reposiciona a roda. Não criar loop de remontagem a cada onScroll nem perder a seleção.
- src/index.css: estilos estritamente limitados aos novos controles; preservar filtros com rolagem horizontal e outras telas.
- Utilitário puro novo de parsing/rascunho e respectivos testes se útil; testes de componente pertinentes. Não instalar dependências sem necessidade.
- Relatório revisao/GEMINI-SELETORES-CARDIO.md.

Evitar mudanças em banco, modelos, tipos de cardio, METs e histórico. O tipo de cardio agora tem 27 opções; não reverter essa ampliação. Outros consumidores de SelecionarNumero incluem backup, atividade e configurações; sua interface não deve mudar involuntariamente.

## Evidências de aceitação

Testar valor existente; 120 bpm digitado; 12,5 e 12.5 nos decimais; 120,5 rejeitado para bpm; ausência e Não informar; limites superiores/inferiores; negativos/texto/vazio; alternância roda/teclado/atalhos; fechamento sem aplicar; confirmação única sem submit do pai; consumidor antigo sem props novas. Não escrever testes que só copiem a implementação. Testes de interação podem ser limitados pelas dependências atuais: documentar explicitamente o que não foi executado.

Executar npm.cmd test, npm.cmd run lint e npm.cmd run build. Relatório deve informar arquivos, comportamento, validação e riscos/limitações. Não afirmar validação visual no celular ou teste E2E se não ocorreu. Não fazer commit, push, deploy ou SQL remoto. Entregar para revisão Codex.
