# Entrega da ETAPA 1

Implementação local na branch `etapa-1-base-pwa`. Integração local em `test` após typecheck, lint, testes e build. `main` preservada com apenas o commit inicial de `.gitignore`, sem a etapa e sem tag de versão.

## Publicar a homologação

A autenticação funciona no terminal do usuário, mas o terminal desta sessão recebe HTTP 401 do GitHub. Não é necessário refazer seu login nem compartilhar credenciais. Rode no seu terminal autenticado, em ordem:

```powershell
cd "C:\Users\breno\Documents\Codex\2026-10-05\ol\outputs\vida-em-dia"
git switch etapa-1-base-pwa
git log --oneline --format="%h %s" -10
gh repo create vida-em-dia --public --source . --remote origin
git push -u origin etapa-1-base-pwa
git push -u origin test
```

Como a etapa foi integrada localmente em `test`, não há diferença restante para abrir um PR para essa mesma branch. Nas próximas etapas, abra o PR antes do merge. O remoto `main` será enviado somente após a aprovação; não faça push de produção agora.

## Preview HTTPS na Vercel

Para publicar somente um preview antes da aprovação:

```powershell
git switch test
npx vercel login
npx vercel
```

Selecione sua conta pessoal, crie o projeto `vida-em-dia`, use a pasta atual e aceite o preset Vite. Não use `--prod`. O comando retorna o link HTTPS para testar no iPhone. Selecione o plano gratuito Hobby; não contrate recursos pagos.

No painel do projeto, configure a Production Branch como `main` e conecte o repositório GitHub em Settings > Git para automatizar os previews de `test`. Caso a configuração dependa de a branch `main` existir no remoto, mantenha os previews pelo CLI até a primeira aprovação. Não selecione `test` como branch de produção.

Use o mesmo endereço de preview da branch para seus testes; URLs de deployments individuais têm armazenamentos diferentes. Envie o link de preview para a conferência da etapa. O README contém o checklist e as instruções de instalação.

## Depois da aprovação explícita

Estes comandos não devem ser executados antes de aprovar toda a etapa. A aprovação autoriza registrar a etapa no CHANGELOG, integrar com produção e criar a versão.

```powershell
git switch test
git pull --ff-only
npm ci
npm run typecheck
npm run lint
npm test
npm run build
```

Após atualizar o CHANGELOG com uma linha para a etapa aprovada e fazer o commit em português:

```powershell
git switch main
git merge --no-ff test -m "chore: integre a etapa 1 aprovada em produção"
git tag -a v0.1.0 -m "Versão 0.1.0: base do projeto e PWA"
git log --oneline --format="%h %s" -10
git push -u origin main
git push origin v0.1.0
git switch test
git merge --ff-only main
git log --oneline --format="%h %s" -10
git push origin test
```

Confira no painel Vercel que `main` é a Production Branch antes do primeiro push de produção. Somente então a produção deve ser publicada.
