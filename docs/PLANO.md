# Plano de evolução — Vida em Dia

Atualizado em 26/10/2026. Referência atual das etapas; o [histórico](HISTORICO.md) preserva entregas anteriores.

## Estado atual

O novo visual está na main. Treinos, fichas, cardio, medidas, histórico, backup, conta e sincronização possuem implementação. Os temas claro, escuro e automático e boa parte do acabamento mobile foram antecipados.

Publicação, implementação e homologação são estados diferentes. O histórico registra a etapa 8 como homologada em produção; ainda é necessário reunir as evidências do checklist completo entre aparelhos. Não presumir aprovação de todos os cenários apenas porque o app está publicado.

## Etapas e pendências

| Etapa | Escopo | Situação |
| --- | --- | --- |
| 1 | Base e PWA | Implementada e aprovada historicamente. Manter verificação de instalação, atualização e abertura offline. |
| 2 | Biblioteca e fichas | Implementada: catálogo ampliável, busca, filtros, criação, edição, duplicação e ordenação. Demonstrações completas ficam na etapa 14. |
| 3 | Execução de treino | Implementada: séries, cargas, descanso, treino livre e tela ligada. Bipes confirmados em primeiro plano; som em segundo plano no iPhone não é garantido. |
| 4 | Histórico e evolução | Implementada: sessões, métricas, gráficos e compartilhamento. Preservar modelos de cards aprovados. |
| 5 | Peso e medidas | Implementada: registro, edição, comparação, histórico e gráficos. Fotos e indicadores adicionais permanecem abaixo. |
| 6 | Cardio e atividade | Implementada: sessões, passos/calorias manuais, metas e calendário de descanso. Integração com Saúde é uma evolução separada. |
| 7 | Backup e proteção | Implementada: exportação, restauração, criptografia e lembretes. Incluir fotos no backup para preservá-las. |
| 8 | Conta e sincronização | Implementada e publicada. Consolidar evidências de dois aparelhos, reconexão, conflitos, restauração e isolamento entre contas. Fotos não sincronizam. |
| 9 | Alimentação e chat | Entrega manual publicada e aprovada pelo usuário em 26/10/2026: diário manual, alimentos pessoais, refeição com vários itens, sódio, busca direta, edição/exclusão e seis referências TACO. Perfil energético com gasto em repouso, estimativa pela rotina e metas alimentares manuais. Ampliação do catálogo e teste de carga em ambiente separado pendentes. IA por texto fica para depois. |
| 10 | Escopo original não localizado | Confirmar a descrição original antes de iniciar ou renumerar. Não atribuir uma função por suposição. |
| 11 | Fotos | Pendente: galeria de progresso, vínculo com medidas e sincronização de imagens. Fotos locais de equipamentos e backup já existem. |
| 12 | Meta de peso e indicadores | Pendente: interface e acompanhamento da meta de peso e IMC. Campos no modelo não significam funcionalidade concluída. |
| 13 | Experiência e acabamento | Parcialmente antecipada: temas e refinamentos mobile implementados. Falta tutorial inicial com pular, conclusão por usuário e opção de rever. |
| 14 | Demonstração dos exercícios | Pendente: conteúdo visual de execução/anatomia, imagens ou animações, com origem e licença verificadas. Ajuda textual, fotos próprias e links de vídeo já existem. |

## Próxima sequência proposta

1. Executar verificacoes locais de sincronizacao, isolamento, backup e volume de registros com dados sinteticos.
2. Criar um projeto Supabase exclusivo para testes e preparar a homologacao entre dois aparelhos.
3. Medir carga progressiva nesse ambiente separado, sem atingir producao. Roteiro em [TESTES-CONFIABILIDADE.md](TESTES-CONFIABILIDADE.md).
4. Ampliar o catalogo alimentar e avaliar refeicoes habituais; IA permanece para uma entrega posterior.
5. Planejar fotos, indicadores, tutorial e demonstracoes em lotes separados.

Esta ordem não autoriza iniciar todas as etapas de uma vez. Confirmar o escopo antes de cada entrega.

## Critérios de conclusão das próximas entregas

### Conta e sincronização

- Enviar e receber registros na mesma conta entre dois aparelhos.
- Editar offline, reconectar e repetir sincronização sem duplicações.
- Resolver conflitos por data e conferir exclusão/desfazer nos dois aparelhos.
- Conferir saída, troca entre duas contas e isolamento sem sessão.
- Testar restauração e retomada da sincronização com dados sintéticos.
- Registrar recuperação de senha, código inválido/expirado e nova senha.
- Consolidar evidências do [checklist do Supabase](../supabase/CONFIGURAR.md), distinguindo testes automatizados e validação real.

### Água por garrafas ? implementada

- Capacidade da garrafa e meta diaria configuraveis, registro rapido e desfazer a ultima garrafa.
- Alterar a capacidade nao recalcula volumes anteriores; dados integrados a persistencia e backup.
- O card mostra registros reais. Repetir validacao de sincronizacao entre aparelhos no ambiente separado.

### Alimentação e chat

- Perfil energético: fórmula de Mifflin–St Jeor para adultos de 19 a 78 anos, com último peso válido de Medidas, nascimento, sexo usado na equação e altura. Rotina opcional estima gasto diário sem somar novamente treino/cardio/passos. Metas alimentares continuam manuais e separadas. Detalhes em [ENERGIA.md](ENERGIA.md).
- Exclusão local: alimentos pessoais usam exclusão lógica; pré-cadastrados podem ser removidos apenas do catálogo do perfil e restaurados. Refeições preservam seus snapshots e são desvinculadas do cadastro removido para continuarem no backup. Lista de referências ocultas é persistida nas configurações do perfil.
- Montagem de refeição publicada: adicionar vários alimentos, ajustar/remover itens do rascunho, revisar totais e salvar todos em uma transação. Depois, editar/remover cada registro ou complementar a refeição. Rascunho fica apenas na tela durante a sessão; recarregar não salva o que ainda não foi confirmado.
- Cadastro pessoal: edição de nome, marca opcional, porção e nutrientes; referências comuns permitem criar cópia pessoal. Alterações não recalculam refeições antigas. Edição concorrente ou de item removido é recusada. Publicado na main pelo PR #3, após aprovação mobile do usuário.
- Entrega manual publicada: alimentos por porção base, consumo em gramas, proteína, carboidratos, gordura e fibra; valores calculados preservados no histórico. Campos novos são opcionais para compatibilidade com registros anteriores.
- Catálogo comum inicial: arroz tipo 1 cozido, pão francês, banana prata crua, pão integral, milho enlatado drenado e macarrão cru, TACO/NEPA/UNICAMP, 4ª edição. Alimentos pessoais são vinculados ao perfil existente; não entram no catálogo público.
- Diário manual offline: refeições, porções, calorias, nutrientes, edição e exclusão.
- Metas e resumo diário baseados em registros reais.
- Chat por texto: perguntar porções ausentes, identificar estimativas e confirmar antes de gravar.
- Definir provedor, custo, limites e tratamento dos dados antes da integração; chaves somente no servidor. Fotos e voz exigem escopo próprio.

## Limites e documentação

- Fotos ficam no aparelho e no backup; não prometer sincronização antes da etapa 11.
- O tempo de descanso usa o horário de término; iOS pode suspender execução e áudio em segundo plano.
- Saúde/HealthKit depende de avaliação de versão nativa e permissões; não está implementado na PWA.
- Entrada e cadastro não substituem o tutorial planejado.
- README reconciliado pelo PR #4. Notas historicas preservam o contexto da epoca; nao sao prova do estado atual. Som com tela bloqueada e demonstracoes completas pre-carregadas nao sao garantidos.
- Preservar dados dos usuários, credenciais fora do Git e cards congelados. Validar cada lote com testes proporcionais, build e conferência mobile.
