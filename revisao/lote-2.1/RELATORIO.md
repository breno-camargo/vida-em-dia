# Relatório do Lote 2.1 — REPROVADO E REVERTIDO

Data: 25/10/2026. **A execução parou na primeira falha, sem nova tentativa e sem avançar para outro lote.**

## Resultado do gate

- Referência ampliada, antes de alterar o CSS: **72/72 imagens com pixel diff = 0** contra a Fase 0; **4936 estados individuais** registrados, com confirmação dos pseudoestados via CDP.
- Todos os estilos CSS computados dos elementos visíveis, dos pseudo-elementos presentes e dos tokens existentes foram registrados. Cada estado foi forçado em um único controle por vez: hover, active, focus-visible e disabled. Os estados armazenam deltas completos contra a referência normal; comparar referência + delta cobre todas as propriedades medidas, sem reduzir a lista a cores/tamanhos selecionados.
- Pós-lote: **escuro/Hoje teve pixel diff = 0, mas diff de estilos computados diferente de zero**. O gate encerrou antes das outras 71 capturas e antes da matriz pós-lote. Portanto **não há aprovação 72/72 nem da matriz pós-lote**.
- O diagnóstico salvo mostra nomes adicionais fora da lista dos 124 tokens propostos: `--ease-in-out`, `--ease-out` e `--tw-outline-style`. Os cinco primeiros elementos divergentes registraram essas adições. O arquivo de diagnóstico limita a amostra a cinco elementos; não se afirma contagem exaustiva de todas as divergências.
- Valores observados: `cubic-bezier(0.4, 0, 0.2, 1)`, `cubic-bezier(0, 0, 0.2, 1)` e `solid`. Os dois primeiros aparecem no tema local do Tailwind, `node_modules/tailwindcss/theme.css:435–436`. O motivo exato de entrarem na geração nesta recompilação ainda requer investigação. Varredura de artefatos/tooling é hipótese, não causa fechada. Eles não foram acrescentados silenciosamente à lista permitida para fazer o gate passar.
- **Reversão automática concluída.** SHA-256 confirmou os **169 arquivos de src/ da cópia e 153 de src/ do original idênticos aos manifestos da Fase 0**, sem arquivos novos de src/. `src/estilos/tokens.css` foi removido. Renderizadores, componentes congelados e testes preservados.
- `npm.cmd test`: **278 testes / 46 arquivos passaram**; execução iniciada em paralelo ao gate, 28,41s. `npm.cmd run build` terminou com código 0, também em paralelo à reversão; **não certifica a implementação rejeitada** porque o momento de leitura das fontes pode ter ocorrido durante/depois da restauração. Os artefatos dist/ são ignorados e não foram publicados.

Evidências: [antes/resultado.json](antes/resultado.json), [depois/resultado.json](depois/resultado.json), [diagnóstico](depois/escuro-hoje-diferencas.json), [reversão e hashes](reversao-verificada.json), [build](build.txt), [testes](testes.txt).

## Arquivos

Arquivos-fonte tentados e integralmente revertidos: `src/index.css`, `src/estilos/controles.css`, `src/estilos/novo-visual.css`, `src/estilos/paleta-clara.css`, `src/estilos/contraste-claro.css`; o novo `src/estilos/tokens.css` foi removido. `superficies.css` não foi alterado. Nenhum arquivo de JSX, lógica ou testes foi modificado.

Ficaram apenas documentação e evidências em `revisao/lote-2.1/` e [BUGS-PRESERVADOS.md](../BUGS-PRESERVADOS.md). Os scripts de aplicação/reversão são tooling de revisão, não arquivos do app. O backup `originais.json.gz` contém exclusivamente os cinco CSS anteriores, sem variáveis de ambiente ou credenciais.

## Tokens da tentativa

**124 nomes novos propostos, 0 mantidos no app após reversão.** Nenhum token existente foi renomeado, removido ou redirecionado. A camada nova apontava para os tokens anteriores, não o inverso; escalas usavam somente literais já presentes. Os blocos eram `:root, :root[data-tema="escuro"]` e `:root[data-tema="claro"]`, sem @layer. A maior especificidade do bloco claro em relação ao fallback :root evita depender da ordem desses dois blocos novos; a cascata legada não foi reorganizada.

**Escuro medido abaixo refere-se à tentativa rejeitada**, não ao estado atual restaurado. **Claro não foi medido no pós-lote**, pois o gate parou antes. A coluna Claro previsto resolve aliases sobre os tokens da referência clara anterior; não é apresentada como comprovação de estilos do lote.

| Nome novo | Declaração escuro | Declaração claro | Escuro computado na tentativa | Claro previsto por alias/literal — NÃO MEDIDO |
| --- | --- | --- | --- | --- |
| --cor-pagina | var(--visual-fundo) | var(--visual-fundo) | #0f1913 | #e7ebdd |
| --cor-painel | var(--visual-painel) | var(--visual-painel) | #17271d | #f8f7ee |
| --cor-campo | var(--visual-rebaixo) | var(--visual-rebaixo) | #101c15 | #e5eddc |
| --cor-borda-superficie | var(--visual-borda) | var(--visual-borda) | #304536 | #b6c6a5 |
| --cor-texto-principal | var(--visual-texto) | var(--visual-texto) | #edf3ed | #20371f |
| --cor-texto-suave | var(--visual-suave) | var(--visual-suave) | #adc1b0 | #475d40 |
| --cor-acento | var(--visual-acento) | var(--visual-acento) | #bcec86 | #315b24 |
| --cor-acento-superficie | var(--visual-acento-fundo) | var(--visual-acento-fundo) | #253c23 | #d6e7c1 |
| --cor-controle-principal-fundo | var(--controle-destaque) | var(--controle-destaque) | #bcec86 | #bcec86 |
| --cor-controle-principal-texto | var(--controle-texto-escuro) | var(--controle-texto-escuro) | #192d18 | #193017 |
| --cor-controle-secundario-fundo | var(--controle-superficie) | var(--controle-superficie) | #263e2b | #dce9cd |
| --cor-controle-secundario-texto | var(--controle-texto) | var(--controle-texto) | #e5f1de | #28431e |
| --cor-borda-controle | var(--controle-borda) | var(--controle-borda) | #58764d | #6f8560 |
| --cor-borda-campo | var(--superficie-campo-borda) | var(--superficie-campo-borda) | #58764d | #6f8560 |
| --cor-painel-topo | var(--superficie-topo) | var(--superficie-topo) | #17271d | #dce7cf |
| --sombra-painel | var(--superficie-sombra) | var(--superficie-sombra) | none | 0 3px 12px #29401c08 |
| --cor-controle-ativo-fundo | var(--controle-destaque) | var(--controle-ativo-fundo) | #bcec86 | #315b24 |
| --cor-controle-ativo-texto | var(--controle-texto-escuro) | var(--controle-ativo-texto) | #192d18 | #f8f7ee |
| --cor-status-ponto | var(--visual-acento) | var(--status-ponto) | #bcec86 | #2f7a24 |
| --cor-aviso-fundo | var(--visual-acento-fundo) | var(--aviso-fundo) | #253c23 | #dbe7c9 |
| --cor-aviso-texto | var(--visual-suave) | var(--aviso-texto) | #adc1b0 | #415535 |
| --cor-aviso-borda | var(--visual-borda) | var(--aviso-borda) | #304536 | #b1c695 |
| --borda-controle-legada-claro | #7c8d76 | #7c8d76 | #7c8d76 | #7c8d76 |
| --fonte-controle | var(--controle-fonte) | var(--controle-fonte) | 13px | 13px |
| --altura-controle | var(--controle-altura) | var(--controle-altura) | 48px | 48px |
| --raio-controle | var(--controle-raio) | var(--controle-raio) | 12px | 12px |
| --raio-campo | var(--campo-raio) | var(--campo-raio) | 12px | 12px |
| --raio-painel | var(--superficie-raio) | var(--superficie-raio) | 18px | 18px |
| --duracao-controle | var(--movimento-curto) | var(--movimento-curto) | 160ms | 160ms |
| --duracao-painel | var(--movimento-painel) | var(--movimento-painel) | 220ms | 220ms |
| --fonte-escala-01 | 8px | 8px | 8px | 8px |
| --fonte-escala-02 | 9px | 9px | 9px | 9px |
| --fonte-escala-03 | 10px | 10px | 10px | 10px |
| --fonte-escala-04 | 11px | 11px | 11px | 11px |
| --fonte-escala-05 | 12px | 12px | 12px | 12px |
| --fonte-escala-06 | 13px | 13px | 13px | 13px |
| --fonte-escala-07 | 14px | 14px | 14px | 14px |
| --fonte-escala-08 | 15px | 15px | 15px | 15px |
| --fonte-escala-09 | 16px | 16px | 16px | 16px |
| --fonte-escala-10 | 17px | 17px | 17px | 17px |
| --fonte-escala-11 | 18px | 18px | 18px | 18px |
| --fonte-escala-12 | 19px | 19px | 19px | 19px |
| --fonte-escala-13 | 20px | 20px | 20px | 20px |
| --fonte-escala-14 | 21px | 21px | 21px | 21px |
| --fonte-escala-15 | 22px | 22px | 22px | 22px |
| --fonte-escala-16 | 23px | 23px | 23px | 23px |
| --fonte-escala-17 | 24px | 24px | 24px | 24px |
| --fonte-escala-18 | 25px | 25px | 25px | 25px |
| --fonte-escala-19 | 26px | 26px | 26px | 26px |
| --fonte-escala-20 | 27px | 27px | 27px | 27px |
| --fonte-escala-21 | 29px | 29px | 29px | 29px |
| --fonte-escala-22 | 30px | 30px | 30px | 30px |
| --fonte-escala-23 | 36px | 36px | 36px | 36px |
| --fonte-escala-24 | 52px | 52px | 52px | 52px |
| --fonte-escala-25 | 56px | 56px | 56px | 56px |
| --fonte-oculta | 0 | 0 | 0 | 0 |
| --fonte-fluida-01 | clamp(19px,5.8vw,25px) | clamp(19px,5.8vw,25px) | clamp(19px,5.8vw,25px) | clamp(19px,5.8vw,25px) |
| --fonte-fluida-02 | clamp(22px,6vw,28px) | clamp(22px,6vw,28px) | clamp(22px,6vw,28px) | clamp(22px,6vw,28px) |
| --espaco-zero | 0 | 0 | 0 | 0 |
| --espaco-escala-01 | 2px | 2px | 2px | 2px |
| --espaco-escala-02 | 3px | 3px | 3px | 3px |
| --espaco-escala-03 | 4px | 4px | 4px | 4px |
| --espaco-escala-04 | 5px | 5px | 5px | 5px |
| --espaco-escala-05 | 6px | 6px | 6px | 6px |
| --espaco-escala-06 | 7px | 7px | 7px | 7px |
| --espaco-escala-07 | 8px | 8px | 8px | 8px |
| --espaco-escala-08 | 9px | 9px | 9px | 9px |
| --espaco-escala-09 | 10px | 10px | 10px | 10px |
| --espaco-escala-10 | 11px | 11px | 11px | 11px |
| --espaco-escala-11 | 12px | 12px | 12px | 12px |
| --espaco-escala-12 | 13px | 13px | 13px | 13px |
| --espaco-escala-13 | 14px | 14px | 14px | 14px |
| --espaco-escala-14 | 15px | 15px | 15px | 15px |
| --espaco-escala-15 | 16px | 16px | 16px | 16px |
| --espaco-escala-16 | 18px | 18px | 18px | 18px |
| --espaco-escala-17 | 19px | 19px | 19px | 19px |
| --espaco-escala-18 | 20px | 20px | 20px | 20px |
| --espaco-escala-19 | 22px | 22px | 22px | 22px |
| --espaco-escala-20 | 24px | 24px | 24px | 24px |
| --espaco-escala-21 | 25px | 25px | 25px | 25px |
| --espaco-escala-22 | 28px | 28px | 28px | 28px |
| --espaco-escala-23 | 32px | 32px | 32px | 32px |
| --espaco-escala-24 | 36px | 36px | 36px | 36px |
| --espaco-escala-25 | 40px | 40px | 40px | 40px |
| --espaco-escala-26 | 42px | 42px | 42px | 42px |
| --espaco-escala-27 | 45px | 45px | 45px | 45px |
| --espaco-escala-28 | 48px | 48px | 48px | 48px |
| --espaco-escala-29 | 55px | 55px | 55px | 55px |
| --espaco-escala-30 | 56px | 56px | 56px | 56px |
| --espaco-escala-31 | 64px | 64px | 64px | 64px |
| --espaco-escala-32 | 65px | 65px | 65px | 65px |
| --espaco-escala-33 | 96px | 96px | 96px | 96px |
| --espaco-escala-34 | 99px | 99px | 99px | 99px |
| --espaco-escala-35 | 100px | 100px | 100px | 100px |
| --espaco-escala-36 | 146px | 146px | 146px | 146px |
| --raio-escala-01 | 15px | 15px | 15px | 15px |
| --raio-escala-02 | 50% | 50% | 50% | 50% |
| --raio-escala-03 | 8px | 8px | 8px | 8px |
| --raio-escala-04 | 18px | 18px | 18px | 18px |
| --raio-escala-05 | 12px | 12px | 12px | 12px |
| --raio-escala-06 | 11px | 11px | 11px | 11px |
| --raio-escala-07 | 13px | 13px | 13px | 13px |
| --raio-escala-08 | 20px | 20px | 20px | 20px |
| --raio-escala-09 | 22px | 22px | 22px | 22px |
| --raio-escala-10 | 17px | 17px | 17px | 17px |
| --raio-escala-11 | 24px | 24px | 24px | 24px |
| --raio-escala-12 | 14px | 14px | 14px | 14px |
| --raio-escala-13 | 9px | 9px | 9px | 9px |
| --raio-escala-14 | 10px | 10px | 10px | 10px |
| --raio-escala-15 | 22px 22px 0 0 | 22px 22px 0 0 | 22px 22px 0 0 | 22px 22px 0 0 |
| --raio-escala-16 | 16px | 16px | 16px | 16px |
| --raio-escala-17 | 6px | 6px | 6px | 6px |
| --raio-escala-18 | 28px 28px 0 0 | 28px 28px 0 0 | 28px 28px 0 0 | 28px 28px 0 0 |
| --raio-escala-19 | 0 | 0 | 0 | 0 |
| --raio-escala-20 | 23px | 23px | 23px | 23px |
| --raio-escala-21 | 27px 27px 0 0 | 27px 27px 0 0 | 27px 27px 0 0 | 27px 27px 0 0 |
| --raio-escala-22 | 7px | 7px | 7px | 7px |
| --raio-escala-23 | 5px | 5px | 5px | 5px |
| --raio-escala-24 | 2px | 2px | 2px | 2px |
| --raio-escala-25 | 24px 24px 0 0 | 24px 24px 0 0 | 24px 24px 0 0 | 24px 24px 0 0 |
| --altura-toque-minima | 44px | 44px | 44px | 44px |
| --altura-controle-compacta | 44px | 44px | 44px | 44px |
| --altura-controle-formulario | 48px | 48px | 48px | 48px |
| --altura-controle-entrada | 54px | 54px | 54px | 54px |

A lista literal está em [tokens-propostos.json](tokens-propostos.json); o CSS da proposta em [tokens-propostos.css](tokens-propostos.css). Nenhum desses dois arquivos é importado pelo aplicativo restaurado.

## Mapeamento #7c8d76

| Arquivo | Tokenizadas na tentativa | Literais por exclusão | Literais Conta/sync | Total |
| --- | --- | --- | --- | --- |
| src/estilos/paleta-clara.css | 137 | 11 | 21 | 169 |
| src/estilos/contraste-claro.css | 1 | 1 | 0 | 2 |

**138 + 12 + 21 = 171** ocorrências do Apêndice D. As exclusões discriminadas e os comentários solicitados estão em BUGS-PRESERVADOS.md. A unificação #7c8d76 → #6f8560 segue pendente para a Fase 3. Após reversão: **0 substituições persistidas**. Nenhuma das 97 declarações foi removida.

## Riscos e pendências

1. A geração de CSS do Tailwind pode introduzir custom properties adicionais sem diferença imediata de pixels. A camada de geração precisa ser investigada antes de autorizar nova tentativa; não se alterou configuração de fontes, pipeline, allowlist ou baseline para contornar a falha.
2. Conta/entrada/cadastro, sync, conflito e revisão continuam sem baseline completo e fora da migração. As duas regras globais e todos os seletores protegidos foram mantidos literais na tentativa e byte a byte originais após reversão.
3. Sem comparação pós-lote completa, nenhum ganho de previsibilidade, acessibilidade ou desempenho foi certificado. Os bugs continuam preservados.
4. A reversão dos arquivos-fonte foi verificada por hashes; não foi executado outro percurso visual após ela, respeitando a condição de parar. O CSS gerado e os caches de ferramentas não são equivalentes à prova de igualdade das fontes.

**Aguardar decisão do usuário. Não reaplicar o lote nem executar outro lote automaticamente.**
