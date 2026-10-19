# Entrega Gemini — Melhoria de Interação dos Seletores Numéricos de Cardio

Data: 18/10/2026  
Status: Implementado, testado e validado localmente  
Escopo: Execução estrita da tarefa descrita em `revisao/TAREFA-GEMINI-SELETORES-CARDIO.md`. Sem modificações em banco, sincronização, SQL, modelos de dados ou dependências externas. Pronto para revisão do Codex.

---

## 1. Descrição do Problema e Solução Arquitetural

### Problema
Nos seletores numéricos de cardio (`EditorCardio`), campos com valores altos (como Frequência Cardíaca de 120 bpm, passos de 5.000 ou calorias de 400 kcal) exigiam rolar dezenas de posições a partir do zero. A navegação era lenta para todos os campos (duração, distância, velocidade, inclinação, FC, passos e kcal). Além disso, não era possível digitar diretamente no teclado quando conveniente.

### Diretrizes de Solução
- **Preservação da experiência de rolagem**: A rolagem em rodas permanece a opção padrão, com a mesma estética e confirmação explícita.
- **Modo Digitar complementar**: Permite entrada via teclado numérico ou decimal com formatação em tempo real e foco automático.
- **Saltos rápidos (±passoRapido)**: Botões dedicados para incremento/decremento rápido (ex.: ±10 bpm, ±5 min, ±100 kcal, ±1000 passos, ±1 km, ±1 km/h, ±1%).
- **Sincronização bidirecional**: Alternar entre "Rolar" e "Digitar" preserva rigorosamente o rascunho em edição; as rodas de rolagem rolam programaticamente para a posição exata selecionada no teclado ou nos botões de atalho.
- **Sem preenchimento arbitrário ou presunções fisiológicas**: Nenhum campo inicia em 120 bpm automaticamente. Campos não preenchidos permanecem `undefined`. "Não informar" continua descartando o valor.
- **Prevenção de submissão acidental**: Todos os botões possuem `type="button"` e a tecla `Enter` no campo de texto intercepta a propagação (`e.preventDefault()`), acionando a confirmação do seletor em vez de submeter o `<form>` do `EditorCardio`.
- **Compatibilidade total com outros consumidores**: `SelecionarNumero` mantém o layout e comportamento clássicos quando as novas props opcionais (`permitirDigitar`, `passoRapido`, `minimo`) não são fornecidas.

---

## 2. Detalhes de Interação e Implementação

### 2.1. Utilitário de Parsing e Validação (`src/utilitarios/numero.ts`)
Criado utilitário puro desacoplado com testes rigorosos:
- `formatarNumeroEntrada(valor, decimal)`: Converte números em strings formatadas com vírgula para decimais (`12.5` -> `"12,5"`).
- `validarEntradaNumero(texto, opcoes)`:
  - Rejeita strings vazias ou compostas apenas por espaços.
  - Rejeita valores negativos (`-10`), notação científica (`1e3`), `NaN` e `Infinity`.
  - Aceita tanto ponto (`12.5`) quanto vírgula (`12,5`) para campos decimais.
  - Rejeita frações em campos inteiros (ex.: `"120,5"` em bpm é rejeitado com mensagem descritiva `"O valor deve ser um número inteiro."`).
  - Limita precisão decimal a no máximo 1 casa decimal (rejeita `"12,55"`).
  - Valida limites mínimos (`minimo > 0` exige valor estritamente positivo; duração e velocidade mínima de 0.1, frequências cardíacas mínimo de 1 bpm).
  - Valida limite superior `maximo`.
  - **Preservação de erro**: Não trunca nem corrige silenciosamente; retorna mensagens de erro claras em português sem fechar o modal ou perder o rascunho.

### 2.2. Componente de Rolagem (`src/componentes/Rolagem.tsx`)
- Adicionada prop opcional `valor?: number`.
- **Prevenção de loop e respeito a lints**: O índice selecionado é derivado durante a renderização (`selecionado = valor !== undefined ? Math.max(0, valores.indexOf(valor)) : interno`), eliminando a necessidade de `setState` em efeitos e respeitando a regra `react-hooks/set-state-in-effect`.
- **Scroll programático suave**: Um `useEffect` observa a mudança de `valor` e ajusta `ref.current.scrollTo({ top: alvo, behavior: 'smooth' })`. Uma flag interna impede que o evento de scroll programático dispare callbacks circulares desnecessários.
- **Consumidores legados**: Se `valor` for omitido, opera identicamente ao comportamento original via estado interno.

### 2.3. Seletor Numérico (`src/componentes/SelecionarNumero.tsx`)
- **Props novas e opcionais**:
  - `passoRapido?: number`: Habilita botões de atalho rápido `-X` e `+X` com alvos de toque $\ge 44\text{ px}$.
  - `minimo?: number`: Define piso de validação (ex.: `0.1` para duração/velocidade, `1` para bpm).
  - `permitirDigitar?: boolean`: Ativa o alternador de abas ("Rolar" / "Digitar") e a entrada via teclado.
- **Comportamento no modo "Digitar"**:
  - Se o campo não tiver valor (`valor === undefined`), o input abre em branco (sem "0" forçado), permitindo digitar `"120"` imediatamente.
  - Se tiver valor salvo, abre preenchido com o valor existente.
  - Suporta `inputMode="numeric"` ou `inputMode="decimal"` conforme a flag `decimal`.
  - Tecla `Enter` valida e aplica sem submeter o formulário pai.
- **Alternância entre abas**:
  - Se o usuário digitar `"125"` e alternar para a aba "Rolar", as rodas se posicionam automaticamente em 100 nas centenas, 20 nas dezenas e 5 nas unidades.
  - Se houver erro de digitação ao tentar voltar para "Rolar", a mensagem de erro é exibida e o rascunho é mantido.
- **Atalhos rápidos**:
  - Funcionam em ambos os modos, somando/subtraindo o passo configurado e respeitando os limites `minimo` e `maximo`.

### 2.4. Configurações em `EditorCardio.tsx`
Configurados passos e mínimos específicos e naturais para os 8 seletores do formulário de cardio:
1. **Duração**: `minimo={0.1}`, `passoRapido={5}`, `permitirDigitar={true}` (±5 min)
2. **Distância**: `passoRapido={1}`, `permitirDigitar={true}` (±1 km)
3. **Calorias**: `passoRapido={100}`, `permitirDigitar={true}` (±100 kcal)
4. **Velocidade**: `minimo={0.1}`, `passoRapido={1}`, `permitirDigitar={true}` (±1 km/h)
5. **Inclinação**: `passoRapido={1}`, `permitirDigitar={true}` (±1%)
6. **Passos**: `passoRapido={1000}`, `permitirDigitar={true}` (±1000 passos)
7. **FC Média**: `minimo={1}`, `passoRapido={10}`, `permitirDigitar={true}` (±10 bpm)
8. **FC Máxima**: `minimo={1}`, `passoRapido={10}`, `permitirDigitar={true}` (±10 bpm)

### 2.5. Estilos (`src/index.css`)
Estilos encapsulados sob as classes dos seletores numéricos:
- Alvos de toque com altura mínima de 44 px (`min-height: 44px` nos botões de alternância e atalho; `54px` no input de digitação).
- Contrastes e paleta consistentes com o tema escuro/verde do aplicativo.
- Badge com unidade alinhado dentro do campo de texto com `pointer-events: none`.
- Nenhum impacto em seletores de outras telas ou na barra de filtros de exercícios.

---

## 3. Arquivos Criados e Alterados

| Arquivo | Status | Descrição |
| --- | --- | --- |
| `src/utilitarios/numero.ts` | **Criado** | Funções puras de formatação (`formatarNumeroEntrada`) e validação estrita (`validarEntradaNumero`). |
| `src/utilitarios/numero.test.ts` | **Criado** | 12 testes unitários cobrindo inteiros, decimais, vírgula/ponto, negativos, notação científica, excesso de casas e limites. |
| `src/componentes/Rolagem.tsx` | **Alterado** | Adicionada prop `valor`, derivação reativa de índice e scroll programático suave sem loops de renderização. |
| `src/componentes/SelecionarNumero.tsx` | **Alterado** | Adicionadas props `passoRapido`, `minimo` e `permitirDigitar`. Modo Rolar/Digitar, atalhos, validação e `type="button"`. |
| `src/componentes/SelecionarNumero.test.tsx` | **Criado** | 7 testes de componente cobrindo retrocompatibilidade, novos modos, atalhos, decimais, enter e acessibilidade. |
| `src/componentes/EditorCardio.tsx` | **Alterado** | Configuração dos 8 campos de cardio com passos rápidos, mínimos estritos e digitação habilitada. |
| `src/index.css` | **Alterado** | Classes de estilo para cabeçalho, alternador de abas, botões de atalho e input com badge de unidade. |

---

## 4. Testes e Validação Executada

### 4.1. Resultados dos Comandos
1. **`npm.cmd test`**:
   - **145 testes passaram com sucesso em 19 arquivos** (100% de aprovação).
   - `src/utilitarios/numero.test.ts` (12 testes):
     - Aceitação de inteiros válidos.
     - Aceitação de ponto e vírgula em decimais (ex.: `12.5` e `12,5`).
     - Rejeição de vírgula/fração em campo inteiro (`120,5` -> rejeitado).
     - Rejeição de texto vazio, espaços e valores não numéricos.
     - Rejeição de valores negativos e notação exponencial (`1e2`).
     - Rejeição de mais de uma casa decimal (`12,55`).
     - Validação de piso `minimo` e teto `maximo`.
     - Formatação de valores numéricos para string.
   - `src/componentes/SelecionarNumero.test.tsx` (7 testes):
     - Retrocompatibilidade: sem `permitirDigitar`, renderiza o texto clássico "Deslize e confirme para aplicar" e esconde abas/atalhos.
     - Com `permitirDigitar`, renderiza abas "Rolar" e "Digitar" com `role="tab"` e `aria-selected`.
     - Renderização de atalhos rápidos com `type="button"` e labels acessíveis.
     - Alternância para modo "Digitar", digitação de `120` em FC sem "0" inicial forçado.
     - Suporte a decimais com vírgula e confirmação via `Enter`.
     - Exibição de mensagem de erro e bloqueio de confirmação para valores inválidos.
     - Preservação do botão "Não informar" retornando `undefined`.
2. **`npm.cmd run lint`**:
   - Execução concluída com **0 erros e 0 alertas**.
3. **`npm.cmd run build`**:
   - `tsc -b && vite build` concluído com sucesso. Geração de bundles e PWA service worker sem erros.

---

## 5. Riscos, Limitações e Pendências

- **Dispositivo Físico**: A validação foi conduzida integralmente via Vitest (JSDOM / Fake-IndexedDB / PGlite) e build de produção. A conferência tátil em smartphone real dependerá de teste visual pelo usuário final.
- **Escopo delimitado**: Nenhuma alteração foi realizada em banco de dados, sincronização com Supabase, cálculo de METs ou catálogo de exercícios.
- **Controle de versão**: Nenhum commit ou push foi realizado. As modificações em `.gitignore` permanecem intocadas, conforme as regras do projeto.
