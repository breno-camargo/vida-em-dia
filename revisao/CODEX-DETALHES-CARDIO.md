# Detalhes por modalidade — 19/10/2026

EditorCardio oferece campos conforme modalidade. Bicicleta/ciclismo/spinning/airbike: distância, velocidade, cadência média e potência média. Natação: distância, velocidade, comprimentos nadados e tamanho da piscina. Esteira: distância, velocidade, inclinação e passos; caminhada/corrida sem inclinação; escada com passos. Outras modalidades não exibem movimento sem correspondência definida. FC média/máxima, calorias, duração, observação e vínculo continuam disponíveis para todas.

Novos campos opcionais no JSON da sessão: cadencia_rpm, potencia_watts, comprimentos_piscina e piscina_metros. Sem índice/migração ou cálculo automático de distância/calorias a partir deles. Valores antigos não são apagados ao trocar modalidade; apenas campos aplicáveis aparecem. Validação compartilhada em salvarCardio e importação de backup; exportação e transporte JSON preservam os campos. Clientes antigos podem não exibi-los.

Testes de modalidades e limites/precisão; interação visual e edição no aparelho ainda pendentes. Não alterados dados reais.
