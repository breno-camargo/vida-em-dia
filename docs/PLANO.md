# Plano de evolução — Vida em Dia

Atualizado em 25/10/2026. Referência atual das etapas; o [histórico](HISTORICO.md) preserva entregas anteriores.

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
| 9 | Alimentação e chat | Pendente. Há modelos de dados, mas a aba Comida ainda é provisória. Implementar diário manual antes do chat IA. |
| 10 | Escopo original não localizado | Confirmar a descrição original antes de iniciar ou renumerar. Não atribuir uma função por suposição. |
| 11 | Fotos | Pendente: galeria de progresso, vínculo com medidas e sincronização de imagens. Fotos locais de equipamentos e backup já existem. |
| 12 | Meta de peso e indicadores | Pendente: interface e acompanhamento da meta de peso e IMC. Campos no modelo não significam funcionalidade concluída. |
| 13 | Experiência e acabamento | Parcialmente antecipada: temas e refinamentos mobile implementados. Falta tutorial inicial com pular, conclusão por usuário e opção de rever. |
| 14 | Demonstração dos exercícios | Pendente: conteúdo visual de execução/anatomia, imagens ou animações, com origem e licença verificadas. Ajuda textual, fotos próprias e links de vídeo já existem. |

## Próxima sequência proposta

1. Consolidar a validação da etapa 8 e reconciliar documentação antiga.
2. Implementar água por garrafas como entrega própria, sem atribuir à etapa 10 sem confirmação.
3. Iniciar a etapa 9 pelo diário alimentar offline; depois avaliar o chat.
4. Planejar fotos, indicadores, tutorial e demonstrações em lotes separados.

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

### Água por garrafas

- Configurar a capacidade da garrafa no perfil.
- Registrar quantidade consumida por dia, calcular volume e acompanhar a meta.
- Permitir corrigir registros; definir o tratamento de capacidade alterada sem recalcular indevidamente o histórico.
- Integrar persistência, backup e sincronização, com testes de cálculo e edição.
- O card Água atual é demonstrativo. A tabela existente não substitui o fluxo funcional.

### Alimentação e chat

- Diário manual offline: refeições, porções, calorias, nutrientes, edição e exclusão.
- Metas e resumo diário baseados em registros reais.
- Chat por texto: perguntar porções ausentes, identificar estimativas e confirmar antes de gravar.
- Definir provedor, custo, limites e tratamento dos dados antes da integração; chaves somente no servidor. Fotos e voz exigem escopo próprio.

## Limites e documentação

- Fotos ficam no aparelho e no backup; não prometer sincronização antes da etapa 11.
- O tempo de descanso usa o horário de término; iOS pode suspender execução e áudio em segundo plano.
- Saúde/HealthKit depende de avaliação de versão nativa e permissões; não está implementado na PWA.
- Entrada e cadastro não substituem o tutorial planejado.
- Reconciliar README, ENTREGA e notas históricas: não prometer som com tela bloqueada nem fotos/instruções completas pré-carregadas para todo o catálogo.
- Preservar dados dos usuários, credenciais fora do Git e cards congelados. Validar cada lote com testes proporcionais, build e conferência mobile.
