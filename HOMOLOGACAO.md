# Homologação do novo visual

Esta branch integra o código atual da cópia visual sobre a base local test b9773dc. Não promove main nem executa migrações remotas.

- Build normal e testes: backend desabilitado, sem carregar arquivos .env.
- Build de homologação: `npm run build:homologacao`, permitido somente no Vercel Preview e no projeto Supabase de testes previamente configurado.
- Deploy de produção: bloqueado nesta branch. Não usar --prod.
- Variáveis públicas do cliente: reutilizadas diretamente do ambiente Preview da Vercel. Nenhuma chave ou senha deve ser copiada para o Git.
- Nome instalado: Vida Teste. Cada endereço possui armazenamento local separado; abrir a mesma URL no PC e no iPhone.

## Conferência com conta de teste

1. Entrar e reabrir o app para verificar a sessão. Não usar a conta principal.
2. Criar uma ficha fictícia no PC; conectar/sincronizar conforme as confirmações do app. Entrar na mesma conta no iPhone e conferir a ficha.
3. Alterar um registro sem internet; reconectar e sincronizar; conferir no outro dispositivo.
4. Sair e entrar com outra conta de testes: nenhum dado da primeira deve aparecer.
5. Exportar backup com dados fictícios e restaurar em perfil separado do navegador. Não substituir dados reais.
6. Conferir concluir séries, descanso, arrastar painéis, manter tela ligada e compartilhar imagem no iPhone.

Fotos não são sincronizadas automaticamente pela implementação atual; preservá-las no backup com fotos. Não usar a ausência de foto no outro aparelho como prova de falha de sincronização de registros.

O ambiente reutiliza o backend de testes existente, não um banco novo vazio. Nenhuma conta ou registro remoto foi limpo na preparação.
