# Fluidez e desempenho — 23/10/2026

Escopo: cópia local `vida-em-dia-novo-visual`. Projeto ativo preservado (330 hashes conferidos, zero alterações). Sem novas dependências, publicação, migração ou mudanças nas regras dos dados.

## Alterações

- Transição compartilhada em `useTransicaoSuave`: entrada sutil por opacidade de 0,92 a 1 em 120 ms. Aplica-se à área principal e às abas internas, sem animar dimensões, transformar a navegação, bloquear cliques ou usar key para remontar formulários. Interromper uma troca cancela a animação anterior; preferência por movimento reduzido desliga o efeito e uma mudança dessa preferência cancela o efeito em andamento.
- Painéis e conteúdos usam a mesma opacidade inicial discreta; durações curtas mantidas.
- Treino agora é um módulo carregado separadamente. Pré-carregamento no tempo ocioso prepara o acesso mais frequente; foco, aproximação do ponteiro e início do toque preparam as outras telas. O carregamento ocioso é dispensado quando o navegador informa economia de dados. Nenhuma tela ou recurso foi removido.
- Miniaturas usam um único IntersectionObserver compartilhado e só consultam fotos quando próximas da área visível. Ícones e dimensões permanecem disponíveis; fotos passam a carregar ao rolar. Metadados já disponíveis na listagem são reutilizados, sem consultar o mesmo exercício de novo por miniatura. URLs temporárias continuam revogadas na limpeza.
- Filtros, ordenação, lista de exercícios disponíveis e mapa de seleção são memoizados. Digitar o nome da ficha ou selecionar um exercício não repete toda a preparação de listas inalteradas.

## Medição reproduzível

`node revisao/medir-fluidez.cjs antes|depois` mede abrir “Exibir todos”, com 488 exercícios, em três perfis descartáveis no Edge headless, viewport 390×844. Arquivos de resultados: `fluidez-antes.json` e `fluidez-depois.json`.

- Antes: cada rodada fez 448 leituras adicionais de exercícios e 448 consultas de fotos (896 operações).
- Depois: zero leituras adicionais de exercícios e oito consultas de fotos no mesmo passo. As fotos restantes são consultadas conforme a rolagem, não eliminadas.
- Os tempos locais foram registrados nos JSONs, mas variam com máquina, cache e carga; não são garantia de latência em celular.
- Build anterior: arquivo principal JavaScript 473,31 kB (141,62 kB gzip). Atual: 335,04 kB (102,18 kB gzip), aproximadamente 29% menor sem compressão. A diferença foi separada em módulos; não representa redução equivalente do aplicativo inteiro, do download completo do PWA ou do tempo de abertura.

## Validação

- Tipos, lint, 270 testes em 44 arquivos e build passaram.
- `conferir-fluidez.cjs`: movimento normal/reduzido, trocas rápidas sem opacidade residual, foco e rascunho preservados ao editar, miniatura de foto fora da tela carregada ao rolar, seleção e salvamento.
- `conferir-offline-visual.cjs`: build servido em 4180; service worker instalado; recarga e acesso aos módulos de Treino, Medidas, Evolução e Configurações sem rede.
- `homologar-novo-visual.cjs`: três larguras, navegação, temas, paginação, treino, resumo, card, medidas e backup.
- `auditar-contraste.cjs`: 21 estados, zero falhas nas amostras. Aguarda conteúdo assíncrono antes de examinar as abas.
- `conferir-memoria-descanso.cjs` e `conferir-previa-card.cjs`: memória do descanso, ajustes temporários e PNG transparente preservados.

Limites: não foi realizado perfil em aparelho físico ou em rede móvel limitada. Não há promessa de FPS constante nem de ausência de gargalos em históricos muito grandes. Dados pessoais, backend e compartilhamento nativo não foram usados nos testes.
