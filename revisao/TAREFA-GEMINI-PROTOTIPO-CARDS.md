# Gemini — protótipo visual de cards e adesivos

Data: 18/10/2026. Status: tarefa preparada para encaminhamento manual; não iniciada nem entregue.

## Objetivo

Criar um protótipo bonito para stories que o usuário e Codex possam avaliar antes da integração. A implementação atual não atingiu a qualidade visual da referência aprovada. Não fazer mais ajustes incrementais no app nesta rodada.

Leia AGENTS.md, README.md, CONTINUAR-AMANHA.md, revisao/PLANO.md e PADROES-INTERFACE.md. A instrução histórica de GEMINI.md referente à primeira auditoria não descreve esta tarefa: aqui o escopo autorizado é somente o protótipo isolado abaixo.

## Referência aprovada

Imagem local: `revisao/prototipo-cards/referencia-aprovada.png`. É uma prancha conceitual, com fotos e dados ilustrativos, não captura do app. Abrir a imagem antes de desenhar.

Três direções da mesma família visual:

1. Tipográfico: adesivo transparente, marca pequena, rótulos discretos, números fortes, unidades menores. A foto serve de fundo apenas para demonstrar; não faz parte do adesivo exportado.
2. Foto: imagem inteira dominante, degradê sutil no rodapé, resultado principal forte e apoio bem composto. Sem foto, oferecer Editorial em vez de uma área verde vazia.
3. Editorial: marfim, tinta verde quase preta, tipografia expressiva e margens cuidadas. Reproduzir a hierarquia e as proporções da referência, sem simplesmente ampliar um relógio até preencher a página.

Não copiar marca Strava. Não produzir dashboard com caixas de métricas. A peça deve ficar bonita para postar, inclusive com poucos dados. As fotos da prancha não são fotos do usuário nem devem aparecer como resultado real dele.

## Decisões obrigatórias do usuário

- Musculação: tempo é o destaque, inclusive em sessões curtas. Duração exata MM:SS: 00:51, 00:59, 48:37. Não usar Menos de 1 min, não arredondar, não trocar automaticamente por repetições.
- Cardio: distância disponível é o destaque; sem distância, tempo. Não inventar rota, elevação, calorias ou outros números.
- Repetições, volume, séries e exercícios ficam como apoio. Rótulo Repetições, com Peso corporal como contexto discreto quando necessário. Volume deve ser identificado como Volume total (carga × repetições); não mostrar 0 kg como resultado de peso corporal/carga ausente.
- Dados extras precisam caber com respiro. Não sobrepor o descendente do 4 à legenda, nem comprimir calorias junto às séries. Medir largura e altura real da fonte.
- Fundo transparente verdadeiro no PNG de adesivo, com texto claro/escuro. Prévia sobre foto e alternativa para baixar; não prometer compatibilidade de colagem no Instagram sem testar no iPhone.

## Entrega delimitada

Escrever somente em `revisao/prototipo-cards/` e no relatório `revisao/GEMINI-PROTOTIPO-CARDS.md`. Preservar a imagem de referência. Não alterar src/, banco, sincronização, dependências, package.json, configurações ou outros relatórios.

Criar `revisao/prototipo-cards/index.html`, com CSS/JS locais ou embutidos, aberto diretamente no navegador sem build, instalação ou internet. Pode ter arquivos auxiliares nesse diretório. Não importar o app, acessar IndexedDB, contas ou dados reais. Não usar fontes/CDNs remotos obrigatórios. Fontes locais/system devem ter fallback bem escolhido.

Mostrar as três direções lado a lado, com opção de ampliar cada story em proporção 9:16, alternar cenários e adicionar foto local para prévia. Foto somente em memória, sem upload. Para adesivo, fornecer exportação PNG transparente usando a mesma composição visível; se algo não estiver implementado, declarar a limitação, sem fingir uma exportação funcional. Evitar duas implementações visuais divergentes entre prévia e exportação.

Os controles de demonstração devem ficar fora das peças. Dentro da arte, só conteúdo que será postado. Incluir uma composição recomendada, não dezenas de pequenas variações.

## Cenários sintéticos para comparação

| Cenário | Tempo | Dados de apoio |
| --- | --- | --- |
| Sessão curta corporal | 00:51 | 42 repetições, 3 séries, 1 exercício; opção de 5 kcal estimadas; sem volume em kg |
| Musculação completa | 48:37 | Volume total 4.250 kg, 6 exercícios, 18 séries |
| Cardio | 44:47 | Distância 6,07 km, ritmo derivado da duração/distância, 609 kcal informadas, 6.728 passos |
| Poucos dados | 12:09 | 1 exercício e 2 séries, sem calorias nem volume informado |

Use a data 16/10/2026 e nomes curtos/longos de exemplo. Deixar claro na página que são dados de demonstração. Exercitar opção de métricas extras sem apertar o layout. Nunca descartar sessões curtas ou editar seus dados para melhorar a aparência.

## Verificação e relatório

Abrir a página e conferir as três composições com sessão curta e musculação completa. Conferir também todos os cenários, fotos claras/escuras e os arquivos PNG exportados. Se houver acesso a captura, salvar prévias reais no mesmo diretório e indicar como foram produzidas; não apresentar uma imagem gerada como screenshot do protótipo. Sem navegador, registrar a impossibilidade e não declarar inspeção visual concluída.

No relatório: arquivos criados, como abrir, escolhas de composição/tipografia, cenários verificados, exportação/transparência verificadas ou não, limitações e proposta recomendada. Testes automáticos não substituem avaliação visual. Não modificar o app para demonstrar o protótipo.

Parar após a entrega do protótipo. Codex revisará, o usuário aprovará o visual e só depois haverá integração. Sem commit/push/merge/deploy/publicação ou SQL remoto.
