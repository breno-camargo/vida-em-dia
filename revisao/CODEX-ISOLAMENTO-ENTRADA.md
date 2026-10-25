# Proteção ao entrar com outra conta — 19/10/2026

Confirmado por código: App abria Hoje e telas locais para qualquer usuário autenticado, mesmo sem vínculo validado. Como IndexedDB é compartilhado por origem/perfil, outra conta via as fichas locais. A proteção de vincular já rejeita vínculo/proprietário diferente, mas faltava impedir leitura na interface.

App agora restringe usuário autenticado sem vínculo à tela de validação e saída, sem montar páginas de dados. Evento de troca de usuário encerra o vínculo visual e mostra carregamento antes da resolução assíncrona. Nenhum registro foi apagado, transferido ou enviado.

Limitação: não implementa múltiplos bancos por usuário. Modo visitante segue sendo acesso local do aparelho, não um perfil privado separado. Para esposa usar agora, empregar outro perfil de navegador/aparelho. Dados anteriormente mesclados remotamente não são identificados nem removidos automaticamente. Teste estático de seleção da tela passou; troca real entre contas, abas e aparelhos ainda exige homologação. Esta proteção de UI não substitui RLS no servidor.
