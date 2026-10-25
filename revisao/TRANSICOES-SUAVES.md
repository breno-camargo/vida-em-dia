# Transições refinadas — 24/10/2026

Pedido: troca de abas estava seca, sobretudo após o gesto horizontal.

Implementado em `useTransicaoSuave.ts`: entrada de 20px na direção da navegação, opacidade de 0,72 a 1 e desaceleração em 260ms. A área central usa posicionamento relativo; o main não recebe transform, mantendo os botões fixos ancorados à janela. Cabeçalho e navegação não se movem. Abas internas usam fade de 220ms; controles de 160ms e painéis de 220ms.

Atualização da aba permanece síncrona, sem temporizador para liberar cliques, sem duplicar DOM e sem manter imagens da tela. Animações anteriores são canceladas em trocas rápidas. Movimento reduzido desliga o efeito; sem Web Animations, a navegação continua funcional.

## Verificação

- `node revisao/conferir-transicao-suave.cjs http://192.168.0.14:5181`: direção e duração, toques rápidos, posição restaurada, barra inferior estável, movimento reduzido, ausência da API, atalho de registro e configurações.
- `conferir-deslize-abas.cjs` no Wi-Fi: toques reais emulados, sequência nos dois sentidos, campos, filtros, rodas, limites e treino preservado; normal e movimento reduzido.
- `conferir-reserva-treino.cjs`: botões fixos e espaço inferior em quatro larguras e duas fontes.

Não representa homologação física do iPhone. O usuário deve recarregar o servidor Wi-Fi e avaliar a sensação. O projeto ativo permanece separado.
