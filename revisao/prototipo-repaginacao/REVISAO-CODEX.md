# Ajustes Codex no protótipo — 22/10/2026

Escopo: somente esta pasta. Nenhum arquivo do aplicativo real foi modificado. Não houve integração, publicação ou instalação de dependências.

## Comportamentos corrigidos nesta etapa

- Treino passou a ser conteúdo da página da moldura, não um modal. Voltar permite navegar e retomar a sessão em memória, sem cancelá-la ou reiniciar seu cronômetro. Iniciar outra ficha enquanto há sessão ativa leva à sessão existente.
- Exercícios iniciam recolhidos. A abertura é mantida ao editar séries; ao concluir todas as séries, o exercício é recolhido.
- Descanso selecionável por exercício e na ficha. Concluir uma série abre painel de descanso com contagem, −15 s, +30 s e Pular. O restante também aparece na página durante a contagem.
- Repetições e carga ganharam painel Rolar/Digitar com confirmação, em lugar de incrementos fixos. Carga aceita passos de 0,25 kg. Tipo de série exige escolha explícita. Séries planejadas e descanso da ficha usam seleção com confirmação.
- RPE e peso da barra agora atualizam a série pelo índice correto; removidos os handlers que dependiam de variável fora de escopo.
- Nome do treino livre pode ser digitado. Cancelar usa painel próprio, com opção de continuar depois.
- Medidas mantêm edição por digitação com inputmode decimal, solicitando teclado numérico compatível no celular. O teclado virtual precisa ser conferido em aparelho real.
- Tema claro: superfícies mais suaves, texto de destaque escuro, tratamento dos botões e bordas, sem mudar o layout geral. Controles do protótipo no topo não causam mais overflow em 360/390 px.

## Verificação realizada

`node validar-codex.cjs`, Edge headless já instalado, Playwright externo ao projeto; navegação file:// e requisições HTTP bloqueadas. Perfis descartáveis, dados fictícios.

Passaram em 390×844 e 360×844: iniciar ficha, exercícios recolhidos, sair sem cancelar e retomar, reps=13, carga=52,25, RPE=7,5, descanso=45 segundos, painel após conclusão de série, pular descanso, recolhimento após todas as séries, alternância claro/escuro, ausência de overflow do documento, inputmode decimal de medidas e ausência de pageerror nesse percurso. Capturas `exemplos/codex-treino-{dark,light}-{390,360}.png`.

## Limites e trabalho restante

### Gesto de fechamento e critério de aceite

O usuário reafirmou que quer todas as funcionalidades atuais, sem exceção. A lista de limites abaixo é trabalho pendente, não redução de escopo aprovada. Nenhuma declaração de equivalência completa deve ser feita antes de cobrir os caminhos existentes.

Implementado arraste por Pointer Events na alça/cabeçalho do painel ativo: deslocamento acompanha o dedo, gesto curto retorna e gesto suficiente fecha só o painel superior. Inputs/botões e corpo rolável não iniciam esse gesto. A alça também aceita Enter/Espaço. Treino permanece página, fora desse fechamento. Testes em 360/390 px com ponteiro: 10 px mantém aberto e 90 px fecha; percursos anteriores continuam aprovados. Não substitui teste de toque físico em iOS/Android.

### Revisão do seletor de rolagem

Substituído o posicionamento por offset relativo por índice × 48 px, como no seletor original. A faixa central é fixa, com cinco posições, bordas esmaecidas e maior destaque no valor ativo. Seleção acompanha a rolagem imediatamente; Confirmar consulta a posição atual, sem aguardar timer. Clique não rola mais a página inteira via scrollIntoView. Acrescentados listbox/options, setas/Home/End e sincronização ao retornar de Digitar. Testes em 360/390 px verificam seleção por setas, alinhamento central menor que 2 px e confirmação, além dos percursos anteriores; capturas `codex-rolagem-{360,390}.png`. Inércia e sensação de toque em celular físico ainda não verificadas.

### Revisão mobile adicional

- Ferramentas de demonstração recolhidas em “Prévia · tema e telas”, sem retirar controles; antes ocupavam cerca de 200 px da tela. A moldura passa a ocupar a altura disponível, sem barra de status fictícia no celular.
- Navegação inferior permanece acessível e o conteúdo central rola sem crescer indefinidamente. Formulários têm fonte de 16 px nos inputs para evitar zoom automático no Safari, sujeito à conferência física.
- Resumos dos exercícios com ajuda compacta de 44 px; ações secundárias recolhidas em “Mais opções do exercício”. Linhas de série mantêm alvos mínimos de 44 px e títulos longos podem quebrar linha. Editor de fichas distribui séries/descanso em uma linha própria.
- Painéis limitados à altura do viewport visual, com área central rolável e margem para ações/safe area. O teste reduziu a altura para 440 px e confirmou que o botão Confirmar continua alcançável; isso não simula integralmente teclado virtual de iOS/Android.
- Validação adicional por controles em 360/390 px: criar ficha, adicionar exercício, escolher cinco séries, salvar e conferir estado; digitar medida decimal; bloquear backup com senhas divergentes e habilitar com senhas coincidentes. Não gera nem valida backup real.
- Capturas claro/escuro atualizadas e inspecionadas. Sem pageerror nos percursos automatizados. Revisão restrita aos caminhos citados, não uma declaração de homologação completa de todo o software.

Esta etapa não torna verdadeiras as alegações anteriores de cobertura completa do relatório Gemini. Não é uma integração nem uma prova de equivalência integral dos cards congelados. Os compartilháveis não foram alterados. Os seletores deste protótipo são uma simulação isolada; o componente real continua intacto.

Continuam pendentes de revisão/cobertura: drop sets completos e reduções, peso corporal, aplicação às próximas séries, cálculo de carga por lado/barra e volume equivalente ao app, biblioteca/fotos/edição completa, detalhes de cardio e demais caminhos de conta/backup/privacidade. Exportação/importação seguem simulações anteriores; não houve validação de criptografia ou dados reais nesta etapa. Não declarar todos os fluxos homologados.

Não executados nesta etapa: Safari/iPhone físico, leitor de tela, auditoria completa de contraste e testes de todos os caminhos. A autorização do usuário permite teclado decimal nas medidas; não foi alterado o componente real de rolagem. Próximo passo: avaliação visual pelo usuário e continuação da cobertura dentro do protótipo.

## Atualização de cobertura — 22/10/2026

Esta atualização substitui a lista de pendências técnicas acima nos itens expressamente descritos abaixo; não declara equivalência integral com o aplicativo.

### Acrescentado ao protótipo isolado

- Séries: editar repetições e carga no mesmo painel; aplicar às próximas séries ainda pendentes; total, por lado com barra e peso corporal; RPE; copiar valores anteriores; tipos de série e reduções de drop set. Cálculo de volume desconsidera aquecimento e peso corporal e inclui reduções concluídas.
- Finalização: aproveita o peso cadastrado mais recente até a data da sessão, sem pedi-lo novamente. Permite informar outro peso para a sessão e calcula a estimativa de calorias. Histórico recebe os itens efetivamente concluídos.
- Biblioteca: cadastro/edição, instruções, músculos, vídeo, nota, descanso, repetições-alvo e fotos fictícias em memória; bloqueio de exclusão de exercício utilizado em ficha.
- Cardio: cadastro, edição, remoção com Desfazer, vínculo ao treino, campos condicionais por modalidade e acesso ao compartilhável da sessão selecionada. Campos opcionais vazios não recebem números inventados.
- Configurações: metas distintas por tipo de dia, modo de calorias, fator de ajuste, lembretes e feriados; registro e histórico de atividade diária, com confirmação de mudança de data.
- Backup demonstrativo: arquivo criptografado de verdade com WebCrypto, senha confirmada, PBKDF2-SHA256/600.000, AES-256-GCM, salt/IV aleatórios e cabeçalho autenticado; download, revisão de importação, mesclar/substituir e aviso para JSON/CSV legíveis. Removidos ficam fora por padrão. Limite de 250 MB. O formato é exclusivo deste protótipo: NÃO importar backups reais do aplicativo. Dados somente em memória.
- Compartilháveis: cópia transpilada do renderer existente, preservando a composição aprovada. `renderer-origem.json` registra os hashes das fontes. Prévia e PNG nos modelos Tipográfico, Foto e Editorial, opção de foto, cor do texto, download e caminhos de copiar/compartilhar conforme suporte do navegador. Não foi alterado nenhum renderer em `src/`.
- Conta e privacidade: aviso explícito de demonstração e mensagens de sucesso qualificadas como simulação, sem alegar alteração de Auth, nuvem, senha ou banco real.

### Evidência automatizada

Comando na raiz: `node revisao/prototipo-repaginacao/validar-codex.cjs`.

Edge headless instalado, Playwright externo ao projeto, perfis novos, file://, requisições HTTP bloqueadas. Passou em 390×844 e 360×844, sem pageerror nos percursos executados:

- Percursos anteriores de treino/retomada, seletores, descanso, recolhimento, temas, medidas, criação de ficha e altura reduzida a 440 px.
- Volume calculado em caso com carga por lado, barra, drop set, aquecimento e peso corporal: 800 kg.
- Resumo usa 72,5 kg cadastrados; conclusão preserva esse peso.
- Bicicleta com cadência 85, sem campo de passos e sem calorias inventadas.
- Criação de exercício e nota, alteração da meta para 9.000 passos, registro de 6.500 passos.
- Backup exclui medida removida; senha errada não importa; senha correta permite revisão/importação e restaura a medida ativa.
- Geração de PNG/prévia dos três modelos de card, inclusive fallback Editorial sem foto; abertura do compartilhável de cardio pelos controles da tela.

`node --check` passou para funcionalidades, backup e compartilhamento. Não se executou tipos/lint/build do app: os arquivos alterados são scripts estáticos isolados, fora do produto. Nenhuma dependência adicionada, commit, push ou integração.

### Ainda falta para a exigência de todas as funcionalidades

- Conta, confirmação de e-mail, recuperação, sincronização, conflitos, isolamento por identidade, importação legada e privacidade continuam simulações visuais; não reproduzem os serviços ou garantias do aplicativo real.
- Paridade completa de todos os campos e limites de medidas/cardio, duração com segundos, estimativas por modalidade, gráficos/comparações, agregação das metas e calorias diárias e todos os estados vazios/erro ainda precisam de inventário e testes.
- A biblioteca e a lixeira não têm ainda a mesma persistência/relacionamentos do repositório real. Dados de demonstração se perdem ao recarregar.
- Testes citados não cobrem cada combinação de drop set, aplicação às próximas séries, fotos, exclusão, restauração, conflito ou todas as modalidades. Não confundir implementação dos controles com cobertura integral.
- Download nativo no celular, compartilhamento/clipboard, foto real no card, teclado e inércia/arraste com toque físico em Safari/iOS e Android não foram homologados. Sem teste completo de leitor de tela e contraste.

O pedido de todas as funcionalidades permanece como critério de aceite, sem redução de escopo. Esta entrega amplia a cobertura, mas NÃO autoriza substituir o app atual pelo protótipo.

## Continuação — indicador de conclusão e histórico

- Exercício com uma ou mais séries, todas concluídas: faixa verde superior, contorno e texto “✓ Concluído”. Desfazer qualquer série remove o destaque. Exercício sem séries não é marcado concluído. Capturas claro/escuro conferidas visualmente em 390 px; teste também em 360 px.
- Histórico abre detalhes das séries e reduções efetivamente salvas, sem exigir peso corporal para renderizar. Compartilhar seleciona o treino correto, inclusive um registro anterior. Registros fictícios iniciais sem séries mostram aviso, sem inventar detalhes.
- Medidas validam data, pelo menos um campo, número completo, precisão e limites compatíveis com dados/medidas.ts (400 kg/3 casas; 300 cm/2 casas). Antebraços, inexistentes no software real, saíram da interface do editor. Campos internos antigos continuam ocultos por compatibilidade dos handlers. Comparação de registros sem peso não tenta executar toFixed em undefined.
- Cardio ganhou minutos e segundos (armazenados como minutos fracionários), validação de segundos 0–59, passos/comprimentos inteiros e coerência FC média/máxima.
- Hoje mostra metas conforme dia útil/fim de semana/descanso configurado, barras e totais. Modo relógio não soma novamente treino/cardio; modo soma usa calorias já informadas/salvas. Não implementa ainda estimativa de cardio por modalidade, gráficos de períodos nem todos os feriados nacionais.
- Centralização programática do seletor usa rolagem instantânea, evitando interferência da animação nos comandos de teclado.

Validação adicional no mesmo `validar-codex.cjs`: destaque após concluir e remoção ao desfazer; detalhes de série no histórico; bicicleta com 30 min e 30 s; metas e cálculo de gasto nos dois modos (barra limitada a 100%, texto preserva valor total); rejeição de “70abc”; peso de 70,125 kg, complemento de cintura sem perder o peso, confirmação antes de trocar para 71 kg. Passou em 360/390 px, sem pageerror no percurso. Capturas `exemplos/codex-treino-{dark,light}-{360,390}.png` atualizadas.

Continuam válidas as pendências da seção anterior que não foram explicitamente resolvidas aqui. Em particular, conta/sincronização/privacidade continuam demonstrativas, não equivalentes ao backend real. Nenhum arquivo em src foi alterado; sem commit, push ou instalação de dependências.

### Correção de Registrar outro dia

O formulário de atividade reutilizado podia ficar atrás do histórico criado depois dele: a pilha lógica e a ordem visual dos overlays divergiam. `abrirModal` agora atribui z-index pela profundidade da pilha. Salvar atividade fecha também o histórico aberto, evitando lista anterior desatualizada. Regressão em 360/390 px: criar formulário antes do histórico, abrir Registrar outro dia, verificar hit-test do input, preencher/salvar 3.200 passos em 20/10 e reabrir histórico para conferir. Percurso completo passou sem pageerror. Somente protótipo.

### Atividade em dias anteriores e histórico limitado

Botão principal passou a Registrar atividade. No fluxo de registro, a data pode ser qualquer dia válido até hoje; selecionar um dia existente carrega seus passos/calorias, sem criar duplicata nem mover o registro de hoje. Editar pelo histórico mantém confirmação específica para mudar a data. Histórico agora tem filtro por mês, dez registros por página e linhas recolhíveis com ações internas. Teste com 25 registros sintéticos de setembro verificou páginas 10/10/5, filtro de outubro e edição de dia anterior sem duplicar, em 360/390 px. Dados continuam somente na memória isolada do protótipo.

### Água por garrafa — funcionalidade nova no protótipo

Configuração Meu perfil · garrafa em Configurações e acesso pelo card Água em Hoje. Capacidade em ml, sem valor presumido. +1 garrafa, meia garrafa, outra quantidade com até uma casa decimal, total do dia, contagem de garrafas inteiras/meias e Desfazer por dia. Cada lançamento guarda volume e capacidade vigente; mudar a garrafa afeta somente próximos lançamentos. Painel por data permite dias anteriores e consulta dos lançamentos com a capacidade original.

Validação: `node revisao/prototipo-repaginacao/validar-agua.cjs` passou em 360/390 px. Cobriu 3×600=1800 ml, desfazer, meia=300 ml, mudar para 750 sem recalcular passado, total2250, lançamento em outro dia,125,5ml personalizado e desfazer somente daquele dia. Sem pageerror ou overflow horizontal no percurso.

Limites: somente memória desta demonstração. Ainda não incluído no backup demonstrativo, persistência, identidade ou sincronização. Não existe implementação de água no produto real. O teste de teclado decimal/toque em aparelho físico permanece pendente. Sem meta de consumo presumida ou recomendação médica.

### Acabamento visual — configurações, treino e painéis

Botões secundários com fundo/contorno mais definidos; Concluir série com verde de ação. Progresso nativo estilizado em verde, com labels e espaçamento. Configurações organizadas em seções recolhíveis; privacidade com categorias recolhidas, preservando controles de confirmação e avisos. Backup recolhe conteúdo opcional do arquivo e outros formatos; inputs/labels e textos têm espaçamento e tamanhos coerentes. Input de arquivo ajustado à largura do painel.

No treino, barra ancorada acima da navegação oferece progresso, Continuar depois e Ver Resumo e Finalizar. O botão equivalente no final da página fica oculto, sem duplicar ações acessíveis. Altura da navegação observada para reposicionar barra; conteúdo possui margem final para alcançar últimos controles. Funções de cancelar treino continuam no conteúdo. Sem alteração dos cards compartilháveis nem do produto real.

Verificação: validar-codex.cjs e validar-agua.cjs passaram em 360/390 px. Captura de treino escuro 390 inspecionada. Teste adicional abriu/fechou seções de configurações, opções de backup e confirmação de limpeza em privacidade, sem overflow horizontal em 360/390 px. Teclado/toque e safe area em dispositivo físico permanecem para homologação. Controles desabilitados continuam visualmente atenuados, distinguindo-os dos acionáveis.
