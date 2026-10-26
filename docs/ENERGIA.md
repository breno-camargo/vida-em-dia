# Perfil energético

Implementação local em 25/10/2026. Acesso em Comida → Seu gasto estimado hoje → Configurar ou Configurações → Metabolismo e alimentação.

## Cálculos e limites

- Gasto energético em repouso estimado por Mifflin–St Jeor, equação simplificada: 10 × peso (kg) + 6,25 × altura (cm) − 5 × idade completa (anos), com +5 na equação masculina ou −161 na feminina.
- O estudo original abrange adultos de 19 a 78 anos. Esta implementação atende essa faixa; não extrapola automaticamente para menores ou pessoas acima dela. Não atende gestação e lactação.
- Isso estima REE (repouso), não mede diretamente metabolismo basal.
- Peso: último registro válido com peso em Medidas, até hoje. Ignora registros futuros, removidos ou sem peso; usa desempate por atualização. O formulário permite abrir Medidas para registrar o peso sem criar um segundo campo de peso independente.
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

## Verificação local

320 testes em 56 arquivos passaram, incluindo equações masculina/feminina, aniversário, dados inválidos, seleção do peso, persistência e backup sem alterar automaticamente as metas. Build e lint passaram. Conferência em Edge 390×844, claro/escuro, com dados sintéticos: perfil sem peso, fórmula, metas manuais, treino sem duplicação, atualização de peso, recarga e atalho para Medidas. Evidências no diretório irmão vida-em-dia-evidencias/alimentacao-manual-20261025, arquivo energia-resultado.json e ferramenta conferir-energia.cjs. Conferência no iPhone e sincronização real entre aparelhos ainda pendentes. Sem publicação neste lote.
