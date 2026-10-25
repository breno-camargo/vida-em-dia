# Prévia por Wi-Fi — 24/10/2026

Falha reproduzida em HTTP real: `http://192.168.0.14:5181`. O navegador tinha IndexedDB, mas não `crypto.randomUUID`, `crypto.subtle` ou Web Locks. O aplicativo falhava na abertura antes de mostrar a tela visitante.

Correções somente na cópia:

- UUID v4 nativo quando disponível; alternativa com `crypto.getRandomValues` e bits RFC de versão/variante. Não usa Math.random.
- Catálogo sem Web Crypto usa IDs públicos pré-calculados pelo mesmo SHA-256, namespace e normalização originais. Carregamento separado, somente nesse ambiente. Os 488 identificadores correspondem exatamente ao algoritmo original. Regenerar `src/dados/idsCatalogoWifi.ts` com `node revisao/gerar-ids-wifi.cjs` ao alterar o catálogo.
- Abertura de visitante HTTP sem Web Locks adia somente a purga automática. Não apaga dados e não cria fallback sem proteção para sincronização, importação, limpeza ou eliminação definitiva. Essas operações continuam bloqueadas e explicam a necessidade de HTTPS.
- Backup protegido continua usando AES-GCM/PBKDF2 e exige Web Crypto; em HTTP, apresenta orientação explícita. Nenhum downgrade criptográfico.
- Erros de inicialização são registrados no console apenas em desenvolvimento, sem expor detalhes na tela.

`node revisao/conferir-wifi.cjs [origem]` passou no IP real, em perfil descartável: abertura em contexto não seguro, catálogo completo, criar/salvar ficha e persistência após reload, sem erros JavaScript. Os testes de Wi-Fi conferem UUID, equivalência dos IDs, inicialização sem Web Crypto, bloqueio de criptografia sem HTTPS e preservação dos removidos sem purga desprotegida.

Wi-Fi HTTP serve para revisar a interface e os registros locais. Não equivale à homologação HTTPS/PWA no celular. Instalação, APIs protegidas e operações que exigem Web Locks continuam dependendo de HTTPS ou localhost. Armazenamento é separado por host/porta: este endereço não compartilha registros com 127.0.0.1:5180 nem com o app original.
