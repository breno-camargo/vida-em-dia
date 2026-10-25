Atualização de 18/10/2026: A03 corrigido (treino livre para ficha; limite de planejamento explicado, sessão preservada). A05 entregue pelo Gemini e revisado pelo Codex: sync não reinicia lembrete de backup. Ver revisao/CODEX-A03.md e revisao/CODEX-A05.md. Validação atual: 213 testes em 29 arquivos, lint/build passaram. Etapa 8 continua em homologação; sem push/deploy. Notas históricas abaixo não substituem este estado.

## Perfil e medidas opcionais no cadastro — 18/10/2026

Usuário solicitou informações básicas e opção de medidas já disponíveis. Cadastro agora pede nome (até 80 caracteres), além de e-mail/senha/confirmação existentes. Altura em cm, peso e demais medidas são opcionais, recolhidos em Altura e medidas; é possível não preencher ou retirar as medidas. EditorMedida reutilizado com callback de rascunho e os mesmos seletores, precisão e data da aba Medidas. Sem coleta de telefone/documentos/data de nascimento/sexo sem finalidade atual.

Somente nome vai para metadados da autenticação. Altura/medidas ficam em memória nesta aba, identificadas pelo e-mail do cadastro; não são gravadas em localStorage nem enviadas ao Auth. A interface informa que fechar/atualizar antes de concluir perde o rascunho e permite preencher depois na aba Medidas. Após autenticar a mesma conta, painel Seu ponto de partida oferece conexão explícita e Salvar informações iniciais, ou Preencher depois. Nenhuma associação automática de dados locais ao cadastrar.

Salvar exige vínculo local e sessão correspondente, revalida proprietário da configuração (aceita visitante após vínculo), usa lock compartilhado com sincronização e transação para altura/medidas. Registros têm user_id da conta confirmada; data já ocupada não é sobrescrita. Conflito ou troca de sessão reverte toda a gravação e mantém rascunho para revisão. Somente após sucesso ou descarte explícito o rascunho é retirado. Sem migração/SQL remoto/dados reais alterados.

Novos testes: nome/altura antes de cadastro, metadados mínimos sem dados corporais, rascunho sem persistência, conta/vínculo corretos, configuração visitante, proprietário divergente, conflito de data e mudança de sessão com rollback. Testes de interface continuam estáticos, sem interação E2E no aparelho; cadastro/confirmar e-mail/conectar/salvar perfil ainda exigem homologação real.

## Cadastro de conta autorizado pelo usuário — 18/10/2026

ContaConfiguracoes agora oferece Criar conta na entrada/configurações sem sessão, com e-mail, senha mínima de 8 caracteres, confirmação de senha e alternância para Entrar. Cadastro por Supabase signUp separado em cadastro.ts; aguarda confirmação por e-mail, aceita código via verifyOtp type email e permite reenvio signup. E-mail da confirmação fica bloqueado até voltar para entrar. Campos de senha/código e avisos são limpos ao trocar de modo. Erros locais, cadastro remoto desabilitado, senha fraca e limites de envio têm mensagens próprias. Fluxos de recuperação/login preservados.

O código de cadastro não vincula aparelho, não mescla dados e não chama sincronização. Sessão imediata quando confirmação remota está desligada é tratada sem introduzir vínculo automático; conexão de dados mantém confirmação explícita. Nenhuma conta foi criada por ferramentas, nenhum e-mail enviado no teste e nenhuma configuração remota alterada. Usuário informou teste@example.com como conta de teste e reservou principal@example.com como principal; não apagar, mesclar ou transferir dados da principal. Cadastro teste deve ocorrer em armazenamento separado.

Template de confirmação pronto em supabase/confirmar-cadastro.html; precisa ser aplicado ao serviço para disponibilizar código no e-mail. Template padrão com link também é aceito: confirmar pelo link e depois entrar com senha, sem prometer sessão automática (detectSessionInUrl desligado). Configurações de cadastro permitido, confirmação e SMTP devem ser conferidas no serviço; instruções em supabase/CONFIGURAR.md. Sem contornar confirmação por e-mail.

Validação local: 197 testes em 26 arquivos, lint e build passaram. Oito testes de serviço usam autenticação simulada; dois testes estáticos verificam botão de cadastro e conexão de dados explícita. Não são E2E: digitação/cliques, envio/recebimento real, confirmação, reenvio e comportamento no iPhone continuam para homologação. Etapa 8 não aprovada nem publicada.

## A04 — validação de domínio e referências do backup — 18/10/2026

Corrigido o caso C05 que importava série com carga/repetições negativas e vínculo inexistente. validarBackup executa validação de domínio e integridade do arquivo completo antes de decodificar/gravar, pausar sincronização ou limpar filas. Schema exige inteiro positivo suportado. Números negativos/não finitos são rejeitados; contadores exigem inteiros; cargas/reps/RPE/descanso/medidas/cardio seguem limites do domínio existente. Reduções e itens de combos também são validados; enums de origem/precisão/ângulo conferidos.

Referências obrigatórias e opcionais presentes são verificadas por conjuntos de IDs de cada tabela: fichas, exercícios, treinos, séries, cardio, fotos e refeições. O arquivo deve ser autocontido; vínculo inexistente não é reparado silenciosamente com dados deste aparelho. Pais excluídos continuam válidos, sem exigir que estejam ativos; tombstones/Desfazer preservados. Não se exige treino_exercicios para séries antigas nem campos opcionais novos de carga/descanso em arquivos históricos. Não se arredonda peso/medidas/duração nem se rejeita carga zero. Sem migração ou alteração de dados reais, nuvem ou SQL.

Nova validacaoBackup.ts concentra regras. C05 convertido de reprodução do defeito para regressão de rejeição. 21 testes novos cobrem negativos/limites/inteiros, vínculos ausentes e opcionais, pais excluídos, legado, precisão, cardio e conteúdo aninhado; Mesclar/Substituir preservam todas as tabelas quando o arquivo falha. Casos já existentes de fotos e restauração/sync também passaram. Suíte completa: 187 testes em 24 arquivos; lint/build passaram. Testes usam IndexedDB falso e banco efêmero, sem dados do usuário. A04 corrigido localmente; homologação completa da etapa 8 segue pendente.

## Integração do protótipo Gemini aprovado — 18/10/2026

Usuário aprovou explicitamente o protótipo e autorizou integração fiel. Funções de desenho extraídas de revisao/prototipo-cards/index.html para renderCardAprovado.ts, com tipos e estado por chamada (sem variáveis globais compartilhadas). CardCompartilhavel usa o mesmo renderizador para Tipográfico, Foto e Editorial. Adesivo tem prévia inteira com foto/xadrez e arquivo PNG transparente com recorte de 36 px de margem. Foto sem imagem delega para Editorial. Dimensões, fontes, cores e posições do protótipo preservadas. Opções antigas de formatos/seleção de métricas retiradas do painel por não fazerem parte da composição aprovada.

Dados reais são adaptados por imagensCardAprovado.ts: tempo MM:SS, volume identificado, séries/exercícios/repetições e cardio com distância/ritmo/tempo/calorias disponíveis. Cardio sem distância usa tempo sem inventar km. Nenhum dado é persistido ou migrado. Cópia/download/compartilhamento usam apenas o arquivo de exportação, não a prévia com fundo. Geração antiga invalidada por identidade treino/dados/foto/modelo/cor, URLs limpas ao trocar/desmontar.

Teste compara comandos canvas (texto, fonte, cores, posições, desenho e degradês) da integração com o script original nos quatro cenários, três modelos, duas cores e com/sem foto: 48 combinações. Não é comparação de pixels nem teste de clipboard no iPhone. Lint/build passaram. Homologação no aparelho permanece pendente; protótipo isolado preservado como referência.

## Composição para postagem — 18/10/2026

Após nova captura, relógio principal usa peso 750 e tamanho máximo 350, em vez de fonte fina ampliada para preencher a página. Caixa principal compactada, legenda/separador aproximados, métricas de apoio aumentadas e linhas redistribuídas. Foto sem imagem adota paleta Editorial marfim; com foto preserva imagem e degradê. Limites de fonte medidos em largura/altura mantidos. Oito testes direcionados passaram; lint/build passaram antes do último ajuste de espaçamento de fotos densas. Navegador CUA indisponível (nenhum navegador conectado); não foi possível validar nova renderização real nesta sessão.

## Destaque principal definido pelo usuário — 18/10/2026

Tempo passa a ser o destaque padrão da musculação inclusive abaixo de um minuto (00:51), sem substituição automática por repetições. Cardio prioriza distância disponível e depois tempo. Seleção de campos preservada; métricas de apoio mantidas. Testes de regressão atualizados para sessão curta e cardio com/sem distância. Esta decisão supera a priorização de repetições registrada nas entradas anteriores.

## Espaçamento e limites tipográficos dos cards — 18/10/2026

Captura confirmou descendente do 4 em Georgia invadindo a legenda e métricas extras muito próximas no rodapé. Número principal agora cabe numa caixa de 920×680 usando actualBoundingBoxAscent/Descent além da largura, com posição centrada e reserva antes da legenda. Separador sobe e apoio ganha espaçamento maior entre valor/rótulo e linhas. Até três métricas de apoio preservam uma primeira maior; quatro ou mais usam grade uniforme espaçada para não comprimir calorias junto a séries. Sem alteração de dados. Regressão específica cobre descendente da fonte; testes de canvas permanecem simulados. Lint/build passaram; conferir visual real após atualizar.

## Duração com segundos — 18/10/2026

duracaoSessao agora exibe MM:SS a partir dos timestamps reais, sem arredondar para minutos: 59 s = 00:59, 48 min 37 s = 48:37; acima de uma hora mantém minutos acumulados, como 65:09. Sem timestamps válidos, usa duração registrada quando disponível; sem informação não inventa zero. Cards e histórico que consomem o helper seguem o formato. Sessões abaixo de um minuto continuam secundárias quando há outro resultado selecionado. Dez testes direcionados, lint/build passaram.

## Refinamento após capturas reais dos cards — 18/10/2026

Corrigida a hierarquia que promovia Menos de 1 min a destaque gigante. Seleção do destaque prioriza tempo numérico ou outro resultado real selecionado (repetições, volume, séries); frases de duração ficam como nota secundária nos cards. Editorial separa número e legenda, aumenta o número principal e ocupa a área superior conforme a referência aprovada. Foto sem imagem usa composição editorial escura para evitar metade vazia. Adesivo preserva rótulos menores e reduz tamanho de valores textuais; Repetições substitui o rótulo ambíguo Peso corporal, que fica como contexto no card. Seleção de campos respeitada, sem fabricar tempo nem alterar sessões. Regressão cobre a sessão com 42 reps e duração curta. Lint/build passaram; testes direcionados executados. Nova conferência visual real ainda necessária.

## Direção visual aprovada para compartilhamento — 18/10/2026

Aplicadas as três direções aprovadas na prancha: Tipográfico, Foto e Editorial. Seletor mostra essas três opções para musculação e cardio. Tipográfico inicia em coluna, com marca pequena, números grandes e unidades menores, sem título/data competindo com métricas. Foto usa imagem inteira e degradê para leitura no rodapé, com resultado principal destacado. Editorial usa fundo marfim, tinta verde quase preta e número principal em Georgia, com hierarquia e respiro. Título/data são rodapé discreto dos cards opacos. Seleção de métricas vale para os três modelos; padrão prioriza quatro resultados e permite incluir recordes/calorias disponíveis. Layouts alternativos do adesivo preservados.

Implementação desenhada em canvas, sem incorporar a foto ou dados fictícios da prancha. Foto do usuário continua opcional e somente em memória; adesivos exportam sem fundo. Conferência visual no aparelho e clipboard/Instagram continuam pendentes. Os testes de canvas são simulados e não atestam fidelidade visual à prancha.

## Adesivos para stories — 18/10/2026

Adesivo é o modelo inicial do compartilhamento. Quatro composições transparentes: Coluna, Compacto, Destaque e Faixa, com dimensões ajustadas ao conteúdo, números grandes, rótulos menores e marca discreta. Cor clara/escura e seleção das métricas disponíveis, mantendo pelo menos uma. Foto opcional simula o story na prévia e não entra no PNG do adesivo. Modelos opacos anteriores preservados para musculação. Trocas de layout/campos entram na identidade da geração e invalidam exportação antiga; URLs de imagem/foto têm limpeza.

Treinos corporais recebem repetições e omitem volume zero no adesivo. Cardio ganha Compartilhar adesivo dentro do registro expandido, com distância/ritmo/tempo/calorias/passos/frequência disponíveis. Calorias informadas e estimadas têm rótulos distintos; nenhuma elevação ou rota é inventada. A adaptação de cardio é somente em memória, sem criar treino no banco. Copiar adesivo continua principal quando clipboard de imagem está disponível, com download PNG alternativo.

Suíte completa de 161 testes passou antes das duas regressões adicionais de métricas corporais/cardio; lint/build passaram. Testes de exportação usam canvas simulado: não comprovam aparência, transparência nativa do clipboard ou colagem no Instagram/iPhone. Conferência visual e integração real seguem pendentes.

## Histórico compacto — 18/10/2026

Por aprovação do usuário, cards da lista mostram somente exercícios e séries abaixo do nome. Duração, volume total, repetições corporais e recordes ficam no painel Ver treino, mantendo acesso aos dados sem expansão adicional dentro do card. Data, horário e ações preservados. Lint/build passaram.

## Alinhamento das ações do histórico — 18/10/2026

Captura do usuário revelou alturas/alinhamentos diferentes e cores antigas nos botões do histórico. Removidas regras locais de aparência que sobrepunham o padrão compartilhado; ações agora têm margem zero, largura da coluna e altura mínima de 48 px, alinhadas na mesma linha. Ver treino mantém verde principal e Compartilhar secundário. Lint/build passaram; conferir resultado visual no aparelho.

## Sincronizar e navegação inferior — 18/10/2026

BotaoSincronizar usa botao-principal compartilhado (verde claro), preservando estado ocupado/desabilitado e fluxo de revisão. Navegação principal deixa de usar fade parcial: troca direta com título/conteúdo juntos; scroll instantâneo no useLayoutEffect após mudança de aba/menu evita reposicionar a página anterior antes da renderização. Toque na aba ativa não remonta Treino nem limpa estados. Cores dos botões inferiores transitam em 120 ms, desligadas por prefers-reduced-motion. Abas internas preservadas.

Lint e build passaram. Alteração de apresentação/navegação sem mudança nos dados ou sincronização. Conferência visual e de troca rápida no aparelho pendente; não houve teste E2E.

## Resumos do histórico de treino — 18/10/2026

Evolução agora mostra duração, exercícios e séries, com Volume total em linha separada somente quando positivo. Peso corporal destaca repetições; sessões mistas mostram ambos. Resumo exclui aquecimento, séries pendentes e excluídas e inclui reduções de drop set. Detalhe segue o mesmo resumo e substitui carga zero por Sem carga externa registrada. Ver treino usa o botão principal compartilhado; Compartilhar usa o secundário. Nenhum treino curto ou repetido foi removido e não houve alteração no banco.

Validação: 160 testes passaram, lint e build passaram. Três regressões cobrem volume 507 kg, carga zero, peso corporal, sessão mista e exclusões/aquecimento/drop set. Conferência visual no celular continua pendente.

## Revisão e padrão das transições — 18/10/2026

Revisados os pontos explícitos de animação/transition CSS, rolagem programática, navegação principal, abas internas e Painel. Não havia translate lateral codificado na troca Meus treinos/Por exercício; a captura estática não permite reproduzir o movimento relatado. Mudança de altura/ancoragem do navegador é hipótese, não diagnóstico confirmado.

Adicionado TransicaoConteudo para navegação principal e abas de Treino/Evolução, com opacidade 0,7→1 em 120 ms somente quando a chave muda, cancelamento ao trocar novamente e sem desmontar filhos por key. Cabeçalho/busca da Evolução ficam fora da animação interna, com reserva curta para dica e conteúdo mínimo; não foi introduzida animação de altura nem deslizamento. Montagem inicial não anima para evitar efeitos duplicados ao entrar numa página. Medidas, seletores e seções de configurações compartilham aparição CSS curta; botões/abas mudam somente cores; painéis/backdrop usam opacidade em 160 ms. Gestos de arrastar painel preservados.

prefers-reduced-motion desliga os efeitos novos, rotações de setas/interruptores e scroll suave ao clicar numa roda. Removido deslocamento vertical de botão principal em active. Padrão documentado em PADROES-INTERFACE.md e estilos centralizados em controles.css. Sem alteração em dados, regras ou temporizadores de descanso/sync.

157 testes e lint passaram; build passou. Resultado visual da transição, ancoragem de scroll em listas longas, troca rápida e preferência de reduzir movimento ainda devem ser conferidos no navegador/aparelho. Testes existentes não são E2E de animação. Não afirmar causa ou resolução visual completa apenas pela captura estática.

## Centímetros com duas casas decimais — 18/10/2026

Por solicitação explícita após exemplo 83,75 cm, ampliada precisão de todas as medidas corporais em cm para até duas casas; peso mantém três. Rolar agora usa CM + décimos + centésimos; Digitar aceita vírgula/ponto e inteiros/uma/duas casas. Formatação e diferença por campo acompanham a precisão, inclusive histórico/gráfico. Valores anteriores não foram modificados. PADROES-INTERFACE.md atualizado; substitui decisão anterior de uma casa em cm. 13 testes de medidas/resumo, lint e build passaram; aparência no aparelho pendente.

## Padrões compartilhados de botões e troca de conteúdo — 18/10/2026

Usuário pediu consistência entre Nova ficha, Registrar, Iniciar treino e as barras de troca de conteúdo. Criado src/estilos/controles.css, importado após index.css em main.tsx, com tokens compartilhados e estilos para ações principais/secundárias, seleção segmentada, foco/disabled e interruptores. Nova ficha, Registrar medidas/cardio, retomada e início de ficha passaram a usar classes compartilhadas. Continuar da ficha ativa mantém hierarquia secundária complementar à ação principal no topo.

Treino/Medidas/biblioteca e alternadores Rolar/Digitar agora compartilham a mesma aparência de seleção verde clara, tipografia e dimensões. Filtros musculares horizontais e navegação inferior preservam seus padrões próprios. Não foi alegada migração exaustiva de todos os controles legados; a base comum atende os grupos citados, sem reescrever dados ou interações. CSS anterior ainda existe, mas futuras entregas devem usar o arquivo comum e remover exceções conflitantes progressivamente.

Contrato em PADROES-INTERFACE.md e referência adicionada a AGENTS.md para Codex/Gemini. Principais: altura mínima 48 px, raio 12 px, fonte 13/600; segmentos 44 px, fonte 12/600, seleção consistente. Exclusão/cancelamento continuam com tratamento próprio. Lint e build passaram; conferência visual no aparelho pendente. Sem novos testes unitários por se tratar de classes/estilos/documentação; última suíte funcional tinha 156 testes verdes.

## Precisão dos registros corporais revisada — 18/10/2026

Revisadas todas as medidas. Peso: kg com três casas decimais (1 g), rodas KG + 100 G/10 G/1 G e digitação com vírgula/ponto (77,830 kg). Busto, cintura, abdômen, quadril, bíceps, coxas e panturrilhas: cm com uma casa decimal (0,1 cm), rolagem e digitação. Seletores mantêm confirmação explícita, rascunho e ausência opcional; não é sugerida uma capacidade de precisão da balança/fita do usuário. Limites existentes de 400 kg/300 cm mantidos, com rejeição de entradas fora de precisão em vez de truncar silenciosamente. Registros existentes não foram migrados nem arredondados no banco.

ValorMedida extraído do editor. Formatação por campo aplicada a formulário, resumo, histórico, comparação, tooltip e tabela do gráfico. DiferencaMedida agora usa 3 casas para peso e 1 para cm; uma mudança de 30 g aparece como 0,030 kg, não zero. GraficoCarga ganhou formatador opcional sem mudar os demais consumidores.

156 testes, lint e build passaram. Regressões novas cobrem 77,830 kg, persistência, diferença de 30 g, todos os campos de cm e rejeição de excesso de precisão/ausência inválida. Conferência visual/teclado real no celular pendente. Nenhuma mudança em banco real, sincronização ou publicação.

## Metros por casas decimais na rolagem — 18/10/2026

Após usuário relatar dificuldade de rolar até 500 m, substituída roda única 0–999 por três rodas 0–9 de centenas/dezenas/unidades. 500 m exige 5/0/0; 753 m exige 7/5/3. Mantidos km, teclado, atalhos, limites e confirmação. Valores controlados preservam precisão ao trocar modo. Lint/build e três testes de distância passaram; interação mobile ainda precisa de conferência.

## Distância com precisão de metros e retorno para Rolar — 18/10/2026

Corrigido o bloqueio reportado ao alternar para Rolar com texto vazio: a navegação passa a ser permitida sem confirmar/salvar. Seletor de duração também permite sair do modo com campos vazios, restaurando o valor inicial sem aplicar. Valores inválidos não vazios continuam mostrando erro.

Distância ganhou seletor específico de quilômetros e metros, com rodas, teclado e ±1 km. 1 km 753 m corresponde a 1,753 km; 0 km 754 m a 0,754 km. Metros inteiros entre 0 e 999, limite total de 1.000 km. Não informar retorna undefined; zero continua distinto de ausência. Persistência permanece em distancia_km sem arredondar para décimos; registros anteriores continuam compatíveis. Formulário, distância do histórico cardio e total semanal exibem a precisão de metros.

154 testes, lint e build passaram. Quatro regressões novas cobrem exemplos do usuário, limites/entrada inválida, soma de metros e persistência sem perda. Alteração de modo foi conferida no código, sem teste de interação real no navegador. Conferir rolagem e teclado no celular. Sem mudanças em dados reais, publicação ou dependências.

## Tipos Vite no teste de auditoria — 18/10/2026

Adicionada referência explícita a vite/client em auditoria.test.ts para reconhecer import SQL com ?raw no projeto inferido do editor (revisao não está no include de tsconfig.app.json). Não altera SQL nem execução. Verificação pelo compilador TypeScript sem TS2307 no arquivo e os 10 testes de auditoria passaram.

## Duração de cardio em minutos e segundos — 18/10/2026

Novo SelecionarDuracao mantém Rolar/Digitar e ±5 min, com campos/rodas independentes de minutos e segundos. Exemplo: 1 min 33 s corresponde internamente a 1,55 minutos, não 1,33. Domínio de 1 segundo até 24 h; segundos de 0 a 59, inteiros, sem aceitar texto decimal/negativo/vazio. Confirmar altera rascunho do editor; somente Salvar persiste. Outros seletores numéricos não mudaram.

Persistência segue duracao_minutos, preservando cálculos de ritmo, velocidade, calorias e compatibilidade de schema/backup. Valores antigos como 1,5 min abrem em 1 min 30 s. Duração no formulário, lista/histórico, cardio planejado, resumo do dia e total semanal usa minutos/segundos. Não foram migrados dados reais. Cobertura inclui conversão, limites/ausência, soma e persistência/ritmo sem arredondamento para décimos. 150 testes e lint passaram; build passou após os ajustes finais de exibição. Interação/teclado real no celular ainda precisa de conferência.

## Seletores Gemini revisados e tela Cardio refinada — 18/10/2026

Aprovação com correções do Codex: posição controlada da roda, remoção de timer que ignorava gestos e validação de salto sem substituir texto inválido. Removido teste que só chamava o próprio mock; documentado que renderização estática não é teste de interação/JSDOM. Dois testes úteis de salto adicionados. Interface Cardio com único Registrar cardio, resumo compacto e campos opcionais agrupados. 146 testes, lint e build passaram. Conferência mobile pendente; detalhes em CODEX-SELETORES-CARDIO.md.

## Modalidades de cardio no registro e filtros — 18/10/2026

Usuário apontou lacuna: catálogo ampliado incluía modalidades, mas formulário e filtros de cardio ainda tinham oito tipos; cardio da ficha era convertido para Outro. Corrigida a integração com catálogo central em tiposCardio.ts (27 opções, preservando os oito identificadores anteriores), incluindo caminhada/corrida na esteira, ciclismo, natação, circuito, ski erg, boxe, air bike, esportes, dança, hidroginástica, spinning, raquetes, vôlei e corda. Tipagem, formulário, filtro/histórico/recordes por tipo e validação do JSON consomem a mesma lista. Resolver de tipo por nome mantém a modalidade ao registrar cardio de uma ficha. Adicionados nomes individuais de tênis/padel/beach tennis ao catálogo opcional (424 entradas antes de deduplicar).

Não foram inventados METs de esportes: modalidades novas sem referência configurada preservam calorias informadas e deixam a estimativa ausente. Caminhada/corrida na esteira reutilizam as referências gerais existentes. UI explica quando não há cálculo automático. Registros antigos marcados Outro não foram reclassificados por suposição. Backup aceita todos os tipos novos; versões antigas do app têm a lista limitada e devem ser atualizadas nos aparelhos que forem importar/sincronizar esses registros. Nenhum SQL remoto ou migração do schema local foi executado; tipo fica no JSON existente do servidor.

Validação: 126 testes, lint e build passaram. Regressões cobrem gravação/validação de backup de todas as modalidades, ausência de kcal inventadas, preservação de kcal informadas e resolução da modalidade a partir do exercício. Conferência visual no aparelho pendente.

## A07 entregue pelo Gemini e aprovada pelo Codex — 18/10/2026

Consulta maiorCarga filtra pelo pai não removido, sem cascata e preservando Desfazer. Revisão independente aprovada, com reforço do teste de pendentes de carga alta. 123 testes, lint e build passaram; após ajuste apenas no teste, 31 testes direcionados passaram. Detalhes e limites em CODEX-A07.md. Homologação visual ainda pendente. Nenhum commit, push ou deploy.

## Modelos de card e adesivo para stories — 16/10/2026

Novo seletor com Completo, Foto inteira, Minimalista e Adesivo. Completo preserva o card original e foto opcional; Foto inteira usa recorte para preencher o story; Minimalista usa fundo claro; Adesivo exporta PNG 1080×820 sem pintar fundo/foto, com texto claro ou escuro. Demais modelos mantêm 1080×1920. O xadrez de transparência existe apenas na prévia CSS e não é exportado. Card com dados reais, títulos normalizados e duração curta corretamente identificada. Foto permanece só na memória para exportação.

Incluídos Copiar imagem/adesivo quando ClipboardItem e clipboard.write estão disponíveis, Copiar texto com alternativa de seleção manual, Baixar PNG e compartilhamento de arquivo. Não há publicação automática. Colagem de PNG em editor de stories depende do navegador/sistema/app; a interface explica o caminho alternativo pelo arquivo. Não foi alegada compatibilidade universal com Instagram ou equivalência exata ao Strava.

Corrigida também A08 da auditoria: resultado gerado guarda identidade do treino/dados/foto/modelo/cor. Enquanto muda qualquer opção, a imagem anterior deixa de habilitar exportação; respostas antigas são ignoradas e URLs revogadas. Falha de geração não deixa uma imagem anterior disponível para compartilhar. Estado de clipboard/compartilhamento informa sucesso, cancelamento ou alternativa de download.

Validação: 121 testes, lint e build. Três testes novos cobrem modelos, ausência de pintura de fundo/foto no adesivo e texto sem métricas inventadas. Canvas é simulado nos testes: aparência dos PNGs e colagem/transparência no app de stories precisam ser conferidas no aparelho. Nenhum dado real foi alterado e não houve publicação.

## Atalho compacto para o último treino — 16/10/2026

Substituído o bloco Último treino concluído e seu botão grande por uma linha inteira clicável: ícone, data curta, nome e Ver card com seta. Fundo discreto e divisor inferior, preservando o foco das fichas. Títulos longos usam reticências com nome completo no rótulo acessível. Sem mudanças em dados ou compartilhamento. Lint e build passaram; visual no aparelho pendente.

## Avisos de desfazer e leitura da evolução — 16/10/2026

Introduzido useEstadoTemporario para dispensar o aviso de desfazer após 10 segundos, reiniciando o prazo ao haver nova remoção e cancelando timers na troca/desmontagem. Aplicado a histórico de treinos, medidas, cardio, fichas/exercícios, remoções no treino e fotos da ajuda. Expira apenas a ação temporária de interface; nenhuma exclusão física foi introduzida. Conclusão/desfazer de série permanece com seu comportamento existente.

Na evolução, aviso explica a janela de 10 segundos. Sessões recebem horário de início para distinguir treinos da mesma data; títulos seguem a inicial maiúscula e textos de busca ficaram mais curtos. Ajustados espaçamento dos cards, ações e métricas. Duração usa início/fim quando válidos: menos de 60 segundos aparece como Menos de 1 min; faltando dados válidos, mostra Duração não informada em vez de inventar zero. Histórico interno do exercício também mostra horário. Sem mudanças nos cálculos de recordes ou em séries persistidas.

Validação: lint, build e suíte completa de testes. Novas regressões verificam duração curta, ausência de dados e horário inválido. Expiração visual e aparência no celular precisam de conferência no aparelho.

## Reorganização da tela de medidas — 16/10/2026

Abaixo do peso, navegação Resumo/Evolução/Histórico permite acessar gráfico e registros sem percorrer todos os cartões. Resumo agrupa bíceps, coxas e panturrilhas em pares direito/esquerdo; data comum aparece uma vez somente se ambos foram medidos no mesmo dia. Registros parciais continuam usando o último valor informado por campo e exibindo datas individuais quando diferentes. Ausência permanece como traço. Busto, cintura, abdômen e quadril mantêm cartões individuais.

Evolução abre diretamente o gráfico com seletor de medida existente. Histórico oferece Registros/Comparar datas, mantendo edição, remoção/desfazer e validação cronológica. Diferenças usam cor neutra. Editor também organiza pares em grupos, destaca peso, mostra kg/cm por campo e reduz a ênfase de Adicionar. Campos continuam opcionais; seletores de rolagem, confirmação e rascunho salvo apenas em Salvar foram preservados.

Validação: 10 testes de medidas/resumo passaram, incluindo duas regressões de apresentação para dados parciais e datas distintas/iguais; lint e build passaram. Sem mudanças na persistência. Ainda precisa de conferência visual no aparelho.

## Título da sessão com inicial maiúscula — 16/10/2026

Screenshot revelou diferença entre ficha renomeada e título antigo capturado pela sessão. Aplicada formatação de inicial maiúscula ao exibir retomada, modo de treino, resumo e último treino; novas sessões e nomeação de treino livre também guardam título normalizado. Sem reescrever sessões históricas existentes. 24 testes de treinos/fichas, lint e build passaram. Tela de medidas foi apenas avaliada visualmente nesta interação, sem alterações.

## Inicial maiúscula no nome das fichas — 16/10/2026

Ao criar, editar, duplicar ou salvar treino livre como ficha, salvarFicha normaliza espaços externos e converte a primeira letra para maiúscula, preservando as demais. Editor mostra a normalização ao sair do campo e sugere inicial maiúscula no teclado mobile. Sem migração automática de fichas antigas. Regressão cobre criação, edição, acentos e prefixo numérico. Testes do módulo, lint e build passaram.

## Entrada da aba Treino — 16/10/2026

Card de retomada mais compacto, fundo verde escuro e botão principal verde claro. Exibe data da sessão e progresso real de séries/cardios planejados por consultas reativas; registros apagados não entram na contagem. Ficha da sessão ativa identificada como Em andamento e ação Continuar treino com destaque secundário. Treino livre ativo também oferece Continuar treino livre. Retomada limpa a opção de abrir resumo para mostrar a sessão. Demais fichas mantêm Iniciar treino e o fluxo existente de troca/cancelamento. Sem alteração nos dados. Lint e build passaram; visual no aparelho pendente.

## Exercícios duplicados nas listas — 16/10/2026

Confirmado no código um mecanismo capaz de duplicar o catálogo: iniciarBiblioteca cria UUIDs aleatórios por aparelho, e a mesclagem de um aparelho já usado sincroniza exercícios por UUID. A origem exata dos dados reais mostrados no screenshot não foi inspecionada. Adicionada uma projeção de exercícios equivalentes nas listas da biblioteca, na seleção da ficha e na adição ao treino. Comparação inclui nome normalizado e campos funcionais/personalizados; diferenças de notas, instruções, equipamento, carga, descanso, vídeo, origem e alvo de reps mantêm opções separadas. Representante determinístico por ID. Se qualquer ID equivalente já estiver na ficha, as outras cópias não são oferecidas para inclusão.

Os registros persistidos não foram apagados, fundidos nem remapeados; IDs históricos e fotos continuam preservados. Esta correção remove repetições equivalentes da apresentação, sem consolidar séries históricas entre IDs nem resolver diferenças de fotos anexas entre cópias. Uma eventual consolidação persistente precisará tratar essas referências e revalidar a sincronização. Corrigido também o rascunho de adição múltipla de cardio para manter 3 séries planejadas internas, conforme a validação existente da ficha; o treino continua sem gerar séries de força para cardio.

Validação: 113 testes em 14 arquivos, lint e build passaram. Regressões novas cobrem catálogos de dois aparelhos, preservação de dados, representante estável, diferenças personalizadas, exclusão e bloqueio de inclusão equivalente. Sem acesso a banco real ou publicação.

## Seleção sequencial na ficha — 16/10/2026

Cartões selecionados separados por 8 px e borda discreta, sem formar bloco contínuo. Marcador numérico informa a ordem dos toques; adição múltipla agora respeita essa ordem em vez da ordem alfabética da biblioteca. Desmarcar recalcula as posições. Screenshot também mostra nomes repetidos: renderização lista um cartão por ID, e nomes podem pertencer a cadastros distintos. Origem das duplicatas do aparelho não foi confirmada; nenhum registro real foi lido, mesclado ou excluído. Lint e build passaram.

## Preferência de rolagem lateral nos filtros — 16/10/2026

Usuário esclareceu que prefere os filtros musculares em rolagem horizontal; o incômodo era a proximidade da barra. Restaurada a faixa lateral, com 18 px de padding inferior e barra discreta. Esta preferência substitui a grade da alteração anterior. Sem mudanças de comportamento ou dados.

## Filtros musculares sem corte lateral — 16/10/2026

Após screenshot do usuário, substituída a faixa horizontal por grade de três colunas, com Todos os grupos em uma linha própria, botões de pelo menos 44 px e destaque verde na seleção. Ajuste compartilhado entre biblioteca e seleção na ficha/treino. Sem mudanças na filtragem ou persistência. Lint e build passaram; aparência no aparelho pendente.

## Biblioteca inspirada nas referências do usuário — 16/10/2026

Implementada agora, por solicitação expressa do usuário, a adaptação da biblioteca; animações continuam na etapa 14. Lista com miniaturas/fotos próprias ou ícones existentes, nome/grupo/equipamento, filtros Todos/Por músculo/Cardio e pesquisa por palavras, acentos e equipamento. As primeiras 40 opções aparecem de imediato; Mostrar mais amplia a lista, e a busca considera o catálogo inteiro. Na ficha, é possível selecionar vários exercícios e adicionar de uma vez ao rascunho; Salvar continua necessário para persistir a ficha. Durante um treino, a adição individual continua disponível.

Incluído catálogo opcional de 421 nomes/variações adaptados das capturas, agrupados e com aliases para nomes equivalentes identificados. Não é uma reprodução exata da contagem 454 do outro aplicativo: as referências contêm sobreposições, sinônimos e nomes truncados. OCR bruto preservado em REFERENCIAS-EXERCICIOS-OCR.json como apoio de conferência; nenhuma imagem de terceiro foi incorporada ao app. Não foram inventadas instruções técnicas, vídeos nem métricas de popularidade.

A ação Ampliar catálogo na aba Exercícios importa os itens que faltam. Não é executada automaticamente sobre os dados do usuário. Importação transacional, IDs estáveis entre aparelhos, comparação normalizada incluindo itens excluídos e proteção por ID de itens renomeados. Não sobrescreve campos personalizados nem recria exclusões. Mantido o seed original para não alterar a identificação de instalação intacta na primeira sincronização. Mobilidade/funcional seguem o modelo existente de exercícios; não foi implementado um novo modo de séries por duração. Modalidade cardio sem tipo específico usa o fluxo Outro já existente.

Validação: 110 testes em 13 arquivos, lint e build passaram. Três regressões novas verificam importação repetida, exclusão/edição, identidade entre aparelhos, aliases, modo corporal/cardio e busca. Validação visual mobile permanece pendente; não houve acesso ao banco real nem publicação.

## Cancelar treino iniciado por engano — 16/10/2026

Adicionadas as ações Cancelar treino e Cancelar atual e iniciar outro, com confirmação explícita. Cancelamento usa exclusão lógica do treino, itens, séries e cardio vinculado, sem registrar finalização ou modificar a ficha. Troca e cancelamento são atômicos: se a nova ficha falhar, o treino anterior permanece. A ação existente de salvar/finalizar continua disponível com rótulo Finalizar atual e iniciar outro. Registros históricos anteriores não foram alterados automaticamente. Três regressões cobrem troca sem histórico, rollback e proteção de treino finalizado; 19 testes do módulo, lint e build passaram.

## Interface do treino em andamento — 16/10/2026

Resumo com progresso numérico/barra, controle de tela mais compacto, cabeçalho de exercício refinado e séries com maior destaque. Instruções viraram atalho Como fazer ao lado do descanso; referência do último treino foi movida para depois das séries. Estilos limitados ao modo de treino, preservando fichas e histórico. Sem mudanças na persistência ou conclusão de séries. Lint e build passaram; aparência no celular ainda depende de validação visual do usuário.

## Descanso sem confirmação — 16/10/2026

O pop-up de descanso fecha automaticamente ao chegar a zero, mantendo som/vibração quando disponíveis e sem concluir séries automaticamente. Ao retornar ao app com o tempo vencido, o descanso é encerrado sem pedir toque. Pular e ajustes de tempo continuam disponíveis. O alerta final pode terminar após o fechamento automático; pular cancela a contagem. Lint e build passaram; som/vibração e retorno do bloqueio precisam de conferência no aparelho.

# Correções após a consolidação

## Remoção do cartão de conflito na página — 16/10/2026

Por solicitação do usuário, removidos o cartão inline de revisão e seus estilos específicos, redundantes com os pop-ups. Sincronizar agora continua abrindo primeiro o aviso e depois a comparação. Ao adiar/fechar, o usuário pode reabrir pelo mesmo botão; a contagem de alterações pendentes permanece. Mantido o aviso independente de pausa após restauração. Sem alteração na persistência ou resolução de conflitos; validação com lint/build.

## Comparação compacta em cartões — 16/10/2026

Refinamento visual solicitado: título Comparar registros, instrução curta e Atualizar como ação discreta. Duas opções selecionáveis lado a lado mostram origem, até dois valores principais e horário da versão; seleção realçada e confirmação explícita no fim. A tabela completa, incluindo metas e medidas adicionais, fica em Ver todos os detalhes, sem remover os campos da decisão. Preservada a verificação da versão escolhida antes da aplicação e o estado de conclusão/espera. Alterados apenas RevisaoSincronizacao.tsx e CSS. Lint/build aprovados; conferência visual no navegador permanece com o usuário. Sem alteração de dados/SQL/publicação.

## Aviso e comparação em dois pop-ups — 16/10/2026

Ajuste solicitado pelo usuário: após sincronização manual com conflitos, abre primeiro um aviso central curto, com Revisar registros e Revisar depois. A ação principal fecha esse aviso e abre o diálogo de comparação; há um único pop-up de conflito aberto por vez. O cartão inline fica oculto durante esses diálogos e permanece disponível caso o usuário adie. Sincronização automática continua sem interromper o uso. Fluxo anterior de abertura direta da comparação substituído. Alterados apenas componente e CSS; lint/build verificados, homologação visual pelo usuário.

## Pop-up de conflito após sincronização manual — 16/10/2026

Solicitado pelo usuário: clicar em Sincronizar agora abre automaticamente a revisão em diálogo centralizado quando o ciclo retorna revisão pendente. O estado retorna a indicação ao botão acionado; esse botão solicita a abertura apenas de sua instância da revisão, após os conflitos estarem carregados. Fechar não causa reabertura automática; novo clique pode abrir novamente. Sincronizações automáticas continuam com aviso discreto, e Revisar registros permanece disponível. Mantidos comparação, confirmação, espera animada e Concluído. Lint/build passaram; conferência do fluxo visual com o usuário. Sem alteração de dados/SQL ou publicação.

## Regressão: cadastrar outro dia movia o registro atual — 16/10/2026

O usuário relatou que, ao cadastrar passos em 15/10, o dia 16 deixou de aparecer. Causa confirmada no código: AtividadeHoje encaminhava o registro da data inicial também pelo botão Registrar um dia; o ajuste anterior reutilizava seu ID para qualquer data escolhida. A auditoria da base pessoal não foi executada e os valores anteriores não foram reconstruídos automaticamente.

Correção: fluxo explícito de novo registro, acesso pelo cartão do dia e edição pelo histórico. Registrar um dia começa sem registro de origem. Trocar a data pelo cartão cria outro registro, mantendo o original e os valores preenchidos. Mover um registro exige entrar por Editar, usar Corrigir data e confirmar a mudança exibida no formulário; a camada de dados também exige autorização explícita para mover. Destinos ocupados continuam bloqueados. O helper `salvarFormularioAtividade` centraliza essa distinção e é usado pelo editor real.

Arquivos: AtividadeHoje.tsx, EditorAtividade.tsx, dados/atividade.ts, CSS e regressões em cardio.test.ts e recuperacao.test.ts. Acrescentados cenários com dias 15 e 16 coexistindo nos dois fluxos de cadastro, proteção de destino ocupado e movimento somente após confirmação. Os testes anteriores de movimento foram ajustados para exigir a intenção explícita. Sem alteração de dados reais, SQL ou publicação.

## Indicador de espera na conclusão — 16/10/2026

No painel Revisão dos registros, o botão desabilitado agora mostra Aguarde com pontos progressivos (`.`, `..`, `...`) enquanto termina a operação. A animação CSS mantém a largura reservada para evitar deslocamento do texto; ao liberar, o rótulo volta a Concluído. Incluídos aria-busy e nome acessível estável, com pontos decorativos ocultos do leitor de tela. Respeita preferência de redução de movimento. Sem alteração no tempo ou na condição de desbloqueio do botão.

## Aviso único de conflito — 16/10/2026

Solicitação visual do usuário sobre a duplicação entre erro vermelho e cartão de revisão: unificados em um cartão discreto com ícone, título, orientação curta, ação verde Revisar registros e indicação de progresso parcial. O motor identifica revisão pendente por `RevisaoPendente`; o estado não a apresenta como falha genérica. Erros reais de rede, sessão ou gravação continuam visíveis, inclusive quando existem conflitos persistidos. Alterados `motor.ts`, `estado.ts`, `RevisaoSincronizacao.tsx` e CSS; sem alteração de dados/SQL. Lint/build aprovados e regressões de recuperação/auditoria reexecutadas. Conferência visual final pelo usuário.

## Apresentação do backup — 16/10/2026

Refinamento solicitado pelo usuário em `BackupConfiguracoes.tsx` e `index.css`: interruptor de fotos, arquivo pronto em cartão compacto com nome/tamanho e indicação de fotos, baixar/compartilhar lado a lado, gerar novo backup como ação secundária após preparar, restaurar e exportar CSV como linhas de opções e lembrete compacto. Aviso redundante de arquivo pronto removido; explicação de registro do backup disponível em detalhes. Concluído limpa o cartão preparado e revoga sua URL pelo cleanup existente, sem marcar backup como salvo. A indicação de fotos pertence ao arquivo preparado, não ao estado posterior do interruptor. Importação, confirmação de substituição e proteção da sincronização preservadas. Validação de lint/build; conferência visual final pelo usuário. Sem publicação.

## Encerramento da revisão de conflitos — 16/10/2026

Após o usuário apontar que o painel vazio não oferecia conclusão, `RevisaoSincronizacao.tsx` passou a mostrar confirmação visual e botão **Concluído**, que fecha o painel e limpa a seleção. Instruções de comparação e Atualizar revisão ficam restritos aos conflitos pendentes. Enquanto uma operação termina, a conclusão permanece desabilitada; se houver falha de sincronização, o painel distingue escolhas salvas de sincronização concluída e mantém o erro visível. Estilos em `src/index.css`. Lint e build passaram; nenhuma mudança no motor, SQL ou dados. Pendente conferência visual pelo usuário.

## Ajuste de atividade diária e retorno da homologação — 16/10/2026

O usuário informou que o teste de restauração local passou e, depois, que o conflito de sincronização funcionou. São validações relatadas pelo usuário no navegador; não equivalem à aprovação integral da etapa 8 nem à homologação física no iPhone.

Após observar que corrigir a data zerava os passos, o usuário solicitou preservar os valores preenchidos. Ajustes em `EditorAtividade.tsx` e `dados/atividade.ts`:

- Mudar a data no rascunho mantém passos e calorias, sem consultar/carregar automaticamente outro registro por cima dos campos.
- A data de um registro salvo pode ser corrigida. A gravação conserva ID e criação, move o registro para o novo dia e não deixa uma cópia ativa no anterior.
- Se o destino já tiver outro registro, a operação é recusada sem sobrescrever nenhum dos dois; o formulário permanece preenchido. Registro removido ou alterado durante a edição também exige reabrir e conferir.
- Metas do dia são preservadas ao editar a mesma data; ao corrigir a data, passam a corresponder ao tipo do dia escolhido. A versão da atividade avança mesmo em gravações no mesmo milissegundo para a sincronização reconhecer a correção.
- Quatro regressões de dados em `src/dados/cardio.test.ts` e uma de propagação para outro aparelho simulado em `src/sincronizacao/recuperacao.test.ts`.

Validação atual: **100 testes passaram em 12 arquivos; lint e build passaram.** O erro inicial de uso de `sortBy` diretamente em Table no novo teste foi corrigido para `orderBy(...).toArray()` antes da execução final. Nenhum dado real foi alterado para testar. Pendente: o usuário repetir a troca de data na interface e conferir a preservação dos campos.

Também houve refinamento visual autorizado na seção de conta: botão de sincronizar com ícone, data alinhada, interruptor acessível para sincronização automática e supressão da mensagem duplicada enquanto sincroniza. Lint/build passaram; validação visual final permanece com o usuário.

## Bloco 1 — backup e conflitos por data — 16/10/2026

Autorizado pelo usuário após a apresentação dos próximos passos. **Implementado e verificado localmente; pendente de homologação em navegador/iPhone e serviços reais.** Sem publicação, SQL remoto, push, merge, tag ou aprovação da etapa 8. `.gitignore` preexistente preservado. Gemini não foi acionado nesta rodada e sua entrega original não foi modificada.

### A01 — restauração local com retomada explícita

- “Substituir neste aparelho” restaura o conteúdo do JSON localmente; não apaga nem substitui dados na conta remota.
- Se o armazenamento já estiver vinculado, uma pausa durável é registrada **antes** da alteração do banco principal. A fila anterior, recibos e diagnósticos de conflito são descartados; o vínculo permanece.
- Sincronização manual, automática e reconstrução da fila respeitam a pausa, inclusive após fechar/reabrir. Se a escrita local falhar, a transação principal faz rollback e a pausa continua, impedindo envios durante uma recuperação incompleta.
- Em Hoje/Conta e sincronização, “Revisar retomada da sincronização” explica que retomar faz uma **mesclagem**: itens da nuvem ausentes do backup podem voltar e versões mais recentes podem prevalecer. Só a confirmação explícita libera essa operação. É possível manter a pausa e continuar o uso local, inclusive exportar a cópia restaurada.
- Em armazenamento ainda sem vínculo, restaurar continua disponível sem pausa. Uma conexão posterior já pede confirmação da mesclagem. Importação em armazenamento vinculado rejeita conteúdo de outra conta antes de alterar os dados.
- A reconstrução de fila também elimina pendências de IDs que não existem mais no banco principal.

Essa decisão evita prometer restauração da conta inteira. Não foi implementada uma operação de apagar dados da nuvem ou forçar o backup a vencer os demais aparelhos. A volta de dados remotos ocorre somente depois da confirmação que explica essa consequência.

### A02 — comparação e escolha do registro do dia

- Antes do envio das tabelas únicas por data (medidas, atividade, água e metas de consumo), o motor verifica os registros da conta, preservando os dois conteúdos quando encontra IDs diferentes para o mesmo dia. Água/consumo têm infraestrutura de dados, sem novos fluxos de cadastro nesta rodada.
- A revisão persistida mostra valores deste aparelho e da conta, com data e horário da atualização. O usuário pode manter um dos registros; a confirmação exige uma escolha explícita.
- A escolha usa o ID já existente na conta para manter um único registro ativo. Os valores recusados ficam no outro ID como exclusão lógica, incluídos no JSON; não são eliminados fisicamente. Fotos vinculadas a uma medida local escolhida passam a referenciar a medida ativa, preservando os Blobs.
- Antes de aplicar, são conferidos o vínculo, a versão da revisão apresentada, os valores locais e o registro remoto atualizado. Se algum deles mudou, a operação pede nova comparação. Alterar uma revisão também invalida a seleção anterior na interface.
- Exclusões são enviadas em lotes separados, antes dos registros ativos. Se a conexão falhar entre esses envios, a fila retoma sem duplicar a data. Não houve mudança no SQL/RLS ou remoção de índices únicos.
- A tabela com conflito aguarda a decisão; as outras tabelas continuam no ciclo. A data de “última sincronização” não avança enquanto houver revisão pendente, e a mensagem informa progresso parcial. Uma colisão 23505 surgida depois da conferência inicial também é convertida em revisão.

### Coordenação e parte de A06

O mesmo Web Lock agora coordena envio, importação, preparo da fila, vínculo e resolução entre abas. O lock foi movido para o motor para proteger também chamadas diretas, evitando locks aninhados no estado da UI. O teste C07 agora exige apenas um vencedor para vínculos concorrentes; a primeira conexão revalida dono sob o lock e base inicial dentro da transação principal, além de capturar o usuário da confirmação.

Sem suporte a Web Locks na interface, essas operações recusam a ação antes da escrita e orientam atualizar o navegador. O uso local de treino/medidas continua disponível. No ambiente de testes sem janela, uma fila de Promises permite verificar a mesma ordem das operações. Essa alternativa é exclusiva de execução sem interface, não uma promessa de coordenação entre abas antigas.

A06 ainda requer homologação real de duas abas e troca de sessão durante primeira conexão. Não foi demonstrado nem declarado corrigido todo interleaving possível do serviço de autenticação.

### Arquivos

- `src/sincronizacao/armazenamento.ts`: fila/recibos/controle extraídos do motor, pausa e lock compartilhado; versão 2 acrescenta `conflitos`, sem editar a versão 1.
- `src/sincronizacao/motor.ts`: reconstrução da fila, conferência de datas, revisões, escolha, retomada e ordem de envio.
- `src/sincronizacao/transporte.ts`: classificação de erro 23505 para reconsulta de conflitos.
- `src/sincronizacao/estado.ts`: integração manual/automática, usuário capturado e ações de revisão.
- `src/dados/backup.ts`: restauração protegida e bloqueio de conteúdo de outra conta.
- `src/componentes/RevisaoSincronizacao.tsx`, `ContaConfiguracoes.tsx`, `BackupConfiguracoes.tsx`, `src/index.css`: avisos, comparação e confirmação de retomada/escolha.
- `src/sincronizacao/recuperacao.test.ts`: 18 regressões adicionais, incluindo RPC real em PGlite com role authenticated.
- `revisao/auditoria.test.ts`: C01/C02/C03/C07 convertidos para comportamento esperado; as demais reproduções de defeitos ainda abertos foram preservadas.
- Documentação: este registro, CODEX.md, CONSOLIDADO.md, README.md e supabase/CONFIGURAR.md.

### Validação executada

- `npm.cmd test`: **95 testes passaram em 12 arquivos** (13,87 s).
- `npm.cmd run lint`: passou.
- `npm.cmd run build`: passou, incluindo TypeScript e service worker com 23 entradas no precache.
- Regressões: pausa após reabrir, vínculo preservado, importação de outra conta recusada, rollback por falha de escrita, importação aguardando envio em curso, pendências obsoletas, escolha local/remota, conteúdo recusado no backup, progresso das outras tabelas, versão da revisão alterada, edição local/remota concorrente, colisão tardia, conexão interrompida depois da escolha, migração da fila 1→2, ausência de Web Locks, vínculo alterado durante download inicial e preservação de foto da medida.
- As duas escolhas também foram exercitadas contra a migração SQL existente em **Postgres embarcado efêmero**, usando a RPC real e mantendo os índices únicos. Nenhum dado real foi lido, substituído ou apagado para esses testes.

### Pendências e limites

Não houve teste visual em 360/390/430 px, VoiceOver, Web Locks real em duas abas, compartilhamento/armazenamento no iPhone ou teste em Supabase hospedado. A UI e os fluxos de retomada/conflito precisam desse checklist antes do aceite. Conferência de versão remota e envio continuam sujeitos ao LWW do servidor; uma edição posterior de outro aparelho pode prevalecer, conforme o protocolo já existente.

A01/A02 ficam como **corrigidos localmente, aguardando homologação**. A03/A04/A05/A07/A08/A09/A10 e H01/H02 continuam abertos. A proteção de importação contra outra conta e o lock não substituem a futura validação de domínio/integridade do backup (A04) nem a homologação completa de contas (A06).

### Checklist sintético no navegador / iPhone

1. Em armazenamento de teste vinculado, exportar backup, criar outro registro e provocar uma falha de envio; restaurar o backup anterior. Reabrir e confirmar pausa, ausência do registro descartado e nenhum envio automático.
2. Escolher manter pausa, registrar dados offline e exportar JSON; depois revisar retomada e confirmar a mesclagem. Dados remotos ausentes do arquivo podem voltar conforme o aviso; uma pendência descartada que nunca chegou à nuvem não deve reaparecer.
3. Em dois aparelhos de teste, criar atividade/medida para a mesma data com valores distintos; sincronizar. Conferir as duas versões na revisão, progresso das demais tabelas e data do último sync sem avanço integral.
4. Testar as duas escolhas, conferir um único registro ativo em ambos os aparelhos, valores recusados no JSON e eventual foto associada à medida escolhida.
5. Editar uma versão enquanto a revisão estiver aberta: confirmar que a escolha antiga é recusada; atualizar a revisão e comparar novamente.
6. Interromper a conexão após a escolha, reabrir e repetir; confirmar retomada sem duplicação. Em duas abas, tentar sincronização/restauração ao mesmo tempo e verificar a ordem.

Usar apenas dados sintéticos e origens isoladas; não restaurar nem apagar a base pessoal do usuário para homologar.
