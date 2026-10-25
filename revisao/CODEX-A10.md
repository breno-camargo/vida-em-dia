# A10 — abertura durante recuperação da sessão — 18/10/2026

App mostra marca e estado neutro “Abrindo seu espaço…” enquanto a sessão inicial é recuperada, antes de decidir entre entrada e página Hoje. Não monta apresentação de cadastro/login nem opção de visitante nesse intervalo. Visitante já escolhido continua acessando o conteúdo local sem aguardar autenticação. Falha de inicialização local permanece visível com role alert e encerra aria-busy.

Regressão estática cobre carregamento neutro, sessão recuperada, ausência de sessão após carga e visitante. Não mede frames, rede, foco ou funcionamento no Safari/PWA. Sem atraso artificial ou alteração de autenticação/armazenamento. Conferir abertura fria no iPhone; etapa 8 continua em homologação.
