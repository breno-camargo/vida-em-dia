# Catálogo inicial com IDs estáveis — 19/10/2026

iniciarBiblioteca agora calcula UUIDs determinísticos no mesmo namespace do catálogo ampliado antes da transação IndexedDB. Instalações novas geram os mesmos IDs para os 64 exercícios iniciais, evitando a origem de novas cópias por IDs aleatórios. Inicialização preserva IDs existentes, nomes já cadastrados e tombstones; não reescreve os registros antigos. Revisão de duplicatas passa a mostrar número da cópia no lugar de UUID técnico.

Regressão compara IDs de duas instalações isoladas e verifica preservação de cadastro renomeado/removido. Não houve alteração de dados reais nem execução de união. Duplicatas antigas continuam exigindo revisão; esta correção não impede cópias criadas manualmente ou importadas com IDs antigos. Sincronização em dispositivos reais permanece pendente.
