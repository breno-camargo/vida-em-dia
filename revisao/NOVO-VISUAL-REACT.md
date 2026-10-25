# Novo visual no aplicativo React — cópia isolada

Aplicação local em http://127.0.0.1:5180. Projeto ativo preservado; sem publicação, remoto Git ou conexão Supabase. Trabalho em `vida-em-dia-novo-visual`.

## Aplicado

- Paleta, tipografia, cartões, formulários e painéis alinhados ao protótipo aprovado.
- Cabeçalho e navegação estáveis, com rolagem interna e espaço para as ações.
- Tema claro/escuro usando a configuração já existente, persistida localmente.
- Configurações agrupadas e privacidade recolhível.
- Cinco fichas por página, preservando os índices originais das ações de ordenação.
- Ações do treino fixas acima da navegação; indicador de exercício concluído.
- Refino de edição de ficha, séries, medidas, cardio, backup e restauração.

Os repositórios, cálculos, sincronização e renderizadores dos cards compartilháveis não foram alterados. A sincronização permanece bloqueada pelo isolamento desta cópia.

## Verificação no navegador

Validação geral após as alterações: `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd test -- --run` (265 testes, 43 arquivos) e `npm.cmd run build` passaram.

`node revisao/homologar-novo-visual.cjs`: passou em 360, 390 e 430 px, usando Edge/Playwright e perfis descartáveis com dados fictícios. Verificou navegação sem corte e ausência de overflow horizontal; persistência do tema após recarregar; sete fichas com paginação; conclusão de série e indicador; resumo e salvamento do treino; geração do card original; histórico; peso registrado; preparação do backup protegido. Sem erros JavaScript ou requisições HTTP externas. Capturas em `revisao/capturas-novo-visual/`.

Conferência SHA256 dos 330 arquivos registrados em `ORIGEM-COPIA.json`: zero alterações no original. Arquivos existentes em `src/dados`, `src/utilitarios` e `src/sincronizacao` da cópia também preservados.

## Limites e próximos lotes

Este lote aplica o visual ao aplicativo real; não declara paridade completa com todas as funcionalidades novas do protótipo. A matriz `PARIDADE-APP-PROTOTIPO.md` continua sendo a referência para a implantação por etapas.

Ainda precisam de implementação ou homologação própria: água por tamanho da garrafa, vídeo por exercício, demais diferenças da matriz, aparelho físico e teclado do sistema, gestos em painéis, instalação PWA, compartilhamento nativo e fluxos de conta/sincronização. Não promover a cópia para produção sem revisão e autorização.
