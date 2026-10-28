# Perfil energético

## Alteração local em 26/10/2026 — ainda não publicada

Atualização local em 28/10/2026: acrescentada a rotina Sedentária (1,2 × repouso), com referência na [calculadora do MOHAP](https://mohap.gov.ae/ar/awareness-centre/daily-calorie-requirements-calculator). Não é garantia de manutenção individual. As opções anteriores e seus fatores permanecem; nenhuma escolha salva é convertida automaticamente. Apenas repouso mostra o gasto em repouso sem gerar referência de manutenção. A opção sedentária é aceita no backup e usa o transporte de configuração existente.

Sem meta manual positiva para o tipo do dia, o diário usa o gasto estimado com a rotina como **Referência estimada de manutenção**. Exige perfil completo, peso válido e rotina informada; a basal sozinha não vira referência. A meta manual sempre tem prioridade e não é preenchida nem substituída pelo cálculo.

Ao usar Comida, o valor e a origem da referência de hoje são guardados em `consumo_diario_meta`. Peso/perfil podem atualizar hoje; dias anteriores usam somente o valor registrado, sem reconstrução retroativa com dados atuais. Dias antigos sem snapshot ficam sem referência. Os registros nutricionais permanecem intactos. Esta regra local substitui, nesta versão, as descrições históricas sobre ausência de snapshots abaixo.

Implementada em 25/10/2026 e publicada na main pelo PR #3 em 26/10/2026, apos aprovacao do usuario. Acesso em Comida → Seu gasto estimado hoje → Configurar ou Configurações → Metabolismo e alimentação.

## Cálculos e limites

- Gasto energético em repouso estimado por Mifflin–St Jeor, equação simplificada: 10 × peso (kg) + 6,25 × altura (cm) − 5 × idade completa (anos), com +5 na equação masculina ou −161 na feminina.
- O estudo original abrange adultos de 19 a 78 anos. Esta implementação atende essa faixa; não extrapola automaticamente para menores ou pessoas acima dela. Não atende gestação e lactação.
- Isso estima REE (repouso), não mede diretamente metabolismo basal.
- Peso: último registro válido com peso em Medidas, até hoje. Ignora registros futuros, removidos ou sem peso; usa desempate por atualização. O formulario abre Registrar medidas em uma janela, sem trocar de aba, para registrar o peso sem criar um segundo campo de peso independente.
- Gasto diário opcional: REE × fator de rotina. Valores aproximados do app: pouco ativa 1,55; moderada 1,85; intensa 2,20, escolhidos como pontos centrais dos intervalos de PAL da FAO/WHO/UNU. Aplicar esses fatores ao REE previsto é aproximação de planejamento; não é validação conjunta dos dois métodos nem medição individual.
- Calcula a multiplicação antes de arredondar a apresentação para kcal inteiras. Não adiciona calorias de treino, cardio ou passos ao produto, pois a rotina escolhida já inclui atividade.
- Na ausência de dados obrigatórios, não produz resultado; sem rotina, mostra só repouso. Não assume sexo nem rotina padrão.

## Metas e dados

- Metas alimentares são manuais e opcionais, para dias úteis e fins de semana/feriados. Zero ou vazio significa sem meta; nenhum déficit/superávit é prescrito ou preenchido pelo cálculo.
- Resumo é explicitamente de hoje, mesmo ao consultar diário alimentar de outra data. Não recalcula metas de dias passados nem altera registros de atividade ou consumo.
- Campos opcionais em configurações: data_nascimento, sexo_calculo_energia, nivel_atividade_energia; altura_cm e metas existentes são reutilizadas. Usa o isolamento de perfil, backup e transporte de sincronização já existentes. Sem migração SQL ou execução remota.
- Fonte de cálculo em src/dados/energia.ts; interface compartilhada em src/componentes/PerfilEnergia.tsx; testes em src/dados/energia.test.ts.

## Referências

- [Mifflin et al., 1990 — registro do estudo](https://pubmed.ncbi.nlm.nih.gov/2305711/).
- [Cópia do artigo original](https://www.carnotdiet.com/Files/BMRMifflin1990.pdf).
- [FAO/WHO/UNU — Human energy requirements, atividade em adultos](https://www.fao.org/4/Y5686e/y5686e07.htm).

## Verificacao e estado atual

320 testes em 56 arquivos passaram, incluindo equações masculina/feminina, aniversário, dados inválidos, seleção do peso, persistência e backup sem alterar automaticamente as metas. Build e lint passaram. Conferência em Edge 390×844, claro/escuro, com dados sintéticos: perfil sem peso, fórmula, metas manuais, treino sem duplicação, atualização de peso, recarga e atalho para Medidas. Evidências no diretório irmão vida-em-dia-evidencias/alimentacao-manual-20261025, arquivo energia-resultado.json e ferramenta conferir-energia.cjs. Conferência no iPhone e sincronização real entre aparelhos ainda pendentes. Sem publicação neste lote.

Atualizacao em 26/10/2026: 322 testes em 56 arquivos, typecheck, lint e build passaram antes da publicacao. Cada escolha do perfil salva individualmente; o aviso Salvo expira em 3 segundos. Os totais do diario usam a meta da data selecionada, enquanto o card de gasto estimado continua sendo de hoje. As metas atuais nao sao snapshots historicos: editar uma meta pode mudar a comparacao de um diario antigo, sem mudar seus alimentos ou nutrientes. Evidencias locais foram arquivadas em ol/arquivo-local/2026-10-26/vida-em-dia-evidencias/. Homologacao remota entre aparelhos e capacidade simultanea continuam pendentes.
