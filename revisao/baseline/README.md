# Baseline — Fase 0

Data: 25/10/2026. Cópia isolada, branch `visual-isolado`. Nenhum arquivo-fonte modificado.

- `npm.cmd run build`: passou; 2.640 módulos; CSS final 198,59 kB (gzip 33,65 kB, valores arredondados pelo Vite). Valores exatos em `validacao.json`.
- `npm.cmd test`: 278 testes / 46 arquivos passaram, 28,75 s.
- 72 screenshots de 390×844, 36 por tema. Índice: [index.html](index.html). Percurso e limitações: [capturas.json](capturas.json).
- Edge headless 156.0.4314.42, escala 1, idioma pt-BR, America/Sao_Paulo, data congelada em 25/10/2026 às 12h locais, redução de movimento. Não equivale a Safari/iPhone físico.
- Perfis descartáveis e fixtures fictícias; requisições externas bloqueadas. Sem erro JS no percurso final.
- Capturas representam o viewport; painéis e listas mantêm rolagem. Seus JSON registram estilos computados e geometria dos elementos visíveis. Não são imagens de página inteira.
- CSS: bytes, gzip, regras, seletores e SHA-256 em `css-metricas.json`. Contagem de regras exclui passos de keyframes; seletores usam a divisão do parser PostCSS, sem separar vírgulas internas de `:is()`.
- Manifestos SHA-256 de `src/` da cópia e do original permitem confirmar preservação. Os renderizadores congelados estão incluídos nesses manifestos.
- Cobertura CSS de ambos os percursos em `*-cobertura-css.json`. Regra não exercitada não prova código morto.

## Exceção aprovada: conta/entrada

O Vite da cópia força Supabase desativado. A seção Conta foi capturada nos dois temas; entrada/cadastro não são alcançáveis. Usuário autorizou registrar a limitação, sem habilitar backend ou simular a tela. Contraste da entrada será avaliado somente pelos valores declarados no CSS, não por renderização.

Qualquer migração que afete `.conta-entrada`, `.formulario-conta`, `.campo-senha` ou `.ajuda-conta` exige lote próprio, identificado como **sem verificação visual**, e aprovação explícita antes de aplicação, inclusive alterações globais que atinjam esses elementos.

## Git e proteção de dados

Primeiro commit autorizado: estado atual versionável da cópia mais baseline. Sem push. `.env*`, `node_modules`, `dist` e `.vercel` ignorados; adicionadas proteções para chaves privadas e arquivos de credenciais. Nenhum conteúdo de `.env` foi lido. Varredura dos candidatos não encontrou padrões de chave privada, JWT, segredo Supabase ou chave AWS; isso não constitui prova absoluta de ausência de qualquer segredo.

## Reprodução

Com o servidor da cópia em `http://127.0.0.1:5180`, executar `node revisao/baseline/capturar.cjs`. O script usa Playwright disponível no runtime Codex e Edge instalado. Ele grava apenas os artefatos desta pasta; não altera fontes, testes ou o banco do navegador pessoal.
