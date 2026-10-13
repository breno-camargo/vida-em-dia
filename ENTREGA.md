# Etapa 5 — pronta para homologação

Etapas 1 a 4 aprovadas e produção verificada em v0.4.0. Etapa 5 implementada na branch etapa-5-medidas-peso e integrada em test. Aguarda validação no iPhone e aprovação do usuário antes de atualizar main e criar v0.5.0.

Para publicar a prévia no terminal autenticado:

```cmd
git push origin etapa-5-medidas-peso
git push origin test
npx vercel
```

Checklist:

- Registrar apenas peso, salvar e reabrir; conferir persistência e ausência de zeros nos demais campos.
- Registrar apenas uma medida em outra data; editar e remover um valor opcional.
- Seletores de peso, medidas e data: confirmar salva no rascunho; fechar sem confirmar mantém anterior. Fechar formulário sem Salvar não cria registro.
- Não permitir formulário vazio, data futura/impossível ou duplicidade na mesma data; editar o registro já existente.
- Histórico: abrir/recolher, editar, excluir e desfazer.
- Comparar duas datas: conferir antes/depois e diferenças; campo ausente vira traço, não zero.
- Resumo com peso próprio e todas as medidas na grade, cada uma com último valor e data. Abrir o gráfico recolhido, selecionar qualquer medida por rolagem e conferir valores por sessão.
- Configurar lembrete para hoje; sem registro nesta semana, Hoje mostra Registrar agora. Cadastrar peso ou medida nesta semana remove o aviso.
- Finalizar um novo treino com peso cadastrado e conferir estimativa de calorias. Treinos antigos preservam estimativas já registradas.
- Offline no iPhone: registrar, editar, consultar e comparar; testar rolagem, alça e botões.

Fora desta etapa: fotos (11), meta de peso e IMC (12). Produção não alterada.
`typecheck`, lint, 34 testes e build passaram. A validação visual e dos gestos no iPhone está pendente de homologação pelo usuário.

