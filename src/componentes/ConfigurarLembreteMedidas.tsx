import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { tabela } from '../dados/banco'
import { EscolherOpcao } from './EscolherOpcao'
const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
export function ConfigurarLembreteMedidas() {
  const config = useLiveQuery(() => tabela('configuracoes').where('chave').equals('principal').first())
  const [aberto, definirAberto] = useState(false)
  if (!config) return null
  return <section className="painel configurar-medidas"><h2>Lembrete de medidas</h2><button className="data-medida" onClick={() => definirAberto(true)}><span>Dia da semana</span><strong>{dias[config.dia_lembrete_medidas]}</strong></button><p>Aparece na tela Hoje a partir desse dia, se não houver registro na semana (segunda a domingo). O aviso fica dentro do app.</p>{aberto && <EscolherOpcao titulo="Dia do lembrete" opcoes={dias} inicial={config.dia_lembrete_medidas} fechar={() => definirAberto(false)} confirmar={async indice => { await tabela('configuracoes').update(config.id, { dia_lembrete_medidas: indice, atualizado_em: new Date().toISOString() }) }} />}</section>
}
