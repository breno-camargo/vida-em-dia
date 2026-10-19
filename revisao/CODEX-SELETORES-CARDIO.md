# Revisão Codex — seletores de cardio — 18/10/2026

**Entrega aprovada com correções do Codex**, limitada à implementação e validação automatizada disponíveis; interação/rolagem real no celular ainda pendente.

## Achados na entrega e correções

1. Rolagem recebia valor controlado para a seleção, mas o efeito de montagem posicionava pelo inicial antigo. Ao digitar 120 e voltar à roda, a seleção anunciada podia ser 120 enquanto a posição visual iniciava em zero. `inicio` agora captura `valor ?? inicial`. Também removida a supressão de scroll por timer fixo de 350 ms, que podia ignorar um gesto real, ficar ativa após interrupção ou terminar antes de uma animação longa. Saltos externos posicionam imediatamente por scrollTop; eventos no mesmo valor não geram callback redundante. Consumidores sem valor continuam com estado interno.
2. aplicarSalto ignorava parsing inválido e reaproveitava o número anterior, apagando erro/texto silenciosamente. Extraído saltoNumero com validação antes de alterar qualquer rascunho, limites e arredondamento. Voltar de Digitar para Rolar também rejeita texto vazio/inválido, em vez de ressuscitar valor anterior.
3. Testes e relatório: os testes de componente usam renderToStaticMarkup, não JSDOM. Não executam cliques, Enter, teclado ou scroll. O último teste apenas chamava uma função mock criada pelo próprio teste, sem montar/exercitar componente; foi removido. Acrescentadas duas regressões úteis de saltos com texto inválido, frações e limites. Não considerar alegações de interação do relatório Gemini como evidência executada.

O parser existente aceita ponto/vírgula com uma casa e restringe inteiros e limites. EditorCardio habilita a melhoria nos oito campos com passos/mínimos específicos; não altera banco nem estimativas. Rolagem permanece a experiência padrão e a aplicação exige confirmação. Cancelar não executa confirmar por desenho dos callbacks; teste real de interação ainda necessário. Outros consumidores sem props novas preservam o modo antigo.

## Ajuste visual autorizado após a entrega

Conforme pedido anterior do usuário, removido o atalho Esteira redundante, deixando Registrar cardio em largura total. Resumo semanal com métricas mais compactas. Formulário com duração destacada, distância/calorias juntas e texto inicial menor. Opcionais divididos em Movimento e Frequência cardíaca, mantendo média/máxima lado a lado, além de vínculo e observação. Não altera persistência ou campos obrigatórios.

## Validação e limitações

**146 testes em 19 arquivos, lint e build passaram** após ajustes. Testes usam dados sintéticos. Nenhuma publicação, SQL remoto, commit ou modificação de dados reais. Conferir no aparelho: digitar 120 bpm, alternar para Rolar e verificar posição, saltos e gesto imediatamente após salto, retorno de erro preservando texto, decimais, consumidores antigos (backup/atividade), Enter sem submit do pai, Não informar e fechar sem aplicar. Não afirmar homologação mobile ou acessibilidade completa das abas com base em HTML estático.
