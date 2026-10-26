# Testes de confiabilidade e capacidade

Atualizado em 26/10/2026. Somente dados ficticios; nenhuma carga no banco de producao.

## Estado

- Agua e alimentacao manual estao implementadas e publicadas; nao sao proximas implementacoes.
- Projeto principal: outputs/vida-em-dia. Copias e evidencias anteriores foram arquivadas fora da raiz.
- Usuario informou que ainda nao existe Supabase separado para testes.
- Testes locais usam fake-indexeddb, transporte remoto em memoria e/ou PostgreSQL embarcado nos testes existentes. Nao usam contas reais nem medem latencia da nuvem.

## Primeira rodada local

Comandos: npm run typecheck, npm run lint, npm test, npm run build.

Regressao de volume em src/sincronizacao/motor.test.ts:
- 1.000 refeicoes sinteticas com calorias, quantidade e sodio.
- Falha no segundo lote; fila preservada e retomada.
- Lotes de no maximo 100 registros; download pelo transporte paginado em 200.
- Contagem final exata, nutrientes preservados e repeticao sem novo envio.

Concluir nao equivale a homologar dois iPhones nem a estabelecer capacidade simultanea.

## Antes do teste remoto

1. Criar manualmente um projeto Supabase dedicado, identificado como teste. Nao reutilizar URL, contas, dados ou backups de producao.
2. Revisar as migracoes versionadas e configurar EXPECTED_PROJECT_REF nas funcoes do projeto correto. Aplicacao remota requer autorizacao especifica.
3. Configurar uma previa dedicada com URL e chave publica desse projeto. Manter credenciais administrativas fora do app, Git, logs e chat.
4. Confirmar no deploy o projeto de teste antes da primeira escrita. Preparar duas contas ficticias sem enviar emails em massa; SMTP de teste deve evitar destinatarios reais.
5. Definir orcamento/cotas, intervalo de execucao e responsavel por interromper o teste. Nao desligar RLS nem protecoes para obter numeros maiores.

## Homologacao funcional remota ? pendente

- Mesma conta em dois contextos/aparelhos: enviar e baixar treino, agua, medidas e alimentacao.
- Offline, reconectar, interromper e repetir sync; nenhum registro perdido ou duplicado.
- Edicoes concorrentes, conflitos por data, exclusao/desfazer e restauracao de backup.
- A/B/visitante: conta A nao le nem altera registros de B; testar acesso direto pelas politicas RLS.
- Fechar/reabrir, trocar conta e conferir filas por identidade.
- Usar apenas identidades ficticias criadas para esta rodada. Limpeza apenas dos IDs registrados no manifesto do teste.

## Carga remota ? preparada em roteiro, ainda nao executada

Usar o protocolo real: RPC vida_em_dia_enviar para envio e leitura por ID com limite 200, sob JWT proprio de cada usuario. Nao usar service_role para simular usuarios nem interpretar conexoes Realtime como numero de pessoas.

Progressao proposta: 1 usuario de controle, depois 10, 25, 50 e 100 usuarios virtuais. Validar cada patamar antes de subir; incluir tempo de espera entre ciclos, e um cenario separado de reconexao simultanea. Comecar com historico pequeno; repetir com 1.000 registros por conta apenas apos validar custo/armazenamento. Login nao deve ocorrer a cada requisicao. Auth/SMTP tem limites independentes.

Coletar: quantidade e tamanho de requisicoes, p50/p95/p99 por operacao, erros HTTP/429/5xx, ciclos de sync completos por minuto, fila restante, contagens antes/depois, CPU/memoria/conexoes/banco/transferencia disponiveis no painel. Guardar logs sem JWTs, senhas ou dados pessoais.

Criterios propostos, a aprovar antes da execucao: zero vazamento/perda/duplicacao; interromper imediatamente em erro de isolamento; parar patamar em erros acima de 1%, 429 recorrentes, fila que nao drena ou pressao de recursos/custo. Tempos aceitaveis dependem do tamanho do historico; definir metas antes de medir, sem escolher depois para aprovar.

Relatorio final: ambiente e plano contratados, data, versao, cenario, duracao, usuarios simultaneos, requisicoes e tamanho dos dados, latencias/erros, custo e gargalo. Publicar somente a capacidade demonstrada naquele cenario. Nao extrapolar para usuarios mensais ou simultaneos diferentes.

## Proximo passo

Criar o projeto separado pelo painel do Supabase e informar somente sua URL publica. Depois preparar o executor e as contas sinteticas nesse ambiente. Nao executar carga contra a producao enquanto isso.

## Resultado da rodada de 26/10/2026

323 testes em 56 arquivos passaram, incluindo o novo cenario de 1.000 refeicoes. Typecheck, lint e build aprovados. Nenhuma requisicao de carga enviada ao Supabase, nenhuma conta remota criada e nenhum dado real alterado. Isto estabelece regressao funcional local, nao limite de usuarios.
