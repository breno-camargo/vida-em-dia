# Etapa 7 — pronta para homologação

Etapas 1 a 6 aprovadas e produção v0.6.0 verificada. Etapa 7 implementada na branch etapa-7-backup-protecao e integrada em test. Produção não alterada.

```cmd
git push origin etapa-7-backup-protecao
git push origin test
npx vercel
```

Checklist:

- Configurações → preparar JSON com fotos → Baixar; guardar em Arquivos/iCloud no iPhone. Conferir data do último backup.
- Preparar JSON sem fotos e exportar uma tabela CSV. CSV abre com colunas legíveis e acentos; preparar/CSV não atualiza último backup.
- Compartilhar JSON; verificar arquivo disponível. Cancelar compartilhamento não deve atualizar último backup.
- Importar o JSON e mesclar: registros existentes não duplicam; alteração local mais recente é preservada.
- Testar substituir em um endereço/aparelho de teste sem dados importantes; guardar backup atual antes e confirmar. Conferir fichas, séries, cardio, medidas (incluindo busto), configurações e fotos restauradas.
- Importar arquivo inválido: mostrar erro sem modificar dados. Conflito de datas em mesclagem deve cancelar toda a importação.
- Configurar intervalo do lembrete; conferir aviso em Hoje após prazo sem backup/sync e acesso às Configurações.
- Offline no iPhone: preparar, baixar e importar JSON; verificar rolagem, cancelamento e botões. Compartilhamento pode depender do aplicativo de destino.

Substituir um arquivo sem fotos não restaura as imagens; a tela explica isso antes da confirmação. O navegador não garante onde o usuário salvou o download: confira o arquivo fora do app.

55 testes, TypeScript, lint e build. Próxima etapa após aprovação: 8, conta e sincronização.

