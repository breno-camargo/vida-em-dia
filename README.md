# Vida em Dia

PWA pessoal de treino, cardio, medidas, alimentação e saúde. Interface em português, prioridade no iPhone e armazenamento primeiro no aparelho.

## Estado do projeto

ETAPA 1 implementada localmente, aguardando publicação de homologação e aprovação. Nenhuma etapa aprovada ainda. As etapas 2 a 14 não foram implementadas; as abas exibem estados vazios com a indicação da etapa correspondente.

Inclui React, TypeScript, Vite, Tailwind, Dexie, cinco abas, tema escuro, configurações informativas, ícones, manifest e service worker. Não há login, registro de treino, sincronização ou backup nesta etapa. O modo claro chega na etapa 13.

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
- Na ferramenta de desenvolvedor, confira IndexedDB `vida-em-dia`, versão 1, com 16 tabelas e um registro de configurações. Atualizar a página não deve duplicá-lo.

Os testes automatizados verificam inicialização idempotente, exclusão lógica, preservação após reabrir e data local. A validação física no Safari do iPhone depende de teste no aparelho.

## Dados e arquitetura

`src/dados/modelos.ts` define os registros. Todos têm UUID local, `user_id` nulo antes do login, timestamps ISO e `apagado_em`. Datas de calendário são `AAAA-MM-DD` locais. `banco.ts` declara os índices; `repositorio.ts` separa a persistência da interface e usa exclusão lógica.

Nunca edite uma versão de schema já distribuída. Adicione `banco.version(2).stores(...)` e, quando necessário, `.upgrade(...)`, preservando os dados antigos. Fotos têm pontos de armazenamento em Blob; processamento de imagem só na etapa 2. A fila de sincronização será definida com migração na etapa 8.

## Variáveis de ambiente

Nenhuma variável é necessária na etapa 1. `.env.example` reserva nomes públicos para a etapa 8, sem valores. Nunca versionar `.env`, senhas ou chaves secretas. `service_role` nunca entra no front-end. Configure valores distintos em Preview e Production na Vercel quando a integração for implementada.

## Git e entrega

- `main`: produção; nesta inicialização contém apenas o `.gitignore`, sem o código da etapa.
- `test`: homologação.
- `etapa-1-base-pwa`: implementação da etapa 1.

Como o projeto começou vazio, não existia remoto para executar `git pull`. Um commit inicial de proteção de arquivos serve de ancestral comum às três branches. Nas próximas etapas, atualize `test` com `git pull --ff-only` antes de criar a branch.

Commits pequenos em português, no formato `tipo: descrição no imperativo`, até 72 caracteres, sem assinaturas adicionais. Verifique `git log` antes de cada push. Não altere o autor configurado. O workflow de validação executa typecheck, lint, testes e build.

Entregue a branch para `test`, publique o preview e espere aprovação explícita da etapa inteira. Somente depois de “aprovado”, integre `test` em `main` com `--no-ff`, adicione a linha da etapa aprovada ao CHANGELOG, crie `v0.1.0`, envie a produção e atualize `test` com `main`. Nunca use push forçado em `main`; desfazer com `git revert`.

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
