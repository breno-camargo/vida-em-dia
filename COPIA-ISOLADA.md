# Cópia isolada para o novo visual

> [!NOTE]
> **Promovido a Aplicativo Principal:** Em 25/10/2026, esta base com novo visual foi promovida a aplicação principal. O isolamento foi desativado, o banco Supabase da prévia foi conectado e o PWA assumiu a identidade oficial "Vida em Dia".

Origem: pasta irmã `vida-em-dia`, branch `test`. O arquivo `ORIGEM-COPIA.json` registra o commit e os hashes dos arquivos copiados. Esta é uma cópia do checkout local atual, não um download da versão publicada.

O projeto original permanece intacto. Os dois protótipos e a matriz `revisao/PARIDADE-APP-PROTOTIPO.md` foram copiados para referência. O novo layout ainda não foi aplicado ao React nesta preparação.

## Abrir

Nesta pasta, execute `npm.cmd ci` uma vez e `npm.cmd run dev`.

- Desenvolvimento: **http://127.0.0.1:5180**.
- Preview do build: `npm.cmd run build`, depois `npm.cmd run preview`, em **http://127.0.0.1:4180**.
- Host limitado a localhost; porta ocupada causa erro, sem escolher silenciosamente outro endereço.
- Não usar a porta do aplicativo original nem publicar esta cópia sem nova decisão.

## Isolamento

- Não foram copiados `.env*`, credenciais, `.git`, `.vercel`, `node_modules`, builds ou logs.
- As três variáveis públicas de Supabase são forçadas a strings vazias no Vite, inclusive se existirem no ambiente do terminal. `envDir` aponta para `ambiente-isolado`, sem arquivos de ambiente.
- O aplicativo inicia em visitante. Não há login ou sincronização com staging/produção habilitados. SQL e funções copiados são apenas arquivos; nada foi aplicado ou implantado.
- IndexedDB/localStorage/service worker usam a origem completa: esquema + host + porta. `127.0.0.1:5180` está separado de `localhost:5173` e `127.0.0.1:5173`. O preview 4180 também tem armazenamento próprio. Não importar dados ou backups pessoais aqui.
- Usar somente registros fictícios. Os dados desta cópia persistem localmente como no aplicativo original; não são sincronizados ou copiados automaticamente do projeto ativo.
- A cópia não possui remoto Git configurado. Não fazer merge/push/deploy como parte do trabalho visual.

## Visual aplicado na cópia

O primeiro lote do layout foi aplicado aos componentes React, reutilizando os cálculos, repositórios, hooks e testes existentes. Cabeçalho e navegação fixos, temas persistidos, configurações agrupadas, fichas paginadas e ações fixas no treino. Os cards compartilháveis aprovados foram preservados. Veja `revisao/NOVO-VISUAL-REACT.md` para validação e pendências. Não substituir o projeto ativo sem aprovação explícita.

## Verificação da preparação

- Dependências instaladas com `npm.cmd ci --offline --no-audit --no-fund`, usando cache local; foi necessária liberação do sandbox para ler o cache do npm. Nenhuma dependência ou versão foi adicionada/alterada.
- `npm.cmd run typecheck`: passou.
- `npm.cmd run lint`: passou.
- `npm.cmd test`: 265 testes em 43 arquivos passaram, incluindo o bloqueio do backend nesta cópia.
- `npm.cmd run build`: passou e gerou o build/PWA localmente; não houve deploy.
- `node revisao/verificar-copia-isolada.cjs`: passou em perfil descartável 390×844. Visitante, Supabase nulo, criar ficha fictícia pelo formulário e encontrar após recarregar; sem pageerror ou requisições HTTP externas. Não visita a origem do aplicativo ativo.
- Hashes dos 330 arquivos da origem permaneceram iguais após a criação da cópia. Sem arquivos `.env*` na raiz desta cópia; repositório local `visual-isolado`, sem remoto ou commit.

Não homologados nesta preparação: todos os fluxos do navegador, aparelho físico, conexão entre contas, compartilhamento nativo e nova aparência. A instalação emitiu aviso de descontinuação de `glob@11.1.0` transitivo; não houve atualização de dependências nem uma nova execução de audit.
