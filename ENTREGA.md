# Entrega da ETAPA 3 aprovada

O usuário validou o funcionamento no iPhone e aprovou a conclusão em 06/10/2026. Versão v0.3.0 preparada para produção.

Inclui treino por ficha e livre, recuperação offline do andamento, tipos de séries, carga total/por lado, seletores por rolagem, aplicação às próximas pendentes, descanso central com ±15 s e bipes nos últimos 10 segundos, avanço entre exercícios, confirmação ao trocar de sessão e conclusão com ações fixas. Biblioteca agrupada por músculos, Glúteos e Panturrilhas separados por migração que preserva os vínculos existentes. Calorias automáticas pelo peso registrado; cadastro de medidas chega na etapa 5. Cardio chega na etapa 6.

## Publicar a versão aprovada

No terminal autenticado do usuário, dentro do projeto:

```bat
git push origin main test etapa-3-modo-treino
git push origin v0.3.0
git switch main
npx vercel --prod
git switch test
```

Se o push de main já gerar uma implantação de produção bem-sucedida, a implantação manual é dispensável. Endereço definitivo: https://vida-em-dia-sable.vercel.app/

## Próxima etapa

Etapa 4: histórico, recordes, progressão, gráficos e card compartilhável com foto opcional e dados reais. Sua implementação aguarda solicitação do usuário.
