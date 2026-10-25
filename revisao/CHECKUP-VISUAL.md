# Padronização visual — 23/10/2026

Escopo: cópia `vida-em-dia-novo-visual`, porta 5180. Sem alteração funcional, banco, conta ou projeto ativo.

## Correções

- Contrato único em `src/estilos/superficies.css` para cartões, resumo das medidas, histórico, grupos de configurações e painéis: cores por tema, contorno, raio e sombra equivalentes.
- Campos e métricas internas usam um segundo nível de superfície; destaque inicial, seleção, erros e ações destrutivas mantêm distinção por função.
- Cartões de medidas simples e bilaterais compartilham fundo, borda, raio, preenchimento e tipografia. Removida a soma de margens e gap no topo de Medidas.
- Controles em `controles.css`: ações principais/secundárias e abas compartilham tokens, dimensões e estados.
- Configurações sem cartões duplicados dentro do mesmo grupo; cabeçalhos de painéis com acabamento uniforme.
- Gerador da paleta clara preserva resets de borda/fundo e sua ordem: evita transformar uma linha separadora em caixa. `paleta-clara.css` regenerada.

## Verificação

- `node revisao/conferir-padroes-visuais.cjs`: seis combinações, 360/390/430 px em claro e escuro. Compara estilos computados de sete cartões de medidas, botões Registrar/Salvar e a linha sem moldura do último treino.
- `node revisao/auditar-contraste.cjs`: 20 estados, zero falhas textuais nas amostras.
- `node revisao/homologar-novo-visual.cjs`: três larguras; treino, paginação, persistência, resumo, card e backup passaram.
- Lint e build passaram. Revisão de captura do tema claro realizada.

Limite: revisão local de componentes e fluxos amostrados; não substitui revisão visual no aparelho físico nem representa paridade funcional completa com o protótipo.
