# Acesso Wi-Fi do iPhone resolvido — 24/10/2026

PC 192.168.0.14; iPhone 192.168.0.10; TCP 5181. Usuário confirmou acesso após a correção.

## Evidência

- Ping do PC para o iPhone respondeu. Vite estava em 0.0.0.0:5181, HTTP local respondia 200 e a regra de permissão TCP 5181/LocalSubnet estava ativa.
- Captura PktMon de 45 segundos, limitada ao IP do iPhone e TCP 5181, mostrou SYNs recebidos e descarte em `INET: accept inspection`, sem SYN-ACK.
- Eventos WFP apontaram filtro 70799 com ação BLOCK e origem de regra `{753AEDF9-F964-45D4-B513-4324FDC67281}`. Inspeção do filtro identificou `codex_sandbox_offline_block_inbound`, `Codex Sandbox Offline - Block Non-Loopback Inbound`, condicionado ao SID do processo do servidor.

## Correção

Não houve alteração no filtro de segurança do sandbox. O processo antigo na porta 5181 foi confirmado como o Vite da pasta da cópia e encerrado. Reiniciado o mesmo comando de desenvolvimento via ferramenta com execução autorizada fora do sandbox:

`npm.cmd run dev -- --host 0.0.0.0 --port 5181 --strictPort`

Verificado que o novo processo não tinha o SID visado pelo bloqueio. Usuário confirmou que o iPhone abriu o app. A regra restrita de firewall criada anteriormente permanece; firewall ligado.

## Retomada

Servidor LAN deve iniciar pela execução autorizada fora do sandbox, sem remover proteções. Não confundir resposta local 200 com conectividade a partir de outro dispositivo. Confirmar o IP atual a cada sessão. Não reiniciar nem alterar o servidor original para resolver esta porta.

Captura encerrada e filtro temporário PktMon removido. Os arquivos de diagnóstico são locais e não foram publicados.
