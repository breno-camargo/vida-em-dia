# Revisão e união de duplicatas — 19/10/2026

Treino → Exercícios → Revisar duplicatas. Agrupa somente cadastros ativos com identidade de conteúdo e proprietário iguais. Usuário escolhe grupo e cadastro principal; união exige confirmação. Recomenda backup com fotos. Não executado em dados reais.

Operação em transação Dexie, coordenada por comExclusaoSync. Revalida conteúdo/proprietário; remapeia ficha_exercicios, treino_exercicios, series_treino, cardio_sessoes e fotos, inclusive filhos removidos, preservando IDs, blobs, métricas e tombstones. Outras cópias de exercício recebem exclusão lógica. Bloqueia treino ativo, filhos de proprietário diferente e colisão de dois itens ativos na mesma ficha/sessão. Esses casos precisam de revisão separada; não há união silenciosa de planejamentos nem desfazer automático.

Sem migração, SQL, alteração remota ou exclusão física. Não cria alias permanente: edições antigas vindas de outro aparelho podem voltar a apontar para um cadastro removido; união concorrente em aparelhos e sincronização após união ainda exigem homologação. Não declarar solução definitiva de conflitos entre dispositivos. Flags históricas de recorde não são recalculadas; evolução usa as referências reunidas.

Testes sintéticos cobrem blobs e referências, tombstones, rejeição por conteúdo, agrupamento por proprietário, colisão na ficha e treino ativo. Interface ainda requer conferência no celular.
