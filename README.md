# Vida em Dia

PWA pessoal de treino, cardio, medidas, alimentação e saúde. Interface em português, prioridade no iPhone e armazenamento primeiro no aparelho.

## Estado do projeto

ETAPAS 1, 2 e 3 aprovadas (v0.1.0, v0.2.0 e v0.3.0), mantendo o verde original. O usuário validou a etapa 3 no iPhone e aprovou a conclusão em 06/10/2026. ETAPA 4 implementada para homologação em test, aguardando aprovação. As etapas 5 a 14 não foram implementadas.

Inclui React, TypeScript, Vite, Tailwind, Dexie, cinco abas, tema escuro, configurações informativas, ícones, manifest e service worker. Já há registro local de treinos. Login, sincronização e backup chegam nas próximas etapas. O modo claro chega na etapa 13.

### ETAPA 2

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

Os testes verificam inicialização idempotente da biblioteca, duplicação independente, exclusão lógica, rejeição de fichas inválidas e migração da versão 1. Compressão de imagens e interação no Safari precisam de conferência no aparelho.

### ETAPA 3

Use Iniciar treino em uma ficha ou Iniciar treino livre. As séries ficam preenchidas pela última sessão finalizada; a primeira começa com carga 0 e 10 repetições, para você ajustar. O treino do dia usa uma cópia do planejamento: adicionar, reordenar ou remover exercícios não muda a ficha. Treino livre pode virar ficha. Cada exercício aparece uma vez no treino; sessões de cardio serão registradas na etapa 6, sem transformar minutos em séries de musculação.

Exercícios aparecem em cards recolhíveis no treino e no editor de fichas. Toque no nome para abrir abaixo. O card mostra a miniatura da máquina quando cadastrada, resumo e progresso; dentro dele, todas as séries ficam em linhas compactas com reps, kg e Concluir. Abra Opções para carga por lado, drop set e RPE. Recolher o card não apaga alterações nem interrompe o descanso.

O fluxo principal usa seletores por rolagem: toque no número da série para escolher normal, aquecimento, falha ou drop set; toque em reps ou kg para selecionar os dois valores (com frações de 0,25 kg). A confirmação pode aplicar os valores às próximas séries pendentes do mesmo exercício, sem modificar as concluídas. O descanso oferece 30, 45, 60, 90 e 120 segundos; valores antigos personalizados também são preservados. Remover série oferece Desfazer. As ações secundárias das fichas ficam no menu de três pontos.

Toque na miniatura para abrir o detalhe sem expandir as séries. O painel oferece Músculos (texto cadastrado), Instruções (um passo por linha e link de vídeo), Equipamento (nome e fotos da máquina) e Evolução (indicação da etapa 4, ainda sem gráficos). A edição da ajuda também funciona enquanto edita uma ficha, preservando seu planejamento ainda não salvo. Imagens anatômicas e de execução de bancos abertos chegam na etapa 14; não há indicadores fictícios de popularidade.

Tipos de série: normal, aquecimento, até a falha e drop set. No drop set, adicione reduções de carga e reps antes de Concluir; não há descanso entre reduções. RPE opcional fica recolhido. Carga por lado calcula lado × 2 + barra; use barra 0 se não quiser somá-la. Aquecimento fica fora do volume e usa descanso de até 30 segundos.

Concluir salva a série imediatamente e inicia descanso quando há outra série no mesmo exercício. A última sugere o próximo exercício. O timer usa o timestamp de término; a renderização é atualizada com setTimeout, sem diminuir um contador. Ao retornar do bloqueio, mostra o tempo correto e quanto passou do término. O som é liberado no toque em Concluir; o alerta visual continua independente do áudio. Não há notificações em segundo plano. Inclui +15 s, -15 s, pular e silenciar.

Alterações de carga/reps são guardadas no aparelho. Copie a série anterior, acrescente série extra, edite ou desfaça uma conclusão. Ao reabrir a aba Treino, Continuar treino recupera o andamento. Apenas um treino pode ficar ativo por aparelho.

Resumo: duração, volume sem aquecimento (inclui reduções de drop set), comparação com a última sessão da ficha e calorias estimadas automaticamente (MET 5 × peso × horas), usando o último peso registrado em medidas corporais. Não há campos de peso nem edição de calorias no resumo. Sem peso cadastrado, a estimativa aparece como indisponível; o cadastro de medidas chega na etapa 5. Cardio do dia aparece se houver registros; seu cadastro chega na etapa 6. Histórico detalhado, avisos de recorde e progressão chegam na etapa 4.

O banco está na versão 3: nova tabela treino_exercicios, cópia do planejamento diário, e campos de carga nas séries anteriores preservados como total. O teste de migração confirma a preservação das sessões e das cargas da versão 2.

Checklist da etapa 3 no iPhone instalado:

- Inicie uma ficha de dois exercícios e confirme o planejamento sem modificar a ficha original.
- Digite 30 kg por lado com barra de 20 kg; a carga total deve mostrar 80 kg.
- Conclua uma série; ajuste +15 s/-15 s, bloqueie por um tempo e volte. O horário deve permanecer correto.
- Confira som após Concluir, silêncio e alerta visual; a última série do treino não inicia descanso.
- Faça um aquecimento e um drop set; confira o volume no resumo.
- Edite/desfaça uma série, adicione outra e copie a anterior. Reabra o app e use Continuar treino.
- Adicione/remova/reordene exercícios do dia e abra a ajuda sem perder o andamento.
- Em treino livre, salve como ficha e finalize. Confira resumo e pré-preenchimento na próxima sessão.
- Teste Manter tela ligada, câmera/galeria e execução offline em Safari. Esses comportamentos precisam de validação física no aparelho.

Tela ligada usa Screen Wake Lock quando disponível e vídeo invisível via [NoSleep.js (MIT)](https://github.com/richtr/NoSleep.js) como alternativa. O pedido é renovado em visibilitychange. O navegador pode recusar; o botão informa o estado. Referência: [Screen Wake Lock](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API).

## Rodar

Requer Node.js 24 LTS e npm.

```powershell
npm ci
npm run dev
```

Abra o endereço mostrado no terminal. Para testar o service worker, use o build de produção:

```powershell
npm run typecheck
npm run lint
npm test
npm run build
npm run preview -- --host 127.0.0.1
```

O preview local fica em http://127.0.0.1:4173. O service worker não é habilitado no servidor de desenvolvimento. A instalação no iPhone requer publicação com HTTPS; acessar um IP da rede via HTTP não é equivalente.

## Testar

- Abra as cinco abas e Configurações; verifique botões, leitura e ausência de rolagem horizontal em 360, 390 e 430 px.
- Abra o preview publicado uma vez, aguarde o aviso de app pronto offline, ative o modo avião e reabra. Todas as abas devem carregar.
- Instale no iPhone pelo Safari e confira notch, barra inferior e ícone.
- Em Configurações, confira app instalado e armazenamento persistente. O navegador pode não conceder persistência.
- Após publicar outra versão, reabra conectado: deve aparecer “Nova versão disponível”, com atualização ao tocar no botão. A checagem também ocorre a cada hora enquanto o app está aberto.
- Na ferramenta de desenvolvedor, confira IndexedDB `vida-em-dia`, versão 3, com 17 tabelas e um registro de configurações. Atualizar a página não deve duplicá-lo.

Os testes automatizados verificam inicialização idempotente, exclusão lógica, preservação após reabrir e data local. A validação física no Safari do iPhone depende de teste no aparelho.

## Dados e arquitetura

`src/dados/modelos.ts` define os registros. Todos têm UUID local, `user_id` nulo antes do login, timestamps ISO e `apagado_em`. Datas de calendário são `AAAA-MM-DD` locais. `banco.ts` declara os índices; `repositorio.ts` separa a persistência da interface e usa exclusão lógica.

Nunca edite uma versão de schema já distribuída. Adicione `banco.version(2).stores(...)` e, quando necessário, `.upgrade(...)`, preservando os dados antigos. Fotos têm pontos de armazenamento em Blob; processamento de imagem só na etapa 2. A fila de sincronização será definida com migração na etapa 8.

## Variáveis de ambiente

Nenhuma variável é necessária na etapa 1. `.env.example` reserva nomes públicos para a etapa 8, sem valores. Nunca versionar `.env`, senhas ou chaves secretas. `service_role` nunca entra no front-end. Configure valores distintos em Preview e Production na Vercel quando a integração for implementada.

## Git e entrega

- `main`: produção aprovada até a ETAPA 3.
- `test`: homologação.
- `etapa-1-base-pwa`: implementação da etapa 1.
- `etapa-2-exercicios-fichas`: implementação da etapa 2, criada após atualizar `test`.
- `etapa-3-modo-treino`: implementação da etapa 3, criada após atualizar `test`.

Como o projeto começou vazio, não existia remoto para executar `git pull`. Um commit inicial de proteção de arquivos serve de ancestral comum às três branches. Nas próximas etapas, atualize `test` com `git pull --ff-only` antes de criar a branch.

Commits pequenos em português, no formato `tipo: descrição no imperativo`, até 72 caracteres, sem assinaturas adicionais. Verifique `git log` antes de cada push. Não altere o autor configurado. O workflow de validação executa typecheck, lint, testes e build.

Entregue a branch para `test`, publique o preview e espere aprovação explícita da etapa inteira. Somente depois de “aprovado”, integre `test` em `main` com `--no-ff`, adicione a linha da etapa aprovada ao CHANGELOG, crie a tag da etapa aprovada, envie a produção e atualize `test` com `main`. Nunca use push forçado em `main`; desfazer com `git revert`.

## Publicar gratuitamente na Vercel

1. Crie o repositório público `vida-em-dia` no GitHub e envie as branches. Consulte `ENTREGA.md` caso o terminal deste ambiente não consiga autenticar.
2. Faça o primeiro preview com `npx vercel`, conforme `ENTREGA.md`, usando o plano Hobby para uso pessoal. Selecione preset Vite, instalação `npm ci`, saída `dist` e comando de build definido em `vercel.json`. Não use `--prod`.
3. Configure a Production Branch como `main` antes de conectar o Git. Não promova o preview para produção antes da aprovação e não configure `test` como produção.
4. Conecte o repositório em Settings > Git e mantenha deployments automáticos. Pushes em `test` e branches de etapa geram previews; pushes em `main` geram produção. Se o painel exigir `main` no remoto para configurar a integração, continue com previews via CLI até a primeira aprovação.
5. Use o endereço da branch `test` para homologação, sempre o mesmo. A Vercel fornece HTTPS. Se houver proteção de preview, autentique-se no iPhone antes de instalar.
6. Após aprovação e push de `main`, use o endereço de produção como endereço definitivo do app.

Importante: os dados de cada endereço ficam separados. O preview e a produção não compartilham IndexedDB. O app ainda não possui exportação nem sincronização; não registre dados reais antes das etapas de proteção.

Referências: [Vite](https://vite.dev/guide/), [Tailwind com Vite](https://tailwindcss.com/docs/installation/using-vite), [PWA para React](https://vite-pwa-org.netlify.app/frameworks/react.html), [versionamento Dexie](https://dexie.org/docs/Version/Version), [deploys Git na Vercel](https://vercel.com/docs/git).

## Instalar no iPhone

Abra o endereço HTTPS no Safari → Compartilhar → Adicionar à Tela de Início → Adicionar. Depois abra pelo ícone. Instale primeiro e só depois faça login ou registre dados, quando essas funções estiverem disponíveis. Safari e app instalado podem usar armazenamentos separados; cada URL tem seus próprios dados.

O app solicita `navigator.storage.persist()` sem depender da concessão. A proteção real será instalar, sincronizar e fazer backups. Esta etapa não implementa notificações, timer, som ou Wake Lock; esses recursos pertencem ao modo treino.


## Adição aprovada ao planejamento da etapa 4

Em 06/10/2026, o usuário pediu e aprovou deixar para a etapa 4 um card de resultado do treino para compartilhar. Após finalizar uma sessão, oferecer a geração de uma imagem vertical para Stories, com a identidade verde do Vida em Dia e foto opcional. Usar dados reais do treino: nome da ficha, duração, exercícios concluídos, volume total, recordes e calorias estimadas somente quando houver peso cadastrado. Identificar as calorias como estimativa; sem peso, omitir essa informação. Oferecer baixar a imagem ou compartilhar pelo celular. Não publicar automaticamente em redes sociais. Esta adição não deve ser implementada durante a etapa 3. A imagem de referência enviada pelo usuário mostra foto opcional e métricas em um card de conclusão.

Descanso da etapa 3: painel central obrigatório entre séries e exercícios, mantido aberto após zerar até a ação Continuar. Oferece ±15 segundos, pular/continuar e silenciar; acrescentar tempo após o término começa a contar a partir de agora. Bipes nos últimos 10 segundos e alerta final de aproximadamente 3 segundos; silenciar ou continuar interrompe o som. A última série do treino não inicia descanso. Validar áudio no Safari/iPhone físico.

A migração 4 separa Glúteos e Panturrilhas nos exercícios já cadastrados, preservando IDs e vínculos de fichas/treinos. Descrições próprias de músculos são mantidas. A biblioteca nova e o editor também usam os grupos separados.



## ETAPA 4 — histórico e evolução (aguardando aprovação)

A aba Evolução reúne os treinos concluídos e a evolução por exercício. Busque por nome da ficha, exercício ou data (ISO ou formato brasileiro). Cada sessão mostra as séries realizadas e pode ser removida com Desfazer; a remoção é lógica e preserva as séries para restauração.

No detalhe do exercício, Evolução mostra carga máxima, maior volume por sessão, 1RM estimado por Epley, comparação de carga com a sessão anterior e gráficos Recharts de carga e volume. Aquecimentos, séries pendentes e registros excluídos não entram nas métricas. Drop sets somam as reduções com carga total. Recordes são recalculados a partir dos dados visíveis, inclusive de treinos antigos; a primeira sessão estabelece a referência, sem recordes fictícios. Durante o treino, superar uma marca anterior exibe Novo recorde.

O editor do exercício permite ajustar o alvo de reps (padrão 12). Se todas as séries normais da última sessão, sem pendências, atingirem o alvo, aparece uma sugestão de aumentar a carga gradualmente. Se sessões recentes registrarem pelo menos quatro semanas sem aumento de carga máxima, aparece um aviso de recuperação. As sugestões não alteram cargas automaticamente.

Após finalizar, a lista de fichas oferece Gerar card para compartilhar para o último treino. Qualquer treino do histórico também oferece Compartilhar. O card PNG vertical 1080 × 1920 inclui foto opcional, nome, data, duração, volume, exercícios, séries, recordes e grupos. Calorias aparecem como estimativa quando há peso registrado; caso contrário, aparece um traço. A foto fica apenas em memória para este card, sem cadastro permanente (galeria de progresso na etapa 11). A imagem é gerada no aparelho, sem serviço externo. Compartilhar usa o menu nativo quando suportado; Baixar imagem permite salvar e publicar manualmente. Não há publicação automática em redes sociais.

Typecheck, lint, 25 testes e build passaram. Falta validar no iPhone: gráfico/toque, card com foto, download e compartilhamento, incluindo funcionamento offline. Main continua na versão aprovada v0.3.0; nenhuma tag v0.4.0 foi criada.
