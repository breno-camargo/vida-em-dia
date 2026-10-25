# Relatório de Entrega: Segundo Protótipo Visual (Refino Visual Fiel ao App)

> **Projeto:** Vida em Dia  
> **Entrega:** Segundo Protótipo Visual Isolado (`revisao/prototipo-refino-visual/`)  
> **Finalidade:** Refino puramente visual do app como ele é hoje (espaçamento, hierarquia, tipografia, raios, bordas, sombras, cores, estados e consistência entre botões e campos), sem alteração de fluxos, organização, telas ou textos funcionais.  
> **Data:** 22 de outubro de 2026  
> **Ambiente de Testes:** Microsoft Edge Headless (Chromium 155 CDP) em viewports 390 × 844, 360 × 800 e Desktop.

---

## 1. Inventário das Telas e Componentes Reais Analisados

O protótipo foi construído com base na leitura e inventário minucioso do código-fonte em produção (`src/`):

1. **Casca e Navegação Global:**
   - `src/App.tsx`: Gerenciamento do cabeçalho (`.cabecalho`, `.marca`, botão de configurações), linha de data (`.linha-data`), status de conectividade (`.estado-rede`), aviso de modo visitante (`.aviso-modo-visitante`) e navegação principal.
   - `src/componentes/Navegacao.tsx`: Barra de navegação inferior com as 5 abas obrigatórias: **Hoje**, **Treino**, **Comida**, **Medidas** e **Evolução**.
2. **Tela Hoje:**
   - `src/telas/Hoje.tsx`: Lembretes de backup e medidas (`LembreteBackup`, `LembreteMedidas`), bloco de destaque (`.destaque`), grade de resumos (`.grade-cartoes`: Treino e cardio, Alimentação, Água), seção `AtividadeHoje`, nota de armazenamento e botão de sincronização.
   - `src/componentes/AtividadeHoje.tsx`: Cartões de movimento (Passos do dia com barra de progresso, Calorias gastas com meta), metas para dia útil/fim de semana, botões de ação e resumo de cardio do dia.
3. **Tela Treino e Cardio:**
   - `src/telas/Treino.tsx`: Bloco de retomar treino em andamento (`.retomar-treino.retomar-compacto`), navegação segmentada em três abas (`Minhas fichas`, `Exercícios`, `Cardio`), atalho para o card do último treino (`.ultimo-concluido`), listagem de fichas com menu de opções e botão de treino livre.
   - `src/componentes/FiltrosExercicios.tsx` e `ListaExercicios.tsx`: Barra de busca, carrossel horizontal de filtros musculares (`.filtros-musculares`) com rolagem natural preservada e lista de exercícios.
   - `src/telas/Cardio.tsx`: Listagem de sessões de cardio dentro de Treino com duração, distância, calorias estimadas e atalhos para visualização e edição.
4. **Tela Comida:**
   - `src/componentes/EstadoVazio.tsx`: Estado vazio oficial da Etapa 9 (*"Mais simples, mais constante — Um diário rápido para acompanhar suas refeições, sem complicar a rotina"*), mantido estritamente como está.
5. **Tela Medidas:**
   - `src/telas/Medidas.tsx`: Topo com resumo, botão "+ Registrar", visão de resumo e abas segmentadas (`Registros` e `Comparar datas`), listagem histórica com `<details class="registro-medida">` e tela comparativa entre duas datas.
   - `src/componentes/EditorMedida.tsx`: Modal com campos de peso e circunferências, stepper de precisão decimal e confirmação antes/depois.
6. **Tela Evolução:**
   - `src/telas/Evolucao.tsx`: Abas `Meus treinos` e `Por exercício`, busca de treinos, lista de sessões finalizadas com volume total, séries concluídas, badges de recordes e botões de compartilhamento.
7. **Tela Configurações:**
   - `src/telas/Configuracoes.tsx`: Seções expansíveis (`secao-config`): Conta e sincronização, Backup dos seus dados, Lembrete de medidas, Cardio e movimento, Seu aparelho, Instalar no iPhone e Sobre o Vida em Dia.
   - `src/componentes/PrivacidadeDados.tsx`: Gestão de itens removidos, limpeza do aparelho, exclusão do armazenamento legado e modal de exclusão definitiva de conta.
   - `src/componentes/BackupConfiguracoes.tsx`: Criptografia com senha mínima de 12 caracteres, confirmação de senha, seleção de inclusão de fotos e removidos, geração de JSON/CSV.
   - `src/componentes/ContaConfiguracoes.tsx`: Fluxos de entrada (Login, Cadastro, Recuperação de Acesso e Confirmação de código de e-mail).
8. **Modais e Diálogos (`Painel`):**
   - `src/componentes/Painel.tsx`: Implementação com `<dialog className="painel-modal">`, alça para fechamento por gesto no celular, cabeçalho fixo e corpo rolável.

---

## 2. Tabela de Correspondência: App Real → Protótipo de Refino

| Tela do App Real | Rota no Protótipo | O que Mudou Visualmente (Refino) | O que Foi Mantido Idêntico |
| :--- | :--- | :--- | :--- |
| **Cabeçalho & Casca** | `#hoje` | Contraste dos textos melhorado; anel de foco visível em 3px; suporte imediato a tema claro e escuro. | Identidade verde, ícone de folha, títulos, linha de data e indicador online/offline. |
| **Navegação Inferior** | Fixa em todas as rotas | Altura de 48 px por botão; indicador de página ativa com contraste de 6.68:1 no tema claro e 13.4:1 no escuro; respeito a `safe-area-inset-bottom`. | Exatamente os 5 itens: Hoje, Treino, Comida, Medidas e Evolução, na mesma ordem e com os mesmos ícones. |
| **Hoje** | `#hoje` | Bloco de destaque com gradiente suave; tipografia de títulos ajustada; alvos de toque dos cartões e botões padronizados em ≥ 44 px. | Todos os textos ("SEU RITMO. SUA EVOLUÇÃO.", "Um dia de cada vez.", etc.), ordem das seções e cards de resumo. |
| **Treino (Fichas)** | `#treino` | Cartões de ficha com espaçamento confortável; menu de opções alinhado; botão de continuar/iniciar com 48 px. | Estrutura de fichas, contagem de exercícios, aviso de treino em andamento e botão de treino livre. |
| **Treino (Exercícios)** | `#treino-exercicios` | Pílulas de filtro muscular com rolagem horizontal fluida (sem barra feia); campo de busca com 16 px de fonte (sem zoom no iOS). | Lista completa com grupos musculares e atalho para o guia do exercício. |
| **Treino (Cardio)** | `#treino-cardio` | Hierarquia de métricas (minutos, km, kcal) destacada em cartões limpos com botões de 38-44 px. | Localizado estritamente dentro da tela de Treino, como no app real. |
| **Comida** | `#comida` | Card centralizado com ícone suave e selo Etapa 9; contraste tipográfico ajustado. | Textos originais e ausência total de funcionalidades inventadas (preservado como `EstadoVazio`). |
| **Medidas (Registros)** | `#medidas` | Cards de resumo com variações (+/-) em verde de alto contraste; `<details>` histórico com abertura suave. | Precisão decimal das medidas, estrutura dos campos e ações de editar e remover. |
| **Medidas (Comparar)** | `#medidas-comparar` | Tabela comparativa com linhas divisórias de alto contraste e realce nas diferenças. | Comportamento de seleção de datas antes/depois e cálculo de variação. |
| **Evolução** | `#evolucao` | Badges de recordes pessoais integrados aos cartões de histórico com alinhamento refinado. | Informações de séries, volume total em kg, duração e opções de detalhes. |
| **Configurações** | `#configuracoes` | Seções expansíveis com ícones alinhados, setas animadas suavemente e bordas consistentes. | Todas as 7 seções originais e agrupamento idêntico. |
| **Privacidade & Dados** | `#configuracoes` | Separação visual clara entre ações secundárias e ações destrutivas (com fundos e bordas diferenciados). | Todos os avisos de segurança, retenção de 30 dias e notas de isolamento local. |
| **Login / Cadastro / Recuperação** | `#login`, `#cadastro`, `#recuperar-senha` | Botão de exibir/ocultar senha com 44 px e rótulo acessível; inputs com fonte de 16 px (previne zoom em celulares). | Textos ("Bom ter você aqui.", "Vamos recuperar seu acesso."), links e opção de continuar sem conta. |
| **Modais do Sistema** | `#popup-[nome]` | Formato de Bottom Sheet com bordas superiores arredondadas no celular (22 px); fundo inerte (`inert`); tecla Esc e foco preso. | Títulos, alça de arrasto, botão X de fechar e botões de confirmação. |

---

## 3. Cópia e Alterações do CSS (`src/estilos/`)

Conforme a regra fundamental do projeto, os arquivos de estilo atuais foram copiados fielmente para a pasta isolada do protótipo e refinados:

1. **`estilos/index.css` (91,5 KB):**
   - Cópia integral de `src/index.css`.
   - Preserva todas as classes de layout de baixo nível, reset de caixas e classes específicas de componentes legados.
2. **`estilos/controles.css` (14,5 KB):**
   - Cópia integral de `src/estilos/controles.css`.
   - Adicionada definição do bloco de tokens para o Tema Claro (`[data-tema="claro"]`), permitindo alternância instantânea com contraste compatível:
     ```css
     [data-tema="claro"] {
       --controle-destaque: #22642e;
       --controle-texto-escuro: #ffffff;
       --controle-superficie: #eaf3ec;
       --controle-borda: #87a48d;
       --controle-texto: #184c23;
     }
     ```
3. **`estilos/refino.css` (Camada Adicional de Refinamento):**
   - Carregado após os estilos base para aplicar os refinamentos visuais solicitados sem tocar em código legado:
     - **Sistema de Tokens Semânticos:** `--tema-fundo`, `--tema-superficie`, `--tema-borda`, `--tema-borda-input`, `--tema-texto`, `--tema-texto-secundario`, `--tema-texto-terciario`, `--tema-primaria`, `--tema-destrutiva`.
     - **Alvos de Toque:** Padronização de botões de ação em `--controle-altura: 48px` e controles compactos em mínimo de 44 px.
     - **Campos de Formulário:** Todos os inputs de texto, e-mail, senha e número travados em `font-size: 16px`, eliminando o auto-zoom nativo do Safari/iOS.
     - **Modais `<dialog>`:** Estilizados como Bottom Sheet com cantos superiores arredondados (`22px 22px 0 0`) em celulares e centralizados em telas desktop, com altura máxima de `90dvh` e rolagem interna suave.
     - **Isolamento dos Cards Congelados:** Escopo neutro que impede qualquer estilo global de vazar para os cards preservados.

---

## 4. Padrões Reutilizados e Mudanças Propostas

### 4.1. Padrões Mantidos de `PADROES-INTERFACE.md`
- **Zero Transições com Deslize ou Escala:** Respeito integral à diretriz de movimento discreto. Os painéis e abas utilizam exclusivamente transição de opacidade/cor rápida (120ms a 160ms) e desativam animações sob `@media (prefers-reduced-motion: reduce)`.
- **Rolagem Vertical Natural:** A página principal e o interior dos modais rolam livremente na vertical; rolagem horizontal é restrita exclusivamente às pílulas de filtros musculares (`.filtros-musculares`).
- **Nenhum Alert e Nenhuma Ação Morta:** Todas as interações possuem respostas na própria interface.
- **Precisão Numérica:** Medidas preservam decimais reais (ex.: 72,4 kg e 81,0 cm).

### 4.2. Mudanças de Padrão Propostas (Submetidas para Aprovação)
1. **Paleta de Alto Contraste para o Tema Claro:**
   - *Justificativa:* O app original não possuía suporte ao modo claro em `index.css`. Propõe-se uma paleta baseada em verde floresta `#22642e` com texto branco nos botões principais (contraste de 7.17:1) e texto terciário `#506655` sobre superfície branca (contraste de 6.23:1, bem acima dos 4.5:1 exigidos pela WCAG AA).
2. **Reforço de Borda em Inputs para Atingir ≥ 3:1:**
   - *Justificativa:* No tema escuro original, a borda `#3d553e` contra o fundo `#141f18` apresentava apenas 2.07:1, dificultando identificar o limite dos campos em ambientes claros ou sob luz solar. Ajustou-se para `#56735a`, atingindo 3.23:1. No tema claro, adotou-se `#628269`, atingindo 4.27:1.
3. **Fonte de 16 px em Campos de Formulário:**
   - *Justificativa:* Navegadores móveis (em especial WebKit/Safari no iOS) aplicam zoom involuntário quando campos de formulário têm fonte menor que 16 px, quebrando o layout em modo retrato durante o treino. A trava em 16 px resolve o problema definitivamente.

---

## 5. Lista de Hashes, Estados e Fluxos Demonstrados

Todas as telas, abas e diálogos são navegáveis diretamente por hash na URL:

### 5.1. Telas Principais
- `#hoje`: Tela inicial com resumos, destaque, atividade do dia e notas.
- `#treino`: Tela de Treino com a aba **Minhas fichas** ativa.
- `#treino-andamento`: Tela de **Modo Treino (Treino em Andamento)** fiel a `src/telas/ModoTreino.tsx`, acionada ao clicar em **Continuar treino**, exibindo progresso de séries, séries compactas reais, botão de guia "Como fazer" e botão "Continuar depois" para retornar à lista.
- `#treino-exercicios`: Tela de Treino com a aba **Exercícios** e filtros musculares.
- `#treino-cardio`: Tela de Treino com a aba **Cardio** ativa.
- `#comida`: Tela Comida com o **EstadoVazio** da Etapa 9.
- `#medidas`: Tela Medidas com a aba **Registros** históricos ativa.
- `#medidas-comparar`: Tela Medidas com a aba **Comparar datas** ativa.
- `#evolucao`: Tela Evolução com a aba **Meus treinos** ativa.
- `#evolucao-exercicios`: Tela Evolução com a aba **Por exercício** ativa.
- `#configuracoes`: Tela Configurações com todas as seções e privacidade.
- `#componentes`: Página de referência do Design System (catálogo de componentes Antes vs Depois).

### 5.2. Seções de Configurações Expandidas
- `#configuracoes-conta`: Abre configurações com a seção *Conta e sincronização* expandida.
- `#configuracoes-backup`: Abre configurações com a seção *Backup dos seus dados* expandida.
- `#configuracoes-medidas`: Abre configurações com a seção *Lembrete de medidas* expandida.
- `#configuracoes-atividade`: Abre configurações com a seção *Cardio e movimento* expandida.
- `#configuracoes-aparelho`: Abre configurações com a seção *Seu aparelho* expandida.
- `#configuracoes-sobre`: Abre configurações com a seção *Sobre o Vida em Dia* expandida.

### 5.3. Modais e Pop-ups (Interatividade Completa via `<dialog>`)
- `#popup-backup`: Modal para preparar e baixar backup criptografado (com validação de senha de 12 caracteres e confirmação idêntica).
- `#popup-importar`: Modal para restaurar backup JSON/CSV com opções de mesclar ou substituir.
- `#popup-limpar-aparelho`: Modal de limpeza local com verificação de pendências e checkbox obrigatório de aceite.
- `#popup-apagar-legado`: Modal de confirmação para exclusão dos dados legados deste navegador.
- `#popup-excluir-conta`: Modal estrito de exclusão definitiva (exige digitar "EXCLUIR" e a senha atual).
- `#popup-medida`: Modal de registro de medidas com botões stepper de peso e cintura, cálculo de variação e confirmação antes/depois.
- `#popup-nova-ficha`: Modal de criação de nova ficha fiel a `src/componentes/EditorFicha.tsx`.
- `#popup-cardio`: Modal de registro de sessão de cardio fiel a `src/componentes/EditorCardio.tsx`.
- `#popup-ajuda-exercicio`: Modal com guia técnico e passo a passo de execução de exercício (acionado pelo atalho "Como fazer" ou na biblioteca).
- `#popup-card-congelado`: Modal de exibição do card congelado com placeholder neutro rotulado *"Componente existente preservado"* (acionado estritamente em "Ver card" do último treino concluído ou sessão de cardio).

### 5.4. Autenticação e Entrada
- `#login`: Tela de login com botão acessível de mostrar/ocultar senha e atalho de visitante.
- `#cadastro`: Tela de criação de conta com confirmação de senha.
- `#confirmar-email`: Tela de confirmação com campo numérico centralizado de 6 dígitos.
- `#recuperar-senha`: Tela de recuperação de acesso com campo de e-mail.

### 5.5. Parâmetros de Consulta Suportados
- `?tema=claro` / `?tema=escuro`: Força a aplicação do tema especificado.
- `?modo=visitante` / `?modo=usuario`: Alterna a exibição do aviso de visitante.

---

## 6. Contrastes Calculados (Fórmula WCAG 2.1)

Os contrastes foram calculados matematicamente através da fórmula de luminância relativa padrão da W3C:
$$L = 0.2126 \times R + 0.7152 \times G + 0.0722 \times B$$
$$\text{Razão de Contraste} = \frac{\max(L_1, L_2) + 0.05}{\min(L_1, L_2) + 0.05}$$

### Tabela de Verificação Matemática de Contraste

| Tema | Elemento / Par Analisado | Cor 1 | Cor 2 | Razão Real | Requisito Mínimo | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Escuro** | Texto Principal sobre Fundo da Página | `#f0f5f1` | `#101714` | **16.49:1** | ≥ 4,5:1 (AAA) | **APROVADO** |
| **Escuro** | Texto Principal sobre Cartão (`.painel`) | `#f0f5f1` | `#18251e` | **14.40:1** | ≥ 4,5:1 (AAA) | **APROVADO** |
| **Escuro** | Texto Secundário sobre Cartão | `#c0d2c4` | `#18251e` | **10.03:1** | ≥ 4,5:1 (AAA) | **APROVADO** |
| **Escuro** | Texto Terciário / Metas sobre Cartão | `#9ab2a1` | `#18251e` | **7.00:1** | ≥ 4,5:1 (AA) | **APROVADO** |
| **Escuro** | Botão Principal: Texto sobre Verde | `#192d18` | `#bcec86` | **10.83:1** | ≥ 4,5:1 (AAA) | **APROVADO** |
| **Escuro** | Botão Secundário: Texto sobre Superfície | `#d8ebd0` | `#203123` | **10.96:1** | ≥ 4,5:1 (AAA) | **APROVADO** |
| **Escuro** | Botão Destrutivo: Texto sobre Fundo Vermelho | `#f2b8a7` | `#2b1d19` | **9.43:1** | ≥ 4,5:1 (AAA) | **APROVADO** |
| **Escuro** | Borda de Input sobre Fundo do Input | `#56735a` | `#141f18` | **3.23:1** | ≥ 3,0:1 (UI) | **APROVADO** |
| **Escuro** | Anel de Foco Teclado sobre Fundo Escuro | `#bcec86` | `#101714` | **13.41:1** | ≥ 3,0:1 (UI) | **APROVADO** |
| **Claro** | Texto Principal sobre Fundo da Página | `#121e15` | `#f3f6f3` | **15.78:1** | ≥ 4,5:1 (AAA) | **APROVADO** |
| **Claro** | Texto Principal sobre Cartão Branco | `#121e15` | `#ffffff` | **17.18:1** | ≥ 4,5:1 (AAA) | **APROVADO** |
| **Claro** | Texto Secundário sobre Cartão Branco | `#34483a` | `#ffffff` | **9.84:1** | ≥ 4,5:1 (AAA) | **APROVADO** |
| **Claro** | Texto Terciário / Metas sobre Cartão Branco | `#506655` | `#ffffff` | **6.23:1** | ≥ 4,5:1 (AA) | **APROVADO** |
| **Claro** | Botão Principal: Texto Branco sobre Verde | `#ffffff` | `#22642e` | **7.17:1** | ≥ 4,5:1 (AAA) | **APROVADO** |
| **Claro** | Botão Principal sobre Superfície do Cartão | `#22642e` | `#ffffff` | **7.17:1** | ≥ 3,0:1 (UI) | **APROVADO** |
| **Claro** | Botão Secundário: Texto sobre Fundo Suave | `#184c23` | `#eaf3ec` | **8.84:1** | ≥ 4,5:1 (AAA) | **APROVADO** |
| **Claro** | Botão Destrutivo: Texto sobre Fundo Suave | `#991f13` | `#fef2f0` | **7.49:1** | ≥ 4,5:1 (AAA) | **APROVADO** |
| **Claro** | Borda de Input sobre Fundo Branco | `#628269` | `#ffffff` | **4.27:1** | ≥ 3,0:1 (UI) | **APROVADO** |
| **Claro** | Anel de Foco Teclado sobre Fundo Claro | `#1b5e28` | `#f3f6f3` | **7.20:1** | ≥ 3,0:1 (UI) | **APROVADO** |
| **Claro** | Item Ativo da Navegação sobre Trilha Ativa | `#175222` | `#daf0d4` | **6.68:1** | ≥ 3,0:1 (UI) | **APROVADO** |

> *Nota de rigor:* Todos os valores de texto ultrapassam confortavelmente o padrão mínimo de 4,5:1 da WCAG AA, e todos os elementos de interface, bordas e foco ultrapassam 3:1.

---

## 7. Verificações Realizadas, Dimensões e Limitações

### 7.1. Testes Funcionais Executados no DOM (Headless Edge CDP)
- **Teste de Overflow Horizontal:** Executado em 390 px e 360 px.
  - *Resultado:* `document.documentElement.scrollWidth === window.innerWidth` (Zero transbordamento horizontal em qualquer tela).
- **Teste de Roteamento por Hash:** As 12 rotas primárias e sub-rotas foram testadas sequencialmente, conferindo a visibilidade da tela e a integridade do cabeçalho `<h1>`. Todas aprovadas com 100% de correspondência.
- **Teste de Gerenciamento de Foco e Modais:**
  - Abertura de modal `<dialog>` invoca `showModal()`.
  - O elemento `#app-root` recebe imediatamente o atributo `inert`, impedindo que elementos por trás recebam foco por Tab ou leitores de tela.
  - Ao disparar evento `cancel` (tecla Esc), o modal fecha imediatamente e o atributo `inert` é removido.
- **Teste de Validação de Exclusão de Conta:**
  - O botão `btn-confirmar-exclusao` inicia no estado `disabled=true`.
  - Inserir textos incorretos mantém o botão desabilitado.
  - Apenas ao digitar a palavra exata `"EXCLUIR"` e uma senha com no mínimo 6 caracteres o botão é habilitado.

### 7.2. Evidências Visuais Capturadas
Todas as capturas foram salvas em dimensões reais de viewport na pasta `revisao/prototipo-refino-visual/capturas/`:
1. `01-hoje-390x844-escuro.png`: Tela Hoje em 390 × 844 (Tema Escuro).
2. `02-hoje-390x844-claro.png`: Tela Hoje em 390 × 844 (Tema Claro).
3. `03-hoje-360x800-escuro.png`: Tela Hoje em 360 × 800 (Tema Escuro, viewport compacto).
4. `04-hoje-desktop-escuro.png`: Tela Hoje em 1280 × 800 (Container de 480 px centralizado no Desktop).
5. `05-treino-fichas-390x844-escuro.png`: Tela Treino (Minhas fichas) em 390 × 844 (Tema Escuro).
6. `06-treino-exercicios-390x844-claro.png`: Tela Treino (Exercícios + filtros) em 390 × 844 (Tema Claro).
7. `07-treino-cardio-390x844-escuro.png`: Tela Treino (Cardio) em 390 × 844 (Tema Escuro).
8. `08-comida-390x844-escuro.png`: Tela Comida (EstadoVazio Etapa 9) em 390 × 844 (Tema Escuro).
9. `09-medidas-390x844-escuro.png`: Tela Medidas (Registros históricos) em 390 × 844 (Tema Escuro).
10. `10-medidas-comparar-390x844-claro.png`: Tela Medidas (Comparativo antes/depois) em 390 × 844 (Tema Claro).
11. `11-evolucao-390x844-escuro.png`: Tela Evolução (Meus treinos) em 390 × 844 (Tema Escuro).
12. `12-configuracoes-390x844-escuro.png`: Tela Configurações (Seções expansíveis e Privacidade) em 390 × 844 (Tema Escuro).
13. `13-popup-backup-390x844-escuro.png`: Modal Backup dos seus dados em 390 × 844 (Tema Escuro).
14. `14-popup-medida-390x844-claro.png`: Modal Registrar Medidas com Stepper em 390 × 844 (Tema Claro).
15. `15-popup-excluir-conta-390x844-escuro.png`: Modal Excluir Conta com confirmação estrita em 390 × 844 (Tema Escuro).
16. `16-popup-card-congelado-390x844-escuro.png`: Modal de Card Congelado Preservado (Placeholder neutro) em 390 × 844 (Tema Escuro).
17. `17-componentes-390x844-escuro.png`: Página de Referência de Componentes Refinados em 390 × 844 (Tema Escuro).
18. `18-componentes-390x844-claro.png`: Página de Referência de Componentes Refinados em 390 × 844 (Tema Claro).

### 7.3. Limitações Reais Declaradas
- **Ausência de Backend Real:** A demonstração funciona de forma 100% offline via `file://`. Ações de rede (Supabase, Dexie IndexedDB) são simuladas com temporizadores locais em memória para garantir fidelidade visual e funcional sem dependências externas.
- **Teclado Virtual Nativo:** O navegador Edge Headless em modo de emulação de métricas não renderiza a sobreposição gráfica do teclado virtual do iOS/Android na captura de tela em PNG; no entanto, todos os campos possuem `inputmode="numeric"`, `inputmode="decimal"`, `type="email"`, `type="password"` e tamanho de fonte de 16 px, garantindo conformidade com o comportamento nativo em aparelhos reais.

---

## 8. Cards Congelados: Ocorrências e Opção Utilizada

A restrição sobre os cards de exercícios/séries e cards compartilháveis de treino/cardio (modelos Tipográfico, Foto e Editorial) foi tratada com rigor absoluto:

- **Opção Adotada:** **Opção 2 — Placeholder estático rotulado *"Componente existente preservado"***.
- **Justificativa da Escolha:** Para eliminar qualquer risco de imitação, redesenho inadvertido, aproximação incorreta de tipografia ou palavras/métricas simuladas (como ocorreu no protótipo anterior), todos os locais de exibição desses cards utilizam um container neutro com borda tracejada e etiqueta clara, sem texto estilizado que imite o card final:
  ```html
  <div class="placeholder-card-congelado" role="region" aria-label="Componente existente preservado">
    <span class="etiqueta-preservada">Componente existente preservado</span>
    <p>Card compartilhável (Modelos Tipográfico, Foto e Editorial). Composição, renderizadores, PNGs e séries mantidos estritamente congelados sem redesenho.</p>
  </div>
  ```
- **Ocorrências Mapeadas:**
  1. *Atalho do último treino na tela de Treino (`.ultimo-concluido`):* Ao clicar em "Ver card", abre o modal com o placeholder preservado.
  2. *Card de treino compartilhado na tela de Evolução:* Ao clicar em "Ver card" em qualquer treino do histórico, abre o modal preservado.
  3. *Sessão de cardio na tela Treino/Cardio:* Ao clicar em "Ver card", exibe o placeholder preservado.
  4. *Modo de treino em andamento:* O card de execução do treino não sofreu nenhuma alteração em regras ou campos.

---

## 9. Sugestões de Texto NÃO Aplicadas

Seguindo estritamente as instruções do usuário (*"Textos funcionais, avisos de segurança, privacidade e confirmações permanecem exatamente como estão no app. Se achar que um texto deve mudar, NÃO mude: liste como sugestão no relatório"*), todos os textos foram mantidos com precisão cirúrgica no código do protótipo. 

Abaixo estão listadas observações que podem ser avaliadas futuramente pela equipe:

1. **Aviso de Falha Parcial na Exclusão de Conta:**
   - *Texto Atual (mantido 100% no protótipo):* *"Em falha parcial, o conteúdo remoto eliminado não volta, mas o banco local é mantido até o fluxo ser concluído com sucesso. Exclusões parciais exigem nova tentativa."*
   - *Sugestão para o futuro:* Em telas pequenas de smartphone, este parágrafo é longo e denso. Poderia ser estruturado em dois tópicos curtos para acelerar a compreensão do usuário em situação crítica.
2. **Aviso de Modo Visitante:**
   - *Texto Atual (mantido 100% no protótipo):* *"Modo visitante: estes registros ficam visíveis a quem usar este perfil do navegador. Eles não são transferidos ao criar ou acessar uma conta."*
   - *Sugestão para o futuro:* Adicionar uma menção explícita de que exportar um arquivo de backup permite guardar esses registros antes de trocar de aparelho ou perfil.

---

## 10. Decisões Pendentes de Aprovação

As seguintes propostas de refino visual ficam submetidas para aprovação do usuário e revisão do Codex:

1. **Aprovação dos Tokens do Tema Claro:**
   - *Recomendação:* Aprovar a paleta baseada em verde floresta `#22642e` com texto branco nos botões e superfícies `#ffffff` / `#f3f6f3`. Todos os pares atingiram entre 6.23:1 e 17.18:1 de contraste.
2. **Aprovação do Aumento de Contraste nas Bordas de Input:**
   - *Recomendação:* Aprovar a elevação da borda dos campos de `#3d553e` (2.07:1) para `#56735a` (3.23:1) no tema escuro, garantindo conformidade com o critério 1.4.11 da WCAG (Non-text Contrast).
3. **Aprovação da Altura Padrão de 48 px para Botões:**
   - *Recomendação:* Aprovar a unificação da altura de todos os botões de ação principal, secundária e destrutiva em 48 px (com raio de 14 px), proporcionando consistência motora para uso com o polegar durante treinos.
4. **Aprovação da Trava de 16 px em Campos de Texto no Mobile:**
   - *Recomendação:* Aprovar a regra global de que nenhum `<input>` de texto ou número possua tamanho de fonte inferior a 16 px, eliminando o comportamento incômodo de zoom do iOS Safari.

---

## 11. Conferência de Git e Integridade do Repositório

### Baseline Inicial (antes da execução)
```text
?? revisao/DEVOLUTIVA-CODEX-REPAGINACAO.md
?? revisao/GEMINI-REPAGINACAO.md
?? revisao/prototipo-repaginacao/
```

### Git Status Final
```bash
git status --short
```
```text
?? revisao/DEVOLUTIVA-CODEX-REPAGINACAO.md
?? revisao/GEMINI-REFINO-VISUAL.md
?? revisao/GEMINI-REPAGINACAO.md
?? revisao/prototipo-refino-visual/
?? revisao/prototipo-repaginacao/
```

### Git Diff Final
```bash
git diff --stat
```
*(Saída totalmente vazia — 0 arquivos modificados)*

### Confirmações de Salvaguarda
- **Código em Produção (`src/`):** 100% preservado e inalterado.
- **Configurações e Dependências:** `package.json`, `package-lock.json`, `vite.config.ts` e `.env` 100% intactos. Nenhuma biblioteca externa foi instalada.
- **Protótipo de Repaginação (`revisao/prototipo-repaginacao/`):** Totalmente intocado.
- **Cards Congelados:** 100% preservados, sem modificação, sem aproximação e sem redesenho.
- **Sem Git Actions:** Nenhum commit, push, merge ou deploy foi executado.

---

**Entrega concluída e pronta para revisão do Codex.**

