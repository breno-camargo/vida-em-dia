# APP-04 — backup criptografado

Implementado na branch test em 21/10/2026, sem dependências novas, merge ou push.

- Padrão: JSON com envelope criptografado. AES-256-GCM, tag de 128 bits, PBKDF2-SHA256/600.000 iterações, salt de 16 bytes e IV de 12 bytes novos via getRandomValues. Chave não exportável. AAD canônico inclui formato, versão, algoritmo, nome/hash/iterações do KDF, salt e IV. Importação aceita somente 600.000–1.000.000 iterações e comprimentos exatos, validados antes da derivação.
- Senha digitada duas vezes, mínimo 12 caracteres, campos password/new-password. Permanece apenas no estado transitório da interface e é limpa após gerar o arquivo. Nunca persistida ou registrada. Sem senha não há recuperação.
- JSON legível e CSV continuam disponíveis com avisos de exposição de dados pessoais e de saúde. JSON antigo continua importável. O envelope criptografado também usa extensão .json; o conteúdo determina o fluxo.
- Backup padrão filtra apagado_em na consulta. Opção explícita inclui removidos. Dependentes com referências ausentes são omitidos transitivamente no padrão, inclusive fotos; nenhum pai removido é reativado para completar o arquivo.
- Mescla mantém a regra de atualizado_em mais recente. Substituição preserva tombstones locais mais recentes ou empatados com o registro recebido, inclusive tombstones ausentes do arquivo. Assim restaurar backup anterior à remoção não desfaz a exclusão. A importação mantém proprietário forçado para a identidade atual, sem incluir fila ou outras identidades.
- Limite de 250 × 1.048.576 bytes tanto no arquivo selecionado como no conteúdo decifrado antes de JSON.parse. UTF-8 é contado sem outra cópia integral só para medir. Como o envelope usa Base64, um conteúdo claro próximo de 250 MB não cabe em um arquivo criptografado de 250 MB e será recusado. Não há compressão ou processamento por streaming.
- Erros distintos: “Formato ou versão não reconhecidos.” e “Senha incorreta ou arquivo alterado.”; o segundo não distingue falha de senha de adulteração autenticada.

## Verificação

Ordem final: npm.cmd run typecheck → npm.cmd run lint → npm.cmd test -- --silent=false → npm.cmd run build. Todos passaram; 237 testes em 37 arquivos.

Suíte nova usa WebCrypto real do Node e Dexie/fake-indexeddb: ida/volta, salt/IV distintos, compatibilidade legível, proprietário forçado, senha errada, alteração de byte no corpo/salt/IV e alteração de iterações dentro do intervalo autenticado, versão desconhecida, limites do cabeçalho, confirmação/mínimo da senha, removidos/dependentes e restauração após remoção nos dois modos. Texto inválido maior que 250 MB falha pelo tamanho antes do parser.

Ensaio sintético grande final (Node, processo de testes): 33.554.448 bytes claros; arquivo de 44.739.493 bytes; 1.455 ms; RSS inicial 96.747.520, final 496.005.120, máximo do processo 552.517.632 bytes (aprox. 527 MiB). Pico inclui runtime e demais testes do worker; não é medição isolada de memória da função. A primeira execução revelou estouro de pilha no regex Base64 repetitivo; substituído por validação sem recursão e decodificação em blocos. Dois testes antigos passaram a solicitar explicitamente removidos.

Limitação: WebCrypto processa o arquivo inteiro em memória; o teto de tamanho não garante memória disponível em celulares. Interface e consumo no navegador/iPhone real não foram homologados nesta execução. Nenhum banco real foi alterado para testes.
