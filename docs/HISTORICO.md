# Vida em Dia — Histórico Detalhado de Implementação e Etapas

Este documento preserva o histórico técnico, checklists e decisões de arquitetura desenvolvidos ao longo das Etapas 1 a 8 do projeto.

---

## Estado das Etapas e Auditorias

Correções locais após auditoria de 16/10/2026: restaurar por **Substituir neste aparelho** pausa a sincronização em armazenamento vinculado e exige confirmação antes de uma nova mesclagem com a conta. A restauração não apaga a nuvem; ao confirmar a retomada, registros remotos ausentes do arquivo podem voltar. Conflitos por data mostram os valores deste aparelho e da conta para escolha, mantendo os valores recusados como exclusão lógica no JSON. As outras tabelas podem avançar enquanto a tabela conflitante aguarda revisão. Operações de sincronização/importação exigem navegador com Web Locks para coordenar abas.

ETAPAS 1, 2 e 3 aprovadas (v0.1.0, v0.2.0 e v0.3.0), mantendo o verde original. O usuário validou a etapa 3 no iPhone e aprovou a conclusão em 06/10/2026. ETAPA 4 aprovada em 06/10/2026 (v0.4.0), após validação do checklist pelo usuário e correção final do vazamento no painel do card. ETAPA 5 aprovada pelo usuário em 12/10/2026 (v0.5.0). ETAPA 6 aprovada pelo usuário em 14/10/2026 (v0.6.0). ETAPA 7 aprovada pelo usuário em 14/10/2026 (v0.7.0). ETAPA 8 implementada e homologada em produção com Supabase em 25/10/2026.

---

### ETAPA 2 — Biblioteca e Fichas

Na aba Treino, use Minhas fichas ou Exercícios. A biblioteca inicial contém 64 exercícios comuns, com busca por nome/equipamento e filtro por grupo. Você pode criar, editar e excluir exercícios. A inicialização é transacional e não recria exercícios excluídos.

Crie fichas com exercícios, séries planejadas e descanso por exercício. Edite, duplique, reordene fichas e exercícios ou exclua com Desfazer. Para simplificar, cada exercício aparece uma vez por ficha. A exclusão de um exercício usado em ficha é bloqueada até removê-lo da ficha.

Como fazer abre um painel rápido com fotos da máquina, nota fixa, instruções, músculos e vídeo. Adicione fotos pela câmera/galeria. O aparelho comprime em JPEG 0,7, até 1280 px, e gera miniaturas até 320 px, armazenadas como Blob. Links de vídeo abrem em nova aba; sem link preferido, abre a busca no YouTube. Vídeos exigem internet; fotos e texto funcionam offline. Imagens de execução de bancos externos somente na etapa 14.

A migração 2 preserva os registros da versão 1 e acrescenta descanso de 90 segundos aos itens antigos. A biblioteca é inicializada uma vez nas configurações.

Checklist da etapa 2 no iPhone:
- Busque supino e filtre por grupo; crie um exercício personalizado e confira após reabrir.
- Crie ficha A com dois exercícios, altere séries e descanso, reordene e salve.
- Duplique a ficha; editar a cópia não deve modificar a original.
- Exclua uma ficha ou exercício livre e toque em Desfazer.
- Adicione foto pela câmera e pela galeria; reabra a ajuda em modo avião.
- Edite nota, Como fazer, músculos e vídeo; confira busca no YouTube e link preferido.
- Abra/feche os painéis e confira teclado, alvos de toque e áreas seguras.

---

### ETAPA 3 — Modo Treino e Execução

Use Iniciar treino em uma ficha ou Iniciar treino livre. As séries ficam preenchidas pela última sessão finalizada; a primeira começa com carga 0 e 10 repetições, para você ajustar. O treino do dia usa uma cópia do planejamento: adicionar, reordenar ou remover exercícios não muda a ficha. Treino livre pode virar ficha. Cada exercício aparece uma vez no treino; sessões de cardio serão registradas na etapa 6, sem transformar minutos em séries de musculação.

Exercícios aparecem em cards recolhíveis no treino e no editor de fichas. Toque no nome para abrir abaixo. O card mostra a miniatura da máquina quando cadastrada, resumo e progresso; dentro dele, todas as séries ficam em linhas compactas com reps, kg e Concluir. Abra Opções para carga por lado, drop set e RPE. Recolher o card não apaga alterações nem interrompe o descanso.

O fluxo principal usa seletores por rolagem: toque no número da série para escolher normal, aquecimento, falha ou drop set; toque em reps ou kg para selecionar os dois valores (com frações de 0,25 kg). A confirmação pode aplicar os valores às próximas séries pendentes do mesmo exercício, sem modificar as concluídas. O descanso oferece 30, 45, 60, 90 e 120 segundos; valores antigos personalizados também são preservados. Remover série oferece Desfazer. As ações secundárias das fichas ficam no menu de três pontos.

Concluir salva a série imediatamente e inicia descanso quando há outra série no mesmo exercício. A última sugere o próximo exercício. O timer usa o timestamp de término; a renderização é atualizada com setTimeout, sem diminuir um contador. Ao retornar do bloqueio, mostra o tempo correto e quanto passou do término. O som é liberado no toque em Concluir; o alerta visual continua independente do áudio. Não há notificações em segundo plano. Inclui +15 s, -15 s, pular e silenciar.

Tela ligada usa Screen Wake Lock quando disponível e vídeo invisível via [NoSleep.js (MIT)](https://github.com/richtr/NoSleep.js) como alternativa. O pedido é renovado em visibilitychange.

---

### ETAPA 4 — Histórico e Evolução

A aba Evolução reúne os treinos concluídos e a evolução por exercício. Busque por nome da ficha, exercício ou data (ISO ou formato brasileiro). Cada sessão mostra as séries realizadas e pode ser removida com Desfazer; a remoção é lógica e preserva as séries para restauração.

No detalhe do exercício, Evolução mostra carga máxima, maior volume por sessão, 1RM estimado por Epley, comparação de carga com a sessão anterior e gráficos Recharts de carga e volume. Aquecimentos, séries pendentes e registros excluídos não entram nas métricas. Drop sets somam as reduções com carga total. Recordes são recalculados a partir dos dados visíveis, inclusive de treinos antigos; a primeira sessão estabelece a referência, sem recordes fictícios. Durante o treino, superar uma marca anterior exibe Novo recorde.

Card de resultado do treino para compartilhar: gera imagem vertical 1080 × 1920 para Stories, com a identidade verde do Vida em Dia e foto opcional. Usar dados reais do treino: nome da ficha, duração, exercícios concluídos, volume total, recordes e calorias estimadas somente quando houver peso cadastrado. Não publicar automaticamente em redes sociais.

---

### ETAPA 5 — Medidas e Peso

Registro parcial por data: peso (kg), bíceps direito/esquerdo, coxa direita/esquerda, cintura, abdômen, quadril e panturrilha direita/esquerda (cm). Todos os campos e a data usam seletores de rolagem com confirmação. Os valores entram num rascunho; apenas Salvar registra o formulário inteiro. Campos vazios permanecem ausentes. Precisão de 0,1; peso até 400 kg e medidas até 300 cm. Registro exige ao menos um valor e data real, até hoje; um registro ativo por data, com edição e exclusão reversível.

Histórico recolhido por data, comparação de duas datas com diferença neutra, gráfico recolhido por padrão. Peso em card próprio e todas as medidas com o mesmo destaque numa grade compacta. O último peso não excluído alimenta as estimativas dos próximos treinos. Lembrete semanal na tela Hoje, padrão sábado, configurável nas Configurações.

---

### ETAPA 6 — Cardio e Atividade Diária

Cardio na aba Treino: oito tipos, atalho Esteira, duração obrigatória; data, distância, velocidade, inclinação, calorias da máquina, passos da sessão, frequência média/máxima e observação. Campos opcionais recolhidos. Velocidade calculada se não informada e houver duração/distância; ritmo min/km calculado, sem deduzir passos.

Histórico por tipo, edição, remoção e desfazer; resumo de segunda a domingo com sessões, minutos, km e calorias ajustadas; meta semanal opcional; recordes por tipo (duração, distância e melhor ritmo).

Hoje: passos manuais, calorias gastas e barras das metas aplicáveis. Modo soma ou modo total manual do relógio/Saúde. Feriados nacionais do ano atual pré-cadastrados, incluindo cálculo móvel da Páscoa. Busto incluído como medida opcional.

---

### ETAPA 7 — Backup e Proteção

Configurações: preparar JSON de todas as 17 tabelas, incluindo exclusões lógicas e configurações; fotos opcionais, com imagem e miniatura convertidas de Blob para base64. Envelope identifica app, formato 1, schema Dexie, horário e inclusão de fotos. Compartilhamento nativo de arquivo e download por link como alternativa. Exportação complementar em CSV para auditoria em planilhas.

Importação JSON: validação estrita do envelope, tabelas, IDs, duplicatas, tipos básicos, datas, opções e fotos antes de qualquer alteração, com limite de 250 MB. Escolha entre Mesclar (LWW por UUID) ou Substituir tudo. Transação atômica no IndexedDB com rollback automático em caso de falha. Lembrete de backup em Hoje após intervalo configurável.

---

### ETAPA 8 — Conta, Nuvem e Sincronização

Autenticação completa com Supabase: login com e-mail e senha, sessão persistente com refresh token e recuperação segura através de código OTP de 6 dígitos gerado e verificado no próprio aplicativo.

Dados operam no padrão Offline-First com Dexie (IndexedDB) no cliente: leitura e escrita locais instantâneas com fila de sincronização em segundo plano, resistente a oscilações de rede. Mecanismo de resolução de conflitos baseado em Last-Write-Wins (LWW) via RPC atômico no PostgreSQL com Row Level Security (RLS) protegendo os registros de cada usuário.
