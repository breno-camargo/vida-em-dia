import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { tabela } from '../dados/banco'
import { configurarAgua } from '../dados/agua'
import { SelecionarNumero } from './SelecionarNumero'
export function ConfigurarAgua() {
  const config = useLiveQuery(() => tabela('configuracoes').where('chave').equals('principal').first())
  const [campo, definirCampo] = useState<'garrafa_ml' | 'meta_agua_ml'>()
  if (!config) return null
  return <section className="painel configurar-agua"><h2>Minha garrafa e água</h2><button className="data-medida" onClick={() => definirCampo('garrafa_ml')}><span>Capacidade da garrafa</span><strong>{config.garrafa_ml ? `${config.garrafa_ml} ml` : 'Configurar'}</strong></button><button className="data-medida" onClick={() => definirCampo('meta_agua_ml')}><span>Meta diária</span><strong>{config.meta_agua_ml} ml</strong></button><p>A capacidade nova vale para as próximas garrafas. O volume já registrado fica preservado.</p>{campo && <SelecionarNumero titulo={campo === 'garrafa_ml' ? 'Minha garrafa' : 'Meta de água'} unidade="ml" valor={config[campo] ?? 500} minimo={50} maximo={campo === 'garrafa_ml' ? 5000 : 20000} permitirDigitar fechar={() => definirCampo(undefined)} confirmar={async valor => { if (valor !== undefined) await configurarAgua(campo, valor) }} />}</section>
}
