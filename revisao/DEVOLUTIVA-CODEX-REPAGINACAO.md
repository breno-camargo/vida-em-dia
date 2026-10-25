# Devolutiva do usuário e do Codex — repaginação

## Decisão e escopo

O usuário gostou do novo layout. **Preservar a direção visual; não recomeçar o design.** A integração ao aplicativo real ainda não foi aprovada.

O usuário precisa testar todos os fluxos existentes no software atual dentro do protótipo. Não basta exibir um toast dizendo que uma ação foi realizada. Usar dados fictícios e estado coerente em memória, sem serviços externos, dados reais ou implementação de backend.

Trabalhar somente em `revisao/prototipo-repaginacao/` e `revisao/GEMINI-REPAGINACAO.md`. Este arquivo é a solicitação do Codex: não sobrescrever nem remover. Não alterar src/, configurações, dependências ou lockfile. Não acessar .env, credenciais ou dados reais; não instalar dependências no projeto; não fazer commit, push, merge, deploy ou integração. Evitar buscas em pastas pessoais, clipboard ou arquivos de outros aplicativos: o código do projeto e esta devolutiva bastam.

## Problemas relatados pelo usuário

1. Não consegue adicionar exercícios às fichas/cards de treino.
2. Não consegue adicionar exercícios ao treino livre.
3. A engrenagem da ficha não abre as opções.

São relatos do usuário. Na versão examinada, a engrenagem apenas mostrava um toast e treino por ficha/livre abriam o mesmo fluxo genérico. Corrigir a navegação e a simulação dos resultados, preservando os componentes congelados.

## Cobertura funcional exigida

Antes de implementar, inventariar as ações atuais em src/ e incluir no relatório uma matriz:

**Tela/componente real → ação existente → caminho no protótipo → resultado/estado demonstrado → verificação realizada ou pendência.**

Cobrir ações principais e secundárias, confirmações, cancelamento, estados vazios, carregamento, erro e nova tentativa quando existentes. Não inventar recursos. Não anunciar cobertura completa com pendências não demonstradas.

- **Fichas:** criar, editar, adicionar/remover exercícios, séries planejadas e descanso, reordenar, duplicar, opções da engrenagem e remover/desfazer. Reabrir deve mostrar as alterações feitas na sessão do protótipo.
- **Treino por ficha e livre:** iniciar com o contexto correto; selecionar/adicionar/remover exercícios; demonstrar séries, descanso, andamento, finalização, cancelamento, histórico e compartilhamento conforme o app atual. Treino livre não pode ser uma sessão fixa de outra ficha.
- **Biblioteca:** busca/filtros sobre os dados fictícios, cadastro/edição e detalhes, fotos/notas e ações existentes. Não declarar o catálogo inteiro somente leitura quando o app permite editá-lo.
- **Demais áreas:** Hoje/atividade, cardio e seus detalhes por modalidade, medidas/complementação por data, evolução/comparações, configurações/metas/lembretes, conta, backup/importação e privacidade, conforme o código atual.
- Alterações precisam continuar coerentes ao navegar e reabrir telas. Informar que recarregar pode reiniciar dados fictícios. Não criar banco ou migrações reais.
- Simular estados de serviços/dispositivo sem Auth, sync, criptografia, exclusão remota ou envio real. A indicação de simulação não dispensa a interface de revisão/formulário que o fluxo exige.

## Cards congelados

Não redesenhar cards de exercício/série nem cards compartilháveis, adesivos, modelos Tipográfico/Foto/Editorial e renderizadores.

Para testar os controles dos cards de exercício/série, reproduzir fielmente o componente existente em cópia isolada com dados fictícios, sem import/referência a src/. Conferir campos, controles, seletores, opções, precisão, unidades e composição. Se não conseguir garantir fidelidade, manter placeholder rotulado e declarar o caminho pendente de decisão do usuário; não produzir aproximação nem afirmar cobertura integral.

Os compartilháveis continuam congelados: manter placeholder ou apresentação fiel comprovada, sem nova composição.

## Oito pendências da segunda revisão

1. **Eliminação definitiva:** exigir confirmação explícita antes de remover o item simulado. A função anteriormente filtrava a lista imediatamente.
2. **Importação:** representar JSON criptografado e JSON legível. Não inventar restauração CSV; criptografado atual também é envelope JSON, não .enc. Preservar revisão de mesclar/substituir, avisos e aceite.
3. **Medidas:** usar a data escolhida, todos os campos reais, peso com três casas e circunferências com duas. Preservar seletores por rolagem, campos em branco e confirmação antes/depois de todos os valores alterados. Não fixar 22/10/2026 nem valores salvos.
4. **Modais:** conter foco por Tab/Shift+Tab, tornar fundo inerte, restaurar foco e tratar navegação entre painéis. Esconder modais fechados não comprova contenção no modal aberto.
5. **Controles:** eliminar alturas/fontes inline divergentes para ações equivalentes. Botões de ação seguem o padrão de 48 px; nenhum alvo abaixo de 44 px. Verificar também radios, checkboxes, abas e controles de demonstração.
6. **Cadastro:** incluir confirmação de senha, conforme o app; não afirmar que o campo existe quando não está no formulário.
7. **Contraste/relatório:** borda #8faea0 sobre branco = aproximadamente 2,41:1; sobre #edf4ee = 2,15:1. Corrigir quando necessária à identificação do campo. Foco #174d15 sobre branco = 9,96:1 e sobre #bcec86 = 7,34:1. Recalcular os números, não copiar comentários incorretos.
8. **Evidências:** definir viewport imediatamente antes de cada teste. A checagem rotulada 390 px vinha depois da troca para 1280 px. Testar foco com teclado; não chamar contagem de modais ocultos de teste de Tab. Distinguir screenshot, chamada direta de função e percurso real pelos controles.

## Critério mínimo de entrega

Percorrer: criar ficha → adicionar dois exercícios → editar/reordenar → abrir engrenagem/executar opção → iniciar ficha. Depois: iniciar treino livre → adicionar exercício → demonstrar controles preservados → finalizar → conferir histórico.

Validar demais caminhos pela matriz em claro/escuro e 360/390 px/desktop, registrando dimensões e o que realmente foi verificado. Se não houver navegador, declarar a limitação. Manter os avisos de privacidade e segurança do app.

Atualizar o relatório com resposta a cada item: **corrigido / pendente / justificativa**, arquivo/linha e evidência. Listar os arquivos criados/modificados, limitações e decisões restantes. Ao concluir, parar para nova revisão do Codex.
